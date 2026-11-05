import { getAffectionAfterBreeding } from "./breedingCore";
import { GENERAL_ABILITY_POOL } from "./talents/generalTalents";
import { normalizeTalentInstance } from "./talents/talentDefinitions";
import {
  STAT_KEYS,
  applyStatGrades,
  getSpeciesDefinition,
  getVariantDefinition,
  getVariantsForFamily,
  rollStatGrades,
  shiftStatGrade,
} from "@/data/creatures";
import { getRanchUpgrades } from "@/data/ranchUpgrades";
import type { BreedingParticipant } from "@/types/breeding";
import type {
  AbilityGrade,
  CreatureAbility,
  CreatureFamily,
  CreatureLineageRisk,
  CreatureRecord,
  CreatureStatKey,
  CreatureStats,
  StatGrade,
  StatGrades,
} from "@/types/creature";
import type { EggId, VariantId } from "@/types/ids";
import type { GameSave, InheritancePreview, ParentSnapshot } from "@/types/save";

export type GeneticsStatRange = { min: number; max: number };

export type StrategicGeneticsPreview = {
  family: CreatureFamily;
  familyBonusLabel: string;
  statRanges: Record<CreatureStatKey, GeneticsStatRange>;
  stabilityScore: number;
  stabilityLabel: string;
  gradeUpgradeChance: number;
  gradeDowngradeChance: number;
  abilityInheritanceChance: number;
  secondAbilityChance: number;
  mutationChance: number;
  rareVariantChance: number;
  shinyChance: number;
  notes: string[];
};

type GeneticsContext = StrategicGeneticsPreview & {
  pairStreak: number;
  breedingTier: number;
  giverCreature?: CreatureRecord;
  receiverCreature?: CreatureRecord;
};

const FAMILY_STAT_BONUSES: Record<
  CreatureFamily,
  { bonuses: Partial<CreatureStats>; label: string }
> = {
  feline: {
    bonuses: { DEX: 1, CHA: 1 },
    label: "Feline lineage favors Dexterity and Charm.",
  },
  canine: {
    bonuses: { STR: 1, WIL: 1 },
    label: "Canine lineage favors Strength and Willpower.",
  },
  bovine: {
    bonuses: { STA: 2 },
    label: "Bovine lineage strongly favors Stamina.",
  },
  lapine: {
    bonuses: { DEX: 1, FER: 1 },
    label: "Lapine lineage favors Dexterity and Fertility.",
  },
  equine: {
    bonuses: { STA: 1, DEX: 1 },
    label: "Equine lineage favors Stamina and Dexterity.",
  },
};

export const TALENT_INHERITANCE_GRADES = ["S", "A", "B", "C", "D"] as const satisfies readonly AbilityGrade[];
type InheritedTalentGrade = (typeof TALENT_INHERITANCE_GRADES)[number];

// Grade chances after the talent and contributing parent have been selected.
// Legacy F talents retain their selection weight and use the D grade profile.
const TALENT_GRADE_CHANCES: Record<InheritedTalentGrade, readonly [number, number, number, number, number]> = {
  S: [60, 28, 9, 2, 1],
  A: [12, 57, 22, 7, 2],
  B: [3, 14, 56, 22, 5],
  C: [1, 4, 15, 58, 22],
  D: [1, 2, 5, 22, 70],
};

const ABILITY_GRADE_WEIGHT: Record<AbilityGrade, number> = {
  F: 1,
  D: 2,
  C: 3,
  B: 5,
  A: 8,
  S: 12,
};

const RARITY_PARENT_BONUS = {
  Common: 0,
  Uncommon: 2,
  Rare: 4,
  Epic: 7,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function deterministicRoll(seed: string, modulo = 10000): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 10000019;
  }
  return Math.abs(hash) % Math.max(1, modulo);
}

function getPairKey(a: string, b: string): string {
  return [a, b].sort().join("__");
}

function getPairStreak(
  save: GameSave,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
): number {
  const pairKey = getPairKey(giver.participantId, receiver.participantId);
  return (
    save.breeding?.streaks.find((record) => record.pairKey === pairKey)
      ?.streakCount ?? 0
  );
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

function getOffspringFamily(
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
): CreatureFamily {
  const receiverFamily = receiver.sceneFamily;
  if (
    receiverFamily === "feline" ||
    receiverFamily === "canine" ||
    receiverFamily === "bovine" ||
    receiverFamily === "lapine" ||
    receiverFamily === "equine"
  ) {
    return receiverFamily;
  }

  const giverFamily = giver.sceneFamily;
  if (
    giverFamily === "canine" ||
    giverFamily === "bovine" ||
    giverFamily === "lapine" ||
    giverFamily === "equine"
  ) {
    return giverFamily;
  }

  return "feline";
}

function getStabilityLabel(score: number): string {
  if (score >= 85) return "Highly Stable";
  if (score >= 68) return "Stable";
  if (score >= 48) return "Variable";
  return "Unpredictable";
}

function getParentRarityBonus(creature?: CreatureRecord): number {
  if (!creature) return 0;
  const rarity = getVariantDefinition(creature.variantId).rarity;
  return RARITY_PARENT_BONUS[rarity];
}

function getParentShinyBonus(creature?: CreatureRecord): number {
  return creature?.shiny ? 0.75 : 0;
}

function getParticipantStat(
  participant: BreedingParticipant,
  statKey: CreatureStatKey,
): number {
  return participant.stats?.[statKey] ?? 5;
}

function buildBaseAnchor(
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  family: CreatureFamily,
  statKey: CreatureStatKey,
): number {
  const variants = getVariantsForFamily(family);
  const commonVariant =
    variants.find((variant) => variant.rarity === "Common") ?? variants[0];
  const species = getSpeciesDefinition(commonVariant.speciesId);
  const speciesBase = Math.max(
    1,
    species.baseStats[statKey] + (commonVariant.statAdjustments[statKey] ?? 0),
  );
  const giverValue = getParticipantStat(giver, statKey);
  const receiverValue = getParticipantStat(receiver, statKey);

  return Math.round(receiverValue * 0.45 + giverValue * 0.35 + speciesBase * 0.2);
}

function buildContext(
  save: GameSave,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  pairStreak = getPairStreak(save, giver, receiver),
): GeneticsContext {
  const breedingTier = clamp(
    getRanchUpgrades(save).breeding_pen_comfort ?? 0,
    0,
    4,
  );
  const averageAffection = Math.round((giver.affection + receiver.affection) / 2);
  const stabilityScore = clamp(
    Math.round(averageAffection * 0.72 + Math.min(pairStreak, 10) * 2 + breedingTier * 3),
    0,
    100,
  );
  const family = getOffspringFamily(giver, receiver);
  const familyBonus = FAMILY_STAT_BONUSES[family];
  const giverCreature = getCreature(save, giver);
  const receiverCreature = getCreature(save, receiver);
  const parentRarityBonus =
    getParentRarityBonus(giverCreature) + getParentRarityBonus(receiverCreature);

  const gradeUpgradeChance = clamp(
    3 + Math.min(pairStreak, 7) + Math.floor(stabilityScore / 28) + breedingTier,
    3,
    18,
  );
  const gradeDowngradeChance = clamp(
    10 - Math.floor(stabilityScore / 16) - Math.floor(pairStreak / 3),
    2,
    10,
  );
  const abilityInheritanceChance = clamp(
    18 + breedingTier * 8 + Math.min(pairStreak, 8) * 3 + Math.floor(stabilityScore / 10),
    18,
    82,
  );
  const secondAbilityChance = clamp(
    breedingTier * 3 + Math.floor(pairStreak / 2) * 2 + Math.floor(stabilityScore / 25),
    0,
    25,
  );
  const mutationChance = clamp(
    2 + Math.floor(pairStreak / 4) + Math.floor(stabilityScore / 40) + Math.floor(breedingTier / 2),
    2,
    9,
  );
  const rareVariantChance = clamp(
    4 + parentRarityBonus + Math.min(pairStreak, 6) + Math.floor(stabilityScore / 25) + breedingTier,
    4,
    28,
  );
  const shinyChance = Number(
    clamp(
      0.5 +
        getParentShinyBonus(giverCreature) +
        getParentShinyBonus(receiverCreature) +
        Math.min(pairStreak, 10) * 0.15 +
        Math.floor(stabilityScore / 25) * 0.2 +
        breedingTier * 0.25,
      0.5,
      5,
    ).toFixed(2),
  );

  const statRanges = STAT_KEYS.reduce((ranges, statKey) => {
    const anchor =
      buildBaseAnchor(giver, receiver, family, statKey) +
      (familyBonus.bonuses[statKey] ?? 0);
    const lowVariance = stabilityScore >= 85 ? 1 : stabilityScore >= 60 ? 2 : 3;
    return {
      ...ranges,
      [statKey]: {
        min: Math.max(1, anchor - lowVariance),
        max: anchor + 2 + (mutationChance >= 6 ? 1 : 0),
      },
    };
  }, {} as Record<CreatureStatKey, GeneticsStatRange>);

  return {
    family,
    familyBonusLabel: familyBonus.label,
    statRanges,
    stabilityScore,
    stabilityLabel: getStabilityLabel(stabilityScore),
    gradeUpgradeChance,
    gradeDowngradeChance,
    abilityInheritanceChance,
    secondAbilityChance,
    mutationChance,
    rareVariantChance,
    shinyChance,
    pairStreak,
    breedingTier,
    giverCreature,
    receiverCreature,
    notes: [
      "Projected ranges are possibilities, not guaranteed offspring results.",
      "Receiver stats carry 45% weight, giver stats 35%, and family baseline 20%.",
      familyBonus.label,
      `Affection and pair familiarity produce ${getStabilityLabel(stabilityScore).toLowerCase()} inheritance.`,
    ],
  };
}

export function getStrategicGeneticsPreview(
  save: GameSave,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
): StrategicGeneticsPreview {
  const context = buildContext(save, giver, receiver);
  const {
    pairStreak: _pairStreak,
    breedingTier: _breedingTier,
    giverCreature: _giverCreature,
    receiverCreature: _receiverCreature,
    ...preview
  } = context;
  return preview;
}

function parentSnapshot(participant: BreedingParticipant): ParentSnapshot {
  return {
    participantId: participant.participantId,
    creatureId: participant.creatureId,
    displayName: participant.displayName,
    familyLabel: participant.familyLabel,
    kind: participant.kind,
  };
}

function chooseParentGrade(
  seed: string,
  statKey: CreatureStatKey,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
): StatGrade {
  const giverGrade = giver.statGrades?.[statKey];
  const receiverGrade = receiver.statGrades?.[statKey];
  if (!giverGrade && !receiverGrade) {
    return rollStatGrades(`${seed}_${statKey}_fallback`, "Common")[statKey];
  }
  if (!giverGrade) return receiverGrade!;
  if (!receiverGrade) return giverGrade;

  return deterministicRoll(`${seed}_${statKey}_grade_parent`, 100) < 55
    ? receiverGrade
    : giverGrade;
}

function inheritStatGrades(
  seed: string,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  context: GeneticsContext,
): { grades: StatGrades; notes: string[] } {
  const notes: string[] = [];
  const grades = STAT_KEYS.reduce((result, statKey) => {
    const inherited = chooseParentGrade(seed, statKey, giver, receiver);
    const roll = deterministicRoll(`${seed}_${statKey}_grade_shift`, 100);
    let finalGrade = inherited;

    if (roll < context.gradeUpgradeChance) {
      finalGrade = shiftStatGrade(inherited, 1);
      if (finalGrade !== inherited) {
        notes.push(
          `${statKey} inherited ${inherited} and upgraded to ${finalGrade} through strong pairing quality.`,
        );
      }
    } else if (
      roll >= 100 - context.gradeDowngradeChance &&
      context.stabilityScore < 90
    ) {
      finalGrade = shiftStatGrade(inherited, -1);
      if (finalGrade !== inherited) {
        notes.push(
          `${statKey} inherited ${inherited} but shifted down to ${finalGrade}.`,
        );
      }
    } else {
      notes.push(`${statKey} inherited grade ${inherited}.`);
    }

    return { ...result, [statKey]: finalGrade };
  }, {} as StatGrades);

  return { grades, notes };
}

function pickProjectedVariant(
  seed: string,
  context: GeneticsContext,
): VariantId {
  const variants = getVariantsForFamily(context.family);
  const commonVariant =
    variants.find((variant) => variant.rarity === "Common") ?? variants[0];
  const rareVariants = variants.filter((variant) => variant.rarity !== "Common");
  const rareRoll = deterministicRoll(`${seed}_rare_variant`, 100);

  if (!rareVariants.length || rareRoll >= context.rareVariantChance) {
    return commonVariant.variantId;
  }

  const parentVariants = [context.receiverCreature, context.giverCreature]
    .filter((creature): creature is CreatureRecord => Boolean(creature))
    .map((creature) => getVariantDefinition(creature.variantId))
    .filter(
      (variant) =>
        variant.family === context.family && variant.rarity !== "Common",
    );

  if (
    parentVariants.length &&
    deterministicRoll(`${seed}_rare_parent_variant`, 100) < 55
  ) {
    return parentVariants[
      deterministicRoll(`${seed}_rare_parent_pick`, parentVariants.length)
    ].variantId;
  }

  return rareVariants[
    deterministicRoll(`${seed}_rare_variant_pick`, rareVariants.length)
  ].variantId;
}

function buildWeightedStats(
  seed: string,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  variantId: VariantId,
  grades: StatGrades,
  context: GeneticsContext,
): { stats: CreatureStats; notes: string[]; traits: string[] } {
  const notes: string[] = [];
  const traits: string[] = [];
  const variant = getVariantDefinition(variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const familyBonus = FAMILY_STAT_BONUSES[context.family].bonuses;
  const gradeAdjustedSpecies = applyStatGrades(
    STAT_KEYS.reduce(
      (stats, statKey) => ({
        ...stats,
        [statKey]: Math.max(
          1,
          species.baseStats[statKey] + (variant.statAdjustments[statKey] ?? 0),
        ),
      }),
      {} as CreatureStats,
    ),
    grades,
  );

  let stats = STAT_KEYS.reduce((result, statKey) => {
    const giverValue = getParticipantStat(giver, statKey);
    const receiverValue = getParticipantStat(receiver, statKey);
    const speciesValue = gradeAdjustedSpecies[statKey];
    const anchor = Math.round(
      receiverValue * 0.45 + giverValue * 0.35 + speciesValue * 0.2,
    );
    const roll = deterministicRoll(`${seed}_${statKey}_variance`, 100);
    const negativeChance = clamp(24 - Math.floor(context.stabilityScore / 6), 6, 24);
    const positiveChance = clamp(
      18 + Math.floor(context.stabilityScore / 8) + Math.min(context.pairStreak, 6),
      18,
      38,
    );
    let variance = 0;

    if (roll < negativeChance) variance = -1;
    if (roll >= 100 - positiveChance) variance = 1;
    if (roll >= 98) variance = 2;

    const familyAdjustment = familyBonus[statKey] ?? 0;
    if (familyAdjustment > 0) {
      notes.push(
        `${statKey} gained +${familyAdjustment} from ${context.family} family inheritance.`,
      );
    }

    return {
      ...result,
      [statKey]: Math.max(1, anchor + variance + familyAdjustment),
    };
  }, {} as CreatureStats);

  const mutationRoll = deterministicRoll(`${seed}_offspring_mutation`, 100);
  if (mutationRoll < context.mutationChance) {
    const mutationStat =
      STAT_KEYS[deterministicRoll(`${seed}_mutation_stat`, STAT_KEYS.length)];
    const mutationPower =
      deterministicRoll(`${seed}_mutation_power`, 100) >= 92 ? 2 : 1;
    stats = {
      ...stats,
      [mutationStat]: stats[mutationStat] + mutationPower,
    };
    traits.push("Beneficial Mutation");
    notes.push(
      `${mutationStat} received a rare +${mutationPower} beneficial mutation.`,
    );
  }

  return { stats, notes, traits };
}

function weightedAbilityPick(
  seed: string,
  entries: Array<{
    ability: CreatureAbility;
    weight: number;
    parentName: string;
  }>,
): { ability: CreatureAbility; parentName: string } | null {
  if (!entries.length) return null;
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = deterministicRoll(seed, totalWeight);
  for (const entry of entries) {
    if (roll < entry.weight) {
      return { ability: entry.ability, parentName: entry.parentName };
    }
    roll -= entry.weight;
  }
  const fallback = entries[entries.length - 1];
  return { ability: fallback.ability, parentName: fallback.parentName };
}

function getTalentMutationChance(tier: number, streak: number): number {
  return clamp(1 + tier + Math.floor(streak / 4), 1, 8);
}

/** Check probabilities, not per-talent odds or a prediction of the seeded result. */
export function getTalentInheritanceOdds(save: GameSave, giver: BreedingParticipant, receiver: BreedingParticipant) {
  const context = buildContext(save, giver, receiver);
  const ids = new Set([...(giver.abilities ?? []), ...(receiver.abilities ?? [])].map(t => t.id));
  return {
    first: ids.size ? context.abilityInheritanceChance : 0,
    second: ids.size > 1 ? context.secondAbilityChance : 0,
    mutation: getTalentMutationChance(context.breedingTier, context.pairStreak),
  };
}

function getParentTalentEntries(
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  offspringFamily: CreatureFamily,
) {
  return ([["Giver", giver], ["Receiver", receiver]] as const).flatMap(([role, participant]) =>
    (participant.abilities ?? []).map(ability => ({
      ability,
      role,
      parentName: participant.displayName,
      weight: ABILITY_GRADE_WEIGHT[ability.grade] * (1 + Math.floor(participant.affection / 25)),
      eligible: ability.id !== "guard_dog" || offspringFamily === "canine",
    })),
  );
}

function talentGradeChances(source: AbilityGrade) {
  return TALENT_GRADE_CHANCES[source === "F" ? "D" : source];
}

function inheritTalentGrade(seed: string, ability: CreatureAbility): CreatureAbility {
  // Mix a dedicated grade seed so the new roll does not reuse the parent-pick
  // hash or change the existing inheritance, parent selection, or mutation rolls.
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  let roll = ((hash ^ (hash >>> 16)) >>> 0) / 4294967296 * 100;
  const chances = talentGradeChances(ability.grade);
  for (const [index, grade] of TALENT_INHERITANCE_GRADES.entries()) {
    if (roll < chances[index]) return normalizeTalentInstance({ ...ability, grade });
    roll -= chances[index];
  }
  return normalizeTalentInstance({ ...ability, grade: "D" });
}

/** Nominal parent-roll odds after conception. Mutation and support-item checks are separate. */
export function getParentTalentPreview(save: GameSave, giver: BreedingParticipant, receiver: BreedingParticipant) {
  const afterSession = (parent: BreedingParticipant) => parent.kind === "creature"
    ? { ...parent, affection: getAffectionAfterBreeding(parent.affection) }
    : parent;
  const nextGiver = afterSession(giver);
  const nextReceiver = afterSession(receiver);
  const completedStreak = Math.max(1, getPairStreak(save, giver, receiver) + 1);
  const context = buildContext(save, nextGiver, nextReceiver, completedStreak);
  const entries = getParentTalentEntries(nextGiver, nextReceiver, context.family);
  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const group = groups.get(entry.ability.id) ?? [];
    group.push(entry);
    groups.set(entry.ability.id, group);
  }
  const weights = new Map(
    [...groups].map(([id, sources]) => [
      id, sources.reduce((sum, source) => sum + (source.eligible ? source.weight : 0), 0),
    ]),
  );
  const totalWeight = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
  const eligibleCount = [...weights.values()].filter(weight => weight > 0).length;
  const first = eligibleCount ? context.abilityInheritanceChance : 0;
  const second = eligibleCount > 1 ? context.secondAbilityChance : 0;
  const candidates = [...groups].map(([id, sources]) => {
    const weight = weights.get(id) ?? 0;
    const firstPick = weight ? first * weight / totalWeight : 0;
    // A successful first pick removes every entry with that talent ID.
    let secondPick = 0;
    if (weight && second) {
      for (const [otherId, otherWeight] of weights) {
        if (otherId === id || !otherWeight) continue;
        secondPick += (first * otherWeight / totalWeight) * (second / 100)
          * (weight / (totalWeight - otherWeight));
      }
    }
    const chance = firstPick + secondPick;
    // Removing other talent IDs changes the chance of this talent, but
    // preserves its mix of parent sources and their grade distributions.
    const grades = TALENT_INHERITANCE_GRADES.map((grade, index) => {
      const weightedChance = sources.reduce((sum, source) =>
        sum + (source.eligible ? source.weight * talentGradeChances(source.ability.grade)[index] : 0), 0);
      const share = weight ? weightedChance / weight : 0;
      return { grade, chance: chance * share / 100, share };
    });
    return { talent: sources[0].ability, sources, firstPick, secondPick, chance, grades, notInheritedChance: 100 - chance };
  });
  const anyGrade = new Map<AbilityGrade, number>(TALENT_INHERITANCE_GRADES.map(grade => {
    // The sum counts an attempt twice if both distinct picks have this grade.
    const gradeWeights = candidates.map(candidate => {
      const groupWeight = weights.get(candidate.talent.id) ?? 0;
      const gradeShare = candidate.grades.find(row => row.grade === grade)?.share ?? 0;
      return groupWeight * gradeShare / 100;
    });
    const totalGradeWeight = gradeWeights.reduce((sum, weight) => sum + weight, 0);
    const both = second ? candidates.reduce((sum, candidate, index) => {
      const remaining = totalWeight - (weights.get(candidate.talent.id) ?? 0);
      const gradeWeight = gradeWeights[index];
      return sum + (remaining ? first * gradeWeight / totalWeight * second / 100
        * (totalGradeWeight - gradeWeight) / remaining : 0);
    }, 0) : 0;
    const sum = candidates.reduce((total, candidate) =>
      total + (candidate.grades.find(row => row.grade === grade)?.chance ?? 0), 0);
    return [grade, Math.max(0, sum - both)] as const;
  }));
  return {
    first,
    second,
    mutation: getTalentMutationChance(context.breedingTier, context.pairStreak),
    candidates,
    anyGrade,
  };
}

function buildInheritedAbilities(
  seed: string,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  variantId: VariantId,
  context: GeneticsContext,
): { abilities: CreatureAbility[]; notes: string[] } {
  const notes: string[] = [];
  const inherited: CreatureAbility[] = [];
  const entries = getParentTalentEntries(giver, receiver, getVariantDefinition(variantId).family)
    .filter(entry => entry.eligible);

  if (
    entries.length &&
    deterministicRoll(`${seed}_ability_inherit_roll`, 100) <
      context.abilityInheritanceChance
  ) {
    const first = weightedAbilityPick(`${seed}_ability_first_pick`, entries);
    if (first) {
      const ability = inheritTalentGrade(`${seed}_ability_first_grade`, first.ability);
      inherited.push({ ...ability, inheritanceOrigin: { kind: "parent", parentName: first.parentName } });
      notes.push(
        `${ability.name} (${ability.grade}) was inherited from ${first.parentName}.`,
      );
    }
  }

  const remainingEntries = entries.filter(
    (entry) => !inherited.some((ability) => ability.id === entry.ability.id),
  );
  if (
    inherited.length &&
    remainingEntries.length &&
    deterministicRoll(`${seed}_ability_second_roll`, 100) <
      context.secondAbilityChance
  ) {
    const second = weightedAbilityPick(
      `${seed}_ability_second_pick`,
      remainingEntries,
    );
    if (second) {
      const ability = inheritTalentGrade(`${seed}_ability_second_grade`, second.ability);
      inherited.push({ ...ability, inheritanceOrigin: { kind: "parent", parentName: second.parentName } });
      notes.push(
        `${ability.name} (${ability.grade}) also carried through from ${second.parentName}.`,
      );
    }
  }

  const mutationPool = GENERAL_ABILITY_POOL.filter(
    (ability) => !inherited.some((inheritedAbility) => inheritedAbility.id === ability.id),
  );
  const abilityMutationChance = getTalentMutationChance(context.breedingTier, context.pairStreak);

  if (
    mutationPool.length &&
    inherited.length < 2 &&
    deterministicRoll(`${seed}_ability_mutation_roll`, 100) <
      abilityMutationChance
  ) {
    const mutation =
      mutationPool[
        deterministicRoll(`${seed}_ability_mutation_pick`, mutationPool.length)
      ];
    inherited.push({ ...mutation, source: "general", inheritanceOrigin: { kind: "mutation" } });
    notes.push(
      `${mutation.name} appeared as a rare new ability mutation rather than direct inheritance.`,
    );
  }

  if (!notes.length) {
    notes.push(
      entries.length
        ? "No parent ability carried through this time; higher affection, pair streak, and Breeding Pen Comfort improve the odds."
        : "Neither contributor supplied an inheritable ability; only a rare new mutation was possible.",
    );
  }

  return { abilities: inherited.slice(0, 2), notes };
}

function applyLineageRisk(
  seed: string,
  stats: CreatureStats,
  grades: StatGrades,
  risk: CreatureLineageRisk,
): {
  stats: CreatureStats;
  grades: StatGrades;
  notes: string[];
  traits: string[];
} {
  if (risk === "none") return { stats, grades, notes: [], traits: [] };

  const pressure =
    risk === "half-sibling" ? 12 : risk === "full-sibling" ? 22 : 30;
  const notes: string[] = [];
  const traits: string[] = [];
  let nextStats = { ...stats };
  let nextGrades = { ...grades };

  for (const statKey of ["FER", "STA", "WIL"] as CreatureStatKey[]) {
    if (deterministicRoll(`${seed}_${risk}_${statKey}_risk`, 100) < pressure) {
      nextStats = { ...nextStats, [statKey]: Math.max(1, nextStats[statKey] - 1) };
      if (deterministicRoll(`${seed}_${risk}_${statKey}_grade`, 100) < pressure / 2) {
        nextGrades = {
          ...nextGrades,
          [statKey]: shiftStatGrade(nextGrades[statKey], -1),
        };
      }
      notes.push(`${statKey} was weakened by ${risk} lineage pressure.`);
    }
  }

  if (deterministicRoll(`${seed}_${risk}_fragile`, 100) < pressure / 5) {
    traits.push("Fragile Lineage");
    notes.push("The offspring carries a Fragile Lineage marker.");
  }

  return { stats: nextStats, grades: nextGrades, notes, traits };
}

function getLineageRisk(
  giverCreature?: CreatureRecord,
  receiverCreature?: CreatureRecord,
): { risk: CreatureLineageRisk; label: string; notes: string[] } {
  if (!giverCreature || !receiverCreature) {
    return {
      risk: "none",
      label: "No Risk",
      notes: ["No close creature lineage risk was detected."],
    };
  }

  const giverParents = new Set(giverCreature.lineage?.parentCreatureIds ?? []);
  const receiverParents = receiverCreature.lineage?.parentCreatureIds ?? [];
  const directLine =
    giverParents.has(receiverCreature.creatureId) ||
    (receiverCreature.lineage?.parentCreatureIds ?? []).includes(
      giverCreature.creatureId,
    );
  if (directLine) {
    return {
      risk: "parent-child",
      label: "Direct Lineage",
      notes: ["Direct parent-child lineage detected."],
    };
  }

  const sharedParents = receiverParents.filter((parentId) =>
    giverParents.has(parentId),
  ).length;
  if (sharedParents >= 2) {
    return {
      risk: "full-sibling",
      label: "Full Sibling Line",
      notes: ["Full-sibling lineage detected."],
    };
  }
  if (sharedParents === 1) {
    return {
      risk: "half-sibling",
      label: "Half Sibling Line",
      notes: ["Half-sibling lineage detected."],
    };
  }

  return {
    risk: "none",
    label: "No Risk",
    notes: ["No close family risk detected from tracked contributors."],
  };
}

export function createStrategicInheritancePreview(
  save: GameSave,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  seed: string,
): InheritancePreview {
  const context = buildContext(save, giver, receiver);
  const variantId = pickProjectedVariant(seed, context);
  const variant = getVariantDefinition(variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const inheritedGrades = inheritStatGrades(seed, giver, receiver, context);
  const weightedStats = buildWeightedStats(
    seed,
    giver,
    receiver,
    variantId,
    inheritedGrades.grades,
    context,
  );
  const lineage = getLineageRisk(
    context.giverCreature,
    context.receiverCreature,
  );
  const lineageResult = applyLineageRisk(
    seed,
    weightedStats.stats,
    inheritedGrades.grades,
    lineage.risk,
  );
  const abilityResult = buildInheritedAbilities(
    seed,
    giver,
    receiver,
    variantId,
    context,
  );
  const projectedShiny =
    deterministicRoll(`${seed}_shiny`, 10000) <
    Math.round(context.shinyChance * 100);
  const parents = {
    giver: parentSnapshot(giver),
    receiver: parentSnapshot(receiver),
  };
  const provisionalEgg = {
    eggId: `${seed}_egg` as EggId,
    parents,
    variantId: variant.variantId,
    speciesId: species.speciesId,
  };
  const geneticsNotes = [
    `Weighted inheritance used receiver 45%, giver 35%, and ${context.family} family baseline 20%.`,
    context.familyBonusLabel,
    `Inheritance stability: ${context.stabilityLabel} (${context.stabilityScore}/100).`,
    `Pair streak ${context.pairStreak} influenced grade, ability, rare variant, mutation, and shiny odds.`,
    projectedShiny
      ? "A rare shiny outcome was rolled."
      : `Shiny chance was ${context.shinyChance}%.`,
  ];

  return {
    projectedSpeciesId: species.speciesId,
    projectedVariantId: variant.variantId,
    projectedStats: lineageResult.stats,
    projectedStatGrades: lineageResult.grades,
    projectedAbilities: abilityResult.abilities,
    projectedShiny,
    statRollNotes: [
      ...inheritedGrades.notes,
      ...weightedStats.notes,
      ...lineageResult.notes,
    ],
    abilityRollNotes: abilityResult.notes,
    geneticsNotes,
    lineageRisk: lineage.risk,
    lineageRiskLabel: lineage.label,
    lineageNotes: [...lineage.notes, ...lineageResult.notes],
    lineageTraits: [
      ...weightedStats.traits,
      ...lineageResult.traits,
      ...(projectedShiny ? ["Shiny"] : []),
    ],
    suggestedName: buildSuggestedName(provisionalEgg, context.family),
  };
}

function buildSuggestedName(
  egg: {
    eggId: EggId;
    parents: { giver: ParentSnapshot; receiver: ParentSnapshot };
  },
  family: CreatureFamily,
): string {
  const familyRoots: Record<CreatureFamily, readonly string[]> = {
    feline: ["Mira", "Nyra", "Velin", "Sable", "Liora"],
    canine: ["Rook", "Fenro", "Korra", "Valo", "Thane"],
    bovine: ["Brunae", "Clovelle", "Terra", "Hazel", "Barley"],
    lapine: ["Pippa", "Clover", "Fennel", "Miri", "Thimble"],
    equine: ["Marlow", "Astra", "Canter", "Velora", "Solwyn"],
  };
  const roots = familyRoots[family];
  const root = roots[deterministicRoll(`${egg.eggId}_name`, roots.length)];
  const parentInitial =
    deterministicRoll(`${egg.eggId}_parent_initial`, 2) === 0
      ? egg.parents.giver.displayName.slice(0, 1)
      : egg.parents.receiver.displayName.slice(0, 1);
  const candidate = `${parentInitial}${root.slice(1)}`;
  return candidate.slice(0, 1).toUpperCase() + candidate.slice(1);
}

export function formatStrategicGeneticsSummary(
  preview: StrategicGeneticsPreview,
): string {
  const ranges = STAT_KEYS.map(
    (statKey) =>
      `${statKey} ${preview.statRanges[statKey].min}-${preview.statRanges[statKey].max}`,
  ).join(" · ");

  return `Possible offspring (${preview.family}): ${ranges}. ${preview.stabilityLabel} inheritance; grade upgrade ${preview.gradeUpgradeChance}%, ability inheritance ${preview.abilityInheritanceChance}%, rare variant ${preview.rareVariantChance}%, mutation ${preview.mutationChance}%, shiny ${preview.shinyChance}%. Outcomes are not guaranteed.`;
}

