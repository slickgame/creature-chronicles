import type { ResourceId } from './farmResources';
const EXISTING = new Set<ResourceId>(['rations','vegetables','wood','planks']);
const NEW = new Set<ResourceId>(['milk','eggs','meat','stone','iron']);
const RECIPE_ART = new Set<ResourceId>(['wheat','iron_ore','charcoal','nails','porridge','breakfast','breeders_bowl','stew']);
export function getResourceArt(id: ResourceId): string | undefined {
 return EXISTING.has(id) ? `/images/ui/resources-v2/${id}.webp` : NEW.has(id) ? `/images/ui/resources-v3/${id}.webp` : RECIPE_ART.has(id) ? `/images/ui/resources-v4/${id}.webp` : undefined;
}
