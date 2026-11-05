# Nursery finishing pass

Routine refinements within approved designs:160ms ledger fade/4px settling on Choose Egg, Other Actions, removal review and completion (which shares the removal frame). Motion is disabled for prefers-reduced-motion; button feedback has a120ms transition and is disabled under that preference too. No page-turn overlay, input delay or gameplay change.

Empty Nursery selects the details focus even when the remembered phone focus was Browse eggs, and omits mobile browsing tabs until an egg exists. Previously the phone CSS hid the paper with the empty message/Visit Breeding behind data-focus=scene. Pregnancy/birth focus remains details. The existing empty-state text/art/CTA are retained.

Completion title/card keeps the user-approved lowered position; on windows≤570px tall the offset is8px to preserve footer clearance. Other compact typography/meaningful paging remain unchanged.

Verify deployed build, empty Nursery and Visit Breeding/source return, modal navigation/Escape and selection without spending, actual desktop geometry/screenshots, motion rule and reduced-motion fallback. The developer harness public/qa/nursery-layout.html places the live game inside sized same-origin frames for390×844,360×640,844×390 and1024×768 QA. It does not fabricate app state or bypass gameplay. These are actual CSS viewport tests, not physical-device tests. A borderless iframe keeps requested dimensions exact. The first live landscape audit exposed Other Actions card overflow and a near-zero warning/footer gap in release review; scoped landscape rules widen that spread and compact cards, and reduce the release illustration/warning to restore clearance. No destructive tests needed for these refinements. PR21 stays draft/unmerged.
