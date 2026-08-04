import type { CreatureId } from "./ids";

export const CREATURE_CAREER_VERSION = 1 as const;

export type CreatureCareerRecord = {
  version: typeof CREATURE_CAREER_VERSION;
  creatureId: CreatureId;
  firstRecordedDayNumber: number;
  lastUpdatedDayNumber: number;
  battlesEntered: number;
  victories: number;
  defeats: number;
  draws: number;
  damageDealt: number;
  healingDone: number;
  alliesProtected: number;
  knockouts: number;
  timesFainted: number;
  guildRequestsCompleted: number;
  featuredGuildRequestsCompleted: number;
  daysWorked: number;
  resourcesProduced: number;
  trainingSessionsCompleted: number;
  breedingAttempts: number;
  offspringCount: number;
  rareOffspringCount: number;
  epicOffspringCount: number;
  injuriesSuffered: number;
};

export type CreatureCareerSaveState = {
  version: typeof CREATURE_CAREER_VERSION;
  recordsByCreatureId: Record<string, CreatureCareerRecord>;
  appliedEventKeys: string[];
};

export type CreatureBattleCareerEvent = {
  eventKey: string;
  creatureId: CreatureId;
  dayNumber: number;
  outcome: "victory" | "draw" | "defeat";
  damageDealt?: number;
  healingDone?: number;
  alliesProtected?: number;
  knockouts?: number;
  fainted?: boolean;
};

export type CreatureGuildCareerEvent = {
  eventKey: string;
  creatureId: CreatureId;
  dayNumber: number;
  featured?: boolean;
};

export type CreatureWorkCareerEvent = {
  eventKey: string;
  creatureId: CreatureId;
  dayNumber: number;
  daysWorked?: number;
  resourcesProduced?: number;
};

export type CreatureTrainingCareerEvent = {
  eventKey: string;
  creatureId: CreatureId;
  dayNumber: number;
};

export type CreatureBreedingCareerEvent = {
  eventKey: string;
  creatureId: CreatureId;
  dayNumber: number;
  role: "attempt" | "parent";
  offspringRarity?: "Common" | "Uncommon" | "Rare" | "Epic";
};

export type CreatureInjuryCareerEvent = {
  eventKey: string;
  creatureId: CreatureId;
  dayNumber: number;
};
