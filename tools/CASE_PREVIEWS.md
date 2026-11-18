# Case preview consistency

Homepage library slides and the parks, golf, weather, Cherry/Duck and gift collections use `assets/case-only-previews/`. They are generated through the **actual customizer** in `view=case`, using the design, model and background in `featured-case-manifest.json`. Do not paste artwork onto an unrelated phone photograph.

The existing drawing and personalized sky examples use photographed empty clear cases. Keep their camera openings transparent and their links in case-only mode. Gallery categories, including Zodiac and City After Dark, render dynamically with `assets/case-shell.js`.

To regenerate after changing preview geometry, run from this repository with its local server on port 19038:

```sh
../node-v22.12.0-darwin-arm64/bin/node tools/render_featured_cases.cjs
../node-v22.12.0-darwin-arm64/bin/node tools/tests/featured_cases.cjs
../node-v22.12.0-darwin-arm64/bin/node tools/tests/case_view_consistency.cjs
../node-v22.12.0-darwin-arm64/bin/node tools/tests/featured_autoplay.cjs
```

The generator checks design, model, background and camera-opening transparency for every output and records dimensions in `featured-case-renders.json`. Update each image's HTML width/height if those dimensions change. The tests verify collection images, mobile zoom and counter routes, personal studios, slideshow background swaps, and unchanged print PNGs between case-only and mounted views. Visually inspect representative cases on light and dark backgrounds as well.

`KP_BASE` can point the tests at the published site. Do not run the generator against an untrusted host or with customer uploads. These previews are display assets; physical print masks and calibration remain separate. QR upload deployment stays on hold for myrepairops.
