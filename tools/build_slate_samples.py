"""Composite the two marketing photographs onto the photographed supplier slate."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ASSETS = Path(__file__).resolve().parents[1] / 'assets/photos/slates'
RESAMPLE = Image.Resampling.LANCZOS


def edge_positions(lines):
    # A light spot on a chipped edge can have no dark pixels. Interpolate the
    # boundary from its neighbors instead of punching a slit through the stone.
    dark = lines[:, :18] < 164
    found = np.flatnonzero(dark.any(axis=1))
    if not len(found):
        raise ValueError('Could not locate the slate perimeter')
    positions = np.interp(np.arange(len(lines)), found, dark[found].argmax(axis=1))
    padded = np.pad(positions, 5, mode='edge')
    return np.median(np.lib.stride_tricks.sliding_window_view(padded, 11), axis=1)


def slate_masks(stone):
    value = np.asarray(stone.convert('L'))
    height, width = value.shape
    y, x = np.indices(value.shape)
    distance = np.minimum.reduce([
        x - edge_positions(value)[:, None],
        width - 1 - x - edge_positions(value[:, ::-1])[:, None],
        y - edge_positions(value.T)[None, :],
        height - 1 - y - edge_positions(value.T[:, ::-1])[None, :],
    ])
    silhouette = Image.fromarray((255 * np.clip(distance + 1, 0, 1)).astype('uint8'))
    # Only the chipped perimeter contributes supplier pixels. The measurement
    # lettering and every other interior pixel must be replaced by the photo.
    interior = np.clip((distance - 2) / 6, 0, 1)
    ink = Image.fromarray((255 * interior).astype('uint8'))
    assert silhouette.crop((24, 24, width - 24, height - 24)).getextrema() == (255, 255)
    assert ink.crop((26, 26, width - 26, height - 26)).getextrema() == (255, 255)
    return silhouette, ink


def build(name, source, landscape, focus):
    stone = Image.open(ASSETS / 'supplier-8x10-details.jpg').convert('RGB').crop((150, 271, 600, 854))
    silhouette, ink = slate_masks(stone)
    if landscape:
        stone, silhouette, ink = (im.transpose(Image.Transpose.ROTATE_90) for im in (stone, silhouette, ink))
    size = (1156, 892) if landscape else (892, 1156)
    stone, silhouette, ink = (im.resize(size, RESAMPLE) for im in (stone, silhouette, ink))
    photo = ImageOps.fit(Image.open(ASSETS / source).convert('RGB'), size, RESAMPLE, centering=focus)
    product = Image.composite(photo, stone, ink)
    canvas = Image.new('RGB', (size[0] + 96, size[1] + 96), '#faf8f2')
    shadow = Image.new('L', canvas.size)
    shadow.paste(silhouette, (48, 54))
    shadow = shadow.filter(ImageFilter.GaussianBlur(9)).point(lambda v: v // 5)
    canvas.paste('#292724', (0, 0, *canvas.size), shadow)
    canvas.paste(product, (48, 48), silhouette)
    canvas.save(ASSETS / (name + '-slate-preview.jpg'), quality=92, optimize=True)


if __name__ == '__main__':
    build('family', 'family-outdoors.jpg', True, (.5, .45))
    build('grandparents', 'grandparents.jpg', False, (.5, .31))
