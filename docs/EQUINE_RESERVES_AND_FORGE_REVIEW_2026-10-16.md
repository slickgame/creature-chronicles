# Single-equine reserves and next visual review

October 16, 2026 · Creature Chronicles · same feature branch / draft PR21.

## Result and limits

The reserve-aware audit checks the real one-equine, one-equine-habitat start at 1,200 Gold. Across three fixed timestamp seeds, three construction plans, normal/no-goal-Gold variants and thirteen gear loadouts/levels, all 234 upfront reserve decisions finish; 114 admitted cases then complete seven real farm days (798 overnight resolutions). No admitted case runs short of nightly food or loses the two-Wood repair stock; all planned construction completes. No balance, runtime UI, save schema, reward or price changes were made.

Run `node --no-warnings --loader ./scripts/ts-test-loader.mjs scripts/reserve-aware-equine-week.ts /tmp/reserve-aware-equine-week.json`. The committed JSON aggregates all 234 decisions, admission counts, reserve shortfalls and actual ending-Gold ranges; the full admitted daily ledgers are in the Drive QA archive. Add --summary to reproduce the committed compact report. Audit admission is an analysis policy, not a new purchase restriction in the game.

Each plan protects seven nights of stock-only food fallback, construction Gold, the Trade replacement value of missing unreserved inputs, and missing two-Wood repair stock before spending on gear. Starting legacy Feed genuinely covers the initial seven-night requirement; no assumed future harvest/income is needed for that upfront food reserve. Construction fallback money is held as a safety allowance, not charged: the actual route gathers the construction materials. An extra 200-Gold buffer is reported separately, based on the existing daily reserve-goal target; it is neither a fee nor a new mandatory game rule.

| Day-one plan | Construction Gold | Missing construction-input fallback | Repair-stock fallback | Protected total | Gear room with extra 200 Gold |
| --- | ---: | ---: | ---: | ---: | ---: |
| Care only | 0 | 0 | 16 | 16 | 984 |
| Quarry + Sawmill | 420 | 144 | 16 | 580 | 420 |
| Canine habitat, no adoption | 300 | 48 | 16 | 364 | 636 |

Consequences: Vigor +0 costs 75 Gold and Vigor +3 costs 171, both fitting every construction plan even with the extra buffer. Swift +0 (785), Striker +0 (765) and Swift+Vigor +0 (880) fit care-only with that buffer; they do not fit the buffered production or habitat plans on day one. Swift+Vigor +3 costs 1,264 before any reserves and is beyond starting cash. This supports staged purchases; it does not establish a need to lower prices.

| No-gear baseline | Day-eight morning Gold, normal goals | With goal Gold removed |
| --- | ---: | ---: |
| Care only | 1,915–1,935 | 1,300 |
| Quarry + Sawmill | 1,380–1,475 | 880 |
| Canine habitat | 1,615–1,635 | 1,000 |

Normal no-gear goal Gold is 615–635 / 500–595 / 615–635 respectively; this includes the real day-eight checkpoint and actual daily/starter rewards, not a repeatable passive-income assumption. Each route allows only one 100-Gold timber delivery. In these seeds, Quarry and Sawmill commission on days one/two and finish through normal overnight processing; the habitat commissions on day one. Across admitted cases, the lowest pre-sleep creature Energy is 53. Real worker blockers, feeding, recovery, construction, protected stock and all cash spending are checked. Cooking is attempted only to maintain two nights of food; actual Trade rations are purchased if tonight is short. Every Gold ledger reconciles exactly.

An important interaction: spending below the existing 200-Gold daily-goal target can change earned Wood/rations. Therefore each admitted loadout is simulated independently; the report does not simply subtract gear cost from a no-gear baseline. Gear itself grants no direct farm-work bonus.

This is a seven-day farm and equipment reserve audit, not a full onboarding/first-week campaign model. It assumes access after the introduction and does not verify all UI unlock paths. It does not simulate battles, mission income, adoption, breeding, bonus meals, training, sales or discretionary incident responses. Actual overnight security processing is retained. It holds one resident throughout; it does not price a future canine purchase or its food. No-goal-Gold sensitivity retains actual non-Gold rewards/claim flags; it is not a no-reward survival test. Monthly tax bills lie outside this horizon. Fixed 0.5 enhancement RNG gives one reproducible example, not an average roll or human battle odds.

## Visual review requested by the user

For every new menu/window/popup redesign, first show actual current-game screenshots and distinct concept options for the user's choice. After integration, show actual desktop/phone results. This is now recorded in AGENTS.md. Routine fixes inside the approved design may proceed.

Next proposed area: Iona's Forge and its recipe/output/materials/comparison/crafting review/result/tool windows. Its current screen is functional but gives much of the viewport to blank parchment, has a cramped recipe label and older quality/grade wording, and scatters tools across the bottom.

A — Recipe Gallery: six illustrated recipes visible together on desktop; selected output and cost review alongside. Phone shows two recipes per page, then focused selected details/materials. Six total recipes means desktop1/1 and phone1/3. The corrected proposal removes invented rarity/grade metadata from unselected sample cards.

B — Focused Forge Book: one recipe at a time, with Output/Materials/Compare and a compact Tools menu. Desktop pairs output with requirements; phone uses focused tabs. Includes an illustrative actual-cost result receipt.

Neither Forge concept is selected or implemented. Do not silently adopt either. All Iona/gear renderings in generated concepts are illustrative; implementation must reuse canonical existing character/item images and real instance/recipe data. Training Blade example is grounded in the current recipe: Common, Power D, +0, +3 Physical Power, one Iron ingot + 10 Gold labor. No crafting failure, hidden fees, mystery-crafted stats or auto-equip. Preserve reserve-aware costs, staleness protection, confirmations and source returns. 'Grade D' in the concept means power grade, not a new rarity field.

Current screenshots are the actual running production build with a synthetic established save, not generated menus. Missing legacy art has QA-only fallbacks; no production replacement art was introduced. Original generated concept PNGs, input screenshots, correction source and prompt set are archived separately. Initial A with wrong metadata/paging is rejected; use corrected A only.

## Validation

Audit runtime assertions and a TypeScript program including the audit script pass. Scoped script lint has zero errors/warnings. The current Forge screenshot harness opens the real crafting route on desktop/phone and verifies no save changes. Only scripts, documentation and the visual-review instruction changed; no runtime or production assets changed, so the existing 350-test game regression and approved-A production build remain the last full game checks. PR21 remains draft/unmerged; publication, Vercel build and protected hosted gameplay remain separate.
