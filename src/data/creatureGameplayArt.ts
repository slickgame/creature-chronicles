import type {CreatureRecord} from "@/types/creature";
import {getVariantDefinition} from "./creatures";
import {getGameplayArtSet} from "./baseGameplayArt";
/** Gameplay views use approved common art; rare variants retain their canonical images. */
export function gameplayArt(creature:Pick<CreatureRecord,"variantId">,portrait=false):string{
 const art=getGameplayArtSet(creature);if(art)return portrait?art.card:art.profile;
 const variant=getVariantDefinition(creature.variantId);
 return portrait?variant.portraitPath:variant.profilePath||variant.portraitPath;
}
