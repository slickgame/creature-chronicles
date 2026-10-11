# Guild Hall — approved bulletin board

Implemented the approved bulletin-board concept after the user approved it and requested all necessary artwork.

## Player experience

- Physical wood board, pinned illustrated parchment requests, green selected seal, and large selected notice. Three requests per page on desktop/tablet/landscape; one on phone portrait. Compact layouts open request details in a native dialog.
- Dedicated Town/Menu controls and compact Gold, GP and Guild Rank bar. No main-page scrolling. Only native popups scroll.
- All existing filters, weekly requests, acceptance, completion and tutorial target preserved. Mara’s Desk contains all seven upgrades, grant, current bonuses and conditional dev controls.
- Creature review uses the existing uncropped full-body profile and six numeric stats with letter grades. Review calls the existing pure transaction function to calculate the actual Gold/GP delta, including first-completion and quality bonuses. Service and permanent placement require explicit confirmation.
- Fixes the old CSS merge/layering problem by replacing the obsolete hall overlays. Uses a new board marker to avoid legacy global CSS and owns its tutorial marker directly. Guild normalization is persisted only when values change, avoiding a render-driven save loop.
- Gameplay transaction functions, balance, identities, save schema and canonical creature art are unchanged.

## Artwork

Generated with the built-in image_gen tool. Reference: approved concept `exec-5d53611a-c7a2-4d84-b003-329b14d2d6fb.png`. Assets live in `public/images/ui/guild-v1/`; transparent sources retain alpha. Production conversions use WebP, with no painted-in labels so all text remains live and accessible.

### board.webp

Source: `exec-9945f952-33fb-4342-9e3b-435506fa995f.png`. Transparent: false.

Prompt:

> Use case: stylized-concept. Production game UI asset for Creature Chronicles. Reference image supplies the approved warm painterly fantasy bulletin-board aesthetic: honey oak, aged cream parchment, delicate gold brass, deep forest green, hand-painted textures. No lettering, no numbers, no UI text, no watermark. Landscape 3:2 image of ONLY the empty large physical bulletin board from reference, perfectly front-facing, filling entire image. Broad vertical medium brown wooden planks, thin carved dark oak frame on all four sides, brass corner fittings, tiny ivy and white blossoms confined to outermost edges, centered small brass paw medallion on top edge. Interior 90 percent empty wood, evenly lit, calm low contrast for overlays. No papers, no buttons, no furniture, no perspective tilt, no notices.

### notice.webp

Source: `exec-21a102de-35b1-4d7d-8cce-520674ddfdcc.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production game UI asset for Creature Chronicles. Reference image supplies the approved warm painterly fantasy bulletin-board aesthetic: honey oak, aged cream parchment, delicate gold brass, deep forest green, hand-painted textures. No lettering, no numbers, no UI text, no watermark. Single large blank upright parchment notice, portrait 4:5 aspect, torn gently curled edges, two round brass tacks near the upper corners and small bottom corner tacks. Pale cream softly textured paper with very clean light center, narrow distressed border. Fill canvas leaving small transparent outer margin. No seal, no picture, no text. All area outside paper genuinely transparent.

### ribbon.webp

Source: `exec-bdba1bde-bbf5-4513-bc9e-1b847e027375.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production game UI asset for Creature Chronicles. Reference image supplies the approved warm painterly fantasy bulletin-board aesthetic: honey oak, aged cream parchment, delicate gold brass, deep forest green, hand-painted textures. No lettering, no numbers, no UI text, no watermark. Single long horizontal forest-green fabric ribbon banner with folded fishtail ends and subtly gilded edges, like the creature-returns banner on reference. Ratio 3:1. Blank broad central area for live white text. No paw or symbols. Isolated on genuine transparency.

### quill.webp

Source: `exec-6865c25b-9e7c-4ebf-ae75-71fd4174e511.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production game UI asset for Creature Chronicles. Reference image supplies the approved warm painterly fantasy bulletin-board aesthetic: honey oak, aged cream parchment, delicate gold brass, deep forest green, hand-painted textures. No lettering, no numbers, no UI text, no watermark. Single large inventory icon: ivory feather quill in small brass inkwell resting on two curled parchment sheets, green wax seal beside them. Close-up chunky readable silhouette, warm detailed painterly treatment. Isolated on genuine transparency, no text, centered entire object visible.

### nursery.webp

Source: `exec-230efa9f-bd49-40f5-b44f-3cbba740001a.png`. Transparent: false.

Prompt:

> Use case: stylized-concept. Production game UI asset for Creature Chronicles. Reference image supplies the approved warm painterly fantasy bulletin-board aesthetic: honey oak, aged cream parchment, delicate gold brass, deep forest green, hand-painted textures. No lettering, no numbers, no UI text, no watermark. Landscape hand-painted vignette for a pinned guild service request: tranquil sunny timber nursery, one polished wooden cradle with cream blanket, flowering windowsill, warm light, modest books and pillows. NO humans, NO creatures, NO eggs. Gentle watercolor edges blending into pale cream paper. Same detailed warm painterly realism as reference nursery illustration. No surrounding frame or text.

### seal.webp

Source: `exec-e321b7ac-576e-4303-8b30-3714dea0f459.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production game UI asset for Creature Chronicles. Reference image supplies the approved warm painterly fantasy bulletin-board aesthetic: honey oak, aged cream parchment, delicate gold brass, deep forest green, hand-painted textures. No lettering, no numbers, no UI text, no watermark. Single selected-request status icon: rich emerald green wax seal embossed with a gold-edged paw print, two short green ribbon tails below. Polished hand-painted dimensional wax with uneven round edge, warm highlights. Whole silhouette centered and unclipped on genuine transparent background. No text.

### gold.webp

Source: `exec-f46950b6-cdaf-4944-bf34-99512bbc544a.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production UI icon for Creature Chronicles approved fantasy bulletin-board interface. Single large centered emblem, fills almost all square canvas with a small transparent margin. Warm rich hand-painted fantasy realism, brass gold highlights, softly painted edges, readable strong silhouette at 28px. No text, no letters, no numbers, no other objects. Genuine transparent background. A thick circular bright golden coin, face-on, embossed with a simple small rising sun crest. Gold rim and warm amber shaded edge. Entire coin visible.

### gp.webp

Source: `exec-8b8ab92b-b2b2-4347-8b5c-6f9b39bd2717.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production UI icon for Creature Chronicles approved fantasy bulletin-board interface. Single large centered emblem, fills almost all square canvas with a small transparent margin. Warm rich hand-painted fantasy realism, brass gold highlights, softly painted edges, readable strong silhouette at 28px. No text, no letters, no numbers, no other objects. Genuine transparent background. A circular warm bronze guild token with a raised golden paw print in its center. Face-on, deep brown recessed field, thick gold-brass rim. Distinctively a paw guild emblem. Entire medallion visible.

## Validation

Production Next.js build and TypeScript pass. Targeted ESLint: zero errors (existing-style image/effect warnings). Full regression suite: 139/141 pass; the two failures predate this Guild change and inspect `TownScreenC4.tsx` for Rose Lantern markup that moved to `TownScreen.tsx` in the previous Town implementation. They are `town opens the functional Rose Lantern adult social-house foundation` and `main menu, dev tools, and town expose the vacation test features`. No unrelated test changes.

Production Chromium checks cover 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390. Every request page fits without main scrolling, off-viewport controls, blocked buttons or broken images. Board details, Mara’s Desk, compact request details, creature selection/review and Menu open correctly; dialogs have no horizontal overflow, Escape closes them and focus returns. Full-body art uses contain and all six stats show letter grades. Transaction checks pass for acceptance, service energy/XP/affection and exact reward changes, completion lockout, canceled and confirmed permanent placement, the one-time grant, canceled/confirmed upgrades, filters, empty states and Town navigation. No browser page errors. Final build and targeted lint pass.

The old screen mislabeled the grant as 15 GP and checked a different claim flag. The new screen derives its amount and availability from `grantGuildIntroBonus`, correctly showing the current 20 GP and preventing repeat claims. Reward reviews also include applicable automatic starter-goal rewards and name them separately.

Canonical creature assets were restored from HEAD for testing; no substitute character artwork is committed. Local sparse-checkout asset preparation is not run; production build uses `npx next build`. PR remains draft and unmerged.
