# Approved A — live equipment comparison ledger

October 16, 2026 · Creature Chronicles · feature/ui-ranch-ledger-2026-09-29 · PR #21 stays draft and unmerged.

## User decision and access

The user selected corrected concept A (Compare Ledger). It is now integrated into the existing owned-equipment gallery: Menu → Inventory → Browse items → Equipment → select a creature and owned item. This supersedes the handoff's statement that A/B was undecided. Concept B remains an unused proposal. The isolated equipment-windows asset preview remains sample-only.

## Behavior

Desktop uses Current/Selected cards side by side with a separate Item stats / Creature impact / Upgrade column. Canonical item artwork, rarity, power, enhancement, real main stat and all recorded substats come from the selected instances. Full details retains descriptions, passives, legal pools and set information. Creature impact includes the same item and set math as combat, with all eleven stats reachable by pages (three per page in short landscape, four otherwise).

The set-change strip compares actual wearer summaries before and after hypothetical equip. Losses appear first, with explicit Bonus lost / Bonus gained or In progress labels, piece counts and active groups. Desktop shows up to two changed sets together; phones page one change at a time. Set details retains the full reference and each currently equipped member. No changes are implied when the same piece is selected.

Narrow layouts retain the two item columns. Overview/Substats pages and the existing three detail tabs keep every stat and action reachable without menu scrolling. Minimize/Expand art is reversible. Selection, recipient, gallery filters and source returns are retained. Existing equip/remove confirmations and current-save restrictions remain authoritative.

Upgrade review uses the real canonical item, guaranteed main-stat increase, recorded substats, exact Gold balance and mystery milestone notice. It never names a future random substat or amount. The actual saved receipt shows before/after main and substats, new/improved milestone result, rarity/power and paid Gold. Both the gallery and existing enhancement entry use the matching review/receipt windows. Costs, rarity, grades, RNG, set rules, save format and reducer transaction guards are unchanged.

## Asset provenance

Reuses the existing approved apothecary background, parchment and buttons; C2 rarity cards, canonical equipment artwork and four painted set crests; equipment-windows-v1 window/comparison/mystery/reward/cost surfaces, mystery seal, forge anvil and milestone halo. No new image generation or concept item/stat import. Original masters, generation prompts and hashes remain in the previously archived complete kit. UI text and values remain HTML, never baked into images.

## Validation and publication

All 350 regression tests pass. The final optimized Next production build includes successful TypeScript; scoped lint has zero errors (13 image/pre-existing warnings). Whitespace checks pass. React review confirms cleaned-up resize listeners, named controls, paged access to every stat, immutable receipt data and retained transaction guards.

Production browser QA passes at 1440×900, 390×844, 360×740 and 844×390: side-by-side cards, phone Overview/Substats, every impact page, Upgrade, expanded/minimized art, paged set changes and decoded real canonical artwork. Actual synthetic-save transactions cover cancellation without spending; one Field Gloves upgrade each to +1/+2/+3 for exactly 12/24/36 Gold under duplicate confirmation; no milestone roll before +3; exactly one saved +3 roll; actual before/after receipts at all four sizes; equip/remove without Gold charges; independent Hands/Feet; Outfitter/Blacksmith returns; and reload persistence. No browser page errors.

The final button-background correction was checked in a fresh optimized build, with milestone review and actual saved receipts at all four sizes and the same transaction/persistence checks. Reviewed screenshots and replay scripts are archived. The earlier full comparison checks remain valid; the final change affects only isolated review/receipt button painting.

Screenshots use a synthetic established save. Missing sparse-checkout legacy images receive neutral fallbacks only in the QA harness; canonical gear, painted set crests and new window graphics are real production assets. No production substitutes were introduced. Local browser success, GitHub push, Vercel build status and protected hosted gameplay remain separate. Hosted preview gameplay is still unverified; no protection settings were changed.

## Next

Complete the reserve-aware single-equine first-week audit before adjusting any prices, production or rewards. The earlier acquisition-only audit does not cover food, construction, income or battles. Preserve prior approved systems/art, instant Energy-only gathering and strongest-only resident Guard Dog.
