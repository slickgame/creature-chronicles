# Battle M2 — Round Engine Rules

## Scope

This milestone completes deterministic round resolution for the existing three-versus-three battle foundation. It does not add the player-facing target-first battle screen, tactical enemy AI, Coliseum progression, battle rewards, equipment effects, or breeding move rolls.

## Round order

1. Collect at most one submitted action per living combatant.
2. Validate equipped move, Battle Energy, cooldown, and target legality.
3. Replace missing or unusable moves with an equipped legal fallback.
4. Normalize single, team-wide, self, field, and Taunted targets.
5. Sort actions by move Priority and effective Speed.
6. Resolve deterministic initiative ties from battle id, round, and combatant id.
7. Resolve each action until one team is defeated.
8. If combat continues, resolve Bleed and other end-round state.
9. Tick every cooldown exactly once.
10. Decrement every status duration exactly once.
11. Regenerate Battle Energy for living combatants.
12. Recalculate the battle outcome and begin the next round.

## Action fallback safety

Every normalized creature loadout contains at least one zero-cost, zero-cooldown move. An invalid, missing, unaffordable, or cooling-down submitted action is replaced by an available fallback instead of creating an actionless turn or throwing an error.

Unknown actors and fainted actors do not act. Duplicate submitted actions for one actor do not create duplicate turns.

## Hit chance

Hostile single-target and area moves roll once per target.

```text
Hit chance =
  Move Accuracy
+ 45% of the attacker's Accuracy above or below 90
- 65% of the target's Evasion
+ 5 for Precision-tagged moves
+ Status Power versus Status Resistance adjustment for Status moves
```

The final hit chance is clamped from 5% to 100%. Friendly and self effects do not make hostile accuracy rolls.

A missed hostile target does not receive damage, hostile statuses, marks, debuffs, or Taunt. Self-effects attached to the same move may still resolve.

## Damage

```text
Base damage =
  Move Power
+ 75% of the declared scaling stat
- 50% of the declared resisted-by stat
```

Physical moves normally scale from Physical Power against Defense. Special moves normally scale from Special Power against Resistance. Explicit move metadata overrides category defaults.

The base result is multiplied by applicable effects:

- Attacker move-tag affinity: +10%
- Defender move-tag vulnerability: +20%
- Defender move-tag resistance: -20%
- Guarded: percentage reduction stored by the status
- Marked: +15% incoming damage
- Pursuit against Slowed: +10%
- Pursuit against Exhausted: +10%
- Finisher against a target at or below 35% HP: +20%
- Guard Break against Guarded: +25% and removes Guarded after damage
- All-enemy move spread modifier: 0.85x

The combined modifier is clamped from 0.35x to 1.85x. Relevant affinity, resistance, Guard, Mark, Pursuit, Finisher, Guard Break, and spread notes are written to the battle log.

## Healing

```text
Healing =
  Base move/effect healing
+ 60% of the declared scaling stat
```

Single-target healing applies at full strength. Team-wide healing applies a 0.78x spread modifier to each target. Actual healing is capped by the target's maximum HP and the log records the amount truly restored.

## Secondary effects

Hostile secondary-effect chance is adjusted by attacker Status Power versus defender Status Resistance, with an adjustment cap of ±20 percentage points. Non-guaranteed hostile secondary effects remain between 5% and 95%.

## Status stacking

Default stack limits:

| Status | Maximum stacks |
|---|---:|
| Bleed | 3 |
| Inspired | 2 |
| Weakened | 2 |
| Slowed | 2 |
| Exhausted | 2 |
| Guarded | 1 |
| Marked | 1 |
| Taunted | 1 |
| Stun | 1 |

Move-effect metadata may request a different positive stack limit.

Reapplying a status:

- increases stacks up to the limit
- keeps the stronger absolute amount
- refreshes to the longer remaining duration
- preserves one status entry per status and affected stat

Bleed deals its per-stack amount multiplied by its current stack count at the end of the round.

Stat-specific buffs and debuffs use their declared stat and multiply their amount by the current stack count. They do not also receive the generic Inspired or Weakened stat package.

## Taunt

Taunt applies the `taunted` status and records the source combatant. While that source remains alive, the affected combatant's single-enemy moves are forced toward it. Self, ally, field, and all-enemy moves remain legal.

## Cooldowns

When a move is used, the stored cooldown is initialized one step above its declared value because all combatants tick once at the end of that same round.

A move with cooldown 1 therefore behaves as follows:

```text
Use during Round 1
Round 2 begins at cooldown 1 and the move is unavailable
End of Round 2 ticks to 0
Round 3 begins with the move available
```

## Battle Energy regeneration

Living combatants regenerate 12% of maximum Battle Energy each completed round, clamped from 5 to 12 points.

- Exhausted halves the result, with a minimum of 1.
- Inspired adds 2 after the base calculation.
- Fainted combatants regenerate 0.
- Regeneration never exceeds maximum Battle Energy.

## Determinism

The battle id, round number, combatant id, move id, action position, target id, and effect position seed all initiative, accuracy, and secondary-effect rolls. Resolving the same state with the same submitted actions therefore produces the same queue, rolls, logs, HP, Energy, cooldowns, statuses, and outcome.
