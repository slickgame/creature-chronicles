# First-week guide and tutorial pacing

The opening guide now presents chores, town navigation, breeding/Nursery, and battle preparation in that order. Suggested days communicate pacing without locking destinations or requiring optional adoption, construction, or social activities. Existing opening artwork and story scenes remain in use.

Menu → Chapter 1 Guide includes Next lesson and First week views. Four lesson cards show real milestone counts, checklists, practical tips, and direct destinations. The overview remains available after skipping or completing the guided sequence. Reading it does not grant progress or rewards. Natural hatching counts; the one-time Catalyst remains optional.

Progress repairs:
- Persist earned chore and resource milestones so reassignment or daily counter rollover cannot erase them.
- Read current C2 Coliseum win records as well as legacy records; losses do not complete the battle lesson.
- Version 3 migration retains the original pre-version-2 town migration but does not invent town visits for version-2 saves.
- Route the hatch lesson to Nursery; overview Review Today opens the ledger independently of the active step’s end-day target.
- Remove the obsolete promise of an automatic battle coach; explain the actual queue/confirm/result-recording flow.

Validation: optimized Next.js production build and TypeScript pass. All 26 targeted cases pass (13 guided tutorial, 3 opening story, 10 C2 battle). Scoped ESLint reports zero errors and two pre-existing patterns (img and effect state update). Chromium production checks pass at 1440×900, 1280×720, 390×844, 360×740, and 844×390: four lesson selections, no horizontal dialog overflow, read-only overview, Nursery and Today navigation, skip cancellation/confirmation, and reference access after skipping. Screenshots visually reviewed. Existing illustration paths used neutral image placeholders during local UI checks because the checkout omits production artwork.

Next: early-game economy, resource costs, breeding pace, and introductory battle balance. No balance changes are part of this update. Branch remains draft and unmerged.
