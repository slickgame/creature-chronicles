# Approved combat stat names and creature-only Evasion

User clarification on October 17, 2026 supersedes the unfinished proposal to add Evasion to gear.

- Resistance is displayed as Special Defense.
- Status Power is displayed as Effectiveness.
- Status Resist is displayed as Effect Resistance.
- Accuracy and Evasion retain their names.

Evasion already exists in BattleStats, creature battle profiles, numeric inspection and hit-chance calculations. It derives from DEX plus species/talent/battle effects. No additional Evasion equipment bonus path is introduced. Evasion is excluded from every equipment main-stat and substat pool, including Feet and Accessories. The ten gear stat types remain unchanged.

Only display wording changes; persisted stat keys, stats, gear roll ordering, existing owned gear and combat formulas remain compatible. The uncommitted Evasion gear-pool and integration additions were removed before publication.

Validation: TypeScript passes; 351 regression tests pass, including explicit exclusion of Evasion from all six slots and existing hit-chance, deterministic gear, legacy roll and persistence tests. No visual layout redesign in this change. PR #21 remains draft and unmerged.

Next: finalize the approved Improve Equipment B concept using the approved ten-stat icons and Inventory/Equip icons. Evasion is a creature/combat stat, not an extra equipment stat icon.
