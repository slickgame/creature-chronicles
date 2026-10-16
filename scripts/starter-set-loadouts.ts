import {createNewGameSave} from '@/lib/save/localSave';
import {BATTLE_OUTFITTER_ITEMS,purchaseBattleOutfitterItem,assignBattleOutfitterEquipment,type BattleOutfitterItemId} from '@/data/battleOutfitter';
import {getEquipmentCopies,enhanceEquipment} from '@/data/equipmentInstances';
import {getBattleOutfitterCreatureEffectSummary} from '@/data/battleOutfitterIntegration';
import {getEquippedBattleStats} from '@/data/equipmentComparison';
import {calculateBattleStats} from '@/data/battleStats';
import type {GameSave} from '@/types/save';

const PLANS:{name:string;items:BattleOutfitterItemId[]}[]=[
 {name:'No gear',items:[]},
 {name:'Vigor pair',items:['linen_headband','keepsake_charm']},
 {name:'Bulwark pair',items:['warded_harness','sentinel_helm']},
 {name:'Swift four',items:['channeling_prism','focus_circlet','field_gloves','runner_bands']},
 {name:'Striker four',items:['training_grips','practice_wraps','sentinel_greaves','reserve_pendant']},
 {name:'Swift four + Vigor pair',items:['channeling_prism','focus_circlet','field_gloves','runner_bands','padded_harness','keepsake_charm']},
 {name:'Striker four + Bulwark pair',items:['training_grips','practice_wraps','sentinel_greaves','reserve_pendant','warded_harness','sentinel_helm']},
];
export const STARTER_SET_PLANS=PLANS;
/** A detached acquisition audit, not a first-week income model or battle win-rate estimate. */
export function auditStarterSetLoadouts(){
 const initial=createNewGameSave('Starter set audit',0);
 const starter=initial.creatures?.[0];if(!starter||initial.creatures?.length!==1||starter.speciesId!=='species_equine')throw Error('Expected the current single-equine new-game start');
 const startGold=initial.currencies.gold,base=calculateBattleStats(starter);
 const rows=PLANS.flatMap(plan=>(plan.items.length?[0,3]:[0]).map(level=>{
  let save=structuredClone(initial);save.currencies.gold=100000;
  let purchaseGold=0,upgradeGold=0;
  const apply=(r:{ok:boolean;save:GameSave;message:string})=>{if(!r.ok)throw Error(r.message);save=r.save;};
  const slots=new Set<string>();
  for(const id of plan.items){
   const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===id);if(!item||item.coliseumExclusive||!item.equipmentSlot)throw Error(`Not Gold shop gear: ${id}`);
   if(slots.has(item.equipmentSlot))throw Error(`Duplicate slot: ${item.equipmentSlot}`);slots.add(item.equipmentSlot);
   let before=save.currencies.gold;apply(purchaseBattleOutfitterItem(save,id));purchaseGold+=before-save.currencies.gold;
   const copy=getEquipmentCopies(save,id).find(c=>!c.owner);if(!copy)throw Error(`Missing purchased instance: ${id}`);
   before=save.currencies.gold;for(let n=0;n<level;n++)apply(enhanceEquipment(save,copy.id,n,()=>0.5));upgradeGold+=before-save.currencies.gold;
   apply(assignBattleOutfitterEquipment(save,starter.creatureId,id,copy.id));
  }
  const totalGold=purchaseGold+upgradeGold;
  if(save.currencies.gold!==100000-totalGold)throw Error('Acquisition costs disagree');
  const stats=getEquippedBattleStats(save,starter),summary=getBattleOutfitterCreatureEffectSummary(save,starter.creatureId);
  return {name:plan.name,level,items:plan.items,purchaseGold,upgradeGold,totalGold,startingGoldRemaining:startGold-totalGold,affordableBeforeFood:totalGold<=startGold,sets:summary.sets?.filter(p=>p.count>0),stats,deltas:Object.fromEntries(Object.entries(stats).map(([key,value])=>[key,value-base[key as keyof typeof base]]))};
 }));
 return {method:'One actual equine starter; real Gold-only purchase, enhancement and equip reducers on detached saves. +3 uses fixed 0.5 RNG as one repeatable example, not expected stat values or win odds. No farming, income, food, mission rewards, unlock progression or battles simulated. Starting-Gold affordability is before food/construction reserves and is not a purchase recommendation.',starterCount:initial.creatures!.length,species:starter.speciesId,startingGold:startGold,base,rows};
}
if(process.argv[1]?.endsWith('starter-set-loadouts.ts'))console.log(JSON.stringify(auditStarterSetLoadouts(),null,2));
