import {inventoryRecipientBlocker,type InventoryEntry} from './inventoryCatalogue';
import {equipmentRemovalBlocker} from './equipmentChangeSnapshot';
import type {GameSave} from '@/types/save';
/** A worn copy may move only when both the wearer and recipient can change equipment. */
export function equipmentRecipientBlocker(save:GameSave,item:InventoryEntry,id:string):string|null{
 if(item.copy?.owner===id)return 'Already equipped on this creature.';
 const recipientBlock=inventoryRecipientBlocker(save,{...item,copy:item.copy?{...item.copy,owner:undefined}:undefined},id);
 if(recipientBlock)return recipientBlock;
 if(item.copy?.owner){
  const block=equipmentRemovalBlocker(save,item.copy.owner);
  if(block)return `Current wearer: ${block}`;
 }
 return null;
}
