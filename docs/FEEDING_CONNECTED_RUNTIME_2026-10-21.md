# Connected Feeding Station — runtime integration

The user selected all three concepts as complementary screens. B is now the Feeding entry point from the Ranch Ledger, Farm Care and End Day. Tonight’s meals opens A; Food & ingredients opens C. Back returns to B. Cross shortcuts retain the selected creature or ingredient; Escape from a detail view returns to the hub, and Escape from the hub returns to its source window.

## Implemented interface

- B preserves the large desktop pantry view with a compact right panel, three actions, feeding summary and Food permissions. Phones show a real pantry vignette; short landscape uses a two-column compact action panel.
- A displays canonical creature art with actual names, levels, condition and separate feeding status. The selected inspector shows diet, allocated food icons, covered need and shortage. Residents page according to available height. Phones use Residents / Selected creature.
- C provides a paged two-by-two food gallery and inline selected ingredient. It includes zero-stock ingredients, prepared manual meals and existing older Feed where applicable. Owned, reserved and available quantities are distinct. Phones use Supplies / Selected ingredient.
- Reserve and permission edits stay in local draft state until Review changes and explicit confirmation. Cancel/Escape do not save. Fresh-save checks and a 250ms confirmation guard prevent stale or accidental commits; duplicate confirmation is blocked. Receipts distinguish any earned goal rewards from the setting change.
- Global raw feeding and each allowed food remain accessible through Food permissions. Confirmation consumes no stock and advances no time. Reserve targets retain their existing 0–9999 validation, including targets above current stock.
- Food sources opens existing cooking, gathering, buying and full storage/trade, then restores its source and selection. Those destination systems retain their existing rules and screens.
- Existing Security and Budget pages remain reachable and reuse the navy/gold surface family. The separate End Day review itself is the next visual pass.

## Fidelity and scope

The unchanged approved board is `public/images/ui/feeding-station-connected/approved-connected-concept.png`. Runtime uses the new clean pantry plate, shared ornate navy/gold frames, explicit Tinos 400/700, painted stock icons, native gear and back/menu/chevron controls. The supplied concept animal symbols were replaced with correct canonical artwork.

No feeding-engine or recipe changes were made. Shared-inventory consumption, diet priority, raw opt-in, existing Balanced rations/Feed compatibility, reserves, manual bonus meals, per-creature hunger penalties and once-only sleep remain the previously validated behavior. No separate trough inventory, new buildings, species, talents, Cleaning or illness mechanics were added.

## Verification

- Production build and TypeScript pass; ESLint has no errors (native-image advisories remain).
- 43 feeding, economy, resource, lifecycle, planner and ledger data tests pass.
- 107 focused browser checks cover all three views at 1440×900, 1280×720, 1920×720, 2560×1440, 390×844, 360×740, 844×390 and 390×500. They verify source/back behavior, remembered selections, read-only browsing, canceled edits, confirmed stock-preserving reserve/policy changes, raw permission, exact sleep allocations, empty ranches, 17-resident paging and long Security details.
- 21 ledger clarity and 218 wider ledger browser checks pass.
- Total: 389 checks. No browser runtime errors.

Actual production-game screenshots use a QA save, not the user's save. The final images are `docs/validation/feeding-connected-{hub,meals,supplies}-{1440,390}.webp`. PR #21 remains draft/unmerged.
