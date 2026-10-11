# Approved B — Round Ledger

Replaces the three plan cards with aligned creature, move, target and Battle Energy rows. Clicking a row opens that creature's move dock; queued plans remain until replaced. The right column shows living-creature readiness and Confirm Round, with Moves, Items and Inspect below. Shared targets produce an optional review link, never a blocker or a claim of guaranteed damage. The review dialog lists complete names and costs and offers per-creature editing. Fainted creatures require no plan.

Reuses existing parchment styling, portraits and canonical full-body art. No new assets needed. No balance, engine, rewards or save-schema changes. Main layouts remain fixed; only dialogs scroll.

Validation: production build and TypeScript pass; scoped ESLint zero errors (7 existing image-element warnings); all 6 battle UI tests pass. Browser checks at 1920x1080, 1440x900, 1280x720, 768x900, 390x844, 360x740 and 844x390 pass collapsed and expanded docks, pagination, previews, status/dialog access, loaded images, unobstructed controls and no page scrolling. Three row edits and target double-click queues produce a 3/3 ready ledger; shared-target review lists all three plans. Confirm and paused playback retain six distinct HP updates. Footer screenshot visually reviewed.

Approved concept: B Round Ledger, generated 2026-10-02. PR stays draft and unmerged.
