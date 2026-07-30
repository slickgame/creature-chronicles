# Coliseum C2 — Authored Opponents & Combat Progression

## Purpose

C2 replaces the C1 mirror-Echo opponent model with authored three-creature teams and adds persistent creature combat progression.

The existing target-first 3v3 battle engine remains the combat foundation:

- One action per living creature each round
- Priority and Speed ordering
- Battle Energy and cooldowns
- Status effects
- Deterministic Basic, Tactical, and Champion AI
- Persistent learned and equipped moves
- Battle Outfitter equipment
- Team Tactics Kits
- Field Tonics
- Revival Salves

C2 adds:

- Twelve authored PvE encounters
- Three encounters in each of four divisions
- Fixed opponent variants, levels, stat grades, Talents, move libraries, active loadouts, roles, and equipment
- Combat XP for all three participating ranch creatures
- Level-ups through the shared creature stat-growth system
- Growth-Talent biases during combat level-ups
- Per-creature battle records and performance totals
- Deterministic weighted repeat purses
- C1-to-C2 progress migration
- Duplicate-result protection

## Division Structure

Each division now contains two specialist encounters and one division champion.

### Novice Division

1. Opening Scrimmage
   - Basic AI
   - Level 1 balanced formation
   - Introduces an attacker, guard, and support

2. Support Drill
   - Basic AI
   - Level 2 guard-and-recovery formation
   - Introduces healer target priority

3. Novice Division Champion
   - Tactical AI
   - Level 3 balanced champion formation

### Bronze Division

1. Breaker Squad
   - Tactical AI
   - Level 4 burst and guard-break formation

2. Medic Line
   - Tactical AI
   - Level 5 sustain formation

3. Bronze Division Champion
   - Tactical AI
   - Level 6 pack-coordination formation

### Silver Division

1. Status Web
   - Tactical AI
   - Level 7 mark, slow, and weakening formation

2. Endurance Cell
   - Tactical AI
   - Level 8 tank-and-recovery formation

3. Silver Division Champion
   - Champion AI
   - Level 9 rotating guard formation

### Crown Division

1. Crown Opening Assault
   - Champion AI
   - Level 10 high-speed pressure formation

2. Crown Control Matrix
   - Champion AI
   - Level 11 control, cleansing, and recovery formation

3. Crown Tactical Finale
   - Champion AI
   - Level 12 champion triad
   - S-grade specialties and tuned equipment

## Authored Opponent Data

Every enemy slot declares:

- Unique slot ID
- Display name
- Variant ID
- Exact level
- Six stat grades
- Talent IDs and Talent grades
- Learned move IDs
- Four equipped move IDs
- Team role label
- Optional equipment definition

Enemy records are created only for the battle. They are not added to the player collection, habitats, Market, Nursery, or save creature list.

### Equipment

C2 includes authored arena equipment presets:

- Arena Striking Wraps
- Arena Guard Collar
- Arena Focus Lens
- Arena Medic Satchel
- Champion Harness

Enemy equipment modifies only enemy combatants. Player equipment continues to come from the persistent Battle Outfitter loadout.

## Combat XP

All three selected ranch creatures receive Combat XP when a result is recorded.

This includes:

- Living participants
- Fainted participants
- Winners
- Draw participants
- Defeated participants

### Outcome Multipliers

- Victory: 100%
- Draw: 60%
- Defeat: 45%

First clears receive a 20% XP bonus.

### Overlevel Reduction

Creatures significantly above the encounter recommendation receive reduced XP:

- 0–2 levels over: 100%
- 3–4 levels over: 75%
- 5–8 levels over: 50%
- 9+ levels over: 25%

Every recorded participant receives at least 4 XP.

### Performance Contribution

A small capped bonus may come from:

- Damage dealt
- Healing performed
- Status applications
- Protection actions
- Knockouts

Performance cannot exceed a 12-XP bonus per creature per match.

### Level Growth

Combat XP uses the same XP thresholds as Training Grounds:

```text
XP to next level = 45 + current level × 30
```

Level-ups call the shared deterministic creature-growth engine. Growth Talent effects are supplied as stat biases. Maximum Ranch Energy is recalculated after growth.

Combat XP does not create a separate combat level. The creature's normal persistent level increases.

## Creature Battle Records

Each participating creature stores:

- Battles
- Wins
- Losses
- Draws
- Total Combat XP earned
- Damage dealt
- Healing performed
- Statuses applied
- Allies protected
- Knockouts
- Misses
- Highest division order entered
- Last encounter
- Last outcome
- Last battle Ranch Day

The Coliseum hub displays the leading creature records. These records can later support derived combat-role tags and creature-detail history panels.

## Performance Accounting

C2 derives performance from resolved battle actions rather than from UI button presses.

Current accounting includes:

- Direct damage reported by the round engine
- Direct healing reported by the round engine
- Status application, stacking, and refresh events
- Guard and Taunt protection actions
- Direct knockouts
- Missed hostile targets

Damage-over-time ownership is not attributed to the original source in C2 because the current round engine does not preserve source attribution in its bleed-end-of-round log. That remains a later combat-telemetry improvement.

## Rewards

### First Clears

First-clear rewards are fixed and include combinations of:

- Gold
- Guild Points
- Materials
- Existing Battle Outfitter items

### Repeat Wins

Repeat wins choose one deterministic entry from a three-entry weighted pool:

- 55% standard Gold and GP purse
- 30% reduced Gold plus Materials
- 15% reduced Gold plus an Outfitter item or additional Materials

The result seed includes the save, battle result ID, and attempt count. Reloading an already-recorded result cannot reroll it.

Defeats and draws grant Combat XP but no Gold, Guild Points, Materials, or items.

## Save Format

C2 stores its progression as versioned JSON in:

```text
coliseumProgressV2
```

The state contains:

- Completed encounter IDs
- Claimed first-clear IDs
- Per-encounter records
- Per-creature records
- Recent history
- Processed result IDs
- Overall W/L/D totals
- Migration status

No global save-schema bump is required.

## C1 Migration

C1 used four champion-style encounter IDs that remain present in C2:

- novice_echo_trial
- bronze_pack_clash
- silver_guard_circuit
- crown_tactical_finale

When C2 first reads a C1 save:

- Existing C1 records and totals migrate forward.
- Cleared C1 champion encounters remain cleared.
- The two new preliminary encounters in each already-cleared division are marked completed.
- Those preliminary first-clear rewards are also marked claimed.
- The player is not relocked.
- The player does not receive retroactive duplicate first-clear rewards.

The first recorded C2 match writes the new V2 state.

## Duplicate Protection

Each completed match uses its battle ID as a result ID.

The V2 state stores recent processed IDs. Re-submitting a processed result:

- Does not increment attempts
- Does not grant Gold
- Does not grant Guild Points
- Does not grant Materials
- Does not grant items
- Does not grant Combat XP
- Does not update creature records

The result screen also disables its record button after the first click.

## Player Interface

The C2 hub shows:

- Current standing
- Overall record
- Twelve-clear progress
- Next objective
- Eligible creature count
- Three encounter cards per division
- Opponent strategy
- Fixed enemy level range
- AI difficulty
- First-clear purse
- Repeat-purse indicator
- Encounter record
- Best round count
- Leading creature battle records
- Recent match history

Before battle, the player can inspect each authored enemy's:

- Name
- Variant
- Level
- Role
- Equipment
- Equipped moves

The battle screen retains the existing target-first queue and support-item controls.

## Regression Coverage

C2 regression tests cover:

- Twelve encounters and three opponents per encounter
- Three encounters per division
- Valid variant and move references
- Fixed opponent construction independent of the ranch team
- Usable normalized battle loadouts
- Enemy-only equipment effects
- Sequential unlocks
- C1 migration and legacy-completed preliminary fights
- First-clear rewards
- Deterministic repeat rewards
- Duplicate result protection
- XP for victories, draws, and defeats
- Overlevel XP reduction
- Shared level and stat growth
- Performance accumulation
- Persistent per-creature combat records

## Deliberately Deferred

C2 does not add:

- Coliseum Marks currency
- Coliseum reward shop
- New utility equipment slot
- New combat equipment catalog
- Coliseum-exclusive moves
- Unique creature eggs
- Recruitment contracts
- Boss-specific loot
- Daily challenges
- Gauntlets
- Entry fees or tickets
- Persistent battle injuries
- PvP
- Seasons or leaderboards

Those systems belong to C3 and C4.
