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
  A code does not say which case, so the page shows the clear and the Rated price and asks the team member to check
  the customer's screen or card before printing (the print workspace opens on the clear case).

Settings, no code changes needed:
- `instore/models.json`: phones. Set `active` to true only when we stock the blank and have the print mask.
  Samsung entries are there and switched off. Phones that come in the Rated Case only have no row (not stocked); kiosk
  customers reach them in the editor's Phone tool.
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

Every case design is $44.99 on the clear case; the Rated Case, offered on the phones listed under Case options below, is $49.99. Tempered glass is $29.99 separately, with $10 off when added to a case ($19.99 glass; $64.98 bundle with the clear case, $69.98 with the Rated Case, before any other applicable promotion). Runtime prices live in `assets/kp-config.js`; storefront copy mirrors those prices.

Phones on the storefront: the kits in `customizer.html` are the one list. `tools/build_print_layouts.cjs` writes `assets/rated-phones.js` from them (Rated only phones with their brand, mask, back color, drop rating and rims, and the phones that come in both cases), and `gallery.html` builds its Rated only phones, brands (Apple, Samsung, Google, Motorola), prices and wording from it. Rated only cards say "Rated Case · $49.99" and "Rim color", their links carry `rim=<name>` without `case=rated` (the phone, not the customer, chose that case, so the next phone with a clear case is clear again), and the panel shows the phone's back color like the editor's `drawRatedPanel` (nothing is drawn until the mask loads, so the white print area guide never shows as the product). A phone in `COMING_SOON` is not in the gallery or the finder, and `gallery.html?device=` for a phone without a case says so. The home phone finder (`#homeDevice` in `index.html`) is plain HTML that `tools/build_print_layouts.cjs` keeps in step with the kits (a newly offered phone joins its brand's list; `--check` fails until it has). With a phone chosen, the gallery's Use your own photo and Design your case links open the editor on that phone. `tools/tests/rated_everywhere.cjs` compares the gallery, finder, menu and editor with the kits, phone by phone.

Colorways preserve the focal artwork while changing the surrounding background. Every active library design has five alternatives plus the original. Each design has a frozen palette in `assets/colorway-catalog.js`; ordinary uploaded photos are not recolored. Neon Doodles adds six original neon patterns. Detailed scenery uses a framed treatment that preserves the full image. `assets/design-colorways.js` is the shared local composition renderer. Selected colorways must travel with the design into preview, staff handoff and print export.

Generated lifestyle scenes are removed. Physical printer alignment still needs a store hardware check.

Layouts: on the photo path only (never on library designs or the sky and drawing studios), the customizer lazy loads `assets/collage/templates.json` and shows a "Choose a layout" strip: Single photo, then the words templates (marked Aa), then the photo collages. Every thumbnail is photo free; no sample stock photos ship. Words templates add a "Your words" field per caption (names and dates start empty and show a faded sample on the stage only; phrases start filled and print exactly as typed, so a cleared box prints nothing). Caption fonts are self hosted under `assets/fonts` with their licenses in `assets/fonts/LICENSES`; the print export waits until every needed face has loaded. A print quality pill under the preview rates each customer photo, and for collages the softest spot. In the touch editor (`assets/design-editor.js`) the strip is the **Layouts** tool and the caption fields are the **Words** tool, which replaces Name while a words template is active; kiosks (`?kiosk=1`) show no Layouts because personal photos stay staff assisted there, and `?staff=1` keeps the classic rail picker. Undo covers names and words but never layouts or photos (a layout change starts a fresh history). Browsing layouts never loses work: photos a smaller layout cannot hold are saved for the next layout with room, photos still loading follow the customer, words are kept per layout and carried by key (name to name), and Single photo gets back its placement and full 3072 px copy. Every spot also has a button in the Photo tool (Add or Replace photo N) for keyboard and screen reader users; the softest photo is outlined on the case. Remove all photos asks first. Words are checked against each phone's print mask: a field that would run off the case or under the camera moves and shrinks inside its own box, and one that would print below 55% of the size its longest words print at is not shown on that phone (the Words tool, Preview, counter review and staff details say so), so a short word is never hidden where a longer one would print. The Rated Case panel is checked the same way. A label for one photo (Photo Dump) prints only once that photo is added. Photo credits for library designs sit under the case on the web editor (above it on short phone screens), so a CC BY credit link is visible without opening a tool; on kiosks the credit link stays in the Photo tool with its attribution href but is hidden (`.studio-kiosk #cityPhotoCredit` in `assets/design-editor.css`), so a credits page can never become a way out of the kiosk editor. The staff workspace offers a credit slip link for any design whose colorway catalog entry names a `creditSlip` PDF. Credit lines and slips from designs.json entries (`credit`, `license`, `creditSlip`) are supported but switched off while no entry carries them, so designs.json is not fetched for them: set `KP_DESIGN_CREDITS` in `customizer.html` to true when a collection ships those fields. `tools/tests/collage_captions.cjs` drives both editor tools at 390 and 1440 px in Chromium and WebKit and the classic staff picker; `tools/tests/collage_review_fixes.cjs` covers the behaviour above, and `tools/tests/collage_words_fit.cjs` checks every words field on every phone kit for ink outside the print trim. Template art sources and edits: `docs/COLLAGE-TEMPLATE-SOURCES.md`.

Case options: 29 phones get the MagSafe Clear case (`KP_CONFIG.PRICE`). The Rated Case (`KP_CONFIG.RATED_PRICE`: drop rated, printable back panel, frosted rim in Smoke Frost or Clear Frost) is offered on every phone with a Rated kit (`KITS[model].rated`, the KP-RATED-KITS block in `customizer.html`), 54 phones in two lists. `RATED`: 26 phones that also have a clear kit (every one except iPhone 12 mini, 12 Pro Max and 13 mini). `RATED_ONLY`: 28 phones with no clear case (iPhone Duo, 17e, 16e, 11, Galaxy S26 FE, the S25 and S24 families, A37, A36, A17, Pixel 10 and 11, moto g), whose kits have `ratedOnly` and are built from one row per photo (`BLANK`). Galaxy S24 Ultra is built too but in `COMING_SOON`, so the menus list it as coming soon; taking its name out of that list and running `tools/build_print_layouts.cjs` turns it on everywhere (it has no photos we can show, so See photos stays hidden there). `CLEAR_FROST_ONLY` and `SMOKE_FROST_ONLY` hold the rims; a key in neither comes in both, Smoke Frost first. Photos are `assets/cases/rated-<key>-<smoke|clear>.webp`, panel masks `assets/masks/view-rated-<key>.png` and the light map `assets/cases/rated-light.jpg`. `python3 tools/build_mask_geometry.py` compiles the masks into `assets/mask-geometry.js` (every phone with a clear case) and `assets/mask-geometry-rated.js` (masks only Rated only phones use, which `loadKit` loads with the first such phone, with one retry and then the usual mask message; a reply without the mask counts as a failure, and the next phone, case or rim choice tries again). For `RATED` phones print geometry (TPL, FIT) stays the base kit's because every panel mask lies inside its base kit's clear view mask (the S26 and S26 Ultra masks were intersected with theirs; `rated_case.cjs` checks all 26); Rated only kits carry their own, placed at 14.5015 stage px per mm. The white panel in the photos is a print area guide, not a white back: `RATED` previews show the clear photo of the phone through it (`drawCaseBase`), and Rated only previews tint it with the photographed phone's own back color (`BLANK[key].back`, `drawRatedPanel`), so those phones have one unnamed finish (no swatches, no finish in the address, review or card). The touch editor shows the choice in the Phone tool (`#studioCase`, with rim chips while Rated is chosen); `?staff=1` shows the `#ctRow` cards. A Rated only phone shows one card. Both cards read "20 ft drop protection · Confirm availability in store" from the kit's `rated.dropFt` (the iPhone Duo listing publishes no rating, so it shows the availability line only). The Duo also has no tempered glass and no layouts (its nearly square panel shows about 61% of a 9:16 page, so spots fall outside it). `kpNormalizeCaseType` is the one rule for the case type: a phone without a Rated kit falls back to the clear case with a toast, and a Rated only phone always gets the Rated Case with a toast that says the new price; `state.ratedForced` remembers that the phone, not the customer, chose it, so a customer who had the clear case gets it back on the next phone that has one, with a message that says so. The case stays out of undo, and purge, Start over and Next customer return to the clear case. The choice and its rim ride in the page address (`case=rated&rim=<name>`, written by `saveLibraryOptions` and read at startup in every mode; a Rated only phone writes only its rim unless the customer chose Rated), so a reload or a shared link keeps the Rated Case and its price; an unsupported phone falls back with the toast. On the Rated Case the Text position slider spans only the part of the clear range where the whole name sits on the panel. Under the case, the editor gives up only the height the rows below it need to clear the tool tray or footer before scrolling (`fitStage` in `design-editor.js`, never above the baseline size). The counter review shows "Rated Case · <rim>" in the details and "Use a Rated Case blank in <rim>." as a plain line on the screen (kiosks save no card); the counter card carries the same line for the team, because pick codes do not encode the case (amber notes stay for real problems only). A phone that is not active in `instore/models.json` gets no pick code, but the review and the editor still show the design's title, which team members can search. Rated prints are an allow list (`kpRatedPrintIssue`): the staff download refuses a Rated Case design unless `KP_CONFIG.RATED_PRINT_READY` is true and that kit's `rated.template` is `'measured'` (every kit is `'estimate'` today), and a Rated only kit, or a Rated panel mask that is still loaded, counts as Rated whatever the case type says; customers are never blocked. Rated print file names carry `-rated`. Partial collages: a customer can preview and review a layout with empty photo spots (Preview, the bar above the footer, the counter review and the card say "N of M photo spots are empty…"), but staff downloads (`__kp.staffPrintIssue`, `buildPrint(done,{staff:true})`) wait until every spot has a photo. A photo spot that is less than a tenth on the panel (behind the camera) is named under the spot buttons, in Preview and in the review ("Photo 1 is not shown on this phone.", `kpHiddenNote`). Tests: `tools/tests/rated_case.cjs` (Chromium and WebKit, 320, 390 and 1440 px).

Rated Case photos: a **See photos** button beside Enlarge case under the editor's case preview (shown for every phone with a Rated kit, whichever case is chosen; under the `#ctRow` cards on `?staff=1`) opens a full screen viewer on phones and a large panel on desktop (`assets/rated-gallery.js` and `.css`, loaded after `design-editor.js`). It shows this phone's photos per rim (front and back, both side views, back, front), a rim switch, thumbnails, swipe and arrow keys, and an **On other phones** set with the case on other phones and phone colors (never the iPhone Duo, whose blank is another case with no drop rating). Choose Rated Case · <rim> sets the case through the editor's own case and rim radios (or `core.setCase`/`core.setRim` on the classic rail), so the price, case photo and address follow; it reads Back to my design when that case and rim are already chosen (on a phone that comes in the Rated Case only, Choose <rim> changes the rim alone). A rim with no photo we can show (Galaxy S24 and S25 in Smoke Frost) shows the other rim's photos under their own captions, with a note that says so; a phone on a blank photographed with another phone is noted as similar. The facts beside the photos list the price, the kit's drop rating (`KPStudioCore.info().drop`, none on the iPhone Duo), Confirm availability in store, and that the design is printed on the back (the white panel in the photos is the print area, so never call it a white back). The viewer adds one history entry (Back closes it), has no links, and closes on purge (kiosk idle reset, Start over, Next customer). The photos are the blank case's listing images saved Nov 20 to 23 2026, until we have photos of our own printed cases: `python3 tools/build_rated_photos.py` reads the saved listing photos from the vendor photos folder beside the repo (see `docs/RATED-CASE-PHOTOS.md`) and writes `assets/cases/rated-photos/` (1000 × 1200 WebP, a 1600 × 1920 `-hd` copy the viewer loads where it would otherwise draw the photo more than 15% bigger than its pixels, such as the in-store iPad, and 200 × 240 thumbnails, about 13.3 MB in all, at most 14 MB, and `manifest.json`, with the phone list taken from KP-RATED-KITS: RATED and RATED_ONLY without COMING_SOON) and `docs/RATED-CASE-PHOTOS.md` (source to output, exclusions such as the photo with an app logo, the iPhone Duo lock screen clock and the Galaxy, Pixel and moto rims with an embossed name; the letters printed around the moto flash and the broken scraps under the Galaxy S24 camera lip are taken off our copies). On other phones leaves out the customer's own phone, and the rim chips stay in view there because Choose names this phone's rim. `python3 tools/build_rated_photos.py --check` fails when a phone gains a Rated kit without photos. Served names, captions and alt text never name the vendor. Tests: `tools/tests/rated_photos.cjs` (Chromium and WebKit, 390 touch and 1440 px, kiosk and staff rail).

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
The page uses two labeled digital slate composites made with licensed family stock photos and supplier slate references, with complete stone edges and display supports visible. These are AI-assisted mockups, not photographs of finished Keepsake prints. Photo provenance and permitted marketing-only use are recorded in `docs/SLATE-PHOTO-SOURCES.md`.
No slate print masks or physical dimensions are inferred by this storefront feature.

Run `node tools/tests/slates.cjs <output-directory>` against a local server on port8766,
or set `KP_BASE` to a deployed base URL. Checks cover Chromium/WebKit, mobile/desktop,
all prices, loaded sample photos and labels, illustration ratios, summary focus, links and the no-JavaScript fallback at 320, 390, 768 and 1440 px in Chromium and WebKit.

### Pending print exports

Staff downloads are canceled if the model, crop, name, colorway or photo changes while PNG encoding is pending. Encoder failures release the button so staff can retry without clearing the customer. `node tools/tests/print_pending.cjs` (local server on port 8766, or `KP_BASE`) deliberately delays encoding and injects synchronous, rejected and invalid-output failures in Chromium and WebKit. This is software validation only; printer, blank and jig acceptance remains separate.

### Counter discovery and recovery

Staff design-name results include original-artwork thumbnails, explicitly labeled so a selected colorway is not confused with the thumbnail. Phone lists recover after an initial fetch failure with a retry button or a successful pick-code lookup. Retry preserves keyboard focus; incompatible design/phone combinations are blocked, and designs no longer offered in store are marked for staff. `tools/tests/counter_recovery.cjs` verifies failure/retry, compatibility, handoff links and 320–1440 px layouts in Chromium/WebKit.

The slate page also shows the exact 8×10 supplier’s product detail image with a full-size link, distinct from the stock-family digital examples. No supplier measurements are used as production masks.

### Homepage storefront

The homepage uses `assets/homepage.css` and `assets/homepage.js`: a responsive product hero, curated case designs, photo-slate feature, in-store steps, glass bundle and store navigation. Product renders and the AI-assisted slate composite are explicitly labeled. Case designs are $44.99 on the clear case ($49.99 on the Rated Case where offered); the glass bundle total is $64.98 before tax with the clear case. Photo selection in the customizer is local; this change does not deploy private QR intake.

Run `node tools/tests/homepage.cjs` with the local server on port 8766, or set `KP_BASE` to the deployed base URL. It checks Chromium and WebKit at 320, 390, 760, 820 and 1440 px, images, overflow, catalog links, pricing, menu keyboard/focus behavior, and the no-JavaScript menu. Physical print validation remains pending.

### Gallery and design studio refresh

`assets/shop-refresh.css` applies the homepage visual language to the gallery and customizer without changing canvas geometry. `assets/shop-dialogs.js` adds keyboard focus/escape handling to existing phone selectors. Gallery finish swatches are buttons and retain explicit selection after hover. With no configured order backend, the public customizer shows a counter-review message without collecting contact details or pretending to submit an order. Private QR deployment remains held.

The homepage now includes a GET-only phone finder and visual collection cards. `tools/tests/shop_refresh.cjs` checks search/empty recovery, keyboard finish controls, phone selector dialogs, colorways/name editing, counter-review behavior and the homepage handoff in Chromium/WebKit at 320/390/820/1440 px. Run the existing staff workspace suite separately for print exports and customer cleanup.
