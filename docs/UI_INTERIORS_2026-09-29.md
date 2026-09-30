# Interior navigation, readability and concepts — 29 September 2026

## User request and approval state

The user requested work on overlapping Menu/Back controls, clipped Chores helper details and competing warnings, roster portrait/stat hierarchy, Nursery empty space/timers/actions, and a consistent parchment/wood/icon style. Continue the user's established concept-first workflow: concrete overlap and clipping fixes are implemented now; the broader visual concepts below require selection/approval before implementation. Keep PR #21 draft and unmerged.

## Implemented layout repairs

- Added shared, in-flow `ScreenNavigation` to Chores, roster and Nursery. Back to Ranch and Menu reserve header space and wrap; the fixed fallback Menu is suppressed on these three screens. Menu elsewhere retains its existing behavior.
- Moved Breeding Ledger links (roster and Nursery) and Nursery Move Lineage into the same header area. Their routing and record count remain intact; fixed bottom launchers no longer cover creature cards or history.
- Replaced Chores' mismatched fixed grid rows with an intrinsic-height page. Both warnings occupy their own rows, cards follow them, and the page scrolls naturally.
- Helper thumbnails now use existing portraits, with an image fallback. Text sits beside a bounded portrait and wraps fully; helper-selection rows also wrap on phones. No chore calculations, assignments or save format changed.
- Roster and Nursery own page scrolling on narrow screens. Nursery empty-state content retains its intrinsic height rather than collapsing under the global full-height frame rule.

## Proposed visual pass

| Concept | Direction | Assessment |
| --- | --- | --- |
| [A — Chores Board](https://drive.google.com/file/d/1jNdRSjA-Xw4Jbmkl8HS_SfdZ6p6YkEmn/view?usp=drivesdk) | Five broad task cards; immediate overview and Choose Helpers / Best Fit actions. | Easy to scan all tasks; more page scrolling as helper explanations grow. |
| [B — Chores Ledger](https://drive.google.com/file/d/1X4KFsccuw1DBImU_dOSizCVOUnvqoaYe/view?usp=drivesdk) | Task list alongside a readable assignment workspace, recommendations and eligible/unavailable helper rows. | Recommended for assignment decisions; selected task becomes a single-column detail view on phones. |
| [Roster — Portrait & Dossier](https://drive.google.com/file/d/1_dzhtmY_1jQvbgN0KGc3F4IfrRRIVfgO/view?usp=drivesdk) | Portrait/name/status list and larger selected profile; core stats first, existing deeper tabs retained. | Removes duplicated badges and makes comparison an explicit mode. |
| [Nursery — Readiness First](https://drive.google.com/file/d/1WEmPy6wicZCNNLpPrB3F3e8p9ddjL6vs/view?usp=drivesdk) | Ready/incubating/pregnancy summaries, compact egg list, Hatch near the top, history and inheritance secondary. | Removes oversized empty columns and surfaces the next useful action. |

All concepts share warm parchment, dark readable text, walnut/brass frames, green primary controls and the approved icon style. Generate clean backgrounds only after selection; keep all controls, labels, portraits and live values in code. Do not implement the concept images as static screens.

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
