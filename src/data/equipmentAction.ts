import {assignBattleOutfitterEquipment,removeBattleOutfitterEquipment} from '@/data/battleOutfitter';
import {getOwnedInventory,inventoryRecipientBlocker} from './inventoryCatalogue';
import {equipmentRemovalBlocker,getEquipmentChangeSnapshot,type EquipmentChangeSnapshot} from './equipmentChangeSnapshot';
import type {GameSave} from '@/types/save';
export type EquipmentActionRequest={kind:'equip'|'remove';equipmentId:string;creatureId:string};
export type EquipmentActionQuote={ok:true;save:GameSave;snapshot:EquipmentChangeSnapshot;fingerprint:string}|{ok:false;message:string};
/** Detached reducer preview shared by every gallery/shop review; confirmation requotes it against the latest save. */
export function getEquipmentActionQuote(save:GameSave,request:EquipmentActionRequest):EquipmentActionQuote{
 const item=getOwnedInventory(save).find(i=>i.id===request.equipmentId);
 if(!item?.copy||!item.gear?.equipmentSlot)return {ok:false,message:'This equipment is no longer owned. Review the piece again.'};
 const block=request.kind==='remove'?equipmentRemovalBlocker(save,request.creatureId):inventoryRecipientBlocker(save,item,request.creatureId);
 if(block)return {ok:false,message:block};
 if(request.kind==='remove'&&item.copy.owner!==request.creatureId)return {ok:false,message:'This exact piece is no longer equipped on this creature. Review the slot again.'};
 const result=request.kind==='remove'?removeBattleOutfitterEquipment(save,request.creatureId,item.gear.equipmentSlot):assignBattleOutfitterEquipment(save,request.creatureId,item.gear.itemId,item.copy.id);
 if(!result.ok)return {ok:false,message:result.message};
 const snapshot=getEquipmentChangeSnapshot(save,result.save,request.creatureId,item.gear.equipmentSlot,request.kind);
 if(!snapshot)return {ok:false,message:'This creature is no longer on the ranch.'};
 return {ok:true,save:result.save,snapshot,fingerprint:JSON.stringify({request,snapshot})};
}
