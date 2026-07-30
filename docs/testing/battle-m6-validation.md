# Battle M6 — Deferred Validation Checklist

Battle M6 is implemented but has not received the project owner’s local automated, build, UI, save, or gameplay verification.

## Automated and Build Checks

```powershell
git pull origin master
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm test
npm run build
npm run dev
```

Confirm the Battle Outfitter integration and move-training test suites run with the standard regression command.

## Equipment

1. Purchase Sparring Wraps and Guard Charm.
2. Assign both to one creature.
3. Start an exhibition with that creature.
4. Confirm the battle log identifies the assigned equipment.
5. Confirm the creature receives the documented stat increases.
6. Confirm an enemy Echo does not copy those equipment bonuses.
7. Leave battle and confirm equipment remains assigned.
8. Remove equipment and confirm it returns to owned stock.

## Focus Training

1. Purchase at least two Focus Manuals.
2. Raise one creature’s Focus Training rank.
3. Confirm the displayed rank persists after save and reload.
4. Enter battle and confirm Accuracy, Status Power, and maximum Battle Energy rise by 2 per rank.
5. Confirm rank cannot exceed 3.

## Move Training

1. Open Battle Outfitter → Move Training.
2. Select several creatures and confirm each shows its own learned and equipped moves.
3. Teach a compatible standard technique with one Focus Manual.
4. Confirm exactly one manual is consumed.
5. Confirm the move persists after save and reload.
6. Equip the new move and confirm it appears in the target-first battle UI.
7. Fill the four equipped slots and replace one move.
8. Confirm the replaced move remains learned but is no longer equipped.
9. Attempt to unequip the final zero-cost, zero-cooldown move and confirm the action is blocked.
10. Confirm combination, event, story, Coliseum, Talent, and signature-only techniques cannot be taught by a standard manual.
11. Confirm no creature exceeds 8 learned or 4 equipped moves.

## Team Tactics Kit

1. Purchase a Team Tactics Kit.
2. Arm it during team selection.
3. Enter battle and confirm exactly one kit is consumed.
4. Confirm all three ranch creatures start Inspired for one round.
5. Confirm current and maximum Battle Energy each increase by 10.
6. Confirm the enemy team receives no kit effect.
7. Confirm a second kit cannot be used during the same exhibition.
8. Reload and confirm consumed stock remains consumed.

## Field Tonic

1. Purchase a Field Tonic.
2. Damage a living ranch creature and spend some Battle Energy.
3. Select that creature and use the tonic.
4. Confirm 30% maximum HP and 20% maximum Battle Energy are restored, capped at maximum values.
5. Confirm exactly one tonic is consumed.
6. Confirm a tonic cannot target an enemy, revive a fainted creature, or be wasted on a fully restored creature.
7. Confirm a second tonic cannot be used during the same exhibition.

## Revival Salve

1. Purchase a Revival Salve.
2. Allow one ranch creature to faint.
3. Select the fainted card and use the salve.
4. Confirm the creature returns at 35% HP and 10% Battle Energy.
5. Confirm statuses are cleared.
6. Confirm exactly one salve is consumed.
7. Confirm a living creature and an enemy cannot be targeted.
8. Allow the full team to lose, then revive one creature from the result screen.
9. Confirm the exhibition returns to an ongoing battle state.
10. Confirm a second salve cannot be used during the same exhibition.

## Save Reliability

1. Confirm invalid item targets never consume stock.
2. Confirm every successful item use saves immediately.
3. Confirm move-library edits persist through save reload.
4. Confirm equipment and manual ranks survive migration and reload.
5. Export and re-import the save, then recheck stock, assignments, training ranks, and move loadouts.

## UI and Accessibility

1. Confirm the Move Training overlay fits the current desktop resolution.
2. Confirm long move descriptions wrap without clipping.
3. Confirm the creature list and move catalog scroll internally.
4. Confirm Escape closes the Move Training overlay.
5. Confirm clicking outside closes the overlay without changing data.
6. Confirm the support-item panel remains readable during battle.
7. Confirm fainted ranch cards clearly permit Revival selection.
8. Confirm dark-mode text remains readable throughout the Outfitter and battle screens.
