# Stats & Growth follow-ups B — October 17, 2026

The approved comparison board is retained at `public/images/ui/stats-growth-b/references/followups-b.webp`. The main creature shell, canonical artwork, navigation and equipment flows remain shared with the existing dossier.

## Runtime

`StatsGrowthLedger` now compares all six current and next-level attribute values, highlighting actual base-growth gains. The summary uses the approved Experience star and Energy bolt. Selecting a row opens `GrowthDetailWindow` with current value, innate grade, actual fractional progress, next-level contribution and projected remainder. Growth factors switches inside that window and provides three explicit pages containing the formula, caveats and creature context. Closing by Close, Escape or Back preserves the mode, selected attribute and its derived page.

The normal desktop comparison contains six compact rows. Shorter windows and phones page rows; phone and landscape details use Progress/Projection sections. No overflow is hidden as a substitute for accessible content.

## Data integrity

`growthLedgerPreview` uses the existing growth engine without changing it. Natural whole-point gains and maximum Energy match the base-growth level-up. If no natural point completes, the engine's guaranteed point depends on the activity seed: each possible attribute and Energy result is shown as a range rather than a fabricated exact result. The window explains this case. Activity-specific bonuses can change final growth. Estimates use the current rate and explicitly say that it changes with level.

Both entry points are read-only; opening, switching and closing them spends nothing and never levels up a creature. Empty real progress remains empty. The reference board contains sample data and is not a source of game values.

## Validation

Production Next build passed. Focused ESLint has zero errors (five existing native-image optimization advisories). Two regression tests passed; regression tests compare the preview with real engine results and every safety-growth seed outcome, including preservation of the input creature. All 97 browser checks passed at 1920×960, 1440×900, 1920×720, 2560×1440, 390×844, 360×740 and 844×390, with no runtime errors and an identical persisted save after all read-only flows. Checks cover containment, sibling overlap, loaded kit assets, every attribute, Progress/Projection, all three factor pages, Escape/Back and selection retention. Actual browser evidence and viewport results are retained under `docs/validation/growth-followup-*`. Browser QA uses a synthetic save and unrelated missing legacy artwork fallbacks; every new production UI asset must load from the real kit. Hosted preview verification is deployment-status based because the project is protected.

Work Skills remains a separate, pending menu review. PR21 stays draft and unmerged.
