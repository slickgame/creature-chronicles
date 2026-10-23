import { getSpeciesDefinition, getVariantDefinition } from './creatures';
import type { EggRecord } from '@/types/save';
import type { CreatureFamily } from '@/types/creature';
const SPECIES: Record<CreatureFamily,string>={feline:'Cat',canine:'Dog',bovine:'Cow',lapine:'Rabbit',equine:'Horse'};
/** Display labels only; family and variant IDs remain authoritative for gameplay. */
export function nurseryIdentity(egg:Pick<EggRecord,'speciesId'|'variantId'>){
 const family=getSpeciesDefinition(egg.speciesId).family,variant=getVariantDefinition(egg.variantId),species=SPECIES[family];
 const base=['variant_base_feline','variant_base_canine','variant_cow','variant_bunny','variant_horse'].includes(egg.variantId);
 return {species,type:base?species:variant.name,family,art:`/images/ui/nursery-scenic-a/eggs/${family}.webp`};
}
