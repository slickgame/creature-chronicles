import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave } from '@/lib/save/localSave';
import { getFoodBudget, getUpgradeBudget } from '@/data/economyBudget';
import { grantFarmResources, reserveResource, setIngredientFeeding } from '@/data/farmResources';
import { BATTLE_OUTFITTER_ITEMS } from '@/data/battleOutfitter';
import { simulateFirstWeek } from '../scripts/first-week-economy.ts';

test('stock-only food budget preserves save and respects rations, reserves, ingredient opt-in and legacy Feed', () => {
  let save = createNewGameSave('Budget', 0);
  const snapshot = JSON.stringify(save), baseline = getFoodBudget(save);
  assert.equal(JSON.stringify(save), snapshot);
  assert.equal(baseline.nightlyNeed, 7); assert.equal(baseline.shortage, 35); assert.equal(baseline.topUpGold, 280);
  save = grantFarmResources(save, {rations: 10, wheat: 10, vegetables: 10});
  save = reserveResource(save, 'rations', 3).save;
  assert.equal(getFoodBudget(save).shortage, 28);
  save = setIngredientFeeding(save, true).save;
  assert.ok(getFoodBudget(save).shortage < 28);
  save = reserveResource(save, 'wheat', 10).save; save = reserveResource(save, 'vegetables', 10).save;
  assert.equal(getFoodBudget(save).shortage, 28);
});

test('upgrade milestone quotes include every remaining level and do not spend Gold', () => {
  const save=createNewGameSave('Budget',0),item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId==='training_grips')!;
  const plan=getUpgradeBudget(save,item,0);
  assert.deepEqual(plan.rows.map(r=>r.gold),[48,168,360,624,960]);
  assert.equal(plan.rows[4].remaining,240);assert.equal(plan.rows[4].afterFood,-40);
  assert.equal(getUpgradeBudget(save,item,2).rows[0].gold,24);
  assert.equal(getUpgradeBudget(save,item,15).rows.length,0);assert.equal(save.currencies.gold,1200);
});

test('a seven-day farm route feeds residents and affords starter gear +3 and a quarry without mission income', () => {
  const result=simulateFirstWeek();
  assert.equal(result.rows.length,7); assert.ok(result.quarryBuilt);assert.equal(result.equipmentLevel,3);
  for(const day of result.rows){assert.equal(day.actions,3);assert.equal(day.previewShortage,0);assert.equal(day.foodCovered,day.foodRequired);assert.ok(day.gold>=0);}
  assert.ok(result.endGold>=200);
});

test('construction allowance identifies stops after food without reserving or spending Gold',()=>{
 const save=createNewGameSave('Budget',0),item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId==='training_grips')!;
 const snapshot=JSON.stringify(save),plan=getUpgradeBudget(save,item,0,240);
 assert.equal(plan.constructionGold,240);assert.equal(plan.plannedStop,12);
 assert.equal(plan.rows.at(-1)!.afterPlan,-280);assert.equal(JSON.stringify(save),snapshot);
 assert.equal(getUpgradeBudget(save,item,0,2000).plannedStop,null);
 assert.equal(getUpgradeBudget(save,item,15,240).plannedStop,null);
 assert.equal(getUpgradeBudget(save,item,0,NaN).constructionGold,0);
});
