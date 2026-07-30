# Chapter 1R — Guided Onboarding Validation

This checklist validates the guided Chapter 1 redesign after automated tests and the production build complete successfully.

## Starting commands

```powershell
git fetch origin
git checkout agent/chapter-one-guided-onboarding
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm test
npm run build
npm run dev
```

## New-save walkthrough

1. Create a new save.
2. Complete the Chapter 1 introduction.
3. Confirm Veyra's guided tutorial appears after the intro.
4. Confirm the guide can collapse and reopen.
5. Confirm Help scrolls to or opens the expected system.
6. Confirm Skip asks for confirmation and removes the guided overlay without deleting Beginner Milestones.

## Day 1 — ranch loop

1. Confirm Morning Brief or Begin Ranch Day receives the spotlight.
2. Confirm unrelated clicks are blocked during the locked first step.
3. Open the Morning Brief and verify the tutorial advances.
4. Open Ranch Chores.
5. Confirm Security Patrol or its Best Fit action receives the spotlight.
6. Assign one valid guard.
7. Confirm the tutorial advances to a second, freely chosen chore.
8. Assign a second chore.
9. Review the day and end it.
10. Confirm assignments resolve only once.
11. Reload before and after ending the day and confirm the correct tutorial step returns.

## Day 2 — results and resources

1. Review the next Morning Brief.
2. Confirm starting Feed or Materials alone does not satisfy the lesson.
3. Produce Feed, gather Materials, or repair damage through a real ranch action.
4. Confirm the tutorial advances from the recorded result.

## Day 3 — Guild

1. Open the Guild Hall through the tutorial.
2. Confirm Request Board guidance appears.
3. Accept and complete one eligible beginner contract.
4. Confirm Guild completion does not make the rest of the tutorial disappear.
5. Confirm the tutorial advances to breeding.

## Day 4 — breeding and nursery

1. Open the Breeding Pen.
2. Confirm the breeding workspace is highlighted while participant selection remains usable.
3. Select two valid creature participants.
4. Inspect compatibility, Energy, Hearts, genetics, and move inheritance information.
5. Complete the first pairing.
6. Confirm the result is pregnancy even if the ordinary chance would have failed.
7. Confirm the pregnancy duration is one day.
8. Confirm normal Energy, Hearts, XP, affection, and breeding records changed.
9. Confirm the pregnancy contains genetics and battle move inheritance data.
10. Confirm later pairings use normal success rules.
11. End the day and confirm the egg is delivered.

## Quickhatch Catalyst

1. Confirm exactly one Epic Quickhatch Catalyst appears after the guided egg exists.
2. Confirm it is not listed for sale in the Supply Depot.
3. Open the tutorial inventory item panel.
4. Confirm the active egg can be selected as a target.
5. Confirm exact item effects are displayed.
6. Choose Consume and Hatch.
7. Confirm a second rare-item confirmation appears.
8. Cancel and verify the item remains.
9. Confirm use.
10. Verify the egg hatches immediately.
11. Verify genetics, abilities, lineage, inherited moves, and Egg Atelier hatch effects remain intact.
12. Verify stock becomes zero.
13. Verify an Item Use History record names the catalyst and targeted egg.
14. Attempt to use the item again and confirm it is rejected.
15. Repeat with a full destination habitat and confirm the hatch is rejected without consuming the item.

## Day 5 — combat handoff

1. Open Battle Outfitter through the tutorial.
2. Inspect the three-creature roster, equipped moves, roles, and equipment.
3. Enter the authored Coliseum circuit.
4. Confirm the normal Chapter 1 guide is replaced by the smaller first-battle coach.
5. Confirm Opening Scrimmage is highlighted.
6. Open its first-clear match.
7. Confirm the default three-creature team and enemy preview are visible.
8. Enter Opening Scrimmage.
9. Confirm the coach highlights an enemy Select Target action.
10. Select the enemy.
11. Confirm the coach highlights a compatible equipped move.
12. Choose the move.
13. Repeat target then move for the other two active creatures.
14. Confirm the enabled Confirm Round button is highlighted.
15. Resolve the first round.
16. Confirm the coach steps back once Round 2 begins.
17. Finish the match.
18. Confirm Record Result, XP & Purse is highlighted.
19. Record the result.
20. Confirm a recorded victory advances Chapter 1.
21. Confirm a recorded loss preserves its normal record and XP but does not complete the lesson.
22. Confirm returning after a loss highlights Opening Scrimmage again.

## Story and milestones

1. Confirm the Ranch Handbook shows the original sixteen Beginner Milestones.
2. Confirm their rewards and completion flags still function.
3. Leave several optional milestones incomplete.
4. Complete the guided chapter path.
5. Confirm the Chapter 1 ending appears despite incomplete optional milestones.
6. Confirm the Story Log explains guided completion requirements.
7. Confirm major milestone reactions appear without a full story interruption after every minor chore goal.

## Save compatibility

1. Load an old save with Chapter 1 already complete and confirm the tutorial does not restart.
2. Load a partially progressed old save and confirm the guide selects the nearest valid remaining lesson.
3. Reload during the pregnancy, egg, catalyst, Battle Outfitter, and first battle stages.
4. Confirm the catalyst is never granted more than once.
5. Confirm a save that naturally hatched its first egg cannot become stuck on the catalyst step.
6. Confirm an existing recorded Coliseum victory satisfies the first-battle objective.

## Expected automated coverage

`tests/chapter-one-guided-tutorial.test.ts` covers:

- guaranteed first guided pregnancy;
- one-day pregnancy duration;
- one-time catalyst grant;
- immediate hatch and item history;
- duplicate-use rejection;
- guided Chapter 1 completion while optional milestones remain incomplete.
