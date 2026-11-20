# Touch design editor — 2026-11-20

The customer customizer now uses a case-first editor inspired by the observed Balaji workflow. The existing artwork compositor, clear-case photography, masks, print export and pricing remain shared.

## Customer flow

- Choose a design and phone from the gallery, or open Make it yours from the in-store screen.
- Phone, Background, Name, Adjust and Photo tools. Night sky and Drawing use contextual tools.
- Desktop has a focused panel beside the case. Mobile opens one sheet; Adjust includes the live draggable case. Names, fonts, colors, fit/fill, size, position and rotation use the existing controls/state.
- Undo/Redo retains up to 20 changes to background, text and placement. It resets on phone or source-image replacement; images are never copied into history.
- Preview design → optional glass/accessories → Show at counter. No payment, checkout or online submission.
- Configured kiosk store is fixed. Local photo uploads are available only on a personal device; the shared monitor directs customers to staff.

## Privacy and resilience

Kiosks warn after 150 seconds and reset at 180 seconds. A wall-clock deadline is checked on visibility/focus/resume and before the next interaction, covering suspended timers. Start over/pagehide clears personal state, file inputs, canvases and undo history. BFCache restores redirect to the store screen. Nothing adds private text or photos to URLs or persistent storage.

QR uploads remain on hold for myrepairops. The existing offline kiosk selection/counter path remains supported. The enhanced editor needs a connection; offline entry displays a reconnect message. Kiosk service worker advances to v25.

## Validation

- Chromium and WebKit at 390px mobile and 1280px touch desktop: backgrounds, name, placement, Undo/Redo, phone changes, zoom, preview/extras/back and counter handoff.
- All stores: case + bundled glass + X26 charger: $94.97 before PA tax in West Chester/Pottstown, $99.97 with no sales tax in Newark. Store and SKU suffixes preserved.
- Local synthetic photo replacement/clear; kiosk reset/back and timed expiry. No customer photos used in tests and no POST requests observed.
- Sky: O‘ahu lookup, updated details block stale previews, generation and counter review. Staff layout remains available. Missing full-quality artwork blocks progression.
- Mobile drag inside modal, duplicate Done, focus return, simulated safe-area padding, browser Forward with invalid design, simulated sleep/wake deadline.
- Seven iPhone/Galaxy model paths in Chrome/WebKit: mounted phone and clear-case camera/rim, gallery/customizer/zoom and legacy links.
- Four print-export hashes (18 Pro/Pro Max × Times Square Rain/Liquid Prism) identical to the prior release.
- Homepage → mobile gallery → choose phone/design → edit → glass → Newark counter → zoom → reload/back.
- Prior kiosk cache upgrades to v25; cached case, accessory and credit files support offline counter handoff.

Claude reviewed source only. Reported high/medium implementation concerns were addressed and tested; conditional async/history concerns were reconciled against the synchronous primitive-only adapter. Physical iPhone keyboard, actual kiosk sleep and printer alignment/color remain hardware checks. No claim of printer-ready calibration is made while the printer is offline.

Second Claude review: editor preview text is scrubbed and the outgoing kiosk document hidden before BFCache reuse; direct native dialog closure restores the case and history; missing case photographs report failure; older page-load history entries reset to Design. These are source-review fixes, not a claim of device-level certification.
