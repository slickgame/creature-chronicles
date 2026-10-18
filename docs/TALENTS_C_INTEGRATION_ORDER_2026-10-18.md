# Approved Talents C: integration order

The user selected C (Compact register) on October 18, 2026. The approved reference is `public/images/ui/talents-c/approved-concept.webp`. Preserve the existing creature profile, canonical artwork, eight section tabs, navigation and footer actions.

## 1. Correct gameplay and quoted values — completed

Eager Learner and other unrestricted work-XP talent effects now apply to Crafting and Cooking. Recipe XP uses the existing grade-specific talent percentage and rounds each batch using the same work XP function as gathering. The quote, confirmation, receipt and saved skill progress use the same result. Repeated saved instances do not duplicate the bonus. Job-restricted talent effects do not become generic recipe bonuses.

At Grade C, Eager Learner changes one Planks batch from 11 to 12 Crafting XP and one Rations batch from 12 to 13 Cooking XP. Materials, output ratios, creature XP and Energy costs are unchanged. The recipe details show the extra XP from talents. The limitation shown in the original concept (recipes not receiving this bonus) must be removed from the implemented interface; applicability must include Crafting and Cooking.

## 2. Build the shared talent presentation data

The initial release has ten talents: nine current general-pool talents plus Guard Dog for canines. The catalog also retains 73 additional definitions for compatibility. These retained records are not added release scope and do not require dedicated artwork. Preserve their saved data and use the approved generic painted talent icon when encountered.

`docs/validation/talents-c-content-inventory.json` lists every ID, planned icon path, source, declared systems/triggers, stacking rule, restrictions, grade coverage and Grade C example. Regenerate with:

`node --no-warnings --loader ./scripts/ts-test-loader.mjs scripts/audit-talent-c-content.ts > docs/validation/talents-c-content-inventory.json`

The runtime interface should read each creature's actual owned grade from the central definitions and produce:

- Name and Grade.
- Effect, including exact units and caps.
- Applies to, using real work locations, recipes, battle or daily recovery as appropriate.
- Source: General, Species or Variant, separate from effect categories.
- When it works and any conditions.
- Stacking rule and any real limitation or deferred hook.

Review effect applicability against actual consumers before presenting it as active. The existing broad audit is not a substitute for runtime verification: for example, its live-system allowlist omits farm-security despite Guard Dog having a live farm-security consumer. Some inheritance effects are declared but their final genetics hooks remain deferred. Preserve honest status for such effects rather than inventing behavior.

## 3. Produce the icon kit

Make one distinct painted ivory/gold true-alpha icon for each of the ten launch talents, keyed by stable ID. These ten icons are complete. Names, numeric effects and grade letters stay outside the artwork so the same image can be used in the register and full details. Retained definitions use the generic painted talent symbol.

Use the approved C book/star and moon/stars as style anchors. Inspect legibility at 24/32/48px and in the larger detail view. Preserve generated alpha; avoid flat silhouettes, masks, recoloring and baked dark rectangles. Package source images, optimized RGBA WebP, exact prompts and an ID-to-file manifest with dimensions/hashes. Reuse approved shared All/Work/Battle/Care and detail-field symbols where they fit. Do not generate the remaining 73 icons for this release.

| First batch | Icon direction | Current applicability |
| --- | --- | --- |
| Eager Learner | Open ivory book, small gold star | All matching work-skill XP, including recipes |
| Sound Sleeper | Ivory moon and gold stars | Daily Energy recovery, capped at maximum |
| Diligent | Work glove with full resource basket | Gathering resource output |
| Efficient Worker | Small gear and Energy bolt | Gathering Energy cost, minimum 8 |
| Sure Strike | Sword crossing a small target | Physical Power in battle |
| Thick Hide | Layered hide and shield | Defense in battle |
| Light-Footed | Light paw with small wing | Speed in battle |
| Hot-Blooded | Warm flame inside a heart | Fertility during breeding |
| Lasting Vigor | Heart and sustained Energy spark | Pair Energy cost during breeding |
| Guard Dog | Canine head with shield | Resident farm Security; only strongest applies |

## 4. Implement C with the real data and assets

Desktop: compact Talent / Grade / Effect / Applies to register, selected row, selected summary with Source and When it works, View full details and applicable View Work Skills navigation. Keep the current number of owned talents; do not fill it with sample records or invent empty talent slots.

Phone: compact rows with name/grade/effect, selected summary below, focused/paged full details and visible return controls. Page rows by available height and retain selection/filter/page when returning. Do not force the desktop four-column register into phone width. Test one talent, multiple talents, long descriptions and older-save talents.

Use All / Work / Battle / Care filters based on actual effects. Source categories remain separate. Talents are automatic; no talent XP, training or upgrade mechanic is part of this concept. Breeding and Cleaning work-skill progression remain planned.

## 5. Compare actual gameplay with C and release

Check visual fidelity and fit on desktop, phone and short landscape. Confirm every launch talent resolves to its dedicated icon, retained talents resolve to the generic icon, and every grade reads actual effects. Verify read-only browsing, filters, full details, return state, real recipe/gathering XP and save/reload. Compare the actual game screenshots against the selected reference before calling the interface complete. Keep PR21 draft and unmerged.

## This increment

The initial increment locked C, fixed recipe XP, and saved the complete compatibility inventory. The ten-icon launch kit is now complete. Continue directly to the register integration. The former 83-icon proposal was a scope error, corrected after the user reaffirmed the streamlined initial release.

Verification: 19 focused tests pass, including every recipe at all six Eager Learner grades, duplicate-instance protection, batch rounding, other-talent exclusion, quoted/saved XP agreement and a talent-driven level-up. The existing production browser runner passes 34 checks, including visible extra talent XP, real Crafting/Cooking level-ups, cancellation and save/reload. Production build and focused ESLint pass (existing native-image/compatibility warnings only). The catalog has 83 unique IDs and icon assignments, each with all six defined grades. Evidence is under docs/validation/eager-learner-*.
