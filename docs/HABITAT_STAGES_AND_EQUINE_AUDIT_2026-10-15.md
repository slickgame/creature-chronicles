# Habitat stages and single-equine first-week audit

Follow-up to `5327fb0`, on the existing feature branch. No purchase prices, reward amounts, save schemas, production rules or approved creature artwork were changed.

## Live habitat stages

The habitat district background now shows one equine stable and four empty fenced plots, rather than five finished shelters. Each family has an illustrated site preview derived from actual ownership and Petra’s persisted work order:

- Unbuilt: surveyed pasture, current Gold + Wood costs, and the existing direct Petra blueprint link.
- Building: timber frame/scaffolding, a highlighted site card, completion day, an explicit “already paid” explanation, and a work-order link. No second commission is enabled.
- Owned: the existing family courtyard illustration, actual residents/capacity, normal entry and House upgrade links.

The overview uses site previews over a shared district landscape; the painted landscape is not a per-building simulation. Owned family previews remain distinct. Minimize/Expand site art removes decorative thumbnails while retaining names, status, costs and navigation. The phone Energy display was tightened to fit its frame.

## First-week audit

`npm run simulate:equine-start` runs the real new-game factory, gathering, cooking, adoption, guided pairing/catalyst, construction and day-end reducers. Starting timestamps seed factory/inheritance rolls reproducibly; the temporary clock override is synchronous and restored before returning. There is exactly one initial equine resident and one owned equine habitat.

The routes perform at most three regular instant work actions per day, use actual Energy blockers, keep the first adoption day light, rest parents if needed, cook a two-night food buffer when ingredients permit, and complete the initial timber delivery at most once. Habitat-first routes buy housing, then adopt an equine partner; they do not receive a free resident in the purchased habitat. The third creature comes from the real guided pairing and hatch.

No battle winnings, arbitrary grants, sales, market rerolls or repeated delivery income are assumed. Normal finite starter/daily Gold rewards are reported separately. A sensitivity run omits Gold awarded at day-end while retaining the actual food/material rewards and one 100-Gold timber delivery. This is an audit-only stress scenario, not a gameplay change.

Seed 0 results (starting Gold: 1,200; equine adoption fee: 810):

| Route | Habitat Gold / Wood | Normal end Gold | Normal third-creature day | End Gold omitting day-end Gold rewards | Stress third-creature day |
|---|---|---:|---:|---:|---:|
| Solo farming | — | 1,915 | — | 1,300 | — |
| Adopt equine first | — | 1,340 | 3 | 490 | 3 |
| Lapine habitat first | 250 / 4 | 1,130 | 4 | 240 | 4 |
| Feline habitat first | 300 / 6 | 1,080 | 4 | 190 | 4 |
| Canine habitat first | 300 / 6 | 1,080 | 4 | 190 | 4 |
| Bovine habitat first | 400 / 8 | 980 | 4 | 90 | 7 |

All routes cover all seven nights. Eight starting stat rolls across all routes and both reward scenarios pass the food, money, Energy, transaction and timing checks. Gold reconciles as starting funds minus actual fees plus one delivery and recorded rewards. These are planned routes, not a promise for every playstyle: adverse optional events, injuries, missed work, purchases outside the plan and skipped tutorial breeding can delay progress. Three owned creatures does not itself guarantee combat fitness or victory.

The existing five-worker `simulate:first-week` remains an established-ranch comparison. The new audit and its JSON/CSV output are separate, so old scenarios do not silently become single-equine simulations. No price adjustment was justified by these results.

## Assets and generation

Built-in OpenAI image generation, using `public/images/ui/ranch-v3/habitats.webp` as a style/composition reference:

- `public/images/ui/ranch-stages-v1/fields.webp` — one stable and four empty plots; maximum 1664×936.
- `public/images/ui/ranch-stages-v1/planned.webp` — surveyed empty plot; maximum 768×512.
- `public/images/ui/ranch-stages-v1/building.webp` — unfinished habitat frame; maximum 768×512.

Pillow thumbnail resizing and WebP quality 86/method 6 only; no artistic post-edits. Existing assets were not overwritten. Exact prompts: `HABITAT_STAGE_ART_PROMPTS_2026-10-15.json`. Dimensions, hashes and bytes: `HABITAT_STAGE_ART_MANIFEST_2026-10-15.json`. Machine-readable audit: `equine-first-week-2026-10-15.json`; compact ledger: `equine-first-week-summary-2026-10-15.csv`.

## Validation

- Complete suite: 314/314 tests pass. The two new tests cover 96 route/stat/reward scenarios and persisted planned → building → owned transitions, without granting ownership from presentation.
- Optimized production Next.js build and TypeScript pass.
- Scoped ESLint: zero errors; one existing-style image-element warning.
- Production Chromium: planned, building and owned states at 1440×900, 390×844 and 844×390; no scrolling or offscreen site controls; all site images load; minimize/expand preserves information; paid work orders cannot be commissioned again; owned habitat Back returns to the district. Screenshots visually reviewed.
- Existing sparse-checkout limitation remains: missing legacy art is handled only by the browser harness. No QA saves or placeholder images are committed.

Publish only to `feature/ui-ranch-ledger-2026-09-29`; PR #21 stays draft/unmerged. The protected Vercel preview/team-access limitation remains. Push success does not establish hosted deployment readiness.

Next: expose the real costs and food buffer in a small paged House growth planner, with links to Petra, adoption, Kitchen and gathering. Then test a less guided first week with interrupted work and recovery, without changing the already approved instant-work rules.

Drive archives (uploaded to the existing Creature Chronicles folder and metadata-verified): [review, production art and audit](https://drive.google.com/file/d/1OKeyM0mpk0ORTC_CU3OVImI1hPT8r2QS/view?usp=drivesdk) · [PNG masters 1/2](https://drive.google.com/file/d/1FQ95gtQNERYFDlZVYfpgpcOICjHNkKcR/view?usp=drivesdk) · [PNG masters 2/2](https://drive.google.com/file/d/1N3qyjz7iBWOl_Y-YILV0XyP76pFZy2Qv/view?usp=drivesdk).
