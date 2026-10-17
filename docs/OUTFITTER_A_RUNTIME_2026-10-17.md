# Outfitter A runtime — October 17, 2026

The user selected the shop-first gallery A (`439a03d0-e744-43ed-88de-0da78950fc09.png`) and asked to reuse the recently made four-tile All icon. BattleOutfitterBench now uses that exact `forge-slate-v2/icons/all.svg` and the matching slider `icons/filter.svg`. It shares the approved gallery surfaces, square item art, category cutouts, stat atlas, rarity frames and actual set metadata; the concept’s illustrative badge/color errors were not copied into runtime.

Desktop presents a compact eight-tile shop catalogue, inline new-item details and Gold price, an equipped-only target set strip, and quiet Improve/Talk actions. Phone uses a four-tile paged Shop section and a focused Selected item section with room for all four substat slots. Search, sorting, power/rarity/set filters, category filters and product categories (Equipment, Manuals, Consumables, Team Prep) remain available. Default ordering puts Gold shop items before Marks-only items. Canonical Outfitter background and Daria portrait are reused.

## Purchases and owned equipment

Shop profiles always describe a new +0 blueprint. Existing owned Legendary or upgraded copies never supply the shop’s rarity, price or rolls. Owned equipment / View owned copies opens the shared EquipmentGallery with exact-copy selection and the chosen creature context. All Equip, Transfer and Remove actions remain in its existing EquipmentActionFlow. Improve and Item details reuse the established workbench and compact B inspector.

Purchase confirmation captures item/price/current inventory context and validates a fresh quote before saving. The busy lock persists through the result, and fresh review/receipt controls have 250ms click-through guards. One confirmed purchase produces one unassigned +0 copy. Daria’s Report discloses independent ranch-goal rewards, and View new copy opens the exact new copy ID. Buy cancel and read-only browsing never save. Insufficient Gold, maximum stock, and Coliseum exclusivity remain engine restrictions. Purchases use Gold only; equipping requires separate confirmation.

Compare new copy uses a fresh +0 purchase preview, not an existing worn copy. All battle changes and set changes are paged; a lost-set warning remains visible in either section. There is no transaction in this preview. Equipped set counts use the target creature’s actual worn pieces, including in-progress groups; shop profiles and inventory pieces do not contribute.

Manual buying and study retain the existing engine helpers and capped effects; study consumes one manual and never changes innate grades. Existing Move Training handoffs remain when provided by the caller. Consumable and Team Prep effects, inventory counts, and full descriptions remain inspectable. Legacy full-profile/stock side panels were replaced by focused shopping and shared owned-equipment navigation.

## Verification

- Final production Next build/TypeScript and modified TSX lint passed (zero lint errors; eight standard img advisories).
- 18 focused Outfitter integration, equipment-action/transfer and inventory tests passed.
- 24 browser functional checks plus six support/blocked-purchase checks passed: approved icon sources, blueprint/owned rarity separation, all categories, search/filters, no-write browsing/cancel, paged purchase comparison, one new copy from double-click confirmation, exact receipt selection, shared equip review, Marks restrictions, Improve return, manual purchase/study, unchanged innate grades and insufficient Gold. No browser runtime errors.
- Both Shop and Selected item were checked at 1920×960, 1440×900, 1920×720, 2560×1440, 390×844, 360×740 and 844×390: 14 states without internal panel overflow or controls outside the frame. Purchase comparison fits portrait phone and short landscape. Visual inspection checked approved A proportions, bounded tile gaps, actual set/rarity/category badges and four-tile All icon.
- A sizing issue caused by equal-specificity shared CSS was corrected; the composition now fills and centers in its viewport. The last change only clarified the Study confirmation note; final build/lint include it and previous behavior/layout checks remain unchanged.

Actual local production screenshots and evidence (disposable synthetic saves):

- `validation/outfitter-a-desktop.webp`
- `validation/outfitter-a-phone-shop.webp`
- `validation/outfitter-a-phone-item.webp`
- `validation/outfitter-a-landscape.webp`
- `validation/outfitter-a-results.json`

Canonical previously sparse Outfitter/NPC/sign/coin assets were restored from existing git objects for QA; these are unchanged assets, not new artwork. Unrelated missing legacy images used the existing local fallback. Hosted gameplay is authentication-protected and was not exercised. Publish on the existing feature branch, with PR #21 draft and unmerged.
