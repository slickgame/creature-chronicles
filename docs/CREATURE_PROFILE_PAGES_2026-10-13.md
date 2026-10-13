# Creature profile pages — 2026-10-13

## Implemented
- Ranch dossier Work, Talents, Lineage and Care now share illustrated parchment record cards and a fixed pager.
- Page capacity adapts to available panel height (two, four or six records). Detail dialogs split long text into short pages rather than a scrolling wall.
- Work separates Farm and Domestic skills. Cards show level/aptitude, with reserved skills labeled explicitly. Details retain XP, natural baseline, production rules, and fortification/Guard Dog information.
- Talents retain grade, source, category, tags and complete descriptions in detail pages.
- Lineage retains parents, generation/origin, risk notes, inherited markers and ranch notes. Missing records have explicit empty states.
- Care retains health/status, lock/unlock, rename, and existing release/donate callbacks. Destructive actions still open the original confirmation; no new deletion path.
- Other uses of the shared creature panel (including breeding) retain their existing layouts. No gameplay rules or save schema changes.

## Art provenance
Existing approved dossier SVG icons and parchment/brass styling reused. No new bitmap assets or image-generation prompts required.

## Next
- Overview and Stats & Growth: compact summaries with paginated forecasts and detailed stat explanations.
- Crafting: one recipe per page, exact material/Gold strip, stat comparison and ingredient-sourcing popups.
- Shop, kitchen, Coliseum and long legacy dialogs remain follow-up work. This commit does not claim the entire game is scroll-free.

## Validation
- Optimized production build passed; scoped lint zero errors, four pre-existing shared-panel warnings.
- Browser verified Work, Talents, Lineage and Care at 1440×900, 1280×720, 390×844 and 844×390. Tab panels have no horizontal/vertical overflow; page controls remain inside panel bounds.
- Work detail dialogs fit at all four sizes. A long ranch note was read through more than three detail pages on phone without scrolling.
- Farm/Domestic navigation, lock/unlock, saved rename, and canceled release passed; no browser runtime errors.
- Final desktop Work and phone Lineage screenshots visually reviewed. Existing art and all game engines unchanged.
