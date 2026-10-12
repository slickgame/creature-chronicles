# Builder’s Yard: Petra and Iona

Continues feature/ui-ranch-ledger-2026-09-29 from b841b8508256600f79e276888008f6c12620caf1. PR #21 remains draft and unmerged.

## Shared yard and two female hosts

The Builder’s Yard now opens with two separately illustrated, named hosts. Petra Hale is the existing female Master Builder; her approved orange-shirt, blueprint-carrying sprite remains unchanged. Iona Flint is the new adult female Master Blacksmith, with dark skin, silver-gray braided bun, protective goggles, blue work shirt, forge apron and hammer. Each has a separate service entrance and conversation. The Town description names both women.

Petra retains her conversations, Trust, requests, production sites, fortifications and timed work orders. Iona operates her own town forge, independent of Petra’s crew and the player’s farm forge. No extra building prerequisite or wait is added to equipment crafting.

## Initial fixed recipes

| Equipment | Quality / grade | Materials | Gold labor | Total value at current ingredient retail prices | Ready-made retail | Exact bonuses |
| --- | --- | --- | --- | --- | --- | --- |
| Training Blade | Common / D | 1 Iron ingot | 10 | 50 | 55 | +3 Physical Power |
| Focus Circlet | Fine / C | 3 Iron ingots | 45 | 165 | 185 | +3 Special Power, +4 Max Battle Energy |
| Reserve Pendant | Fine / C | 3 Iron ingots | 60 | 180 | 205 | +6 Max Battle Energy, +2 Resistance |

The first list is intentionally metal-focused, using currently modeled ingredients and existing equipment IDs. Labor includes the finishing and fittings shown in the art. One confirmation produces one copy immediately. No random failure, hidden fee or crafting-only stat bonus. Buying gear at the Outfitter remains Gold-only. The comparison shows the selected creature’s Current → After battle stats including replacement losses, using the same comparison code as the Outfitter. Crafting does not auto-equip and never changes creature base stats or innate grades.

The preview and transaction share recipe data. Both recheck Gold and unreserved supplies. Iron ore is not accepted in place of refined Iron ingots. Quote revisions stored in blacksmithCraftCount reject repeated or stale confirmations across saves; a deliberate new review can craft another copy. Existing equipment migration preserves ownership. Failed transactions return the original save. Automatic goal rewards, if any, are separated in the receipt.

## Production assets and provenance

New asset: public/images/ui/blacksmith-v1/iona.webp, 768×1152 RGBA, optimized at WebP quality 90 from the generated 1024×1536 PNG. Generated through the built-in image tool; Petra’s existing art was supplied strictly as a rendering-style reference. The original PNG remains in the image-generation output. No approved art was overwritten. Petra and the yard background were restored locally from existing Git blobs for visual verification, without changing their bytes.

Exact generation prompt is recorded in BLACKSMITH_ART_PROMPT_2026-10-12.json. The new sprite is shown in the yard, forge and Iona conversation. The established equipment and Iron ingot artwork are reused.

## Validation

- 27/27 targeted tests passed: new crafting, builder projects, existing location interactions and equipment comparisons. Covers every recipe, exact deductions/output, preview-equipment parity, reserved stock, insufficient Gold, ore rejection, failed-save immutability, saved revision replay protection and Gold-only retail. New crafting and named-resource tests are included in the regression script.
- Optimized Next.js production build/TypeScript passed. Direct Next build used because the sparse checkout omits unrelated legacy assets from the full asset-preparation pipeline.
- Changed TS/TSX lint: zero errors; 14 existing-pattern image/effect warnings. React review: hooks remain unconditional, transactions run only on explicit confirmation, modal controls use native dialog/focus semantics, artwork has identifying alt text and selection buttons expose aria-pressed.
- Production Chromium at 1440×900, 390×844 and 844×390: separate real NPC illustrations decode; all three recipe illustrations decode; yard and forge fit without main-page overflow; reviews have no horizontal overflow; screenshots visually reviewed.
- Browser checks passed for both NPC conversations, exact costs/output for all three recipes, cancellation with unchanged save, double-click confirmation granting one copy, reload persistence, reserve and insufficient-Gold blockers, and no page errors.
- Browser test harness uses neutral replacements for omitted unrelated legacy images only; actual Petra, yard, Iona, the three equipment icons and resource art are used. Fixtures and placeholders are not shipped.

## Next

Balance the first week across creature Energy, gathering, smelting, cooking, building and reward income, including these recipes. Keep the small deterministic crafting list until that pacing pass is reviewed. Vercel deployment remains subject to the known team permission restriction; publishing to GitHub alone does not verify deployment.
