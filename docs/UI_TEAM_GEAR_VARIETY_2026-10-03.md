# Team preparation and equipment variety — 2026-10-03

## User-approved scope
Improve team selection and confusing empty loadouts, expand equipment quality/grade variety, and finish a complete battle-flow polish pass. Preserve large full-body art, parchment/wood styling, no main-screen scrolling, target-click queuing, sequential playback and unchanged innate creature grades. Keep PR #21 draft and unmerged.

## Changes
- Cleaner team nameplates, numbered positions, wider central formation and restrained side panels. Each teammate has a Gear button with occupied-slot count.
- In-place team loadout dialog: five slots, Owned gear / Shop gear, exact replacement deltas using the combat calculation, purchase/equip/remove review, and explicit empty-state instructions. Shopping and equipping retain the selected team. Active gauntlet loadouts remain locked; unavailable teammates cannot change equipment here.
- Outfitter selects the first creature initially, labels available inventory separately from equipped gear, offers owned-only browsing, explains buy-then-equip, and displays equipment quality and grade.
- Fifteen new shop pieces: three per slot, Common/D, Fine/C, Superior/B. Common gear costs 35–60 Gold and zero Materials (235 Gold for all five). Higher tiers provide specialized numeric bonuses. Existing tournament pieces are labeled Masterwork/A; Champion Harness is Relic/S. Existing costs and bonuses are unchanged.
- Head equipment is now stocked. Item IDs and inventory flags are deterministic; no automatic purchases or free grants. Buying never auto-equips. Replacements return old pieces to inventory. Equipment affects battle numbers only, never base stats or innate letter grades.
- New catalogue entries use existing matching slot/family illustrations; no new unique item artwork is claimed.
- Enemy attack motion faces the opposing team, per-event art keys restart repeated-hit feedback, misses have a dodge cue, energy has a distinct glow, and reduced-motion preferences suppress motion.
- Two stale Town source tests now follow the active C4 re-export to TownScreen and verify the real Rose Lantern route/access label.

## Validation
- Optimized Next.js production build and TypeScript pass. Scoped ESLint: zero errors, 24 existing-style image warnings.
- All 153 regression cases pass across 26 test files. Executed each file directly through the TS loader because this runtime's `node --test` invocation only reported file-level passes. Equipment tests cover every preview versus actual battle stats, migration, returns, all 15 purchases, insufficient Gold/Materials, and unchanged base stats/grades.
- Team staging and loadout dialogs pass 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390: no page scrolling, blocked controls, overflow or broken visible images. Browser transaction purchases and equips new Head gear, verifies exact cost/inventory and unchanged innate grades, and enters battle with the same team.
- Outfitter categories pass all seven sizes; purchase cancellation, buy/equip/remove, Head stock, full comparisons, Marks restrictions and navigation pass.
- Battle ledger/dock passes all seven sizes, status details and pagination; three edited plans and repeated target clicks queue correctly. Paused playback shows six distinct HP updates, not end-of-round totals, and living artwork retains full color.
- Defeat results and gauntlet victory results pass all seven sizes, recap/growth dialogs, unchanged saves before confirmation, and exactly one recorded result. Gauntlet record advances to stage two.

The prior round-ledger commit is preserved. No merge or production deployment is included.
