import test from "node:test";
import assert from "node:assert/strict";
import { createNewGameSave } from "@/lib/save/localSave";
import { BATTLE_OUTFITTER_ITEMS, EQUIPMENT_SLOTS, normalizeBattleEquipment, getEquipmentSlots, getBattleOutfitterStock, assignBattleOutfitterEquipment, removeBattleOutfitterEquipment, purchaseBattleOutfitterItem, useBattleOutfitterManual } from "@/data/battleOutfitter";
import { compareEquipment } from "@/data/equipmentComparison";
import { applyBattleOutfitterLoadouts } from "@/data/battleOutfitterIntegration";
import { createBattleState } from "@/data/battleEngine";
const item = (id: string) => BATTLE_OUTFITTER_ITEMS.find(entry => entry.itemId === id)!;
function fixture() {
  const save = createNewGameSave("Equipment QA", 0);
  save.currencies.gold = 20000;
  save.flags.ranchMaterialsStock = 100;
  for (const entry of BATTLE_OUTFITTER_ITEMS) save.flags[entry.flagKey] = 3;
  return save;
}
test("old three-slot saves migrate without loss or repeat refunds", () => {
  const save = fixture(), id = save.creatures![0].creatureId;
  save.flags[`battleLoadout_${id}_offense`] = "sparring_wraps";
  save.flags[`battleLoadout_${id}_defense`] = "guard_charm";
  save.flags[`battleLoadout_${id}_utility`] = "tactician_emblem";
  const snapshot = JSON.stringify(save);
  const normalized = normalizeBattleEquipment(save);
  const slots = getEquipmentSlots(normalized, id);
  assert.equal(slots.handsFeet, "sparring_wraps");
  assert.equal(slots.accessory, "guard_charm");
  assert.equal(getBattleOutfitterStock(normalized,item("tactician_emblem")),4);
  assert.equal(normalizeBattleEquipment(normalized),normalized);
  assert.equal(JSON.stringify(save),snapshot);
  assert.equal(EQUIPMENT_SLOTS.length,5);
  assert.equal(slots.head,null);
});
test("every equipment preview equals actual new battle stats; grades and base numbers stay innate", () => {
  for (const selected of BATTLE_OUTFITTER_ITEMS.filter(entry => entry.equipmentSlot)) {
    const save = fixture(), creature = save.creatures![0];
    const original = structuredClone(creature);
    const snapshot = JSON.stringify(save);
    const preview = compareEquipment(save,creature,selected);
    assert.equal(JSON.stringify(save),snapshot);
    const assigned = assignBattleOutfitterEquipment(save,creature.creatureId,selected.itemId);
    assert.equal(assigned.ok,true);
    const battle = createBattleState({battleId:"equipment-qa",playerCreatures:[creature],enemyCreatures:[save.creatures![1]]});
    const applied = applyBattleOutfitterLoadouts(assigned.save,battle);
    assert.deepEqual(preview.after,applied.combatants[applied.teams.player.combatantIds[0]].battleStats);
    assert.deepEqual(assigned.save.creatures![0],original);
    const removed = removeBattleOutfitterEquipment(assigned.save,creature.creatureId,selected.equipmentSlot!);
    assert.equal(removed.ok,true);
    assert.deepEqual(removed.save.creatures![0],original);
    assert.equal(getBattleOutfitterStock(removed.save,selected),3);
  }
});
test("replacement includes negative deltas, returns previous stock and does not double count", () => {
  let save = fixture(); const creature = save.creatures![0];
  save = assignBattleOutfitterEquipment(save,creature.creatureId,"arena_blade_wraps").save;
  save = assignBattleOutfitterEquipment(save,creature.creatureId,"sparring_wraps").save;
  const preview = compareEquipment(save,creature,item("focus_prism"));
  assert.equal(preview.previous?.itemId,"arena_blade_wraps");
  assert.equal(preview.rows.find(row=>row.key==="physicalPower")?.delta,-8);
  assert.equal(preview.rows.find(row=>row.key==="speed")?.delta,-3);
  assert.equal(preview.rows.find(row=>row.key==="specialPower")?.delta,8);
  const result = assignBattleOutfitterEquipment(save,creature.creatureId,"focus_prism");
  assert.equal(getBattleOutfitterStock(result.save,item("arena_blade_wraps")),3);
  assert.equal(getBattleOutfitterStock(result.save,item("focus_prism")),2);
  assert.equal(getEquipmentSlots(result.save,creature.creatureId).handsFeet,"sparring_wraps");
  assert.equal(assignBattleOutfitterEquipment(result.save,creature.creatureId,"focus_prism").ok,false);
  assert.deepEqual(result.save.creatures,save.creatures);
});
test("purchase and Focus Manual keep grades unchanged and preserve existing restrictions", () => {
  const save = fixture(), creature = save.creatures![0], before = structuredClone(creature.statGrades);
  const bought = purchaseBattleOutfitterItem(save,"sparring_wraps");
  assert.equal(bought.save.currencies.gold,save.currencies.gold-160);
  assert.equal(bought.save.flags.ranchMaterialsStock,98);
  assert.equal(purchaseBattleOutfitterItem(save,"champion_harness").ok,false);
  const studied = useBattleOutfitterManual(bought.save,creature.creatureId);
  assert.equal(studied.ok,true);
  assert.deepEqual(studied.save.creatures![0].statGrades,before);
  assert.deepEqual(studied.save.creatures![0].stats,creature.stats);
});
