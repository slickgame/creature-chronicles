# Approved equipment art integration — 2026-10-03

Implements the approved revised 15-item sheet in the Outfitter and team loadouts. All new catalogue pieces now use distinct 256×256 alpha WebP icons in `public/images/ui/equipment-v2/`. Equipped-slot illustrations use the actual selected item. Shared shield-shaped quality badges identify gear quality; separate Equipped / Owned / Not Owned labels describe inventory, including copies equipped on other creatures.

## Save-compatible weapon names
- `training_grips` → Training Blade
- `channeling_prism` → Channeling Staff
- `duelist_grips` → Duelist Saber

IDs, flag keys, slots, costs and numeric effects are unchanged. Existing owned/equipped weapons retain their identity. Innate creature grades remain unchanged.

## Artwork provenance
Built-in image generation, using the user-approved revised equipment board (Training Blade / Channeling Staff / Duelist Saber, followed by the unchanged Armor, Head, Hands / Feet and Accessory rows). Generated one transparent production atlas, then packaged the fifteen isolated cell illustrations as individual WebPs. Crop review removed neighboring cell corner fragments. No repainting or character artwork changes.

Production prompt:
> Production asset edit: convert this approved equipment board into ONE transparent inventory icon atlas. Preserve the fifteen item designs and warm dimensional hand-painted rendering faithfully. Remove ALL parchment, wood framing, grid lines, headings, names, letters, badges, text, ownership labels and background; keep only the equipment objects. Layout EXACTLY 3 equal-width columns by 5 equal-height rows covering the entire canvas with NO header/footer or sidebar. Every cell is the same size, with each object centered, isolated and contained within its own cell, generous transparent padding at least 12% at all sides. Reading order: row1 Training Blade (iron shortsword), Channeling Staff (long wood staff teal gem), Duelist Saber (curved steel blade gold guard navy grip). Row2 Padded Harness, Warded Harness, Sentinel Harness. Row3 Linen Headband, Focus Circlet, Sentinel Helm. Row4 Practice Wraps, Runner Bands, Duelist Bracers. Row5 Keepsake Charm, Reserve Pendant, Focus Emblem. Preserve the silhouettes, material colors and details from the reference, especially the distinct weapon silhouettes versus wrist/hand equipment. Each paired item set stays together in its one cell. Weapons fit diagonally inside cell. No cropping, overlaps, lettering, symbols outside equipment, or residual labels. Transparent background with clean alpha edges. This is one coherent sprite atlas, not a styled presentation page.

## Validation
- Production build and TypeScript pass; scoped lint zero errors (14 image warnings).
- Six equipment regression cases pass: exact battle-stat previews, migration, returns, purchases, unchanged innate grades, distinct icon paths, renamed weapon identity, and ownership of copies worn by other creatures.
- Team and shop checks pass seven screen sizes (1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740, 844×390), including purchase/equip/remove, comparisons, loaded imagery, popups and no main-screen scrolling. Dedicated weapon-art checks cover desktop, phone portrait and landscape.
- Icon contact sheet visually reviewed on parchment; all 15 silhouettes are distinct and contained.

PR #21 remains draft and unmerged. Deploy to the existing branch preview only.
