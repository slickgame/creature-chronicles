export type DomesticChoreSkillId =
  | "cooking"
  | "cleaning"
  | "crafting"
  | "caregiving"
  | "hospitality";

export type RanchChoreSkillId =
  | "security"
  | "harvesting"
  | "production"
  | "hauling"
  | "ranch_care";

export type ChoreSkillId = DomesticChoreSkillId | RanchChoreSkillId;
export type ChoreSkillCategory = "domestic" | "ranch";

export type ChoreSkillDefinition = {
  skillId: ChoreSkillId;
  category: ChoreSkillCategory;
  label: string;
  shortLabel: string;
  description: string;
};

export type ChoreSkillProgress = {
  level: number;
  xp: number;
  xpToNext: number;
  lifetimeXp: number;
};

export type CreatureChoreSkills = Record<ChoreSkillId, ChoreSkillProgress>;

export type ChoreSkillGainResult = {
  skillId: ChoreSkillId;
  skillLabel: string;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  levelUps: number;
  summary: string;
};