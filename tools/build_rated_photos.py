"""Rated Case photos: product photos for the "See photos" viewer in the editor (assets/rated-gallery.js).

Reads the saved vendor listing photos (outside the repo, never modified) and writes
  assets/cases/rated-photos/rp-<key>-<rim>-<view>.webp      1000 x 1200, the viewer's large image
  assets/cases/rated-photos/rp-<key>-<rim>-<view>-hd.webp   1600 x 1920, the same photo for tablets and high density
                                                            desktops, where the viewer would draw the large image
                                                            more than 15% bigger than its pixels (rated-gallery.js)
  assets/cases/rated-photos/rp-<key>-<rim>-<view>-t.webp    200 x 240, its thumbnail
  assets/cases/rated-photos/manifest.json                   what the viewer reads
  docs/RATED-CASE-PHOTOS.md                                 source file -> output file, exclusions
Served names never carry the vendor or brand name. A photo whose WebP would pass its size cap (a grainy wallpaper)
is encoded again a few quality steps lower, so no file is far heavier than the rest. Every photo is trimmed the same way: per listing, one 5:6 frame
(the editor preview's 2500 x 3000 aspect) sized to the tallest view, so the case fills the frame and keeps one scale
across that listing's views, on the photos' own pure white background.

The phones and rims come from customizer.html (KP-RATED-KITS: RATED and RATED_ONLY without COMING_SOON, CLEAR_FROST_ONLY
and SMOKE_FROST_ONLY), so a phone that gains a Rated kit there without photos here fails --check.

usage: python3 tools/build_rated_photos.py [--src DIR]   build (default DIR: ../vendor-photos/cck-phantom3 beside the repo)
       python3 tools/build_rated_photos.py --check       verify the manifest, files and phone list (no vendor photos needed)
"""
from pathlib import Path
import argparse, io, json, re, sys

R = Path(__file__).resolve().parent.parent
OUT = R / 'assets/cases/rated-photos'
DOC = R / 'docs/RATED-CASE-PHOTOS.md'
VERSION = 'rated-photos-4'
W, H, TW, TH = 1000, 1200, 200, 240
HW, HH = 1600, 1920
# (start quality, lowest quality, size cap in bytes) per kind of output
QUALITY = {'large': (84, 72, 90000), 'hd': (80, 68, 180000), 'thumb': (74, 74, None)}
RIM_NAMES = {'smoke': 'Smoke Frost', 'clear': 'Clear Frost'}
# listing shot number -> view; the back is shot 12 (back with buttons), or the plain back (2) when 12 is missing
VIEWS = [('angle', [1], 'Front and back'), ('side', [3], 'Side view'), ('side2', [4], 'Other side'),
         ('back', [12, 2], 'Back'), ('front', [5], 'Front')]
VIEW_ALT = {'angle': 'front and back', 'side': 'side view', 'side2': 'side view from the other side', 'back': 'back', 'front': 'front'}
# one listing with photos of two phones: photo key -> (listing, what is added to its shot numbers)
SECOND_PHONE = {'googpl10p10': ('googpl10', 100), 'googpl11p11': ('googpl11', 100)}
# never shipped, with the reason (docs/RATED-CASE-PHOTOS.md lists them)
EXCLUDE = {
    'cckp3-samgs24-media-smoke-frost-2.jpg': 'an app icon logo is printed on the back (the only Smoke Frost photo of this listing)',
    'cckp3-samgs24u-media-smoke-frost-2.jpg': 'an app icon logo is printed on the back; the phone is listed as coming soon',
    'cckp3-iph18fld-media-smoke-frost-1.jpg': 'the lock screen shows a large clock (text)',
    'cckp3-iph18fld-media-smoke-frost-5.jpg': 'the lock screen shows a large clock (text)',
}
# the vendor name is embossed along one long edge of these blanks and can be read, at full size, in the two photos that
# show that edge (first found in review, Nov 21 2026; the rest found the same way, Nov 23). Their side, back and front stay.
EMBOSSED = [('samgs26', 'smoke clear', 0), ('samgs26u', 'smoke clear', 0), ('samgs25fe', 'clear', 0), ('samga37', 'clear', 0), ('samga17', 'clear', 0),
            ('googpl10', 'clear', 0), ('googpl10', 'clear', 100), ('googpl10pxl', 'clear', 0),
            ('motgstl26', 'smoke clear', 0), ('motgpwr25', 'smoke clear', 0), ('motgply25', 'smoke clear', 0)]
for _key, _rims, _add in EMBOSSED:
    for _rim in _rims.split():
        for _shot, _edge in ((1, 'left'), (4, 'right')):
            EXCLUDE['cckp3-%s-media-%s-frost-%d.jpg' % (_key, _rim, _shot + _add)] = 'the %s rim shows the vendor name embossed in the rim' % _edge
EXCLUDE_NOTES = [
    ('every listing: shot 2', 'near duplicate of shot 12 (straight back); used only when shot 12 is missing (iPhone 11, 12, Duo, S24 FE, and 102 for Pixel 10 and 11)'),
    ('cckp3-iphse25-media-*-frost-{21 to 25, 101 and up}.jpg', 'the same blank on other phones and colors (16e black 21 to 25, iPhone 15 1xx, 14 2xx, 13 3xx, 17e 4xx); not used: '
     'the 17e has the same camera as the 16e in shots 1 to 12, and the iPhone 13, 14 and 15 are shown on the 16e with the similar iPhone note'),
]
# text printed around the flash of the moto phones (megapixels, a sensor brand) is taken off our copies of the back and side
# photos, the way tools/build_rated_cases.py does for the previews: (shot) -> centre x, y, inner and outer radius, and how
# much narrower the ring is than tall (the side view is at an angle). The saved photos are never changed.
LENS_TEXT = {
    'motgply25': {12: (1437, 535, 38, 74, 1), 3: (1478, 523, 38, 74, .85)},
    'motgpwr25': {12: (1429, 561, 39, 68, 1), 3: (1481, 547, 39, 68, .85)},
    'motgstl26': {12: (1465, 612, 39, 81, 1), 3: (1505, 602, 39, 81, .85)},
}
# these listings keep the frame of all their photos, shipped or not (their front photos first shipped under On other phones)
FRAME_ALL = set(LENS_TEXT)
# an offered rim with no photo we can show: the viewer shows the other rim's photos, captioned with that rim, and says so
NO_PHOTOS = {('samgs24', 'smoke'): 'the only Smoke Frost photo carries an app icon, so the viewer shows the Clear Frost photos and says so'}
# the phone (or phones: the camera must match) in each listing's photos, so the viewer can say when a phone is shown on a
# similar model
PHOTOGRAPHED = {
    'iphse25': ('iPhone 16e', 'iPhone 17e'), 'iph14pro': 'iPhone 14 Pro', 'iph14promax': 'iPhone 14 Pro Max', 'iph15pro': 'iPhone 15 Pro',
    'iph15pmx': 'iPhone 15 Pro Max', 'iph16': 'iPhone 16', 'iph16pro': 'iPhone 16 Pro', 'iph16pmx': 'iPhone 16 Pro Max',
    'iph17': 'iPhone 17', 'iph17a': 'iPhone Air', 'iph17pro': 'iPhone 17 Pro', 'iph17pmx': 'iPhone 17 Pro Max',
    'iph14max': 'iPhone 15 Plus', 'samgs26': 'Samsung Galaxy S26', 'samgs26u': 'Samsung Galaxy S26 Ultra',
    'iph2161p': 'iPhone 13 Pro', 'iph2167': 'iPhone 13 Pro Max', 'iph16plus': 'iPhone 16 Plus', 'iph1261': 'iPhone 12', 'iph61': 'iPhone 11', 'iph18fld': 'iPhone Duo',
    'samgs26pl': 'Samsung Galaxy S26 Plus', 'samgs26fe': 'Samsung Galaxy S26 FE', 'samgs25u': 'Samsung Galaxy S25 Ultra', 'samgs24': 'Samsung Galaxy S25',
    'samgs25fe': 'Samsung Galaxy S25 FE', 'samgs24fe': 'Samsung Galaxy S24 FE', 'samga37': 'Samsung Galaxy A37', 'samga17': 'Samsung Galaxy A17',
    'googpl11pxl': 'Google Pixel 11 Pro XL', 'googpl11': 'Google Pixel 11 Pro', 'googpl11p11': 'Google Pixel 11',
    'googpl10pxl': 'Google Pixel 10 Pro XL', 'googpl10': 'Google Pixel 10 Pro', 'googpl10p10': 'Google Pixel 10',
    'motgstl26': 'Motorola moto g stylus 2026', 'motgpwr25': 'Motorola moto g power 2026', 'motgply25': 'Motorola moto g play 2026',
}
# "On other phones": one photo per phone color or brand, both rims. (key, rim, shot, caption phone, alt description)
# Captions name the phones the listing fits; alt text names what the photo shows, with the color when it is obvious.
OTHER = [
    ('iph14max', 'clear', 1, 'iPhone 14 Plus and 15 Plus', 'a yellow iPhone 15 Plus'),
    ('googpl11pxl', 'clear', 1, 'Pixel 11 Pro XL', 'a Pixel 11 Pro XL with a rose screen'),
    ('iph17', 'smoke', 1, 'iPhone 17', 'a white iPhone 17'),
    ('samgs24', 'clear', 1, 'Galaxy S24 and S25', 'a pink Galaxy S25'),
    ('motgstl26', 'smoke', 3, 'moto g stylus 2025 and 2026', 'a purple moto g stylus'),
    ('samgs26fe', 'clear', 1, 'Galaxy S26 FE', 'a mint Galaxy S26 FE'),
    ('iph2161p', 'smoke', 1, 'iPhone 13 Pro', 'an iPhone 13 Pro with a green screen'),
    ('googpl10p10', 'clear', 5, 'Pixel 10', 'a Pixel 10 with a blue and green screen'),
    ('samgs25u', 'smoke', 1, 'Galaxy S25 Ultra', 'a Galaxy S25 Ultra with a bronze screen'),
    ('samga17', 'clear', 5, 'Galaxy A17', 'a Galaxy A17 with a blue screen'),
    ('iph18fld', 'smoke', 3, 'iPhone Duo', 'a white iPhone Duo'),
    ('samga37', 'clear', 5, 'Galaxy A36 and A37', 'a Galaxy A37 with a pink and lavender screen'),
    ('iph1261', 'clear', 1, 'iPhone 12 and 12 Pro', 'a white iPhone 12 with an orange screen'),
    ('googpl11p11', 'clear', 1, 'Pixel 11', 'a Pixel 11 with a violet screen'),
]
SHOT_VIEW = {1: 'angle', 3: 'side', 4: 'side2', 12: 'back', 2: 'back', 5: 'front'}
BRAND = re.compile(r'cck|custom case kiosk|nimbus|phantom|balaji', re.I)
DASH = re.compile('[\u2010-\u2015\u2212-]')


def site_kits():
    """customizer.html KP-RATED-KITS: model -> site key (phones listed as coming soon have no kit), site key -> offered rims."""
    src = (R / 'customizer.html').read_text()
    block = src[src.index('KP-RATED-KITS'):]
    flat = lambda name: json.loads(re.search(r"var %s=(\{.*?\});" % name, block, re.S).group(1).replace("'", '"'))
    soon, clear_only, smoke_only = flat('COMING_SOON'), flat('CLEAR_FROST_ONLY'), flat('SMOKE_FROST_ONLY')
    rated = {m: k for m, k in {**flat('RATED'), **flat('RATED_ONLY')}.items() if m not in soon}
    return rated, {k: ['clear'] if k in clear_only else ['smoke'] if k in smoke_only else ['smoke', 'clear'] for k in rated.values()}


def photo_key(site_key):
    """iphse25-i13 and iphse25-i14 (iPhone 13 and 14) use the iphse25 photos, iph14max-i15m (iPhone 15 Plus) iph14max and
    samgs26pl-s25p (S25 Plus, S24 Plus) samgs26pl; googpl10-p10 and googpl11-p11 (Pixel 10, Pixel 11) have photos of their own."""
    joined = site_key.replace('-', '')
    return joined if joined in SECOND_PHONE else site_key.split('-')[0]


def plan():
    rated, kit_rims = site_kits()
    models, rims = {}, {}
    for model, site_key in rated.items():
        key = photo_key(site_key)
        offered = kit_rims[site_key]
        rims.setdefault(key, [])
        for r in offered:
            if r not in rims[key]:
                rims[key].append(r)
        models[model] = {'key': key, 'rims': [RIM_NAMES[r] for r in offered],
                         'similar': model not in photographed(key)}
    for key in rims:
        rims[key].sort(key=['smoke', 'clear'].index)
    return models, rims


def photographed(key):
    p = PHOTOGRAPHED[key]
    return p if isinstance(p, tuple) else (p,)


def src_name(key, rim, shot):
    listing, add = SECOND_PHONE.get(key, (key, 0))
    return 'cckp3-%s-media-%s-frost-%d.jpg' % (listing, rim, shot + add)


def out_name(key, rim, view, thumb=False):
    return 'rp-%s-%s-%s%s.webp' % (key, rim, view, '-t' if thumb else '')


def without_lens_text(im, cx, cy, r0, r1, kx):
    """The photo without the thin light letters around the phone's flash: a grey opening inside the ring (the ring's own
    shading and the flash stay), as remove_lens_text in tools/build_rated_cases.py."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage as ndi
    rgb = np.asarray(im).copy()
    pad = 24
    sl = np.s_[cy - r1 - pad:cy + r1 + pad, cx - r1 - pad:cx + r1 + pad]
    y, x = np.mgrid[sl]
    d, part = np.hypot((x - cx) / kx, y - cy), rgb[sl].astype(np.float32)
    ring = np.median(part[(d >= r0) & (d <= r1)], axis=0)
    work = np.where(((d >= r0 - 4) & (d <= r1 + 4))[..., None], part, ring)
    fy, fx = np.mgrid[-9:10, -9:10]
    for c in range(3):
        work[..., c] = ndi.gaussian_filter(ndi.grey_opening(work[..., c], footprint=fx * fx + fy * fy <= 81), 2)
    w = np.clip((d - r0) / 4 + .5, 0, 1) * np.clip((r1 - d) / 4 + .5, 0, 1)
    rgb[sl] = np.round(part * (1 - w[..., None]) + np.minimum(work, part) * w[..., None]).astype(np.uint8)
    return Image.fromarray(rgb)


def build(src):
    from PIL import Image
    models, rims = plan()
    OUT.mkdir(parents=True, exist_ok=True)
    cache, boxes = {}, {}

    def load(name):
        if name not in cache:
            cache.clear()  # one listing at a time keeps memory low
        if name not in cache:
            im = Image.open(src / name).convert('RGB')
            m = re.match(r'cckp3-(\w+)-media-\w+-frost-(\d+)\.jpg', name)
            text = LENS_TEXT.get(m[1], {}).get(int(m[2]))
            cache[name] = without_lens_text(im, *text) if text else im
        return cache[name]

    def bbox(name):
        if name not in boxes:
            g = load(name).convert('L').point(lambda v: 255 if v < 246 else 0)
            boxes[name] = g.getbbox()
        return boxes[name]

    def listing(key, rim, shots):
        if key in FRAME_ALL:
            shots = [1, 3, 4, 12, 2, 5]
        names = [src_name(key, rim, s) for s in shots if (src / src_name(key, rim, s)).exists()]
        names = [n for n in names if key in FRAME_ALL or n not in EXCLUDE]
        bbs = [bbox(n) for n in names]
        top, bottom = min(b[1] for b in bbs), max(b[3] for b in bbs)
        widest = max(b[2] - b[0] for b in bbs)
        fh = max((bottom - top) * 1.07, widest * 1.07 * H / W)
        return {'top': top, 'bottom': bottom, 'fh': fh, 'fw': fh * W / H}

    def save(im, dest, kind):
        q, low, cap = QUALITY[kind]
        while True:
            buf = io.BytesIO()
            im.save(buf, 'WEBP', quality=q, method=6)
            if cap is None or buf.tell() <= cap or q - 4 < low:
                (OUT / dest).write_bytes(buf.getvalue())
                return q
            q -= 4

    def render(name, frame, dest):
        im, b = load(name), bbox(name)
        cx, cy = (b[0] + b[2]) / 2, (frame['top'] + frame['bottom']) / 2
        x0, y0 = round(cx - frame['fw'] / 2), round(cy - frame['fh'] / 2)
        fw, fh = round(frame['fw']), round(frame['fh'])
        canvas = Image.new('RGB', (fw, fh), (255, 255, 255))
        sx0, sy0 = max(0, x0), max(0, y0)
        canvas.paste(im.crop((sx0, sy0, min(im.width, x0 + fw), min(im.height, y0 + fh))), (sx0 - x0, sy0 - y0))
        hd = canvas.resize((HW, HH), Image.LANCZOS)
        big = canvas.resize((W, H), Image.LANCZOS)
        qualities[dest] = (save(big, dest, 'large'), save(hd, dest.replace('.webp', '-hd.webp'), 'hd'))
        save(big.resize((TW, TH), Image.LANCZOS), dest.replace('.webp', '-t.webp'), 'thumb')

    rows, sets, done, qualities = [], {}, {}, {}
    for key in sorted(rims):
        sets[key] = {}
        for rim in rims[key]:
            chosen = []
            for view, shots, label in VIEWS:
                shot = next((s for s in shots if (src / src_name(key, rim, s)).exists() and src_name(key, rim, s) not in EXCLUDE), None)
                if shot is not None:
                    chosen.append((view, shot, label))
            if not chosen:
                assert (key, rim) in NO_PHOTOS, (key, rim)
                continue
            frame = listing(key, rim, [s for _, s, _ in chosen])
            items = []
            for view, shot, label in chosen:
                dest = out_name(key, rim, view)
                render(src_name(key, rim, shot), frame, dest)
                done[(key, rim, shot)] = dest
                rows.append((src_name(key, rim, shot), dest))
                items.append({'file': dest, 'hd': dest.replace('.webp', '-hd.webp'), 'thumb': out_name(key, rim, view, True), 'w': W, 'h': H, 'view': view,
                              'caption': label + ' · ' + RIM_NAMES[rim],
                              'alt': 'Rated Case with a %s rim, %s' % (RIM_NAMES[rim], VIEW_ALT[view])})
            sets[key][RIM_NAMES[rim]] = items
    other = []
    for key, rim, shot, phone, desc in OTHER:
        name = src_name(key, rim, shot)
        assert name not in EXCLUDE, name
        dest = done[(key, rim, shot)]  # every phone here has its own photos under Your phone
        view = SHOT_VIEW[shot]
        other.append({'file': dest, 'hd': dest.replace('.webp', '-hd.webp'), 'thumb': dest.replace('.webp', '-t.webp'), 'w': W, 'h': H, 'view': view, 'key': key,
                      'phone': phone, 'rim': RIM_NAMES[rim], 'caption': phone + ' · ' + RIM_NAMES[rim],
                      'alt': 'Rated Case with a %s rim on %s, %s' % (RIM_NAMES[rim], desc, VIEW_ALT[view])})
    manifest = {'version': VERSION, 'models': models, 'sets': sets, 'other': other}
    text = json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + '\n'
    (OUT / 'manifest.json').write_text(text)
    used = {d for _, d in rows}
    for stale in OUT.glob('rp-*.webp'):
        if re.sub(r'-(t|hd)\.webp$', '.webp', stale.name) not in used:
            stale.unlink()
    write_doc(rows, models, qualities)
    total = sum(p.stat().st_size for p in OUT.iterdir())
    print('Rated Case photos: %d photos (%d sets, %d on other phones), %d files, %.2f MB' % (
        len(used), sum(len(v) for v in sets.values()), len(other), len(list(OUT.iterdir())), total / 1e6))
    return check()


def write_doc(rows, models, qualities):
    lines = ['# Rated Case photos', '',
             'Product photos for the "See photos" viewer of the Rated Case in the editor (`assets/rated-gallery.js`).',
             'Built by `python3 tools/build_rated_photos.py` from listing images saved Nov 20 to 23 2026 from',
             'shop.balajibrands.com (search "CCKP3", the blank case we print on), kept outside the repo in',
             '`vendor-photos/cck-phantom3/` (3000 x 3000 JPEG, never modified). To be replaced by photos of our own printed',
             'cases later. Served file names, captions and alt text never name the vendor or brand. The white panel in the photos',
             'is the print area of the blank, not a white back.', '',
             'Each listing (phone + rim) is trimmed to one 5:6 frame (the editor preview aspect) sized to its tallest view, so',
             'the case fills the frame at one scale across its views, on the photos\' own white background. Large images are',
             '1000 x 1200 WebP (quality 84, stepped down to as low as 72 for a photo that would pass 90 KB), the same at',
             '1600 x 1920 (`-hd`, quality 80, as low as 68 past 180 KB) for tablets and high density desktops, thumbnails',
             '200 x 240. Views in order: front and back (shot 1), side views (3, 4),',
             'back (12, or 2 when 12 is missing), front (5). Rims follow the site kit (`KITS[model].rated.colors`).', '',
             '## Phones', '', '| Phone | Photos | Rims | Shown on a similar phone |', '|---|---|---|---|']
    for m, v in models.items():
        lines.append('| %s | %s | %s | %s |' % (m, v['key'], ', '.join(v['rims']), 'yes' if v['similar'] else ''))
    lines += ['', 'A phone on a blank photographed with another phone (a different camera) reads "Photos show this case on a similar phone."',
              'The Pixel 10 and Pixel 11 have their own photos (shots 101 to 105 of the listings they share with the Pro). Not in the',
              'table: the Galaxy S24 Ultra (coming soon, no usable photo).', '']
    lines += ['%s %s: %s.' % (k, RIM_NAMES[r], why) for (k, r), why in NO_PHOTOS.items()]
    lines += ['', '## Source file to output file', '',
              '| Source (vendor-photos/cck-phantom3) | Output (assets/cases/rated-photos) | WebP quality (large, hd) |', '|---|---|---|']
    lines += ['| %s | %s | %d, %d |' % (s, d, *qualities[d]) for s, d in rows]
    lines += ['', 'Each output also has a `-hd.webp` and a `-t.webp` thumbnail.', '', '## Exclusions', '', '| Source | Reason |', '|---|---|']
    lines += ['| %s | %s |' % (s, r) for s, r in EXCLUDE.items()]
    lines += ['| %s | %s |' % (s, r) for s, r in EXCLUDE_NOTES]
    lines += ['', 'Changed on our copies only (`LENS_TEXT`): the letters printed around the flash of the moto phones (megapixels, a sensor',
              'brand) are taken off the back (12) and side (3) photos of %s.' % ', '.join(LENS_TEXT), '',
              'Checked by eye on a contact sheet of every output (logos, text, people, wrong phone, wrong rim). The first pass',
              'missed the vendor name embossed in the Galaxy S26 and S26 Ultra rims (light text on a light rim, legible only at',
              'full size); a review found it with contrast stretched 1:1 crops and a template match over both rims of every used',
              'source, which hit only those four photos (now excluded). When adding photos, check rims at 1:1 with the contrast',
              'stretched, not only the contact sheet. The phones added Nov 23 2026 were checked that way over both long rims of',
              'every photo and over every camera: the name shows on the edge with no buttons of the listings excluded above (in',
              'their back and front photos it is only a row of 3 px dashes seen edge on). Phone wallpapers are the phones\' own',
              'screens. The Galaxy wallpapers are Samsung\'s abstract default artwork, not a logo.', '']
    DOC.write_text('\n'.join(lines))


def check():
    from PIL import Image
    errors = []
    models, rims = plan()
    m = json.loads((OUT / 'manifest.json').read_text())
    if m.get('models') != models:
        errors.append('manifest phones differ from customizer.html KP-RATED-KITS: rebuild')
    for model, v in models.items():
        sets = m.get('sets', {}).get(v['key'], {})
        for rim in v['rims']:
            if (v['key'], next(k for k, n in RIM_NAMES.items() if n == rim)) in NO_PHOTOS:
                if rim in sets or not any(len(sets.get(r, [])) >= 3 for r in v['rims']):
                    errors.append('%s %s: no photos of its own, and the other rim must have 3' % (model, rim))
            elif len(sets.get(rim, [])) < 3:
                errors.append('%s %s has fewer than 3 photos' % (model, rim))
    items = [i for s in m.get('sets', {}).values() for r in s.values() for i in r] + m.get('other', [])
    if len(m.get('other', [])) < 8:
        errors.append('fewer than 8 photos on other phones')
    for i in items:
        for f, size in ((i['file'], (W, H)), (i.get('hd', ''), (HW, HH)), (i['thumb'], (TW, TH))):
            p = OUT / f
            if not f or not p.exists():
                errors.append('missing ' + (f or 'hd for ' + i['file']))
            elif Image.open(p).size != size:
                errors.append('%s is not %dx%d' % (f, *size))
        if BRAND.search(i['file']):
            errors.append('brand in file name ' + i['file'])
        for field in ('caption', 'alt', 'phone', 'rim'):
            if field in i and (BRAND.search(i[field]) or DASH.search(i[field])):
                errors.append('dash or brand in %s: %s' % (field, i[field]))
    total = sum(p.stat().st_size for p in OUT.iterdir())
    if total > 14e6:
        errors.append('photos weigh %.2f MB (limit 14 MB)' % (total / 1e6))
    for e in errors:
        print('FAIL ' + e)
    if not errors:
        print('PASS Rated Case photos: %d phones, %d photos, %.2f MB' % (len(models), len(items), total / 1e6))
    return 1 if errors else 0


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', type=Path, default=R.parent / 'vendor-photos' / 'cck-phantom3')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    sys.exit(check() if a.check else build(a.src))
