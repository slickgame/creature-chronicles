# Forge A — live Recipe Gallery

Current visual follow-up: read `docs/FORGE_A_CONCEPT_FIDELITY_2026-10-16.md` first. The user identified typography/frame/composition mismatches in this first implementation; the follow-up corrects them, including inline phone details. The notes below retain the original integration history and transaction validation.

The selected Recipe Gallery now replaces the real Forge UI. Desktop shows the six canonical recipe cards beside the selected output and material/labor counts; phones show two cards per page and focused detail/material windows. Short landscape puts details/materials behind explicit buttons. Iona can collapse on desktop/landscape; her canonical portrait remains in dialogue on phone. Menu and Builder’s Yard keep their original navigation handlers.

All six recipes derive from `getBlacksmithQuote`, `equipmentStats` and actual stock/reserve helpers. Rarity, Power Grade and enhancement are separate. Output details page the exact main/substats and complete description, passive and set information. The existing equipment guide remains reachable. Comparisons choose an actual creature, show current/after battle values and page hypothetical set losses/gains/progress. Previewing never changes saved gear.

Craft-or-buy pages use the real Outfitter price, Trade replacement value for missing usable ingredients and full material value, with clear separate-purchase wording. Material/source buttons open the existing Trade/production logic in the new matching Forge frame. Review/cancel/purchase/receipt and production returns retain the selected recipe. Unrelated callers keep the original IngredientCounter presentation.

Review crafting shows the exact output, required materials, owned/reserved/usable amounts, Gold before/after and no-hidden-fee/inventory-delivery rules. Confirmation reuses the unchanged reserve-aware crafting reducer and persisted revision guard, plus the existing synchronous click lock. Success records the actual new copy ID and transaction receipt facts immediately after save; the receipt exposes the exact materials/labor spent, persisted Gold balance and any goal Gold/GP. Its equipment action opens the existing owned-gear workflow for that exact copy. Failed/stale transactions do not present a success seal or grant an item.

`ForgeWindow` composes the existing native GameDialog in full-screen mode: focus containment, Escape, inert background and focus return remain shared. UI text stays editable HTML. No overflow is hidden in the new CSS; pages/focused windows handle compact layouts. The public asset-only sample remains separate and explicitly labelled as a sample.

## Changed source

- `src/features/builder/BlacksmithWorkshop.tsx`: real gallery and crafting windows.
- `src/features/builder/ForgeWindow.tsx`: shared focused native-modal shell and icons.
- `src/features/builder/ForgeGallery.module.css`: responsive production kit styling with scoped readable colors.
- `src/features/builder/IngredientCounter.tsx`: opt-in Forge presentation; existing purchase/production handlers retained.

No engine, prices, recipe inputs, rarity/power rules, RNG, reserve semantics, save format or upgrade implementation changed. Reuses the complete 93-graphic Forge A production kit, including canonical background, Iona and gear. No new image generation was required.

## Verification

- All 350 regression tests pass, including actual recipe consumption, reserves, insufficient Gold, ore rejection, stale/replayed revisions and deterministic output profiles.
- Optimized Next production build and TypeScript pass. Direct Next build is used because this sparse workspace lacks unrelated legacy breeding images required by the repository's npm asset preflight.
- Scoped lint: zero errors; nine image-element advisory warnings.
- All six recipes, every output/impact page, craft-or-buy/tools/dialogue, source buy/production/review states and two-input crafting reviews pass at1440×900,390×844,360×740,844×390 without overflow or out-of-viewport controls. Desktop host collapse/expand and real farm-production returns pass.
- Actual flows verify cancelled reviews leave the complete save unchanged; four consecutive rapid-confirm attempts create exactly four new +0 unequipped copies for exactly40Gold and4Iron; nonzero reserve quantities and equipped slots stay unchanged. Real ingredient double-confirm buys exactly1Iron for40Gold. Receipt opens the exact new copy; upgrade Back returns to the selected Forge recipe. Fully reserved ingredients cannot craft.
- Saved copy IDs, levels, ownership, Gold/materials and reserves persist through reload. Whole-save reload equality excludes only updatedAt and saveReliability.lastValidatedAt, refreshed by existing validation. Zero browser page errors.
- All12 gallery/review/actual-paid-receipt screenshots are captured and visually reviewed at the four sizes, with real canonical images decoded. Fresh screenshot runs also verify one actual paid craft per viewport. No new production placeholders.

Browser screenshots use an isolated synthetic established save, never the user's save. Sparse legacy art has QA-only neutral fallbacks in the harness; all Forge kit images use the actual canonical files. No production placeholders were added. Protected hosted gameplay is a separate verification boundary; a successful Vercel build does not authenticate its protected preview.

Complete original asset kit, PNG masters and prompts: https://drive.google.com/file/d/1KMAOtPGMf8hKZSz0xOtolfHMW2n0Gv5l/view

## Actual game screenshots

- Desktop gallery: https://drive.google.com/file/d/1wUgQ1uco2ji1-0R0d_x1u-ADx6ZQLwcH/view
- Phone gallery: https://drive.google.com/file/d/16ly3HWJZ-828UaihN9bMDha4uiqnphKl/view
- Phone real crafting review: https://drive.google.com/file/d/1zbc1wAfFtIU5CmCgrUux2_yQbEPXPsBm/view
- Phone actual saved receipt: https://drive.google.com/file/d/1j06oUMFLn-x8TZKsz_YavQc9Ds6nbIVa/view

These are actual locally running production-game screens using the isolated QA save, not the public sample assembly. Each receipt screenshot follows a real confirmed, exactly-once craft.

## Saved source and QA

Complete134-file source/production-assets/original-master/QA archive (14,996,641 bytes): https://drive.google.com/file/d/1Gb-b3wMbLhzxXE417O37O3WaTWfl3jiS/view

ZIP SHA256: `028e3395b2552441535faab5044e9fd6f9bf21f5cec42b0b4b478c3bedfd7ac6`. File size and folder placement verified by Drive metadata readback. Keep PR21 DRAFT and UNMERGED.

Next visual area: the separate Improve Equipment overview still uses its previous presentation. Show actual current desktop/phone screenshots and distinct concept choices before redesigning it; preserve the already approved upgrade review/receipt windows and equipment rules.
