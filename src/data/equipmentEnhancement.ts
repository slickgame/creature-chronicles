import {LEGACY_EQUIPMENT_STATS,EQUIPMENT_RARITIES,EQUIPMENT_STAT_POOLS,getEquipmentBlueprint,getEquipmentPowerGrade,getEquipmentSet,equipmentRollRange,type EquipmentRarity,type EquipmentSetId,type PowerGrade} from './equipmentRules';
import type { BattleOutfitterItem } from './battleOutfitterC3';
import type { BattleStats, BattleStatKey } from '@/types/battle';
export const MAX_EQUIPMENT_LEVEL = 15;
export {LEGACY_EQUIPMENT_STATS} from './equipmentRules';
export type MilestoneRoll = {level:number;key:BattleStatKey;added:boolean;amount:number};
export type EquipmentCopy = { id:string; itemId:string; level:number; owner?:string; enhancementVersion?:2; legacyThrough?:number; rolls?:MilestoneRoll[]; rulesVersion?:3; rarity?:EquipmentRarity; powerGrade?:PowerGrade; baseMain?:EquipmentStat; initialSubstats?:EquipmentStat[]; setId?:EquipmentSetId|null };
export type EquipmentStat = { key:BattleStatKey; value:number };
const POOL: BattleStatKey[] = ['maxHp','physicalPower','specialPower','defense','resistance','speed','accuracy','statusPower','statusResist','battleEnergy'];
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
const step=(key:BattleStatKey)=>key==='maxHp'?2:1;
export function enhancementCost(item:BattleOutfitterItem, level:number,copy?:Pick<EquipmentCopy,'powerGrade'>):number {
 return ({D:8,C:12,B:18,A:25,S:35}[getEquipmentPowerGrade(item,copy)])*(level+1);
}
export function substatRollRange(item:BattleOutfitterItem,key:BattleStatKey,copy?:Pick<EquipmentCopy,'powerGrade'>):[number,number]{return equipmentRollRange(getEquipmentPowerGrade(item,copy),key);}
export type EquipmentStatsCopy=Pick<EquipmentCopy,'id'|'level'|'enhancementVersion'|'legacyThrough'|'rolls'|'rulesVersion'|'rarity'|'powerGrade'|'baseMain'|'initialSubstats'|'setId'>;
export function createEquipmentCopy(id:string,item:BattleOutfitterItem,owner?:string):EquipmentCopy{return {id,itemId:item.itemId,owner,level:0,enhancementVersion:2,legacyThrough:0,rolls:[],...getEquipmentBlueprint(item)};}
export function equipmentStats(item:BattleOutfitterItem, copy?:EquipmentStatsCopy){
 const base=item.statBonuses??LEGACY_EQUIPMENT_STATS[item.itemId]??{};
 let entries=Object.entries(base) as [BattleStatKey,number][];
 // Preserve the original main stat on owned legacy pieces; new items follow slot rules.
 if(!copy || copy.enhancementVersion===2){
  const key:BattleStatKey=item.equipmentSlot==='armor'?'defense':item.equipmentSlot==='head'?'maxHp':item.equipmentSlot==='weapon'?(base.specialPower&&!base.physicalPower?'specialPower':'physicalPower'):entries[0]?.[0]??'physicalPower';
  const gradeBase=({D:2,C:4,B:6,A:8,S:10} as const)[item.equipmentGrade??'D'];
  const value=base[key]??(key==='maxHp'?gradeBase*3:gradeBase);
  entries=[[key,value],...entries.filter(([k])=>k!==key)];
 }
 const blueprint=!copy||copy.rulesVersion===3?getEquipmentBlueprint(item,copy?.rarity):null;
 if(blueprint)entries=[[copy?.baseMain?.key??blueprint.baseMain.key,copy?.baseMain?.value??blueprint.baseMain.value],...(copy?.initialSubstats??blueprint.initialSubstats).map(st=>[st.key,st.value] as [BattleStatKey,number])];
 const initialCount=Math.min(4,entries.length-1);
 const rarity=blueprint?(copy?.rarity??blueprint.rarity):EQUIPMENT_RARITIES[initialCount];
 const [mainKey,mainValue]=entries[0]??['physicalPower',0];
 const level=Math.max(0,Math.min(15,Math.floor(copy?.level??0)));
 const main:EquipmentStat={key:mainKey,value:mainValue+step(mainKey)*level};
 const substats:EquipmentStat[]=entries.slice(1,5).map(([key,value])=>({key,value}));
 // Existing Relic bonuses beyond the four substats are its fixed passive bonuses.
 const passiveBonuses=blueprint?(item.itemId==='champion_harness'?{accuracy:2,battleEnergy:10}:{}):Object.fromEntries(entries.slice(5)) as Partial<BattleStats>;
 const milestones:{level:number;key:BattleStatKey;added:boolean;amount:number}[]=[];
 for(let milestone=3;milestone<=level;milestone+=3){
  const recorded=copy?.rolls?.find(r=>r.level===milestone);
  const legacyLimit=copy?.legacyThrough??(copy?.enhancementVersion===2?0:Math.min(copy?.level??0,level));
  if(!recorded&&milestone>legacyLimit)continue;
  const roll=hash(`${copy?.id??item.itemId}:${milestone}`);
  const added=substats.length<4;
  const candidates=(blueprint?EQUIPMENT_STAT_POOLS[item.equipmentSlot??'weapon'].sub:POOL).filter(k=>k!==mainKey&&!substats.some(s=>s.key===k)&&!passiveBonuses[k]);
  const key=recorded?.key??(added?candidates[roll%candidates.length]:substats[roll%substats.length].key);
  const amount=recorded?.amount??step(key),existing=substats.find(s=>s.key===key);
  if(existing)existing.value+=amount;else substats.push({key,value:amount});
  milestones.push({level:milestone,key,added,amount});
 }
 const bonuses={...passiveBonuses,[main.key]:main.value} as Partial<BattleStats>;
 for(const sub of substats)bonuses[sub.key]=(bonuses[sub.key]??0)+sub.value;
 const passive=item.itemId==='champion_harness'?'Champion’s Resolve: +2 Accuracy and +10 Max Battle Energy. Start each battle Guarded for 1 round (25% damage reduction); does not stack with Guarded.':null;
 return {level,main,substats,passiveBonuses,passive,milestones,bonuses,rarity,powerGrade:getEquipmentPowerGrade(item,copy),setId:getEquipmentSet(item,copy),initialSubstatCount:initialCount,legacy:!!copy&&copy.rulesVersion!==3};
}

/** Called only after validation and payment eligibility; previews never call this. */
export function rollEquipmentMilestone(item:BattleOutfitterItem,copy:EquipmentCopy,random:()=>number=Math.random):MilestoneRoll{
 const stats=equipmentStats(item,copy),added=stats.substats.length<4;
 const legal=EQUIPMENT_STAT_POOLS[item.equipmentSlot??'weapon'].sub;
 const pool=added?legal.filter(k=>k!==stats.main.key&&!stats.substats.some(s=>s.key===k)&&!stats.passiveBonuses[k]):stats.substats.map(s=>s.key).filter(k=>legal.includes(k)&&k!==stats.main.key);
 if(!pool.length)throw new Error('No legal milestone stat pool.');
 const draw=()=>Math.max(0,Math.min(1-Number.EPSILON,random()));
 const key=pool[Math.floor(draw()*pool.length)];const [min,max]=substatRollRange(item,key,copy);
 return {level:copy.level+1,key,added,amount:min+Math.floor(draw()*(max-min+1))};
}
