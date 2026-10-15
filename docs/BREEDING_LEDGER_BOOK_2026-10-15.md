# Paged Breeding Ledger — 2026-10-15

## Runtime and behavior

The live `BreedingFocusedScreenTutorial → Moves → Items → Ledger → QoL` chain is preserved. The Ledger wrapper now opens a full-screen native GameDialog; `BreedingRecordsScreen` renders an illustrated archive that fits the viewport. Overview, Attempts, Pairs, Creatures and Family Tree remain available. Every section uses one record per page, a direct selector and Previous/Next; artwork can be minimized. The Family Tree places its center/record selectors side by side in landscape and pages selected creature, parents, grandparents and all children without dropping relations.

Attempts keep search, outcome, participant, giver/receiver and date-order filtering, now in a focused paged filter book. Empty results offer a reset. Pair and creature details retain dates, roles, eligible success rate, carried pregnancies, best partner and every active familiarity entry. Main summary metrics and highlights use the existing read-only ledger calculations. Complete records page through original results, recorded costs/Energy/streak, progression and talent triggers, saved care data, and both unchanged scene paths.

Use This Pair restores the latest recorded giver/receiver order and only selects the pair. Archived participants cannot be handed to the pen. Individual player handoff selects the giver role; other individual handoffs select the receiver role. Existing availability and attempt validation remain in the pen. Reading, filtering and selecting never replay an attempt or charge costs.

## Inheritance and care links

`getAttemptCareRecords` associates records using explicit `sourceAttemptId` or matching saved pregnancy IDs. An explicit conflicting attempt ID takes precedence; names are never used to guess a link. Only active pregnancies and unhatched eggs get corresponding active-care handoffs. Births use the saved birth ID, including archived offspring. There is no UI limit on available linked records.

Each offspring has six stat comparison pages and saved talent/move pages. Parent base stats are explicitly **current**, excluding equipment bonuses. Egg/pregnancy numbers and grades come from their saved projection. Historical births use their recorded innate grades and explicitly say that birth stat numbers were not recorded; current child stats are not substituted for birth values. Recorded move IDs remain available; legacy direct/combination lists are deduplicated without claiming to reconstruct a complete native starting library.

Nursery links select the exact pregnancy, egg or birth. Back restores the archive section, stable record ID, filters/order, minimized art state and complete-record care page. Selection is scoped to the save in NavigationContext, with no GameSave schema change. Nested record dialogs reopen after the enclosing archive enters the native top layer, preserving focus and Escape behavior. Closing the detail returns to the archive; closing the archive returns to the pen.

No breeding formulas, costs, success chances, timers, genetics, reward processing, saved outcomes or artwork are changed.

## Art provenance

No new bitmap generation was needed. The implementation reuses approved painterly art and composes live controls on the established parchment surfaces.

- `public/images/ui/interiors-v1/breeding.webp`: approved clean pavilion, git blob `a3949c1b73053258afcff24e6dbc8b2020eab661`. Original provenance and exact prompt: `docs/UI_BREEDING_B_2026-09-30.md`.
- Canonical full-body/portrait selection uses `gameplayArt`; rare variants and historical snapshots retain their own art. The existing `public/images/ui/atelier-v1/ledger.webp` (blob `90e8a209eb1ec3694a896f496ff18b632bfa357f`) illustrates the archive when no creature art exists, including player entries. It avoids enlarging a tiny level badge or falsely representing an unrelated resident. Original ledger illustration prompt is in `docs/UI_EGG_ATELIER_ART_2026-09-30.md`.
- Detail books reuse the Nursery book's approved timber room, cradle and parchment assets documented in `docs/NURSERY_CARE_BOOK_2026-10-15.md`. Existing pairing/outcome paths remain separate from gameplay art.

Original pavilion prompt (reused unchanged, no new generation):

> Create a clean wide landscape 16:9 game background plate from the approved Breeding Pen UI concept. Preserve the painterly sunlit fantasy ranch pavilion, timber beams, leafy vines, distant mountains and buildings, wooden fence and warm ground. Remove all characters and all UI, including parchment, text, buttons and icons. Reconstruct the scenery naturally, with empty quiet ground for existing game artwork. Match the approved warm painterly style.

## Validation

Full/empty archive fixtures stress 100 attempts, 100 birth records and an archived participant. They use the production save loading path. Delivered-egg fixture dates respect the existing pregnancy/egg migration boundary; missing unrelated sparse-checkout art is handled only by the QA harness. The pavilion, Nursery room, cradle and approved creature images are real assets; synthetic session images use a neutral pavilion only in the harness.

- **331/331 tests pass**, including four new cases for exact/conflicting IDs, delivered/hatched stages, all 100 linked births, absent historical stat numbers and unique legacy move IDs.
- Optimized `npx next build` including TypeScript passes. As in the prior update, the sparse checkout omits unrelated breeding-scene binaries required by the separate asset-preflight command; this update changes no scene assets.
- Scoped ESLint: **zero errors**, four warnings (three image-element warnings and the wrapper's existing session-storage/effect warning). `git diff --check` passes.
- Production Chromium at **1440×900, 390×844, 844×390 and 360×740** checks all five sections for full and empty saves, every overview/detail/filter page, record selection across a 100-attempt archive, pair/creature details, family relations and minimized artwork. Main and focused menus fit without scrolling or clipped controls.
- Source checks open the exact pregnancy, egg and 100th birth record, then restore the same attempt, filters/order and complete-record care page. Native focus/Escape work after return. Birth comparisons explicitly retain missing-number labels.
- Search empty/reset, outcome counts, archived-participant giver/receiver filtering and oldest-first order pass. Family focus follows an archived child. Archived pairs cannot be handed to the pen. Pair and player handoffs restore valid role choices without recording another attempt.
- The archive illustration decodes in empty/player views at all four sizes. A deliberately missing historical portrait falls back to the approved ledger illustration; selecting an ordinary creature restores full-body art and sizing correctly.
- Review and navigation preserve currencies and attempt counts. No browser page errors. Desktop attempt records, phone stat comparisons and empty/player art, and landscape Family Tree screenshots received visual review.

QA inputs, scripts, logs and reviewed screenshots are archived in the existing project Drive folder. Keep PR #21 draft and unmerged. Report push, Vercel build status and protected hosted gameplay verification separately.
