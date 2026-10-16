# Breeding attempt results and resource warnings

2026-10-16 UTC (October 15 in America/New_York). Continues Creature Chronicles on the existing feature branch and draft PR #21.

## Implementation

The low-resource confirmation now uses the shared illustrated book. A quick selector and Previous/Next expose the complete review, exact Energy/Hearts before-and-after values for both parents, and each warning's cost and consequence. Cancel and Continue Anyway remain explicit. Back/Escape cancel without spending.

Recorded results have Attempt and Outcome views, with paged details and collapsible artwork. Attempt pages retain the saved description, chance and paid per-parent costs, recorded Energy before/after, XP, pair streak and each participant's progression. Individual stat growth, recorded grade changes and talent-trigger notes stay accessible. Outcome pages retain the original result/flavor/blocker text and focused follow-up actions: Nursery, keeping the giver and choosing another receiver, another attempt when eligible, or changing the pair. Full mode opens Attempt; Quick mode opens Outcome. Closing or reviewing does not perform another transaction.

All values use the current preview or the saved attempt, with no inferred historical Hearts values. Existing guarded confirmation, pregnancy logic, costs, XP, rewards, save schema and scene selection remain unchanged. The shared book accepts the existing per-scene fallback image; no new artwork is generated or existing scene artwork modified.

## Artwork provenance

Reuses the existing pavilion, parchment and illustrated ledger. Their exact prompts and Git blobs are recorded in `docs/BREEDING_PARENT_BOOKS_2026-10-15.md`, with original prompts in `docs/UI_BREEDING_B_2026-09-30.md` and `docs/UI_EGG_ATELIER_ART_2026-09-30.md`. Result images are the attempt's existing `pairingImagePath` / `outcomeImagePath`, with the existing process/success/failure fallback constants. Approved common and rare participant artwork remains unchanged.

## Validation

All 334 tests pass using the complete `tests/*.test.ts` suite. Optimized Next production build and TypeScript pass. Changed-file ESLint reports zero errors and five warnings, retaining existing effect/canonical-image warnings. Whitespace checks pass.

Production Chromium checks pass at 1440×900, 390×844, 844×390 and 360×740. Every warning page and successful/unsuccessful result page fits without scrolling, including minimized result artwork. Both parents' exact-cost pages are reachable. Search/filter/selection, existing parent/inheritance/readiness books, full and empty rosters, cancellation, exact 53 Energy / 1 Heart deductions, one rapid-confirm attempt and reload persistence pass. Deterministic timestamps exercise real successful and failed attempts; every result view leaves the complete saved state unchanged. The successful result's View Pregnancy action reaches Nursery. No browser page errors. Phone warning and landscape Attempt screenshots were visually reviewed.

Browser validation and reviewed screenshots are archived with the QA harness and fixtures in the existing Drive project folder. Missing legacy sparse-checkout art receives neutral replacements only inside the harness. This is not a complete legacy asset preflight or protected hosted gameplay verification.

PR #21 remains draft and unmerged. Push, Vercel build status and protected hosted verification are reported separately.
