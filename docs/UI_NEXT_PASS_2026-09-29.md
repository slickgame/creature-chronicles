# Menu guide and next UI pass — 29 September 2026

## Approved and implemented

The user approved the scenic ranch visual pass and requested moving the annoying floating Guided Chapter 1 bubble into the menu.

- Menu → Chapter 1 Guide now opens the current lesson in the shared parchment dialog.
- Removed the global floating card, persistent spotlight, target animation and document-wide click interception. The player can explore freely while the guide is closed.
- Tutorial preparation, signals, progression, catalyst grants and completion remain active. This does not skip or reset the walkthrough.
- Lesson destinations remain available, including direct morning/evening reviews. Opening a review does not sleep or advance time.
- Skip Walkthrough remains available inside the guide with explicit confirmation. Closing the guide returns to play; Back to Menu returns to the menu.
- The separate first-battle coach and story scenes are unchanged.

Validation: production build and TypeScript passed; 141 regression tests passed. Chromium checks at 1440 and 390 px verified no floating card, unrestricted navigation, menu access, cross-screen Morning Brief routing, recorded progress, next lesson routing, and the guide remaining hidden after reload. No browser exceptions.

## Home screen: A approved and implemented

The user selected A — Scenic Welcome for the title/Continue screen. The implementation uses the original logo, an art-only background derived from A, live text buttons and current save data. Continue remains visible on desktop and phone; new players see New Game as the primary action. The save summary stacks below the primary action on phones.

Observed title-screen issues: logo plus duplicate giant title, development-facing “Planning Rebuild” and build-phase text, mismatched buttons, heavy dark overlays, and Continue below the initial 1440×900 viewport. The existing save safeguards must remain intact.

- [A — Scenic Welcome](https://drive.google.com/file/d/1NAyJPlcOvqBOj9bYRYiD-05kjIJiMNLo/view): recommended. Existing logo, prominent Continue plus compact save summary, smaller New Game / Load Game / Settings and quiet Import / Export Save; most scenery remains visible.
- [B — Ranch Journal](https://drive.google.com/file/d/1De-WsXAr9R4Ov6qV4BkDXm7PXudIPn3P/view): a larger parchment folio contains save details and actions.

The linked images are concepts. A is now implemented; B remains an alternative reference. The implementation uses actual save values and version, retains the existing logo, and places New Game, Load Game and Settings in the shared parchment dialogs. Delete/replace confirmations and import/export behavior remain intact. See `UI_TITLE_A_IMPLEMENTATION_2026-09-29.md` for asset provenance and validation.

## Proposed order after title approval

1. Title, save selection and settings: clear Continue/New Game hierarchy, concise save summaries, consistent material treatment and safe file actions.
2. Creature roster and profiles: stronger portrait hierarchy, compact readable condition/role summaries, clearer selected creature and comparison flow. Existing filtering/sorting already exists; improve its presentation rather than duplicate it. Original concept C remains a reference, not approved implementation scope.
3. Ranch Chores: make current assignments, projected overnight results, eligible helpers and any unavailable reasons easier to scan together.
4. Nursery and breeding: make ready / incubating / pregnant / recovering states, remaining time and the next available action visually consistent.
5. Mobile and navigation consistency: location discovery on the pannable ranch, less repeated chrome in interiors, reliable return paths, and readable empty/locked states.

Continue using concept approval followed by actual in-game screenshot comparisons. Keep PR #21 draft and unmerged.

## Concept provenance

Generated with the built-in image-generation tool (ui-mockup), using the approved V2 ranch screenshot as material/style reference and the existing game logo as the identity reference. Options are saved in the existing Drive UI review folder. Prompt set follows.

```text
Use case: ui-mockup. Create high fidelity 16:9 desktop TITLE / MAIN MENU concept art for Creature Chronicles. Image 1 is ONLY the already-approved ranch rendering style, wood/brass/parchment materials and palette reference. Image 2 is the existing logo to preserve faithfully. This is the title screen BEFORE entering the ranch, so do NOT include game HUD, map building labels, Today tasks, ranch dock or End Day. Preserve the lush handpainted alpine ranch setting and use polished original logo, warm ivory serif typography, dark carved walnut, brass edging and muted forest-green primary button. Calm, readable game UI, generous breathing room. No development labels, no feature/build-phase banners, no duplicate title. Invent no creatures or characters. Small unobtrusive version text bottom corner. Option A: SCENIC WELCOME. Wide scenic alpine ranch background seen from the front gate, rich foreground flowers and inviting house. Large existing logo at upper-left. An elegant small vertical menu beneath it in left third: one large green button 'Continue', then wood buttons 'New Game', 'Load Game', 'Settings'. A compact parchment save summary next to/below Continue reads 'Bramble Farm', 'Rowan · Day 1', '5 creatures · 0 eggs'. Lower left quiet text-link 'Import / Export Save'. The right two-thirds stays mostly open landscape. Screenshot composition not a presentation board; discreet top margin label 'A · Scenic Welcome'. Prefer immersive spaciousness, no huge opaque central panel. Text legible.

Use case: ui-mockup. Create high fidelity 16:9 desktop TITLE / MAIN MENU concept art for Creature Chronicles. Image 1 is ONLY the already-approved ranch rendering style, wood/brass/parchment materials and palette reference. Image 2 is the existing logo to preserve faithfully. This is the title screen BEFORE entering the ranch, so do NOT include game HUD, map building labels, Today tasks, ranch dock or End Day. Preserve the lush handpainted alpine ranch setting and use polished original logo, warm ivory serif typography, dark carved walnut, brass edging and muted forest-green primary button. Calm, readable game UI, generous breathing room. No development labels, no feature/build-phase banners, no duplicate title. Invent no creatures or characters. Small unobtrusive version text bottom corner. Option B: RANCH JOURNAL. Full painted alpine ranch scene behind a carefully designed open parchment folio occupying the right half. Existing game logo on upper-left over scenery. Right folio title 'Welcome Back', with a small tasteful painted farmhouse vignette; active save 'Bramble Farm', 'Rowan · Day 1', '5 creatures · 0 eggs', green button 'Continue'. Below one quiet horizontal divider and three clear secondary rows 'New Game', 'Load Game', 'Settings'. Bottom folio text-link 'Import / Export Save'. The folio is warm tactile parchment bound with dark wood and brass edging matching approved ranch; not a modern dashboard. Left half retains open mountains, ranch and paths. Screenshot composition not a presentation board; discreet top margin label 'B · Ranch Journal'. Do not duplicate any action. Text legible.
```
