import type { BattleOutfitterItem } from './battleOutfitterC3';
import type { BattleStats, BattleStatKey } from '@/types/battle';
export const MAX_EQUIPMENT_LEVEL = 15;
export const LEGACY_EQUIPMENT_STATS: Record<string, Partial<BattleStats>> = {
 sparring_wraps:{physicalPower:6,specialPower:4,accuracy:3}, guard_charm:{maxHp:12,defense:5,resistance:5,statusResist:3},
 arena_blade_wraps:{physicalPower:8,speed:3,accuracy:3}, focus_prism:{specialPower:8,statusPower:5,accuracy:3},
 bastion_badge:{maxHp:18,defense:7,resistance:5,statusResist:4}, tactician_emblem:{battleEnergy:8,speed:3,statusPower:3,statusResist:2},
 champion_harness:{maxHp:12,physicalPower:4,specialPower:4,defense:4,resistance:4,accuracy:2,battleEnergy:10},
};
export type EquipmentCopy = { id:string; itemId:string; level:number; owner?:string };
export type EquipmentStat = { key:BattleStatKey; value:number };
const POOL: BattleStatKey[] = ['maxHp','physicalPower','specialPower','defense','resistance','speed','accuracy','statusPower','statusResist','battleEnergy'];
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
const step=(key:BattleStatKey)=>key==='maxHp'?2:1;
export function enhancementCost(item:BattleOutfitterItem, level:number):number {
 return ({D:8,C:12,B:18,A:25,S:35}[item.equipmentGrade??'D'])*(level+1);
}
export function equipmentStats(item:BattleOutfitterItem, copy?:Pick<EquipmentCopy,'id'|'level'>){
 const base=item.statBonuses??LEGACY_EQUIPMENT_STATS[item.itemId]??{};
 const entries=Object.entries(base) as [BattleStatKey,number][];
 const [mainKey,mainValue]=entries[0]??['physicalPower',0];
 const level=Math.max(0,Math.min(15,Math.floor(copy?.level??0)));
 const main:EquipmentStat={key:mainKey,value:mainValue+step(mainKey)*level};
 const substats:EquipmentStat[]=entries.slice(1,5).map(([key,value])=>({key,value}));
 // Existing Relic bonuses beyond the four substats are its fixed passive bonuses.
 const passiveBonuses=Object.fromEntries(entries.slice(5)) as Partial<BattleStats>;
 const milestones:{level:number;key:BattleStatKey;added:boolean;amount:number}[]=[];
 for(let milestone=3;milestone<=level;milestone+=3){
  const roll=hash(`${copy?.id??item.itemId}:${milestone}`);
  const added=substats.length<4;
  const candidates=POOL.filter(k=>k!==mainKey&&!substats.some(s=>s.key===k)&&!passiveBonuses[k]);
  const key=added?candidates[roll%candidates.length]:substats[roll%substats.length].key;
  const amount=step(key),existing=substats.find(s=>s.key===key);
  if(existing)existing.value+=amount;else substats.push({key,value:amount});
  milestones.push({level:milestone,key,added,amount});
 }
 const bonuses={...passiveBonuses,[main.key]:main.value} as Partial<BattleStats>;
 for(const sub of substats)bonuses[sub.key]=(bonuses[sub.key]??0)+sub.value;
 const passive=item.itemId==='champion_harness'?'Champion’s Resolve: +2 Accuracy and +10 Max Battle Energy. Start each battle Guarded for 1 round (25% damage reduction); does not stack with Guarded.':null;
 return {level,main,substats,passiveBonuses,passive,milestones,bonuses};
}
