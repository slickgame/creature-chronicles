# Crafted-item and construction routes — 2026-10-13

Successful crafting receipts now link directly to the exact newly created equipment instance in the existing equip/improve screen. The selected comparison creature is carried along when available. Older equipment of the same type is not selected accidentally. Failed crafts expose no shortcut. Returning restores the selected forge recipe. General Improve equipment buttons continue to open the full collection normally.

Construction projects reuse approved resource illustrations (Stone, Planks, Charcoal, Iron and Nails). Each ingredient has a source button using the existing purchase/production popup. The popup opens exact work locations/recipes; return preserves the project and prerequisite trail. Costs, reserves, confirmation and overnight completion rules are unchanged.

## Validation

Direct optimized Next production build passed. Scoped ESLint zero errors, six native-image warnings. 25 blacksmith, equipment enhancement and builder tests passed. Browser: craft a second Duelist Saber while an older one is owned, target only the new instance, upgrade it to +1, equip it, return to the selected recipe. All seven construction pages measured within 1440×900, 390×844 and 844×390; ingredient-to-woodlot round trip preserved project; cancel did not modify save; confirmed Quarry still schedules next-day completion. Screenshots reviewed.

## Art provenance

Reused approved resource-v2/v3/v4 icons and parchment. No new images or generation prompts in this update. Illustrations identify each project’s material/output, not a new architectural concept.

## Next

Polish construction progress/completion feedback and add a direct return to the newly unlocked recipe or gathering site. Then revisit equipment upgrade comparison presentation at +3/+6/+9/+12/+15. No economy or legendary passive changes in this batch.
