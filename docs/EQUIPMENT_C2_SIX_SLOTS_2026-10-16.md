# Approved C2 equipment gallery and six slots

October 16, 2026 · Creature Chronicles · existing feature branch / draft PR #21.

## Access and behavior

Open Menu → Inventory → Browse items → Equipment. Creature profile → Equipment → any slot opens the same owned-gear gallery, already focused on that creature and slot. Clicking an owned item opens C2's comparison window. Info buttons open independent paged details without selecting/equipping. Search, grade/availability filters, Upgrade/Grade/Name sorting, and pages preserve room for larger inventories. The seven short slot tabs are All plus six actual slots.

Comparison has separate Item stats, Creature impact and Upgrade tabs. Item stats show the real current and selected instances, quality/grade, +level, main stat and up to four recorded substats. Full details include original descriptions and actual passives. Creature impact pages include all eleven total battle stats with signed deltas; replacement losses remain visible. Equip and removal require explicit confirmation; removal quotes use the actual removal result, not an equip comparison. Current-save restrictions and ownership are checked again on confirmation. Training and active-gauntlet locks remain, including removal.

Upgrade routes into the existing exact-cost UpgradeReview and UpgradeSuccess windows. The next main-stat value is guaranteed and visible; the milestone stat and increment remain a mystery until payment. Randomness only runs during a successful validated upgrade. Receipts retain before/after stats and the revealed milestone. An interaction lock prevents repeated clicks from granting twice. Existing battles retain their starting snapshot.

Sources retain the gallery underneath: Outfitter returns to the selected item, and Blacksmith opens its exact recipe when one exists (otherwise Iona's recipe book). Exclusive Coliseum items identify the Marks Exchange, not a Gold purchase; inventory entry offers a Visit Coliseum route using its existing return mechanism. Character-profile entry gives exact navigation instructions for that exchange. Shop stock remains complete and Gold-only; the inventory gallery always lists only owned instances, including equipped items.

## Six-slot migration

The slots are Weapon, Armor, Head, Hands, Feet and Accessory. Practice Wraps, Sparring Wraps and Duelist Bracers are Hands items. Runner Bands are Feet items. Old IDs, stock, levels, recorded rolls and item bonuses remain intact. Every old `handsFeet` slot migrates according to its item's identity even when its earlier V1 migration marker is already present. The old flag is cleared so repeated load/save does not duplicate anything. If a newer slot is occupied, the displaced old instance returns to stock with its existing ID and upgrade history. Migration is pure; normal save normalization persists it.

New Gold-only shop equipment fills the D/C/B choices in each separate slot:

| Item | Slot | Quality / Grade | Price | Base catalogue bonuses |
| --- | --- | --- | --- | --- |
| Trail Boots | Feet | Common / D | 45 Gold | +1 Speed |
| Field Gloves | Hands | Fine / C | 195 Gold | +3 Physical Power, +2 Accuracy |
| Sentinel Greaves | Feet | Superior / B | 460 Gold | +4 Speed, +3 Defense |

These are new items, with no free grants, material purchase charges or automatic equips. Existing gear is never duplicated to fill the sixth slot. The extra slot is a balance increase for players who buy/equip it; existing five-piece saves keep their prior bonuses. A fresh first-week six-piece economy balance pass remains a next task, not a claim of this UI update.

## Asset kit and provenance

Production kit: `public/images/ui/equipment-c2/`.

- Three new 512px transparent WebPs: Trail Boots, Field Gloves and Sentinel Greaves. Generated with the built-in image generation tool in the established anime-painterly ranch style; alpha and hashes checked. Glove art contains five finger sections per glove. Paw/hoof-compatible fitting is in item descriptions, not a species equip restriction.
- Thirteen editable SVG slot/control icons, five D–S card frames and six comparison/stat/status surfaces. These extend the existing SVG system. No text or stats are baked into the graphics.
- Reuses the approved apothecary workbench background, parchment panel, primary/secondary button frames and canonical creature/equipment images. No unnecessary replacement backgrounds or character artwork.
- `manifest.json` records the exact three generation prompts, source-master hashes, production hashes, dimensions and alpha. `asset-index.json` hashes the production graphic files. `preview.html` is the asset contact sheet; the actual game uses React and real save data.
- Original PNG masters, C2 concepts, scripts, synthetic fixtures and QA screenshots are archived in the existing Drive project folder. Epic Seven screenshots were layout/hierarchy references; its artwork was not imported into the game.

## System audit and proposed next workshop

Quality tiers already existed as Common/Fine/Superior/Masterwork/Relic with D–S power grades. Rare/Heroic on the concept were illustrative labels; no second rarity field or retroactive rarity reroll was added. Existing items start with their recorded catalogue substats, not an Epic Seven rarity-based allocation. Higher grades already change costs and allowed random increment ranges. +0–15, five milestone rolls, a four-substat cap, slot-based main stats, unique upgraded instances, and Champion's Resolve are already implemented.

Recommended next workshop, using https://epic7x.com/equipment-tutorial/ as a structural reference rather than importing its older balance numbers:

1. Define rarity separately from power tier only if both are needed. Rarity can control initial substat counts, while tier controls main-stat budgets and roll ranges; preserve all existing owned items.
2. Specify explicit main/substat pools for all six of our slots, including whether flat and percentage stats are both desirable. Current new weapons/armor/head follow main-stat rules; the milestone pool remains broad. Do not silently add Critical stats or convert the battle framework.
3. Add a small predictable set system with clear two-/four-piece requirements and an active progress display, balanced for our six slots. This requires a system decision and battle preview/actual-grant tests.
4. Add favorite/lock protection and saved loadouts before salvage/selling. Avoid opaque gear scores until role-specific comparisons and weighting are defined.

No set bonuses, new rarity-based stat rolls, salvage, equipment fees or changed main-stat budgets were introduced in this update.

## Validation

All 342 regression tests pass, including new cases for legacy Hands/Feet migration with real upgrade IDs/rolls, collision return without duplication, six-slot battle parity and independent removal. Existing comparison tests now cover eighteen shop pieces across six slots at D/C/B. Production Next build including TypeScript passes. Scoped lint has zero errors; existing image/pre-existing warnings are recorded. `git diff --check` passes.

Browser QA uses a production build and synthetic established saves; sparse-checkout legacy images alone receive neutral harness fallbacks. New C2 images and icons are real production files. Four viewport sizes (1440×900, 390×844, 844×390, 360×740) cover the gallery, all six categories and Item stats/Creature impact/Upgrade with no scroll or offscreen controls. Final frame rendering uses normal CSS backgrounds so SVG fills cannot occlude item illustrations. Images are explicitly decoded before reviewed screenshots. Final transaction checks cover no-spend selection/cancellation, exact equip/remove with Hands and Feet independent, one +2→+3 upgrade and one random recorded roll for 36 Gold under double confirmation, source/detail returns, info selection retention, grade filtering, reload persistence and no page errors. Protected hosted gameplay verification remains separate from local QA and Vercel build status.
