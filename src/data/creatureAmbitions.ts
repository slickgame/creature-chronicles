import { getCreatureCareerRecord } from "@/data/creatureCareerRecords";
import type { CreatureCareerRecord } from "@/types/career";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type CreatureAmbitionId =
  | "coliseum_champion"
  | "proven_guardian"
  | "master_healer"
  | "skilled_worker"
  | "devoted_parent"
  | "distinguished_breeder"
  | "guild_contributor"
  | "ranch_veteran";

export type CreatureAmbitionCategory = "combat" | "support" | "ranch" | "family" | "guild";

export type CreatureAmbitionDefinition = {
  ambitionId: CreatureAmbitionId;
  name: string;
  category: CreatureAmbitionCategory;
  description: string;
  progressLabel: string;
  target: number;
  milestoneTargets: readonly number[];
  iconPath: string;
  getProgress: (record: CreatureCareerRecord) => number;
};

export type CreatureAmbitionProgress = {
  definition: CreatureAmbitionDefinition;
  progress: number;
  target: number;
  percent: number;
  completed: boolean;
  reachedMilestones: number[];
  nextMilestone: number | null;
};

export const CREATURE_AMBITIONS: readonly CreatureAmbitionDefinition[] = [
  {
    ambitionId: "coliseum_champion",
    name: "Coliseum Champion",
    category: "combat",
    description: "Build a lasting battle record and become one of the ranch's most accomplished competitors.",
    progressLabel: "Victories",
    target: 25,
    milestoneTargets: [1, 5, 10, 25],
    iconPath: "/images/ui/icons/icon_ability_trigger.png",
    getProgress: (record) => record.victories,
  },
  {
    ambitionId: "proven_guardian",
    name: "Proven Guardian",
    category: "support",
    description: "Earn renown by protecting allies and holding the team together under pressure.",
    progressLabel: "Allies protected",
    target: 50,
    milestoneTargets: [5, 15, 30, 50],
    iconPath: "/images/ui/icons/icon_guard.png",
    getProgress: (record) => record.alliesProtected,
  },
  {
    ambitionId: "master_healer",
    name: "Master Healer",
    category: "support",
    description: "Restore a remarkable amount of health across a lifetime of battles.",
    progressLabel: "Healing performed",
    target: 1000,
    milestoneTargets: [100, 300, 600, 1000],
    iconPath: "/images/ui/icons/icon_heal.png",
    getProgress: (record) => record.healingDone,
  },
  {
    ambitionId: "skilled_worker",
    name: "Skilled Worker",
    category: "ranch",
    description: "Become a dependable ranch specialist through consistent productive work.",
    progressLabel: "Resources produced",
    target: 500,
    milestoneTargets: [50, 150, 300, 500],
    iconPath: "/images/ui/icons/icon_builder.png",
    getProgress: (record) => record.resourcesProduced,
  },
  {
    ambitionId: "devoted_parent",
    name: "Devoted Parent",
    category: "family",
    description: "Raise a thriving family and leave a meaningful lineage behind.",
    progressLabel: "Offspring",
    target: 5,
    milestoneTargets: [1, 2, 3, 5],
    iconPath: "/images/ui/icons/icon_breeding.png",
    getProgress: (record) => record.offspringCount,
  },
  {
    ambitionId: "distinguished_breeder",
    name: "Distinguished Breeder",
    category: "family",
    description: "Contribute Rare and Epic offspring to the ranch's future bloodlines.",
    progressLabel: "Rare or Epic offspring",
    target: 3,
    milestoneTargets: [1, 2, 3],
    iconPath: "/images/ui/icons/icon_stat_growth.png",
    getProgress: (record) => record.rareOffspringCount + record.epicOffspringCount,
  },
  {
    ambitionId: "guild_contributor",
    name: "Guild Contributor",
    category: "guild",
    description: "Build a reputation by answering requests from across the town and surrounding region.",
    progressLabel: "Guild requests",
    target: 10,
    milestoneTargets: [1, 3, 6, 10],
    iconPath: "/images/ui/icons/icon_service_permit.png",
    getProgress: (record) => record.guildRequestsCompleted,
  },
  {
    ambitionId: "ranch_veteran",
    name: "Ranch Veteran",
    category: "ranch",
    description: "Spend a long, productive career serving the ranch through work and training.",
    progressLabel: "Career days and sessions",
    target: 30,
    milestoneTargets: [5, 10, 20, 30],
    iconPath: "/images/ui/icons/icon_breeder_level.png",
    getProgress: (record) => record.daysWorked + record.trainingSessionsCompleted,
  },
] as const;

const AMBITION_BY_ID = new Map(CREATURE_AMBITIONS.map((definition) => [definition.ambitionId, definition]));

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function scoreAmbition(definition: CreatureAmbitionDefinition, record: CreatureCareerRecord): number {
  const progressRatio = definition.target > 0 ? definition.getProgress(record) / definition.target : 0;
  return Math.min(2, progressRatio);
}

/**
 * Ambitions v1 deliberately derives a stable primary ambition rather than
 * persisting a mutable assignment. Existing saves therefore gain ambitions
 * immediately, and the same creature always receives the same tie-break.
 */
export function getPrimaryCreatureAmbition(
  save: GameSave,
  creatureId: CreatureId,
): CreatureAmbitionDefinition {
  const record = getCreatureCareerRecord(save, creatureId);
  const strongestScore = Math.max(...CREATURE_AMBITIONS.map((definition) => scoreAmbition(definition, record)));
  const candidates = strongestScore > 0
    ? CREATURE_AMBITIONS.filter((definition) => scoreAmbition(definition, record) === strongestScore)
    : CREATURE_AMBITIONS;
  return candidates[stableHash(String(creatureId)) % candidates.length] ?? CREATURE_AMBITIONS[0];
}

export function getCreatureAmbitionProgress(
  save: GameSave,
  creatureId: CreatureId,
  ambitionId?: CreatureAmbitionId,
): CreatureAmbitionProgress {
  const definition = ambitionId
    ? AMBITION_BY_ID.get(ambitionId) ?? getPrimaryCreatureAmbition(save, creatureId)
    : getPrimaryCreatureAmbition(save, creatureId);
  const record = getCreatureCareerRecord(save, creatureId);
  const progress = Math.max(0, Math.floor(definition.getProgress(record)));
  const percent = Math.max(0, Math.min(100, Math.round((progress / definition.target) * 100)));
  const reachedMilestones = definition.milestoneTargets.filter((target) => progress >= target);
  const nextMilestone = definition.milestoneTargets.find((target) => progress < target) ?? null;
  return {
    definition,
    progress,
    target: definition.target,
    percent,
    completed: progress >= definition.target,
    reachedMilestones: [...reachedMilestones],
    nextMilestone,
  };
}

export function getAmbitionCandidatesForCreature(
  save: GameSave,
  creature: CreatureRecord,
): CreatureAmbitionProgress[] {
  return CREATURE_AMBITIONS
    .map((definition) => getCreatureAmbitionProgress(save, creature.creatureId, definition.ambitionId))
    .sort((left, right) => right.percent - left.percent || left.definition.name.localeCompare(right.definition.name));
}
