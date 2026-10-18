# Creature removal C — October 18, 2026

The user selected C's focused decision and requested automatic return of every equipped item when a creature is released or donated. Care and Habitat now open the same CreatureRemovalWindow, with canonical portrait, irreversible warning, preserved family history, returning-equipment count, paged exact-copy list, ordinary reward and live balances. Keep creature receives initial keyboard focus. Short desktop windows use two columns; phones retain the stacked hierarchy. Long names stay fully visible.

## Equipment and persistence

`returnDepartingCreatureEquipment` materializes legacy slot-only equipment before removing the owner, returns all six slots to inventory and preserves the same item IDs, enhancement levels, rarity/power data, base/substats and recorded rolls. Owner and compatibility slot flags are cleared together in the removal save. Other creatures and spare copies are unchanged. Repeated normalization and repeated confirmation cannot create additional gear or pay twice.

Ordinary donations preserve the existing Gold formula and one Guild Point; release itself gives no reward. Pending starter goals can pay on the same save through the existing save pipeline. The review identifies those separately and previews their resulting balances rather than attributing them to removal. Quote preparation is read-only.

Permanent guild placements use the same gear return and ancestry preservation, with their existing contract rewards. Temporary service contracts retain equipment and existing immediate-resolution behavior. No timed absence or illness mechanics were introduced.

Fresh confirmation checks the active save, ownership, creature data, equipment, balances and eligibility. Locked creatures, Training Grounds attendees and active gauntlet members remain blocked. Failure retains the creature selection and offers Refresh review; cancellation writes nothing. The context reads the latest saved state to prevent rapid repeated actions against stale callback data.

## Verification

- Production Next build and TypeScript passed.
- 32 targeted engine regressions passed: six-slot and enhanced-copy conservation, spare/other-owner isolation, legacy saves, donation/release rewards, family archive, stale reviews, blockers, pending starter rewards and guild permanent placement.
- 175 dedicated browser checks passed across 1440×900, 1280×720, 390×844, 360×740 and 844×390, including all item pages, blocked states, long names, cancellation, Habitat entry, rapid double confirmation, exact persisted copies and reload conservation. Actual screenshots and results: `docs/validation/creature-removal-c-*`.
- Relevant ESLint checks: zero errors; native-image and existing hook-name warnings remain.
- The existing Care browser suite also passed all 124 checks after integration.

Browser QA uses an isolated save with all six slots equipped and an upgraded copy. Missing unrelated backgrounds in this sparse checkout use the established QA fallback; relevant icons and canonical creature assets are present. Concept reference and actual screenshots remain separate. PR21 stays draft and unmerged.
