# Resource and meal artwork v4 — 2026-10-13

Eight new transparent inventory illustrations replace the remaining generic resource/meal fallbacks through `src/data/resourceArt.ts`. All 17 farm resources now have distinct mapped artwork. Storage, Trade, Kitchen, Workbench and ingredient-source popups share the mapping. Ore remains rough mineral rock; the existing refined ingot icon is unchanged. Gameplay, prices, yields and recipes are unchanged.

## Production and provenance

Generated individually with the built-in image-generation tool. Original transparent PNG masters are archived with the review package in Google Drive. Production files are optimized 384×384 alpha WebPs under `public/images/ui/resources-v4/`, quality 88. No background removal or content repainting was done during optimization.

## Exact prompts

### wheat.webp

Use case: stylized-concept. Asset type: transparent fantasy farm RPG inventory icon for Creature Chronicles. Subject: A compact bundle of ripe golden wheat stalks tied with plain twine, clearly visible grain heads, no container. Style: sharp anime-painterly illustration, crisp silhouettes, detailed natural textures, warm golden highlights from upper left, soft cool shadows, polished hand-painted game item art. Centered isolated object, three-quarter view, fills about 80% of a square canvas with generous clean padding. Actual transparent background. No text, labels, borders, badges, scenery, characters, or cast shadow outside the object.

### iron_ore.webp

Use case: stylized-concept. Asset type: transparent fantasy farm RPG inventory icon for Creature Chronicles. Subject: Three irregular rough iron ore rocks, dark iron-gray crystalline seams and rusty reddish-brown mineral patches. Raw unrefined mineral rocks, absolutely no bars or ingots. Style: sharp anime-painterly illustration, crisp silhouettes, detailed natural textures, warm golden highlights from upper left, soft cool shadows, polished hand-painted game item art. Centered isolated object, three-quarter view, fills about 80% of a square canvas with generous clean padding. Actual transparent background. No text, labels, borders, badges, scenery, characters, or cast shadow outside the object.

### charcoal.webp

Use case: stylized-concept. Asset type: transparent fantasy farm RPG inventory icon for Creature Chronicles. Subject: A small compact pile of black wood charcoal chunks, porous cracked surfaces and hints of preserved wood grain, unlit, no fire. Style: sharp anime-painterly illustration, crisp silhouettes, detailed natural textures, warm golden highlights from upper left, soft cool shadows, polished hand-painted game item art. Centered isolated object, three-quarter view, fills about 80% of a square canvas with generous clean padding. Actual transparent background. No text, labels, borders, badges, scenery, characters, or cast shadow outside the object.

### nails.webp

Use case: stylized-concept. Asset type: transparent fantasy farm RPG inventory icon for Creature Chronicles. Subject: A small tidy pile of six handmade iron nails with broad flat heads and clearly pointed shafts. No other tools. Style: sharp anime-painterly illustration, crisp silhouettes, detailed natural textures, warm golden highlights from upper left, soft cool shadows, polished hand-painted game item art. Centered isolated object, three-quarter view, fills about 80% of a square canvas with generous clean padding. Actual transparent background. No text, labels, borders, badges, scenery, characters, or cast shadow outside the object.

### porridge.webp

Use case: stylized-concept. Asset type: transparent fantasy farm RPG inventory icon for Creature Chronicles. Subject: A rustic ceramic bowl of creamy cooked wheat porridge with small green vegetable pieces, vegetarian, no meat, simple hearty breakfast texture. Style: sharp anime-painterly illustration, crisp silhouettes, detailed natural textures, warm golden highlights from upper left, soft cool shadows, polished hand-painted game item art. Centered isolated object, three-quarter view, fills about 80% of a square canvas with generous clean padding. Actual transparent background. No text, labels, borders, badges, scenery, characters, or cast shadow outside the object.

### breakfast.webp

Use case: stylized-concept. Asset type: transparent fantasy farm RPG inventory icon for Creature Chronicles. Subject: A rustic round plate of cooked wheat flatbread and two cooked eggs beside a small cup of milk, arranged together as one compact hearty breakfast icon. Style: sharp anime-painterly illustration, crisp silhouettes, detailed natural textures, warm golden highlights from upper left, soft cool shadows, polished hand-painted game item art. Centered isolated object, three-quarter view, fills about 80% of a square canvas with generous clean padding. Actual transparent background. No text, labels, borders, badges, scenery, characters, or cast shadow outside the object.

### breeders_bowl.webp

Use case: stylized-concept. Asset type: transparent fantasy farm RPG inventory icon for Creature Chronicles. Subject: A rustic ceramic bowl of chopped vegetables and halved boiled eggs in a creamy milk dressing, distinct fresh colorful nourishing food, no meat. Style: sharp anime-painterly illustration, crisp silhouettes, detailed natural textures, warm golden highlights from upper left, soft cool shadows, polished hand-painted game item art. Centered isolated object, three-quarter view, fills about 80% of a square canvas with generous clean padding. Actual transparent background. No text, labels, borders, badges, scenery, characters, or cast shadow outside the object.

### stew.webp

Use case: stylized-concept. Asset type: transparent fantasy farm RPG inventory icon for Creature Chronicles. Subject: A dark rustic wooden bowl of rich brown meat stew, recognizable meat chunks and vegetables, a compact hearty dish, no bread or additional props. Style: sharp anime-painterly illustration, crisp silhouettes, detailed natural textures, warm golden highlights from upper left, soft cool shadows, polished hand-painted game item art. Centered isolated object, three-quarter view, fills about 80% of a square canvas with generous clean padding. Actual transparent background. No text, labels, borders, badges, scenery, characters, or cast shadow outside the object.

## Validation

All eight outputs were visually reviewed. Alpha channels contain transparent and opaque pixels. Scoped lint and direct optimized Next.js build pass. Browser checks verify all eight new icons decoding in Storage and applicable Trade/recipe pages at desktop and phone sizes, with no horizontal overflow. No gameplay regression suite was rerun for this art-only mapping change.

## Next

Paginate Feeding, Security and planning panels, preserving exact food budgets, Guard Dog rules, repair costs and reserve protection.

