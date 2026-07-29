# Battle M4 — Deterministic Enemy AI

## Purpose

Battle M4 replaces enemy fallback-only behavior with deterministic action planning for complete 3v3 rounds. The AI uses the same legal move, target, cooldown, Battle Energy, status, and damage rules as the player-facing battle system.

This milestone does not add Coliseum rewards, permanent battle consequences, opponent progression, equipment effects, move inheritance, or battle records.

## Difficulty tiers

### Basic

Basic AI is deliberately readable and imperfect.

- Uses only equipped, affordable, off-cooldown moves.
- Favors available damage.
- Uses healing when an ally is injured.
- Occasionally selects support or status actions.
- Uses deterministic tie-breaking rather than nondeterministic randomness.
- Does not coordinate actions between teammates.

### Tactical

Tactical AI evaluates the current battle state for each acting creature.

It considers:

- Projected damage using the move's declared scaling and resisted stats.
- Species affinity, vulnerability, and resistance tags.
- Finishing opportunities.
- Current HP and missing HP.
- Healing value and critical allies.
- Battle Energy restoration.
- Harmful-status cleansing.
- Guard, buff, debuff, Taunt, and status value.
- Existing statuses to reduce redundant applications.
- Move Energy cost and cooldown commitment.
- Move AI hints.

Tactical AI does not read the player's queued actions before choosing its own. It plans from the visible round-start state.

### Champion

Champion AI uses Tactical scoring plus same-round team coordination.

It additionally:

- Establishes a priority target.
- Coordinates focus fire when a knockout is not already covered.
- Avoids wasting damage on a target already covered by planned lethal damage.
- Reserves projected healing and avoids excessive overhealing.
- Avoids duplicate team-wide plans.
- Avoids redundant status coverage when another teammate already plans the same effect.
- Uses deterministic coordination order by team slot.

Champion AI is intended for division champions, special bosses, and later high-tier Coliseum content. It receives no hidden stat bonus and does not bypass battle rules.

## Candidate generation

For each living AI combatant:

1. Read equipped moves.
2. Remove moves blocked by cooldown or insufficient Battle Energy.
3. Generate every legal target set for each remaining move.
4. Respect Taunt when generating single-enemy targets.
5. Validate each action through the production battle validator.
6. Score the legal candidates.
7. Select the highest-scoring candidate.
8. Use move ID and target IDs as deterministic final tie-breakers.

Every creature should retain a zero-cost, zero-cooldown equipped fallback through Battle M1 normalization. If a damaged battle state has no normal usable move, the planner attempts the required basic move and the round engine still retains its own final fallback protection.

## Information boundaries

The AI may inspect:

- Current HP and Battle Energy.
- Current statuses and durations.
- Current cooldowns.
- Equipped moves.
- Current derived battle stats.
- Species combat profiles and move tags.
- Living allies and opponents.

The AI may not inspect:

- The player's unconfirmed queued actions.
- Future deterministic hit rolls.
- Future secondary-effect rolls.
- Hidden rewards or future encounter data.
- Ranch data unrelated to the active combatants.

## UI behavior

The Coliseum Exhibition team-selection screen exposes:

- Basic
- Tactical
- Champion

Enemy actions remain hidden until the round resolves. The battle log records which action each AI combatant planned, followed by normal production round-resolution logs.

Changing AI difficulty changes the deterministic battle ID seed so the selected tier produces a stable, reproducible exhibition for the same Ranch Day and team.

## Regression requirements

Automated tests cover:

- Deterministic plans for all three tiers.
- One legal action per living enemy.
- Critical healing decisions.
- Finishing-target selection.
- Champion duplicate-team-buff avoidance.
- Taunt target enforcement.
- A complete six-action round with player and AI actions.

The project owner has deferred local testing. Battle M4 remains implemented but unverified until the combined validation pass is run.
