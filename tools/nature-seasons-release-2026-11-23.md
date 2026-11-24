# Nature & Seasons release — 2026-11-23

Six original AI-assisted Playground portraits: Winter Blue Hour, Mistwood, Desert Monsoon, Sunlit Dunes, Alpine Wildflowers and Moonlit Coast. Each source is native 1152×2048; none was pixel-upscaled. Source design URLs, commercial-use plan reference, hashes and image dimensions are in `assets/nature-seasons.json`. These are explicitly presented as artwork, not documentary photographs of identified locations.

Added to Seasonal Weather in the gallery and kiosk, with six new stable WTH pick codes. A homepage feature links to the new seasonal section. Collection images come from the same mounted clear-case renderer as the customizer, using iPhone 15 Pro. Tapping opens a 1× detail view and phone selection. The editor now allows a safe same-origin return to `seasonal-weather.html`.

Validation:
- `nature_seasons_drop.cjs`: Chromium and WebKit at 375, 820 and 1280 px; six images load, two/four-column layouts, no overflow, 1× initial zoom, phone selection.
- 18 actual masked print exports: all six on iPhone 15 Pro (358 effective DPI), iPhone 17 Pro Max (372 DPI) and Galaxy S26 Ultra (313 DPI). Full native sources loaded; print geometry dimensions match; solid alpha within the mask.
- `nature_seasons_flow.cjs`: Chromium and WebKit at 390 and 1280 px; homepage → collection → zoom → model selection → clear-case editor → glass and charger → counter, plus kiosk lookup. No page errors or POST requests.
- Stable code registry check: no live designs missing codes.
- Physical first-print alignment remains a normal staff proofing step.

Drive destination: 01 Design Library - Staff / 07 Seasonal / Seasonal Weather / one folder per design. Each folder contains original portrait master, full-bleed case artwork, mounted preview, model-labeled iPhone 15 Pro print export and staff guide. Batch index explains file roles and resolution. QR uploads remain on hold.
