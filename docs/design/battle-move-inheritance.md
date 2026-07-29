# Battle M5 — Breeding Move Inheritance

## Purpose

Breeding now connects permanent combat progression to offspring creation. Successful creature-to-creature conceptions resolve a deterministic move-lineage package and store it on the pregnancy. The same immutable package follows the offspring through pregnancy, egg delivery, hatching, and birth history.

This system does not change pregnancy chance, Energy cost, Hearts, stat genetics, Talent inheritance, pair streak behavior, or player pregnancy protection.

## Timing

1. The Breeding Pen previews compatible parent moves and eligible combination recipes.
2. No outcome roll is revealed before conception.
3. After a successful conception, the final projected child species is known.
4. Parent learned/equipped move libraries are snapshotted from the pre-attempt save.
5. Direct inheritance and combination recipes are rolled exactly once.
6. The complete result is stored on `PregnancyRecord.inheritance.battleMoveInheritance`.
7. Delivery copies the package to the egg.
8. Hatching applies the stored starting loadout to the new creature and birth record.

Changing a parent’s loadout after conception cannot change the offspring result.

## Direct Parent-Move Inheritance

Only moves that are:

- present in at least one parent’s learned library,
- marked `inheritable`,
- compatible with the projected child species, and
- not already supplied by the child’s native starting library

enter the direct inheritance pool.

Base weighting:

- Equipped on a parent: 35%
- Learned but not equipped: 15%
- Known by both parents: +25%
- Compatible with the child’s natural species profile: compatibility bonus from the move-loadout engine
- Rare: −15%
- Signature: −20%
- Event: −30%

Pair-quality bonuses are then added:

- Pair familiarity: +2% per streak, capped at +8%
- Breeding Pen Comfort: +2% per tier
- Average Affection: up to +5%
- Combined pair-quality bonus: capped at +18%

Final direct chances are capped at 95%. At most three extra direct moves can be inherited.

## Combination Moves

Combination recipes require one valid contributing move from each parent group. Symmetric recipes allow the parents to satisfy either recipe side.

A recipe must also:

- match the child’s required species, family, or capability tags,
- pass normal child move compatibility,
- reference existing parent and output move definitions.

Recipe chance:

```text
Base recipe chance
+ pair-quality bonus
+ 5% for each contributing move currently equipped
```

Combination chance is capped at 65%. At most one combination technique can emerge per offspring.

Active recipes:

- Predator Pursuit
- Guardian Chorus
- Restorative Rhythm

## Starting Move Library

The offspring receives:

1. Required basic fallback move
2. Native signature move
3. Successful combination move
4. Successful direct inherited moves
5. Remaining native defaults until the learned library is full

Limits remain:

- 8 learned moves
- 4 equipped moves
- at least one equipped zero-cost, zero-cooldown fallback

Combination moves are inserted before direct inherited moves so a rare successful recipe is not displaced by the learned-move cap.

## Player Protection

The player is not a creature parent for move inheritance. A player-receiver session cannot conceive, while any pairing containing the player has no offspring move-lineage preview or roll.

## Save Reliability

Save schema 5 introduces persistent move-lineage records. Older schema-4 saves migrate without changing existing creatures or Nursery records.

Save-boundary validation:

- removes deleted move IDs from stored lineage,
- removes child-incompatible inherited moves,
- rebuilds a legal starting loadout,
- preserves valid parent snapshots and roll notes,
- prevents invalid combination entries from reaching a hatchling.

## UI

### Breeding Pen

The compact Move Lineage shelf shows:

- projected child species compatibility,
- possible direct parent moves,
- final visible chances,
- eligible combination recipes and contributing moves,
- pair-quality move-inheritance bonus.

The actual deterministic rolls remain hidden until conception succeeds.

### Nursery

The Move Lineage ledger shows pregnancy, egg, and hatched records with:

- direct inherited moves,
- combination moves,
- complete starting learned library,
- parents and species,
- immutable roll notes.

### Dev Tools

Move Audit now identifies recipes as active breeding combinations and counts stored move-lineage records.

## Deliberately Deferred

Battle M5 does not add:

- player-facing move loadout editing,
- move-manual consumption,
- equipment effects,
- Coliseum reward progression,
- Talent-granted move learning,
- move deletion or replacement UI,
- more than three combination recipes,
- PvP validation.

These belong to Battle M6 and later content patches.
