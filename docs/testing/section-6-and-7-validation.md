# Deferred Validation — Sections 6 and 7

## Status

- Section 6 — Economy and Energy Balance Lab: **implemented but not yet tested by the project owner**.
- Section 7 — Inventory and Breeding Item Expansion: **implemented; build and gameplay validation pending**.

Do not mark either section fully verified until this checklist has been completed against a pulled local build.

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

## Final smoke test

Complete this sequence without reloading: purchase items → use a care item → arm breeding support → attempt breeding → create pregnancy → shorten pregnancy → save → reload. Confirm every count, effect, record, pregnancy, and breeding attempt remains consistent.
