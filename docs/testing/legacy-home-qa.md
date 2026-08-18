# Legacy Home QA

Use the PR #20 Vercel Preview Deployment for Legacy testing. Do not use the production `master` build for this checklist because the full Legacy stack is still isolated on `feature/creature-career-records-a2`.

## Fast retirement and Hall setup

1. Load a disposable test save.
2. Enter **Dev Tools** from the Ranch.
3. Under **Add Test Data**, add a fresh creature if you want to avoid changing an established creature.
4. Scroll to **Legacy Test Lab**.
5. Select the fresh creature.
6. Press **Prepare Retirement Candidate** for an ordinary retirement test, or **Prepare Hall-Ready Candidate** to test the Hall path.
7. Return to the Ranch.
8. Open the creature from the Ranch Roster or its Habitat and open the full Legacy profile.

The Legacy Test Lab only prepares progression. Use the real player-facing Retirement panel for the permanent action so the confirmation dialog, active-roster removal, Heirloom creation, archive, Chronicle, Hall, and save persistence all receive manual coverage.

## Ordinary retirement test

1. Prepare a retirement candidate.
2. Confirm the Retirement panel says the creature is ready.
3. Press **Retire & Create Heirloom**.
4. Cancel the first confirmation once and verify nothing changes.
5. Repeat and confirm retirement.
6. Verify the creature disappears from active Ranch, Habitat, breeding, training, and battle selection.
7. Open the Chronicle / Legacy archive and verify the creature remains viewable.
8. Verify one new Heirloom appears and its name matches the retired creature.
9. Reload the page and verify the retirement and Heirloom persist.
10. Close the browser or Home Screen app completely, reopen it, and verify the same state persists.

## Hall of Legends test

1. Use a different active creature and press **Prepare Hall-Ready Candidate**.
2. Confirm its Legacy profile reports **Hall Eligible: Yes**.
3. Press **Retire & Induct into Hall**.
4. Confirm the warning dialog.
5. Verify the retired creature is permanently listed as a Hall Legend.
6. Verify exactly one Heirloom is created for the creature.
7. Verify the Chronicle contains both retirement and Hall-induction history.
8. Reload twice and confirm no duplicate Hall entry, Heirloom, Prestige, or Chronicle event appears.

## Guardrail tests

- With only one active creature remaining, confirm retirement is blocked.
- Lock a creature and confirm retirement explains that it must be unlocked.
- Put a creature in Training Grounds and confirm retirement remains blocked until collection.
- Use a creature in an active pregnancy and confirm retirement remains blocked until the pregnancy resolves.

## Mobile layout pass

On iPhone, test the same flows in portrait and landscape. Pay special attention to:

- Legacy Test Lab controls remaining reachable by scrolling.
- Legacy profile panels not overflowing horizontally.
- Retirement confirmation actions remaining reachable above the Home indicator.
- Retired archive and Hall cards remaining readable at narrow width.
- Returning from a Legacy profile to the Ranch without losing the selected save.

## Reporting bugs

For each issue, record:

- device and browser;
- portrait or landscape;
- save slot and Ranch Day;
- exact screen and button pressed;
- what happened versus what was expected;
- whether a reload reproduces it;
- a screenshot when the problem is visual.

Do not clear browser storage while investigating a save-state bug. Export the save first if the bug may be useful for reproduction.
