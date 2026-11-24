# Rated Case photos

Product photos for the "See photos" viewer of the Rated Case in the editor (`assets/rated-gallery.js`).
Built by `python3 tools/build_rated_photos.py` from listing images saved Nov 20 to 23 2026 from
shop.balajibrands.com (search "CCKP3", the blank case we print on), kept outside the repo in
`vendor-photos/cck-phantom3/` (3000 x 3000 JPEG, never modified). To be replaced by photos of our own printed
cases later. Served file names, captions and alt text never name the vendor or brand. The white panel in the photos
is the print area of the blank, not a white back.

Each listing (phone + rim) is trimmed to one 5:6 frame (the editor preview aspect) sized to its tallest view, so
the case fills the frame at one scale across its views, on the photos' own white background. Large images are
1000 x 1200 WebP (quality 84, stepped down to as low as 72 for a photo that would pass 90 KB), the same at
1600 x 1920 (`-hd`, quality 80, as low as 68 past 180 KB) for tablets and high density desktops, thumbnails
200 x 240. Views in order: front and back (shot 1), side views (3, 4),
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
| iPhone 16 | iph16 | Smoke Frost, Clear Frost |  |
| iPhone 16 Pro | iph16pro | Smoke Frost, Clear Frost |  |
| iPhone 16 Pro Max | iph16pmx | Smoke Frost, Clear Frost |  |
| iPhone 17 | iph17 | Smoke Frost, Clear Frost |  |
| iPhone Air | iph17a | Smoke Frost, Clear Frost |  |
| iPhone 17 Pro | iph17pro | Smoke Frost, Clear Frost |  |
| iPhone 18 Pro | iph17pro | Smoke Frost, Clear Frost | yes |
| iPhone 17 Pro Max | iph17pmx | Smoke Frost, Clear Frost |  |
| iPhone 18 Pro Max | iph17pmx | Smoke Frost, Clear Frost | yes |
| iPhone 14 Plus | iph14max | Clear Frost | yes |
| iPhone 15 Plus | iph14max | Clear Frost |  |
| Samsung Galaxy S26 | samgs26 | Smoke Frost, Clear Frost |  |
| Samsung Galaxy S26 Ultra | samgs26u | Smoke Frost, Clear Frost |  |
| iPhone 13 Pro | iph2161p | Smoke Frost, Clear Frost |  |
| iPhone 13 Pro Max | iph2167 | Smoke Frost, Clear Frost |  |
| iPhone 16 Plus | iph16plus | Clear Frost |  |
| iPhone 12 | iph1261 | Clear Frost |  |
| iPhone 12 Pro | iph1261 | Clear Frost | yes |
| Samsung Galaxy S26 Plus | samgs26pl | Smoke Frost, Clear Frost |  |
| iPhone Duo | iph18fld | Smoke Frost |  |
| iPhone 17e | iphse25 | Smoke Frost, Clear Frost |  |
| iPhone 16e | iphse25 | Smoke Frost, Clear Frost |  |
| iPhone 11 | iph61 | Clear Frost |  |
| Samsung Galaxy S26 FE | samgs26fe | Clear Frost |  |
| Samsung Galaxy S25 Ultra | samgs25u | Smoke Frost, Clear Frost |  |
| Samsung Galaxy S25 Plus | samgs26pl | Smoke Frost, Clear Frost | yes |
| Samsung Galaxy S25 | samgs24 | Smoke Frost, Clear Frost |  |
| Samsung Galaxy S25 FE | samgs25fe | Clear Frost |  |
| Samsung Galaxy S24 Plus | samgs26pl | Smoke Frost, Clear Frost | yes |
| Samsung Galaxy S24 | samgs24 | Smoke Frost, Clear Frost | yes |
| Samsung Galaxy S24 FE | samgs24fe | Clear Frost |  |
| Samsung Galaxy A37 | samga37 | Clear Frost |  |
| Samsung Galaxy A36 | samga37 | Clear Frost | yes |
| Samsung Galaxy A17 | samga17 | Clear Frost |  |
| Google Pixel 11 Pro XL | googpl11pxl | Clear Frost |  |
| Google Pixel 11 Pro | googpl11 | Clear Frost |  |
| Google Pixel 11 | googpl11p11 | Clear Frost |  |
| Google Pixel 10 Pro XL | googpl10pxl | Clear Frost |  |
| Google Pixel 10 Pro | googpl10 | Clear Frost |  |
| Google Pixel 10 | googpl10p10 | Clear Frost |  |
| Motorola moto g stylus 2026 | motgstl26 | Smoke Frost, Clear Frost |  |
| Motorola moto g stylus 2025 | motgstl26 | Smoke Frost, Clear Frost | yes |
| Motorola moto g power 2026 | motgpwr25 | Smoke Frost, Clear Frost |  |
| Motorola moto g power 2025 | motgpwr25 | Smoke Frost, Clear Frost | yes |
| Motorola moto g play 2026 | motgply25 | Smoke Frost, Clear Frost |  |
| Motorola moto g 2026 | motgply25 | Smoke Frost, Clear Frost | yes |
| Motorola moto g 2025 | motgply25 | Smoke Frost, Clear Frost | yes |

A phone on a blank photographed with another phone (a different camera) reads "Photos show this case on a similar phone."
The Pixel 10 and Pixel 11 have their own photos (shots 101 to 105 of the listings they share with the Pro). Not in the
table: the Galaxy S24 Ultra (coming soon, no usable photo).

samgs24 Smoke Frost: the only Smoke Frost photo carries an app icon, so the viewer shows the Clear Frost photos and says so.
samgs24u Smoke Frost: the only photo carries an app icon, and the phone is listed as coming soon.

## Source file to output file

| Source (vendor-photos/cck-phantom3) | Output (assets/cases/rated-photos) | WebP quality (large, hd) |
|---|---|---|
| cckp3-googpl10-media-clear-frost-3.jpg | rp-googpl10-clear-side.webp | 84, 80 |
| cckp3-googpl10-media-clear-frost-12.jpg | rp-googpl10-clear-back.webp | 84, 80 |
| cckp3-googpl10-media-clear-frost-5.jpg | rp-googpl10-clear-front.webp | 84, 80 |
| cckp3-googpl10-media-clear-frost-103.jpg | rp-googpl10p10-clear-side.webp | 84, 80 |
| cckp3-googpl10-media-clear-frost-102.jpg | rp-googpl10p10-clear-back.webp | 84, 80 |
| cckp3-googpl10-media-clear-frost-105.jpg | rp-googpl10p10-clear-front.webp | 84, 80 |
| cckp3-googpl10pxl-media-clear-frost-3.jpg | rp-googpl10pxl-clear-side.webp | 84, 80 |
| cckp3-googpl10pxl-media-clear-frost-12.jpg | rp-googpl10pxl-clear-back.webp | 84, 80 |
| cckp3-googpl10pxl-media-clear-frost-5.jpg | rp-googpl10pxl-clear-front.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-1.jpg | rp-googpl11-clear-angle.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-3.jpg | rp-googpl11-clear-side.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-4.jpg | rp-googpl11-clear-side2.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-12.jpg | rp-googpl11-clear-back.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-5.jpg | rp-googpl11-clear-front.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-101.jpg | rp-googpl11p11-clear-angle.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-103.jpg | rp-googpl11p11-clear-side.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-104.jpg | rp-googpl11p11-clear-side2.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-102.jpg | rp-googpl11p11-clear-back.webp | 84, 80 |
| cckp3-googpl11-media-clear-frost-105.jpg | rp-googpl11p11-clear-front.webp | 84, 80 |
| cckp3-googpl11pxl-media-clear-frost-1.jpg | rp-googpl11pxl-clear-angle.webp | 84, 80 |
| cckp3-googpl11pxl-media-clear-frost-3.jpg | rp-googpl11pxl-clear-side.webp | 84, 80 |
| cckp3-googpl11pxl-media-clear-frost-4.jpg | rp-googpl11pxl-clear-side2.webp | 84, 80 |
| cckp3-googpl11pxl-media-clear-frost-12.jpg | rp-googpl11pxl-clear-back.webp | 84, 80 |
| cckp3-googpl11pxl-media-clear-frost-5.jpg | rp-googpl11pxl-clear-front.webp | 84, 80 |
| cckp3-iph1261-media-clear-frost-1.jpg | rp-iph1261-clear-angle.webp | 84, 80 |
| cckp3-iph1261-media-clear-frost-3.jpg | rp-iph1261-clear-side.webp | 84, 80 |
| cckp3-iph1261-media-clear-frost-4.jpg | rp-iph1261-clear-side2.webp | 84, 80 |
| cckp3-iph1261-media-clear-frost-2.jpg | rp-iph1261-clear-back.webp | 84, 80 |
| cckp3-iph1261-media-clear-frost-5.jpg | rp-iph1261-clear-front.webp | 84, 80 |
| cckp3-iph14max-media-clear-frost-1.jpg | rp-iph14max-clear-angle.webp | 84, 80 |
| cckp3-iph14max-media-clear-frost-3.jpg | rp-iph14max-clear-side.webp | 84, 80 |
| cckp3-iph14max-media-clear-frost-4.jpg | rp-iph14max-clear-side2.webp | 84, 80 |
| cckp3-iph14max-media-clear-frost-12.jpg | rp-iph14max-clear-back.webp | 84, 80 |
| cckp3-iph14max-media-clear-frost-5.jpg | rp-iph14max-clear-front.webp | 84, 80 |
| cckp3-iph14pro-media-smoke-frost-1.jpg | rp-iph14pro-smoke-angle.webp | 84, 80 |
| cckp3-iph14pro-media-smoke-frost-3.jpg | rp-iph14pro-smoke-side.webp | 84, 80 |
| cckp3-iph14pro-media-smoke-frost-4.jpg | rp-iph14pro-smoke-side2.webp | 84, 80 |
| cckp3-iph14pro-media-smoke-frost-12.jpg | rp-iph14pro-smoke-back.webp | 84, 80 |
| cckp3-iph14pro-media-smoke-frost-5.jpg | rp-iph14pro-smoke-front.webp | 84, 80 |
| cckp3-iph14pro-media-clear-frost-1.jpg | rp-iph14pro-clear-angle.webp | 84, 80 |
| cckp3-iph14pro-media-clear-frost-3.jpg | rp-iph14pro-clear-side.webp | 84, 80 |
| cckp3-iph14pro-media-clear-frost-4.jpg | rp-iph14pro-clear-side2.webp | 84, 80 |
| cckp3-iph14pro-media-clear-frost-12.jpg | rp-iph14pro-clear-back.webp | 84, 80 |
| cckp3-iph14pro-media-clear-frost-5.jpg | rp-iph14pro-clear-front.webp | 84, 80 |
| cckp3-iph14promax-media-smoke-frost-1.jpg | rp-iph14promax-smoke-angle.webp | 84, 80 |
| cckp3-iph14promax-media-smoke-frost-3.jpg | rp-iph14promax-smoke-side.webp | 84, 80 |
| cckp3-iph14promax-media-smoke-frost-4.jpg | rp-iph14promax-smoke-side2.webp | 84, 80 |
| cckp3-iph14promax-media-smoke-frost-12.jpg | rp-iph14promax-smoke-back.webp | 84, 80 |
| cckp3-iph14promax-media-smoke-frost-5.jpg | rp-iph14promax-smoke-front.webp | 84, 80 |
| cckp3-iph14promax-media-clear-frost-1.jpg | rp-iph14promax-clear-angle.webp | 84, 80 |
| cckp3-iph14promax-media-clear-frost-3.jpg | rp-iph14promax-clear-side.webp | 84, 80 |
| cckp3-iph14promax-media-clear-frost-4.jpg | rp-iph14promax-clear-side2.webp | 84, 80 |
| cckp3-iph14promax-media-clear-frost-12.jpg | rp-iph14promax-clear-back.webp | 84, 80 |
| cckp3-iph14promax-media-clear-frost-5.jpg | rp-iph14promax-clear-front.webp | 84, 80 |
| cckp3-iph15pmx-media-smoke-frost-1.jpg | rp-iph15pmx-smoke-angle.webp | 84, 80 |
| cckp3-iph15pmx-media-smoke-frost-3.jpg | rp-iph15pmx-smoke-side.webp | 84, 80 |
| cckp3-iph15pmx-media-smoke-frost-4.jpg | rp-iph15pmx-smoke-side2.webp | 84, 80 |
| cckp3-iph15pmx-media-smoke-frost-12.jpg | rp-iph15pmx-smoke-back.webp | 84, 80 |
| cckp3-iph15pmx-media-smoke-frost-5.jpg | rp-iph15pmx-smoke-front.webp | 72, 68 |
| cckp3-iph15pmx-media-clear-frost-1.jpg | rp-iph15pmx-clear-angle.webp | 84, 80 |
| cckp3-iph15pmx-media-clear-frost-3.jpg | rp-iph15pmx-clear-side.webp | 84, 80 |
| cckp3-iph15pmx-media-clear-frost-4.jpg | rp-iph15pmx-clear-side2.webp | 84, 80 |
| cckp3-iph15pmx-media-clear-frost-12.jpg | rp-iph15pmx-clear-back.webp | 84, 80 |
| cckp3-iph15pmx-media-clear-frost-5.jpg | rp-iph15pmx-clear-front.webp | 72, 68 |
| cckp3-iph15pro-media-smoke-frost-1.jpg | rp-iph15pro-smoke-angle.webp | 84, 80 |
| cckp3-iph15pro-media-smoke-frost-3.jpg | rp-iph15pro-smoke-side.webp | 84, 80 |
| cckp3-iph15pro-media-smoke-frost-4.jpg | rp-iph15pro-smoke-side2.webp | 84, 80 |
| cckp3-iph15pro-media-smoke-frost-12.jpg | rp-iph15pro-smoke-back.webp | 84, 80 |
| cckp3-iph15pro-media-smoke-frost-5.jpg | rp-iph15pro-smoke-front.webp | 72, 68 |
| cckp3-iph15pro-media-clear-frost-1.jpg | rp-iph15pro-clear-angle.webp | 84, 80 |
| cckp3-iph15pro-media-clear-frost-3.jpg | rp-iph15pro-clear-side.webp | 84, 80 |
| cckp3-iph15pro-media-clear-frost-4.jpg | rp-iph15pro-clear-side2.webp | 84, 80 |
| cckp3-iph15pro-media-clear-frost-12.jpg | rp-iph15pro-clear-back.webp | 84, 80 |
| cckp3-iph15pro-media-clear-frost-5.jpg | rp-iph15pro-clear-front.webp | 72, 68 |
| cckp3-iph16-media-smoke-frost-1.jpg | rp-iph16-smoke-angle.webp | 84, 80 |
| cckp3-iph16-media-smoke-frost-3.jpg | rp-iph16-smoke-side.webp | 84, 80 |
| cckp3-iph16-media-smoke-frost-4.jpg | rp-iph16-smoke-side2.webp | 84, 80 |
| cckp3-iph16-media-smoke-frost-12.jpg | rp-iph16-smoke-back.webp | 84, 80 |
| cckp3-iph16-media-smoke-frost-5.jpg | rp-iph16-smoke-front.webp | 84, 80 |
| cckp3-iph16-media-clear-frost-1.jpg | rp-iph16-clear-angle.webp | 84, 80 |
| cckp3-iph16-media-clear-frost-3.jpg | rp-iph16-clear-side.webp | 84, 80 |
| cckp3-iph16-media-clear-frost-4.jpg | rp-iph16-clear-side2.webp | 84, 80 |
| cckp3-iph16-media-clear-frost-12.jpg | rp-iph16-clear-back.webp | 84, 80 |
| cckp3-iph16-media-clear-frost-5.jpg | rp-iph16-clear-front.webp | 84, 80 |
| cckp3-iph16plus-media-clear-frost-1.jpg | rp-iph16plus-clear-angle.webp | 84, 80 |
| cckp3-iph16plus-media-clear-frost-3.jpg | rp-iph16plus-clear-side.webp | 84, 80 |
| cckp3-iph16plus-media-clear-frost-4.jpg | rp-iph16plus-clear-side2.webp | 84, 80 |
| cckp3-iph16plus-media-clear-frost-12.jpg | rp-iph16plus-clear-back.webp | 84, 80 |
| cckp3-iph16plus-media-clear-frost-5.jpg | rp-iph16plus-clear-front.webp | 84, 80 |
| cckp3-iph16pmx-media-smoke-frost-1.jpg | rp-iph16pmx-smoke-angle.webp | 84, 80 |
| cckp3-iph16pmx-media-smoke-frost-3.jpg | rp-iph16pmx-smoke-side.webp | 84, 80 |
| cckp3-iph16pmx-media-smoke-frost-4.jpg | rp-iph16pmx-smoke-side2.webp | 84, 80 |
| cckp3-iph16pmx-media-smoke-frost-12.jpg | rp-iph16pmx-smoke-back.webp | 84, 80 |
| cckp3-iph16pmx-media-smoke-frost-5.jpg | rp-iph16pmx-smoke-front.webp | 84, 80 |
| cckp3-iph16pmx-media-clear-frost-1.jpg | rp-iph16pmx-clear-angle.webp | 84, 80 |
| cckp3-iph16pmx-media-clear-frost-3.jpg | rp-iph16pmx-clear-side.webp | 84, 80 |
| cckp3-iph16pmx-media-clear-frost-4.jpg | rp-iph16pmx-clear-side2.webp | 84, 80 |
| cckp3-iph16pmx-media-clear-frost-12.jpg | rp-iph16pmx-clear-back.webp | 84, 80 |
| cckp3-iph16pmx-media-clear-frost-5.jpg | rp-iph16pmx-clear-front.webp | 84, 80 |
| cckp3-iph16pro-media-smoke-frost-1.jpg | rp-iph16pro-smoke-angle.webp | 84, 80 |
| cckp3-iph16pro-media-smoke-frost-3.jpg | rp-iph16pro-smoke-side.webp | 84, 80 |
| cckp3-iph16pro-media-smoke-frost-4.jpg | rp-iph16pro-smoke-side2.webp | 84, 80 |
| cckp3-iph16pro-media-smoke-frost-12.jpg | rp-iph16pro-smoke-back.webp | 84, 80 |
| cckp3-iph16pro-media-smoke-frost-5.jpg | rp-iph16pro-smoke-front.webp | 84, 80 |
| cckp3-iph16pro-media-clear-frost-1.jpg | rp-iph16pro-clear-angle.webp | 84, 80 |
| cckp3-iph16pro-media-clear-frost-3.jpg | rp-iph16pro-clear-side.webp | 84, 80 |
| cckp3-iph16pro-media-clear-frost-4.jpg | rp-iph16pro-clear-side2.webp | 84, 80 |
| cckp3-iph16pro-media-clear-frost-12.jpg | rp-iph16pro-clear-back.webp | 84, 80 |
| cckp3-iph16pro-media-clear-frost-5.jpg | rp-iph16pro-clear-front.webp | 84, 80 |
| cckp3-iph17-media-smoke-frost-1.jpg | rp-iph17-smoke-angle.webp | 84, 80 |
| cckp3-iph17-media-smoke-frost-3.jpg | rp-iph17-smoke-side.webp | 84, 80 |
| cckp3-iph17-media-smoke-frost-4.jpg | rp-iph17-smoke-side2.webp | 84, 80 |
| cckp3-iph17-media-smoke-frost-12.jpg | rp-iph17-smoke-back.webp | 84, 80 |
| cckp3-iph17-media-smoke-frost-5.jpg | rp-iph17-smoke-front.webp | 84, 80 |
| cckp3-iph17-media-clear-frost-1.jpg | rp-iph17-clear-angle.webp | 84, 80 |
| cckp3-iph17-media-clear-frost-3.jpg | rp-iph17-clear-side.webp | 84, 80 |
| cckp3-iph17-media-clear-frost-4.jpg | rp-iph17-clear-side2.webp | 84, 80 |
| cckp3-iph17-media-clear-frost-12.jpg | rp-iph17-clear-back.webp | 84, 80 |
| cckp3-iph17-media-clear-frost-5.jpg | rp-iph17-clear-front.webp | 84, 80 |
| cckp3-iph17a-media-smoke-frost-1.jpg | rp-iph17a-smoke-angle.webp | 84, 80 |
| cckp3-iph17a-media-smoke-frost-3.jpg | rp-iph17a-smoke-side.webp | 84, 80 |
| cckp3-iph17a-media-smoke-frost-4.jpg | rp-iph17a-smoke-side2.webp | 84, 80 |
| cckp3-iph17a-media-smoke-frost-12.jpg | rp-iph17a-smoke-back.webp | 84, 80 |
| cckp3-iph17a-media-smoke-frost-5.jpg | rp-iph17a-smoke-front.webp | 84, 80 |
| cckp3-iph17a-media-clear-frost-1.jpg | rp-iph17a-clear-angle.webp | 84, 80 |
| cckp3-iph17a-media-clear-frost-3.jpg | rp-iph17a-clear-side.webp | 84, 80 |
| cckp3-iph17a-media-clear-frost-4.jpg | rp-iph17a-clear-side2.webp | 84, 80 |
| cckp3-iph17a-media-clear-frost-12.jpg | rp-iph17a-clear-back.webp | 84, 80 |
| cckp3-iph17a-media-clear-frost-5.jpg | rp-iph17a-clear-front.webp | 84, 80 |
| cckp3-iph17pmx-media-smoke-frost-1.jpg | rp-iph17pmx-smoke-angle.webp | 84, 80 |
| cckp3-iph17pmx-media-smoke-frost-3.jpg | rp-iph17pmx-smoke-side.webp | 84, 80 |
| cckp3-iph17pmx-media-smoke-frost-4.jpg | rp-iph17pmx-smoke-side2.webp | 84, 80 |
| cckp3-iph17pmx-media-smoke-frost-12.jpg | rp-iph17pmx-smoke-back.webp | 84, 80 |
| cckp3-iph17pmx-media-smoke-frost-5.jpg | rp-iph17pmx-smoke-front.webp | 84, 80 |
| cckp3-iph17pmx-media-clear-frost-1.jpg | rp-iph17pmx-clear-angle.webp | 84, 80 |
| cckp3-iph17pmx-media-clear-frost-3.jpg | rp-iph17pmx-clear-side.webp | 84, 80 |
| cckp3-iph17pmx-media-clear-frost-4.jpg | rp-iph17pmx-clear-side2.webp | 84, 80 |
| cckp3-iph17pmx-media-clear-frost-12.jpg | rp-iph17pmx-clear-back.webp | 84, 80 |
| cckp3-iph17pmx-media-clear-frost-5.jpg | rp-iph17pmx-clear-front.webp | 84, 80 |
| cckp3-iph17pro-media-smoke-frost-1.jpg | rp-iph17pro-smoke-angle.webp | 84, 80 |
| cckp3-iph17pro-media-smoke-frost-3.jpg | rp-iph17pro-smoke-side.webp | 84, 80 |
| cckp3-iph17pro-media-smoke-frost-4.jpg | rp-iph17pro-smoke-side2.webp | 84, 80 |
| cckp3-iph17pro-media-smoke-frost-12.jpg | rp-iph17pro-smoke-back.webp | 84, 80 |
| cckp3-iph17pro-media-smoke-frost-5.jpg | rp-iph17pro-smoke-front.webp | 84, 80 |
| cckp3-iph17pro-media-clear-frost-1.jpg | rp-iph17pro-clear-angle.webp | 84, 80 |
| cckp3-iph17pro-media-clear-frost-3.jpg | rp-iph17pro-clear-side.webp | 84, 80 |
| cckp3-iph17pro-media-clear-frost-4.jpg | rp-iph17pro-clear-side2.webp | 84, 80 |
| cckp3-iph17pro-media-clear-frost-12.jpg | rp-iph17pro-clear-back.webp | 84, 80 |
| cckp3-iph17pro-media-clear-frost-5.jpg | rp-iph17pro-clear-front.webp | 84, 80 |
| cckp3-iph18fld-media-smoke-frost-3.jpg | rp-iph18fld-smoke-side.webp | 84, 80 |
| cckp3-iph18fld-media-smoke-frost-4.jpg | rp-iph18fld-smoke-side2.webp | 84, 80 |
| cckp3-iph18fld-media-smoke-frost-2.jpg | rp-iph18fld-smoke-back.webp | 84, 80 |
| cckp3-iph2161p-media-smoke-frost-1.jpg | rp-iph2161p-smoke-angle.webp | 84, 80 |
| cckp3-iph2161p-media-smoke-frost-3.jpg | rp-iph2161p-smoke-side.webp | 84, 80 |
| cckp3-iph2161p-media-smoke-frost-4.jpg | rp-iph2161p-smoke-side2.webp | 84, 80 |
| cckp3-iph2161p-media-smoke-frost-12.jpg | rp-iph2161p-smoke-back.webp | 84, 80 |
| cckp3-iph2161p-media-smoke-frost-5.jpg | rp-iph2161p-smoke-front.webp | 84, 80 |
| cckp3-iph2161p-media-clear-frost-1.jpg | rp-iph2161p-clear-angle.webp | 84, 80 |
| cckp3-iph2161p-media-clear-frost-3.jpg | rp-iph2161p-clear-side.webp | 84, 80 |
| cckp3-iph2161p-media-clear-frost-4.jpg | rp-iph2161p-clear-side2.webp | 84, 80 |
| cckp3-iph2161p-media-clear-frost-12.jpg | rp-iph2161p-clear-back.webp | 84, 80 |
| cckp3-iph2161p-media-clear-frost-5.jpg | rp-iph2161p-clear-front.webp | 84, 80 |
| cckp3-iph2167-media-smoke-frost-1.jpg | rp-iph2167-smoke-angle.webp | 84, 80 |
| cckp3-iph2167-media-smoke-frost-3.jpg | rp-iph2167-smoke-side.webp | 84, 80 |
| cckp3-iph2167-media-smoke-frost-4.jpg | rp-iph2167-smoke-side2.webp | 84, 80 |
| cckp3-iph2167-media-smoke-frost-12.jpg | rp-iph2167-smoke-back.webp | 84, 80 |
| cckp3-iph2167-media-smoke-frost-5.jpg | rp-iph2167-smoke-front.webp | 84, 80 |
| cckp3-iph2167-media-clear-frost-1.jpg | rp-iph2167-clear-angle.webp | 84, 80 |
| cckp3-iph2167-media-clear-frost-3.jpg | rp-iph2167-clear-side.webp | 84, 80 |
| cckp3-iph2167-media-clear-frost-4.jpg | rp-iph2167-clear-side2.webp | 84, 80 |
| cckp3-iph2167-media-clear-frost-12.jpg | rp-iph2167-clear-back.webp | 84, 80 |
| cckp3-iph2167-media-clear-frost-5.jpg | rp-iph2167-clear-front.webp | 84, 80 |
| cckp3-iph61-media-clear-frost-1.jpg | rp-iph61-clear-angle.webp | 84, 80 |
| cckp3-iph61-media-clear-frost-3.jpg | rp-iph61-clear-side.webp | 84, 80 |
| cckp3-iph61-media-clear-frost-4.jpg | rp-iph61-clear-side2.webp | 84, 80 |
| cckp3-iph61-media-clear-frost-2.jpg | rp-iph61-clear-back.webp | 84, 80 |
| cckp3-iph61-media-clear-frost-5.jpg | rp-iph61-clear-front.webp | 84, 80 |
| cckp3-iphse25-media-smoke-frost-1.jpg | rp-iphse25-smoke-angle.webp | 84, 80 |
| cckp3-iphse25-media-smoke-frost-3.jpg | rp-iphse25-smoke-side.webp | 84, 80 |
| cckp3-iphse25-media-smoke-frost-4.jpg | rp-iphse25-smoke-side2.webp | 84, 80 |
| cckp3-iphse25-media-smoke-frost-12.jpg | rp-iphse25-smoke-back.webp | 84, 80 |
| cckp3-iphse25-media-smoke-frost-5.jpg | rp-iphse25-smoke-front.webp | 84, 80 |
| cckp3-iphse25-media-clear-frost-1.jpg | rp-iphse25-clear-angle.webp | 84, 80 |
| cckp3-iphse25-media-clear-frost-3.jpg | rp-iphse25-clear-side.webp | 84, 80 |
| cckp3-iphse25-media-clear-frost-4.jpg | rp-iphse25-clear-side2.webp | 84, 80 |
| cckp3-iphse25-media-clear-frost-12.jpg | rp-iphse25-clear-back.webp | 84, 80 |
| cckp3-iphse25-media-clear-frost-5.jpg | rp-iphse25-clear-front.webp | 84, 80 |
| cckp3-motgply25-media-smoke-frost-3.jpg | rp-motgply25-smoke-side.webp | 84, 80 |
| cckp3-motgply25-media-smoke-frost-12.jpg | rp-motgply25-smoke-back.webp | 84, 80 |
| cckp3-motgply25-media-smoke-frost-5.jpg | rp-motgply25-smoke-front.webp | 84, 80 |
| cckp3-motgply25-media-clear-frost-3.jpg | rp-motgply25-clear-side.webp | 84, 80 |
| cckp3-motgply25-media-clear-frost-12.jpg | rp-motgply25-clear-back.webp | 84, 80 |
| cckp3-motgply25-media-clear-frost-5.jpg | rp-motgply25-clear-front.webp | 84, 80 |
| cckp3-motgpwr25-media-smoke-frost-3.jpg | rp-motgpwr25-smoke-side.webp | 84, 80 |
| cckp3-motgpwr25-media-smoke-frost-12.jpg | rp-motgpwr25-smoke-back.webp | 84, 80 |
| cckp3-motgpwr25-media-smoke-frost-5.jpg | rp-motgpwr25-smoke-front.webp | 84, 80 |
| cckp3-motgpwr25-media-clear-frost-3.jpg | rp-motgpwr25-clear-side.webp | 84, 80 |
| cckp3-motgpwr25-media-clear-frost-12.jpg | rp-motgpwr25-clear-back.webp | 84, 80 |
| cckp3-motgpwr25-media-clear-frost-5.jpg | rp-motgpwr25-clear-front.webp | 84, 80 |
| cckp3-motgstl26-media-smoke-frost-3.jpg | rp-motgstl26-smoke-side.webp | 84, 80 |
| cckp3-motgstl26-media-smoke-frost-12.jpg | rp-motgstl26-smoke-back.webp | 84, 80 |
| cckp3-motgstl26-media-smoke-frost-5.jpg | rp-motgstl26-smoke-front.webp | 84, 80 |
| cckp3-motgstl26-media-clear-frost-3.jpg | rp-motgstl26-clear-side.webp | 84, 80 |
| cckp3-motgstl26-media-clear-frost-12.jpg | rp-motgstl26-clear-back.webp | 84, 80 |
| cckp3-motgstl26-media-clear-frost-5.jpg | rp-motgstl26-clear-front.webp | 84, 80 |
| cckp3-samga17-media-clear-frost-3.jpg | rp-samga17-clear-side.webp | 84, 80 |
| cckp3-samga17-media-clear-frost-12.jpg | rp-samga17-clear-back.webp | 84, 80 |
| cckp3-samga17-media-clear-frost-5.jpg | rp-samga17-clear-front.webp | 84, 80 |
| cckp3-samga37-media-clear-frost-3.jpg | rp-samga37-clear-side.webp | 84, 80 |
| cckp3-samga37-media-clear-frost-12.jpg | rp-samga37-clear-back.webp | 84, 80 |
| cckp3-samga37-media-clear-frost-5.jpg | rp-samga37-clear-front.webp | 84, 80 |
| cckp3-samgs24-media-clear-frost-1.jpg | rp-samgs24-clear-angle.webp | 84, 80 |
| cckp3-samgs24-media-clear-frost-3.jpg | rp-samgs24-clear-side.webp | 84, 80 |
| cckp3-samgs24-media-clear-frost-4.jpg | rp-samgs24-clear-side2.webp | 84, 80 |
| cckp3-samgs24-media-clear-frost-12.jpg | rp-samgs24-clear-back.webp | 84, 80 |
| cckp3-samgs24-media-clear-frost-5.jpg | rp-samgs24-clear-front.webp | 84, 80 |
| cckp3-samgs24fe-media-clear-frost-1.jpg | rp-samgs24fe-clear-angle.webp | 84, 80 |
| cckp3-samgs24fe-media-clear-frost-3.jpg | rp-samgs24fe-clear-side.webp | 84, 80 |
| cckp3-samgs24fe-media-clear-frost-4.jpg | rp-samgs24fe-clear-side2.webp | 84, 80 |
| cckp3-samgs24fe-media-clear-frost-2.jpg | rp-samgs24fe-clear-back.webp | 84, 80 |
| cckp3-samgs24fe-media-clear-frost-5.jpg | rp-samgs24fe-clear-front.webp | 84, 80 |
| cckp3-samgs25fe-media-clear-frost-3.jpg | rp-samgs25fe-clear-side.webp | 84, 80 |
| cckp3-samgs25fe-media-clear-frost-12.jpg | rp-samgs25fe-clear-back.webp | 84, 80 |
| cckp3-samgs25fe-media-clear-frost-5.jpg | rp-samgs25fe-clear-front.webp | 84, 80 |
| cckp3-samgs25u-media-smoke-frost-1.jpg | rp-samgs25u-smoke-angle.webp | 84, 80 |
| cckp3-samgs25u-media-smoke-frost-3.jpg | rp-samgs25u-smoke-side.webp | 84, 80 |
| cckp3-samgs25u-media-smoke-frost-4.jpg | rp-samgs25u-smoke-side2.webp | 84, 80 |
| cckp3-samgs25u-media-smoke-frost-12.jpg | rp-samgs25u-smoke-back.webp | 84, 80 |
| cckp3-samgs25u-media-smoke-frost-5.jpg | rp-samgs25u-smoke-front.webp | 84, 80 |
| cckp3-samgs25u-media-clear-frost-1.jpg | rp-samgs25u-clear-angle.webp | 84, 80 |
| cckp3-samgs25u-media-clear-frost-3.jpg | rp-samgs25u-clear-side.webp | 84, 80 |
| cckp3-samgs25u-media-clear-frost-4.jpg | rp-samgs25u-clear-side2.webp | 84, 80 |
| cckp3-samgs25u-media-clear-frost-12.jpg | rp-samgs25u-clear-back.webp | 84, 80 |
| cckp3-samgs25u-media-clear-frost-5.jpg | rp-samgs25u-clear-front.webp | 84, 80 |
| cckp3-samgs26-media-smoke-frost-3.jpg | rp-samgs26-smoke-side.webp | 84, 80 |
| cckp3-samgs26-media-smoke-frost-12.jpg | rp-samgs26-smoke-back.webp | 84, 80 |
| cckp3-samgs26-media-smoke-frost-5.jpg | rp-samgs26-smoke-front.webp | 84, 80 |
| cckp3-samgs26-media-clear-frost-3.jpg | rp-samgs26-clear-side.webp | 84, 80 |
| cckp3-samgs26-media-clear-frost-12.jpg | rp-samgs26-clear-back.webp | 84, 80 |
| cckp3-samgs26-media-clear-frost-5.jpg | rp-samgs26-clear-front.webp | 84, 80 |
| cckp3-samgs26fe-media-clear-frost-1.jpg | rp-samgs26fe-clear-angle.webp | 84, 80 |
| cckp3-samgs26fe-media-clear-frost-3.jpg | rp-samgs26fe-clear-side.webp | 84, 80 |
| cckp3-samgs26fe-media-clear-frost-4.jpg | rp-samgs26fe-clear-side2.webp | 84, 80 |
| cckp3-samgs26fe-media-clear-frost-12.jpg | rp-samgs26fe-clear-back.webp | 84, 80 |
| cckp3-samgs26fe-media-clear-frost-5.jpg | rp-samgs26fe-clear-front.webp | 84, 80 |
| cckp3-samgs26pl-media-smoke-frost-1.jpg | rp-samgs26pl-smoke-angle.webp | 84, 80 |
| cckp3-samgs26pl-media-smoke-frost-3.jpg | rp-samgs26pl-smoke-side.webp | 84, 80 |
| cckp3-samgs26pl-media-smoke-frost-4.jpg | rp-samgs26pl-smoke-side2.webp | 84, 80 |
| cckp3-samgs26pl-media-smoke-frost-12.jpg | rp-samgs26pl-smoke-back.webp | 84, 80 |
| cckp3-samgs26pl-media-smoke-frost-5.jpg | rp-samgs26pl-smoke-front.webp | 84, 80 |
| cckp3-samgs26pl-media-clear-frost-1.jpg | rp-samgs26pl-clear-angle.webp | 84, 80 |
| cckp3-samgs26pl-media-clear-frost-3.jpg | rp-samgs26pl-clear-side.webp | 84, 80 |
| cckp3-samgs26pl-media-clear-frost-4.jpg | rp-samgs26pl-clear-side2.webp | 84, 80 |
| cckp3-samgs26pl-media-clear-frost-12.jpg | rp-samgs26pl-clear-back.webp | 84, 80 |
| cckp3-samgs26pl-media-clear-frost-5.jpg | rp-samgs26pl-clear-front.webp | 84, 80 |
| cckp3-samgs26u-media-smoke-frost-3.jpg | rp-samgs26u-smoke-side.webp | 84, 80 |
| cckp3-samgs26u-media-smoke-frost-12.jpg | rp-samgs26u-smoke-back.webp | 84, 80 |
| cckp3-samgs26u-media-smoke-frost-5.jpg | rp-samgs26u-smoke-front.webp | 84, 80 |
| cckp3-samgs26u-media-clear-frost-3.jpg | rp-samgs26u-clear-side.webp | 84, 80 |
| cckp3-samgs26u-media-clear-frost-12.jpg | rp-samgs26u-clear-back.webp | 84, 80 |
| cckp3-samgs26u-media-clear-frost-5.jpg | rp-samgs26u-clear-front.webp | 84, 80 |

Each output also has a `-hd.webp` and a `-t.webp` thumbnail.

## Exclusions

| Source | Reason |
|---|---|
| cckp3-samgs24-media-smoke-frost-2.jpg | an app icon logo is printed on the back (the only Smoke Frost photo of this listing) |
| cckp3-samgs24u-media-smoke-frost-2.jpg | an app icon logo is printed on the back; the phone is listed as coming soon |
| cckp3-iph18fld-media-smoke-frost-1.jpg | the lock screen shows a large clock (text) |
| cckp3-iph18fld-media-smoke-frost-5.jpg | the lock screen shows a large clock (text) |
| cckp3-samgs26-media-smoke-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-samgs26-media-smoke-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-samgs26-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-samgs26-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-samgs26u-media-smoke-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-samgs26u-media-smoke-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-samgs26u-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-samgs26u-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-samgs25fe-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-samgs25fe-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-samga37-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-samga37-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-samga17-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-samga17-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-googpl10-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-googpl10-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-googpl10-media-clear-frost-101.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-googpl10-media-clear-frost-104.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-googpl10pxl-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-googpl10pxl-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-motgstl26-media-smoke-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-motgstl26-media-smoke-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-motgstl26-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-motgstl26-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-motgpwr25-media-smoke-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-motgpwr25-media-smoke-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-motgpwr25-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-motgpwr25-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-motgply25-media-smoke-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-motgply25-media-smoke-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| cckp3-motgply25-media-clear-frost-1.jpg | the left rim shows the vendor name embossed in the rim |
| cckp3-motgply25-media-clear-frost-4.jpg | the right rim shows the vendor name embossed in the rim |
| every listing: shot 2 | near duplicate of shot 12 (straight back); used only when shot 12 is missing (iPhone 11, 12, Duo, S24 FE, and 102 for Pixel 10 and 11) |
| cckp3-iphse25-media-*-frost-{21 to 25, 101 and up}.jpg | the same blank on other phones and colors (16e black 21 to 25, iPhone 15 1xx, 14 2xx, 13 3xx, 17e 4xx); not used: the 17e has the same camera as the 16e in shots 1 to 12, and the iPhone 13, 14 and 15 are shown on the 16e with the similar iPhone note |

Changed on our copies only (`LENS_TEXT`): the letters printed around the flash of the moto phones (megapixels, a sensor
brand) are taken off the back (12) and side (3) photos of motgply25, motgpwr25, motgstl26, and the broken scraps under
the camera lip (`CLEAN_LIP`) become frost on the back and side photos of samgs24.

Checked by eye on a contact sheet of every output (logos, text, people, wrong phone, wrong rim). The first pass
missed the vendor name embossed in the Galaxy S26 and S26 Ultra rims (light text on a light rim, legible only at
full size); a review found it with contrast stretched 1:1 crops and a template match over both rims of every used
source, which hit only those four photos (now excluded). When adding photos, check rims at 1:1 with the contrast
stretched, not only the contact sheet. The phones added Nov 23 2026 were checked that way over both long rims of
every photo and over every camera: the name shows on the edge with no buttons of the listings excluded above (in
their back and front photos it is only a row of 3 px dashes seen edge on). Phone wallpapers are the phones' own
screens. The Galaxy wallpapers are Samsung's abstract default artwork, not a logo.
