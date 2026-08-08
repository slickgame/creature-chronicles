import type { CreatureId } from "./ids";
import type { RanchJobId } from "./ranchJobs";

export const CREATURE_PERSONALITY_VERSION = 1 as const;

export type CreaturePersonalityArchetype =
  | "brave"
  | "gentle"
  | "curious"
  | "industrious"
  | "playful"
  | "aloof"
  | "ambitious"
  | "protective";

export type CreatureSocialStyle =
  | "outgoing"
  | "reserved"
  | "supportive"
  | "competitive"
  | "independent";

export type CreaturePersonalityProfile = {
  version: typeof CREATURE_PERSONALITY_VERSION;
  creatureId: CreatureId;
  archetype: CreaturePersonalityArchetype;
  displayName: string;
  description: string;
  socialStyle: CreatureSocialStyle;
  preferredJobIds: RanchJobId[];
  dislikedJobId?: RanchJobId;
  preferredTrainingTags: string[];
  preferredGuildCategories: string[];
  values: string[];
  likes: string[];
  dislikes: string[];
};

export type CreaturePersonalitySaveState = {
  version: typeof CREATURE_PERSONALITY_VERSION;
  profilesByCreatureId: Record<string, CreaturePersonalityProfile>;
};
