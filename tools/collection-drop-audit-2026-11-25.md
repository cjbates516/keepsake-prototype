# November 25 collection expansion

78 new designs: 12 Ocean Photography, 12 Rain After Dark, 14 Botanical Blueprints, 10 Signature Golf, 12 Seasonal Weather, and 18 Tarot. Resulting collection totals: 18, 18, 24, 21, 26, and 22 respectively. Existing artwork and pick codes are preserved.

The batch contains 58 sourced photographs/historic cyanotypes and 20 original AI-assisted illustrations (18 tarot and two golf). `assets/collection-drop-20261125.json` records source, attribution, license, preparation, native dimensions and content hash. Customer-facing credits are in `collection-credits.html`. No source artwork was upscaled. Turtle and botanical scan crops were corrected after visual inspection.

## Customer navigation

`new-arrivals.html` starts with 12 cases, offers six collection filters, a Show more button, and Smoke Frost/Clear Frost previews. Tapping a case requests the phone model before customization. The shared category rail and existing homepage edit link expose New Arrivals without adding another long homepage section. Existing collection pages link to their additions.

## Validation

- All 156 Frost preview renders passed mounted-camera, model/rim, and print-mask checks. All 78 iPhone 15 Pro Frost print exports have the same complete alpha mask; minimum effective source resolution is 310 DPI for that tested layout. This is digital validation, not a physical production-fit test for every phone.
- Visually inspected all six case contact sheets, generated artwork, and corrected turtle/botanical previews.
- `tools/tests/collection_drop_flow.cjs`: all six collections passed homepage → New Arrivals → phone → editor → preview → tempered glass + X26 charger → counter → code lookup in Chromium and WebKit. Alternating 390×844 mobile and 1024×768 kiosk-sized layouts; both Frost rims exercised on iPhone 16 Pro.
- `tools/tests/collection_drop_kiosk.cjs`: all six collections passed direct kiosk search → setup → glass/charger → counter → lookup → reset in Chromium and WebKit at 1024×768, iPhone 15 Pro.
- `tools/tests/category_navigation.cjs`: Chromium and WebKit at 390, 820, 1024 and 1440px. Category groups fit, search works, selected phone survives category changes, and no horizontal overflow.
- Existing catalog entries and code assignments compared unchanged; 78 new artwork files, thumbnails and code assignments verified; all 156 previews decode and metadata hashes match.
- No POST requests during shopping tests. QR uploads remain on hold; no online checkout added.

An initial WebKit audit waited on an off-screen lazy image. The test now scrolls that card into view and bounds its decode wait; the resumed tests passed.

## Staff library

Existing Drive category folders are retained. Each new design has its own named folder containing artwork, both Frost preview files, and a print PNG labeled iPhone 15 Pro Frost ONLY. Collection START HERE indexes include catalog codes, source/license credits, and instructions to export the exact phone model before production.

Local upload receipts, print exports, source renditions and visual evidence live outside the repository in `../collaboration/collection-depth-2026-11-25/`. Check `drive-map-final.json` and verification receipts there for completed Drive status. Physical blank/template confirmation remains required; Duo physical-fit gating is unchanged.

Next owner: Codex/Claude may continue category expansion from this source manifest and stable code registry. Do not regenerate or renumber existing codes. No fresh independent Claude review is claimed for this release.
