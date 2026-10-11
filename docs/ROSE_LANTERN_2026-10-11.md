# Rose Lantern: social activities, requests and useful information

Replaces the nested scrolling venue modal with a dedicated scenic screen using the approved Rose Lantern town background. Salon, Hospitality, Rumor Network and House Requests have separate tabs, visible costs/rewards, readiness reasons and native review dialogs. The ledger holds reports, recent history, current perks and service navigation. Existing optional adult house rules remain; no explicit scenes are added.

## Gameplay

- Existing salon and shift costs remain 10 Gold / 15 Energy respectively, once each per ranch day. The screen shows exact current shift pay and all rewards, including tokens.
- Three sequential house requests count activities after acceptance; current Trust counts immediately. Rewards are 70/120/200 Gold, 3/5/8 GP and 3/4/5 Trust. The final request requires 35 Trust and grants a permanent +10 Gold per hospitality shift.
- Rumors now offer Ranch Safety, Construction News, and Guild & Market topics. Each costs one token, once per topic per day. Reports use current ranch threat, actual work orders/materials and the next Monday refresh. Reports are dated; recent reports remain available without another payment.
- At 15 Trust, a weekly supply favor exchanges two tokens for three Feed and two Materials. It resets Monday and cannot be collected twice in the same week.
- Receipts separate automatic starter-goal bonuses from the selected activity's rewards and show current balances, including Feed and Materials.
- Existing save flags gain additive defaults for shift/rumor counts, topic dates, favor week and request progress. Trust, tokens, visits and prior history are retained. No reset required.

## Validation

Production Next build and TypeScript pass. 17 focused tests pass across Rose Lantern, vacation/save integration, and mobile/town entry checks. New cases cover legacy normalization, exact daily costs, daily/weekly limits, access restrictions, request baselines, a complete three-request run, once-only rewards and the permanent pay bonus. New Rose files pass ESLint without warnings; Town retains six existing warnings, with no errors.

Production Chromium checks cover all tabs at 1440x900, 1280x720, 390x844, 360x740 and 844x390, contained main screens and dialogs, house rules, acceptance, cancellation without payment, exact activity transactions, automatic tutorial bonuses, duplicate blocking, reload persistence, ledger/Guild navigation and the final request's one-time reward. Final request layout is checked in phone portrait/landscape. Screenshots visually reviewed.

The sparse local checkout omits production images; temporary placeholders were used for browser layout checks. No placeholders or QA fixtures are published. The existing approved background is reused; no new artwork is generated.

Next: first-week tutorial and introductory quest pacing, connecting chores, breeding, town services, mission board, battle preparation and construction without overwhelming the opening. PR remains draft and unmerged; deploy the existing feature preview branch.
