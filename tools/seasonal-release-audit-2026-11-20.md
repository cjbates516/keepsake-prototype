# Seasonal weather release — November 20, 2026

Four original AI-assisted photorealistic artworks: Rain on Glass, Snowfall Pines, Sunlit Shore and Autumn Drift Road. Native 887 × 1774 masters; no upscaling. The collection distinguishes these artworks from the existing licensed photographs.

## Validation

- All four preview images loaded and zoomed at 375, 820 and 1280px in Chromium and WebKit. Two columns below 900px, four above; no horizontal overflow or page errors. Phone model controls are reachable; collection links do not force the sample phone.
- Twelve actual print exports: four artworks × iPhone 17 Pro Max, iPhone 15 Pro, Galaxy S26 Ultra. Exact configured dimensions, binary mask alpha, effective source resolution 271–310 dpi. Visually inspected the four mounted clear-case previews and all twelve export crops.
- Twelve customer walkthroughs: both engines × mobile/kiosk × all three stores. Kiosk selection, name, glass, charger, edit/back, totals, readable counter summary, zoom and next-customer reset passed. No POST requests.
- Existing catalog rows and pick codes compared to the parent commit and unchanged. New stable WTH codes 005–008; all catalog pick codes unique. Native dimensions and SHA256 hashes verified.
- Drive read-back verified four separate design folders with three non-empty files each: original master, original case artwork and clear-case preview.

QR uploads remain on hold. No editor engine, zodiac artwork or checkout changes. Printer proofing remains pending; digital checks do not establish physical calibration.

Run `node tools/tests/seasonal_drop.cjs`, `node tools/tests/seasonal_counter.cjs`, and `python3 tools/instore_codes.py --check` with the local test server running on port 19038. Playwright uses the existing adjacent workspace installation.
