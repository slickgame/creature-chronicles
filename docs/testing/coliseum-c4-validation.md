# Coliseum C4 Local Validation Checklist

C4 is implemented but remains unverified until this checklist is completed locally.

## Starting commands

```powershell
git pull origin master
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm test
npm run build
npm run dev
```

## Automated coverage

Confirm `npm test` includes and passes:

```text
tests/coliseum-c4.test.ts
```

The suite should verify:

- nine structured modifiers
- deterministic Daily and weekly rotations
- three three-stage Gauntlets
- permanent-circuit access requirements
- battle-stat and opening-status modifiers
- Restricted Aid detection
- partial recovery and fainted-creature return
- one-time Daily rewards
- one-time weekly Boss rewards
- C3 Marks credit
- duplicate result prevention
- persistent ordinary creature XP
- Gauntlet stage persistence
- locked Gauntlet roster
- full reward only after stage three
- run abandonment
- malformed-state recovery

## Save initialization and recovery

1. Load a save with C2 and C3 progress but no C4 state.
2. Enter the Coliseum.
3. Confirm the C4 hub opens without changing Gold, GP, creatures, habitats, C2 clears, or C3 purchases.
4. Confirm `coliseumC4StateV1` is created only after a C4 result or run-state change.
5. Save and reload.
6. Confirm C4 records and claim keys persist.
7. Replace `coliseumC4StateV1` with malformed JSON.
8. Confirm the C4 hub opens with an empty normalized state.
9. Confirm C2 and C3 state remain intact.
10. Confirm entering C4 synchronizes any unprocessed C2 result history into C3 Marks exactly once.

## Daily Challenge

1. Open the Daily Challenge on a known Ranch Day.
2. Record the encounter, modifiers, levels, AI, and reward.
3. Leave and reopen the Coliseum.
4. Confirm the same Daily Challenge appears.
5. Reload the save.
6. Confirm the same challenge still appears.
7. Complete the challenge.
8. Confirm the full Daily Marks and Materials reward.
9. Confirm all three participants receive ordinary creature XP.
10. Complete a practice rematch on the same Ranch Day.
11. Confirm the rematch grants XP and records but no second Daily reward.
12. Advance the Ranch Day.
13. Confirm the claim key changes and a new deterministic Daily Challenge appears.

## Modifier behavior

Verify every modifier in battle:

### Quickened Field

- all combatants receive exactly +4 Speed
- action order reflects the changed Speed

### Deep Reserves

- all combatants receive +12 maximum Battle Energy
- all combatants begin with the additional current Battle Energy

### Fragile Ground

- maximum HP is reduced by 15%
- existing HP ratio is preserved

### Bulwark Opening

- all living enemies begin Guarded for two rounds

### Marked Opening

- every combatant begins Marked for two rounds

### Exhausting Heat

- every ranch creature begins Exhausted for two rounds

### Restricted Aid

- Field Tonic is disabled
- Revival Salve is disabled
- Team Tactics Kit remains usable before battle

### Focused Opposition

- enemies receive +6 Accuracy
- enemies receive +6 Status Power

### Rallying Start

- every ranch creature begins Inspired for two rounds

Confirm statuses tick and expire through the existing Battle M2 timing rules.

## Gauntlets

For each route:

1. Confirm the correct three authored encounters are shown.
2. Confirm its access requirement.
3. Select exactly three available creatures for stage one.
4. Win stage one.
5. Confirm the run stores:
   - challenge key
   - stage index 1
   - exact three creature IDs
   - HP ratios
   - Battle Energy ratios
   - cumulative rounds
   - start day
6. Leave the Coliseum and reload the save.
7. Confirm the active run remains visible.
8. Continue stage two.
9. Confirm no roster substitution is available.
10. Verify living creatures recover 30% maximum HP and 25% maximum Battle Energy.
11. Verify a creature fainted in the prior stage returns at 15% maximum HP.
12. Confirm statuses and cooldowns clear between stages.
13. Win stage two and confirm stage three persists.
14. Win stage three.
15. Confirm the active run clears.
16. Confirm the full Marks, Materials, and optional item reward is granted only after stage three.
17. Clear the same route again during the same Ranch Week.
18. Confirm the repeat payout is reduced to approximately 35% Marks plus one Material.
19. Start another route and lose stage two.
20. Confirm the run ends without the route reward.
21. Start another route, then abandon it.
22. Confirm completed-stage XP remains but no route reward is granted.

## Locked-team and stage-order protection

Use Dev Tools or direct test fixtures to attempt:

- processing stage two without stage one
- processing stage three while stage two is waiting
- replacing one locked creature between stages
- starting a different C4 mode while a Gauntlet is active
- recording a result with fewer than three unique creatures

Confirm every invalid result is rejected without XP, Marks, Materials, items, score, or history.

## Weekly Boss Trial

1. Open the Boss Trial during a known Ranch Week.
2. Record the boss name, source formation, modifiers, level bonus, and reward.
3. Reload and confirm the same boss remains.
4. Win the Boss Trial.
5. Confirm the full weekly reward and XP.
6. Win a practice rematch.
7. Confirm XP and records continue but Marks, Materials, and item reward do not repeat.
8. Advance seven Ranch Days.
9. Confirm a new weekly claim key and deterministic boss rotation.
10. Confirm previous weekly records remain visible.

## Combat and Outfitter integration

1. Assign separate Offense, Defense, and Utility equipment.
2. Enter each C4 mode.
3. Confirm all player equipment bonuses apply.
4. Confirm authored enemy equipment remains enemy-only.
5. Arm a Team Tactics Kit and confirm it is consumed only when the stage starts.
6. Use a Field Tonic when aid is allowed.
7. Confirm it is limited to one use per stage.
8. Use a Revival Salve when aid is allowed.
9. Confirm it can resume a defeated battle before recording.
10. Confirm leaving without recording does not create C4 XP, records, score, or rewards.
11. Recheck target-first selection, move compatibility, queue editing, hidden AI planning, cooldowns, statuses, and round resolution.

## Combat XP and records

1. Record a victory with damage, healing, statuses, protection, and knockouts distributed among the team.
2. Confirm all three participants receive XP.
3. Confirm performance changes the capped contribution bonus.
4. Confirm fainted participants still receive XP.
5. Confirm overleveled creatures receive reduced XP.
6. Force a level-up.
7. Confirm the existing deterministic stat-growth system runs.
8. Confirm Talent growth biases remain active.
9. Confirm maximum Ranch Energy recalculates.
10. Confirm C4 creature records update:
    - battles
    - wins, losses, and draws
    - C4 Combat XP
    - Daily wins
    - Gauntlet clears
    - Boss clears
    - best score

## Weekly personal scoreboard

1. Complete a Daily Challenge.
2. Confirm the current Ranch Week receives a score entry.
3. Complete a Gauntlet with fewer rounds.
4. Confirm the higher score replaces the prior weekly best.
5. Confirm clear count increases only for completed challenges.
6. Confirm intermediate Gauntlet stages do not create a final score.
7. Confirm the board identifies the best mode and challenge.
8. Advance to the next Ranch Week.
9. Confirm the old weekly score remains and a new weekly entry begins.
10. Confirm this board is presented as save-local, not online.

## Responsive UI

Check desktop, tablet, and phone widths.

Confirm:

- the C4 toolbar wraps without covering controls
- challenge cards expand to fit descriptions and modifiers
- no text clips in summary cards
- the active-run panel remains readable
- enemy preview cards contain their content
- creature portraits remain contained
- battle controls remain reachable without overlapping the Town or Outfitter buttons
- the C3 permanent circuit and Exchange can be opened and closed cleanly
- the Town C4 quick-access badge does not cover critical Town controls
- record and history rows stack correctly at narrow widths

## Regression risks

Recheck:

- C2 encounter unlock order
- C2 authored teams and AI
- C2 Combat XP and records
- C3 result synchronization
- C3 Marks balance and Exchange purchases
- C3 three-slot equipment
- C3 technique manuals
- C3 Recruitment Hold
- Battle M6 consumable stock and use limits
- persistent move loadouts
- status duration and cooldown timing
- save import and export
- Ranch Day advancement
- habitat capacity normalization

Do not mark C4 verified until automated tests, production build, save recovery, reward idempotency, responsive UI, and live gameplay checks all pass.
