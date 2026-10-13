# Production book and creature-specific work — 2026-10-13

## Gathering rules

Instant work remains an explicit, confirmed action at an owned location. It spends creature Energy only, grants the exact displayed resource amount and matching work-skill XP, and creates no ongoing assignment. Training, injury, dairy eligibility and Quarry ownership restrictions remain. Normal feeding and recovery are unchanged. Iron collection grants **Iron ore**; the furnace converts ore and charcoal into **Iron ingots**.

| Location | Yield stats (primary / secondary) | Base output | Base Energy |
| --- | --- | --- | --- |
| Garden | DEX / WIL | 4 Vegetables | 18 |
| Wheat patch | DEX / WIL | 4 Wheat | 18 |
| Dairy | STA / FER | 3 Milk | 16 |
| Hunting | DEX / STR | 2 Meat | 24 |
| Woodlot | STR / STA | 4 Wood | 22 |
| Iron deposit | STR / STA | 2 Iron ore | 26 |
| Quarry | STR / STA | 4 Stone | 24 |

- Stat score = (2 × primary + secondary) / 3. Yield bonus = floor(score / 12), capped at +4. Current creature stats count; battle equipment does not.
- Matching skill bonus = floor((level − 1) / 5), capped at +3. It adds yield and reduces Energy by the same amount. Existing species skill baselines and progression remain; no new hidden species multiplier.
- Existing matching talent output and Energy effects and ranch upgrade bonuses remain. Woodlot/mine facility output bonuses remain.
- Endurance discount = floor((2 × STA + WIL) / 30), capped at 4 Energy.
- Subtract endurance, skill, talent and ranch discounts from the location's Energy cost, with an 8 Energy minimum. Worker's stew then applies 15% off (remaining cost rounded up), again with an 8 Energy minimum.
- XP continues through the existing work-skill XP helper, including talent modifiers. Preview and transaction call the same calculation.

These are conservative additive steps: early creatures retain base yields, advanced workers gain bounded improvements, and heavy mining costs more effort than tending crops or milk production. This is an initial balance pass; the seven-day scenario is a sanity check, not exhaustive late-game optimization.

## UI

Work locations, Kitchen and Workbench now use a full-screen parchment book with one location/recipe per page, dropdown plus previous/next controls, and a section selector. Creature selection updates work output and Energy immediately. Paged calculation details explain each contribution. A confirmation separates review from collection.

Kitchen/Workbench retain batch selection, exact ingredient quantities, facility requirements, storage totals, protected reserves and zero Gold fee. Ingredient cards open Pella's focused purchase counter without losing the selected recipe. Source purchase quantities are capped at the existing 20-unit transaction limit, even when a large batch lacks more than 20 units. Production information in that popup remains informational; returning preserves the page. Meal serving is separately reviewed and retains daily limits, capped recovery and training restrictions.

Production receipts distinguish automatic starter-goal Gold, GP and named-resource rewards from action output. This avoids making a goal's extra Wood/rations look like incorrect gathering/cooking yields. Native dialog cancel events stop propagation so Escape dismisses only the nested details, preserving the book. Existing tutorial anchor IDs remain on the work screen.

Storage, Trade, Feeding, Security and other legacy resource sections have not yet been converted to this layout.

## Art provenance

Reuses the approved pantry/workbench scene, ranch dossier parchment, canonical creature full-body art, named-resource icons and existing energy-meal illustration. Meal recipes currently share the existing meal illustration; components without a dedicated icon use the pantry/workbench illustration. No new generated images or generation prompts in this update. Dedicated illustrations for remaining meals/components are a future art improvement, not represented as completed here.

## Validation

- 198 regression tests pass, including four new tests for stat/skill/talent effects, bounded scaling, preview-to-grant parity for all seven sites, Energy charges, eligibility, meal discounts and no overnight assignment.
- Direct optimized Next.js production build and TypeScript pass. The full npm build wrapper's asset preflight remains unavailable in the sparse checkout because legacy breeding images are absent.
- Scoped ESLint: zero errors, 11 existing-style image/unused compatibility-parameter warnings.
- All 16 locations/recipes and both detail pages fit 1440×900, 1280×720, 390×844 and 844×390 without scrolling. Real relevant assets load; only missing legacy images are intercepted by the local harness.
- Browser checks cover canceled work, exact work output/Energy, double-click prevention, explicit starter-goal reward receipts, batch cooking, sawmill output, reserves, meal serving, ingredient review/cancel/return, Escape preserving the underlying book and reload persistence.
- The existing deterministic seven-day route performs three work actions per day, feeds all residents, builds the Quarry and buys/improves starter gear to +3. It ends at 1,762 Gold from 1,200, including existing starter-goal, order and daily income; no feeding shortfall. This does not imply every play style has the same outcome.

## Next

Convert Storage and Trade to paginated inventory shelves with reserve/detail popups and source links that preserve return context. Add dedicated art for remaining recipe outputs. Then evaluate broader first-week and advanced-worker production, cooking and construction balance together.
