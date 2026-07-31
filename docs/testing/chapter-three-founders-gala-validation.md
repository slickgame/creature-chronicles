# Chapter 3 Act III — Manual Validation

Manual browser and iPhone validation is deferred until the stacked Chapter 2–3 sequence is ready for a full playthrough.

## Desktop progression

1. Load a save with **The Patron Circuit** complete.
2. Confirm the Ranch Hub displays only **Chapter 3 · Act III — The Founders' Gala**.
3. Open the journal and review the Founders' Plaza invitation.
4. Confirm only the two plans belonging to the selected Act II patron appear.
5. Confirm one plan is always free.
6. Select the free plan and verify no resource is deducted before hosting.
7. Host the gala and confirm:
   - the plan cost is charged once;
   - a score breakdown appears;
   - Community, Celebrated, or Landmark outcome appears;
   - reopening or reloading does not reroll the result.
8. Confirm the report cannot be finalized on the same Ranch Day.
9. End the day and reopen the journal.
10. Finalize the council report and verify one-time Gold, Guild Points, Materials, Town Prestige, representative XP, and Affection.
11. Attempt to finalize again and confirm no duplicate reward.

## Paid-plan checks

### Registry

- Patrons' Banquet costs exactly 75 Gold.
- It projects and records 8 more preparation points than Open Ledger Showcase.

### Builder

- Showcase Pavilion costs exactly 4 Materials.
- Volunteer Works Fair remains available at zero resources.

### Rose Lantern

- Lantern Reception costs exactly 1 Rumor Token.
- Public Salon Evening remains free.
- House-rule acknowledgment is required.
- No romantic or sexual interaction is required.

## Town map

1. Enter Town after Act II completion.
2. Confirm Founders' Plaza appears separately from The Rose Lantern and Coliseum controls.
3. Confirm the button is reachable at desktop and mobile widths.
4. Open the plaza and verify it displays the same save-backed state as the Ranch Hub journal.
5. Complete or advance a gala step from Town, return to the Ranch Hub, and confirm the state matches.

## Legacy checks

### Guild

- Generate or inspect unfinished current-week contracts before finalization.
- Finalize the gala and reopen the Guild.
- Confirm the gala percentage and route Guild Point bonus apply once.
- Reopen repeatedly and confirm no compounding.
- Advance to a future week and confirm new contracts receive the bonus.
- Confirm completed and expired contracts are unchanged.

### Builder

- Inspect one unbuilt project before finalization.
- Finalize the gala and confirm displayed Gold and Materials costs decrease by the expected amount.
- Builder patron route should total 18% with its Act II charter.
- Other routes should receive the shared 3% gala discount.
- Commission a project and confirm the displayed amounts equal the deductions.

### Rose Lantern

- Confirm the hospitality card displays combined Act II and Act III rewards.
- Work one shift and verify the displayed Gold, Trust, and Rumor Token bonuses.
- Confirm the shift can still only be completed once per day.

## iPhone / installed web app

1. Open the Vercel deployment in Safari or the installed Home Screen app.
2. Confirm the Founders' Plaza town button has a minimum practical touch target.
3. Open and close the gala journal with touch only.
4. Confirm the modal respects notch and Home-indicator safe areas.
5. Verify plan cards, score breakdowns, and report controls do not overflow horizontally.
6. Export a `.ccsave` after gala completion and import it into a separate slot.
7. Confirm outcome, Town Prestige, legacy bonuses, and story completion persist.

## Known non-blocking warnings

- The asset validator retains the existing player-to-player scene fallback warning.
- Dependency audit findings predate this patch.
- The repository's image-heavy checkout can make GitHub Actions checkout substantially slower than tests and build.
