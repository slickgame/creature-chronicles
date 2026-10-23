# Scenic Nursery A runtime

The user approved Scenic Nursery A, egg arrows/counter/Choose egg, five interchangeable species shells and neutral ornament without clovers. The runtime uses independent room/rear-cradle/egg/front-cradle layers, native navy/gold surfaces, Tinos regular/bold and existing painted icons.

Base Species/Type labels are Cat/Cat, Dog/Dog, Cow/Cow, Rabbit/Rabbit, Horse/Horse. Named variants retain their actual Type. This is presentation only; saved IDs, nursery timers, habitat blockers and breeding rules are unchanged. Canonical `portraitPath` busts are used for pregnancy, birth and hatch results; current residents show name, level and status.

Choose egg is paged. Previewing and Cancel/Escape are read-only; Select changes UI selection. Existing ready-first sorting is retained. Phones use Browse eggs/Selected egg. Short phones and landscape use Care/Actions pages. Long inheritance notes have explicit pages. Existing hatching and removal safeguards, records and source-return navigation are preserved. NurseryBook's scenic theme is opt-in, preserving other callers.

Implementation: NurseryScreen.tsx, NurseryScene.tsx, NurseryScenic.module.css, optional NurseryBook theme, and nurseryPresentation.ts. Assets: `public/images/ui/nursery-scenic-a/`, including unchanged source PNGs, WebP derivatives, approved concept and hash manifest. Build asset script: `scripts/build-nursery-scenic-assets.mjs`.

Verification runs `node node_modules/next/dist/bin/next build`, TypeScript, ESLint, `tests/nursery-care.test.ts` and `scripts/validate-nursery-scenic.mjs`. The browser suite covers seven viewport sizes, scene/care/picker/detail pages, image decoding, read-only browsing and cancellation, source return, double-click hatching, saved results, pregnancy/birth records, a 23-egg picker and an empty nursery. Screenshots and results are in `docs/validation/nursery-scenic-a/` and use an isolated QA save.

Recovery verification: production build/TypeScript pass; all 71 browser checks and both nursery data tests pass (73 total); zero browser runtime errors. Scoped ESLint has zero errors and nine native-image optimization advisories.

The original workspace containing local commit 5e6cd3cf disappeared before its blocked GitHub push could be retried. The recorded implementation and unchanged generated PNGs were restored into the same branch and reverified before publication; the recovery commit has a new SHA. No design options were regenerated. A sparse checkout lacks unrelated breeding image pools, so the repository's image-manifest generator and production Next build are run directly; validation code is unchanged. Hosted status is reported separately from local production-build evidence.

PR #21 must stay draft/unmerged. No farming, feeding, incubation, breeding or equipment mechanics are changed. All individual assets and source PNGs are committed. The separately delivered `nursery-scenic-a.zip` archive exceeds the publishing connector's request-size limit and is not part of the repository.
