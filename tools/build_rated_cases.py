"""Rated Case preview assets: the case photos and printable panel masks the editor draws (customizer.html KP-RATED-KITS).

Reads the saved listing photos (outside the repo, never modified) and writes, in the editor's 2500 x 3000 stage frame,
  assets/cases/rated-<key>-<smoke|clear>.webp   the straight back photo cut out of its white studio background
  assets/masks/view-rated-<key>.png             the flat printable panel only (never the rim, camera lip or frost)
Served names never carry the vendor or brand name.

Two ways of placing a listing in the stage:
  clear   the phone already has a clear case photo: the Rated photo gets its height and centre, so the print template
          (TPL, FIT) of the clear kit also fits the Rated Case and the case does not jump when the customer switches
  scale   the phone has no clear case photo ("Rated only"): every listing photo is drawn at one physical scale
          (VENDOR_PX_PER_MM, fitted on case height and width of 34 listings against published body sizes, 0.11 mm rms
          on the 15 listings that shipped first), so one number, STAGE_PX_PER_MM, gives the stage size and the template

By default only files that do not exist yet are written: an existing photo or mask is never touched. A Smoke Frost photo
added to a listing that shipped with Clear Frost only (KEEP_CLEAR) is registered to the committed clear file and the
committed mask, which both stay as they are.

usage: python3 tools/build_rated_cases.py [--src DIR] [--only KEY ...]   build what is missing
       python3 tools/build_rated_cases.py --verify                       rebuild everything in memory, compare bytes
       python3 tools/build_rated_cases.py --out DIR [--only KEY ...]     build everything into DIR/cases, DIR/masks
       --report FILE   write scales, offsets, boxes and panel agreement as JSON
--src defaults to ../vendor-photos/cck-phantom3 beside the repo. After a build run tools/build_mask_geometry.py and
tools/build_rated_camera_geometry.py. Needs numpy, scipy and Pillow with WebP.
"""
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import argparse, io, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

R = Path(__file__).resolve().parent.parent
CASES, MASKS = R / 'assets/cases', R / 'assets/masks'
W, H = 2500, 3000
VIEW_N = 2  # straight on back view of every listing

VENDOR_PX_PER_MM = 13.811
SCALE = 1.05                                  # stage px per vendor px for Rated only phones
STAGE_PX_PER_MM = VENDOR_PX_PER_MM * SCALE    # 14.5 stage px per mm (existing clear kits: 12.5 to 15)

# key -> list of frames (phones sharing one stage frame, how it is placed, file suffix). The first frame of each key
# gets the plain name rated-<key>-<color>.webp. A clear case photo name places the frame on that photo.
LISTINGS = {
    'iphse25':   [(['iPhone 15'], 'i15-black.webp', ''),
                  (['iPhone 14'], 'i14-black.webp', '-i14'),
                  (['iPhone 13'], 'i13-black.webp', '-i13')],
    'iph14pro':  [(['iPhone 14 Pro'], 'i14p-whte.webp', '')],
    'iph14promax': [(['iPhone 14 Pro Max'], 'i14pm-black.webp', '')],
    'iph15pro':  [(['iPhone 15 Pro'], 'i15p-black.webp', '')],
    'iph15pmx':  [(['iPhone 15 Pro Max'], 'i15pm-black.webp', '')],
    'iph16':     [(['iPhone 16'], 'i16n-dark.webp', '')],
    'iph16pro':  [(['iPhone 16 Pro'], 'i16p-black.webp', '')],
    'iph16pmx':  [(['iPhone 16 Pro Max'], 'i16pm-black.webp', '')],
    'iph17':     [(['iPhone 17'], 'i17-black.webp', '')],
    'iph17a':    [(['iPhone Air'], 'i17a-black.webp', '')],
    'iph17pro':  [(['iPhone 17 Pro', 'iPhone 18 Pro'], 'i17p-silver.webp', '')],
    'iph17pmx':  [(['iPhone 17 Pro Max', 'iPhone 18 Pro Max'], 'i17pm-silver.webp', '')],
    'iph14max':  [(['iPhone 14 Plus'], 'i14m-black.webp', ''),
                  (['iPhone 15 Plus'], 'i15m-black.webp', '-i15m')],
    'samgs26':   [(['Samsung Galaxy S26'], 's26-clear-black.webp', '')],
    'samgs26u':  [(['Samsung Galaxy S26 Ultra'], 's26u-clear-black.webp', '')],
    # phones with a clear case kit, added Nov 23 2026
    'iph2161p':  [(['iPhone 13 Pro'], 'i13p-black.webp', '')],
    'iph2167':   [(['iPhone 13 Pro Max'], 'i13pm-black.webp', '')],
    'iph16plus': [(['iPhone 16 Plus'], 'i16m-dark.webp', '')],
    'iph1261':   [(['iPhone 12', 'iPhone 12 Pro'], 'i12-black.webp', '')],  # i12 and i12p photos share one outline
    'samgs26pl': [(['Samsung Galaxy S26 Plus'], 's26-clear-black.webp', ''),
                  (['Samsung Galaxy S25 Plus', 'Samsung Galaxy S24 Plus'], 'scale', '-s25p')],
    # Rated only phones
    'iph61':     [(['iPhone 11'], 'scale', '')],
    'iph18fld':  [(['iPhone Duo'], 'scale', '')],
    'samgs24':   [(['Samsung Galaxy S25', 'Samsung Galaxy S24'], 'scale', '')],
    'samgs24u':  [(['Samsung Galaxy S24 Ultra'], 'scale', '')],
    'samgs25u':  [(['Samsung Galaxy S25 Ultra'], 'scale', '')],
    'samgs24fe': [(['Samsung Galaxy S24 FE'], 'scale', '')],
    'samgs25fe': [(['Samsung Galaxy S25 FE'], 'scale', '')],
    'samgs26fe': [(['Samsung Galaxy S26 FE'], 'scale', '')],
    'samga37':   [(['Samsung Galaxy A37', 'Samsung Galaxy A36'], 'scale', '')],
    'samga17':   [(['Samsung Galaxy A17'], 'scale', '')],
    'googpl10':  [(['Google Pixel 10 Pro'], 'scale', ''),
                  (['Google Pixel 10'], 'scale', '-p10')],
    'googpl10pxl': [(['Google Pixel 10 Pro XL'], 'scale', '')],
    'googpl11':  [(['Google Pixel 11 Pro'], 'scale', ''),
                  (['Google Pixel 11'], 'scale', '-p11')],
    'googpl11pxl': [(['Google Pixel 11 Pro XL'], 'scale', '')],
    'motgply25': [(['Motorola moto g play 2026', 'Motorola moto g 5G 2026', 'Motorola moto g 2025'], 'scale', '')],
    'motgpwr25': [(['Motorola moto g power 2026', 'Motorola moto g power 2025'], 'scale', '')],
    'motgstl26': [(['Motorola moto g stylus 2026', 'Motorola moto g stylus 2025'], 'scale', '')],
}

# the first release. Later listings get an even outline and panel edge (see smooth_cutout and SMOOTH_PX); these keep the
# exact pixels they shipped with
FIRST = set(list(LISTINGS)[:15])
SMOOTH_PX = 4
# these listings shipped with Clear Frost only: their clear file and mask stay, Smoke Frost is registered to them
KEEP_CLEAR = {'iph16', 'iph16pmx', 'samgs26', 'samgs26u'}
# frames whose panel mask is cut to the clear view mask of their kit, so a Rated print never inks where the clear print
# area has none (tools/tests/rated_case.cjs)
CLIP_TO_CLEAR = {'samgs26': 'view-s26.png', 'samgs26u': 'view-s26u.png', 'iph2161p': 'view-i13p.png',
                 'iph2167': 'view-i13pm.png', 'iph16plus': 'view-i16m.png', 'iph1261': 'view-i12.png',
                 'samgs26pl': 'view-s26.png'}
# the S26 Plus clear kit borrows the S26 photo, whose print window is a little narrower than this panel at full height:
# 1.4% smaller and 3 px left keeps the whole panel inside it (nothing is cut off); 18 px up centres the borrowed lenses
# in the camera opening
TWEAK = {'samgs26pl': (0.9857, -3, -18)}
# second phone of a listing: its own photo, the same blank, so the same mask file
SHOT = {'googpl10-p10': 102, 'googpl11-p11': 102}
MASK_OF = {'googpl10-p10': 'googpl10', 'googpl11-p11': 'googpl11'}
# photos whose body sides cannot be measured (the second half of the folding phone shows on the right): centre the box
BOX_CENTRE = {'iph18fld'}
# photos taken at another scale: their px per mm, from the published phone size (Duo 117.8 x 84.1 mm closed, S24 Ultra
# 162.3 x 79.0 mm) plus the rim the other listings show, or from the same case height (S24)
PHOTO_PX_PER_MM = {('iph18fld', 'smoke'): 18.25, ('samgs24u', 'smoke'): 16.8, ('samgs24', 'smoke'): 18.44}
# a photo of another render than the listing's other color: its own place and its own mask view-rated-<key>-<color>.png
OWN_MASK = {('samgs24', 'smoke')}
# held back: an older render whose camera opening has another shape than the listing's other photos, so the two rims
# would show two different print areas for one blank. Built with --held.
HELD = {('samgs24', 'smoke')}
WITH_HELD = [False]
# text printed on a phone's flash ring (megapixels, a sensor brand): (centre x, y, inner and outer radius) in the photo
LENS_TEXT = {'motgply25': (1437, 526, 38, 74), 'motgpwr25': (1429, 551, 39, 68), 'motgstl26': (1465, 603, 39, 81)}
# pink scraps of the phone's art show through the frost beside the camera lip: made grey
GREY_LIP = {('samgs24', 'clear')}
# the camera stands alone inside this panel, with a clear lip that would pass for panel: px kept free around its ring
ISLAND = {('samgs24u', 'smoke'): 24}
# an app icon printed on the white panel: painted out with the panel's own white
PANEL_ICON = {('samgs24', 'smoke'), ('samgs24u', 'smoke')}


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def stage_rgba(path):
    im = Image.open(path).convert('RGBA')
    if im.size != (W, H):
        im = im.resize((W, H), Image.BICUBIC)
    return im


def body_measure(alpha, band=(0.3, 0.7)):
    """Height from the alpha>=0.5 bbox; x centre/width from per-row medians in a band of rows, so side buttons
    (minority of rows) do not shift the centre. Rated only phones use rows below every button."""
    m = alpha >= 0.5
    ys = np.where(m.any(1))[0]
    y0, y1 = int(ys[0]), int(ys[-1]) + 1
    lefts, rights = [], []
    for y in range(int(y0 + band[0] * (y1 - y0)), int(y0 + band[1] * (y1 - y0))):
        xs = np.where(m[y])[0]
        if len(xs):
            lefts.append(xs[0]); rights.append(xs[-1] + 1)
    l, r = float(np.median(lefts)), float(np.median(rights))
    xs = np.where(m.any(0))[0]
    return {'y0': y0, 'y1': y1, 'h': y1 - y0, 'cx': (l + r) / 2, 'cy': (y0 + y1) / 2,
            'bodyL': l, 'bodyR': r, 'bodyW': r - l, 'bbox': [int(xs[0]), y0, int(xs[-1]) + 1, y1]}


def cutout(rgb):
    """White-studio background removal. Returns float RGBA (straight alpha, 0..1)."""
    f = rgb.astype(np.float32)
    lum = f @ np.array([0.299, 0.587, 0.114], np.float32)
    mn = f.min(2)
    # background candidate: near-pure white (renders are exactly 255; JPEG noise ~250+)
    bgc = mn >= 249
    fg = ~bgc
    # closing seals specular gaps in the light Clear Frost rim so the flood cannot leak in
    fg_closed = ndi.binary_closing(fg, structure=disk(4), iterations=1, border_value=0)
    lab, n = ndi.label(~fg_closed)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    bg = np.isin(lab, border)
    case = ndi.binary_fill_holes(~bg)
    # keep only the main object (drop specks)
    lab2, n2 = ndi.label(case)
    sizes = ndi.sum(case, lab2, range(1, n2 + 1))
    case = lab2 == (1 + int(np.argmax(sizes)))
    # soft edge: alpha from luminance against the local interior rim colour
    din = ndi.distance_transform_edt(case)
    dout = ndi.distance_transform_edt(~case)
    ref_zone = case & (din >= 4) & (din <= 9)
    _, (iy, ix) = ndi.distance_transform_edt(~ref_zone, return_indices=True)
    ref_rgb = f[iy, ix]
    ref_l = lum[iy, ix]
    band = (case & (din <= 3.5)) | (~case & (dout <= 2.5))
    denom = np.maximum(255.0 - ref_l, 12.0)
    a_est = np.clip((255.0 - lum) / denom, 0, 1)
    alpha = case.astype(np.float32)
    alpha[band] = a_est[band]
    # pixels deep inside never go transparent; pixels outside band are background
    alpha[case & (din > 3.5)] = 1.0
    # JPEG noise on the light frost rim makes the luminance alpha speckled: smooth it in the band only
    alpha_s = ndi.gaussian_filter(alpha, 1.0)
    alpha[band] = alpha_s[band]
    alpha[case & (din > 3.5)] = 1.0
    out = f.copy()
    # colour decontamination: edge pixels take the interior rim colour (no white halo)
    out[band] = ref_rgb[band]
    return out, alpha, case, lum


def erase_side_bumps(rgb):
    """The name embossed in the side of some rims shows edge on as a row of 2 to 4 px dashes along the outline. Anything
    that sticks out sideways for fewer than 61 rows is painted studio white; buttons (78 px and longer) stay."""
    fg = ndi.binary_closing(rgb.min(2) < 249, structure=disk(4))
    lab, n = ndi.label(~fg)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    case = ndi.binary_fill_holes(~np.isin(lab, border[border > 0]))
    body = ndi.binary_opening(case, structure=np.ones((61, 1), bool))
    bumps = case & ~body
    if not bumps.any():
        return rgb
    out = rgb.copy()
    out[ndi.binary_dilation(bumps, structure=disk(3)) & ~body] = 255
    return out


def smooth_cutout(rgb):
    """The same cut for a Clear Frost photo with no Smoke Frost twin: the outer frost renders at 249 to 254 on 255, so the
    plain cut is nibbled. The outline is closed, evened out and anti aliased from its own distance, dark buttons stay."""
    f = rgb.astype(np.float32)
    lum = f @ np.array([0.299, 0.587, 0.114], np.float32)
    fg = ndi.binary_closing(f.min(2) < 249, structure=disk(4))
    lab, n = ndi.label(~fg)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    case = ndi.binary_fill_holes(~np.isin(lab, border[border > 0]))
    lab2, n2 = ndi.label(case)
    case = lab2 == (1 + int(np.argmax(ndi.sum(case, lab2, range(1, n2 + 1)))))
    dark = case & ndi.binary_dilation(case & (lum < 120), structure=disk(3))
    # fill nibbles up to 12 px long on the light rim only: along the sides and the corners the outline is straight or round
    light = ndi.binary_closing(case, structure=disk(14))
    light &= ~ndi.binary_dilation(dark, structure=disk(16))
    case = (ndi.gaussian_filter((case | light).astype(np.float32), 4) >= 0.5) | dark
    sd = ndi.distance_transform_edt(case) - ndi.distance_transform_edt(~case)
    sd = ndi.gaussian_filter(sd, 1.0)
    alpha = np.clip(sd / 1.6 + 0.5, 0, 1).astype(np.float32)
    din = ndi.distance_transform_edt(case)
    zone = case & (din >= 4) & (din <= 9)
    _, (iy, ix) = ndi.distance_transform_edt(~zone, return_indices=True)
    band = (din <= 3.5)
    out = f.copy()
    out[band] = f[iy, ix][band]
    return out, alpha, case, lum


def panel_mask(lum, case, thresh=205, island=None):
    """White printable panel: component of lum>=thresh containing an interior seed."""
    ys, xs = np.where(case)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    cand = (lum >= thresh) & ndi.binary_erosion(case, structure=disk(6))
    # remove thin bridges (frost specks along the rim) before picking the component
    cand = ndi.binary_opening(cand, structure=disk(3))
    lab, n = ndi.label(cand)
    sy, sx = int(y0 + 0.72 * (y1 - y0)), int((x0 + x1) / 2)
    win = lab[sy - 40:sy + 40, sx - 40:sx + 40]
    vals, cnt = np.unique(win[win > 0], return_counts=True)
    pm = lab == vals[np.argmax(cnt)]
    open_pm, pm = pm, ndi.binary_fill_holes(pm)
    if island:
        lab, n = ndi.label(pm & ~open_pm)
        sizes = ndi.sum(lab > 0, lab, range(1, n + 1))
        pm &= ~ndi.binary_dilation(lab == 1 + int(np.argmax(sizes)), structure=disk(island))
    return pm


def affine_to_stage(img, s, tx, ty, resample):
    # stage = s*vendor + t  ->  vendor = (stage - t)/s
    return img.transform((W, H), Image.AFFINE, (1 / s, 0, -tx / s, 0, 1 / s, -ty / s), resample=resample)


def warp_rgba(rgbf, alpha, s, tx, ty):
    pm = np.dstack([rgbf * alpha[..., None], alpha * 255.0])
    chans = []
    for c in range(4):
        im = Image.fromarray(pm[..., c].astype(np.float32))
        chans.append(np.asarray(affine_to_stage(im, s, tx, ty, Image.BICUBIC), np.float32))
    a = np.clip(chans[3], 0, 255)
    rgb = np.zeros((H, W, 3), np.float32)
    nz = a > 0.5
    for c in range(3):
        rgb[..., c][nz] = chans[c][nz] / (a[nz] / 255.0)
    rgb = np.clip(rgb, 0, 255)
    a8 = np.round(a).astype(np.uint8)
    a8[a8 < 3] = 0
    return np.dstack([rgb.astype(np.uint8), a8])


def warp_mask(m, s, tx, ty):
    im = Image.fromarray(m.astype(np.float32))
    return np.asarray(affine_to_stage(im, s, tx, ty, Image.BILINEAR), np.float32)


def view_mask_alpha(soft, inset=2.0):
    """Alpha of the LA PNG like assets/masks/view-*.png: A marks the printable window. Inset ~2px from the 50% panel
    edge with a 1px anti-aliased ramp; alpha>=128 (what tools/build_mask_geometry.py compiles) is the binary window."""
    b = soft >= 0.5
    sd = ndi.distance_transform_edt(b) - ndi.distance_transform_edt(~b)
    return np.round(np.clip(sd - inset + 0.5, 0, 1) * 255).astype(np.uint8)


def png_bytes(A):
    buf = io.BytesIO()
    Image.fromarray(np.dstack([np.full_like(A, 255), A])).save(buf, 'PNG', optimize=True)
    return buf.getvalue()


def webp_bytes(rgba):
    buf = io.BytesIO()
    Image.fromarray(rgba).save(buf, 'WEBP', quality=90, method=6, alpha_quality=100)
    return buf.getvalue()


def remove_lens_text(rgb, cx, cy, r0, r1):
    """Grey opening inside the flash ring: thin light letters go, the ring's own shading and the flash stay."""
    y, x = np.mgrid[0:rgb.shape[0], 0:rgb.shape[1]]
    d = np.hypot(x - cx, y - cy)
    pad = 24
    sl = np.s_[int(cy - r1 - pad):int(cy + r1 + pad), int(cx - r1 - pad):int(cx + r1 + pad)]
    part, dd = rgb[sl].astype(np.float32), d[sl]
    inside = (dd >= r0 - 4) & (dd <= r1 + 4)
    # fill outside the ring with the ring's dark median so the flash and the frame never bleed into the opening
    ring = np.median(part[(dd >= r0) & (dd <= r1)], axis=0)
    work = np.where(inside[..., None], part, ring)
    for c in range(3):
        work[..., c] = ndi.gaussian_filter(ndi.grey_opening(work[..., c], footprint=disk(9)), 2)
    w = np.clip((dd - r0) / 4 + 0.5, 0, 1) * np.clip((r1 - dd) / 4 + 0.5, 0, 1)
    out = rgb.copy()
    out[sl] = np.round(part * (1 - w[..., None]) + np.minimum(work, part) * w[..., None]).astype(np.uint8)
    return out


def remove_panel_icon(rgb):
    """The icon is the only saturated thing in the middle of the panel: its box (6 px wider) is filled by straight lines
    between the clean panel pixels around it, weighted by distance, plus nothing else. Returns the image and the box."""
    h, w = rgb.shape[:2]
    f = rgb.astype(np.float32)
    sat = f.max(2) - f.min(2)
    mid = np.zeros((h, w), bool)
    mid[int(h * .3):int(h * .7), int(w * .25):int(w * .75)] = True
    lab, n = ndi.label(ndi.binary_closing((sat > 40) & mid, structure=disk(6)))
    sizes = ndi.sum(lab > 0, lab, range(1, n + 1))
    ys, xs = np.where(lab == 1 + int(np.argmax(sizes)))
    x0, y0, x1, y1 = xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7
    L = f[y0:y1, x0 - 12:x0].mean(1)[:, None]
    Rr = f[y0:y1, x1:x1 + 12].mean(1)[:, None]
    T = f[y0 - 12:y0, x0:x1].mean(0)[None]
    B = f[y1:y1 + 12, x0:x1].mean(0)[None]
    for e in (L, Rr):
        e[:] = ndi.gaussian_filter1d(e, 12, axis=0)
    for e in (T, B):
        e[:] = ndi.gaussian_filter1d(e, 12, axis=1)
    hh, ww = y1 - y0, x1 - x0
    u = ((np.arange(ww) + .5) / ww)[None, :, None]
    v = ((np.arange(hh) + .5) / hh)[:, None, None]
    horiz, vert = L * (1 - u) + Rr * u, T * (1 - v) + B * v
    wh, wv = 1 / (u * (1 - u)), 1 / (v * (1 - v))
    out = f.copy()
    out[y0:y1, x0:x1] = (horiz * wh + vert * wv) / (wh + wv)
    return np.round(out).astype(np.uint8), [int(x0), int(y0), int(x1), int(y1)]


def grey_lip(rgb):
    """Takes the color (not the light) out of the 40 px around the outside of the camera lip."""
    lum = rgb.astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)
    lab, n = ndi.label(ndi.binary_opening(lum < 95, structure=disk(5)))
    lip = ndi.binary_fill_holes(lab == 1 + int(np.argmax(ndi.sum(lab > 0, lab, range(1, n + 1)))))
    zone = ndi.binary_dilation(lip, structure=disk(40)) & ~lip
    out = rgb.copy()
    out[zone] = np.round(lum[zone])[:, None].astype(np.uint8)
    return out


def source(src, key, color, shot):
    return src / ('cckp3-%s-media-%s-frost-%d.jpg' % (key, color, shot))


def colors_of(src, key, shot):
    return [c for c in ('smoke', 'clear') if source(src, key, c, shot).exists() and ((key, c) not in HELD or WITH_HELD[0])]


def frame_colors(src, key, fk):
    """The colors that share one place and one mask, then each color with its own."""
    cs = colors_of(src, key, SHOT.get(fk, VIEW_N))
    own = [c for c in cs if (key, c) in OWN_MASK]
    return [g for g in [[c for c in cs if c not in own]] + [[c] for c in own] if g]


def mask_name(fk, key, group):
    if len(group) == 1 and (key, group[0]) in OWN_MASK:
        return 'view-rated-%s-%s.png' % (fk, group[0])
    return 'view-rated-%s.png' % MASK_OF.get(fk, fk)


def expected(src, keys):
    """Output file name -> frame key, for every listing."""
    files = {}
    for key in keys:
        for models, ref, suffix in LISTINGS[key]:
            fk = key + suffix
            for group in frame_colors(src, key, fk):
                for c in group:
                    files['rated-%s-%s.webp' % (fk, c)] = fk
                if fk not in MASK_OF:
                    files[mask_name(fk, key, group)] = fk
    return files


def build_listing(src, key, want, held=False):
    """Every wanted file of one listing as {name: bytes}, plus report rows."""
    WITH_HELD[0] = held
    frames, files, report = LISTINGS[key], {}, {}
    mine = expected(src, [key])
    need = [f for f in frames if any(mine[n] == key + f[2] for n in want if n in mine)]
    cuts = {}

    def cut(color, shot):
        if (color, shot) in cuts:
            return cuts[(color, shot)]
        rgb = np.asarray(Image.open(source(src, key, color, shot)).convert('RGB'))
        icon = None
        if (key, color) in PANEL_ICON:
            rgb, icon = remove_panel_icon(rgb)
        if (key, color) in GREY_LIP:
            rgb = grey_lip(rgb)
        if key in LENS_TEXT:
            rgb = remove_lens_text(rgb, *LENS_TEXT[key])
        if key not in FIRST or (key in KEEP_CLEAR and color == 'smoke'):
            rgb = erase_side_bumps(rgb)
        smooth = key not in FIRST and color == 'clear' and 'smoke' not in [c for g in frame_colors(src, key, key)[:1] for c in g]
        out, alpha, case, lum = (smooth_cutout if smooth else cutout)(rgb)
        # smoke: rim/ring ~55 vs panel ~248 -> mid threshold 150 puts the edge on the true
        # panel boundary; clear: frosted rim ~175 -> 205 is the only safe cut
        pm = panel_mask(lum, case, 150 if color == 'smoke' else 205, ISLAND.get((key, color)))
        cuts[(color, shot)] = dict(rgb=out, alpha=alpha, case=case, panel=pm, meas=body_measure(alpha),
                                   low=body_measure(alpha, (0.62, 0.88)), raw=rgb.astype(np.float32), icon=icon)
        return cuts[(color, shot)]

    for models, refphoto, suffix, colors in [(m, r, x, g) for m, r, x in need for g in frame_colors(src, key, key + x)]:
        fk = key + suffix
        shot = SHOT.get(fk, VIEW_N)
        cc = {c: dict(cut(c, shot)) for c in colors}
        base = ['clear'] if key in KEEP_CLEAR else colors
        pm = cc[base[0]]['panel'].copy()
        agree = None
        if len(base) == 2:
            a, b = cc['smoke']['panel'], cc['clear']['panel']
            agree = float((a & b).sum() / (a | b).sum())
            # smoke edge is the true panel edge; never extend >2px past the clear-frost edge (first release). On some
            # later Clear Frost photos a soft shadow lies on the panel along its edge, so there the Smoke edge is used
            pm = a & ndi.binary_dilation(b, structure=disk(2)) if key in FIRST else a
            mb = [cc[c]['meas']['bbox'] for c in colors]
            if max(abs(mb[0][i] - mb[1][i]) for i in range(4)) > 3:
                print('WARN colour bboxes differ', key, mb)
            # The Clear Frost outer frost renders at 250-254 on a 255 studio white (17-series
            # renders are bubbly), so its own cut-out is scalloped. Same render geometry as
            # Smoke, so take the crisp Smoke silhouette for the clear photo's outer edge and
            # keep the clear photo's own pixels (light frost) inside it.
            sa, ca = cc['smoke']['alpha'], cc['clear']['alpha']
            if key in FIRST:
                grow = (sa > ca) & (ca < 0.5)
                rgb2 = cc['clear']['rgb'].copy()
                rgb2[grow] = cc['clear']['raw'][grow]
                cc['clear']['rgb'] = rgb2
                cc['clear']['alpha'] = np.maximum(ca, sa)
            else:
                # the outline is the Smoke one; its edge pixels take the clear photo's frost a few pixels inside it
                din = ndi.distance_transform_edt(cc['smoke']['case'])
                zone = (din >= 4) & (din <= 9)
                _, (iy, ix) = ndi.distance_transform_edt(~zone, return_indices=True)
                rgb2 = cc['clear']['raw'].copy()
                rgb2[din <= 3.5] = cc['clear']['raw'][iy, ix][din <= 3.5]
                cc['clear']['rgb'], cc['clear']['alpha'] = rgb2, sa
        ref = cc[base[0]]['meas']
        if refphoto == 'scale':
            # a second phone of the listing sits exactly where the first one does (one mask for both)
            place = cut(base[0], VIEW_N) if fk in MASK_OF else cc[base[0]]
            low, ref = place['low'], place['meas']
            s = STAGE_PX_PER_MM / PHOTO_PX_PER_MM.get((key, colors[0]), VENDOR_PX_PER_MM)
            x0, y0, x1, y1 = ref['bbox']
            cx = (x0 + x1) / 2 if key in BOX_CENTRE else low['cx']
            tx, ty = W / 2 - s * cx, H / 2 - s * ref['cy']
        else:
            ra = np.asarray(stage_rgba(CASES / refphoto))[..., 3] / 255.0
            tm = body_measure(ra)
            k, dx, dy = TWEAK.get(fk, (1, 0, 0))
            s = tm['h'] / ref['h'] * k
            tx = tm['cx'] - s * ref['cx'] + dx
            ty = tm['cy'] - s * ref['cy'] + dy
        soft = warp_mask(pm, s, tx, ty)
        if key not in FIRST:
            soft = ndi.gaussian_filter(soft, SMOOTH_PX)
        A = view_mask_alpha(soft)
        raw_area, clipped = int((A >= 128).sum()), 0
        if fk in CLIP_TO_CLEAR:
            clip = np.asarray(Image.open(MASKS / CLIP_TO_CLEAR[fk]).convert('LA'))[..., 1]
            clipped = int(((A >= 128) & (clip < 128)).sum())
            A = np.minimum(A, clip)
        mn = mask_name(fk, key, colors)
        if mn in want and fk not in MASK_OF:
            files[mn] = png_bytes(A)
        row = dict(key=key, frame=fk, models=models, placed=refphoto, shot=shot, colors=colors, mask=mn,
                   scale=round(s, 5), offset=[round(tx, 2), round(ty, 2)], vendor_bbox=ref['bbox'],
                   stage_px_per_mm=round(s * PHOTO_PX_PER_MM.get((key, colors[0]), VENDOR_PX_PER_MM), 4),
                   smoke_clear_panel_iou=None if agree is None else round(agree, 4),
                   panel_px=raw_area, clipped_to_clear_px=clipped, photos={})
        for c in colors:
            fn = 'rated-%s-%s.webp' % (fk, c)
            d = cc[c]
            rgba = warp_rgba(d['rgb'], d['alpha'], s, tx, ty)
            if fn in want:
                files[fn] = webp_bytes(rgba)
            nm = body_measure(rgba[..., 3] / 255.0)
            # how much of the mask this photo's own panel covers, and how far its edge is outside the mask
            own = warp_mask(d['panel'], s, tx, ty) >= 0.5
            win = A >= 128
            edge = win & ~ndi.binary_erosion(win)
            dist = ndi.distance_transform_edt(own)[edge]
            row['photos'][c] = dict(file=fn, bbox=nm['bbox'], bodyL=nm['bodyL'], bodyR=nm['bodyR'],
                                    mask_inside_panel=round(float((own & win).sum() / win.sum()), 6),
                                    panel_edge_outside_mask_px=[round(float(v), 1) for v in np.percentile(dist, [0, 1, 50, 99, 100])],
                                    icon_removed=d['icon'])
        yy, xx = np.where(A >= 128)
        row['panel_bbox'] = [int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1]
        report[fk if (key, colors[0]) not in OWN_MASK else fk + '-' + colors[0]] = row
    return key, files, report


def target(name, root=None):
    d = ('masks' if name.startswith('view-') else 'cases')
    return (root / d / name) if root else ((MASKS if d == 'masks' else CASES) / name)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', type=Path, default=R.parent / 'vendor-photos' / 'cck-phantom3')
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--verify', action='store_true')
    ap.add_argument('--out', type=Path)
    ap.add_argument('--report', type=Path)
    ap.add_argument('--held', action='store_true', help='also build the held back photos')
    ap.add_argument('--jobs', type=int, default=max(1, (os.cpu_count() or 2) // 2))
    a = ap.parse_args()
    keys = a.only or list(LISTINGS)
    WITH_HELD[0] = a.held
    names = expected(a.src, keys)
    everything = a.verify or a.out or a.report
    want = set(names) if everything else {n for n in names if not target(n).exists()}
    todo = [k for k in keys if any(names[n] == k or names[n].startswith(k + '-') for n in want)]
    report, bad, written, total = {}, [], 0, 0
    if a.out:
        for d in ('cases', 'masks'):
            (a.out / d).mkdir(parents=True, exist_ok=True)
    with ProcessPoolExecutor(max_workers=a.jobs) as ex:
        for key, files, rep in ex.map(build_listing, [a.src] * len(todo), todo, [want] * len(todo), [a.held] * len(todo)):
            report.update(rep)
            for n, data in sorted(files.items()):
                dest = target(n, a.out)
                if a.verify:
                    if not dest.exists() or dest.read_bytes() != data:
                        bad.append(n)
                    continue
                if not a.out and dest.exists():
                    continue
                dest.write_bytes(data)
                written += 1; total += len(data)
            for fk, r in rep.items():
                print(fk, 's=%.4f' % r['scale'], 'panel', r['panel_bbox'], 'clipped', r['clipped_to_clear_px'],
                      {c: (p['bbox'], p['mask_inside_panel']) for c, p in r['photos'].items()}, flush=True)
    if a.report:
        a.report.write_text(json.dumps(report, indent=1))
    if a.verify:
        print('FAIL bytes differ: ' + ', '.join(bad) if bad else 'PASS %d files rebuild to the same bytes' % len(want))
        return 1 if bad else 0
    print('wrote %d files, %.2f MB' % (written, total / 1e6))
    return 0


if __name__ == '__main__':
    sys.exit(main())
