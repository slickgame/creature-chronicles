import {
  recordCreatureBattleCareer,
  recordCreatureBreedingCareer,
  recordCreatureGuildCareer,
  recordCreatureInjuryCareer,
  recordCreatureTrainingCareer,
  recordCreatureWorkCareer,
} from "@/data/creatureCareerRecords";
import { recordNewAmbitionMilestones } from "@/data/creatureAmbitionEvents";
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

export type CareerBattleParticipant = {
  creatureId: CreatureId;
  damageDealt?: number;
  healingDone?: number;
  alliesProtected?: number;
  knockouts?: number;
  fainted?: boolean;
};

function parseProducedResources(result: RanchJobResult): number {
  if (result.jobId !== "stable_production" && result.jobId !== "garden_tending" && result.jobId !== "field_hauling") return 0;
  const match = result.message.match(/\+(\d+)\s+(?:Feed|Materials)/i);
  return match ? Math.max(0, Number(match[1]) || 0) : 0;
}

export function processRanchJobsWithCareers(save: GameSave): {
  save: GameSave;
  results: RanchJobResult[];
} {
  const processed = processRanchJobsForNewDay(save);
  let nextSave = processed.save;
  const participantIds: CreatureId[] = [];
  for (const result of processed.results) {
    participantIds.push(result.creatureId);
    nextSave = recordCreatureWorkCareer(nextSave, {
      eventKey: `ranch-job:${save.dayState.dayNumber}:${result.jobId}:${String(result.creatureId)}`,
      creatureId: result.creatureId,
      dayNumber: save.dayState.dayNumber,
      daysWorked: 1,
      resourcesProduced: parseProducedResources(result),
    });
  }
  return {
    save: recordNewAmbitionMilestones(save, nextSave, participantIds, save.dayState.dayNumber),
    results: processed.results,
  };
}

function getBirthForCreature(save: GameSave, creatureId: CreatureId): BirthRecord | null {
  return (save.birthHistory ?? []).find((birth) => birth.creatureId === creatureId) ?? null;
}

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
  const parentIds: CreatureId[] = [];
  for (const parent of [birth.parents.giver, birth.parents.receiver]) {
    if (!parent.creatureId) continue;
    parentIds.push(parent.creatureId);
    nextSave = recordCreatureBreedingCareer(nextSave, {
      eventKey: `offspring:${String(birth.birthId)}:${String(parent.creatureId)}`,
      creatureId: parent.creatureId,
      dayNumber: birth.hatchedAtDayNumber,
      role: "parent",
      offspringRarity: birth.rarity,
    });
  }
  return {
    save: recordNewAmbitionMilestones(save, nextSave, parentIds, birth.hatchedAtDayNumber),
    creature: result.creature,
  };
}

export function applyBattleCareerResults(
  save: GameSave,
  input: {
    battleId: string;
    outcome: "victory" | "draw" | "defeat";
    dayNumber: number;
    participants: CareerBattleParticipant[];
  },
): GameSave {
  const nextSave = input.participants.reduce(
    (next, participant) => recordCreatureBattleCareer(next, {
      eventKey: `battle:${input.battleId}:${String(participant.creatureId)}`,
      creatureId: participant.creatureId,
      dayNumber: input.dayNumber,
      outcome: input.outcome,
      damageDealt: participant.damageDealt,
      healingDone: participant.healingDone,
      alliesProtected: participant.alliesProtected,
      knockouts: participant.knockouts,
      fainted: participant.fainted,
    }),
    save,
  );
  return recordNewAmbitionMilestones(
    save,
    nextSave,
    input.participants.map((participant) => participant.creatureId),
    input.dayNumber,
  );
}

export function applyGuildCareerCompletion(
  save: GameSave,
  input: { requestId: string; dayNumber: number; participantIds: CreatureId[]; featured?: boolean },
): GameSave {
  const nextSave = input.participantIds.reduce(
    (next, creatureId) => recordCreatureGuildCareer(next, {
      eventKey: `guild:${input.requestId}:${String(creatureId)}`,
      creatureId,
      dayNumber: input.dayNumber,
      featured: input.featured,
    }),
    save,
  );
  return recordNewAmbitionMilestones(save, nextSave, input.participantIds, input.dayNumber);
}

export function applyTrainingCareerCompletion(
  save: GameSave,
  input: { assignmentId: string; creatureId: CreatureId; dayNumber: number },
): GameSave {
  const nextSave = recordCreatureTrainingCareer(save, {
    eventKey: `training:${input.assignmentId}:${String(input.creatureId)}`,
    creatureId: input.creatureId,
    dayNumber: input.dayNumber,
  });
  return recordNewAmbitionMilestones(save, nextSave, [input.creatureId], input.dayNumber);
}

export function applyBreedingAttemptCareer(
  save: GameSave,
  input: { attemptId: string; dayNumber: number; parentCreatureIds: CreatureId[] },
): GameSave {
  const nextSave = input.parentCreatureIds.reduce(
    (next, creatureId) => recordCreatureBreedingCareer(next, {
      eventKey: `breeding-attempt:${input.attemptId}:${String(creatureId)}`,
      creatureId,
      dayNumber: input.dayNumber,
      role: "attempt",
    }),
    save,
  );
  return recordNewAmbitionMilestones(save, nextSave, input.parentCreatureIds, input.dayNumber);
}

export function applyInjuryCareerEvent(
  save: GameSave,
  input: { injuryId: string; creatureId: CreatureId; dayNumber: number },
): GameSave {
  const nextSave = recordCreatureInjuryCareer(save, {
    eventKey: `injury:${input.injuryId}:${String(input.creatureId)}`,
    creatureId: input.creatureId,
    dayNumber: input.dayNumber,
  });
  return recordNewAmbitionMilestones(save, nextSave, [input.creatureId], input.dayNumber);
}
