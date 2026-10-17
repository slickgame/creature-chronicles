# Stats & Growth B — approved runtime

The user chose the aligned ledger B and approved its full-page desktop and phone concepts. The new StatsGrowthLedger replaces only the ranch CompactStats rendering; breeding callers and equipment calculations retain their existing paths.

## Behavior

Six creature attributes show their current values, innate grades and actual growth progress. Selecting a row updates the inline detail strip. View full growth details opens the existing paged record dialog with the complete current and next-level projections, in matching slate/gold styling. Zero growth remains an empty bar. No illustrative concept values or fills are hardcoded.

Attributes / Next level retains all four forecasts: level XP, next-level stat gains, maximum Energy projection and strongest stats. Full text remains accessible, including tied leading stats and the distinction between innate creature grades and equipment grades. No mechanics or save schema are changed.

Capacity follows the available panel height and width: normal desktops show six attributes; shorter layouts use explicit pages. Phones show three rows when space permits, two on smaller heights, and one in very short layouts. Page selection is derived from the selected entry so resizing keeps that entry visible. Native named buttons support keyboard and touch; meters retain progress semantics. Canonical portrait, eight sections, selection tools, previous-screen navigation, Profile & Care, Habitat, Inventory and More actions remain in their existing shell.

The six separate sculpted ivory/gold stat assets are direct RGBA images. Original PNG masters, prompts, production WebPs and hashes accompany the kit. Approved full-page concepts are preserved as visual references, separate from actual-game validation screenshots.

## Verification

Production Next.js build passes. Focused ESLint reports zero errors and four native-image optimization advisories. The isolated synthetic-save browser run passes 30 checks with no runtime errors and exact read-only save preservation. Actual-game browser checks cover seven desktop/phone/landscape sizes, every attribute and forecast page, selected rows, complete detail dialogs, visible frames and icon loading, inner containment and exact read-only save preservation. See docs/validation/stats-b-results.json and stats-b screenshots.

The PR remains draft and unmerged. Hosted deployment is verified separately from local production-build screenshots.
