import {BATTLE_OUTFITTER_ITEMS,type BattleOutfitterItem,type EquipmentSlot} from '@/data/battleOutfitter';
import {getEquipmentCopies} from './equipmentInstances';
import {getEquippedBattleStats,BATTLE_STAT_LABELS,compareEquipment} from './equipmentComparison';
import {getBattleOutfitterCreatureEffectSummary} from '@/data/battleOutfitterIntegration';
import {getBreedingParticipants} from '@/data/breeding';
import {getTrainingUnavailableReason} from './trainingGrounds';
import {getColiseumC4State} from '@/data/coliseumC4';
import type {EquipmentCopy} from './equipmentEnhancement';
import type {GameSave} from '@/types/save';
import type {BattleStatKey} from '@/types/battle';

export type EquipmentChangeSnapshot={
 kind:'equip'|'remove';creatureId:string;name:string;portrait:string;family:string;level:number;slot:EquipmentSlot;
 before:{item:BattleOutfitterItem;copy:EquipmentCopy}|null;
 after:{item:BattleOutfitterItem;copy:EquipmentCopy}|null;
 rows:ReturnType<typeof compareEquipment>['rows'];sets:ReturnType<typeof compareEquipment>['sets'];
};
/** Freeze actual before/saved loadouts for receipts, rather than recomputing a hypothetical equip after saving. */
export function getEquipmentChangeSnapshot(before:GameSave,after:GameSave,creatureId:string,slot:EquipmentSlot,kind:EquipmentChangeSnapshot['kind']):EquipmentChangeSnapshot|null{
 const creature=before.creatures?.find(c=>c.creatureId===creatureId),saved=after.creatures?.find(c=>c.creatureId===creatureId);
 if(!creature||!saved)return null;
 const participant=getBreedingParticipants(before).find(p=>p.participantId===creatureId);
 const gear=(save:GameSave)=>{const copy=getEquipmentCopies(save).find(c=>c.owner===creatureId&&BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===c.itemId)?.equipmentSlot===slot);const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===copy?.itemId);return copy&&item?{item,copy}:null;};
 const current=getEquippedBattleStats(before,creature),next=getEquippedBattleStats(after,saved);
 return {kind,creatureId,name:creature.nickname,portrait:participant?.portraitPath??'',family:(participant?.sceneFamily??'creature').replace(/^./,c=>c.toUpperCase()),level:creature.level,slot,before:gear(before),after:gear(after),rows:(Object.keys(current) as BattleStatKey[]).map(key=>({key,label:BATTLE_STAT_LABELS[key],current:current[key],after:next[key],delta:next[key]-current[key]})),sets:{current:getBattleOutfitterCreatureEffectSummary(before,creatureId).sets??[],after:getBattleOutfitterCreatureEffectSummary(after,creatureId).sets??[]}};
}
export function equipmentRemovalBlocker(save:GameSave,creatureId:string){
 if(!save.creatures?.some(c=>c.creatureId===creatureId))return 'This creature is no longer on the ranch.';
 return getTrainingUnavailableReason(save,creatureId)??(getColiseumC4State(save).activeRun?.teamCreatureIds.includes(creatureId)?'Equipment is locked during this gauntlet run.':null);
}
