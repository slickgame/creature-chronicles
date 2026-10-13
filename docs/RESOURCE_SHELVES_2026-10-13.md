# Storage and Trade shelves — 2026-10-13

Storage and Pella's ingredient Trade counter now use four-item parchment shelves with previous/next pages, category filters, in-stock filtering, live Gold, and owned/reserved/usable counts. Item details, reserve editing and trades use focused popups. Buying/selling has a quantity step and explicit final review showing exact Gold and stock changes. Existing prices, reserve rules and transaction engines are unchanged. Double-click guards prevent repeated confirmation; receipts distinguish automatic goal rewards.

Source links open the exact work location or Kitchen/Workbench recipe in the production book. Closing it returns to the same item, shelf page and filters with fresh quantities. Recipes accept an initial selection; ordinary production navigation remains unchanged. Trade excludes prepared meals, which have no purchase price. Switching from a Meals filter to Trade resets the filter to All. Reserve targets remain valid from 0 to 9999 and may exceed current inventory without creating stock.

The Resources back button returns to the existing resource section chooser. Feeding, Security, Construction, Orders and Budget have not been redesigned in this pass.

## Artwork

Reused approved pantry/workbench scenery, parchment and existing named-resource illustrations. No new raster art or generation prompts in this update. Dedicated icons still missing: Wheat, Iron ore, Charcoal, Nails, Garden porridge, Hearty breakfast, Breeder's bowl and Worker's stew. Generic pantry/meal art remains explicitly a fallback, not a new dedicated illustration. This list is the next art pass.

## Validation

- Direct optimized Next.js build/TypeScript passes; sparse checkout still lacks legacy breeding images required by the full npm asset preflight.
- Scoped lint: zero errors, six image-element warnings.
- Eight existing production/work-yield tests pass; no economy-engine changes.
- Browser: all Storage and Trade pages and item-detail dialogs fit desktop 1440×900, compact desktop 1280×720, phone 390×844 and landscape 844×390. Escape returns to the shelf.
- Reserve cancel/save, trade cancel, exact buy/sell charges, duplicate-click guard, protected reserves, source selection and return context, and reload persistence verified. Screenshots reviewed.

## Next

Create the eight missing dedicated resource/meal illustrations, then improve Feeding, Security and resource planning panels with the same paginated approach. Continue broader economy balancing after the navigation and art pass.
