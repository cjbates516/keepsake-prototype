# In-store accessory catalog

This is a stock and retail-price snapshot from RepairQ on November 20, 2026, not a live inventory feed. No online checkout or reservation is enabled. Staff confirms stock, fit and final price before payment. Customer photo uploads remain on hold for myrepairops.

## Updating the catalog

- Read positive stock separately for West Chester, Pottstown and Newark. Publish store availability only; do not publish quantities, costs, margins or customer information.
- Read each SKU's **location price overrides**, not just the catalog's enforced-price banner. There were 10 location-dependent prices among the 48 stocked SKUs, including one held SKU. Nine are in the 37-item public catalog.
- Match the exact SKU to an official supplier product and variant photo. Verify connector, length, color, power and device fit. Record photo and description sources in `accessory-sources.json`.
- Use generic customer titles and original short descriptions. Keep authentic product photos intact. The owner's store policy is a **1-year limited warranty**; do not substitute the supplier's lifetime term or handling fee.
- Update the visible snapshot date, all three retail prices, availability and image provenance together. Test `accessories_flow.cjs` and `accessory_store_prices.cjs` in Chromium and WebKit.
- Bump the in-store service worker version when changing offline assets.

## Permanent handoff identifiers

Never reuse an X ID for a different SKU. Existing codes must continue to resolve to the same product. IDs currently use two digits (X01–X99); expand the parser and tests before exceeding that range. Retired items should remain resolvable with an unavailable notice when a future retirement system is added.

Store code order is permanent: S1 = West Chester, PA; S2 = Pottstown, PA; S3 = Newark, DE. Accessory codes require a store suffix. Staff lookup rejects unknown accessory IDs rather than silently excluding their prices. Codes include the chosen store even without accessories, so Newark tax wording survives staff lookup. Older codes without a store still parse.

A physical kiosk can be locked to its store with `instore/?store=Newark%2C%20DE` (or the corresponding exact store name). Start-over resets customer choices while retaining that configured store. An unconfigured kiosk asks the customer to select a store and clears that choice on reset.

## Items held from the public picker

48 stocked SKUs were checked. 37 have verified phone/accessory listings and photos. The remaining 11 are held:

- No exact current supplier SKU match: CAR-PD-20W-W, TEMP-CMRA-iPhone-12-PRO, CAR-PD-20W-A-C, WALL-PD-20W-C-C, CHQi-ALL, WALL-2.4+R-C-A-W, TB-SUCCULENT-TAB, TB-TROP-MONST-TAB.
- Camera-protector model/photo conflicts: TEMP-CMRA-iPHONE-12 and TEMP-2-CMRA-iPHONE-15. Confirm the package and compatibility before release.
- CASE-iPAD9-10.2-BLK is a tablet case, excluded from the phone accessory flow.

The separate case/glass bundle remains $44.99 + $19.99; standalone tempered glass is $29.99. Do not infer a device-specific protector SKU from that generic bundle.
