import type { CreatureRecord } from "@/types/creature";

// Gameplay art only. Breeding scene media and image manifest remain untouched.
// The Base Feline starter's nickname (Mira) and gameplay statistics do not change.
export const NYLA_GAMEPLAY_ART = {
  card: "/images/creatures/feline/nyla/nyla_02_bust_portrait.png",
  profile: "/images/creatures/feline/nyla/nyla_01_full_body.png",
  combatIdle: "/images/creatures/feline/nyla/nyla_03_combat_idle.png",
  combatBasic: "/images/creatures/feline/nyla/nyla_04_basic_attack.png",
  combatSpecial: "/images/creatures/feline/nyla/nyla_05_special_attack.png",
  combatGuard: "/images/creatures/feline/nyla/nyla_06_defend_guard.png",
  ranchWork: "/images/creatures/feline/nyla/nyla_09_ranch_work.png",
  sleeping: "/images/creatures/feline/nyla/nyla_10_resting_sleeping.png",
} as const;

type FelineIdentity = Pick<CreatureRecord, "variantId"> | null | undefined;

export function isNylaBaseFeline(creature: FelineIdentity): boolean {
  return creature?.variantId === "variant_base_feline";
}

export function getNylaRanchJobSprite(
  creature: FelineIdentity,
  jobId: string,
  fallback: string,
): string {
  if (!isNylaBaseFeline(creature)) return fallback;
  return jobId === "garden_tending" ? NYLA_GAMEPLAY_ART.ranchWork : NYLA_GAMEPLAY_ART.profile;
}

export type NylaCombatPoseContext = {
  fainted: boolean;
  actor: boolean;
  target: boolean;
  eventKind?: string;
  effectPreset?: string;
  specialAttack: boolean;
};

export function getNylaCombatSprite(
  creature: FelineIdentity,
  context: NylaCombatPoseContext,
): string | null {
  if (!isNylaBaseFeline(creature)) return null;

  // Approved 07 (hit) and 08 (KO) files are still unavailable in the GitHub repo.
  // Keep existing valid artwork until those two approved files can be transferred.
  if (context.fainted || (context.target && context.eventKind === "knockout")) {
    return NYLA_GAMEPLAY_ART.sleeping;
  }
  if (context.target && context.eventKind === "damage") {
    return NYLA_GAMEPLAY_ART.combatGuard;
  }
  if (context.actor && context.effectPreset === "shield") {
    return NYLA_GAMEPLAY_ART.combatGuard;
  }
  if (context.actor && context.eventKind === "attack") {
    return context.specialAttack ? NYLA_GAMEPLAY_ART.combatSpecial : NYLA_GAMEPLAY_ART.combatBasic;
  }
  return NYLA_GAMEPLAY_ART.combatIdle;
}
