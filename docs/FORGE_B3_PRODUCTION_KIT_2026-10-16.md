# Forge B3 — locked production asset kit

On October16,2026 (America/New_York), the user locked the supplied compact slate/gold Forge concept and requested every asset needed to reproduce it. The attached reference supersedes Forge A as the visual target. The selected concept uses name-free square item tiles, colored rarity rims, power letter upper-left, enhancement upper-right, filled ivory category silhouette lower-right, full hover/focus/tap details, Craft/Improve tabs, a secondary Outfitter-price link and **Craft** as the primary action label.

## Latest correction — control finish

Following the user’s comparison with the concept, the production assets now have beveled gold control rims, pointed corner details, richer slate/emerald surfaces and an amber active Craft tab. Filled action emblems improve Craft/Improve and Talk; the source action uses a framed supplies/route symbol; Gold uses an embossed hammer coin instead of a dollar sign. Normal/hover/pressed/disabled surfaces are distinct, including dedicated Talk button states. `control-samples.html` presents the actual corrected controls. All-six-recipe/four-viewport assembly and window checks pass again with zero page/asset errors. No runtime behavior changed.

Current corrected assets: [control detail](https://drive.google.com/file/d/1858pJu4V-CNIw0hqpZOVrAcH2uXcqqqm/view) · [desktop](https://drive.google.com/file/d/1wgFUI3ph4_HYs5ynVXsomehOopDaGYnd/view) · [phone](https://drive.google.com/file/d/1zgXA4E9kbfuuGKe_nqskKWJjzSpQMT0_/view).

## Delivered

`public/images/ui/forge-slate-v2/` contains108 text-free SVG surfaces/action icons/ornaments and optional vector category variants;6 separately generated transparent category glyphs as512px RGBA WebP;1 quiet slate texture;4 Tinos font styles supplied as original TTF and WOFF (8 font files), with the upstream SIL OFL and metadata. Ten canonical game images are reused unchanged: workshop background, Iona, six gear illustrations, Iron and Nails. These originals are included in the archive without duplicating their repository locations.

The kit includes all normal/hover/pressed/disabled primary/secondary button and tab states, all five rarity frame families, white selection brackets, category badges, title/host/recipe/detail frames, tooltip/pointer, material/labor/stat/substat/stock rows, fields, notice/success/warning/error surfaces, dialog/receipt/source/dialogue frames, close/back/next/info/menu/compare/source/talk/inventory actions, coin, gold divider/corner and item plinth. State files have distinct validated hashes. Text stays live and editable; no production UI labels or values are baked into an image.

See its README for nine-slice geometry, typography, badge anchors, color mapping and integration contracts. `manifest.json`, `asset-index.json` and `generation-prompts.json` track hashes, sources, reuse, alpha, sizes and exact prompts. `scripts/build-forge-slate-assets.py` rebuilds original vectors; `scripts/index-forge-slate-assets.py` verifies the inventory. Generated PNG masters and the user's unchanged locked reference are retained in the full Drive archive.

Tinos is the explicit bundled serif choice matching the concept's Times-style proportions; AI concept lettering is not a recoverable font. Category SVGs are optional editable interpretations; the assembly uses the generated glyph masters on dark CSS circles with gold rims. No character/gear redraw replaces canonical art.

## Preview and validation

Open `/images/ui/forge-slate-v2/preview.html` for the isolated responsive asset assembly; `/images/ui/forge-slate-v2/catalog.html` for every surface/icon; `/images/ui/forge-slate-v2/category-sizes.html` for actual80/32/24 CSS-pixel glyphs. Sample catalog values were exported through existing game helpers, while Gold/stock/ownership are synthetic QA examples. The preview has no save access or transactions and labels itself **ASSET ASSEMBLY · SAMPLE DATA**. Craft opens a sample-only dialog; it cannot spend supplies.

Browser checks pass for all six recipes, full item details, Craft preview windows and controls at1440×900,390×844,360×740,844×390. Desktop hover/focus and explicit phone info details remain accessible. Short landscape uses a focused Materials & labor window rather than clipping supplies. The font loads locally; every catalog image decodes; zero page/asset errors. The six generated glyphs are separately displayed at actual small badge sizes. All SVGs parse; preview JavaScript syntax, per-file hashes, canonical-reuse hashes, font license and distinct button/tab states pass.

- Locked unchanged user reference: https://drive.google.com/file/d/1W9X-y5SU5_0C0b8LoNv8Gou4oUM8stsz/view
- Desktop assembly with full tooltip: https://drive.google.com/file/d/1kieqIYNu_Cq2R_hFZM86KoAVGN36TOl5/view
- Phone assembly: https://drive.google.com/file/d/1fcs5y4ct52MOcLcR7JvGv5F0RIpiKsAM/view

These are assembly screenshots, not live gameplay. Game transaction tests were not rerun for static asset work; the previously validated runtime is unchanged.

## Next

Integrate the locked kit into the existing BlacksmithWorkshop and ForgeWindow while preserving engine quotes, stats/sets, reserves, exact-copy receipts, confirmation/stale-quote guards, rapid-click locks and save behavior. Keep **Craft** as the visible action label; the wording change does not remove transaction review semantics. Remove redundant Tools/anvil, label Craft/Improve and keep cost-route comparison secondary. Hide one-page pagers. Preserve approved equipment comparison/review/receipt behavior; a new Improve Equipment overview still requires its own visual review.

The live Forge remains its previous implementation until that integration is complete. Maintain the existing branch `feature/ui-ranch-ledger-2026-09-29` and draft/unmerged PR21. Do not create a new game or change deployment protection. Protected hosted gameplay remains unverified.

## Initial production archive (before control correction)

All172 files, including the entire kit, fonts/licenses, canonical reused art,7 untouched generated PNG masters, exact prompts, approved references, build/index sources and QA/screenshots (19,921,516 bytes; SHA256 `db9867d32d1d4ede88a267e46227b9e31fc1097c6aac94d22561ca24f2a28f9a`): https://drive.google.com/file/d/1qp-j_T0s9cXVqAdg_pzfX7e7XKhQn37M/view

## Current complete kit — refined controls

Updated184-file full asset/source/master/font/reference/QA archive: https://drive.google.com/file/d/1_cKa4svAtiEciwZfabSp4aowt2-T0H8v/view

29,129,502 bytes; SHA256 `59f312e57caedbe9e98f3e3998509670aae2acc634102f33c4ae8e43f4790187`. Includes the user’s three control-review images unchanged and the corrected full assembly and control detail screenshots. ZIP integrity and every member were verified locally; Drive upload size/folder checked after upload.
