# Production and crafting economy — 2026-10-12

Continue `slickgame/creature-chronicles`, branch `feature/ui-ranch-ledger-2026-09-29`, draft/unmerged PR #21. Baseline `298c772e0415e6874170b2223e6f4414e958999b` now has a successful Vercel status; protected live preview has not been inspected.

## Changes
Iona’s recipes now compare the ready-made price with **buying only missing unreserved materials plus labor**. Existing materials are used first; protected reserves are not counted as spendable. The estimate does not purchase supplies automatically or charge their value again at crafting confirmation. Both routes yield the same +0 equipment.

A sourcing guide explains Wood → Charcoal and Iron ore → Iron ingots, Quarry → Kiln → Furnace prerequisites, and that Iona uses her town forge. The farm Small forge produces Nails and is not required for her recipes.

Kitchen/Workbench cards show the Trade value of ingredients for the selected batch count, explicitly stating that recipes consume stored ingredients with no Gold charge. Porridge and breakfast preview the selected creature’s actual capped Energy gain. The preview and serving transaction share the same recovery function. The existing once-per-day meal restriction remains.

## Crafting comparison
| Item | Ready-made Gold | Buy all ingots + labor | Saving against retail |
|---|---:|---:|---:|
| Training Blade | 55 | 40 + 10 = 50 | 5 |
| Focus Circlet | 185 | 120 + 45 = 165 | 20 |
| Reserve Pendant | 205 | 120 + 60 = 180 | 25 |

These savings assume Trade ingot prices. With existing free-to-spend ingots, immediate Gold expenditure is labor only, but those ingots still have value for other uses. No stock, price, output-stat, Gold/GP/Marks or reward amounts changed.

## Metal production
- Quarry + Kiln + Furnace cost **620 Gold**, plus their listed construction materials and three construction completions. This infrastructure also provides other benefits; it is not a charge for visiting Iona.
- Two Wood (16 Gold at Trade) make two Charcoal. Two Iron ore (24 Gold at Trade) plus one Charcoal make an ingot. At even batch sizes, buying raw Wood and ore values each ingot at **32 Gold**, versus 40 Gold buying ingots directly.
- Small odd batches leave Charcoal: one ingot requires 40 Gold of raw purchases and leaves one Charcoal; three ingots require 104 Gold and leave one Charcoal. Do not present a fractional-fuel estimate as the exact bill for a fresh small batch.
- Farm work can supply Wood and ore for creature Energy. Gathered materials still compete with food production, construction and other uses. Consequently the smelting chain remains a long-term production investment rather than a requirement for early equipment.
- Repeated buy → process → sell cycles produce no Gold profit for any current recipe, including doubled Sawmill output. Supply-order premiums remain once-only rewards.

## Mid-grade and meal audit
| Equipment grade | Enhancement to +3 | Enhancement to +6 | Enhancement to +15 |
|---|---:|---:|---:|
| Common / D | 48 | 168 | 960 |
| Fine / C | 72 | 252 | 1,440 |
| Superior / B | 108 | 378 | 2,160 |

All costs are Gold from +0, excluding acquisition. Fine/ Superior equipment starts with different bonuses; quality alone is not a claim of superiority over an enhanced lower-grade piece. Exact comparison remains available before equip. No claim of complete combat-tier balance is made from this price audit.

Porridge uses ingredients valued at 16 Gold and restores up to 8 Energy; breakfast uses 32 Gold of ingredients and restores up to 15. Both compete for one bonus-meal slot. Worker’s stew remains useful for multiple subsequent work actions, and the breeding bowl serves its separate breeding purpose. No meals are consumed automatically by these previews. Existing values remain unchanged pending broader combat/progression evidence.

## Verification and art
11 focused tests pass: procurement totals through actual purchases/crafting, reserved stock, the construction/smelting chain, no repeatable processing arbitrage, capped meal recovery, duplicate-serving rejection, and prior blacksmith/budget regressions. Optimized production build passes. Changed-file lint has zero errors. Built-app browser checks exercise all three recipes, cancellation, exact charges, double clicks, persistence, reserves, insufficient Gold, both NPC entrances, and responsive source comparison. Kitchen ingredient-value and Energy previews checked visually. Existing art reused; no new equipment types or missing images in this update, so no image-generation prompt was required.

## Next
Test early combat progression with +0/+3/+6 loadouts before expanding recipes or passive-bearing equipment. Use those outcomes to choose new item roles, then generate distinct art for any newly introduced items. Keep existing save upgrades and equipment copies intact.
