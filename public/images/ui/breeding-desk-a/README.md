# Breeding Pen A production kit

Approved reference: references/approved-a.png, unchanged. A is the Scenic Pairing Desk with a persistent Back button, complete canonical profile artwork and explicit empty giver/receiver slots. The sample assembly is not live gameplay integration.

## Assets

surfaces/ extends the established day-cycle-v1 SVG family: navy panel/window, normal/hover/primary/disabled buttons, field, divider, portrait frame, parchment nameplate, translucent empty slot and emerald selected slot. Keep native corner proportions with nine-slicing; example slices are in preview.css. Do not flatten text or live values into images.

icons/ includes seven new editable native symbols (choose plus medallion, back arrow, inspect, options, information, close, selected), the existing menu symbol, sculpted heart/Energy and painted support/inheritance icons. Reused artwork is copied unchanged. Empty slots contain plus medallions and role labels, never silhouettes or ghost creatures.

art/ includes unchanged pavilion/wood/parchment dependencies and exact Git versions of the canonical canine and feline full-body profiles. These profile copies make the preview/archive portable. Live integration must resolve every participant's registered profilePath rather than hardcode these two examples. Use object-fit:contain, preserve feet/ears and original proportions, and retain player/missing-art handling. Never switch these Breeding Pen profile displays back to bust portraits.

fonts/ contains licensed Tinos Regular/Bold and OFL.txt. The SHA-256 manifest records the source mapping and hashes. No additional paid plugin, new creature art or replacement background is needed.

## Preview and integration contract

Open preview.html. Its external preview-state selector demonstrates both selected, both empty, giver-only and receiver-only states with sample values; it does not save or execute game actions. Phone Pair/Readiness views work in this isolated assembly. Other buttons are visual assets awaiting real navigation/handlers. The persistent Back must return to the existing source in the game; it cannot be hidden behind Menu.

Chance and costs stay blank until a complete pair is chosen. Review stays disabled while incomplete; runtime blockers must still be applied to a complete pair. Do not ship the sample 11%, 53 Energy or 1 Heart as constants. Reuse the existing canonical getBreedingPreview, warnings, before/after costs, inheritance, support items and guarded attempt flow. No balance, save or confirmation changes are authorized by this visual kit.

The selected sample uses complete full-body figures on desktop and phone. Selected state shows name/role, level/readiness, Change and Inspect; empty state shows Choose giver/receiver and No parent selected. The same slot geometry remains stable through partial states. Browsing and canceled selection must remain read-only.

Build: node scripts/build-breeding-desk-a-assets.mjs [approved-reference-PNG]. The reference is retained if the argument is omitted. Validate: node scripts/validate-breeding-desk-a-assets.mjs. Production-asset screenshots and JSON evidence live under docs/validation/breeding-desk-a-assets. Baseline screenshots of the actual previous game are under docs/validation/breeding-concept-baseline and must not be confused with the new assembly.

Next: integrate the selected main-screen style, persistent Back, empty/partial states and full-body profiles into the actual pen. Then verify the real pair selector, costs, cancellation, confirmation, exactly-once outcomes, source returns and mobile focus pages. Show actual game screenshots before calling integration complete. No new animation is required by this static reference; meaningful effects should follow docs/ANIMATION_WORKFLOW.md.
