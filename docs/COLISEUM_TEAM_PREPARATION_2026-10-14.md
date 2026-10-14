# Coliseum team preparation — 2026-10-14

Continues Creature Chronicles from 4f82c287c982edcc867f1ce929c3d5761b2ee820 on feature/ui-ranch-ledger-2026-09-29. PR21 remains draft/unmerged. Existing unrelated untracked ranch art masters preserved.

## Player flow

Team preparation and each teammate's Gear button now open a focused full-screen preparation ledger: Gear, Battle stats, Starter plan, Budget and Tactics. It displays one teammate at a time, with direct teammate and equipment-slot controls. Current battle numbers use the actual enhanced equipment calculation; gear details show the equipped item's level, main stat and substat count.

Buy / equip opens the existing Outfitter inside preparation, initially selecting that creature and slot. Improve this piece opens the existing upgrade bench on the exact equipped instance. Both have explicit Team preparation return controls. The staging component remains mounted behind these dialogs, preserving roster order, encounter, Tactics Kit selection and C4 continuation. The old prep link that navigated away and reset team selection is removed. Gear actions remain individual reviewed transactions; buying does not equip automatically.

Tactics Kit arming remains available on phone, with stock, effect and consumption timing. Enter Battle remains on staging. Active gauntlet preparation is read-only for equipment: buy/equip/upgrade destinations are disabled, while current battle stats and plans can be inspected. Existing core gauntlet rules are unchanged.

## Starter weapon plan

Read-only getTeamGearPlan supports +0/+3/+6 targets. It retains every equipped weapon and its existing enhancement; an empty slot uses an available Training Blade before quoting a new one. Each free copy is allocated at most once in a proposal, in the same inventory order as existing equip defaults. Gear worn by another creature is excluded. A plan is a proposal; selecting teammates and reviewing actions can change which available piece is used, and costs refresh from live ownership.

The upgrade portion sums actual grade-specific remaining per-level Gold costs. Enhanced pieces are never downgraded. New starter blade = 55 Gold; +0→+3 = 48 Gold; three empty slots to +3 = 309 Gold. After one blade is bought, equipped and improved to +3, the remaining proposal becomes 206 Gold. Existing magical/other weapons are retained rather than replaced with physical starter blades.

The Budget page adds a nonnegative custom Gold allowance for unpaid construction. Summary subtracts actual equipment costs, the seven-night stock-only food fallback at Trade prices, and this allowance from current Gold. It shows shortfalls without spending or reserving currency. No future gathering/income, creature arrivals or return from training is assumed. No predicted random substat appears anywhere in the proposal.

## Artwork and layout

Reuses approved creature portraits, distinct equipment WebPs and ranch-dossier parchment. No new raster art was necessary. Provenance remains in the approved creature/equipment-art and ranch-dossier documents. Numbers, labels and target levels are real UI text. Portrait stacks focused cards; landscape places the host portrait beside a compact content panel. The initial landscape stats overflow was corrected using tighter row spacing rather than hiding values.

## Verification

22 targeted equipment/comparison/gauntlet sequencing/team-plan tests passed. The final three team-plan tests passed again after making the outside-roster ownership fixture explicit. New tests cover exact 309/669 Gold totals, food/construction shortfalls, zero mutation, unique inventory allocation, retention of earned upgrades, exclusion of another owner's gear and exact real purchase/upgrade parity. Added to test:regression.

Optimized production Next build passed. Final scoped lint zero errors (five native-image warnings). Browser QA on production build:

- All five pages at 1440×900, 390×844, 844×390, no section/nav/panel overflow. Screenshots reviewed; real equipment icons used. Missing legacy sparse-checkout images aborted only in harness.
- Starter plan target switching and construction allowance; read-only pages leave save unchanged.
- Desktop and 390px phone cancel purchase, then exact 55-Gold purchase, separate equip, exact 48-Gold upgrade to+3, saved milestone roll and refreshed 206-Gold proposal.
- Return from shop and upgrade bench to prep and staging retains all three original selected teammates in order.
- Tactics Kit arm/disarm does not consume stock before entry.
- A synthetic QA fixture made with the real C4 result helper resumes a stage-two active gauntlet. Gear actions are disabled at all three sizes, battle stats are readable, and saved run/selected roster remain unchanged. Synthetic fixture is not committed.

Existing Outfitter's detailed comparison/transaction dialogs are reused; some legacy detail dialogs remain scrolling. The five new preparation pages and their primary navigation fit without scrolling. No new save fixtures or browser stubs are shipped.

Next: run a real early Circuit progression audit using affordable starter preparation, including combat XP, first/repeat rewards and upgrade purchases. Compare when the next tier becomes approachable, then adjust encounter or economy tuning only if that progression evidence supports it.
