# Breeding parent and inheritance books

2026-10-15. Continues the existing Creature Chronicles branch and draft PR #21.

## Implementation

Parent selection is now an illustrated, viewport-sized book with a quick selector, Previous/Next parent controls, paged search/sort/family filters, complete candidate details and collapsible art. All six current base stats and innate grades, talents, readiness, projected after-cost values and exact engine notes remain accessible. Selection rechecks the original role, opposite-parent and availability restrictions and spends nothing. A complete pair may still have a blocker even when a candidate can be selected.

Inheritance has Overview, Stats, Talents and Moves views, each with a detail selector and pagination. Current parent numbers are distinguished from unknown offspring rolls. Talent percentages are conditional checks rather than per-talent promises; species restrictions and armed support-item rules are explicit. Move candidates, combinations, chances and contributing reasons come from the existing helpers. Viewing does not sample offspring or mutate the save. Chance & Readiness uses the same book for the complete existing chance breakdown, blockers, notes and exact costs.

The attempt lock remains held through the current interaction microtask so repeated synchronous confirmation cannot execute twice. Breeding formulas, costs, support rules, rewards, approved scene artwork and save schema remain unchanged. Existing Inspect, Pair Options, resource-warning and result scenes remain; the latter confirmation/result presentation is the next UI scope.

## Artwork provenance

No new images were generated. Canonical participant profile/portrait URLs preserve approved common and rare art. Failed participant images fall back to the existing illustrated ledger. Existing parchment is reused from `public/images/ui/ranch-dossier-v1/parchment.webp`.

Pavilion: `public/images/ui/interiors-v1/breeding.webp`, Git blob `a3949c1b73053258afcff24e6dbc8b2020eab661`. Original generation provenance: `docs/UI_BREEDING_B_2026-09-30.md`.

> Create a clean wide landscape 16:9 game background plate from the approved Breeding Pen UI concept. Preserve the painterly sunlit fantasy ranch pavilion, timber beams, leafy vines, distant mountains and buildings, wooden fence and warm ground. Remove all characters and all UI, including parchment, text, buttons and icons. Reconstruct the scenery naturally, with empty quiet ground for existing game artwork. Match the approved warm painterly style.

Neutral ledger: `public/images/ui/atelier-v1/ledger.webp`, Git blob `90e8a209eb1ec3694a896f496ff18b632bfa357f`. Full prompt and optimization provenance: `docs/UI_EGG_ATELIER_ART_2026-09-30.md`. Subject prompt:

> An open cream parchment ledger book with a brown leather cover, brass corner fittings, a green ribbon bookmark.

The documented shared prompt specifies isolated transparent, warm hand-painted fantasy artwork, parchment cream, walnut, sage and antique brass, with no text or watermark. Existing master art remains unchanged.

## Validation

- All **334 tests pass**, including new selection-rule parity, immutable preview and actual inheritance-helper parity checks.
- Optimized Next production build and TypeScript pass after final changes.
- Changed-file ESLint: zero errors, eight warnings (existing effect/image warnings and the new canonical artwork image).
- Production Chromium checks pass at 1440×900, 390×844, 844×390 and 360×740, with full 100-creature and empty fixtures. Every candidate detail page for representative ordinary, opposite-role, exhausted, injured, long-name and player entries; every filter page; every inheritance detail page in all four tabs; and every Chance & Readiness page fit without menu scrolling, including minimized art.
- Search with no matches, family filters, fertility sorting, candidate selection without spending and cancellation pass. Low-Hearts warning cancellation preserves resources. Rapid repeated confirmation records exactly one attempt with the displayed 53 Energy / 1 Heart costs, exact giver Energy decrement, unchanged currencies and correct participant IDs. Reload preserves the single record. No browser page errors.
- Final landscape picker and phone talent pages visually reviewed. Harness-only neutral replacements cover missing legacy sparse-checkout images; production pavilion, ledger and canonical creature artwork decode normally. This does not claim a complete legacy asset preflight.
- React checklist reviewed: native controls and dialog focus, stable IDs, direct helper imports, read-only derived models and local presentation state. Existing unrelated effect warnings retained.

QA screenshots, scripts, fixtures, models and logs are archived in the existing Google Drive project folder. PR stays draft and unmerged. Pushing and Vercel build/hosted verification are reported separately; protected hosted gameplay is not verified by local QA.
