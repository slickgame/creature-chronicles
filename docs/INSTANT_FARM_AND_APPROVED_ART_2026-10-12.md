# Instant farm work and approved creature art

## Farm management

Owned work locations now resolve immediately on an explicit Work click. The preview and transaction share the same resource yield and creature Energy cost. Work costs no Gold, creates no ongoing assignment, and does not charge extra food. Normal overnight feeding and recovery remain. Retired assignments are ignored and cleared; work is never replayed overnight.

Diligent adds resources, Efficient Worker reduces Energy cost (minimum 8), and Eager Learner increases work skill XP. Farm Tools retains the saved upgrade ID and contributes output/Energy bonuses. Harvesting, production and hauling grant +1 output at levels 6, 11 and 16. Introductory lessons, starter goals, work commissions, daily planning and reports use completed actions. Legacy accepted patrol/care commissions can be completed through work actions.

Security comes from fortifications at their current condition plus the strongest resident canine with Guard Dog. F/D/C/B/A/S bonuses are 1/2/3/4/6/8. Bonuses do not stack, and work/rest does not disable them; creatures away at training do not contribute. New starter Rook has C-grade Guard Dog. Existing creatures are not retroactively rewritten. Adoption can roll it; non-canine offspring cannot inherit it. Fences/watchtower still build through Petra. Weather has a 12% daily chance of 3 damage, alongside existing incidents. Repairs use a kit or 2 Wood + 1 Stone to restore 20 condition.

The Farm Management screen exposes Work locations, Security, Storage, Feeding, Kitchen, Workbench and Guide, with output/Energy previews and an action receipt. Work is optional; end-day planning no longer demands chore assignments.

## Approved art

Sources: the user's Google Drive approved Nyla and Equine integration notes and all ten PNGs for each species. Original PNG bytes were reused from the existing repository art commits, not regenerated or recompressed.

- Drive project: https://drive.google.com/drive/folders/1etR6PSfZYVnkidzgL3ORS68Dp_A0Syiu
- Nyla note: https://docs.google.com/document/d/1JbNA1f2Rx_pN6qoV7p2iI3YUH6C00qKHVUDE6NXaqS4/edit
- Equine note: https://docs.google.com/document/d/1mmWVdEqzT6iAS0FvtjXb5swztW-Zp1l5RKYvD8nSTJk/edit
- Asset directories: `public/images/creatures/feline/nyla/`, `public/images/creatures/equine/gameplay/`.

Each set includes full body, portrait, combat idle, basic attack, special attack, guard, damage, KO, work and sleep. Shared gameplay helpers cover roster, habitats, adoption, training, team selection, Outfitter, Guild reviews and hatchling reveal. Battle uses distinct poses, Farm Management uses work art, and End Day shows sleeping art. Nyla KO has the approved responsive placement. Base Feline and Horse variants use these sets; rare variants retain their distinct art. Creature nicknames and stats are unchanged.

Breeding artwork, scene manifest and shared variant image registry are unchanged. The only related genetics change is Guard Dog's canine inheritance restriction.

## Verification

- All 263 TypeScript regression tests pass, including nine instant-work/security tests and the approved-art asset/pose checks.
- Optimized Next.js production build and TypeScript pass.
- Scoped ESLint has zero errors; existing image-element and unused-code warnings remain.
- Production Chromium at 1440×900 and 390×844: seven farm tabs, no horizontal overflow, immediate exact wood/Energy transaction, no Gold charge, save/reload, roster portrait pagination, decoded approved art, sleeping art and overnight no-repeat behavior.
- Approved PNGs load locally. Unavailable legacy artwork in the sparse checkout was replaced by neutral placeholders only in the browser harness; those placeholders and test fixtures are not committed. Full asset-preparation pipeline is left to the complete deployment checkout.

## Follow-up

Convert remaining generic shop bundles, NPC/battle payouts and equipment bills to named resources. Add matching milk, eggs, meat, stone and iron inventory art, then balance first-week energy/output/reward pacing. Broader species production specialization and additional recipe tiers remain future work.
