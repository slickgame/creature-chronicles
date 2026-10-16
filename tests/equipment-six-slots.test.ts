import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {BATTLE_OUTFITTER_ITEMS,EQUIPMENT_SLOTS,getEquipmentSlots,normalizeBattleEquipment,assignBattleOutfitterEquipment,removeBattleOutfitterEquipment} from '@/data/battleOutfitter';
import {getEquipmentCopies,syncEquipmentCopies} from '@/data/equipmentInstances';
import {compareEquipment,getEquippedBattleStats} from '@/data/equipmentComparison';
import {createBattleState} from '@/data/battleEngine';
import {applyBattleOutfitterLoadouts} from '@/data/battleOutfitterIntegration';
test('five-slot saves migrate hands and feet with upgrade IDs and rolls preserved, once and without mutation',()=>{
 for(const itemId of ['runner_bands','duelist_bracers','sparring_wraps']){
  const save=createNewGameSave('Legacy limbs',0),id=save.creatures![0].creatureId;
  save.flags[`battleEquipmentV1_${id}`]=true;save.flags[`battleEquipment_${id}_handsFeet`]=itemId;
  save.flags.equipmentCopiesV1=JSON.stringify({version:1,serial:17,copies:[{id:'gear_17',itemId,owner:id,level:9,enhancementVersion:2,legacyThrough:0,rolls:[{level:3,key:'speed',amount:2,added:true}]}]});
  const before=structuredClone(save),next=syncEquipmentCopies(save),copy=getEquipmentCopies(next).find(c=>c.id==='gear_17')!;
  assert.equal(getEquipmentSlots(next,id)[itemId==='runner_bands'?'feet':'hands'],itemId);
  assert.equal(next.flags[`battleEquipment_${id}_handsFeet`],'');assert.equal(copy.level,9);assert.equal(copy.rolls![0].amount,2);
  assert.deepEqual(syncEquipmentCopies(next),next);assert.equal(normalizeBattleEquipment(next),next);assert.deepEqual(save,before);
 }
});
test('migration collision returns the displaced upgraded item without duplicating or erasing it',()=>{
 const save=createNewGameSave('Collision',0),id=save.creatures![0].creatureId;
 save.flags[`battleEquipmentV1_${id}`]=true;save.flags[`battleEquipment_${id}_handsFeet`]='runner_bands';save.flags[`battleEquipment_${id}_feet`]='trail_boots';
 save.flags.equipmentCopiesV1=JSON.stringify({version:1,serial:2,copies:[{id:'gear_1',itemId:'runner_bands',owner:id,level:12,enhancementVersion:2,rolls:[]},{id:'gear_2',itemId:'trail_boots',owner:id,level:3,enhancementVersion:2,rolls:[]}]});
 const next=syncEquipmentCopies(save),copies=getEquipmentCopies(next);
 assert.equal(copies.find(c=>c.id==='gear_1')?.owner,undefined);assert.equal(copies.find(c=>c.id==='gear_1')?.level,12);
 assert.equal(copies.find(c=>c.id==='gear_2')?.owner,id);assert.equal(copies.length,2);assert.deepEqual(syncEquipmentCopies(next),next);
});
test('six independent slots equip together; preview equals battle and removing feet leaves hands intact',()=>{
 let save=createNewGameSave('Six slots',0);const c=save.creatures![0];
 assert.equal(EQUIPMENT_SLOTS.length,6);
 for(const slot of EQUIPMENT_SLOTS){const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.equipmentSlot===slot)!;save.flags[item.flagKey]=1;
  const quote=compareEquipment(save,c,item),result=assignBattleOutfitterEquipment(save,c.creatureId,item.itemId);assert.equal(result.ok,true);save=result.save;assert.deepEqual(getEquippedBattleStats(save,c),quote.after);
 }
 const slots=getEquipmentSlots(save,c.creatureId);assert.equal(Object.values(slots).filter(Boolean).length,6);
 const battle=applyBattleOutfitterLoadouts(save,createBattleState({battleId:'six-qa',playerCreatures:[c],enemyCreatures:[save.creatures![1]]}));
 assert.deepEqual(battle.combatants[battle.teams.player.combatantIds[0]].battleStats,getEquippedBattleStats(save,c));
 const removed=removeBattleOutfitterEquipment(save,c.creatureId,'feet');assert.equal(removed.ok,true);assert.equal(getEquipmentSlots(removed.save,c.creatureId).hands,slots.hands);assert.equal(getEquipmentSlots(removed.save,c.creatureId).feet,null);
});
