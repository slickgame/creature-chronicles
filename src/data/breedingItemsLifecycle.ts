import * as recordsLifecycle from "./breedingRecordsLifecycle";
import {
  STAT_KEYS,
  getSpeciesDefinition,
  getVariantDefinition,
} from "./creatures";
import { applyGeneticsPowerCurve } from "./geneticsBalance";
import {
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
    notes.push("Fertility Tonic armed: +12% pregnancy chance on the next valid attempt; consumed whether the attempt succeeds or fails.");
  }
  if (isBreedingSupportItemArmed(save, "trait_stabilizer")) {
    notes.push("Trait Stabilizer armed: the next successful conception prevents inherited grade downgrades and guarantees one parent ability when a parent ability is available.");
  }
  if (isBreedingSupportItemArmed(save, "mutation_catalyst")) {
    notes.push("Mutation Catalyst armed: the next successful conception gains one +1 beneficial stat mutation and a 30% new-ability mutation check when an ability slot is open.");
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

function preventGradeDowngrades(inheritance: InheritancePreview): InheritancePreview {
  const grades = { ...inheritance.projectedStatGrades };
  const stabilizedNotes: string[] = [];
  const statRollNotes = inheritance.statRollNotes.map((note) => {
    const match = note.match(/^(STR|DEX|STA|CHA|WIL|FER) inherited (D|C|B|A|S) but shifted down to (D|C|B|A|S)\./i);
    if (!match) return note;
    const statKey = match[1].toUpperCase() as CreatureStatKey;
    const inheritedGrade = match[2].toUpperCase() as StatGrade;
    if (gradeIndex(inheritedGrade) > gradeIndex(grades[statKey])) {
      grades[statKey] = inheritedGrade;
    }
    stabilizedNotes.push(`${statKey} grade downgrade was prevented by Trait Stabilizer.`);
    return `${statKey} retained inherited grade ${inheritedGrade}; Trait Stabilizer prevented the downgrade.`;
  });
  return {
    ...inheritance,
    projectedStatGrades: grades,
    statRollNotes,
    geneticsNotes: [
      ...(inheritance.geneticsNotes ?? []),
      stabilizedNotes.length
        ? `Trait Stabilizer prevented ${stabilizedNotes.length} inherited grade downgrade${stabilizedNotes.length === 1 ? "" : "s"}.`
        : "Trait Stabilizer found no grade downgrade to prevent in this conception.",
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

function guaranteeParentAbility(
  inheritance: InheritancePreview,
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  seed: string,
): InheritancePreview {
  if (inheritance.projectedAbilities.length) return inheritance;
  const ability = strongestParentAbility(giver, receiver, seed);
  if (!ability) {
    return {
      ...inheritance,
      geneticsNotes: [
        ...(inheritance.geneticsNotes ?? []),
        "Trait Stabilizer could not guarantee a parent ability because neither parent supplied one.",
      ],
    };
  }
  return {
    ...inheritance,
    projectedAbilities: [{ ...ability }],
    abilityRollNotes: [
      ...inheritance.abilityRollNotes,
      `${ability.name} (${ability.grade}) was stabilized from the parent ability pool.`,
    ],
    geneticsNotes: [
      ...(inheritance.geneticsNotes ?? []),
      "Trait Stabilizer guaranteed one parent ability because the normal inheritance roll produced none.",
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
  const statKey = STAT_KEYS[
    deterministicRoll(`${seed}_catalyst_stat`, STAT_KEYS.length)
  ] as CreatureStatKey;
  const stats = {
    ...inheritance.projectedStats,
    [statKey]: inheritance.projectedStats[statKey] + 1,
  };
  let abilities = [...inheritance.projectedAbilities];
  const abilityNotes = [...inheritance.abilityRollNotes];
  const geneticsNotes = [
    ...(inheritance.geneticsNotes ?? []),
    `Mutation Catalyst guaranteed a +1 beneficial mutation to ${statKey}.`,
  ];

  if (
    abilities.length < 2 &&
    deterministicRoll(`${seed}_catalyst_ability_roll`, 100) < 30
  ) {
    const pool = mutationAbilityPool(inheritance);
    const ability = pool[
      deterministicRoll(`${seed}_catalyst_ability_pick`, pool.length)
    ];
    if (ability) {
      abilities = [...abilities, { ...ability, source: "future" }].slice(0, 2);
      abilityNotes.push(
        `${ability.name} appeared through the Mutation Catalyst's 30% new-ability mutation check.`,
      );
      geneticsNotes.push("Mutation Catalyst also produced a new ability mutation.");
    }
  }

  return {
    ...inheritance,
    projectedStats: stats,
    projectedAbilities: abilities,
    statRollNotes: [
      ...inheritance.statRollNotes,
      `${statKey} received a rare +1 beneficial mutation from Mutation Catalyst.`,
    ],
    abilityRollNotes: abilityNotes,
    geneticsNotes,
    lineageTraits: Array.from(new Set([...inheritance.lineageTraits, "Catalyzed Mutation"])),
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
  const fertilityStock = getBreedingSupportItemActiveCount(save, "fertility_tonic") > 0
    ? Number(save.flags.breedingFertilityTonics ?? 0)
    : Number(save.flags.breedingFertilityTonics ?? 0);
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
      breedingFertilityTonics: Math.max(0, fertilityStock),
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
    inheritance = guaranteeParentAbility(
      preventGradeDowngrades(inheritance),
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
