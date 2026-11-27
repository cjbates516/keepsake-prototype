# Confetti Paint — 2026-11-27

Four approved original paintings added to Paint Party: Ocean Confetti, Confetti Party, Pastel Confetti, Jewel Confetti. Each gallery card exposes all four authored colors in a visible 2 × 2 thumbnail grid. The customizer and kiosk retain the same color IDs through counter codes and reopening.

Source PNGs are unchanged 1024 × 1536 originals. Thumbnail and sibling-color WebP assets are full-frame encodings, without insets or added backgrounds. Color profiles explicitly declare three sibling variants; existing profiles retain their previous option counts. Both Clear Frost and Smoke Frost use the existing model-specific compositor and masks.

`tools/build_confetti_drop.cjs <approved-artwork-directory>` records source hashes in `assets/confetti-paint-20261127.json`. Original artwork is separate from product mockups.

Validation: `tools/tests/confetti_paint.cjs` covers Chromium and WebKit at mobile 390 × 844 and kiosk 1024 × 768: four gallery cards/thumbnail loading, choosing a phone, selected color to counter and reopening, every artwork on both frost rims, pixel equality of all composed colorways against their full-frame source, four kiosk color/rim selections and counter-code restoration. All existing catalog choice lists are compared against the pre-release revision; stable kiosk codes checked with `tools/instore_codes.py --check`.

Drive destination: Keepsake Printing Co / 01 Design Library - Staff / 03 Playful Prints / Paint Party / Confetti Paint - Four Colorways.
Folder: https://drive.google.com/drive/folders/1bnMdMjRe0-42bp94hes6y-ALrtLFfNmm
Four color folders each contain original artwork and separately named Clear Frost and Smoke Frost previews. The parent has two comparison sheets and a team guide. Upload metadata/parent folders verified after writing.

QR uploads remain on hold. No online checkout or pricing changes.
