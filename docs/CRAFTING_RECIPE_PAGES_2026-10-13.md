# Illustrated crafting recipe pages — 2026-10-13

## Implementation

Iona's existing Builder's Yard workshop now shows one illustrated recipe per page. A named recipe dropdown and previous/next buttons share the selection. Current starter recipes and their economy are unchanged: Training Blade (1 Iron ingot + 10 Gold), Focus Circlet (3 Iron ingots + 45 Gold), and Reserve Pendant (3 Iron ingots + 60 Gold).

The page keeps exact ingredients, usable and reserved quantities, and Gold labor visible. Result details, creature-specific stat comparisons, cost breakdown, and craft-versus-buy information use focused, paginated dialogs. Craft review shows the exact +0 item, grade, stats and passive before the final material/Gold confirmation. Existing revision checks and immediate click guards prevent duplicate processing; reserved supplies remain protected.

Ingredient cards open a focused Pella counter using the existing tradeResource engine. It defaults to the missing quantity, reviews the exact charge separately, and returns to the selected recipe with updated storage. The ranch production tab explains the actual recipe and required facility; it is informational, not a Workbench navigation route. The Outfitter link remains a separate navigation route. Ready-made equipment stays Gold-only. Equipment improvements remain available from the forge.

No save schema, recipe balance, reward, equipment upgrade, or crafting-engine changes were made.

## Art provenance

Reused existing approved Iona portrait, Builder's Yard background, ranch dossier parchment, equipment artwork, and refined Iron ingot icon. No new raster images were generated and no generation prompt was used for this update. New `public/images/ui/blacksmith-v1/recipe-frame.svg` is an original, hand-authored transparent brass ring with compass-like ticks and diamonds, designed to frame existing equipment illustrations without baking text into art.

## Validation

- Direct production `next build` passes. The `npm run build` prebuild asset validator cannot pass in this sparse checkout because legacy breeding images are absent; this update does not change those assets.
- Changed TSX lint: zero errors; four existing-style img optimization warnings.
- Four blacksmith regression tests pass, covering exact results/costs, reserves, insufficient funds, ore rejection, persisted duplicate prevention, and Gold-only store gear.
- Browser checks: all three recipes at 1440×900, 1280×720, 390×844 and 844×390. Main pages and all result/comparison/cost/craft-or-buy detail pages fit without scrolling. Dropdown and previous/next selection stay synchronized.
- Browser purchase cancellation and crafting cancellation leave saves unchanged. Buying 2 ingots costs exactly 80 Gold. Crafting Focus Circlet consumes exactly 3 ingots and 45 Gold, adds one item, increments the crafting revision once even on double-click, and leaves 9 reserved ingots untouched. Reload persistence passes; no browser runtime errors.
- Desktop and phone screenshots reviewed. Sparse-checkout missing legacy assets are intercepted only by the local harness; relevant new/reused recipe assets are real.

## Next

Apply this recipe-book layout to Kitchen and farm Workbench, including source navigation with return context. Then improve Trade/Storage and Coliseum preparation links. Keep all existing balances unchanged unless separately evaluated.
