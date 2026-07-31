# Chapter 3 Act I — Guild Exhibition manual validation

Automated regression and production-build validation run in GitHub Actions. These visual, interaction, and responsive checks remain deferred until manual browser testing is practical.

## Setup

1. Use a save that completed **Chapter 2 Act III — Into the Woodline** and selected a permanent Woodline policy.
2. Return to the Ranch Hub.
3. Confirm the launcher now reads **Chapter 3 · Act I**.
4. Confirm the Chapter 2 Act I, Act II, and Act III launchers are no longer visible.
5. Confirm the exhibition journal opens automatically once on the Chapter 3 start day and can be reopened afterward.

## Invitation

1. Open **The Guild Exhibition** journal.
2. Confirm the hero artwork, objective text, progress rows, and close control are readable.
3. Select **Review the Gold-Sealed Invitation**.
4. Reload and confirm invitation progress and history remain recorded.

## Representative selection

1. Confirm each available creature card shows nickname, level, Energy, Hearts, Affection, and all six stats.
2. Confirm favorites appear before otherwise similar candidates.
3. Confirm a creature with less than 18 Energy is absent.
4. Confirm a creature with zero Hearts is absent.
5. Confirm an actively injured creature is absent.
6. Select an eligible representative and reload.
7. Confirm the representative ID, name, condition, and progress remain unchanged.
8. Confirm no creature is deleted, transferred, locked, or removed from its habitat.

## Preparation disciplines

### Bond & Presence

- Is always selectable without Gold or Feed.
- Charges no Gold or Feed when entered.
- Uses Affection, CHA, and WIL in the discipline score.
- Grants the representative the larger Affection increase.

### Working Demonstration

- Requires 3 Feed.
- Does not charge Feed while merely selected.
- Charges exactly 3 Feed on entry.
- Adds exactly 3 Materials after completion.
- Uses STR, DEX, and STA in the discipline score.

### Pedigree Presentation

- Requires 75 Gold.
- Does not charge Gold while merely selected.
- Charges exactly 75 Gold on entry.
- Adds one extra Guild Point after completion.
- Uses CHA, WIL, and FER in the discipline score.

For all three disciplines, confirm the projected score changes when using creatures with different strengths.

## Exhibition result

1. Enter the exhibition.
2. Confirm the representative spends exactly 18 Energy.
3. Confirm the journal records one final 0–100 score and one placement.
4. Confirm the breakdown shows Level, Stats, Affection, Condition, Discipline, and Total.
5. Confirm the representative gains XP and the discipline-specific Affection increase.
6. Confirm even a deliberately weak eligible creature receives **Recognized Exhibitor** and completes Act I.
7. Confirm a highly developed creature can reach Bronze, Silver, or Gold according to the displayed thresholds.
8. Reload after completion and confirm the score, placement, representative, discipline, rewards, and history do not reroll.
9. Reopen the journal repeatedly and confirm rewards and Energy costs cannot be applied again.

## Placement rewards

- Recognized Exhibitor: 120 Gold, 2 Guild Points, +3% weekly contract Gold.
- Bronze Distinction: 180 Gold, 3 Guild Points, +5% weekly contract Gold.
- Silver Distinction: 260 Gold, 5 Guild Points, +8% weekly contract Gold and +1 GP per contract.
- Gold Distinction: 400 Gold, 8 Guild Points, +12% weekly contract Gold and +2 GP per contract.

Confirm the selected discipline's side reward is added after the placement reward.

## Guild reputation

1. Open the Guild Hall during the same week as the exhibition.
2. Confirm unfinished current-week contract Gold rewards increase by the recorded percentage.
3. For Silver or Gold, confirm unfinished contracts also gain the correct Guild Point bonus.
4. Close and reopen the Guild Hall several times; rewards must not increase again.
5. Complete a boosted contract and confirm the displayed amount is paid exactly once.
6. Advance to a new week and confirm newly generated contracts receive the same reputation bonus.
7. Confirm completed and expired historical contracts are not retroactively modified.

## Responsive checks

### Desktop

- Journal remains centered with a readable two-column layout.
- Candidate and discipline cards do not overflow the objective column.
- Hero artwork does not obscure the title or explanatory text.
- Score and reputation cards remain legible at common laptop widths.

### iPhone portrait

- Launcher remains inside safe areas.
- Modal uses internal scrolling and does not cover navigation permanently after closing.
- Every candidate, discipline, and entry button remains reachable.
- Long creature nicknames and six-stat summaries wrap without horizontal scrolling.

### iPhone landscape

- Close control remains reachable.
- Hero height does not crowd out all actionable content.
- Internal scrolling reaches the full score, reputation, and history sections.

## Regression checks

- Chapter 1 guided onboarding remains unchanged.
- Chapter 2 Act I still handles tracks, Petra, construction, patrol, defense, and doctrine.
- Chapter 2 Act II still handles aftermath, recovery, operation, Guild aid, next-day report, and doctrine upgrades.
- Chapter 2 Act III still handles expedition route, Deepwood battle, and permanent regional policy.
- Ranch Day Morning Brief, Active Day, Evening Review, and atomic end-day processing remain unchanged.
- Guild contract acceptance, eligibility, service assignments, donations, quality bonuses, and weekly refresh still work.
- Predator events, Coliseum progression, breeding, Nursery, Market, inventory, and save export/import remain functional.
- Portable save export/import preserves the Chapter 3 stage, representative, discipline, score, placement, rewards, and reputation flags.
