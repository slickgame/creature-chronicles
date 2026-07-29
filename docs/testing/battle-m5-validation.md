# Battle M5 — Deferred Validation

## Status

Battle M5 is implemented but has not yet received the project owner's local automated, build, migration, UI, or gameplay validation pass.

Do not mark this milestone fully verified until the checklist below is completed against a pulled local build and the owner's current saves.

## Automated and Build Checks

1. Run `npm run test:regression` twice.
2. Confirm `tests/battle-move-inheritance.test.ts` runs in both passes.
3. Confirm identical parent data and seed produce identical candidates, rolls, notes, and starting loadout.
4. Run `npm test` and confirm asset validation plus all regression suites pass.
5. Run `npm run build`.
6. Run `npm run dev` and inspect the Breeding Pen, Nursery, Move Audit, and creature profile views.

## Schema and Migration

1. Load a schema-4 save and confirm it migrates to schema 5.
2. Confirm existing creatures, pregnancies, eggs, birth history, Talents, chore skills, and move loadouts are unchanged.
3. Export and reimport the migrated save; confirm schema 5 and move-lineage records persist.
4. Restore a pre-migration backup and confirm schema 4 remains recoverable.
5. Corrupt a copied inheritance record with deleted move IDs, incompatible moves, duplicate IDs, and an illegal loadout; confirm save-boundary normalization repairs it without deleting the pregnancy, egg, or birth record.
6. Attempt to import a future unsupported schema and confirm it is rejected.

## Breeding Pen Preview

1. Select two creatures with no extra compatible parent moves; confirm the panel explains that the hatchling still receives a native library.
2. Select a pair with one compatible learned parent move and confirm it appears with a visible chance.
3. Equip that move and confirm its chance is higher than when it is learned but unequipped.
4. Give both parents the same compatible move and confirm the both-parent bonus appears.
5. Increase pair familiarity and confirm only move-inheritance chance changes by the documented amount.
6. Upgrade Breeding Pen Comfort and confirm only move-inheritance chance changes by the documented amount.
7. Raise Affection and confirm the move-inheritance pair bonus respects its cap.
8. Confirm the preview never reveals the deterministic roll result before conception.
9. Select the player as either participant and confirm no offspring move-lineage candidates are shown.
10. Confirm player-receiver sessions remain 0% pregnancy outcomes and never create inheritance records.

## Direct Inheritance

1. Complete successful conceptions with equipped, unequipped, shared, rare, and signature parent moves.
2. Confirm only `inheritable` and child-compatible moves enter the pool.
3. Confirm child-native starting moves are not wasted as bonus inheritance slots.
4. Confirm no more than three direct bonus moves are stored.
5. Confirm every roll records chance, roll value, source parent, and reasons.
6. Change both parents' loadouts after conception and confirm the pregnancy result remains unchanged.
7. Repeat the same synthetic save and attempt seed in regression tools and confirm the same result.

## Combination Recipes

1. Test Focused Stare or Shadow Feint plus Chase or Flurry Dash and confirm Predator Pursuit becomes eligible for a compatible child.
2. Test Pack Howl or Rally plus a valid calming technique and confirm Guardian Chorus becomes eligible.
3. Test a nurturing healing move plus a steady/calming technique and confirm Restorative Rhythm becomes eligible.
4. Swap which parent supplies each symmetric recipe side and confirm eligibility remains valid.
5. Remove one contributing parent move and confirm the recipe disappears.
6. Confirm equipped contributing moves add exactly +5% each.
7. Confirm child species/family/tag compatibility can block a recipe.
8. Confirm no more than one combination move is stored per offspring.
9. Confirm a failed recipe does not grant its output move.
10. Confirm a successful recipe is inserted into the learned starting library before direct inherited moves.

## Pregnancy, Egg, and Hatch Persistence

1. Complete a successful conception and open the Nursery Move Lineage ledger.
2. Confirm the pregnancy shows direct moves, combination moves, parents, projected species, starting library, and notes.
3. End days until delivery and confirm the new egg contains the same immutable inheritance package.
4. Save and reload during pregnancy and again after delivery; confirm no reroll occurs.
5. Hatch the egg and confirm the creature's learned/equipped loadout exactly matches the stored projected loadout.
6. Confirm the hatchling has at most 8 learned and 4 equipped moves.
7. Confirm every equipped move is learned.
8. Confirm at least one equipped zero-cost, zero-cooldown fallback remains.
9. Confirm lineage notes mention inherited techniques and combination lineage where applicable.
10. Confirm Birth History stores inherited move IDs, combination move IDs, and the starting loadout.
11. Rename the hatchling and confirm the birth move record remains linked.
12. Save, reload, export, import, and backup-restore the hatchling; confirm the loadout and provenance persist.

## Regression Boundaries

1. Confirm pregnancy chance, Energy cost, Heart cost, pair streaks, XP, stat genetics, Talent inheritance, shiny chance, and lineage-risk calculations are unchanged.
2. Confirm Trait Stabilizer and Mutation Catalyst behavior remains unchanged.
3. Confirm failed conceptions create no move inheritance package.
4. Confirm already-pregnant receivers create no second pregnancy or move inheritance package.
5. Confirm a successful conception creates exactly one inheritance result.
6. Confirm delivery creates exactly one egg with that result.
7. Confirm hatching creates exactly one creature and one Birth History move record.
8. Confirm Battle M5 does not add loadout editing, manual consumption, equipment effects, Coliseum rewards, or PvP.

## Combined Smoke Test Addition

Add this sequence to the wider Sections 6–11B and Battle M1–M5 smoke test:

1. Give two parents the moves needed for one combination recipe.
2. Open the Breeding Pen Move Lineage preview.
3. Complete a successful conception.
4. Record the stored direct and combination results.
5. Change the parents' current loadouts.
6. End days through delivery and hatching.
7. Confirm the egg and hatchling retained the original conception-time result.
8. Enter a target-first 3v3 battle with the hatchling and confirm its inherited equipped moves are available and resolve through the normal round engine and AI.
