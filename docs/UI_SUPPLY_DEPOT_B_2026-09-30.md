# Supply Depot B — Pella’s Counter

Approved by the user on 2026-09-30. Replaces the old Supply Depot screen with the approved scenic counter, parchment shelf rail, selected supply artwork, purchase panel and paginated stock dock.

## Behavior

- Existing twelve supplies, shelf membership, prices, Trust discounts, stock flags and gameplay transactions are preserved.
- Selected supply uses the existing complete item image with `object-fit: contain`.
- Live Gold, Feed, Materials and Repair Kit counters; package amount, storage, current/after owned quantities and balance after purchase.
- Review/Cancel/Confirm before purchase. Live price and affordability are checked again; a ref guards repeated confirmation. Receipt reports the existing transaction result and live balance, including any automatic gameplay rewards.
- Buying adds inventory; it does not use or arm a support item. Complete effects and usage rules are available in Usage Details.
- Talk, full stock/usage/armed-state ledger, trust progress and next reward open native dialogs with Escape/focus restoration.
- Main screen does not scroll. Stock paginates at 1–4 cards per page. Responsive shelf controls and short-screen layouts preserve actions. Only dialogs may scroll.
- Back and Menu share reserved header space; Supply Depot suppresses the global floating launcher.

## Artwork

`public/images/ui/interiors-v1/supply-depot.webp` is original AI-generated environment artwork based on the approved Pella’s Counter concept. Generated 2026-09-30: warm painted wooden shop, shelves, sunny town window and open counter; no UI or baked-in selected item. Converted from PNG to RGB WebP quality 88. Existing item icons, wood, parchment and shared icons are unchanged.

## Validation

Production Next.js build and TypeScript pass. All 141 regression tests pass. Targeted ESLint reports zero errors, two standard image-element warnings and one pre-existing navigation effect warning.

Browser QA uses the production build and real supply artwork at 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390. Checks cover every item, pagination, loaded/contained artwork, visible/clickable controls, no main scrolling, purchase cancellation and exact Feed purchase, usage/ledger dialogs, focus restoration, Gold blockers and Trust discounts. Desktop and phone screenshots are visually reviewed.

The sparse local checkout excludes large unrelated breeding asset collections. The full prebuild asset-generation pipeline was not run; the ignored local scene-manifest stub and review saves are not committed. Existing gameplay functions and save schema are unchanged. Published to the existing draft PR’s branch preview; not merged.
