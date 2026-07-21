# Keepsake Printing Co — Prototype

Custom phone case e-commerce prototype. Live site: https://cjbates516.github.io/keepsake-prototype/

- `index.html` — home page (hero, how-it-works, occasions, programs)
- `customizer.html` — iPhone 17 Pro Max case customizer (photo upload, drag/zoom/rotate, print export)
- `checkout / b2b / teachers / account / track / gallery / help` — section pages (in progress)
- `assets/photos/` — case product renders (17 / 17 Air / 17 Pro / 17 Pro Max)
- `assets/masks/` — vector print templates (authoritative customizer geometry)
- `design_handoff/` — full site design references + build spec

## Adding new designs
Drop new pattern images into `~/Desktop/case-photos` on the Mac, then ask Claude to
"sync the designs" — it runs `tools/sync_designs.py` (incremental: content-hash dedupe,
auto-categorize from filename, web-size via sips, regenerate `assets/designs/designs.json`)
and pushes. The Design Library page renders whatever is in the manifest.
