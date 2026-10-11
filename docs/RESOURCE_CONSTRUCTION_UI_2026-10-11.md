# Pantry, Workshop and construction resources

Builder projects and Ranch Office upgrades now spend named resources. All affordability checks, confirmations, work orders, ranch previews and receipts use the same bills. Reserves protect construction stock. Existing already-paid work orders keep their original payment history.

## Balance

| Project | Supplies (Gold unchanged) |
|---|---|
| North Pasture | 8 Wood + 4 Stone |
| Woodline Acre | 10 Wood + 6 Stone |
| Habitat Annexes | 10 Planks + 6 Stone + 8 Nails |
| Nursery Extension | 8 Planks + 4 Stone + 6 Nails |
| Reinforced Fence | 6 Planks + 4 Stone |
| Watchtower | 8 Planks + 6 Stone + 8 Nails |
| Manual repair | 2 Wood + 1 Stone; removes up to 20 damage |

Repair kits retain priority. Early Office component upgrades start at 2 Planks + 1 Stone, with larger tiers adding nails. Gold-only first tiers remain Gold-only. A basic workbench makes planks without a sawmill; Pella sells all construction components so a forge is not a hard gate for purchased supplies. Gathering/crafting offers the production route. Both building systems share one crew.

Petra's first request checks 8 Wood without consuming it. Her final request rewards 4 Planks. Previously claimed rewards remain claimed.

## Interface

- New painted pantry/workbench banner across the resource panels.
- Live day, currencies, assigned gathering helpers and built production-site counts.
- Storage category filter and in-stock toggle; separate owned, reserved and usable quantities.
- Resource source hints; recipe rows show usable / needed for each ingredient, explicit shortages and output.
- Collapsible gathering report and reserve help.
- Compact mobile layout and scrolling native dialogs.
- Office Help and Condition provide a Supplies & workbench shortcut.

## Artwork provenance

Built-in image-generation tool; generated for this project. No approved character artwork changed.

Repository asset: `public/images/ui/resources-v1/pantry-workbench.webp`.
Original generated PNG is kept unchanged; the project copy uses WebP encoding (2048 × 683, approximately 314 KiB).

Exact prompt:

> Use case: stylized-concept. Asset type: wide illustrated banner for the Creature Chronicles farm resource management interface. Create a polished sharp anime-painterly fantasy farm pantry and workbench still life, no characters. Wide landscape 3:1 composition. Left: golden wheat sheaves, fresh vegetables, eggs in a small basket, ceramic milk jug, a steaming bowl of rustic vegetable porridge. Right: clean stacked wooden planks, two dark iron ingots, a small handful of nails, hammer and rolled construction blueprint on a timber workbench. Background: warm sunlit farmhouse workshop with shelves, ivy, distant green fields through an open window. Cohesive golden-hour lighting, crisp wood grain, rich dimensional fabric, detailed painted textures, glossy highlights on ceramic and metal, inviting earthy greens and warm amber. Keep all main objects below upper third, enough calm darker background for UI heading overlay. No words, no letters, no interface, no logos or watermark. This matches a richly rendered anime-painterly cozy farm RPG, not photorealism or flat vector.

## Validation

44 focused tests pass, including exact component spending, reserve blocking, shared crews, delayed benefits, feeding, deliveries, Petra requests and 12 fresh first-week budgets. Production build/TypeScript pass. Scoped lint: zero errors, seven warnings. Browser checks cover desktop and phone panels, storage filtering, cooking/serving, purchase cancellation and confirmation, exact supplies/Gold/GP, facility construction, deliveries, Office upgrades and repairs. Local QA uses neutral placeholders for unrelated artwork missing from the sparse checkout; the new banner loads from its actual asset.

## Next

Convert remaining generic chore outputs, equipment/training costs and quest rewards to named supplies in one coherent pass. Revise the introductory production lessons around gathering, reserving, crafting and commissioning. Add individual ingredient/recipe illustrations as the final resource catalogue settles.
