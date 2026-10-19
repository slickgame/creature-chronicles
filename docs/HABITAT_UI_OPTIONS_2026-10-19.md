# Habitat visual review — 2026-10-19

Status: A selected and integrated; see `HABITAT_A_RUNTIME_2026-10-19.md`. The unchanged board remains the acceptance reference.

## Current-game evidence

- Desktop: `validation/habitat-before-1440.png` (1440×900).
- Phone: `validation/habitat-before-390.png` (390×844).
- Captured from the current production build with an isolated established-ranch QA save. Sample resident Mira has Energy 35/91, Hearts 3/4, Affection 50/100 and Hurt status; Feline Habitat contains one resident out of four spaces.
- Family courtyard and selected canonical full-body art are existing game assets. Missing unrelated sparse-checkout images use the existing QA-only fallback; no fallback assets were added to the game.

## Proposals

A — Courtyard & care: retain scenic full-body focus, replace wood/parchment with approved navy/gold surfaces, compact right-side care inspector and paged bottom resident dock. Recommended because it preserves the previously approved courtyard composition while matching the current creature menu family.

B — Resident ledger: roster-first paged rows beside selected art and care details; focused Residents/Selected resident phone views.

C — Portrait gallery: compact resident tiles with selected creature inspector; focused Gallery/Selected resident phone views.

All concepts use the established ivory serif, gold ornament, emerald selection, painted icon family and compact controls. Generated concepts are illustrative sample data, not live screenshots or replacement creature artwork. Final implementation must use canonical creature art and actual engine values.

## Scope and constraints

- Preserve automatic family housing; current gameplay has no manual placement/transfer controls.
- Preserve residents/capacity/open-space/attention counts, real Energy/Hearts/Affection, injury, pregnancy and training details, Feed restrictions and full art minimize/expand.
- Keep navigation to Ranch House, Breeding, Collection, previous screen and Menu reachable without duplicate Management buttons.
- Retain complete profile access and existing rename, protection and approved removal flows. Update profile/management presentation only after the relevant selection; no new gameplay.
- Preserve empty habitats and capacity overflow visibility. Use explicit pages or focused views for more residents and smaller screens; do not hide content to fit.
- Cleaning, dirtiness, illness and timed service missions remain deferred.
- PR21 stays draft/unmerged. A is now selected; keep implementation aligned with its reference.

## After Habitat

Audit the complete creature journey for visual and navigation consistency across roster, profile, supplies, equipment and Habitat; check desktop, phone and short landscape. Address remaining inconsistent entry points and review/receipt windows using the already approved design families. Treat new Ranch House or other menu redesigns as separate visual reviews.

## Generation

Built-in image generation; one desktop/phone A/B/C comparison board, using the two current-game screenshots as functional and canonical-art reference. Prompt specifies navy/slate/gold frames, ivory Tinos-like serif, emerald controls, the three compositions above, exact sample values and no new mechanics. Source board: `public/images/ui/habitat-review/options.png`. Original generated image: `generated_images/exec-c352c989-b644-4f81-a510-ce59427f40af.png` in the workspace parent. The generated B description says scrollable; implementation must use explicit pagination instead. Open-space tiles in B/C are capacity illustration only, not residents or placement actions. Generated heart symbols and page numerals are illustrative; exact runtime pips and page counts remain authoritative.
