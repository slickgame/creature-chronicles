import {BREEDING_SUPPORT_ITEMS,getBreedingSupportItemCount,getBreedingSupportItemActiveCount,useBreedingSupportItem as applySupportItem} from './breedingItems';
import {SUPPLY_DEPOT_ITEMS,getSupplyDepotCount} from './supplyDepot';
import {BATTLE_OUTFITTER_ITEMS,getBattleOutfitterStock} from '@/data/battleOutfitter';
import {getEquipmentCopies} from './equipmentInstances';
import {getFarmState,RESOURCE_IDS,RESOURCES} from './farmResources';
import {getResourceArt} from './resourceArt';
import {getTrainingUnavailableReason} from './trainingGrounds';
import {getColiseumC4State} from '@/data/coliseumC4';
import {getQuickhatchCatalystCount,QUICKHATCH_CATALYST} from './tutorialQuickhatch';
import type {GameSave} from '@/types/save';
export type InventoryCategory='All'|'Consumables'|'Equipment'|'Materials'|'Key items';
export type InventoryEntry={id:string;name:string;art:string;category:InventoryCategory;count:number;description:string;effect:string;support?:typeof BREEDING_SUPPORT_ITEMS[number];gear?:typeof BATTLE_OUTFITTER_ITEMS[number];copy?:ReturnType<typeof getEquipmentCopies>[number];resource?:typeof RESOURCE_IDS[number];keyItem?:boolean;destination?:'outfitter'|'nursery'|'ranch'};
export const INVENTORY_CATEGORIES:InventoryCategory[]=['All','Consumables','Equipment','Materials','Key items'];
export function getInventoryCatalogue(save:GameSave):InventoryEntry[]{
 const copies=getEquipmentCopies(save),farm=getFarmState(save);
 return [
 ...BREEDING_SUPPORT_ITEMS.map(item=>({id:item.itemId,name:item.name,art:`/images/ui/apothecary-v1/${item.itemId.replaceAll('_','-')}.webp`,category:'Consumables' as const,count:getBreedingSupportItemCount(save,item.itemId),description:item.description,effect:item.exactEffect,support:item})),
 ...BATTLE_OUTFITTER_ITEMS.filter(i=>i.category==='Equipment').flatMap(item=>{const owned=copies.filter(c=>c.itemId===item.itemId);return (owned.length?owned:[undefined]).map(copy=>({id:copy?.id??`shop:${item.itemId}`,name:copy?`${item.name} +${copy.level}`:item.name,art:item.iconPath,category:'Equipment' as const,count:copy?1:0,description:item.description,effect:`${item.effectLabel} · Grade ${item.equipmentGrade??'—'}${copy?.owner?` · Equipped by ${save.creatures?.find(c=>c.creatureId===copy.owner)?.nickname??'another creature'}`:''}`,gear:item,copy}));}),
 ...BATTLE_OUTFITTER_ITEMS.filter(i=>i.category!=='Equipment').map(item=>({id:`battle:${item.itemId}`,name:item.name,art:item.iconPath,category:'Consumables' as const,count:getBattleOutfitterStock(save,item),description:item.description,effect:item.effectLabel,destination:'outfitter' as const})),
 ...SUPPLY_DEPOT_ITEMS.filter(i=>['repair_kit','nursery_supply_kit'].includes(i.itemId)).map(item=>({id:item.itemId,name:item.name,art:item.iconPath,category:'Consumables' as const,count:getSupplyDepotCount(save,item.stockFlag),description:item.description,effect:item.exactEffect,destination:item.itemId==='repair_kit'?'ranch' as const:'nursery' as const})),
 ...RESOURCE_IDS.map(id=>({id:`resource:${id}`,name:RESOURCES[id].name,art:getResourceArt(id)??'/images/ui/apothecary-v1/icons/materials.svg',category:'Materials' as const,count:farm.stock[id]??0,description:`Shared ranch storage · ${RESOURCES[id].category}`,effect:`${farm.stock[id]??0} stored · ${farm.reserves[id]??0} reserved · ${Math.max(0,(farm.stock[id]??0)-(farm.reserves[id]??0))} available.`,resource:id})),
 {id:QUICKHATCH_CATALYST.itemId,name:QUICKHATCH_CATALYST.name,art:QUICKHATCH_CATALYST.iconPath,category:'Key items',count:getQuickhatchCatalystCount(save),description:QUICKHATCH_CATALYST.description,effect:QUICKHATCH_CATALYST.exactEffect,keyItem:true}
 ];
}
export function inventoryRecipientBlocker(save:GameSave,item:InventoryEntry,id:string):string|null{
 if(item.support?.target==='breeding-pair')return 'This effect is armed for a pair; no recipient is needed.';
 if(item.resource)return 'Manage or serve this resource from Storage.';
 if(item.keyItem)return 'Select the exact egg in Nursery.';
 const creature=save.creatures?.find(c=>c.creatureId===id);
 if(id!=='player'&&!creature)return 'This creature is no longer on the ranch.';
 if(creature){const away=getTrainingUnavailableReason(save,creature.creatureId);if(away)return away;}
 if(item.gear){if(!creature)return 'Only creatures can equip this gear.';if(getColiseumC4State(save).activeRun?.teamCreatureIds.includes(creature.creatureId))return 'Equipment is locked during this gauntlet run.';if(item.copy?.owner)return item.copy.owner===id?'Already equipped on this creature.':`Equipped on ${save.creatures?.find(c=>c.creatureId===item.copy?.owner)?.nickname??'another creature'}; remove it there first.`;return item.copy?null:'No owned equipment available.';}
 if(item.support){if(item.support.target==='pregnancy'){const pregnancy=save.pregnancies?.find(p=>p.status==='pregnant'&&p.receiver.participantId===id);if(!pregnancy)return 'No active pregnancy for this recipient.';const quote=applySupportItem(save,item.support.itemId,{source:'inventory',targetId:pregnancy.pregnancyId});return quote.ok?null:quote.message;}if(item.support.target==='creature'&&!creature)return 'This item can only be used on a creature.';const quote=applySupportItem(save,item.support.itemId,{source:'inventory',targetId:id});return quote.ok?null:quote.message;}
 return 'No direct-use action for this item.';
}
export function inventoryArmedCount(save:GameSave){return BREEDING_SUPPORT_ITEMS.filter(i=>i.target==='breeding-pair'&&getBreedingSupportItemActiveCount(save,i.itemId)>0).length;}
