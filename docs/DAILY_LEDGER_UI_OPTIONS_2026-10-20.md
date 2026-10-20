# Ranch Ledger visual review — October 20, 2026

Status: user selected A on October 20, 2026. Runtime integration complete;
see `DAILY_LEDGER_A_RUNTIME_2026-10-20.md` for actual-game evidence and validation.
Training Grounds is omitted from ranch priorities; cleanliness remains planned.

Concept board: `public/images/ui/daily-ledger-review/options.png`.
Generated with the built-in image-generation tool; original output is
`generated_images/exec-a1d36eb2-a614-408f-b5e9-1d85a98940aa.png` in the workspace.
Prompt specification: three comparable desktop/phone options, exact existing
six sections, navy/gold Tinos-style hierarchy matching Ranch House A, sample
food/nursery/work/tax/condition/training entries, explicit source actions and
Begin Ranch Day footer. No new gameplay or substitute creature illustration.
The generated farmhouse is illustrative; integration must reuse canonical art.

The completed Ranch House A is the style reference. This review covers the
existing Ranch ledger and morning brief, not the separate End Day transaction.

## Current-game evidence

- `docs/validation/daily-ledger-before-1440.jpg`
- `docs/validation/daily-ledger-before-390.jpg`
- Captured by `scripts/capture-ranch-house-review.mjs` before the House integration.
  The LedgerPanel runtime has not changed since those captures.
- Current sources: `src/features/navigation/LedgerPanel.tsx`, its CSS module,
  and `src/data/ranchLedgerBook.ts`.

The current phone view gives excessive space to the room, scales the resident
art very small, and retains parchment/Arial styling unlike the approved House.

## Directions

- **A — Scenic briefing:** visible farmhouse with a compact right-hand briefing,
  paged priority rows and selected-entry details. Closest companion to House A.
- **B — Ledger & inspector:** a compact six-row priority table beside complete
  selected-entry information. Phone separates Entries and Selected entry.
- **C — Compact daybook:** section rail, illustrated priority grid and a shared
  selected-entry detail strip. Phone uses compact paged tiles.

All options retain Priorities, Brief, Event, Goals, Records and Moods. Numbers
and status copy in generated concepts are illustrative, not current save data.

## Integration acceptance after selection

- Preserve the canonical farmhouse and any retained creature art; do not
  generate substitute resident artwork.
- Explicit Tinos regular/bold, deep navy faces, gold ornate native frames,
  emerald selected controls, approved painted icons and compact proportions.
- Every entry and complete note remains reachable. Page by available height;
  never crop overflow or truncate underlying records.
- Preserve morning first-day empty state, warnings/highlights/next steps,
  unresolved/resolved event states, requirements, goals/reward state, reversed
  activity history and individual creature mood explanations.
- Browsing, paging, art controls and canceling are read-only. Begin Ranch Day
  remains an explicit existing action. Active-day footer opens the separate
  Review & End Day window, not immediate sleep.
- Daily-event choices retain separate review, fresh-save checks, protected
  supplies and once-only resolution. Source visits retain exact return entry.
- Verify actual desktop, phone, short landscape and empty/long-content states
  against the selected concept before calling integration complete.
- No resident dock is added to the ledger. Existing Habitat tiles already show
  name, level and status.
- PR21 remains draft and unmerged.

After the ledger is integrated and verified, review End Day and morning results
as separate visual work, preserving the existing day lifecycle.
