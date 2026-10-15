import {CANINE_GAMEPLAY_ART,LAPINE_GAMEPLAY_ART} from './canineLapineGameplayArt';
import {NYLA_GAMEPLAY_ART} from './nylaGameplayArt';
import {EQUINE_GAMEPLAY_ART} from './equineGameplayArt';
import type {CreatureRecord} from '@/types/creature';
import type {NylaCombatPoseContext} from './nylaGameplayArt';
const SETS={variant_base_feline:NYLA_GAMEPLAY_ART,variant_horse:{...EQUINE_GAMEPLAY_ART,combatHit:EQUINE_GAMEPLAY_ART.combatDamage},variant_base_canine:CANINE_GAMEPLAY_ART,variant_bunny:LAPINE_GAMEPLAY_ART};
/** Only the four common variants opt in. Rare variants keep their own identity. */
export function getGameplayArtSet(creature:Pick<CreatureRecord,'variantId'>|null|undefined){
 return creature?SETS[creature.variantId as keyof typeof SETS]??null:null;
}
export function getCreatureCombatArt(creature:Pick<CreatureRecord,'variantId'>|null|undefined,context:NylaCombatPoseContext):string|null{
 const art=getGameplayArtSet(creature);if(!art)return null;
 if(context.fainted||(context.target&&context.eventKind==='knockout'))return art.combatKO;
 if(context.target&&context.eventKind==='damage')return art.combatHit;
 if(context.actor&&context.effectPreset==='shield')return art.combatGuard;
 if(context.actor&&context.eventKind==='attack')return context.specialAttack?art.combatSpecial:art.combatBasic;
 return art.combatIdle;
}
