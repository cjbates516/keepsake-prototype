# Rated Case photos

Product photos for the "See photos" viewer of the Rated Case in the editor (`assets/rated-gallery.js`).
Built by `python3 tools/build_rated_photos.py` from listing images saved Nov 20 2026 from
shop.balajibrands.com (search "CCKP3", the blank case we print on), kept outside the repo in
`vendor-photos/cck-phantom3/` (3000 x 3000 JPEG, never modified). To be replaced by photos of our own printed
cases later. Served file names, captions and alt text never name the vendor or brand.

Each listing (phone + rim) is trimmed to one 5:6 frame (the editor preview aspect) sized to its tallest view, so
the case fills the frame at one scale across its views, on the photos' own white background. Large images are
1000 x 1200 WebP (quality 84), thumbnails 200 x 240. Views in order: front and back (shot 1), side views (3, 4),
back (12, or 2 when 12 is missing), front (5). Rims follow the site kit (`KITS[model].rated.colors`).

## Phones

| Phone | Photos | Rims | Shown on a similar phone |
|---|---|---|---|
| iPhone 13 | iphse25 | Smoke Frost, Clear Frost | yes |
| iPhone 14 | iphse25 | Smoke Frost, Clear Frost | yes |
| iPhone 15 | iphse25 | Smoke Frost, Clear Frost | yes |
| iPhone 14 Pro | iph14pro | Smoke Frost, Clear Frost |  |
| iPhone 14 Pro Max | iph14promax | Smoke Frost, Clear Frost |  |
| iPhone 15 Pro | iph15pro | Smoke Frost, Clear Frost |  |
| iPhone 15 Pro Max | iph15pmx | Smoke Frost, Clear Frost |  |
| iPhone 16 | iph16 | Clear Frost |  |
| iPhone 16 Pro | iph16pro | Smoke Frost, Clear Frost |  |
| iPhone 16 Pro Max | iph16pmx | Clear Frost |  |
| iPhone 17 | iph17 | Smoke Frost, Clear Frost |  |
| iPhone Air | iph17a | Smoke Frost, Clear Frost |  |
| iPhone 17 Pro | iph17pro | Smoke Frost, Clear Frost |  |
| iPhone 18 Pro | iph17pro | Smoke Frost, Clear Frost | yes |
| iPhone 17 Pro Max | iph17pmx | Smoke Frost, Clear Frost |  |
| iPhone 18 Pro Max | iph17pmx | Smoke Frost, Clear Frost | yes |
| iPhone 14 Plus | iph14max | Clear Frost | yes |
| iPhone 15 Plus | iph14max | Clear Frost |  |
| Samsung Galaxy S26 | samgs26 | Clear Frost |  |
| Samsung Galaxy S26 Ultra | samgs26u | Clear Frost |  |

## Source file to output file

| Source (vendor-photos/cck-phantom3) | Output (assets/cases/rated-photos) |
|---|---|
| cckp3-iph14max-media-clear-frost-1.jpg | rp-iph14max-clear-angle.webp |
| cckp3-iph14max-media-clear-frost-3.jpg | rp-iph14max-clear-side.webp |
| cckp3-iph14max-media-clear-frost-4.jpg | rp-iph14max-clear-side2.webp |
| cckp3-iph14max-media-clear-frost-12.jpg | rp-iph14max-clear-back.webp |
| cckp3-iph14max-media-clear-frost-5.jpg | rp-iph14max-clear-front.webp |
| cckp3-iph14pro-media-smoke-frost-1.jpg | rp-iph14pro-smoke-angle.webp |
| cckp3-iph14pro-media-smoke-frost-3.jpg | rp-iph14pro-smoke-side.webp |
| cckp3-iph14pro-media-smoke-frost-4.jpg | rp-iph14pro-smoke-side2.webp |
| cckp3-iph14pro-media-smoke-frost-12.jpg | rp-iph14pro-smoke-back.webp |
| cckp3-iph14pro-media-smoke-frost-5.jpg | rp-iph14pro-smoke-front.webp |
| cckp3-iph14pro-media-clear-frost-1.jpg | rp-iph14pro-clear-angle.webp |
| cckp3-iph14pro-media-clear-frost-3.jpg | rp-iph14pro-clear-side.webp |
| cckp3-iph14pro-media-clear-frost-4.jpg | rp-iph14pro-clear-side2.webp |
| cckp3-iph14pro-media-clear-frost-12.jpg | rp-iph14pro-clear-back.webp |
| cckp3-iph14pro-media-clear-frost-5.jpg | rp-iph14pro-clear-front.webp |
| cckp3-iph14promax-media-smoke-frost-1.jpg | rp-iph14promax-smoke-angle.webp |
| cckp3-iph14promax-media-smoke-frost-3.jpg | rp-iph14promax-smoke-side.webp |
| cckp3-iph14promax-media-smoke-frost-4.jpg | rp-iph14promax-smoke-side2.webp |
| cckp3-iph14promax-media-smoke-frost-12.jpg | rp-iph14promax-smoke-back.webp |
| cckp3-iph14promax-media-smoke-frost-5.jpg | rp-iph14promax-smoke-front.webp |
| cckp3-iph14promax-media-clear-frost-1.jpg | rp-iph14promax-clear-angle.webp |
| cckp3-iph14promax-media-clear-frost-3.jpg | rp-iph14promax-clear-side.webp |
| cckp3-iph14promax-media-clear-frost-4.jpg | rp-iph14promax-clear-side2.webp |
| cckp3-iph14promax-media-clear-frost-12.jpg | rp-iph14promax-clear-back.webp |
| cckp3-iph14promax-media-clear-frost-5.jpg | rp-iph14promax-clear-front.webp |
| cckp3-iph15pmx-media-smoke-frost-1.jpg | rp-iph15pmx-smoke-angle.webp |
| cckp3-iph15pmx-media-smoke-frost-3.jpg | rp-iph15pmx-smoke-side.webp |
| cckp3-iph15pmx-media-smoke-frost-4.jpg | rp-iph15pmx-smoke-side2.webp |
| cckp3-iph15pmx-media-smoke-frost-12.jpg | rp-iph15pmx-smoke-back.webp |
| cckp3-iph15pmx-media-smoke-frost-5.jpg | rp-iph15pmx-smoke-front.webp |
| cckp3-iph15pmx-media-clear-frost-1.jpg | rp-iph15pmx-clear-angle.webp |
| cckp3-iph15pmx-media-clear-frost-3.jpg | rp-iph15pmx-clear-side.webp |
| cckp3-iph15pmx-media-clear-frost-4.jpg | rp-iph15pmx-clear-side2.webp |
| cckp3-iph15pmx-media-clear-frost-12.jpg | rp-iph15pmx-clear-back.webp |
| cckp3-iph15pmx-media-clear-frost-5.jpg | rp-iph15pmx-clear-front.webp |
| cckp3-iph15pro-media-smoke-frost-1.jpg | rp-iph15pro-smoke-angle.webp |
| cckp3-iph15pro-media-smoke-frost-3.jpg | rp-iph15pro-smoke-side.webp |
| cckp3-iph15pro-media-smoke-frost-4.jpg | rp-iph15pro-smoke-side2.webp |
| cckp3-iph15pro-media-smoke-frost-12.jpg | rp-iph15pro-smoke-back.webp |
| cckp3-iph15pro-media-smoke-frost-5.jpg | rp-iph15pro-smoke-front.webp |
| cckp3-iph15pro-media-clear-frost-1.jpg | rp-iph15pro-clear-angle.webp |
| cckp3-iph15pro-media-clear-frost-3.jpg | rp-iph15pro-clear-side.webp |
| cckp3-iph15pro-media-clear-frost-4.jpg | rp-iph15pro-clear-side2.webp |
| cckp3-iph15pro-media-clear-frost-12.jpg | rp-iph15pro-clear-back.webp |
| cckp3-iph15pro-media-clear-frost-5.jpg | rp-iph15pro-clear-front.webp |
| cckp3-iph16-media-clear-frost-1.jpg | rp-iph16-clear-angle.webp |
| cckp3-iph16-media-clear-frost-3.jpg | rp-iph16-clear-side.webp |
| cckp3-iph16-media-clear-frost-4.jpg | rp-iph16-clear-side2.webp |
| cckp3-iph16-media-clear-frost-12.jpg | rp-iph16-clear-back.webp |
| cckp3-iph16-media-clear-frost-5.jpg | rp-iph16-clear-front.webp |
| cckp3-iph16pmx-media-clear-frost-1.jpg | rp-iph16pmx-clear-angle.webp |
| cckp3-iph16pmx-media-clear-frost-3.jpg | rp-iph16pmx-clear-side.webp |
| cckp3-iph16pmx-media-clear-frost-4.jpg | rp-iph16pmx-clear-side2.webp |
| cckp3-iph16pmx-media-clear-frost-12.jpg | rp-iph16pmx-clear-back.webp |
| cckp3-iph16pmx-media-clear-frost-5.jpg | rp-iph16pmx-clear-front.webp |
| cckp3-iph16pro-media-smoke-frost-1.jpg | rp-iph16pro-smoke-angle.webp |
| cckp3-iph16pro-media-smoke-frost-3.jpg | rp-iph16pro-smoke-side.webp |
| cckp3-iph16pro-media-smoke-frost-4.jpg | rp-iph16pro-smoke-side2.webp |
| cckp3-iph16pro-media-smoke-frost-12.jpg | rp-iph16pro-smoke-back.webp |
| cckp3-iph16pro-media-smoke-frost-5.jpg | rp-iph16pro-smoke-front.webp |
| cckp3-iph16pro-media-clear-frost-1.jpg | rp-iph16pro-clear-angle.webp |
| cckp3-iph16pro-media-clear-frost-3.jpg | rp-iph16pro-clear-side.webp |
| cckp3-iph16pro-media-clear-frost-4.jpg | rp-iph16pro-clear-side2.webp |
| cckp3-iph16pro-media-clear-frost-12.jpg | rp-iph16pro-clear-back.webp |
| cckp3-iph16pro-media-clear-frost-5.jpg | rp-iph16pro-clear-front.webp |
| cckp3-iph17-media-smoke-frost-1.jpg | rp-iph17-smoke-angle.webp |
| cckp3-iph17-media-smoke-frost-3.jpg | rp-iph17-smoke-side.webp |
| cckp3-iph17-media-smoke-frost-4.jpg | rp-iph17-smoke-side2.webp |
| cckp3-iph17-media-smoke-frost-12.jpg | rp-iph17-smoke-back.webp |
| cckp3-iph17-media-smoke-frost-5.jpg | rp-iph17-smoke-front.webp |
| cckp3-iph17-media-clear-frost-1.jpg | rp-iph17-clear-angle.webp |
| cckp3-iph17-media-clear-frost-3.jpg | rp-iph17-clear-side.webp |
| cckp3-iph17-media-clear-frost-4.jpg | rp-iph17-clear-side2.webp |
| cckp3-iph17-media-clear-frost-12.jpg | rp-iph17-clear-back.webp |
| cckp3-iph17-media-clear-frost-5.jpg | rp-iph17-clear-front.webp |
| cckp3-iph17a-media-smoke-frost-1.jpg | rp-iph17a-smoke-angle.webp |
| cckp3-iph17a-media-smoke-frost-3.jpg | rp-iph17a-smoke-side.webp |
| cckp3-iph17a-media-smoke-frost-4.jpg | rp-iph17a-smoke-side2.webp |
| cckp3-iph17a-media-smoke-frost-12.jpg | rp-iph17a-smoke-back.webp |
| cckp3-iph17a-media-smoke-frost-5.jpg | rp-iph17a-smoke-front.webp |
| cckp3-iph17a-media-clear-frost-1.jpg | rp-iph17a-clear-angle.webp |
| cckp3-iph17a-media-clear-frost-3.jpg | rp-iph17a-clear-side.webp |
| cckp3-iph17a-media-clear-frost-4.jpg | rp-iph17a-clear-side2.webp |
| cckp3-iph17a-media-clear-frost-12.jpg | rp-iph17a-clear-back.webp |
| cckp3-iph17a-media-clear-frost-5.jpg | rp-iph17a-clear-front.webp |
| cckp3-iph17pmx-media-smoke-frost-1.jpg | rp-iph17pmx-smoke-angle.webp |
| cckp3-iph17pmx-media-smoke-frost-3.jpg | rp-iph17pmx-smoke-side.webp |
| cckp3-iph17pmx-media-smoke-frost-4.jpg | rp-iph17pmx-smoke-side2.webp |
| cckp3-iph17pmx-media-smoke-frost-12.jpg | rp-iph17pmx-smoke-back.webp |
| cckp3-iph17pmx-media-smoke-frost-5.jpg | rp-iph17pmx-smoke-front.webp |
| cckp3-iph17pmx-media-clear-frost-1.jpg | rp-iph17pmx-clear-angle.webp |
| cckp3-iph17pmx-media-clear-frost-3.jpg | rp-iph17pmx-clear-side.webp |
| cckp3-iph17pmx-media-clear-frost-4.jpg | rp-iph17pmx-clear-side2.webp |
| cckp3-iph17pmx-media-clear-frost-12.jpg | rp-iph17pmx-clear-back.webp |
| cckp3-iph17pmx-media-clear-frost-5.jpg | rp-iph17pmx-clear-front.webp |
| cckp3-iph17pro-media-smoke-frost-1.jpg | rp-iph17pro-smoke-angle.webp |
| cckp3-iph17pro-media-smoke-frost-3.jpg | rp-iph17pro-smoke-side.webp |
| cckp3-iph17pro-media-smoke-frost-4.jpg | rp-iph17pro-smoke-side2.webp |
| cckp3-iph17pro-media-smoke-frost-12.jpg | rp-iph17pro-smoke-back.webp |
| cckp3-iph17pro-media-smoke-frost-5.jpg | rp-iph17pro-smoke-front.webp |
| cckp3-iph17pro-media-clear-frost-1.jpg | rp-iph17pro-clear-angle.webp |
| cckp3-iph17pro-media-clear-frost-3.jpg | rp-iph17pro-clear-side.webp |
| cckp3-iph17pro-media-clear-frost-4.jpg | rp-iph17pro-clear-side2.webp |
| cckp3-iph17pro-media-clear-frost-12.jpg | rp-iph17pro-clear-back.webp |
| cckp3-iph17pro-media-clear-frost-5.jpg | rp-iph17pro-clear-front.webp |
| cckp3-iphse25-media-smoke-frost-1.jpg | rp-iphse25-smoke-angle.webp |
| cckp3-iphse25-media-smoke-frost-3.jpg | rp-iphse25-smoke-side.webp |
| cckp3-iphse25-media-smoke-frost-4.jpg | rp-iphse25-smoke-side2.webp |
| cckp3-iphse25-media-smoke-frost-12.jpg | rp-iphse25-smoke-back.webp |
| cckp3-iphse25-media-smoke-frost-5.jpg | rp-iphse25-smoke-front.webp |
| cckp3-iphse25-media-clear-frost-1.jpg | rp-iphse25-clear-angle.webp |
| cckp3-iphse25-media-clear-frost-3.jpg | rp-iphse25-clear-side.webp |
| cckp3-iphse25-media-clear-frost-4.jpg | rp-iphse25-clear-side2.webp |
| cckp3-iphse25-media-clear-frost-12.jpg | rp-iphse25-clear-back.webp |
| cckp3-iphse25-media-clear-frost-5.jpg | rp-iphse25-clear-front.webp |
| cckp3-samgs26-media-clear-frost-1.jpg | rp-samgs26-clear-angle.webp |
| cckp3-samgs26-media-clear-frost-3.jpg | rp-samgs26-clear-side.webp |
| cckp3-samgs26-media-clear-frost-4.jpg | rp-samgs26-clear-side2.webp |
| cckp3-samgs26-media-clear-frost-12.jpg | rp-samgs26-clear-back.webp |
| cckp3-samgs26-media-clear-frost-5.jpg | rp-samgs26-clear-front.webp |
| cckp3-samgs26u-media-clear-frost-1.jpg | rp-samgs26u-clear-angle.webp |
| cckp3-samgs26u-media-clear-frost-3.jpg | rp-samgs26u-clear-side.webp |
| cckp3-samgs26u-media-clear-frost-4.jpg | rp-samgs26u-clear-side2.webp |
| cckp3-samgs26u-media-clear-frost-12.jpg | rp-samgs26u-clear-back.webp |
| cckp3-samgs26u-media-clear-frost-5.jpg | rp-samgs26u-clear-front.webp |
| cckp3-samgs24-media-clear-frost-1.jpg | rp-samgs24-clear-angle.webp |
| cckp3-motgply25-media-clear-frost-5.jpg | rp-motgply25-clear-front.webp |
| cckp3-motgstl26-media-clear-frost-5.jpg | rp-motgstl26-clear-front.webp |
| cckp3-samgs25u-media-smoke-frost-1.jpg | rp-samgs25u-smoke-angle.webp |

Each output also has a `-t.webp` thumbnail.

## Exclusions

| Source | Reason |
|---|---|
| cckp3-samgs24-media-smoke-frost-2.jpg | an app icon logo is printed on the white back |
| cckp3-iph18fld-media-smoke-frost-1.jpg | the lock screen shows a large clock (text); no site kit for this phone |
| cckp3-iph18fld-media-smoke-frost-5.jpg | the lock screen shows a large clock (text); no site kit for this phone |
| cckp3-iph18fld-media-smoke-frost-{2,3,4}.jpg | foldable listing with no site kit; not used anywhere |
| cckp3-motgply25-media-clear-frost-{1,2,3,4,12}.jpg, cckp3-motgstl26-media-clear-frost-{1,2,3,4,12}.jpg, cckp3-motgpwr25-* | the camera lens rings carry printed text (megapixels, a sensor brand); only the front view (shot 5) of the moto g play and moto g stylus is used, and none of the moto g power (its cream front adds no new color) |
| every listing: shot 2 | near duplicate of shot 12 (straight back); used only when shot 12 is missing (never, today) |

Checked by eye on a contact sheet of every output (logos, text, people, wrong phone, wrong rim). Phone wallpapers
are the phones' own screens. The Galaxy wallpapers are Samsung's abstract default artwork, not a logo.
