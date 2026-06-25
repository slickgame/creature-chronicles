import { getVariantDefinition } from "@/data/creatures";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobAssignmentResult, RanchJobDefinition, RanchJobId, RanchJobResult, RanchJobsState } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

export const RANCH_JOB_ASSETS = {
  ranchJobs: "/images/ui/icons/icon_ranch_upgrade.png",
  ranchJobsBoard: "/images/buildings/ranch/guild_board.png",
  security: "/images/ui/icons/icon_guild_points.png",
  garden: "/images/buildings/ranch/lapine_habitat.png",
  production: "/images/buildings/ranch/bovine_habitat.png",
  hauling: "/images/buildings/ranch/equine_habitat.png",
  comfort: "/images/buildings/ranch/feline_habitat.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  gp: "/images/ui/icons/icon_guild_points.png",
} as const;

export const RANCH_JOB_IDS: RanchJobId[] = ["security_patrol", "comfort_care", "stable_production", "garden_tending", "field_hauling"];

export const RANCH_JOB_DEFINITIONS: RanchJobDefinition[] = [
  {
    jobId: "security_patrol",
    name: "Security Patrol",
    shortName: "Security",
    description: "Assign a watchful creature to patrol the ranch path and keep visitors, deliveries, and guild messengers safe.",
    iconPath: RANCH_JOB_ASSETS.security,
    preferredFamilies: ["canine"],
    preferredVariants: ["variant_minotaur", "variant_nightmare"],
    energyCost: 12,
    baseGoldReward: 20,
    baseGuildPointReward: 2,
    affectionReward: 1,
    rewardLabel: "+20 Gold, +2 GP, +1 affection",
  },
  {
    jobId: "comfort_care",
    name: "Comfort Care",
    shortName: "Comfort",
    description: "Assign a calming creature to improve the ranch mood, soothe nervous eggs, and keep the home area welcoming.",
    iconPath: RANCH_JOB_ASSETS.comfort,
    preferredFamilies: ["feline"],
    preferredVariants: ["variant_dream_lop", "variant_unicorn"],
    energyCost: 8,
    baseGoldReward: 10,
    baseGuildPointReward: 0,
    affectionReward: 3,
    rewardLabel: "+10 Gold, +3 affection",
  },
  {
    jobId: "stable_production",
    name: "Stable Production",
    shortName: "Production",
    description: "Assign a strong production creature to help with pasture chores, supply hauling, and basic ranch output.",
    iconPath: RANCH_JOB_ASSETS.production,
    preferredFamilies: ["bovine"],
    preferredVariants: ["variant_moon_yak"],
    energyCost: 12,
    baseGoldReward: 75,
    baseGuildPointReward: 0,
    affectionReward: 1,
    rewardLabel: "+75 Gold, +1 affection",
  },
  {
    jobId: "garden_tending",
    name: "Garden Tending",
    shortName: "Garden",
    description: "Assign a nimble garden helper to tend herbs, carrots, flowers, and future nursery-support materials.",
    iconPath: RANCH_JOB_ASSETS.garden,
    preferredFamilies: ["lapine"],
    preferredVariants: ["variant_antlerhare"],
    energyCost: 10,
    baseGoldReward: 55,
    baseGuildPointReward: 1,
    affectionReward: 1,
    rewardLabel: "+55 Gold, +1 GP, +1 affection",
  },
  {
    jobId: "field_hauling",
    name: "Field Hauling",
    shortName: "Hauling",
    description: "Assign a reliable field creature to move supplies, clear paths, and prepare future travel or expedition systems.",
    iconPath: RANCH_JOB_ASSETS.hauling,
    preferredFamilies: ["equine"],
    preferredVariants: ["variant_minotaur"],
    energyCost: 14,
    baseGoldReward: 65,
    baseGuildPointReward: 1,
    affectionReward: 1,
    rewardLabel: "+65 Gold, +1 GP, +1 affection",
  },
];

export function createDefaultRanchJobsState(): RanchJobsState {
  return {
    assignments: {
      security_patrol: null,
      comfort_care: null,
      stable_production: null,
      garden_tending: null,
      field_hauling: null,
    },
    lastProcessedDayNumber: 0,
    lifetimeCompletions: 0,
  };
}

export function getRanchJobs(save: GameSave): RanchJobsState {
  const defaults = createDefaultRanchJobsState();
  return {
    ...defaults,
    ...(save.ranchJobs ?? {}),
    assignments: { ...defaults.assignments, ...(save.ranchJobs?.assignments ?? {}) },
  };
}

export function getRanchJobDefinition(jobId: RanchJobId): RanchJobDefinition {
  const definition = RANCH_JOB_DEFINITIONS.find((job) => job.jobId === jobId);
  if (!definition) throw new Error(`Unknown ranch job: ${jobId}`);
  return definition;
}

export function getCreatureDisplayName(creature: CreatureRecord): string {
  const variant = getVariantDefinition(creature.variantId);
  return `${creature.nickname} (${variant.name})`;
}

export function isCreatureEligibleForJob(creature: CreatureRecord, job: RanchJobDefinition): boolean {
  const variant = getVariantDefinition(creature.variantId);
  return job.preferredFamilies.includes(variant.family) || Boolean(job.preferredVariants?.includes(variant.variantId));
}

export function getEligibleCreaturesForJob(save: GameSave, jobId: RanchJobId): CreatureRecord[] {
  const job = getRanchJobDefinition(jobId);
  const assignedIds = new Set(Object.values(getRanchJobs(save).assignments).filter(Boolean));
  return (save.creatures ?? []).filter((creature) => isCreatureEligibleForJob(creature, job) && (!assignedIds.has(creature.creatureId) || getRanchJobs(save).assignments[jobId] === creature.creatureId));
}

function calculateJobGoldReward(creature: CreatureRecord, job: RanchJobDefinition): number {
  const statBonus = Math.floor(((creature.stats.STR ?? 0) + (creature.stats.STA ?? 0) + (creature.stats.CHA ?? 0)) / 6);
  const levelBonus = Math.floor(creature.level / 3);
  return job.baseGoldReward + statBonus + levelBonus;
}

function calculateJobGuildPointReward(creature: CreatureRecord, job: RanchJobDefinition): number {
  const variant = getVariantDefinition(creature.variantId);
  const rareBonus = variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0;
  return job.baseGuildPointReward + rareBonus;
}

export function assignCreatureToRanchJob(save: GameSave, jobId: RanchJobId, creatureId: CreatureId | null): RanchJobAssignmentResult {
  const jobs = getRanchJobs(save);
  const job = getRanchJobDefinition(jobId);
  if (creatureId === null) {
    return {
      save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: null } }, flags: { ...save.flags, m14RanchJobsUsed: true } },
      ok: true,
      message: `${job.name} assignment cleared.`,
    };
  }

  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found." };
  if (creature.isLocked) return { save, ok: false, message: `${creature.nickname} is locked. Unlock them before assigning jobs.` };
  if (!isCreatureEligibleForJob(creature, job)) return { save, ok: false, message: `${creature.nickname} is not a natural fit for ${job.name}.` };

  const alreadyAssigned = Object.entries(jobs.assignments).find(([assignedJobId, assignedCreatureId]) => assignedJobId !== jobId && assignedCreatureId === creatureId);
  if (alreadyAssigned) return { save, ok: false, message: `${creature.nickname} is already assigned to ${getRanchJobDefinition(alreadyAssigned[0] as RanchJobId).name}.` };

  return {
    save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: creatureId } }, flags: { ...save.flags, m14RanchJobsUsed: true, m14RanchJobAssigned: true } },
    ok: true,
    message: `${creature.nickname} assigned to ${job.name}. Jobs resolve when you sleep to the next day.`,
  };
}

export function processRanchJobsForNewDay(save: GameSave): { save: GameSave; results: RanchJobResult[] } {
  const jobs = getRanchJobs(save);
  if (jobs.lastProcessedDayNumber >= save.dayState.dayNumber) return { save, results: [] };

  let totalGold = 0;
  let totalGp = 0;
  let completions = 0;
  const results: RanchJobResult[] = [];
  const assignments = jobs.assignments;
  const nextCreatures = (save.creatures ?? []).map((creature) => ({ ...creature }));

  for (const jobId of RANCH_JOB_IDS) {
    const creatureId = assignments[jobId];
    if (!creatureId) continue;
    const creature = nextCreatures.find((item) => item.creatureId === creatureId);
    if (!creature) continue;
    const job = getRanchJobDefinition(jobId);
    if (!isCreatureEligibleForJob(creature, job)) continue;
    if (creature.energy < job.energyCost) {
      results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward: 0, guildPointReward: 0, affectionReward: 0, energyCost: 0, message: `${creature.nickname} was too tired for ${job.name}.` });
      continue;
    }

    const goldReward = calculateJobGoldReward(creature, job);
    const guildPointReward = calculateJobGuildPointReward(creature, job);
    creature.energy = Math.max(0, creature.energy - job.energyCost);
    creature.affection = Math.min(100, creature.affection + job.affectionReward);
    totalGold += goldReward;
    totalGp += guildPointReward;
    completions += 1;
    results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward, guildPointReward, affectionReward: job.affectionReward, energyCost: job.energyCost, message: `${creature.nickname} completed ${job.name}: +${goldReward} Gold${guildPointReward ? `, +${guildPointReward} GP` : ""}.` });
  }

  return {
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      creatures: nextCreatures,
      currencies: { ...save.currencies, gold: save.currencies.gold + totalGold, guildPoints: save.currencies.guildPoints + totalGp },
      ranchJobs: { ...jobs, assignments, lastProcessedDayNumber: save.dayState.dayNumber, lifetimeCompletions: jobs.lifetimeCompletions + completions },
      flags: { ...save.flags, m14RanchJobsCreated: true, m14RanchJobsProcessed: completions > 0 || save.flags.m14RanchJobsProcessed === true },
    },
    results,
  };
}
