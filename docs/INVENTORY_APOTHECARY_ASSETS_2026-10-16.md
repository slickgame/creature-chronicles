# Approved A inventory asset kit

October 16, 2026. Creature Chronicles; existing feature branch and draft PR #21. User approved the illustrated item screen, recipient grid and categorized item browser. The sole additional visual change is a separate information button in every recipient card.

## Deliverables

`public/images/ui/apothecary-v1/` contains 12 optimized WebPs: a clean workbench background, separate alpha display plinth, blank alpha parchment panel, blank alpha title banner, and eight alpha consumable illustrations (Energy Snack, Hearty Energy Meal, Affection Treat, Recovery Balm, Fertility Tonic, Trait Stabilizer, Mutation Catalyst, Gestation Tonic). Each is independently generated, never sliced from a contact sheet.

26 SVG symbols extend the existing 24px, 1.8px dark-brown stroke system: info, close, previous, next, search, check, favorite, heart, energy, bag, consumables, equipment, materials, key, all, sort, filter, edit, source, armed, minimize, expand, portrait, lock, leaf and owned. Ten SVG frames cover primary/secondary/wood buttons, ordinary/selected/disabled cards, fields, active tabs, tooltips and a botanical divider. `components.css` supplies nine-slice borders, focus/disabled/selection states, scrim, badges and responsive grid primitives. All labels and quantities remain live HTML.

`preview.html` is a standalone **asset preview**, separate from the game's live Inventory. It assembles the main display, recipient and item-grid views. Recipient information buttons open a read-only sample character card without selecting a recipient; closing preserves the grid state. Canonical existing portraits are used. Sample quantities and simplified effects are illustrative. Item use is disabled. Equipment/material/key category art uses the existing game catalogue when integrated; the asset preview does not implement a catalogue or game transactions. Actual live-game integration is the next step.

## Interaction contract for live integration

- No Giver item-use button. Choose recipient opens the paged portrait grid, including the player when item rules allow. Keep incompatible entries visible with a reason, or use Eligible filtering.
- Each card has separate selection, favorite and information controls; information must remain available even if the recipient cannot receive the current item. Do not nest buttons. The information action opens the existing full character detail card, including the appropriate player detail view. Back/Escape returns to the same page, filters, search, focus and selection without consuming or changing anything.
- Selecting an item immediately returns to its main detail screen. Keep Previous/Next within the current filtered item set. Retain compatible recipient selection across items.
- Use Item / Equip / Arm is the explicit transaction. Pair-wide effects use Arm without a recipient; pregnancy items need an exact eligible pregnancy, and creature-only effects must not apply to the player. Use actual engine restrictions, capped previews, prices and existing guarded transactions.
- Browser categories: All, Consumables, Equipment, Materials and Key items; add search, sorting, owned-only and pagination. Tooltips support pointer hover, keyboard focus and touch info buttons. Equipment and character artwork remains canonical, with rare variants distinct.
- Fit the viewport through responsive page capacity and minimized artwork, never by clipping data. Use independent 44px hit targets for recipient information and selection.

## Provenance and prompts

All 12 illustrations were generated with the built-in image-generation tool using the approved main/browser concepts as references. `manifest.json` records **each exact prompt**, original PNG SHA-256, optimized WebP SHA-256, dimensions, byte size and alpha. `references.json` records approved concept hashes. Production WebPs are resized with Lanczos and encoded at quality 90, method 6, preserving alpha; no semantic retouching or background removal was performed. Eleven isolated assets have actual alpha and the scenic plate is opaque. Source PNG masters and the approved concept references are retained in the Drive archive alongside all production derivatives.

SVGs were authored as scalable interface graphics to match the established repository system. Their geometry and colours are in the source. Reuse existing approved portraits, equipment and material illustrations; no character or equipment art is replaced by the concept's illustrative portraits.

## Verification

Twelve WebPs decode and expected alpha is present. All 36 SVGs parse. Browser checks pass for the three asset-preview screens at 1440×900, 390×844, 844×390 and 360×740: decoded images, no viewport or container overflow, separate recipient information action and state-preserving close. Desktop item display and recipient grid screenshots were visually reviewed. The archived QA log and harness reproduce these checks. No gameplay source, formulas, save schema, prices, inventory counts or transaction behavior changes in this asset-only update. Existing untracked ranch dossier files are preserved. Pushing assets, Vercel build status and protected hosted-game verification are reported separately; PR remains draft and unmerged.
