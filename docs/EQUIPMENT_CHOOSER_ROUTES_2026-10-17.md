# Shared equipment chooser routes — October 17, 2026

Inventory, the creature-card Equipment gallery and Battle Outfitter Equip actions now open the approved B roster/comparison chooser, then the shared confirmation and persisted-save receipt. Removal retains its direct B review.

EquipmentActionFlow owns recipient selection and mounts the transaction controller only when Review equip opens, so its quote captures the chosen recipient and current exact copy. Selecting or cancelling never saves. The parent gallery/bench remembers the chosen recipient. A 250ms confirmation readiness guard prevents a double-click on Review equip from confirming the new window. Existing stale-review checks, locks, copy ownership, training and gauntlet blockers remain enforced by the shared quote/reducer.

Available owned equipment can open the chooser without a preselected Inventory recipient; an unavailable initial recipient does not prevent choosing another eligible creature. Outfitter availability depends on an actual free copy, while recipient eligibility is checked inside the chooser and again at confirmation. General shop/browse recipient selectors remain selection-only controls.

## Validation

- Production Next build and TypeScript passed.
- Six focused transaction/snapshot tests passed; ESLint: zero errors, 17 existing image-performance warnings.
- Actual production-build browser navigation through Inventory, creature-card Equipment and Outfitter passed, with zero page errors.
- Chooser and expanded nine-change preview checked at 1440×900, 390×844, 360×740 and 844×390 for each route. Screens fit the viewport; phone sections, stat pages, atlas icons and lost-set warning remain available.
- Each route: chooser cancel and confirmation cancel left save unchanged; switching Mira → Rook survived cancellation/reopening; double-click Review equip did not save; double-click Confirm equip saved once and retained the receipt; the exact selected copy went to Rook, all upgrades and other copy owners remained unchanged; no equip Gold charge; reload retained equipment.
- Synthetic independent browser saves only. Local QA substitutes a workshop background for unrelated legacy images absent from this sparse checkout. Production equipment and canonical creature assets are unchanged.
- Hosted gameplay behind deployment protection was not exercised; branch deployment status is tracked separately. PR 21 stays draft/unmerged.

Screenshots: `validation/equipment-chooser-inventory.webp` and `validation/equipment-chooser-outfitter-phone.webp`. Structured results: `validation/equipment-chooser-routes-2026-10-17.json`.
