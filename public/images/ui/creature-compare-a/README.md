# Comparison A production assets

Visual acceptance: option A in `../creature-compare-review/options.png`. The comparison uses canonical gameplay bust portraits, not the illustrated sample alternatives. The complete asset system is wired into CreatureComparisonA; native labels remain real text.

| Element | Production source |
| --- | --- |
| Window and button frames | `../creature-removal-c/window-ornate.svg`, `secondary-ornate.svg`, `primary-ornate.svg` |
| Table and talent-card frames | `ledger-frame.svg`; reproduce with `scripts/build-creature-comparison-assets.py` |
| Fonts | `../forge-slate-v2/fonts/Tinos-Regular.woff` and `Tinos-Bold.woff`, explicit 400/700 |
| Six attribute symbols | `../stats-growth-b/{strength,dexterity,stamina,charm,willpower,fertility}.webp` |
| Talent icons | Actual owned IDs from `getTalentPresentation`, ten launch icons under `../talents-c/icons`; painted generic icon for retained records |
| Portraits | Existing Nyla/equine gameplay helpers and canonical variant portraits |
| Selection, close, paging | Native text controls and check states; no image-baked values |

Runtime style: CreatureComparisonA.module.css. Desktop width up to 1020px, bounded 730px window height; phone width viewport minus 16px and bounded 650px height. Frames use nine-slice borders. Desktop title 30px, creature names 27px, table text 18px; phone title 24px, identity 20px, table values 15px. Tinos regular values remain visually separate from bold identity labels. Warm ivory #fff0d1, navy #031b27, gold #ac8d4f, teal selections and #b9e77a higher-current-value accents. Ties stay neutral. Desktop row density 38px, phone 44px, short screen 33px with explicit paging.

All three comparison sections remain available on phones. Small/short layouts replace the desktop talent summary cards with a focused View talents action. The talent viewer retains all owned records through paging and opens the shared complete talent-details window. Eligibility reasons use focused paged details. No extra raster assets or alternative character art are needed; existing approved art is reused without alteration.
