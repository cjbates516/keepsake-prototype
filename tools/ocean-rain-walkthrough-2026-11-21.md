# Ocean and rain customer walkthrough

The homepage Turtle Glide and Midnight Window cases now preserve their collection section when a customer returns to Designs. The editor accepts the existing same-origin Ocean & Rain lookbook return link; other origin/path restrictions remain in place.

Original-only library artwork no longer offers an empty Background tool. Desktop starts with Phone when there are no background choices; mobile keeps the compact tool tray. Designs with variations retain the thumbnail choices and Background tool. A failed colorway retains its recovery choice. Copy describes the available actions, and the editor script URL is versioned for existing visitors.

## Checks

- `tools/tests/ocean_rain_walkthrough.cjs`: 20 complete journeys in Chromium and WebKit. Two featured designs at 375×667 mobile and 1280×900 touch desktop, plus both designs through the kiosk for West Chester, Pottstown, and Newark. iPhone 15 Pro and iPhone 16 Pro Max.
- Each journey checks mounted clear case, Original artwork, 1× zoom, adding a name, glass and 30W charger, editing without losing extras, correct store and total, counter preview pixel equality, return to the correct collection, and next-customer clearing for kiosks. Phone finish changes must leave the print hash unchanged. No POST uploads/orders or JavaScript errors.
- Counter-card download fallback checked on desktop in both engines, with Web Share capability disabled in the test so it does not open the operating-system share sheet.
- `tools/tests/ocean_rain_flow.cjs`: both six-design galleries, all 12 collection entries, lookbook phone selection and collection return, mobile two-column grid, kiosk pick code, and counter flow in both engines at 390 and 1280 px.
- `tools/tests/product_studio.cjs`: existing visual background choices, exact print restoration, phone-only finish changes, personal photo layouts, and dark phone display remain intact in both engines at 390 and 1280 px.

QR uploads remain on hold. Shared kiosk uploads stay disabled; purchases and printing remain in store. Browser viewport/touch checks are not a physical iPhone or printer calibration test. Evidence is saved in the sibling collaboration/ocean-rain-walkthrough-2026-11-21 folder.
