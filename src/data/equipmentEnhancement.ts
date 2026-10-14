import type { BattleOutfitterItem } from './battleOutfitterC3';
import type { BattleStats, BattleStatKey } from '@/types/battle';
export const MAX_EQUIPMENT_LEVEL = 15;
export const LEGACY_EQUIPMENT_STATS: Record<string, Partial<BattleStats>> = {
 sparring_wraps:{physicalPower:6,specialPower:4,accuracy:3}, guard_charm:{maxHp:12,defense:5,resistance:5,statusResist:3},
 arena_blade_wraps:{physicalPower:8,speed:3,accuracy:3}, focus_prism:{specialPower:8,statusPower:5,accuracy:3},
 bastion_badge:{maxHp:18,defense:7,resistance:5,statusResist:4}, tactician_emblem:{battleEnergy:8,speed:3,statusPower:3,statusResist:2},
 champion_harness:{maxHp:12,physicalPower:4,specialPower:4,defense:4,resistance:4,accuracy:2,battleEnergy:10},
};
export type MilestoneRoll = {level:number;key:BattleStatKey;added:boolean;amount:number};
export type EquipmentCopy = { id:string; itemId:string; level:number; owner?:string; enhancementVersion?:2; legacyThrough?:number; rolls?:MilestoneRoll[] };
export type EquipmentStat = { key:BattleStatKey; value:number };
const POOL: BattleStatKey[] = ['maxHp','physicalPower','specialPower','defense','resistance','speed','accuracy','statusPower','statusResist','battleEnergy'];
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
const step=(key:BattleStatKey)=>key==='maxHp'?2:1;
export function enhancementCost(item:BattleOutfitterItem, level:number):number {
 return ({D:8,C:12,B:18,A:25,S:35}[item.equipmentGrade??'D'])*(level+1);
}
export function substatRollRange(item:BattleOutfitterItem,key:BattleStatKey):[number,number]{
 if(key==='speed')return [1,2];
 const [min,max]=({D:[1,2],C:[1,3],B:[2,4],A:[2,5],S:[3,6]} as const)[item.equipmentGrade??'D'];
 return key==='maxHp'?[min*2,max*2]:[min,max];
}
export function equipmentStats(item:BattleOutfitterItem, copy?:Pick<EquipmentCopy,'id'|'level'|'enhancementVersion'|'legacyThrough'|'rolls'>){
 const base=item.statBonuses??LEGACY_EQUIPMENT_STATS[item.itemId]??{};
 let entries=Object.entries(base) as [BattleStatKey,number][];
 // Preserve the original main stat on owned legacy pieces; new items follow slot rules.
 if(!copy || copy.enhancementVersion===2){
  const key:BattleStatKey=item.equipmentSlot==='armor'?'defense':item.equipmentSlot==='head'?'maxHp':item.equipmentSlot==='weapon'?(base.specialPower&&!base.physicalPower?'specialPower':'physicalPower'):entries[0]?.[0]??'physicalPower';
  const gradeBase=({D:2,C:4,B:6,A:8,S:10} as const)[item.equipmentGrade??'D'];
  const value=base[key]??(key==='maxHp'?gradeBase*3:gradeBase);
  entries=[[key,value],...entries.filter(([k])=>k!==key)];
 }
 const [mainKey,mainValue]=entries[0]??['physicalPower',0];
 const level=Math.max(0,Math.min(15,Math.floor(copy?.level??0)));
 const main:EquipmentStat={key:mainKey,value:mainValue+step(mainKey)*level};
 const substats:EquipmentStat[]=entries.slice(1,5).map(([key,value])=>({key,value}));
 // Existing Relic bonuses beyond the four substats are its fixed passive bonuses.
 const passiveBonuses=Object.fromEntries(entries.slice(5)) as Partial<BattleStats>;
 const milestones:{level:number;key:BattleStatKey;added:boolean;amount:number}[]=[];
 for(let milestone=3;milestone<=level;milestone+=3){
  const recorded=copy?.rolls?.find(r=>r.level===milestone);
  const legacyLimit=copy?.legacyThrough??(copy?.enhancementVersion===2?0:Math.min(copy?.level??0,level));
  if(!recorded&&milestone>legacyLimit)continue;
  const roll=hash(`${copy?.id??item.itemId}:${milestone}`);
  const added=substats.length<4;
  const candidates=POOL.filter(k=>k!==mainKey&&!substats.some(s=>s.key===k)&&!passiveBonuses[k]);
  const key=recorded?.key??(added?candidates[roll%candidates.length]:substats[roll%substats.length].key);
  const amount=recorded?.amount??step(key),existing=substats.find(s=>s.key===key);
  if(existing)existing.value+=amount;else substats.push({key,value:amount});
  milestones.push({level:milestone,key,added,amount});
 }
 const bonuses={...passiveBonuses,[main.key]:main.value} as Partial<BattleStats>;
 for(const sub of substats)bonuses[sub.key]=(bonuses[sub.key]??0)+sub.value;
 const passive=item.itemId==='champion_harness'?'Champion’s Resolve: +2 Accuracy and +10 Max Battle Energy. Start each battle Guarded for 1 round (25% damage reduction); does not stack with Guarded.':null;
 return {level,main,substats,passiveBonuses,passive,milestones,bonuses};
}

/** Called only after validation and payment eligibility; previews never call this. */
export function rollEquipmentMilestone(item:BattleOutfitterItem,copy:EquipmentCopy,random:()=>number=Math.random):MilestoneRoll{
 const stats=equipmentStats(item,copy),added=stats.substats.length<4;
 const pool=added?POOL.filter(k=>k!==stats.main.key&&!stats.substats.some(s=>s.key===k)&&!stats.passiveBonuses[k]):stats.substats.map(s=>s.key);
 const draw=()=>Math.max(0,Math.min(1-Number.EPSILON,random()));
 const key=pool[Math.floor(draw()*pool.length)];const [min,max]=substatRollRange(item,key);
 return {level:copy.level+1,key,added,amount:min+Math.floor(draw()*(max-min+1))};
}
