# Farm production, recipes, and supply orders — phase one

Approved direction: replace generic Feed/Materials with specific resources; connect creature production, gathering sites, cooking, crafting, Petra, markets, and missions. This release delivers the first playable production chain. The existing daily Feed/repair Materials economy remains separate until its consumers and rewards migrate together. No existing stock is converted or duplicated. New recipe stocks start empty on both new and existing saves. No reset required.

## Available now

Entry points:
- Ranch Chores → Resources & recipes: Storage, Gathering, Kitchen, Workbench.
- Supply Depot → Ingredients & materials: buy/sell specific resources.
- Builder’s Yard → Production sites & upgrades.
- Guild Mission Board → Supply orders: four introductory, permanent, once-only deliveries. These are separate from the existing randomized weekly requests and do not alter their reroll/rotation rules.

Stocks: wheat, vegetables, milk, food eggs, meat, wood, stone, iron ore, planks, charcoal, iron ingots, nails, four prepared meals. Food eggs cannot hatch and never touch nursery records.

Inherited facilities: garden, wheat patch, dairy assignment, hunting trail, woodlot, shallow iron deposit, kitchen, workbench. Quarry requires construction. One worker/site; upgraded woodlot/mine support two. Production resolves overnight exactly once, before normal feeding/condition calculations. Helpers cannot simultaneously be assigned regular chores. Training, injury, missing-creature, energy and capacity checks apply. Female bovines produce milk; no chicken family is invented—food eggs are bought from Pella. Hunting produces game meat without removing a ranch creature.

Base daily output per worker: vegetables 4, wheat 4, milk 3, meat 2, wood 4, iron ore 2, stone 4. Cost 20 Energy, or 17 with stew. Output specialization/talents and more detailed diets remain next-phase work; no production-quality grades or spoilage yet.

## Recipes

| Output | Inputs | Facility | Effect |
|---|---|---|---|
| Garden porridge | 1 wheat + 1 vegetable | Kitchen | Restore 8 creature Energy |
| Hearty breakfast | 1 wheat + 1 food egg + 1 milk | Kitchen | Restore 15 creature Energy |
| Breeder’s bowl | 1 food egg + 1 milk + 1 vegetable | Kitchen | +10 percentage points pregnancy chance for the day, once per pair, existing 90% cap |
| Worker’s stew | 1 meat + 2 vegetables | Kitchen | 15% lower overnight chore/gathering Energy cost |
| 1 plank | 2 wood | Workbench | Sawmill doubles output to 2 |
| 2 charcoal | 2 wood | Kiln | Smelting fuel |
| 1 iron ingot | 2 ore + 1 charcoal | Furnace | Refined metal |
| 4 nails | 1 iron ingot | Forge | Construction component |

Cooking/crafting is immediate, with 1/5/10/20 batch controls and no worker queue in this release. One bonus meal per creature per day, including recovery meals; this avoids repeated instant-Energy feeding exploits. Recovery is capped at max Energy and cannot waste a meal on a full creature. Other effects apply through that night's work and expire next day. Meals are protected from automatic feeding. Diet restrictions are not yet applied.

## Petra

| Project | Gold | Specific materials | Prerequisite |
|---|---:|---|---|
| Quarry | 180 | 6 wood | None |
| Sawmill | 240 | 8 wood, 4 stone | None |
| Kiln | 160 | 4 wood, 6 stone | Quarry |
| Furnace | 280 | 10 stone, 4 planks | Kiln |
| Forge | 320 | 8 stone, 2 iron | Furnace |
| Managed woodlot | 220 | 4 planks, 4 stone | None |
| Supported iron mine | 300 | 6 planks, 4 nails | Forge |

One night per project. Shared crew with the existing land/habitat/security work-order system; no simultaneous construction. Costs paid at commissioning; benefits after completion. Completed facilities count toward Petra’s existing completed-project quests. Woodlot upgrade: +2 wood/helper and two slots; mine: +1 ore/helper and two slots. Buildings are catalog/state additions; scenic farm artwork is not yet changed.

## Markets and reserves

Buy prices/unit: wheat/vegetables/wood/stone 8; milk/eggs/ore/charcoal/nails 12; meat 14; planks 22; iron 40 Gold. Sell at floor(40% of unit price). Meals not sold in this version. Construction, trades and deliveries use confirmation dialogs; recipes show inputs/output before making. Numeric quantity limits prevent negative/fractional transactions. Player-set resource reserve quantities protect against recipe, sale, delivery and construction spending.

## Introductory orders

- 8 wood → 100 Gold, 3 GP.
- 2 breakfasts → 100 Gold, 4 GP.
- 6 planks, Sawmill built → 150 Gold, 5 GP.
- 8 nails, Forge built → 160 Gold, 6 GP.

Accepting consumes nothing. Explicit delivery consumes exact stock and pays once. No deadline; accepted/completed state persists.

## Persistence and checks

Versioned `farmResourcesV1` flag holds stocks/reserves, crews, facilities, construction, meals, deliveries and the latest overnight report. Existing currencies/legacy supplies are untouched except explicit player transactions. Production reports join the morning summary. The test loader now maps ranchJobs to the actual Predator resolver, matching tsconfig; previously it inadvertently exercised the retired base implementation.

37 targeted tests pass: production economy, first-week baseline, builder projects, location interactions and ranch-day lifecycle. Tests cover actual overnight behavior/idempotency, mutual crew exclusion, availability, the entire processing chain, reserve protection, duplicate delivery rewards, real pregnancy-preview bonus/expiry, capped recovery, meal duration, and completed-facility quest credit. Production Next/TypeScript build passes. Scoped lint has zero errors; pre-existing image/unused warnings remain in edited host files.

Browser validation: desktop and phone resource panels, assignment, recipe consumption, exact +15 Energy recovery, duplicate meal prevention and save/reload persistence verified. Town purchase cancel/confirm, exact Gold/GP/stock deltas, construction commissioning, and Guild accept/deliver transactions also pass. All new panels fit 1440×900 and 390×844 without horizontal overflow; a Guild inherited white-space issue was corrected and rechecked. Local QA uses neutral placeholders for unrelated existing artwork in this sparse checkout.

## Next

Migrate daily feeding to diet-compatible ingredient stocks; convert existing generic material costs/rewards consistently; add resource delivery templates to the randomized weekly board; tune production and prices over several weeks; then create visible gathering/processing-site artwork. Add species/innate-talent yield modifiers once the initial resource budget is stable. Steel, repair kits, advanced recipes and recipe unlock quests remain future additions.
