# Vale’s Adoption Hearth B — Hearthside Welcome

## Approval

The user selected B and requested letter grades alongside stat numbers (or a switch). The screen displays both together: each of the six stats has its number and a letter-grade badge. Accessible labels include the full stat name, number and grade. The same deterministic gameplay preview supplies the displayed values and the adopted creature.

The existing Market is an adoption service, not an item Buy/Sell shop. The two reviewed concepts were A — Adoption Ledger (list beside the selected creature) and B — Hearthside Welcome (open scenic stage and bottom arrival dock). This implementation follows B.

## Presentation and behavior

A warm illustrated hearth scene sits behind the selected creature, compact Tamsin panel, parchment placement details and paginated arrivals. Existing creature profile paths supply the selected full-body image with `object-fit: contain`; existing portraits supply dock thumbnails. Back to Town and Menu have dedicated header space. The shared navigation component accepts an optional destination while retaining Ranch as its existing default.

All main-screen content fits the viewport. Phone layouts move Tamsin’s actions into a compact row; short landscape layouts keep numbers and grades, habitat status, price and actions visible together. Full Profile, conversations, welfare/trust information, confirmations and results are native scrolling dialogs. The full existing profile tabs remain available.

Adoption checks sold status, matching habitat, capacity and Gold before confirmation. The review shows the fee, habitat occupancy change and balance after the fee. Refresh reviews its cost and explicitly explains that it replaces the current board. Both confirm handlers have duplicate-submission guards and revalidate the quoted listing/fee or board/week/refresh count. Cancel performs no transaction. Automatic daily/starter rewards remain handled by the existing save flow; the result displays the live saved Gold balance.

Trust information shows actual fee discounts, combined special-placement chance and current refresh cost from gameplay helpers. Adopting or refreshing preserves the existing trust awards and rules. No balance constants, save schemas or creature assets changed.

## Asset provenance

`public/images/ui/interiors-v1/market.webp` was generated from the approved B concept with its panels, text, controls and placeholder figure removed. The resulting full-width room preserves the hearth, timber beams, greenery and rug. It is a background only; interface and existing creature artwork are separate live elements. The concept’s neutral silhouette is not shipped.

## Validation

Production Next.js build and TypeScript pass. All 141 regression tests pass. Targeted ESLint has no errors (two image warnings and the existing navigation effect warning).

Production Chromium checks cover 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390. Checks include viewport and document fit, no main scroll regions, pointer hit-testing, panel bounds, every arrival through pagination, exact displayed stat numbers/grades, expanded profile tabs, trust/conversation dialogs, cancellation, one adoption, correct fee/capacity/creature data, refresh cost and preservation of adopted creatures, Menu focus return and Back to Town. Phone and landscape checks additionally cover full habitats, insufficient Gold and trust discounts. Screenshots were visually reviewed.

Local UI checks substitute neutral image placeholders for creature art. Existing artwork files are neither regenerated nor modified. The sparse checkout also excludes large breeding-scene collections; the full asset-preparation pipeline was not run locally, and its ignored build-only manifest stub is not committed.

Published to the existing branch preview and draft PR 21. Keep the PR draft and unmerged.
