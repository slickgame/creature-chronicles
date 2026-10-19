# Profile & Care — focused card A

Approved reference: `../creature-profile-review/options.png`, band A. Live component: `src/features/creatures/CreatureProfileCardA.tsx` and its CSS module. These are actual reusable assets and text controls, not a baked menu image.

| Element | Asset/source | Desktop / phone |
|---|---|---|
| Window | `window.svg`, ornate nine-slice | max650px / viewport minus18px |
| Vital/protection cards | `vital.svg`, native gold-corner frame | 2×2 / four stacked rows |
| Secondary/primary buttons | `button.svg`, `primary.svg` | 40px / 37px minimum height |
| Energy, Affection/Hearts, XP | `creature-overview-a-v2/sculpted/{energy,heart,experience}.webp` | 34px / 28px |
| Lock states | `care-b/icons/lock-open.webp`, `lock-closed.webp` | 30px / 25px |
| Hearts | Existing red painted heart; new native `heart-empty.svg` | 22px / 19px pips |
| Portrait | Canonical gameplay card sprite helpers | 104×108px / 76×80px |
| Back / profile arrow | `creature-overview-a-v2/icons/back.svg`, `creature-inventory-a/art/chevron.webp` | 18px / 15px |
| Typography | Existing licensed Tinos Regular400 / Bold700 WOFF | Header28px /22px; name32px /27px; labels19px /16px; values16px /14px |

Native asset builder: `scripts/build-creature-profile-assets.py`. Window/buttons extend the existing approved ornate frame family; vital cards extend Filters C. No additional raster generation was needed: the concept's painted symbols and lock states already have approved production sources. Canonical creature portraits are reused instead of generating new character thumbnails. All outlined/painted heart layers support partial fill; above five hearts use exact numeric totals plus a meter.

Colors: midnight `#031725`, warm ivory `#fff0d5`, gold ornamental frame, emerald primary action. Desktop content gaps12px, vital gap10px. Phone gaps9px and6px. Regular and bold fonts are explicitly declared. Hover uses restrained brightness, focus a warm 2px outline; primary, secondary, close, Back and disabled states remain native accessible controls. All exact responsive adjustments are in the scoped CSS.

Short screens use a compact 2×2 vital grid; wide landscape places identity/protection beside the vital grid. Long names retain their complete text with smaller headings and wrapping. No content is concealed to pass fit checks; all four vitals, actions and lock state remain visible.

Data comes from the current save. Actual value/max numbers and actual fill ratios take precedence over the concept's illustrative sample data. Eight main sections remain on the full creature page. Back/Escape preserve the underlying tab; explicit navigation opens the requested existing section. The only direct write in this card is the existing lock/unlock action.
