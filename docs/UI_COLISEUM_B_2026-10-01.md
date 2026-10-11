# Coliseum courtyard — approved B

User approved B on October 1, 2026 after reviewing two entrance/team-selection concepts. Scope: entrance and pre-battle preparation. The existing round combat and results presentation remains the next visual pass.

## Player experience

- Open sunlit courtyard, parchment side panels and five distinct painted navigation symbols.
- Permanent Circuit, Daily, Gauntlets and Boss Trial share a fixed-height entrance. Encounters paginate three at a time. Current reward/access information is read from existing gameplay definitions.
- Rules & Rewards, Records and Marks Exchange use native scrolling dialogs. The Exchange preserves equipment, technique teaching/replacement, contracts, capacity checks and reward history.
- Three uncropped canonical full-body creatures stand in the staging area. Change opens a roster popup; the portrait dock pages four at a time. Choosing a selected teammate swaps positions; clearing the final slot now stays empty rather than automatically reselecting three creatures.
- Profile shows base stat numbers and innate grades. Team Preparation lists all five equipment slots. Equipment does not change innate grades.
- Opponent popup shows the actual authored three-creature formation, moves and equipment. Modifiers, aid restrictions and gauntlet recovery use current definitions.
- Tactics Kit toggles before entry and is consumed by the existing battle transaction. Back does not spend a kit or record a result. Locked gauntlet rosters and saved HP/BE ratios remain visible; abandonment requires confirmation.
- Town previously opened the older Circuit-only screen. The root now uses the synchronized courtyard entry so all challenge modes and the Exchange are reachable. The shared Menu has its own header position, including in existing battle screens. The floating Chapter 1 battle coach is omitted; the existing Menu guide and gameplay progression remain available.

## Integration

`ColiseumCourtyard.tsx` reads C2/C3/C4 state and delegates battles to the existing C2 and hardened C4 transaction paths. C2 results synchronize Marks/loot before persistence. Existing reward idempotency and gauntlet sequencing are retained.

`ColiseumTeamStaging.tsx` shares pre-battle UI between C2 and C4. An explicit empty selection differs from an untouched initial selection. C2 battle entry now rechecks availability, matching the existing C4 check. No reward balance, creature art, base stats, grades or save schemas changed.

Root routing now directly imports the current entry wrapper; the old C2 screen is imported for its exported battle component. Its formerly excluded closure sites use a narrowed non-null save for TypeScript validation.

## Artwork

Built-in image generation, new production art (no edits to creature images). WebP conversion/size optimization only; icon alpha retained. Assets: `public/images/ui/coliseum-v1/`.

Approved concept: `exec-8c3b4240-6120-4737-a86f-776fb82e7495.png`.

| Asset | Generated source |
| --- | --- |
| background.webp | exec-34f2f817-12e8-469e-aded-2971c0c2d804.png |
| circuit.webp | exec-340f2a3b-ddcc-42f5-8eb4-ea3a2224e6d0.png |
| daily.webp | exec-fcbb752a-8914-48ea-b30a-b1043114f720.png |
| gauntlets.webp | exec-54844c5e-efb1-4573-8abf-de60c8541538.png |
| boss.webp | exec-4d0bb766-7e87-4a7a-b17d-adb34b90f66b.png |
| exchange.webp | exec-90d24732-1e8f-45da-9372-2b5d9bd242c6.png |

Background prompt (approved concept supplied as style reference):

> Generate production game background only based on approved B courtyard reference. ONE full frame landscape 1536x1024 sunlit sandstone fantasy coliseum courtyard, grand open arched arena gate precisely center, forest-green pennants, brass details, honey-oak accents, modest ivy and white blossoms at far edges, painterly sophisticated cozy creature ranch visual style. Camera straight ahead from broad empty staging terrace, low unobtrusive stone steps near far gate. Central lower half clear flat warm stone floor suitable for overlaying three full body creature sprites. Left and right thirds quiet architecture behind future UI panels. Match reference environment and light. Remove ALL interface, text, buttons, icons, creatures, silhouettes, plinths, labels and panels. Pure environment asset.

Icon prompt template (each generated separately with transparent_background true):

> Production isolated game UI icon: SUBJECT. Consistent warm painterly fantasy style, honey brass, creamy highlights, subtle forest green accents, rich dimensional handpainted materials, strong readable silhouette at 56px. One centered object filling square canvas with padding; true transparent background. No text, no interface, no border, no cast ground or background. Matches cozy parchment and carved oak Creature Chronicles Coliseum aesthetic.

Subjects:

- Circuit: miniature sandstone circular coliseum with open arches and green pennant
- Daily: cream daily calendar scroll with a brass sun seal, no letters or numbers
- Gauntlets: three overlapping brass shields linked together, forest green enamel centers
- Boss: ornate horned tournament helmet with small brass crown, green accents
- Exchange: open leather pouch filled with octagonal brass tournament tokens

Existing ranch-v2 parchment/wood frames are reused. No concept silhouettes enter production.

## Validation

- Production Next build and TypeScript passed.
- Changed-file ESLint: zero errors, 39 warnings (existing hook/image/unused-code warnings plus the new ordinary image elements).
- Full regression: 143/145 passed. The only failures are the two previously documented retired-Town source-string checks; no unrelated tests changed.
- Production Chromium checked entrance modes and team staging at 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390. No main scrolling, offscreen or blocked controls, missing visible images or page errors. Full-body sprites use contain sizing. Native rules/profile/Menu dialogs fit and close with Escape.
- Browser checks cleared all three slots without automatic reselection, chose a new team, entered a Circuit battle and left without recording.
- Unlocked Daily/Gauntlet/Boss staging, all four Exchange tabs on desktop and phone, exact one-kit consumption, a single recorded loss, saved stage-two roster locking, and cancel/confirm abandonment passed.
- Screenshots were visually reviewed. Fixed inherited light parchment text, a shrinking dialog Close button, redundant tablet controls and short-landscape overlap. Main layouts and popups were rechecked after their fixes.

The sparse checkout omits unrelated large breeding image collections. Local build uses the same ignored scene-manifest stub documented in earlier passes; neither fixtures, QA tools nor the stub is included in this commit. Draft PR remains unmerged.
