# Chapter 3 Act II — Patron Circuit manual validation

Automated tests and the production build run in GitHub Actions. These browser and iPhone checks remain deferred until manual testing is practical.

## Setup

1. Use a save that completed **The Guild Exhibition**.
2. Return to the Ranch Hub.
3. Confirm the launcher reads **Chapter 3 · Act II**.
4. Confirm the Act I launcher is no longer visible.
5. Confirm the Patron Circuit journal opens automatically once and can be reopened.

## Invitation and sponsor choice

1. Review all three offers.
2. Confirm each card displays host, location, assignment summary, and permanent effect.
3. Choose each route on separate saves.
4. Reload immediately after choosing and confirm the selected sponsor cannot reroll.
5. Confirm choosing one route does not remove access to the other two town locations.

## Registry Sponsorship

1. Complete the assignment with zero spare Gold, Feed, Materials, and player Energy.
2. Advance one Ranch Day.
3. Sign the charter.
4. Open the Guild Hall during the same week.
5. Confirm unfinished contracts gain +4% Gold and +1 Guild Point beyond their pre-charter values.
6. Reopen the Guild Hall repeatedly and confirm the bonus does not stack again.
7. Advance to a new week and confirm new contracts receive the bonus.
8. Confirm completed and expired contracts are unchanged.

## Petra's Works Charter

1. Complete the assignment and advance one Ranch Day.
2. Confirm signing grants 4 Materials.
3. Visit the Builder's Yard.
4. Confirm every unbuilt project displays a 10% charter discount.
5. Confirm displayed Gold and Materials match the amount deducted.
6. Confirm prerequisites and locked states remain unchanged.
7. Build a project and confirm it cannot be purchased twice.
8. Confirm already completed projects are not refunded or altered.

## Rose Lantern Hospitality Charter

1. Choose the Rose Lantern route without previously accepting its house rules.
2. Confirm the assignment button remains unavailable.
3. Acknowledge the adult, optional, consent-first house rules.
4. Confirm the assignment becomes available.
5. Confirm the public reception text states that romantic or sexual participation is not required.
6. Advance one Ranch Day and sign the charter.
7. Confirm +5 House Trust and +2 Rumor Tokens are granted once.
8. Visit the Rose Lantern and confirm the charter panel shows the exact shift bonus.
9. Work one hospitality shift and verify:
   - normal 15 Energy cost;
   - +10 bonus Gold;
   - +1 extra House Trust;
   - +1 extra Rumor Token.
10. Confirm the bonus cannot duplicate by reopening the venue.

## Shared reward and persistence

For every route:

1. Confirm signing grants 175 Gold and 3 Guild Points exactly once.
2. Confirm the Act I exhibition representative gains 15 XP and 2 Affection when still present.
3. Confirm a missing former representative does not break completion.
4. Reload before and after the next-day transition.
5. Confirm assignment day, report state, sponsor, rewards, and history persist.
6. Attempt to sign the charter again and confirm no resources or creature progress change.

## Desktop layout

- Launcher remains inside the viewport.
- Modal remains centered and internally scrollable.
- All three sponsor cards fit without horizontal overflow.
- Long effect descriptions wrap inside their cards.
- Active bonus values remain readable in the sidebar.

## iPhone portrait

- Launcher respects top and side safe areas.
- Close control remains reachable.
- Sponsor cards and consent acknowledgment button remain at least 44px tall.
- The full assignment, waiting, and report states can be reached through internal scrolling.
- No horizontal scrolling is required.

## iPhone landscape

- Hero does not consume the entire viewport.
- Close control remains visible.
- Sponsor choices, progress, bonuses, and history remain reachable.

## Regression checks

- Chapter 1 guided onboarding remains unchanged.
- All three Chapter 2 acts remain accessible in order.
- Chapter 3 Act I scoring, placements, rewards, and Guild reputation remain unchanged.
- Ordinary Guild contracts still refresh, accept, complete, and pay once.
- Ordinary Builder costs remain unchanged before the charter.
- Ordinary Rose Lantern shifts remain unchanged before the charter.
- Predator events, Ranch Day transitions, Coliseum, breeding, Nursery, Market, inventory, and portable save transfer remain functional.
