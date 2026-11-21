# Collection release audit — 2026-11-20

60 new designs: 20 Space Photography, 20 Liquid Color (customer label Liquid Prism), 8 Botanical Blueprints, 8 Signature Golf and 4 National Parks. Existing designs including zodiac are preserved. Full-figure zodiac, tarot and additional seasonal directions are separate queued work.

## Scope and evidence
- All 60 catalog files, thumbnails and mounted clear-case previews exist; each new catalog row is in assets/designs/designs.json and has a stable in-store code. No model is forced from the lookbook; the studio asks customers to select their phone.
- Chromium + WebKit at 375, 820 and 1280 px: lookbook two columns on mobile/tablet, four desktop; no horizontal document overflow; zoom, close, zoom controls and customizer destinations passed. All five category sections exercised.
- Actual buildPrint exports generated for every new design on iPhone 17 Pro Max, iPhone 15 Pro and Galaxy S26 Ultra: 180 PNGs, exact configured dimensions, nonempty binary masks, effective source resolution 271–420 dpi. Contact sheets visually inspected for all 180 exports; principal subjects retained, no out-of-mask pixels or detached artwork boundaries. Printer unavailable: physical color, ink adhesion, bleed/calibration and blank fit remain unverified.
- Mounted clear-case preview renders checked phone/camera presence, clear case type, original variant and intended phone model. All 60 previews visually inspected. Static previews use iPhone 17 Pro Max, explicitly disclosed on page.
- Full case → personalization → glass → compatible charger → edit/back → counter summary/zoom → next-customer reset: 18 Chromium/WebKit × 375/820/1280 × West Chester/Pottstown/Newark runs, rotating samples from all five new categories. No page errors or POSTs. QR upload deployment unchanged/on hold; no online purchase introduced.
- `tools/instore_codes.py --check`: zero live designs missing codes. `tools/build_print_layouts.cjs --check` passed before release; no print-layout geometry changed.

## Claude review corrections
- Held back square-native Playground Aurora Current and Cat’s Eye with a visible source-image boundary. They are not in the released 60. Aurora was created in Corey's own Playground session; its concept master remains private.
- Corrected Moon to Clementine (the archive explicitly describes a 1994 Clementine composite, not LRO imagery).
- Corrected Doradus diacritics, removed HTML from Towering Infernos credits, added archive credit lines for Apollo 17 and Lagoon. Verified Eagle is WISE infrared and Pillars is Hubble near infrared from downloaded NASA archive metadata.
- Preserved Anna Atkins source link in Botanical gallery; new lookbook distinguishes original illustrations from historical cyanotypes and links both sets of credits.
- Added space source/credit links in customizer and visible per-image credits in new lookbook. Source page describes scientific color mapping, composites/crops and no endorsement.
- Replaced generic Multicolor tags with dominant-color classifications. Bumped kiosk asset version and service-worker cache; updated shop-menu cache keys on every consuming HTML page.

## Reproduce
`node tools/tests/collection_expansion.cjs`
`node tools/tests/expansion_counter.cjs`
`python3 tools/instore_codes.py --check`

Local test artifacts remain outside the public repository. Artwork source sizes, compositions and credits are recorded in assets/collection-expansion.json. Print resolution is not a guarantee of calibrated physical output.

## Final review
Actual Claude's second source review found no demonstrated blockers. Addressed its remaining source-resolution question: every isolated space subject is downsampled or unchanged with Pillow thumbnail, never upsampled; placedSourceSize and sourceScale are recorded and sourceScale <= 1 is asserted. Added CC BY link for ESA-credited material, active-row filtering, category-count guards and the release's held-back-file guard. Raised digital source-DPI gate to 270.
