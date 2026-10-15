# Ranch House growth planner — 2026-10-15 (UTC)

The House Care page now opens a read-only, illustrated growth planner. One page shows the three-night food reserve; four pages compare purchasable family habitats; each actual weekly arrival gets its own adoption page. A quick selector and Previous/Next controls reach every choice. Artwork can be minimized. Creature roster moves to Records to keep each House page to three actions.

## Live comparisons and limitations

- Exact habitat Gold/Wood costs come from the housing definitions. Spendable Wood excludes reservations. Missing Wood, insufficient Gold, the shared builder crew and paid construction/owned states are explicit. Already paid housing has zero further purchase fee. New habitats are empty and take one night to complete.
- Adoption offers use the current market, Trust-adjusted fee, sold status and real unlocked housing/capacity. Stale weeks are projected with the same market synchronization as the actual destination, without writing the save. Sold offers remain visible as adopted; no replacement or refresh is assumed.
- Food uses the existing stock-only feeding forecast for three nights, current residents and current feeding settings, excluding creatures away at training. Reserves are protected. Top-up Gold uses the standard ration price and is labeled an estimate, not Pella's exact bundle checkout fee.
- After-fee balances subtract the selected fee and current residents' food top-up estimate. Adoption pages separately show the arrival's additional nightly food requirement; those extra nights and future housing costs are explicitly excluded. Future work, income, rewards, births and arrivals are never assumed.
- The planner never grants resources, reserves Gold or makes a purchase. Transactions remain in the existing reviewed purchase screens.

## Navigation

Petra receives the selected family through the existing Builder's Yard handoff. Tamsin, Pella, production and capacity improvements use existing routes. The Depot and Adoption Hearth now use Previous screen rather than forcing Town, so direct House links return to the selected planner page. Petra retains her nested catalogue → Yard → Town path; Town’s Ranch action restores the plan. House returns to Care. Planner state is session UI state only, resets on save changes and is not added to the save schema.

## Art provenance

No new raster art was necessary. Reused approved House and habitat illustrations from `public/images/ui/ranch-v3/`, surveyed/building views from `public/images/ui/ranch-stages-v1/`, canonical arrival profile art, existing parchment texture and the shared SVG RanchIcon system. Original generation prompts and manifests remain in `RANCH_ART_PROMPTS_2026-10-14.json` and `HABITAT_STAGE_ART_PROMPTS_2026-10-15.json`. Approved creature art is unchanged.

## Validation

- 316/316 regression tests pass, including two new live-budget/transaction-parity checks.
- Production Next.js build and TypeScript pass; changed-file lint has zero errors and 12 existing image warnings across the changed screens.
- Production browser QA passes every page at 1440×900, 390×844 and 844×390, for unbuilt/building/owned states, with no scroll or offscreen controls. Minimize/expand, Petra/Pella/production/Tamsin source returns, selected page and House Care restoration pass with no JavaScript page errors. Screenshots were visually reviewed; see archived review. Missing legacy art in the sparse checkout is intercepted only by the test harness; production code has no placeholder overrides.

PR #21 remains draft and unmerged. Push and Vercel deployment status are reported separately at publication.
