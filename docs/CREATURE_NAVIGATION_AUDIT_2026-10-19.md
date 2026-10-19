# Creature navigation audit — 2026-10-19

The audit reproduced two return/focus problems while following the approved roster, profile, supplies, equipment and Habitat screens. This update preserves the existing visual designs and gameplay.

## Fixed behavior

Opening Habitat from a non-first creature's Equipment or Inventory section and choosing Previous screen previously reset the roster to the first creature's Overview on both desktop and phone. The roster now remembers its selected creature ID and section in NavigationContext. Re-entering the roster restores that view immediately. The memory is scoped to saveId and remains outside gameplay saves; a different ranch starts with its own first creature and Overview. Missing creatures still use the existing safe fallback.

SharedCreatureDetail has optional initialSection/onSectionChange props. Only the main roster supplies them. Habitat and breeding profiles retain independent tabs. Existing explicit Profile & Care shortcuts still open Inventory, Care or Overview as requested, and update the remembered section.

Choose creature previously kept focus on the outer header button when first opened. Escape therefore failed until focus entered the picker. Opening it now focuses Search creatures; closing it restores its original launcher when still connected. Escape preserves the underlying creature and section. Nested dialogs retain their existing focus handling.

The React review guided the stable section callback, primitive dependencies, lazy initial state, no-op equality guard and transient context storage. No new UI assets, visual direction, gameplay rules or save schema were needed.

## Verification

- Reproduced the original reset on1440×900 and390×844 before changes: Original full body / overview instead of Return target / equipment.
- Production Next.js build and TypeScript: passed.
- Changed-component ESLint: zero errors; existing image/effect advisories remain.
- `scripts/validate-creature-navigation.mjs`: **47 checks passed** on desktop and phone, no runtime errors.
- Existing `scripts/validate-creature-profile-a.mjs`: **63 checks passed** for the shared detail/profile regression.
- **110 browser checks total.** Navigation remains read-only against the normalized save snapshot.
- Covered exact Habitat handoff; Equipment and Inventory return; independent Habitat Stats & Growth; profile dismissal; picker Escape/search/return focus; all eight main sections; switching to File2 with overlapping creature IDs and a different saveId.

Evidence under `docs/validation/`: `creature-navigation-before-1440.webp`, `creature-navigation-before-390.webp`, `creature-navigation-after-1440.webp`, `creature-navigation-after-390.webp`, `creature-navigation-results.json`, `creature-navigation-profile-results.json`.

The isolated QA save uses canonical base-feline art for the two named navigation targets. Missing unrelated sparse-checkout art uses the existing QA-only fallback. No QA save or fallback art is added to the runtime.

Publish on `feature/ui-ranch-ledger-2026-09-29`; PR21 remains draft/unmerged. The next visual review is Ranch House and its daily ledger, whose older wood/parchment surfaces remain a separate design task.
