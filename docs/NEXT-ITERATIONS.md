# Keepsake: next iterations and customer file intake

Prepared November 12, 2026. This is a prioritized recommendation, not a claim that these integrations are already running.

The opportunity is a polished, easy-to-browse design collection paired with a much faster local service. Compete on distinctive art, accurate previews, helpful team members and a case the customer can see being made. Measure that experience before calling the site better than another brand.

## Recommended order

| Priority | Improvement | What success looks like | Dependency |
|---|---|---|---|
| 1 | Validate each physical blank family | Signed-off camera clearance, edge coverage, colour and jig preset; attach one real sample photo per model | Connected printer and blanks |
| 1 | Private QR photo intake | Customer scans, chooses an original photo, sees progress and a receipt; correct store receives it without requiring an account | Authenticated staff backend and private storage |
| 1 | Real product photography | Consistent front/back/edge shots, three real printing clips, and actual finished-case photos | Photograph physical samples; separate permission for customer photos |
| 2 | Curated collection pages | Lead with 8–12 strong designs per collection, then offer the full library; show all five colorways together | Editorial selection, no deletion of existing designs |
| 2 | Better discovery | “Bold”, “Minimal”, “Nature”, “Local”, “Gift”; synonym search; one-session favourites and side-by-side compare | Agreed tagging and taxonomy |
| 2 | Staff job queue | Received → customer approved → ready → printed → collected; reprint reason and printer preset recorded | Server-side identity and per-store authorization |
| 2 | Honest availability | Device blanks and glass availability shown per store; alternative store offered when needed | Reliable inventory ownership and refresh process |
| 3 | Proof approval | Save exact selected artwork, colorway, model, name, crop, version and customer approval before ink | Queue and private file storage |
| 3 | Small rotating original drops | A consistent monthly collection, local artist collaborations with documented rights, seasonal windows | Art direction and print samples |
| 3 | Performance and accessibility | First usable browse in <2 seconds on store Wi-Fi as a target; large controls, keyboard access, screen-reader flow, contrast and real-device testing | Measurement on actual store iPads |
| 4 | Online checkout and tracking | Durable order receipt, correct totals, payment reconciliation, pickup notifications and refunds | Separate payment/backend acceptance; do not present a local code as an accepted order |
| 4 | Repeat purchase | Customer-controlled saved designs, reorder from an approved proof, optional loyalty | Explicit retention choices and account security |

CASETiFY groups customization into text, stickers, photos and prints, and makes device selection prominent. Those are useful navigation patterns; Keepsake should use its own artwork and brand. [CASETiFY Custom Studio](https://www.casetify.com/custom-iphone-case)

Use real photography to restore trust in a future “Made in store” section. Do not relaunch generated lifestyle scenes under “See it in real life.” Show the actual case and clearly label digital previews. Keep $44.99 case pricing and the $19.99 bundled glass option visible throughout the journey.

## Customer uploads: recommended experience

A private, short-lived QR upload session is the best long-term fit. It avoids asking customers to sign in, hand over their unlocked phone or send personal photos to a team member’s personal account.

1. A signed-in team member starts a job for their store, device and blank. The server creates a random upload session valid for 15 minutes. The counter displays its QR code and a short matching job label.
2. Customer scans on their own phone. The page says which store/job will receive the file, explains its use and retention, and asks for permission to print it. A marketing permission is separate, optional and unchecked.
3. Customer selects the original JPG, PNG or HEIC from Photos/Files. Show a thumbnail, pixel-quality guidance, progress, cancel and retry. Never substitute a screenshot or a compressed messaging preview.
4. The server accepts into a private quarantine area, verifies and decodes the image, normalizes orientation, strips unnecessary metadata, and produces a normalized working image. Staff only see accepted files. Preserve transparent PNGs.
5. Customer sees “Received by [store]” only after server validation succeeds. Staff confirm the matching thumbnail and job with the customer. Upload success is not print approval or payment.
6. Staff prepare the crop/name, show the proof and record approval. Download the exact versioned print file to xTool. Complete the normal alignment and quality check.
7. “Next customer” clears the browser. A separate scheduled server cleanup removes stored files; workstation Downloads and transfer folders also need cleanup. Clearing a browser does not delete disk or cloud copies.

Suggested initial limits, to tune with real jobs: up to 5 images, 25 MB per image, 50 megapixels decoded, and a total quota per session/store. Enforce limits on the server as well as in the UI. Allow image formats only; do not accept archives, HTML, SVG or office documents in the ordinary photo flow.

## Storage and access

Use private object storage with a small authenticated application backend. A Cloudflare Worker plus private R2 is one possible implementation; an equivalent private storage backend is also fine. Keep secrets on the server. A server-minted signed URL can grant a specific upload/download operation for a short time. These URLs can be reused until expiry, so the application must enforce session state, quotas and completion; a signed URL alone is not a one-use upload gate. Finalize into a new immutable object/version so a retry cannot overwrite an approved proof. [Cloudflare R2 signed URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

Team members should authenticate individually, with store-scoped access. A job label is for matching, not permission to download. Use random object names, private buckets, short-lived reads and an access log. Validate type/signature and decoded content rather than trusting a filename or browser MIME type. Process untrusted images with resource limits and current decoders; use quarantine and malware checking before staff access. [OWASP file upload guidance](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

Keep customer job files separate from Keepsake’s reusable design/colorway library. The existing Drive colorway backups are brand assets, not customer storage. If private Drive job folders are desired, use server-side service access and staff-only permissions; never an editable public folder or “anyone with the link” customer photo gallery. Do not send customer files to Claude or an image-generation service as part of routine printing.

Store only the contact information needed for pickup, separately from artwork. Do not put names, phone numbers, images or upload tokens in analytics events. Avoid persistent contact autofill on a shared counter computer. This batch removes the legacy contact autofill and clears its old browser-storage key. Audit the remaining retail prototype before enabling public online ordering.

## Proposed retention policy, to approve before launching intake

| File/state | Proposed retention | Why |
|---|---|---|
| Abandoned or rejected upload | Delete within 24 hours | Limits unnecessary personal files |
| Original customer image | Delete 7 days after collection | Short correction/reprint window |
| Approved print/proof | Delete 30 days after collection unless customer explicitly requests a saved design | Handles corrections while limiting retention |
| Workstation transfer/download copies | Remove at end of shift after job completion | Cloud cleanup cannot reach local copies |
| Marketing photo | Separate explicit consent and separate storage/retention choice | Permission to print does not imply permission to advertise |
| Transaction record | Follow the business’s records policy without retaining the artwork by default | Financial records and personal photos have different purposes |

These durations are proposed product choices, not legal requirements or live guarantees. The older retail prototype mentions 90 days; do not change that public promise until the backend deletion process, local cleanup and customer notice agree. Cover canceled jobs, uncollected orders, backups and deletion failures too. Test deletion with a synthetic job and verify all copies, not just a hidden row.

## Practical interim transfer

For a supported Apple-to-Mac transfer, a team member can receive the customer’s selected file through AirDrop and confirm the thumbnail immediately. Keep a dedicated business receiving device and a per-job transfer folder. AirDrop may save received items in Downloads or another chosen destination, so check and clean both. [Apple AirDrop guide](https://support.apple.com/en-ie/guide/mac-help/mh35868/27/mac/27)

For customers needing another method, use a business-controlled private intake channel, never a personal employee inbox or customer’s cloud password. A Google Form can be a temporary fallback, but its file-upload question requires the customer to sign in to a Google account, adding friction. Its files go to the form owner’s Drive. It should not be the polished primary flow. [Google upload sign-in requirement](https://support.google.com/docs/answer/15473134?hl=en), [Google Forms file storage](https://support.google.com/a/users/answer/13138098?hl=en)

Until the QR backend exists, the site’s own-photo handoff remains honest: transfer with a team member, open locally at the print computer, confirm the proof, then clear the workspace and clean up transferred files according to store policy. No public upload portal has been deployed in this batch.

## Measures for the next month

Track aggregate browse-to-code conversion, time from selection to approved proof, upload failure rate, blank-stock misses, time to completed case and reprint reasons. Start with targets of under 60 seconds to hand off a library design and under 3 minutes to approve a normal photo job. These are targets to measure, not customer promises. Keep customer photos and contact details out of analytics.
