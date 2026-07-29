# Deferred Validation — Sections 6, 7, 8, 9, 10, and 11A

## Status

- Section 6 — Economy and Energy Balance Lab: **implemented but not yet tested by the project owner**.
- Section 7 — Inventory and Breeding Item Expansion: **implemented but not yet tested by the project owner**.
- Section 8 — Save-System Reliability and Versioning: **implemented; build and gameplay validation pending**.
- Section 9 — Automated Testing and Asset Validation: **implemented; the automated suite and local asset folders have not yet been run by the project owner**.
- Section 10 — Ranch Day Loop: **implemented; build, migration, lifecycle, and UI validation pending**.
- Section 11A — Unified Creature Capability and Talent Audit: **implemented as the structured talent foundation; build, migration, exact-effect, audit-UI, chore, recovery, battle-stat, and role-tag validation pending**.

The project owner explicitly deferred validation until the next patches are complete. Do not mark Sections 6, 7, 8, 9, 10, or 11A fully verified until this checklist has been completed against a pulled local build and the owner's current local image folders.

## Section 6 — Balance Lab

1. Run `npm run build`.
2. Run `npm run simulate:breeding-economy -- --runs=1000 --days=30`.
3. Repeat the command with the same seed and confirm identical results.
4. Run 100, 1,000, and 10,000 samples in Dev Tools → Balance Lab.
5. Start a 10,000-sample Ranch Timeline and confirm Cancel stops it without freezing the UI.
6. Record Gold, Energy, current day, pregnancies, creature stats, inventory counts, and Breeding Ledger totals before a simulation; confirm none change afterward.
7. Compare Current Save Snapshot results with the same pair's live Breeding Pen chance and Energy cost.
8. Test no-items, Energy Snack, and Fertility Tonic policies.
9. Confirm A/B reports for abilities and pair familiarity use the same deterministic seed.
10. Review warning thresholds for false positives before changing live balance values.

## Section 7 — Inventory and Breeding Items

1. Purchase every new item from the Supply Depot and confirm Gold and owned counts update once.
2. Save and reload; confirm owned counts, armed effects, and item-use history persist.
3. Use Energy Snack and Hearty Energy Meal on the player and a creature; confirm exact restoration and maximum caps.
4. Use Affection Treat and confirm exactly +8 Affection, capped at 100.
5. Use Recovery Balm with missing Hearts, an active injury, and both conditions together.
6. Use Gestation Tonic and confirm exactly one pregnancy day is removed, never reducing the timer below 1 day.
7. Arm Fertility Tonic from Inventory and from the Breeding Pen. Confirm +12% appears in the chance breakdown.
8. Complete a failed eligible attempt and confirm Fertility Tonic is consumed.
9. Attempt a session with an already-pregnant receiver and confirm the armed Fertility Tonic remains armed.
10. Arm Trait Stabilizer and Mutation Catalyst. Confirm rare-item confirmation appears before stock is consumed.
11. Complete failed attempts and confirm Trait Stabilizer and Mutation Catalyst remain armed.
12. Complete a successful conception and confirm both effects clear, genetics notes describe their checks, and level-1 stat ceilings still apply.
13. Confirm item action controls remain clickable inside Inventory cards.
14. Confirm owned counts and armed labels update immediately in Inventory and the Breeding Pen.
15. Confirm Item History records Ranch Day, local timestamp, source menu, target, and exact effect.
16. Confirm no item use creates an extra Breeding Ledger attempt or changes unrelated creatures.

## Section 8 — Save Reliability and Versioning

1. Load every existing save slot and confirm each opens with schema version 4 without losing creatures, pregnancies, eggs, attempts, birth history, inventory, or Ranch Day state.
2. Confirm a pre-migration backup is created the first time an older schema or build is loaded.
3. Create a manual backup in Dev Tools → Save Reliability and confirm it appears with a timestamp and reason.
4. Export a versioned save package, inspect it, and confirm it contains schema version, export timestamp, checksum, and save payload.
5. Import the exported package into the active slot and confirm the previous state is backed up before replacement.
6. Import older raw save JSON and confirm it is accepted as a legacy format, migrated, validated, and deduplicated.
7. Corrupt or remove nonessential fields in a copied save JSON and confirm the importer reports repairs rather than crashing.
8. Attempt to import malformed JSON, a bad checksum, and a future unsupported schema; confirm all are rejected without changing the active save.
9. Rapidly click Attempt Breeding and confirm exactly one attempt, pregnancy outcome, resource charge, and ledger record are saved.
10. Begin a breeding attempt, simulate an interrupted transaction using DevTools/localStorage, reload, and confirm the stale journal clears without applying an uncommitted outcome.
11. Duplicate one attempt, pregnancy, egg, or birth record in exported JSON, reimport it, and confirm duplicate-outcome prevention removes the duplicate and records the prevention count.
12. Test every individual reset and confirm only the named system changes. Verify the automatic safety backup exists before the reset.
13. Restore a backup and confirm the current save is backed up before restoration.
14. Delete one save slot and confirm its active-save pointer, backups, and interrupted transaction journal are removed.
15. Save after a normal breeding attempt and confirm Last Autosave Reason shows `breeding-attempt`.
16. End a Ranch Day and confirm Last Autosave Reason shows `day-end` and the transaction journal clears after persistence.

## Section 9 — Automated Tests and Asset Validation

1. Run `npm run validate:breeding-assets` against the owner's complete local scene folders.
2. Confirm the validator reports checked folders, images, receiver pools, exact pair pools, outcome pools, warnings, and errors.
3. Temporarily add an empty leaf scene folder and confirm validation fails.
4. Temporarily add an unsupported file, corrupt image header, invalid family folder, and duplicate case-insensitive filename; confirm each is reported.
5. Temporarily delete a manifest-referenced image without regenerating the manifest and confirm the deleted entry is reported.
6. Temporarily remove one creature family's pregnant or not-pregnant outcome pool and confirm validation fails.
7. Add a player pregnancy outcome folder and confirm validation fails.
8. Run `npm run test:regression` and confirm breeding, inventory, persistence, Ranch Day, and Talent tests all pass.
9. Run `npm test` and confirm asset preparation, validation, and regression tests complete together.
10. Run `npm run build` and confirm prebuild validation stops the build when an asset error exists.
11. Push a test branch or commit and confirm GitHub Actions runs `npm test` before `npm run build`.
12. Confirm player-receiver sessions always show 0% pregnancy chance, produce failure/not-pregnant outcomes, never create pregnancy records, and do not consume an armed Fertility Tonic.

## Section 10 — Ranch Day Loop

1. Load an existing schema-3 save and confirm it migrates to schema 4 with the current day in Active Day phase.
2. Create a new save and confirm Ranch Day 1 begins with the Morning Brief.
3. Confirm Begin Ranch Day changes the phase to Active Day without advancing the calendar.
4. Confirm exactly three unique, achievable goals are generated for the current save.
5. Complete goals through breeding, purchases, item use, care, chores, contracts, hatching, production, or repair; confirm each reward is granted once.
6. Complete all three goals and confirm the 50 Gold + 1 Feed completion bonus is granted once.
7. Confirm the activity log records major actions without duplicating Breeding Ledger, Item History, or Birth History records.
8. Resolve the same deterministic Ranch Day event on a copied save and confirm the same choice produces the same outcome.
9. Confirm reloading does not reroll or resolve the event again.
10. Review Creature Moods for injured, expecting, hungry, tired, overworked, thriving, content, and restless conditions.
11. Open Evening Review and confirm goals, activities, Gold change, Feed projection, Nursery counts, and warnings match the save.
12. Click the Ranch House Sleep action and confirm it opens Evening Review rather than bypassing it.
13. End the day and confirm jobs, Feed consumption, recovery, danger, ranch wear, Nursery timers, training returns, taxes, Market/Guild refreshes, and summaries process once.
14. Confirm pregnancy and egg timers decrease exactly once.
15. Confirm the next day begins in Morning Brief phase with resource flow, highlights, warnings, moods, goals, event, and suggested next step.
16. Attempt to end the same completed day again and confirm no duplicate day, goal reward, job reward, Feed consumption, tax, pregnancy progress, or event is produced.
17. Simulate an interrupted `day-end` transaction and confirm reload returns either the prior Active Day or the fully committed next Morning, never a partial result.
18. Confirm there is no hard action-point cap, hourly clock, automatic daily Gold rent, automatic production sale, automatic mood drift, or automatic day advancement.

## Section 11A — Unified Creature Capability and Talent Audit

1. Load every existing save and confirm each saved `abilities` entry remains present, keeps its id and grade, and gains the correct Talent category, tags, definition version, and exact grade text without changing ownership or lineage.
2. Open Dev Tools → Talent Audit and confirm Overview counts match the current save.
3. Review Definitions and confirm every general, species, variant, starter, and low-grade talent has a recognized central definition.
4. Confirm every definition exposes exact F, D, C, B, A, and S descriptions and at least one structured effect per grade.
5. Confirm the audit distinguishes Implemented, Partial, Description Only, and Unknown Definition states accurately.
6. Confirm the Grade Preview shows the same effect values used by the structured engine.
7. Compare representative live Breeding Pen previews before and after migration: Quick Learner, Feline Grace, Steady Nerves, and Guard Instinct must preserve pregnancy, XP, Energy, breeder-XP, and growth-bias behavior.
8. Assign creatures with relevant structured talents to Security, Comfort, Production, Garden, and Hauling chores; confirm exact score and Energy modifiers appear once in the result message.
9. End a Ranch Day and confirm recovery talents affect Energy or Affection once without exceeding normal caps.
10. Open Battle Debug with and without combat-tagged talents and confirm calculated HP, Power, Defense, Speed, Accuracy, Evasion, Status Power, or Status Resistance changes exactly once.
11. Review Owned Creatures in Talent Audit and confirm derived role tags are deterministic and include an explanation tooltip.
12. Confirm unknown or manually edited talent ids are reported rather than silently receiving guessed effects.
13. Run `npm run test:regression` twice and confirm all Talent tests are deterministic.
14. Confirm inheritance-related Talent definitions remain labeled Partial until their final genetics-roll hook is connected in the dedicated genetics follow-up patch.
15. Confirm Section 11A does not add chore-skill levels, remove species job restrictions, add Coliseum progression, or alter the six-move combat-loadout plan; those belong to subsequent sections.

## Final combined smoke test

Run `npm test`, then complete this sequence without reloading: create manual backup → begin Morning Brief → run a Balance Lab simulation → open Talent Audit → review one F–S talent curve → purchase items → use a care item → arm breeding support → attempt breeding → create pregnancy → shorten pregnancy → assign a talent-bearing creature to chores → review goals and activities → resolve the Ranch Day event → open Evening Review → end day → confirm Morning Brief → open Battle Debug and compare a talent-bearing creature → export save package → save → reload. Confirm every count, effect, record, pregnancy, attempt, schema value, Ranch Day state, event, goal reward, talent instance, audit warning, and backup remains consistent, and confirm the Balance Lab did not mutate the save.
