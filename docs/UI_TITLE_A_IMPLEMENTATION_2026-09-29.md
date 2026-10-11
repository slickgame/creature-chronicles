# Approved title screen A — 29 September 2026

The user selected A (Scenic Welcome). Implemented in the existing draft PR #21; do not merge or deploy to production without approval.

## Player-facing changes

- Original Creature Chronicles logo over a full painted alpine ranch scene.
- One primary Continue action with live ranch, player, day, creature and egg summary; new players see New Game instead.
- Smaller wood New Game, Load Game and Settings controls, with a quiet Import / Export Save action.
- Parchment save selection and settings dialogs; readable wrapping save names; safe cancellation before deleting or replacing an occupied file. New Game selects the first empty slot when available.
- Responsive desktop, tablet, phone and short landscape layouts. The summary moves below Continue on phones, while long names expand naturally.
- Removed duplicate title, development build labels and the nonfunctional Exit button. Save schema and game mechanics are unchanged.
- Named the root style `titleScreen` to keep the legacy dark-screen global text override from washing out parchment text.

## Art provenance

Approved concept: [A — Scenic Welcome](https://drive.google.com/file/d/1NAyJPlcOvqBOj9bYRYiD-05kjIJiMNLo/view).

Edited A with the built-in image-generation tool into a clean background, keeping its camera, house, gate, lighting and mountain scenery. No UI or sample save text is baked into the runtime background. Generated source: `exec-bb7b12a2-0d5d-4ea7-a982-0bd93f5e9e0c.png`. Runtime asset: `public/images/ui/title-v1/scenic-welcome.webp`, 1672 × 941, 544,008 bytes, WebP quality 88. Existing logo, ranch wood, parchment and icon atlas are reused.

Exact editing prompt:

```text
Use case: precise-object-edit. Asset type: production background for the approved Creature Chronicles title screen. Edit the provided approved Option A image into a CLEAN BACKGROUND PLATE ONLY. Preserve the original camera, composition, lush handpainted rendering, colors, afternoon sunlight, alpine mountain skyline, blue sky, lake, ranch house in center-right, smaller green-roof outbuildings on far right, foreground wooden gate and welcoming path, tree canopy upper-left and wildflowers. Remove ALL UI: the entire logo upper-left, all menu buttons on left, Continue, save-summary parchment, icons, version and every letter/number. Reconstruct the landscape naturally in those removed regions with the same trees, distant mountains, grassy meadow and foreground flowers. Keep left third visually calmer and slightly shaded by the tree so live UI can be placed there later, but do not paint any new panel, sign, banner or dark overlay. Do not move the ranch house or change the framing. No people, no creatures, no text, no watermarks. Output same wide 16:9 framing at high detail.
```

## Validation

- Next production build and TypeScript passed.
- 141 regression tests passed. Updated the pre-existing transfer-action source assertion to the approved Import / Export Save label.
- Targeted ESLint: no errors; one standard warning for the existing raster logo rendered with an img element and a fallback.
- Production Chromium checks at 1440×900, 768×900, 390×844, 360×740 and 844×390: primary action above the fold, no horizontal overflow, one title, loaded scenery, readable save details.
- Checked Continue and Load navigation, new-player save creation, automatic first-empty-slot selection, delete/replace cancellation, safe initial focus, nested-dialog Escape, Settings and import/export round trip.
- Long player/ranch names wrap at 360 px. No browser exceptions. Screenshots captured from the actual production build and compared with approved A.
- Local sparse checkout omits unrelated creature/breeding art; local build uses the existing ignored manifest stub. The branch preview runs the full repository asset pipeline.

## Remaining UI priorities

The earlier interior-navigation overlap, chores detail clipping, roster/profile hierarchy and nursery status presentation remain separately documented in `UI_NEXT_PASS_2026-09-29.md`. They are not part of the selected title-screen concept.
