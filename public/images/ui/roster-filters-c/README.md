# Filters & Sort C asset kit

Selected reference: `../roster-filters-review/options.png`, option C. Concept-only text and sample counts are replaced by actual state. No new raster illustration is required: all painted symbols already exist and are reused directly with alpha preserved.

| Element | Asset |
| --- | --- |
| Drawer frame | `../creature-removal-c/window-ornate.svg` |
| Accordion frame | `panel.svg` (new, nine-slice) |
| Primary / secondary button | `../creature-removal-c/primary-ornate.svg`, `secondary-ornate.svg` |
| Family / Condition | `../creature-overview-a-v2/painted-r4/creatures.webp` |
| Status | `../atelier-v1/hourglass.webp` |
| Pregnancy | `../atelier-v1/egg.webp` |
| Energy | `../creature-overview-a-v2/sculpted/energy.webp` |
| Rarity / Favorites | `../creature-overview-a-v2/painted-r4/talents.webp` |
| Locked | `../care-b/icons/lock-closed.webp` |
| Details / Shiny | `spark.svg` |
| Variant / Origin | `diamond.svg`, `pin.svg` |
| Sort / Direction | `sort.svg`, `direction.svg` |
| Reset / accordion / dropdown | `reset.svg`, `chevron.svg`, `down.svg` |

New SVG assets are reproducible through `scripts/build-roster-filter-assets.py`, with warm ivory-to-gold gradients and rounded strokes matching the concept controls. Fonts are the existing licensed Tinos Regular and Bold WOFF files under `../forge-slate-v2/fonts`; font weight is explicit, not synthesized. Runtime CSS is `src/features/collection/RosterFiltersC.module.css`.

Desktop: maximum 610px drawer, aligned to the right of the existing 1440px composition, 30px title, 18px section controls, 17px field values, 32px field artwork, two-column condition fields, 9px section gaps, persistent count and footer. Phone: full available width minus 16px, 25px title, 17px section controls, 15px field values, 24px artwork and single-column fields. Short screens use two-column compact fields and 24px title. Native labels, inputs and select menus remain functional; artwork never contains baked-in labels. Current expanded section alone is shown, leaving all other sections directly accessible.
