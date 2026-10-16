# Live approved A inventory

October 16, 2026. Creature Chronicles; existing feature branch and draft PR #21.

## Access

Open **Menu → Inventory** from a loaded save, or **Ranch → Breeding Pen → Support Items**. Both entry points use the same live apothecary screen. Other player-menu sections remain reachable through Other menus. The separate `public/images/ui/apothecary-v1/preview.html` remains an asset preview and never uses real save transactions.

## Implementation

The approved painted workbench, separate plinth, alpha item illustrations, parchment panel, title plaque and brass-edged controls now render real inventory. Item selection uses categorized, paged grids with search, Name/Quantity sorting, owned-only filtering, hover/focus descriptions and touch information buttons. All/Consumables/Equipment/Materials/Key items include the existing support catalogue, battle supplies/manuals, ranch kits, upgraded equipment instances, named stored resources and the guided Quickhatch item. Gear keeps its exact instance ID, upgrades and owner; unowned shop entries do not invent inventory. Iron ingots and Iron ore stay distinct, and material counts expose protected reserves.

Choose recipient opens all tracked creatures plus the player with paginated canonical portraits, search, All/Eligible/Favorites filters and Name/Energy sorting. Every portrait has an independent information button opening the existing read-only character inspector, including the player view. Information remains available for disabled recipients. Closing details preserves the grid page/search/filter/selection. Selecting a valid recipient returns to the main page; the portrait opens the picker again. The item-use Giver control is removed; breeding role controls remain separate.

No selection spends anything. Explicit Use Item / Arm / Equip opens a paged review with stock changes, exact item effects, capped before/after resources, or actual equipment comparisons including replacement losses. Confirmation rechecks current state and holds an interaction lock to prevent repeat grants. Normal stock, effects, costs, XP and save schema use existing reducers. Training, active-gauntlet equipment locks, creature-only care, existing ownership and full resources retain their blockers. Pair effects require no individual recipient. Gestation Tonic selects the exact active pregnancy by participant ID through the same portrait grid; due timers cannot be shortened below one day. Named resources and specialized supplies open their existing management systems. Quickhatch continues through the existing Nursery/tutorial flow.

Full effects, item notes, equipment main/substats/passive and changes remain accessible through paged details. Long effects have a brief main-page summary plus explicit Full details. Armed effects list the engine's exact timing and conditions. Cancelling the item browser restores its prior filter state, so Previous/Next remain consistent with the selected item; committed selection uses the new filtered set.

Find source focuses the requested supply at Pella's counter and restores the selected item/recipient after Back, from either global or breeding entry. Matching blacksmith recipes open directly with the correct recipe, preserving inventory underneath. Resources link to Storage and exact gathering/processing recipes; exclusive gear links to Coliseum. Existing open-this-creature inventory shortcuts preselect that creature. Other existing menus and the guided inventory shortcut remain available.

## Artwork provenance

Reuses the approved asset kit without generating or changing character/equipment art. Exact image-generation prompts, source PNG/production WebP hashes, alpha checks and original reference hashes are in `public/images/ui/apothecary-v1/manifest.json`, `references.json` and `docs/INVENTORY_APOTHECARY_ASSETS_2026-10-16.md`. Original PNG masters and the approved concepts remain in the existing Drive asset archive. Common and rare portraits use canonical participant URLs. Missing-image fallbacks are neutral symbols, not substituted character art.

## Validation

- All **338 tests pass**. The regression command now includes every `tests/*.test.ts` file. Four new tests cover complete read-only catalogue/instance parity, target restrictions and capped effects, unowned gear/reserves, and exact pregnancy-ID eligibility without mutations.
- One existing production-guide assertion assumed a fixed 12 Wood despite approved stat-based yields. It now checks each action against its actual pre-action work quote and verifies successful actions; guide/reward/idempotency assertions remain.
- Optimized Next production build and TypeScript pass. Final changed-file lint has zero errors; image/legacy warnings are recorded in the archived log. Whitespace checks pass.
- Production browser checks at 1440×900, 390×844, 844×390 and 360×740 cover every item-category page, 100-creature roster, minimized art, recipient detail return, paged effects/reviews and cancellation without spending or scrolling. Final main layouts were rechecked after styling fixes.
- Real browser transactions verify exactly one 12-Energy snack grant and stock deduction under repeated confirmation, one stabilizer arm, equipment assignment/comparison with unchanged currencies, exact Affection/Heart grants, one exact pregnancy timer decrement, full-resource/absent-pregnancy/away-training restrictions, reload persistence, source focus/return from both global and breeding entries, matching blacksmith recipe and player-only recipient grid. No browser page errors. Item and character information actions do not select or use an item.
- Desktop and phone final screenshots visually reviewed. Missing legacy sparse-checkout images are replaced only in the QA harness; all new apothecary assets are real production files. This is not a complete legacy art preflight or protected hosted gameplay verification.

QA scripts, synthetic fixtures, logs and reviewed screenshots are archived in the existing Drive project folder. PR #21 stays draft/unmerged. Push, Vercel build and protected hosted verification are reported separately.
