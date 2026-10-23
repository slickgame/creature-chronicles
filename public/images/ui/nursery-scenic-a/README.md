# Scenic Nursery A

Approved scenic nursery: separate sunny room, neutral oak/gold cradle, interchangeable species eggs, navy/gold inspector, Tinos regular/bold, arrows and counter, paged Choose egg with draft selection and Select/Cancel. No clover theme.

`room.webp` is the background; `cradle.webp` has alpha; `eggs/{feline,canine,bovine,lapine,equine}.webp` have alpha. The same species shell appears in the scenic view, inspector and picker. `approved-concept.webp` is illustrative reference art. `source/` preserves unchanged generated PNGs; `manifest.json` records their hashes. Rebuild with `node scripts/build-nursery-scenic-assets.mjs <original-PNG-directory>`.

Frames/buttons/states reuse `../day-cycle-v1/*.svg`. Fonts and OFL license are in `../forge-slate-v2/fonts/`. Care, Growth and Lineage painted RGBA icons reuse `../creature-overview-a-v2/painted-r4/`. Do not replace these with flat approximations.

Display Species/Type for base eggs: Cat/Cat, Dog/Dog, Cow/Cow, Rabbit/Rabbit, Horse/Horse. Special variant names remain Type. IDs and breeding rules are unchanged. Special variants currently reuse their family shell; the presentation helper can map future variant-specific artwork. Creature illustrations use registered `portraitPath` busts.

Original generation direction: upright smooth unbroken eggshell, anime-painterly matte shell, warm upper-left light, true alpha, no cradle, clovers, symbols, faces or protrusions. Feline: caramel tabby stripes and rosettes. Canine: charcoal/russet/ivory tricolor patches. Bovine: black/ivory patches. Lapine: pearl gray/taupe mottling, cream speckles, blush crown. Equine: chestnut with ivory blaze and cream dapples. Room: sunny timber nursery, oak beams, ivory curtains, shelves, plants, baskets, open center. Cradle: empty ornate carved oak oval basin, neutral gold scrollwork/diamond, ivory cushion, plain teal fabric, alpha background. No original artwork was regenerated during recovery.
