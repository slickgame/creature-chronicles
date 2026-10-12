import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave,saveGameToSlot} from '@/lib/save/localSave';
import {getFarmState,grantFarmResources} from '@/data/farmResources';
import {purchaseSupplyDepotItem,getSupplyDepotItem,getSupplyDepotPrice,getSupplyDepotCount,SUPPLY_DEPOT_FLAGS} from '@/data/supplyDepot';
import {BATTLE_OUTFITTER_ITEMS,purchaseBattleOutfitterItem,getBattleOutfitterCostLabel} from '@/data/battleOutfitter';
import {createColiseumPerformance,getColiseumC2Encounter,recordColiseumC2BattleResult} from '@/data/coliseumC2';
import {syncColiseumC3Rewards} from '@/data/coliseumC3';
import {getNpcQuestChain,acceptNpcQuest,npcQuestFlag} from '@/data/npcQuests';
const fresh=()=>createNewGameSave('Named rewards',0);
test('Pella bundles grant exact named resources, charge the displayed Gold and survive reload',()=>{
 for(const [itemId,resource,flag] of [['feed_bundle','rations',SUPPLY_DEPOT_FLAGS.feed],['material_crate','wood',SUPPLY_DEPOT_FLAGS.materials]] as const){
 const s=fresh();s.currencies.gold=1000;const item=getSupplyDepotItem(itemId)!;const price=getSupplyDepotPrice(s,item);const r=purchaseSupplyDepotItem(s,itemId);assert.equal(r.ok,true);
 assert.equal(r.save.currencies.gold,s.currencies.gold-price);assert.equal(getFarmState(r.save).stock[resource],(getFarmState(s).stock[resource]??0)+5);assert.equal(r.save.flags[flag],s.flags[flag]);
 assert.equal(getSupplyDepotCount(saveGameToSlot(r.save),flag),getFarmState(r.save).stock[resource]);
 const poor={...s,currencies:{...s.currencies,gold:price-1}};assert.equal(purchaseSupplyDepotItem(poor,itemId).ok,false);assert.deepEqual(getFarmState(poor),getFarmState(s));
 }
});
test('every non-exclusive shop item costs only its displayed Gold, even with no materials',()=>{
 for(const item of BATTLE_OUTFITTER_ITEMS.filter(x=>!x.coliseumExclusive)){
 const s=fresh();s.currencies.gold=10000;s.flags.ranchMaterialsStock=0;assert.equal(item.materialCost,0,item.name);assert.equal(getBattleOutfitterCostLabel(item),`${item.costGold} Gold`);
 const r=purchaseBattleOutfitterItem(s,item.itemId);assert.equal(r.ok,true,r.message);assert.equal(r.save.currencies.gold,s.currencies.gold-item.costGold);assert.deepEqual(getFarmState(r.save).stock,getFarmState(s).stock);
 }
});
test('Circuit and bonus combat loot award named ore once while preserving currency rewards',()=>{
 const s=fresh(),ids=s.creatures!.slice(0,3).map(c=>c.creatureId),p=createColiseumPerformance(ids);const encounter=getColiseumC2Encounter('novice_opening_scrimmage')!;
 const r=recordColiseumC2BattleResult(s,encounter.encounterId,'player_won',4,ids,p,'named-once');assert.equal(r.duplicate,false);
 assert.equal(getFarmState(r.save).stock.iron_ore,encounter.firstClearReward.materials);assert.equal(r.save.currencies.gold,s.currencies.gold+encounter.firstClearReward.gold);assert.equal(r.save.flags.ranchMaterialsStock,s.flags.ranchMaterialsStock);
 const again=recordColiseumC2BattleResult(r.save,encounter.encounterId,'player_won',4,ids,p,'named-once');assert.deepEqual(getFarmState(again.save).stock,getFarmState(r.save).stock);
 const bonus=syncColiseumC3Rewards(r.save).save;assert.ok((getFarmState(bonus).stock.iron_ore??0)>(getFarmState(r.save).stock.iron_ore??0));assert.deepEqual(getFarmState(syncColiseumC3Rewards(bonus).save).stock,getFarmState(bonus).stock);
});
test('Pella pantry quest recognizes rations and Wood without consuming them',()=>{
 let s=fresh();const q=getNpcQuestChain(s,'pella_mosswick').findIndex(q=>q.objective==='reserve');
 for(let i=0;i<q;i++)s.flags[npcQuestFlag('pella_mosswick',i,'claimed')]=true;
 s=acceptNpcQuest(s,'pella_mosswick',q).save;assert.equal(getNpcQuestChain(s,'pella_mosswick')[q].ready,false);s=grantFarmResources(s,{rations:10,wood:4});assert.equal(getNpcQuestChain(s,'pella_mosswick')[q].ready,true);
});

test('daily named rewards resolve once and fence repairs respect reserved Wood', async()=>{
 const {generateDailyRanchEvent,resolveDailyRanchEventChoice}=await import('@/data/ranch-day/ranchDayEvents');
 const {reserveResource}=await import('@/data/farmResources');
 const eventSave=(choice:string)=>{
  const s=fresh();
  for(let day=1;day<100;day++){
   s.dayState.dayNumber=day;
   const event=generateDailyRanchEvent(s);
   if(event.choices.some(c=>c.choiceId===choice)) return {...s,ranchDay:{...s.ranchDay!,event}};
  }
  throw new Error('Event not found');
 };
 for(const [choice,id,quantity] of [['buy-feed','rations',5],['gather-feed','vegetables',3],['gather-material','wood',1]] as const){
  const s=eventSave(choice);s.currencies.gold=100;
  const r=resolveDailyRanchEventChoice(s,choice);assert.equal(r.ok,true);
  assert.equal(getFarmState(r.save).stock[id],(getFarmState(s).stock[id]??0)+quantity);
  assert.equal(r.save.currencies.gold,s.currencies.gold-(choice==='buy-feed'?35:0));
  const again=resolveDailyRanchEventChoice(r.save,choice);assert.equal(again.ok,false);assert.deepEqual(again.save,r.save);
 }
 let s=grantFarmResources(eventSave('spend-material'),{wood:2});s.flags.ranchDamage=10;
 s=reserveResource(s,'wood',getFarmState(s).stock.wood??0).save;
 assert.equal(resolveDailyRanchEventChoice(s,'spend-material').ok,false);
 s=reserveResource(s,'wood',0).save;
 const repaired=resolveDailyRanchEventChoice(s,'spend-material');assert.equal(repaired.ok,true);assert.equal(repaired.save.flags.ranchDamage,5);assert.equal(getFarmState(repaired.save).stock.wood,(getFarmState(s).stock.wood??0)-1);
 const quick=eventSave('temporary-labor');quick.flags.ranchDamage=10;
 const r=resolveDailyRanchEventChoice(quick,'temporary-labor');assert.equal(r.save.flags.ranchDamage,8);assert.deepEqual(getFarmState(r.save).stock,getFarmState(quick).stock);
});
