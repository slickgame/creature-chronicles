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
    baseGoldReward: 0,
    baseGuildPointReward: 0,
    affectionReward: 0,
    rewardLabel: "Safety patrol • lowers danger risk",
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
    baseGoldReward: 0,
    baseGuildPointReward: 0,
    affectionReward: 0,
    rewardLabel: "Breeding comfort • next-day bonus",
  },
  {
    jobId: "stable_production",
    name: "Stable Production",
    shortName: "Production",
    description: "Assign a strong production creature to stock the feed shed and prepare daily ranch provisions.",
    iconPath: RANCH_JOB_ASSETS.production,
    preferredFamilies: ["bovine"],
    preferredVariants: ["variant_moon_yak"],
    energyCost: 12,
    baseGoldReward: 0,
    baseGuildPointReward: 0,
    affectionReward: 0,
    rewardLabel: "+6 Feed before auto-feeding",
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
    baseGoldReward: 0,
    baseGuildPointReward: 0,
    affectionReward: 0,
    rewardLabel: "+3 Feed and garden produce",
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
    baseGoldReward: 0,
    baseGuildPointReward: 0,
    affectionReward: 0,
    rewardLabel: "Ranch materials • upkeep support",
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
  if (!definition) throw new Error(`Unknown ranch chore: ${jobId}`);
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

function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function getDailyFeedCost(creature: CreatureRecord): number {
  const variant = getVariantDefinition(creature.variantId);
  const familyBaseCost = variant.family === "bovine" || variant.family === "equine" ? 2 : 1;
  const rareCost = variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0;
  return familyBaseCost + rareCost;
}

function getJobProvisionOutput(jobId: RanchJobId): number {
  if (jobId === "stable_production") return 6;
  if (jobId === "garden_tending") return 3;
  return 0;
}

function getJobEffectMessage(jobId: RanchJobId, creatureName: string, provisionOutput: number): string {
  if (jobId === "security_patrol") return `${creatureName} guarded the ranch. Security risk is reduced today.`;
  if (jobId === "comfort_care") return `${creatureName} kept the ranch calm. Breeding Comfort is active today.`;
  if (jobId === "stable_production") return `${creatureName} stocked the feed shed: +${provisionOutput} Feed.`;
  if (jobId === "garden_tending") return `${creatureName} harvested garden produce: +${provisionOutput} Feed.`;
  if (jobId === "field_hauling") return `${creatureName} moved supplies and improved ranch upkeep.`;
  return `${creatureName} completed ${getRanchJobDefinition(jobId).name}.`;
}

export function assignCreatureToRanchJob(save: GameSave, jobId: RanchJobId, creatureId: CreatureId | null): RanchJobAssignmentResult {
  const jobs = getRanchJobs(save);
  const job = getRanchJobDefinition(jobId);
  if (creatureId === null) {
    return {
      save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: null } }, flags: { ...save.flags, m14RanchJobsUsed: true } },
      ok: true,
      message: `${job.name} chore cleared.`,
    };
  }

  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found." };
  if (creature.isLocked) return { save, ok: false, message: `${creature.nickname} is locked. Unlock them before assigning chores.` };
  if (!isCreatureEligibleForJob(creature, job)) return { save, ok: false, message: `${creature.nickname} is not a natural fit for ${job.name}.` };

  const alreadyAssigned = Object.entries(jobs.assignments).find(([assignedJobId, assignedCreatureId]) => assignedJobId !== jobId && assignedCreatureId === creatureId);
  if (alreadyAssigned) return { save, ok: false, message: `${creature.nickname} is already assigned to ${getRanchJobDefinition(alreadyAssigned[0] as RanchJobId).name}.` };

  return {
    save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: creatureId } }, flags: { ...save.flags, m14RanchJobsUsed: true, m14RanchJobAssigned: true } },
    ok: true,
    message: `${creature.nickname} assigned to ${job.name}. Chores resolve when you sleep to the next day.`,
  };
}

export function processRanchJobsForNewDay(save: GameSave): { save: GameSave; results: RanchJobResult[] } {
  const jobs = getRanchJobs(save);
  if (jobs.lastProcessedDayNumber >= save.dayState.dayNumber) return { save, results: [] };

  let completions = 0;
  let producedFeed = 0;
  let securityActive = false;
  let comfortActive = false;
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

    const provisionOutput = getJobProvisionOutput(jobId);
    producedFeed += provisionOutput;
    securityActive = securityActive || jobId === "security_patrol";
    comfortActive = comfortActive || jobId === "comfort_care";
    creature.energy = Math.max(0, creature.energy - job.energyCost);
    completions += 1;
    results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward: 0, guildPointReward: 0, affectionReward: 0, energyCost: job.energyCost, message: getJobEffectMessage(jobId, creature.nickname, provisionOutput) });
  }

  const feedRequired = nextCreatures.reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const startingFeed = getFlagNumber(save.flags.ranchFeedStock);
  const feedAvailable = startingFeed + producedFeed;
  const feedConsumed = Math.min(feedAvailable, feedRequired);
  const remainingFeed = Math.max(0, feedAvailable - feedConsumed);
  const fedRatio = feedRequired > 0 ? feedConsumed / feedRequired : 1;
  const foodStatus = fedRatio >= 1 ? "Fed" : fedRatio > 0 ? "Short" : "Empty";
  const playerEnergyRatio = fedRatio >= 1 ? 1 : fedRatio > 0 ? 0.45 : 0.1;
  const creatureEnergyRatio = fedRatio >= 1 ? 1 : fedRatio > 0 ? 0.45 : 0.1;
  const affectionDelta = fedRatio >= 1 ? 0 : fedRatio > 0 ? -1 : -3;
  const feedingSummary = feedRequired <= 0
    ? "No creatures needed feed today."
    : foodStatus === "Fed"
      ? `Ranch provisions covered daily feed: ${feedConsumed}/${feedRequired} Feed consumed.`
      : foodStatus === "Short"
        ? `Food shortage: ${feedConsumed}/${feedRequired} Feed consumed. Sleep recovery was weak and creature affection dropped by 1.`
        : `No food available: 0/${feedRequired} Feed consumed. Sleep recovered almost no energy and creature affection dropped by 3.`;

  const fedCreatures = nextCreatures.map((creature) => {
    const maxEnergy = creature.maxEnergy ?? creature.energy;
    const targetEnergy = Math.floor(maxEnergy * creatureEnergyRatio);
    return {
      ...creature,
      energy: Math.min(creature.energy, targetEnergy),
      affection: Math.max(0, Math.min(100, creature.affection + affectionDelta)),
    };
  });

  return {
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      creatures: fedCreatures,
      currencies: { ...save.currencies, energy: Math.floor(save.currencies.maxEnergy * playerEnergyRatio) },
      ranchJobs: { ...jobs, assignments, lastProcessedDayNumber: save.dayState.dayNumber, lifetimeCompletions: jobs.lifetimeCompletions + completions },
      flags: {
        ...save.flags,
        m14RanchJobsCreated: true,
        m14RanchJobsProcessed: completions > 0 || save.flags.m14RanchJobsProcessed === true,
        ranchFeedStock: remainingFeed,
        ranchFeedProducedToday: producedFeed,
        ranchFeedRequiredToday: feedRequired,
        ranchFeedConsumedToday: feedConsumed,
        ranchFoodStatus: foodStatus,
        ranchFeedingSummary: feedingSummary,
        ranchSecurityActiveToday: securityActive,
        ranchBreedingComfortActiveToday: comfortActive,
        ranchBreedingComfortBonusToday: comfortActive ? 10 : 0,
      },
    },
    results,
  };
}
