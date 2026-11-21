# Self-hosted fonts

Fonts used by the caption ("words") templates in `assets/collage/templates.json`.
Every text entry there names its CSS `font` family, `weight` and `src` file below.

All files are static instances (variable fonts pinned with `fontTools.varLib.instancer`),
subset to Latin (U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
U+2000-206F, U+20AC, U+2122, U+2190-2193, U+2212, U+2215, U+FEFF, U+FFFD) with all
OpenType layout features kept, hinting removed, and saved as WOFF2. Name tables
(copyright and license records) are kept. None of these families declares a Reserved Font Name.

| CSS family | Weight | File | License | Source (google/fonts, main) |
|---|---|---|---|---|
| Open Sans | 700 | `open-sans-700.woff2` | OFL 1.1, `LICENSES/open-sans.txt` | https://github.com/google/fonts/tree/main/ofl/opensans (`OpenSans[wdth,wght].ttf`, wght 700, wdth 100) |
| Itim | 400 | `itim-400.woff2` | OFL 1.1, `LICENSES/itim.txt` | https://github.com/google/fonts/tree/main/ofl/itim (`Itim-Regular.ttf`) |
| Nothing You Could Do | 400 | `nothing-you-could-do-400.woff2` | OFL 1.1, `LICENSES/nothing-you-could-do.txt` | https://github.com/google/fonts/tree/main/ofl/nothingyoucoulddo (`NothingYouCouldDo.ttf`) |
| Special Elite | 400 | `special-elite-400.woff2` | Apache 2.0, `LICENSES/special-elite.txt` | https://github.com/google/fonts/tree/main/apache/specialelite (`SpecialElite-Regular.ttf`) |
| DM Sans | 400 | `dm-sans-400.woff2` | OFL 1.1, `LICENSES/dm-sans.txt` | https://github.com/google/fonts/tree/main/ofl/dmsans (`DMSans[opsz,wght].ttf`, wght 400, opsz 9) |
| DM Sans | 500 | `dm-sans-500.woff2` | OFL 1.1, `LICENSES/dm-sans.txt` | same source, wght 500, opsz 9 |
| DM Sans | 700 | `dm-sans-700.woff2` | OFL 1.1, `LICENSES/dm-sans.txt` | same source, wght 700, opsz 9 |
| Oswald | 300 | `oswald-300.woff2` | OFL 1.1, `LICENSES/oswald.txt` | https://github.com/google/fonts/tree/main/ofl/oswald (`Oswald[wght].ttf`, wght 300) |
| Hurricane | 400 | `hurricane-400.woff2` | OFL 1.1, `LICENSES/hurricane.txt` | https://github.com/google/fonts/tree/main/ofl/hurricane (`Hurricane-Regular.ttf`) |
| Grechen Fuemen | 400 | `grechen-fuemen-400.woff2` | OFL 1.1, `LICENSES/grechen-fuemen.txt` | https://github.com/google/fonts/tree/main/ofl/grechenfuemen (`GrechenFuemen-Regular.ttf`) |
| Ms Madi | 400 | `ms-madi-400.woff2` | OFL 1.1, `LICENSES/ms-madi.txt` | https://github.com/google/fonts/tree/main/ofl/msmadi (`MsMadi-Regular.ttf`) |
| Damion | 400 | `damion-400.woff2` | OFL 1.1, `LICENSES/damion.txt` | https://github.com/google/fonts/tree/main/ofl/damion (`Damion-Regular.ttf`) |

License texts in `LICENSES/` are copied unchanged (line endings normalized) from the
`OFL.txt` or `LICENSE.txt` next to each font in the google/fonts repository.

Loading note: canvas text silently falls back to another font while a web font is still
loading. Declare each file with `@font-face` (family and weight as in the table) and await
`document.fonts.load('<weight> <px>px "<family>"')` before drawing the stage or the print file.
