# Chapter 2 Act II — Woodline Aftermath manual validation

Automated tests and the production build run in GitHub Actions. The following browser checks remain deferred until manual testing is practical.

This checklist accompanies the stacked Act II patch and should be completed after both Chapter 2 pull requests are integrated.

## Setup

1. Use a save that has completed Chapter 2 — Trouble Beyond the Fence and chosen a doctrine.
2. Return to the Ranch Hub.
3. Confirm the Act I launcher is replaced by **Chapter 2 · Act II — The Woodline Aftermath**.

## Progression

1. Review the aftermath and confirm the objective advances to emergency recovery.
2. Test recovery with at least 3 Materials and confirm exactly 3 Materials are spent.
3. On a separate save or imported copy, test recovery with no Materials and less than 90 Gold; confirm volunteer repair advances the story without a resource lock.
4. Complete the doctrine operation and confirm the displayed permanent effect matches the doctrine selected in Act I.
5. Test one Guild contribution route: 6 Feed, 4 Materials, or 120 Gold.
6. Confirm unaffordable contribution buttons are disabled.
7. Confirm the story remains at **Wait for the Woodline Report** during the same Ranch Day.
8. End the day once and confirm the next morning unlocks the final report.
9. Read the report and confirm 150 Gold, 3 Guild Points, and 4 Materials are granted once.
10. Reopen the journal and confirm the completion reward cannot be claimed again.

## Doctrine consequences

### Fortified Perimeter

- Threat readout gains 5 Security after the operation.
- A later failed predator defense reports reduced ranch damage.

### Trail Wardens

- A forced intercepted predator event starts at lower HP than before the operation.
- The event summary mentions the additional opening reduction.

### Quiet Pastures

- Threat readout loses 4 Predator Pressure after the operation.
- A later failed predator defense preserves up to 2 Feed.

## Responsive checks

- iPhone portrait: launcher stays within safe areas and the modal scrolls internally.
- iPhone landscape: objective actions and contribution cards remain reachable.
- Desktop: the two-column journal layout remains readable without covering Ranch Day controls after closing the modal.

## Regression checks

- Chapter 1 tutorial still uses its original guided journal.
- Chapter 2 Act I still progresses through tracks, Petra, construction, patrol, defense, and doctrine.
- Random predator events remain deterministic and cannot reroll on reload.
- Victory rewards and defeat penalties remain idempotent.
- Ranch Day advances exactly once.
