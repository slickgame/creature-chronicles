# Lineage A and interactive family-tree runtime

The ranch Lineage tab uses the user's approved A cards. View full record opens the approved B-inspired family-tree window. Canonical creature art, main section navigation and footer actions remain intact; shared breeding callers retain their existing presentation.

## Permanent records

`GameSave.familyArchive` is an optional versioned compact archive of identity, paired parent IDs, recorded names, generation, origin, historical assessment, markers and notes. It is independent of the recent 150-entry birth log. Hatching archives records before log truncation and refreshes the final enriched child afterward. Load/save normalization backfills available records, and saving preserves records from the previous same-identity slot before departed creatures can disappear. Different save identities never merge. Portable export/import retains the archive.

Parent snapshots keep player contributors distinct from creature IDs. Legacy names and filtered creature IDs are never blindly zipped; ambiguous identity remains explicit. Missing records are shown as unrecorded rather than invented. Older ancestry already lost before this feature cannot be reconstructed. Birth assessment remains historical; every new pairing is assessed separately.

Generation normalization and pending hatches consult archived parent generations, preventing departed parents from lowering descendants' displayed generations. Permanent attributes, talent pools, breeding odds, resources and reward formulas are unchanged.

## Interface

- A has parent cards, actual origin/generation, birth assessment, lineage markers and complete notes. Smaller windows use Family / Birth record & notes views. Complete record text is paged, including long saved notes. Parent names remain available after departure.
- The tree uses one node per saved identity and one junction per distinct recorded parent set. Multiple partners, shared ancestors and children use the same layout/connector renderer. Imported circular links are omitted from the view without rewriting the saved relationships.
- Desktop pointer drag, mouse-wheel zoom, explicit zoom buttons, touch drag/pinch and arrow-key panning are supported. Fit tree shows the expanded graph; Center on the focal creature restores readable zoom. Expand/collapse controls grow branches progressively. Search results page to fit and can center a previously offscreen record.
- Cards outside the visible canvas are not mounted. Very low zoom uses lightweight SVG overview marks instead of thousands of tiny interactive cards. Relative details preserve camera state; Back to Lineage restores the parent page. Browsing writes no save and spends no resources.

## Asset requirements

No line/arrow image atlas is required. SVG geometry joins actual ID-based parent groups to their children. Barycentric row ordering reduces crossings, dark under-strokes separate intersecting paths, and selection highlights relevant connectors. Existing ivory/gold family, creature, player, marker, quill and scroll art, approved card/window frames and native accessible controls supply the runtime kit. See `public/images/ui/lineage-a/README.md` for exact paths and states. The approved concept PNGs are acceptance references, not baked UI backgrounds.

## Verification

The flow is nursery or existing save → permanent archive → parent records and graph layout → interactive canvas and complete details. There is no external API dependency. The production build and TypeScript pass; focused ESLint has no errors (native-image and pre-existing unused-import warnings remain).

Thirty targeted regression tests pass: archive rollover beyond 150 births, release/absence, actual hatch output, generation retention, player contributors, ambiguous legacy records, serialization/save/reload, portable export/import, separate save identities, multiple parent groups, shared ancestors, 1,200-generation layout, corrupted cycles, breeding previews, nursery, talent effects, move inheritance and portrait migrations.

`scripts/validate-lineage-a.mjs` passes 132 production-browser checks with no browser errors across 1440×900, 1280×720, 390×844, 360×740 and 844×390. It covers pointer drag, wheel and native touch pinch, keyboard panning, zoom, fit/center, search, branch controls, long/departed records, missing ancestry, no-write browsing, camera return state, and a thousand-child stress fixture. Machine results and actual screenshots accompany this document under `docs/validation/lineage-a-*`. QA saves are synthetic sample data and never change production creature generation. Unrelated art absent in the sparse checkout uses a test-only fallback; the actual Lineage art is present.

The short-landscape fixture chooses a creature at desktop size before resizing, because the unchanged compact roster picker hides its search field. This integration does not redesign that picker. PR21 stays draft and unmerged.
