# Ranch visual fidelity pass — 29 September 2026

The first implementation reproduced the navigation and data flows but did not reproduce the approved artwork closely enough. This pass replaces its floating sprites and plain panels with production artwork based on concept A, an illustrated wood/brass HUD and dock, and concept B's parchment ledger.

## What changed

- Four cohesive painted ranch scenes, with building plaques anchored to the corresponding structures. Homestead includes house, nursery, office, feline/canine habitats and town road. Breeding remains available from Services and Travel.
- Textured walnut/brass frames, parchment panels and a 16-icon handpainted atlas. All labels, resource values, task statuses and actions remain live HTML.
- A's Today card expands into B's non-modal right-hand ledger. The ranch stays sharp and interactive. Nursery, chores and feed are prominent; tax, condition, training and daily records remain available. End Day stays visible while the ledger content scrolls.
- Shared Menu and confirmation dialogs use the same parchment material and illustrated icons.
- On phones the HUD and Today card remain compact, the ranch can be panned horizontally, and the ledger scrolls above the bottom navigation. Labels wrap rather than being truncated.

## Asset provenance and generation briefs

Generated with the built-in image-generation tool from the approved concept A and the resulting clean homestead scene. No external stock assets or local generation CLI were used. Final PNGs were encoded as WebP at quality 88 without cropping or composition changes. Runtime files are under `public/images/ui/ranch-v2/` (about 3.1 MiB total); scenes load as each plot is visited.

The following briefs record the requirements used to generate each asset:

| Asset | Reference and production brief | Generation output ID |
| --- | --- | --- |
| homestead.webp | Approved A: preserve the lush handpainted alpine ranch, lake, mountains, paths, foreground framing and grounded buildings; remove every UI frame, label, button and text element. | f5771e6c-6379-4e37-9165-91801042c542 |
| habitats.webp | Clean homestead style: feline climbing enclosure upper left, canine kennels upper right, bovine barn lower left, lapine garden lower center and equine stable lower right; no UI or text. | 1536d8b7-b995-4906-bd36-b7ca307a51f3 |
| services.webp | Same ranch setting: office upper left, breeding pavilion center, house lower left, chores/guild noticeboards lower right and town road; no UI or text. | cd3eae55-c3f5-4e1f-9844-be3b3ce991f2 |
| expansion.webp | Same setting with neutral undeveloped plots, pasture and woodland clearings, staked future habitats, fence construction and watchtower foundation. No completed future habitats, UI or text. | 638d5e91-476a-45e4-b87a-fc9927b12860 |
| wood.webp | Square seamless-center nine-slice panel: dark walnut grain, double brass border, chamfered riveted corners, no text. | ba884ba2-7665-4edd-8ad7-b0006747651a |
| parchment.webp | Square nine-slice panel: warm cream parchment grain, walnut/gold outer frame and engraved brass corners, no text. | 5c940633-fe8b-481c-8d79-1fbbb2121c8e |
| icons.webp | Transparent 4×4 evenly spaced illustrated atlas. Rows: farmhouse/paw/egg/town; bag/sun/lightning/coin; leaf/gear/moon/checklist; feed/tax scroll/nest/tools. Warm ivory and gold, dark outlines, no lettering. | b7854f29-53d8-4a90-8ac0-a38f4cb7e01b |

## Validation

- 141 regression tests pass, including storage-free planner projection and tax timing.
- Production Next.js build, TypeScript and static generation pass.
- Chromium checks: four plots at 1440, 768, 390 and 360 px; no overlapping building plaques. Inventory focus containment/Escape, save overwrite/delete cancellation, first empty save selection and guided Begin Ranch Day all pass.
- Production-build screenshots captured for ranch, expanded ledger, menu, three additional plots and phone views. Sleep advances Day 1 to Day 2 once and displays the report. No browser exceptions observed.
- Targeted ESLint: no errors; one existing NavigationChrome effect/state warning.

## Deliberate differences and limits

This matches the approved visual direction, not every painted pixel: the original concepts contain illustrative values and decorative flourishes; the game displays actual save data and accessible controls. The ledger overlays the right side of the scene and can be collapsed to reach covered locations. On phones the scenery pans rather than shrinking all controls. Expansion terrain is decorative; live badges and project dialogs are authoritative for construction status. Scene art does not yet visually change with upgrade tiers.

Concept C's separate roster redesign is outside this PR. Existing battle, town and interior artwork is retained. Local sparse-checkout asset pipeline limits described in the original implementation notes still apply. This remains an unmerged draft PR, with a preview deployment only.
