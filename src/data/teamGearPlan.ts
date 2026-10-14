import {BATTLE_OUTFITTER_ITEMS,getEquipmentSlots} from '@/data/battleOutfitter';
import {getEquipmentCopies,getEquippedCopy} from './equipmentInstances';
import {enhancementCost} from './equipmentEnhancement';
import {getFoodBudget} from './economyBudget';
import type {GameSave} from '@/types/save';
import type {CreatureId} from '@/types/ids';
/** Read-only proposal: retain weapons; allocate each free starter blade at most once. */
export function getTeamGearPlan(save:GameSave,ids:CreatureId[],target:0|3|6,constructionAllowance=0){
 const starter=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId==='training_grips')!;
 const available=getEquipmentCopies(save,starter.itemId).filter(c=>!c.owner);
 const rows=[...new Set(ids)].slice(0,3).map(id=>{
  const creature=save.creatures?.find(c=>c.creatureId===id);if(!creature)return null;
  const equippedId=getEquipmentSlots(save,id).weapon;
  const copy=equippedId?getEquippedCopy(save,id,equippedId):available.shift();
  const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===equippedId)??starter;
  const level=copy?.level??0,buyGold=copy?0:item.costGold;
  let upgradeGold=0;for(let n=level;n<target;n++)upgradeGold+=enhancementCost(item,n);
  return {creatureId:id,nickname:creature.nickname,item,copy,level,target:Math.max(target,level),buyGold,upgradeGold,gold:buyGold+upgradeGold,equipped:!!equippedId};
 }).filter((r):r is NonNullable<typeof r>=>r!==null);
 const gold=rows.reduce((sum,r)=>sum+r.gold,0),food=getFoodBudget(save);
 const constructionGold=Number.isFinite(constructionAllowance)?Math.max(0,Math.floor(constructionAllowance)):0;
 const afterPlan=save.currencies.gold-gold-food.topUpGold-constructionGold;
 return {rows,gold,food,constructionGold,remaining:save.currencies.gold-gold,afterPlan,shortage:Math.max(0,-afterPlan)};
}
