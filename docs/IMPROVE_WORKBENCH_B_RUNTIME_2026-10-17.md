# Improve Equipment — approved B workbench integrated

The selected B workbench and approved stat/action icon sheet are the visual reference. This updates the existing EquipmentUpgrades component used by Iona, the Outfitter and team preparation; it does not introduce a second equipment system.

## Presentation

- Slate panels with restrained gold borders/corners and locally bundled Tinos typography match the approved Forge.
- Canonical workshop, Iona and equipment art remain authoritative. Iona's upper-body portrait keeps her complete head visible. Concept-generated replacement equipment is not used.
- Compact nameless equipment tiles use actual per-copy rarity frames, power/enhancement above the artwork, sculpted set markers bottom left and approved category silhouettes bottom right. Common gray, Uncommon green, Rare blue, Heroic purple, Legendary gold.
- Exactly All plus Weapon, Armor, Head, Hands, Feet and Accessory filters. Desktop pages show up to twelve copies; phones six; short landscape four. No main-screen scrolling.
- Full hover/focus details and clickable selected artwork retain names, stats, rarity, power, set and ownership information. The selected artwork opens the existing paginated Equipment Guide on keyboard/touch too.
- Current/next main stat, saved substats, exact Gold cost and resulting balance sit inline. Paid milestone outcomes remain unknown until confirmation. No milestones rail, Budget or Details button.
- One Equip action opens creature selection and the existing equip confirmation. Worn pieces show Remove and retain explicit removal confirmation. Changing or replacing equipment preserves the exact copies.

## Approved icons

`EquipmentStatIcon` uses a single genuinely transparent RGBA WebP atlas derived from the approved twelve-glyph reference: Max HP, Physical Power, Special Power, Defense, Special Defense, Speed, Accuracy, Effectiveness, Effect Resistance, Max Battle Energy, In inventory and Equip. Main/substats share each glyph. Inventory uses the approved satchel; Equip uses the breastplate with inward arrow. The same glyphs also appear in full stats, the guide, upgrade review and receipt. Evasion is a creature/combat stat and has no equipment roll or glyph.

The built-in image generator produced a 1536×1024 transparent 4×3 atlas from the approved reference. Text, panel backgrounds, labels and duplicate miniature previews were omitted; row-major icon order follows the list above. The production WebP preserves alpha. The generated PNG master remains unchanged; encoding introduced no layout or silhouette changes. Existing six category icons, set badges and Craft/Gold/Improve action art are reused.

## Transactions and validation

Existing getEnhancementQuote/enhanceEquipment, assignment/removal reducers, per-copy identity, expected-level validation, confirmation click locks and saveCurrentGame remain in control. Browsing/filtering/detail inspection/canceling do not write saves. There is no change to stats, costs, pools, randomness, gear ownership or combat rules.

Production Next build/TypeScript and all 351 regression tests pass. Scoped React review/lint has zero errors (existing image optimization advisories remain).

Actual production-browser validation uses a synthetic established save with 25 owned copies and canonical local artwork. Seven viewports: 1440×900, 1920×960, 2560×1440, 1920×720, 390×844, 360×740, 844×390. Validates visible controls and decoded assets; no content overflow, with the intentional Iona torso portrait crop excluded from text-overflow checks. All guide pages and upgrade reviews fit at each size.

Gameplay validation: unchanged save after browsing, detail pages and canceled upgrade reviews; three double-clicked confirmations produce exactly +1/+2/+3 for 12/24/36 Gold; other copies stay unchanged; exactly one paid +3 milestone roll; creature chooser, equip/remove, exact-copy retention and reload persistence. Reload legitimately refreshes validation timestamps; costs and saved gear are compared directly. Existing unrelated sparse-checkout artwork uses QA-only fallbacks; Forge assets do not.

Publishing stays on feature/ui-ranch-ledger-2026-09-29, PR #21 draft/unmerged. Protected hosted gameplay verification is separate from local production checks and deployment status. No hosting/protection settings change.
