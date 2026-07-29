import {
  gainCreatureChoreSkillXp,
  getChoreSkillAptitudeLabel,
  getChoreSkillDefinition,
  getChoreSkillXpGain,
  getCreatureChoreSkillLevelForJob,
  getJobChoreSkillId,
} from "@/data/choreSkills";
import { getVariantDefinition } from "@/data/creatures";
import { getRanchUpgradeEffects } from "@/data/ranchUpgrades";
import { getChoreTalentSummary, getRecoveryTalentSummary } from "@/data/talents/talentEngine";
import { getTrainingUnavailableReason, isCreatureAwayForTraining } from "@/data/trainingGrounds";
import type { CreatureInjurySeverity, CreatureRecord, CreatureStatKey } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobAssignmentResult, RanchJobDefinition, RanchJobId, RanchJobResult, RanchJobsState } from "@/types/ranchJobs";
import type { EggRecord, GameSave } from "@/types/save";

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

const MAX_CREATURES_PER_CHORE = 3;
const MAX_RANCH_EVENT_LOG_ENTRIES = 50;
const BASE_DANGER_CHANCE = 35;
const MIN_DANGER_WITH_SECURITY = 6;
const MIN_DANGER_WITHOUT_SECURITY = 18;
const BASE_WEAR_CHANCE = 22;
const HAULING_WEAR_CHANCE = 8;

export const RANCH_JOB_IDS: RanchJobId[] = ["security_patrol", "comfort_care", "stable_production", "garden_tending", "field_hauling"];

export const RANCH_JOB_DEFINITIONS: RanchJobDefinition[] = [
  { jobId: "security_patrol", name: "Security Patrol", shortName: "Security", description: "Any creature can train for patrol and protection work. Strength, stamina, willpower, talents, and Security skill improve results; canines and several guardian variants begin with stronger natural proficiency.", iconPath: RANCH_JOB_ASSETS.security, preferredFamilies: ["canine"], preferredVariants: ["variant_hellhound", "variant_direwolf", "variant_minotaur", "variant_nightmare"], energyCost: 22, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Safety score • lowers danger risk" },
  { jobId: "comfort_care", name: "Comfort Care", shortName: "Comfort", description: "Any creature can learn ranch comfort routines. Charisma, willpower, affection, talents, and Ranch Care skill improve the next-day breeding-comfort bonus.", iconPath: RANCH_JOB_ASSETS.comfort, preferredFamilies: ["feline"], preferredVariants: ["variant_dream_lop", "variant_unicorn"], energyCost: 16, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Breeding comfort score • next-day bonus" },
  { jobId: "stable_production", name: "Stable Production", shortName: "Production", description: "Any species can learn production work. Strength, stamina, affection, talents, and Production skill increase Feed output; bovines begin with a stronger baseline.", iconPath: RANCH_JOB_ASSETS.production, preferredFamilies: ["bovine"], preferredVariants: ["variant_moon_yak"], energyCost: 20, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Feed output scales with assigned helpers" },
  { jobId: "garden_tending", name: "Garden Tending", shortName: "Garden", description: "Any species can train in harvesting. Dexterity, charisma, talents, and Harvesting skill increase garden output; lapines begin with a stronger baseline.", iconPath: RANCH_JOB_ASSETS.garden, preferredFamilies: ["lapine"], preferredVariants: ["variant_antlerhare"], energyCost: 18, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Garden feed output scales with helpers" },
  { jobId: "field_hauling", name: "Field Hauling", shortName: "Hauling", description: "Any creature can learn hauling and maintenance. Strength, stamina, dexterity, talents, and Hauling skill improve Materials and repair output; equines begin with a stronger baseline.", iconPath: RANCH_JOB_ASSETS.hauling, preferredFamilies: ["equine"], preferredVariants: ["variant_minotaur"], energyCost: 24, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Materials + upkeep score" },
];

export function createDefaultRanchJobsState(): RanchJobsState {
  return {
    assignments: { security_patrol: [], comfort_care: [], stable_production: [], garden_tending: [], field_hauling: [] },
    lastProcessedDayNumber: 0,
    lifetimeCompletions: 0,
  };
}

function normalizeAssignment(value: unknown): CreatureId[] {
  if (Array.isArray(value)) return value.filter(Boolean) as CreatureId[];
  return value ? [value as CreatureId] : [];
}

export function getRanchJobs(save: GameSave): RanchJobsState {
  const defaults = createDefaultRanchJobsState();
  const existingAssignments = save.ranchJobs?.assignments ?? {};
  return {
    ...defaults,
    ...(save.ranchJobs ?? {}),
    assignments: RANCH_JOB_IDS.reduce((assignments, jobId) => ({
      ...assignments,
      [jobId]: normalizeAssignment((existingAssignments as Record<string, unknown>)[jobId]),
    }), defaults.assignments),
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

function isCreatureInjured(creature: CreatureRecord, dayNumber: number): boolean {
  return typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= dayNumber;
}

/**
 * Species and variants now affect starting proficiency rather than access.
 * Every creature can perform and improve at every ranch job.
 */
export function isCreatureEligibleForJob(creature: CreatureRecord, job: RanchJobDefinition): boolean {
  void creature;
  void job;
  return true;
}

export function getEligibleCreaturesForJob(save: GameSave, jobId: RanchJobId): CreatureRecord[] {
  const job = getRanchJobDefinition(jobId);
  const jobs = getRanchJobs(save);
  const assignedIds = new Set(RANCH_JOB_IDS.flatMap((id) => jobs.assignments[id] ?? []));
  return (save.creatures ?? [])
    .filter((creature) =>
      !isCreatureAwayForTraining(save, creature.creatureId) &&
      !isCreatureInjured(creature, save.dayState.dayNumber) &&
      (!assignedIds.has(creature.creatureId) || jobs.assignments[jobId]?.includes(creature.creatureId))
    )
    .sort((a, b) => calculateCreatureChoreScore(b, job) - calculateCreatureChoreScore(a, job));
}

function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  return hash % modulo;
}

function getDailyFeedCost(creature: CreatureRecord): number {
  const variant = getVariantDefinition(creature.variantId);
  const familyBaseCost = variant.family === "bovine" || variant.family === "equine" ? 2 : 1;
  const rareCost = variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0;
  return familyBaseCost + rareCost;
}

function getRelevantStats(jobId: RanchJobId): CreatureStatKey[] {
  if (jobId === "security_patrol") return ["STR", "STA", "WIL", "FER"];
  if (jobId === "comfort_care") return ["CHA", "WIL"];
  if (jobId === "stable_production") return ["STR", "STA"];
  if (jobId === "garden_tending") return ["DEX", "CHA"];
  return ["STR", "STA", "DEX"];
}

export function calculateCreatureChoreScore(creature: CreatureRecord, job: RanchJobDefinition): number {
  const relevantStats = getRelevantStats(job.jobId);
  const statAverage = relevantStats.reduce((total, stat) => total + (creature.stats[stat] ?? 0), 0) / relevantStats.length;
  const creatureLevelBonus = creature.level / 8;
  const affectionBonus = creature.affection / 25;
  const statBonus = statAverage / 6;
  const talentBonus = getChoreTalentSummary(creature.abilities, job.jobId).scoreBonus;
  const skillLevel = getCreatureChoreSkillLevelForJob(creature, job.jobId);
  const skillBonus = Math.max(0, (skillLevel - 1) * 0.45);
  return Math.max(1, Math.round((statBonus + creatureLevelBonus + affectionBonus + talentBonus + skillBonus) * 10) / 10);
}

function getJobProvisionOutput(jobId: RanchJobId, score: number): number {
  if (jobId === "stable_production") return Math.max(1, Math.floor(5 + score));
  if (jobId === "garden_tending") return Math.max(1, Math.floor(2 + score));
  return 0;
}

function getJobMaterialOutput(jobId: RanchJobId, score: number): number {
  if (jobId === "field_hauling") return Math.max(1, Math.floor(1 + score * 0.65));
  return 0;
}

function getJobEffectMessage(jobId: RanchJobId, creatureName: string, provisionOutput: number, materialOutput: number, score: number, talentTriggers: string[], skillSummary = ""): string {
  const talentText = talentTriggers.length ? ` Talent effects: ${talentTriggers.join(" ")}` : "";
  const progressionText = skillSummary ? ` ${skillSummary}` : "";
  if (jobId === "security_patrol") return `${creatureName} guarded the ranch. Security score +${Math.round(score)}.${progressionText}${talentText}`;
  if (jobId === "comfort_care") return `${creatureName} kept the ranch calm. Breeding Comfort score +${Math.round(score)}.${progressionText}${talentText}`;
  if (jobId === "stable_production") return `${creatureName} stocked the feed shed: +${provisionOutput} Feed.${progressionText}${talentText}`;
  if (jobId === "garden_tending") return `${creatureName} harvested garden produce: +${provisionOutput} Feed.${progressionText}${talentText}`;
  if (jobId === "field_hauling") return `${creatureName} moved supplies: +${materialOutput} Materials. Upkeep score +${Math.round(score)}.${progressionText}${talentText}`;
  return `${creatureName} completed ${getRanchJobDefinition(jobId).name}.${progressionText}${talentText}`;
}

function getSecurityEventChance(securityScore: number): number {
  const securityReduction = Math.floor(securityScore * 2);
  const minimumChance = securityScore > 0 ? MIN_DANGER_WITH_SECURITY : MIN_DANGER_WITHOUT_SECURITY;
  return Math.max(minimumChance, BASE_DANGER_CHANCE - securityReduction);
}

function getRanchConditionLabel(damage: number): string {
  if (damage >= 80) return "Critical";
  if (damage >= 50) return "Damaged";
  if (damage >= 20) return "Worn";
  return "Good";
}

function getConditionRecoveryPenalty(damage: number): { energyPenalty: number; affectionPenalty: number; summary: string } {
  if (damage >= 80) return { energyPenalty: 0.25, affectionPenalty: -2, summary: "Critical ranch condition reduced sleep recovery by 25% and creature affection by 2." };
  if (damage >= 50) return { energyPenalty: 0.15, affectionPenalty: -1, summary: "Damaged ranch condition reduced sleep recovery by 15% and creature affection by 1." };
  if (damage >= 20) return { energyPenalty: 0.05, affectionPenalty: 0, summary: "Worn ranch condition reduced sleep recovery by 5%." };
  return { energyPenalty: 0, affectionPenalty: 0, summary: "Ranch condition caused no recovery penalty." };
}

function getInjurySeverity(seed: string): { label: CreatureInjurySeverity; days: number } {
  const roll = deterministicRoll(seed, 100);
  if (roll >= 85) return { label: "Badly Hurt", days: 3 };
  if (roll >= 45) return { label: "Wounded", days: 2 };
  return { label: "Bruised", days: 1 };
}

function readRanchEventLog(save: GameSave): string[] {
  try {
    const parsed = JSON.parse(String(save.flags.ranchEventLog ?? "[]"));
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function buildRanchEventLog(save: GameSave, entries: string[]): string {
  const nextEntries = entries.filter(Boolean);
  return JSON.stringify([...nextEntries, ...readRanchEventLog(save)].slice(0, MAX_RANCH_EVENT_LOG_ENTRIES));
}

function dayLog(save: GameSave, message: string): string {
  return `Day ${save.dayState.dayNumber}: ${message}`;
}

type SecurityEventResult = { creatures: CreatureRecord[]; eggs: EggRecord[]; summary: string; eventType: string; dangerChance: number; success: boolean; damageAdded: number };
type WearResult = { damageAdded: number; summary: string; chance: number };

function resolveSecurityEvent(save: GameSave, creatures: CreatureRecord[], eggs: EggRecord[], securityScore: number): SecurityEventResult {
  const dangerChance = getSecurityEventChance(securityScore);
  const dangerRoll = deterministicRoll(`${save.saveId}_danger_${save.dayState.dayNumber}`, 100);
  const activeSecurity = securityScore > 0;
  const forcedNoSecurityEvent = !activeSecurity && save.dayState.dayNumber % 3 === 0;
  if (!forcedNoSecurityEvent && dangerRoll >= dangerChance) {
    if (activeSecurity && deterministicRoll(`${save.saveId}_security_success_${save.dayState.dayNumber}`, 100) < Math.min(75, 20 + securityScore * 6)) {
      const successMessages = [
        "Security patrol found fresh tracks near the outer fence and scared the threat away.",
        "Security patrol kept the nursery quiet overnight. No danger event occurred.",
        "Security patrol spotted movement near the trail before it reached the ranch.",
        "Security patrol reinforced the evening watch. The ranch stayed safe.",
      ];
      const messageIndex = deterministicRoll(`${save.saveId}_security_success_message_${save.dayState.dayNumber}`, successMessages.length);
      return { creatures, eggs, summary: successMessages[messageIndex], eventType: "success", dangerChance, success: true, damageAdded: 0 };
    }
    return { creatures, eggs, summary: "No danger event occurred.", eventType: "none", dangerChance, success: false, damageAdded: 0 };
  }

  const incubatingEggs = eggs.filter((egg) => egg.status === "incubating");
  const eventRoll = deterministicRoll(`${save.saveId}_danger_type_${save.dayState.dayNumber}`, 100);
  if (incubatingEggs.length && eventRoll < 45) {
    const targetEgg = incubatingEggs[deterministicRoll(`${save.saveId}_egg_target_${save.dayState.dayNumber}`, incubatingEggs.length)];
    const nextEggs = eggs.map((egg) => egg.eggId === targetEgg.eggId ? { ...egg, daysRemaining: egg.daysRemaining + 1 } : egg);
    return { creatures, eggs: nextEggs, summary: "A predator slipped near the nursery. One egg was disturbed, its hatch timer increased by 1 day, and ranch damage rose by 10.", eventType: "egg_disturbed", dangerChance, success: false, damageAdded: 10 };
  }
  if (eventRoll >= 45 && eventRoll < 70) {
    return { creatures, eggs, summary: "A fence line was damaged overnight. Ranch damage rose by 20.", eventType: "fence_damage", dangerChance, success: false, damageAdded: 20 };
  }

  const availableCreatures = creatures.filter((creature) => !isCreatureAwayForTraining(save, creature.creatureId) && !isCreatureInjured(creature, save.dayState.dayNumber));
  if (availableCreatures.length) {
    const targetCreature = availableCreatures[deterministicRoll(`${save.saveId}_injury_target_${save.dayState.dayNumber}`, availableCreatures.length)];
    const severity = getInjurySeverity(`${save.saveId}_injury_severity_${save.dayState.dayNumber}`);
    const nextCreatures = creatures.map((creature) => creature.creatureId === targetCreature.creatureId ? { ...creature, injuryLabel: severity.label, injuredUntilDayNumber: save.dayState.dayNumber + severity.days - 1 } : creature);
    return { creatures: nextCreatures, eggs, summary: `${targetCreature.nickname} was ${severity.label.toLowerCase()} during a ranch danger event and cannot do chores or breed for ${severity.days} day${severity.days === 1 ? "" : "s"}. Ranch damage rose by 15.`, eventType: "creature_injured", dangerChance, success: false, damageAdded: 15 };
  }
  return { creatures, eggs, summary: "Something prowled near the ranch and damaged the outer path. Ranch damage rose by 5.", eventType: "minor_disturbance", dangerChance, success: false, damageAdded: 5 };
}

function resolveRanchWear(save: GameSave, upkeepScore: number, currentDamage: number): WearResult {
  const haulingActive = upkeepScore > 0;
  const conditionChance = currentDamage >= 50 ? 8 : currentDamage >= 20 ? 5 : 0;
  const chance = haulingActive ? Math.min(40, HAULING_WEAR_CHANCE + conditionChance) : 100;
  const wearRoll = deterministicRoll(`${save.saveId}_wear_${save.dayState.dayNumber}`, 100);
  if (haulingActive && wearRoll >= chance) return { damageAdded: 0, chance, summary: "No routine ranch wear occurred." };
  const baseDamage = currentDamage >= 50 ? 3 : currentDamage >= 20 ? 2 : 1;
  const damageAdded = haulingActive ? baseDamage : Math.min(4, baseDamage + (currentDamage >= 20 ? 1 : 0));
  const summary = haulingActive
    ? `Routine ranch wear added ${damageAdded} damage despite active upkeep. Field Hauling can still repair damage overnight.`
    : `Daily ranch wear added ${damageAdded} damage because no Field Hauling crew was assigned.`;
  return { damageAdded, chance, summary };
}

export function assignCreatureToRanchJob(save: GameSave, jobId: RanchJobId, creatureId: CreatureId | null): RanchJobAssignmentResult {
  const jobs = getRanchJobs(save);
  const job = getRanchJobDefinition(jobId);
  if (creatureId === null) {
    return { save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: [] } }, flags: { ...save.flags, m14RanchJobsUsed: true } }, ok: true, message: `${job.name} chore cleared.` };
  }
  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found." };
  const trainingReason = getTrainingUnavailableReason(save, creatureId);
  if (trainingReason) return { save, ok: false, message: `${creature.nickname} is away at the Training Grounds: ${trainingReason}.` };
  if (isCreatureInjured(creature, save.dayState.dayNumber)) return { save, ok: false, message: `${creature.nickname} is ${creature.injuryLabel ?? "injured"} and cannot be assigned until they recover.` };
  const alreadyAssigned = Object.entries(jobs.assignments).find(([assignedJobId, assignedCreatureIds]) => assignedJobId !== jobId && assignedCreatureIds.includes(creatureId));
  if (alreadyAssigned) return { save, ok: false, message: `${creature.nickname} is already assigned to ${getRanchJobDefinition(alreadyAssigned[0] as RanchJobId).name}.` };
  const currentAssignment = jobs.assignments[jobId] ?? [];
  if (currentAssignment.includes(creatureId)) {
    const nextAssignment = currentAssignment.filter((assignedCreatureId) => assignedCreatureId !== creatureId);
    return { save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: nextAssignment } }, flags: { ...save.flags, m14RanchJobsUsed: true } }, ok: true, message: `${creature.nickname} removed from ${job.name}.` };
  }
  if (currentAssignment.length >= MAX_CREATURES_PER_CHORE) return { save, ok: false, message: `${job.name} already has ${MAX_CREATURES_PER_CHORE} helpers assigned.` };
  const nextAssignment = [...currentAssignment, creatureId];
  const skillId = getJobChoreSkillId(jobId);
  const skillLevel = getCreatureChoreSkillLevelForJob(creature, jobId);
  const skillLabel = getChoreSkillDefinition(skillId).label;
  return {
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: nextAssignment } },
      flags: { ...save.flags, m14RanchJobsUsed: true, m14RanchJobAssigned: true, m61UniversalChoreAccess: true },
    },
    ok: true,
    message: `${creature.nickname} added to ${job.name}. ${skillLabel} Level ${skillLevel} (${getChoreSkillAptitudeLabel(skillLevel)}). Every species can improve through completed work.`,
  };
}

export function processRanchJobsForNewDay(save: GameSave): { save: GameSave; results: RanchJobResult[] } {
  const jobs = getRanchJobs(save);
  if (jobs.lastProcessedDayNumber >= save.dayState.dayNumber) return { save, results: [] };
  const ranchEffects = getRanchUpgradeEffects(save);
  const choreEnergyDiscount = ranchEffects.ranchChoreEnergyDiscount;
  const choreScoreBonus = ranchEffects.ranchChoreScoreBonus;
  let completions = 0;
  let producedFeed = 0;
  let producedMaterials = 0;
  let securityScore = 0;
  let comfortScore = 0;
  let upkeepScore = 0;
  const results: RanchJobResult[] = [];
  const assignments = jobs.assignments;
  const nextCreatures = (save.creatures ?? []).map((creature) => ({ ...creature }));

  for (const jobId of RANCH_JOB_IDS) {
    const creatureIds = assignments[jobId] ?? [];
    if (!creatureIds.length) continue;
    const job = getRanchJobDefinition(jobId);
    for (const creatureId of creatureIds) {
      const creature = nextCreatures.find((item) => item.creatureId === creatureId);
      if (!creature) continue;
      const trainingReason = getTrainingUnavailableReason(save, creature.creatureId);
      if (trainingReason) {
        results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward: 0, guildPointReward: 0, affectionReward: 0, energyCost: 0, message: `${creature.nickname} is away at the Training Grounds and could not complete ${job.name}.` });
        continue;
      }
      if (isCreatureInjured(creature, save.dayState.dayNumber)) {
        results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward: 0, guildPointReward: 0, affectionReward: 0, energyCost: 0, message: `${creature.nickname} is ${creature.injuryLabel ?? "injured"} and could not complete ${job.name}.` });
        continue;
      }
      const talentSummary = getChoreTalentSummary(creature.abilities, jobId);
      const effectiveEnergyCost = Math.max(8, job.energyCost - choreEnergyDiscount - talentSummary.energyDiscount);
      if (creature.energy < effectiveEnergyCost) {
        results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward: 0, guildPointReward: 0, affectionReward: 0, energyCost: 0, message: `${creature.nickname} was too tired for ${job.name}. Needed ${effectiveEnergyCost} energy.` });
        continue;
      }
      const choreScore = calculateCreatureChoreScore(creature, job) + choreScoreBonus;
      const provisionOutput = getJobProvisionOutput(jobId, choreScore);
      const materialOutput = getJobMaterialOutput(jobId, choreScore);
      producedFeed += provisionOutput;
      producedMaterials += materialOutput;
      if (jobId === "security_patrol") securityScore += choreScore;
      if (jobId === "comfort_care") comfortScore += choreScore;
      if (jobId === "field_hauling") upkeepScore += choreScore;
      creature.energy = Math.max(0, creature.energy - effectiveEnergyCost);
      const skillXp = getChoreSkillXpGain(choreScore, talentSummary.xpPercent);
      const progressed = gainCreatureChoreSkillXp(creature, jobId, skillXp);
      Object.assign(creature, progressed.creature);
      completions += 1;
      results.push({
        jobId,
        jobName: job.name,
        creatureId: creature.creatureId,
        creatureName: creature.nickname,
        goldReward: 0,
        guildPointReward: 0,
        affectionReward: 0,
        energyCost: effectiveEnergyCost,
        skillId: progressed.gain.skillId,
        skillXpGained: progressed.gain.xpGained,
        skillLevelBefore: progressed.gain.levelBefore,
        skillLevelAfter: progressed.gain.levelAfter,
        message: getJobEffectMessage(jobId, creature.nickname, provisionOutput, materialOutput, choreScore, talentSummary.triggers, progressed.gain.summary),
      });
    }
  }

  const securityEvent = resolveSecurityEvent(save, nextCreatures, save.eggs ?? [], securityScore);
  const creaturesAfterSecurity = securityEvent.creatures;
  const feedRequired = creaturesAfterSecurity
    .filter((creature) => !isCreatureAwayForTraining(save, creature.creatureId))
    .reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const startingFeed = getFlagNumber(save.flags.ranchFeedStock);
  const startingMaterials = getFlagNumber(save.flags.ranchMaterialsStock);
  const startingDamage = getFlagNumber(save.flags.ranchDamage);
  const wear = resolveRanchWear(save, upkeepScore, Math.min(100, startingDamage + securityEvent.damageAdded));
  const totalDamageAdded = securityEvent.damageAdded + wear.damageAdded;
  const repairAmount = Math.min(100, Math.round(upkeepScore));
  const damageBeforeRepair = Math.min(100, startingDamage + totalDamageAdded);
  const repairedDamage = Math.min(damageBeforeRepair, repairAmount);
  const finalDamage = Math.max(0, damageBeforeRepair - repairedDamage);
  const conditionLabel = getRanchConditionLabel(finalDamage);
  const conditionPenalty = getConditionRecoveryPenalty(finalDamage);
  const feedAvailable = startingFeed + producedFeed;
  const feedConsumed = Math.min(feedAvailable, feedRequired);
  const remainingFeed = Math.max(0, feedAvailable - feedConsumed);
  const remainingMaterials = startingMaterials + producedMaterials;
  const fedRatio = feedRequired > 0 ? feedConsumed / feedRequired : 1;
  const basePlayerEnergyRatio = fedRatio >= 1 ? 1 : fedRatio > 0 ? 0.45 : 0.1;
  const baseCreatureEnergyRatio = fedRatio >= 1 ? 1 : fedRatio > 0 ? 0.45 : 0.1;
  const baseAffectionDelta = fedRatio >= 1 ? 0 : fedRatio > 0 ? -1 : -3;
  const playerEnergyRatio = Math.max(0.05, basePlayerEnergyRatio - conditionPenalty.energyPenalty);
  const creatureEnergyRatio = Math.max(0.05, baseCreatureEnergyRatio - conditionPenalty.energyPenalty);
  const affectionDelta = baseAffectionDelta + conditionPenalty.affectionPenalty;
  const foodStatus = fedRatio >= 1 ? "Fed" : fedRatio > 0 ? "Short" : "Empty";
  const feedingSummary = feedRequired <= 0
    ? "No creatures needed feed today."
    : foodStatus === "Fed"
      ? `Ranch provisions covered daily feed: ${feedConsumed}/${feedRequired} Feed consumed.`
      : foodStatus === "Short"
        ? `Food shortage: ${feedConsumed}/${feedRequired} Feed consumed. Sleep recovery was weak and creature affection dropped by 1.`
        : `No food available: 0/${feedRequired} Feed consumed. Sleep recovered almost no energy and creature affection dropped by 3.`;
  const haulingSummary = producedMaterials > 0 ? `Field Hauling added ${producedMaterials} Materials. Ranch material stock is now ${remainingMaterials}.` : "No new ranch materials were hauled today.";
  const damageSourceSummary = totalDamageAdded > 0 ? `Damage added today: +${totalDamageAdded} (${securityEvent.damageAdded} danger, ${wear.damageAdded} wear).` : "No danger or routine wear damage was added today.";
  const upkeepSummary = repairedDamage > 0
    ? `${damageSourceSummary} Field Hauling repaired ${repairedDamage} ranch damage. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).`
    : totalDamageAdded > 0
      ? `${damageSourceSummary} No upkeep repairs were completed. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).`
      : `No new damage required repairs. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).`;
  const logEntries = [
    ...results.map((result) => dayLog(save, result.message)),
    dayLog(save, feedingSummary),
    dayLog(save, securityEvent.summary),
    wear.damageAdded > 0 ? dayLog(save, wear.summary) : "",
    dayLog(save, upkeepSummary),
    producedMaterials > 0 ? dayLog(save, haulingSummary) : "",
  ];
  const fedCreatures = creaturesAfterSecurity.map((creature) => {
    if (isCreatureAwayForTraining(save, creature.creatureId)) return creature;
    const maxEnergy = creature.maxEnergy ?? creature.energy;
    const recoveryTalent = getRecoveryTalentSummary(creature.abilities);
    const adjustedRecoveryRatio = Math.min(1, creatureEnergyRatio + recoveryTalent.energyPercent / 100);
    const targetEnergy = Math.floor(maxEnergy * adjustedRecoveryRatio);
    const injuryExpired = typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber < save.dayState.dayNumber;
    return {
      ...creature,
      injuryLabel: injuryExpired ? undefined : creature.injuryLabel,
      injuredUntilDayNumber: injuryExpired ? undefined : creature.injuredUntilDayNumber,
      energy: Math.min(creature.energy, targetEnergy),
      affection: Math.max(0, Math.min(100, creature.affection + affectionDelta + recoveryTalent.affection)),
    };
  });

  return {
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      creatures: fedCreatures,
      eggs: securityEvent.eggs,
      currencies: { ...save.currencies, energy: Math.floor(save.currencies.maxEnergy * playerEnergyRatio) },
      ranchJobs: { ...jobs, assignments, lastProcessedDayNumber: save.dayState.dayNumber, lifetimeCompletions: jobs.lifetimeCompletions + completions },
      flags: {
        ...save.flags,
        m14RanchJobsCreated: true,
        m14RanchJobsProcessed: completions > 0 || save.flags.m14RanchJobsProcessed === true,
        m14SecurityEventsEnabled: true,
        m14FieldHaulingMaterials: producedMaterials > 0 || save.flags.m14FieldHaulingMaterials === true,
        m14RanchDamageEnabled: true,
        m14RanchEventLog: true,
        m15RanchDangerBalance: true,
        m15RanchWearEnabled: true,
        m15GuaranteedWear: true,
        m16RanchChoreBoardEffects: choreEnergyDiscount > 0 || choreScoreBonus > 0 || save.flags.m16RanchChoreBoardEffects === true,
        m47TrainingAvailability: true,
        m14RanchConditionPenalties: conditionPenalty.energyPenalty > 0 || conditionPenalty.affectionPenalty < 0 || save.flags.m14RanchConditionPenalties === true,
        m60StructuredTalentChores: true,
        m61ChoreSkills: true,
        m61UniversalChoreAccess: true,
        m61ChoreSkillXp: completions > 0 || save.flags.m61ChoreSkillXp === true,
        ranchEventLog: buildRanchEventLog(save, logEntries),
        ranchFeedStock: remainingFeed,
        ranchFeedProducedToday: producedFeed,
        ranchFeedRequiredToday: feedRequired,
        ranchFeedConsumedToday: feedConsumed,
        ranchFoodStatus: foodStatus,
        ranchFeedingSummary: feedingSummary,
        ranchMaterialsStock: remainingMaterials,
        ranchMaterialsProducedToday: producedMaterials,
        ranchMaterialsSummaryToday: haulingSummary,
        ranchDamage: finalDamage,
        ranchDamageAddedToday: totalDamageAdded,
        ranchDangerDamageAddedToday: securityEvent.damageAdded,
        ranchWearDamageToday: wear.damageAdded,
        ranchWearChanceToday: wear.chance,
        ranchWearSummaryToday: wear.summary,
        ranchDamageBeforeRepairToday: damageBeforeRepair,
        ranchDamageRepairedToday: repairedDamage,
        ranchConditionToday: conditionLabel,
        ranchConditionEnergyPenaltyToday: Math.round(conditionPenalty.energyPenalty * 100),
        ranchConditionAffectionPenaltyToday: Math.abs(conditionPenalty.affectionPenalty),
        ranchConditionPenaltySummaryToday: conditionPenalty.summary,
        ranchUpkeepSummaryToday: upkeepSummary,
        ranchSecurityActiveToday: securityScore > 0,
        ranchSecurityScoreToday: Math.round(securityScore),
        ranchSecurityDangerChanceToday: securityEvent.dangerChance,
        ranchSecurityEventTypeToday: securityEvent.eventType,
        ranchSecurityEventSummaryToday: securityEvent.summary,
        ranchSecuritySuccessToday: securityEvent.success,
        ranchBreedingComfortActiveToday: comfortScore > 0,
        ranchBreedingComfortBonusToday: Math.min(25, Math.round(comfortScore * 2)),
        ranchUpkeepScoreToday: Math.round(upkeepScore),
      },
    },
    results,
  };
}