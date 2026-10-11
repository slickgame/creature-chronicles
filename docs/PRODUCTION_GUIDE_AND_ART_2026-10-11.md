# Named chore production and Farm Foundations

## Gameplay

- Stable Production creates Balanced rations in Pantry storage. Each unreserved ration feeds one food unit for any species automatically. Existing Feed remains a fallback; raw ingredients still require the ingredient-feeding switch.
- Kitchen recipe: 2 Wheat + 1 Vegetables → 4 Balanced rations. These are daily provisions, not bonus meals.
- Garden Tending creates Vegetables; Field Hauling creates Wood and retains upkeep. They no longer mint generic Feed or Materials.
- Per-helper outputs use the existing chore score: rations = floor(5 + score), vegetables = floor(2 + 0.3 × score), wood = floor(1 + 0.25 × score), each at least one. Dedicated gathering sites retain their fixed yields. No creature is slaughtered.
- Starter milestones and daily goals now grant Balanced rations or Wood. Saved reward field names remain compatible. Claimed rewards stay claimed.
- Overnight food coverage includes actual ration/ingredient consumption. The Chores food forecast runs the same pure overnight resolver without saving preview state. Reports and advisor wording use the new supplies.

## Farm Foundations guide

Resources & recipes → Guide:

1. Gather at least 4 Wood through a woodlot assignment or Field Hauling, then sleep.
2. Set a reserve of 2 Wood.
3. Craft at least 1 Plank at the workbench.
4. Complete a production facility through Petra.

Tracks actual gathering and crafting actions; buying items does not complete those steps. Milestones persist after consuming stock. Commissioning alone does not complete the building step. Claim 75 Gold + 5 GP once. Example route needs 10 Wood: 2 reserved, 2 for a plank, 6 for a Quarry, plus 180 Gold. Three woodlot nights provide 12 Wood.

## Artwork and UI

Four new matching transparent illustrations appear in storage and relevant recipe/trade cards, the production guide and Chores. Existing banner and character artwork are unchanged.

Repository assets (384 × 384 alpha WebP):
- `public/images/ui/resources-v2/rations.webp`
- `public/images/ui/resources-v2/vegetables.webp`
- `public/images/ui/resources-v2/wood.webp`
- `public/images/ui/resources-v2/planks.webp`

Created with the built-in image-generation tool. Original generated PNGs retained unchanged; optimized WebP copies used in game.

Exact shared prompt, with each subject inserted at `{subject}`:

> Use case: stylized-concept. Asset type: individual inventory icon for Creature Chronicles cozy fantasy farming RPG. {subject} Sharp polished anime-painterly illustration, rich dimensional textures, warm amber sunlight from upper left, clean readable silhouette, subtle glossy highlights, matching a sunlit rustic pantry/workshop. Centered single compact object group fills 80 percent of square canvas, three-quarter view, fully visible and uncropped. Genuine transparent background. No text, no labels, no border, no extra scene, no characters, no watermark. Maintain realistic material detail while remaining a painted game icon.

Subjects:
- Rations: “A sturdy open linen feed sack filled with golden grain and dried vegetable pieces, a small wooden scoop resting beside it. Balanced creature rations.”
- Vegetables: “A compact appealing harvest of two carrots, a cabbage and leafy greens in a shallow wicker basket.”
- Wood: “Three short freshly cut timber logs stacked together, visible golden growth rings and richly textured brown bark.”
- Planks: “Four clean squared wooden planks stacked neatly, crisp warm golden wood grain and visible cut ends.”

## Validation

36 focused tests cover named production, reserves, feeding, no double overnight, recipe and building transactions, actual guide completion/reward idempotency, Guild commissions, daily-goal payouts and 12 first-week budgets. Production build and TypeScript pass. Scoped lint has zero errors. Browser checks cover desktop/phone sections, decoded new art, guide navigation and reserve progress, early reward blocking, recipe/meal transactions, trades, production construction and delivery balances. Unrelated art missing from the sparse checkout uses placeholders during local QA; new art loads normally.

## Next

Unify remaining Supply Depot bundles, NPC/event/battle rewards and equipment/training costs with named resources. Add egg, milk, meat, stone and iron illustrations as those flows are updated. Review species-specific production and food balance after this shared production loop has been tested.
