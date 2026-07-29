import type { BattleStatKey, BattleStatusId } from "./battle";
import type { AbilityGrade, CreatureFamily, CreatureStatKey } from "./creature";
import type { RanchJobId } from "./ranchJobs";

export type TalentCategory =
  | "general"
  | "species"
  | "variant"
  | "combat"
  | "chore"
  | "role"
  | "breeding"
  | "recovery"
  | "economy"
  | "lineage";

export type TalentSystem =
  | "breeding"
  | "growth"
  | "inheritance"
  | "chore"
  | "battle"
  | "recovery"
  | "role-tags";

export type TalentTrigger =
  | "passive"
  | "breeding-preview"
  | "breeding-attempt"
  | "conception"
  | "inheritance-roll"
  | "level-growth"
  | "chore-score"
  | "chore-energy-cost"
  | "chore-complete"
  | "battle-stats"
  | "battle-start"
  | "before-action"
  | "after-action"
  | "before-damage"
  | "after-damage"
  | "on-heal"
  | "on-status"
  | "round-end"
  | "victory"
  | "daily-recovery";

export type TalentStackingRule =
  | "additive"
  | "multiplicative"
  | "highest-only"
  | "unique";

export type TalentEffectType =
  | "breeding-pregnancy-chance"
  | "breeding-energy-discount"
  | "breeding-creature-xp-flat"
  | "breeding-creature-xp-percent"
  | "breeding-breeder-xp-flat"
  | "breeding-affection-gain"
  | "growth-stat-bias"
  | "inheritance-stability"
  | "inheritance-ability-chance"
  | "inheritance-mutation-chance"
  | "chore-score"
  | "chore-energy-discount"
  | "chore-xp-percent"
  | "battle-stat-flat"
  | "battle-stat-percent"
  | "battle-damage-percent"
  | "battle-healing-percent"
  | "battle-start-status"
  | "recovery-energy-percent"
  | "recovery-affection"
  | "role-tag";

export type TalentEffect = {
  type: TalentEffectType;
  value: number;
  creatureStatKey?: CreatureStatKey;
  battleStatKey?: BattleStatKey;
  jobId?: RanchJobId;
  statusId?: BattleStatusId;
  roleTag?: string;
  note?: string;
};

export type TalentSourceRestriction = {
  family?: CreatureFamily;
  speciesId?: string;
  variantId?: string;
  requiredTags?: string[];
};

export type TalentDefinition = {
  id: string;
  name: string;
  category: TalentCategory;
  source: "general" | "species" | "variant" | "starter" | "future" | "combat" | "chore" | "role";
  tags: string[];
  systems: TalentSystem[];
  triggers: TalentTrigger[];
  stackingRule: TalentStackingRule;
  sourceRestrictions: TalentSourceRestriction[];
  gradeEffects: Record<AbilityGrade, TalentEffect[]>;
  exactDescriptionByGrade: Record<AbilityGrade, string>;
  definitionVersion: number;
};

export type ResolvedTalentEffect = TalentEffect & {
  talentId: string;
  talentName: string;
  grade: AbilityGrade;
  category: TalentCategory;
};

export type TalentAuditStatus =
  | "fully-implemented"
  | "partially-implemented"
  | "description-only"
  | "unknown-definition";

export type TalentAuditRecord = {
  talentId: string;
  name: string;
  status: TalentAuditStatus;
  category: TalentCategory;
  systems: TalentSystem[];
  triggers: TalentTrigger[];
  tags: string[];
  ownedCount: number;
  gradesOwned: AbilityGrade[];
  definitionVersion: number;
  warnings: string[];
};
