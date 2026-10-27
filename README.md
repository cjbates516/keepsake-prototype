# Keepsake Printing Co — Prototype

Custom phone case e-commerce prototype. Live site: https://cjbates516.github.io/keepsake-prototype/

- `index.html` — home page (hero, how-it-works, occasions, programs)
- `customizer.html` — iPhone 17 Pro Max case customizer (photo upload, drag/zoom/rotate, print export)
- `checkout / b2b / teachers / account / track / gallery / help` — section pages (in progress)
- `assets/photos/` — case product renders (17 / 17 Air / 17 Pro / 17 Pro Max)
- `assets/masks/` — vector print templates (authoritative customizer geometry)
- `design_handoff/` — full site design references + build spec

## Adding new designs
Drop new pattern images into `~/Desktop/case-photos` on the Mac, then ask Claude to
"sync the designs" — it runs `tools/sync_designs.py` (incremental: content-hash dedupe,
auto-categorize from filename, web-size via sips, regenerate `assets/designs/designs.json`)
and pushes. The Design Library page renders whatever is in the manifest.

## Ordering backend and staff queue (added Oct 2026)

- `assets/kp-config.js` — site config: `ORDERS_ENDPOINT` (Apps Script web app URL), `PRICE` (59.99), `CASE_NAME`.
- `tools/kp-orders-appsscript.js` — the order backend. Paste into a Google Apps Script project, run `setup()` once,
  deploy as a Web app (execute as me, anyone), paste the URL into `kp-config.js`. Orders become rows in the
  "Keepsake Orders" Google Sheet; print files and previews land in Drive, "Keepsake Orders / Print Files";
  files are deleted 90 days after pickup by a daily trigger. The staff PIN prints in the setup log.
- `staff.html` — the print queue for team members (PIN, store filter, New → Printed → Picked Up, print file download).
- `customizer.html` — HEIC converts in the browser (heic2any), photos decode with EXIF rotation applied,
  a green / yellow / red quality light runs after every crop, and "Order" builds the 300 DPI print file,
  assigns a preset (Photo · Graphic · Text · Clear Look) and posts the order. With no endpoint set it falls back
  to a reserve code so the counter can still print from the staff "Download print file" link.
- `window.__kp` — read-only hook for Fit Lab and QA: `__kp.state`, `__kp.dpi()`, `__kp.preset()`, `__kp.buildPrint(cb)`.
