# Ocean Photography and Rain After Dark

Twelve real photographs, six per collection. Sources and licenses are recorded in `assets/ocean-rain-sources.json` and displayed on `ocean-rain-credits.html`. Original source URLs remain linked; Wikimedia high-resolution renditions are limited to native source dimensions before use. Surface Breath is horizontally mirrored so the turtle's head clears the camera opening. No AI scene generation, color filters, mats, or background variants.

## Customer flow

- Homepage tiles and shared menu lead to `ocean-and-rain.html`.
- Twelve mounted clear-case previews come from the live customizer renderer, shown on iPhone 15 Pro.
- Tap to zoom starts at 1×; Make it yours leads to phone choice, then the existing editor and counter handoff.
- Both categories appear in the gallery and kiosk. Existing pick codes are unchanged; OCN and RAN each have six new codes.
- An existing CSS specificity bug exposed a duplicate full-resolution counter image on desktop kiosks. The counter thumbnail now stays hidden at desktop widths and remains bounded on mobile.
- QR uploads remain disabled. Purchases remain in store.

## Validation

`tools/tests/ocean_rain_prints.cjs`: all 12 designs × iPhone 15 Pro, iPhone 16 Pro Max, iPhone 17 Pro Max × Chromium/WebKit = 72 exports. Complete, identical alpha mask coverage per model; correct dimensions and no fractional alpha. Effective source resolution minimum 340 DPI on the tested layouts. iPhone 15 Pro files exported with 300-DPI metadata and 1.5 mm bleed.

`tools/tests/ocean_rain_flow.cjs`: Chromium and WebKit at 390 and 1280 px. Homepage → collection → both six-design galleries → zoom → phone choice → clear-case editor → glass and charger → counter. Kiosk pick-code path checked. No horizontal overflow, JavaScript errors, or POST uploads.

Asset hashes, source dimensions, thumbnails, and unchanged pre-existing counter codes checked. Reviewed all twelve preview crops visually, including the mirrored turtle correction. Physical case/jig alignment remains the store's production check; the supplied print export is explicitly labeled for iPhone 15 Pro, not a universal template.

## Drive organization

Staff library → 01 Nature and Travel → Ocean Photography / Rain After Dark → numbered design folders.
Each design gets its high-resolution source rendition, website artwork, mounted clear-case preview, model-labeled print PNG, and printing/source/license notes. Each collection also gets a Start here guide. ShareAlike derivatives retain their original licenses; notes include attribution for packaging or receipts.
