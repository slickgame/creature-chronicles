# Creature dossier quick details — 2026-10-13

## Implemented
- Reusable DetailButton preserves native button semantics and existing click actions.
- Inventory cards preview exact effects, rarity and shared stock on mouse hover or keyboard focus.
- Equipped slots and equipment picker entries preview actual instance enhancement, main stat, substats and passive. Empty slots explain their action.
- Battle stats button explains what the totals include.
- Tooltips can be hovered and dismissed with Escape; they close on blur, click, scroll or resize. Inside a modal they render within that modal's top layer. Position is clamped horizontally and flips above lower anchors.
- Touch continues to open the existing full detail popup. Confirmations retain exact effects and comparisons; transactions and save data are unchanged.
- No new bitmap assets needed: parchment/brass styling uses CSS and existing equipment art. No image-generation prompts were used in this update.

## Recommended next connections (not implemented in this commit)
Use a shared, save-scoped navigation context with creature ID, originating tab, equipment instance ID/slot and destination intent. Validate IDs against current save on arrival and provide “Return to [creature]”. Do not consume items, select a battle team or purchase anything as a side effect of navigation.

1. Equipment detail → Iona's existing workshop / Improve equipment, selecting that exact instance. Show price and next milestone before review; preserve gauntlet/training restrictions.
2. Empty slot → Outfitter filtered by slot with comparison for the selected creature. Keep ready-made prices Gold-only. Offer craft alternative with exact recipe materials and labor.
3. Care item → actual seller and item, followed by return to the same creature. Supply Depot resources and care consumables must route to their actual catalogs rather than assume one vendor stocks everything.
4. Equipment → Coliseum preparation with readiness summary (energy, injuries, empty slots, training and active-run locks). Suggest the creature without overwriting an existing team or starting a fight.
5. Recipe missing ingredient → Trade/Storage showing owned, reserved and missing amounts, with a return to the recipe.

## Further UI priorities
- Remember roster/art collapse preferences and selected tab per save.
- Compact readiness badges with explanatory tooltips, retaining visible lock reasons for blocked actions.
- Optional compare mode showing only changed stats and a toggle for all stats.
- Search and slot/grade filters in larger equipment collections; keep pagination for stable menu height.
- Avoid putting actionable controls inside role=tooltip; actions belong in the detail popup.

## Validation
- Next.js optimized production build passes.
- Changed-file ESLint: zero errors; one existing img optimization warning.
- Browser: item hover, keyboard focus, Escape dismissal, equipment stat preview inside native modal, modal remains open after tooltip Escape, and mobile detail popup pass. No browser runtime errors.
- Main Inventory/Equipment panels require no scrolling at 1440×900, 1280×720, 390×844 and 844×390.
- Desktop tooltip and phone detail screenshots visually reviewed. Missing legacy art in sparse checkout uses existing fallback; no art changed.
- No engine changes; existing item/equipment transaction and confirmation functions retained.
