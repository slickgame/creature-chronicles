# Coliseum C3 Local Validation Checklist

C3 is implemented but remains unverified until this checklist is completed locally.

## Starting commands

```powershell
git pull origin master
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm test
npm run build
npm run dev
```

## Automated coverage

Confirm `npm test` includes and passes:

```text
tests/coliseum-c3.test.ts
```

The suite should verify:

- four Coliseum-exclusive move definitions
- all-family move compatibility
- non-inheritable dedicated-source moves
- one-time result synchronization
- one-time legacy stipend
- Marks purchases and item stock
- utility-slot assignment
- utility equipment battle effects
- dedicated manual consumption
- full-library replacement
- capacity-safe contract hold
- one-time contract redemption
- three unique authored contracts

## Save migration

1. Load a save with no Coliseum progress.
2. Enter the Coliseum.
3. Confirm `coliseumC3StateV1` is created without changing Gold, GP, XP, creatures, or habitats.
4. Load a C2 save with recorded history.
5. Confirm each stored result creates one C3 ledger entry.
6. Reload and re-enter the Coliseum.
7. Confirm no duplicate Marks or loot.
8. Load a migrated C1 save with completed encounters but no C2 history.
9. Confirm the one-time 2-Marks-per-clear stipend.
10. Reload and confirm the stipend does not repeat.
11. Corrupt `coliseumC3StateV1` with invalid JSON.
12. Confirm the screen opens with a normalized empty state and safely resynchronizes C2 history.

## Marks and loot

1. Record a Novice repeat victory.
2. Confirm +2 Marks.
3. Record a first-clear Novice non-champion victory.
4. Confirm +5 Marks and +2 Materials.
5. Record the Novice champion first clear.
6. Confirm +7 Marks, +2 Materials, and one Field Tonic.
7. Repeat comparable checks for Bronze, Silver, and Crown.
8. Confirm losses and draws grant no Marks or C3 loot.
9. Confirm repeat loot does not change after reloading.
10. Confirm result IDs are processed only once.

## Marks Exchange

1. Open each reward category.
2. Confirm locked rewards identify the required encounter.
3. Confirm insufficient Marks disables purchase.
4. Buy a Field Tonic and confirm Outfitter stock increases.
5. Fill Field Tonic stock and confirm another purchase is blocked without spending Marks.
6. Buy each new equipment piece.
7. Confirm purchase limits are enforced even while equipment is assigned.
8. Buy the Champion Harness once and confirm it cannot be bought again.
9. Buy the Champion Banner and confirm its persistent flag.
10. Confirm ordinary Gold and Materials are unchanged by Marks purchases.

## Three-slot Battle Outfitter

1. Open Daria's standard shelves.
2. Confirm Marks-exclusive gear cannot be purchased there.
3. Open the stock ledger and confirm standard and exclusive gear appear.
4. Assign separate offense, defense, and utility items to one creature.
5. Confirm each slot retains its own item.
6. Replace each slot and confirm the prior item returns to stock.
7. Remove each slot and confirm stock restoration.
8. Enter battle and verify exact bonuses:
   - Arena Blade Wraps
   - Focus Prism
   - Bastion Badge
   - Tactician Emblem
   - Champion Harness
9. Confirm enemy teams never inherit player Marks gear.
10. Confirm readiness score includes all three slots.

## Dedicated move manuals

1. Purchase each manual after its required clear.
2. Confirm the Technique Desk shows stock.
3. Teach a creature with fewer than eight learned moves.
4. Confirm the manual is consumed and the move is learned.
5. Attempt to teach the same move again.
6. Confirm no second manual is consumed.
7. Teach a creature with a full eight-move library.
8. Confirm replacement is required.
9. Attempt to forget Strike.
10. Confirm it is blocked.
11. Attempt to forget the native species signature.
12. Confirm it is blocked.
13. Teach successfully with a legal replacement.
14. Equip the new move through Move Training.
15. Use each move in battle and confirm its effects, costs, cooldown, targets, and AI-readable metadata.
16. Confirm Focus Manuals cannot teach Coliseum moves.
17. Confirm breeding inheritance does not offer Coliseum moves.

## Recruitment Hold

For each of Veyra, Solenne, and Cairn:

1. Purchase the contract.
2. Confirm Marks are spent once.
3. Confirm the contract appears pending.
4. Fill the matching habitat.
5. Attempt redemption.
6. Confirm the contract stays pending and no creature is created.
7. Free one capacity slot.
8. Redeem the contract.
9. Confirm the creature record, creature ID, and habitat membership are added together.
10. Verify fixed nickname, level, variant, stat grades, Talents, move library, and cosmetic marker.
11. Attempt a second redemption.
12. Confirm it is blocked.
13. Save and reload.
14. Confirm the recruited creature and contract state persist.

## UI and responsive behavior

1. Confirm the C3 toolbar does not block critical arena controls.
2. Switch among Arena, Exchange, Technique Desk, Recruitment Hold, and Reward Ledger.
3. Confirm current Marks update immediately after synchronized results and purchases.
4. Confirm the Exchange remains readable at desktop, tablet, and phone widths.
5. Confirm long reward descriptions remain inside their cards.
6. Confirm creature portraits are contained and not clipped.
7. Confirm the Town C3 badge opens the Coliseum.
8. Confirm the Battle Outfitter displays all three slots at narrow widths.

## Regression risks

Recheck:

- C2 encounter unlock order
- C2 Combat XP and level growth
- C2 first-clear and repeat reward separation
- Battle M6 consumables
- old offense and defense equipment
- Focus Training
- move-library normalization
- breeding move inheritance
- save import/export
- habitat membership normalization

Do not mark C3 verified until automated tests, production build, save migration, UI, and gameplay checks all pass.
