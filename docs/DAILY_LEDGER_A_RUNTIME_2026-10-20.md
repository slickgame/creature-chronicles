# Ranch Ledger A — runtime integration

The user selected Scenic briefing A on October 20 and requested the complete
visual treatment: fonts, sizing, spacing, layout, icons and control states.
Reference: `public/images/ui/daily-ledger-review/options.png`, top row.

## Result

`LedgerPanel` now uses the approved navy/gold family and canonical farmhouse,
with a bounded scenic desktop composition, compact three-row entry list and
selected-entry inspector. Tinos 400/700 replaces Arial/Georgia defaults. Painted
food, egg, work, condition, tax and ledger art renders directly, with gold native
frames and emerald active controls. The phone has 3×2 tabs and a real room
vignette. Short phones use explicit Entries/Selected entry views. Detail pages
preserve complete longer records instead of overflowing the footer.

The complete reusable asset kit and source hashes are in
`public/images/ui/daily-ledger-a`; its README maps assets and typography.

All six sections remain: Priorities, Brief, Event, Goals, Records and Moods.
First-morning, empty, attention, blocked, resolved and long-record states use
the same kit. Event choices now review inside the matching ledger panel.

Five priorities cover Food tonight, Nursery, Farm work, Monthly tax and Ranch
condition. Training Grounds is omitted only from this book’s priority list.
Its gameplay, normal navigation and relevant historical reports remain intact.
Habitat cleanliness is planned and has no placeholder or invented live value.

The existing Habitat resident dock retains name, Level N and actual status.
Moods additionally shows the creature’s live level and management status.

## Behavior preserved

- Browsing, choosing entries, details paging, resizing, minimizing and canceling
  are read-only.
- Begin Ranch Day remains an explicit morning action, without advancing the day.
- Active-day footer opens the existing End Day review. Keep Playing cancels it.
- Source links preserve the ledger section and stable entry key when returning.
- Event confirmation validates current resources and once-only resolution.
  Gold/rations are changed only on confirmation; Escape returns from review.
- Goals, full activity history, mood reasons and event requirements remain
  reachable. Illustrative concept quantities are never used as live values.
- Canonical creature and room art is preserved. The generated farmhouse on the
  option board remains illustrative only.

## Verification

Production build and TypeScript check passed. ESLint reported zero errors and
six existing-style native image advisories. The four focused data suites passed
16 tests covering ledger completeness/read-only behavior, event resolution,
planner projections, night care and day lifecycle.

`scripts/validate-daily-ledger-a.mjs` passed 169 browser checks with no runtime
errors. Combined with the data suites, 185 checks passed. It verifies rendering at
1440×900, 1280×720, 1920×720, 2560×1440, 390×844, 360×740, 844×390 and 390×500.
Checks include every section, complete long-record pages, viewport/child bounds,
font weights, art controls, exact event payment and saved result, review cancel,
begin-day behavior, Nursery return selection, End Day review/cancel and resident
name/level/status. It also covers first-morning and empty sections at desktop,
phone and short-phone sizes. Results and actual screenshots are under
`docs/validation/daily-ledger-a-*`. Absent daily events and goals regenerate on
normal save loading; their otherwise-empty book branches are covered by the
data suite. Browser empty-state checks cover Brief, Records and Moods.

PR21 remains draft and unmerged. Next visual review: End Day and morning results.
