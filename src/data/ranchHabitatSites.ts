import {isHabitatUnlocked,HABITAT_PURCHASES} from './ranchHabitats';
import {getBuilderWorkOrder} from './builderProjects';
import type {CreatureFamily} from '@/types/creature';
import type {GameSave} from '@/types/save';
/** Presentation follows persisted housing and work orders; scenery never grants ownership. */
export function getHabitatSite(save:GameSave,family:CreatureFamily){
 const habitat=save.habitats?.find(h=>h.family===family),purchase=HABITAT_PURCHASES[family as keyof typeof HABITAT_PURCHASES];
 const order=getBuilderWorkOrder(save);
 const building=!!purchase&&order?.projectId===purchase.projectId;
 const state=isHabitatUnlocked(save,family)?'owned':building?'building':'planned';
 const art=state==='owned'?`/images/ui/ranch-v3/${family}.webp`:`/images/ui/ranch-stages-v1/${state==='building'?'building':'planned'}.webp`;
 const summary=state==='owned'?`${habitat!.creatureIds.length} / ${habitat!.capacity} residents`:state==='building'?`Building · Ready Day ${order!.readyDay}`:purchase?`Unbuilt · ${purchase.gold} Gold + ${purchase.wood} Wood`:'Habitat unavailable';
 return {state,art,summary,readyDay:building?order!.readyDay:null} as const;
}
