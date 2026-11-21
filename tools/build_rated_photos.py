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

The phones and rims come from customizer.html (KP-RATED-KITS: the RATED map and CLEAR_FROST_ONLY), so a phone that
gains a Rated kit there without photos here fails --check.

usage: python3 tools/build_rated_photos.py [--src DIR]   build (default DIR: ../vendor-photos/cck-phantom3 beside the repo)
       python3 tools/build_rated_photos.py --check       verify the manifest, files and phone list (no vendor photos needed)
"""
from pathlib import Path
import argparse, io, json, re, sys

R = Path(__file__).resolve().parent.parent
OUT = R / 'assets/cases/rated-photos'
DOC = R / 'docs/RATED-CASE-PHOTOS.md'
VERSION = 'rated-photos-2'
W, H, TW, TH = 1000, 1200, 200, 240
HW, HH = 1600, 1920
# (start quality, lowest quality, size cap in bytes) per kind of output
QUALITY = {'large': (84, 72, 90000), 'hd': (80, 68, 180000), 'thumb': (74, 74, None)}
RIM_NAMES = {'smoke': 'Smoke Frost', 'clear': 'Clear Frost'}
# listing shot number -> view; the back is shot 12 (back with buttons), or the plain back (2) when 12 is missing
VIEWS = [('angle', [1], 'Front and back'), ('side', [3], 'Side view'), ('side2', [4], 'Other side'),
         ('back', [12, 2], 'Back'), ('front', [5], 'Front')]
VIEW_ALT = {'angle': 'front and back', 'side': 'side view', 'side2': 'side view from the other side', 'back': 'back', 'front': 'front'}
# never shipped, with the reason (docs/RATED-CASE-PHOTOS.md lists them)
EXCLUDE = {
    'cckp3-samgs24-media-smoke-frost-2.jpg': 'an app icon logo is printed on the white back',
    'cckp3-iph18fld-media-smoke-frost-1.jpg': 'the lock screen shows a large clock (text); no site kit for this phone',
    'cckp3-iph18fld-media-smoke-frost-5.jpg': 'the lock screen shows a large clock (text); no site kit for this phone',
    # found in review (Nov 21 2026): legible at full size, so never shipped; S26 and S26 Ultra keep side, back and front
    'cckp3-samgs26-media-clear-frost-1.jpg': 'the left rim shows the vendor name embossed in the rim',
    'cckp3-samgs26-media-clear-frost-4.jpg': 'the right rim shows the vendor name embossed in the rim',
    'cckp3-samgs26u-media-clear-frost-1.jpg': 'the left rim shows the vendor name embossed in the rim',
    'cckp3-samgs26u-media-clear-frost-4.jpg': 'the right rim shows the vendor name embossed in the rim',
}
EXCLUDE_NOTES = [
    ('cckp3-iph18fld-media-smoke-frost-{2,3,4}.jpg', 'foldable listing with no site kit; not used anywhere'),
    ('cckp3-motgply25-media-clear-frost-{1,2,3,4,12}.jpg, cckp3-motgstl26-media-clear-frost-{1,2,3,4,12}.jpg, cckp3-motgpwr25-*',
     'the camera lens rings carry printed text (megapixels, a sensor brand); only the front view (shot 5) of the '
     'moto g play and moto g stylus is used, and none of the moto g power (its cream front adds no new color)'),
    ('every listing: shot 2', 'near duplicate of shot 12 (straight back); used only when shot 12 is missing (never, today)'),
]
# the phone in each listing's photos, so the viewer can say when a phone is shown on a similar model
PHOTOGRAPHED = {
    'iphse25': 'iPhone 16e', 'iph14pro': 'iPhone 14 Pro', 'iph14promax': 'iPhone 14 Pro Max', 'iph15pro': 'iPhone 15 Pro',
    'iph15pmx': 'iPhone 15 Pro Max', 'iph16': 'iPhone 16', 'iph16pro': 'iPhone 16 Pro', 'iph16pmx': 'iPhone 16 Pro Max',
    'iph17': 'iPhone 17', 'iph17a': 'iPhone Air', 'iph17pro': 'iPhone 17 Pro', 'iph17pmx': 'iPhone 17 Pro Max',
    'iph14max': 'iPhone 15 Plus', 'samgs26': 'Samsung Galaxy S26', 'samgs26u': 'Samsung Galaxy S26 Ultra',
}
# "On other phones": one photo per phone color or brand, both rims. (key, rim, shot, caption phone, alt description)
# Captions name the phones the listing fits; alt text names what the photo shows, with the color when it is obvious.
OTHER = [
    ('iph14max', 'clear', 1, 'iPhone 14 Plus and 15 Plus', 'a yellow iPhone 15 Plus'),
    ('iph17', 'smoke', 1, 'iPhone 17', 'a white iPhone 17'),
    ('samgs24', 'clear', 1, 'Galaxy S24 and S25', 'a pink Galaxy S24'),
    ('motgply25', 'clear', 5, 'moto g play 2025', 'a moto g play with a teal screen'),
    ('motgstl26', 'clear', 5, 'moto g stylus 2026', 'a moto g stylus with a purple screen'),
    ('samgs25u', 'smoke', 1, 'Galaxy S25 Ultra', 'a Galaxy S25 Ultra with a bronze screen'),
    ('iph16', 'clear', 1, 'iPhone 16', 'a white iPhone 16'),
    ('iph15pmx', 'smoke', 1, 'iPhone 15 Pro Max', 'a titanium iPhone 15 Pro Max'),
    ('iph17pmx', 'smoke', 1, 'iPhone 17 Pro Max', 'a silver iPhone 17 Pro Max'),
    ('samgs26', 'clear', 5, 'Galaxy S26', 'a Galaxy S26 with a lavender and pink screen'),
    ('iph17a', 'smoke', 1, 'iPhone Air', 'a white iPhone Air'),
    ('iph14pro', 'smoke', 1, 'iPhone 14 Pro', 'an iPhone 14 Pro with a deep blue screen'),
]
SHOT_VIEW = {1: 'angle', 3: 'side', 4: 'side2', 12: 'back', 2: 'back', 5: 'front'}
BRAND = re.compile(r'cck|custom case kiosk|nimbus|phantom|balaji', re.I)
DASH = re.compile('[\u2010-\u2015\u2212-]')


def site_kits():
    """customizer.html KP-RATED-KITS: model -> site key, site keys with Clear Frost only."""
    src = (R / 'customizer.html').read_text()
    block = src[src.index('KP-RATED-KITS'):]
    rated = json.loads(re.search(r"var RATED=(\{.*?\});", block, re.S).group(1).replace("'", '"'))
    clear_only = json.loads(re.sub(r"'([^']+)':1", r'"\1":1', re.search(r"var CLEAR_FROST_ONLY=(\{.*?\});", block, re.S).group(1)))
    return rated, set(clear_only)


def photo_key(site_key):
    """iphse25-i13 and iphse25-i14 (iPhone 13 and 14) use the iphse25 photos, iph14max-i15m (iPhone 15 Plus) iph14max."""
    return re.sub(r'-i\d+\w*$', '', site_key)


def plan():
    rated, clear_only = site_kits()
    models, rims = {}, {}
    for model, site_key in rated.items():
        key = photo_key(site_key)
        offered = ['clear'] if site_key in clear_only else ['smoke', 'clear']
        rims.setdefault(key, [])
        for r in offered:
            if r not in rims[key]:
                rims[key].append(r)
        models[model] = {'key': key, 'rims': [RIM_NAMES[r] for r in offered],
                         'similar': PHOTOGRAPHED.get(key, model) != model}
    for key in rims:
        rims[key].sort(key=['smoke', 'clear'].index)
    return models, rims


def src_name(key, rim, shot):
    return 'cckp3-%s-media-%s-frost-%d.jpg' % (key, rim, shot)


def out_name(key, rim, view, thumb=False):
    return 'rp-%s-%s-%s%s.webp' % (key, rim, view, '-t' if thumb else '')


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
            cache[name] = im
        return cache[name]

    def bbox(name):
        if name not in boxes:
            g = load(name).convert('L').point(lambda v: 255 if v < 246 else 0)
            boxes[name] = g.getbbox()
        return boxes[name]

    def listing(key, rim, shots):
        names = [src_name(key, rim, s) for s in shots if (src / src_name(key, rim, s)).exists() and src_name(key, rim, s) not in EXCLUDE]
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
        dest = done.get((key, rim, shot))
        if not dest:
            all_shots = [s for s in (1, 3, 4, 12, 2, 5)]
            frame = listing(key, rim, all_shots)
            dest = out_name(key, rim, SHOT_VIEW[shot])
            render(name, frame, dest)
            rows.append((name, dest))
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
             'Built by `python3 tools/build_rated_photos.py` from listing images saved Nov 20 2026 from',
             'shop.balajibrands.com (search "CCKP3", the blank case we print on), kept outside the repo in',
             '`vendor-photos/cck-phantom3/` (3000 x 3000 JPEG, never modified). To be replaced by photos of our own printed',
             'cases later. Served file names, captions and alt text never name the vendor or brand.', '',
             'Each listing (phone + rim) is trimmed to one 5:6 frame (the editor preview aspect) sized to its tallest view, so',
             'the case fills the frame at one scale across its views, on the photos\' own white background. Large images are',
             '1000 x 1200 WebP (quality 84, stepped down to as low as 72 for a photo that would pass 90 KB), the same at',
             '1600 x 1920 (`-hd`, quality 80, as low as 68 past 180 KB) for tablets and high density desktops, thumbnails',
             '200 x 240. Views in order: front and back (shot 1), side views (3, 4),',
             'back (12, or 2 when 12 is missing), front (5). Rims follow the site kit (`KITS[model].rated.colors`).', '',
             '## Phones', '', '| Phone | Photos | Rims | Shown on a similar phone |', '|---|---|---|---|']
    for m, v in models.items():
        lines.append('| %s | %s | %s | %s |' % (m, v['key'], ', '.join(v['rims']), 'yes' if v['similar'] else ''))
    lines += ['', '## Source file to output file', '',
              '| Source (vendor-photos/cck-phantom3) | Output (assets/cases/rated-photos) | WebP quality (large, hd) |', '|---|---|---|']
    lines += ['| %s | %s | %d, %d |' % (s, d, *qualities[d]) for s, d in rows]
    lines += ['', 'Each output also has a `-hd.webp` and a `-t.webp` thumbnail.', '', '## Exclusions', '', '| Source | Reason |', '|---|---|']
    lines += ['| %s | %s |' % (s, r) for s, r in EXCLUDE.items()]
    lines += ['| %s | %s |' % (s, r) for s, r in EXCLUDE_NOTES]
    lines += ['', 'Checked by eye on a contact sheet of every output (logos, text, people, wrong phone, wrong rim). The first pass',
              'missed the vendor name embossed in the Galaxy S26 and S26 Ultra rims (light text on a light rim, legible only at',
              'full size); a review found it with contrast stretched 1:1 crops and a template match over both rims of every used',
              'source, which hit only those four photos (now excluded). When adding photos, check rims at 1:1 with the contrast',
              'stretched, not only the contact sheet. Phone wallpapers are the phones\' own screens. The Galaxy wallpapers are',
              'Samsung\'s abstract default artwork, not a logo.', '']
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
            if len(sets.get(rim, [])) < 3:
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
    if total > 10e6:
        errors.append('photos weigh %.2f MB (limit 10 MB)' % (total / 1e6))
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
