# Ranch Ledger A production kit

Selected reference: `../daily-ledger-review/options.png`, option A.

All production assets are real existing approved assets, with matching native
frames assembled by `scripts/build-daily-ledger-a-assets.py`. No generated
concept background or sample values are substituted into gameplay.

| Element | Production asset |
| --- | --- |
| Ornate ledger and vignette | `window.svg` |
| Default / disabled / focus controls | `button.svg` with runtime state styles |
| Active tabs / selected rows / primary actions | `primary.svg` |
| Entry and detail panels | `action.svg` |
| Hover panel / reusable divider | `action-hover.svg`, `divider.svg` |
| Source navigation | `chevron.svg` |
| Food | `../habitat-a/feed.webp`, original painted true-alpha ration sack |
| Nursery | `../atelier-v1/egg.webp` |
| Brief / activity records | `../atelier-v1/ledger.webp` |
| Work / condition / tax / moods / morning | `../ranch-v2/icons.webp`, direct atlas rendering |
| Farmhouse and phone vignette | `../ranch-v3/house.webp`, canonical room |
| Back / art control | `../creature-overview-a-v2/icons/back.svg`, `expand.svg` |
| Type | `../forge-slate-v2/fonts/Tinos-Regular.woff` (400), `Tinos-Bold.woff` (700) |

`manifest.json` records SHA-256 source hashes, including shared art and fonts.

## Layout and type

The composition is bounded to 1440px. Desktop preserves a large scenic left
area and a compact right ledger with six tabs, three paged entry rows, selected
detail and a persistent day action. Header 27px bold, section 23px, entry 18px,
detail heading 25px, body 17px; ivory `#fff0d5`, navy `#031725`, gold borders,
emerald selected controls and warm amber attention text.

Phones at or below 700px use 3×2 tabs, a framed room vignette, compact rows,
selected detail and the same explicit day action. Entry pages adapt to height.
Below 650px high, Entries and Selected entry views conserve space. Long detail
text uses explicit Back/More pages, including event review and empty states.
Art can be minimized or restored. All descriptions and records remain reachable.

## Gameplay boundaries

Five ranch priorities: food, nursery, farm work, monthly tax and ranch condition.
Town training is omitted from this list; training and its rewards remain in the
existing game. Habitat cleanliness is deferred until the actual system exists.

Begin Ranch Day and Confirm choice are explicit saved actions. Review & End Day
opens the existing review. Event review/cancel uses the same production kit.
Resident names, levels and statuses remain on the existing Habitat dock; Moods
also shows the live resident level and management status.
