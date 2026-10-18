# Lineage A and family-tree asset map

The approved main page is `approved-concept.png`. The approved expanded viewer is `approved-tree.png` (SHA-256 aec1367cdbce83a54cb005fc20a3d4d247e77c7d2491e4ad91c5df42e2c4ca5b). These are acceptance references, never live UI backgrounds containing baked labels.

## Reusable production assets

| Element | Existing source or renderer |
| --- | --- |
| Window frame | stats-growth-b/factors-a/frames/window.svg |
| Parent, assessment, marker, notes and relative cards | stats-growth-b/factors-a/frames/card.svg |
| Normal controls and selected relatives | creature-overview-a-v2/frames/secondary-normal.svg and primary-normal.svg |
| Family, creature and player symbols | creature-overview-a-v2/painted-r4/lineage.webp, creatures.webp, identity.webp |
| Lineage markers | creature-overview-a-v2/painted-r4/talents.webp |
| Birth assessment scroll | icons/icon_contract_scroll.png |
| Ranch notes quill | guild-v1/quill.webp |
| Search input, expand/collapse, zoom, Fit and Center | Native accessible controls with the existing frames and typeface |
| Tree canvas | Navy CSS surface; no genealogy baked into an image |
| Relationship connectors | Computed SVG paths from familyTree.ts; no bitmap line/arrow atlas |

Each relative uses the same scalable card with selected, focus, record-only and unrecorded states. Names and generations are live text. Each distinct saved parent set gets its own junction and child list, so multiple partners do not require artwork permutations. Shared ancestors reuse one identity node. A dark under-stroke separates crossing branches; selecting a relative highlights relevant connectors. Low zoom uses lightweight SVG overview marks; readable cards are mounted around the viewport.

Keep source roles unambiguous: a line denotes a recorded parent-child relationship, not a breeding-risk verdict or a permanent romantic partnership. Unknown ancestry is explicit. No new painterly icon generation was needed for runtime integration; approved existing artwork supplies the complete kit.
