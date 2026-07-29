import * as lifecycle from "./nurseryGeneticsLifecycle";
import { buildBredCreatureStartingMoveLoadout } from "@/data/battleLoadouts";
import { getBattleMove } from "@/data/battleMoves";
import type { CreatureRecord } from "@/types/creature";
import type { EggId } from "@/types/ids";
import type { EggRecord, GameSave, PregnancyRecord } from "@/types/save";

export * from "./nurseryGeneticsLifecycle";

function findPregnancyForEgg(
  pregnancies: readonly PregnancyRecord[],
  egg: EggRecord,
): PregnancyRecord | null {
  if (egg.sourcePregnancyId) {
    const linked = pregnancies.find(
      (pregnancy) => pregnancy.pregnancyId === egg.sourcePregnancyId,
    );
    if (linked) return linked;
  }
  return pregnancies.find((pregnancy) =>
    String(egg.eggId).includes(String(pregnancy.pregnancyId)),
  ) ?? null;
}

function persistNewEggMoveInheritance(
  previousSave: GameSave,
  nextSave: GameSave,
): GameSave {
  const previousEggIds = new Set((previousSave.eggs ?? []).map((egg) => egg.eggId));
  const pregnancies = nextSave.pregnancies ?? [];
  let changed = false;
  const eggs = (nextSave.eggs ?? []).map((egg) => {
    if (previousEggIds.has(egg.eggId) || egg.battleMoveInheritance) return egg;
    const pregnancy = findPregnancyForEgg(pregnancies, egg);
    const battleMoveInheritance = pregnancy?.inheritance.battleMoveInheritance;
    if (!battleMoveInheritance) return egg;
    changed = true;
    return {
      ...egg,
      battleMoveInheritance,
      geneticsNotes: Array.from(new Set([
        ...(egg.geneticsNotes ?? []),
        ...battleMoveInheritance.notes,
      ])),
    };
  });

  if (!changed) return nextSave;
  return {
    ...nextSave,
    eggs,
    flags: {
      ...nextSave.flags,
      eggMoveInheritancePersisted: true,
      battleMoveInheritanceEnabled: true,
    },
  };
}

export function advanceNurseryDay(save: GameSave): {
  save: GameSave;
  summaryItems: string[];
} {
  const result = lifecycle.advanceNurseryDay(save);
  const nextSave = persistNewEggMoveInheritance(save, result.save);
  const newMoveEggs = (nextSave.eggs ?? []).filter((egg) =>
    !(save.eggs ?? []).some((previousEgg) => previousEgg.eggId === egg.eggId)
      && Boolean(egg.battleMoveInheritance),
  );
  return {
    save: nextSave,
    summaryItems: [
      ...result.summaryItems,
      ...newMoveEggs.map((egg) => {
        const inherited = [
          ...(egg.battleMoveInheritance?.combinationMoveIds ?? []),
          ...(egg.battleMoveInheritance?.directInheritedMoveIds ?? []),
        ];
        return inherited.length
          ? `The delivered egg preserves ${inherited.map((moveId) => getBattleMove(moveId).name).join(", ")} in its move lineage.`
          : "The delivered egg preserves a complete native starting move library.";
      }),
    ],
  };
}

function replaceCreature(save: GameSave, creature: CreatureRecord): GameSave {
  return {
    ...save,
    creatures: (save.creatures ?? []).map((record) =>
      record.creatureId === creature.creatureId ? creature : record,
    ),
  };
}

export function hatchEgg(
  save: GameSave,
  eggId: EggId,
  nickname?: string,
): ReturnType<typeof lifecycle.hatchEgg> {
  const egg = (save.eggs ?? []).find((record) => record.eggId === eggId);
  const result = lifecycle.hatchEgg(save, eggId, nickname);
  if (!result || !egg) return result;

  const inheritance = egg.battleMoveInheritance;
  const battleMoveLoadout = inheritance?.projectedLoadout
    ?? buildBredCreatureStartingMoveLoadout(egg.speciesId, []);
  const inheritedMoveIds = [
    ...(inheritance?.combinationMoveIds ?? []),
    ...(inheritance?.directInheritedMoveIds ?? []),
  ];
  const inheritedNames = inheritedMoveIds.map((moveId) => getBattleMove(moveId).name);
  const moveNote = inheritedNames.length
    ? `Inherited battle techniques: ${inheritedNames.join(", ")}.`
    : "No additional parent technique inherited; native battle training supplied the starting move library.";
  const creature: CreatureRecord = {
    ...result.creature,
    battleMoveLoadout: {
      learnedMoveIds: [...battleMoveLoadout.learnedMoveIds],
      equippedMoveIds: [...battleMoveLoadout.equippedMoveIds],
      version: battleMoveLoadout.version,
    },
    lineage: result.creature.lineage
      ? {
          ...result.creature.lineage,
          notes: Array.from(new Set([...result.creature.lineage.notes, moveNote])),
          traits: Array.from(new Set([
            ...result.creature.lineage.traits,
            ...(inheritance?.combinationMoveIds.length ? ["Combination Move Lineage"] : []),
          ])),
        }
      : result.creature.lineage,
    notes: `${result.creature.notes} ${moveNote}`.trim(),
  };
  const updatedSave = replaceCreature(result.save, creature);
  const birthHistory = (updatedSave.birthHistory ?? []).map((birth) =>
    birth.creatureId === creature.creatureId
      ? {
          ...birth,
          inheritedMoveIds: [...inheritedMoveIds],
          combinationMoveIds: [...(inheritance?.combinationMoveIds ?? [])],
          startingBattleMoveLoadout: {
            learnedMoveIds: [...battleMoveLoadout.learnedMoveIds],
            equippedMoveIds: [...battleMoveLoadout.equippedMoveIds],
            version: battleMoveLoadout.version,
          },
        }
      : birth,
  );

  return {
    creature,
    save: {
      ...updatedSave,
      birthHistory,
      flags: {
        ...updatedSave.flags,
        hatchedMoveInheritanceApplied: true,
        battleMoveInheritanceEnabled: true,
        lastHatchInheritedMoveCount: inheritedMoveIds.length,
        lastHatchCombinationMoveCount: inheritance?.combinationMoveIds.length ?? 0,
      },
    },
  };
}
