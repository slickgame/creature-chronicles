# Inspect A — Illustrated Dossier runtime

The user selected A on the three-direction concept board and authorized all required visuals. This implements the selected navy/gold design across Overview, Stats, Work, Talents and Lineage plus their hover/focus/tap and complete-record windows. The preceding compact information architecture remains; the remaining seven Breeding Pen windows are still the next density pass.

## What changed

The five tabs now form one persistent icon-led enamel navigation rail above the creature/dossier stage. The registered full-body figure stays complete, including ears/feet, on the original pavilion. Content-sized navy/gold panels replace a large empty dark area; spacing adapts to short desktops and phones. The existing Tinos regular/bold fonts and substantial native wood/gold/emerald surfaces remain canonical.

Overview has individual illustrated vital plaques, actual Energy/Affection/XP meters, actual Hearts pips, current condition badges and illustrated parchment role chips. Large heart capacities use an exact ratio meter rather than truncating pips. Stats remains one six-row table with painted stat art, innate grade seals and actual growth meters; 0% draws no invented fill. Work uses the existing painted skill atlas, current level/XP bars and explicit Active/Planned labels. Talent cards retain full actual effects and source metadata, with canonical talent art and a generic star only for unregistered art. Lineage uses the actual risk, recorded parents and saved markers; complete long notes remain in Full ancestry. Missing-player/art views are honest named fallbacks.

BreedingHelpA now opens a matching wood/navy/gold full record dialog, and its tooltips share the same family. Help remains optional, read-only, keyboard accessible and explicitly clickable/tappable. Native modal/focus/Escape behavior is preserved. All existing authoritative values, role reasons, growth calculations, notes, selection and source-return callbacks are retained. Shared UI changes are optional style/navigation slots; their defaults are unchanged for other callers. No balance, costs, probabilities, schema, RNG, transaction or canonical creature-art changes.

## Assets and reproducibility

`public/images/ui/inspect-dossier-a` contains 20 new production graphics: one generated true-alpha painted botanical corner, 18 editable native SVG symbols and a native vital plaque. The untouched PNG master, exact built-in prompt, approved reference and manifest accompany them. Existing painted vitals/stat/work/talent icons and native surfaces/fonts are reused (28 files hashed in the manifest). Build symbols with `node scripts/build-inspect-dossier-a.mjs`; optimize/hash with `python scripts/package-inspect-dossier-a.py`.

No new paid service or font subscription was added. The generated ornament has no character, text, data or fake interface baked into it. Original reference bars/numbers are proposals; live presentation uses actual save values.

## Validation

- Optimized production Next build and TypeScript pass. Scoped ESLint has zero errors and nine image-performance advisories. React component/accessibility checklist applied.
- Seven focused breeding selection/preview/care tests pass; gameplay reducers are unchanged.
- Production-browser capture and read-only interaction checks pass all five sections at 1440×900, 1920×720, 2560×1440, 390×844, 360×740, 390×500 and 844×390. Main content fits without scrolling and the source-return action stays visible. No explanatory page selectors return.
- Every displayed dossier/character icon decodes. Six stat rows and actual Energy/Affection meter values are checked against the save. All six complete forecasts, role reasons, participant/source notes, player fallback and nested picker return remain accessible.
- Hover/focus/top-layer help, Escape dismissal, explicit click-accessible full text, long saved ancestry/ranch notes, twelve markers and a nine-entry short-phone talent collection pass. The serialized save remains unchanged. Reduced-motion mode is static. Zero page errors.

Evidence: `docs/validation/inspect-dossier-a/`; `results.json` records the checks. Screenshots use a disposable established-ranch fixture named Inspect A QA. Prepare it with `node --no-warnings --loader ./scripts/ts-test-loader.mjs scripts/prepare-inspect-dossier-fixture.ts /tmp/inspect-dossier-fixture.json`, then run `node scripts/validate-inspect-dossier-a.mjs` after the production build. Playwright/Chromium paths are environment-specific and configurable through the script's established setup.

This workspace uses a partial checkout of large breeding-scene files; the ignored scene manifest was reconstructed from the repository's exact tracked filenames for local build/tests. No scene file or manifest is published by this change. The full hosted build generates its normal index from real assets. Hosted UI verification is separate from the isolated local checks. Keep PR #21 draft/unmerged.
