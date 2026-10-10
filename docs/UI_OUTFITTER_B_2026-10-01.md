# Battle Outfitter — approved B, five slots and numeric comparisons

User approved the Outfitting Bench concept and five categories, then clarified that equipment changes numbers/effects, never innate grades. Approved reference: `exec-14e0f476-7be8-442f-87a3-ee3fe1b83c0a.png`.

## Behavior

- Full-body creature preview, five equipment categories, paginated stock shelf, separate purchase/equip confirmations, and native detail/profile/stock/Move Training popups. Main screen has no scrolling.
- Five slots: Weapon, Armor, Head, Hands / Feet, Accessory. Existing wraps, focus devices, badges, harness and charms retain their established numerical bonuses. Head currently has no stocked items; its empty state says so. No invented item balance or anatomy restrictions.
- Current → After numeric battle comparison uses the exact baseline and bonus application used by battle creation. Replacements subtract the previous piece, then add the selected one. Main panel shows three changed numbers; Full Comparison shows every number plus gained/removed bonuses. Base numbers and innate letter grades are read-only, shown separately. Equipment does not increase/decrease grades; Focus Manual study also leaves grades alone.
- Existing equipment effects are additive numeric battle modifiers. Do not copy the illustrative concept's physical-damage reduction/evasion effects into game balance. Existing consumable and team-prep effects retain exact active descriptions. Marks-exclusive gear cannot be bought for Gold.
- Legacy offense/defense/utility loadouts migrate to five slots on visiting the Outfitter or a successful equipment transaction. Where old pieces compete for one new slot, the displaced copy returns to stock. Migration is idempotent; no owned copy is deleted. Combat reads the new equipment map. Compatibility projections remain for older readers.
- Item mapping: Sparring Wraps → Hands / Feet; Arena Blade Wraps and Focus Prism → Weapon; Bastion Badge and Champion Harness → Armor; Guard Charm and Tactician Emblem → Accessory. One item per slot. This intentionally changes which existing pieces can be worn together, as requested by the new category system.
- Retained existing Daria identity, creature artwork, purchase costs, Marks unlocks, manuals, consumables, team prep and move-training mechanics. Removed the floating Move Training button that covered the stock shelf; it now lives at Daria’s Desk and under manual details.

## Artwork

Generated through the built-in image tool with the approved B concept as style reference. Thirteen new production assets in `public/images/ui/outfitter-v1/`: one workshop background, eleven distinct inventory icons, and one Head category icon. WebP conversions preserve alpha; labels remain live HTML. Existing training wood signs and ranch parchment/wood textures are reused.

### background.webp

Source: `exec-10e255ca-c6af-4bb1-bc36-466fc8e0f46a.png`. Transparent: false.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. Wide landscape empty sunlit outfitter workshop, matching the center scenery of reference. Broad EMPTY wooden circular fitting dais in center foreground, open arched window to lush medieval town, leather armor stands and shelves at outer edges, overhead timber beams, ivy, tiny white blossoms. Clear spacious center for later full-body creature overlay. No panels or signs.

### sparring_wraps.webp

Source: `exec-d198a300-3661-4b2a-ade4-07b4b2728576.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated pair of tan linen hand wraps with dark leather wrist straps and small brass buckles. Closeup readable entire icon silhouette. Transparent background.

### guard_charm.webp

Source: `exec-531bafee-17a9-49ce-8f63-de0a157650d8.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated protective emerald gemstone pendant in a thick brass shield-shaped setting on short braided cord. Closeup entire silhouette. Transparent background.

### focus_manual.webp

Source: `exec-5d32818a-b497-48a1-b2c7-fd12573add9b.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated closed forest green leather training book, brass corner guards, quill symbol embossed without text, cream bookmark. Transparent background.

### team_tactics_kit.webp

Source: `exec-2688a0a2-2464-4e00-8f64-c7e24beb79f1.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated rolled leather map case beside a small wooden strategy board with three brass paw markers and a miniature flag. Transparent background.

### field_tonic.webp

Source: `exec-b4cb42bf-dc66-4316-9e1a-84b542a638fe.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated rounded ruby-red tonic bottle with brass neck and tan cork, small green leaf charm. Transparent background.

### revival_salve.webp

Source: `exec-5dd90c3e-502c-4afe-bd7b-7c89c7b6d8f0.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated squat ivory ceramic ointment jar, ornate brass lid, lavender salve visible and a small wooden applicator spoon. Transparent background.

### arena_blade_wraps.webp

Source: `exec-6e93d45c-95df-4192-bbcb-81283a4f9390.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated pair of dark brown leather forearm wraps with short curved steel blades along outside and bronze buckles, compact readable silhouette. Transparent background.

### focus_prism.webp

Source: `exec-f468d44b-2156-4230-abb9-d7c8a2d70b95.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated tall violet faceted crystal prism supported by triangular brass focus apparatus, slight restrained violet light. Transparent background.

### bastion_badge.webp

Source: `exec-f4a06822-c854-4ef0-8c7d-e53be88a20a6.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated heavy silver shield-shaped badge with oak leaf gold relief and dark green enamel center, thick reinforced edge. Transparent background.

### tactician_emblem.webp

Source: `exec-2729bf4e-9234-4600-907b-b677b580bc69.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated brass compass star military emblem with green enamel rays and a central ivory chess rook relief. Transparent background.

### champion_harness.webp

Source: `exec-951c80b5-87fb-4b7e-bfca-d5395decdfe6.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated complete fantasy protective torso harness, dark green padded leather and golden brass segmented breastplate with shoulder straps, empty clothing object. Match harness style of concept but keep silhouette distinct. Transparent background.

### head.webp

Source: `exec-5114328c-5f64-4138-9102-5dde2d71add5.png`. Transparent: true.

> Use case: stylized-concept. Production Creature Chronicles Battle Outfitter asset. Reference approved concept supplies warm painterly fantasy realism, honey oak, brass, cream parchment and forest green style. No letters, numbers, labels, watermarks, people, creatures or UI. One isolated simple rounded steel helmet with brass brow band, no crest or face. Compact category icon. Transparent background.

## Validation

- Production build and TypeScript passed.
- Four new tests cover idempotent/lossless migration, every equipment preview versus actual combat, negative replacement deltas and inventory returns, and unchanged base stats/innate grades through equip/remove/manual transactions.
- Final regression run: 143/145 pass, including the four new equipment tests. Two pre-existing Town source-string checks fail because they inspect the retired wrapper: `town opens the functional Rose Lantern adult social-house foundation` and `main menu, dev tools, and town expose the vacation test features`.
- Changed-module ESLint: zero errors, 15 image-element warnings.
- Production-browser checks at 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390: all four categories fit without main-screen scrolling, blocked buttons, offscreen content or broken visible artwork. Native comparison/profile/desk/move-training dialogs fit horizontally. Screenshots reviewed on desktop and phone.
- Browser actions passed: cancel purchase, exact 160 Gold/2 Materials purchase with daily rewards preclaimed in the fixture, equip to Hands / Feet, remove and return to stock, unchanged creature records/grades, empty Head category, Marks-only purchase blocking, page navigation and Town/Menu navigation. No page errors. The normal unclaimed fixture also exercised the existing +25 Gold daily purchase goal; the transaction report calls this out as a separate goal reward.
