# Locked Forge B3 production kit

The user locked the uploaded `a759b7fb-e715-4c50-b735-2c5c7654f059.png` concept on October 16, 2026 (America/New_York). Slate/gold Forge, compact name-free item tiles, filled ivory category silhouettes and a **Craft** primary label are the approved direction. This supersedes Forge A as the next visual target. **This kit is not yet integrated into the live BlacksmithWorkshop.** The existing game and transaction guards are unchanged.

## Contents and use

- `frames/`: text-free screen, recipe/detail, tooltip, dialog, receipt, source, dialogue, host, row/field/notice/grade/enhancement surfaces; primary/secondary buttons and Craft/Improve tabs with normal/hover/pressed/disabled states; five rarity tile frames with hover/disabled states; white selection brackets and tooltip pointer.
- `categories/`: six generated transparent RGBA WebP production glyphs, six optional editable filled-silhouette SVG approximations and six complete vector badges. Weapon sword, Armor breastplate, Head side-profile helmet, Hands armored gauntlet, Feet boot, Accessory necklace/pendant. The assembly uses generated WebP masters matching the approved silhouette sheet, with a separate CSS gold circle. The SVGs are optional original vector interpretations, not exact traces of those masters. Inspect real 24/32px samples before runtime adoption.
- `icons/`: complete matching action/stat/source symbol family plus a gold coin. These extend the existing in-repository icon language, recolored for dark surfaces. They are not replacements for canonical creature/equipment images.
- `ornaments/`: original gold corner, divider and item plinth. No botanical corners belong in this locked style.
- `textures/slate.webp`: newly generated quiet matte slate material, used below a dark opacity layer. The unmodified PNG master and exact prompt are in the Drive source archive. Repetition is subdued by the overlay; the generation's tiling request is not a guarantee of mathematically seamless edges.
- `fonts/`: bundled full Tinos Regular, Bold, Italic and Bold Italic TTF originals; lossless WOFF web packages; upstream metadata and SIL Open Font License. This is the explicit production serif choice matching the reference's Times-style proportions. AI concept lettering is not an identifiable font file. No remote font request or system-installed Times dependency.
- `forge.css`: `@font-face`, colors, typography, responsive geometry, badge anchors, focus and state styles, nine-slice panel usage.
- `sample-data.json`: read-only six-recipe catalog snapshot exported through actual game helpers. Its stock/Gold/ownership are synthetic QA examples; do not import them into saves or production balance.
- `preview.html`, `preview.js`: isolated responsive **asset assembly**, not a live gameplay screen. No localStorage, save writes, purchases, crafting or loadout changes. Craft opens an explicitly sample-only window. Hover/keyboard tooltips on desktop; explicit info/tap details on phone. `catalog.html` renders every SVG and typography specimen.
- `asset-index.json`, `manifest.json`, `generation-prompts.json`: SHA256 inventory, exact sources/reuse map, dimensions, license and generation provenance.

Rebuild SVGs: `python scripts/build-forge-slate-assets.py` from repository root. Canonical scene, Iona, six item images, Iron and Nails are reused by their existing paths and indexed hashes. The archive includes their original bytes; the repository avoids duplicating them.

## Geometry and typography

Use panel border images with **28px slice / 8–12px rendered border**. This preserves ornamental corners rather than stretching a complete frame. Button art is applied as a complete SVG background with explicit dimensions and nonuniform scaling; this avoids fragmenting the short phone controls. The source is also suitable for24px slicing in engines with appropriate nine-slice support. Item frames are square 128-unit SVGs, aspect ratio1, rendered around the art tile only. Suggested desktop tile108–140px, phone87–112px, category badge24–32px; selected preview can be larger. Category glyphs have a64-unit viewBox; complete badge80. Warm ivory shapes sit over dark circles with a muted gold rim, independent of rarity.

Rarity mapping explicitly requested by user: **Common green, Uncommon grey/silver, Rare blue, Heroic purple**; Legendary gold is supplied for system completeness. Power letter is upper-left of **item artwork**, +enhancement upper-right, category badge lower-right. No name/category/rarity pills outside the tile. Full name, slot, rarity, power, enhancement, main/substats, set, ownership and description remain accessible in hover/focus/tap details. Selected-item heading can retain its name. White corner brackets distinguish selection without replacing rarity color.

Typography uses Tinos throughout: title32–36px bold desktop /26px phone; section24–27px bold; selected heading24–28px bold; body15–17px; material/subtext11–14px; controls18–23px. At short landscape, dense details move into accessible detail windows rather than being clipped. `forge.css` contains actual sizes and responsive adaptations.

## Runtime integration contract

Keep actual engine quotes, stats, substats, sets, material values, usable versus reserved quantities, copy IDs, affordability, stale-quote validation, rapid-click lock and save persistence authoritative. The **Craft** wording change does not authorize removing the existing confirmation or transaction guards. Remove redundant top anvil/tools menu; use labeled Craft/Improve navigation. Outfitter price is a secondary route link, not a primary Craft-or-buy button. Hide paging controls if all items fit on one page; the original concept's redundant1/1 pager is not a gameplay requirement.

Do not replace canonical Iona/gear art with the AI redraws shown inside a concept. Use existing layered images. Preserve approved equipment comparison/review/receipt semantics and distinguish a future Improve Equipment redesign from this Craft kit. Maintain draft/unmerged PR21. Actual runtime integration and protected hosted gameplay are separate unfinished work; an asset preview is not evidence of live save/transaction QA.
