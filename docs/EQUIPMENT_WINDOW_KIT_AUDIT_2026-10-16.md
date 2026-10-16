# Equipment window production kit and starter-set acquisition audit

October 16, 2026 · Creature Chronicles · draft PR #21.

## Scope and access

The approved A inventory/set-strip update remains live. This update adds the remaining comparison/upgrade art and reusable surfaces plus an isolated asset preview. The live comparison, confirmation and receipt layouts have not been replaced: concept A (Compare Ledger) and B (Focused Gear Book) await user selection. No prices, stat formulas, rewards, saves or game transactions change.

Asset assembly: /images/ui/equipment-windows-v1/preview.html. Four sample views: Compare, Upgrade review, Result and Assets. It is a clearly labelled asset preview with sample data and no save writes, not an alternate game inventory. On phones, Current/Selected cards have Previous/Next. The complete download preserves public/images paths; serve the extracted public directory as the web root for all links.

## Asset inventory and provenance

Three individually generated transparent illustrations: forge-anvil, mystery-seal and milestone-halo. Source PNGs are retained in the project Drive archive. Optimized alpha WebPs, exact production/concept prompts, original/derivative SHA-256 values and dimensions are in manifest.json. Generation used built-in image_gen. The halo is an optional decorative receipt effect; support reduced motion by keeping it static. The mystery seal must never encode the identity of an unpaid random stat.

Nine editable vector surfaces: window-frame, comparison-row, reward-panel, mystery-panel, cost-plate, milestone-node, positive-change, negative-change and compare-arrow. Text and stat values remain separate HTML. Reuses the approved apothecary workbench/parchment/buttons, five C2 rarity frames, current slot/stat/owner icons, set crests and canonical equipment artwork. No Epic Seven art copied. The complete kit includes these reused assets, not only the new three illustrations.

Concept images are layout proposals, not game data or replacement gear portraits. The initial A generation contained incorrect upgrade-copy examples; the archived corrected A version explicitly shows Field Gloves +0→+1, main 5→6, 12 Gold and unchanged substats. B uses illustrative item rendering; actual canonical Practice Wraps remain the existing linen artwork. The asset preview uses real canonical gear art and actual legal sample stats. Its milestone example is Rare Field Gloves +2→+3, main 7→8, 36 Gold, revealing an illustrative legal Max HP +2 as the third substat only on the Result page. This is not a prediction or actual saved transaction.

## Starter set acquisition audit

Run: node --no-warnings --loader ./scripts/ts-test-loader.mjs scripts/starter-set-loadouts.ts

The dedicated audit uses createNewGameSave with the actual single equine starter, asserts that start, and runs real Gold purchase/enhancement/equip reducers on detached saves. It rejects non-shop/exclusive items and duplicate slots and checks exact spending. A large synthetic wallet permits pricing later builds. Starting-Gold comparisons use the actual 1,200 Gold start. +3 uses fixed 0.5 RNG for one repeatable roll example; numbers are not expected rolls or battle probabilities. The generated JSON records the actual starter base stats used. No food, construction, income, missions, daily production, progression or battles are simulated. This is an acquisition audit, not a complete first-week balance conclusion.

| Loadout | Level | Gear Gold | Upgrade Gold | Total Gold | Starting Gold left, before reserves |
| --- | ---: | ---: | ---: | ---: | ---: |
| No gear | +0 | 0 | 0 | 0 | 1200 |
| Vigor pair | +0 | 75 | 0 | 75 | 1125 |
| Vigor pair | +3 | 75 | 96 | 171 | 1029 |
| Bulwark pair | +0 | 670 | 0 | 670 | 530 |
| Bulwark pair | +3 | 670 | 180 | 850 | 350 |
| Swift four | +0 | 785 | 0 | 785 | 415 |
| Swift four | +3 | 785 | 288 | 1073 | 127 |
| Striker four | +0 | 765 | 0 | 765 | 435 |
| Striker four | +3 | 765 | 276 | 1041 | 159 |
| Swift four + Vigor pair | +0 | 880 | 0 | 880 | 320 |
| Swift four + Vigor pair | +3 | 880 | 384 | 1264 | -64 |
| Striker four + Bulwark pair | +0 | 1435 | 0 | 1435 | -235 |
| Striker four + Bulwark pair | +3 | 1435 | 456 | 1891 | -691 |

The 75-Gold Vigor pair is an accessible two-piece stepping stone. Four-piece Swift/Striker require 785/765 Gold before upgrading. Swift+Vigor at +0 costs 880 Gold, leaving only 320 before care/construction; taking the full build to +3 costs 1,264 Gold and exceeds starting cash. This supports retaining distinct early two-piece and later four-piece milestones, but does not justify changing prices without a reserve-aware single-equine first-week simulation. No balance changes were applied.

## Validation

TypeScript and scoped script lint pass. The audit completes all thirteen acquisition scenarios, with actual set membership/activation summaries and exact costs. Asset hashes, SVG parsing, real alpha WebP decoding and an isolated browser preview at 1440×900, 390×844, 360×740 and 844×390 are checked. All four preview views and phone Current/Selected navigation fit without scrolling; all real assets decode and no localStorage changes occur. The previous 350-test game regression run remains the last full suite; no runtime game modules changed in this asset/audit-only update, so another production build/full regression run was not required.

Published commit, Vercel build status and protected hosted gameplay remain separate. PR #21 stays draft and unmerged. Next: user selects A/B (recommend B for phones); integrate that layout with existing engine guards, then complete reserve-aware first-week balance.
