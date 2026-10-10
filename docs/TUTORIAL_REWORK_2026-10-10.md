# Chapter 1 tutorial revision — 2026-10-10

The opening hands off to a flexible sequence: morning brief, Security and a second chore, overnight results, a resource decision, town navigation, a Guild request, returning to the Ranch Office, team preparation, Opening Scrimmage, then breeding and nursery care.

Town and Adoption Hearth visits now count when the actual screens open. Browsing requires no purchase. The Ranch Office visit teaches where records and the story log live. Lessons use phase names instead of fixed Day 1–5 deadlines. Hatching copy explicitly supports natural hatching or the existing one-use catalyst.

Version 2 preserves old saves: completed Guild work in version 1 satisfies the newly added town visits; unfinished town work receives those lessons. Existing creatures, names, species artwork, breeding guarantee, rewards, and catalyst grant/consumption rules are unchanged. Early completed actions still count. The guide remains under Menu, with no floating tutorial bubble.

## Validation

- Next.js production build passed; final TypeScript check passed.
- Nine guided tutorial tests and three opening tests passed. New cases cover the revised sequence, legacy town migration, and migration idempotency.
- Browser opening checks passed at 1440×900, 390×844, and 844×390: all six pages, controls inside viewport, page-two reload/resume, and first-morning handoff without advancing the day or changing creatures.
- Browser Skip Opening keeps the tutorial enabled.
- Browser town and Adoption Hearth links persist visit flags and advance the guide to the Guild request without a purchase.
- Approved porch art was restored from Drive and reviewed in phone portrait and landscape. Other artwork is missing from this recovered local checkout, so complete asset loading and visual approval of the full opening remain pending. No placeholder artwork or generated local manifest is published.

PR #21 remains draft and unmerged. Matching title-menu art integration remains a subsequent pass.
