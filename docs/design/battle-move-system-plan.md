# Battle Move System Plan

## Status

Design queue for the full 3-versus-3 Coliseum combat implementation. This document records the required move architecture before battle content and balance numbers are finalized. It is **not yet a live gameplay system**.

## Core direction

Creatures may learn more than four moves. A creature owns a persistent **move library**, while battle preparation may use a smaller configurable **active loadout** if testing shows that an unrestricted in-battle list becomes unwieldy.

The system should support meaningful team roles rather than treating every move as direct damage. A complete team should be able to combine offense, protection, healing, support, control, and resource management.

## Move definition model

Every move should be data-driven and have a stable id. Planned fields include:

- Name and description
- Move source and availability tags
- Damage or support category
- Element or thematic type, when applicable
- Power or healing strength
- Accuracy
- Priority
- Battle Energy cost
- Cooldown, when applicable
- Target pattern
- Scaling stat and resisted stat
- Status, buff, debuff, field, or resource effects
- Duration and stack limits
- AI-use hints
- Animation, icon, and effect asset references
- Version number for save migration and balance changes

## Move categories

The initial registry should distinguish at least:

1. **Physical attacks** — scale mainly from physical power and defense.
2. **Special attacks** — scale mainly from special power and resistance.
3. **Healing moves** — restore HP to self, one ally, or multiple allies.
4. **Support moves** — shields, protection, Energy restoration, cleansing, redirection, and ally setup.
5. **Buff moves** — improve stats, damage, defenses, accuracy, speed, or resource efficiency.
6. **Debuff moves** — reduce enemy stats or increase incoming damage and Energy costs.
7. **Status moves** — apply damage-over-time, control, vulnerability, silence, taunt, or other conditions.
8. **Guard and interception moves** — protect allies, redirect attacks, counter, brace, or reduce area damage.
9. **Field moves** — create team-wide or battlefield effects that persist for several rounds.
10. **Utility moves** — movement, target manipulation, cooldown interaction, dispels, copying, and unusual species mechanics.

A move may combine categories, but its primary category should remain explicit for AI and balance tools.

## Target patterns for 3-versus-3 combat

The targeting model should support:

- Self
- One ally
- One enemy
- Any single combatant
- All allies
- All enemies
- Adjacent allies or enemies
- Lowest-HP or highest-threat automatic targets
- Random targets
- Repeated or ricocheting targets
- Row, lane, or formation targeting if positioning is added later

Target rules must remain visible before confirming an action.

## Battle Energy and cooldown rhythm

Moves should use **battle-specific Energy**, separate from ranch-day Energy. Basic moves need low or zero cost so every creature always has at least one legal action. Strong attacks, healing, control, and area effects should spend more Energy or use cooldowns.

The engine must prevent soft locks by ensuring:

- Every legal creature build has at least one usable fallback move.
- Enemy AI never selects an unaffordable or invalid move.
- Cooldowns and Energy regeneration are deterministic and visible.
- A creature with no preferred action can defend, recover Energy, or use a basic move.

## Move-source families

Move availability should be layered rather than placed in one universal pool:

- **General moves** — available broadly through level growth, training, or common manuals.
- **Species moves** — part of a species identity and natural learnset.
- **Variant moves** — rare or thematic moves tied to a specific variant.
- **Signature moves** — defining moves with limited availability.
- **Role moves** — tank, support, healer, striker, control, and other build-enabling options.
- **Talent-granted moves** — unlocked or modified by particular Talents.
- **Equipment-granted moves** — available while an item is equipped.
- **Coliseum reward moves** — manuals, techniques, or unique rewards from PvE progression.
- **Story and event moves** — limited or narrative unlocks.
- **Inherited moves** — learned through breeding from one or both parents.
- **Combination moves** — rare offspring moves produced by compatible parent species, variants, tags, or known moves.

## Learning and move-library progression

Planned learning sources include:

- Starting species moves
- Creature level milestones
- Move-training assignments
- Consumable manuals or permanent tutors
- Coliseum rank rewards
- Story and contract rewards
- Talents and equipment
- Parent inheritance
- Rare breeding combinations

The move library should preserve learned moves permanently unless the player deliberately removes one. Battle loadouts, if used, should be freely editable outside combat and should not delete the larger library.

## Breeding inheritance

### Direct inheritance

An offspring may inherit eligible moves known by either parent. Inheritance should consider:

- Whether the move permits inheritance
- Species and family compatibility
- Parent mastery or use history, if later tracked
- Breeding Pen upgrades
- Pair familiarity
- Relevant Talents or items
- Offspring move-library capacity rules

Direct inheritance should use a deterministic seed so the same saved conception outcome does not reroll on reload.

### Combination moves

Certain pairings may generate a move neither parent knows directly. These recipes can use:

- Parent species or variants
- Family pairing
- Element or move tags
- One required move from each parent
- A parent move plus a species trait
- Talent combinations
- Rare lineage or mutation conditions
- Coliseum or story unlock flags

Example structure:

```text
Parent A knows a heat-tagged charge move
+
Parent B knows a guard or armor move
+
compatible offspring family
=
chance to learn a new heated-armor counter move
```

Combination recipes should be explicit data, not unrestricted procedural text generation. This keeps balance, localization, testing, and save migration manageable.

### Inheritance preview

The Breeding Pen should eventually show:

- Directly inheritable parent moves
- Possible combination-move recipes
- Approximate inheritance chances
- Which parent or pairing enables each move
- Capacity or replacement warnings
- Talent and item modifiers

The preview must label possibilities rather than guarantees.

### Pool-control safeguards

Because creatures can learn more than four moves, the system still needs limits that prevent unusable save bloat and dominant inheritance loops:

- Persistent move-library soft or hard cap
- Maximum directly inherited moves per offspring
- Maximum combination moves per conception
- Duplicate prevention
- Compatibility restrictions
- Rarity tiers and diminishing odds
- Move-definition versioning
- Validation for deleted or renamed move ids
- A fallback starting move for damaged legacy saves

## AI requirements

Enemy AI should evaluate:

- Legal targets
- Energy and cooldown availability
- Expected damage or healing
- Ally danger and enemy threat
- Buff/debuff duration
- Overhealing and wasted effects
- Focus fire versus spread damage
- Taunt, guard, and redirection
- Move synergy and setup-payoff sequences
- Difficulty-specific decision quality

AI logs should explain why a move and target were selected in developer mode.

## Balance and validation tools

The future battle developer panel should simulate:

- Team-versus-team win rates
- Average battle length
- Move usage rates
- Damage, healing, and Energy efficiency
- Status uptime
- First-turn advantage
- Role and species representation
- Talent, equipment, and inherited-move impact
- Combination-move rarity
- Illegal or actionless turns

Automated validation should catch:

- Missing move ids
- Invalid target patterns
- Negative or impossible costs
- Effects without handlers
- Species with no legal basic move
- AI selecting invalid actions
- Inheritance recipes referencing deleted moves or species
- Duplicate inherited outcomes
- Legacy creatures with damaged move libraries

## Recommended implementation order

1. Finalize move types and data schema.
2. Build move registry and validation.
3. Add persistent creature move libraries and optional active loadouts.
4. Implement damage, healing, buffs, debuffs, status, targeting, Energy, and cooldown handlers.
5. Connect species/general learnsets.
6. Build 3-versus-3 player and enemy action flow.
7. Add AI scoring and developer logs.
8. Add Coliseum progression and move rewards.
9. Add direct move inheritance.
10. Add explicit parent-pairing combination recipes.
11. Add battle and inheritance simulation tools.
12. Balance through automated tests and live playtesting.
