# Creature Inventory A production kit

Approved reference: `../creature-inventory-review/options.png`, top band A. Runtime: `src/features/creatures/CreatureInventoryTabs.tsx` and its scoped CSS module. Every supplied asset is consumed by the live component; this is not a screenshot baked into a menu.

## Artwork

`source/supply-atlas.png` is the untouched built-in imagegen transparent RGBA source. `source/prompt.txt` records the production prompt; `source/manifest.json` records the hash and export order. `scripts/build-creature-supply-assets.py` extracts each 512px cell by alpha bounds and centers it in a 480px true-alpha lossless WebP. No color key, background repaint or art substitution. Generated snack/meal/treat/balm art is scoped to this approved gallery; canonical creature artwork remains unchanged.

| Export | Purpose | Runtime size |
|---|---|---|
| `art/energy_snack.webp` | Golden leaf-pattern star biscuits | 94×84 tile, up to 210px inspector |
| `art/energy_meal.webp` | Hearty vegetable meal in gold/navy bowl | Same |
| `art/affection_treat.webp` | Pink flower-pattern heart biscuits | Same |
| `art/recovery_balm.webp` | Navy/gold open balm jar | Same |
| `art/stock.webp` | Shared ranch stock header and effect row | 31px header / 23px row |
| `art/chevron.webp` | Review use action | 14×16px |

Energy and Heart reuse the approved direct RGBA `creature-overview-a-v2/sculpted/{energy,heart}.webp`; injury recovery reuses `care-b/icons/recovering.webp`. These assets are not recolored with masks.

## Native surfaces and interaction states

`frames/panel.svg`, `window.svg`, `button.svg`, `button-active.svg`, `tile.svg`, `tile-selected.svg` are editable native SVG, reproducible with the same builder. Panel/window/button ornament extends the existing approved removal frames; tile ornament extends Filters C. Emerald primary controls retain gold corners. Nine-slice borders keep decoration a fixed size as windows resize. Hover brightens the active action; focus uses a 2px warm gold outline; disabled controls retain their label with reduced opacity. Selection has a brighter emerald rim and restrained glow. Content and labels are actual text and controls.

## Typography and layout

Explicit Tinos Regular **400** and Bold **700**, existing licensed WOFF files under `forge-slate-v2/fonts`. Body 16px/1.22, Supplies 29px, item title 24px, tile names 15px, stock 21px, primary action 17px. Phone uses 22px item headings and 14px effect copy. Exact per-breakpoint values live in the scoped CSS.

Midnight face `#031521`; ivory text `#fff0d5`; gold ornament from shared native frames; emerald selection and primary action. Desktop gallery/inspector ratio .78:1.4, 12px gap, bounded 420px content height. Tiles remain compact 2×2, with a separate pager. Content widths <=680px use explicit Items/Selected item sections. Small available heights use two items per page plus Item/Effect sections; Item details retains full rules. Short-screen shell controls compact only while Inventory is open. No overflow masking is used to make the content fit.

Full layout retains canonical creature profile, all eight section links and shell navigation. The concept's shortened navigation is illustrative. Values and blocker text are engine-derived, never copied from the concept's sample data.
