import * as lifecycle from "./nurseryLifecycle";
import type { CreatureRecord } from "@/types/creature";
import type { EggId } from "@/types/ids";
import type { EggRecord, GameSave, PregnancyRecord } from "@/types/save";

export * from "./nurseryLifecycle";

function findPregnancyForEgg(
  pregnancies: PregnancyRecord[],
  egg: EggRecord,
): PregnancyRecord | null {
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
): GameSave {
  return {
    ...save,
    creatures: (save.creatures ?? []).map((existing) =>
      existing.creatureId === creature.creatureId ? creature : existing,
    ),
    birthHistory: (save.birthHistory ?? []).map((record) =>
      record.creatureId === creature.creatureId
        ? { ...record, shiny: creature.shiny }
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
  const creature: CreatureRecord = {
    ...result.creature,
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
      ...(shiny ? ["Rare shiny offspring."] : []),
    ]
      .filter(Boolean)
      .join(" "),
  };
  const updatedSave = replaceHatchedCreature(result.save, creature);

  return {
    creature,
    save: {
      ...updatedSave,
      flags: {
        ...updatedSave.flags,
        strategicOffspringHatched: true,
        lastHatchWasShiny: shiny,
      },
    },
  };
}
