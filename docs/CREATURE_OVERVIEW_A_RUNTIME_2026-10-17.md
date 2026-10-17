# Creature Overview A

Approved reference: portrait-led Overview A, selected October 17, 2026.

The Ranch Roster opens on Overview. The full-body canonical gameplay artwork anchors the desktop beside the eight existing creature sections. Energy, Affection, Hearts and Experience show live save values; Hearts remain creature hearts, not combat HP. Identity, health/protection, lineage and role strengths retain complete detail records.

Choose creature reveals the existing roster with search, filters/sort, compact/cards views, favorites, protection and comparison. Selecting a creature closes the picker. The artwork expand action reuses the canonical full-body image. Previous screen preserves the existing navigation route.

Phones keep a compact portrait/identity block and Creature section selector. More overview switches from vitals to the four secondary records, with Back to vitals returning. Short desktops also use focused pages. Equipment retains its focused small-screen layout; changing back to Overview restores the portrait. Equipment assignment/removal/transfer logic is unchanged. Other shared breeding detail callers retain their existing layout.

Validation: direct Next production build and TypeScript; focused ESLint (no errors; existing advisory warnings). Browser QA uses a synthetic Mira/Rook save and local production server, with seven viewports: 1920×960, 1440×900, 1920×720, 2560×1440, 390×844, 360×740, 844×390. Overview content and footer bounds, secondary pages, all eight sections, artwork/detail dialogs, creature switching and Previous screen are exercised. Save data must remain unchanged through read-only navigation. Canonical new-screen assets are local; unrelated missing legacy images in this sparse checkout use QA-only fallbacks. The standard prebuild asset validator is blocked by those absent original breeding assets; direct production compilation is used locally.

Actual production-render screenshots and measured results are under docs/validation/overview-a-*.
