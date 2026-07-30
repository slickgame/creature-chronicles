# Battle M6 — Battle Outfitter Integration

## Purpose

Battle Outfitter purchases, equipment assignments, Focus training, consumables, and persistent move loadouts now affect the playable 3v3 exhibition battle. This patch connects the existing town shop and move foundation to combat without adding Coliseum rewards or permanent defeat consequences.

## Equipment Effects

Assigned equipment is read from the active save when a battle is created. It modifies the player-side battle combatant only; enemy Echo creatures do not copy the player’s assigned equipment.

### Sparring Wraps — Offense Slot

- +6 Physical Power
- +4 Special Power
- +3 Accuracy

### Guard Charm — Defense Slot

- +12 maximum HP
- +5 Defense
- +5 Resistance
- +3 Status Resist

Equipment remains assigned after battle and is not consumed.

## Focus Manuals

A Focus Manual can be used in two distinct ways.

### Focus Training Rank

The existing permanent rank remains capped at 3. Each rank grants:

- +2 Accuracy
- +2 Status Power
- +2 maximum Battle Energy

### Technique Training

Move Training at the Battle Outfitter may consume one Focus Manual to teach one compatible standard move.

A standard manual cannot teach:

- Combination moves
- Event moves
- Story moves
- Coliseum-exclusive moves
- Talent-granted moves
- Signature-rarity moves

The normal eight-learned-move limit and species compatibility rules remain active.

## Player Move Loadout Editor

The Battle Outfitter now exposes a Move Training overlay.

For each creature it displays:

- Learned move library, maximum 8
- Equipped move loadout, maximum 4
- Move category and target pattern
- Power, Accuracy, Battle Energy cost, and cooldown
- Compatible techniques that can be taught with Focus Manuals
- Techniques that require breeding or another dedicated source

Learned moves may be equipped or unequipped. A full four-move loadout requires the player to choose an equipped move to replace. The loadout engine continues to require at least one zero-cost, zero-cooldown action.

## Team Tactics Kit

The player may arm one Team Tactics Kit during team selection.

At battle start it is consumed and every living ranch-team combatant receives:

- Inspired for 1 round
- +10 current Battle Energy
- +10 maximum Battle Energy for that battle

The kit may be used once per exhibition.

## Field Tonic

A Field Tonic may be used once per exhibition on one living ranch-team creature between rounds.

It restores:

- 30% maximum HP
- 20% maximum Battle Energy

The item is consumed only after a valid target is selected. It cannot revive a fainted creature or be wasted on a fully restored target.

## Revival Salve

A Revival Salve may be used once per exhibition on one fainted ranch-team creature.

It restores:

- 35% maximum HP
- 10% maximum Battle Energy
- No active statuses

If the player team was defeated, a valid Revival Salve can return the battle to an ongoing state. The salve is consumed only after a valid fainted target is selected.

## Save Behavior

Equipment assignments and Focus Training ranks continue using existing save flags. Learned and equipped moves remain stored on each creature’s `battleMoveLoadout`.

Consumable stock is autosaved immediately when a Team Tactics Kit, Field Tonic, or Revival Salve is successfully used. Invalid uses do not consume stock.

## Deliberately Deferred

Battle M6 does not add:

- Coliseum Gold, item, equipment, creature, or resource rewards
- Persistent battle records or win/loss statistics
- Combat XP rewards
- Battle injuries or fatigue
- Utility equipment slot
- Equipment crafting or upgrades
- Random equipment modifiers
- Durability
- Full combat-item inventory unification
- PvP validation

These belong to the Coliseum progression and combat-content patches.
