# Farm planning pages — 2026-10-13

Guide, Construction and Orders now open in a full-screen parchment book with one entry per page. A section selector connects the three; a quick-select menu and previous/next buttons navigate four guide steps, seven facilities and four orders. Rules, step instructions and project benefits use focused popups. Exact bills and rewards remain visible, and spending still requires confirmation.

Existing construction, prerequisite, reserve, shared-crew and once-only reward logic is unchanged. Receipts distinguish additional save-time goal rewards from the transaction. A synchronous action guard prevents repeated confirmation clicks from applying the same transaction twice. Back returns to the resource section menu.

## Art provenance

Reuses approved `public/images/ui/ranch-dossier-v1/parchment.webp`, `public/images/ui/resources-v2/wood.webp` and `planks.webp`. No new generated artwork or generation prompts in this update. Existing painterly resources and parchment styling remain intact.

## Verification

- Direct optimized Next.js production build passes (`npx next build`; sparse checkout lacks legacy breeding images required by the separate asset prebuild).
- Scoped ESLint: zero errors, two existing native-image optimization warnings.
- 19 relevant construction/production/economy regression tests pass.
- All 15 pages measured without overflow at 1440×900, 1280×720, 390×844 and 844×390; desktop and phone screenshots reviewed.
- Browser order acceptance, cancel, exact 8 Wood delivery / 100 Gold / 3 GP reward, completed state and repeated-click protection pass.
- Browser construction cancel, exact 220 Gold + 4 Planks + 4 Stone charge, repeated-click protection, next-day project scheduling and reload persistence pass.
- Seven-day deterministic starter simulation: 1,200 starting Gold, 1,762 ending Gold, quarry completed, starter gear +3, all nightly feeding covered. Existing progression rewards are included; this is route viability, not a full balance claim.

## Next

Compare novice and experienced workers across gathering, cooking and construction. Audit prerequisite/source navigation, especially ingredient shortages and return paths. No economy coefficients changed in this UI update.
