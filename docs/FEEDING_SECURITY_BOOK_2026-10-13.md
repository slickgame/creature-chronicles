# Feeding, Security and food planning — 2026-10-13

## Screens

Feeding now opens a viewport-sized parchment book: tonight's food coverage first, then one resident per page with nightly demand, ingredient priorities and training absence. Changing raw-ingredient feeding opens a confirmation and consumes nothing immediately. Balanced rations, reserves, legacy Feed and manually served meals retain their existing rules.

Budget shows one forecast night per page, the full seven-night shortage, exact Trade-price top-up cost and Gold remaining. Assumptions appear in paged details: current residents/stock only, no future gathering, rewards, births, arrivals or training returns. Food production and prices are unchanged.

Security separates fortifications/condition from the strongest eligible resident Guard Dog. Candidate bonuses and threat reasons/blockers are available through paged details. Guard bonuses never stack; working/resting remain eligible and away trainees remain excluded.

Repair confirmation previews the exact current cost, condition change and resulting Security. Kits take priority over 2 Wood + 1 Stone. Reserved materials stay protected. A synchronous click guard prevents repeat confirmation; the existing repair engine rechecks availability. Receipts separate automatic goal rewards from costs.

Storage/reserves, rations purchases and the Kitchen open in place and return to the same care page. The Kitchen's section dropdown remains functional. Security offers Town navigation for construction upgrades. Existing resource section tabs remain the entry point; Guide, Construction and Orders still need the later layout pass.

## Art provenance

Reused the approved pantry/workbench background, parchment, Balanced rations icon, patrol illustration and canonical creature full-body art. No new images or generation prompts in this update.

## Validation

- Direct optimized Next.js production build and TypeScript pass. Full npm asset preflight still requires legacy breeding images omitted from the sparse checkout.
- Scoped lint: zero errors, three image-element warnings.
- Eleven focused economy, production and predator-event tests pass; no game-engine or save-schema changes.
- All Feeding/resident pages, seven forecast pages, both Security pages and all detail pages checked at 1440×900, 1280×720, 390×844 and 844×390 without content overflow.
- Browser checks: repair cancellation and exact single kit consumption under double-click; material repair costs and reserve blockers; feeding-policy cancel/confirm without immediate food consumption; in-place Storage/Kitchen/ingredient routes; reload persistence.

## Next

Bring Guide, Construction and Orders into paginated layouts, then evaluate broader first-week/advanced-worker production and construction balance. Continue using exact costs and protected reserves throughout.
