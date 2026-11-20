# Keepsake editor direction — 2026-11-20

Based on a hands-on Balaji Studio walkthrough and independent Claude Code review.

## Decision

Use a dedicated, case-first editor with a separate accessories and counter-review step. Reuse Keepsake’s existing artwork, clear-case renderer, masks, pricing and counter-card functions. Do not fork the print renderer or replace it with a supplier embed.

### Customer journey

1. **Your phone:** choose the device; clear case is the only case type offered. Show the configured store on shared kiosks.
2. **Your design:** browse collections, search, or ask the team for help with a personal photo. Retain two cards per row on mobile.
3. **Make it yours:** large mounted clear-case preview, phone/change control, Back, Undo/Redo, and a prominent **Preview design** action. One tool panel open at a time.
4. **Complete your setup:** optional $19.99 bundled glass and compatible accessories stocked at the selected store. Preserve the design when going back.
5. **Show at counter:** read-only case, background, personalization, phone, glass and accessory SKUs, store and estimated total. **Edit design**, **Edit accessories**, **Start over**. No payment or submitted-order claim.

### Editor controls

- **Background:** existing backgrounds for that design; never recolor the illustration. Offer transparent/no background only when the asset supports it.
- **Name:** existing name/initials, font, text color, size and orientation controls.
- **Adjust:** center, fit whole image, fill printable area, size and position. Preserve existing camera/edge constraints.
- **Photo:** local file selection on the customer’s own device; staff-assisted transfer while QR is held.
- **Night sky** and **Child’s drawing:** context-specific tools when those modes are selected, rather than unrelated controls shown for every design.
- **Undo/Redo:** bounded history of background, text and placement values, without retaining image references or full-resolution bitmaps. Clear on session reset.

Desktop/touch monitor: preview left, focused tool panel right, persistent next action. Mobile: large preview above a compact tool tray; the active tool opens a sheet with Done, then returns to the case. Keep numerical precision controls under Adjust. Do not leave a keyboard covering the next action.

## What the Balaji walkthrough established

Tested phone/case selection, a template preview and application, sample text editing, a background switch, mobile tools and the final preview. It keeps text and background separate and preserves changes when returning from preview. The mobile tool tray is useful. Template placeholder warnings are useful too.

Balaji’s photo cutout and smart-fit tools were observed but not tested. No customer photos were uploaded and no order was submitted. This comparison does not establish its photo quality or print accuracy. Sample review screenshots are saved privately in collaboration/balaji-*.png.

Avoid importing its case offerings, commercial pricing, assets, AI features or purchase flow. Avoid claiming “Ready to print” next to an unresolved warning. Keep preview quality and staff print verification distinct. “Saved” must accurately describe local/device storage; shared kiosks must not retain customer media across sessions.

## Implementation boundary

The dedicated editor is implemented in customizer.html with assets/design-editor.js and assets/design-editor.css. The kiosk design setup offers “Make it yours” and retains the selected model, design, background, store and extras. The editor provides Design → Preview → Extras → counter review, bounded Undo/Redo, mobile sheets, and the original mounted clear-case renderer. Personal photos remain staff-assisted on shared kiosks. The existing quick counter route remains available offline; opening the editor requires connectivity.

The editor moves the existing live controls into panels and uses a small synchronous core adapter; it does not introduce a second image engine. Undo snapshots contain primitive values only and reset when the model or image source changes. Maintain a single design state through the editor, accessories and review. Changing a phone must revalidate both fit and accessory compatibility. No global service-worker cache of customer photos.

## Handoff and privacy requirements

- Pick codes identify library design/background/model and retail add-ons. They do not encode custom text or uploaded files. A personalized counter card must show text and styling/placement preview and explicitly tell staff to reproduce/check it; the base code alone is insufficient.
- Custom photos and sky artwork need their original/rendered artwork plus counter preview, using the existing local handoff. QR transfer remains on hold for myrepairops.
- Shared-kiosk Start over and idle reset clear selections, undo history, canvases, file inputs, object URLs and any session-specific saved data. Back/forward navigation must not resurrect an earlier customer’s work.
- Staff links are presentation modes on a static site, not authentication. Future private upload and order records require real backend authorization.
- Do not show supplier wholesale prices or private stock quantities.

## Release checks

- Each of West Chester, Pottstown and Newark: case + glass + charger, edit/back, correct store prices, complete counter handoff.
- Chromium and WebKit at touch-monitor, tablet, 390px and 320px widths: no obscured action, no horizontal overflow; keyboard and zoom dismiss cleanly.
- Same artwork/geometry between preview, review and print export; verify all active models after any renderer change.
- Personal text and photos never enter URLs, analytics, public repositories, service-worker caches or shared persistent storage.
- Failure states for missing catalog, unavailable image, invalid pricing and offline reload are explicit and do not fabricate a total or print approval.
- Physical blank alignment, color and actual printing remain unverified until the printer is connected.

## Review reconciliation

Claude reviewed supplied source/observations, not the browser directly. Some concerns from the markup excerpt were already handled in runtime: Order buttons become counter-review actions; the staff customizer URL is only used by the staff lookup; the shared kiosk offers staff help instead of uploads; fixed-store kiosk behavior and personal-text counter-card display are already tested. Glass $29.99 standalone/$19.99 bundled is explicitly owner-confirmed. Do not treat these as new unresolved owner questions.

Confirmed extra fix: invalid case prices now reject loading instead of showing $NaN. Static button fallback text and name/promo autocomplete were also corrected. The service-worker install now drains each response into its versioned cache immediately; the new worker still activates only when every required resource succeeds. Cached accessory, zoom and seasonal scripts/styles are served offline.

## Implementation review — 2026-11-20

Claude source review prompted wall-clock kiosk expiry on wake/focus, privacy listeners installed before UI construction, duplicate sheet-dismissal protection, focus restoration, invalid browser-Forward guards, and moving the live canvas inside the mobile Adjust dialog. Footer/status height and visualViewport changes drive toolbar and keyboard layout. Purge and restore are synchronous; no private draft storage was added. Chrome/WebKit tests exercise these paths; physical iPhone keyboard and sleep behavior still require device verification.

## Counter rehearsal follow-up

See editor-counter-audit-2026-11-20.md. The receipt now leads with total and selected extras, supports direct editing and next-customer clearing, and allows five minutes of inactivity at the counter (three minutes in the editor). QR deployment is still held.
