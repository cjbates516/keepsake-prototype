# Keepsake Printing Co — Prototype

Custom phone case e-commerce prototype. Live site: https://cjbates516.github.io/keepsake-prototype/

- `index.html` — home page (hero, how-it-works, occasions, programs)
- `customizer.html` — phone case customizer and staff print workspace (photo upload, drag/zoom/rotate, print export)
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

- `assets/kp-config.js` — site config: `ORDERS_ENDPOINT` (Apps Script web app URL), `PRICE` (44.99), `CASE_NAME`.
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
- After 75 seconds with no taps while browsing (five minutes while a pick code is displayed), it goes back to the first screen and clears the pick. Back swipes step back
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
- `instore/config.json`: price, idle seconds, displayed-code hold seconds, `assets_version` (raise it after replacing a mask or case photo so
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

## Storefront and design colorways

All case designs are $44.99. Tempered glass is $29.99 separately, with $10 off when added to a case ($19.99 glass; $64.98 bundle before any other applicable promotion). Runtime prices live in `assets/kp-config.js`; storefront copy mirrors those prices.

Colorways preserve the focal artwork while changing the surrounding background. Every active library design has five alternatives plus the original. Each design has a frozen palette in `assets/colorway-catalog.js`; ordinary uploaded photos are not recolored. Neon Doodles adds six original neon patterns. Detailed scenery uses a framed treatment that preserves the full image. `assets/design-colorways.js` is the shared local composition renderer. Selected colorways must travel with the design into preview, staff handoff and print export.

Generated lifestyle scenes and sample collage tiles are removed. Physical printer alignment still needs a store hardware check.

Colorway maintenance:
- `python3 tools/build_colorway_catalog.py` registers new designs and preserves existing palette slots.
- `node tools/prepare_colorways.cjs` samples new source art and prepares per-design palettes; set `PW_CORE` if playwright-core is installed elsewhere. Review generated artwork before release. Designs without prepared palettes show Original only.
- `node tools/export_colorways.cjs /absolute/output/path` exports individual PNG masters and manifests, plus visual review sheets; `CATEGORY="Neon Doodles"` limits a batch.
- Save every batch to Keepsake Printing Co / Design Colorways in Google Drive, including the manifest. Drive uploads in this workflow run through the connected agent, not a background daemon. Split archives below 100 MiB and verify returned file IDs/sizes.
- Pick-code suffixes `-C1` through `-C5` identify the frozen colorway slots; the original retains its existing code. Changing palette order after release would change old codes, so never reorder existing slots.
- When changing the colorway renderer or catalog, bump `instore/sw.js`'s shell version so store iPads refresh the precached scripts.

Software verification for the print-fidelity release: 127/127 browsing, lookup, reset and offline checks; 78/78 staff workspace checks; 205/205 geometry checks across all 29 customizer kits; 42/42 targeted recovery/privacy/order-encoding checks in Chromium and WebKit. All 58 exported mask PNGs also match an independent Pillow/NumPy/SciPy reference pixel for pixel. Synthetic order tests intercept all traffic locally; the production order backend is not certified by these tests. Actual print exports confirm that iPhone 18 Pro and Pro Max reuse their respective 17 print geometry. No production customer orders or physical prints were created by these checks.

## Print counter workspace

`instore/find.html` supports pick codes, name search with colorways, and a required phone selector for customer-photo or name-only jobs. It opens `customizer.html?staff=1`, a local print workspace with retail checkout disabled in both presentation and code. It shows the model, artwork, colorway, print preset and actual export dimensions.

`assets/print-png.js` embeds 300 DPI pHYs metadata without changing image pixels. `assets/staff-print.js` prepares identifiable downloads, blocks unready or empty prints and resets the status when artwork changes. Next customer clears the current photo and name.

Read [the store printing guide](instore/PRINT-GUIDE.md) for the complete workflow and physical acceptance checks. Downloads do not communicate with the printer or ring a sale. Hardware validation remains required.

Tests: `node tools/tests/instore_workspace.cjs <outDir>` covers the staff workflow and actual PNG downloads in Chromium and WebKit. The in-store suite covers the five-minute code hold, 75-second browse reset and offline flow.

## Print fidelity and next iterations

The exporter preserves artwork proportions, uses exact source-derived mask geometry, and adds bleed without stretching the rendered canvas. Kiosk/gallery preview proportions match the customizer. See [print fidelity](docs/PRINT-FIDELITY.md) for test commands, generated-data maintenance and explicit hardware limitations. See [next iterations and private customer file intake](docs/NEXT-ITERATIONS.md) for the prioritized roadmap, proposed QR upload workflow and retention choices. Physical jig/camera validation remains required.

## Photo slates

`slates.html` lists the approved in-store slate prices: 4 × 6 inches $29.99,
5.9 × 7.9 inches $39.99, and 8 × 10 inches $49.99. The holiday pair is two
4 × 6 slates for $49.99. Stands, basic cropping and an optional name/date are included.
The homepage and gift guide link to this page. A size choice produces a counter
selection summary, not a submitted order, reservation or payment. Customers bring
their original photo to staff; the private QR upload service is not deployed.
The page uses real licensed family stock photos in labeled sample slate mockups until actual finished-product photos are supplied. Photo provenance and permitted marketing-only use are recorded in `docs/SLATE-PHOTO-SOURCES.md`.
No slate print masks or physical dimensions are inferred by this storefront feature.

Run `node tools/tests/slates.cjs <output-directory>` against a local server on port8766,
or set `KP_BASE` to a deployed base URL. Checks cover Chromium/WebKit, mobile/desktop,
all prices, loaded sample photos and labels, illustration ratios, summary focus, links and the no-JavaScript fallback at 320, 390, 768 and 1440 px in Chromium and WebKit.

### Pending print exports

Staff downloads are canceled if the model, crop, name, colorway or photo changes while PNG encoding is pending. Encoder failures release the button so staff can retry without clearing the customer. `node tools/tests/print_pending.cjs` (local server on port 8766, or `KP_BASE`) deliberately delays encoding and injects synchronous, rejected and invalid-output failures in Chromium and WebKit. This is software validation only; printer, blank and jig acceptance remains separate.

### Counter discovery and recovery

Staff design-name results include original-artwork thumbnails, explicitly labeled so a selected colorway is not confused with the thumbnail. Phone lists recover after an initial fetch failure with a retry button or a successful pick-code lookup. Retry preserves keyboard focus; incompatible design/phone combinations are blocked, and designs no longer offered in store are marked for staff. `tools/tests/counter_recovery.cjs` verifies failure/retry, compatibility, handoff links and 320–1440 px layouts in Chromium/WebKit.

The slate page also shows the exact 8×10 supplier’s product detail image with a full-size link, distinct from the stock-family digital examples. No supplier measurements are used as production masks.
