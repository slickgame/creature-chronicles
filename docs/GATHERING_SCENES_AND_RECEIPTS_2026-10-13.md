# Gathering scenes, collection receipts and source navigation — 2026-10-13

Gathering now uses one Collect click after showing the exact yield and Energy cost. Recipe/meal purchases retain their confirmations. A result popup shows the actual collection grant and saved inventory total, with save-time goal bonuses listed separately. Double clicks remain guarded; closing the receipt permits another legal collection.

Every gathering site has a new environment behind the existing approved creature art. Ingredient source popups open the exact gathering site or production recipe; Back returns to the source popup, then the original recipe and batch quantity. No game economy coefficients changed.

## Worker comparison

Controlled tiers: Novice stats 6 / skill 1; Practiced stats 24 / skill 6; Experienced stats 48 / skill 16. All attributes equal within each tier; no talents, upgrades or meals. Site eligibility still applies. Reproduce with `node --no-warnings --loader ./scripts/ts-test-loader.mjs scripts/compare-worker-yields.ts`.

| Location | Novice yield / Energy | Practiced yield / Energy | Experienced yield / Energy |
|---|---:|---:|---:|
| Kitchen garden | 4 / 18 | 7 / 15 | 11 / 11 |
| Wheat patch | 4 / 18 | 7 / 15 | 11 / 11 |
| Milk production | 3 / 16 | 6 / 13 | 10 / 9 |
| Hunting trail | 2 / 24 | 5 / 21 | 9 / 17 |
| Inherited woodlot | 4 / 22 | 7 / 19 | 11 / 15 |
| Shallow iron deposit | 2 / 26 | 5 / 23 | 9 / 19 |
| Quarry | 4 / 24 | 7 / 21 | 11 / 17 |

Experienced wood gathering is about 4.0 times as efficient per Energy; ore about 6.2 times. The additive bonuses disproportionately improve low-base outputs. This is a controlled endpoint comparison, not a forecast of how quickly a real creature reaches those stats. Keep current coefficients pending a full experienced-roster sink comparison. Next: check construction, cooking, blacksmith and sale demand against these outputs; add prerequisite shortcuts where source routes stop at locked facilities.

## Validation

Eight work-yield/production tests pass. Scoped lint has zero errors (four native-image warnings); direct optimized Next build passes. Browser QA checks all seven backgrounds decode and every gathering page fits 1440×900, 390×844 and 844×390. One-click collection, double-click guard, repeat after dismissal, actual inventory receipt, and source round trip retaining recipe/batch pass. Existing legacy images missing from sparse checkout are blocked only in the harness. Screenshots reviewed.

## Art provenance and prompts

Built-in image generation, one call per site. Optimized WebPs saved to `public/images/ui/gathering-v1/{site}.webp` (1200px max width, quality 85; seven assets about 1.9 MB total). No creature art changed.

Exact shared prompt, substitute each scene below:

> Use case: stylized-concept. Game environment background for Creature Chronicles: {scene}. Sharp anime-painterly fantasy farming illustration, warm natural light, detailed crisp foliage or materials, earthy colors, polished painted game art. Wide landscape composition. Empty open central foreground for a separately composited full-body creature, eye-level camera, horizon in upper third. Environment only: no people, creatures, lettering, UI, border or watermark.

- `garden.webp`: a kitchen garden, neat raised vegetable beds, rustic farmhouse fence
- `wheat_field.webp`: a golden wheat patch with a little rustic windmill in the distance
- `dairy.webp`: a clean sunlit rustic dairy barn interior with hay and wooden stalls, milk churns at the edge
- `hunting.webp`: a peaceful woodland hunting trail, ferns and deep forest, no prey or weapons
- `woodlot.webp`: a managed woodland clearing, timber stacks and cut stumps around the edges
- `iron_deposit.webp`: a shallow open iron deposit with reddish mineral veins and a wooden mine support at the edge
- `quarry.webp`: a small terraced pale stone quarry with stacked cut blocks
