# Fewer pages and contextual help

User request: reduce unnecessary pages in the eight newly updated Breeding Pen windows, beginning with Inspect Overview, and establish this as a future-menu rule.

Status: Inspect’s five compact tabs and contextual help are implemented; see docs/BREEDING_INSPECT_COMPACT_RUNTIME.md. The remaining seven windows below retain their current runtime and are the next density pass. The approved A visual design remains. This document and AGENTS.md establish the standing rule.

## Why page counts grew

`BreedingInspectBook.notes()` makes a page for each supplied line and then splits long lines at 260 characters. Overview appends status, description, identity and every role reason to its vitals page. Even very short lines become full pages. Counts vary by creature; the previous Rook fixture produced 20 Overview pages. The user reports 19 in their current view.

Other examples: Inspect Stats has six individual stat pages plus a comparison table and forecast (eight for a tracked creature). Inheritance Stats has a six-row comparison plus the same six stats as separate pages (seven). Chance repeats each contribution from its table on an individual page. Change Parent adds a page per talent and readiness note. Parent Filters spreads three fields over three pages; Ledger Filters spreads its controls over four pages. Inventory's textPages uses a similar 270-character split, and item reviews append those details again. Ledger comparison repeats the six-stat pattern, with further pages for each recorded talent, move or note.

These are presentation choices, not requirements of the engine or saved records.

## Proposed layouts

| Window | Default content | Contextual help / optional detail | Pagination to retain |
| --- | --- | --- | --- |
| Inspect | Overview: one view containing identity, six vitals, compact active-condition indicators and role badges. Stats: one six-row table. Work: compact Farm/Domestic skill lists with level and XP. Talents: compact talent cards. Lineage: risk, parents and markers together. | Role reasons on badges; identity/origin and protection meaning on info controls; stat meaning and exact growth projection on each row; skill descriptions/baselines/planned-system explanation; talent source/tags. Long saved notes and full ancestry use explicit full records. | Only genuinely large skill/talent/ancestry collections or deliberate phone sections. No Overview page carousel for explanatory notes. |
| Change Parent | Selected candidate's identity, current resources, role eligibility and pair chance/cost preview together. Keep explicit Select/Cancel and existing Inspect candidate. Put all filter controls in one form. | Brief selection/role explanations on help; use Inspect candidate for the complete profile rather than duplicate every profile page. | Parent gallery only. No one-page-per-talent/readiness-note inspector. |
| Support Items | Selected item's exact effect, stock, target, blockers and before/after together. One compact review shows recipient, effect and stock consumption. Receipt shows actual outcome. Armed effects form one compact list. | Definitions, source instructions and secondary catalogue notes on help; long item information opens full details. | Owned item and recipient collections. Long actual records only when necessary; no repeated effect/note pages inside confirmation. |
| Inheritance | Stats: one parent comparison table. Talents: conditional odds plus eligible parent talent cards. Moves: compatible direct/combination rows with their actual chance. Family: offspring identity and compatibility together. | Stat caveat, conditional-roll rules, talent descriptions and move chance reasons on their relevant row/card. Keep canine eligibility warnings visible. | Genuine talent/move collections when they exceed the viewport. No six extra stat pages or page per chance explanation. |
| Pair Options | Retain four compact tools and current-pair summary; this window already has no detail carousel. | Swap/random/clear explanation and Full/Quick meaning attached to their controls. Retain concise action labels and visible disabled reasons. | None needed for the normal view. |
| Chance Details | One contribution table; one readiness view listing active blockers/warnings; one cost table including discount and progression (XP/streak). | Explain each contribution beside its row. Separate pregnancy eligibility from ability to attempt in visible status. | No duplicate page per contribution, parent cost row or short readiness note. |
| Review Attempt | One decision summary: both parents, exact per-parent before/after, chance and actionable warnings; Confirm/Cancel remain persistent. | Generic process instructions on an info control. Material consequences remain visible. On short screens use a compact warning summary and explicit complete warning view if required. | Only a necessary compact-screen division of substantial review content. No page solely saying Cancel is read-only. |
| Breeding Ledger | Keep record list and selected summary. Complete record groups Outcome, Costs & progression, and linked Offspring/care. Use a single six-stat historical/current comparison table and grouped talents/moves. Put all filter fields in one form. | Metric definitions on labels; genuine historical prose/source notes remain complete in the full record. Historical saved values and current parent values remain clearly distinguished. | Actual attempts/pairs/creatures/tree nodes and multiple linked offspring. Do not convert complete historical evidence into brief tooltips. |

## Inspect Overview acceptance example

One overview presents name/species/type/level, Energy, Hearts, Affection, XP and availability; compact condition labels show pregnancy/timer, active injury and protection; role badges expose the complete existing reasons. A short description can remain inline. Origin, generation, rarity and coloration group under identity help/details. Long saved narrative remains accessible through a named full-notes action. None of this browsing changes the save.

The default is one Overview view, not a fixed arbitrary page cap that clips data on short phones. Phone layouts prioritize visible vitals, conditions and relevant actions, with one purposeful More details view only when necessary. Role collections may wrap or use a focused all-roles popup; they must not generate one full overview page per role reason.

## Standing interaction rule

1. Keep decision facts visible: values, exact costs, resource changes, blockers, active conditions and meaningful consequences.
2. Use brief contextual help for explanations; include hover, keyboard focus and explicit tap/click access. Use a visible info affordance where discoverability is uncertain. Do not depend on native title alone.
3. Use a focused read-only popup for long descriptions or complete records. Never put an entire manual in a tooltip. Preserve selection/filter/source return.
4. Use pagination for genuine collections or substantial distinct views, not a line count or paragraph length. Group filters and related values.
5. Verify help in the dialog top layer, viewport edges, keyboard/Escape and touch. Opening/dismissing help must never select, consume, confirm or spend.
6. Verify every section and nested window on desktop, phone and short landscape; confirm that reduced page counts preserve every authoritative value, reason, saved note and transaction safeguard.

Implementation order: Inspect and shared contextual help; Change/Chance/Inheritance; Support reviews/filters; Ledger full records and remaining review/warning windows. Keep the approved A assets and existing gameplay helpers throughout.
