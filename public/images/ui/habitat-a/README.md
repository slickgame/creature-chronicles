# Habitat A — courtyard & care

Approved concept: `../habitat-review/options.png`, row A. Runtime: `src/features/habitats/HabitatScreen.tsx` and `HabitatCourtyard.module.css`. Builder: `scripts/build-habitat-a-assets.py`.

All interface text, controls, values and meters are native interactive elements. The concept image is never used as a flattened runtime menu. Existing family courtyard backgrounds and canonical full-body/card portraits remain authoritative.

| Element | Production source | Desktop / phone |
|---|---|---|
| Outer shell and care frame | `window.svg` native ornate nine-slice | 22px / 17px ornamental inset |
| Secondary controls | `button.svg`, native 320×80 master | 40px / 33px minimum height |
| Feed/Menu | `primary.svg`, emerald double rim | Feed 47px / 36px minimum |
| Selected resident | `resident-selected.svg` | compact tile up to250px, no forced stretching |
| Open-space/status surfaces | native CSS surfaces and existing care state tones; `panel.svg` is a spare reusable frame | navy/gold, honest counts |
| Feed illustration | `feed.webp` true-alpha, generated `source/feed.png` master | 25px / 22px |
| Residents / Collection | `creature-overview-a-v2/painted-r4/creatures.webp` | 26–27px / 21–23px |
| Habitat / Ranch House | same family's `habitat.webp` | 26–27px / 21–23px |
| Needs care | same family's `care.webp` | 26px / 23px |
| Profile / Breeding | same family's `profile.webp`, `lineage.webp` | 25–27px / 21–22px |
| Manage | `care-b/icons/management.webp` | 25px / 22px |
| Condition | `care-b/icons/{healthy,hurt,injured,tired,exhausted,recovering,pregnant,training}.webp` | 26px / 21px |
| Energy / Hearts / Affection | `creature-overview-a-v2/sculpted/{energy,heart}.webp` | 27px / 21px |
| Empty heart | `heart-empty.svg` | pips24px /18px, with actual partial-fill overlays |
| Back / resident arrows | `creature-overview-a-v2/icons/back.svg` (next rotated180°) | 17–18px |
| Protection | `care-b/icons/lock-open.webp`, `lock-closed.webp` | actual state, correct action label |
| Typography | `forge-slate-v2/fonts/Tinos-Regular.woff`, `Tinos-Bold.woff` | explicit400/700, no synthetic bold |

Desktop composition max1440px; >1700px widths bound height near930px. Outer margin14×20px, care panel22×19px padding, main heading34px, name36px, labels/values19px, action17px. Phone margin6px, heading28px, name28px, vital16px, actions15px. Scenery retains flexible space; care panel stays content-sized and vertically centered. Exact adjustments for tablet, short phone and landscape live in the CSS module.

Resident bar always shows name, Level N and actual status. Paging adjusts to remaining width, with up tothree compact tiles. Name wraps instead of ellipsis; full name, level and status remain available. Desktop secondary destinations stay inline beside the dock; phone destinations form a separate compact row. Minimize/Expand artwork is explicit, under More on smaller screens. No content is concealed to pass layout checks.

Colors: deep navy `#031725`, ivory `#fff0d5`, muted gold `#dbc9a6`, emerald actions, gold Energy fill, green Affection fill, red heart pips. Heart totals abovefive use exact numbers and a meter. Focus outline is warm ivory/gold; hover increases brightness; disabled controls retain readable reduced opacity. Existing condition tones, feed caps, restrictions, profile records, removal and rename flows are preserved.

New image generated with built-in imagegen; no creature artwork generated/replaced. Generation prompt and checksums: `generation.json`. Runtime WebP is a standard256px resize/encode of the alpha master, no artistic edits. Existing approved icons are reused directly, not masked or redrawn.
