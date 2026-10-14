# Random enhancement rewards and success reveals — 2026-10-14

Supersedes the future-substat preview described in ENHANCEMENT_MILESTONE_CARDS_2026-10-14.md. Continue the existing feature branch and draft PR21.

## Player experience

- Review shows only the guaranteed main-stat increase, exact Gold cost, balance and a mystery reward on +3/+6/+9/+12/+15. Future stat identity and amount are never revealed in previews.
- Success shows the actual before/after main stat and highlights the new/improved substat, including its increment. Reached milestone pages show the saved reward.
- At fewer than four substats, draw uniformly from eligible unowned stats (excluding main stat and fixed passive bonuses). At four, draw uniformly among existing substats. Draw an integer amount uniformly within the grade range. No failure chance, material charge or hidden fee.
- Main stat still grows by 1 per level (HP by 2); Gold costs and +15 cap are unchanged.
- Grade D rolls: 1–2; C: 1–3; B: 2–4; A: 2–5; S: 3–6. HP uses twice these endpoints; Speed is always 1–2. These are Creature Chronicles balance values, not Epic Seven's numeric tables.
- New weapons use Physical Power (Special Power for purely special-power weapons), armor Defense, headgear HP. Hands/feet and accessories retain the catalogue item's authored main-stat choice. Missing fixed-slot bases use D2/C4/B6/A8/S10, with HP multiplied by three. Existing catalogue bonuses are retained as substats/passive bonuses.
- New +0 crafting and Outfitter confirmation previews use the same computed stats as the acquired piece.

Reference consulted: https://epic7x.com/equipment-tutorial/ for fixed weapon/helmet/armor primary stats versus variable other slots. Adapted to this game's five-slot and battle-stat model; not an exact replica of Epic Seven.

## Save and transaction behavior

Equipment-copy records add enhancementVersion, legacyThrough and rolls. Existing pieces retain their original primary stat and every earned deterministic milestone; legacy count-only saves also retain original bonuses. Once migrated, only future successful milestones draw random rewards. Modern copies use slot rules. Roll results are stored per piece, surviving equip/remove, save/reload and battle preparation. Previews, cancellation, invalid/stale requests and insufficient Gold do not draw rewards. Successful upgrades still check expected level and charge once. The deterministic battle audit now injects a seeded equipment RNG; normal play uses Math.random.

## Art and layout

Reuses the generated transparent forge crest from enhancement-v1 and approved parchment. No new raster art was necessary. Exact original generation prompt:

> Use case: stylized-concept. Asset: transparent fantasy RPG equipment enhancement crest for Creature Chronicles. A single elegant circular bronze-gold forge medallion with five small teal crystal points around its perimeter, subtle engraved anvil at the center, crisp sharp anime-painterly finish, warm highlights, restrained magical teal sparks closely surrounding the rim. Centered front view, balanced silhouette, clean readable at small size. Isolated on genuine transparent background, no words, numbers, letters, UI panels, characters or watermark. Entire crest visible with generous transparent padding.

Main-stat and reward panels use real selectable UI text, restrained teal highlighting and a responsive portrait/landscape layout. Confirmation was moved to the same focused full-screen layout to eliminate landscape scrolling.

## Validation

202 regression tests passed, including legacy migration, all equipment +0 through +15, range endpoints, eligible random pools, maximum four substats, exact Gold payment, duplicate/stale rejection, saved rolls and real battle comparison. Direct optimized Next build passed. Final changed-file ESLint has zero errors (existing native-img and hook warnings remain).

Browser QA on the production build: 1440×900, 390×844 and 844×390. Five mystery milestone pages; exact cumulative Gold; cancellation leaves the save unchanged; a +2→+3 Grade B upgrade charges 54 Gold and stores one random roll; success/reached pages display that actual result; reload preserves the record; crest decodes; no page/dialog overflow in the new views. Missing legacy sparse-checkout images are aborted only by the test harness. Screenshots reviewed before publishing.

Next: balance-test low, typical and high random-roll outcomes against early Coliseum encounters, then make item stat details explain slot rules and possible roll ranges in one focused popup. Existing completed balance reports describe the old deterministic rules and should not be treated as current random-roll balance evidence.
