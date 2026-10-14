# Enhancement milestone cards — 2026-10-14

A dedicated illustrated preview for +3/+6/+9/+12/+15 opens from Milestone rewards. Five keyboard-focusable buttons show Reached/Preview state. Each page shows the exact selected equipment instance’s main-stat progression, this milestone’s new/improved substat and before/after value, substat count, cumulative Gold from current level, and remaining balance/shortfall. Earlier milestone rewards are explicitly distinguished from the currently highlighted milestone. Reached pages show the original level-before-milestone change. No mutations or purchases occur in this view; Review upgrade still buys one guaranteed level. Gold & food budget remains available separately.

Responsive landscape view uses two columns; portrait centers a single card. Static teal selection glow and reward gradient avoid flashing/animation. Existing equipment stats, enhancement costs, grade and passive mechanics are unchanged.

## Art provenance

Built-in image generation, new `public/images/ui/enhancement-v1/forge-crest.webp`, optimized to 384×365 RGBA WebP (50,330 bytes). Alpha range verified 0–255. Existing parchment reused. Numbers and stat labels are real UI text.

Exact generation prompt:

> Use case: stylized-concept. Asset: transparent fantasy RPG equipment enhancement crest for Creature Chronicles. A single elegant circular bronze-gold forge medallion with five small teal crystal points around its perimeter, subtle engraved anvil at the center, crisp sharp anime-painterly finish, warm highlights, restrained magical teal sparks closely surrounding the rim. Centered front view, balanced silhouette, clean readable at small size. Isolated on genuine transparent background, no words, numbers, letters, UI panels, characters or watermark. Entire crest visible with generous transparent padding.

## Validation

Direct optimized Next build passed. Scoped lint zero errors, four native-image optimization warnings. Eleven enhancement/economy tests passed. Browser exercises every milestone of a +3 Grade B Duelist Saber across 1440×900, 390×844, 844×390, verifying reached state, exact cumulative costs, crest decoding, no dialog overflow, return to selected equipment and zero save mutation. Initial regular popup overflow in landscape was corrected to the dedicated responsive view; final screenshots reviewed.

Next: improve the actual upgrade receipt with the before/after main stat and a highlighted milestone reward, while preserving exact single-level payment and duplicate protection.
