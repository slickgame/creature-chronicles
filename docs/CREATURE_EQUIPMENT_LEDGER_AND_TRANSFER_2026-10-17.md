# Creature Equipment ledger B and exact-copy transfers

The user selected B (Equipment ledger) and requested access to the rest of the creature page plus transfers of equipment already worn by another creature.

## Runtime

CreatureEquipmentLedger replaces the creature Equipment tab’s plain slot buttons with six slate/gold slot rows and inline selected-item details. It reuses UpgradeItemArt rarity frames, grade/upgrade corners, sculpted set/category badges and the approved stat/action atlas. Selected equipment shows its actual main stat and up to four recorded substats. Details includes the full description, slot rules and any special passive. Empty slots, exact-copy removal, paged equipped-only set progress and four-stat-per-page battle totals remain available.

The eight creature tabs remain above Equipment on desktop. Phones and short landscape use the Creature section selector; selecting another section keeps the same creature. Previous screen leaves the roster. Entering Equipment on small screens collapses the roster/artwork using their existing state and Show controls. Resize preserves that usable default. Compact equipment pages are Slots / Selected item / Sets; Overview / Substats focuses item content on portrait phones, while landscape shows the main stat and all four substats together.

A worn item is selectable for transfer. equipmentRecipientBlocker checks the recipient and current wearer (including training and gauntlet locks). getEquipmentActionQuote previews removal and assignment on detached saves, records both creatures’ before/after snapshots, and fingerprints both. Confirmation requotes, rejects stale reviews, locks repeated clicks, then persists the combined result once. The exact source copy moves; the recipient’s replaced copy returns to inventory; rarity, rolls, upgrades, identity and currencies are preserved by the transaction.

EquipmentTransferWindow shows both creatures side by side on desktop and wearer/recipient tabs on phones. Both panels start at three changes, expand into their set-panel area, page all changes, and retain lost-set warnings. The saved receipt uses actual persisted snapshots, Before/Saved wording and fresh minimized state. Review and receipt readiness guards prevent double-click-through. Goal awards are disclosed separately from the free equipment move.

Inventory/creature EquipmentGallery, BattleOutfitterBench and Forge EquipmentUpgrades share EquipmentActionFlow. Outfitter prefers a free copy and offers transfer when its owned copy is worn elsewhere. Forge retains separate Transfer and Remove actions for worn pieces; upgrading still uses its existing Gold quote and compact review/receipt.

## Validation

- Production Next build including TypeScript passed. ESLint reported zero errors; existing image-performance warnings remain.
- Full regression suite: 362/362 passed. Focused equipment tests: 12/12 passed, including the subsequently added donor/recipient gauntlet-lock case.
- Seven production-build browser layouts: 1920×960, 1440×900, 1920×720, 2560×1440, 390×844, 360×740 and 844×390. Slots, selected item, four substats, set progress, section navigation and battle-stat popup checked. Ledger panels fit without internal overflow or clipped bottom actions.
- Transfer review: desktop, wide/short, both phone widths and landscape; all changes remain reachable, with both Striker and Swift loss warnings visible while minimized and expanded.
- Actual navigation through creature Equipment, Inventory, Outfitter and Forge verified. Cancel leaves saves unchanged. Rapid review cannot confirm, rapid confirmation saves once and retains the receipt. Exact IDs, upgrades, displaced items and other owners are preserved; reload retains the saved loadouts. Forge upgrade regression confirms the worn copy improves once without changing its wearer.
- Independent synthetic saves only. Local QA substitutes a workshop image for unrelated legacy assets absent from this sparse checkout; production art and equipment assets are unchanged. Hosted gameplay behind deployment protection was not exercised. PR #21 remains draft/unmerged.

Screenshots and structured results are in docs/validation/creature-equipment-ledger-* and equipment-transfer-*. The Owned equipment gallery and Outfitter outer shells retain their current visual layouts; those are the next consistency pass, separate from this creature-tab implementation and shared transfer flow.
