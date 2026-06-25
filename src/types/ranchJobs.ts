import type { CreatureFamily } from "./creature";
import type { CreatureId, VariantId } from "./ids";

export type RanchJobId = "security_patrol" | "comfort_care" | "stable_production" | "garden_tending" | "field_hauling";

export type RanchJobAssignment = {
  jobId: RanchJobId;
  creatureId: CreatureId | null;
};

export type RanchJobsState = {
  assignments: Record<RanchJobId, CreatureId | null>;
  lastProcessedDayNumber: number;
  lifetimeCompletions: number;
};

export type RanchJobDefinition = {
  jobId: RanchJobId;
  name: string;
  shortName: string;
  description: string;
  iconPath: string;
  preferredFamilies: CreatureFamily[];
  preferredVariants?: VariantId[];
  energyCost: number;
  baseGoldReward: number;
  baseGuildPointReward: number;
  affectionReward: number;
  rewardLabel: string;
};

export type RanchJobResult = {
  jobId: RanchJobId;
  jobName: string;
  creatureId: CreatureId;
  creatureName: string;
  goldReward: number;
  guildPointReward: number;
  affectionReward: number;
  energyCost: number;
  message: string;
};

export type RanchJobAssignmentResult = {
  save: import("./save").GameSave;
  ok: boolean;
  message: string;
};
