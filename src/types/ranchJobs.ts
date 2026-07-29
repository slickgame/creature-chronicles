import type { CreatureFamily } from "./creature";
import type { ChoreSkillId } from "./choreSkills";
import type { CreatureId, VariantId } from "./ids";

export type RanchJobId = "security_patrol" | "comfort_care" | "stable_production" | "garden_tending" | "field_hauling";

export type RanchJobAssignment = {
  jobId: RanchJobId;
  creatureIds: CreatureId[];
};

export type RanchJobsState = {
  assignments: Record<RanchJobId, CreatureId[]>;
  lastProcessedDayNumber: number;
  lifetimeCompletions: number;
};

export type RanchJobDefinition = {
  jobId: RanchJobId;
  name: string;
  shortName: string;
  description: string;
  iconPath: string;
  /** Natural starting advantages only. Every species may perform every job. */
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
  skillId?: ChoreSkillId;
  skillXpGained?: number;
  skillLevelBefore?: number;
  skillLevelAfter?: number;
  message: string;
};

export type RanchJobAssignmentResult = {
  save: import("./save").GameSave;
  ok: boolean;
  message: string;
};