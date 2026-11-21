# Clear-case preview checks

Static promotional previews must show the photographed clear case mounted on the phone. Use the customizer renderer; do not substitute the legacy bare-device personal images or the empty black-looking case scan.

`render_personal_cases.cjs` rebuilds the drawing and night-sky examples from `personal-case-manifest.json` through the live local customizer. It records source/output hashes in `personal-case-renders.json`. The child’s note is the exact crop already approved for public use; its handwriting is not generated or redrawn.

Run from the repository root with a local HTTP server. Set `KP_PLAYWRIGHT` to the installed Playwright package when needed and `KP_BASE` to the server URL (default http://127.0.0.1:19038/). Set `KP_OUT` to a report directory outside the published repository.

```sh
node tools/render_personal_cases.cjs
node tools/tests/preview_asset_audit.cjs
node tools/tests/preview_page_audit.cjs
node tools/tests/preview_model_audit.cjs
```

The asset audit scans production HTML, JS, CSS and JSON references, requires render metadata for static case previews, compares photographed bumper pixels outside the print mask, rejects the known old bare-device image, and verifies the approved drawing crop pixel for pixel. Scene backgrounds, map details and the social composite are separately classified. Source freshness hashes apply to the two personal renders; other previews are checked against metadata and the referenced case photograph, not claimed to have fresh source hashes.

The page audit enumerates all root and in-store HTML pages at mobile and kiosk widths in Chromium and WebKit. It checks expected image counts, image decoding, stale personal paths, same-origin HTTP failures, page errors, horizontal overflow, and drawing/night-sky enlargement. The model audit checks gallery and editor bumper pixels for every supported model using the referenced finish per model, not every finish permutation.

Browser emulation does not replace physical-device or printer validation. QR upload deployment remains on hold. These checks do not submit orders or run the printer.
