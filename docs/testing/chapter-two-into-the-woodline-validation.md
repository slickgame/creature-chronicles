# Chapter 2 Act III — Into the Woodline manual validation

Automated regression and production-build validation run in GitHub Actions. These gameplay and responsive checks remain deferred until manual testing is practical.

## Setup

1. Use a save that completed **The Woodline Aftermath**.
2. Return to the Ranch Hub.
3. Confirm the launcher reads **Chapter 2 · Act III — The Den Beyond the Stones**.
4. Confirm Act I and Act II launchers are no longer visible.

## Expedition routes

1. Review the Guild map and confirm the journal advances to route selection.
2. Verify **Cautious Survey** is always available and costs nothing.
3. Verify **Swift Pursuit** requires and deducts exactly 80 Gold.
4. Verify **Baited Trail** requires and deducts exactly 4 Feed.
5. Confirm route selection immediately saves and opens the existing predator battle flow.
6. Reload before battle and confirm the selected route, event ID, enemy starting HP, and resource cost do not reroll.

## Deepwood battle

1. Confirm the encounter title is **Chapter 2 — Into the Woodline**.
2. Confirm the opponent is **Ashfang's Deepwood Pack**.
3. Confirm the enemy roster is Ashfang, Briarstep, and Old Stonejaw.
4. Confirm the selected route's opening HP appears in the briefing and battle state.
5. Confirm champion AI is displayed.
6. Confirm target-first selection, move information, battle log, animation speed, and reduced-motion controls still work.
7. Test victory, draw, and defeat on separate save copies; each should return to the regional decision.
8. Confirm defeat applies only ordinary recoverable predator consequences and never blocks the chapter.

## Regional policies

### Protected Woodline

- Grants the base completion reward plus 1 Guild Point.
- Future live threat readouts show 6 less Predator Pressure.

### Stone Boundary

- Grants the base completion reward plus 4 Materials.
- Future live threat readouts show 8 more Security.

### Ranger Network

- Grants the base completion reward plus 75 Gold.
- Future intercepted predator events begin with another 5% HP reduction.
- Future interception calculations receive the persistent Ranger bonus.

For every policy, reopen the completed journal and confirm rewards cannot be claimed twice.

## Responsive checks

- iPhone portrait: launcher remains inside safe areas and does not cover Ranch Day controls after closing the modal.
- iPhone landscape: all route and policy cards remain reachable through internal modal scrolling.
- Desktop: the two-column journal remains readable and the hero art does not obscure objective text.
- Predator battle: six portraits remain in a straight horizontal formation at common mobile and desktop widths.

## Regression checks

- Chapter 1 guided progression remains unchanged.
- Chapter 2 Act I still handles tracks, Petra, fortification, patrol, defense, and doctrine.
- Chapter 2 Act II still handles aftermath, recovery, operation, Guild aid, next-day report, and doctrine upgrades.
- Natural predator incidents remain deterministic and cannot reroll on reload.
- Predator rewards, penalties, injuries, and story progression remain idempotent.
- Portable save export/import preserves Act III stage, route, event, outcome, and policy flags.
