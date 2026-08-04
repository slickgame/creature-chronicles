import type { CreatureId } from "@/types/ids";
import {
  CREATURE_RELATIONSHIP_VERSION,
  type CreatureRelationshipEvent,
  type CreatureRelationshipKind,
  type CreatureRelationshipRecord,
  type CreatureRelationshipSaveState,
} from "@/types/relationships";
import type { GameSave } from "@/types/save";

const MAX_RELATIONSHIP_EVENT_KEYS = 3000;
const FAMILY_SEED_AFFINITY = 35;

function clampAffinity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-100, Math.min(100, Math.round(value)));
}

function nonNegative(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

export function getRelationshipId(leftId: CreatureId, rightId: CreatureId): string {
  return [String(leftId), String(rightId)].sort().join("::");
}

function canonicalPair(leftId: CreatureId, rightId: CreatureId): [CreatureId, CreatureId] {
  return String(leftId).localeCompare(String(rightId)) <= 0
    ? [leftId, rightId]
    : [rightId, leftId];
}

export function createEmptyCreatureRelationshipState(): CreatureRelationshipSaveState {
  return {
    version: CREATURE_RELATIONSHIP_VERSION,
    recordsByRelationshipId: {},
    appliedEventKeys: [],
  };
}

export function createCreatureRelationshipRecord(
  leftId: CreatureId,
  rightId: CreatureId,
  dayNumber: number,
): CreatureRelationshipRecord {
  const creatureIds = canonicalPair(leftId, rightId);
  const safeDay = Math.max(1, nonNegative(dayNumber));
  return {
    version: CREATURE_RELATIONSHIP_VERSION,
    relationshipId: getRelationshipId(leftId, rightId),
    creatureIds,
    affinity: 0,
    sharedEvents: 0,
    positiveEvents: 0,
    negativeEvents: 0,
    family: false,
    firstRecordedDayNumber: safeDay,
    lastUpdatedDayNumber: safeDay,
  };
}

function normalizeRecord(
  leftId: CreatureId,
  rightId: CreatureId,
  candidate: Partial<CreatureRelationshipRecord> | undefined,
  dayNumber: number,
): CreatureRelationshipRecord {
  const empty = createCreatureRelationshipRecord(leftId, rightId, dayNumber);
  if (!candidate) return empty;
  return {
    ...empty,
    ...candidate,
    version: CREATURE_RELATIONSHIP_VERSION,
    relationshipId: empty.relationshipId,
    creatureIds: empty.creatureIds,
    affinity: clampAffinity(candidate.affinity ?? 0),
    sharedEvents: nonNegative(candidate.sharedEvents),
    positiveEvents: nonNegative(candidate.positiveEvents),
    negativeEvents: nonNegative(candidate.negativeEvents),
    family: Boolean(candidate.family),
    firstRecordedDayNumber: Math.max(1, nonNegative(candidate.firstRecordedDayNumber ?? dayNumber)),
    lastUpdatedDayNumber: Math.max(1, nonNegative(candidate.lastUpdatedDayNumber ?? dayNumber)),
  };
}

export function getCreatureRelationshipState(save: GameSave): CreatureRelationshipSaveState {
  const candidate = save.creatureRelationships;
  if (!candidate || typeof candidate !== "object") return createEmptyCreatureRelationshipState();
  return {
    version: CREATURE_RELATIONSHIP_VERSION,
    recordsByRelationshipId:
      candidate.recordsByRelationshipId && typeof candidate.recordsByRelationshipId === "object"
        ? candidate.recordsByRelationshipId
        : {},
    appliedEventKeys: Array.isArray(candidate.appliedEventKeys)
      ? candidate.appliedEventKeys.filter((key): key is string => typeof key === "string")
      : [],
  };
}

export function getCreatureRelationship(
  save: GameSave,
  leftId: CreatureId,
  rightId: CreatureId,
): CreatureRelationshipRecord {
  const state = getCreatureRelationshipState(save);
  return normalizeRecord(
    leftId,
    rightId,
    state.recordsByRelationshipId[getRelationshipId(leftId, rightId)],
    save.dayState?.dayNumber ?? 1,
  );
}

export function recordCreatureRelationshipEvent(
  save: GameSave,
  event: CreatureRelationshipEvent,
): GameSave {
  const [leftId, rightId] = event.creatureIds;
  if (leftId === rightId) return save;
  const state = getCreatureRelationshipState(save);
  if (state.appliedEventKeys.includes(event.eventKey)) return save;
  const current = getCreatureRelationship(save, leftId, rightId);
  const delta = Math.max(-20, Math.min(20, Math.round(event.affinityDelta)));
  const next: CreatureRelationshipRecord = {
    ...current,
    affinity: clampAffinity(current.affinity + delta),
    sharedEvents: current.sharedEvents + 1,
    positiveEvents: current.positiveEvents + (delta > 0 ? 1 : 0),
    negativeEvents: current.negativeEvents + (delta < 0 ? 1 : 0),
    family: current.family || Boolean(event.family),
    lastUpdatedDayNumber: Math.max(current.lastUpdatedDayNumber, event.dayNumber),
  };
  return {
    ...save,
    creatureRelationships: {
      version: CREATURE_RELATIONSHIP_VERSION,
      recordsByRelationshipId: {
        ...state.recordsByRelationshipId,
        [next.relationshipId]: next,
      },
      appliedEventKeys: [...state.appliedEventKeys, event.eventKey].slice(-MAX_RELATIONSHIP_EVENT_KEYS),
    },
  };
}

export function getCreatureRelationshipKind(
  record: CreatureRelationshipRecord,
): CreatureRelationshipKind {
  if (record.family && record.affinity >= 65) return "trusted_family";
  if (record.family) return "family";
  if (record.affinity >= 70) return "close_friend";
  if (record.affinity >= 30) return "friend";
  if (record.affinity <= -45) return "rival";
  if (record.affinity <= -15) return "strained";
  if (record.sharedEvents > 0) return "acquaintance";
  return "unfamiliar";
}

export function getCreatureRelationshipLabel(record: CreatureRelationshipRecord): string {
  const kind = getCreatureRelationshipKind(record);
  if (kind === "trusted_family") return "Trusted Family";
  if (kind === "family") return "Family";
  if (kind === "close_friend") return "Close Friend";
  if (kind === "friend") return "Friend";
  if (kind === "rival") return "Rival";
  if (kind === "strained") return "Strained";
  if (kind === "acquaintance") return "Acquaintance";
  return "Unfamiliar";
}

export function getRelationshipsForCreature(
  save: GameSave,
  creatureId: CreatureId,
): CreatureRelationshipRecord[] {
  return Object.values(getCreatureRelationshipState(save).recordsByRelationshipId)
    .filter((record) => record.creatureIds.includes(creatureId))
    .map((record) => normalizeRecord(
      record.creatureIds[0],
      record.creatureIds[1],
      record,
      save.dayState?.dayNumber ?? 1,
    ))
    .sort((left, right) => {
      if (left.family !== right.family) return left.family ? -1 : 1;
      if (left.affinity !== right.affinity) return right.affinity - left.affinity;
      return right.sharedEvents - left.sharedEvents;
    });
}

/**
 * Birth history is authoritative legacy data rather than a normal social event.
 * It therefore establishes the complete family baseline directly instead of
 * routing through the ordinary +/-20 event clamp. One migration marker and one
 * positive shared event are retained for stable reporting and idempotency.
 */
function seedFamilyRelationship(
  save: GameSave,
  childId: CreatureId,
  parentId: CreatureId,
  dayNumber: number,
  sourceKey: string,
): GameSave {
  if (childId === parentId) return save;
  const state = getCreatureRelationshipState(save);
  if (state.appliedEventKeys.includes(sourceKey)) return save;
  const current = getCreatureRelationship(save, childId, parentId);
  const next: CreatureRelationshipRecord = {
    ...current,
    affinity: Math.max(current.affinity, FAMILY_SEED_AFFINITY),
    sharedEvents: Math.max(1, current.sharedEvents),
    positiveEvents: Math.max(1, current.positiveEvents),
    family: true,
    lastUpdatedDayNumber: Math.max(current.lastUpdatedDayNumber, dayNumber),
  };
  return {
    ...save,
    creatureRelationships: {
      version: CREATURE_RELATIONSHIP_VERSION,
      recordsByRelationshipId: {
        ...state.recordsByRelationshipId,
        [next.relationshipId]: next,
      },
      appliedEventKeys: [...state.appliedEventKeys, sourceKey].slice(-MAX_RELATIONSHIP_EVENT_KEYS),
    },
  };
}

export function normalizeCreatureRelationshipSave(save: GameSave): GameSave {
  let normalized: GameSave = {
    ...save,
    creatureRelationships: getCreatureRelationshipState(save),
  };
  for (const birth of save.birthHistory ?? []) {
    for (const parent of [birth.parents.giver, birth.parents.receiver]) {
      if (!parent.creatureId) continue;
      normalized = seedFamilyRelationship(
        normalized,
        birth.creatureId,
        parent.creatureId,
        birth.hatchedAtDayNumber,
        `family-seed:${String(birth.birthId)}:${String(parent.creatureId)}`,
      );
    }
  }
  const relationshipState = getCreatureRelationshipState(normalized);
  return {
    ...normalized,
    creatureRelationships: {
      ...relationshipState,
      appliedEventKeys: relationshipState.appliedEventKeys.slice(-MAX_RELATIONSHIP_EVENT_KEYS),
    },
    flags: {
      ...normalized.flags,
      creatureRelationshipVersion: CREATURE_RELATIONSHIP_VERSION,
      creatureRelationshipsMigrated: true,
    },
  };
}
