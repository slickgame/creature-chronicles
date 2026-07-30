# Coliseum C4 — Rotating Challenges, Gauntlets, and Boss Trials

## Purpose

C4 adds repeatable endgame and midgame challenge modes on top of the permanent C2 circuit and the C3 Marks economy.

C4 does not replace:

- the 12 authored permanent encounters
- C2 Combat XP and ordinary level growth
- C2 creature combat records
- C3 Coliseum Marks
- the C3 Marks Exchange
- the three-slot Battle Outfitter
- Coliseum technique manuals
- capacity-safe creature contracts

The C3 permanent circuit and reward screens remain available from the C4 toolbar.

## Save model

C4 stores versioned state in:

```text
coliseumC4StateV1
```

The state contains:

- processed C4 result IDs
- daily reward claim keys
- weekly boss claim keys
- weekly gauntlet claim keys
- one optional active gauntlet run
- mode records
- per-creature C4 records
- save-local weekly scores
- recent challenge history

Missing or malformed C4 JSON normalizes to an empty safe state without changing C2 or C3 progression.

## Unlock requirements

C4 reuses permanent-circuit clears as access gates.

- Daily Challenge: clear Novice Division Champion
- Rising Circuit: clear Novice Division Champion
- Endurance Circuit: clear Silver Division Champion
- Champion's Road: clear Crown Tactical Finale
- Weekly boss: depends on the authored source formation selected for that week's rotation

An active gauntlet blocks entry into a different C4 challenge until the player completes or abandons the run.

## Daily Challenge

The Daily Challenge is deterministic for the current save and Ranch Day.

The generator selects:

- one already-cleared permanent encounter
- one hazard or mixed modifier
- one second non-restricted wildcard modifier
- enemy level bonus +1
- a Marks and Materials reward scaled by modifier weight

The same save and Ranch Day always produce the same encounter and modifiers. Reloading cannot reroll the challenge.

The primary reward can be claimed once per Ranch Day. Practice rematches after claiming still grant ordinary creature XP and update C4 records, but grant no repeat Marks or Materials.

## Gauntlets

C4 contains three permanent three-stage routes.

### Rising Circuit

- Novice Support Drill
- Bronze Breaker Squad
- Silver Status Web
- Modifier: Quickened Field
- Base reward: 18 Marks and 6 Materials before modifier scaling

### Endurance Circuit

- Bronze Medic Line
- Silver Endurance Cell
- Crown Control Matrix
- Modifiers: Deep Reserves and Bulwark Opening
- Enemy level bonus +1
- Champion AI
- Base reward: 28 Marks, 10 Materials, and one Field Tonic

### Champion's Road

- Silver Division Champion
- Crown Opening Assault
- Crown Tactical Finale
- Modifiers: Marked Opening and Restricted Aid
- Enemy level bonus +2
- Champion AI
- Base reward: 42 Marks, 15 Materials, and one Focus Manual

### Locked roster

The three creatures selected for stage one are stored with the active run. Stages two and three require the same three creature IDs. Direct result processing rejects out-of-order stages and roster substitutions.

### Partial recovery

After a stage victory:

- living creatures recover 30% maximum HP
- living creatures recover 25% maximum Battle Energy
- fainted creatures return at 15% maximum HP
- status effects clear
- move cooldowns clear
- the roster remains locked

The run, roster, stage number, carryover ratios, and cumulative rounds persist in the save.

A defeat or draw ends the run. Abandoning a run removes the active continuation but does not remove XP already earned from completed stages.

### Gauntlet rewards

The full route reward is granted only after stage three.

The first clear of each gauntlet during a Ranch Week grants the full reward. Later clears during the same week grant approximately 35% of the Marks reward and one Material. Every stage grants ordinary creature XP regardless of the final route result.

## Weekly Boss Trial

The weekly boss is deterministic for the current save and Ranch Week. C4 rotates among three elevated authored formations.

### Bulwark Prime

- source: Silver Division Champion
- enemy level bonus +4
- Bulwark Opening
- Fragile Ground
- 32 base Marks, 8 Materials, and one Field Tonic

### Predator Ascendant

- source: Crown Opening Assault
- enemy level bonus +4
- Quickened Field
- Exhausting Heat
- Restricted Aid
- 40 base Marks, 10 Materials, and one Team Tactics Kit

### Grand Tactician

- source: Crown Tactical Finale
- enemy level bonus +5
- Focused Opposition
- Marked Opening
- Deep Reserves
- 55 base Marks, 14 Materials, and one Revival Salve

The primary boss reward can be claimed once per Ranch Week. Practice victories afterward grant XP and records but no repeat Marks, Materials, or item reward.

## Modifier registry

C4 defines nine data-driven modifiers.

### Quickened Field

Every combatant gains +4 Speed.

### Deep Reserves

Every combatant gains +12 maximum and current Battle Energy.

### Fragile Ground

Every combatant enters with 15% less maximum HP while preserving its current HP ratio.

### Bulwark Opening

Every enemy begins Guarded for two rounds.

### Marked Opening

Every combatant begins Marked for two rounds.

### Exhausting Heat

Every ranch creature begins Exhausted for two rounds.

### Restricted Aid

Field Tonics and Revival Salves are disabled. Team Tactics Kits remain available during pre-battle preparation.

### Focused Opposition

Enemies gain +6 Accuracy and +6 Status Power.

### Rallying Start

Every ranch creature begins Inspired for two rounds.

Each modifier also has a reward-weight adjustment. Hazardous conditions raise rewards while player benefits reduce them. Combined reward scaling cannot fall below 50%.

## Combat integration

C4 reuses the current target-first 3v3 battle system.

The player can still use:

- persistent learned and equipped moves
- Offense, Defense, and Utility equipment
- Focus Training
- Team Tactics Kits
- Field Tonics when aid is not restricted
- Revival Salves when aid is not restricted
- Basic, Tactical, or Champion AI depending on the challenge

Authored opponent equipment remains enemy-only. Player Outfitter assignments are never copied onto opponents.

## Combat XP

Every participating creature receives ordinary persistent creature XP after every recorded C4 battle, including fainted creatures.

XP depends on:

- source encounter base XP
- mode multiplier
- victory, draw, or defeat
- overlevel reduction
- damage, healing, statuses, protection, and knockouts

Boss Trials have the highest mode multiplier. Level-ups use the existing deterministic stat-growth and Talent-bias systems and recalculate maximum Ranch Energy.

## Result idempotency

Every C4 battle uses its battle ID as a persistent result ID. Reprocessing the same ID cannot grant another:

- XP award
- Marks reward
- Materials reward
- item reward
- score
- mode record
- creature record
- history entry
- gauntlet stage advance

## Local weekly scoring

C4 records a save-local personal score for each Ranch Week. This is not an online leaderboard.

Score considers:

- challenge mode
- victory or draw
- gauntlet stage reached
- challenge modifier weight
- total rounds used

The weekly board stores the highest score, clear count, best mode, and best challenge name. Per-creature C4 records store battles, outcomes, C4 Combat XP, Daily wins, Gauntlet clears, Boss clears, and best score.

## Player-facing navigation

The active Coliseum screen now provides:

- C4 Overview
- Daily Challenge
- Gauntlets
- Boss Trial
- Weekly Board and Records
- Permanent Circuit and C3 Exchange
- Battle Outfitter
- Town

Town shows a C4 quick-access badge with current Marks, weekly score, active gauntlet stage, or weekly boss reward status.

## Deliberately deferred

C4 does not add:

- online weekly leaderboards
- PvP
- auto-resolve
- procedural enemy rosters
- endless gauntlets
- battle spectators
- seasonal global modifiers

Those should be considered only after the full deferred local validation pass and balance testing.
