import { getVariantDefinition } from "@/data/creatures";
import type { CreatureFamily, CreatureRecord } from "@/types/creature";
import type {
  ChoreSkillCategory,
  ChoreSkillDefinition,
  ChoreSkillGainResult,
  ChoreSkillId,
  ChoreSkillProgress,
  CreatureChoreSkills,
} from "@/types/choreSkills";
import type { RanchJobId } from "@/types/ranchJobs";

export const MAX_CHORE_SKILL_LEVEL = 20;

export const CHORE_SKILL_DEFINITIONS: ChoreSkillDefinition[] = [
  {
    skillId: "cooking",
    category: "domestic",
    label: "Cooking",
    shortLabel: "Cook",
    description: "Preparing meals, treats, and future consumable recipes.",
  },
  {
    skillId: "cleaning",
    category: "domestic",
    label: "Cleaning",
    shortLabel: "Clean",
    description: "Keeping rooms, equipment, and shared spaces orderly.",
  },
  {
    skillId: "crafting",
    category: "domestic",
    label: "Crafting",
    shortLabel: "Craft",
    description: "Making tools, repairs, furnishings, and future equipment components.",
  },
  {
    skillId: "caregiving",
    category: "domestic",
    label: "Caregiving",
    shortLabel: "Care",
    description: "Helping injured, tired, young, or expecting ranch residents.",
  },
  {
    skillId: "hospitality",
    category: "domestic",
    label: "Hospitality",
    shortLabel: "Host",
    description: "Social work, guest service, morale, and future venue assignments.",
  },
  {
    skillId: "security",
    category: "ranch",
    label: "Security",
    shortLabel: "Guard",
    description: "Patrol, threat detection, protection, and danger prevention.",
  },
  {
    skillId: "harvesting",
    category: "ranch",
    label: "Harvesting",
    shortLabel: "Harvest",
    description: "Gardening, gathering crops, and collecting natural materials.",
  },
  {
    skillId: "production",
    category: "ranch",
    label: "Production",
    shortLabel: "Produce",
    description: "Feed production, stable output, and repeatable ranch resources.",
  },
  {
    skillId: "hauling",
    category: "ranch",
    label: "Hauling",
    shortLabel: "Haul",
    description: "Moving supplies, field work, maintenance, and heavy transport.",
  },
  {
    skillId: "ranch_care",
    category: "ranch",
    label: "Ranch Care",
    shortLabel: "Ranch Care",
    description: "Comfort routines, nursery support, and ranch-wide morale care.",
  },
];

export const DOMESTIC_CHORE_SKILL_IDS: ChoreSkillId[] = CHORE_SKILL_DEFINITIONS
  .filter((definition) => definition.category === "domestic")
  .map((definition) => definition.skillId);

export const RANCH_CHORE_SKILL_IDS: ChoreSkillId[] = CHORE_SKILL_DEFINITIONS
  .filter((definition) => definition.category === "ranch")
  .map((definition) => definition.skillId);

const FAMILY_BASELINE_LEVELS: Record<CreatureFamily, Record<ChoreSkillId, number>> = {
  feline: {
    cooking: 2,
    cleaning: 4,
    crafting: 2,
    caregiving: 3,
    hospitality: 4,
    security: 2,
    harvesting: 2,
    production: 2,
    hauling: 1,
    ranch_care: 4,
  },
  canine: {
    cooking: 2,
    cleaning: 2,
    crafting: 2,
    caregiving: 3,
    hospitality: 3,
    security: 5,
    harvesting: 1,
    production: 2,
    hauling: 3,
    ranch_care: 3,
  },
  bovine: {
    cooking: 3,
    cleaning: 2,
    crafting: 3,
    caregiving: 3,
    hospitality: 2,
    security: 3,
    harvesting: 2,
    production: 5,
    hauling: 4,
    ranch_care: 2,
  },
  lapine: {
    cooking: 3,
    cleaning: 3,
    crafting: 2,
    caregiving: 4,
    hospitality: 3,
    security: 1,
    harvesting: 5,
    production: 3,
    hauling: 1,
    ranch_care: 4,
  },
  equine: {
    cooking: 2,
    cleaning: 2,
    crafting: 3,
    caregiving: 2,
    hospitality: 2,
    security: 3,
    harvesting: 2,
    production: 2,
    hauling: 5,
    ranch_care: 2,
  },
};

const JOB_SKILL_MAP: Record<RanchJobId, ChoreSkillId> = {
  security_patrol: "security",
  comfort_care: "ranch_care",
  stable_production: "production",
  garden_tending: "harvesting",
  field_hauling: "hauling",
};

function clampLevel(value: number): number {
  return Math.max(1, Math.min(MAX_CHORE_SKILL_LEVEL, Math.floor(value)));
}

export function getChoreSkillXpToNext(level: number): number {
  const normalizedLevel = clampLevel(level);
  if (normalizedLevel >= MAX_CHORE_SKILL_LEVEL) return 0;
  return 20 + normalizedLevel * 15;
}

export function getChoreSkillDefinition(skillId: ChoreSkillId): ChoreSkillDefinition {
  const definition = CHORE_SKILL_DEFINITIONS.find((item) => item.skillId === skillId);
  if (!definition) throw new Error(`Unknown chore skill: ${skillId}`);
  return definition;
}

export function getJobChoreSkillId(jobId: RanchJobId): ChoreSkillId {
  return JOB_SKILL_MAP[jobId];
}

export function getFamilyChoreBaselineLevel(
  family: CreatureFamily,
  skillId: ChoreSkillId,
): number {
  return FAMILY_BASELINE_LEVELS[family]?.[skillId] ?? 1;
}

function createProgress(level: number): ChoreSkillProgress {
  const normalizedLevel = clampLevel(level);
  return {
    level: normalizedLevel,
    xp: 0,
    xpToNext: getChoreSkillXpToNext(normalizedLevel),
    lifetimeXp: 0,
  };
}

export function createDefaultChoreSkills(family: CreatureFamily): CreatureChoreSkills {
  return CHORE_SKILL_DEFINITIONS.reduce(
    (skills, definition) => ({
      ...skills,
      [definition.skillId]: createProgress(
        getFamilyChoreBaselineLevel(family, definition.skillId),
      ),
    }),
    {} as CreatureChoreSkills,
  );
}

export function normalizeCreatureChoreSkills(
  creature: CreatureRecord,
): CreatureChoreSkills {
  const family = getVariantDefinition(creature.variantId).family;
  const defaults = createDefaultChoreSkills(family);
  const source = (creature.choreSkills ?? {}) as Partial<
    Record<ChoreSkillId, Partial<ChoreSkillProgress>>
  >;

  return CHORE_SKILL_DEFINITIONS.reduce((skills, definition) => {
    const fallback = defaults[definition.skillId];
    const saved = source[definition.skillId];
    const level = clampLevel(Number(saved?.level ?? fallback.level));
    const xpToNext = getChoreSkillXpToNext(level);
    const xp = xpToNext > 0
      ? Math.max(0, Math.min(xpToNext - 1, Math.floor(Number(saved?.xp ?? 0))))
      : 0;
    return {
      ...skills,
      [definition.skillId]: {
        level,
        xp,
        xpToNext,
        lifetimeXp: Math.max(0, Math.floor(Number(saved?.lifetimeXp ?? saved?.xp ?? 0))),
      },
    };
  }, {} as CreatureChoreSkills);
}

export function getCreatureChoreSkillProgress(
  creature: CreatureRecord,
  skillId: ChoreSkillId,
): ChoreSkillProgress {
  return normalizeCreatureChoreSkills(creature)[skillId];
}

export function getCreatureChoreSkillGroup(
  creature: CreatureRecord,
  category: ChoreSkillCategory,
): Array<{
  definition: ChoreSkillDefinition;
  progress: ChoreSkillProgress;
  naturalBaselineLevel: number;
}> {
  const family = getVariantDefinition(creature.variantId).family;
  const skills = normalizeCreatureChoreSkills(creature);
  return CHORE_SKILL_DEFINITIONS
    .filter((definition) => definition.category === category)
    .map((definition) => ({
      definition,
      progress: skills[definition.skillId],
      naturalBaselineLevel: getFamilyChoreBaselineLevel(family, definition.skillId),
    }));
}

export function getCreatureChoreSkillLevelForJob(
  creature: CreatureRecord,
  jobId: RanchJobId,
): number {
  return getCreatureChoreSkillProgress(creature, getJobChoreSkillId(jobId)).level;
}

export function getChoreSkillAptitudeLabel(level: number): string {
  if (level >= 16) return "Master";
  if (level >= 12) return "Expert";
  if (level >= 8) return "Skilled";
  if (level >= 5) return "Natural";
  if (level >= 3) return "Comfortable";
  return "Novice";
}

export function getChoreSkillXpGain(
  choreScore: number,
  talentXpPercent = 0,
): number {
  const base = 10 + Math.max(0, Math.round(choreScore / 2));
  return Math.max(1, Math.round(base * (1 + talentXpPercent / 100)));
}

export function gainCreatureChoreSkillXp(
  creature: CreatureRecord,
  jobId: RanchJobId,
  xpGain: number,
): { creature: CreatureRecord; gain: ChoreSkillGainResult } {
  const skillId = getJobChoreSkillId(jobId);
  const definition = getChoreSkillDefinition(skillId);
  const skills = normalizeCreatureChoreSkills(creature);
  const before = skills[skillId];
  const levelBefore = before.level;
  let level = before.level;
  let xp = before.xp + Math.max(0, Math.floor(xpGain));
  let levelUps = 0;

  while (
    level < MAX_CHORE_SKILL_LEVEL &&
    getChoreSkillXpToNext(level) > 0 &&
    xp >= getChoreSkillXpToNext(level)
  ) {
    xp -= getChoreSkillXpToNext(level);
    level += 1;
    levelUps += 1;
  }

  if (level >= MAX_CHORE_SKILL_LEVEL) xp = 0;
  const nextProgress: ChoreSkillProgress = {
    level,
    xp,
    xpToNext: getChoreSkillXpToNext(level),
    lifetimeXp: before.lifetimeXp + Math.max(0, Math.floor(xpGain)),
  };
  const nextCreature: CreatureRecord = {
    ...creature,
    choreSkills: { ...skills, [skillId]: nextProgress },
  };
  const levelText = levelUps
    ? ` ${definition.label} increased from Level ${levelBefore} to Level ${level}.`
    : "";

  return {
    creature: nextCreature,
    gain: {
      skillId,
      skillLabel: definition.label,
      xpGained: Math.max(0, Math.floor(xpGain)),
      levelBefore,
      levelAfter: level,
      levelUps,
      summary: `${definition.label} +${Math.max(0, Math.floor(xpGain))} XP.${levelText}`,
    },
  };
}