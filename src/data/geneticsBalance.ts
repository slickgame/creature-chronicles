import balanceConfig from "./geneticsBalanceConfig.json";
import {
  STAT_KEYS,
  applyStatGrades,
  getSpeciesDefinition,
  getVariantDefinition,
  getVariantsForFamily,
} from "@/data/creatures";
import type { StrategicGeneticsPreview } from "@/data/genetics";
import type { BreedingParticipant } from "@/types/breeding";
import type {
  CreatureFamily,
  CreatureRecord,
  CreatureStatKey,
  CreatureStats,
  StatGrade,
  StatGrades,
} from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave, InheritancePreview } from "@/types/save";

const FAMILY_BONUSES = balanceConfig.familyStatBonuses as Record<
  CreatureFamily,
  Partial<Record<CreatureStatKey, number>>
>;
const GRADE_HEADROOM = balanceConfig.gradeHeadroom as Record<StatGrade, number>;
const RARITY_HEADROOM = balanceConfig.rarityHeadroom as Record<
  "Common" | "Uncommon" | "Rare" | "Epic",
  number
>;
const WEIGHTS = balanceConfig.inheritanceWeights;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function deterministicRoll(seed: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 10000019;
  }
  return Math.abs(hash) % Math.max(1, modulo);
}

function getCreature(
  save: GameSave,
  participant: BreedingParticipant,
): CreatureRecord | undefined {
  if (!participant.creatureId) return undefined;
  return (save.creatures ?? []).find(
    (creature) => creature.creatureId === participant.creatureId,
  );
}

function getCurrentStat(
  participant: BreedingParticipant,
  statKey: CreatureStatKey,
): number {
  return participant.stats?.[statKey] ?? 5;
}

function buildVariantBaseStats(creature: CreatureRecord): CreatureStats {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  return STAT_KEYS.reduce(
    (stats, statKey) => ({
      ...stats,
      [statKey]: Math.max(
        1,
        species.baseStats[statKey] + (variant.statAdjustments[statKey] ?? 0),
      ),
    }),
    {} as CreatureStats,
  );
}

function getGeneticPotential(
  participant: BreedingParticipant,
  creature: CreatureRecord | undefined,
  statKey: CreatureStatKey,
): number {
  if (!creature) {
    // The breeder has no species baseline or inheritable talent pool. Treat
    // most of the breeder's displayed stat as innate contribution while still
    // keeping the developed-stat channel small.
    return Math.max(1, Math.round(getCurrentStat(participant, statKey) * 0.9));
  }

  const baseStats = buildVariantBaseStats(creature);
  const adjusted = applyStatGrades(baseStats, creature.statGrades);
  return adjusted[statKey];
}

function getAverage(values: number[]): number {
  if (!values.length) return 5;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getStabilityScore(inheritance: InheritancePreview): number {
  for (const note of inheritance.geneticsNotes ?? []) {
    const match = note.match(/Inheritance stability:\s*[^()]+\((\d+)\/100\)/i);
    if (match) return clamp(Number(match[1]), 0, 100);
  }
  return 60;
}

function getStabilityVariance(score: number): number {
  if (score >= 85) return balanceConfig.stabilityVariance.highlyStable;
  if (score >= 68) return balanceConfig.stabilityVariance.stable;
  if (score >= 48) return balanceConfig.stabilityVariance.variable;
  return balanceConfig.stabilityVariance.unpredictable;
}

function getMutationForStat(
  inheritance: InheritancePreview,
  statKey: CreatureStatKey,
): number {
  for (const note of inheritance.statRollNotes) {
    const match = note.match(
      /^(STR|DEX|STA|CHA|WIL|FER) received a rare \+(\d+) beneficial mutation/i,
    );
    if (match?.[1] === statKey) {
      return clamp(
        Number(match[2]),
        0,
        balanceConfig.beneficialMutationMaximum,
      );
    }
  }
  return 0;
}

function getLineagePenaltyForStat(
  inheritance: InheritancePreview,
  statKey: CreatureStatKey,
): number {
  return inheritance.statRollNotes.some(
    (note) =>
      note.startsWith(`${statKey} was weakened by`) ||
      note.startsWith(`${statKey} lost 1 point`),
  )
    ? 1
    : 0;
}

function getOffspringBaseStats(inheritance: InheritancePreview): CreatureStats {
  const variant = getVariantDefinition(inheritance.projectedVariantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const rawBase = STAT_KEYS.reduce(
    (stats, statKey) => ({
      ...stats,
      [statKey]: Math.max(
        1,
        species.baseStats[statKey] + (variant.statAdjustments[statKey] ?? 0),
      ),
    }),
    {} as CreatureStats,
  );
  return applyStatGrades(rawBase, inheritance.projectedStatGrades);
}

function getLevelOneCeiling(
  inheritance: InheritancePreview,
  statKey: CreatureStatKey,
  offspringBase: number,
  familyBonus: number,
  mutationBonus: number,
): number {
  const variant = getVariantDefinition(inheritance.projectedVariantId);
  const grade = inheritance.projectedStatGrades[statKey];
  return (
    offspringBase +
    GRADE_HEADROOM[grade] +
    RARITY_HEADROOM[variant.rarity] +
    familyBonus +
    mutationBonus
  );
}

export function applyGeneticsPowerCurve(
  save: GameSave,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  inheritance: InheritancePreview,
  seed: string,
): InheritancePreview {
  const giverCreature = getCreature(save, giver);
  const receiverCreature = getCreature(save, receiver);
  const offspringBaseStats = getOffspringBaseStats(inheritance);
  const family = getVariantDefinition(inheritance.projectedVariantId).family;
  const familyBonuses = FAMILY_BONUSES[family];
  const stabilityScore = getStabilityScore(inheritance);
  const varianceWindow = getStabilityVariance(stabilityScore);
  const capNotes: string[] = [];

  const projectedStats = STAT_KEYS.reduce((stats, statKey) => {
    const parentGeneticPotential = getAverage([
      getGeneticPotential(giver, giverCreature, statKey),
      getGeneticPotential(receiver, receiverCreature, statKey),
    ]);
    const developedAverage = getAverage([
      getCurrentStat(giver, statKey),
      getCurrentStat(receiver, statKey),
    ]);
    const developedSignal = Math.min(
      parentGeneticPotential + balanceConfig.maxDevelopedStatSignal,
      developedAverage,
    );
    const familyBonus = familyBonuses[statKey] ?? 0;
    const mutationBonus = getMutationForStat(inheritance, statKey);
    const lineagePenalty = getLineagePenaltyForStat(inheritance, statKey);
    const randomOffset =
      deterministicRoll(`${seed}_${statKey}_balanced_variance`, varianceWindow * 2 + 1) -
      varianceWindow;
    const weightedAnchor = Math.round(
      parentGeneticPotential * WEIGHTS.parentGeneticPotential +
        offspringBaseStats[statKey] * WEIGHTS.offspringSpeciesBaseline +
        developedSignal * WEIGHTS.parentDevelopedStats,
    );
    const floor = Math.max(
      1,
      offspringBaseStats[statKey] - balanceConfig.levelOneFloorOffset + familyBonus,
    );
    const ceiling = getLevelOneCeiling(
      inheritance,
      statKey,
      offspringBaseStats[statKey],
      familyBonus,
      mutationBonus,
    );
    const uncapped =
      weightedAnchor + familyBonus + mutationBonus + randomOffset - lineagePenalty;
    const finalValue = clamp(uncapped, floor, ceiling);

    if (uncapped > ceiling) {
      capNotes.push(
        `${statKey} was limited to its level-1 genetic ceiling of ${ceiling}; further growth must come from leveling.`,
      );
    }

    return { ...stats, [statKey]: finalValue };
  }, {} as CreatureStats);

  const geneticsNotes = Array.from(
    new Set([
      ...(inheritance.geneticsNotes ?? []),
      "Offspring stats use 65% parent genetic potential, 25% species/variant baseline, and only 10% parent developed stats.",
      "Level-1 genetic ceilings prevent trained high-level parents from creating over-leveled hatchlings.",
    ]),
  );

  return {
    ...inheritance,
    projectedStats,
    geneticsNotes,
    statRollNotes: Array.from(
      new Set([...inheritance.statRollNotes, ...capNotes]),
    ),
  };
}

function getPreviewFamilyBase(family: CreatureFamily): CreatureStats {
  const variants = getVariantsForFamily(family);
  const variant = variants.find((item) => item.rarity === "Common") ?? variants[0];
  const species = getSpeciesDefinition(variant.speciesId);
  return STAT_KEYS.reduce(
    (stats, statKey) => ({
      ...stats,
      [statKey]: Math.max(
        1,
        species.baseStats[statKey] + (variant.statAdjustments[statKey] ?? 0),
      ),
    }),
    {} as CreatureStats,
  );
}

export function getBalancedStrategicGeneticsPreview(
  save: GameSave,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  preview: StrategicGeneticsPreview,
): StrategicGeneticsPreview {
  const giverCreature = getCreature(save, giver);
  const receiverCreature = getCreature(save, receiver);
  const familyBase = getPreviewFamilyBase(preview.family);
  const familyBonuses = FAMILY_BONUSES[preview.family];
  const varianceWindow = getStabilityVariance(preview.stabilityScore);

  const statRanges = STAT_KEYS.reduce((ranges, statKey) => {
    const geneticAverage = getAverage([
      getGeneticPotential(giver, giverCreature, statKey),
      getGeneticPotential(receiver, receiverCreature, statKey),
    ]);
    const developedAverage = getAverage([
      getCurrentStat(giver, statKey),
      getCurrentStat(receiver, statKey),
    ]);
    const developedSignal = Math.min(
      geneticAverage + balanceConfig.maxDevelopedStatSignal,
      developedAverage,
    );
    const familyBonus = familyBonuses[statKey] ?? 0;
    const anchor = Math.round(
      geneticAverage * WEIGHTS.parentGeneticPotential +
        familyBase[statKey] * WEIGHTS.offspringSpeciesBaseline +
        developedSignal * WEIGHTS.parentDevelopedStats +
        familyBonus,
    );
    const broadRareVariantAllowance = 2;

    return {
      ...ranges,
      [statKey]: {
        min: Math.max(1, anchor - varianceWindow),
        max: anchor + varianceWindow + broadRareVariantAllowance,
      },
    };
  }, {} as StrategicGeneticsPreview["statRanges"]);

  return {
    ...preview,
    statRanges,
    notes: Array.from(
      new Set([
        ...preview.notes,
        "Preview ranges emphasize genetic potential; trained parent stats contribute only 10%.",
        "Rare variants, grade upgrades, and mutations can reach the upper edge, but level-1 ceilings still apply.",
      ]),
    ),
  };
}

export function getCorrectOffspringGeneration(
  save: GameSave,
  parentCreatureIds: CreatureId[],
): number {
  const parentGenerations = parentCreatureIds.map(
    (id) =>
      (save.creatures ?? []).find((creature) => creature.creatureId === id)
        ?.generation ?? 1,
  );
  return Math.max(1, ...parentGenerations) + 1;
}
