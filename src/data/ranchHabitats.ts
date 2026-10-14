import {createStarterHabitats,getSpeciesDefinition,getVariantDefinition} from './creatures';
import type {CreatureFamily} from '@/types/creature';
import type {GameSave} from '@/types/save';
import type {GuildContractRequirement} from '@/types/guild';
export const HABITAT_PURCHASES={
 feline:{projectId:'unlock_feline_habitat',gold:300,wood:6},
 canine:{projectId:'unlock_canine_habitat',gold:300,wood:6},
 bovine:{projectId:'unlock_bovine_habitat',gold:400,wood:8},
 lapine:{projectId:'unlock_lapine_habitat',gold:250,wood:4},
} as const;
export function isHabitatUnlocked(save:GameSave,family:CreatureFamily){return !!save.habitats?.some(h=>h.family===family&&h.unlocked);}
export function unlockRanchHabitat(save:GameSave,family:CreatureFamily):GameSave{
 if(isHabitatUnlocked(save,family))return save;
 const template=createStarterHabitats().find(h=>h.family===family)!;
 const habitat={...template,capacity:4+(save.flags.builderProject_pasture_annex_built===true?1:0),unlocked:true,creatureIds:(save.creatures??[]).filter(c=>getVariantDefinition(c.variantId).family===family).map(c=>c.creatureId)};
 const habitats=[...(save.habitats??[]).filter(h=>h.family!==family),habitat];
 return {...save,habitats,habitatIds:habitats.filter(h=>h.unlocked).map(h=>h.habitatId),flags:{...save.flags,[`${family}HabitatUnlocked`]:true}};
}
export function hasHousingForRequirement(save:GameSave,requirement:GuildContractRequirement){
 const family=requirement.family??(requirement.variantId?getVariantDefinition(requirement.variantId).family:requirement.speciesId?getSpeciesDefinition(requirement.speciesId).family:null);
 return !family||isHabitatUnlocked(save,family);
}
