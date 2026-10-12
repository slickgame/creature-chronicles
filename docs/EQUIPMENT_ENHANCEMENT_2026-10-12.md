# Equipment enhancement — 2026-10-12

## Scope and design
Continue Creature Chronicles on `feature/ui-ranch-ledger-2026-09-29`; PR #21 remains draft and unmerged. Builds on the named-resource update and Iona/Petra Builder’s Yard implementation.

All 22 current equipment types support individual owned copies, +0 through +15. Access **Improve equipment** through Iona’s forge or the Battle Outfitter. Iona and Petra remain separate female NPCs with distinct existing character artwork and service entrances.

- One main stat grows every level (+2 Max HP, otherwise +1).
- Existing +0 bonuses are preserved. Existing secondary bonuses become starting substats (up to four).
- At +3, +6, +9, +12 and +15, add a distinct substat until four exist; thereafter improve one existing substat. Milestone increase is +2 Max HP or +1 for other stats.
- Outcomes are fixed per copy, using its persistent ID and milestone. Main stat, fixed passive stats and existing substats cannot be duplicated into a new substat slot. The exact next result is visible before spending.
- Upgrades always succeed and cost Gold only. They do not consume materials or another piece of equipment. Equipment quality/grade and innate creature grades remain unchanged.
- Every newly purchased, crafted or rewarded copy starts at +0. Copy levels survive equipping, replacing, same-type swaps, removal and save reload. Equipment from departed owners returns to stock once.
- Fixed copy IDs are materialized in load/save normalization. Compatibility stock/slot flags remain supported. Legacy three-slot saves migrate before copies are reconciled; collision refunds remain once-only.
- Confirmation checks expected level and available Gold; stale/replayed requests cannot charge twice. UI blocks duplicate clicks.
- Existing battle snapshots stay unchanged. New battle stats use the chosen copy’s enhancement.

## Costs (first balancing pass)
Each next level costs the grade coefficient multiplied by the target enhancement level.

| Quality / grade | Coefficient | +0 → +1 | +14 → +15 | Total +0 → +15 |
|---|---:|---:|---:|---:|
| Common / D | 8 | 8 Gold | 120 Gold | 960 Gold |
| Fine / C | 12 | 12 Gold | 180 Gold | 1,440 Gold |
| Superior / B | 18 | 18 Gold | 270 Gold | 2,160 Gold |
| Masterwork / A | 25 | 25 Gold | 375 Gold | 3,000 Gold |
| Relic / S | 35 | 35 Gold | 525 Gold | 4,200 Gold |

These are initial predictable prices, not a claim of completed first-week economy balancing.

## Relic passive
Champion Harness retains every original +0 numeric bonus. Its +2 Accuracy and +10 Max Battle Energy are named fixed passive bonuses outside the four substats. **Champion’s Resolve** additionally starts each battle with Guarded for one round (engine’s 25% damage reduction). It does not stack with another Guarded status or shorten an existing duration. C4 initialization reapplies the opening passive after its carryover reset; no repeated numerical stat addition occurs.

## Reference
Epic Seven’s +15 cap, every-three-level enhancement milestones and four-substat structure informed this design. Reference consulted: https://game8.co/games/Epic-Seven/archives/272525 (search-index excerpt; article fetch unavailable). Official STOVE probability page https://page.onstove.com/epicseven/global/view/7902683 did not expose readable details. No claim is made to reproduce Epic Seven’s probabilities, stat ranges or economy. Creature Chronicles uses guaranteed upgrades and pre-disclosed deterministic milestone results.

## Art audit and provenance
All 22 equipment types already have distinct real WebP artwork in the published repository. No new equipment type or missing equipment illustration was found, so no replacement image generation or new generation prompt was required. Existing sharp anime-painterly assets are reused; no placeholder was added to product code. Tests verify file format and distinct content hashes. Iona’s generation prompt and provenance remain in `BLACKSMITH_ART_PROMPT_2026-10-12.json` and `BLACKSMITH_YARD_2026-10-12.md`. Sparse-checkout art was restored from Git without changing assets.

| Item | Existing artwork |
|---|---|
| Sparring Wraps | `public/images/ui/outfitter-v1/sparring_wraps.webp` |
| Guard Charm | `public/images/ui/outfitter-v1/guard_charm.webp` |
| Arena Blade Wraps | `public/images/ui/outfitter-v1/arena_blade_wraps.webp` |
| Focus Prism | `public/images/ui/outfitter-v1/focus_prism.webp` |
| Bastion Badge | `public/images/ui/outfitter-v1/bastion_badge.webp` |
| Tactician Emblem | `public/images/ui/outfitter-v1/tactician_emblem.webp` |
| Champion Harness | `public/images/ui/outfitter-v1/champion_harness.webp` |
| Training Blade | `public/images/ui/equipment-v2/training_grips.webp` |
| Channeling Staff | `public/images/ui/equipment-v2/channeling_prism.webp` |
| Duelist Saber | `public/images/ui/equipment-v2/duelist_grips.webp` |
| Padded Harness | `public/images/ui/equipment-v2/padded_harness.webp` |
| Warded Harness | `public/images/ui/equipment-v2/warded_harness.webp` |
| Sentinel Harness | `public/images/ui/equipment-v2/sentinel_harness.webp` |
| Linen Headband | `public/images/ui/equipment-v2/linen_headband.webp` |
| Focus Circlet | `public/images/ui/equipment-v2/focus_circlet.webp` |
| Sentinel Helm | `public/images/ui/equipment-v2/sentinel_helm.webp` |
| Practice Wraps | `public/images/ui/equipment-v2/practice_wraps.webp` |
| Runner Bands | `public/images/ui/equipment-v2/runner_bands.webp` |
| Duelist Bracers | `public/images/ui/equipment-v2/duelist_bracers.webp` |
| Keepsake Charm | `public/images/ui/equipment-v2/keepsake_charm.webp` |
| Reserve Pendant | `public/images/ui/equipment-v2/reserve_pendant.webp` |
| Focus Emblem | `public/images/ui/equipment-v2/focus_emblem.webp` |

## Verification
- 281 tests passed across all test files, including eight enhancement tests covering every item through all 15 levels, original bonuses, migration, per-copy ownership, exact costs, preview/combat parity, no duplicate spending, new grants and passive behavior.
- Optimized Next.js production build passed.
- Changed-file ESLint: zero errors; existing image, hook-dependency and unused-import warnings remain.
- Built-app browser transactions cover cancellation, exact Gold charges, duplicate clicks, independent copies, equip/remove/reload persistence, +15 cap insufficient funds and the Outfitter entry.
- Desktop 1440×900, phone 390×844 and landscape 844×390: resource and gear images decode, upgrade reviews have no horizontal overflow; screenshots reviewed and parchment text contrast corrected.
- Missing unrelated legacy artwork in the sparse local checkout receives neutral placeholders only in the QA harness. Equipment artwork and Iona artwork are the real assets.

## Next
Balance first-week Gold income and equipment enhancement spending alongside resource production, cooking, construction and crafting. Keep ready-made gear Gold-only. Add further passive-bearing equipment and original per-item artwork when introducing new equipment types. Deployment publication status is reported separately from these local validation results.
