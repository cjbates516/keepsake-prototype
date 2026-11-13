# Print fidelity and disconnected acceptance

November 12, 2026. This batch fixes software rendering defects. It does not certify a physical blank, camera opening, jig, ink preset or printer alignment.

## Rendering changes

- Source mask geometry is compiled from native 2500 × 3000 alpha at threshold 128 into exact row spans. Browser PNG decoder rounding no longer changes customizer/export mask pixels. Gallery/kiosk thumbnails still rasterize the display PNG; their crop/proportions use the same generated metadata. Source hashes are recorded in `assets/mask-geometry.js`.
- Bounds come from the full native mask, replacing the 100 × 120 sampled bounds.
- Artwork is laid out in physical-proportion coordinates. The preview compensates for the mockup’s horizontal/vertical scale; the print transform cancels that compensation. Rotation remains rigid and text uses the same correction.
- Both template pixel axes are respected: x scale is `pxW / tpl.w / fit.sx`; y scale is `pxH / tpl.h / fit.sy`. Artwork compensation is y scale divided by x scale.
- Cover fitting includes the bleed margin and preserves aspect ratio. There is no post-render enlargement of the whole canvas. Deliberately uncovered photo areas stay clear in preview and print.
- Exact Euclidean distance, radius 18 pixels, replaces nine sparse mask stamps. Bleed copies the nearest trim pixel only outside the original mask. Interior pixels are not moved or rescaled. Existing camera/inner-edge bleed policy is retained pending physical validation.
- Mask alpha is binary; genuine artwork/font transparency is retained. Added name text no longer has a translucent drop shadow.
- The gallery, kiosk, staff preview and export share derived proportions. Staff and order PNG encoding both include 300-DPI metadata. The output canvas dimensions remain unchanged.

18 pixels at 300 DPI is 1.524 mm, described approximately as 1.5 mm. This is an allowance around the digital mask, not proof of 1.5 mm coverage beyond the physical blank. The current masks, template outlines and some camera paths disagree; code cannot establish which matches stock without measurements.

## Verification

Run `node tools/tests/print_geometry.cjs` for brute-force distance-field and half-pixel mapping checks. Run `node tools/tests/print_fidelity.cjs <output-directory>` for every customizer kit in Chromium and WebKit, followed by `python3 tools/tests/check_mask_reference.py <output-directory>` for an independent Pillow/NumPy/SciPy mask comparison. The latter requires those Python packages.

`tools/tests/print_recovery.cjs` covers preview-to-print correspondence, intentional clear gaps, export failure recovery, invalid shared case types, optional colorway failures, and an intercepted synthetic order. It blocks external traffic and never submits an actual order.

Regenerate source-derived files after any mask/kit changes:

- `python3 tools/build_mask_geometry.py` (Pillow); `--check` verifies source hashes and all spans.
- `node tools/build_print_layouts.cjs` (Node plus Python/Pillow); `--check` verifies preview proportions and native bounds.
- Bump the in-store service-worker shell version if preview metadata changes.

In the preceding disconnected xTool Studio check, an 882 × 1815 PNG imported as 74.68 × 153.67 mm. Choose **Keep size**, not **Scale to fit**, at the oversized-image prompt. Recheck both dimensions for each job. No device connection or print was initiated.

## Physical acceptance still required

1. Compare the stocked blank against the view mask and vendor template. Do not automatically replace camera cutouts with the conflicting `tplD` paths.
2. Check outer edges, camera clearance and full bleed on each blank/jig family, especially 15/16/17 where the view-mask boundary can sit inside the vendor trim.
3. Decide the safe inner-edge bleed per blank. The existing 18-pixel dilation grows toward camera openings as well as outward. This policy is not validated by the software mask tests. A measured per-model camera margin is the next geometry input.
4. iPhone 18 Pro/Pro Max retain the respective 17 masks/specs as Corey confirmed. Test those shared blank families physically before customer printing.
5. Samsung S26 Plus shares a provisional S26 mask; the older 12/13 camera paths are approximate. Do not infer production readiness from their software test coverage. In-store active models remain controlled by `instore/models.json`.
6. Use the exact jig preset and verify dimensions before printing. The fit inspection controls are overlays only and do not change an exported mask.
7. Print one library design, one customer-photo test and one name-only test; inspect colour, tiny text, cure and edge coverage. Audit the navy hometown fine-text designs on real samples before merchandising them as proven UV output.
8. Run the final Guided Access/idle-reset check on the actual store iPad.

Do not overwrite the original Drive colorway masters because print geometry changed. Those files are reusable artwork; this batch changes the final case-specific render, not the authored colorways.

## November 13 bottom-edge display follow-up (local, not released)

Corey identified a clear strip at the bottom of the gallery’s iPhone 17/18 Pro Max preview. `assets/preview-edge.js` extends only the lower display-mask boundary by the existing 18-pixel print bleed mapped into mockup coordinates. Max-alpha union preserves antialiasing. The source mask, camera opening and top boundary are unchanged. Gallery, kiosk and customizer share the helper; service worker v8 requires it for offline use.

Chromium and WebKit confirm byte-identical print PNGs with the helper enabled versus disabled, no alpha changes above the lower band, and unchanged masks for other models. Sixteen targeted fidelity checks and 127 in-store/offline checks pass. Before/after images are in `../collaboration/gallery-clip-before.png` and `gallery-edge-after.png`.

The preview now displays coverage already present in the print file. Actual visible coverage on the stocked blank still needs the disconnected printer’s physical acceptance check.
