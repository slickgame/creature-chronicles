import type { CreatureRecord } from "./creature";
import type { CreatureId } from "./ids";

export const CREATURE_LEGACY_STATE_VERSION = 1 as const;

export type CreatureLegacyTitle =
  | "Rising Ranch Hand"
  | "Coliseum Veteran"
  | "Ranch Guardian"
  | "Master Caregiver"
  | "Guild Envoy"
  | "Dynasty Founder"
  | "Master Worker"
  | "Ranch Legend";

export type HeirloomCategory =
  | "combat"
  | "protection"
  | "caregiving"
  | "guild"
  | "work"
  | "dynasty"
  | "general";

export type CreatureHeirloom = {
  heirloomId: string;
  version: typeof CREATURE_LEGACY_STATE_VERSION;
  sourceCreatureId: CreatureId;
  sourceCreatureName: string;
  name: string;
  category: HeirloomCategory;
  description: string;
  legacyPrestigeValue: number;
  createdAtDayNumber: number;
  createdAt: string;
};

export type RetiredCreatureRecord = {
  retirementId: string;
  version: typeof CREATURE_LEGACY_STATE_VERSION;
  creatureId: CreatureId;
  creature: CreatureRecord;
  retiredAtDayNumber: number;
  retiredAt: string;
  legacyTitle: CreatureLegacyTitle;
  legacyScore: number;
  fulfilledAmbitions: number;
  strongestContribution: string;
  heirloomId: string;
  inductedIntoHall: boolean;
};

export type HallOfLegendsEntry = {
  hallEntryId: string;
  version: typeof CREATURE_LEGACY_STATE_VERSION;
  creatureId: CreatureId;
  creatureName: string;
  creature: CreatureRecord;
  legacyTitle: CreatureLegacyTitle;
  legacyScore: number;
  fulfilledAmbitions: number;
  strongestContribution: string;
  heirloomId: string;
  inductedAtDayNumber: number;
  inductedAt: string;
};

export type CreatureLegacyState = {
  version: typeof CREATURE_LEGACY_STATE_VERSION;
  retiredByCreatureId: Record<string, RetiredCreatureRecord>;
  heirloomsById: Record<string, CreatureHeirloom>;
  hallByCreatureId: Record<string, HallOfLegendsEntry>;
  processedEventKeys: string[];
};
