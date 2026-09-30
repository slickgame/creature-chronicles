# Ranch Office concepts and ranch navigation cleanup

## Status

The user approved proceeding with the ranch overlap fix and two Ranch Office concepts. The Office concepts are awaiting selection; this commit does not implement either Office layout.

## Current Office review

The existing screen mixes repairs, history, condition penalties, capacity, timers and ranch-wide effects into long panels. Upgrade selection uses icon-only buttons. The shared Menu overlaps the Materials counter. Both concepts address those issues with the approved wood/parchment style, explicit upgrade names, current-versus-next benefits, itemized costs, affordability and an in-flow Menu/Back header.

- **A — Upgrade Ledger:** category tabs above a paginated named upgrade list and a large comparison/purchase panel. Prioritizes reading and comparing upgrades.
- **B — Builder's Desk:** category rail, scenic office/workbench with a selected building model, compact comparison/purchase panel, and paginated bottom upgrade dock. Carries forward the scenic Habitat/Breeding direction.

Generated images shown in the conversation are captioned with A/B and illustrative save values. Both use the actual Feline tier 0 → 1 upgrade: capacity 4 → 5, 350 Gold, immediate effect. There is no construction timer or build queue. All six existing categories remain reachable; full tier comparisons, history and confirmations belong in pop-ups. Phone layouts must preserve the no-main-scroll rule.

## Completed ranch correction

At 844×390 the old ranch map was 750 pixels tall, and Today covered the Feline Habitat entrance. At 390×844 the page was 909 pixels tall and the map required horizontal scrolling.

For small or short viewports, the ranch now reserves separate grid rows for the HUD, plot controls/compact Today launcher, map and shortcuts. Building destinations use readable button grids over the map instead of overlapping absolute markers. Four plot pages preserve access to every destination. Today still expands into the existing full ledger. Wide, tall desktop layouts retain their original map placement.

## Validation

Production Next build and TypeScript pass. Chromium checks at 1440×900, 1280×720, 844×390, 390×844 and 360×740 visit all four plots, click every building, open/close Today and Menu, and verify that all controls fit the viewport and receive pointer events. Document width/height match the viewport without scrolling. Phone and landscape screenshots reviewed. Gameplay and saves are unchanged; the existing sparse-checkout build limitation remains documented in the Habitat notes.
