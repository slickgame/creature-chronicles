import type { CreatureRecord } from "@/types/creature";
import { getVariantDefinition } from "./creatures";
import { getEquineGameplayCardSprite, getEquineGameplayProfileSprite } from "./equineGameplayArt";
import { getNylaGameplayCardSprite, getNylaGameplayProfileSprite } from "./nylaGameplayArt";
/** Non-breeding views opt in; shared variant and scene registries remain unchanged. */
export function gameplayArt(creature: Pick<CreatureRecord,"variantId">, portrait = false): string {
 const variant = getVariantDefinition(creature.variantId);
 return portrait ? getEquineGameplayCardSprite(creature,getNylaGameplayCardSprite(creature,variant.portraitPath)) : getEquineGameplayProfileSprite(creature,getNylaGameplayProfileSprite(creature,variant.profilePath || variant.portraitPath));
}
