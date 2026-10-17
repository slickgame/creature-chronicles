import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNewGameSave,saveGameToSlot} from './helpers/establishedSave';
import {EQUIPMENT_RARITIES,EQUIPMENT_SETS,EQUIPMENT_STAT_POOLS,getEquipmentBlueprint,equipmentSetProgress,equipmentSetRates,type PowerGrade} from '@/data/equipmentRules';
import {BATTLE_OUTFITTER_ITEMS,purchaseBattleOutfitterItem,assignBattleOutfitterEquipment,removeBattleOutfitterEquipment} from '@/data/battleOutfitter';
import {equipmentStats,createEquipmentCopy,enhancementCost,substatRollRange,rollEquipmentMilestone,type EquipmentCopy} from '@/data/equipmentEnhancement';
import {getEquipmentCopies,syncEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';
import {compareEquipment,getEquippedBattleStats} from '@/data/equipmentComparison';
import {calculateBattleStats} from '@/data/battleStats';
import {createBattleState} from '@/data/battleEngine';
import {applyBattleOutfitterLoadouts} from '@/data/battleOutfitterIntegration';
import {craftBlacksmithEquipment,getBlacksmithQuote,getCraftRevision} from '@/data/blacksmith';
import {grantFarmResources} from '@/data/farmResources';
const item=(id:string)=>BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===id)!;
function fresh(){const save=createNewGameSave('Rarity and sets',0);save.currencies.gold=100000;return syncEquipmentCopies(save);}
test('rarity independently controls 0–4 known starting substats, while grade controls main strength, costs and ranges',()=>{
 const base=item('field_gloves'),mains=[];
 for(const rarity of EQUIPMENT_RARITIES){const custom={...base,equipmentRarity:rarity};const copy=createEquipmentCopy('new',custom),stats=equipmentStats(custom,copy);mains.push(stats.main);
  assert.equal(stats.substats.length,EQUIPMENT_RARITIES.indexOf(rarity));assert.equal(stats.rarity,rarity);assert.equal(copy.powerGrade,'C');assert.equal(new Set(stats.substats.map(s=>s.key)).size,stats.substats.length);
  assert.deepEqual(getEquipmentBlueprint(custom),getEquipmentBlueprint(custom));assert.equal(enhancementCost(custom,3,copy),48);
 }
 assert.ok(mains.every(m=>m.key===mains[0].key&&m.value===mains[0].value));
 let prior=0;for(const grade of ['D','C','B','A','S'] as PowerGrade[]){const custom={...base,equipmentGrade:grade,equipmentRarity:'Rare' as const},copy=createEquipmentCopy('new',custom),stats=equipmentStats(custom,copy);assert.equal(stats.substats.length,2);assert.ok(stats.main.value>prior);prior=stats.main.value;assert.equal(stats.powerGrade,grade);}
});
test('all six slot pools govern new initial stats and every random milestone without preview rolls',()=>{
 for(const gear of BATTLE_OUTFITTER_ITEMS.filter(i=>i.equipmentSlot))for(const rarity of EQUIPMENT_RARITIES){
  const custom={...gear,equipmentRarity:rarity};let copy=createEquipmentCopy('pool-test',custom);
  for(let level=0;level<=15;level++){
   const stats=equipmentStats(custom,copy),pool=EQUIPMENT_STAT_POOLS[gear.equipmentSlot!];assert.ok(pool.main.includes(stats.main.key));assert.ok(stats.substats.every(s=>pool.sub.includes(s.key)&&s.key!==stats.main.key));assert.equal(new Set(stats.substats.map(s=>s.key)).size,stats.substats.length);assert.ok(stats.substats.length<=4);assert.equal(stats.rarity,rarity);
   if(level===15)break;
   // The pure quote and stat inspection never call the RNG.
   const next=copy.level+1;
   if(next%3===0){const roll=rollEquipmentMilestone(custom,copy,()=>level%2?1:0);const range=substatRollRange(custom,roll.key,copy);assert.ok(roll.amount>=range[0]&&roll.amount<=range[1]);copy={...copy,rolls:[...(copy.rolls??[]),roll]};}
   copy={...copy,level:next};
  }
 }
});

test('published pre-update fixture stats, IDs, levels and earned rolls survive read, sync and reload',()=>{
 const fixtures=JSON.parse(readFileSync('tests/fixtures/equipment-v2-stats.json','utf8')) as {copy:EquipmentCopy;stats:ReturnType<typeof equipmentStats>}[];
 let save=fresh();delete save.flags.equipmentRulesVersion;
 for(const gear of BATTLE_OUTFITTER_ITEMS)save.flags[gear.flagKey]=0;
 for(const {copy} of fixtures)save.flags[item(copy.itemId).flagKey]=Number(save.flags[item(copy.itemId).flagKey])+1;
 save.flags.equipmentCopiesV1=JSON.stringify({version:1,serial:0,copies:fixtures.map(f=>f.copy)});
 const before=structuredClone(save);save=syncEquipmentCopies(save);const again=syncEquipmentCopies(JSON.parse(JSON.stringify(save)));
 for(const fixture of fixtures){const copy=getEquipmentCopies(again).find(c=>c.id===fixture.copy.id)!;const actual=equipmentStats(item(copy.itemId),copy);for(const key of ['main','substats','passiveBonuses','passive','milestones','bonuses'] as const)assert.deepEqual(actual[key],fixture.stats[key],fixture.copy.id+':'+key);assert.equal(copy.level,fixture.copy.level);}
 assert.deepEqual(syncEquipmentCopies(again),again);assert.equal(before.flags.equipmentRulesVersion,undefined);
});
test('new purchases/crafts are materialized with exact blueprints; prior legacy upgraded gear is retained',()=>{
 let save=fresh();const blade=item('training_grips');save.flags[blade.flagKey]=1;delete save.flags.equipmentRulesVersion;delete save.flags.equipmentCopiesV1;save=syncEquipmentCopies(save);
 const old=getEquipmentCopies(save,blade.itemId)[0];save=enhanceEquipment(save,old.id,0).save;const prior=structuredClone(getEquipmentCopies(save,blade.itemId).find(c=>c.id===old.id));
 const bought=purchaseBattleOutfitterItem(save,blade.itemId);assert.equal(bought.ok,true);save=bought.save;
 const newCopy=getEquipmentCopies(save,blade.itemId).find(c=>c.id!==old.id)!;assert.equal(newCopy.rulesVersion,3);assert.deepEqual(equipmentStats(blade,newCopy).main,equipmentStats(blade).main);assert.deepEqual(getEquipmentCopies(save,blade.itemId).find(c=>c.id===old.id),prior);
 save=grantFarmResources(save,{iron:20,nails:10});const quote=getBlacksmithQuote(save,'duelist_saber')!;const expected=equipmentStats(quote.item);const crafted=craftBlacksmithEquipment(save,'duelist_saber',getCraftRevision(save));assert.equal(crafted.ok,true);const created=getEquipmentCopies(crafted.save,quote.item.itemId)[0];assert.equal(created.rulesVersion,3);assert.deepEqual(equipmentStats(quote.item,created),expected);
});
test('set thresholds count equipped items only, permit repeated two-piece groups and do not compound',()=>{
 for(const [id,set] of Object.entries(EQUIPMENT_SETS))for(let n=0;n<=6;n++){const progress=equipmentSetProgress(Array.from({length:n},()=>id as keyof typeof EQUIPMENT_SETS));const p=progress.find(p=>p.id===id)!;assert.equal(p.activations,Math.floor(n/set.pieces));const rates=equipmentSetRates(progress);for(const [key,value] of Object.entries(set.rates))assert.equal(rates[key as keyof typeof rates],Math.floor(n/set.pieces)*value);}
});
test('four Swift plus two Vigor apply once from base stats; replacing/removing a piece loses the set in preview and battle',()=>{
 let save=fresh();const creature=save.creatures![0],base=calculateBattleStats(creature),ids=['channeling_prism','focus_circlet','field_gloves','runner_bands','padded_harness','keepsake_charm'];
 for(const id of ids){save=purchaseBattleOutfitterItem(save,id).save;const copy=getEquipmentCopies(save,id).find(c=>!c.owner)!;const preview=compareEquipment(save,creature,item(id),copy.id);save=assignBattleOutfitterEquipment(save,creature.creatureId,id,copy.id).save;assert.deepEqual(getEquippedBattleStats(save,creature),preview.after);}
 const flat=getEquipmentCopies(save).filter(c=>c.owner===creature.creatureId).map(c=>equipmentStats(item(c.itemId),c).bonuses),speedFlat=flat.reduce((n,b)=>n+(b.speed??0),0),hpFlat=flat.reduce((n,b)=>n+(b.maxHp??0),0);
 const totals=getEquippedBattleStats(save,creature);assert.equal(totals.speed,base.speed+speedFlat+Math.floor(base.speed*.1));assert.equal(totals.maxHp,base.maxHp+hpFlat+Math.floor(base.maxHp*.1));
 const snapshot=createBattleState({battleId:'sets',playerCreatures:[creature],enemyCreatures:[save.creatures![1]]}),old=structuredClone(snapshot),battle=applyBattleOutfitterLoadouts(save,snapshot);assert.deepEqual(snapshot,old);assert.deepEqual(battle.combatants[battle.teams.player.combatantIds[0]].battleStats,totals);
 save=purchaseBattleOutfitterItem(save,'practice_wraps').save;const replacement=getEquipmentCopies(save,'practice_wraps').find(c=>!c.owner)!,quote=compareEquipment(save,creature,item('practice_wraps'),replacement.id);
 assert.equal(quote.sets.current.find(s=>s.id==='swift')!.activations,1);assert.equal(quote.sets.after.find(s=>s.id==='swift')!.activations,0);assert.ok(quote.rows.find(r=>r.key==='speed')!.delta<0);
 const assigned=assignBattleOutfitterEquipment(save,creature.creatureId,'practice_wraps',replacement.id);assert.deepEqual(getEquippedBattleStats(assigned.save,creature),quote.after);
 const removed=removeBattleOutfitterEquipment(save,creature.creatureId,'feet');assert.equal(removed.ok,true);assert.equal(getEquippedBattleStats(removed.save,creature).speed,base.speed+speedFlat-equipmentStats(item('runner_bands'),getEquipmentCopies(save,'runner_bands').find(c=>c.owner===creature.creatureId)).bonuses.speed!);
 assert.deepEqual(getEquippedBattleStats(saveGameToSlot(JSON.parse(JSON.stringify(save))),creature),totals);
 const copiesBefore=getEquipmentCopies(save);for(let n=0;n<3;n++)getEquippedBattleStats(save,creature);assert.deepEqual(getEquipmentCopies(save),copiesBefore);
});

test('saved rarity, power and starting rolls stay fixed; invalid or unfunded new-profile upgrades never draw RNG',()=>{
 const gear=item('field_gloves'),copy=createEquipmentCopy('gear_900',gear),before=equipmentStats(gear,copy);
 const future={...gear,equipmentGrade:'S' as const,equipmentRarity:'Legendary' as const,statBonuses:{specialPower:99}};
 assert.deepEqual(equipmentStats(future,copy),before);assert.equal(enhancementCost(future,2,copy),36);assert.deepEqual(substatRollRange(future,'defense',copy),[1,3]);
 const save=fresh();save.flags[gear.flagKey]=1;save.flags.equipmentCopiesV1=JSON.stringify({version:1,serial:900,copies:[copy]});save.currencies.gold=0;
 const noDraw=()=>{throw Error('Failed upgrade must not roll');};for(const [id,level] of [[copy.id,0],[copy.id,1],['missing',0]] as const){const result=enhanceEquipment(save,id,level,noDraw);assert.equal(result.ok,false);assert.equal(result.save,save);}
});
test('four Striker plus two Bulwark use base power and defenses, with no set bonus to the other combatant',()=>{
 let save=fresh();const [wearer,ally]=save.creatures!;
 for(const id of ['training_grips','practice_wraps','sentinel_greaves','reserve_pendant','warded_harness','sentinel_helm']){const purchased=purchaseBattleOutfitterItem(save,id);assert.equal(purchased.ok,true);save=purchased.save;const equipped=assignBattleOutfitterEquipment(save,wearer.creatureId,id);assert.equal(equipped.ok,true);save=equipped.save;}
 const base=calculateBattleStats(wearer),total=getEquippedBattleStats(save,wearer),bonuses=getEquipmentCopies(save).filter(c=>c.owner===wearer.creatureId).map(c=>equipmentStats(item(c.itemId),c).bonuses);
 for(const key of ['physicalPower','specialPower','defense','resistance'] as const){const flat=bonuses.reduce((sum,b)=>sum+(b[key]??0),0),rate=key==='physicalPower'||key==='specialPower'?15:10;assert.equal(total[key],base[key]+flat+Math.floor(base[key]*rate/100));}
 const source=createBattleState({battleId:'striker-bulwark',playerCreatures:[wearer,ally],enemyCreatures:[save.creatures![2]]}),battle=applyBattleOutfitterLoadouts(save,source);
 assert.deepEqual(battle.combatants[battle.teams.player.combatantIds[0]].battleStats,total);assert.deepEqual(battle.combatants[battle.teams.player.combatantIds[1]].battleStats,source.combatants[source.teams.player.combatantIds[1]].battleStats);
});

// Evasion belongs to creature combat stats, never an equipment roll pool.
test('equipment excludes Evasion from every main and substat pool',()=>{
 for(const [slot,pool] of Object.entries(EQUIPMENT_STAT_POOLS)){
  assert.ok(!pool.main.includes('evasion'),`${slot} main`);
  assert.ok(!pool.sub.includes('evasion'),`${slot} sub`);
 }
});
