# First-week economy balance

Fresh ranches now start with 1,200 Gold, 14 Feed, and 4 Materials. Previously they started with 2,000 Gold and no explicit supply reserve. Fourteen Feed covers two nights for the five starter creatures, giving players time to learn production chores. The First Week guide explains the reserve and the roles of chores versus Guild/battle income.

Gold from all sixteen one-time starter milestones falls from 2,825 to 1,025. Feed, Materials, and GP rewards remain unchanged. Each reward retains its existing one-time claim flag.

| Milestone | Previous Gold | New Gold |
| --- | ---: | ---: |
| Assign chores / Security / Comfort (each) | 75 | 25 |
| Assign Production / Garden / Hauling (each) | 100 | 35 |
| Resolve first night | 150 | 75 |
| Produce Feed / gather Materials (each) | 75 | 35 |
| Repair ranch | 200 | 75 |
| Ranch upgrade | 250 | 125 |
| Breeding attempt | 250 | 100 |
| First egg | 300 | 125 |
| Adoption | 200 | 50 |
| Tax milestone | 300 | 75 |
| First Guild request | 500 | 150 |

The audit found front-loaded Gold, not construction pricing, to be the main issue. North Pasture stays at 850 Gold / 12 Materials. Supplies, equipment, NPC request payouts, board generation/rewards/rerolls, and construction durations stay unchanged. The tutorial still guarantees an eligible first creature pairing a safe one-day pregnancy, and supports either natural hatching or the one-time Catalyst.

## Evidence and validation

- Before tuning, one seven-night fresh-save chore audit ended at 3,410 Gold without Guild work or battles. A comparable post-change audit ended at 1,730 Gold.
- The twelve-save regression batch produced 1,695–1,970 Gold after seven nights using Rook on Security, Bruna on Production, and Marlow on Hauling. Every save covered feeding and could purchase Feed and Materials, commission North Pasture, buy a Training Blade and Padded Harness, and retain at least 250 Gold and four Materials. These are sampled results, not guaranteed income; daily goals, events, and creature generation vary.
- Thirty automated Opening Scrimmage trials using basic AI on both sides, the first three generated starters, and no purchased player gear yielded 24 wins / 6 losses, with no unresolved fights at the 50-round cap. This limited simulation supports leaving the encounter unchanged; it does not predict every player's win rate.
- All 47 targeted tests pass: economy 3, tutorial/breeding/hatching 13, ranch day 7, builder 12, location interactions 5, weekly Guild/NPC quests 7. Production build/TypeScript and scoped lint pass with no errors or warnings.
- Browser checks confirm the actual new-game wallet and supplies, the updated guide at desktop/phone sizes, and unchanged balances after reload.
- The builder test now explicitly empties Feed when testing the no-attractor condition. Fresh-save Feed does not bypass the Chapter 1 predator gate.

Existing wallets, inventories, paid work orders, and claimed milestones are not reset or clawed back. Existing unclaimed milestones pay the revised amounts. Use a new save to test the full starting package.

Next: show completed construction on the ranch so capacity and security investments have visible results. Draft PR remains unmerged.
