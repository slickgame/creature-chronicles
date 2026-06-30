import type { CreatureRecord } from "@/types/creature";
import type { BattleDamagePreview, BattleMove, BattleStats, BattleStatKey } from "@/types/battle";
import { getBattleSpeciesProfile } from "@/data/battleProfiles";

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

  return applyBattleStatBonuses(baseBattleStats, profile.battleStatBonuses);
}

export function getRelevantAttackStat(move: BattleMove, battleStats: BattleStats): number {
  if (move.category === "physical") return battleStats.physicalPower;
  if (move.category === "special") return battleStats.specialPower;
  if (move.category === "status") return battleStats.statusPower;
  if (move.category === "healing") return battleStats.statusPower;
  return battleStats.statusPower;
}

export function getRelevantDefenseStat(move: BattleMove, battleStats: BattleStats): number {
  if (move.category === "physical") return battleStats.defense;
  if (move.category === "special") return battleStats.resistance;
  if (move.category === "status") return battleStats.statusResist;
  return 0;
}

export function getBattleTurnScore(battleStats: BattleStats, move: BattleMove): number {
  return battleStats.speed + move.priority * 10;
}

export function previewBattleDamage(attackerStats: BattleStats, defenderStats: BattleStats, move: BattleMove, modifierTotal = 1): BattleDamagePreview {
  const relevantAttackStat = getRelevantAttackStat(move, attackerStats);
  const relevantDefenseStat = getRelevantDefenseStat(move, defenderStats);
  const baseDamage = Math.max(0, move.power + relevantAttackStat - relevantDefenseStat);
  const finalDamage = move.category === "healing" || move.category === "support" || move.category === "status"
    ? 0
    : Math.max(1, Math.round(baseDamage * modifierTotal));

  return {
    baseDamage,
    modifierTotal,
    finalDamage,
    notes: [
      `${move.name} uses ${move.category} scaling.`,
      `Attack stat ${relevantAttackStat} vs defense stat ${relevantDefenseStat}.`,
    ],
  };
}

export function getBattleReadinessFromStats(stats: BattleStats): "Novice" | "Ready" | "Elite" {
  const score = stats.maxHp / 8 + stats.physicalPower + stats.specialPower + stats.defense + stats.resistance + stats.speed + stats.battleEnergy / 5;
  if (score >= 145) return "Elite";
  if (score >= 105) return "Ready";
  return "Novice";
}
