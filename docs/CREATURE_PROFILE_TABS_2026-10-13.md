# Creature profile companion tabs — 2026-10-13

Extends the approved Ranch Dossier to Overview, Work Skills, Talents, Lineage and Care. The scenic creature and persistent left roster remain unchanged.

- Overview: resident identity, condition meters, health, protection, lineage and coloration.
- Work Skills: Farm/Domestic groups with actual level, aptitude, natural baseline/trained gains and XP progress. Explicitly distinguishes active instant-work skills from future systems. Existing radar remains in other profile contexts.
- Talents: distinct parchment cards, seal, grade/source/category and readable descriptions; existing pagination preserved.
- Lineage: recorded parent cards linked to the selected creature, generation/origin, assessment, inherited markers and notes. Missing parentage remains explicitly unknown.
- Care: condition tiles, labeled rename control, protection action and separate removal group. Existing confirmations and transactions preserved.
- Desktop tab navigation stays pinned while long content scrolls. Phone uses the existing scrolling workspace.

Uses existing approved v1 SVG symbols and parchment, plus CSS meters, borders and talent seals. No new raster generation or character artwork changes; previous generation prompts remain in RANCH_DOSSIER_REFERENCE_CORRECTION_2026-10-13.md.

Validation: optimized Next production build/TypeScript; scoped lint zero errors (three pre-existing warnings). Browser checks cover all six tabs and five creatures at 1440×900, 1280×720, 390×844 and 844×390; no horizontal overflow, selected-tab preservation, keyboard navigation, persisted rename/protection, canceled release, expanded profile, inventory and comparison. Screenshots reviewed. No gameplay or save-schema changes. PR #21 stays draft/unmerged.
