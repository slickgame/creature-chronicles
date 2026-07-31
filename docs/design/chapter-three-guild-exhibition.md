# Chapter 3 Act I — The Guild Exhibition

## Purpose

Chapter 2 established the ranch as a regional survivor and policy-maker. Chapter 3 begins by making that reputation public.

The Guild Exhibition is intentionally not another battle. It introduces a deterministic judged-creature activity that uses the persistent roster, creature condition, Affection, stats, level, and player preparation choice.

## Eligibility

The exhibition begins only after **Chapter 2 Act III — Into the Woodline** is complete.

The Ranch Hub shows one active story launcher at a time:

1. Chapter 2 Act I before the first doctrine.
2. Chapter 2 Act II after the first defense.
3. Chapter 2 Act III after the aftermath report.
4. Chapter 3 Act I after the permanent Woodline policy.

## Progression

### 1. Review the invitation

The player opens a gold-sealed invitation from the regional Guild.

### 2. Select a representative

One ranch creature is selected. A creature is eligible when it:

- has at least 18 Energy;
- has at least one Heart;
- has no active injury.

Candidate ordering favors favorites, then stronger projected exhibition performance.

### 3. Choose a presentation discipline

- **Bond & Presence** — Free. Emphasizes Affection, CHA, and WIL. Grants the representative additional Affection.
- **Working Demonstration** — 3 Feed. Emphasizes STR, DEX, and STA. Returns 3 Materials after the exhibition.
- **Pedigree Presentation** — 75 Gold. Emphasizes CHA, WIL, and FER. Grants one additional Guild Point.

No cost is charged until the player enters the exhibition. Bond & Presence prevents a resource lock.

### 4. Enter the exhibition

Entry costs 18 creature Energy. The score is calculated once and persisted.

Every placement completes Act I. There is no failure lock and no reroll after completion.

## Score

The 0–100 score contains:

- level contribution;
- average capped stats;
- Affection;
- current Energy and Hearts;
- selected discipline contribution;
- a small shiny distinction bonus.

The calculation is deterministic for the same creature state and discipline.

## Placements and rewards

| Placement | Minimum | Reward | Permanent Guild reputation |
|---|---:|---|---|
| Recognized Exhibitor | 0 | 120 Gold, 2 GP | +3% weekly contract Gold |
| Bronze Distinction | 54 | 180 Gold, 3 GP | +5% weekly contract Gold |
| Silver Distinction | 68 | 260 Gold, 5 GP | +8% weekly contract Gold, +1 GP per contract |
| Gold Distinction | 82 | 400 Gold, 8 GP | +12% weekly contract Gold, +2 GP per contract |

Discipline side rewards are added after the placement reward.

## Guild integration

`@/data/guild` routes through `guildExhibition.ts`.

The adapter:

- preserves the existing Guild engine;
- applies exhibition reputation to unfinished contracts for the current week;
- applies the same bonus when future weekly contracts are generated;
- records the week to prevent repeated multiplication or duplicate GP;
- does not retroactively change completed or expired contracts.

## Persistence and safety

The versioned state stores:

- current stage;
- start day;
- invitation state;
- representative ID and name;
- selected discipline;
- final score breakdown;
- placement;
- reward status;
- history.

Rewards, Energy costs, discipline costs, and Guild bonuses are idempotent.

## Deferred continuation

Later Chapter 3 acts can build from:

- the selected representative;
- the preparation discipline;
- the public placement;
- the patrons and officials who noticed the ranch;
- the permanent Guild reward reputation.
