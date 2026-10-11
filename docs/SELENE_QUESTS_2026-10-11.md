# Selene's breeding and nursery lessons

Adds three sequential, non-expiring personal quests through Egg Atelier → Talk or Trust Ledger → Requests & Trust:
1. A Thoughtful Pairing: complete one valid breeding session after acceptance. Any resolved outcome counts; invalid/canceled actions do not.
2. Read the Nursery Notes: open an unhatched egg's free appraisal and explicitly record the review. No upgrade, paid service or egg consumption is required.
3. A New Arrival: hatch one egg after acceptance. Prior hatches do not count. Existing and purchased eggs qualify.

Rewards are 40/75/100 Gold, 5/8/12 GP and 10/15/25 Trust. Final perk applies 10% off the Gold price of all three Atelier services after current Trust/upgrade reductions, rounded up. Nursery Kit costs, success odds, one-use restrictions and upgrade/egg-offer prices remain unchanged. The Trust Ledger reports the perk and service reviews use the same discounted cost as transactions.

A monotonic breeding-session counter avoids relying on retained history length. Appraisal recording validates the active lesson, selected unhatched egg and previous completion. Hatching uses the existing cumulative hatch counter. Existing saved quests and NPC perks remain intact; no reset is needed.

The shared quest panel now uses explicit per-NPC perk descriptions and contextual destination buttons. Returning to the Atelier from its own quest dialog closes the dialog correctly. Existing Selene portrait and parchment assets are reused.

Validation:
- Production Next.js build and TypeScript pass.
- 29 focused tests pass: five Selene quest/service, seven weekly Guild/quest, seven general-talent, three inheritance-clarity and seven ranch-day tests.
- Scoped ESLint: zero errors, nine image-element warnings.
- Production Chromium checks at 1440×900, 390×844 and 844×390 verify quest dialog fit without horizontal overflow.
- Browser flow covers initial breeding reward, appraisal acceptance/navigation/recording with unchanged eggs and money, appraisal reward, hatch acceptance, exactly one hatch, final reward and permanent perk.
- Hatch creates the creature before the reveal. Confirm Hatchling finishes the reveal; merely viewing egg details does not count.
- Screenshots reviewed. Local image placeholders are used because most existing production assets are absent from the sparse checkout. No local manifest stub, test save or screenshot is published.

Publish only to the existing preview branch; PR #21 remains draft and unmerged.
Next proposed: distinct battle opponent teams and a focused batch of new moves, followed by reward balance.
