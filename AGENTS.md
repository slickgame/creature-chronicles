<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Creature Chronicles UI direction
Keep primary menus within the viewport; use pages and focused detail popups instead of long scrolling panels. Do not hide overflowing information to make a screen appear to fit. Create or reuse images, icons, frames, panels and backgrounds whenever they improve clarity or visual quality. Preserve approved creature artwork and the established anime-painterly/parchment visual direction. Small interface symbols should extend the existing SVG icon system; use image generation for new painterly illustrations when needed.

## Continuing visual reviews
For each new menu, window or popup redesign, show actual current-game screenshots and distinct concept-art options for the user to choose from before implementing the new visual direction. Keep concept proposals separate from live screenshots and actual transactions. After implementation, show actual game results on desktop and phone; retain the viewport/page/minimize rules above. Routine fixes within a selected design can proceed.

## Approved concept fidelity
Treat the selected concept as a visual acceptance reference. Compare actual screenshots against its typography, panel borders/ornament, card proportions, spacing, header and action hierarchy on desktop and phone before calling the UI complete. A matching palette and passing layout checks alone are insufficient; avoid stretching cards to fill unused space when the concept uses compact cards and an inline detail area.

## Current locked Forge target
The user locked Forge B3 (slate/gold, compact nameless item tiles, ivory silhouette category badges, Craft button) on October16,2026. Read docs/FORGE_B3_PRODUCTION_KIT_2026-10-16.md and public/images/ui/forge-slate-v2/README.md before the next Forge change. This supersedes the prior Forge A visual direction. The asset kit is separate from live runtime integration; do not claim the new style is in the game until actual BlacksmithWorkshop integration and screenshots pass.

## Approved Forge action icons and runtime
The user approved the sculpted ivory/gold action family (Craft hammer, Gold star coin, Compare scales, Improve sword/chevrons, Talk bubble and Ranch source building) and requested runtime integration. Production icons are RGBA WebP under `public/images/ui/forge-slate-v2/sculpted/`; do not revert them to the rejected flat SVG study. BlacksmithWorkshop/ForgeWindow now use the B3 kit. Keep the standalone asset assembly explicitly separate from actual game screenshots and tests. Consult `docs/FORGE_B3_RUNTIME_2026-10-16.md` for current validation and remaining hosted verification.

Forge spacing QA must include1920px and2560px widths. Keep the recipe cards in a compact group with bounded gaps; do not distribute fixed-width cards across the entire gallery with space-between.

Forge desktops above1100px center the approved composition within1440×900. Keep Iona’s entire head/source portrait vertically inside the host column; verify wide short1920×720 as well as1920×960 and2560×1440. Avoid unconditional width-based background enlargement.
