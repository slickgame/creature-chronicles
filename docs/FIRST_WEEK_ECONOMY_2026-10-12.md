# First-week economy and budgeting — 2026-10-12

## Published baseline
Equipment enhancement commit: `1f75474f281f19bcafa45d443ab00197c2d4486c`. GitHub’s Vercel status reports success for that commit. The sign-in-protected live preview was not inspected. Branch remains `feature/ui-ranch-ledger-2026-09-29`; PR #21 remains draft and unmerged.

## Implemented
- **Budget** in Farm Management and Petra’s construction resource panel forecasts seven nights using current residents, the actual species feed-cost function, unreserved rations, optional diet-compatible raw ingredients, and legacy Feed.
- Prepared meals stay protected. Reserved stock cannot fund the forecast. Currently away trainees are excluded. No future gathering, rewards, births, acquisitions or training returns are assumed.
- Shows missing Balanced rations and their cost at the current Trade price (8 Gold each). Pella’s bundle/Trust discounts can cost less. This is an advisory stock-only estimate; it does not spend supplies or lock Gold.
- Iona/Outfitter equipment improvements show cumulative costs to the remaining +3/+6/+9/+12/+15 milestones and resulting Gold balance. Warning appears when a purchasable milestone leaves less than the seven-night food estimate.
- Upgrades remain one level at a time, Gold only, exact results disclosed. Prices and rewards are unchanged in this pass.

## New-save baseline
1,200 Gold; 14 legacy Feed; five residents consuming seven food units nightly. Without gathering or rewards, stock covers two nights, leaving 35 rations / 280 Gold to buy for the rest of seven nights. Common equipment enhancement totals: +3 costs48, +6 costs168, +9 costs360, +12 costs624, +15 costs960 Gold, excluding the purchase price of equipment. These are cumulative from +0. The main early spending choice is how far to upgrade before investing in production.

## Reproducible first-week route
Run `npm run simulate:first-week`. Uses the real transaction and overnight projection functions with a fixed save ID for daily-event/goal selection. This is one controlled route, not a Monte Carlo claim about all players or event outcomes. No mission or battle income, sales, breeding, taxes at month-end, or deliberate daily-event rewards are assumed. Actual automatic starter and daily-goal rewards are included.

Each day: one Wheat-patch work action, one Garden action and one Woodlot action using three different starter creatures; cook two batches (8 Balanced rations). Day1: buy Training Blade for55Gold and upgrade to+3 for48Gold. Day2: complete Petra’s once-only timber order for100Gold. Day3: commission Quarry for180Gold and6Wood. All operations use normal Energy, material and Gold checks. Feeding and construction use the actual overnight lifecycle. Weather/predator outcomes from that fixed seed are not generalized to other saves.

| Day | Work actions | Net Gold change including goals | Closing Gold | Food covered / needed | Rations left | Legacy Feed left |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 3 | +197 | 1397 | 7 / 7 | 17 | 14 |
| 2 | 3 | +175 | 1572 | 7 / 7 | 19 | 14 |
| 3 | 3 | -140 | 1432 | 7 / 7 | 22 | 14 |
| 4 | 3 | +0 | 1432 | 7 / 7 | 24 | 14 |
| 5 | 3 | +75 | 1507 | 7 / 7 | 26 | 14 |
| 6 | 3 | +0 | 1507 | 7 / 7 | 28 | 14 |
| 7 | 3 | +125 | 1632 | 7 / 7 | 33 | 14 |

Result: all seven nights fully fed, Training Blade+3 and completed Quarry, ending with1,632Gold. This supports keeping first-week prices stable while giving players clearer budgets. It does not establish that +15 gear or the full metal-production chain should be a first-week objective.

## Verification and art
14 focused tests passed (economy budget, ranch planner and equipment enhancement), production build passed, changed-file lint has zero errors. Browser checks cover desktop1440×900, phone390×844 and landscape844×390, milestone tables, the Farm Management Budget tab, transaction cancellation, exact charges, duplicate clicks, persistence and insufficient funds. Screenshots reviewed; added parchment heading contrast corrections. No new equipment or artwork required. Existing approved painterly assets remain in use.

## Next
Audit ore → charcoal → ingots → Iona’s recipes against direct ingot purchases and ready-made gear, then examine mid-grade upgrades and meal trade-offs. Preserve Gold-only shops, material+labor crafting, reserve protection, instant farm work, distinct Iona/Petra art and all existing Gold/GP/Marks/item rewards. Confirm each new Vercel deployment separately from push success.
