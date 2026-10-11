# Breeding Pen — approved B implementation

The user chose concept B: two full-body participants against an open ranch pavilion, compact parchment information panels, and a review ledger along the bottom. Main screens must not scroll; only pop-ups may scroll. Existing creature artwork is retained, with contain sizing and a full-image pop-up.

## Changes

- New clean pavilion background derived from the approved B concept; separate live UI and existing creature art are rendered over it.
- Shared wood header reserves space for Back and Menu. Breeding Ledger and Nursery are in More on narrow/short screens.
- Each participant has role, energy, hearts, Change and Inspect. Desktop shows availability; narrow screens keep the combined readiness control and full status in Inspect/Details.
- Bottom ledger shows actual pregnancy chance, before/after resource values, readiness and Attempt Breeding. Phones retain cost-per-participant and open the full cost breakdown through Details.
- Chance/readiness breakdown, pair options, support items, inherited moves, selection, inspection, artwork, resource warnings and results use the shared native dialog with Escape/focus handling.
- The Breeding Ledger embeds in a scrolling native dialog. All five archive tabs remain available, including remembered pair/creature handoffs. Its detail records use nested native dialogs.
- Support-item transactions and rare-item confirmations, full/quick scene preference, low-resource confirmation, pair memory, swap/random/clear, tutorial hooks, repeat attempts and Nursery routes are preserved.
- All parent-move candidates remain accessible in the inheritance pop-up; the prior six-row display cap is removed.
- Legacy positional CSS excludes the new scenic layout. No gameplay balance or save-schema changes.

## Validation

Production Next.js build and TypeScript pass. All 141 regression tests pass. Targeted ESLint reports zero errors and 17 existing-style image/effect warnings.

Production Chromium checks at 1440×900, 1280×720, 390×844, 360×740 and 844×390 verify no main-page scrolling or out-of-viewport controls in empty, selected, cleared and random-pair states. Both full-body images load and use contain sizing. Checks exercise chance breakdown, support items, inheritance, nested selector/inspection Escape handling, every archive tab without horizontal overflow, pair options, Quick Results, low-resource confirmation and exactly one recorded attempt. No browser exceptions. Main layouts and support-item dialogs were visually inspected against the approved B composition.

The sparse local checkout omits large breeding-scene collections; the production Next build used the existing ignored local scene-manifest stub. That stub, review saves and test harnesses are not committed. Result-scene artwork is retained unchanged, but its full asset pipeline was not exercised locally.

## Asset provenance

`public/images/ui/interiors-v1/breeding.webp` is the clean background plate. Generated through the built-in image tool from the approved B concept; converted to WebP quality 90. No creature artwork was generated or modified for implementation.

Prompt: Create a clean wide landscape 16:9 game background plate from the approved Breeding Pen UI concept. Preserve the painterly sunlit fantasy ranch pavilion, timber beams, leafy vines, distant mountains and buildings, wooden fence and warm ground. Remove all characters and all UI, including parchment, text, buttons and icons. Reconstruct the scenery naturally, with empty quiet ground for existing game artwork. Match the approved warm painterly style.

Implementation remains on draft PR 21, unmerged, with a branch preview deployment.
