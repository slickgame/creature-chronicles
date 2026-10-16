# Equipment rarity, legal pools and starter sets

October 16, 2026 · Creature Chronicles · existing branch / draft PR #21.

## Access

Menu → Inventory → Browse items → Equipment, or Creature profile → Equipment → a slot. C2 cards now distinguish rarity, power grade, enhancement and set family. Filters support power grade, rarity, set and availability; the filter controls occupy two short pages. The Sets button opens eight short pages containing four set summaries and their equipped members. Creature impact shows signed total-stat deltas including sets. Equip/removal confirmation includes dedicated pages for sets gained or broken. Existing slot, item-info, recipient-info and source-return flows are retained.

The larger set-progress strip (concept A) and focused illustrated set book (concept B) were generated for the user's next visual choice. Their decorative sample art/stat values are not imported as equipment or balance data. The production integration retains the approved C2 layout and established paged detail windows; it does not silently select a full redesign.

## Rarity and power

| Rarity | Starting substats on new gear |
| --- | ---: |
| Common | 0 |
| Uncommon | 1 |
| Rare | 2 |
| Heroic | 3 |
| Legendary | 4 |

Power Grade D–S controls main-stat budgets, upgrade Gold and milestone roll ranges. Rarity does not change the main stat for the same item/power grade. Catalogue definitions deliberately include different rarities within the same grade. The older quality field remains for save/source compatibility; UI metadata now identifies the actual instance's rarity and power grade. Enhancement remains +0–15. Milestones at +3/+6/+9/+12/+15 add a legal stat until four, then improve a legal existing stat. Neither rarity nor power grade increases on upgrade.

New ready-made and crafted gear has a deterministic blueprint: exact main and starting substats can be reviewed before confirmation. No hidden random starting outcome, craft failure or added fee. Randomness only occurs on a successfully paid milestone; failed, stale, insufficient-Gold and preview paths never draw RNG. Each new instance persists its rarity, power grade, base main stat, initial substats, set and future rolls. The same snapshot survives equip/remove/transfer/save/reload and hypothetical later catalogue changes. Gold-only store prices and existing material-plus-labor blacksmith recipes remain unchanged.

New main-stat budgets are shared by power grade: D/C/B/A/S ordinary power 3/5/7/9/11; HP uses three times that amount; Defense/Resistance use one less; Speed uses 1/2/3/4/5. Every upgrade adds +2 to an HP main or +1 otherwise. Starting substat values use the power-grade range and the item's preferred legal template values, with deterministic fill to its rarity's starting count. Actual shop/recipe output and battle comparisons share the same blueprint.

## Allowed pools

| Slot | Allowed main stats | Substat restriction |
| --- | --- | --- |
| Weapon | Physical or Special Power | No Defense/Resistance; excludes own main |
| Armor | Defense | No Physical/Special Power or Status Power; excludes own main |
| Head | Max HP | Other existing non-evasion battle stats |
| Hands | Physical Power, Special Power, Accuracy | No Defense/Resistance; excludes own main |
| Feet | Speed, Max HP, Defense, Resistance | Existing non-evasion battle stats except own main |
| Accessory | Existing non-evasion stats except Speed | Existing non-evasion battle stats except own main |

The detailed typed pools are in `src/data/equipmentRules.ts` and the in-game slot guide. No new Critical stats or percentage item rolls were introduced; set percentages are separately applied. No duplicates or main-stat substats are generated. Old out-of-pool earned rolls remain intact; future milestone draws follow the current pool. Old deterministic milestone reconstruction still uses its historical pool, so saved earned values do not shift.

## Existing saves

First normalization materializes all existing counts/loadouts with their legacy rules and records a version boundary. Existing instance IDs, levels, owners, original main/substats, passives and recorded or historically earned milestones are retained. Legacy rarity is inferred from original starting substats, not from the number accumulated by upgrades. Legacy items are not forced into new rarity counts or main-stat budgets. Subsequent acquisitions use version 3; purchases and crafting explicitly normalize before adding stock and materialize new instances after success.

The published pre-update stat function was used to capture `tests/fixtures/equipment-v2-stats.json` before changing it. Those 28 independent fixtures cover two historical rule versions, two upgrade levels and seven representative items, including the Relic. The old implementation is not shipped. Existing three-/five-slot and orphan-gear migrations remain active.

Existing items receive their catalogue set family as part of the newly approved set system. Individual bonuses remain unchanged, but completing sets intentionally adds new bonuses to newly created battles. In-progress battles keep their saved starting stats. No retroactive inventory, Gold, GP, Marks or item rewards are granted.

## Starter sets

| Set | Pieces per group | Bonus per completed group |
| --- | ---: | --- |
| Vigor | 2 | +10% base Max HP |
| Bulwark | 2 | +10% base Defense and Resistance |
| Striker | 4 | +15% base Physical and Special Power |
| Swift | 4 | +10% base Speed |

Only equipped items on that creature count, once each. Inventory stock, other creatures and incomplete groups do not count. Repeated completed two-piece groups are allowed: four matching items activate twice, six activate three times. Six slots allow one four-piece group plus one two-piece group. Rates add before applying them to base battle stats and rounding down once. Equipment and Focus Training are added separately; no compounding with gear or other sets. Base battle stats retain the existing species/level/talent calculation. Set progress, comparisons and battle initialization share the same summary.

Catalogue coverage is intentionally small: Swift can be completed with Channeling Staff, Focus Circlet, Field Gloves and Runner Bands; Vigor with Padded Harness, Linen Headband, Trail Boots and Keepsake Charm; Striker has weapons, Hands, Sentinel Greaves, Reserve Pendant and Champion Harness; Bulwark has defensive armor, Sentinel Helm and Guard Charm. The complete per-item mapping is in `equipmentRules.ts`. New Legendary gear may have a special passive, but rarity does not automatically invent one; Champion's Resolve remains the existing special case.

## Visual provenance

Reuses the approved C2/apothecary background, item art and frames. Five new editable SVG set symbols (`set-vigor`, `set-bulwark`, `set-striker`, `set-swift`, `sets-crest`) extend the existing icon style. Card colors denote rarity; power grade remains explicit text. Asset hashes and the preview contact sheet were updated. No Epic Seven image assets were copied into production.

Two original layout concepts were generated using the built-in image tool, referencing the current C2 screenshot only. Their exact prompts, original PNGs, source screenshot, implementation notes, fixtures, logs and reviewed screenshots are archived in the existing Drive project folder. The linked Epic7x equipment guide was a structural reference; its old numerical balance was not imported.

## Validation

All 350 regression tests pass. New tests cover rarity/grade independence, every rarity and all six slot pools through +15, immutable saved profiles, failed RNG paths, legacy fixture parity, exact new purchase/craft output, all set thresholds, real 4+2 builds for all four sets, set-breaking comparisons, old battle immutability, and another combatant receiving no wearer bonus. The legacy integration fixtures explicitly reconstruct pre-version-boundary saves; the new Tactician Emblem reward test now asserts its declared +2 Speed and +9 Battle Energy blueprint instead of its old numbers.

Direct optimized Next production build (including TypeScript), scoped lint with zero errors and whitespace checks pass. As before, a full npm asset preflight cannot validate missing legacy breeding images in this sparse checkout; no placeholder art was added to the game. Production browser QA at 1440×900, 390×844, 844×390 and 360×740 verifies scrolling-free galleries, separate power/rarity/set filters, set counts and member pages, all guide pages, no-spend inspection/cancellation, an explicit Swift 4→3 break and 1→0 active-group confirmation, one committed equip, and a Legendary +2→+3 upgrade that improves one existing substat for exactly 105 Gold under double confirmation. Four substats, rarity/power and the one paid roll persist on reload. No browser page errors. Missing sparse legacy art is replaced only in the synthetic QA harness; production asset decoding and reviewed screenshots are separate evidence.

Push status, Vercel build status and protected hosted gameplay verification remain distinct. PR #21 stays draft and unmerged. The next system task is first-week/new-six-slot balance with real set builds; the next visual decision is concept A versus B.
