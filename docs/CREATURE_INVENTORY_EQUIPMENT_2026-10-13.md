# Creature dossier — Inventory and Equipment tabs

Extends the approved parchment dossier with two dedicated tabs for the selected creature. Existing six tabs and persistent roster selection remain. Footer Inventory now selects the dossier tab directly instead of opening the unrelated general Creatures menu.

## Inventory
- Shared ranch stock, filtered to Energy/Care items usable on a creature.
- Item artwork, rarity/category, owned count and exact effect.
- Preview uses the existing item transaction without saving: actual capped Energy/Affection/Hearts result, injury recovery and remaining stock.
- Explicit review/cancel/confirm, duplicate-click guard, revalidation against current save, receipt.
- Away-at-training creatures cannot use these controls. Pregnancy/breeding support, materials and battle consumables stay in their dedicated menus.

## Equipment
- Five slots with real item artwork and enhancement/grade labels.
- Individual copy selection includes the selected creature's worn pieces and unassigned copies; another creature's gear must be removed first.
- Reuses EquipmentStats to show main stat, up to four substats, +0–15 level and any Relic passive.
- Comparisons use compareEquipment with the specific copy ID. Replacing a piece returns its individual upgrades to stock.
- Review/cancel/confirm for equip/removal, duplicate-click guard and transaction revalidation.
- Active gauntlet and training locks apply. Existing battles retain their initial loadout; innate grades do not change.
- Current equipped battle stats available in an expandable summary. Improvement remains at Iona's established blacksmith screen.

## Art and implementation
Uses existing approved supply-depot/equipment-v2 artwork and parchment assets. No new raster generation needed; no generation prompt or asset replacement introduced. Missing image fallback prevents broken-image glyphs. New layouts are scoped CSS Modules. No gameplay balance or save-schema changes.

## Validation
Production build/TypeScript passed. Scoped lint: zero errors, eight image/effect warnings. Focused equipment suite: 18 passed. Browser checks passed item cancellation/exact stock/target changes, equip/swap/remove of two same-item copies at +0/+3, preserved enhancement, unchanged Gold, reload persistence, every slot, selected-tab preservation and no horizontal overflow at 1440×900, 1280×720, 390×844 and 844×390. Separate checks passed gauntlet/training/empty-stock disabled states. Tab changes reset content scroll so the new page opens at its heading. PR #21 remains draft and unmerged.
