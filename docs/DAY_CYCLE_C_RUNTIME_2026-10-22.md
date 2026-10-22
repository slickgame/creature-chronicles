# End Ranch Day and Morning Report — approved C

The user chose C's resident recovery ledger because creatures can be selected individually. Both screens now share the navy/gold day-cycle kit, explicit Tinos Regular/Bold, canonical registered bust portraits and responsive resident paging.

## Behavior

- End Ranch Day retains Tonight, Food, Recovery and Timers. The roster shows the actual creature name, level, condition, feeding result and projected Energy. Selected details contain exact Energy, Hearts and Affection values, complete meal allocations and care notes.
- Selection survives page changes, opening/closing the Feeding Station, and the handoff into the Morning Report. Destination return state retains the selected creature and timer. Keep Playing returns without consuming food or advancing the day.
- The persistent summary shows fully fed creatures, food units, player Energy and timer readiness. Zero ready timers never means all timers are finished. Tax and food warnings remain visible, with complete paged details and existing food/repair/supply destinations.
- Morning Report uses the actual before/after saves from the confirmed sleep. It reads recorded allocations and final resident values without projecting another night. New and missing residents have explicit states. Summary, Residents and the complete Full log remain reachable. Recovery, Meal and Care details are focused rather than scrolling.
- Normal desktops show the roster and inspector together. Phones and short landscape use Residents / Selected creature, or Timers / Selected timer. Long care notes and complete food allocations open matching paged windows. Room minimization and return actions remain accessible.
- Sleep still commits through the existing guarded day-advance path. No feeding, recipe, recovery, work, equipment or timer mechanics were changed.

## Assets and fidelity

`public/images/ui/day-cycle-v1/concept-c.webp` is the selected reference. The kit contains seventeen native surfaces/symbols, two painted emblems and one clean twilight room plate. Existing canon portraits, vital icons and food art remain shared. The downloadable archive includes the fonts and OFL license. Labels and values render natively; illustrative concept wording is not copied into rules or receipts.

The prior parchment/sleeping-illustration screenshots are retained separately under `docs/validation/day-cycle-before/`. Final screenshots use a QA save and are actual production-game output, not concept art. No user save was edited during verification.

## Validation

Production build and TypeScript pass. Focused data tests cover actual saved outcomes, read-only receipts, new/missing residents, completed construction, full-log paging, food projections and once-only sleep. The production browser suite checks desktop, phone, short landscape, complete notes/logs, portrait loading, cross-screen selection, stock-preserving browsing, large/empty ranches and timer/warning states. Results and final screenshots are captured by `scripts/validate-day-cycle-c.mjs`.

Final checks: 20 data tests, 206 day-cycle browser checks, 164 connected Feeding Station checks and 21 ledger-clarity checks pass (411 total). There are no browser runtime errors. ESLint has zero errors and three native-image advisories. Viewports: 1440×900, 1280×720, 1920×720, 2560×1440, 390×844, 360×740, 844×390 and 390×500. Bounds checks include panel/footer collisions as well as viewport fit.

Screenshots: `docs/validation/day-cycle-c-{night,morning}-{1440,390}.webp` and their `night-roster` / `morning-roster` counterparts. Short screens use focused views; full care notes and food allocations retain every word through explicit paging.

PR #21 remains draft and unmerged.
