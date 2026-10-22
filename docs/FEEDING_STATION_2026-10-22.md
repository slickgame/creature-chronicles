# Feeding Station — October 22, 2026

Automatic overnight feeding uses shared farm inventory. There is no separate trough inventory or transfer chore. Manage food in the Ranch Ledger and Feeding Station in the End Day review open the existing Feeding page directly; closing it restores the source view.

## Behavior

- The summary is **Creatures fed: X/X**. The numerator counts fully fed creatures; the denominator excludes creatures away at training. Food units remain available as supporting detail.
- Each resident page shows its current diet, allocated supplies, covered need and shortfall. End Day → Food → View planned meals shows the same projection.
- Raw ingredients remain opt-in, preserving existing saves. When enabled, allowed unreserved diet-compatible ingredients are allocated to restricted diets before omnivores. Diet-specific food is used before the shared ration pool, preventing avoidable shortages.
- Individual automatic-feeding permissions cover vegetables, wheat, meat, food eggs, milk, Balanced rations and older Feed. Draft changes and cancellation never save. Confirmation saves the policy without consuming food; a changed-ranch guard requires review again.
- Food exclusions apply to automatic feeding only. Existing reserves additionally protect resources from recipes, sales, construction and deliveries. Prepared bonus meals remain manual.
- Existing Balanced rations and older generic Feed retain their compatibility and value. This update does not introduce new ration types, recipes or stock migration.
- Hunger recovery and affection penalties are calculated per creature. Fully fed creatures no longer inherit another creature’s hunger penalty. Ranch condition and recovery talents still apply. Player recovery retains the existing aggregate ranch-food rule.
- Actual sleep, the seven-night stock forecast and evening stock warning share the same allocation engine. Tonight’s preview includes earned daily rewards processed before feeding. Only confirmed sleep consumes food; the existing once-per-day guard prevents duplicate consumption.
- Food-budget top-up estimates explicitly require Balanced rations to be allowed. Seven-night forecasts assume no future production, rewards or arrivals.

## Visual scope

Uses the existing FarmCareBook and NightCareReview art and layouts, with paged residents and a focused permission selector. No new visual direction or replacement creature art. The original parchment, pantry and canonical creature assets were restored to the sparse local checkout for honest screenshot review.

## Verification

- 60 data tests: feeding allocation and policies, per-creature recovery, preview/commit identity, existing economy/resources, ranch lifecycle/planner/ledger and guided tutorial.
- 31 focused browser checks: desktop, phone, short phone and landscape; permissions and cancellation; exact preview-to-actual allocations; one-day advancement; direct return navigation; Security details with more pages than the feeding permission selector.
- 21 ledger clarity checks and 218 general ledger browser checks.
- Production build and TypeScript pass. ESLint has no errors; existing unused-symbol and native-image advisories remain.

Actual local production-game screenshots use a five-resident QA save, not the user’s save. They are under `docs/validation/feeding-station-*`. PR #21 remains draft and unmerged.
