# Equipment battle audit — 2026-10-12

Branch `feature/ui-ranch-ledger-2026-09-29`, PR #21 draft/unmerged. Baseline `b72c90bd64e9319f71a6148e97f718d595dd3487` has a successful Vercel status. Protected live preview has not been inspected.

## Delivered
- Run `npm run simulate:equipment-battles` for reproducible equipment comparisons through the real persistent battle engine, authored enemy equipment, player loadouts and AI.
- Team Preparation now displays each equipped item’s enhancement level and the creature’s actual equipped battle stats. Encounter modifiers, temporary effects and Tactics Kits are excluded from this baseline and applied by battle initialization. Existing innate grades, upgrade saves and combat snapshots remain unchanged.
- Fixed the first-week simulation’s starter generation: setting the save ID after creating the roster did not fix rolled starter talents. Both simulations now explicitly create starters using their fixed save IDs. The corrected first-week route ends at **1,672 Gold**. The previous **1,632** was a recorded run with different starter talents, not a repeatable baseline. This is a test-fixture correction, not a reward or price change.

## Method and limits
24 matched battle IDs per encounter/loadout; four opening encounters; seven loadouts; three setups = **2,016 battles**. Setups: Mira/Rook/Bruna at level1, the same trio at level4 using normal stat growth, and Mira/Bruna/Pip at level4. Same fixed starter seed, talents, moves and copy IDs within each comparable setup. No consumables, manuals, learned new moves, rewards or between-battle progression. Tactical player AI versus each encounter’s authored difficulty. Sixty-round cap, with unresolved/drawn results reported separately.

These are outcomes of controlled AI simulations, not estimates of human-player win probabilities. One starter seed cannot establish balance for every talent roll, variant or move composition. The extra roster checks composition but is not a fully trained healer build. Raw results are in `docs/balance/equipment-battle-audit-2026-10-12.json`.

## Team acquisition and upgrade costs
| Loadout for all three creatures | Gold including gear purchases |
|---|---:|
| No equipment | 0 |
| Training Blades +0 | 165 |
| Training Blades +3 | 309 |
| Training Blades +6 | 669 |
| Five Common slots each +0 | 705 |
| Five Common slots each +3 | 1,425 |
| Five Common slots each +6 | 3,225 |

A full team-wide upgrade is a substantially larger investment than improving a few useful pieces. The simulation’s large fixture wallet only permits comparisons; it is not a new-game grant.

## Champion and Bronze results
| Team | Kit | Enhancement | Novice Champion wins / 24 | Breaker Squad wins / 24 |
|---|---|---:|---:|---:|
| Mira/Rook/Bruna Lv1 | none | +0 | 0 | 0 |
| Mira/Rook/Bruna Lv1 | weapons | +0 | 5 | 0 |
| Mira/Rook/Bruna Lv1 | weapons | +3 | 10 | 0 |
| Mira/Rook/Bruna Lv1 | weapons | +6 | 16 | 0 |
| Mira/Rook/Bruna Lv1 | full-common | +0 | 17 | 0 |
| Mira/Rook/Bruna Lv1 | full-common | +3 | 20 | 0 |
| Mira/Rook/Bruna Lv1 | full-common | +6 | 23 | 0 |
| Mira/Rook/Bruna Lv4 | none | +0 | 23 | 0 |
| Mira/Rook/Bruna Lv4 | weapons | +0 | 23 | 0 |
| Mira/Rook/Bruna Lv4 | weapons | +3 | 23 | 0 |
| Mira/Rook/Bruna Lv4 | weapons | +6 | 23 | 0 |
| Mira/Rook/Bruna Lv4 | full-common | +0 | 23 | 0 |
| Mira/Rook/Bruna Lv4 | full-common | +3 | 24 | 0 |
| Mira/Rook/Bruna Lv4 | full-common | +6 | 24 | 1 |
| Mira/Bruna/Pip Lv4 | none | +0 | 5 | 0 |
| Mira/Bruna/Pip Lv4 | weapons | +0 | 12 | 0 |
| Mira/Bruna/Pip Lv4 | weapons | +3 | 14 | 0 |
| Mira/Bruna/Pip Lv4 | weapons | +6 | 19 | 0 |
| Mira/Bruna/Pip Lv4 | full-common | +0 | 17 | 0 |
| Mira/Bruna/Pip Lv4 | full-common | +3 | 24 | 0 |
| Mira/Bruna/Pip Lv4 | full-common | +6 | 24 | 0 |

## Findings and next action
Enhancements improve Novice performance. Leveling also substantially improves the original trio’s Champion results. The first Bronze battle, recommended level4, remains a marked spike: the level4 original trio with full Common+6 gear wins only1/24. Other tested level4 loadouts and the alternative trio lose all24 Breaker samples.

Do not respond by increasing upgrade requirements or treating +15 as mandatory. Next, inspect Breaker Squad’s burst, guard-break tools, variant stat advantages and the availability of player counter-moves, using trained/control-oriented player loadouts as controls. Then adjust the smallest demonstrated problem. No enemy stats, gear prices, rewards, substat rolls or battle formulas are changed in this audit update.

## Validation and art
19 focused tests passed: deterministic simulation runs/costs, equipped-stat preview against real battle creation, equipment migrations, all +15 levels, copy persistence and economy budgets. Production build passes; scoped ESLint reports zero errors (three image warnings). Browser checks verify enhanced-copy labels, actual stat grids and no dialog horizontal overflow at1440×900,390×844 and844×390, without browser exceptions. Screenshots visually reviewed. No new equipment or artwork; approved existing character and equipment assets remain in use.
