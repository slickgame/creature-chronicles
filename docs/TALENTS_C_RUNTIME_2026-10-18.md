# Approved Talents C runtime

The ranch creature page now uses the approved compact register C. The launch scope remains nine general talents plus canine Guard Dog: ten dedicated icons total. No talent-generation pool or balance values changed. The 73 retained definitions remain readable with the generic painted talent icon; the audit and planning documents now reflect this scope.

## Behavior

`TalentsLedger` replaces only the ranch `CompactTalents` view. Shared breeding callers retain their existing interface. The creature portrait, section navigation, footer actions and parent screen navigation remain in place.

The register shows actual owned talents and grades, effect-based All/Work/Battle/Care filters, exact effects and applicability. Selection drives the summary, Source, When it works and View full details. Eligible work talents offer View Work Skills. There are no invented talent slots, XP, training or upgrades.

Rows page by available space and keep the selected talent on its page after resizing. Desktop shows the four-column register and expanded summary. Shorter desktop windows use a compact summary with full details accessible. Phones use compact name/grade/effect rows, a selected summary and a focused Selected talent view. Short landscape uses denser rows and the same full-details button. Full details have bounded text pages and preserve selection, filter and page when closed; native dialog Escape and focus return are retained.

The read-only presentation module derives values from the saved grade. Eager Learner includes Crafting and Cooking skill XP, while gathering yield and Energy talents retain their real scope. Guard Dog reports the live farm-security eligibility result. Planned inheritance, retired chores and informational roles stay distinct from active numeric bonuses. Unknown saved descriptions remain readable across pages.

## Verification

The flow is creature selection → owned save records → authoritative talent definitions and farm-security calculation → register and full details. This feature has no server API or external data dependency and does not save while browsing.

- Production build and TypeScript pass. Focused ESLint has no errors; native-image warnings and existing shared-panel effect warnings remain.
- Twenty focused data/gameplay tests pass, including all 83 retained definitions across six grades and actual recipe XP applicability.
- `scripts/validate-talents-c.mjs` passes 141 checks with no browser errors at 1440×900, 1280×720, 390×844, 360×740 and 844×390. It verifies bounds, empty filters, owned C/S values, all ten icon-backed records through paging, recipe scope, current Guard Dog condition, full detail pages, Escape return, Work Skills navigation, no-save browsing, empty talents, legacy and long unknown descriptions, and save/reload.
- The short-landscape scenario selects the creature at desktop size before resizing, because the unchanged compact picker hides its search field. Picker redesign is outside this integration.
- Browser fixtures are synthetic QA saves, including a ten-talent stress creature. Production generation is unchanged. Missing unrelated sparse-checkout art uses a test-only fallback; talent assets must load and decode themselves.

Actual game screenshots and machine results are under `docs/validation/talents-c-*`. These are runtime evidence, separate from the concept and icon contact sheet. PR21 stays draft and unmerged.
