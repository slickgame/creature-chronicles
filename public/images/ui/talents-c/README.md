# Talents C — first ten production icon assets

This asset kit supplies the complete ten-talent launch lineup: nine general talents plus canine Guard Dog. The 73 additional retained definitions use the approved generic painted talent symbol for compatibility. Dedicated legacy icons are outside initial-release scope. See the runtime documentation for C register integration status.

## Contents

- icons/*.webp: ten 192×192 true-alpha, lossless RGBA icons, directly rendered without masks/recolors.
- source/core-atlas.png: untouched generated source atlas, 1983×793 RGBA, 5 columns × 2 rows.
- core-icon-manifest.json: stable IDs, source crop cells, alpha bounds, dimensions, byte counts and SHA-256 hashes.
- core-icon-review.html: read-only contact sheet at 24/32/48/96px on navy and parchment.
- approved-concept.webp: the user's locked C reference. Its recipe-XP limitation is historical; the live engine now applies Eager Learner to Crafting and Cooking.

Regenerate asset extraction with:

python scripts/package-talent-core-icons.py PATH_TO_GENERATED_PNG

Packaging only isolates the generated cells and contains their complete motifs in 192px canvases. It does not repaint, recolor, mask or remove any background. Generated alpha remains intact. The clipping check uses alpha >16 for inspection only because the source contains a few opacity-1..6 pixels at grid edges; the output preserves source alpha inside each cell. Exact original source is retained unchanged.

Atlas order: Eager Learner, Sound Sleeper, Diligent, Efficient Worker, Sure Strike / Thick Hide, Light-Footed, Hot-Blooded, Lasting Vigor, Guard Dog.

## Shared data

src/data/talents/talentPresentation.ts derives all numbers from the actual owned grade and separates active effects, planned inheritance effects, retired chore bonuses and informational role strengths. Source stays separate from applicability. Guard Dog condition text reads the same farm-security engine as gameplay. Unknown saved talents retain their descriptions with unverified availability. Browsing never mutates saves.

## Generation provenance

Built-in image generation with transparent_background=true and the last visible approved C concept as reference. No CLI fallback was used. Original generated filename: exec-e82d1b9a-ea03-462f-a93f-6559f2aadf3c.png. The generated source is copied unchanged above and hashed in the manifest.

### Exact prompt

Use case: ui-mockup. Asset type: production RGBA game icon atlas for Creature Chronicles, not a screen mockup.
Create EXACTLY TEN isolated painterly talent icons on a genuinely TRANSPARENT background, arranged in a mathematically regular 5-column by 2-row grid. Desired canvas 2000x800 pixels (five square 400x400 cells across, two rows). Every cell contains one centered icon, all art completely inside the central 76% of that cell with generous empty transparent gutters. No labels, letters, numerals, frames, squares, borders, UI, backgrounds, checkerboard, extra ornaments between icons, or cast shadow extending beyond a cell.
Style reference: attached approved Talents C concept. Copy the soft carved ivory, warm brushed gold, subtle painterly shading, dimensional craft and clear silhouettes of its book/star and moon/stars talent symbols. This is the approved game's ivory/gold icon family, not flat vector art or glossy plastic. A very subtle dark outline is fine for visibility on dark navy and light parchment. Make forms readable at 24/32px while handsome in a 96px detail view. Ivory is opaque cream, gold accents restrained, recesses warm brown. Keep all ten icons consistent in scale and finish. No character portraits or game screen elements from the reference.
MANDATORY cell order, left to right:
TOP ROW:
1 Eager Learner: open ivory book with a single small gold five-point star above its upper-right page. Match the concept's book/star.
2 Sound Sleeper: ivory crescent moon with two small gold stars inside/near the open crescent. Match the concept's moon.
3 Diligent: an ivory work glove beside a small filled gold-edged wicker resource basket, simplified bold silhouette.
4 Efficient Worker: one ivory gear partly behind a bold gold Energy lightning bolt.
5 Sure Strike: a short ivory blade with gold hilt crossing one small gold target ring, distinct readable sword shape.
BOTTOM ROW:
6 Thick Hide: an ivory shield with one thick layered hide/leather plate, warm gold rim. No letter.
7 Light-Footed: one ivory animal paw print with one small gold wing sweeping back, clear paw plus wing.
8 Hot-Blooded: an ivory heart framing a small warm golden flame, clear flame inside heart.
9 Lasting Vigor: a solid ivory heart with a small gold Energy spark/lightning inset and a gold circular endurance arc behind it. Must look different from flame-heart.
10 Guard Dog: a sculpted ivory canine head in a small gold-edged shield, recognizable pointed ears and canine muzzle, not a human or lion.
Equal transparent square cells, not a free-form collage. Preserve true alpha around all ten complete motifs; no backdrop and no baked checkerboard. Show only the ten requested pieces of art.
