import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {BATTLE_OUTFITTER_ITEMS,EQUIPMENT_SLOTS,assignBattleOutfitterEquipment,getEquipmentSlots} from '@/data/battleOutfitter';
import {getEquipmentCopies,syncEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';
import {releaseOrDonateCreature} from '@/data/collection';
import {getCreatureRemovalQuote,confirmCreatureRemoval} from '@/data/creatureRemoval';
import {ensureCurrentGuildState,donateCreatureToGuildContract} from '@/data/guild';
import {applyStarterGoalRewards} from '@/data/starterGoals';
import {ensureMonthlyTaxPosted} from '@/data/taxes';
function fixture(){
 let save=createNewGameSave('Removal QA',0);save.currencies.gold=50000;const c=save.creatures![0],other=save.creatures![1];c.isLocked=false;
 for(const slot of EQUIPMENT_SLOTS){const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.equipmentSlot===slot)!;save.flags[item.flagKey]=Number(save.flags[item.flagKey]??0)+2;const r=assignBattleOutfitterEquipment(save,c.creatureId,item.itemId);assert.ok(r.ok);save=r.save;}
 const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.equipmentSlot==='hands')!;const r=assignBattleOutfitterEquipment(save,other.creatureId,item.itemId);assert.ok(r.ok);save=r.save;
 const worn=getEquipmentCopies(save).find(x=>x.owner===c.creatureId)!;for(let level=0;level<3;level++){const r=enhanceEquipment(save,worn.id,level,()=>.3);assert.ok(r.ok);save=r.save;}
 return {save:syncEquipmentCopies(save),id:c.creatureId,other:other.creatureId};
}
for(const mode of ['release','donate'] as const)test(`${mode} atomically returns all six exact upgraded copies, preserves ancestry and cannot pay twice`,()=>{
 const {save,id,other}=fixture(),before=structuredClone(save),copies=getEquipmentCopies(save),worn=copies.filter(c=>c.owner===id);assert.equal(worn.length,6);
 const quote=getCreatureRemovalQuote(save,id,mode)!;assert.deepEqual(save,before);const result=confirmCreatureRemoval(save,quote);assert.ok(result.ok);assert.deepEqual(save,before);
 const after=result.save,next=getEquipmentCopies(after);assert.equal(next.length,copies.length);for(const c of copies)assert.deepEqual(next.find(n=>n.id===c.id),c.owner===id?{...c,owner:undefined}:c);
 assert.ok(next.some(c=>c.owner===other));assert.ok(!after.creatures!.some(c=>c.creatureId===id));assert.ok(after.habitats!.every(h=>!h.creatureIds.includes(id)));assert.ok(after.familyArchive?.records[`creature:${id}`]);
 for(const c of worn){const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)!;assert.equal(Number(after.flags[item.flagKey]),Number(save.flags[item.flagKey])+1);}
 assert.ok(Object.values(getEquipmentSlots(after,id)).every(v=>v===null));
 assert.equal(after.currencies.gold,save.currencies.gold+quote.reward.gold);assert.equal(after.currencies.guildPoints,save.currencies.guildPoints+quote.reward.guildPoints);
 const again=confirmCreatureRemoval(after,quote);assert.equal(again.ok,false);assert.equal(again.save,after);const normalized=syncEquipmentCopies(syncEquipmentCopies(after));assert.deepEqual(getEquipmentCopies(normalized),next);assert.deepEqual(normalized.currencies,after.currencies);
});
test('legacy slot-only gear is materialized before departure and survives repeated normalization',()=>{
 const {save,id}=fixture();delete save.flags.equipmentCopiesV1;delete save.flags.equipmentRulesVersion;const before=structuredClone(save);const expected=getEquipmentCopies(save);const worn=expected.filter(c=>c.owner===id);const result=releaseOrDonateCreature(save,id,'release');assert.ok(result.ok);assert.deepEqual(save,before);assert.equal(getEquipmentCopies(result.save).length,expected.length);for(const c of worn)assert.deepEqual(JSON.parse(JSON.stringify(getEquipmentCopies(result.save).find(x=>x.id===c.id))),JSON.parse(JSON.stringify({...c,owner:undefined})));assert.deepEqual(getEquipmentCopies(syncEquipmentCopies(result.save)),getEquipmentCopies(result.save));
});
test('locked and training failures return the identical save without unequipping or rewards',()=>{
 for(const kind of ['locked','training']){const {save,id}=fixture();if(kind==='locked')save.creatures![0].isLocked=true;else save.flags[`trainingGroundsAssignment_${id}`]='level_drill';const before=structuredClone(save);for(const mode of ['release','donate'] as const){const r=releaseOrDonateCreature(save,id,mode);assert.equal(r.ok,false);assert.equal(r.save,save);assert.deepEqual(save,before);}}
});
test('stale balance, name, equipment and cross-save reviews cannot commit',()=>{
 const {save,id}=fixture(),quote=getCreatureRemovalQuote(save,id,'donate')!;
 for(const change of [(s:typeof save)=>{s.currencies.gold++;},(s:typeof save)=>{s.creatures![0].nickname='Changed';},(s:typeof save)=>{s.saveId+='other';},(s:typeof save)=>{const copies=JSON.parse(String(s.flags.equipmentCopiesV1));copies.copies.find((c:{owner:string})=>c.owner===id).level++;s.flags.equipmentCopiesV1=JSON.stringify(copies);}]){const next=structuredClone(save);change(next);const before=structuredClone(next);const r=confirmCreatureRemoval(next,quote);assert.equal(r.ok,false);assert.equal(r.save,next);assert.deepEqual(next,before);}
});
test('gauntlet team members cannot depart or return their locked loadout early',()=>{
 const {save,id}=fixture();save.flags.coliseumC4StateV1=JSON.stringify({activeRun:{mode:'gauntlet',challengeKey:'removal-qa',teamCreatureIds:[id]}});const before=structuredClone(save);for(const mode of ['release','donate'] as const){const result=releaseOrDonateCreature(save,id,mode);assert.equal(result.ok,false);assert.match(result.message,/gauntlet/);assert.equal(result.save,save);assert.deepEqual(save,before);}
});
test('review balances include pending starter goals separately from the removal reward',()=>{
 const {save,id}=fixture();save.flags.ranchManualRepairUsed=true;save.flags['starterGoalReward_repair-ranch']=false;const before=structuredClone(save);for(const mode of ['release','donate'] as const){const q=getCreatureRemovalQuote(save,id,mode)!;assert.ok(q.bonusLabel);assert.deepEqual(save,before);const result=confirmCreatureRemoval(save,q);assert.ok(result.ok);const persisted=applyStarterGoalRewards(ensureMonthlyTaxPosted(result.save));assert.equal(q.afterBalances.gold,persisted.currencies.gold);assert.equal(q.afterBalances.guildPoints,persisted.currencies.guildPoints);assert.equal(q.reward.gold,mode==='release'?0:Math.max(50,save.creatures![0].level*35+['S','A','B','C','D'].find(g=>Object.values(save.creatures![0].statGrades).includes(g))!.charCodeAt(0)));}
});
test('guild permanent placement returns exact gear too, without ordinary donation rewards or duplicate returns',()=>{
 const f=fixture();let save=ensureCurrentGuildState(f.save);const contract=save.guild!.contracts.find(c=>c.type==='donate_creature')!;assert.ok(contract);contract.requirement={kind:'any_creature',label:'Test permanent placement'};contract.status='accepted';const before=structuredClone(save),copies=getEquipmentCopies(save);const result=donateCreatureToGuildContract(save,contract.contractId,f.id);assert.ok(result.ok,result.message);assert.deepEqual(save,before);const next=getEquipmentCopies(result.save);assert.equal(next.length,copies.length);for(const c of copies)assert.deepEqual(next.find(n=>n.id===c.id),c.owner===f.id?{...c,owner:undefined}:c);assert.ok(result.save.familyArchive?.records[`creature:${f.id}`]);assert.deepEqual(getEquipmentCopies(syncEquipmentCopies(result.save)),next);const again=donateCreatureToGuildContract(result.save,contract.contractId,f.id);assert.equal(again.ok,false);assert.equal(again.save.currencies.gold,result.save.currencies.gold);assert.deepEqual(getEquipmentCopies(again.save),next);
});
