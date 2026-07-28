import * as lifecycle from "./nurseryLifecycle";
import { getCorrectOffspringGeneration } from "./geneticsBalance";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, EggId } from "@/types/ids";
import type { EggRecord, GameSave, PregnancyRecord } from "@/types/save";

export * from "./nurseryLifecycle";

function findPregnancyForEgg(
  pregnancies: PregnancyRecord[],
  egg: EggRecord,
): PregnancyRecord | null {
  if (egg.sourcePregnancyId) {
    const linked = pregnancies.find(
      (pregnancy) => pregnancy.pregnancyId === egg.sourcePregnancyId,
    );
    if (linked) return linked;
  }
  return (
    pregnancies.find((pregnancy) =>
      String(egg.eggId).includes(String(pregnancy.pregnancyId)),
    ) ?? null
  );
}

function enrichNewEggsWithGenetics(
  previousSave: GameSave,
  nextSave: GameSave,
): GameSave {
  const previousEggIds = new Set(
    (previousSave.eggs ?? []).map((egg) => egg.eggId),
  );
  const pregnancies = nextSave.pregnancies ?? [];
  let changed = false;

  const eggs = (nextSave.eggs ?? []).map((egg) => {
    if (previousEggIds.has(egg.eggId)) return egg;

    const pregnancy = findPregnancyForEgg(pregnancies, egg);
    if (!pregnancy) return egg;

    const shiny = Boolean(pregnancy.inheritance.projectedShiny);
    const geneticsNotes = pregnancy.inheritance.geneticsNotes ?? [];
    const lineageTraits = Array.from(
      new Set([
        ...(egg.lineageTraits ?? []),
        ...(pregnancy.inheritance.lineageTraits ?? []),
        ...(shiny ? ["Shiny"] : []),
      ]),
    );
    const statRollNotes = Array.from(
      new Set([...(egg.statRollNotes ?? []), ...geneticsNotes]),
    );
    changed = true;

    return {
      ...egg,
      sourceAttemptId: pregnancy.sourceAttemptId,
      sourcePregnancyId: pregnancy.pregnancyId,
      parents: pregnancy.giver && pregnancy.receiver
        ? { giver: pregnancy.giver, receiver: pregnancy.receiver }
        : egg.parents,
      shiny,
      geneticsNotes,
      statRollNotes,
      lineageTraits,
    };
  });

  if (!changed) return nextSave;

  return {
    ...nextSave,
    eggs,
    eggIds: eggs.map((egg) => egg.eggId),
    flags: {
      ...nextSave.flags,
      strategicEggGeneticsPersisted: true,
      breedingLifecycleLinksEnabled: true,
    },
  };
}

export function advanceNurseryDay(save: GameSave): {
  save: GameSave;
  summaryItems: string[];
} {
  const result = lifecycle.advanceNurseryDay(save);
  const enrichedSave = enrichNewEggsWithGenetics(save, result.save);
  const newShinyEggs = (enrichedSave.eggs ?? []).filter(
    (egg) =>
      !(save.eggs ?? []).some((previousEgg) => previousEgg.eggId === egg.eggId) &&
      egg.shiny,
  ).length;

  return {
    save: enrichedSave,
    summaryItems: [
      ...result.summaryItems,
      ...(newShinyEggs
        ? [
            `${newShinyEggs} delivered egg${newShinyEggs === 1 ? " has" : "s have"} a rare shiny marker.`,
          ]
        : []),
    ],
  };
}

function replaceHatchedCreature(
  save: GameSave,
  creature: CreatureRecord,
  egg?: EggRecord,
): GameSave {
  return {
    ...save,
    creatures: (save.creatures ?? []).map((existing) =>
      existing.creatureId === creature.creatureId ? creature : existing,
    ),
    birthHistory: (save.birthHistory ?? []).map((record) =>
      record.creatureId === creature.creatureId
        ? {
            ...record,
            sourceAttemptId: egg?.sourceAttemptId ?? record.sourceAttemptId,
            sourcePregnancyId:
              egg?.sourcePregnancyId ?? record.sourcePregnancyId,
            shiny: creature.shiny,
          }
        : record,
    ),
  };
}

export function hatchEgg(
  save: GameSave,
  eggId: EggId,
  nickname?: string,
): ReturnType<typeof lifecycle.hatchEgg> {
  const egg = (save.eggs ?? []).find((item) => item.eggId === eggId);
  const result = lifecycle.hatchEgg(save, eggId, nickname);
  if (!result) return null;

  const shiny = Boolean(
    egg?.shiny || egg?.lineageTraits?.some((trait) => trait === "Shiny"),
  );
  const geneticsNotes = egg?.geneticsNotes ?? [];
  const parentCreatureIds = [
    egg?.parents.giver.creatureId,
    egg?.parents.receiver.creatureId,
  ].filter(Boolean) as CreatureId[];
  const generation = getCorrectOffspringGeneration(save, parentCreatureIds);
  const creature: CreatureRecord = {
    ...result.creature,
    generation,
    shiny,
    lineage: result.creature.lineage
      ? {
          ...result.creature.lineage,
          traits: Array.from(
            new Set([
              ...result.creature.lineage.traits,
              ...(shiny ? ["Shiny"] : []),
            ]),
          ),
          notes: [
            ...result.creature.lineage.notes,
            ...geneticsNotes,
          ],
        }
      : result.creature.lineage,
    notes: [
      result.creature.notes,
      ...geneticsNotes,
      `Generation ${generation} follows the highest tracked parent generation plus one.`,
      ...(shiny ? ["Rare shiny offspring."] : []),
    ]
      .filter(Boolean)
      .join(" "),
  };
  const updatedSave = replaceHatchedCreature(result.save, creature, egg);

  return {
    creature,
    save: {
      ...updatedSave,
      flags: {
        ...updatedSave.flags,
        strategicOffspringHatched: true,
        correctOffspringGenerationEnabled: true,
        lastHatchWasShiny: shiny,
        breedingLifecycleLinksEnabled: true,
      },
    },
  };
}
