# Growth factors A — production integration

The user selected A's illustrated formula cards on October 17, 2026; implementation resumed and finished October 18. The selected desktop/phone board is retained at `public/images/ui/stats-growth-b/factors-a/approved-concept.webp`.

## Behavior

Growth factors now shows Species + variant, Innate grade and Young growth cards feeding into the selected attribute's base-growth contribution. A note explains the changing rate, activity bonuses and 135% cap. Current value, innate grade and the rounded formula remain visible. Cap cases explicitly say capped at 135%; an arrow avoids presenting a rounded/capped result as an exact product.

Progress, Growth factors, Forecast notes and Creature context are direct sections in the same native modal. Small screens retain Projection. Closing or going Back restores the same mode, creature, selected attribute and derived page. Everything remains read-only. The growth engine, activity bonuses, guaranteed-point rule and save schema are unchanged.

Desktop uses four compact cards in a row. Phones stack the factor rows and contribution, with a shared current-value/grade/formula panel. Short landscapes retain the full formula and controls in a compact horizontal composition. Explanatory notes and creature context remain accessible through explicit section buttons.

## Artwork

The three dedicated painterly ivory/gold icons are direct RGBA WebP images. The blank crest receives the real grade as live text. Untouched PNG sources, exact prompts, alpha/SHA-256 manifest, selected concept and deterministic packaging accompany the production files. `GameDialog` accepts an optional decorative title icon; callers without it retain their existing markup and behavior.

## Validation

The production Next build passed; focused ESLint has zero errors and three native-image optimization advisories. Both calculation regression tests passed. All 140 browser checks passed with no runtime errors and unchanged persisted saves. See `docs/validation/factors-a-results.json` and actual production-build screenshots under `docs/validation/factors-a-*`. Browser QA covers every attribute, all detail sections, selection retention, Escape/Back, loaded assets, containment, sibling overlap and byte-for-byte preservation of a synthetic save at seven viewport sizes. A separate phone case checks an S-grade contribution capped at 135%. Two existing calculation regressions compare natural and activity-seeded safety growth with the real engine.

The checkout is sparse. Its ignored breeding manifest was generated using the original generator over committed asset paths; unrelated absent legacy artwork uses a test-only fallback. All new UI icons and canonical Mira artwork must load from their real production paths. The generated manifest and test fallback are not published. The hosted project is protected; deployment readiness is verified through the exact commit's Vercel status.

PR21 remains draft and unmerged. Work Skills is a separate future menu review.
