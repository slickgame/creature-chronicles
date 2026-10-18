# Care B runtime — October 18, 2026

The ranch creature Care tab now uses the selected B split: a health/status/resource panel beside identity/protection and transfer/removal groups. References are `public/images/ui/care-b/approved-concept.png` and `refined-concept.png`. This document describes actual game integration, separate from the concept sheets.

## Behavior

- CareLedger receives the existing CollectionScreen callbacks and actual management status. Non-ranch and breeding callers retain their presentation.
- Distinct painted icons cover Healthy, Hurt, injury, Tired, Exhausted, Recovering, Training and Pregnant. Injury severity and pregnancy duration retain the engine's exact label. Portrait and Care badges share status colors. Recent breeding remains informational and does not invent an action block.
- Energy and Affection display exact values and normalized fills. Low Energy uses amber/red treatment at the existing Tired/Exhausted bands. Hearts up to five show individual full/empty/partial symbols; above five, one gold heart plus exact current/max and a gold fill bar. No maximum-five cap or approximate heart grouping.
- Open padlock with **Lock creature** means currently unlocked. Closed padlock with **Unlock creature** means protected. Protection saves to the selected creature and existing removal guards remain active.
- Rename opens the existing callback in a matching focused dialog. Cancel does not write. Release/Donate open the existing confirmation flow, including protected-creature blockers and unchanged donation rewards.
- Health details contain paged status, exact resources, origin, strongest attributes and protection information. Long text splits into bounded pages without discarding content.
- Phone uses Care/Management focus tabs. Shorter windows page Identity & protection and Transfer or release. Short landscape places paired management actions side by side. No scrolling or clipped actions is required at validated sizes. The compact phone portrait applies to Care as well as Work Skills, Talents and Lineage.

## Asset kit

Seventeen individual true-alpha painted runtime WebP files are in `public/images/ui/care-b/icons/` (about 740 KB total). Unchanged PNG masters are in `source/`, with the service original at `service-mission.png`. Exact built-in generation prompts are in `manifest.json`. Runtime exports use a 384-pixel maximum edge, quality 94 and preserved alpha. Existing panel/button/window frames and Energy/Affection icons are reused; labels and badge text remain live text.

Sick and service-mission artwork are reserved. Illness remains deferred, and current guild service contracts finish immediately. No new sickness, forced rest, service timer, away-state inference or gameplay restrictions were added.

## Verification

Story: Ranch Roster → Care → existing GameProvider actions → save reducers/localStorage → refreshed status, resources, name/protection and existing removal result. This feature has no new API route or environment variables.

| Boundary | Evidence |
| --- | --- |
| Build and types | Production Next build and TypeScript pass. |
| Focused source lint | Zero errors; three native-image optimization warnings in CareLedger. |
| Existing regressions | 16 tests pass across general talents, nursery care and permanent ancestry. |
| Actual browser flow | 124 checks pass in `validation/care-b-browser-results.json`; zero runtime exceptions. |
| Saved changes | Lock/unlock and rename persist to the exact creature. Canceling rename/removal and browsing health preserve the save. Confirmed donation removes exactly one creature, grants existing rewards and retains archived ancestry. |
| Responsive behavior | Care, management, removal and details checked at 1440×900, 1280×720, 390×844, 360×740 and 844×390. Seeded Tired, Exhausted, Hurt, Wounded and Training states verify real status labels, matching portrait badges, loaded artwork and viewport bounds. |
| High heart count | Actual 16/16 and 12/16 states show one normalized bar; 12/16 fills 75 percent. |

Browser proof uses the existing isolated QA starter save. Additional edge states are seeded into that isolated save, not into a user's live save. The sparse checkout's missing unrelated background art uses the established QA fallback; Care B assets never use that fallback and their successful image loads are asserted.

Actual captures: `validation/care-b-main-1440.webp`, `care-b-main-390.webp`, `care-b-management-390.webp`, `care-b-tired-1440.webp`, `care-b-tired-390.webp`. Pre-redesign captures remain separate as `care-before-*`.

PR21 remains draft and unmerged. Deployment status must be checked against the exact published source commit before reporting deployment complete.

## Next visual review

Review the existing creature Release/Donate confirmation windows against the new Care interior, using actual current-game screenshots and concept options before changing their visual direction. Timed service missions are a separate gameplay project.
