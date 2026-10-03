# Battle arena — approved B with turn order and categorized moves

Implemented the user's approved revised B in both Circuit and C4 challenge battles. The arena uses a new sandstone backdrop, the existing uncropped creature profiles, parchment commands and oak plan slots. The shared Menu sits in its own header space. No gameplay balance, loadout limit, save schema or innate grades change.

## Interaction

- Planning order uses effective Speed + 10 × queued move Priority, with the engine's seeded initiative tie-break. Unplanned allies and hidden enemy actions use priority zero; the strip is explicitly an estimate. During resolution it shows the actual recorded action order and highlights the current actor.
- All equipped moves remain inspectable. All / Attack / Support / Recovery show counts and paginate three moves per page. The existing four-equipped/eight-learned caps remain unchanged; the menu can paginate a longer list without layout changes. Damaging hybrids remain Attack; defensive moves stay Support even with small energy refunds; healing, cleansing and energy-focused moves use Recovery.
- Selecting a move only inspects it. Queue Move commits it to an ally's plan; Confirm Round requires a plan for every living ally. Cooldown, Battle Energy and target restrictions are shown; unavailable moves stay visible.
- Desktop commands stay beside the arena. Compact screens open commands in a native popup. Only popups scroll. Native dialogs expose complete move effects, turn-order explanation, current numeric battle stats, base stat numbers with innate grades, items, log, speed/reduced motion, rules and result recording.
- Keep existing AI, equipment calculation, battle transactions, revival-before-recording and challenge restrictions. Forfeit and leaving now have cancellation/confirmation. Used items remain spent if leaving. Remove retired, unused card helpers from these two battle parents.

## Generated assets

Production files in `public/images/ui/battle-v1/`:

| Asset | Purpose | Export |
|---|---|---|
| background.webp | Empty sandstone arena | 1536 × 1024, RGB WebP quality 88 |
| all.webp | Open battle manual | 384 × 384, alpha WebP quality 88 |
| attack.webp | Crossed swords | 384 × 384, alpha WebP quality 88 |
| support.webp | Green shield and oak leaf | 384 × 384, alpha WebP quality 88 |
| recovery.webp | Healing vial and white blossom | 384 × 384, alpha WebP quality 88 |

Generated with ImageGen from the approved revised B concept. Original PNGs were resized/converted only. No creature art was generated or edited. Shared ranch wood/parchment and the existing distinct tonic/salve icons are reused.

Background prompt:

> Production background asset for the approved Creature Chronicles B battle UI. Use reference solely for painterly environment and palette. Create ONE full-frame wide landscape sandstone coliseum INTERIOR battle arena, creamy golden sand, green pennants hanging on honey sandstone walls and distant stands, subtle ivy and small white flowers at the far walls, brass accents, warm afternoon light. Camera from slightly elevated audience perspective across a broad EMPTY open sandy fighting floor; floor occupies bottom 75%, stands/walls upper 25%. Large quiet open spaces left and right for overlaying six full-body creature sprites, balanced perspective, no large foreground objects. Match approved warm hand-painted cozy fantasy illustration exactly, elegant natural texture. Remove ALL creatures, silhouettes, people, portraits, UI panels, text, bars, icons, labels, rings and buttons. No vignette obscuring the floor. Pure empty arena background, 1536x1024.

Category icon prompt template:

> Production game menu category icon: SUBJECT. One centered object, strong readable silhouette, consistent warm hand-painted fantasy painterly illustration, cream highlights, honey brass and forest green palette. Matches cozy sandstone coliseum, parchment and carved oak interface. Full object visible with padding. True transparent background. No text, no lettering, no frame, no background, no ground plane, no extra items. Square composition, detailed enough for 96px use and clear at 32px.

Subjects:

- All: an open cream parchment battle manual with four small abstract brass symbols on its pages
- Attack: two crossed polished steel short swords with honey-brass hilts and forest green bindings
- Support: a forest green enamel shield with a protective curling oak leaf and honey brass rim
- Recovery: a small rounded glass healing vial containing luminous soft green liquid, cork stopper and white medicinal blossom

## Validation

- `npx next build`: production and TypeScript pass. The sparse checkout still uses an ignored local scene-manifest stub; no stub or QA save is committed. Full asset preparation is left to the complete deployment checkout.
- Regression: 146/148 pass. Only the same two pre-existing retired-Town source checks fail (`town opens the functional Rose Lantern adult social-house foundation` and `main menu, dev tools, and town expose the vacation test features`). New category/availability/order tests and updated shared-HUD source coverage pass.
- Targeted ESLint: no errors (11 warnings). Remaining warnings concern existing image-element conventions, initial preference effect and roster memo dependencies.
- Chromium production QA: 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390. Main/client/scroll dimensions match; no blocked or offscreen controls, main scrolling or broken visible artwork. Move details, profile, items, log and Menu dialogs fit; nested popup Escape works. Short desktop overlap was found and fixed before publication.
- Browser flows: all four moves reachable by paging; target-incompatible support remains inspectable but cannot queue; explicit move review/queue for all three allies; real round resolution and return to planning; once-per-battle tonic stock consumption; cancel/confirm leave; C4 kit consumption, item popup, cancel/confirm forfeit and one saved result. A boosted local QA save also verifies a completed Circuit victory, responsive result review, one recorded win and Combat XP. Circuit/C4 have no browser page errors.

PR21 remains draft and unmerged. This publishes the branch preview only.

## Character scale correction

The user requested larger battle characters. Replace the three-row formation with two staggered rows, reserving the left half for allies and the right half for enemies. At 1440×900, full-body render height grows from approximately 139px to 238px (about 71%). Phone portrait uses three enemies above three allies, increasing image width and height while keeping every creature visible. Short landscape keeps its existing single-row formation. Images remain contained and uncropped; no asset or combat changes.

Production build/TypeScript pass. Browser checks cover all seven previous viewport sizes with no main scrolling, clipped or blocked controls, missing images or page errors. Existing commands and nested dialogs remain reachable. Desktop screenshot visually reviewed. The compact QA checks ran separately after the screenshot capture process ended early at the tablet viewport.
