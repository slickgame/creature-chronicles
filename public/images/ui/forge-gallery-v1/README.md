# Forge A — Recipe Gallery production assets

Selected by the user on October 16, 2026. Use corrected Forge A only. This folder is a production graphic kit with an isolated, sample-only assembly. The live Forge has not been redesigned yet.

## Contents

- Three original painted illustrations: quiet parchment, botanical corner, craft-completion seal. Production RGBA WebPs are here; unmodified full-resolution PNG masters and exact prompts are in the complete Drive archive.
- 44 text-free editable SVG surfaces in `frames/`: gallery/detail/dialog/receipt/source/dialogue windows, recipe-card states, title and host plaques, material/cost/stat rows, notices, tooltips, pager, primary/secondary button states, tabs and rarity badges.
- 35 editable symbols in `icons/`, extending the existing brown C2 stroke language.
- 11 canonical reused assets: workshop background, Iona, recipe display frame, six exact gear images and Iron/Nails illustrations. `manifest.json` records their existing public paths and SHA-256s; the complete archive includes these files.
- `asset-index.json`: 93 graphic paths, byte lengths and SHA-256s. `sample-data.json`: output blueprints, recipe costs and example comparisons exported from actual game helpers. Labels are editable HTML, never baked into artwork.
- `preview.html`, `preview.css`, `preview.js`: 12 responsive sample views, with a paged catalogue of all graphics. Serve the repository's `public` folder as the web root and open `/images/ui/forge-gallery-v1/preview.html`.

## Production use

Preserve original character/gear art. Reuse vectors for responsive windows; keep painted ornament clear of text. The assembly intentionally enlarges parchment to use its quiet center. Recipe-card vectors are square to preserve narrow internal margins on tall phone cards. Keep live text semantic and editable. Use SVG frame backgrounds for UI, not rasterized concept screenshots.

The assembly shows sample stock (3 Iron, 0 Nails, 0 reserved, 1200 Gold). The receipt is illustrative even for an unavailable recipe; it does not spend ingredients or grant an item. Every page is marked SAMPLE/ASSET PREVIEW. Buttons switch layouts; Builder's Yard/Improve gear currently open the sample tools page. There are no storage reads/writes, live navigation bindings or transactions. The compare view uses a sample equine and empty-slot replacement. This fixture must not replace current saved creature/stock/quote data.

## Covered windows

Recipe gallery; selected output with paged substats; materials and labor; paged creature comparison; exact-cost table; craft-versus-buy explanation; craft review; craft receipt; ingredient source; tools; Iona dialogue; complete graphic catalogue. Desktop shows six recipes; phone shows two per page. Iona can collapse on desktop. All information is reachable through pages/focused windows.

## Next integration

Wire the selected layout into existing real Forge handlers and guards: exact recipe output/cost, usable and reserved quantities, stale-quote checks, transaction locks, inventory delivery, no failure/hidden fees/automatic equip. Reuse existing upgrade windows and engine behavior; do not substitute sample routes or illustrative receipts. Verify real cancelled/confirmed crafting, source returns and persistence at all four tested sizes; show actual game screenshots afterwards. Keep PR21 draft/unmerged.
