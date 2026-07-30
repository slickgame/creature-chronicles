# Coliseum C1 — Local Validation Checklist

Coliseum C1 is implemented but remains unverified until this checklist is completed on the project owner's machine.

## Starting Commands

```powershell
git pull origin master
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm test
npm run build
npm run dev
```

Record the first failing command and complete error text before changing code.

## Automated Regression

Confirm `npm test` includes and passes:

```text
tests/coliseum-progression.test.ts
```

Verify the new tests cover:

- Fresh-save Novice access
- Bronze prerequisite lock
- Ordered unlock progression
- First-clear Gold reward
- First-clear Guild Point reward
- First-clear item stock
- Repeat reward reduction
- No duplicate first-clear item
- Best winning round improvement
- Loss records without rewards
- Malformed JSON recovery
- Enemy ID isolation
- Enemy level offsets

## Production Build

Run:

```powershell
npm run build
```

Confirm:

- No TypeScript errors
- No CSS module errors
- No missing imports
- No invalid dynamic class access
- No server/client component boundary errors
- No missing image failures that stop compilation

## Fresh-Save Hub

Create a new save and enter Town → Coliseum.

Confirm:

- The dedicated PvE Progression hub opens.
- Current standing reads Novice Division.
- Record reads 0W · 0L · 0D.
- First clears read 0/4.
- Novice is open.
- Bronze, Silver, and Crown are locked.
- Locked cards explain the missing prerequisite.
- First-clear and repeat rewards match the design document.
- Eligible Team Pool shows the correct available creature count.
- The town Coliseum badge shows Novice and 0W.

## Team Entry

Open Novice Echo Trial.

Confirm:

- Exactly three creatures are required.
- Training Grounds creatures are disabled.
- Injured creatures are disabled.
- Readiness labels reflect current Battle Outfitter assignments.
- AI difficulty is fixed to Basic.
- Enemy level offset displays −2.
- A Team Tactics Kit can be armed only when stock is available.
- Returning before battle start creates no record and consumes no item.

## Combat Integration

Start a Novice match.

Confirm:

- Player equipment modifies only player combatants.
- Enemy Echoes do not copy player equipment.
- Player equipped move loadouts are used.
- Enemy Echo IDs do not collide with ranch creature IDs.
- Enemy levels use the encounter offset.
- Target-first move selection still works.
- One action is required for every living player creature.
- Basic AI resolves after player actions are queued.
- Battle logs show equipment, AI decisions, moves, damage, healing, status, cooldown, and Battle Energy behavior.

## Support Items

During a match, validate:

### Team Tactics Kit

- Stock decreases exactly once at battle start.
- All living ranch creatures begin Inspired.
- Current and maximum Battle Energy increase by 10.
- Cancelling before battle start does not consume it.

### Field Tonic

- Requires a living ranch target.
- Restores 30% maximum HP.
- Restores 20% maximum Battle Energy.
- Does not exceed caps.
- Cannot target a fainted creature.
- Cannot be wasted on a fully restored creature.
- Stock decreases exactly once after a valid use.
- A second use in the same match is blocked.

### Revival Salve

- Requires a fainted ranch target.
- Revives at 35% HP.
- Restores 10% Battle Energy.
- Clears active statuses.
- Can resume a completed defeat before result recording.
- Stock decreases exactly once after a valid use.
- A second use in the same match is blocked.

## First Victory

Win Novice and record the result.

Confirm:

- Result message identifies Victory.
- Round count is correct.
- 180 Gold is awarded.
- 6 Guild Points are awarded.
- One Field Tonic is added.
- Novice shows CLEARED.
- Bronze unlocks.
- Total record becomes 1W · 0L · 0D.
- Novice record becomes 1W · 0L · 0D.
- Best round count appears.
- Recent history contains one first-clear entry.
- Town Coliseum badge updates.

## Repeat Victory

Win Novice again.

Confirm:

- Only 45 Gold is awarded.
- Only 1 Guild Point is awarded.
- No second first-clear Field Tonic is awarded.
- Wins and attempts increment.
- A faster win updates Best rounds.
- A slower win does not replace the existing best.
- Recent history distinguishes repeat reward from first clear.

## Defeat and Draw

Record a defeat.

Confirm:

- No Gold is awarded.
- No Guild Points are awarded.
- No item is awarded.
- Loss count increments.
- Attempt count increments.
- The encounter remains uncleared on a fresh test save.
- Recent history labels No reward.

Create or use a debug path to record a draw if practical.

Confirm draw count increments without rewards.

## Ordered Progression

Clear each encounter in sequence.

Confirm:

1. Novice unlocks Bronze.
2. Bronze unlocks Silver.
3. Silver unlocks Crown.
4. Crown remains repeatable after first clear.
5. First-clear rewards match the design document.
6. Repeat rewards remain smaller.
7. AI difficulties remain Basic, Tactical, Tactical, Champion.
8. Level offsets remain −2, 0, +2, +4.

## Save and Reload

After several wins and losses:

1. Return to Main Menu.
2. Reload the same save.
3. Re-enter the Coliseum.

Confirm persistence of:

- Completed encounters
- Claimed first-clear rewards
- Total record
- Per-encounter record
- Best rounds
- Last outcome
- Last completed Ranch Day
- Recent history
- Gold and Guild Point rewards
- Outfitter item rewards

## Malformed-State Recovery

Use Dev Tools or local storage inspection to replace `coliseumProgressV1` with malformed JSON.

Reload the save and enter the Coliseum.

Confirm:

- The game does not crash.
- The Coliseum safely returns to empty Novice progression.
- Other save systems remain intact.

## History Cap

Create more than 25 recorded results through tests or Dev Tools.

Confirm:

- Only the latest 25 history entries remain.
- Aggregate wins, losses, draws, and attempts continue increasing.
- Per-encounter records remain correct.

## Responsive UI

Check desktop and a narrow mobile viewport.

Confirm:

- Header actions wrap without clipping.
- Summary cards remain readable.
- Division cards stack cleanly.
- Reward text remains inside its containers.
- History rows stack on mobile.
- Creature cards remain selectable.
- Battle command panels remain usable.
- No important button is pushed off-screen without an accessible scroll path.

## Completion Rule

Do not mark Coliseum C1 verified until:

- `npm test` passes
- `npm run build` passes
- Fresh-save unlock behavior passes
- First-clear and repeat rewards pass
- Save/reload persistence passes
- Support-item integration passes
- At least one full progression sequence is completed
- Desktop and mobile UI checks pass
