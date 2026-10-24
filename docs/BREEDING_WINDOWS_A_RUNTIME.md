# Approved A across all eight Breeding Pen windows

The user selected A for Inspect, Change Parent, Support Items, Inheritance, Pair Options, Chance Details, Review Attempt and Breeding Ledger. These now use real save data and existing engine/provider functions through the shared `BreedingWindowA` shell. The prior A/B review prototypes remain sample-only.

The runtime reuses the approved fidelity-v2 pavilion, wood header, substantial navy/gold frames, emerald actions, Tinos 400/700 and canonical contained full-body profiles. No new character or scene artwork was generated. Player/missing-art views have named fallbacks. Main windows have explicit Back controls, phone browser/detail focus views and paged records. Long source notes remain reachable through detail pages with internal scrolling as a fallback. Short review windows page costs and warnings separately.

- Inspect retains Overview, Stats, Work, Talents and Lineage, including all growth, grade, work XP and source notes.
- Change Parent uses draft candidate browsing and explicit Select/Cancel, original role blockers, complete filters and nested inspection.
- Support Items uses actual owned stock, capped effects, eligible recipients, complete details and explicit guarded reviews. Full inventory/source return preserves the support selection and filters. Breeding-entry confirmations reject changed-save reviews and rapid duplicate/click-through actions.
- Inheritance retains original conditional eligibility/probabilities, stats/grades, talents, moves, family information and parent inspection. Browsing never rolls offspring.
- Pair Options retains Swap/Random/Clear and Full/Quick presentation preferences.
- Chance Details retains the full modifier breakdown, readiness/blockers, costs and original detail pages. Readiness and pregnancy eligibility remain distinct.
- Review Attempt retains exact current per-parent costs, warnings, original freshness/duplicate safeguards and the unchanged engine outcome path.
- Breeding Ledger retains every overview, attempt, pair, creature, family tree, care and archived record, complete record pages, filters and recorded-role source return.

No balance, save schema, RNG, canonical art or process/outcome scene rules changed. PR #21 remains draft and unmerged.

## Verification

Production Next build and TypeScript pass. Scoped ESLint: zero errors, eleven existing image/performance/effect warnings. Seven focused breeding selection/preview/care tests pass.

Actual production-browser captures cover all eight windows at 1440×900, 1920×720, 2560×1440, 390×844, 360×740, 390×500 and 844×390. All window bounds fit; opening/browsing/canceling all eight preserves the complete serialized game save. No page errors. Captures use a disposable synthetic local save and real engine-generated historical record.

`flows.json` records integration checks for draft selection, opposite-parent blocking, nested inspection, all Inspect/Inheritance sections, Swap/Clear/partial pairs, support-to-full-inventory return, no-effect recipients, cancel/no-spend, duplicate item use, tonic arming/stack prevention, cancellation at both attempt review stages, exactly one attempt with exact costs and consumed armed charge, complete ledger records/filters/recorded-role return, and reload persistence. Transactions ran only in the disposable local save, using Quick Results. Hosted UI verification is separate from these local transaction checks.

Reproduce with `scripts/prepare-breeding-window-review.ts` to prepare the fixture, then `BREEDING_QA_SAVE_PATH=/absolute/fixture.json node scripts/capture-breeding-windows-a-runtime.mjs` and `node scripts/validate-breeding-windows-a-runtime.mjs` against the production build. Scripts require Playwright/Chromium paths configured for this environment. See `docs/validation/breeding-windows-a-runtime/` for actual screenshots and machine-readable results.
