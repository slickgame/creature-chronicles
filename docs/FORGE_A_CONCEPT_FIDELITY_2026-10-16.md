# Forge A — concept fidelity correction

## Equipment type follow-up

Equipment slot now appears beneath every recipe name, the desktop/phone selected item, result details, crafting confirmation and receipt. Comparison names the destination slot. Labels reuse the authoritative `EQUIPMENT_SLOT_LABELS` mapping (Weapon, Armor, Head, Hands, Feet, Accessory); no types are inferred from artwork. The receipt snapshots its displayed type with the actual crafted item. This is a small refinement within approved A.

Current slot-label screenshots: [desktop](https://drive.google.com/file/d/1tvzerdwneBzl4FZc1KU39B_eFQsSFQtj/view) · [phone](https://drive.google.com/file/d/1DA2l3ENg22NpzDNLWWWiIRvzHMt9uCj9/view). Both show the actual local production game using the existing synthetic QA save.

Further suggested information priorities, not additional implemented changes: main bonus on browsing cards, available versus equipped ownership counts, and a clearer selected-creature replacement summary. Existing detail/comparison/material views already expose much of this information. Avoid adding every detail to the compact cards.


The user compared the first live screenshot with the supplied A concept and identified mismatched fonts, textboxes and composition. The first implementation had oversized vertical cards, a plain main panel, compact sans-serif buttons, a green title plaque and a phone layout dominated by tall recipe cards. Functional/viewport validation had not established visual fidelity.

This correction keeps the selected A direction and rebuilds those visual details in the actual game:

- Consistent Times-style serif typography, larger book headings and readable serif action labels.
- Cream/gold textbox gradients, thin rounded borders, real painted botanical corners and a dark wood title plaque.
- Horizontal illustrated desktop recipe cards with stacked rarity/power/enhancement badges, a selected-item heading above the art, description and lighter material/labor rows.
- Named Iona plaque with direct Collapse and Talk actions; Improve gear joins Compare/Craft-or-buy/Review in the action row. Tools moves to a labelled accessible icon beside the pager.
- Phone Recipes/Materials views, compact two-card pages, inline selected-item artwork/stat/description, Materials/Details sections and paged ingredients. Every material remains reachable, including Iron/Nails recipes. Header/action order follows the supplied phone concept.
- A more compact crafting review with cream/gold framing and grouped material/labor costs; existing Cancel and Close controls handle dismissal.

No character/item art was redrawn. The original painted assets are reused at sensible sizes rather than losing their decoration through oversized cropping. Current rarity/power/cost data remain authoritative; illustrative incorrect badges/pagination in the supplied concept are not imported into gameplay. Engine rules, cost helpers, saved item instances, reserves, stale-quote checks and transaction locks remain unchanged.

AGENTS.md now records visual comparison against an approved concept as an acceptance criterion. This correction stays within selected Forge A and does not introduce another A/B choice.

## Validation

Optimized Next production build/TypeScript and scoped lint (zero errors, nine image-element advisories) pass. All six recipes and every output/impact page, source/tools/dialogue/routes and crafting reviews pass at1440×900,390×844,360×740,844×390 without overflow or off-screen controls. New phone Recipes/Materials views, inline Materials/Details sections and every ingredient page are verified, including Nails. Short landscape uses a horizontal selected-item summary with all badges visible. All12 actual gallery/review/paid-receipt screenshots are captured with canonical assets decoded and visually compared to the references.

Actual flows again verify complete-save equality while previewing/cancelling, exactly four new unequipped+0 crafted copies for40Gold and4Iron after rapid confirmations, preserved reserve quantities/equipped slots, exactly1Iron bought for40Gold, exact-copy equipment handoff and source/production returns. Paid data survive reload; only existing validation timestamps are excluded from whole-save reload equality. Fully reserved ingredients block crafting. Zero page errors. The prior350-test engine regression remains the baseline; visual/view-state changes are checked directly in the real UI rather than adding implementation-mirroring unit tests.

## Corrected actual game screenshots

- Desktop: https://drive.google.com/file/d/1-Ho8EykuNpq-QPI24ig_CUFJMsyMJ6qe/view
- Phone: https://drive.google.com/file/d/1cvrgEVRZeBpjr6kmkaIq5wqj4IdSjgi7/view
- Compact review: https://drive.google.com/file/d/1OslJTNid3ikS2eH4AYEDH2zyDAopy8qy/view
- Actual saved phone receipt: https://drive.google.com/file/d/1D-U_Yurq0dlfEIgmmsF6p_H0SK9JjMax/view

These are locally running production-game screenshots using an isolated synthetic established save, not concept renders. Old sparse legacy art has QA-only fallbacks; no production placeholders were added. Protected hosted gameplay remains a separate, unverified boundary.

## Saved source and QA

Complete139-file current source, production assets, original masters, exact prompts, user-provided before/concept references, passing QA and screenshots (20,882,145 bytes): https://drive.google.com/file/d/1O78RgKLuO4qe00K2YTghmauv4E4bKYzv/view

ZIP SHA256: `4365e4684a77ca3764236c3dacfbf6ca1aa759b65182c85fd058b43f4b125c53`. Metadata readback verifies the archive and four individual screenshots in the existing project folder. Keep PR21 DRAFT and UNMERGED.
