# Habitat A — live courtyard & care

The user selected A and requested matching assets, font types, sizes, spacing, layout and icons, with resident levels added beside names and status. Reference: `public/images/ui/habitat-review/options.png`, first band.

## Result

Habitat retains its family-specific sunny courtyard and canonical full-body artwork, with the approved navy/gold interface: bounded ornate shell, slim occupancy strip, content-sized care inspector, emerald Feed button, compact paged resident dock and explicit destinations. Wood/parchment surfaces and duplicate Management/Ranch House destinations were removed from the main view. The full profile and management entry points remain available.

The resident bar shows **name, Level N, actual status** for every creature, so identical names can be distinguished by level. It pages up tothree compact tiles according to available width; phones retain name/level/status together. Empty habitats explain automatic family housing and retain their Breeding route.

Tinos Regular400 and Bold700 are explicitly loaded. Native frames and shallow button masters preserve crisp gold ornament. A generated ivory/gold feed-sack icon matches the existing painted family; its untouched alpha PNG master, runtime256px WebP, prompt and hashes are retained. Existing painted profile, habitat, paw, lineage, management, condition and vital icons are reused directly. Asset-by-asset mapping and dimensions: `public/images/ui/habitat-a/README.md`; native builder: `scripts/build-habitat-a-assets.py`.

Energy and Affection bars use actual saved fractions. Hearts use actual full/empty/partial pips throughfive; larger totals use an exact numeric value and meter. The phone layout stacks scenery/care/dock and a compact destination row. Short landscape keeps a side-by-side composition. Short phones compact the vitals without concealing the creature art. Explicit Minimize/Expand remains reachable through More where necessary.

No housing assignment, feed costs, progression, illness, cleaning or service mechanics changed. Feed retains existing Energy/Affection caps and training restrictions. Existing complete profile records, rename, protection, release/donation and permanent equipment-return/ancestry behavior remain. Management protection now uses the approved open/closed lock artwork and Lock creature/Unlock creature wording.

## Validation

- Production Next.js build with TypeScript: passed.
- Targeted ESLint: zero errors, five native-image warnings.
- `scripts/validate-habitat-a.mjs`: **93 checks passed**, no browser runtime errors.
- `tests/creature-removal.test.ts` and `tests/nursery-care.test.ts`: **10 passed**.
- Viewports1440×900,1280×720,1920×720,2560×1440,390×844,360×740,844×390 and390×500. Checked viewport containment, primary actions, actual art loads, all three vitals, font family, resident name/level/status and read-only browsing.
- Actual feed values and fill ratios; minimize/expand; eight full-profile sections; lock persistence and removal blockers; seven same-name residents distinguishable through levels and paging; long24-character protected names;6.5/8hearts; rename/removal cancellation; last-family-resident release; empty-habitat controls including minimized art; training-disabled feeding and Back to roster.
- Save normalization may grandfather a crowded fixture's capacity to its resident count. QA compares the displayed capacity to the normalized save, never a guessed fixture number.

Actual-game screenshots: `validation/habitat-a-desktop-1440.webp`, `habitat-a-phone-390.webp`, `habitat-a-landscape-844.webp`, `habitat-a-short-phone.webp`, `habitat-a-resident-levels.webp`, `habitat-a-empty.webp`. Full browser result: `validation/habitat-a-results.json`. Screenshots visually reviewed against A for proportions, typography, icons, ornament, hierarchy and responsive density. Sample maxEnergy is engine-derived and may differ from the concept's illustration.

The local sparse checkout omits some unrelated legacy art. Browser QA substitutes only missing unrelated assets; all new Habitat kit assets and the visible courtyard/creature art are real. No QA fixtures/placeholders were added to runtime.

Publish to `feature/ui-ranch-ledger-2026-09-29`; PR21 remains draft and unmerged. Preview deployment success must be checked against the exact published commit before calling it live.
