# Kiosk and photographed clear-case verification — November 20, 2026

## Customer-visible changes

- Kiosk journey: phone → design → background/glass/accessories → read-only counter review. A persistent setup total and next action remain reachable on touch monitors and phones.
- A configured store stays fixed across selections and resets. Counter codes now retain that store even without a charger. Newark shows no sales tax; Pennsylvania estimates remain before tax.
- Counter review itemizes the case, bundled glass and accessory SKU/price, with edit/back controls. Invalid catalog prices fail closed. Phone changes explain removal of incompatible accessories.
- Personalization cards explain that a library pick code identifies the base design, so staff must also use the customer's preview for text, size and placement.
- Offline shell updates drain response bodies immediately and retain the old worker until every required asset succeeds. Cached accessory/zoom/seasonal scripts, styles and photo-credit PDFs have offline fetch routes.

## Missing-case root cause and correction

The eight iPhone 18 Pro/Pro Max SVGs embedded bare-device rear views with a 12px outline. Existing alpha/camera tests accepted those files even though they did not depict a case. The shell adapter is intentionally a no-op; re-enabling the earlier dark overlay would recreate black trim and missing cameras.

The eight display components now embed the corresponding photographed iPhone 17 mounted clear case, following the owner's approved shared 17/18 files. The transparent bumper, side controls, camera lip and lenses remain photographed. Silver uses the unchanged photo. The other three finishes simulate the interior phone panels; device colors are described as approximate. The clear case is not recolored. No print-mask files changed.

Generator: `tools/build_iphone18_case_views.cjs`. Gallery/customizer asset URLs and kiosk configuration use version 13. Featured-case manifest has no iPhone 18 entries; those existing assets already use mounted 15/17/Galaxy clear cases.

Claude independently reviewed the source and root-cause evidence, not the browser. Its finish-mask concerns prompted a visual check of all eight rendered finishes and softer mask transitions. The silver strip between the camera panel and printable back is the photographed camera lip. Sensor exclusions were tightened to avoid artificial silver halos. SVGs are image resources, not inline DOM; their local IDs do not collide. Each file is approximately 60 KB. Browser tests exercise decoding and repeated finish changes; this is not a physical-device performance benchmark.

## Completed checks

- `kiosk_store_walkthrough.cjs`: 12 journeys, Chromium/WebKit × 390px mobile/1280px touch monitor × three stores. Case/background + glass + 30W charger, edit/back, code lookup, staff workspace, totals and reset. West Chester/Pottstown $94.97 before tax; Newark $99.97 with no sales tax, using store-specific charger prices.
- `kiosk_recovery.cjs`: 320px layout, zoom/back, incompatible connector notice, idle reset, store-only code/tax, missing catalog, invalid price and unavailable-preview handling.
- `kiosk_offline_upgrade.cjs`: controlled prior-cache fixture → v24 activation; cached Newark case/glass/charger handoff, scripts/styles and credit PDF work offline. This is not a replay of the old v23 installer or a claim that uncached designs work offline.
- `mobile_counter_walkthrough.cjs` and `counter_card.cjs`: customer flow, personalization handoff, save/share, private-photo replacement, recovery and no online order POSTs.
- `iphone18-qa.cjs`: both 18 sizes, all four finishes, print exports and gallery categories, Chromium/WebKit.
- `cherry_case_rim.cjs`: both sizes × four finishes × gallery/customizer × Chromium/WebKit. No artwork beyond the device alpha; camera and bottom rim retained.
- `case_view_consistency.cjs`: seven models including both 18 sizes, mounted gallery/customizer/zoom, legacy links, mobile overflow and unchanged print across view modes. New pixel comparison requires the actual photographed 18 bumper, preventing the old bare-phone outline from passing again.
- Before/after SHA-256 matches for exported Times Square and Liquid Prism prints on both 18 sizes. Private test artifacts and visual proofs are in the collaboration folder, outside the public repository.
- Visual inspection: all eight 18 finishes on mobile canvases, enlarged case, and kiosk counter card. Clear rim/buttons/camera surround visible, no empty camera holes or black case trim.

## Deliberate limits

The dedicated Balaji-inspired editing workspace is specified in `tools/kiosk-editor-direction.md`; it is not part of this release. The kiosk currently browses library designs and backgrounds, with personal media assisted by staff. QR uploads remain held for myrepairops. No online purchase flow is enabled. Physical alignment, ink color and actual printer output still need the connected printer and real blanks.
