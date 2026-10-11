# Training Grounds — approved concept B

Implements the approved open courtyard concept B after the user requested all necessary icons, background and other assets.

## Player experience

- Dedicated Town and Menu buttons, compact Gold/Materials/training-capacity/ready counters, existing Rhea portrait, central full-body trainee, parchment plan, and illustrated program dock.
- No main-screen scrolling. Phone program choices page through the bottom bar and open details in a native popup. Creature selection paginates six entries; records, profiles and upgrades scroll only inside dialogs.
- Existing uncropped creature profiles and six numeric stats with letter grades. Rhea and creature identities remain unchanged.
- Clear costs, duration, current XP/chance, readiness and pickup action. Training and upgrades require a review before the existing transaction is committed. Creature availability, capacity, prerequisites and currency blockers remain enforced. All-S creatures cannot waste Gold on grade training.
- Level Drill costs 80 Gold/1 day and awards 35 XP, or 55 with the yard. Stat Coaching costs 180 Gold/3 days with 18% improvement chance, or 25% with the bench. Focused coaching costs 260 Gold/4 days, requires the license, and offers a stat target with its number and grade. Trainees stay unavailable until collected. Current facility effects apply at collection, matching the existing engine.
- Transaction functions, balance, save schema and routes are unchanged. Training metadata changes only icon paths. The screen saves successful provider results once and reports automatic starter-goal rewards.

## Artwork

Twelve assets generated with the built-in image_gen tool, using approved concept `exec-54d19acb-5f61-477e-9f46-f300bb672ec6.png` as the style reference. Production files live in `public/images/ui/training-v1/`. PNG sources converted to WebP with transparency retained; text remains live HTML.

### background.webp

Source: `exec-33bd8f09-1874-4ae4-a6d7-498332579187.png`. Transparent: false.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. Wide landscape empty training courtyard matching the central scenic area of reference. Sunny stone courtyard, foreground large clear circular practice paving with subtle paw inlay, timber coaching lodge left, training dummies and targets only along rear and sides, green-gold banners, distant medieval towers and mountains. Clear center foreground for character overlay. No people, no creatures, no UI, no frames, no signs, no panels.

### level-drill.webp

Source: `exec-78fe3f79-96d9-4529-8687-78ac41a5e135.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated large program icon: brass whistle with short leather loop beside sturdy wooden dumbbell with brass bands. Small green leaf accents. Close-up readable silhouette, entire object visible on transparent background.

### stat-coaching.webp

Source: `exec-03351bd4-57b2-47b4-9599-91d79bfdf82b.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated large program icon: three worn leather coaching books stacked, an open small notebook and brass-tipped quill beside them, green ribbon bookmark. Readable close-up silhouette on transparent background.

### focused-coaching.webp

Source: `exec-3f348fd8-7de1-41f4-84f2-41ea3fbf1bbf.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated program icon: circular wooden archery target with brass concentric rings and one emerald arrow exactly at center, small compass below. No lock, the icon must work unlocked too. Readable silhouette on transparent background.

### yard-upgrade.webp

Source: `exec-80bd1891-9df8-44d0-9154-c084fd414c7e.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated upgrade icon: miniature timber obstacle training lane with two low jumping hurdles, a padded practice dummy and green pennant. Distinct miniature building vignette, complete silhouette on transparent background.

### bench-upgrade.webp

Source: `exec-9f4011a4-2a3d-41dd-8987-20ef15d70fa3.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated upgrade icon: sturdy oak coaching workbench with measuring calipers, neatly arranged brass balance scales and closed notebook. Miniature furnishing, close-up full silhouette on transparent background.

### assistant-upgrade.webp

Source: `exec-a17e421f-811f-4f4a-a20e-0827983d7e0c.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated upgrade icon: pair of leather coaching gloves and brass whistle attached to a forest green shoulder satchel. Symbol of an assistant coach, no person or face. Close-up full silhouette on transparent background.

### license-upgrade.webp

Source: `exec-4001ade4-5720-44b4-bc83-50c00485bc59.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated upgrade icon: unrolled cream diploma parchment with ornate gold corner filigree, prominent emerald wax seal and two ribbons, simple embossed target symbol instead of writing. Close-up full silhouette on transparent background.

### sign.webp

Source: `exec-ab323ec7-597e-49aa-9dfd-afa969d76879.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One wide horizontal empty hanging sign, dark carved oak with brass edging and pointed ends, two short chains at upper corners. Long blank center for live title overlay. Exactly front facing, ratio 3:1, tiny outer transparent margin. No lettering or emblem.

### panel.webp

Source: `exec-a0679180-67a2-41d9-acb1-7d8dfeb140b0.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One tall portrait 3:5 UI parchment panel, pale cream blank clean center, slim carved oak side rails, brass top corners, hanging from two short hooks. Small ivy and white blossoms confined to bottom corners. Straight front facing. No text, no picture, no icons. Entire panel visible with minimal transparent margin.

### capacity.webp

Source: `exec-6a28cdc9-0046-4ab7-9e86-005a67f0a401.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated status icon: tiny open timber training pavilion with TWO empty green padded practice stools beneath a triangular green pennant. Clear readable compact silhouette, warm brass trim, transparent background. No numbers.

### ready.webp

Source: `exec-a7d6b51a-4d13-4461-8982-7cfc1d3370ce.png`. Transparent: true.

Prompt:

> Use case: stylized-concept. Production asset for Creature Chronicles Training Grounds, approved reference is STYLE and material reference. Warm painterly fantasy realism, cream parchment, carved honey oak, brass edging, forest green, restrained white flowers. No text, letters, numbers or watermark. One isolated status icon: brass stopwatch encircled by two laurel sprigs with a prominent forest-green checkmark at lower right. Clear readable compact silhouette on transparent background.

## Reused assets

- Existing Rhea: `/images/npcs/town/rhea_flint_portrait.png`.
- Canonical creature `profilePath` and `portraitPath` from variant definitions.
- Guild Gold, paw placeholder and ribbon; Atelier talk, ledger and hourglass; ranch parchment/wood; existing material crate and XP star. These retain their established semantic meaning.

## Validation

- `npx next build`: passed, including TypeScript and production rendering.
- ESLint on the three changed TypeScript files: zero errors; 13 existing-pattern `no-img-element` warnings.
- Production-browser layout checks at 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390: all three programs fit without main-page scrolling, blocked controls, offscreen content or broken visible images. Profile, upgrades, records and phone plan dialogs fit horizontally; Escape restores focus.
- Full-body `object-fit: contain`, six numeric stats and grades, and four distinct upgrade assets verified in-browser. Decorative panel spacing reviewed against screenshots and corrected.
- Browser transactions passed: cancel/start Level Drill, exact 80 Gold cost and one-day return flag, capacity blocking, collect +35 XP once, cancel/buy yard for 350 Gold + 8 Materials, upgraded 55 XP display, bench/license purchases, focused WIL assignment and four-day return, 25% result report, insufficient funds/materials blocking, and Town/Menu navigation. No page errors.
- No gameplay-engine changes. The prior full regression baseline was 139/141; its two known failures inspect retired TownScreen source strings and are unrelated to this screen. The full suite was not rerun for this artwork/layout change.
