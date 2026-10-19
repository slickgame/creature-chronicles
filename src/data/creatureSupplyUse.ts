import {getBreedingSupportItem, getBreedingSupportItemCount, useBreedingSupportItem as applySupportItem} from './breedingItems';
import {getTrainingUnavailableReason} from './trainingGrounds';
import type {CreatureRecord} from '@/types/creature';
import type {GameSave} from '@/types/save';
import type {BreedingSupportItemId} from '@/types/items';

export type SupplyChange = {label:string; before:string; after:string; icon:'energy'|'heart'|'stock'|'recovery'};
export type CreatureSupplyQuote = {
  saveId:string; targetId:string; targetName:string; itemId:BreedingSupportItemId;
  itemName:string; revision:string; stock:number; canUse:boolean; message:string; changes:SupplyChange[];
};

export function creatureSupplyChanges(before:CreatureRecord, after:CreatureRecord, stockBefore:number, stockAfter:number, itemId:BreedingSupportItemId):SupplyChange[] {
  const changes:SupplyChange[]=[];
  if(itemId==='energy_snack'||itemId==='energy_meal') changes.push({label:'Energy',before:String(before.energy),after:`${after.energy} / ${after.maxEnergy}`,icon:'energy'});
  if(itemId==='affection_treat') changes.push({label:'Affection',before:String(before.affection),after:`${after.affection} / 100`,icon:'heart'});
  if(itemId==='recovery_balm') {
    changes.push({label:'Hearts',before:String(before.hearts),after:`${after.hearts} / ${after.maxHearts}`,icon:'heart'});
    if(before.injuredUntilDayNumber!==after.injuredUntilDayNumber)changes.push({label:'Recovery',before:before.injuredUntilDayNumber?`Day ${before.injuredUntilDayNumber}`:'Clear',after:after.injuredUntilDayNumber?`Day ${after.injuredUntilDayNumber}`:'Cleared',icon:'recovery'});
  }
  changes.push({label:'Stock',before:String(stockBefore),after:String(stockAfter),icon:'stock'});
  return changes;
}

export function getCreatureSupplyQuote(save:GameSave,targetId:string,itemId:BreedingSupportItemId):CreatureSupplyQuote|null {
  const item=getBreedingSupportItem(itemId), creature=save.creatures?.find(c=>c.creatureId===targetId);
  if(!item||!creature||!['Energy','Care'].includes(item.category)||!['creature','player-or-creature'].includes(item.target))return null;
  const stock=getBreedingSupportItemCount(save,itemId), unavailable=getTrainingUnavailableReason(save,creature.creatureId);
  const preview=applySupportItem(save,itemId,{source:'inventory',targetId});
  const after=preview.save.creatures?.find(c=>c.creatureId===targetId)??creature;
  return {saveId:save.saveId,targetId,targetName:creature.nickname,itemId,itemName:item.name,stock,
    revision:JSON.stringify([save.saveId,save.dayState.dayNumber,creature,stock,unavailable]),
    canUse:preview.ok&&!unavailable,message:unavailable?`Away at training. ${unavailable}`:preview.ok?'Consumes one item from shared ranch stock. No Gold charge.':preview.message,
    changes:creatureSupplyChanges(creature,after,stock,preview.ok?stock-1:stock,itemId)};
}

export function confirmCreatureSupplyUse(save:GameSave,quote:CreatureSupplyQuote) {
  const fresh=getCreatureSupplyQuote(save,quote.targetId,quote.itemId);
  if(!fresh||fresh.revision!==quote.revision)return {save,ok:false,message:'The creature or shared stock changed. Review the item again before using it.'};
  if(!fresh.canUse)return {save,ok:false,message:fresh.message};
  return applySupportItem(save,quote.itemId,{source:'inventory',targetId:quote.targetId});
}
