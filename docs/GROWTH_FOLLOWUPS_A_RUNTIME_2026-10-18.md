# Growth follow-ups A — October 18, 2026

The user selected compact cards A for Forecast notes and Creature context, then approved clearer explanations and explicitly confirmed equipment must not influence permanent level-up attributes.

Forecast notes uses three framed cards: changing growth rate, extra task/event growth rewards, and the guaranteed attribute point. It explains 100% completion and remainder carryover, and states equipment bonuses are added separately. Growth factors and Progress also replace the vague player-facing word “activity” with task/event rewards.

Creature context uses a compact identity strip, Experience star with live XP fill, Maximum Energy bolt with honest ranges, strongest attributes including ties, and the selected attribute's value, innate grade and real growth meter. Both follow-ups retain the current direct section buttons and Back/Escape return behavior. Existing painted icons and native ornamental frames are reused. No new raster assets or game mechanics are introduced.

Equipment separation audit: applyCreatureLevelGrowth in src/data/levelGrowth.ts operates on creature.stats/statGrades, growthProgress, species/variant, level and explicit reward biases. It never reads equipment. Battle bonuses are applied by applyOutfitterStatBonuses in src/data/battleOutfitterIntegrationC3.ts after base battle stats are calculated. Existing level-up callers pass creature records rather than equipped combatant stats. No balance or save changes were necessary.

Validation: production build; focused ESLint (zero errors, existing native-image warnings); two growth-preview tests and four battle-outfitter integration tests. Browser validation covers seven desktop/phone/short/wide viewports, all six attributes, direct section navigation, return selection, XP fill, formula cap and byte-identical saves. Actual screenshots and detailed browser results are retained under docs/validation/followups-a-*.

Short landscape keeps all four context summaries in one compact row. Narrow phones stack the cards. Content remains accessible without clipping or hidden overflow.

PR21 remains draft and unmerged. Work Skills follows after visual acceptance of these sections.

Browser runner: `scripts/validate-growth-followups-a.mjs`, using a synthetic Mira save supplied through GROWTH_QA_FIXTURE and an existing output directory through GROWTH_QA_OUTPUT. It uses the installed primary-runtime Playwright/Chromium. The extra edge case sets all six attributes to 9 at level 90 with D grades to validate tied strongest attributes and the guaranteed-point Energy range together on a 360×740 phone.
