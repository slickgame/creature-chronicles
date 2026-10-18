import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave } from '@/lib/save/localSave';
import { getBlacksmithQuote, craftBlacksmithEquipment } from '@/data/blacksmith';
import { grantFarmResources, getFarmState, reserveResource, tradeResource, craftResource, commissionFacility, processResourceDay, serveMeal, RECIPES, RESOURCES } from '@/data/farmResources';

test('buying only missing unreserved metal then crafting charges the quoted total; ready-made prices stay distinct',()=>{
 for(const [id,retail,total] of [['training_blade',55,50],['focus_circlet',185,165],['reserve_pendant',205,180]] as const){
  const s=createNewGameSave('Procurement',0),q=getBlacksmithQuote(s,id)!;
  assert.equal(q.item.costGold,retail);assert.equal(q.procurementGold,total);
  let bought=s;for(const [resource,n] of Object.entries(q.missingInputs))bought=tradeResource(bought,resource as 'iron',n!).save;
  const crafted=craftBlacksmithEquipment(bought,id,q.revision);assert.ok(crafted.ok);assert.equal(s.currencies.gold-crafted.save.currencies.gold,total);
 }
 let s=grantFarmResources(createNewGameSave('Reserves',0),{iron:3});s=reserveResource(s,'iron',2).save;
 const before=JSON.stringify(s),q=getBlacksmithQuote(s,'focus_circlet')!;
 assert.deepEqual(q.missingInputs,{iron:2});assert.equal(q.procurementGold,125);assert.equal(JSON.stringify(s),before);
});

test('quarry to kiln to furnace produces ingots for Iona without a farm forge and protects reserves',()=>{
 let s=grantFarmResources(createNewGameSave('Smelting',0),{wood:20,stone:20,planks:4,iron_ore:6});
 const start=s.currencies.gold;
 for(const id of ['quarry','kiln','furnace'] as const){const built=commissionFacility(s,id);assert.ok(built.ok);s=processResourceDay({...built.save,dayState:{...built.save.dayState,dayNumber:built.save.dayState.dayNumber+1}});}
 assert.equal(start-s.currencies.gold,620);assert.equal(getFarmState(s).facilities.forge,undefined);
 let r=craftResource(s,'charcoal',2,s.creatures![0].creatureId);assert.ok(r.ok);s=r.save;
 s=reserveResource(s,'iron_ore',1).save;assert.equal(craftResource(s,'iron',3,s.creatures![0].creatureId).ok,false);
 s=reserveResource(s,'iron_ore',0).save;r=craftResource(s,'iron',3,s.creatures![0].creatureId);assert.ok(r.ok);s=r.save;
 assert.equal(getFarmState(s).stock.iron,3);assert.equal(getFarmState(s).stock.charcoal,1);
 const q=getBlacksmithQuote(s,'focus_circlet')!;assert.equal(q.procurementGold,45);r=craftBlacksmithEquipment(s,'focus_circlet',0);assert.ok(r.ok);assert.equal(getFarmState(r.save).stock.iron,0);
});

test('repeatable processing cannot profit by purchasing inputs then immediately selling output, including sawmill',()=>{
 for(const r of RECIPES){
  const input=Object.entries(r.inputs).reduce((sum,[id,n])=>sum+RESOURCES[id as keyof typeof RESOURCES].price*n!,0);
  const sell=Math.floor(RESOURCES[r.id].price*.4)*r.output*(r.id==='planks'?2:1);
  assert.ok(sell<=input,`${r.id} buy/process/sell arbitrage`);
 }
});

test('cooked energy meals use ingredients only, cap recovery, and cannot be served twice',()=>{
 for(const [meal,recovery] of [['porridge',8],['breakfast',15]] as const){
  let s=grantFarmResources(createNewGameSave('Cooking',0),{wheat:5,vegetables:5,eggs:5,milk:5});
  const c=s.creatures![0];s={...s,creatures:s.creatures!.map(x=>x.creatureId===c.creatureId?{...x,energy:x.maxEnergy-5}:x)};
  const cooked=craftResource(s,meal,2,s.creatures![0].creatureId);assert.ok(cooked.ok);assert.equal(cooked.save.currencies.gold,s.currencies.gold);
  const served=serveMeal(cooked.save,meal,c.creatureId);assert.ok(served.ok);assert.equal(served.save.creatures![0].energy,Math.min(c.maxEnergy,cooked.save.creatures![0].energy+recovery));assert.ok(recovery>=5);
  assert.equal(getFarmState(served.save).stock[meal],1);assert.equal(serveMeal(served.save,meal,c.creatureId).ok,false);
 }
});
