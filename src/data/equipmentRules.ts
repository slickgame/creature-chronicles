import type {BattleOutfitterItem,EquipmentSlot} from './battleOutfitterC3';
import type {BattleStats,BattleStatKey} from '@/types/battle';
export const LEGACY_EQUIPMENT_STATS: Record<string, Partial<BattleStats>> = {
 sparring_wraps:{physicalPower:6,specialPower:4,accuracy:3}, guard_charm:{maxHp:12,defense:5,resistance:5,statusResist:3},
 arena_blade_wraps:{physicalPower:8,speed:3,accuracy:3}, focus_prism:{specialPower:8,statusPower:5,accuracy:3},
 bastion_badge:{maxHp:18,defense:7,resistance:5,statusResist:4}, tactician_emblem:{battleEnergy:8,speed:3,statusPower:3,statusResist:2},
 champion_harness:{maxHp:12,physicalPower:4,specialPower:4,defense:4,resistance:4,accuracy:2,battleEnergy:10},
};

export const EQUIPMENT_RARITIES=['Common','Uncommon','Rare','Heroic','Legendary'] as const;
export type EquipmentRarity=typeof EQUIPMENT_RARITIES[number];
export type PowerGrade='D'|'C'|'B'|'A'|'S';
export type EquipmentSetId='vigor'|'bulwark'|'striker'|'swift';
export const EQUIPMENT_SETS={
 vigor:{name:'Vigor',pieces:2,rates:{maxHp:10},description:'+10% base Max HP per completed two-piece group.'},
 bulwark:{name:'Bulwark',pieces:2,rates:{defense:10,resistance:10},description:'+10% base Defense and Special Defense per completed two-piece group.'},
 striker:{name:'Striker',pieces:4,rates:{physicalPower:15,specialPower:15},description:'+15% base Physical and Special Power per completed four-piece group.'},
 swift:{name:'Swift',pieces:4,rates:{speed:10},description:'+10% base Speed per completed four-piece group.'},
} satisfies Record<EquipmentSetId,{name:string;pieces:number;rates:Partial<Record<BattleStatKey,number>>;description:string}>;
const PROFILES:Record<string,{rarity:EquipmentRarity;setId:EquipmentSetId}>={
 training_grips:{rarity:'Common',setId:'striker'},channeling_prism:{rarity:'Rare',setId:'swift'},duelist_grips:{rarity:'Heroic',setId:'striker'},
 padded_harness:{rarity:'Uncommon',setId:'vigor'},warded_harness:{rarity:'Rare',setId:'bulwark'},sentinel_harness:{rarity:'Rare',setId:'bulwark'},
 linen_headband:{rarity:'Common',setId:'vigor'},focus_circlet:{rarity:'Uncommon',setId:'swift'},sentinel_helm:{rarity:'Heroic',setId:'bulwark'},
 practice_wraps:{rarity:'Common',setId:'striker'},runner_bands:{rarity:'Uncommon',setId:'swift'},duelist_bracers:{rarity:'Heroic',setId:'striker'},
 keepsake_charm:{rarity:'Uncommon',setId:'vigor'},reserve_pendant:{rarity:'Rare',setId:'striker'},focus_emblem:{rarity:'Rare',setId:'swift'},
 trail_boots:{rarity:'Common',setId:'vigor'},field_gloves:{rarity:'Rare',setId:'swift'},sentinel_greaves:{rarity:'Rare',setId:'striker'},
 sparring_wraps:{rarity:'Rare',setId:'striker'},guard_charm:{rarity:'Rare',setId:'bulwark'},arena_blade_wraps:{rarity:'Heroic',setId:'striker'},
 focus_prism:{rarity:'Heroic',setId:'swift'},bastion_badge:{rarity:'Heroic',setId:'bulwark'},tactician_emblem:{rarity:'Heroic',setId:'swift'},champion_harness:{rarity:'Legendary',setId:'striker'},
};
export const EQUIPMENT_STAT_POOLS:Record<EquipmentSlot,{main:readonly BattleStatKey[];sub:readonly BattleStatKey[]}>= {
 weapon:{main:['physicalPower','specialPower'],sub:['maxHp','physicalPower','specialPower','speed','accuracy','statusPower','statusResist','battleEnergy']},
 armor:{main:['defense'],sub:['maxHp','defense','resistance','speed','accuracy','statusResist','battleEnergy']},
 head:{main:['maxHp'],sub:['physicalPower','specialPower','defense','resistance','speed','accuracy','statusPower','statusResist','battleEnergy']},
 hands:{main:['physicalPower','specialPower','accuracy'],sub:['maxHp','physicalPower','specialPower','speed','accuracy','statusPower','statusResist','battleEnergy']},
 feet:{main:['speed','maxHp','defense','resistance'],sub:['maxHp','physicalPower','specialPower','defense','resistance','speed','accuracy','statusPower','statusResist','battleEnergy']},
 accessory:{main:['maxHp','physicalPower','specialPower','defense','resistance','accuracy','statusPower','statusResist','battleEnergy'],sub:['maxHp','physicalPower','specialPower','defense','resistance','speed','accuracy','statusPower','statusResist','battleEnergy']},
};
export function getEquipmentRarity(item:BattleOutfitterItem):EquipmentRarity{return item.equipmentRarity??PROFILES[item.itemId]?.rarity??'Common';}
export function getEquipmentSet(item:BattleOutfitterItem,copy?:{setId?:EquipmentSetId|null}):EquipmentSetId|null{return copy?.setId!==undefined?copy.setId:item.equipmentSet??PROFILES[item.itemId]?.setId??null;}
export function getEquipmentPowerGrade(item:BattleOutfitterItem,copy?:{powerGrade?:PowerGrade}):PowerGrade{return copy?.powerGrade??item.equipmentGrade??'D';}
export function startingSubstatCount(rarity:EquipmentRarity){return EQUIPMENT_RARITIES.indexOf(rarity);}
export function equipmentRollRange(grade:PowerGrade,key:BattleStatKey):[number,number]{
 if(key==='speed')return [1,2];
 const [min,max]=({D:[1,2],C:[1,3],B:[2,4],A:[2,5],S:[3,6]} as const)[grade];
 return key==='maxHp'?[min*2,max*2]:[min,max];
}
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
/** Deterministic output: shops and blacksmiths can show exact starting stats before payment. */
export function getEquipmentBlueprint(item:BattleOutfitterItem,rarity:EquipmentRarity=getEquipmentRarity(item)){
 const slot=item.equipmentSlot??'weapon',pool=EQUIPMENT_STAT_POOLS[slot],grade=getEquipmentPowerGrade(item);
 const base=item.statBonuses??LEGACY_EQUIPMENT_STATS[item.itemId]??{},keys=Object.keys(base) as BattleStatKey[];
 const preferred=slot==='head'?'maxHp':slot==='armor'?'defense':item.mainStat??(item.itemId==='focus_prism'?'specialPower':undefined)??keys.find(k=>pool.main.includes(k));
 const mainKey=preferred&&pool.main.includes(preferred)?preferred:pool.main[0];
 const budget=({D:3,C:5,B:7,A:9,S:11} as const)[grade];
 const mainValue=mainKey==='maxHp'?budget*3:mainKey==='speed'?({D:1,C:2,B:3,A:4,S:5} as const)[grade]:mainKey==='defense'||mainKey==='resistance'?budget-1:budget;
 const candidates=pool.sub.filter(k=>k!==mainKey),preferredSubs=keys.filter(k=>candidates.includes(k));
 const remaining=candidates.filter(k=>!preferredSubs.includes(k));
 const offset=hash(item.itemId)%remaining.length;
 const ordered=[...preferredSubs,...remaining.slice(offset),...remaining.slice(0,offset)];
 const initialSubstats=ordered.slice(0,startingSubstatCount(rarity)).map(key=>{const [min,max]=equipmentRollRange(grade,key);return {key,value:base[key]!==undefined?Math.min(max,Math.max(min,base[key]!)):min+hash(`${item.itemId}:${key}`)%(max-min+1)};});
 return {rulesVersion:3 as const,rarity,powerGrade:grade,baseMain:{key:mainKey,value:mainValue},initialSubstats,setId:getEquipmentSet(item)};
}
export type EquipmentSetProgress={id:EquipmentSetId;name:string;count:number;required:number;activations:number;next:number;description:string};
export function equipmentSetProgress(ids:readonly (EquipmentSetId|null)[]):EquipmentSetProgress[]{
 return (Object.keys(EQUIPMENT_SETS) as EquipmentSetId[]).map(id=>{const def=EQUIPMENT_SETS[id],count=ids.filter(v=>v===id).length,activations=Math.floor(count/def.pieces);return {id,name:def.name,count,required:def.pieces,activations,next:(activations+1)*def.pieces,description:def.description};});
}
export function equipmentSetRates(progress:EquipmentSetProgress[]){const rates:Partial<Record<BattleStatKey,number>>={};for(const p of progress)for(const [key,rate] of Object.entries(EQUIPMENT_SETS[p.id].rates))rates[key as BattleStatKey]=(rates[key as BattleStatKey]??0)+rate*p.activations;return rates;}

export const EQUIPMENT_STAT_NAMES:Record<BattleStatKey,string>={maxHp:'Max HP',physicalPower:'Physical Power',specialPower:'Special Power',defense:'Defense',resistance:'Special Defense',speed:'Speed',accuracy:'Accuracy',evasion:'Evasion',statusPower:'Effectiveness',statusResist:'Effect Resistance',battleEnergy:'Max Battle Energy'};
