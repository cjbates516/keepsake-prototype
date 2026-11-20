# Case preview consistency

Keepsake sells clear cases. Show the phone mounted inside the clear case, including its camera hardware. Do not replace the transparent case edge with the dark scanned bumper or show empty camera openings. The device mockups already include clear-case edges and camera lips; `case-shell.js` retains compatibility adapters without adding another rim.

Homepage slides and the parks, golf, weather, Cherry/Duck and gift collections use `assets/case-only-previews/` (legacy directory name). These are now mounted clear-case previews generated through the actual customizer in `view=phone`, using `featured-case-manifest.json`. Personal drawing and sky examples also use mounted clear-case views. Old `view=case` links resolve to the mounted view. Display changes must not alter print geometry.

With the local server on port 19038, run:

```sh
../node-v22.12.0-darwin-arm64/bin/node tools/render_featured_cases.cjs
../node-v22.12.0-darwin-arm64/bin/node tools/tests/featured_cases.cjs
../node-v22.12.0-darwin-arm64/bin/node tools/tests/case_view_consistency.cjs
../node-v22.12.0-darwin-arm64/bin/node tools/tests/featured_autoplay.cjs
```

The generator checks design, model, background, case style and visible camera hardware for every output. Dimensions are recorded in `featured-case-renders.json`; update HTML dimensions and asset cache versions after rebuilding. Tests verify mobile images, zoom, counter routes, personal studios, slideshow background swaps, legacy links and identical print PNGs for both link modes. Visually inspect representative clear edges on light and dark backgrounds.

`KP_BASE` can target the published site. These are display assets; physical calibration remains separate. QR uploads stay on hold for myrepairops.
