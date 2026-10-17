# Forge equipment set markers

**Historical initial flat study; superseded visually by approved C.** See `FORGE_SET_C_2026-10-17.md`. Runtime now uses separately generated sculpted ivory/gold WebPs. Set positions and authoritative membership behavior below remain valid.

Adds a matching ivory silhouette for each current equipment set: Vigor heart/cross, Bulwark shield, Striker crossed blades and Swift wing. Original editable SVGs are under `public/images/ui/forge-slate-v2/sets/`. `set-badges.html` displays all four at 112, 32 and 24 CSS pixels.

Each Forge recipe tile, selected output and full-detail artwork now shows its actual `equipmentStats(item).setId` in a dark enamel/gold circle at bottom left, mirroring the category badge at bottom right. No set means no marker. All labels, piece requirements and actual bonuses remain in the existing hover/focus/phone item details. A marker identifies membership; it never claims a set bonus is active. The read-only assembly mirrors the runtime and remains sample-only.

Preserves the compact nameless card design, rarity frames, top-left power letter, top-right enhancement and the bounded desktop composition with Iona's full head. No equipment assignments, costs, stats, transaction/save code or canonical art changes. Other equipment menus retain their prior set-strip/card presentation.

Validation: production Next build/TypeScript; preview JS syntax; asset inventory hashes and SVG parsing. Actual game browser checks cover all six recipes at eight sizes (1920x960, 2560x1440, 1920x720, 1366x768, 1440x900, 390x844, 360x740, 844x390), authoritative per-recipe badge assignments, separate lower-corner anchors, image decoding, full-detail marker, bundled font and existing six action icons. Zero Forge asset/page errors. Actual screenshots use an isolated synthetic QA save; no user save is touched. Prior transaction/regression baseline remains valid for this presentation-only change. Hosted gameplay is separately unverified.
