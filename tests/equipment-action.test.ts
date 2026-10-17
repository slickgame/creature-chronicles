import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave.ts';
import {purchaseBattleOutfitterItem,assignBattleOutfitterEquipment} from '@/data/battleOutfitter';
import {getEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';
import {getEquipmentActionQuote} from '@/data/equipmentAction';
function fixture(){let save=createNewGameSave('Shared equipment routes',0);save.currencies.gold=10000;save=purchaseBattleOutfitterItem(save,'sparring_wraps').save;save=purchaseBattleOutfitterItem(save,'sparring_wraps').save;return {save,id:save.creatures![0].creatureId,copies:getEquipmentCopies(save).filter(c=>c.itemId==='sparring_wraps')};}
test('shared route quote previews the requested duplicate copy and never writes to its input',()=>{
 const {save,id,copies}=fixture(),before=JSON.stringify(save);const q=getEquipmentActionQuote(save,{kind:'equip',creatureId:id,equipmentId:copies[1].id});assert.ok(q.ok);assert.equal(q.snapshot.after?.copy.id,copies[1].id);assert.equal(getEquipmentCopies(q.save).find(c=>c.id===copies[0].id)?.owner,undefined);assert.equal(q.save.currencies.gold,save.currencies.gold);assert.equal(JSON.stringify(save),before);
 const removal=getEquipmentActionQuote(q.save,{kind:'remove',creatureId:id,equipmentId:copies[1].id});assert.ok(removal.ok);assert.equal(removal.snapshot.before?.copy.id,copies[1].id);assert.equal(removal.snapshot.after,null);assert.equal(getEquipmentCopies(removal.save).find(c=>c.id===copies[1].id)?.owner,undefined);
});
test('shared route rejects wrong owners, unavailable exact copies and training recipients',()=>{
 const {save,id,copies}=fixture();const worn=assignBattleOutfitterEquipment(save,id,'sparring_wraps',copies[0].id).save;
 assert.equal(getEquipmentActionQuote(worn,{kind:'remove',creatureId:id,equipmentId:copies[1].id}).ok,false);
 assert.equal(getEquipmentActionQuote(worn,{kind:'remove',creatureId:worn.creatures![1].creatureId,equipmentId:copies[0].id}).ok,false);
 assert.equal(getEquipmentActionQuote(save,{kind:'equip',creatureId:id,equipmentId:'missing'}).ok,false);
 worn.flags[`trainingGroundsAssignment_${id}`]='level_drill';assert.equal(getEquipmentActionQuote(worn,{kind:'remove',creatureId:id,equipmentId:copies[0].id}).ok,false);assert.equal(getEquipmentActionQuote(worn,{kind:'equip',creatureId:id,equipmentId:copies[1].id}).ok,false);
});
test('review fingerprints stay stable across detached previews and change after an exact-copy upgrade',()=>{
 const {save,id,copies}=fixture(),request={kind:'equip' as const,creatureId:id,equipmentId:copies[1].id};const first=getEquipmentActionQuote(save,request),second=getEquipmentActionQuote(save,request);assert.ok(first.ok&&second.ok);assert.equal(first.fingerprint,second.fingerprint);
 const upgraded=enhanceEquipment(save,copies[1].id,0,()=>0);assert.ok(upgraded.ok);const fresh=getEquipmentActionQuote(upgraded.save,request);assert.ok(fresh.ok);assert.notEqual(first.fingerprint,fresh.fingerprint);assert.equal(first.snapshot.after?.copy.level,0);assert.equal(fresh.snapshot.after?.copy.level,1);
});
