import * as recordsLifecycle from "./breedingRecordsLifecycle";
import {
  STAT_KEYS,
  getSpeciesDefinition,
  getVariantDefinition,
  getVariantsForFamily,
} from "./creatures";
import { applyGeneticsPowerCurve } from "./geneticsBalance";
import {
  FERTILITY_TONIC_CHANCE_BONUS,
  MUTATION_CATALYST_ABILITY_MUTATION_BONUS,
  MUTATION_CATALYST_MUTATION_BONUS,
  MUTATION_CATALYST_RARE_VARIANT_BONUS,
  TRAIT_STABILIZER_ABILITY_BONUS,
  TRAIT_STABILIZER_DOWNGRADE_REDUCTION,
  TRAIT_STABILIZER_STABILITY_BONUS,
  getBreedingSupportItemActiveCount,
  isBreedingSupportItemArmed,
} from "./breedingItems";
import type {
  BreedingAttemptRecord,
  BreedingParticipant,
  BreedingPreview,
} from "@/types/breeding";
import type {
  AbilityGrade,
  CreatureAbility,
  CreatureStatKey,
  StatGrade,
} from "@/types/creature";
import type { GameSave, InheritancePreview } from "@/types/save";

export * from "./breedingRecordsLifecycle";

const GRADE_ORDER: StatGrade[] = ["D", "C", "B", "A", "S"];
const ABILITY_GRADE_ORDER: AbilityGrade[] = ["F", "D", "C", "B", "A", "S"];

function deterministicRoll(seed: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 10000019;
  }
  return Math.abs(hash) % Math.max(1, modulo);
}

function flagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function preparedFertilitySave(save: GameSave): GameSave {
  return {
    ...save,
    flags: {
      ...save.flags,
      breedingFertilityTonics: isBreedingSupportItemArmed(save, "fertility_tonic") ? 1 : 0,
    },
  };
}

function armedNotes(save: GameSave): string[] {
  const notes: string[] = [];
  if (isBreedingSupportItemArmed(save, "fertility_tonic")) {
    notes.push(`Fertility Tonic armed: +${FERTILITY_TONIC_CHANCE_BONUS}% pregnancy chance on the next valid attempt; consumed whether the attempt succeeds or fails.`);
  }
  if (isBreedingSupportItemArmed(save, "trait_stabilizer")) {
    notes.push(`Trait Stabilizer armed: next successful conception gains +${TRAIT_STABILIZER_STABILITY_BONUS} inheritance stability, -${TRAIT_STABILIZER_DOWNGRADE_REDUCTION}% grade-downgrade chance, and +${TRAIT_STABILIZER_ABILITY_BONUS}% parent-ability inheritance chance.`);
  }
  if (isBreedingSupportItemArmed(save, "mutation_catalyst")) {
    notes.push(`Mutation Catalyst armed: next successful conception gains +${MUTATION_CATALYST_MUTATION_BONUS}% beneficial stat mutation chance, +${MUTATION_CATALYST_ABILITY_MUTATION_BONUS}% new-ability mutation chance, and +${MUTATION_CATALYST_RARE_VARIANT_BONUS}% rare-variant chance.`);
  }
  return notes;
}

export function getBreedingPreview(
  save: GameSave,
  giverId: string | null,
  receiverId: string | null,
): BreedingPreview | null {
  const preview = recordsLifecycle.getBreedingPreview(
    preparedFertilitySave(save),
    giverId,
    receiverId,
  );
  if (!preview) return preview;
  return {
    ...preview,
    readinessNotes: [...armedNotes(save), ...preview.readinessNotes],
  };
}

function gradeIndex(grade: StatGrade): number {
  return GRADE_ORDER.indexOf(grade);
}

function stabilityLabel(score: number): string {
  if (score >= 85) return "Highly Stable";
  if (score >= 68) return "Stable";
  if (score >= 48) return "Variable";
  return "Unpredictable";
}

function raiseStabilityNote(
  inheritance: InheritancePreview,
): InheritancePreview {
  let found = false;
  const geneticsNotes = (inheritance.geneticsNotes ?? []).map((note) => {
    const match = note.match(/Inheritance stability:\s*[^()]+\((\d+)\/100\)\./i);
    if (!match) return note;
    found = true;
    const score = Math.min(100, Number(match[1]) + TRAIT_STABILIZER_STABILITY_BONUS);
    return `Inheritance stability: ${stabilityLabel(score)} (${score}/100).`;
  });
  return {
    ...inheritance,
    geneticsNotes: [
      ...geneticsNotes,
      ...(found
        ? [`Trait Stabilizer added +${TRAIT_STABILIZER_STABILITY_BONUS} effective inheritance stability.`]
        : [`Trait Stabilizer supplied +${TRAIT_STABILIZER_STABILITY_BONUS} inheritance stability; the original stability score was unavailable.`]),
    ],
  };
}

function reduceGradeDowngrades(
  inheritance: InheritancePreview,
  seed: string,
): InheritancePreview {
  const grades = { ...inheritance.projectedStatGrades };
  let prevented = 0;
  const statRollNotes = inheritance.statRollNotes.map((note) => {
    const match = note.match(/^(STR|DEX|STA|CHA|WIL|FER) inherited (D|C|B|A|S) but shifted down to (D|C|B|A|S)\./i);
    if (!match) return note;
    const statKey = match[1].toUpperCase() as CreatureStatKey;
    if (deterministicRoll(`${seed}_${statKey}_stabilizer_downgrade`, 100) >= TRAIT_STABILIZER_DOWNGRADE_REDUCTION) {
      return note;
    }
    const inheritedGrade = match[2].toUpperCase() as StatGrade;
    if (gradeIndex(inheritedGrade) > gradeIndex(grades[statKey])) {
      grades[statKey] = inheritedGrade;
    }
    prevented += 1;
    return `${statKey} retained inherited grade ${inheritedGrade}; Trait Stabilizer prevented the downgrade.`;
  });
  return {
    ...inheritance,
    projectedStatGrades: grades,
    statRollNotes,
    geneticsNotes: [
      ...(inheritance.geneticsNotes ?? []),
      prevented
        ? `Trait Stabilizer prevented ${prevented} inherited grade downgrade${prevented === 1 ? "" : "s"}.`
        : `Trait Stabilizer's -${TRAIT_STABILIZER_DOWNGRADE_REDUCTION}% downgrade check did not prevent a recorded downgrade this time.`,
    ],
    lineageTraits: Array.from(new Set([...inheritance.lineageTraits, "Trait Stabilized"])),
  };
}

function strongestParentAbility(
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  seed: string,
): CreatureAbility | null {
  const abilities = [...(giver.abilities ?? []), ...(receiver.abilities ?? [])];
  if (!abilities.length) return null;
  const bestGrade = Math.max(...abilities.map((ability) => ABILITY_GRADE_ORDER.indexOf(ability.grade)));
  const best = abilities.filter((ability) => ABILITY_GRADE_ORDER.indexOf(ability.grade) === bestGrade);
  return best[deterministicRoll(`${seed}_stabilizer_parent_ability`, best.length)] ?? null;
}

function addAbilityInheritanceChance(
  inheritance: InheritancePreview,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  seed: string,
): InheritancePreview {
  if (inheritance.projectedAbilities.length) return inheritance;
  if (deterministicRoll(`${seed}_stabilizer_ability_roll`, 100) >= TRAIT_STABILIZER_ABILITY_BONUS) {
    return {
      ...inheritance,
      geneticsNotes: [
        ...(inheritance.geneticsNotes ?? []),
        `Trait Stabilizer's +${TRAIT_STABILIZER_ABILITY_BONUS}% parent-ability inheritance check did not trigger.`,
      ],
    };
  }
  const ability = strongestParentAbility(giver, receiver, seed);
  if (!ability) {
    return {
      ...inheritance,
      geneticsNotes: [
        ...(inheritance.geneticsNotes ?? []),
        "Trait Stabilizer's bonus check triggered, but neither parent supplied an inheritable ability.",
      ],
    };
  }
  return {
    ...inheritance,
    projectedAbilities: [{ ...ability }],
    abilityRollNotes: [
      ...inheritance.abilityRollNotes,
      `${ability.name} (${ability.grade}) was inherited through Trait Stabilizer's bonus check.`,
    ],
    geneticsNotes: [
      ...(inheritance.geneticsNotes ?? []),
      `Trait Stabilizer added one parent ability through its +${TRAIT_STABILIZER_ABILITY_BONUS}% bonus check.`,
    ],
  };
}

function mutationAbilityPool(inheritance: InheritancePreview): CreatureAbility[] {
  const variant = getVariantDefinition(inheritance.projectedVariantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const existing = new Set(inheritance.projectedAbilities.map((ability) => ability.id));
  return [...species.exclusiveAbilityPool, ...variant.exclusiveAbilityPool].filter(
    (ability) => !existing.has(ability.id),
  );
}

function applyMutationCatalyst(
  inheritance: InheritancePreview,
  seed: string,
): InheritancePreview {
  let next = { ...inheritance };
  const geneticsNotes = [...(inheritance.geneticsNotes ?? [])];
  const statRollNotes = [...inheritance.statRollNotes];
  const abilityRollNotes = [...inheritance.abilityRollNotes];
  const lineageTraits = [...inheritance.lineageTraits];

  if (deterministicRoll(`${seed}_catalyst_variant_roll`, 100) < MUTATION_CATALYST_RARE_VARIANT_BONUS) {
    const currentVariant = getVariantDefinition(next.projectedVariantId);
    const rareVariants = getVariantsForFamily(currentVariant.family).filter(
      (variant) => variant.rarity !== "Common" && variant.variantId !== currentVariant.variantId,
    );
    const chosen = rareVariants[
      deterministicRoll(`${seed}_catalyst_variant_pick`, rareVariants.length)
    ];
    if (chosen) {
      next = {
        ...next,
        projectedVariantId: chosen.variantId,
        projectedSpeciesId: chosen.speciesId,
      };
      geneticsNotes.push(`Mutation Catalyst's +${MUTATION_CATALYST_RARE_VARIANT_BONUS}% rare-variant check produced ${chosen.name}.`);
      lineageTraits.push("Catalyzed Variant");
    }
  } else {
    geneticsNotes.push(`Mutation Catalyst's +${MUTATION_CATALYST_RARE_VARIANT_BONUS}% rare-variant check did not trigger.`);
  }

  if (deterministicRoll(`${seed}_catalyst_stat_roll`, 100) < MUTATION_CATALYST_MUTATION_BONUS) {
    const statKey = STAT_KEYS[
      deterministicRoll(`${seed}_catalyst_stat_pick`, STAT_KEYS.length)
    ] as CreatureStatKey;
    next = {
      ...next,
      projectedStats: {
        ...next.projectedStats,
        [statKey]: next.projectedStats[statKey] + 1,
      },
    };
    statRollNotes.push(`${statKey} received a rare +1 beneficial mutation from Mutation Catalyst.`);
    geneticsNotes.push(`Mutation Catalyst's +${MUTATION_CATALYST_MUTATION_BONUS}% beneficial mutation check added +1 ${statKey}.`);
    lineageTraits.push("Catalyzed Mutation");
  } else {
    geneticsNotes.push(`Mutation Catalyst's +${MUTATION_CATALYST_MUTATION_BONUS}% beneficial mutation check did not trigger.`);
  }

  if (
    next.projectedAbilities.length < 2 &&
    deterministicRoll(`${seed}_catalyst_ability_roll`, 100) < MUTATION_CATALYST_ABILITY_MUTATION_BONUS
  ) {
    const pool = mutationAbilityPool(next);
    const ability = pool[
      deterministicRoll(`${seed}_catalyst_ability_pick`, pool.length)
    ];
    if (ability) {
      const mutatedAbility: CreatureAbility = { ...ability, source: "future" };
      next = {
        ...next,
        projectedAbilities: [...next.projectedAbilities, mutatedAbility].slice(0, 2),
      };
      abilityRollNotes.push(`${ability.name} appeared through Mutation Catalyst's +${MUTATION_CATALYST_ABILITY_MUTATION_BONUS}% new-ability check.`);
      geneticsNotes.push("Mutation Catalyst produced a new ability mutation.");
      lineageTraits.push("Catalyzed Ability");
    }
  } else {
    geneticsNotes.push(`Mutation Catalyst's +${MUTATION_CATALYST_ABILITY_MUTATION_BONUS}% new-ability check did not trigger or no ability slot was open.`);
  }

  return {
    ...next,
    statRollNotes,
    abilityRollNotes,
    geneticsNotes,
    lineageTraits: Array.from(new Set(lineageTraits)),
  };
}

function replaceAttempt(save: GameSave, attempt: BreedingAttemptRecord): GameSave {
  if (!save.breeding) return save;
  return {
    ...save,
    breeding: {
      ...save.breeding,
      attempts: save.breeding.attempts.map((record) =>
        record.attemptId === attempt.attemptId ? attempt : record,
      ),
    },
  };
}

export function performBreedingAttempt(
  save: GameSave,
  giverId: string,
  receiverId: string,
): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const participants = recordsLifecycle.getBreedingParticipants(save);
  const giver = participants.find((participant) => participant.participantId === giverId);
  const receiver = participants.find((participant) => participant.participantId === receiverId);
  const fertilityStock = flagNumber(save.flags.breedingFertilityTonics);
  const fertilityArmed = isBreedingSupportItemArmed(save, "fertility_tonic");
  const stabilizerArmed = isBreedingSupportItemArmed(save, "trait_stabilizer");
  const catalystArmed = isBreedingSupportItemArmed(save, "mutation_catalyst");

  const result = recordsLifecycle.performBreedingAttempt(
    preparedFertilitySave(save),
    giverId,
    receiverId,
  );
  if (!result) return null;

  let attempt = result.attempt;
  let nextSave: GameSave = {
    ...result.save,
    flags: {
      ...result.save.flags,
      breedingFertilityTonics: fertilityStock,
      breedingFertilityTonicArmed: fertilityArmed ? 0 : getBreedingSupportItemActiveCount(save, "fertility_tonic"),
      breedingItemLifecycleEnabled: true,
    },
  };

  const pregnancy = attempt.pregnancyId
    ? (nextSave.pregnancies ?? []).find((record) => record.pregnancyId === attempt.pregnancyId)
    : null;
  if (!pregnancy || !giver || !receiver) {
    return { attempt, save: replaceAttempt(nextSave, attempt) };
  }

  let inheritance = pregnancy.inheritance;
  const applied: string[] = [];
  const seed = `${attempt.attemptId}_breeding_items`;
  if (stabilizerArmed) {
    inheritance = addAbilityInheritanceChance(
      reduceGradeDowngrades(
        raiseStabilityNote(inheritance),
        seed,
      ),
      giver,
      receiver,
      seed,
    );
    applied.push("Trait Stabilizer");
  }
  if (catalystArmed) {
    inheritance = applyMutationCatalyst(inheritance, seed);
    applied.push("Mutation Catalyst");
  }
  if (applied.length) {
    inheritance = applyGeneticsPowerCurve(
      nextSave,
      giver,
      receiver,
      inheritance,
      `${attempt.attemptId}_pregnancy`,
    );
    nextSave = {
      ...nextSave,
      pregnancies: (nextSave.pregnancies ?? []).map((record) =>
        record.pregnancyId === pregnancy.pregnancyId
          ? { ...record, inheritance }
          : record,
      ),
      flags: {
        ...nextSave.flags,
        traitStabilizerArmed: stabilizerArmed ? 0 : getBreedingSupportItemActiveCount(save, "trait_stabilizer"),
        mutationCatalystArmed: catalystArmed ? 0 : getBreedingSupportItemActiveCount(save, "mutation_catalyst"),
        breedingGeneticsItemsApplied: true,
      },
    };
    const itemText = ` ${applied.join(" and ")} applied to the successful conception.`;
    attempt = {
      ...attempt,
      resultText: `${attempt.resultText}${itemText}`,
      processText: `${attempt.processText}${itemText}`,
      outcomeFlavorText: `${attempt.outcomeFlavorText}${itemText}`,
    };
  }

  return {
    attempt,
    save: replaceAttempt(nextSave, attempt),
  };
}
