import type { CreatureRecord } from "@/types/creature";

// Presentation-only Base Horse art. This module must never be imported by
// breeding scenes or the shared species/variant registry.
export const EQUINE_GAMEPLAY_ART = {
  card: "/images/creatures/equine/gameplay/equine_02_bust_portrait.png",
  profile: "/images/creatures/equine/gameplay/equine_01_full_body.png",
  combatIdle: "/images/creatures/equine/gameplay/equine_03_combat_idle.png",
  combatBasic: "/images/creatures/equine/gameplay/equine_04_basic_attack.png",
  combatSpecial: "/images/creatures/equine/gameplay/equine_05_special_attack.png",
  combatGuard: "/images/creatures/equine/gameplay/equine_06_defend_guard.png",
  combatDamage: "/images/creatures/equine/gameplay/equine_07_taking_damage.png",
  combatKO: "/images/creatures/equine/gameplay/equine_08_defeated_ko.png",
  ranchWork: "/images/creatures/equine/gameplay/equine_09_ranch_work.png",
  sleeping: "/images/creatures/equine/gameplay/equine_10_resting_sleeping.png",
} as const;

type EquineIdentity = Pick<CreatureRecord, "variantId"> | null | undefined;

export function isBaseEquine(creature: EquineIdentity): boolean {
  return creature?.variantId === "variant_horse";
}

export function getEquineGameplayCardSprite(creature: EquineIdentity, fallback: string): string {
  return isBaseEquine(creature) ? EQUINE_GAMEPLAY_ART.card : fallback;
}

export function getEquineGameplayProfileSprite(creature: EquineIdentity, fallback: string): string {
  return isBaseEquine(creature) ? EQUINE_GAMEPLAY_ART.profile : fallback;
}

export function getEquineRanchJobSprite(creature: EquineIdentity, fallback: string): string {
  return isBaseEquine(creature) ? EQUINE_GAMEPLAY_ART.ranchWork : fallback;
}

export type EquineCombatPoseContext = {
  fainted: boolean;
  actor: boolean;
  target: boolean;
  eventKind?: string;
  effectPreset?: string;
  specialAttack: boolean;
};

export function getEquineCombatSprite(
  creature: EquineIdentity,
  context: EquineCombatPoseContext,
): string | null {
  if (!isBaseEquine(creature)) return null;
  if (context.fainted || (context.target && context.eventKind === "knockout")) {
    return EQUINE_GAMEPLAY_ART.combatKO;
  }
  if (context.target && context.eventKind === "damage") {
    return EQUINE_GAMEPLAY_ART.combatDamage;
  }
  if (context.actor && context.effectPreset === "shield") {
    return EQUINE_GAMEPLAY_ART.combatGuard;
  }
  if (context.actor && context.eventKind === "attack") {
    return context.specialAttack ? EQUINE_GAMEPLAY_ART.combatSpecial : EQUINE_GAMEPLAY_ART.combatBasic;
  }
  return EQUINE_GAMEPLAY_ART.combatIdle;
}
