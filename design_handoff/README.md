# Handoff: Keepsake Printing Co — Custom Phone Case E-Commerce Site

## Overview
Keepsake Printing Co is a direct-to-consumer + B2B web store for **custom-printed phone cases** (photos printed onto clear MagSafe cases via an xTool UV printer, fulfilled same-day in-store). The centerpiece is a **live case customizer**: a customer picks their phone model, uploads a photo, positions it, and sees it rendered on a real product mockup before ordering. The site also includes B2B wholesale, a teacher program, rewards/referrals, gift cards, accounts, checkout, order tracking, and a help/legal center.

This is a standalone brand that shares the CPR Cell Phone Repair color/type system but is operated separately.

## About the Design Files
The files in this bundle are **design references created as HTML "Design Components" (`.dc.html`)** — prototypes showing intended look, layout, copy, and behavior. They are **not production code to ship directly**. The `.dc.html` format is a proprietary streaming-component wrapper (custom `<x-dc>` templates + a `DCLogic` class); do not try to run it as-is.

The task is to **recreate these designs in a real codebase** — the recommended stack is **Next.js (React) + Tailwind**, with a real backend (see below). Use the HTML as the source of truth for visual design, layout, copy, and interaction intent.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions are all specified. Recreate the UI faithfully, then wire it to real services.

---

## ⚠️ THE ONE HARD PROBLEM: the case customizer photo-on-case rendering

This consumed most of the design phase and **must be built correctly in code**, not ported from the prototype's approach.

### What the prototype does (and why it's fragile)
The prototype renders a customer photo onto a case by:
1. Loading a **product photo** of the case (`uploads/*-base.png`).
2. Applying a **pixel-detected mask** (`*-mask.png`) — the printable back area, cut by flood-filling/luminance-detecting the camera housing out of the photo.
3. Overlaying the real camera module (`*-overlay.png`) back on top.

This is **unreliable** because it guesses the camera cutout from pixels, and because product photos and print masks often describe *different camera layouts* for the "same" model.

### Definitive build recipe (implement exactly this)
```
For each model:
  print_path   = <svg vector path of the printable back panel, camera cut out as a hole>
  case_shell   = <clear-case render layer, aligned to the SAME viewBox as print_path>
  viewBox      = shared coordinate space (mm-accurate, from the client print template)

Render order (bottom → top), all in ONE shared coordinate space:
  1. case_shell BACK  (frosted clear body, seen where photo is transparent)
  2. user photo, clipped by  clip-path: url(#print_path)     ← deterministic, no pixel detection
  3. case_shell FRONT (camera module, bumper highlights, buttons) painted on top
```
- Use SVG `<clipPath>` + `<image>` (or `<canvas>` `ctx.clip()`), NEVER pixel flood-fill / luminance masks.
- The photo layer and the camera hole come from the **same** path, so they can never disagree.
- Export for print by rasterizing layer 2 alone against the print template's mm dimensions/DPI.

Included sample masks (in `assets/masks/`): `mask-17-pro-max.svg`, `iphone-17-pro-max.svg` (17 Pro Max, full-width camera bar), plus `mask-generic.svg` / `case-outline.svg`. The client's full per-model set lives in their Canva "iPhone Templates (A4)" file and the "CPR Case Builder Package" (mm-accurate, one page per model) — pull the complete set from there. NOTE: some Canva SVG exports link images externally and export blank; re-export with **Flatten / embed images** enabled, or export PNG with the design layer transparent.

### The correct production approach (do this instead)
Treat each model as a **fixed vector print template**, exactly like Casetify/Casely:

- Each model has a **vector print path** (the printable back-panel silhouette with the camera cutout as a real hole). The client already has these as SVGs — see `assets/masks/`. Example: `Copy of Mask - 17 Pro Max.svg` renders as a rounded-rect case silhouette with a **full-width top camera-bar cutout** (red = printable, hole = camera).
- The customer's uploaded photo is rendered into that path with **`clip-path` (SVG/CSS) or canvas compositing** — NOT pixel detection. It is deterministic and identical every time.
- The case "shell" (clear frosted look, bumper, buttons, camera module) is a **separate layer** rendered on top / behind, aligned to the same coordinate space as the mask.

### CRITICAL LESSON (root cause of weeks of rework)
**The print mask and the case product photo MUST be the same physical phone / camera layout.** The failures were caused by pairing a mask with a full-width camera bar (the true iPhone 17 Pro Max) against a product photo with a square corner camera (an older Pro Max). They can never reconcile.

**Requirement for the dev + client asset pipeline:** for every model, the mask SVG's camera cutout geometry must match the case render's camera position exactly. Build a small validation step that overlays the mask on the render and flags mismatch. Source the print path from the client's official Canva/print templates (mm-accurate), and render the case shell to match that path — do not derive geometry from marketing photos.

### Customizer feature requirements
- Model picker (Apple iPhone 12 → 17 series incl. Air/e/Plus/Pro/Pro Max; iPad line; Pixel; Samsung A/S). Newest first, grouped by series.
- Phone-body color swatches use **exact Apple hex** and tint only the aluminum body (not lenses/flash/bumper) — but note this only matters if showing the phone *through* a clear case; for an opaque print it's moot.
- Upload photo (file picker + drag-drop), drag to reposition, pinch/scroll to scale, rotate, filters (Original, Noir, etc.).
- Photo must fill the full printable area and clip exactly at the camera cutout — no bleed past the bumper, no gap under the camera lip.
- "Start over / remove photo" reset. Do NOT auto-persist the last design across fresh visits (start clean each session; only persist within-session).
- Guard against tiny/junk uploads (min 150×150; ignore dragged UI graphics).
- Single case type currently: **MagSafe Clear ($64.99)**. Architecture must allow adding case types (e.g. "Clear no-MagSafe", "Clear with color trim") later.

---

## Pages / Views
All pages share the global header (hamburger + mega menu, centered wordmark, account/cart icons), mobile drawer, and footer.

| File | Page | Purpose |
|---|---|---|
| `Keepsake Printing Co.dc.html` | Home + Customizer (SPA) | Hero, how-it-works, case comparison, style quiz, gallery, reviews, occasions, referral/rewards, and the live case customizer. This is the primary file. |
| `Checkout.dc.html` | Cart + Checkout | Line items, discounts (referral, first responder 20%, student 15%, first-order 10%), gift cards, shipping tiers (East/Mid/West), payment (Square/Stripe intended), $1-to-charity. |
| `B2B Portal.dc.html` | Wholesale | Volume tier pricing, B2B login, swag/trade-show bulk orders, inquiry form. |
| `Teachers.dc.html` | Teacher program | Teacher-targeted discount/landing. |
| `My Account.dc.html` | Customer account | Past orders, referrals made, points/rewards balance, warranty registrations, last purchase. |
| `Track Order.dc.html` | Order tracking | Status ("your case is printing now"), warranty QR registration landing. |
| `Design Library.dc.html` | Gallery | Curated/pre-made designs + placeholder slots for real photos. |
| `Help and Info.dc.html` | Help/Legal | FAQ, shipping, print quality, photo requirements, contact, about, Privacy Policy, Terms, Return/Warranty policy, cookie notice. |

### Global components
- **Header**: hamburger (opens left drawer / mega menu on desktop hover), centered "KEEPSAKE" wordmark (Avenir Black style, letter-spaced), account + cart icons right. White bg, hairline bottom border.
- **Mega menu**: columns for Shop by model, Case styles, Occasions, Programs (Teachers/First Responders/Students/Rewards), with a featured tile.
- **Footer**: link columns (Shop, Programs, Support, Legal), newsletter signup (10% off first order), social, charity note, payment icons.
- **Support chat bubble** (bottom-right): opens to a contact/support form or AI chat entry.

## Interactions & Behavior
- Mega menu opens on hover (desktop) / tap (drawer on mobile).
- Hero headline has a fade/reveal animation on load (the "One photo / One case" lines — animate in sequence).
- Product/case cards: on hover, tilt slightly (rotateY ~ -12deg) for a 3D angle view.
- Case comparison: expandable/collapsible; users can view multiple case options side by side (1 up to 4 across) — collapsible grid.
- Customizer drag: pointer events (pointerdown/move/up), touch-action:none, cursor grab/grabbing.
- Language: multi-language support was requested (i18n) — plan for a locale switcher.
- Motion easing: `cubic-bezier(.2,.7,.2,1)`, ~200ms fades, no bounces.

## State Management
- Customizer: `{ brand, model, caseType, phoneColor, photo(dataURL), px, py, scale, rot, photoFilter, reserved }`.
- Cart: line items with model/caseType/design thumbnail/price/qty; applied discounts; gift-card balance; shipping tier.
- Account: orders[], referrals[], pointsBalance, warranties[], profile.
- Session-only persistence for in-progress design (localStorage key cleared on fresh load).

## Design Tokens
Shares the **CPR Cell Phone Repair Design System** (bound in this project under `_ds/`). Key values:

**Color**
- Primary red: `#DC282E` (Pantone 186C) — CTAs, accents.
- Light red: `#F15F5E`.
- Dark grey (ink/primary dark): `#4E4E50`.
- Blue-dark (deep surfaces): `#2D2D3B`.
- Light blue accent: `#4FB0E3`.
- Neutral grey: `#B9BDCB`.
- Base light grey: `#F3F2F2`.
- Canvas white: `#FFFFFF`; body ink `#414346`.
- Links: define default + hover from red (`#DC282E` → hover `#B31F26`).

**Type**: Avenir family (Book 400 body, Medium 600 UI, Heavy 800 subheads/CTAs, Black 900 display). Headlines uppercase, tight leading 1.05–1.2, slightly negative tracking. Fallback: Nunito Sans if Avenir web license unavailable.

**Spacing**: 8-pt scale (4/8/12/16/24/32/48/64/96).

**Radius**: cards 10px; modals/feature blocks 16px; pills/round CTAs 999px. Buttons per brand book: 5px (reconcile — prototype uses larger pill CTAs; follow the prototype's rounded pills for consumer CTAs, brand-book 5px for utilitarian buttons).

**Shadows**: soft cool charcoal-tinted `rgba(46,56,61,.08)`; red-tinted shadow reserved for primary CTAs on white.

**Icons**: Lucide, 1.75px stroke, currentColor.

**Pricing**: MagSafe Clear = **$64.99** (single source of truth; keep consistent across customizer, checkout, account). Discounts: first-responder 20% (proof required), student 15% (UNiDAYS-style), first-order 10% (signup), birthday reward, referral $5 off.

## Assets
- **Design system** (`_ds/…`): Avenir fonts, CPR colors/type CSS, logo/cross assets. Use the target codebase's own brand system in production; these are references.
- **Case masks** (`assets/masks/*.svg`): per-model vector print paths — **the authoritative geometry** for the customizer (see the hard-problem section). Convert to a clean `{ model: { printPath, cameraCutout, viewBox } }` data structure.
- **Case renders**: the client will supply per-model case product images/renders whose camera layout **must match** the mask. Do not use the mismatched sample PNGs from the prototype.
- Icons: Lucide via CDN.
- Photography/gallery: placeholder slots — client drops in real photos.

## Backend / Production requirements (not in prototype — must be built)
- **Payments**: Square (in-store terminal + online) and/or Stripe. In-store POS terminal flow requested.
- **Auth & accounts**: customer login; B2B login with wholesale pricing tier; order history, referrals, points, warranty registrations.
- **Rewards/referrals**: referral codes ($5 off referrer), points/loyalty, birthday coupons, first-order 10%.
- **Discounts engine**: stackable rules with verification (first-responder/student proof, ID checks).
- **Gift cards**: purchase + redeem.
- **Order management**: status pipeline incl. "printing now"; same-day in-store fulfillment; shipping tiers East/Mid/West.
- **Warranty**: registration via QR (gift transfer), 10-day return, 6-month warranty, tiered extended warranty.
- **Charity**: $1 (or %) per sale donation tracking.
- **i18n**: multi-language.
- **Uploads**: secure image upload + storage; print-ready export at correct DPI/dimensions per model (client has mm-accurate print templates + a manifest of canvas px sizes per model).

## Files
Design reference files included in this bundle (all `.dc.html`):
- `Keepsake Printing Co.dc.html` (home + customizer — start here)
- `Checkout.dc.html`
- `B2B Portal.dc.html`
- `Teachers.dc.html`
- `My Account.dc.html`
- `Track Order.dc.html`
- `Design Library.dc.html`
- `Help and Info.dc.html`
- `assets/masks/` — per-model vector print-path SVGs (authoritative customizer geometry)

> Note: `.dc.html` files use a custom streaming-component runtime. Read them for markup/styles/copy/logic intent, but reimplement in your framework. Inline styles in the templates are the source of truth for exact values.
