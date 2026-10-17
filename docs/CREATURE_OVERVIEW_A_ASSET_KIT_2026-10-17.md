# Creature Overview A — production art kit

Target: the user's second image, `image(20261017-210340).png`, approved portrait-led Overview A. This is a production asset kit and a read-only browser assembly, not a live gameplay integration or an actual transaction screenshot.

## Complete inventory

- 90 original editable SVG assets: 8 structural frames, 40 control/card state surfaces (8 families × normal/hover/pressed/disabled/focus), 8 metadata/status plaques, 26 section/record/action symbols, 3 ornaments/backgrounds, 5 meter assets.
- 3 generated painted RGBA vital icons: red heart (shared by Affection, Hearts and heart pips), gold lightning and gold star. Untouched PNG masters are in `source/`; 256px lossless WebP runtime files are in `sculpted/`. Every source has actual alpha (0–255). Built-in image_gen was used; exact prompts are in generation-prompts.json. No paid CLI fallback was used.
- Local Tinos Regular/Bold fonts reused from forge-slate-v2, including the SIL Open Font License. Both weights are explicitly declared; the regular-only declaration in the previous runtime must be replaced when integrating.
- tokens.json: palette, typography, border slices, icon sizes. icon-map.json: every visible label mapped to its symbol.
- overview-kit.css: scoped production classes, nine-slice frames, real text, colored meters, heart pips and responsive desktop/phone composition.
- preview.html + preview.js: read-only assembled sample using canonical Mira artwork and existing meadow backdrop; sample values only, no game state/save APIs.
- catalog.html: every actual production asset and state, not a concept redraw.
- validation.json: browser fit, missing-image and error checks at 1280×920, 1440×960, 390×844 and 360×740.

## Integration details

Use nine-slice border images. Ornate frames have 40px source corner zones, with 13–24px rendered borders. Simple frames/control surfaces use 16px slices and 7–10px rendered borders. Preserve the corners; do not scale a whole frame as one stretched rectangle. A complete state family is provided even when the assembly uses a CSS focus outline instead of the focus surface.

Desktop: portrait ~35%, right content ~65%; eight tabs in two rows of four; four compact vitals; all four secondary records; three footer actions. Phone: Menu + title, Previous screen + Choose creature, compact portrait/identity, section picker, four vital cards, More overview, three footer actions. The kit's h1 is 42px desktop/28px phone, section title 34px/25px; body 20px desktop/15px phone. Use the explicit bold face rather than browser-synthesized weight.

Artwork remains the existing approved `public/images/creatures/feline/nyla/nyla_01_full_body.png`. Do not replace it with the concept's AI redraw. The scenery remains `public/images/ui/ranch-dossier-v2/portrait-meadow.webp`. These and licensed fonts are included unchanged in the download archive, at original project-relative paths.

Keep all text as text. All surfaces are text-free and accept longer labels. Bind real values to meters and pips; 91/91, 50/100, 4/4, 0/75 and Generation 1 are assembly samples. Hearts are not combat HP. Retain the eight creature sections, complete detail text, search/filter/sort/compare, existing actions and parent navigation. Put additional links in existing navigation rather than discarding them to match the concept's simplified header. Preserve equipment's shared transaction windows and all protections. For shorter desktop/landscape layouts use existing focused pages, not clipped controls. See the existing Overview runtime QA for supported game breakpoints.

## Build and review

Run `python scripts/build-creature-overview-assets.py` to deterministically rebuild the SVG assets. Run a static server with `public/` as its root and open `/images/ui/creature-overview-a-v2/preview.html` or `catalog.html`. The read-only preview's buttons explain that gameplay is not connected; More overview switches the phone sample page.

The assembled kit matches the concept's visual language and component hierarchy. AI concept typography and the redrawn character are not pixel-identical source assets; production uses the explicit licensed font and canonical creature. This kit does not claim an already-deployed live-game replacement.
