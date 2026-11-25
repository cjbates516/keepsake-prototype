# Phone-first entry and Neon Doodles

Customers entering “Design your case” without a chosen phone now see a full-screen phone picker before the editor. It uses the editor’s supported model list, with brand buttons and cross-brand search. Existing gallery and counter links retain their valid model. The original entry URL preserves artwork, background, case, rim, and store. A kiosk choice starts a fresh session because the previous screen is retired on navigation; the shared-screen privacy behavior remains intact.

Neon Doodles expands from six designs to twelve. Every design has its original plus five full-frame background variants, with clickable thumbnails available before or after phone selection. The six existing original images, pick codes, and colorway slot meanings remain unchanged. Transparent artwork sources were generated/edited with image_gen and composed onto full-size backgrounds; no artwork is inset into a colored mat.

New designs: After Hours Smiles, Butterfly Club, Neon Tide, Electric Garden, Mixtape Magic, Lucky Little Things.

`type-preview.html` is a noindex comparison of the current typeface with an Avenir direction. The comparison was rendered using the Mac’s installed Avenir; no commercial webfont binaries were copied. The storefront typography is unchanged.

## Validation

- `tools/tests/phone_first_flow.cjs`: Chromium and WebKit, 390×844, 1024×768, 820×1180. Homepage entry, brand/search/no results, chosen phone/Frost preservation, invalid model gate, glass and charger, counter code, lookup, kiosk uploads disabled, no POST requests.
- `tools/tests/neon_doodles_flow.cjs`: Chromium and WebKit, mobile and tablet. 12 designs / 72 clickable options, sample changes, phone selection, centered canvas, counter lookup retains exact artwork and background.
- `tools/tests/neon_doodles_kiosk.cjs`: both engines, new and existing Neon designs, backgrounds, glass, charger, review/edit/back, counter lookup and reset.
- `tools/render_neon_drop.cjs`: 144 Frost previews (72 looks × 2 rims); all 72 prints have identical mask coverage and six distinct rendered backgrounds per design. Native originals measure 318 PPI on the reference iPhone 15 Pro; all variant files retain the same 887×1774 dimensions. Digital previews do not replace a physical print check for each blank.
- 1,224 supported kiosk phone/design/colorway codes round-trip; previous pick codes unchanged; 60 authored variant hashes and full-frame dimensions checked.
- QR uploads remain on hold. No online checkout added.

Evidence and staff-library receipts: `../collaboration/neon-expansion-2026-11-25/`.
