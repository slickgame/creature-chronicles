# Forge B3 runtime integration

The existing Creature Chronicles BlacksmithWorkshop now renders the user-approved slate/gold Forge and sculpted icon family. This resumes `slickgame/creature-chronicles`, branch `feature/ui-ranch-ledger-2026-09-29`, draft/unmerged PR21. It does not create another game.

## Result

- Six compact, nameless artwork tiles on desktop and phone. Common silver/grey, Uncommon green, Rare blue, Heroic purple; Legendary gold remains supplied for future equipment. White selection brackets preserve the rarity border.
- Power letter at the artwork upper-left, +0 upper-right, approved category silhouette in a gold-rimmed dark badge at lower-right. Desktop hover/focus exposes name, slot, rarity, power, enhancement, main/substats, set, ownership and description. Escape dismisses the tooltip. Phone inspection uses the existing paged item-details window.
- Local Tinos typography, slate material, gold framed panels, amber Craft tab, emerald Craft button. Canonical Iona, workshop scene, six gear illustrations, Iron and Nails are reused unchanged.
- Approved sculpted Craft hammer, Gold star-seal coin, Compare scales, Improve sword/chevrons, Talk speech bubble and Ranch/source building are actual RGBA production assets. Originals are separate transparent PNG generations; 256px WebP delivery files retain alpha. `sculpted/generation-prompts.json` and `sculpted/manifest.json` record exact prompts, references and hashes. `scripts/prepare-forge-sculpted-icons.py` verifies masters and reproduces the delivery encodings without changing originals.
- Craft/Improve replace the redundant Tools/anvil control. Outfitter pricing is a secondary text action. All six recipes fit without a one-page pager. On short phones the duplicate selected-item hero is omitted while its recipe artwork and full inspection remain available. A phone Talk control preserves access when the decorative host column is absent. Short landscape opens materials in a focused window.
- Review, receipt, comparison, details, cost, dialogue and source windows use the same slate/gold presentation. Native dialog focus containment, Escape, inert background and focus return remain provided by GameDialog.

## Authoritative behavior

All recipe, stat, set, ownership, Gold, stock and reserve displays come from existing game helpers and the current save. Craft still opens a confirmation review. Persisted crafting revision validation, affordability checks, reserve protection and the synchronous rapid-click lock are unchanged. Receipts keep exact-copy IDs, actual paid amounts and any goal rewards; new equipment remains +0 in inventory until the player equips it. Improve and receipt actions return to the existing upgrade screen. The Ranch icon opens the existing buying/production options; it does not grant free material or bypass Trade.

No sample assembly data enters the runtime or save. `preview.html` remains a separate read-only sample and labels itself as such. Image-generated screen concepts are visual references, not game screenshots or runtime backgrounds.

## Validation record

Production build and all 350 regression tests pass. Scoped ESLint has no errors; existing native image-element performance advisories remain. Master SHA256, true alpha, delivery SHA256, all SVG XML, bundled font license, canonical reuse hashes and distinct button states pass.

Real Town → Builder’s Yard → Iona navigation and all six recipes pass at 1440×900, 390×844, 360×740 and 844×390. Item/detail/impact pages, cost/review/source/dialogue/routes windows, every Forge asset decode and control bounds pass. Desktop tooltip/Escape and phone inspection pass. Cancelled previews leave the entire fixture save unchanged. Four deliberately double-clicked confirmations produce exactly four copies, charge exactly 40 Gold and four Iron, preserve reserves and existing loadouts, and add +0 unowned inventory copies. The exact-copy receipt action opens the correct upgrade item. One deliberately double-clicked ingredient purchase adds exactly one Iron for 40 Gold. Production-book handoff/return, generic Improve return, reload persistence and fully reserved-stock blocking pass. Zero page errors. The all-recipe layout/asset/font smoke check also passes, including bundled Tinos, all six production icons and no Forge asset HTTP errors. Hosted gameplay behind Vercel protection remains unverified; deployment protection is unchanged.

The QA fixture uses synthetic accounts/creatures and resources, never the user's save. The sparse local checkout lacks some unrelated legacy navigation images; browser-only fallbacks for those unrelated images do not replace Forge assets or ship in the repository.

## Remaining work

Confirm the exact branch deployment after publication. The existing Improve Equipment overview is reached by the new tab but keeps its own current layout; a redesign of that screen needs its own screenshot/concept review. Preserve the branch and draft/unmerged PR.

## Wide-screen card spacing correction

The user’s 1920px actual screenshot exposed the old min-width1500 rule: 128px tracks with space-between produced large gaps. The recipe group now stays left-aligned, caps its total width at494px including selection-bracket padding, and uses at most150px cards with a17px desktop gap. Narrow layouts retain their existing compact sizing. The static asset assembly mirrors this correction. Include1920×960 and2560×1440 in future visual checks and measure actual card bounds/gaps, rather than checking only viewport overflow.

## Reference composition and complete portrait

The user requested the supplied1440×900 composition rather than a stretched wide-screen layout, and explicitly required Iona’s head to stay visible. Desktops wider than1100px now center a Forge canvas bounded to1440×900. The recipe and detail panels consequently retain reference proportions. Iona’s portrait scale is bounded by both the host-column width and available canvas height; the full source image fits vertically, including at1920×720. The static assembly uses the same canvas bounds and contains its portrait image. Short desktops use tighter detail spacing and a smaller duplicate hero so every ingredient row remains inline and visible. Phone layouts stay as before. No artwork bytes, labels, menus or game transactions change.
