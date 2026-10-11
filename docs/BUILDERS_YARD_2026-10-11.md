# Builder's Yard: construction and useful ranch expansion

Replaces the old scrolling, nested Yard modal with a dedicated scenic workshop using the existing approved builder-town background. Land, Habitats, Security and Future Plans tabs hold paginated blueprint choices. A crew card, parchment benefit/cost panel, work ledger and native confirmation/security/receipt dialogs keep desktop and phone controls readable. The work ledger stays accessible in short landscape viewports. Supply Depot navigation is available directly. No new raster assets or placeholder images are shipped.

## Gameplay

- One active work order at a time. Full Gold and Materials costs are charged on explicit confirmation; attempts to commission twice or while busy are rejected without mutation.
- Land and security projects take one Ranch Day, except Woodline Acre (two). Benefits apply only when the new-day lifecycle completes the order. The completion appears in the day summary and morning highlights.
- Habitat Annexes: 1200 Gold, 20 Materials, two days, North Pasture prerequisite; adds one slot to each of the five current family habitats.
- Nursery Extension: 1000 Gold, 18 Materials, two days, North Pasture prerequisite; adds two egg slots.
- Both additions stack with Ranch Office upgrades. Habitat records synchronize on completion; nursery capacity uses the same shared effects calculation as existing gameplay.
- Existing future-species buildings move to Future Plans and cannot be purchased until those species have gameplay. Previously completed projects remain recognized, including their existing pressure/security effects.
- Work orders persist in a versioned save flag. No reset or save-schema migration required. Existing completed projects remain complete.
- Fixes Town's circuit progress count to exclude the optional exhibitions from the twelve required bouts.

## Verification

Optimized production build and TypeScript passed. 23 focused cases passed: 12 builder/construction tests, seven Ranch Day tests and four predator-event tests. Coverage includes exact costs, insufficient resources, prerequisites, busy crew, duplicate completion, legacy buildings, capacity stacking, normalization, actual one/two-day completion and morning reporting. Scoped ESLint: zero errors; seven image-element/existing-effect warnings.

Production Chromium checks at 1440x900, 1280x720, 390x844, 360x740 and 844x390 cover all categories, main-screen fit, native review dialog overflow/Escape, cancellation without charge, exact paid resources, disabled competing work, blocked future plans, work ledger, security handoff, reload persistence and Supply Depot navigation. Screenshots reviewed. Local QA uses temporary image placeholders because production art is absent from the sparse checkout; placeholders and QA saves are excluded from publication.

Next update: Rose Lantern UI and gameplay, including clearer activities, relationship progression, useful rumors and rewards. PR remains draft and unmerged; publish the existing feature branch preview only.
