import {
  getTalentDefinition,
  getTalentEffects,
  normalizeTalentInstances,
} from "./talentDefinitions";
import type { BattleStatKey, BattleStats } from "@/types/battle";
import type {
  CreatureAbility,
  CreatureRecord,
  CreatureStatKey,
} from "@/types/creature";
import type { RanchJobId } from "@/types/ranchJobs";
import type {
  ResolvedTalentEffect,
  TalentEffectType,
  TalentSystem,
} from "@/types/talent";

export type BreedingTalentSummary = {
  pregnancyChance: number;
  creatureXpFlat: number;
  creatureXpPercent: number;
  breederXpFlat: number;
  energyDiscount: number;
  affectionGain: number;
  statGrowthBiases: CreatureStatKey[];
  triggers: string[];
};

export type ChoreTalentSummary = {
  scoreBonus: number;
  energyDiscount: number;
  xpPercent: number;
  triggers: string[];
};

export type BattleTalentSummary = {
  flatStats: Partial<BattleStats>;
  percentStats: Partial<BattleStats>;
  damagePercent: number;
  healingPercent: number;
  startStatuses: Array<{ statusId: string; duration: number; talentName: string }>;
  triggers: string[];
};

export type RecoveryTalentSummary = {
  energyPercent: number;
  affection: number;
  triggers: string[];
};

export type InheritanceTalentSummary = {
  stability: number;
  abilityChance: number;
  mutationChance: number;
  triggers: string[];
};

function effectAppliesToSystem(effectType: TalentEffectType, system: TalentSystem): boolean {
  if (system === "breeding") return effectType.startsWith("breeding-");
  if (system === "growth") return effectType === "growth-stat-bias";
  if (system === "inheritance") return effectType.startsWith("inheritance-");
  if (system === "chore") return effectType.startsWith("chore-");
  if (system === "battle") return effectType.startsWith("battle-");
  if (system === "recovery") return effectType.startsWith("recovery-");
  if (system === "role-tags") return effectType === "role-tag";
  return false;
}

export function resolveTalentEffects(
  talents: CreatureAbility[] | undefined,
  system?: TalentSystem,
): ResolvedTalentEffect[] {
  const normalized = normalizeTalentInstances(talents);
  return normalized.flatMap((talent) => {
    const definition = getTalentDefinition(talent.id);
    if (!definition) return [];
    return getTalentEffects(talent.id, talent.grade)
      .filter((effect) => !system || effectAppliesToSystem(effect.type, system))
      .map((effect) => ({
        ...effect,
        talentId: talent.id,
        talentName: definition.name,
        grade: talent.grade,
        category: definition.category,
      }));
  });
}

function label(effect: ResolvedTalentEffect, detail: string): string {
  return `${effect.talentName} (${effect.grade}): ${detail}`;
}

export function getBreedingTalentSummary(
  talents: CreatureAbility[] | undefined,
): BreedingTalentSummary {
  const summary: BreedingTalentSummary = {
    pregnancyChance: 0,
    creatureXpFlat: 0,
    creatureXpPercent: 0,
    breederXpFlat: 0,
    energyDiscount: 0,
    affectionGain: 0,
    statGrowthBiases: [],
    triggers: [],
  };

  for (const effect of resolveTalentEffects(talents, "breeding")) {
    if (effect.type === "breeding-pregnancy-chance") {
      summary.pregnancyChance += effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% pregnancy chance.`));
    } else if (effect.type === "breeding-creature-xp-flat") {
      summary.creatureXpFlat += effect.value;
      summary.triggers.push(label(effect, `+${effect.value} creature XP.`));
    } else if (effect.type === "breeding-creature-xp-percent") {
      summary.creatureXpPercent += effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% creature XP.`));
    } else if (effect.type === "breeding-breeder-xp-flat") {
      summary.breederXpFlat += effect.value;
      summary.triggers.push(label(effect, `+${effect.value} Breeder XP when the player participates.`));
    } else if (effect.type === "breeding-energy-discount") {
      summary.energyDiscount += effect.value;
      summary.triggers.push(label(effect, `-${effect.value} Breeding Energy cost.`));
    } else if (effect.type === "breeding-affection-gain") {
      summary.affectionGain += effect.value;
      summary.triggers.push(label(effect, `+${effect.value} extra Affection after the session.`));
    }
  }

  for (const effect of resolveTalentEffects(talents, "growth")) {
    if (effect.type === "growth-stat-bias" && effect.creatureStatKey) {
      summary.statGrowthBiases.push(effect.creatureStatKey);
    }
  }

  return summary;
}

export function getChoreTalentSummary(
  talents: CreatureAbility[] | undefined,
  jobId: RanchJobId,
): ChoreTalentSummary {
  const summary: ChoreTalentSummary = {
    scoreBonus: 0,
    energyDiscount: 0,
    xpPercent: 0,
    triggers: [],
  };

  for (const effect of resolveTalentEffects(talents, "chore")) {
    if (effect.jobId && effect.jobId !== jobId) continue;
    if (effect.type === "chore-score") {
      summary.scoreBonus += effect.value;
      summary.triggers.push(label(effect, `+${effect.value} chore score.`));
    } else if (effect.type === "chore-energy-discount") {
      summary.energyDiscount += effect.value;
      summary.triggers.push(label(effect, `-${effect.value} Energy for this chore.`));
    } else if (effect.type === "chore-xp-percent") {
      summary.xpPercent += effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% chore XP.`));
    }
  }

  return summary;
}

export function getBattleTalentSummary(
  talents: CreatureAbility[] | undefined,
): BattleTalentSummary {
  const summary: BattleTalentSummary = {
    flatStats: {},
    percentStats: {},
    damagePercent: 0,
    healingPercent: 0,
    startStatuses: [],
    triggers: [],
  };

  for (const effect of resolveTalentEffects(talents, "battle")) {
    if (effect.type === "battle-stat-flat" && effect.battleStatKey) {
      summary.flatStats[effect.battleStatKey] = (summary.flatStats[effect.battleStatKey] ?? 0) + effect.value;
      summary.triggers.push(label(effect, `+${effect.value} ${effect.battleStatKey}.`));
    } else if (effect.type === "battle-stat-percent" && effect.battleStatKey) {
      summary.percentStats[effect.battleStatKey] = (summary.percentStats[effect.battleStatKey] ?? 0) + effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% ${effect.battleStatKey}.`));
    } else if (effect.type === "battle-damage-percent") {
      summary.damagePercent += effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% damage.`));
    } else if (effect.type === "battle-healing-percent") {
      summary.healingPercent += effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% healing.`));
    } else if (effect.type === "battle-start-status" && effect.statusId) {
      summary.startStatuses.push({
        statusId: effect.statusId,
        duration: Math.max(1, effect.value),
        talentName: effect.talentName,
      });
      summary.triggers.push(label(effect, `starts battle with ${effect.statusId}.`));
    }
  }

  return summary;
}

export function applyTalentBattleStats(
  baseStats: BattleStats,
  talents: CreatureAbility[] | undefined,
): BattleStats {
  const summary = getBattleTalentSummary(talents);
  return (Object.keys(baseStats) as BattleStatKey[]).reduce((stats, statKey) => {
    const flat = summary.flatStats[statKey] ?? 0;
    const percent = summary.percentStats[statKey] ?? 0;
    const raw = (baseStats[statKey] + flat) * (1 + percent / 100);
    return {
      ...stats,
      [statKey]: statKey === "evasion" ? Math.max(0, Math.round(raw)) : Math.max(1, Math.round(raw)),
    };
  }, {} as BattleStats);
}

export function getRecoveryTalentSummary(
  talents: CreatureAbility[] | undefined,
): RecoveryTalentSummary {
  const summary: RecoveryTalentSummary = { energyPercent: 0, affection: 0, triggers: [] };
  for (const effect of resolveTalentEffects(talents, "recovery")) {
    if (effect.type === "recovery-energy-percent") {
      summary.energyPercent += effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% daily Energy recovery.`));
    } else if (effect.type === "recovery-affection") {
      summary.affection += effect.value;
      summary.triggers.push(label(effect, `+${effect.value} Affection during daily recovery.`));
    }
  }
  return summary;
}

export function getInheritanceTalentSummary(
  talents: CreatureAbility[] | undefined,
): InheritanceTalentSummary {
  const summary: InheritanceTalentSummary = { stability: 0, abilityChance: 0, mutationChance: 0, triggers: [] };
  for (const effect of resolveTalentEffects(talents, "inheritance")) {
    if (effect.type === "inheritance-stability") {
      summary.stability += effect.value;
      summary.triggers.push(label(effect, `+${effect.value} inheritance stability.`));
    } else if (effect.type === "inheritance-ability-chance") {
      summary.abilityChance += effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% talent inheritance chance.`));
    } else if (effect.type === "inheritance-mutation-chance") {
      summary.mutationChance += effect.value;
      summary.triggers.push(label(effect, `+${effect.value}% beneficial mutation chance.`));
    }
  }
  return summary;
}

export function getTalentRoleTags(
  talents: CreatureAbility[] | undefined,
): string[] {
  return Array.from(new Set(
    resolveTalentEffects(talents, "role-tags")
      .filter((effect) => effect.type === "role-tag" && effect.roleTag)
      .map((effect) => effect.roleTag as string),
  ));
}

export function getCreatureTalentRoleTags(creature: CreatureRecord): string[] {
  return getTalentRoleTags(creature.abilities);
}
