# Ledger A: End Ranch Day and clearer priorities

The user removed the start-day button and requested clearer food, nursery and
farm-work information. This continues the approved Ledger A design.

## Updated behavior

- The ledger footer always says **End Ranch Day**. It opens the existing night
  review, including from a morning save. Only **Sleep & Advance Day** advances
  the date and consumes overnight food. **Keep Playing** cancels the review.
- Removed NavigationChrome’s morning redirect, which otherwise sent the new
  footer action straight back to the ledger. Day-end transaction protection
  remains in the existing provider and lifecycle reducer.
- The optional Chapter 1 guide records an explicitly requested Morning Brief
  in any phase and targets the Brief tab. It no longer instructs the player to
  press the removed Begin Ranch Day control. Ordinary ledger browsing stays
  read-only.
- Nursery shows **N incubating · N ready**, counts current egg statuses and
  excludes hatched history. Complete details explain incubation at day end,
  manual hatching and available habitat space.
- Food now says **N / N food units ready for tonight** and **Enough for tonight**
  or an explicit shortfall. Paged help explains nightly demand, feeding order,
  reserves, diet-compatible ingredients and manually served bonus meals.
- **Manage food** opens the existing Feeding screen directly, returning to the
  same ledger entry on close. Feeding uses the exact same current overnight
  projection as Ledger and End Day, including earned daily rewards paid before
  feeding. Its separate seven-night Budget remains a stock-only forecast with
  its original assumptions.
- Farm work lists gathering crops/materials, milk production, hunting, cooking
  and crafting. Its existing counter only measures gathering, so the label is
  now **gathering actions today**. The available-worker count checks every work
  location rather than assuming only the Woodlot matters.
- Phone and short-landscape help pages use smaller text budgets so full
  explanations remain reachable while keeping the footer inside the viewport.

## Current food rules, verified from the engine

`ranchJobsPredator.getDailyFeedCost` assigns two units to bovines/equines and
one unit to other residents, plus one extra for Rare/Epic variants. Creatures
away at Training Grounds are excluded from home feeding. Each ration or
diet-compatible ingredient covers one unit.

`planIngredientFeeding` uses unreserved Balanced rations, then permitted raw
ingredients if enabled. The overnight reducer applies older generic Feed to
the remainder. Prepared bonus meals are not consumed automatically. Reserves
protect food from feeding and other spending. Cooking one ration batch costs
2 Wheat + 1 Vegetable and yields 4 Balanced rations; recipe proficiency changes
Energy cost rather than that ingredient ratio.

Ledger, Feeding and night review use `projectRanchDay` without consuming supplies
while browsing. The Budget is intentionally a separate seven-night forecast.

## Validation and evidence

- Production build and TypeScript passed.
- ESLint: zero errors, nine native-image advisories.
- Focused data suites: 36 tests passed, including current egg-status counts,
  harvest-capable workers, direct morning review/cancel/advance, feeding diets,
  reserves, actual overnight projections and guided-lesson targeting.
- `validate-daily-ledger-a.mjs`: 214 browser checks passed across eight desktop,
  phone and short-window sizes, all six tabs, long records, empty states,
  event transactions, navigation returns, end-day cancel and resident identity.
- `validate-ledger-clarity.mjs`: 21 focused browser checks passed: food route,
  matching projections, canceled feeding settings, 2 incubating/1 ready egg
  states, read-only browsing, morning review, unchanged food before confirmation,
  exactly one day advanced on confirmed sleep and End Ranch Day next morning.
- Total: 271 checks, no browser runtime errors.
- Actual screenshots and results: `docs/validation/ledger-clarity-*`. Egg-count
  screenshots use a test save; no user save is changed by verification.

Sparse-checkout recovery rebuilt the ignored breeding-art manifest with the
existing generator using tracked Git path metadata. No substitute images or
breeding changes are included.

Plugin discovery confirmed Figma, Adobe and MagicPath are installed. This pass
keeps the approved A frames, artwork and fonts; it does not create external
design files or change plugin permissions. PR21 remains draft and unmerged.
