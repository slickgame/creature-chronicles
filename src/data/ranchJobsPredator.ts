import {
  gainCreatureChoreSkillXp,
  getChoreSkillAptitudeLabel,
  getChoreSkillDefinition,
  getChoreSkillXpGain,
  getCreatureChoreSkillLevelForJob,
  getJobChoreSkillId,
} from "@/data/choreSkills";
import { getVariantDefinition } from "@/data/creatures";
import { resolvePredatorNightCheck } from "@/data/predatorEvents";
import { getRanchUpgradeEffects } from "@/data/ranchUpgrades";
import { getChoreTalentSummary, getRecoveryTalentSummary } from "@/data/talents/talentEngine";
import { getTrainingUnavailableReason, isCreatureAwayForTraining } from "@/data/trainingGrounds";
import type { CreatureRecord, CreatureStatKey } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobAssignmentResult, RanchJobDefinition, RanchJobId, RanchJobResult, RanchJobsState } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";
import * as Base from "./ranchJobs";

export const RANCH_JOB_ASSETS = Base.RANCH_JOB_ASSETS;
export const RANCH_JOB_IDS = Base.RANCH_JOB_IDS;
export const RANCH_JOB_DEFINITIONS = Base.RANCH_JOB_DEFINITIONS;
export const createDefaultRanchJobsState = Base.createDefaultRanchJobsState;
export const getRanchJobs = Base.getRanchJobs;
export const getRanchJobDefinition = Base.getRanchJobDefinition;
export const getCreatureDisplayName = Base.getCreatureDisplayName;
export const isCreatureEligibleForJob = Base.isCreatureEligibleForJob;
export const getEligibleCreaturesForJob = Base.getEligibleCreaturesForJob;
export const calculateCreatureChoreScore = Base.calculateCreatureChoreScore;
export const assignCreatureToRanchJob = Base.assignCreatureToRanchJob;

const MAX_RANCH_EVENT_LOG_ENTRIES = 50;
const BASE_WEAR_CHANCE = 22;
const HAULING_WEAR_CHANCE = 8;

function isCreatureInjured(creature: CreatureRecord, dayNumber: number): boolean {
  return typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= dayNumber;
}

function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  return hash % Math.max(1, modulo);
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

function calculateChoreScore(creature: CreatureRecord, job: RanchJobDefinition): number {
  const relevantStats = getRelevantStats(job.jobId);
  const statAverage = relevantStats.reduce((total, stat) => total + (creature.stats[stat] ?? 0), 0) / relevantStats.length;
  const talentBonus = getChoreTalentSummary(creature.abilities, job.jobId).scoreBonus;
  const skillLevel = getCreatureChoreSkillLevelForJob(creature, job.jobId);
  return Math.max(1, Math.round((statAverage / 6 + creature.level / 8 + creature.affection / 25 + talentBonus + Math.max(0, (skillLevel - 1) * 0.45)) * 10) / 10);
}

function getJobProvisionOutput(jobId: RanchJobId, score: number): number {
  if (jobId === "stable_production") return Math.max(1, Math.floor(5 + score));
  if (jobId === "garden_tending") return Math.max(1, Math.floor(2 + score));
  return 0;
}

function getJobMaterialOutput(jobId: RanchJobId, score: number): number {
  return jobId === "field_hauling" ? Math.max(1, Math.floor(1 + score * 0.65)) : 0;
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

function resolveRanchWear(save: GameSave, upkeepScore: number, currentDamage: number): { damageAdded: number; summary: string; chance: number } {
  const haulingActive = upkeepScore > 0;
  const conditionChance = currentDamage >= 50 ? 8 : currentDamage >= 20 ? 5 : 0;
  const chance = haulingActive ? Math.min(40, HAULING_WEAR_CHANCE + conditionChance) : 100;
  const wearRoll = deterministicRoll(`${save.saveId}_wear_${save.dayState.dayNumber}`, 100);
  if (haulingActive && wearRoll >= chance) return { damageAdded: 0, chance, summary: "No routine ranch wear occurred." };
  const baseDamage = currentDamage >= 50 ? 3 : currentDamage >= 20 ? 2 : 1;
  const damageAdded = haulingActive ? baseDamage : Math.min(4, baseDamage + (currentDamage >= 20 ? 1 : 0));
  return {
    damageAdded,
    chance,
    summary: haulingActive
      ? `Routine ranch wear added ${damageAdded} damage despite active upkeep. Field Hauling can still repair damage overnight.`
      : `Daily ranch wear added ${damageAdded} damage because no Field Hauling crew was assigned.`,
  };
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
  return JSON.stringify([...entries.filter(Boolean), ...readRanchEventLog(save)].slice(0, MAX_RANCH_EVENT_LOG_ENTRIES));
}

function dayLog(save: GameSave, message: string): string {
  return `Day ${save.dayState.dayNumber}: ${message}`;
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
      const choreScore = calculateChoreScore(creature, job) + choreScoreBonus;
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

  const predatorCheck = resolvePredatorNightCheck(save, securityScore);
  const workingSave = predatorCheck.save;
  const pendingEvent = predatorCheck.event;
  const feedRequired = nextCreatures
    .filter((creature) => !isCreatureAwayForTraining(workingSave, creature.creatureId))
    .reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const startingFeed = getFlagNumber(workingSave.flags.ranchFeedStock);
  const startingMaterials = getFlagNumber(workingSave.flags.ranchMaterialsStock);
  const startingDamage = getFlagNumber(workingSave.flags.ranchDamage);
  const wear = resolveRanchWear(workingSave, upkeepScore, startingDamage);
  const totalDamageAdded = wear.damageAdded;
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
  const damageSourceSummary = totalDamageAdded > 0 ? `Routine wear added ${totalDamageAdded} ranch damage.` : "No routine wear damage was added today.";
  const upkeepSummary = repairedDamage > 0
    ? `${damageSourceSummary} Field Hauling repaired ${repairedDamage} ranch damage. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).`
    : totalDamageAdded > 0
      ? `${damageSourceSummary} No upkeep repairs were completed. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).`
      : `No new damage required repairs. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).`;
  const logEntries = [
    ...results.map((result) => dayLog(workingSave, result.message)),
    dayLog(workingSave, feedingSummary),
    dayLog(workingSave, predatorCheck.summary),
    wear.damageAdded > 0 ? dayLog(workingSave, wear.summary) : "",
    dayLog(workingSave, upkeepSummary),
    producedMaterials > 0 ? dayLog(workingSave, haulingSummary) : "",
  ];
  const fedCreatures = nextCreatures.map((creature) => {
    if (isCreatureAwayForTraining(workingSave, creature.creatureId)) return creature;
    const maxEnergy = creature.maxEnergy ?? creature.energy;
    const recoveryTalent = getRecoveryTalentSummary(creature.abilities);
    const adjustedRecoveryRatio = Math.min(1, creatureEnergyRatio + recoveryTalent.energyPercent / 100);
    const targetEnergy = Math.floor(maxEnergy * adjustedRecoveryRatio);
    const injuryExpired = typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber < workingSave.dayState.dayNumber;
    return {
      ...creature,
      injuryLabel: injuryExpired ? undefined : creature.injuryLabel,
      injuredUntilDayNumber: injuryExpired ? undefined : creature.injuredUntilDayNumber,
      energy: Math.min(creature.energy, targetEnergy),
      affection: Math.max(0, Math.min(100, creature.affection + affectionDelta + recoveryTalent.affection)),
    };
  });

  const eventType = pendingEvent ? (pendingEvent.intercepted ? "predator_intercepted" : "predator_breach") : predatorCheck.assessment.tier === "guarded" ? "predator_guarded" : "none";
  return {
    save: {
      ...workingSave,
      updatedAt: new Date().toISOString(),
      creatures: fedCreatures,
      eggs: workingSave.eggs ?? [],
      currencies: { ...workingSave.currencies, energy: Math.floor(workingSave.currencies.maxEnergy * playerEnergyRatio) },
      ranchJobs: { ...jobs, assignments, lastProcessedDayNumber: workingSave.dayState.dayNumber, lifetimeCompletions: jobs.lifetimeCompletions + completions },
      flags: {
        ...workingSave.flags,
        m14RanchJobsCreated: true,
        m14RanchJobsProcessed: completions > 0 || workingSave.flags.m14RanchJobsProcessed === true,
        m14SecurityEventsEnabled: true,
        m14FieldHaulingMaterials: producedMaterials > 0 || workingSave.flags.m14FieldHaulingMaterials === true,
        m14RanchDamageEnabled: true,
        m14RanchEventLog: true,
        m15RanchDangerBalance: true,
        m15RanchWearEnabled: true,
        m15GuaranteedWear: true,
        m16RanchChoreBoardEffects: choreEnergyDiscount > 0 || choreScoreBonus > 0 || workingSave.flags.m16RanchChoreBoardEffects === true,
        m47TrainingAvailability: true,
        m14RanchConditionPenalties: conditionPenalty.energyPenalty > 0 || conditionPenalty.affectionPenalty < 0 || workingSave.flags.m14RanchConditionPenalties === true,
        m60StructuredTalentChores: true,
        m61ChoreSkills: true,
        m61UniversalChoreAccess: true,
        m61ChoreSkillXp: completions > 0 || workingSave.flags.m61ChoreSkillXp === true,
        m63PredatorNightIntegration: true,
        ranchEventLog: buildRanchEventLog(workingSave, logEntries),
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
        ranchDangerDamageAddedToday: 0,
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
        ranchSecurityDangerChanceToday: predatorCheck.assessment.eventChance,
        ranchSecurityEventTypeToday: eventType,
        ranchSecurityEventSummaryToday: predatorCheck.summary,
        ranchSecuritySuccessToday: Boolean(pendingEvent?.intercepted || predatorCheck.assessment.tier === "guarded"),
        ranchBreedingComfortActiveToday: comfortScore > 0,
        ranchBreedingComfortBonusToday: Math.min(25, Math.round(comfortScore * 2)),
        ranchUpkeepScoreToday: Math.round(upkeepScore),
      },
    },
    results,
  };
}
