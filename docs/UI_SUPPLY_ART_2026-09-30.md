# Distinct supply icons and Pella artwork

User requested a distinct icon for every Supply Depot item and matching Pella icon, portrait and full-body profile. Implemented 2026-09-30 using built-in image generation.

## Item inventory

The six original distinct icons remain unchanged: Feed Bundle, Material Crate, Repair Kit, Nursery Supply Kit, Energy Snack and Fertility Tonic. The following new transparent assets replace the six reused icon mappings in the shared support-item definitions, so consuming screens inherit them.

| Item | Distinct silhouette | Saved project asset |
| --- | --- | --- |
| Hearty Energy Meal | Wooden stew bowl, bread and spoon | `public/images/items/supply_depot/energy_meal.webp` |
| Affection Treat | Heart biscuits in a green pouch | `public/images/items/supply_depot/affection_treat.webp` |
| Recovery Balm | Wide terracotta ointment pot | `public/images/items/supply_depot/recovery_balm.webp` |
| Trait Stabilizer | Square teal flask, brass braces and leaf seal | `public/images/items/supply_depot/trait_stabilizer.webp` |
| Mutation Catalyst | Faceted violet flask and crystal stopper | `public/images/items/supply_depot/mutation_catalyst.webp` |
| Gestation Tonic | Slender amber bottle with egg/nest medallion | `public/images/items/supply_depot/gestation_tonic.webp` |

Each uses the existing Feed Bundle and Fertility Tonic as visual references: warm painted fantasy art, detailed tactile materials, brass accents, clear silhouettes and upper-left light. Transparent RGBA PNG generation converted to WebP quality 90 with alpha preserved, original resolution, no cropping or retouching.

## Pella

New artwork preserves the existing Pella reference: tan freckled face, hazel eyes, swept dark-brown hair with cropped side, green gold-trimmed vest, cream shirt, green scarf/paw brooch, leather work apron, gloves and supply belt. Full-body artwork extends the outfit with olive trousers and brown work boots.

- Counter icon: `public/images/npcs/town/pella_mosswick_icon_v2.webp`.
- Talk portrait: `public/images/npcs/town/pella_mosswick_portrait_v2.webp`.
- Full profile: `public/images/npcs/town/pella_mosswick_profile_v2.webp`.

Original artwork is preserved. Both Pella data definitions now reference the new portrait/profile rather than the generic bag or shop background. Supply Depot → Talk → View Full Profile shows complete uncropped artwork and existing role/Trust information. Escape from the full profile returns to conversation; Escape again closes it. Compact screens keep character details in scrolling dialogs.

## Prompts and provenance

Exact final prompts and reference paths: [SUPPLY_ART_PROMPTS_2026-09-30.json](./SUPPLY_ART_PROMPTS_2026-09-30.json). Built-in `image_gen` used; no external image API or CLI. Full-body image received a background-extraction pass before use. All nine shipped assets have transparent alpha. Generated PNG originals are retained by the image-generation system; game assets are tracked here.

## Verification

- Production Next.js build and TypeScript pass.
- Targeted lint: zero errors, seven image-element/existing warnings.
- Production Chromium: 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390.
- All twelve displayed item image paths are unique and load successfully on every tested viewport, including full counter artwork.
- Main page remains non-scrolling with no clipped or obstructed controls. Pagination still reaches all twelve supplies.
- Pella portrait and profile load, full body uses contain, dialogs avoid horizontal overflow, Escape returns correctly. Desktop and phone screenshots visually reviewed, including alpha edges against parchment.
- No gameplay or balance changes. The previous 141-test regression result remains applicable; this art-only pass uses targeted visual/runtime checks rather than repeating unchanged gameplay tests.
- Existing draft PR remains unmerged. Sparse checkout excludes unrelated large breeding-art collections; full asset prebuild pipeline not run locally.
