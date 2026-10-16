import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createNewGameSave,saveGameToSlot } from "./helpers/establishedSave.ts";
import { BATTLE_OUTFITTER_ITEMS, getBattleOutfitterStock, assignBattleOutfitterEquipment, removeBattleOutfitterEquipment, purchaseBattleOutfitterItem } from '@/data/battleOutfitter';
import { getEquipmentCopies,getEnhancementQuote,enhanceEquipment,syncEquipmentCopies } from '@/data/equipmentInstances';
import { equipmentStats,substatRollRange,rollEquipmentMilestone,LEGACY_EQUIPMENT_STATS } from '@/data/equipmentEnhancement';
import { compareEquipment } from '@/data/equipmentComparison';
import { createBattleState } from '@/data/battleEngine';
import { applyBattleOutfitterLoadouts,applyEquipmentOpeningPassives } from '@/data/battleOutfitterIntegration';
import { applyColiseumC4Carryover } from '@/data/coliseumC4';
const item=(id:string)=>BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===id)!;
const fresh=()=>{const s=createNewGameSave('Upgrade QA',0);s.currencies.gold=100000;for(const i of BATTLE_OUTFITTER_ITEMS.filter(i=>i.equipmentSlot))s.flags[i.flagKey]=2;return syncEquipmentCopies(s);};
test('all equipment preserves every original +0 bonus and has one main stat and at most four substats',()=>{
 for(const i of BATTLE_OUTFITTER_ITEMS.filter(i=>i.equipmentSlot)){
  const v=equipmentStats(i,{id:'legacy',level:0});assert.deepEqual(v.bonuses,i.statBonuses??LEGACY_EQUIPMENT_STATS[i.itemId]);assert.ok(v.main.value>0);assert.ok(v.substats.length<=4);
  assert.equal(new Set(v.substats.map(s=>s.key)).size,v.substats.length);assert.ok(!v.substats.some(s=>s.key===v.main.key));
 }
});
test('all items upgrade +0 to +15 with exact Gold cost, five milestones and four substats; other copy is unchanged',()=>{
 for(const i of BATTLE_OUTFITTER_ITEMS.filter(i=>i.equipmentSlot)){
  let s=fresh();const [copy,other]=getEquipmentCopies(s,i.itemId),original=structuredClone(s);let spend=0;
  for(let level=0;level<15;level++){
   const q=getEnhancementQuote(s,copy.id)!;assert.equal(q.copy.level,level);assert.ok(q.cost>0);spend+=q.cost;
   const r=enhanceEquipment(s,copy.id,level);assert.equal(r.ok,true);assert.equal(r.save.currencies.gold,s.currencies.gold-q.cost);
   const after=getEnhancementQuote(r.save,copy.id)!;assert.deepEqual(after.before.main,q.after.main);assert.ok(after.before.main.value>q.before.main.value);
   assert.equal(after.before.milestones.length,Math.floor((level+1)/3));assert.ok(after.before.substats.length<=4);
   if((level+1)%3!==0)assert.deepEqual(after.before.substats,q.before.substats);
   s=r.save;
  }
  assert.equal(s.currencies.gold,original.currencies.gold-spend);assert.equal(getEquipmentCopies(s,i.itemId).find(c=>c.id===other.id)!.level,0);
  assert.equal(getEnhancementQuote(s,copy.id)!.before.substats.length,4);
  const max=enhanceEquipment(s,copy.id,15);assert.equal(max.ok,false);assert.equal(max.save,s);assert.deepEqual(s.creatures,original.creatures);
  assert.deepEqual(s.currencies.guildPoints,original.currencies.guildPoints);assert.equal(s.flags.farmResourcesV1,original.flags.farmResourcesV1);
 }
});
test('upgraded copies persist and can swap same item types between inventory and creatures without duplication',()=>{
 let s=fresh();const i=item('training_grips'),[a,b]=getEquipmentCopies(s,i.itemId),c=s.creatures![0],d=s.creatures![1];
 for(let n=0;n<6;n++)s=enhanceEquipment(s,a.id,n).save;
 s=assignBattleOutfitterEquipment(s,c.creatureId,i.itemId,a.id).save;
 assert.equal(getEquipmentCopies(s,i.itemId).find(x=>x.owner===c.creatureId)!.level,6);assert.equal(getBattleOutfitterStock(s,i),1);
 s=assignBattleOutfitterEquipment(s,c.creatureId,i.itemId,b.id).save;
 assert.equal(getBattleOutfitterStock(s,i),1);assert.equal(getEquipmentCopies(s,i.itemId).find(x=>x.id===a.id)!.owner,undefined);
 s=assignBattleOutfitterEquipment(s,d.creatureId,i.itemId,a.id).save;
 assert.equal(getBattleOutfitterStock(s,i),0);assert.equal(assignBattleOutfitterEquipment(s,c.creatureId,i.itemId,a.id).ok,false);
 s=removeBattleOutfitterEquipment(s,d.creatureId,'weapon').save;s=saveGameToSlot(s);
 assert.equal(getEquipmentCopies(s,i.itemId).find(x=>x.id===a.id)!.level,6);assert.equal(getBattleOutfitterStock(s,i),1);assert.equal(getEquipmentCopies(s,i.itemId).length,2);
});
test('invalid, stale, duplicate and insufficient-Gold upgrades leave saves unchanged',()=>{
 let s=fresh();const c=getEquipmentCopies(s)[0];s=enhanceEquipment(s,c.id,0).save;
 for(const [id,level] of [[c.id,0],['missing',0],[c.id,NaN]] as const){const r=enhanceEquipment(s,id,level);assert.equal(r.ok,false);assert.equal(r.save,s);}
 s={...s,currencies:{...s.currencies,gold:0}};assert.equal(enhanceEquipment(s,c.id,1).save,s);
});
test('purchase and externally granted stock add new +0 copies without resetting upgraded gear; departed creatures return gear',()=>{
 let s=fresh();const i=item('training_grips'),c=getEquipmentCopies(s,i.itemId)[0];s=enhanceEquipment(s,c.id,0).save;
 s=saveGameToSlot(purchaseBattleOutfitterItem(s,i.itemId).save);assert.equal(getEquipmentCopies(s,i.itemId).length,3);assert.equal(getEquipmentCopies(s,i.itemId).filter(x=>x.level===0).length,2);
 s={...s,flags:{...s.flags,[i.flagKey]:Number(s.flags[i.flagKey])+1}};s=syncEquipmentCopies(s);assert.equal(getEquipmentCopies(s,i.itemId).length,4);
 const owner=s.creatures![0];s=assignBattleOutfitterEquipment(s,owner.creatureId,i.itemId,c.id).save;
 s=syncEquipmentCopies({...s,creatures:s.creatures!.filter(x=>x.creatureId!==owner.creatureId)});
 assert.equal(getEquipmentCopies(s,i.itemId).find(x=>x.id===c.id)!.owner,undefined);assert.equal(getEquipmentCopies(s,i.itemId).find(x=>x.id===c.id)!.level,1);assert.equal(getBattleOutfitterStock(s,i),4);assert.deepEqual(syncEquipmentCopies(s),s);
});
test('enhanced comparison equals actual new-battle stats and existing battle snapshots are unchanged',()=>{
 let s=fresh();const c=s.creatures![0],i=item('training_grips'),copy=getEquipmentCopies(s,i.itemId)[0];
 for(let n=0;n<15;n++)s=enhanceEquipment(s,copy.id,n).save;
 const preview=compareEquipment(s,c,i,copy.id);s=assignBattleOutfitterEquipment(s,c.creatureId,i.itemId,copy.id).save;
 const base=createBattleState({battleId:'upgrade',playerCreatures:[c],enemyCreatures:[s.creatures![1]]});const old=structuredClone(base),battle=applyBattleOutfitterLoadouts(s,base);
 assert.deepEqual(battle.combatants[battle.teams.player.combatantIds[0]].battleStats,preview.after);assert.deepEqual(base,old);
});
test('Champion Resolve applies only to wearer, does not stack, and survives gauntlet carryover initialization',()=>{
 let s=fresh();const c=s.creatures![0];s=assignBattleOutfitterEquipment(s,c.creatureId,'champion_harness').save;
 const base=createBattleState({battleId:'relic',playerCreatures:s.creatures!.slice(0,2),enemyCreatures:[s.creatures![2]]});
 let b=applyBattleOutfitterLoadouts(s,base);const wearer=b.teams.player.combatantIds[0],ally=b.teams.player.combatantIds[1];assert.equal(b.combatants[wearer].statuses.filter(x=>x.status==='guarded').length,1);assert.equal(b.combatants[ally].statuses.length,0);
 b=applyEquipmentOpeningPassives(s,b);assert.equal(b.combatants[wearer].statuses.filter(x=>x.status==='guarded').length,1);
 b=applyEquipmentOpeningPassives(s,applyColiseumC4Carryover(b,{[c.creatureId]:{hpRatio:.5,battleEnergyRatio:.5}}));assert.equal(b.combatants[wearer].statuses.find(x=>x.status==='guarded')?.duration,1);
});
test('every equipment item has a real distinct WebP asset',()=>{
 const equipment=BATTLE_OUTFITTER_ITEMS.filter(i=>i.equipmentSlot),hashes=new Set<string>();
 for(const i of equipment){const data=readFileSync('public'+i.iconPath);assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WEBP');assert.ok(data.length>1000);hashes.add(createHash('sha256').update(data).digest('hex'));}
 assert.equal(hashes.size,equipment.length);
});

test('new slot main stats are predictable while legacy owned main stats are preserved',()=>{
 for(const i of BATTLE_OUTFITTER_ITEMS.filter(i=>i.equipmentSlot)){
  const modern=equipmentStats(i,{id:'new',level:0,enhancementVersion:2});
  if(i.equipmentSlot==='head')assert.equal(modern.main.key,'maxHp');
  if(i.equipmentSlot==='armor')assert.equal(modern.main.key,'defense');
  if(i.equipmentSlot==='weapon')assert.ok(['physicalPower','specialPower'].includes(modern.main.key));
 }
 const s=fresh();delete s.flags.equipmentCopiesV1;delete s.flags.equipmentRulesVersion;
 for(const c of getEquipmentCopies(s))assert.deepEqual(equipmentStats(item(c.itemId),c).bonuses,item(c.itemId).statBonuses??LEGACY_EQUIPMENT_STATS[c.itemId]);
});
test('milestones draw eligible stats within inclusive grade ranges and persist without preview leaks or rerolls',()=>{
 for(const i of BATTLE_OUTFITTER_ITEMS.filter(i=>i.equipmentSlot)){
  let s=fresh();const c=getEquipmentCopies(s,i.itemId)[0];
  s=enhanceEquipment(s,c.id,0).save;s=enhanceEquipment(s,c.id,1).save;
  const q=getEnhancementQuote(s,c.id)!;assert.deepEqual(q.after.substats,q.before.substats);assert.equal(q.after.milestones.length,0);
  for(const endpoint of [0,1]){
   const r=enhanceEquipment(s,c.id,2,()=>endpoint);assert.equal(r.ok,true);
   const copy=getEquipmentCopies(r.save,i.itemId).find(x=>x.id===c.id)!;
   const reward=copy.rolls![0];assert.notEqual(reward.key,q.before.main.key);
   assert.equal(reward.amount,substatRollRange(i,reward.key)[endpoint]);
   const before=equipmentStats(i,copy);assert.deepEqual(equipmentStats(i,getEquipmentCopies(syncEquipmentCopies(JSON.parse(JSON.stringify(r.save))),i.itemId).find(x=>x.id===c.id)!),before);
   assert.equal(enhanceEquipment(r.save,c.id,2,()=>{throw Error('stale upgrade must not roll');}).ok,false);
  }
  const full={...q.copy,level:12,legacyThrough:12};const before=equipmentStats(i,full);const roll=rollEquipmentMilestone(i,full,()=>0);
  assert.equal(roll.added,false);assert.ok(before.substats.some(x=>x.key===roll.key));
 }
});
test('legacy earned milestones survive migration; only future successful milestones roll',()=>{
 let s=fresh();const i=item('duelist_grips');s.flags.equipmentCopiesV1=JSON.stringify({version:1,serial:100,copies:[{id:'gear_100',itemId:i.itemId,level:5}]});
 const old=equipmentStats(i,{id:'gear_100',level:5});s=syncEquipmentCopies(s);const q=getEnhancementQuote(s,'gear_100')!;
 assert.deepEqual(q.before,old);assert.deepEqual(q.after.substats,old.substats);
 const r=enhanceEquipment(s,'gear_100',5,()=>0);const after=getEnhancementQuote(r.save,'gear_100')!.before;
 assert.deepEqual(after.milestones[0],old.milestones[0]);assert.equal(after.milestones.length,2);
});
