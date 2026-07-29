import type { CreatureRecord } from "@/types/creature";
import type {
  BattleDamagePreview,
  BattleHealingPreview,
  BattleMove,
  BattleMoveDefenseStat,
  BattleMoveScalingStat,
  BattleStats,
  BattleStatKey,
} from "@/types/battle";
import { getBattleSpeciesProfile } from "@/data/battleProfiles";
import { applyTalentBattleStats } from "@/data/talents/talentEngine";

const DEFAULT_BATTLE_STATS: BattleStats = {
  maxHp: 1,
  physicalPower: 1,
  specialPower: 1,
  defense: 1,
  resistance: 1,
  speed: 1,
  accuracy: 1,
  evasion: 0,
  statusPower: 1,
  statusResist: 1,
  battleEnergy: 1,
};

function clampBattleStat(key: BattleStatKey, value: number): number {
  if (key === "evasion") return Math.max(0, Math.round(value));
  return Math.max(1, Math.round(value));
}

function applyBattleStatBonuses(stats: BattleStats, bonuses: Partial<BattleStats>): BattleStats {
  return Object.entries(stats).reduce((nextStats, [key, value]) => {
    const statKey = key as BattleStatKey;
    return {
      ...nextStats,
      [statKey]: clampBattleStat(statKey, value + (bonuses[statKey] ?? 0)),
    };
  }, DEFAULT_BATTLE_STATS);
}

export function calculateBattleStats(creature: CreatureRecord): BattleStats {
  const profile = getBattleSpeciesProfile(creature.speciesId);
  const stats = creature.stats;
  const level = Math.max(1, creature.level);

  const baseBattleStats: BattleStats = {
    maxHp: 40 + level * 6 + stats.STA * 8 + stats.FER * 4,
    physicalPower: level + stats.STR * 2,
    specialPower: level + stats.WIL * 2,
    defense: Math.floor(level / 2) + stats.STA * 2,
    resistance: Math.floor(level / 2) + stats.WIL * 2,
    speed: stats.DEX * 2,
    accuracy: 90 + Math.floor(stats.DEX / 2),
    evasion: Math.floor(stats.DEX / 3),
    statusPower: stats.CHA + stats.WIL,
    statusResist: stats.WIL + stats.STA,
    battleEnergy: 40 + stats.STA * 3 + stats.WIL * 2,
  };

  const speciesAdjusted = applyBattleStatBonuses(baseBattleStats, profile.battleStatBonuses);
  return applyTalentBattleStats(speciesAdjusted, creature.abilities);
}

function fallbackScalingStat(move: BattleMove): BattleMoveScalingStat {
  if (move.category === "physical") return "physicalPower";
  if (move.category === "special") return "specialPower";
  if (move.category === "status" || move.category === "healing") return "statusPower";
  return "none";
}

function fallbackDefenseStat(move: BattleMove): BattleMoveDefenseStat {
  if (move.category === "physical") return "defense";
  if (move.category === "special") return "resistance";
  if (move.category === "status") return "statusResist";
  return "none";
}

export function getRelevantAttackStat(move: BattleMove, battleStats: BattleStats): number {
  const scalingStat = move.scalingStat ?? fallbackScalingStat(move);
  if (scalingStat === "none") return 0;
  return battleStats[scalingStat];
}

export function getRelevantDefenseStat(move: BattleMove, battleStats: BattleStats): number {
  const resistedBy = move.resistedBy ?? fallbackDefenseStat(move);
  if (resistedBy === "none") return 0;
  return battleStats[resistedBy];
}

export function getBattleTurnScore(battleStats: BattleStats, move: BattleMove): number {
  return battleStats.speed + move.priority * 10;
}

export function previewBattleDamage(
  attackerStats: BattleStats,
  defenderStats: BattleStats,
  move: BattleMove,
  modifierTotal = 1,
): BattleDamagePreview {
  const relevantAttackStat = getRelevantAttackStat(move, attackerStats);
  const relevantDefenseStat = getRelevantDefenseStat(move, defenderStats);
  const attackContribution = Math.round(relevantAttackStat * 0.75);
  const defenseContribution = Math.round(relevantDefenseStat * 0.5);
  const baseDamage = Math.max(0, move.power + attackContribution - defenseContribution);
  const finalDamage = move.category === "healing" || move.category === "support" || move.category === "status"
    ? 0
    : Math.max(1, Math.round(baseDamage * modifierTotal));

  return {
    baseDamage,
    modifierTotal,
    finalDamage,
    notes: [
      `${move.name} scales from ${move.scalingStat ?? fallbackScalingStat(move)}.`,
      `${relevantAttackStat} attack contributes ${attackContribution}; ${relevantDefenseStat} ${move.resistedBy ?? fallbackDefenseStat(move)} prevents ${defenseContribution}.`,
      `Final modifier: ${modifierTotal.toFixed(2)}x.`,
    ],
  };
}

export function previewBattleHealing(
  sourceStats: BattleStats,
  move: BattleMove,
  baseAmount = move.power,
): BattleHealingPreview {
  const relevantStat = getRelevantAttackStat(move, sourceStats);
  const scalingBonus = move.scalingStat === "none" ? 0 : Math.max(0, Math.round(relevantStat * 0.6));
  const targetModifier = move.targetType === "all_allies" ? 0.78 : 1;
  const baseHealing = Math.max(1, Math.round(baseAmount));
  const finalHealing = Math.max(1, Math.round((baseHealing + scalingBonus) * targetModifier));

  return {
    baseHealing,
    scalingBonus,
    targetModifier,
    finalHealing,
    notes: [
      `${move.name} begins with ${baseHealing} healing.`,
      `${move.scalingStat ?? fallbackScalingStat(move)} adds ${scalingBonus}.`,
      move.targetType === "all_allies" ? "Team-wide healing uses a 0.78x spread modifier." : "Single-target healing uses full strength.",
    ],
  };
}

export function getBattleReadinessFromStats(stats: BattleStats): "Novice" | "Ready" | "Elite" {
  const score = stats.maxHp / 8 + stats.physicalPower + stats.specialPower + stats.defense + stats.resistance + stats.speed + stats.battleEnergy / 5;
  if (score >= 145) return "Elite";
  if (score >= 105) return "Ready";
  return "Novice";
}
