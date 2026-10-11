# Builder’s Yard and Guild entrances — 2026-10-11

New scenic entrances give Builder’s Yard a dedicated Petra interaction area and the Guild a choice between Mara and the existing mission board. The board retains its acceptance, payout, pagination, weekly refresh, and reroll logic. Mara’s existing quest chain, grants, and upgrade transactions remain available through her welcome area and the board desk. Back returns to the Guild entrance without rebuilding the board.

Petra receives a three-request chain: hold eight Materials (not consumed), complete any current project, then complete two current projects. Existing finished work counts; commissioning does not. Rewards are 50/100/150 Gold, 4/6/10 GP, 8/12/20 Trust, with five Materials on the final claim. Future habitat placeholders do not count. Each request must be accepted and can only pay once. New save flags store progress without resetting existing saves.

Both Petra and Mara offer one daily conversation for +2 Trust, with freely available advice. Petra reacts to the current work order and resource reserve. Mara explains requests, GP, and the weekly board. Mara uses the existing town Trust record; Petra has additive flags.

## Production artwork

Generated with the built-in image tool. Original generated PNGs retained; WebP assets preserve alpha. The approved porch scene served only as the rendering reference. Mara’s original full-body art supplied her identity/outfit reference. Existing assets were not overwritten.

- `public/images/ui/locations-v2/petra.webp` — new full-body Petra sprite.
- `public/images/ui/locations-v2/builder-yard.webp` — carpentry workshop environment.
- `public/images/ui/locations-v2/guild-hall.webp` — counter/board entrance environment.
- `public/images/ui/locations-v2/mara.webp` — sharper identity-preserving Mara sprite.

## Generation prompts

### petra

Use case: stylized-concept. Production game character sprite: Petra Hale, adult female master builder in her late thirties, full body head to boots, alone on genuinely transparent background. Supporting reference is ONLY the rendering style of the supplied farm scene, not its characters. Petra is a distinct sturdy athletic curvy woman with warm tan skin, dark brown hair tied into a practical short ponytail, amber brown eyes, confident friendly face. Simple rust-orange rolled sleeve work shirt, charcoal neck scarf, brown leather carpenter apron with three practical pockets, dark work trousers and sturdy brown lace-up boots. Hammer secured in belt loop, carpenter pencil tucked above ear. One hand rests naturally on hip, other holds one rolled blueprint with anatomically correct grip. Sharply rendered anime-painterly face, rich hair highlights, dimensional cloth and weathered leather, polished warm glossy lighting matching the reference. Tasteful fully clothed SFW. Entire silhouette with generous margin around boots and hair, no ground, no scenery, no text, no borders, no extra hands or props.

### yard

Use case: stylized-concept. Asset: wide 16:9 game background for Builder's Yard in a cozy fantasy creature ranch game. Match supporting reference's sharp anime-painterly rendering, warm polished light, dimensional timber and crisp foliage; no characters copied. A richly detailed open-sided carpentry workshop with heavy oak beams, stacked lumber, stone footings, tool pegs, a hand plane and wood curls on a rear bench, rolled plans, sunny grassy farm beyond. Center foreground open and uncluttered for a separate character sprite. Left rear has a worktable, right rear blueprint shelving and partially constructed small nursery annex model. Warm morning sunshine, golden edges, deep readable shadows, rich green climbing foliage. Eye level, inviting lived-in craftsmanship. No people, no text, no logos, no UI frames. Sharp across whole composition, no blur.

### guild

Use case: stylized-concept. Wide 16:9 production game environment: welcoming fantasy ranch-town Guild Hall interior, no people. Supporting farm reference is rendering style only: sharp anime-painterly, warm polished lighting, crisp timber grain, dimensional fabrics and richly detailed materials. A grand but cozy oak guild room, on left a quartermaster's counter with closed ledgers, brass inkpot, tidy scrolls and a green upholstered chair behind. On right a large handsome wooden mission noticeboard with layered blank cream parchment notices and small wax seals. Center is an open walkway with stone floor and afternoon sun from tall windows, timber beams, warm amber lanterns, forest green banners with simple geometric decoration, potted foliage. Clear visual separation between staffed counter area and mission board area, usable for a game entrance with two selectable UI cards. No characters, no readable text, no letters, no logos, no UI. Eye level, detailed polished concept art.

### mara

Use case: identity-preserve. Production character sprite for Mara Vell, adult Guild Quartermaster. Image 1 is the exact character identity and clothing reference: preserve Mara's mature face, brown swept-back half-up hair, cream shirt, deep forest-green and gold long coat/shoulder cape, brown leather waist belt and utility pouches, dark trousers, gloves, boots, and closed ledger held in her arms. Image 2 is rendering style only. Recreate image 1 as a polished full-body head-to-boots transparent sprite with stronger sharp anime-painterly facial detail, richer hair highlights, dimensional fabric, fine leather and gold edging, warm glossy lighting consistent with image 2. Preserve her recognizable clothing design and body proportions; no extra ornamentation or outfit pieces. Friendly composed expression. Natural correct hands supporting the ledger, all fingers coherent. Front three-quarter stance, entire silhouette visible with margin at top and bottom. Actual transparent background with no vignette or ground or scene. No text, no labels, no watermark. Fully clothed SFW.

## Validation

Optimized production build and TypeScript pass. All 29 targeted tests pass: 5 location interactions, 12 builder projects, 7 weekly board/NPC quests, and 5 Guild commissions. Scoped ESLint: zero errors, 18 image/existing-effect warnings. Chromium checks at 1440×900, 1280×720, 390×844, 360×740, and 844×390 verify entrance/NPC layouts, loaded new artwork, visible controls, and no main-screen overflow. Transaction checks verify one daily conversation, exact Petra reward and no material consumption, duplicate blocking, construction cancellation, Mara’s existing quests/upgrades, persistent board contents when returning through the entrance, reroll access, and save/reload persistence. Screenshots visually reviewed. New artwork loaded from its actual production paths; omitted older assets used neutral placeholders during local QA.

Next: early-game income, supply/construction costs, breeding pace, and first-battle balance. PR remains draft and unmerged.

