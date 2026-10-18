# Lineage A and expanded family tree

The user selected A's family-record cards on October 18, 2026. The exact uploaded original is preserved unchanged at `public/images/ui/lineage-a/approved-concept.png` (SHA-256 a4500791801a3940a82dfd181468ef21acfa6e54f4137a8dd1693f36510996d8). This selects the main page direction; no runtime changes have been made yet.

View full record opens a B-inspired tree window. The user specifically requested click-and-drag navigation for late-game trees spanning several generations. The follow-up concept should show a large desktop canvas and focused full-screen phone view, not shrink all ancestry into the small main-page panel.

## Proposed interactions

- Drag to pan; scroll or explicit buttons to zoom on desktop. Touch drag and pinch on phones, with explicit zoom buttons as an alternative. Support keyboard panning and focusable relative records during implementation.
- Fit tree fits expanded branches. Center on Mira (or the selected creature's actual name) returns to the focal record.
- Expand/collapse ancestor and descendant branches; select a relative to inspect a compact record and open complete details.
- Find a relative helps navigate a large recorded family. Only expanded/visible nodes need rendering.
- Back to Lineage returns to A with its selection preserved. Family browsing changes no game resources or genetics.

## Data prerequisite

The active nursery lifecycle currently stores `birthHistory` using `.slice(0, 150)`. A separate compact ancestry archive is needed so family links survive birth-log rollover and removal of owned parents. Reconstruct what can be verified from current creatures, retained birth snapshots and eggs; older missing ancestry remains explicitly unknown. Preserve stable participant IDs, player versus creature identities, paired parent snapshots, and recorded names. Never infer identity from positional alignment between filtered IDs and unfiltered names.

Build family relationships from IDs and snapshots, deduplicate shared ancestors, guard corrupted cycles, and expand branches progressively. Do not change breeding risk calculations or invent new genetics effects as part of this UI work. The birth assessment remains a historical record; new pairings are checked separately.

## Order

1. Review the expanded desktop/phone tree concept.
2. Implement the durable family records and compatibility backfill.
3. Integrate A and its full-record tree, reusing approved frames and artwork.
4. Verify several generations, shared ancestors, missing records, player contributors, departed parents, panning/zoom, return state and save/reload on desktop and phone.

Earlier alternatives and exact prompts remain in `LINEAGE_UI_OPTIONS_2026-10-18.md`. A's illustrative names Luna/Ash and Generation 3 are sample data, not the actual starter Mira ancestry.


## Expanded-window concept provenance

Built-in image generation, preview-only. The revised preview is exec-af81e967-ec48-4c13-9305-dd054b5de93f.png. The first draft exec-c9576a23-b914-4381-ace1-cddbbc19a669.png had an ambiguous partner connection and is superseded. The expanded window still awaits design review; neither view is integrated.

### Initial prompt

Use case: ui-mockup. Asset type: polished Creature Chronicles game UI concept board, not an actual screenshot and not a scientific genealogy chart.
Create ONE refined expanded FAMILY TREE window concept with a large DESKTOP view on the left (about 72% width) and a narrow PHONE view on the right. Board title "Expanded family tree"; subtitle "CONCEPT · SAMPLE FAMILY RECORDS".
References: image 1 is the APPROVED A family-record cards MAIN PAGE; preserve its deep navy, restrained warm gold borders/corner flourishes, carved ivory/gold icons, warm cream serif typography, dark green selected state. Image 2 is B family connections, a visual reference for branching relationships ONLY. The new view opens from A's "View full record", not a replacement for A. No new character design.
Desktop: a nearly full-screen gold-framed navy modal over a very subtly blurred A page. Modal header has a small painted ivory/gold family-tree icon, title "Mira · Family tree", and explicit "Back to Lineage" button at right. Do not waste space with the large full-body portrait inside this tree window. Below header: search field "Find a relative", discreet "Ancestors & descendants" label. Dedicated toolbar with "−", "100%", "+", "Fit tree", "Center on Mira". Accessible clean buttons, no microscopic symbols.
The main area is an intentionally LARGE PAN-AND-ZOOM CANVAS (navy, very subtle texture, NO busy grid), with thin warm-gold connectors and compact readable record cards grouped by generation. Show a plausible SAMPLE multi-generation neighborhood, not an impossibly giant tree squeezed into one screen: four compact grandparent cards at upper row, two parent cards "Luna" and "Ash" below, selected central "Mira" card with small warm ivory cat-record silhouette (or approved small Mira portrait), partner "Kellan" beside her, and two offspring cards "Nia" and "Vale" below. Keep connections semantically sensible: two grandparents per parent; Luna and Ash connect to Mira; Mira plus Kellan connect to the two children. Do not connect siblings as parent-child. Generation labels 1/2/3/4 along canvas margin. Nodes use family/paw record icons rather than invented character portraits. Mira's selected card has a dark green face and warm gold rim, name "Mira", "Generation 3", "This creature". Every other node has a name and compact generation label, not extra fake stats. A small plus branch-control above the top cards labeled "Earlier ancestors" suggests expandable branches; allow collapse controls. Show ONE subdued dashed offshoot "Parent not recorded" on the partner side as honest missing ancestry, not an unlock/progression requirement. An absent relative can say "Record only" on one subtle badge.
At bottom of canvas show a small hand/drag hint "Drag to explore · Scroll to zoom". Below the canvas, a compact selected-relative strip: "Mira · This creature · Generation 3", a "View record" button, a short note "Only recorded family links are shown." No safety-to-breed claim, no percentages or trait growth.
Phone: a FULL-SCREEN version of the same window. Header "Family tree" and "Back to Lineage", small selected Mira identity. Search field and compact zoom/Fit/Center controls. Large vertically useful TOUCH canvas showing the central Mira neighborhood, with parents above and children below, plus branch expand affordances; it is OK that distant branches extend outside this canvas because the INTERACTIVE CANVAS is pannable. Keep the window frame, buttons and text fully within phone viewport. Do not shrink the entire extended genealogy to illegible dots. Include visible hint "Drag to move · Pinch to zoom", selected-relative strip and "View record". Phone avoids a permanent sidebar.
Composition: content-first, practical late-game navigation, clear hierarchy, consistent A design vocabulary, quiet ornament, ample usable tree canvas, readable serif. All UI words legible. Show panning/zooming affordances, not a cursor demonstration, no arrows covering buttons. No extra gameplay features, no invented rarity or XP, no new genetics rules. Do not change approved A main layout; it is only faint background context here. This is a prospective concept with sample ancestry.

### Targeted correction prompt

Use case: precise-object-edit. Edit the immediately preceding Expanded family tree concept image. Keep the navy/gold/ivory UI, desktop-and-phone layout, all node positions and card artwork, controls, typography and sample names. Change only these specific details:
1. Replace the top labels "Desktop (72% width)" and "Phone (28% width)" with just "Desktop" and "Phone". Percentage instructions must not appear as interface copy.
2. Correct the DESKTOP parent/partner connection near Mira and Kellan. Luna and Ash are Mira's parents ONLY. Their two stems join into one parent junction that terminates at Mira's TOP CENTER. No line from Ash, Luna, or that parent junction may touch or point to Kellan. Kellan is Mira's unrelated partner: exactly one short horizontal partnership line connects Mira's RIGHT edge to Kellan's LEFT edge. From the midpoint of this partnership line, one vertical stem goes downward to a sibling bar, which branches to Nia and Vale's TOP CENTERS. There must be NO arrow from Mira into Kellan. Visually distinct parent junction above Mira and child junction BELOW the partner line. Clear unambiguous connectors, no extra loose gold lines.
3. Remove the entire dashed "Parent not recorded / Record only" card to the far right of Kellan AND every dashed connector leading to that card. Leave calm empty navy canvas there. No replacement node. This avoids suggesting Ash is Kellan's parent. Retain the separate top Earlier ancestors expansion control.
4. Apply the SAME partner/child connector convention to the PHONE: Luna and Ash connect ONLY to Mira's top. Mira and Kellan are joined horizontally, and their shared midpoint branches DOWN to Nia and Vale. No parent line into Kellan.
5. On the selected Mira cards, make "Generation 3" / "Gen 3" warm ivory rather than cyan. Keep deep dark green selection.
Preserve the four separate grandparent cards leading two-to-one into Luna and Ash on desktop. Preserve all button labels, input controls, hints, footer selected record, sample-data disclaimer, and family names. No new text or characters. This remains a prospective UI concept with illustrative family data.
