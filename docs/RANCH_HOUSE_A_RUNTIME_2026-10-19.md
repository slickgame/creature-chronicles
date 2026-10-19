# Ranch House A — Scenic desk integration

The user revised the initial C selection to **A** and requested matching fonts, sizes, spacing, layout, icons and all necessary assets. The acceptance reference is the unchanged first band of `public/images/ui/ranch-house-review/options.png`.

## Result

Ranch House keeps the sunny original room and A's large unobstructed desktop room view with a compact navy/gold action panel on the right. The header now matches the panel family, with Back to ranch, explicit room minimize/expand and the existing Menu route. Phones use the compact framed room vignette above a focused action panel. Short landscape keeps scenery beside the actions. Sparse sections use content-sized panels.

All four sections are integrated: Management, Care, Records and Rest. All ten existing actions and their full descriptions remain. Four direct section tabs replace the duplicate Previous/Next page controls. The housing note retains the single-equine start and Petra's habitat role. Story journal now uses an existing open-book illustration instead of a nest symbol.

The production kit includes ornate native window/button/selected-tab frames, action-row and hover masters, chevrons, Menu symbol and a spare divider. Explicit Tinos Regular400/Bold700, actual icon sizes and responsive spacing are documented in `public/images/ui/ranch-house-a/README.md`. Builder: `scripts/build-ranch-house-a-assets.py`. The concept's crossed tools, farmhouse and satchel already exist in the true-alpha ranch atlas; they are reused directly. The canonical house background and existing matching icons/fonts are preserved. New raster generation was unnecessary for this integration.

Room viewing, tabs and ordinary navigation remain presentation state. Rest still opens the existing End Day review; no direct sleep action was introduced on Management. The existing review may update its evening phase; canceling preserves the day and balances. No production, housing, food, recovery, construction or progression rules changed. Other destination windows keep their existing designs pending separate review.

The repeated resident-bar request applies to the existing Habitat dock: name, Level N and actual status were already integrated. This update verifies them through the real creature-roster → Habitat route. A resident dock is not added to the house concept.

## Verification

- Production Next.js build and TypeScript: passed.
- Changed-component ESLint: zero errors, native-image advisories only.
- `scripts/validate-ranch-house-a.mjs`: **116 browser checks passed**, no runtime errors.
- All four sections at1440×900,1280×720,1920×720,2560×1440,390×844,360×740,844×390 and390×500. Checked bounds, child/row overflow, complete action counts and selected tabs.
- Regular and bold Tinos loaded; ordinary section browsing preserves the normalized save.
- Minimize/expand, Menu/Escape, Farm work and upgrades return paths, usable Storage, Growth planner, Nursery, Habitat district and Care return, daily ledger, story journal and Creature roster routes all checked.
- Habitat resident names/levels/statuses verified. End Day opens review before advancing; Keep Playing preserves day and currency values. House Escape returns to the ranch.
- Production screenshots visually compared with A for composition, fonts, icon identity, panel proportions, spacing, ornament and mobile density. The phone vignette uses the actual room image above the native frame fill.

Final screenshots and full result JSON are retained under `docs/validation/ranch-house-a-*`. Review screenshots remain under `ranch-house-before-*` and `daily-ledger-before-*`. The capture/review script and exact original concept prompt are retained.

The local sparse checkout omits unrelated legacy art. QA fallback applies only to missing unrelated assets; new kit files are never substituted. Canonical house and visible creature art are real. No test fixtures or placeholder images are added to the game.

Publish only to `feature/ui-ranch-ledger-2026-09-29`; PR21 stays draft/unmerged. The next separate visual review is the daily ledger, followed by End Day and morning results.
