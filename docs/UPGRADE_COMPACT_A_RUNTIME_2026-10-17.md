# Upgrade confirmation and receipt — approved compact A

The user selected A and specifically requested B's sealed-envelope question-mark icon. The final reference is the compact two-card slate/gold concept with that single icon replacement. This implements the approved direction in the existing UpgradeReview and UpgradeSuccess components, including equipment-gallery callers.

## Behavior and presentation

- Compact slate cards, ivory local Tinos typography, restrained gold borders/corners, emerald action buttons and dim canonical workshop backdrop.
- Canonical equipment art with actual saved power/enhancement, rarity rim, sculpted set badge and approved category silhouette. A success glow never changes the rarity color. No fabricated gear art or unlocked stat is used in reviews.
- Known substats are shown beside their unchanged values; open slots are summarized by the saved substat count instead of filling the card with empty rows. Main stats show before/after. Receipt highlights the actual saved new/improved substat once and keeps the other saved substats above it.
- Approved ivory/gold stat, Gold and Improve glyphs are reused. Mystery milestones use the new true-alpha closed-envelope/question-mark WebP; non-milestone reviews show Substats unchanged and the next milestone level. A pre-payment review never reveals the future roll or a stat-specific icon.
- Exact Gold cost, no-materials wording and resulting/current balance remain visible. Cancel, Escape and close retain existing behavior. The confirmation remains required, including expected-level and rapid-click guards.
- Both receipt creation paths pass the equipment slot for the correct category badge. Costs, stats, pools, RNG, saves and transaction reducers are unchanged.

## Validation

Production Next build/TypeScript passes. All 351 regression tests pass; scoped lint has zero errors (15 image optimization advisories).

Actual production browser checks pass at 1440×900, 1920×960, 1920×720, 2560×1440, 390×844, 360×740 and 844×390. Both review and receipt fit; controls remain visible. All cancellation reviews leave the QA save unchanged. Double-clicked +2→+3 and +3→+4 confirmations charge exactly 36 and 48 Gold, increase the same copy once, and draw only the single paid +3 roll. Exact copy data and balances persist after reload. Separate Common zero-substat and Legendary four-substat fixtures verify fit and the +15 cap. Screenshots use an isolated synthetic save; missing unrelated legacy art uses a QA-only canonical fallback, not a change to production assets.

Asset: `public/images/ui/forge-slate-v2/upgrade/mystery-envelope.webp` (RGBA alpha preserved from built-in ImageGen master). It was generated from the selected concept as a single front-facing tan closed envelope with a centered dark question mark; no scroll, wax seal, text, badge backing or scene. The unchanged generated PNG master is retained by the image-generation workflow. WebP encoding is the production derivative.

PR #21 stays draft/unmerged on feature/ui-ranch-ledger-2026-09-29. Local production QA and deployment build status are distinct from protected hosted gameplay verification.

Next: capture and propose improvements to the creature-selection/equip confirmation flow. Preserve existing ownership/replacement guards and the single Equip entry point.
