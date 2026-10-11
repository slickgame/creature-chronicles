# Randomized Guild requests, weekly rerolls and personal quests

The former commission board used fixed week-index rotations and had no reroll action. Requests now use save-specific seeded randomness for commission selection, battle targets, legacy request selection, quality and payouts. Reopening/loading preserves the current board. A safe starter service remains guaranteed on new weekly boards.

## Rerolls and calendar
- Board & Reroll opens the current week's count, cost and confirmation.
- Base prices: 50, 100, 150 Gold, increasing by 50 per successful reroll.
- Only available/unaccepted slots are replaced. Accepted requests keep IDs, baselines and progress; completed requests stay completed. Insufficient funds, empty boards and stale confirmations cannot charge.
- Sunday-to-Monday overnight processing replaces expiring weekly notices and resets reroll count to zero. There is one free weekly refresh, not two separate refreshes at the boundary.
- Board version and reroll count are persisted in Guild state. Existing boards keep their notices. Existing pre-commission saves receive the new categories once. No save reset required.
- Personal quests persist across both paid rerolls and weekly refreshes.

## Mara and Pella
Three sequential quests per NPC, each explicitly accepted and claimed. Work objectives snapshot counters on acceptance; previous work cannot instantly finish them. Rewards per stage: 40/75/100 Gold, 5/8/12 GP and 10/15/25 Trust.
- Mara: finish one Guild request; complete four helper shifts; finish two more Guild requests. Final perk: 10% cheaper board rerolls (45/90/135 Gold initially), applied after escalation.
- Pella: retain ten Feed and four Materials (no consumption); complete two Guild deliveries; complete four helper shifts. Final perk: 10% cheaper supply prices, with any better existing Trust price taking priority.
- Guild deliveries now increment a persistent completion counter. Existing chore and lifetime Guild counters support the other objectives.
- Quest claims are once-only, sequential and revalidate current requirements.
- Entry: Guild → Mara’s Desk → Requests & Trust; Supply Depot → Talk → Requests & Trust.
- Reuses approved NPC portraits and existing parchment UI. No new image generation or reward items required.

## Verification
- Production Next.js build and TypeScript pass.
- 43 focused tests pass: five commission, seven weekly/quest, seven ranch-day, three planner, ten C2 and eleven C4.
- Includes actual Sunday overnight projection, ordinary-night stability, saved reroll persistence, exact costs, no-funds/no-open/stale blockers, accepted/completed preservation, quest baselines, non-consuming reserve check, delivery tracking, both final perks and duplicate claim rejection.
- Scoped ESLint: zero errors, 19 existing-style image/effect warnings.
- Production Chromium at desktop 1440×900, phone 390×844 and landscape 844×390 verifies scrolling dialogs without horizontal overflow, reroll cancellation/exact charge/increasing cost, Mara acceptance, Pella acceptance/exact reward/unchanged stock and next quest unlock. Screenshots visually reviewed.
- Local browser art is substituted with neutral placeholders because this checkout omits most existing production images. No fixture, screenshot or local generated-manifest stub is published.

Publish to the existing preview branch only. PR #21 remains draft/unmerged.
Next proposed: Selene’s breeding/nursery quest chain, followed by battle opponent and move variety.
