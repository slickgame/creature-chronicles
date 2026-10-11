# Illustrated consistency B — implementation

Approved September 30, 2026, following `UI_CONSISTENCY_AUDIT_2026-09-30.md`.

## Changes

- Shared `IllustratedIcon` and `TrustLeaves` components provide consistent symbols and earned/faded five-level trust indicators.
- Supply Depot uses actual Feed, Materials and Repair Kit artwork in its resource bar, illustrated category/actions, a larger existing Pella portrait, hanging wooden item sign, grouped quantity card, parchment price ribbon and selected-item check. Usage Details and Pella's full profile remain accessible.
- Adoption Hearth uses Tamsin's existing portrait in the keeper panel and Talk popup, trust leaves and illustrated controls, hanging creature sign and desktop price ribbon. Compact screens retain the portrait/icon controls without sacrificing full-body creature space.
- Chores now has five distinct images: paw/shield for Security Patrol, caring hand/heart for Comfort Care, feed sack for Stable Production, seedling/trowel for Garden Tending and material crate for Field Hauling.
- Nursery uses the Atelier egg/cradle for selected eggs and standalone egg artwork in list rows. Its live timer/readiness text sits on a parchment ribbon. Small phones keep Hatch and all three detail actions visible.
- Habitat distinguishes capacity, care/affection and Breeding symbols, adds a Profile icon and selection check, and retains compact resource icons.
- Office uses the actual material crate and keeps resource symbols on phones. Breeding retains secondary action icons on phones.
- Existing full-body selection, stat numbers/grades, navigation, pagination and popup scrolling remain. Gameplay rules, transaction handlers and save schemas are unchanged.

## Concept translation

B is implemented with real existing characters/items and dynamic labels; concept-only example descriptions and free-gift imagery are not used. Rare supplies use the existing catalyst symbol. Decorative checks supplement aria-pressed selection. Phone and short landscape layouts compress ornament spacing to preserve legible controls.

## Asset provenance

Built-in image-generation tool, separate transparent output per new icon. Converted to 256px WebP preserving alpha. Existing item, NPC, Atelier sign/ribbon/leaf/book/speech artwork is reused without modifying originals.

| New repository asset | Source PNG |
|---|---|
| `public/images/ui/atelier-v1/comfort.webp` | `exec-85df7685-712b-4dd0-b5ea-96eccc786031.png` |
| `public/images/ui/atelier-v1/garden.webp` | `exec-55d3bae6-a38c-43c4-8b5e-6df48de91627.png` |
| `public/images/ui/atelier-v1/patrol.webp` | `exec-948e589d-ee3d-4ec1-af37-fdc8e5cb3fb4.png` |

Exact prompts:

### comfort

Use case: stylized-concept. Single production UI icon for Creature Chronicles. A gentle open gloved hand cradling one warm rose-gold heart, a tiny sage leaf accent, representing compassionate creature care. Warm hand-painted storybook fantasy style, soft sunlit highlights, walnut brown, parchment cream, sage green and antique brass palette matching botanical Egg Atelier icons. Isolated cutout on genuinely transparent background. Bold readable silhouette at 32 pixels, square canvas, small safe margin, no frame, no text, no scenery, no watermark.

### garden

Use case: stylized-concept. Single production UI icon for Creature Chronicles. A healthy green seedling emerging from a small mound of soil beside a short brass garden trowel with walnut handle, representing garden tending. Warm hand-painted storybook fantasy style, soft sunlit highlights, walnut brown, parchment cream, sage green and antique brass palette matching botanical Egg Atelier icons. Isolated cutout on genuinely transparent background. Bold readable silhouette at 32 pixels, square canvas, small safe margin, no frame, no text, no scenery, no watermark.

### patrol

Use case: stylized-concept. Single production UI icon for Creature Chronicles Security Patrol chore: a small walnut and antique brass shield with a raised paw emblem, a tiny sage botanical accent. Warm hand-painted storybook fantasy style, soft sunlit highlights, walnut brown, parchment cream, sage green and antique brass palette matching botanical Egg Atelier icons. Isolated cutout on genuinely transparent background. Bold readable silhouette at 32 pixels, square canvas, small safe margin, no separate frame, no text, no scenery, no watermark.

## Validation

Production build and TypeScript pass. Targeted ESLint reports zero errors (existing-style image and legacy warnings remain). Browser layout/art checks cover the seven affected interiors at 1440×900, 1280×720, 768×1024, 390×844, 360×740 and 844×390. New icons load; Back/Menu and primary controls remain reachable; main screens do not scroll. Nursery selected-egg variants and shared Atelier controls receive targeted follow-up checks. Depot checks exercise all 12 items, dialogs, focus restoration, pagination, canceled/confirmed purchase, exact balance/feed updates, insufficient Gold and trust pricing. Hearth checks exercise stats/grades, profiles, trust, adoption, refresh and affordability/capacity blockers.

Local QA masks unrelated creature images because this sparse checkout omits most creature assets; their existing source paths and full-body contain sizing are preserved. The existing ignored breeding scene manifest stub is not committed. No production merge; publish only the draft branch preview.

