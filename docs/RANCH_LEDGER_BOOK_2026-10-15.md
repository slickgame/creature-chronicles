# Paged ranch ledger and morning brief — 2026-10-15

Replaces the long ledger side panel with an illustrated full-screen record book. Priorities, Brief, Event, Goals, Records and Moods each display one entry at a time. Every section has a quick selector and Previous/Next buttons; the illustration can be minimized. Empty sections explain their state. The existing compact Today button and House Records action open this shared book.

## Records and priorities

`getRanchLedgerBook` preserves every available warning, highlight, next step, daily goal, recorded activity and creature mood. Warnings and attention rows appear first. Activities are newest first; the book does not truncate the existing saved record list. Each record has a stable key. No new save fields or rewards are introduced.

Priorities use the existing detached overnight planner for food, nursery, optional instant work, taxes, condition and training. Direct links use explicit destinations rather than guessing from prose. Food also has a direct Pella ration shortcut. Moods link to the creature roster; other sections offer a Care & source links shortcut. The selected section and stable entry key are kept in session navigation state so fixing a shortage can reorder the priority list without changing the restored selection.

## Event choices and day flow

Daily events show the exact stored choice description, requirement and current blocker. Review choice opens a focused confirmation; Cancel does not spend resources. Confirmation rechecks the latest save through the existing event reducer, uses the existing save transaction flow, and records one result. Resolved events expose their saved receipt rather than a second purchase button. Gold, named-resource grants, reserve protection, event odds and daily-goal processing remain unchanged.

Begin Ranch Day retains the original tutorial signal and day-state transition. Closing the morning ledger dismisses it for the current save/day instead of immediately reopening it, including when reached through a Morning Report. The player can reopen it from Today. Active-day ledgers link to the existing nightly care review. Source return state resets when loading another ranch or closing the ledger.

## Art provenance

Reuses the approved House background, parchment texture and canonical creature profile artwork. No new generated assets, image edits or generation prompts were required. Existing creature art manifests and ranch art notes remain authoritative. Breeding scenes, battle presentation and creature identities are unchanged.

## Verification

- Full regression suite: 325 tests pass. New tests cover read-only construction, complete 100-activity preservation, priority destinations/keys, exact event fees and named ration grants, resolved-result presentation, duplicate prevention and empty sections.
- Optimized production build/TypeScript pass. Scoped lint has zero errors and two image-element warnings; whitespace checks pass.
- Production browser checks cover morning, insufficient-Gold, empty and reserved-Wood ranches at 1440×900, 390×844 and 844×390. Every section, quick selector, representative entries of the 100-record list and minimized art fit without scrolling or offscreen controls. Cancel/confirm, exact 35 Gold/5 ration purchase, reload persistence, blockers, source return, Begin Day, sleep/report return and dismissal pass. A real Pella purchase reorders priorities and restores the same Food entry by key. No JavaScript page errors occur. Reviewed screenshots are archived in Drive. Sparse-checkout legacy image gaps are intercepted only by the test harness; no placeholders are added to production.

PR #21 stays draft and unmerged. Commit/push and deployment status are reported separately.
