import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave, saveGameToSlot } from '@/lib/save/localSave';
import { BLACKSMITH_RECIPES, getBlacksmithQuote, craftBlacksmithEquipment, getCraftRevision } from '@/data/blacksmith';
import { grantFarmResources, getFarmState, reserveResource } from '@/data/farmResources';
import { getBattleOutfitterStock, assignBattleOutfitterEquipment, getEquipmentSlots, purchaseBattleOutfitterItem } from '@/data/battleOutfitter';
import { compareEquipment } from '@/data/equipmentComparison';
const fresh=()=>{const s=createNewGameSave('Blacksmith QA',0);s.currencies.gold=1000;return grantFarmResources(s,{iron:10,wood:20,iron_ore:20});};

test('each fixed recipe consumes the quoted supplies and labor and creates normal equippable shop gear',()=>{
 for(const recipe of BLACKSMITH_RECIPES){
  const s=fresh(),q=getBlacksmithQuote(s,recipe.id)!;
  assert.equal(q.canCraft,true);assert.ok(q.totalValue<q.item.costGold);assert.ok(q.totalValue>=q.item.costGold*.8);
  const before=structuredClone(s),r=craftBlacksmithEquipment(s,recipe.id,q.revision);
  assert.equal(r.ok,true);assert.deepEqual(s,before);assert.equal(r.save.currencies.gold,s.currencies.gold-recipe.laborGold);
  assert.equal(r.save.currencies.guildPoints,s.currencies.guildPoints);
  assert.equal(getFarmState(r.save).stock.iron,10-recipe.inputs.iron);assert.equal(getFarmState(r.save).stock.iron_ore,20);assert.equal(getFarmState(r.save).stock.wood,20);
  assert.equal(getBattleOutfitterStock(r.save,q.item),getBattleOutfitterStock(s,q.item)+1);assert.deepEqual(r.save.creatures,s.creatures);
  const c=s.creatures![0],preview=compareEquipment(s,c,q.item);
  const equipped=assignBattleOutfitterEquipment(r.save,c.creatureId,q.item.itemId);assert.equal(equipped.ok,true);assert.equal(getEquipmentSlots(equipped.save,c.creatureId)[q.item.equipmentSlot!],q.item.itemId);
  assert.deepEqual(compareEquipment(equipped.save,c,q.item).current,preview.after);
 }
});
test('reserves, insufficient Gold, raw ore and invalid recipes cannot be spent',()=>{
 let s=fresh();s=reserveResource(s,'iron',10).save;
 for(const [candidate,id] of [[s,'training_blade'],[{...s,currencies:{...s.currencies,gold:0}},'training_blade'],[s,'unknown']] as const){const r=craftBlacksmithEquipment(candidate,id,0);assert.equal(r.ok,false);assert.equal(r.save,candidate);}
 const oreOnly=createNewGameSave('Ore only',0);oreOnly.currencies.gold=1000;const ore=grantFarmResources(oreOnly,{iron_ore:99});assert.equal(craftBlacksmithEquipment(ore,'training_blade',0).ok,false);
 const poor=fresh();poor.currencies.gold=9;assert.equal(craftBlacksmithEquipment(poor,'training_blade',0).ok,false);
 const partial=reserveResource(fresh(),'iron',9).save;const r=craftBlacksmithEquipment(partial,'training_blade',0);assert.equal(r.ok,true);assert.equal(getFarmState(r.save).stock.iron,9);assert.equal(getFarmState(r.save).reserves.iron,9);
});
test('persisted confirmation revision rejects replay and stale reviews; deliberate new crafts still work',()=>{
 const s=fresh(),r=craftBlacksmithEquipment(s,'training_blade',0);assert.equal(r.ok,true);
 const loaded=saveGameToSlot(r.save);assert.equal(getCraftRevision(loaded),1);
 const duplicate=craftBlacksmithEquipment(loaded,'training_blade',0);assert.equal(duplicate.ok,false);assert.equal(duplicate.save,loaded);
 assert.equal(craftBlacksmithEquipment(loaded,'focus_circlet',0).ok,false);
 const next=craftBlacksmithEquipment(loaded,'training_blade',1);assert.equal(next.ok,true);assert.equal(getCraftRevision(next.save),2);
 assert.equal(craftBlacksmithEquipment(next.save,'training_blade',0).ok,false);
 assert.equal(craftBlacksmithEquipment(next.save,'training_blade',NaN).ok,false);
});
test('ready-made store gear remains Gold-only with no materials and no crafting prerequisite',()=>{
 const s=createNewGameSave('Shop',0);s.currencies.gold=1000;
 for(const r of BLACKSMITH_RECIPES){const q=getBlacksmithQuote(s,r.id)!;const bought=purchaseBattleOutfitterItem(s,q.item.itemId);assert.equal(bought.ok,true);assert.equal(bought.save.currencies.gold,1000-q.item.costGold);assert.deepEqual(getFarmState(bought.save).stock,getFarmState(s).stock);}
});
