# Nightly care review — 2026-10-15

The end-day confirmation is now a full-screen illustrated care book with four pages: Tonight, Food, Recovery and Timers. The House's Rest action and existing End Day shortcuts use the same screen. The approved resting art is reused, with minimize/expand controls. At-home residents are the default illustration; selecting a trainee in Recovery shows that creature's profile with a clear With Rhea label.

## Actual overnight projection

`getNightCareReview` uses `projectRanchDay` on an evening-review copy. Opening the preview does not commit transactions, spend food, apply rewards to the actual save, or advance time. The review includes:

- Required/covered/missing food units, stored and reserved Balanced rations, legacy Feed used and current ingredient-feeding settings. The projection includes earned rewards processed before overnight feeding; it assumes no further player work or cooking.
- Player Energy and per-creature Energy, Hearts and Affection before/after values. Food coverage, recovery talents, ranch condition and away-at-training rules use the same engine as actual sleep. These values are projections; the morning report confirms final night results.
- Paid builder and production work orders with exact readiness dates, training collection status and aggregate nursery readiness. Construction is not purchased or charged again by this screen.
- The actual posted tax and present Gold on Day 30.

Recovery and Timers have quick selectors and Previous/Next controls. Empty ranches and no-timer cases remain usable. No balance, recovery formula, construction duration, reward, creature-art registry or save schema changed.

## Source navigation and confirmation

Food links open Farm Management or Pella; recovery links reach care, repairs or Rhea; timer links reach Petra, training or nursery. Session-only navigation state remembers the opening screen, tab and selected entry. Returning to the opening screen restores the review. Petra retains her existing nested Yard → Town → Ranch path. Keep Playing/Escape clears the pending return and cancels evening review. Loading a different ranch resets the pending return.

Sleep remains the existing guarded day-end transaction. A successful sleep opens a paged Morning Report with two summary items per page; every original summary item remains reachable, and Review Morning Brief remains available. No long summary list is inserted into the night menu.

## Art provenance

No new bitmap generation was required. Reuses `public/images/ui/ranch-v3/house.webp`, the existing parchment texture, shared SVG RanchIcon symbols and approved feline/equine/canine/lapine resting/profile assets. The House background is shaded using CSS. Original prompts and masters remain documented in the ranch art notes and `CANINE_LAPINE_ART_MANIFEST_2026-10-15.json`; source artwork was not altered.

## Validation

- All 322 regression tests pass. New tests compare food and every creature's Energy/Hearts/Affection against committed sleep across food and ranch-condition cases; verify paid work orders and away trainees; and cover empty ranches and the calendar-driven tax notice.
- Optimized production build and TypeScript pass. Scoped ESLint has zero errors and two image-element warnings. Whitespace checks pass.
- Browser QA exercises desktop 1440×900, phone portrait 390×844 and phone landscape 844×390, for full, food-short and empty ranches. All night pages, creature/timer selections, minimized art and every morning-report page fit without scrolling or offscreen controls. Pella/repairs/Petra source returns restore the selected page/entry. Cancellation preserves day/resources; actual sleep advances one day and matches food/recovery previews in all three cases. No JavaScript page errors occurred. Evidence is archived with the reviewed screenshots. Missing old assets in the sparse checkout are intercepted only by the test harness.

PR #21 remains draft and unmerged. Published commit and Vercel status are reported separately.
