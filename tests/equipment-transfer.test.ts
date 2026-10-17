import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave.ts';
import {purchaseBattleOutfitterItem,assignBattleOutfitterEquipment,removeBattleOutfitterEquipment} from '@/data/battleOutfitter';
import {getEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';
import {getEquipmentActionQuote} from '@/data/equipmentAction';
function fixture(){let save=createNewGameSave('Transfer QA',0);save.currencies.gold=50000;const [donor,recipient]=save.creatures!;
 for(const item of ['field_gloves','channeling_prism','focus_circlet','runner_bands']){save=purchaseBattleOutfitterItem(save,item).save;save=assignBattleOutfitterEquipment(save,donor.creatureId,item).save;}
 save=purchaseBattleOutfitterItem(save,'sparring_wraps').save;save=assignBattleOutfitterEquipment(save,recipient.creatureId,'sparring_wraps').save;
 save=purchaseBattleOutfitterItem(save,'field_gloves').save;
 const selected=getEquipmentCopies(save).find(c=>c.itemId==='field_gloves'&&c.owner===donor.creatureId)!;
 save=enhanceEquipment(save,selected.id,0,()=>0).save;
 return {save,donor:donor.creatureId,recipient:recipient.creatureId,request:{kind:'equip' as const,equipmentId:selected.id,creatureId:recipient.creatureId}};
}
test('transfer previews both creatures, loses donor set once, preserves exact upgraded copy and displaced item without mutating input',()=>{
 const {save,donor,recipient,request}=fixture(),before=JSON.stringify(save),copies=getEquipmentCopies(save),q=getEquipmentActionQuote(save,request);assert.ok(q.ok&&q.donorSnapshot);
 assert.equal(q.donorSnapshot.creatureId,donor);assert.equal(q.donorSnapshot.after,null);assert.equal(q.snapshot.creatureId,recipient);assert.equal(q.snapshot.after?.copy.id,request.equipmentId);
 assert.equal(q.donorSnapshot.sets.current.find(s=>s.id==='swift')?.activations,1);assert.equal(q.donorSnapshot.sets.after.find(s=>s.id==='swift')?.activations,0);
 const next=getEquipmentCopies(q.save);assert.equal(next.length,copies.length);for(const c of copies){const actual=next.find(n=>n.id===c.id)!;const owner=c.id===request.equipmentId?recipient:c.id===q.snapshot.before?.copy.id?undefined:c.owner;assert.deepEqual(actual,{...c,owner});}
 assert.deepEqual(q.save.currencies,save.currencies);assert.equal(JSON.stringify(save),before);assert.equal(getEquipmentActionQuote(q.save,request).ok,false);
});
test('donor and recipient training locks prevent transfers and leave input unchanged',()=>{
 for(const who of ['donor','recipient'] as const){const f=fixture();f.save.flags[`trainingGroundsAssignment_${f[who]}`]='level_drill';const before=JSON.stringify(f.save);const q=getEquipmentActionQuote(f.save,f.request);assert.equal(q.ok,false);assert.equal(JSON.stringify(f.save),before);}
});
test('transfer review is invalidated by either creature stats or owner changes',()=>{
 const f=fixture(),original=getEquipmentActionQuote(f.save,f.request);assert.ok(original.ok);
 for(const id of [f.donor,f.recipient]){const changed=structuredClone(f.save);changed.creatures!.find(c=>c.creatureId===id)!.level+=5;const q=getEquipmentActionQuote(changed,f.request);assert.ok(q.ok);assert.notEqual(q.fingerprint,original.fingerprint);}
 const removed=removeBattleOutfitterEquipment(f.save,f.donor,'hands');assert.ok(removed.ok);const fresh=getEquipmentActionQuote(removed.save,f.request);assert.ok(fresh.ok);assert.notEqual(fresh.fingerprint,original.fingerprint);assert.equal(fresh.donorSnapshot,undefined);
});
test('transfers between duplicate same-item loadouts preserve both copy identities',()=>{
 const f=fixture();let save=f.save;const free=getEquipmentCopies(save).find(c=>c.itemId==='field_gloves'&&!c.owner)!;save=assignBattleOutfitterEquipment(save,f.recipient,'field_gloves',free.id).save;const q=getEquipmentActionQuote(save,f.request);assert.ok(q.ok&&q.donorSnapshot);const next=getEquipmentCopies(q.save);assert.equal(next.find(c=>c.id===free.id)?.owner,undefined);assert.equal(next.find(c=>c.id===f.request.equipmentId)?.owner,f.recipient);assert.equal(next.filter(c=>c.owner===f.donor&&c.itemId==='field_gloves').length,0);assert.equal(next.length,getEquipmentCopies(save).length);
});
test('same wearer and missing recipients are rejected before attempting release',()=>{
 const f=fixture();for(const creatureId of [f.donor,'missing']){const before=JSON.stringify(f.save);const q=getEquipmentActionQuote(f.save,{...f.request,creatureId});assert.equal(q.ok,false);assert.equal(JSON.stringify(f.save),before);}
});
test('gauntlet locks on either creature prevent a transfer without releasing gear',()=>{
 for(const who of ['donor','recipient'] as const){const f=fixture();f.save.flags.coliseumC4StateV1=JSON.stringify({activeRun:{mode:'gauntlet',challengeKey:'transfer-qa',teamCreatureIds:[f[who]]}});const before=JSON.stringify(f.save),q=getEquipmentActionQuote(f.save,f.request);assert.equal(q.ok,false);if(!q.ok)assert.match(q.message,/gauntlet/);assert.equal(JSON.stringify(f.save),before);}
});
