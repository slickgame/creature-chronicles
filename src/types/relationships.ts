import type { CreatureId } from "./ids";

export const CREATURE_RELATIONSHIP_VERSION = 1 as const;

export type CreatureRelationshipKind =
  | "unfamiliar"
  | "acquaintance"
  | "friend"
  | "close_friend"
  | "rival"
  | "strained"
  | "family"
  | "trusted_family";

export type CreatureRelationshipRecord = {
  version: typeof CREATURE_RELATIONSHIP_VERSION;
  relationshipId: string;
  creatureIds: [CreatureId, CreatureId];
  affinity: number;
  sharedEvents: number;
  positiveEvents: number;
  negativeEvents: number;
  family: boolean;
  firstRecordedDayNumber: number;
  lastUpdatedDayNumber: number;
};

export type CreatureRelationshipSaveState = {
  version: typeof CREATURE_RELATIONSHIP_VERSION;
  recordsByRelationshipId: Record<string, CreatureRelationshipRecord>;
  appliedEventKeys: string[];
};

export type CreatureRelationshipEvent = {
  eventKey: string;
  creatureIds: [CreatureId, CreatureId];
  dayNumber: number;
  affinityDelta: number;
  family?: boolean;
};
