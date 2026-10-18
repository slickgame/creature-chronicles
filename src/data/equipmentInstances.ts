import { BATTLE_OUTFITTER_ITEMS, EQUIPMENT_SLOTS, getEquipmentSlots, normalizeBattleEquipment, type BattleOutfitterItem } from '@/data/battleOutfitter';
import { equipmentStats, createEquipmentCopy, rollEquipmentMilestone, enhancementCost, MAX_EQUIPMENT_LEVEL, type EquipmentCopy } from './equipmentEnhancement';
import type { GameSave } from '@/types/save';
const FLAG='equipmentCopiesV1';
type Collection={version:1;serial:number;copies:EquipmentCopy[]};
const count=(v:unknown)=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
/** Existing count flags remain compatible with every shop/reward. New copies enter at +0. */
export function getEquipmentCollection(input:GameSave):Collection {
 const save=normalizeBattleEquipment(input);
 let raw:Partial<Collection>={};try{raw=JSON.parse(String(save.flags[FLAG]??'{}'))??{};}catch{}
 const catalog=BATTLE_OUTFITTER_ITEMS.filter(i=>i.equipmentSlot);
 const seen=new Set<string>();
 const old:EquipmentCopy[]=Array.isArray(raw.copies)?raw.copies.filter(c=>{
  if(!c||typeof c.id!=='string'||seen.has(c.id)||!catalog.some(i=>i.itemId===c.itemId))return false;
  seen.add(c.id);return true;
 }).map(c=>({...c,level:Math.min(15,count(c.level)),owner:typeof c.owner==='string'?c.owner:undefined,legacyThrough:c.legacyThrough??(c.enhancementVersion===2?0:Math.min(15,count(c.level))),rolls:c.rolls??[]})):[];
 let serial=Math.max(count(raw.serial),...old.map(c=>count(c.id.replace(/^gear_/,''))),0);
 const copies:EquipmentCopy[]=[];const used=new Set<string>();
 const make=(itemId:string,owner?:string)=>save.flags.equipmentRulesVersion===3?createEquipmentCopy(`gear_${++serial}`,catalog.find(i=>i.itemId===itemId)!,owner):({id:`gear_${++serial}`,itemId,level:0,owner,enhancementVersion:Array.isArray(raw.copies)?2 as const:undefined,legacyThrough:0,rolls:[]});
 const slots=(save.creatures??[]).map(c=>({id:String(c.creatureId),slots:getEquipmentSlots(save,c.creatureId)}));
 for(const item of catalog){
  for(const c of slots.filter(c=>c.slots[item.equipmentSlot!]===item.itemId)){
   const existing=old.find(x=>x.itemId===item.itemId&&x.owner===c.id&&!used.has(x.id));
   const copy=existing??make(item.itemId,c.id);used.add(copy.id);copies.push(copy);
  }
  const available=old.filter(x=>x.itemId===item.itemId&&!x.owner&&!used.has(x.id));
  for(let n=0;n<count(save.flags[item.flagKey]);n++){
   const copy=available[n]??make(item.itemId);used.add(copy.id);copies.push(copy);
  }
 }
 return {version:1,serial,copies};
}
function write(save:GameSave,collection:Collection):GameSave{return {...save,flags:{...save.flags,[FLAG]:JSON.stringify(collection)}};}
export function getEquipmentCopies(save:GameSave,itemId?:string){return getEquipmentCollection(save).copies.filter(c=>!itemId||c.itemId===itemId);}
export function getEquippedCopy(save:GameSave,owner:string,itemId:string){return getEquipmentCopies(save,itemId).find(c=>c.owner===owner);}
export function getPreviewCopy(save:GameSave,owner:string,item:BattleOutfitterItem,copyId?:string|null){
 if(copyId===null)return createEquipmentCopy(`new_${item.itemId}`,item);
 const copies=getEquipmentCopies(save,item.itemId);
 return (copyId?copies.find(c=>c.id===copyId):copies.find(c=>c.owner===owner)??copies.find(c=>!c.owner))??createEquipmentCopy(`new_${item.itemId}`,item);
}
export function withEquipmentPreview(save:GameSave,owner:string,item:BattleOutfitterItem,copy:EquipmentCopy){
 const collection=getEquipmentCollection(save);
 collection.copies=collection.copies.filter(c=>!(c.owner===owner&&BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===item.equipmentSlot)&&c.id!==copy.id);
 collection.copies.push({...copy,owner});
 return write(save,collection);
}
/** Called with the old save before compatibility counts and slots are changed. */
export function moveEquipmentCopy(before:GameSave,after:GameSave,owner:string,item:BattleOutfitterItem,copyId?:string){
 const collection=getEquipmentCollection(before);
 const selected=collection.copies.find(c=>!c.owner&&c.itemId===item.itemId&&(!copyId||c.id===copyId));
 if(!selected)return after;
 collection.copies=collection.copies.map(c=>c.id===selected.id?{...c,owner}:c.owner===owner&&BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===item.equipmentSlot?{...c,owner:undefined}:c);
 return write(after,collection);
}
export function releaseEquipmentCopy(before:GameSave,after:GameSave,owner:string,itemId:string){
 const collection=getEquipmentCollection(before);collection.copies=collection.copies.map(c=>c.owner===owner&&c.itemId===itemId?{...c,owner:undefined}:c);return write(after,collection);
}
/** Materialize legacy copies before departure, then return the same copies in one save. */
export function returnDepartingCreatureEquipment(input:GameSave,owner:string){
 const save=syncEquipmentCopies(input),collection=getEquipmentCollection(save);
 const returned=collection.copies.filter(c=>c.owner===owner);
 if(!returned.length)return {save,returned};
 const flags={...save.flags};
 for(const copy of returned){const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===copy.itemId)!;flags[item.flagKey]=count(flags[item.flagKey])+1;}
 for(const slot of EQUIPMENT_SLOTS)flags[`battleEquipment_${owner}_${slot}`]='';
 collection.copies=collection.copies.map(c=>c.owner===owner?{...c,owner:undefined}:c);
 return {save:write({...save,flags},collection),returned};
}
export function getEnhancementQuote(save:GameSave,copyId:string){
 const copy=getEquipmentCopies(save).find(c=>c.id===copyId);
 const item=copy&&BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===copy.itemId);
 if(!copy||!item)return null;
 const cost=enhancementCost(item,copy.level,copy),maxed=copy.level>=MAX_EQUIPMENT_LEVEL;
 return {copy,item,cost,maxed,before:equipmentStats(item,copy),after:equipmentStats(item,{...copy,level:Math.min(15,copy.level+1)}),canUpgrade:!maxed&&save.currencies.gold>=cost};
}
export function enhanceEquipment(save:GameSave,copyId:string,expectedLevel:number,random:()=>number=Math.random){
 const fail=(message:string)=>({save,ok:false,message});
 const quote=getEnhancementQuote(save,copyId);
 if(!quote)return fail('Equipment copy not found.');
 if(expectedLevel!==quote.copy.level)return fail('This upgrade review is stale. Review the current copy again.');
 if(quote.maxed)return fail('This equipment is already +15.');
 if(!quote.canUpgrade)return fail(`Need ${quote.cost} Gold. No materials are charged.`);
 const collection=getEquipmentCollection(save);
 const milestone=(quote.copy.level+1)%3===0?rollEquipmentMilestone(quote.item,quote.copy,random):null;
 collection.copies=collection.copies.map(c=>c.id===copyId?{...c,level:c.level+1,rolls:milestone?[...(c.rolls??[]),milestone]:c.rolls}:c);
 const next=write({...normalizeBattleEquipment(save),updatedAt:new Date().toISOString(),currencies:{...save.currencies,gold:save.currencies.gold-quote.cost}},collection);
 return {save:next,ok:true,message:`${quote.item.name} #${copyId.replace('gear_','')} improved to +${quote.copy.level+1} for ${quote.cost} Gold. Only this copy changed.`};
}

/** Materialize copy IDs on load/save and return gear from departed creatures once. */
export function syncEquipmentCopies(input:GameSave):GameSave {
 let save=normalizeBattleEquipment(input);
 let raw:Partial<Collection>={};try{raw=JSON.parse(String(save.flags[FLAG]??'{}'))??{};}catch{}
 if(Array.isArray(raw.copies)){
  const owners=new Set((save.creatures??[]).map(c=>String(c.creatureId)));
  const orphanIds=new Set<string>();
  const flags={...save.flags};
  const copies=raw.copies.map(c=>{
   const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c?.itemId&&i.equipmentSlot);
   if(!c?.owner||owners.has(c.owner)||!item||orphanIds.has(c.id))return c;
   orphanIds.add(c.id);flags[item.flagKey]=count(flags[item.flagKey])+1;
   flags[`battleEquipment_${c.owner}_${item.equipmentSlot}`]='';
   return {...c,owner:undefined};
  });
  if(orphanIds.size)save={...save,flags:{...flags,[FLAG]:JSON.stringify({...raw,copies})}};
 }
 const serialized=JSON.stringify(getEquipmentCollection(save));
 return save.flags[FLAG]===serialized&&save.flags.equipmentRulesVersion===3?save:{...save,flags:{...save.flags,[FLAG]:serialized,equipmentRulesVersion:3}};
}
