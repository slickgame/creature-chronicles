# Named resources, rewards and inventory artwork

Continues `feature/ui-ranch-ledger-2026-09-29` from `79005430bdcbac4e9457343b6f688b7413cc7a84`. PR #21 stays draft and unmerged. Recovered the unfinished local update without resetting it.

## Implemented

- Pella sells Ration Bundle (5 Balanced rations) and Timber Bundle (5 Wood), each 35 Gold before Trust discounts. Existing item IDs remain compatible. Named stock, previews, receipts and inventory labels agree.
- Rose Lantern favor grants 3 Balanced rations and 2 Wood with the existing Trust, token and weekly gates. Pella's pantry request checks 10 rations and 4 Wood without consuming them.
- Coliseum C2/C3/C4 supplemental material payouts now grant Iron ore to farm storage. Existing Gold, GP, Marks, items and once-only processing are preserved. New histories identify Iron ore; old records remain Materials (legacy).
- Predator victories grant Wood alongside the existing Gold/GP. Daily events grant rations, vegetables or Wood; fence repairs consume unreserved Wood. The neighbor repair immediately removes 2 damage. NPC work dialogue describes instant actions.
- All non-exclusive Outfitter purchases, including the equipment catalogue, cost their existing Gold price only. Marks exclusives stay restricted. A future blacksmith will use named ingredients plus an explicit Gold labor fee.
- Shared resource artwork now covers Storage, trade and recipe ingredients. Dialogs retain an opaque parchment fallback when their illustrated texture is unavailable.

## Artwork provenance

Five existing generated assets recovered from the unfinished workspace, created with the image-generation skill in the preceding October 12 session. They were not regenerated in this continuation. Each shipped image is 384×384 RGBA WebP with transparent pixels. Sharp anime-painterly inventory style matches the established resource set. Existing rations, vegetables, Wood and Planks art remains in resources-v2.

Paths: `public/images/ui/resources-v3/{milk,eggs,meat,stone,iron}.webp`. Mapping: `src/data/resourceArt.ts`. **iron.webp depicts refined ingots and maps to Iron, never Iron ore.** Ore rewards are distinct from refined Iron.

The original verbatim image-generation prompts were not recoverable from the handoff, local files or available conversation retrieval. The following are clearly labeled reconstructed reproduction prompts, not claims of exact historical tool input:

Shared reproduction prompt: “Create one isolated fantasy farming RPG inventory icon in the established sharp anime-painterly style. Subject: [subject]. Crisp silhouette, rich natural colors, carefully painted highlights, three-quarter view, centered with generous padding, readable at small UI size. Transparent background. No text, labels, frame or scenery.”

| Asset | Subject for reproduction | SHA-256 |
| --- | --- | --- |
| milk.webp | Glass milk bottle with a small ceramic cup | e75f08bb5009e5ad27ad06cf689f934fdcd259755e7828e3e7200e14cb82eecd |
| eggs.webp | Small group of cream and brown food eggs in a straw nest | 4a4fd93acd0e751237e9fc93ce5f369f6b6380df5c7c6a7286a8d3315c63aa59 |
| meat.webp | A fresh red steak with visible pale marbling | 0f526497e0545e0619da26c082aceda62d7a824714028c69743b463cc887ccc7 |
| stone.webp | A small pile of rough gray building stones | c281f652f64bc244b1ff6e37687bcc5e2bb41ee3581a6fe95ede95568be178a3 |
| iron.webp | Refined metallic iron ingots, not raw ore | 3e6a8e8acf612a292f5b43c99ed5c2d3ef6096b123de21d14a7c2c3c452530e1 |

Approved creature masters remain unchanged in Drive folder `1OyvaZDI5f962Hk5_MNUHU_ojt00lIFW0`, under project `1etR6PSfZYVnkidzgL3ORS68Dp_A0Syiu`. No breeding-scene or rare-variant artwork changed.

## Validation

- Recovered full run: 268/268 tests passed. Added one daily-event regression covering exact grants, duplicate prevention, reserve protection and immediate repair; follow-up named-resource + ranch-day suites: 12/12 passed.
- Final optimized Next.js build and TypeScript passed. Sparse checkout: invoked Next directly, without the full asset-preparation prebuild hook.
- Final changed TypeScript/TSX lint: zero errors, 43 existing-style image-element/unused-code warnings. Follow-up changed event/test lint: zero errors.
- Production Chromium at 1440×900 and 390×844: five real new icons decode, Storage/Kitchen art appears, no horizontal page overflow.
- Browser transactions: both bundles grant exactly 5 resources for displayed 35 Gold; cancel preserves save; reload preserves stock. Channeling Staff purchase costs 210 Gold, adds one copy and preserves all resource stocks. Cancel preserves save. Both shops block purchases with zero Gold. Phone details remain accessible. No browser page errors.
- Screenshot review led to the opaque dialog fallback. Missing legacy imagery uses neutral placeholders only in the temporary harness; those placeholders and QA saves are not shipped. New resource images are real.

## Release and next work

Publish only to the existing feature branch. Vercel team access previously returned 403 and preview protection remains enabled; a successful push alone is not deployment verification. Branch preview: https://creature-chronicles-git-feature-ui-r-56c7f9-slickgames-projects.vercel.app

Next: workshop the blacksmith location, small starter recipe list and labor prices, then implement deterministic crafting with exact grade/stats/materials/fee comparisons and reserve protection. Ready-made shop gear remains Gold-only. Balance first-week production, cooking, construction and rewards together afterward.
