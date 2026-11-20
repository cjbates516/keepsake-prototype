# Editor-to-counter rehearsal — 2026-11-20

## Observed and corrected

The published mobile receipt placed the total below the visible dialog (about 909px down on a 390×844 screen). Long personalization instructions preceded glass and charger selections. The revised receipt leads with the pick code, store, total, phone/name, case, glass and accessory list, beside an enlargeable clear-case preview. Full staff details remain available in a disclosure and in the customer's saved card.

The editor now offers direct Edit design / Edit extras from the counter and Edit your case from Extras. Returning to Design traverses the existing history entries rather than creating an edit→extras Back loop. Browser history changes close the open counter/reset dialog. The Designs link and in-editor Back confirm before discarding personal text, photos or placement edits.

Start over remains available at every editor step. Shared kiosks also have Start next customer on the counter receipt, with confirmation. The reading window is five minutes at the counter and three minutes elsewhere, with a 30-second warning included in either window. Visibility/wake deadlines and the first post-sleep interaction remain protected; an overdue exit prevents subsequent clicks on stale controls. Counter instructions state the five-minute limit. Shared kiosks do not prepare/download personal counter cards or offer an outgoing warranty link.

Store selection precedes extras, with 48px chips and aria-pressed state. Removing incompatible accessories after a phone change produces a visible notice. Store-specific stock warnings derive from the current selection, persist through phone changes, and disappear when the affected item is removed. Saved extras cannot disappear into a lower displayed total when their catalog fails: the total becomes a dash and progression is blocked until the catalog loads. A new case without saved extras can still be reviewed when optional accessories are unavailable.

## Rehearsal evidence

- Chromium and WebKit × 375×667, 820×900, 1280×900 × all three stores: 18 complete kiosk editor journeys. Case selection → name → glass + X26 charger → edit/back → counter summary → zoom → next-customer reset. Key total/code are visible above the action area. Configured store, design, name and extras survive editing; reset clears personal state. No POST requests.
- Public mobile homepage → menu → gallery → phone → editor → actual glass and X26 charger → Newark counter → zoom → reload/back, in both browser engines.
- Case $44.99 + bundled glass $19.99 + X26: $94.97 before PA tax in West Chester/Pottstown; $99.97, no sales tax, in Newark. Staff SKU/code data retained.
- Phone compatibility, store stock notices, personal-device card preparation, optional-catalog failure with/without saved extras, five-minute counter warning/expiry, regular three-minute editor privacy checks.
- Undo/Redo, background/name/placement edits, model changes and print parity regression checks.
- Kiosk cache v26 upgrade and existing offline case/glass/charger counter flow. The enhanced editor still needs a connection.

Two independent Claude source reviews informed the changes. Claude did not operate the browsers; the browser evidence comes from Playwright tests and visual inspection. The missing-catalog fallback already exists in kp-config.js; the core's accessoryError uses the same condition as its counter guard. There are no active toughOnly:true offerings; clear-case photos and print masks were not changed. Native modal Back may close to Extras or traverse to Preview depending on browser behavior; both preserve selections, with explicit edit actions giving a consistent route.

QR upload deployment remains on hold for myrepairops. No online purchasing was added. Physical printer output and real hardware keyboard/sleep behavior remain unverified while the printer is offline; browser emulation is not device certification.
