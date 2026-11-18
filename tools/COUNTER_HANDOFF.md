# Mobile counter handoff

The public customizer opens a review, not an order submission. It shows the case preview, phone, case type, design/background, personalization, extras, store and total. Newark displays zero sales tax; other stores label the amount before tax.

“Save counter card” prepares a PNG in memory after the catalog code resolves. A tap opens native file sharing where supported, otherwise a download. No photo, card or customer details are uploaded or written to browser storage. Closing the review discards its in-memory card and preview. A saved file remains on the customer's device until they delete it.

The card includes the catalog pick code when available. Staff enter that code at `instore/find.html`, then confirm the phone finish, crop, personalization and other extras from the card. Photo and drawing cards ask customers to bring their original photo; night-sky cards ask them to bring their separately saved sky artwork. The card is a reference, **not the printable artwork**.

QR uploads and order deployment remain on hold for myrepairops. Physical printer calibration is still required when the printer is connected.

Validation from the repository with a preview server on port 19038:

```sh
../node-v22.12.0-darwin-arm64/bin/node tools/tests/mobile_counter_walkthrough.cjs
../node-v22.12.0-darwin-arm64/bin/node tools/tests/counter_card.cjs
```

Both tests run Chromium and WebKit; `KP_BASE` selects another server. The card test checks download output, active user gesture for the native-share call, short-screen controls, stale results, failure recovery, personal-photo replacement and staff print export. The native OS share sheet itself still needs a physical iPhone check; browser automation verifies its invocation, not the OS save destination. Review the PNG and dialog screenshots in `/tmp/keepsake-counter-*` after running.
