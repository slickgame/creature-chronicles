import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave.ts';
import {purchaseBattleOutfitterItem,assignBattleOutfitterEquipment,removeBattleOutfitterEquipment} from '@/data/battleOutfitter';
import {getEquipmentChangeSnapshot,equipmentRemovalBlocker} from '@/data/equipmentChangeSnapshot';
import {calculateBattleStats} from '@/data/battleStats';
import {getEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';

function fixture(){let save=createNewGameSave('Receipt QA',0);save.currencies.gold=50000;const id=save.creatures![0].creatureId;for(const item of ['field_gloves','channeling_prism','focus_circlet','runner_bands','sparring_wraps']){save=purchaseBattleOutfitterItem(save,item).save;if(item!=='sparring_wraps')save=assignBattleOutfitterEquipment(save,id,item).save;}return {save,id};}
test('removal snapshot includes total lost Swift effects once and keeps both saves untouched',()=>{
 const {save,id}=fixture(),removed=removeBattleOutfitterEquipment(save,id,'hands');assert.ok(removed.ok);const untouched=JSON.stringify([save,removed.save]);const snapshot=getEquipmentChangeSnapshot(save,removed.save,id,'hands','remove')!;
 assert.equal(snapshot.before?.item.itemId,'field_gloves');assert.equal(snapshot.after,null);assert.equal(snapshot.sets.current.find(s=>s.id==='swift')?.activations,1);assert.equal(snapshot.sets.after.find(s=>s.id==='swift')?.activations,0);
 assert.equal(snapshot.rows.find(r=>r.key==='speed')?.delta,-(2+Math.floor(calculateBattleStats(save.creatures!.find(c=>c.creatureId===id)!).speed/10)));assert.equal(snapshot.rows.find(r=>r.key==='physicalPower')?.delta,-5);assert.equal(snapshot.rows.find(r=>r.key==='accuracy')?.delta,-2);assert.equal(JSON.stringify([save,removed.save]),untouched);
 assert.equal(removed.save.currencies.gold,save.currencies.gold);
});
test('replacement receipt retains previous copy and remains fixed after later equipment upgrades',()=>{
 const {save,id}=fixture(),copy=getEquipmentCopies(save).find(c=>c.itemId==='sparring_wraps')!;const equipped=assignBattleOutfitterEquipment(save,id,'sparring_wraps',copy.id);assert.ok(equipped.ok);
 const receipt=getEquipmentChangeSnapshot(save,equipped.save,id,'hands','equip')!,frozen=JSON.stringify(receipt);assert.equal(receipt.after?.copy.id,copy.id);assert.equal(receipt.before?.item.itemId,'field_gloves');assert.equal(getEquipmentCopies(equipped.save).find(c=>c.id===receipt.before?.copy.id)?.owner,undefined);
 const upgraded=enhanceEquipment(equipped.save,copy.id,0,()=>0);assert.ok(upgraded.ok);assert.equal(JSON.stringify(receipt),frozen);assert.equal(receipt.after?.copy.level,0);assert.equal(receipt.rows.find(r=>r.key==='speed')?.delta,-(2+Math.floor(calculateBattleStats(save.creatures!.find(c=>c.creatureId===id)!).speed/10)));
});
test('missing recipients cannot produce receipts or pass removal availability checks',()=>{
 const {save}=fixture();assert.equal(getEquipmentChangeSnapshot(save,save,'missing','hands','remove'),null);assert.ok(equipmentRemovalBlocker(save,'missing'));assert.equal(equipmentRemovalBlocker(save,save.creatures![0].creatureId),null);const id=save.creatures![0].creatureId;save.flags[`trainingGroundsAssignment_${id}`]='level_drill';assert.match(equipmentRemovalBlocker(save,id)!,/Rhea/);
});
