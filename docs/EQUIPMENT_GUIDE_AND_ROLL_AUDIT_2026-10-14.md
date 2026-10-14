# Equipment guide and paired roll audit — 2026-10-14

Continues Creature Chronicles on feature/ui-ranch-ledger-2026-09-29, PR21 draft/unmerged. Starting published head: 277abf7a1bcd2feda1251cff8cd3330413a5e06f. Existing untracked ranch art masters preserved.

## Equipment guide

Stats & passives at Iona's upgrade bench opens a full-screen illustrated guide with four pages: Current stats, Slot rules, Roll ranges, Passives. Existing EquipmentStats consumers also expose Slot rules & roll ranges, making the same guide reachable from Outfitter/crafting comparisons and equipment confirmations. Closing a nested guide returns to its parent dialog and restores focus without changing the save.

Current values use the actual equipmentStats calculation. The guide identifies the equipment grade, level, main-stat growth, owned substats and open slots. Slot rules distinguish new pieces from legacy owned gear. Roll ranges come directly from substatRollRange for this item's grade; the guide explains uniform eligible-stat and integer-amount selection, four-substat maximum, saved rewards, exclusions and the five milestone levels. Passives show their full authored effect and battle initialization behavior. No future substat identity or amount is predicted. Max-level pieces explicitly show that no further upgrades remain.

Portrait uses four page buttons, focused content and Previous/Next/Back controls. Landscape places the equipment illustration beside the content. Reuses distinct approved equipment WebPs and parchment.webp; no new image generation was necessary. Art provenance and prompts remain in UI_EQUIPMENT_ART_2026-10-03.md and related item-art notes. No gameplay costs, ranges, existing stats or passive effects changed.

## Audit method

Reproduce with `npm run simulate:equipment-rolls`. The audit runs the real purchase, enhance, equip and battle engines. Data: EQUIPMENT_ROLL_AUDIT_2026-10-14.csv (168 rows, 4,032 battles).

- First three fixed starter creatures at team level 1 or 4; normal growth and equipped move loadouts.
- Three equipment cases: none, three training weapons, or a five-piece common set for each creature. Equipped gear levels +0, +3 and +6.
- Four earliest authored C2 encounters, 24 seeded samples per row, tactical player AI versus authored enemy AI, maximum 60 rounds.
- Each sample has a different seeded equipment-stat draw sequence. Paired low/typical/high profiles use identical stat choices and battle IDs. Low forces minimum increment; high forces maximum; typical uses seeded uniform increment draws like normal play. Typical is a sample, not an exact population average.
- No consumables, training, level gains or rewards during battles. Gold costs are gross acquisition and enhancement expenses for the whole team; a deliberately generous audit budget allows all cases and is not evidence of first-week affordability.

## Novice champion results

Wins out of 24 simulated battles, level-one team:

| Team gear | Whole-team Gold | Low | Typical | High |
| --- | ---: | ---: | ---: | ---: |
| None | 0 | 0 | 0 | 0 |
| Weapons +0 | 165 | 5 | 5 | 5 |
| Weapons +3 | 309 | 10 | 10 | 10 |
| Weapons +6 | 669 | 15 | 15 | 16 |
| Common sets +0 | 705 | 19 | 19 | 19 |
| Common sets +3 | 1,425 | 23 | 22 | 22 |
| Common sets +6 | 3,225 | 24 | 24 | 24 |

At team level four, the novice champion yielded 23/24 wins with no gear or weapons and 24/24 with common sets under every profile. Full CSV includes all encounters, average rounds and surviving allies. Higher increments do not guarantee more wins in a finite matched sample: Speed/target/action ordering can alter tactical plans.

Conclusion: this sample shows more sensitivity to total gear investment and creature growth than increment size. Retain current ranges pending an affordability audit and broader player testing. Full common sets, especially +6, overwhelm the early champion in these AI scenarios; avoid treating this as an intended starting loadout. These are deterministic simulation observations, not human win probabilities, mathematical bounds on all stat combinations, or late-game balance evidence. Only common/D gear is battle-audited here; other grades' ranges are covered by existing mechanics tests, not this battle result.

Next: compare reachable first-week partial loadouts and upgrade stops against food/construction budgets, then evaluate encounter difficulty with those realistic teams. Examine stat choice extremes separately if random identities prove more influential than increment sizes.

## Verification

20 focused enhancement/comparison/battle-audit tests pass. After changing typical from a midpoint to uniformly sampled increments, all three audit tests pass again. Production Next build passes. Changed-file lint has zero errors (five native-image warnings).

Production-browser checks at 1440×900, 390×844, 844×390 cover every guide page on a Grade B Duelist Saber and a +15 legacy Grade S Champion Harness: exact current stats/ranges/passive, artwork decoding, no scroll or hidden overflow, Escape/focus return, nested confirmation return and zero save mutation. Screenshots visually reviewed. Missing old images in the sparse checkout are aborted only by the harness; guide equipment art is real. Final max-level copy was checked after the wording correction.

Previous commit's GitHub Vercel status became success during this update. Protected-preview application access remains unverified; new commit deployment status must be checked separately after publication.
