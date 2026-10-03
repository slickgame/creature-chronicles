# Interior consistency audit and proposed concepts — 2026-09-30

Status: review and concept options only; no gameplay/UI code changed. Baseline: `096c4ce29e33e28c365283a15fd29636d6e02aa7`.

## Scope and evidence

Reviewed current source for Chores, roster, Nursery, Breeding Pen, Habitat, Ranch Office, Adoption Hearth, Supply Depot and Egg Atelier, plus their implementation notes. Visually inspected saved desktop/phone Supply Depot captures and desktop Adoption Hearth/Atelier captures. These are existing QA captures, not a new live all-screen browser run. The Hearth QA capture intentionally masks creature art; it is not evidence of missing production creature artwork. No new layout or gameplay tests were run for this audit.

## Prioritized findings

| Priority | Screen | Observed gap | Proposed correction |
|---|---|---|---|
| 1 | Supply Depot | Resource bar maps Materials to tools and Repair Kits to gear, whereas the dock uses distinct actual item art. Talk/ledger/category buttons are plain text; trust has no leaf markers; Pella is tiny in desktop sidebar. | Reuse item assets consistently at every occurrence; reuse new Atelier Talk/ledger/trust assets; enlarge the existing portrait within available space. |
| 1 | Adoption Hearth | Tamsin is represented by a house icon in the steward panel despite an existing portrait asset. Talk/Trust Ledger are text-only. | Use existing `public/images/npcs/town/tamsin_vale_portrait.png`; add matching action icons and five earned/unearned trust leaves. Preserve her identity. |
| 1 | Chores | `CHORE_ICONS` maps both Comfort Care and Garden Tending to leaf. | Give Comfort Care a caring hand/heart and Garden Tending a sprout with a trowel. Audit the five task symbols together for consistent rendering. |
| 1 | Nursery | Selected egg hero uses generic RanchIcon nest; list uses legacy egg/hatch badges. | Carry the new standalone egg/cradle art and timer/readiness presentation into Nursery while keeping Hatch prominent and ready/incubating states honest. |
| 2 | Breeding Pen | Phone CSS explicitly hides secondary action icons. | Fit compact icons alongside labels for support/options/inheritance without shrinking important text or creating scrolling. |
| 2 | Habitat / Office / Hearth | Narrow-layout CSS hides some resource icons. Habitat also reuses paw for residents, affection and Breeding, and house for capacity and Office. | Keep one consistent icon per meaning; compact responsive symbols; preserve text labels and destination clarity. |
| 2 | Shared selected states | Screens use different green fills/borders and text-only status emphasis. | Green border plus a small selection check; consistent ready/locked/shortage cues with labels, not color alone. |
| Retain | Roster / shared profiles | Selected artwork already uses profilePath and detail stats show numbers plus grades. | Preserve full-body contain sizing, portrait list rows, numbers/grades and explicit comparison behavior; no new layout replacement proposed. |
| Retain | All updated screens | Shared in-flow navigation and popup/pagination architecture already exist. | Keep Back/Menu placement, no main-page scrolling, paginated lists and scrolling popups. |

## Concepts shown

Both concepts use the Supply Depot as the example for a shared treatment, not a proposal to rebuild its underlying layout.

- **A — Clean & Consistent:** existing panels, modest brass edging, corrected item symbols, action icons and trust leaves.
- **B — Illustrated Continuity (recommended):** hanging wood nameplates, selective parchment ribbons, botanical accents, larger keeper portrait and clear selected-card check, extending the approved Atelier language.

Concepts are generated proposals, not implemented screenshots. Keep all actual gameplay numbers from the save. B's generated example omits the Usage Details button; implementation must retain Usage Details and access to Pella's existing profile. The illustrated Special gift symbol is a concept placeholder: use an appropriate rare-supplies symbol in production so it does not imply free gifts. Reuse existing Pella art rather than replacing her with the concept rendering.

Built-in image-generation tool, one call per option. Reference: existing `Depot-B-art-counter-1440.png` capture.
- A: generated source `exec-a56737e1-9c48-4f96-9081-8287ee64d74e.png`.
- B: generated source `exec-5671d522-a73e-4c9f-a9ab-753023125ae9.png`.

## Proposed implementation order after selection

1. Shared icon/banner/trust presentation and Supply Depot + Adoption Hearth.
2. Distinct Chores symbols and Nursery egg/readiness art.
3. Compact icon visibility and status consistency in Breeding, Habitat and Office.
4. Verify all affected screens at desktop, tablet, phone portrait and short landscape; check long names, empty/locked states, popup reachability and zero main-screen scrolling.

No gameplay changes, asset replacement for existing characters, branch merge or production deployment are proposed.

