# Egg Atelier B — Sunlit Incubator

User-approved concept B implemented on 2026-09-30. The warm botanical atelier, selected egg in a linen-lined cradle, Selene portrait, care panel and paginated dock follow the approved mockup. Egg Care, Egg Offers and Upgrades use the same viewport layout.

## Player experience

- Live Gold, Nursery Kit and ready-egg counters. Back/Menu have reserved header space. Visit Nursery remains accessible for hatching.
- Ready eggs sort first, then shortest incubation. Selected egg artwork remains completely visible with `object-fit: contain`. Names and timers use real save data; visual egg/cradle is generic and does not imply an undiscovered variant.
- Responsive pagination for active eggs, all three offers and four upgrades. No main-page scrolling; scrolling belongs only in native dialogs.
- Distinct existing icons identify acceleration, ability polish and conditioning. Available service reviews use green actions; short unavailable reasons expand in review dialogs.
- Service reviews show exact live Gold/Kit costs, success odds, one-use limits and timer changes. Failed probabilistic services still consume payment and the one-use allowance, explicitly explained before confirmation.
- Review snapshots and a confirmation lock prevent stale terms and repeated execution. Existing gameplay functions perform all transactions.
- Already-ready eggs cannot accelerate. Missing abilities, used services, missing Incubator Cradle and resource shortages are explained. UI additionally prevents paying to polish a first ability already at S or condition all-S stats.
- Sell/research actions move to More Actions and require confirmation. Their existing payouts, permanent egg removal and Trust rewards are preserved.
- Full Appraisal preserves the Lineage Ledger Desk gate. Expanded appraisal shows all six numerical stats with letter grades, abilities, parents and full care/lineage notes in a scrolling dialog.
- Talk and Trust Ledger retain Selene conversation, Trust progression, service odds, installed upgrades and Quickhatch inventory count.
- Receipts show the existing result plus current balances, which include any automatic goal rewards. Empty states link to Egg Offers.

## Production artwork

Built-in `image_gen` mode, using approved concept `exec-44ef4376-fb7c-403e-927d-b5dfef9148c1.png` as visual reference. Existing Selene portrait and service/upgrade icons are retained.

- `public/images/ui/interiors-v1/egg-atelier.webp`: original warm botanical workshop background, converted to RGB WebP quality 88.
- `public/images/ui/interiors-v1/atelier-egg.webp`: original generic egg and linen-lined cradle cutout, converted to WebP quality 90 with generated alpha preserved.

### Background generation prompt

Production background plate for the approved Egg Atelier B game concept attached. Recreate its beautiful sunlit botanical scholar workshop: carved warm wood countertop across lower third, arched windows with sunny garden beyond, cream stone, teal banners, botanical journals, small brass study lamp toward left side, books and egg-care equipment at far edges. Broad clear central tabletop for compositing selected egg artwork later. Detailed hand-painted cozy fantasy art exactly matching reference colors/light. Wide 16:10 landscape. REMOVE ALL interface, parchment panels, cards, portraits, text, labels, signs, buttons and counters. REMOVE the big central egg AND its cradle; empty central counter. No people, no eggs, no UI, no lettering. Room environment only, natural compositional depth, large clean central space.

### Egg generation prompt

Create a production transparent game asset matching the attached approved Sunlit Incubator concept. One large intact ivory egg with muted moss-green speckles, nestled in a low oval carved walnut and teal wooden egg-care basket/cradle lined with soft cream linen. Brass leaf fittings subtle, no gems, no UI icon frame. Faithfully reproduce the central egg and plush cradle's painterly fantasy style and warm light, but isolate it completely. Full object three-quarter view, centered square composition, all cradle edges visible, transparent margin. Egg fills upper two thirds, cradle lower third. No lamp, no tabletop, no backdrop, no text, no labels, no magical glow. Genuine transparent alpha outside silhouette. Generic visual for an unhatched egg, no baby creature.

## Validation

Production Next.js build/TypeScript and all 141 regression tests pass. Targeted ESLint has zero errors (image-element warnings only). Browser checks cover 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390, every egg/offer/upgrade, pagination, long names, empty states, visible controls, no main scroll and native dialog dismissal. Desktop, portrait phone and landscape screenshots are visually reviewed.

Transaction checks cover canceled actions, exact service Gold/Kit charges and timer reduction, used-service/Cradle locks, upgrades and installed state, expanded appraisal numbers/grades, egg purchase, canceled removal, donation and sale, Warming Lamp timer effects and resource/Trust blockers.

Gameplay balance, data functions and save schemas are unchanged. Sparse local checkout excludes unrelated large breeding art, so the full asset-preparation pipeline is not run locally. No review save or ignored scene-manifest stub is committed. Publish to existing draft branch preview; remain unmerged.
