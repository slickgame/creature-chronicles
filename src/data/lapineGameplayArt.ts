import type { CreatureRecord } from "@/types/creature";

// Approved artwork for the common Bunny variant only. Keep this out of the
// shared variant registry so breeding screens retain their original images.
export const LAPINE_GAMEPLAY_ART = {
  card: "/images/creatures/lapine/gameplay/lapine_02_bust_portrait.png",
  profile: "/images/creatures/lapine/gameplay/lapine_01_full_body.png",
  combatIdle: "/images/creatures/lapine/gameplay/lapine_03_combat_idle.png",
  combatBasic: "/images/creatures/lapine/gameplay/lapine_04_basic_attack.png",
  combatSpecial: "/images/creatures/lapine/gameplay/lapine_05_special_attack.png",
  combatGuard: "/images/creatures/lapine/gameplay/lapine_06_defend_guard.png",
  combatDamage: "/images/creatures/lapine/gameplay/lapine_07_taking_damage.png",
  combatKO: "/images/creatures/lapine/gameplay/lapine_08_defeated_ko.png",
  ranchWork: "/images/creatures/lapine/gameplay/lapine_09_ranch_work.png",
  sleeping: "/images/creatures/lapine/gameplay/lapine_10_resting_sleeping.png",
} as const;

type LapineIdentity = Pick<CreatureRecord, "variantId"> | null | undefined;

export function isBaseLapine(creature: LapineIdentity): boolean {
  return creature?.variantId === "variant_bunny";
}

export function getLapineGameplayCardSprite(creature: LapineIdentity, fallback: string): string {
  return isBaseLapine(creature) ? LAPINE_GAMEPLAY_ART.card : fallback;
}

export function getLapineGameplayProfileSprite(creature: LapineIdentity, fallback: string): string {
  return isBaseLapine(creature) ? LAPINE_GAMEPLAY_ART.profile : fallback;
}

export function getLapineRanchJobSprite(
  creature: LapineIdentity,
  jobId: string,
  fallback: string,
): string {
  if (!isBaseLapine(creature)) return fallback;
  return jobId === "garden_tending" ? LAPINE_GAMEPLAY_ART.ranchWork : LAPINE_GAMEPLAY_ART.profile;
}

export type LapineCombatPoseContext = {
  fainted: boolean;
  actor: boolean;
  target: boolean;
  eventKind?: string;
  effectPreset?: string;
  specialAttack: boolean;
};

export function getLapineCombatSprite(
  creature: LapineIdentity,
  context: LapineCombatPoseContext,
): string | null {
  if (!isBaseLapine(creature)) return null;
  if (context.fainted || (context.target && context.eventKind === "knockout")) {
    return LAPINE_GAMEPLAY_ART.combatKO;
  }
  if (context.target && context.eventKind === "damage") {
    return LAPINE_GAMEPLAY_ART.combatDamage;
  }
  if (context.actor && context.effectPreset === "shield") {
    return LAPINE_GAMEPLAY_ART.combatGuard;
  }
  if (context.actor && context.eventKind === "attack") {
    return context.specialAttack ? LAPINE_GAMEPLAY_ART.combatSpecial : LAPINE_GAMEPLAY_ART.combatBasic;
  }
  return LAPINE_GAMEPLAY_ART.combatIdle;
}
