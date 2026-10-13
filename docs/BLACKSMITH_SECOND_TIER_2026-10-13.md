# Iona’s second recipe tier — 2026-10-13

Adds three deterministic recipes for existing Superior / Grade B gear. Outputs are ordinary +0 equipment, compatible with normal equips, comparisons and +15 enhancement. No hidden fees, failure rolls, changed stats or farm-forge prerequisite at Iona. Ready-made stores remain Gold-only.

| Output | Iron ingots | Nails | Labor Gold | Materials at Trade + labor | Store Gold |
|---|---:|---:|---:|---:|---:|
| Duelist Saber | 8 | 2 | 100 | 444 | 470 |
| Sentinel Helm | 7 | 4 | 100 | 428 | 440 |
| Duelist Bracers | 7 | 4 | 110 | 438 | 460 |

The existing six-page recipe picker, exact output/review, comparison and ingredient-source popups automatically include these recipes. Iron is refined ingots; raw ore cannot substitute. Nails add a meaningful processing route; players may buy components instead of building a farm forge.

## Demand

| Project / recipe | Raw bill | Gold | Novice actions / Energy | Experienced actions / Energy |
|---|---|---:|---:|---:|
| Iona: duelist_saber | 18 Iron ore + 10 Wood | 100 | 12 / 300 | 3 / 53 |
| Iona: sentinel_helm | 16 Iron ore + 10 Wood | 100 | 11 / 274 | 3 / 53 |
| Iona: duelist_bracers | 16 Iron ore + 10 Wood | 110 | 11 / 274 | 3 / 53 |

Independent from-zero bills, whole collection/processing batches, no shared leftovers. Novice stats 6/skill 1, experienced stats 48/skill 16; no talents, upgrades, meals or Sawmill bonus. Prerequisite build costs/time excluded. Energy is total workload, not a single-day promise. The modest buy-materials discount preserves convenience pricing; gathering replaces material purchases while labor still costs Gold.

## Art

Reuses distinct approved `public/images/ui/equipment-v2/duelist_grips.webp`, `sentinel_helm.webp`, `duelist_bracers.webp`; existing frame and Iona illustration. No new image generation or prompts. Preserving existing item identities prevents duplicate gear and conflicting art across crafting, inventory and shop.

## Verification

19 blacksmith, enhancement and comparison regression tests passed, including each recipe’s exact grant/cost and equipping, reserve rejection, insufficient Gold, replay protection, and unchanged Gold-only shop purchase. Scoped lint zero errors. Direct optimized Next production build passed (separate sparse-checkout asset prebuild not run). Browser checked all three recipes and artwork at 1440×900, 390×844, 844×390: no overflow; cancellation unchanged, exact Iron/Nails/Gold deduction, one craft revision per double-click. Screenshots reviewed.

Next: improve post-craft access to the newly created equipment and upgrade/comparison screens; illustrate construction projects and provide direct ingredient source links there. Keep legendary passive expansion for a dedicated combat-balance pass.
