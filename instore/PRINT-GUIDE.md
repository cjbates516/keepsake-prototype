# Keepsake in-store browsing and printing

Customer touch screen: [Open browsing](./). Print computer: [Open the print counter](find.html).

## Set each kiosk to its store

Bookmark the correct link on the customer touch monitor. The store stays fixed through start-over and idle reset:

- [West Chester](https://cjbates516.github.io/keepsake-prototype/instore/?store=West%20Chester%2C%20PA)
- [Pottstown](https://cjbates516.github.io/keepsake-prototype/instore/?store=Pottstown%2C%20PA)
- [Newark](https://cjbates516.github.io/keepsake-prototype/instore/?store=Newark%2C%20DE)

Check the store label at the top before handing the screen to a customer. An unconfigured kiosk asks for a store during setup. Stock and accessory prices are a dated snapshot, so staff must confirm current availability and device fit. Case and glass prices are the same across the three stores; some accessory prices differ. Newark has no sales tax; Pennsylvania prices are shown before tax.

After a site update, open or reload the kiosk while online and allow its offline files to update. Previously viewed cases and cached accessories can work offline; an unseen photo may still need a connection. If a preview cannot load, the handoff explicitly tells staff to verify the design and background before printing.

## Library design

1. On the customer screen, choose the phone. Search by name or browse a collection.
2. Choose the design and colorway. Every case design is $44.99. Tempered glass is $29.99 separately or $19.99 with a case, for $64.98 before tax.
3. Add glass and an optional charger or other accessory. The bottom bar keeps the current total and **Review my setup** button visible. Review shows the case, glass, accessories and store together. Use **Edit this setup** to change the selection. The code includes the selected background, extras and store; choosing a charger-help request does not add an unknown charger price. A displayed code remains for five minutes without interaction. Ordinary browsing resets after 75 seconds. A reminder appears during the final 15 seconds.
4. On the print computer, enter the code at **Find a pick code**. Check the phone, title, background, glass, accessory SKUs and store with the customer. If no code is available, select the phone and search by design name.
5. Open **Prepare print**. Add a name if requested. Confirm spelling, crop, camera opening and the physical blank before downloading.
6. Choose **Download print PNG**. The file is transparent and has 300 DPI metadata. The workspace shows its exact pixel and millimetre dimensions, including the existing 18-pixel mask bleed (about 1.5 mm). Physical edge coverage still needs a blank check. The filename identifies the phone, artwork and colorway.
7. Import the PNG into xTool Studio. Confirm both dimensions against the workspace, even if the software reads the resolution automatically. Choose **Keep size** if xTool asks to scale the image to fit. Do not use fit-to-page or add a background. Use the matching blank, jig and the store’s validated print preset.
8. Preview with the customer before committing ink. Inspect alignment, camera opening, banding and cure quality under counter light. Ring the sale at the counter. Downloading does not submit a paid order or send the file to the printer.
9. Choose **Next customer** when finished. It clears the workspace photo and name before returning to the counter page.

## Customer photo or name only

Choose the phone explicitly under **No pick code? Start here**, then **Use a customer photo or name**. Ask the customer to transfer their original file using the store’s transfer method. Upload on the print computer, adjust the crop and check image quality together. For a name-only case, enter the name without uploading a photo.

This staff workspace does not submit photos, names or phone numbers to the order server. Preparing a print creates local browser data; downloading creates a file on the print computer. Remove transferred photos and downloaded print files after the job according to store policy. The browsing screen never accepts personal photo uploads. QR uploads remain on hold for myrepairops.

## Recovery

- No search results: clear the search or choose a different collection.
- No preview while offline: previously viewed artwork may work, but an authored colorway must have been loaded while online. Reconnect and retry. The code button stays disabled until the selected preview is ready.
- Missing colorway: choose an available colorway explicitly, or reload after reconnecting. An unavailable requested colorway cannot print as Original without an explicit selection.
- Invalid phone link: return to the print counter and select the correct phone. Never print a default phone in place of an unrecognised model.
- New upload or crop: download again. The previous file is not updated automatically.

## Store acceptance check

Software tests cover browsing, lookup, photos, names, colorways, downloads, PNG transparency and resolution, offline recovery and reset. Physical printing and the real store iPad still require these checks:

- Open browsing in Safari on the store iPad, add it to the Home Screen and enable Guided Access.
- Confirm all listed blanks are in stock and the corresponding jig is ready.
- Import a generated PNG into xTool Studio and verify the displayed dimensions.
- Print one test for each supported blank/jig family before customer use. Check edge coverage, camera clearance, alignment and colour under counter light.
- The iPhone 18 Pro uses the 17 Pro mask and specs; the 18 Pro Max uses the 17 Pro Max mask and specs, as confirmed by Corey. The website preserves those shared files.
- Complete one photo job and one named library job. Confirm the customer-approved preview matches the physical output.
- Check that **Next customer** clears the previous photo and name, and that both idle timings work in Guided Access.

Source for supported PNG import and image-size settings: [xTool Studio overview](https://support.xtool.com/article/2442). DPI metadata does not replace the physical alignment check.

Software geometry details and remaining per-blank checks: [Print fidelity](../docs/PRINT-FIDELITY.md). Future customer-file intake and retention recommendations: [Next iterations](../docs/NEXT-ITERATIONS.md).
