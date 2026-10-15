# Nursery care book — 2026-10-15

## Behavior

The runtime route remains `NurseryScreenMoves` → `NurseryScreenLedger` → `NurseryScreen`; the tsconfig aliases are unchanged. The Nursery now uses one illustrated record at a time with Eggs, Pregnancies and Births sections, a direct selector, Previous/Next and minimize/expand art. Ready eggs stay first. Pregnancies expose the saved timer, estimated date and progress; egg delivery and incubation remain separate sleep-driven stages. The summary uses actual active egg and pregnancy counts and existing Nursery capacity.

Projected stats/grades, abilities, parents, every lineage/stat/ability/genetics note, birth grades and talents, and move-lineage records have individual pages instead of long scrolling lists. Hatch results use the same book with a full-body illustration, rename field, numeric stats with innate grades, initial care values, inherited talents and all recorded notes. No roll-note truncation is needed. Birth history includes historical eggs not represented by a newer birth record; existing history storage limits are unchanged.

`getEggReadiness` mirrors the actual hatch reducer: status must be ready and the exact target habitat must be unlocked with capacity. The UI shows the blocking reason and disables Hatch before attempting it. Petra's link selects the matching family in Builder's Yard. Selene's care link hands off the selected egg; the normal Back stack restores the Nursery's section, stable record ID and art setting. Selection is session UI state scoped to save ID, with no persisted save-schema change. Minimizing art preserves a typed hatch name.

Release and donation require a separate review. The Nursery guards repeat clicks, and the shared lifecycle `removeEgg` now rejects stale IDs and hatched records before granting anything. A valid donation still grants exactly 75 Gold and 1 GP; release has no reward. Hatching retains the existing engine, atelier effects, birth recording and renaming. Costs, incubation durations, genetics, housing requirements, combat, balance and art masters are unchanged.

## Art and implementation provenance

No new generated bitmap is necessary: this screen reuses approved illustrations and composes live UI using CSS parchment, readable controls and the native GameDialog focus/Escape behavior.

- `public/images/ui/interiors-v1/nursery.webp`: approved clean nursery plate, git blob `3d2513170eb5788e29b6330d1272d5a12c05c0b1`. Original generated source `exec-dc6bc254-66ba-4f3c-83a0-15dd1a326023.png`; exact clean-plate prompt in `docs/UI_INTERIORS_2026-09-29.md` under Background provenance.
- `public/images/ui/interiors-v1/atelier-egg.webp`: approved speckled egg and linen-lined carved cradle, git blob `aa19f9e305991ce1f592a049adba919a83fe055d`. Exact generation prompt in `docs/UI_EGG_ATELIER_B_2026-09-30.md` under Egg generation prompt.
- `public/images/ui/ranch-dossier-v1/parchment.webp`: existing dossier paper.
- Pregnancy mother, birth and hatch artwork resolve through the canonical `gameplayArt` helper. Rare variants retain their own art. No approved creature or breeding image is overwritten.

Existing prompt excerpts for reproduction: Nursery clean plate asks to retain the painterly cozy timber interior, honey-brown wood, daylight, botanical accents and perspective while removing every UI panel, label, character and counter. The egg prompt requests a single intact ivory egg with moss-green speckles in a low walnut-and-teal carved cradle with cream linen and subtle brass leaf fittings, centered with transparent margins. The linked repository notes retain the exact original wording; this update does not run image generation.

## Validation

Validation details and screenshots are archived with the project in Google Drive. Synthetic review saves and sparse-checkout image handling are QA-only and are not included in the runtime.

- Full regression run: **327/327 pass** (`node --no-warnings --loader ./scripts/ts-test-loader.mjs --test tests/*.test.ts`). Two new tests compare displayed readiness with the actual hatch reducer across six states and verify one-child/birth recording plus exact, repeat-safe donations. Focused tests pass again after the final UI edits.
- Optimized `npx next build`, including TypeScript, passes. The sparse checkout still omits unrelated breeding-scene binaries used by the separate asset-preflight command; no scenes are changed in this update.
- Final scoped ESLint: **zero errors**, ten raw-image warnings including existing Atelier images. `git diff --check` passes.
- Production Chromium: full, empty, locked and capacity-full Nursery states at **1440×900, 390×844, 844×390 and 360×740**. Eggs, all pregnancy and birth selectors (12 pregnancies / 100 births), every detail/note page, move-lineage first/middle/last pages, minimized art, disabled actions and visible controls fit without main or nested menu scrolling.
- Actual source navigation: selected third egg opens at Selene and returns to the same selection; Petra opens the matching Feline habitat plan. No purchases are performed by navigation.
- Browser transactions: cancellation leaves balances and records unchanged; a valid donation grants exactly **75 Gold + 1 GP** and removes one egg. The fixture marks previously earned goal rewards claimed so unrelated legitimate provider bonuses do not obscure the donation amount. Reward processing is unchanged.
- Rapid repeat Hatch dispatch creates exactly **one creature and one birth**. The hatch book's 26 pages fit at all four sizes; renaming, typed-name preservation through art minimization and reload persistence pass. No page errors.
- Screenshots reviewed for desktop birth records, phone egg care and hatch reveal, and landscape egg care and hatch reveal. The main Nursery room and cradle use their real repository image bytes in the harness; unrelated missing legacy images are blocked only by the harness.

Hosted gameplay remains subject to protected-preview access. Report push, Vercel build status and hosted verification separately. Keep PR #21 draft and unmerged.
