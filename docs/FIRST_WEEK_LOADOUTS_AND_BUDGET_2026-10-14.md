# First-week loadouts and upgrade planning — 2026-10-14

Continues Creature Chronicles from d5c8a18b53f559f306b9c6fe9ba5449a5af79d02 on the existing feature branch and draft PR21. Existing untracked ranch art masters preserved.

## Planner

Iona's Gold & food budget now opens a focused illustrated ledger with Milestones / Food / Construction pages. Milestones show the exact sum of remaining level costs and Gold left after the seven-night food fallback and chosen construction allowance. The highest later milestone within that plan is identified; a fully improved or unaffordable plan is explicit.

Construction offers Quarry, Sawmill and combined presets from the real FACILITIES definitions, plus a custom nonnegative integer allowance. It excludes already-paid projects and tells the player to check materials/prerequisites with Petra. Food retains the stock-only forecast: unreserved resources, ingredient feeding opt-in, legacy Feed and training-away exclusions, without assuming future production or rewards. Trade prices are a fallback, not a hidden fee. Allowances are temporary UI planning values: no Gold is reserved or spent and no upgrade is blocked by this advice. Existing per-level confirmation remains the purchase gate.

Uses existing equipment icons and approved parchment; no new generated bitmap was needed. Provenance remains in the equipment-art and ranch-dossier documents. Every displayed figure is real UI text.

## Audit

Reproduce with `npm run simulate:first-week-loadouts`. CSV: FIRST_WEEK_LOADOUTS_2026-10-14.csv. Uses actual farming, cooking, delivery, construction, day projection, purchase, enhancement, equip and battle functions.

Route: fixed fresh starter roster/save ID, three distributed work actions per day; wheat, garden, wood (Quarry replaces wood on day 5). Cook eight rations per day. Deliver Petra's timber once on day 2. Commission Quarry on day 3, Sawmill on day 6. All seven nights fed, both facilities complete, 21 instant actions. No operating Gold charges, mission income, sales, training, births or repeated deliveries. First-day daily goals are regenerated for the fixed audit save ID so repeated runs have the same route and awards.

Gold ledger: 1,200 starting +100 timber delivery +780 earned overnight daily/starter-goal awards −420 construction =1,660 at the end of the week. Current food stock then lacks two rations for a further seven nights: 16 Gold fallback. These awards and food quantities are observations for this seeded route, not guaranteed income for every save.

Day-one planning deducts the initial seven-night fallback (280 Gold) plus both projects (420), leaving 500 Gold for gear. End-of-week planning uses actually earned Gold and stock. Gear is purchased after the seven-day route (morning of day 8); this isolates its cost from daily goal income. The separate day-one column is an affordability check, not a simulation of gear owned all week. The Gold stress column removes the earned 780 Gold but retains actual earned food stock; it does not represent an entirely reward-free campaign.

| Loadout | Gear Gold | Day-one plan left | End-week plan left | Gold stress left | Novice champion wins /24 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Farm first | 0 | 500 | 1,644 | 864 | 0 |
| One weapon +3 | 103 | 397 | 1,541 | 761 | 0 |
| Three weapons +3 | 309 | 191 | 1,335 | 555 | 10 |
| Three weapons +6 | 669 | -169 | 975 | 195 | 17 |
| One common set +3 | 475 | 25 | 1,169 | 389 | 0 |
| Three common sets +0 | 705 | -205 | 939 | 159 | 17 |
| Three common sets +3 | 1,425 | -925 | 219 | -561 | 24 |
| Three common sets +6 | 3,225 | -2,725 | -1,581 | -2,361 | Not simulated |

For accepted plans, 24 seeded real equipment roll samples per plan, first three level-one starters, four early authored C2 encounters, matched battle IDs, tactical player AI versus authored enemy AI, 60-round cap: 672 battles total. All accepted cases lost to Breaker Squad at this creature level. CSV includes the other encounter outcomes and rounds. These are isolated comparisons: encounter unlocks, tutorial timing, battle-entry costs, combat XP/rewards and player tactics are not simulated. They are not human win probabilities. Other seeds/rosters can differ.

Decision: retain prices and roll ranges. Three +3 starter weapons fit a conservative starting budget; three complete +3 sets are a larger investment relying on earned Gold. Equipment alone does not clear the next-tier encounter at level one. Farming and goal awards make later preparation stronger, so future tuning should use actual progression rather than removing those rewards or pricing against an artificial 100,000-Gold audit budget.

## Validation

Six targeted economy/loadout tests pass: complete Gold reconciliation, deterministic route, seven fed nights, real purchase cost parity, build completion, rejected unaffordable sets, default budget behavior, construction allowance, maximum level, invalid allowance and zero save mutation. Added the audit tests to test:regression. Production Next build passed; changed-file lint zero errors (five native-image warnings).

Production browser: all three pages at 1440×900, 390×844 and 844×390; exact 420-Gold differences for construction presets, custom allowance/no-fit state, clear/reset, real artwork decoding, Escape/focus restoration and unchanged saved balances/flags. An initial seven-pixel landscape overflow was corrected with compact table spacing and paragraph line-height, then all pages passed. Final screenshots reviewed. Sparse-checkout missing legacy images are aborted only by the harness.

Next: use these findings in Coliseum preparation with affordable starter-team gear choices and direct review links to buy, equip and upgrade. Keep choice/confirmation explicit and preserve the selected team when returning. Follow with actual early Circuit progression (XP/rewards included) to check when gear and creature growth make the next tier approachable.
