# Ranch Dossier — reference fidelity correction

The user rejected the first implementation as too similar to the old roster. The corrected direction explicitly combines reference A's warm scenic creature dossier with reference B's persistent left-hand creature selection column. Do not adopt B's dark color theme.

## Layout

- Search, filters, compact cards and pagination live in the left selector. Selecting any card updates the current profile in place. The selector remains available on desktop, tablet and phones.
- The central card layers approved, uncropped full-body artwork over a new sunny ranch background. Name, rarity, level, readiness, Energy and Affection sit on the card, leaving the right panel for the active tab.
- The right dossier has all six tabs, large three-by-two stat tiles, bold stat silhouettes, numeric values and grades, real growth progress and an explicit next-level gain summary from the existing progression helpers.
- Switching creatures retains the active tab. Phone cards use a narrow left rail, with the main dossier stacking to the right. Long content scrolls inside the workspace.
- Habitat, Inventory and Profile & Care remain primary actions. Breeding and Compare are under More actions; comparison also remains in the selector.

## Assets and provenance

`public/images/ui/ranch-dossier-v2/portrait-meadow.webp`: generated using built-in image generation with the user's reference A as style input; optimized to 900px wide WebP. No creature redraws. The six solid SVG stat symbols and scalable brass corner were authored as native vector assets, matching the existing icon delivery method. Reuse the approved parchment and botanical assets from v1.

Exact scenic generation prompt:

Use case: stylized-concept. Production game UI asset for Creature Chronicles Ranch Dossier. Reference image shows approved style only: warm sunlight, idyllic rustic ranch, sharp anime-painterly rendering. Generate ONE portrait 2:3 scenic background plate WITHOUT any character, text, frame, UI or logo. Eye-level quiet sunlit dirt path leading into a farm meadow, weathered wooden split-rail fence near the left and right edges, distant cream-and-timber farmhouse and barn in the upper middle distance, blue sky and soft green mountain ridge at top. Small meadow flowers low at outer corners. Open visually quiet central 65 percent is a full-body character placement zone, pale golden ground and muted green meadow, no tall objects across the center. Warm golden afternoon light, refined painterly detail, crisp edges near the fence, atmospheric soft distance. Match the countryside inside the large creature portrait in reference image 1. This is an empty reusable landscape plate, not a screen mockup. No person, animal or humanoid, no weapons, no words, no ornaments, no parchment.

## Validation

Production build and TypeScript pass. Configured regression suite: 194 passed, 0 failed. Scoped lint: zero errors, six existing image/effect warnings. Browser validation covers all five starters through the selector, six tabs, preserved tab choice, four viewport sizes, keyboard navigation, rename/protection persistence, release cancellation, expanded profile, inventory and comparison. Final browser run passed at 1440×900, 1280×720, 390×844 and 844×390 with no horizontal overflow. Desktop and phone screenshots were visually reviewed. The scenic card opts into fixed-art sizing to prevent the global content-sizing rule collapsing its mobile height.

The sparse checkout still lacks legacy Bunny and Bovine art; those use the existing fallback during local QA. Approved feline/equine art and the new scenic background are real assets. No save schema or balance changes. PR #21 stays draft and unmerged.
