# Owned equipment A — runtime integration, October 17, 2026

The approved compact A gallery now replaces EquipmentGallery’s parchment grid and separate Compare equipment popup. Desktop keeps eight compact tiles beside inline selected-piece details. Phones page four tiles and switch between Gear and Selected item; short landscape uses a focused two-column item panel. Browsing and closing the gallery preserve the parent creature equipment screen.

## Approved supplied icons

The supplied category sheet matches the existing production Weapon sword, Armor breastplate, Head helmet, Hands gauntlet, Feet boot and Accessory pendant cutouts under `public/images/ui/forge-slate-v2/categories/`. Category filters and tile badges use these exact WebPs, selected by equipment-slot metadata. The second supplied sheet matches `stats/approved-stat-action-atlas.webp`; EquipmentStatIcon renders its equipment stats, Inventory bag and Equip action. No substitute icon family or regenerated artwork was added. Actual set metadata still determines the sculpted lower-left marker, opposite the category badge. Evasion remains creature/combat-only.

## Behavior

- Search, power/rarity/set/availability filters, sorting and paging retain exact-copy identities. Selection is kept on the visible page, including direct initial-copy entry and viewport capacity changes. No matching item clears the inline details.
- All four recorded substats are shown, including empty slots. Selected piece set identity is separate from the target creature’s equipped-only set counts. Inventory copies never count toward set progress.
- The browse creature picker changes context without saving. It never equips items. Shared EquipmentActionFlow handles recipient eligibility and both-creature transfer validation, stat/set previews, stale review guards, one confirmed save and persisted receipts.
- Remove always targets the piece’s actual wearer, even if the gallery context is another creature. Existing training/gauntlet locks remain.
- Improve opens compact UpgradeReview directly. The exact copy, recorded stats and price are captured, compared again at confirmation and saved once. Four-substat milestones say “Random substat increase”; the closed mystery envelope remains, and no future result is revealed before payment. Existing UpgradeSuccess renders the persisted result.
- Existing source links and Outfitter handoff remain; full descriptions, legal pools and passives remain accessible through EquipmentGuide.

## Verification

Production Next build/TypeScript passed. Modified TSX lint has zero errors and seven existing-style img performance advisories. Equipment action, transfer and snapshot suites passed all 12 tests; equipment enhancement passed all 11 tests.

Local production browser validation used disposable synthetic saves, including 16 exact copies, duplicate items, free/worn pieces and Legendary four-substat pieces. All 27 functional checks passed, including combined filters, no-write browsing/cancel, exact-copy transfer/replacement/removal, one paid milestone, and return to the same creature Equipment tab. Inventory, Outfitter and Forge transfer entry routes passed cancellation and double-click confirmation checks. No browser runtime errors.

Seven viewport sizes were checked in both Gear and selected-item states: 1920×960, 1440×900, 1920×720, 2560×1440, 390×844, 360×740 and 844×390. All 14 states fit the viewport with no internal pane overflow or actionable controls outside the frame. Visual inspection confirmed the selected A proportions, bounded tile gaps, actual category glyphs, Inventory badge, rarity frames and all four stat rows. A small-phone footer overlap caught in the first pass was corrected and rechecked.

Actual local production screenshots (synthetic game data):

- `validation/owned-equipment-a-desktop.webp`
- `validation/owned-equipment-a-phone-gear.webp`
- `validation/owned-equipment-a-phone-details.webp`
- `validation/owned-equipment-a-small-phone.webp`
- `validation/owned-equipment-a-landscape.webp`
- Machine-readable checks: `validation/owned-equipment-a-results.json`

The first save can independently award eligible ranch goals; the upgrade receipt reports the actual 36 Gold price and current persisted balance. Reducer tests verify the equipment charge. Sparse-checkout unrelated legacy image requests used a local workshop fallback during QA; every category, equipment, set and stat/action asset exercised here exists in the production kit.

Hosted preview gameplay remains authentication-protected and was not exercised in this pass. Publish on the existing feature branch only; PR #21 stays draft and unmerged.

## All and Filters icon refinement

The user requested clearer All and Filters icons after approving gallery A. All now uses four large ivory/gold tiles in `icons/all.svg`; Filters uses three ivory/gold adjustment sliders in `icons/filter.svg`. Both are original scalable symbols extending the existing kit. The asset index records their exact bytes/hashes and the kit generator preserves these hand-authored controls. The font-dependent All character and its CSS rules were removed.

The production build/TypeScript passed. Actual production-browser checks at 1440×900, 390×844 and 360×740 confirmed both SVG sources, category-to-All reset, Filters open/close, unchanged saves, no clipping and no runtime errors. Actual control screenshots: `validation/owned-equipment-controls-desktop.webp` and `validation/owned-equipment-controls-phone.webp`; results: `validation/owned-equipment-controls-results.json`.
