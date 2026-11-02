# Saved Scenes — Scenic Folio A

Approved November2,2026. Implements the selected leather/parchment scenic folio with native Back to result, Attempt/Outcome tabs, large uncropped artwork, grouped optional scene notes, Previous/Next controls and a full-screen art view. All assets/provenance are in public/images/ui/saved-scenes-folio-a. Reuses the established result cream/emerald buttons and licensed local Tinos typography.

The viewer receives the original saved attempt record directly. No engine, cost, odds, scenes manifest, scene content or save-schema changes. Existing scene preference determines the initial view; subsequent selection is local only. Missing artwork uses the original phase/outcome fallback and an honest missing-art state if both fail. Full-screen and notes use native dialogs with Escape/focus return. Phones and short screens use an optional grouped notes dialog; long notes are scrollable there while the primary scene layout stays within the viewport.

Verification: scripts/validate-saved-scenes-folio-a.mjs tests both scenes at six desktop/phone/short/landscape sizes, complete notes, Previous/Next endpoints, uncropped decoded art, full-screen selection and Escape return, missing/fallback artwork, exact result return and unchanged serialized save. Test route interception uses neutral ranch art exclusively; production image paths remain untouched. The original receipt suite remains a regression check. Screenshots are actual runtime captures using the isolated neutral-art test fixture.

Publication remains on feature/ui-ranch-ledger-2026-09-29; PR21 draft/unmerged.

The same read-only viewer is available from Breeding Ledger → Complete record → Scenes, with Back to record preserving that exact historical selection. No new attempt is needed to revisit saved artwork. The refined v2 thin leather rim and native bottom sprigs keep controls clear of decoration.

Final production verification: optimized Next build/TypeScript PASS; scoped lint 0 errors (10 existing/native-image advisories); dedicated suite 29 states with zero frame/text/viewport findings and zero page errors, including archive fallback/missing-art views and long names.
