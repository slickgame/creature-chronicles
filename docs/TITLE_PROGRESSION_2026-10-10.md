# Progression-based title backgrounds — October 10, 2026

Three title backgrounds follow the active save, with shared logo/menu positions:

- Arrival: no active save or opening not completed.
- Porch welcome: `m24IntroSeen === true`.
- Tended farm: `chapterOneGuidedComplete === true` or `m24ChapterOneStoryComplete === true`.

Chapter completion takes precedence over the intro flag, including older saves. Skipping the tutorial does not unlock the completed scene. Selection is read-only and follows the active save when saves change; no save schema migration, reward, or gameplay mutation. Story completion keeps the final scene during tutorial replay.

The generated backgrounds contain no buttons or text. The title and all controls are real HTML, with responsive styling, a readable scenic overlay, and existing save/load/settings/import/export handlers and confirmations. Title typography and parchment buttons match the approved concept. Existing original logo and title assets remain in the repository.

## Assets and provenance

Built-in image generation used the approved October 10 title concept (`exec-7f24a591-e185-4747-b460-989cd5b85367.png`) as the reference. Generated PNG originals are retained; runtime images are full-resolution quality-94 WebP conversions without compositional edits.

- `public/images/title/progression/welcome.webp`: `exec-8dff93c3-b8a3-48ae-94f2-e44614873d90.png`. Prompt: remove all title lettering, leaf logo, buttons and UI; extend the landscape into the left side; preserve adult characters, proportions, faces, clothing, poses, farmhouse, composition and sharp glossy golden-hour anime-painterly rendering. Quiet left 40%; no text; wide 16:9.
- `public/images/title/progression/arrival.webp`: `exec-6b02e697-bb33-4f56-a0e9-4b4f390b98c9.png`. Prompt: same farmhouse architecture and style before arrival, no people or creatures; weathered entrance gate and winding path, porch on right, barn and mountain valley, slightly overgrown welcoming farm, dawn light, quiet left 40%, crisp wood/foliage, no text/UI, wide 16:9.
- `public/images/title/progression/established.webp`: `exec-fae02727-17e6-4ef7-a3e5-8dbc3b30a0d5.png`. Prompt: same farm after Chapter 1, modest care improvements, swept path, orderly vegetable rows, stored tools, watering can/baskets, tidy flower beds and open gate; bright clear morning, no new buildings, people, creatures, text or UI; quiet left 40%, sharp anime-painterly textures, wide 16:9.

## Validation

Production Next.js build and two focused tests cover save-dependent selection, no state mutation, completed-story precedence, replay and skip behavior. Production-browser checks cover four states (including no save) at 1440×900, 1280×720, 390×844, 360×640 and 844×390; all three backgrounds decode; main screen and controls fit without scrolling. Load Game, New Game, Settings, and Import/Export dialogs remain reachable. Screenshots reviewed for desktop and phone portrait/landscape. Other older art is absent from the sparse local checkout; new title art and HTML title/buttons are present.

Published through draft PR #21; keep draft and unmerged. Branch preview: https://creature-chronicles-git-feature-ui-r-56c7f9-slickgames-projects.vercel.app
