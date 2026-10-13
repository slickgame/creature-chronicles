# Creature workbench links and UI priorities — 2026-10-13

## Implemented
- Creature equipment detail → Improve with Iona, selecting the exact equipment instance and creature.
- Slot picker → Shop for the selected slot, with the current creature selected for comparison. Initial selection favors purchasable gear over Marks-exclusive rewards.
- Both destinations open in a full-screen native modal workspace. The mounted dossier preserves creature, selected tab, roster/art collapse state and list state. Return or Escape goes back without modifying the save.
- Embedded destinations suppress the global menu so navigation cannot open behind the modal. The regular standalone screens retain their menus and existing entry points.
- Iona's upgrade screen now uses a paginated equipment shelf plus compact workbench. Stats/passives, budget, and equip/remove use separate dialogs. Budget has milestone-cost and food-plan pages.
- Exact upgrade price, preview, cancellation and confirmation remain. No engine changes. Active battle loadouts retain their existing snapshots.
- Equipment terminology uses pieces/equipment instead of copies in the upgraded workbench.
- No new generated assets: existing Iona portrait, equipment icons and Builder's Yard background reused. No generation prompts used.

## Next visual and access priorities
1. Remaining creature tabs: replace long talent, lineage, work and care lists with small pages and detail popups; remember display preferences per save. Do not assume these already meet the no-scroll goal.
2. Crafting: one illustrated recipe per page, persistent exact material/Gold cost strip, separate comparison and sourcing popups. Missing ingredients link to the appropriate Trade catalog and return to the recipe.
3. Outfitter and supply/Trade/Kitchen catalogs: consistent item-card sizes, rarity treatment and hover/focus detail previews. Use adaptive page capacity, filtered catalogs and item-specific Buy more links. Existing long detail dialogs still need pagination.
4. Coliseum preparation: compact readiness summary, equipment and recovery shortcuts, then return to preparation. Do not overwrite an existing team or start a battle from a navigation link.
5. Construction, reports and journals: paginated cards, fixed bottom action strip, illustrations and concise summary badges; details only on demand.

## Layout rule
Fit screens by reducing simultaneous content, using pages and purpose-specific popups. Do not simply hide overflowing content or shrink text until unreadable. Verify both menu bounds and action-button visibility. Long legacy dialogs elsewhere remain follow-up work; this update does not claim every screen is scroll-free.

## Validation
- Production build passed; scoped lint has zero errors (15 existing image optimization warnings).
- Browser verified exact +3 piece preselection; canceled upgrade leaves save unchanged; confirmed upgrade persists +4; return retains Mira and Equipment tab.
- Outfitter opens weapon filter for Mira; canceled purchase leaves save unchanged; purchase adds one Training Blade and deducts exactly 55 Gold; return retains dossier context.
- Forge overview has no overflow at 1440×900, 1280×720, 390×844 and 844×390. Explicit bounds checks verify the Review upgrade button remains visible. Desktop and phone screenshots reviewed.
- No browser runtime errors. Sparse-checkout legacy art may be absent locally; existing published image paths are preserved.
