# Creature Chronicles Battle System Plan

This document locks in the battle-system direction before expanding Battle Outfitter, combat items, equipment, manuals, or Coliseum features.

## Design Pillars

- Battles are **3v3 active creature fights**.
- The game does **not** use Pokemon-style elemental type matchups.
- Combat identity comes from species, family, body traits, temperament traits, move tags, abilities, equipment, training, and breeding inheritance.
- Each creature should always have at least one usable low-cost or no-cost move.
- Battle systems should connect back to the ranch loop: breeding creates move inheritance, training improves stats, equipment refines combat roles, and Battle Outfitter prepares creatures for harder encounters.

## Battle Format

### Default Format

- Player side: up to 3 active creatures.
- Enemy side: up to 3 active creatures.
- MVP battles should use fixed 3-creature teams when possible.
- Benches, swaps, reserves, and larger teams can be added later.

### Turn Flow

1. Player chooses actions for active creatures.
2. Enemy AI chooses actions for active enemy creatures.
3. Actions are ordered by Speed, move priority, status effects, and ability/equipment modifiers.
4. Each action resolves in order.
5. Cooldowns decrement and status durations tick down at the end of the round.
6. Repeat until one side has no active creatures remaining.

### Targeting

Moves declare their target type.

Recommended target types:

- `self`
- `single_enemy`
- `all_enemies`
- `single_ally`
- `all_allies`
- `field`

For MVP, avoid front-row/back-row positioning. All active creatures can target all opposing active creatures unless a move says otherwise.

## Creature Stats and Battle Stats

Existing ranch creature stats should feed combat instead of creating a disconnected stat system.

| Core Stat | Battle Meaning |
| --- | --- |
| STR | Physical power, heavy attacks, guard breaking |
| DEX | Speed, accuracy, evasion, quick attacks |
| STA | Max HP, defense, endurance, injury resistance |
| CHA | Support, morale, buffs, taunts, team synergy |
| WIL | Special power, resistance, status strength/resistance |
| FER | Vitality, recovery, biological potential |

### Derived Battle Stats

Each creature should calculate these at battle start:

- Max HP
- Physical Power
- Special Power
- Defense
- Resistance
- Speed
- Accuracy
- Evasion
- Status Power
- Status Resist
- Battle Energy

### Draft Stat Formulas

These are starting formulas for tuning, not permanent final balance.

```txt
Max HP = 40 + Level * 6 + STA * 8 + FER * 4 + speciesHPBonus
Physical Power = Level + STR * 2
Special Power = Level + WIL * 2
Defense = floor(Level / 2) + STA * 2
Resistance = floor(Level / 2) + WIL * 2
Speed = DEX * 2 + speciesSpeedBonus
Accuracy = 90 + floor(DEX / 2)
Evasion = floor(DEX / 3)
Status Power = CHA + WIL
Status Resist = WIL + STA
Battle Energy = 40 + STA * 3 + WIL * 2
```

## Battle Energy

Battle Energy is separate from ranch chore energy and breeding stamina.

### Rules

- Each creature has its own Battle Energy during battle.
- Battle Energy starts full at battle start.
- Moves cost Battle Energy.
- Basic moves should cost 0 or very little.
- Strong moves may cost more Battle Energy and/or have cooldowns.
- Some defensive/support moves can restore Battle Energy.
- MVP Battle Energy should reset after battle.
- Later challenge modes may make Battle Energy partially persistent across a route, dungeon, or Coliseum streak.

## Move Loadouts

Each creature has:

- Up to **8 learned moves** total.
- Up to **4 equipped battle moves**.
- Moves can be changed outside battle.
- Battle UI only shows equipped moves.
- Ranch/Battle Outfitter UI can manage learned/equipped moves later.

## Move Sources

Moves can come from several sources:

1. **Species moves** — native to a species or species family.
2. **Universal moves** — broadly learnable moves such as Strike, Defend, Focus, First Aid, Guard Break, Rally, Taunt, or Quick Step.
3. **Inherited moves** — passed from parents through breeding.
4. **Manual-taught moves** — taught through Battle Outfitter, shops, rewards, or events.
5. **Event/rare moves** — limited, special, boss, seasonal, or story-based moves.

Store/adoption creatures should come with preset move kits rather than random empty kits.

## Battle Move Data Model

Suggested TypeScript shape:

```ts
type BattleMove = {
  id: string;
  name: string;
  description: string;

  sourceType: "species" | "universal" | "inherited" | "manual" | "event";
  category: "physical" | "special" | "support" | "status" | "healing";

  targetType:
    | "self"
    | "single_enemy"
    | "all_enemies"
    | "single_ally"
    | "all_allies"
    | "field";

  power: number;
  accuracy: number;
  battleEnergyCost: number;
  cooldown: number;
  priority: number;

  tags: string[];
  effects: BattleMoveEffect[];

  inheritable: boolean;
  learnRequirements?: {
    speciesIds?: string[];
    familyTags?: string[];
    bodyTags?: string[];
    temperamentTags?: string[];
    roleTags?: string[];
  };
};
```

## Tags Instead of Types

The battle system does not use a type chart. Instead, it uses tags.

### Creature Tag Categories

- Species tags
- Family tags
- Body tags
- Temperament tags
- Role tags

### Example Body Tags

- `agile`
- `sturdy`
- `heavy`
- `light`
- `fanged`
- `clawed`
- `horned`
- `armored`
- `winged`
- `aquatic`
- `burrowing`
- `venomous`
- `regenerative`

### Example Temperament Tags

- `loyal`
- `aggressive`
- `skittish`
- `protective`
- `cunning`
- `docile`
- `wild`
- `disciplined`
- `vengeful`
- `nurturing`
- `territorial`

### Example Role Tags

- `striker`
- `tank`
- `support`
- `disruptor`
- `healer`
- `finisher`
- `controller`
- `buffer`
- `debuffer`

### Example Move Tags

- `claw`
- `bite`
- `strike`
- `charge`
- `pounce`
- `guard`
- `howl`
- `taunt`
- `heal`
- `bleed`
- `stun`
- `mark`
- `focus`
- `rally`
- `pursuit`
- `counter`
- `venom`

## Tag-Based Strengths and Weaknesses

Instead of elemental multipliers, small tag modifiers affect performance.

Examples:

- Armored targets resist claw, bite, and strike moves.
- Agile creatures are harder to hit with heavy/charge moves.
- Fragile creatures are more vulnerable to bleed and pursuit.
- Disciplined creatures resist taunt and fear-style moves.
- Pack-oriented creatures gain bonuses when allies with compatible tags are active.
- Protective creatures gain bonuses when allies are low HP.

### Recommended Modifier Sizes

- Minor modifier: 5%
- Normal modifier: 10%
- Major modifier: 15%
- Extreme modifier: 20%

Recommended caps:

- Positive damage modifiers capped around +50%.
- Negative damage modifiers capped around -50%.

This keeps tag interactions meaningful without making battles impossible to balance.

## Damage Formula

Draft formula:

```txt
Damage = max(
  1,
  ((MovePower + RelevantAttackStat) * ModifierTotal) - RelevantDefenseStat
)
```

Relevant stat pairings:

| Move Category | Attacker Stat | Defender Stat |
| --- | --- | --- |
| physical | Physical Power | Defense |
| special | Special Power | Resistance |
| status | Status Power | Status Resist |
| healing | CHA + WIL + move value | N/A |

Modifier sources:

- Move tags
- Creature affinities
- Target vulnerabilities/resistances
- Abilities
- Equipment
- Status effects
- Guarding
- Critical hits
- Random variance

Recommended random variance: 0.9 to 1.1.

## Cooldowns

Cooldowns should complement Battle Energy.

- Basic moves: 0 cooldown.
- Moderate moves: 1 cooldown.
- Strong moves: 2-3 cooldown.
- Team-wide buffs/heals: 3+ cooldown.
- Signature moves: high cost, high cooldown, or both.

Every creature must have at least one usable move at all times.

## Status Effects

MVP should start with a limited, readable status set.

Recommended MVP statuses:

- `bleed` — damage over time.
- `stun` — loses action or receives heavy priority penalty.
- `guarded` — reduced incoming damage.
- `inspired` — improved morale/support output or Battle Energy recovery.
- `marked` — takes increased damage from certain follow-up moves.
- `exhausted` — reduced Battle Energy recovery or Speed.
- `weakened` — reduced Physical Power/Special Power.
- `slowed` — reduced Speed and evasion.

## Abilities

MVP rule: each creature has one passive ability.

Abilities should interact with tags, team state, HP thresholds, Battle Energy, or status effects.

Examples:

- **Feline Reflexes** — once per battle, the first physical attack against this creature has reduced accuracy.
- **Pack Instinct** — if another compatible beast ally is active, gain priority on bite or pursuit moves.
- **Thick Hide** — reduces claw, bite, strike, and charge damage.
- **Predator's Focus** — deals extra damage to marked or bleeding enemies.
- **Protective Bond** — when an ally drops below 40% HP, gain Guarded and Battle Energy.
- **Skittish Burst** — after being targeted, gain Speed next round.

## Equipment

Equipment should modify combat behavior, not only raw stats.

MVP equipment slots:

- Offense slot
- Defense slot

Later slot:

- Accessory slot

Example equipment:

- **Sparring Wraps** — boosts strike/claw physical moves.
- **Guard Charm** — starts battle with Guarded or improves defense.
- **Focus Band** — increases max Battle Energy.
- **Quick Anklet** — increases Speed.
- **Medic Pouch** — improves healing moves.
- **Hunting Collar** — improves bite/pursuit moves.
- **Heavy Plate** — reduces claw/bite/strike damage but lowers Speed.

## Battle Items

Battle items should consume a turn/action.

Examples:

- **Field Tonic** — restores Battle Energy.
- **Revival Salve** — revives a fainted creature at low HP.
- **Guard Powder** — grants Guarded to allies.
- **Focus Bell** — removes Stun or Exhausted.
- **Cleanse Kit** — removes Bleed/Marked/Weakened.

## Move Learning and Inheritance

### Learned Move Rules

- Each creature can know up to 8 moves.
- Each creature can equip up to 4 moves.
- Move changes happen outside battle.
- Learned moves should persist on the creature.
- Equipped moves should be stored as a subset of learned moves.

### Bred Creature Starting Moves

A bred creature should start with:

- 1 basic universal move.
- 1 native species move.
- 1-2 inherited candidate moves.
- Optional rare inherited move chance.

### Inheritance Eligibility

A move can be inherited if:

1. The move is marked inheritable.
2. At least one parent knows the move.
3. The child has compatible species/family/body/temperament/role tags.
4. The child has an open learned move slot.
5. The move is not explicitly blocked for that child species.

### Inheritance Chance Draft

- Parent equipped move: 35%
- Parent learned but unequipped move: 15%
- Both parents know move: +25%
- Child has strong compatibility: +10%
- Rare inherited move: -15%
- Signature move outside native species: usually blocked unless a special recipe allows it.

### Overflow Rule

If more than 8 learned moves would be assigned, prioritize:

1. Required basic universal move.
2. Native species signature or starter move.
3. Moves known by both parents.
4. Rare inherited moves.
5. Equipped parent moves.
6. Other compatible learned parent moves.
7. Generic universal fallback moves.

## Store and Adoption Creature Moves

Store/adoption creatures should never arrive empty.

Suggested presets:

### Common Store Creature

- 2 species moves
- 1 universal move
- 1 random compatible move

### Rare Store Creature

- 2 species moves
- 1 universal move
- 1 rare, advanced, or upgraded compatible move

## Enemy AI MVP

Enemy AI should be readable and reliable.

Priority order:

1. Use a move that can KO if available.
2. Heal, guard, or retreat into defense if low HP.
3. Target low-HP enemies.
4. Use tag-effective moves when obvious.
5. Use buffs if multiple allies benefit.
6. Use debuffs/status against high-threat enemies.
7. Avoid moves that are on cooldown or unaffordable.
8. Fall back to a basic move.

Enemy teams must always have at least one valid move per creature.

## Win, Loss, Rewards, and Consequences

MVP win rewards:

- Gold
- XP/progression
- Possible item/material rewards
- Story/chapter progress when relevant

MVP loss consequences:

- No permanent death.
- Creatures may suffer temporary injury, morale loss, or readiness loss later.
- Story battles may return the player to the ranch.
- Coliseum battles may cost entry fees or streak progress.

## Battle UI Requirements

The battle UI needs to show:

- 3 player creatures
- 3 enemy creatures
- HP bars
- Battle Energy bars
- Status icons/effects
- Selected acting creature
- Selected target
- 4 equipped moves
- Move cost
- Move cooldown
- Move accuracy
- Move tags
- Target validity
- Battle log

Move tooltips should explain tag logic in plain language.

Example:

```txt
Pounce
Fast claw attack.
Strong against fragile or marked targets.
Less effective against armored or guarded targets.
```

## MVP Implementation Order

### Battle System M1 — Data Foundation

- Add battle stat formulas.
- Add battle move types.
- Add starter species move pools.
- Add universal moves.
- Add species move compatibility.
- Add helpers for learned/equipped moves.

### Battle System M2 — Battle State Engine

- Create battle state shape.
- Create 3v3 team initialization.
- Calculate HP, Battle Energy, cooldowns, and statuses.
- Resolve one round of actions.
- Add damage calculation.

### Battle System M3 — Battle UI Prototype

- Display player and enemy teams.
- Select acting creature.
- Select move.
- Select target.
- Resolve turns.
- Show battle log.

### Battle System M4 — Enemy AI

- Add simple AI action selection.
- Ensure each enemy creature has a valid move.
- Add basic KO/heal/guard/targeting priorities.

### Battle System M5 — Move Inheritance

- Add learned/equipped move storage to creatures.
- Add inheritance helper.
- Add bred-creature move assignment.
- Add store/adoption preset move kits.

### Battle System M6 — Battle Outfitter Integration

- Connect equipment to battle stat/tag modifiers.
- Connect manuals to move learning.
- Connect consumables to battle items.
- Connect readiness to battle prep and injury reduction.

## Current Lock-In Decisions

- Use 3v3 battles.
- Do not use elemental type charts.
- Use tags/traits instead of types.
- Use separate Battle Energy.
- Use 4 equipped moves and 8 learned moves.
- Support species, universal, inherited, manual, and event moves.
- Give every creature at least one always-usable move.
- Use one passive ability per creature for MVP.
- Make items consume an action.
- Start with a small status list.
- Build data foundation before expanding Battle Outfitter further.
