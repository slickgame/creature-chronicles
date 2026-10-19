# Ranch House A — Scenic desk

The user selected A after revising an initial C choice. The unchanged acceptance reference is `../ranch-house-review/options.png`, first band. Runtime: `src/features/ranch/RanchHouse.tsx` and `RanchHouse.module.css`.

This kit supplies native frames and controls, extending the approved gold/navy family. All exact concept symbols already exist as production artwork, so no replacement raster illustrations or room art are generated. All text and actions remain native accessible controls. The concept board is not a runtime background.

| Element | Asset | Sizing / placement |
|---|---|---|
| Header and action panel | `window.svg`, ornate nine-slice | Desktop header max1440px, panel max510px |
| Secondary and page controls | `button.svg` |40px general /36px desktop tabs |
| Selected section | `primary.svg` |emerald fill with gold rim |
| Action rows | `action.svg`, `action-hover.svg` |91px min desktop /85px phone; content-sized |
| Action chevron | `chevron.svg` |15×22px desktop /12×19px phone |
| Menu | `menu.svg` |24px desktop /20px phone |
| Optional divider | `divider.svg` |native reusable diamond rule; note uses a CSS gold line |
| Back / Room control | `creature-overview-a-v2/icons/{back,expand}.svg` |18px desktop /15–16px phone |
| Background / phone vignette | `ranch-v3/house.webp` |existing canonical room; full cover /framed140px vignette |
| Font | `forge-slate-v2/fonts/Tinos-{Regular,Bold}.woff` |explicit400/700 declarations |

## Painted icon mapping

The existing1280×1280 true-alpha `ranch-v2/icons.webp` atlas has4×4 cells of320px. RanchIcon consumes these original sprites directly; no recoloring/masks or artistic edits are applied.

| Action | Atlas symbol / index |
|---|---|
| Farm work & production | crossed tools /15 |
| Ranch upgrades & repairs | farmhouse /0 |
| Storage & inventory | leather satchel /4 |
| Growth planner | farmhouse /0 |
| Habitat fields; Creature roster | paw /1 |
| Egg nursery | egg /2 |
| Ranch ledger | sealed record /13 |
| Story journal | existing open-book RGBA art, `atelier-v1/ledger.webp` |
| Review & End Day | ivory/gold moon /10 |

All action icons are50px on desktop,42px on phone,32px on short landscape and30px on short phones. The master atlas remains the source of truth for atlas symbols. Story journal uses the existing open book instead of the old nest symbol; Management's three icons reproduce the concept exactly.

## Typography and layout

Midnight navy `#031725`, ivory `#fff0d5`, gold controls and emerald selection. Desktop heading32px, section heading32px, action titles22px bold, hints16px regular, note14px. Phone heading25px, section29px, titles18px and hints14px; short layouts scale explicitly while retaining full descriptions.

Desktop header margin14×22px; right action panel padding19×18px, gap14px, action gap10px. Composition max1440px. Room fills the remaining left space. Above1700px, vertical composition is bounded near930px. Phone uses a small framed vignette, four tabs in2×2 rows, three compact actions and the complete housing note. Room minimize/expand retains all controls. Rest uses one content-sized action rather than stretching a sparse card.

Buttons include native hover, disabled, gold focus outline and emerald selected states. Four direct section tabs replace duplicate Previous/Next paging. Day advancement remains behind the existing End Day review. Menu invokes existing navigation. No residents dock is added to the house: the existing Habitat dock already shows names, levels and statuses, and integration QA verifies it.

Builder: `scripts/build-ranch-house-a-assets.py`. Existing room, icons and licensed fonts are reused; new frames, row states, chevron, menu and optional divider are code-native SVG assets. Prompts and source references for the selected board remain in `ranch-house-review/generation.json`.
