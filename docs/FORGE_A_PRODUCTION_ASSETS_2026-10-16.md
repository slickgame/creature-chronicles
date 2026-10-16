# Selected Forge A — complete production graphic kit

The user selected corrected Forge A, Recipe Gallery, then requested every visual asset needed for it. Selection is final; Forge B stays unused. This update creates the complete asset kit and isolated responsive assembly. It does not yet integrate Forge A into live gameplay. The previous equipment Compare A is already implemented and is separate.

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

## Provenance and validation

`public/images/ui/forge-gallery-v1/manifest.json` records exact image-generation prompts, full-resolution master dimensions/hashes, production derivative dimensions/hashes and canonical reuse paths/hashes. Masters are unchanged generated PNGs; production conversion uses RGBA WebP quality92/method6, with only corner/seal downsampled to 512px. No character or equipment illustration was redrawn.

`scripts/build-forge-gallery-vectors.py` deterministically produces the 79 editable text-free SVG files. The complete source archive also includes the generation prompts, original PNG masters, corrected selected concept, all reused graphics, sample-data exporter, browser QA script/log and screenshots.

Scoped validation: SVG XML parsing, all raster decoding, alpha-channel verification and SHA-256 inventory checks; JavaScript syntax check; all 12 assembly views, all catalogue/impact pages at 1440×900, 390×844, 360×740 and 844×390. Additional checks cover six recipes and every output-stat page on small phone/short landscape, two-ingredient costs, missing-input disabled review, source paging, zero browser/network errors and unchanged local/session storage. No overflow is hidden. Screenshots were visually reviewed; safe text padding and short-landscape detail height were corrected.

Only static graphics, preview files, one vector generator and documentation changed. No game runtime, pricing, save schema, RNG or transaction code changed. The previous 350-test regression and optimized build remain the latest full game validation; static asset QA is not a new gameplay test or hosted-authentication claim.

## Saved delivery

Complete 130-file, 19,942,730-byte kit (ZIP SHA-256 `f4babda91122235a2fd44544316beeeff084e5c33e7a43d329109bd60d89c9bc`): https://drive.google.com/file/d/1KMAOtPGMf8hKZSz0xOtolfHMW2n0Gv5l/view

Assembly screenshot desktop: https://drive.google.com/file/d/11XTL9yeSXt3I5Mj1joumlCn8KtGKEAXn/view

Assembly screenshot phone: https://drive.google.com/file/d/1aQQ1I4FXBJM7aGbRNeqQ6alfLz2m_Pm9/view

Assembly crafting review phone: https://drive.google.com/file/d/1vIpPxeWlPY0KH7rPQB8UXRECcgEDeYMc/view

These are rendered static asset previews, not live-game screenshots. The before-redesign actual-game captures and selected corrected concept are included in the archive.
