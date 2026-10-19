# Creature Cards C production kit

Selected visual reference: C in `../creature-cards-review/options.png`, with the user-requested explicit Open profile button on the desktop inspector. Runtime keeps that action in the selected phone view and provides an additional Gallery footer action for direct profile access.

| Element | Asset / implementation |
| --- | --- |
| Tile normal/selected states | `tile.svg`, `tile-selected.svg`; rebuild with `scripts/build-creature-card-assets.py` |
| Window / inspector frames | `../creature-removal-c/window-ornate.svg` |
| Card details / Open profile buttons | Existing `secondary-ornate.svg` / `primary-ornate.svg` from removal C |
| Type | Tinos Regular/Bold WOFF from `../forge-slate-v2/fonts`, explicit 400/700 |
| Portraits | Canonical Nyla/equine gameplay helpers and actual variant portrait paths |
| Favorite | `../creature-overview-a-v2/painted-r4/talents.webp` |
| Lock states | `../care-b/icons/lock-open.webp`, `lock-closed.webp` |
| Meters / readiness / paging | Live native text, progress controls, semantic buttons and matching CSS |

Runtime specification: CreatureCardsC.module.css. Desktop 1220px maximum window, 560px bounded height, equal gallery/inspector columns, 3×2 tiles where width permits, 30px window/inspector headings and 18px tile names. Tiles are 130px high with 140px pagination allowance. Phones use focused Gallery/Selected creature views, two-column tiles, selected strip and 650px bounded window. Short screens use 74px tiles and compact inspector vitals with Card details for the complete record. Selected frames use emerald #064d40, warm gold #f1d797 and a subtle glow; native focus outlines remain visible. No additional character artwork or raster textures are required.

Affection and Energy have real meters; Fertility remains a value and innate grade. Do not copy the concept's illustrative fertility bar into runtime. Frame and font assets remain separate from live text, counters and values.
