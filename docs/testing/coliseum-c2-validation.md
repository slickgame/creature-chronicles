# Coliseum C2 — Deferred Validation Checklist

C2 is implemented but not yet locally verified. Run this checklist during the combined project validation pass.

## Starting Commands

```powershell
git pull origin master
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm test
npm run build
npm run dev
```

Do not describe C2 as fully verified until the automated, build, save, migration, UI, and gameplay checks below pass.

## 1. Automated Regression

Confirm `npm test` runs both:

- `tests/coliseum-progression.test.ts`
- `tests/coliseum-c2.test.ts`

Verify C2 coverage passes for:

- 12 encounter definitions
- 3 authored enemies per encounter
- Valid variant IDs
- Valid learned and equipped move IDs
- Fixed authored teams
- Usable battle fallback moves
- Enemy-only equipment
- Sequential prerequisites
- C1 migration
- First-clear rewards
- Deterministic repeat purses
- Duplicate-result protection
- XP on wins, draws, and losses
- Overlevel XP reduction
- Level and stat growth
- Performance records

## 2. Production Build

Run `npm run build` and verify there are no failures involving:

- `src/data/coliseumC2.ts`
- `src/features/coliseum/ColiseumC2Screen.tsx`
- C2 Talent types
- C2 move IDs
- dynamic battle CSS category classes
- Town C2 imports
- `GameRoot` routing

## 3. Fresh-Save Entry

Create a fresh save and visit Town → Coliseum.

Verify:

- The town header shows `0/12 Clears`.
- The map badge shows Novice and 0 wins.
- The C2 hub loads instead of the C1 screen.
- Opening Scrimmage is open.
- Support Drill and later encounters are locked.
- Exactly three authored enemies appear in the preview.
- Enemy names, levels, roles, equipment, and moves match the encounter card.

## 4. Team Selection

Verify:

- Exactly three available ranch creatures are required.
- Injured creatures remain unavailable.
- Training Grounds assignees remain unavailable.
- Roster cards display level, normal XP, readiness, wins, and Combat XP.
- Team Tactics Kit stock displays correctly.
- Entering without a kit consumes nothing.
- Arming a kit consumes one only after battle creation succeeds.

## 5. Authored Enemy Integrity

Inspect at least one encounter from every division.

Verify:

- Enemies are not mirrored copies of the selected ranch team.
- Names and variants remain fixed when the player changes teams.
- Levels remain fixed.
- Enemy equipment affects only enemy battle stats.
- Player Outfitter equipment remains active only on the player side.
- Every enemy always has a legal usable fallback action.
- AI never stalls because of an empty or invalid loadout.

Recommended encounters:

- Opening Scrimmage
- Bronze Division Champion
- Status Web
- Crown Tactical Finale

## 6. Progression Unlocks

Complete encounters in order.

Verify:

```text
Opening Scrimmage
→ Support Drill
→ Novice Division Champion
→ Breaker Squad
→ Medic Line
→ Bronze Division Champion
→ Status Web
→ Endurance Cell
→ Silver Division Champion
→ Crown Opening Assault
→ Crown Control Matrix
→ Crown Tactical Finale
```

Check that:

- A victory unlocks the next encounter.
- A defeat does not unlock it.
- A draw does not unlock it.
- Recommended level remains advisory.
- AI difficulty cannot be manually lowered.

## 7. First-Clear Rewards

Record a first victory in multiple divisions.

Verify:

- Exact Gold is added once.
- Exact Guild Points are added once.
- Materials enter `ranchMaterialsStock` once.
- Outfitter items enter their existing stock flags once.
- The first-clear label changes to a repeat entry label.
- Repeating the match does not duplicate the fixed first-clear item.

## 8. Repeat Reward Pools

Repeat an already-cleared encounter.

Verify:

- One of the declared weighted purse entries is selected.
- The reward remains stable for a recorded result.
- Reloading cannot reroll an already-recorded result.
- Standard, Material, and Outfitter purse variants display correctly.
- No reward exceeds the declared pool.

## 9. Combat XP

Record one victory, one draw, and one defeat.

Verify all three selected creatures gain XP.

Expected ordering for otherwise identical participants:

```text
Victory XP > Draw XP > Defeat XP > 0
```

Also verify:

- Fainted creatures gain participation XP.
- Creatures not selected gain no XP.
- First clears gain the 20% bonus.
- Performance bonuses are capped.
- A highly overleveled creature gains less XP from an early encounter.

## 10. Level Growth

Use a creature close to its next level.

Verify:

- Combat XP can cross the level threshold.
- Multiple levels are handled if sufficient XP is granted.
- Leftover XP carries forward.
- `xpToNext` updates to the new level threshold.
- Shared deterministic stat growth is applied.
- Growth Talent biases remain active.
- Maximum Ranch Energy recalculates.
- Current Ranch Energy does not exceed the new maximum.

## 11. Creature Battle Records

After several matches, verify each participant's record updates:

- Battles
- Wins
- Losses
- Draws
- Total Combat XP
- Damage dealt
- Healing performed
- Statuses applied
- Allies protected
- Knockouts
- Misses
- Highest division order
- Last encounter
- Last outcome
- Last battle day

Verify non-participants remain unchanged.

## 12. Performance Telemetry

During a match, deliberately use:

- A damaging move
- A healing move
- A status move
- Guard or Taunt
- A move that misses
- A knockout attack

After recording, check the expected creature totals increase.

Known C2 limitation:

- Bleed damage at round end is not attributed to the original source creature.

## 13. Result Idempotency

At the result screen:

- Rapidly click the record button.
- Attempt to navigate and return.
- Reload after recording.

Verify one result grants exactly:

- One attempt
- One purse
- One XP award per participant
- One creature-record update
- One history entry

The button should disable after the first click, and the stored result ID should prevent a duplicate write.

## 14. Forfeit and Exit Behavior

Verify:

- `Forfeit & Record Loss` creates one loss and reduced XP.
- `Leave Without Record` creates no attempt, reward, XP, or battle record.
- A Team Tactics Kit already consumed at battle start remains consumed after leaving.
- A Field Tonic or Revival Salve already used remains consumed after leaving.

## 15. Revival Flow

Lose a match with Revival Salve stock available.

Verify:

- The result screen allows selection of a fainted ally.
- Revival resumes the same match.
- Recording is not performed before the resumed fight ends or the player forfeits.
- The final result produces only one history entry.

## 16. C1 Migration

Use a save with C1 progression and no `coliseumProgressV2` flag.

Verify:

- C1 totals migrate.
- C1 champion encounter records migrate.
- Cleared C1 divisions remain accessible.
- Newly inserted preliminary encounters in those cleared divisions appear completed.
- Their first-clear rewards are marked claimed.
- No retroactive reward is granted.
- The first recorded C2 match writes `coliseumProgressV2`.

Also test malformed V2 JSON:

- The game should fall back to C1 migration or empty normalized progression.
- The screen should not crash.

## 17. Save and Reload

After recording matches and gaining levels:

- Return to town.
- Return to ranch.
- Reload the save.
- Restart the development server if needed.

Verify persistence of:

- Encounter clears
- First-clear claims
- W/L/D records
- History
- Creature Combat XP records
- Creature levels and XP
- Stat growth
- Gold, GP, Materials, and item rewards

## 18. Responsive UI

Check desktop and narrow layouts.

Verify:

- All 12 encounter cards remain readable.
- Long opponent names do not clip.
- Reward text wraps.
- Enemy preview cards remain contained.
- Move names and equipment names remain visible.
- History and creature-record rows do not overflow.
- Battle cards preserve contained artwork.
- Buttons remain reachable without horizontal page overflow.

## 19. Balance Notes to Record

During the pass, record:

- Average rounds per encounter
- W/L rates by division
- Whether authored healers create excessive stalls
- Whether Crown equipment bonuses are too strong
- Whether first-clear XP causes abrupt level jumps
- Whether repeat XP encourages unhealthy early-encounter farming
- Whether Gold/GP/Materials payouts fit the Section 6 economy model

Do not rebalance from one isolated match. Use several teams and role combinations.
