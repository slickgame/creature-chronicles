# Deferred Validation — Sections 6, 7, and 8

## Status

- Section 6 — Economy and Energy Balance Lab: **implemented but not yet tested by the project owner**.
- Section 7 — Inventory and Breeding Item Expansion: **implemented but not yet tested by the project owner**.
- Section 8 — Save-System Reliability and Versioning: **implemented; build and gameplay validation pending**.

The project owner explicitly deferred Sections 6 and 7 until the next patches are complete. Do not mark Sections 6, 7, or 8 fully verified until this checklist has been completed against a pulled local build.

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

1. Load every existing save slot and confirm each opens with schema version 3 without losing creatures, pregnancies, eggs, attempts, birth history, or inventory.
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

## Final combined smoke test

Complete this sequence without reloading: create manual backup → run a Balance Lab simulation → purchase items → use a care item → arm breeding support → attempt breeding → create pregnancy → shorten pregnancy → export save package → save → reload. Confirm every count, effect, record, pregnancy, attempt, schema value, and backup remains consistent, and confirm the Balance Lab did not mutate the save.
