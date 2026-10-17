# Creature Overview A — painted kit runtime integration

The approved painted R4 family and refined slate/gold kit are now wired into the actual CollectionScreen and ranch-only creature sections. This supersedes the earlier runtime icon treatment; the separate asset assembly remains a reference rather than gameplay evidence.

## Runtime changes

- Eight tabs, Choose creature, Identity, Health & protection, Lineage, Role strengths, and the three footer actions render the committed RGBA WebP family directly. Inventory reuses the same pouch in both locations.
- The actual production screen, header, portrait, tab, active tab, vitals, record-card and footer-button frame assets replace the earlier simple borders. Explicit regular and bold Tinos weights are available.
- Canonical full-body artwork, live vitals, exact values, status, records and existing action callbacks remain authoritative. Hearts are creature hearts, not combat HP. Compact heart indicators are capped at eight; larger capacities retain the exact numeric value and full record details.
- Desktop records occupy two bounded rows above the footer divider. Phones and short screens retain the focused More overview / Back to vitals pages. The desktop tab grid is replaced by the section selector on small screens. A bounded 960px composition prevents oversizing on tall wide displays.
- New shell styling is scoped to the collection screen and opt-in ranch dossier. Breeding callers retain their prior rendering. Equipment transactions and their shared quote/confirmation logic are unchanged.

## Validation

Production Next.js build passes. Focused ESLint reports zero errors; existing hook advisories and native-image optimization advisories remain. Browser verification uses an isolated synthetic save, not a user save.

See `docs/validation/overview-r4-results.json` for seven viewport checks, asset loading, actual frame consumption, parent/card containment, footer clearance, all eight section routes, artwork and record dialogs, creature selection, previous-screen navigation, and desktop/phone equipment inspection/removal cancellation. Read-only navigation must preserve the save exactly and report no runtime errors.

Actual production-build screenshots are `overview-r4-desktop.webp`, `overview-r4-phone.webp`, `overview-r4-phone-records.webp`, and `overview-r4-landscape.webp` in `docs/validation`. These are game screenshots, distinct from the earlier standalone kit assembly. Hosted deployment is checked separately; authenticated gameplay is not bypassed.

PR21 remains draft and unmerged.
