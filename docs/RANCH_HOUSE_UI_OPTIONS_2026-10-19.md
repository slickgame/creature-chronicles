# Ranch House visual review — 2026-10-19

Status: A selected after the user revised the initial C choice. See `RANCH_HOUSE_A_RUNTIME_2026-10-19.md` for integration and actual-game validation. The original comparison board remains unchanged.

## Actual-game evidence

`scripts/capture-ranch-house-review.mjs` captured the current production build at1440×900 and390×844. Ten screenshots cover all four house pages plus the current daily ledger. Browsing left the normalized save unchanged; no browser runtime errors were recorded. The existing house background is real. Missing unrelated sparse-checkout images use the existing QA-only fallback, with no placeholder assets added to runtime.

Files in `docs/validation/`:

- `ranch-house-before-management-{1440,390}.jpg`
- `ranch-house-before-care-{1440,390}.jpg`
- `ranch-house-before-records-{1440,390}.jpg`
- `ranch-house-before-rest-{1440,390}.jpg`
- `daily-ledger-before-{1440,390}.jpg`
- `ranch-house-review-capture.json`

The current house uses a sunny room, parchment action panel, small sans-serif hints and four pages. The daily ledger is a separate existing window and retains a canonical creature illustration. It will receive its own design review after the house.

## Options

A — Scenic desk: large unobstructed room view and a compact navy/gold action panel on the right. Phone uses a small room vignette and focused panel, with four section tabs arranged2×2. Recommended because it extends the scenic Habitat A while retaining the house identity.

B — Home dashboard: compact centered window with three equal action cards on desktop, stacked on phones. Actions take visual priority over scenery.

C — House register: vertical section navigation beside aligned action rows on desktop; compact tab navigation above the register on phones. Includes a modest room inset.

The comparison board is `public/images/ui/ranch-house-review/options.png`. It is concept art, not a live game screenshot. All options use navy/slate, warm ivory serif typography, ornate gold frames, painted ivory/gold functional icons and emerald selection. Generated copy is illustrative; the complete existing behavior and relevant hints must remain accessible when integrating the selected design.

## Functional inventory

| Section | Existing actions |
|---|---|
| Management | Farm work & production; Ranch upgrades & repairs; Storage & inventory |
| Care | Growth planner; Habitat fields; Egg nursery |
| Records | Creature roster; Ranch ledger; Story journal |
| Rest | Review & End Day |

Keep Back to ranch and room minimize/expand. The concept may place the existing Menu route in the house header for consistent navigation. Direct tabs replace redundant Previous/Next section controls when all four sections are available. Preserve compact/short-screen variants, native dialog accessibility, complete hints, current house-page return behavior and per-save state isolation. End Day must keep its existing separate review/confirmation.

No new farm assignment, housing placement, passive production, Cleaning, illness, day progression or resource rules. Preserve the approved room art. Implementation follows the user's concept selection and must include exact fonts, size, spacing, icons, borders, control states and actual-game desktop/phone verification.

## Sequence after selection

1. Integrate the selected house layout and all four pages using the approved asset family; generate only missing illustrations and build native frames/controls.
2. Review the daily ledger separately: Priorities, Brief, Event, Goals, Records and Moods, preserving all current information and links.
3. Review End Day and its food/recovery/construction summaries and next-morning results, preserving explicit confirmation and current mechanics.

PR21 remains draft/unmerged. This document records the original review; the runtime document records the selected A implementation.
