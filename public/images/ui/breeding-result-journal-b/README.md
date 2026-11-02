# Approved Breeding Result B — Ranch Field Journal

Approved user reference: `source/approved-options.png`, middle B panel. This is the live post-attempt receipt, not a static concept overlay.

## Runtime layers
- `folio-v2.webp`: independently generated transparent leather/brass folio and deckled amber paper, sepia barn/windmill and small bottom daisy/fence drawings. Bottom art revised downward to keep live controls clear. `folio.webp` is the archived first draft.
- `seal.webp`: independently generated transparent copper wax seal, embossed egg and ribbon tails.
- Native SVG outcome ribbons, cream/emerald controls, ornament and six icons: editable sources reproduced by `scripts/build-breeding-result-assets.py`.
- Tinos regular/bold reused from breeding-desk-a; italic/bold italic copied from the existing licensed forge-slate-v2 font family. License: `fonts/OFL.txt`.
- Ranch environment reused unchanged from pair-options-journal-b/fidelity-v2/ranch.webp.

All generation masters and exact prompts are in `source/`. Generated layers contain no live labels, values or actions. UI text remains native, selectable and accessible. No character artwork was regenerated.

## Derivatives
PNG masters were alpha-trimmed with sharp threshold 8, resized to height 1600 (folio) / 384 (seal), then encoded WebP quality 96. Alpha is preserved. SVG controls are stretched by border-image with filled centers. Runtime references the revised v2 folio only.

## Behavior
Real immutable attempt values drive names/day/chance, Energy and progression. Immediate receipt captures pre/post Hearts once; an unavailable historical snapshot shows the exact recorded cost with an explicit explanation. No costs, odds, rolls, save schema or transaction rules change. Scenes are optional even with Full Scenes selected. Open Ledger selects the exact attempt; Open Nursery follows the explicit care ID and offers return to this receipt. No repeated attempt button exists on the main receipt; further attempts require a fresh guarded review.

See `docs/BREEDING_RESULT_JOURNAL_B_RUNTIME.md` and `docs/validation/breeding-result-journal-b/results.json` for runtime proof. PR21 remains draft/unmerged.

Icon refinement: six original transparent 64px SVG illustrations now use filled parchment/brass/copper silhouettes (scene frame, sealed record, open ledger, egg nest, gold XP star and copper heart). No icon font dependency. The footer is plain “Results saved” on a transparent background; the redundant paid/viewing sentence is removed.
