import { getBattleSpeciesProfile } from "@/data/battleProfiles";
import type {
  BattleMove,
  BattleStats,
  BattleStatusId,
  BattleStatusStack,
} from "@/types/battle";
import type { SpeciesId } from "@/types/ids";

export const BATTLE_ROUND_ENERGY_REGEN_RATE = 0.12;
export const BATTLE_ROUND_ENERGY_REGEN_MIN = 5;
export const BATTLE_ROUND_ENERGY_REGEN_MAX = 12;

const STATUS_STACK_LIMITS: Record<BattleStatusId, number> = {
  bleed: 3,
  stun: 1,
  guarded: 1,
  inspired: 2,
  marked: 1,
  taunted: 1,
  exhausted: 2,
  weakened: 2,
  slowed: 2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function getBattleStatusStackLimit(status: BattleStatusId, requestedMaxStacks?: number): number {
  return Math.max(1, Math.round(requestedMaxStacks ?? STATUS_STACK_LIMITS[status] ?? 1));
}

export function calculateBattleMoveHitChance(
  attackerStats: BattleStats,
  defenderStats: BattleStats,
  move: BattleMove,
): number {
  let chance = move.accuracy;
  chance += Math.round((attackerStats.accuracy - 90) * 0.45);
  chance -= Math.round(defenderStats.evasion * 0.65);
  if (move.tags.includes("precision")) chance += 5;
  if (move.category === "status") {
    chance += clamp(Math.round((attackerStats.statusPower - defenderStats.statusResist) * 0.35), -15, 15);
  }
  return clamp(chance, 5, 100);
}

export function calculateBattleSecondaryEffectChance(
  attackerStats: BattleStats,
  defenderStats: BattleStats,
  baseChance: number,
): number {
  if (baseChance >= 100) return 100;
  const statusAdjustment = clamp(
    Math.round((attackerStats.statusPower - defenderStats.statusResist) * 0.5),
    -20,
    20,
  );
  return clamp(baseChance + statusAdjustment, 5, 95);
}

export type BattleTagModifier = {
  modifier: number;
  notes: string[];
  affinityTags: string[];
  vulnerabilityTags: string[];
  resistanceTags: string[];
};

function matchingTags(move: BattleMove, tags: readonly string[]): string[] {
  return move.tags.filter((tag) => tags.includes(tag));
}

export function getBattleMoveTagModifier(
  attackerSpeciesId: SpeciesId,
  defenderSpeciesId: SpeciesId,
  move: BattleMove,
): BattleTagModifier {
  const attackerProfile = getBattleSpeciesProfile(attackerSpeciesId);
  const defenderProfile = getBattleSpeciesProfile(defenderSpeciesId);
  const affinityTags = matchingTags(move, attackerProfile.affinityMoveTags);
  const vulnerabilityTags = matchingTags(move, defenderProfile.vulnerabilityTags);
  const resistanceTags = matchingTags(move, defenderProfile.resistanceTags);
  let modifier = 1;
  const notes: string[] = [];

  if (affinityTags.length) {
    modifier += 0.1;
    notes.push(`Attacker affinity: ${affinityTags.join(", ")} (+10%).`);
  }
  if (vulnerabilityTags.length) {
    modifier += 0.2;
    notes.push(`Target vulnerability: ${vulnerabilityTags.join(", ")} (+20%).`);
  }
  if (resistanceTags.length) {
    modifier -= 0.2;
    notes.push(`Target resistance: ${resistanceTags.join(", ")} (-20%).`);
  }

  return {
    modifier: Math.max(0.6, Math.min(1.4, modifier)),
    notes,
    affinityTags,
    vulnerabilityTags,
    resistanceTags,
  };
}

function hasStatus(statuses: readonly BattleStatusStack[], status: BattleStatusId): boolean {
  return statuses.some((entry) => entry.status === status && entry.duration > 0);
}

export function calculateBattleRoundEnergyRegen(
  maxBattleEnergy: number,
  statuses: readonly BattleStatusStack[],
  isFainted = false,
): number {
  if (isFainted) return 0;
  let amount = clamp(
    maxBattleEnergy * BATTLE_ROUND_ENERGY_REGEN_RATE,
    BATTLE_ROUND_ENERGY_REGEN_MIN,
    BATTLE_ROUND_ENERGY_REGEN_MAX,
  );
  if (hasStatus(statuses, "exhausted")) amount = Math.max(1, Math.floor(amount / 2));
  if (hasStatus(statuses, "inspired")) amount += 2;
  return Math.max(1, amount);
}
