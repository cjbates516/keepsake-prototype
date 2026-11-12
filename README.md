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

## In Store mode (store iPads)

A browse and choose mode for the counter iPad. Customers pick their phone, pick a design, then show a
team member a pick code. No checkout, no uploads, nothing about the customer is collected.

- Open it at `instore/` (live: https://cjbates516.github.io/keepsake-prototype/instore/), or tap the
  In Store button in the site header (shown on iPad and desktop, hidden on phones).
- Three screens: Your phone, Your design (filter chips by collection, plus a Use your own photo tile that
  tells the customer to ask a team member), Show us (big preview, price, Show a team member reveals the pick code).
- After 75 seconds with no taps it goes back to the first screen and clears the pick. Back swipes step back
  one screen and never leave the page. If the design list cannot load, the page says to ask a team member and
  retries by itself every 20 seconds.
- Design thumbnails, case photos, masks and the DM Sans font are cached by `instore/sw.js`, so a slow or dropped
  connection does not leave blank tiles. The design list and settings are network first with a cached fallback.
  The worker only touches caches named `kp-instore-*`.
- Pick codes look like `17P-FLR-012`: phone id, collection code, design number. Team members type the code into
  `instore/find.html` on the print computer; it opens that design on that phone in the customizer, ready to export.

Settings, no code changes needed:
- `instore/models.json`: phones. Set `active` to true only when we stock the blank and have the print mask.
  Samsung entries are there and switched off.
- `instore/config.json`: price, idle seconds, `assets_version` (raise it after replacing a mask or case photo so
  iPads fetch the new file), collection chips (order, label, 3 letter code), and an optional `exclude_files`
  list that keeps designs off the iPad only (empty unless Corey asks).
- `instore/codes.json`: pick code numbers, made by `tools/instore_codes.py`, which `tools/sync_designs.py` now runs
  after every sync. Numbers never change and are never reused; if a design moves collection it gets a new code and
  the old one stays findable. The iPad only shows codes from this file: if it fails to load, no code is shown at all,
  and a design without a number shows "Show this to a team member" instead of a code.
  Check: `python3 tools/instore_codes.py --check` exits 1 if a live design has no code.
- Designs come from `assets/designs/designs.json`. Hidden designs never show. An optional `compatible_models`
  list (phone ids) limits a design to certain phones.

Tests: `tools/tests/instore_e2e.cjs` runs the whole flow in WebKit and Chromium (iPad portrait and landscape,
pick code lookup, customizer load, print export, idle reset, offline, failures). See the comment at its top.

Lock the store iPad with Guided Access (an iPad setting, not code): Settings, Accessibility, Guided Access,
turn it on and set a passcode. Open the In Store page in Safari, triple click the side or top button, tap Start.
Add the page to the Home Screen first if you want it full screen. Triple click again and enter the passcode to leave.
