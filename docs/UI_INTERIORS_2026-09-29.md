# Interior navigation, readability and concepts — 29 September 2026

## User request and approval state

The user requested work on overlapping Menu/Back controls, clipped Chores helper details and competing warnings, roster portrait/stat hierarchy, Nursery empty space/timers/actions, and a consistent parchment/wood/icon style. The user approved the recommended Chores B ledger, portrait-and-dossier roster, and readiness-first Nursery. These are now implemented, following the earlier navigation repairs. Keep PR #21 draft and unmerged.

## Implemented layout repairs

- Added shared, in-flow `ScreenNavigation` to Chores, roster and Nursery. Back to Ranch and Menu reserve header space and wrap; the fixed fallback Menu is suppressed on these three screens. Menu elsewhere retains its existing behavior.
- Moved Breeding Ledger links (roster and Nursery) and Nursery Move Lineage into the same header area. Their routing and record count remain intact; fixed bottom launchers no longer cover creature cards or history.
- Replaced Chores' mismatched fixed grid rows with an intrinsic-height page. Both warnings occupy their own rows, cards follow them, and the page scrolls naturally.
- Helper thumbnails now use existing portraits, with an image fallback. Text sits beside a bounded portrait and wraps fully; helper-selection rows also wrap on phones. No chore calculations, assignments or save format changed.
- Roster and Nursery own page scrolling on narrow screens. Nursery empty-state content retains its intrinsic height rather than collapsing under the global full-height frame rule.

## Approved visual pass

| Concept | Direction | Assessment |
| --- | --- | --- |
| [A — Chores Board](https://drive.google.com/file/d/1jNdRSjA-Xw4Jbmkl8HS_SfdZ6p6YkEmn/view?usp=drivesdk) | Five broad task cards; immediate overview and Choose Helpers / Best Fit actions. | Easy to scan all tasks; more page scrolling as helper explanations grow. |
| [B — Chores Ledger](https://drive.google.com/file/d/1X4KFsccuw1DBImU_dOSizCVOUnvqoaYe/view?usp=drivesdk) | Task list alongside a readable assignment workspace, recommendations and eligible/unavailable helper rows. | Recommended for assignment decisions; selected task becomes a single-column detail view on phones. |
| [Roster — Portrait & Dossier](https://drive.google.com/file/d/1_dzhtmY_1jQvbgN0KGc3F4IfrRRIVfgO/view?usp=drivesdk) | Portrait/name/status list and larger selected profile; core stats first, existing deeper tabs retained. | Removes duplicated badges and makes comparison an explicit mode. |
| [Nursery — Readiness First](https://drive.google.com/file/d/1WEmPy6wicZCNNLpPrB3F3e8p9ddjL6vs/view?usp=drivesdk) | Ready/incubating/pregnancy summaries, compact egg list, Hatch near the top, history and inheritance secondary. | Removes oversized empty columns and surfaces the next useful action. |

All concepts share warm parchment, dark readable text, walnut/brass frames, green primary controls and the approved icon style. Clean background plates were generated after approval. All controls, labels, portraits and live values remain in code; concept images are not used as static screens.

## Data and behavior rules for implementation

Concept numbers and prose are illustrative, not balance changes. Generated mockups contain inaccurate example values: Chores A's energy figures, B's slot counts and egg/herb output labels, and roster energy/affection scales. Use existing runtime values and authoritative labels instead. Current chores allow 3 helpers each; Stable Production and Garden Tending produce feed, Field Hauling produces materials/upkeep, and Security/Comfort retain current calculations. Do not introduce the mockup's extra named helper or invent creature personality facts.

Preserve all current filters, sorting, favorites, locks, comparison tabs, profile tabs, assignment rules, pregnancy/egg timers, projected stats, inherited abilities/moves, lineage, birth history, and hatch/save behavior. Destructive release/donate actions belong behind an explicit secondary action and confirmation. Ensure timers say they advance on sleep. Empty Nursery state should be a small explanatory card with a Breeding route, not a tall empty workspace. On phones use one list/detail column, labelled back navigation, wrapping text, visible primary actions and no floating controls over content.

## Audit notes for the next implementation

- Chores has an About button without behavior and redundant Balanced Plan / Auto-Assign Best Crew controls. Consolidate deliberately in the selected concept; preserve all five plan choices.
- Current Chores Assigned counter divides helpers by the number of chores. Replace with an accurately labelled assigned-helper count during the data presentation pass.
- Helper-unavailability list currently slices to eight entries; use surrounding-list scrolling rather than silently omitting additional records.
- Roster already has extensive filters, comparison and shared-profile features. Restructure presentation instead of duplicating these systems. Keep selected-profile state distinct from compare selection.
- Nursery's detailed Hatch action currently sits after long inheritance sections; bring readiness/action above them. Preserve full records behind disclosures.
- Other interior screens still use the old fixed fallback Menu; the new shared navigation component is ready for their incremental conversion.

## Verification

Production Next.js build and TypeScript passed. 141 regression tests passed. Targeted lint reports no errors; legacy image, unused-symbol and memoization warnings remain in existing components. Production Chromium checks at 1440×900, 768×900, 390×844 and 360×740 cover all three headers, control hit areas, single Menu launcher, readable control text, Menu/Escape/focus return, Back routes, full helper-text bounds, warnings above cards, Best Fit assignment, and Move Lineage open/close. Desktop and phone screenshots were visually reviewed.

The local sparse checkout omits most unrelated creature/breeding assets. Five existing starter portraits were retrieved unchanged for this audit; no character art changes are committed. The local build uses the existing ignored breeding-manifest stub; the hosted preview runs the full asset pipeline.

## Concept provenance

Built-in image generation, using the approved ranch/ledger screenshot as the material reference and the repository's existing Mira, Rook and Pip portrait images as character references. These are proposed layouts, not current-game screenshots. Final generated sources:

- `exec-1a3087d8-d5d7-471d-a38e-80bd53aec2f4.png` → Chores-A-Board-Concept.png
- `exec-b26c56a4-a5c2-4078-aa4d-4b4da0284f87.png` → Chores-B-Ledger-Concept.png
- `exec-16032553-7923-4379-8663-bb8bcd7e5dc0.png` → Roster-Portrait-Dossier-Concept.png
- `exec-9f8642a8-cca4-49df-ad7e-a341d68c22dd.png` → Nursery-Readiness-Concept.png

Exact prompts:

### Concept 1

```text
Use case: ui-mockup. Asset type: high-fidelity proposed Creature Chronicles interior screen, landscape 16:9, a single game screenshot, not a collage or presentation board. Image 1 is the approved game material/style reference: match its warm parchment with dark brown readable text, carved walnut/brass frames, forest-green primary controls, painterly ranch setting and illustrated icons. Keep decoration restrained and text large with generous space. Unified top header: screen title left, separate 'Back to Ranch' and 'Menu' buttons right, all in-flow with no overlay or overlap. No development labels, no giant empty panels, no duplicate buttons, no modern cyan pill soup. Illustrative data only. Primary request: Option A — Chores Board. Create a readable task-card layout. Header title 'Ranch Chores'. Under header a slim parchment summary row: '5 helpers available', 'Feed tonight: short by 7', 'Patrol: unassigned'. One concise amber notice 'Assign production helpers to cover tonight’s feed.' with a small 'Details' disclosure, never overlaps cards. A restrained toolbar: 'Balanced Plan', 'Other Plans', 'Clear All'. Main workspace has three broad parchment task cards in first row and two in second, separated by generous gutters. Cards named 'Security Patrol', 'Comfort Care', 'Stable Production', 'Garden Tending', 'Field Hauling'. Each has a small illustrated task icon, energy cost, a medium portrait thumbnail beside the readable recommended-helper name and two short lines explaining fit/output, and two clear bottom actions 'Choose Helpers' and 'Best Fit'. Use Image 2 Rook and Image 3 Mira ONLY as faithful cropped portrait references, do not redesign characters or generate bodies. Other thumbnails can use restrained existing-style paw crests. Show 'Recommended: Rook' and 'Security Lv 5 · Natural' on Patrol; 'Recommended: Mira' and 'Ranch Care Lv 4' on Comfort. Task cards expand for text; no tiny text. Background glimpses of a calm timber ranch workroom around panel edges. Small label 'A · Chores Board' at bottom corner.
```

### Concept 2

```text
Use case: ui-mockup. Asset type: high-fidelity proposed Creature Chronicles interior screen, landscape 16:9, a single game screenshot, not a collage or presentation board. Image 1 is the approved game material/style reference: match its warm parchment with dark brown readable text, carved walnut/brass frames, forest-green primary controls, painterly ranch setting and illustrated icons. Keep decoration restrained and text large with generous space. Unified top header: screen title left, separate 'Back to Ranch' and 'Menu' buttons right, all in-flow with no overlay or overlap. No development labels, no giant empty panels, no duplicate buttons, no modern cyan pill soup. Illustrative data only. Primary request: Option B — Chores Ledger. Create a two-panel master/detail chore assignment screen, for comparison with a card board. Header 'Ranch Chores'. A slim summary row '5 helpers available', 'Feed tonight: short by 7', 'Patrol: unassigned'. One amber notice 'Assign production helpers to cover tonight’s feed.' Separate toolbar 'Balanced Plan', 'Other Plans', 'Clear All'. Left 38% is a compact parchment task list of 'Security Patrol', 'Comfort Care', 'Stable Production', 'Garden Tending', 'Field Hauling'; each row has task icon, assigned-count and concise projected result. Select Security Patrol with a muted green left edge. Right 62% parchment workspace heading 'Security Patrol', '22 Energy per helper', '0 / 3 assigned'. Readable 'Veyra Recommends' callout with Image 2 Rook’s faithful cropped portrait, 'Rook', 'Security Lv 5 · Natural', and green 'Assign Rook' button. Below, full-width Available Helpers rows with portrait, name, energy, relevant skill and a clear Assign action. Use Image 3 Mira as a faithful portrait reference. No invented character bodies. A collapsed 'Unavailable helpers (2)' row shows explanations are accessible. A small footer note 'Changes apply tonight when you sleep'. Quiet timber workroom visible at edges. Small label 'B · Chores Ledger' bottom corner.
```

### Concept 3

```text
Use case: ui-mockup. Asset type: high-fidelity proposed Creature Chronicles interior screen, landscape 16:9, a single game screenshot, not a collage or presentation board. Image 1 is the approved game material/style reference: match its warm parchment with dark brown readable text, carved walnut/brass frames, forest-green primary controls, painterly ranch setting and illustrated icons. Keep decoration restrained and text large with generous space. Unified top header: screen title left, separate 'Back to Ranch' and 'Menu' buttons right, all in-flow with no overlay or overlap. No development labels, no giant empty panels, no duplicate buttons, no modern cyan pill soup. Illustrative data only. Primary request: Ranch Roster redesign. A compact portrait-list on left 30%, selected creature dossier on right 70%. Header 'Ranch Roster'. Slim summary '5 creatures · 5 ready · 0 need attention'. One search/filter row: 'Search creatures…', 'All Families', 'All Statuses', 'More Filters', 'Sort: Newest'. Left has exactly three visible large portrait rows 'Mira', 'Rook', 'Pip', each with a clear name, family/level, one status line and one energy bar; avoid repeating breeding badges on each row. Select Mira using a muted forest-green edge and small tick, distinct from comparison selection. Right selected profile contains Image 2 Mira as a prominent bust portrait faithfully preserved, name 'Mira', 'Base Feline · Level 1', one 'Ready' status, clear labelled Energy and Affection bars. Beside it a tidy 2x3 stat block 'Strength 5', 'Dexterity 7', 'Stamina 5', 'Charm 6', 'Willpower 5', 'Fertility 6'; values are illustrative. Tabs 'Overview', 'Stats & Growth', 'Work Skills', 'Talents', 'Lineage', 'Care'. Below a concise useful summary 'A versatile ranch helper' and restrained action row 'Breeding', 'Habitat', 'Inventory', 'Compare'. One quiet More Actions disclosure houses management actions; don't put destructive actions beside routine actions. Comparison appears only on demand, not a persistent giant empty panel. Use Images 2,3,4 only as faithful cropped existing Mira, Rook and Pip portraits; do not create bodies or redesign them. Calm illustrated woodwork around parchment with subtle scenery at edges. Small bottom label 'Roster · Portrait & Dossier'.
```

### Concept 4

```text
Use case: ui-mockup. Asset type: high-fidelity proposed Creature Chronicles interior screen, landscape 16:9, a single game screenshot, not a collage or presentation board. Image 1 is the approved game material/style reference: match its warm parchment with dark brown readable text, carved walnut/brass frames, forest-green primary controls, painterly ranch setting and illustrated icons. Keep decoration restrained and text large with generous space. Unified top header: screen title left, separate 'Back to Ranch' and 'Menu' buttons right, all in-flow with no overlay or overlap. No development labels, no giant empty panels, no duplicate buttons, no modern cyan pill soup. Illustrative data only. Primary request: compact, action-first Egg Nursery redesign. Header 'Egg Nursery', small counters '1 ready · 1 incubating · 1 pregnancy'. Compact parchment tab row 'Eggs', 'Pregnancies', 'Birth History'; secondary 'Breeding Ledger' and 'Move Lineage' links sit in header area, never floating over content. Main left 40% parchment list with two egg entries and a pending-birth strip: 'Aster — Ready to Hatch' with prominent green Ready label and illustrated egg in nest; 'Clover — 2 days remaining' with amber hourglass and labelled progress bar; pending 'Mira — Delivery in 3 days'. Right 60% selected egg dossier: a modest attractive illustrated nest and cream egg, title 'Aster', 'Common Egg', obvious green 'Ready to Hatch' status, Name field 'Aster' and a prominent green 'Hatch' button high in the panel. Below a compact parent line 'Rook × Mira', and collapsed disclosure rows 'Projected Stats & Abilities', 'Lineage & Inheritance'. Routine action dominates; 'Other Actions' discreetly houses release/donate. Do not depict characters or breeding. The room is a warm bright nursery with shelves, straw nests and window light, matching the approved painterly ranch. Content occupies only needed height, scenery remains visible below; no huge empty sidebars. Small text 'Timers advance when you sleep.' Small label 'Nursery · Readiness First' bottom corner.
```

### Nursery portrait/action correction

```text
Use case: precise-object-edit. Edit image 1, the Creature Chronicles Nursery UI concept. Preserve the entire layout, painted nursery, parchment/wood style, egg artwork, panels, sizes and all other content exactly. Correct ONLY the two parent portrait thumbnails in the Parents row: replace the bird on the left labelled Rook with the exact cropped canine portrait from image 2; replace the bird on the right labelled Mira with the exact cropped black feline portrait from image 3. These are existing game characters; do not redesign them or add bodies. Also collapse the two Release Egg and Donate Egg buttons into one discreet wood button reading 'Other Actions ▾', positioned at the lower right where those two buttons were. Remove the now-duplicate Other Actions text on the lower left, retaining that lower row's breathing room. Hatch remains the prominent primary action. Do not change any egg, title, timer, readiness label, parent name, tab or background. No new text or characters.
```


## Approved implementation — 30 September 2026

- Shared `InteriorShell` provides wood headers, parchment surfaces, green actions, readable brown text and page scrolling. Its background samples the center of the existing parchment asset so decorative frame edges cannot cover text. Chores and Nursery use new clean room plates; the roster uses the existing ranch scenery.
- Chores B separates the five-task list from the active crew workspace. It preserves all five plans, actual energy costs, projections and three-helper capacity. Assigned helpers can be removed; recommendations and available helpers have explicit Assign actions, full skill text and expandable stat fit. All unavailable helpers and reasons remain accessible. A capacity guard prevents a fourth assignment from silently removing another assignment. The Assigned denominator is the actual creature count. About now explains chores, and the overnight warning has a separate disclosure.
- The roster keeps all filters, sorting, Compact/Cards modes, favorites, locks, breeding/habitat/inventory routes and comparison features. The selected profile has a prominent existing portrait, energy/affection bars, six core stats and existing detail tabs. Compact rows omit repeated role badges. Comparison and destructive confirmations use the shared native dialog with Escape and focus handling. The obsolete polished wrapper no longer overrides the core layout.
- Nursery sorts ready eggs first, shows real capacity/readiness counts, and moves name/Hatch above parent information and disclosures. Pregnancies and Birth History have explicit sections. Projected stats, abilities, lineage and inheritance remain accessible. Incubation progress uses the existing day timer; text explains that sleeping advances timers. Release/donate require confirmation. Empty Nursery has a compact explanation and working Breeding route. Hatch results retain the offspring portrait, tabs, renaming and birth record.
- Phone layouts use list/detail navigation with All Chores, All Creatures and All Eggs. The roster hides list filters while viewing a dossier; its six stats use the full panel width. Ready eggs open directly to their action panel. Desktop retains simultaneous list and detail panels.
- Shared creature details receive an opt-in dossier presentation; unrelated consumers retain their existing layout. No gameplay balance, save schema, progression, tutorial or sleep behavior changes are introduced.

### Background provenance

The approved Chores B and corrected Nursery concepts were edited into clean timber-room plates with every UI panel, label, control and character removed. Generated sources: `exec-38b6adba-1119-438e-bc00-0463b17b22b4.png` (Chores), `exec-dc6bc254-66ba-4f3c-83a0-15dd1a326023.png` (Nursery). Runtime assets: `public/images/ui/interiors-v1/chores.webp` (286,484 bytes) and `nursery.webp` (373,572 bytes), both 1672×941. They are decorative scenery; real counters and portraits are rendered separately. Existing creature portraits are reused without alteration.

Exact clean-plate prompt template (Chores / Nursery substitutions):

> Create a clean game background plate from this approved [ranch chores workroom / nursery] concept. Keep the same painterly cozy fantasy timber interior, warm honey brown wood, soft daylight, botanical accents and perspective. REMOVE EVERY UI element: all panels, parchment sheets, titles, text, buttons, counters, portraits, icons, overlays, borders. Reconstruct the room behind them naturally. No people, no creatures, no lettering, no symbols, no UI. Wide landscape 16:9, richly detailed at edges, subdued quiet center suitable for UI overlay. [Ranch workroom with wooden shelves, tools, sacks, baskets and leafy window views at edges. / Nursery with wooden shelving, folded blankets and modest straw nests at edges, gentle window light.]

### Approved-pass validation

Production Next.js build and TypeScript pass. All 141 regression tests pass. Targeted ESLint has no errors; existing raw-image, effect/state and memoization warnings remain. Production Chromium checks cover 1440×960, 768×960, 390×844 and 360×844, with no horizontal control overflow or browser exceptions. Checks exercise three-helper capacity, remove/reassign and Balanced Plan; search, advanced filters, comparison, detail tabs and cancellation of creature removal; ready/incubating eggs, pregnancy timers, cancellation of egg removal, exactly one hatch and a permanent birth record. Menu/Escape/focus return and Back to Ranch work from all three screens. The empty Nursery route was also checked. Synthetic review saves are used only in the browser harness, not shipped in the game.

Screenshots of the running screens are saved beside the approved concepts in the UI review folder. The preview remains a draft branch deployment; no merge or production deployment.


## User correction — fixed screens and full-body selection

The user accepted the interior visual direction, but rejected page scrolling and requested full-body selected-creature images. This supersedes the earlier page-scrolling decision above.

- Main Chores, roster and Nursery use viewport-height layouts. Growing creature/egg lists use Previous/Next pages, sized for the available panel height. Hidden panels do not reset pagination capacity.
- Chores keeps the active task, recommendation, assigned summary and primary actions in view. Manage Helpers, Crew Plans, overnight projections and About open native pop-ups. Full helper text and all unavailable reasons remain available there.
- The roster keeps its portrait thumbnails and uses the existing full-body `profilePath` for the selected creature, fitted without cropping. Filters/sorting, expanded cards, comparison selection and Profile & Care use pop-ups. Every existing profile tab and management action remains available.
- Nursery keeps ready/incubating state and Hatch on screen. Stats/abilities, lineage, secondary actions, pregnancy records and birth history open pop-ups. Egg lists paginate, and the Eggs button also opens a picker for short screens. Hatch reveals use full-body artwork.
- Related-screen links move under More on narrow/short screens; Back and Menu stay in the header. Escape closes a native pop-up without clearing a focused search field's value.
- Existing full-body assets are reused without image modification. No new balance values or save formats are introduced. Other older game screens are outside this correction; new main-screen work must follow the updated no-scroll rule.

### Correction validation

Production build and TypeScript pass; 141 regression tests pass. Targeted ESLint has zero errors (15 existing-style warnings). Production Chromium verifies viewport fit and wheel-disabled main screens at 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390. Checks cover all five creatures across paginated rows, uncropped full-body art, scrolling expanded-card pop-ups, comparison selection and stats, search preserved on Escape, profile tabs, helper assignment and focus restoration, ready/incubating eggs, pregnancy records, short-screen egg selection, and exactly one hatch with its birth record. Empty Nursery fits both phone orientations and its Breeding action remains reachable. Short-screen spacing was also visually inspected. Review fixtures and browser harnesses remain local and are not shipped.
