# Ranch Office B — Builder’s Desk

## Approval and presentation

The user selected B after reviewing the Upgrade Ledger and Builder’s Desk concepts. The implementation uses a scenic workshop, category rail, selected building model, parchment current/next comparison and paginated upgrade dock. The header reserves space for Back and Menu; related destinations move into More on narrow or short screens. All six categories and ten upgrades remain available.

The background was generated from the approved B composition with painted UI and the model removed, then exported to `public/images/ui/interiors-v1/office.webp` (407,738 bytes). Building models use the existing transparent ranch building PNGs. No creature artwork was changed. Shared parchment, wood, icons and green actions match the approved interiors.

## Responsive behavior

Main content stays within the viewport without scrolling. Upgrade choices paginate according to available dock width. On phones, categories form a compact grid above the model and purchase panel. In short landscape layouts, the duplicate panel title and inline tier path move out of the main view; the selected building label remains visible and All Tiers retains the complete name, description, progression and prices. History, reports, help, records, confirmations and receipts use scrolling native dialogs.

## Gameplay and navigation

Comparison values come from the existing gameplay effect calculator, including tier-zero penalties. Prices, resource shortages, maximum tiers and transactions use the existing upgrade definitions and provider. Canceling confirmations does not spend resources; transaction controls prevent duplicate submission. Receipts show the upgrade charge, any automatic starter-goal rewards and the resulting live balance separately.

Repairs respect the existing kit-first rule, then use five Materials, and remove up to 20 damage. Overview exposes condition, repairs, capacities, timers and ranch effects. Records contains Story Log, Story Images and the existing Breeding Ledger destination. Embedding the story panels removes their floating launchers from the Office. Category and selected upgrade handoffs remain persistent; choosing Overview clears the stale upgrade target.

No balance values or save schemas changed.

## Validation

- Production Next.js build and TypeScript pass; all 141 regression tests pass.
- Targeted ESLint: zero errors, six existing-style image/effect warnings.
- Production Chromium at 1440×900, 1280×720, 390×844, 360×740 and 844×390: all six categories, every habitat upgrade via pagination, contained building images, viewport/document dimensions, no scrollable main regions, pointer hit-testing and content staying inside its panel.
- Purchases update exactly one tier, charge the expected 350 Gold and increase capacity. Cancellation preserves balances. Kit and material repairs deduct the correct stock and damage. Reports, History, Story Log and Story Images open without horizontal overflow; confirmation focus starts on Cancel.
- Additional desktop/phone/landscape states cover simultaneous Gold/GP/Materials shortages, disabled unaffordable actions, maximum tiers, no repairs needed and the second Nursery upgrade. Automatic starter-goal reward receipts match the saved balance.
- Desktop, portrait and landscape screenshots visually reviewed. No browser errors in the main five-viewport suite.

The sparse local checkout excludes large breeding-art collections. The full local asset-preparation pipeline was not run; the ignored local scene-manifest stub and test saves are not committed. See the Habitat notes for that existing limitation. This work updates the existing draft PR and branch preview; it does not merge or deploy to production.
