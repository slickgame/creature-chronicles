# Recipe workers and work progression

Implemented within the existing production windows, without a new visual redesign.

## Active skills

| Activity | Saved skill | Proficiency benefit |
| --- | --- | --- |
| Garden / Wheat patch | harvesting | Additional output and lower Energy |
| Woodlot / Quarry / Iron deposit | hauling (Material Gathering) | Additional output and lower Energy |
| Milk production | production (Husbandry) | Additional output and lower Energy |
| Hunting trail | hunting | Additional output and lower Energy |
| Workbench recipes | crafting | Lower Energy per batch |
| Kitchen recipes, including rations | cooking | Lower Energy per batch |

Existing saved skill IDs and independent Hunting migration remain unchanged. Breeding and Cleaning remain planned; no dirtiness, illness, breeding proficiency or cleaning action is enabled.

## Recipe rules

- A creature worker is mandatory. The previous no-worker engine call now fails without spending anything.
- Cooking costs 6 Energy per batch; Crafting costs 8. Skill levels 6, 11 and 16 each save 1 Energy per batch, capped at 3 saved. Worker's stew can reduce the remaining per-batch cost by 15%, rounded up, with a minimum of 3 Energy.
- XP per batch uses the existing work XP function on the recipe's base output. Batch quantity multiplies both XP and Energy; facilities and skill output bonuses do not multiply recipe XP.
- The action uses the worker's proficiency before the action. Any level-up improves the next action. All batch ingredients, output, Energy and XP commit together.
- Recipes preserve input/output ratios, facilities and Sawmill doubling. Existing reserves remain protected. No Gold is charged. Iona's separate paid equipment service is unchanged.
- Unknown workers, invalid batches, unavailable facilities, training (even uncollected completed training), injury, exhaustion and insufficient unreserved ingredients reject without mutation.
- Equipment and permanent attributes are unchanged. Only the chosen worker loses Energy and gains the matching skill XP.

## UI

Workbench has a Crafter selector; Kitchen has a Cook / meal recipient selector. All 1–20 batch quantities are selectable. The page shows matching skill level, Energy and XP. Review names the worker, output, ingredients, Energy before/after and predicted skill level-up. Details explain proficiency costs. Cancel is read-only. Confirmation rejects a changed save and has a click-through guard and transaction lock.

Receipts show actual output/inventory and skill XP/level-up summaries. Gathering receipts now also include their already-persisted skill XP. Serving/eating is not a training action. Work Skills no longer labels Crafting and Cooking as planned.

## Verification

- 49 focused tests pass, including every recipe, all seven work locations, exact persisted costs/output/XP, other-worker and other-skill isolation, mastery, level carryover and blockers.
- Production Next build passes; focused ESLint has no errors (existing unused compatibility arguments and native image warnings only).
- `scripts/validate-recipe-workers.mjs`: 34 browser checks at 1440×900, 390×844, 360×740 and 844×390. Both detail pages and review dialogs fit; cancellation writes nothing. Actual crafting/cooking transactions level the selected skill from 5 to 6, preserve other workers' progression and Energy, and survive reload. No browser errors.
- Browser evidence uses synthetic saves. Unavailable unrelated legacy art in this sparse checkout receives a test-only fallback; resource art and runtime UI are not replaced.
- The save provider can canonically reorder unrelated battle-move arrays on save. Engine tests verify exact unrelated worker identity; browser assertions check their Energy, stats, creature XP/level and skill records independently of this existing normalization.

PR21 remains draft and unmerged. Deployment readiness is checked against the exact published commit separately; these are actual local production-game captures, not claims of browser access to the protected hosted preview.
