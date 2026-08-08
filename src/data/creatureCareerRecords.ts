import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import {
  CREATURE_CAREER_VERSION,
  type CreatureBattleCareerEvent,
  type CreatureBreedingCareerEvent,
  type CreatureCareerRecord,
  type CreatureCareerSaveState,
  type CreatureGuildCareerEvent,
  type CreatureInjuryCareerEvent,
  type CreatureTrainingCareerEvent,
  type CreatureWorkCareerEvent,
} from "@/types/career";

const MAX_APPLIED_EVENT_KEYS = 2500;

function nonNegative(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

export function createEmptyCreatureCareerRecord(
  creatureId: CreatureId,
  dayNumber: number,
): CreatureCareerRecord {
  const safeDay = Math.max(1, nonNegative(dayNumber));
  return {
    version: CREATURE_CAREER_VERSION,
    creatureId,
    firstRecordedDayNumber: safeDay,
    lastUpdatedDayNumber: safeDay,
    battlesEntered: 0,
    victories: 0,
    defeats: 0,
    draws: 0,
    damageDealt: 0,
    healingDone: 0,
    alliesProtected: 0,
    knockouts: 0,
    timesFainted: 0,
    guildRequestsCompleted: 0,
    featuredGuildRequestsCompleted: 0,
    daysWorked: 0,
    resourcesProduced: 0,
    trainingSessionsCompleted: 0,
    breedingAttempts: 0,
    offspringCount: 0,
    rareOffspringCount: 0,
    epicOffspringCount: 0,
    injuriesSuffered: 0,
  };
}

export function createEmptyCreatureCareerState(): CreatureCareerSaveState {
  return {
    version: CREATURE_CAREER_VERSION,
    recordsByCreatureId: {},
    appliedEventKeys: [],
  };
}

function normalizeRecord(
  creatureId: CreatureId,
  candidate: Partial<CreatureCareerRecord> | undefined,
  dayNumber: number,
): CreatureCareerRecord {
  const empty = createEmptyCreatureCareerRecord(creatureId, dayNumber);
  if (!candidate) return empty;
  return {
    ...empty,
    ...candidate,
    version: CREATURE_CAREER_VERSION,
    creatureId,
    firstRecordedDayNumber: Math.max(
      1,
      nonNegative(candidate.firstRecordedDayNumber ?? empty.firstRecordedDayNumber),
    ),
    lastUpdatedDayNumber: Math.max(
      1,
      nonNegative(candidate.lastUpdatedDayNumber ?? empty.lastUpdatedDayNumber),
    ),
    battlesEntered: nonNegative(candidate.battlesEntered),
    victories: nonNegative(candidate.victories),
    defeats: nonNegative(candidate.defeats),
    draws: nonNegative(candidate.draws),
    damageDealt: nonNegative(candidate.damageDealt),
    healingDone: nonNegative(candidate.healingDone),
    alliesProtected: nonNegative(candidate.alliesProtected),
    knockouts: nonNegative(candidate.knockouts),
    timesFainted: nonNegative(candidate.timesFainted),
    guildRequestsCompleted: nonNegative(candidate.guildRequestsCompleted),
    featuredGuildRequestsCompleted: nonNegative(candidate.featuredGuildRequestsCompleted),
    daysWorked: nonNegative(candidate.daysWorked),
    resourcesProduced: nonNegative(candidate.resourcesProduced),
    trainingSessionsCompleted: nonNegative(candidate.trainingSessionsCompleted),
    breedingAttempts: nonNegative(candidate.breedingAttempts),
    offspringCount: nonNegative(candidate.offspringCount),
    rareOffspringCount: nonNegative(candidate.rareOffspringCount),
    epicOffspringCount: nonNegative(candidate.epicOffspringCount),
    injuriesSuffered: nonNegative(candidate.injuriesSuffered),
  };
}

export function getCreatureCareerState(save: GameSave): CreatureCareerSaveState {
  const candidate = save.creatureCareers;
  if (!candidate || typeof candidate !== "object") return createEmptyCreatureCareerState();
  return {
    version: CREATURE_CAREER_VERSION,
    recordsByCreatureId:
      candidate.recordsByCreatureId && typeof candidate.recordsByCreatureId === "object"
        ? candidate.recordsByCreatureId
        : {},
    appliedEventKeys: Array.isArray(candidate.appliedEventKeys)
      ? candidate.appliedEventKeys.filter((key): key is string => typeof key === "string")
      : [],
  };
}

export function getCreatureCareerRecord(
  save: GameSave,
  creatureId: CreatureId,
): CreatureCareerRecord {
  const state = getCreatureCareerState(save);
  return normalizeRecord(
    creatureId,
    state.recordsByCreatureId[String(creatureId)],
    save.dayState?.dayNumber ?? 1,
  );
}

function applyCareerEvent(
  save: GameSave,
  eventKey: string,
  creatureId: CreatureId,
  dayNumber: number,
  update: (record: CreatureCareerRecord) => CreatureCareerRecord,
): GameSave {
  const state = getCreatureCareerState(save);
  if (state.appliedEventKeys.includes(eventKey)) return save;

  const current = getCreatureCareerRecord(save, creatureId);
  const next = normalizeRecord(
    creatureId,
    update({ ...current, lastUpdatedDayNumber: Math.max(current.lastUpdatedDayNumber, dayNumber) }),
    dayNumber,
  );

  return {
    ...save,
    creatureCareers: {
      version: CREATURE_CAREER_VERSION,
      recordsByCreatureId: {
        ...state.recordsByCreatureId,
        [String(creatureId)]: next,
      },
      appliedEventKeys: [...state.appliedEventKeys, eventKey].slice(-MAX_APPLIED_EVENT_KEYS),
    },
  };
}

export function recordCreatureBattleCareer(
  save: GameSave,
  event: CreatureBattleCareerEvent,
): GameSave {
  return applyCareerEvent(save, event.eventKey, event.creatureId, event.dayNumber, (record) => ({
    ...record,
    battlesEntered: record.battlesEntered + 1,
    victories: record.victories + (event.outcome === "victory" ? 1 : 0),
    defeats: record.defeats + (event.outcome === "defeat" ? 1 : 0),
    draws: record.draws + (event.outcome === "draw" ? 1 : 0),
    damageDealt: record.damageDealt + nonNegative(event.damageDealt),
    healingDone: record.healingDone + nonNegative(event.healingDone),
    alliesProtected: record.alliesProtected + nonNegative(event.alliesProtected),
    knockouts: record.knockouts + nonNegative(event.knockouts),
    timesFainted: record.timesFainted + (event.fainted ? 1 : 0),
  }));
}

export function recordCreatureGuildCareer(
  save: GameSave,
  event: CreatureGuildCareerEvent,
): GameSave {
  return applyCareerEvent(save, event.eventKey, event.creatureId, event.dayNumber, (record) => ({
    ...record,
    guildRequestsCompleted: record.guildRequestsCompleted + 1,
    featuredGuildRequestsCompleted:
      record.featuredGuildRequestsCompleted + (event.featured ? 1 : 0),
  }));
}

export function recordCreatureWorkCareer(
  save: GameSave,
  event: CreatureWorkCareerEvent,
): GameSave {
  return applyCareerEvent(save, event.eventKey, event.creatureId, event.dayNumber, (record) => ({
    ...record,
    daysWorked: record.daysWorked + Math.max(1, nonNegative(event.daysWorked ?? 1)),
    resourcesProduced: record.resourcesProduced + nonNegative(event.resourcesProduced),
  }));
}

export function recordCreatureTrainingCareer(
  save: GameSave,
  event: CreatureTrainingCareerEvent,
): GameSave {
  return applyCareerEvent(save, event.eventKey, event.creatureId, event.dayNumber, (record) => ({
    ...record,
    trainingSessionsCompleted: record.trainingSessionsCompleted + 1,
  }));
}

export function recordCreatureBreedingCareer(
  save: GameSave,
  event: CreatureBreedingCareerEvent,
): GameSave {
  return applyCareerEvent(save, event.eventKey, event.creatureId, event.dayNumber, (record) => ({
    ...record,
    breedingAttempts: record.breedingAttempts + (event.role === "attempt" ? 1 : 0),
    offspringCount: record.offspringCount + (event.role === "parent" ? 1 : 0),
    rareOffspringCount:
      record.rareOffspringCount +
      (event.role === "parent" && event.offspringRarity === "Rare" ? 1 : 0),
    epicOffspringCount:
      record.epicOffspringCount +
      (event.role === "parent" && event.offspringRarity === "Epic" ? 1 : 0),
  }));
}

export function recordCreatureInjuryCareer(
  save: GameSave,
  event: CreatureInjuryCareerEvent,
): GameSave {
  return applyCareerEvent(save, event.eventKey, event.creatureId, event.dayNumber, (record) => ({
    ...record,
    injuriesSuffered: record.injuriesSuffered + 1,
  }));
}

function seedRecordFromExistingData(
  save: GameSave,
  creature: CreatureRecord,
): CreatureCareerRecord {
  const dayNumber = save.dayState?.dayNumber ?? 1;
  const record = normalizeRecord(
    creature.creatureId,
    getCreatureCareerState(save).recordsByCreatureId[String(creature.creatureId)],
    dayNumber,
  );
  const offspring = (save.birthHistory ?? []).filter((birth) =>
    [birth.parents.giver.creatureId, birth.parents.receiver.creatureId].includes(creature.creatureId),
  );
  return {
    ...record,
    offspringCount: Math.max(record.offspringCount, offspring.length),
    rareOffspringCount: Math.max(
      record.rareOffspringCount,
      offspring.filter((birth) => birth.rarity === "Rare").length,
    ),
    epicOffspringCount: Math.max(
      record.epicOffspringCount,
      offspring.filter((birth) => birth.rarity === "Epic").length,
    ),
  };
}

export function normalizeCreatureCareerSave(save: GameSave): GameSave {
  const state = getCreatureCareerState(save);
  const recordsByCreatureId = { ...state.recordsByCreatureId };
  for (const creature of save.creatures ?? []) {
    recordsByCreatureId[String(creature.creatureId)] = seedRecordFromExistingData(save, creature);
  }
  return {
    ...save,
    creatureCareers: {
      version: CREATURE_CAREER_VERSION,
      recordsByCreatureId,
      appliedEventKeys: state.appliedEventKeys.slice(-MAX_APPLIED_EVENT_KEYS),
    },
    flags: {
      ...save.flags,
      creatureCareerVersion: CREATURE_CAREER_VERSION,
      creatureCareersMigrated: true,
    },
  };
}
