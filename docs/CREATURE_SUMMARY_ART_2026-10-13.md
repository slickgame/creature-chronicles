# Creature overview, growth and icon pass — 2026-10-13

## UI
- Ranch Overview now uses adaptive pages for Energy, Affection, Hearts, XP, identity/coloration, health/protection, lineage, and role reasons.
- Stats & Growth has Attributes and Next level views. Six base stats retain actual innate grades and progress toward the next point. Forecasts retain XP, young-growth acceleration, exact stat gains, Energy capacity and best-stat information.
- The existing growth helpers remain the source of truth. No formulas, gameplay rules or save schema changed. Battle equipment bonuses remain separate from creature base stats.
- Progress meters include accessible names/current/max values. Existing keyboard/touch detail popups and adaptive record pages reused.
- Tied strongest stats use a compact count with all names retained in the detail popup.
- Existing shared panels outside the ranch dossier retain their prior layouts.

## Art and standing direction
- Added five original 32×32 SVG icons under public/images/ui/dossier-vitals-v1: Energy bolt, Affection heart/check, Hearts, Experience star and Health shield/cross.
- Hand-authored code-native vectors match the existing bronze silhouette icon system. No raster generation or image prompts used. Existing six stat icons and approved creature/background art reused.
- Added subtle inset framing and green/gold meters to the record cards.
- AGENTS.md now records the user's standing direction: create or reuse artwork, icons, frames, panels and backgrounds when they improve clarity or appearance; keep menus within the viewport using pages and focused popups.

## Next
Crafting: one illustrated recipe per page, exact output/grade/stats/materials/Gold labor fee, comparison and ingredient-sourcing popups. Continue to preserve material reserves and Gold-only ready-made store gear. Other shops, Coliseum preparation and legacy long dialogs remain follow-up work; the whole game is not yet claimed to be scroll-free.

## Validation
- Production build passed; scoped lint zero errors, four existing shared-panel warnings.
- Browser verified all eight ranch dossier tabs at 1440×900, 1280×720, 390×844 and 844×390 with no main-panel horizontal or vertical overflow.
- Overview and both Stats views were checked across every page. Forecast detail dialogs fit without scrolling at each size.
- All five new SVG icons decoded successfully. Desktop stats and phone overview screenshots visually reviewed.
- Follow-up fixture with six tied leading stats fits portrait and landscape phone cards and retains all six names in detail.
- No browser runtime errors. No game engine or save changes.
