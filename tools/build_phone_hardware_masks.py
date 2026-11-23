"""Trace the photographed MagSafe hardware for display-only phone recoloring.

The two bright, connected components within the ring/bar region are the case's
magnet ring and alignment bar. Preserve them, including a one-pixel edge, instead
of applying the simulated phone finish to the case. Never used for print masks.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
result = {}
for size, center_y in [('pm', 804), ('p', 833.5)]:
    a = np.array(Image.open(ROOT / f'assets/cases/i17{size}-silver.webp').convert('RGB'))
    assert a.shape[:2] == (1500, 1250)
    y, x = np.indices(a.shape[:2])
    radius = np.sqrt((x - 624) ** 2 + (y - center_y) ** 2)
    region = (((radius > 140) & (radius < 230) & (y > 550) & (y < 1015)) |
              ((x > 585) & (x < 662.5) & (y > 1035) & (y < 1225)))
    labels, _ = ndimage.label((a.mean(axis=2) > 205) & region)
    counts = np.bincount(labels.ravel())
    counts[0] = 0
    ids = counts.argsort()[-2:]
    assert counts[ids].min() > 5000
    mask = ndimage.binary_dilation(ndimage.binary_fill_holes(np.isin(labels, ids)))
    rows = []
    for row_y in np.flatnonzero(mask.any(axis=1)):
        edges = np.flatnonzero(np.diff(np.r_[False, mask[row_y], False]))
        row = [int(row_y * 2), int((row_y + 1) * 2), *[int(v * 2) for v in edges]]
        if rows and rows[-1][1] == row[0] and rows[-1][2:] == row[2:]:
            rows[-1][1] = row[1]
        else:
            rows.append(row)
    result[size] = rows
    print(size, 'preserved hardware pixels:', int(mask.sum()))
(ROOT / 'assets/cases/phone-hardware-masks.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
