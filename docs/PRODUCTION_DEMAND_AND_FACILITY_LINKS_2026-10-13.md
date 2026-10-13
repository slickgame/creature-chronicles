# Production demand and facility shortcuts — 2026-10-13

Locked production recipes now open the exact construction page: Charcoal → Kiln, Iron → Furnace, Nails → Forge. Locked Quarry gathering opens Quarry construction. A project with a missing prerequisite links to that project, with a Previous project trail. Returning to the recipe preserves its selected output, worker and batch quantity. Escape exits construction back to the originating recipe. Construction still needs confirmation, protects reserves, uses the shared crew and completes after the existing overnight delay.

## Controlled demand comparison

Reproduce: `node --no-warnings --loader ./scripts/ts-test-loader.mjs scripts/compare-production-demand.ts`.

Novice: all stats 6, matching skill 1. Experienced: all stats 48, matching skill 16. No talents, ranch upgrades, meals or starting stock. Each row independently expands ingredients with whole recipe batches and whole collection actions. Leftovers are not shared between rows. Sawmill doubling is excluded. Processing is instant and has no Energy cost. Required facilities are assumed available for costing; their construction bills and overnight delays are excluded from each individual row. Energy is total workload, not a promise one creature can finish it in a day. These synthetic endpoints do not estimate progression speed.

| Project / recipe | Raw bill | Gold | Novice actions / Energy | Experienced actions / Energy |
|---|---|---:|---:|---:|
| Quarry | 6 Wood | 180 | 2 / 44 | 1 / 15 |
| Sawmill | 8 Wood + 4 Stone | 240 | 3 / 68 | 2 / 32 |
| Charcoal kiln | 4 Wood + 6 Stone | 160 | 3 / 70 | 2 / 32 |
| Iron furnace | 10 Stone + 8 Wood | 280 | 5 / 116 | 2 / 32 |
| Small forge | 8 Stone + 4 Iron ore + 2 Wood | 320 | 5 / 122 | 3 / 51 |
| Managed woodlot | 8 Wood + 4 Stone | 220 | 3 / 68 | 2 / 32 |
| Supported iron mine | 14 Wood + 2 Iron ore | 300 | 5 / 114 | 3 / 49 |
| Iona: training_blade | 2 Iron ore + 2 Wood | 10 | 2 / 48 | 2 / 34 |
| Iona: focus_circlet | 6 Iron ore + 4 Wood | 45 | 4 / 100 | 2 / 34 |
| Iona: reserve_pendant | 6 Iron ore + 4 Wood | 60 | 4 / 100 | 2 / 34 |

## Decision

Keep existing coefficients and starter prices. Experienced workers need 1–3 collection actions per individual facility bill, but Gold (160–320 per facility), prerequisite chains and overnight construction remain. Starter circlet/pendant production falls from 4 actions / 100 Energy to 2 / 34, while 45/60 Gold labor remains. This supports making starter equipment easier after substantial progression. It does not justify raising early costs or claiming a complete late-game balance pass. Existing production regression covers purchased-input processing resale loops.

Next: design a small second tier of deterministic blacksmith recipes and compare resource demand against the experienced roster. Show exact output/grade/stats/passives and labor fees, retain Gold-only store gear. Also improve project-specific illustration and ingredient-source access on construction pages.

## Verification and art

Direct optimized Next build passed; 12 work-yield, production and blacksmith regression tests passed. Scoped lint: zero errors, existing native-image warnings only. Browser tested Iron → Furnace → Kiln → Quarry → back through each prerequisite → original Iron recipe with 5 batches preserved at 1440×900, 390×844 and 844×390. No page overflow or runtime errors. Construction cancellation left save unchanged; confirmation created next-day Quarry project without prematurely granting facility benefits. Screenshots reviewed.

Reuses existing parchment, resource icons and approved illustrations; no new generated artwork or prompts.
