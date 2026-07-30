# Coliseum C1 — PvE Progression Foundation

## Purpose

The former rewardless Coliseum Exhibition is now a permanent PvE progression system. The existing target-first 3v3 battle engine, deterministic enemy AI, persistent move loadouts, Battle Outfitter equipment, Focus Training, and support items remain the combat foundation.

C1 adds:

- Four permanent divisions
- Ordered encounter unlocks
- First-clear rewards
- Reduced repeat-win rewards
- Persistent per-encounter records
- Total Coliseum record
- Best winning round counts
- A capped recent-match history
- A dedicated player-facing Coliseum hub

C1 does not add PvP, procedural opponents, combat XP, creature injuries, equipment drops, or seasonal ladders.

## Divisions

### Division 1 — Novice Division

**Encounter:** Novice Echo Trial

- Basic AI
- Enemy level offset: −2
- Recommended level: 1+
- No prerequisite
- First clear: 180 Gold, 6 Guild Points, 1 Field Tonic
- Repeat win: 45 Gold, 1 Guild Point

Clearing Novice unlocks Bronze.

### Division 2 — Bronze Division

**Encounter:** Bronze Pack Clash

- Tactical AI
- Enemy level offset: 0
- Recommended level: 3+
- Requires Novice Echo Trial clear
- First clear: 300 Gold, 10 Guild Points, 1 Focus Manual
- Repeat win: 75 Gold, 2 Guild Points

Clearing Bronze unlocks Silver.

### Division 3 — Silver Division

**Encounter:** Silver Guard Circuit

- Tactical AI
- Enemy level offset: +2
- Recommended level: 5+
- Requires Bronze Pack Clash clear
- First clear: 480 Gold, 18 Guild Points, 1 Team Tactics Kit
- Repeat win: 120 Gold, 3 Guild Points

Clearing Silver unlocks Crown.

### Division 4 — Crown Division

**Encounter:** Crown Tactical Finale

- Champion AI
- Enemy level offset: +4
- Recommended level: 8+
- Requires Silver Guard Circuit clear
- First clear: 800 Gold, 30 Guild Points, 1 Revival Salve
- Repeat win: 200 Gold, 6 Guild Points

Crown is the current C1 capstone. It remains repeatable after its first clear.

## Entry Rules

- The player must have three available creatures.
- Creatures assigned to Training Grounds are unavailable.
- Injured creatures remain unavailable until their recovery day.
- The division prerequisite must be cleared.
- Recommended level is advisory and does not hard-lock entry.
- The selected encounter controls AI difficulty and enemy level offset.
- Players cannot lower the AI difficulty for a progression encounter.

## Enemy Team Construction

C1 continues using Echo opponents so the system can ship without a separate enemy roster authoring pipeline.

The selected ranch team is reversed to form the enemy species lineup. Each enemy receives:

- A unique Coliseum-only creature ID
- The encounter opponent label
- The configured enemy level offset
- No copy of the player's assigned Battle Outfitter equipment

The player's persistent equipped moves, equipment, and Focus Training remain active.

## Battle Outfitter Integration

C1 preserves Battle M6 behavior:

- Assigned Sparring Wraps and Guard Charms affect player combat stats.
- Focus Training ranks affect Accuracy, Status Power, and maximum Battle Energy.
- A Team Tactics Kit may be armed before entry and is consumed at battle start.
- One Field Tonic may be used on a valid living ally during the match.
- One Revival Salve may be used on a valid fainted ally during the match.
- Invalid item uses do not consume stock.

A Revival Salve can resume a completed defeat before the player records the result.

## Permanent Records

Each encounter stores:

- Attempts
- Wins
- Losses
- Draws
- Best winning round count
- Last outcome
- Last round count
- Last completed Ranch Day
- Last team creature IDs

The overall Coliseum state stores:

- Total attempts
- Total wins
- Total losses
- Total draws
- Completed encounter IDs
- Claimed first-clear encounter IDs
- Recent match history

Recent history is capped at 25 entries.

## Reward Rules

- Only victories grant rewards.
- The first recorded victory for an encounter grants its first-clear reward.
- Later victories grant the smaller repeat reward.
- Defeats and draws grant no Gold, Guild Points, or items.
- First-clear items enter existing Battle Outfitter stock flags.
- First-clear claims are tracked separately from encounter completion.
- A first-clear item is not awarded again on repeat wins.

## Save Format

C1 stores its state as versioned JSON in the existing string-capable save flag:

```text
coliseumProgressV1
```

This avoids a save-schema bump while retaining structured records.

Load behavior:

- Missing state creates an empty C1 progression record.
- Malformed JSON safely resets to an empty normalized state.
- Deleted or unknown encounter IDs are removed during normalization.
- Numeric values are clamped to non-negative integers.
- Match history is re-capped to 25 entries.

## User Interface

The town Coliseum location now opens a dedicated progression hub instead of the old free exhibition team-selection screen.

The hub shows:

- Current standing
- Total record
- First-clear count
- Next objective
- Eligible creature count
- All four divisions
- Unlock state
- AI level
- Enemy level offset
- Recommended level
- First-clear reward
- Repeat reward
- Per-encounter record
- Best winning round count
- Recent match history

The battle screen keeps the target-first interaction:

1. Select the current acting creature.
2. Select an enemy, ally, self, or field target.
3. Choose a compatible equipped move.
4. Queue one action for every living ranch creature.
5. Confirm the round.
6. Review deterministic AI and combat results.

## Regression Coverage

The C1 regression tests cover:

- Novice unlocked on a fresh save
- Bronze locked before the Novice clear
- Ordered prerequisite progression
- First-clear Gold and Guild Point rewards
- First-clear item stock
- No duplicate first-clear item on repeat victory
- Repeat rewards
- Best-round improvement
- Loss recording without rewards
- Malformed progression JSON recovery
- Unique enemy IDs
- Configured enemy level offsets

## Deliberately Deferred

C1 does not add:

- Authored enemy teams
- Randomized enemy rosters
- Multiple encounters per division
- Combat XP
- Creature level-up rewards
- Persistent battle damage
- Fatigue or injury consequences
- Equipment or manual drop tables
- Creature reward encounters
- Daily or weekly Coliseum limits
- Ticket or entry-fee systems
- Ranked PvP
- Seasons
- Leaderboards
- Spectating
- Battle replays

These belong to later Coliseum content, progression, and online milestones.
