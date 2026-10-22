# Feeding Station menu polish

Refines the approved connected B/A/C Feeding Station rather than introducing another menu direction.

## Delivered

- Three independently generated painted action icons: Tonight’s meals, Food & ingredients and Food sources. All retain true alpha, direct color and navy/antique-gold materials.
- Fourteen editable SVG surfaces: ornate window and panel, portrait frame, action, standard/primary/selected/hover/disabled controls, field, quantity card, divider and fed/shortage badges. Nine-slice borders retain their corner size across desktop and phone layouts.
- Deeper navy faces, warm ivory typography, antique-gold ornament and dividers, quieter support text and clearer quantity cards. Existing Tinos regular/bold fonts remain explicit 400/700.
- Canonical dedicated bust portraits in both resident rows and the selected meal inspector. Actual names, levels, conditions and diet remain visible. No full-body profiles are used by these views.
- Focused phone views, viewport-based paging, readable controls and the existing shared feeding count. Food settings retain review, cancellation, freshness and duplicate-submit guards.

## Asset provenance

`public/images/ui/feeding-station-connected/polish-v2/manifest.json` maps the native surfaces and slice sizes. `provenance.json` records original generated icon names, prompts and source/runtime SHA256 hashes. `scripts/build-feeding-polish-assets.py` rebuilds all SVGs. The existing pantry and resource illustration families are reused.

This is a presentation-only change. Feeding allocations, diets, stock, reserves, automatic food permissions and sleep behavior use the previously integrated engine.

## Verification

Production build and TypeScript pass. ESLint has zero errors; existing native-image advisories remain. All 158 focused production-browser checks pass with no runtime errors. The suite checks all three views at eight desktop, phone and short-landscape sizes, navigation and remembered selections, settings review/cancel/confirmation, stock preservation, exact sleep allocations, empty ranches and 17-resident paging. Dedicated checks verify all five base-family portrait files exist and load through the registered portrait path.

Actual final game screenshots, made with a QA save, are `docs/validation/feeding-polish-{hub,meals,supplies}-{1440,390}.webp`. They are separate from concept art. PR #21 remains draft and unmerged.
