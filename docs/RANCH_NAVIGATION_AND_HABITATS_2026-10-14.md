# Ranch navigation, equine start and purchased habitats — 2026-10-14

## Result

The ranch has three zones: Homestead, Habitats and Expansion. Homestead contains only Ranch House, Breeding Pen and Egg Nursery. The Services zone, separate Ranch Office and Town Road building shortcuts are removed. Town remains reachable from the persistent dock and Travel menu.

Ranch House contains four pages: Management, Care, Records and Rest. Farm work/production, upgrades/repairs and storage live under Management; records and sleeping have their own pages. Room and creature artwork can be minimized. Native focused sheets page location details, creature management, construction reviews, security, construction history, ranch condition, upgrade tiers, capacities and effects. The journal offers a record selector and individual story pages. Developer story-art tracking is no longer a player-facing Ranch Records action.

New games start with one equine creature (Marlow, protected initially) and the equine habitat. Habitat capacity retains the existing base of four spaces. The old five-family factory remains available for legacy migration and explicit established-ranch regression fixtures; it is not the new-game factory. `ranchStartVersion: 2` prevents load migration from reintroducing the old starter crew. Existing ranches retain their creatures, owned habitats and progression.

## Petra's family blueprints

| Habitat | Gold | Wood | Build time | Base spaces |
|---|---:|---:|---|---:|
| Feline | 300 | 6 | 1 ranch day | 4 |
| Canine | 300 | 6 | 1 ranch day | 4 |
| Bovine | 400 | 8 | 1 ranch day | 4 |
| Lapine | 250 | 4 | 1 ranch day | 4 |

Fees and unreserved ingredients are charged once at commissioning. Housing unlocks on completion; existing annex bonuses still apply. Locked family sites and adoption offers link directly to Petra's corresponding blueprint. Existing owned habitats cannot be purchased again. Commissioned and completed orders preserve the existing shared-crew restrictions. Inherited housing is not counted as player-completed construction for Petra's quests; actual completed habitat work orders do count.

Capacity upgrades, adoption and hatching cannot bypass locked housing. Available species/family/variant-specific Guild requests are filtered by owned habitats, including refreshed and rerolled boards. Accepted/completed requests retain their records and rewards. New-ranch market arrivals always include a horse; the one-creature pairing lesson directs players to adoption before attempting a two-creature pairing. The three-creature battle lesson explains how to grow a team.

## Return navigation

A bounded in-memory screen history restores the previous screen and habitat family. Ranch zone, house page and house/map view remain in NavigationContext while another screen is open. Habitat Back returns to the Habitat zone when entered there, or the creature roster when entered from the roster. Farm management and the house ledger return to the house. New games and loaded save files clear cross-save screen history; the ranch view resets for a different save ID. No navigation state is written into gameplay saves.

## Artwork and provenance

Nine new production backgrounds are in `public/images/ui/ranch-v3/`: homestead, habitat district, expansion fields, house interior and five family courtyards. They match the supplied map references' warm golden light, red clay roofs, timber/plaster buildings and sharp anime-painterly textures. Approved creature/NPC art and breeding scenes are preserved. Runtime controls are real HTML, not painted into the images.

Exact prompts and referenced attachment filenames are recorded in `RANCH_ART_PROMPTS_2026-10-14.json`; dimensions, byte sizes and SHA-256 hashes are in `RANCH_ART_MANIFEST_2026-10-14.json`. Optimization used Pillow thumbnail resizing to a maximum 1664×936 and WebP quality 86/method 6, with no artistic post-edits.

Drive copies were uploaded and verified in the existing Creature Chronicles project folder:

- [Production WebPs and all prompts](https://drive.google.com/file/d/1gZZXf6dq7fK6iQbkYqk6LS5DLLMMkmWK/view?usp=drivesdk)
- [PNG masters 1/5](https://drive.google.com/file/d/1vJchzDg-gGs7mHi5_rj7OlvdusWChwbq/view?usp=drivesdk)
- [PNG masters 2/5](https://drive.google.com/file/d/1WEGkvqbm4VetHqUmcGeyoeZ6Gu_TL5bi/view?usp=drivesdk)
- [PNG masters 3/5](https://drive.google.com/file/d/1ghohUHGbPrztn9fdx0_pAPvj-oTbu0HG/view?usp=drivesdk)
- [PNG masters 4/5](https://drive.google.com/file/d/1jPt6qsF104vIlbrYuiP0VMtK3P2tj0rM/view?usp=drivesdk)
- [PNG masters 5/5](https://drive.google.com/file/d/1gGHMNq8N7U5LGrcadjf9WQL1iOuuQUHh/view?usp=drivesdk)

[Reviewed screenshots and browser QA logs](https://drive.google.com/file/d/16dVvbJm8G1Cit-ASOEBvPVLGBOBnoRmF/view?usp=drivesdk)

## Validation

- All 312 tests pass using the complete `tests/*.test.ts` suite, including seven new progression tests. Multi-family combat, inheritance and legacy-art tests now use an explicit established-ranch fixture; the new-start tests use the production save factory and real save/load normalization.
- Optimized Next.js production build and TypeScript pass. Changed-file ESLint: zero errors, 25 warnings (existing image/effect patterns). Diff whitespace check passes.
- Production Chromium at 1440×900, 390×844 and 844×390: no scrolling/overflow in the checked house pages, every journal record, habitat care, every profile tab, management pages, house ledger overview/habitat upgrades and Petra's two-page habitat review. Room/art minimization works.
- All nine new background images decode. Homestead has exactly three building controls; a new ranch has one owned and four locked family sites. Visual screenshots reviewed.
- House → farm production → resources → Back restores the house. House ledger Back restores the house. Habitat Back restores the original ranch zone; roster → Habitat → Back restores the roster.
- Locked Feline site opens its exact Petra blueprint. Review/cancel does not spend Gold or Wood. Confirmation deducts exactly 300 Gold and 6 Wood from the immediate pre-purchase balance; the work order and balances survive reload. Previously granted starter-goal rewards (70 Gold, 5 Wood and rations in the synthetic QA fixture) are preserved and cannot repeat on reload. Receipts separately list any newly granted goal rewards.
- Unit checks cover all four unlocks, reserves, pending/completed/duplicate work orders, load persistence, grandfathered housing, 20 weeks of eligible request generation/rerolls, species/variant/family matching, adoption/capacity bypass prevention, ready-egg housing gates, one hatch, and the single-creature tutorial route.

The sparse local checkout lacks some legacy art. Neutral placeholders were used only in browser QA for missing legacy images; every new background and available approved creature image is real. No placeholder files or QA saves are committed. The build uses `next build` directly; the full legacy asset-preparation pipeline is not claimed to have run.

## Next

Audit the first-week route for the single-equine start: adoption versus a first new habitat, Wood/Gold reserves, food and three-creature battle readiness. The earlier five-worker economy simulations remain established-ranch scenarios. Add distinct planned/construction/completed site visuals and clearer owned-site navigation as the next aesthetic pass.

Publish only to `feature/ui-ranch-ledger-2026-09-29`; PR #21 remains draft and unmerged. Vercel's previously denied team access and protected preview remain limitations. A successful Git push is not evidence that the hosted game was verified.
