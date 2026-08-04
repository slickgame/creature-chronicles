import { recordCreatureBreedingCareer, recordCreatureWorkCareer } from "@/data/creatureCareerRecords";
import { recordBirthMemories } from "@/data/creatureMemoryEvents";
import { hatchEgg } from "@/data/nurseryLifecycle";
import { processRanchJobsForNewDay } from "@/data/ranchJobs";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, EggId } from "@/types/ids";
import type { RanchJobResult } from "@/types/ranchJobs";
import type { BirthRecord, GameSave } from "@/types/save";

export type CareerAwareHatchResult = {
  save: GameSave;
  creature: CreatureRecord;
};

function parseProducedResources(result: RanchJobResult): number {
  if (result.jobId !== "stable_production" && result.jobId !== "garden_tending" && result.jobId !== "field_hauling") {
    return 0;
  }

  const match = result.message.match(/\+(\d+)\s+(?:Feed|Materials)/i);
  return match ? Math.max(0, Number(match[1]) || 0) : 0;
}

/**
 * Applies lifetime work credit to each creature returned by the canonical ranch
 * job processor. The event key is tied to Ranch Day, job, and creature, making
 * this safe to repeat after autosave recovery.
 */
export function processRanchJobsWithCareers(save: GameSave): {
  save: GameSave;
  results: RanchJobResult[];
} {
  const processed = processRanchJobsForNewDay(save);
  let nextSave = processed.save;

  for (const result of processed.results) {
    nextSave = recordCreatureWorkCareer(nextSave, {
      eventKey: `ranch-job:${save.dayState.dayNumber}:${result.jobId}:${String(result.creatureId)}`,
      creatureId: result.creatureId,
      dayNumber: save.dayState.dayNumber,
      daysWorked: 1,
      resourcesProduced: parseProducedResources(result),
    });
  }

  return { save: nextSave, results: processed.results };
}

function getBirthForCreature(save: GameSave, creatureId: CreatureId): BirthRecord | null {
  return (
    (save.birthHistory ?? []).find((birth) => birth.creatureId === creatureId) ??
    null
  );
}

/**
 * Canonical hatch transaction for the Legacy stack. It preserves the existing
 * hatch result, writes narrative birth/parent memories, and credits each
 * creature parent with one offspring in the structured career record.
 */
export function hatchEggWithLegacyRecords(
  save: GameSave,
  eggId: EggId,
  nickname?: string,
): CareerAwareHatchResult | null {
  const result = hatchEgg(save, eggId, nickname);
  if (!result) return null;

  const birth = getBirthForCreature(result.save, result.creature.creatureId);
  if (!birth) return result;

  let nextSave = recordBirthMemories(result.save, birth);
  for (const parent of [birth.parents.giver, birth.parents.receiver]) {
    if (!parent.creatureId) continue;
    nextSave = recordCreatureBreedingCareer(nextSave, {
      eventKey: `offspring:${String(birth.birthId)}:${String(parent.creatureId)}`,
      creatureId: parent.creatureId,
      dayNumber: birth.hatchedAtDayNumber,
      role: "parent",
      offspringRarity: birth.rarity,
    });
  }

  return { save: nextSave, creature: result.creature };
}
