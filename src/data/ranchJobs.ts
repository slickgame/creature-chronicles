import { getVariantDefinition } from "@/data/creatures";
import type { CreatureAbility, CreatureInjurySeverity, CreatureRecord, CreatureStatKey } from "@/types/creature";
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

export const RANCH_JOB_IDS: RanchJobId[] = ["security_patrol", "comfort_care", "stable_production", "garden_tending", "field_hauling"];

export const RANCH_JOB_DEFINITIONS: RanchJobDefinition[] = [
  { jobId: "security_patrol", name: "Security Patrol", shortName: "Security", description: "Assign watchful creatures to patrol the ranch path and reduce danger events. Stronger, tougher, more willful creatures perform better.", iconPath: RANCH_JOB_ASSETS.security, preferredFamilies: ["canine"], preferredVariants: ["variant_hellhound", "variant_direwolf", "variant_minotaur", "variant_nightmare"], energyCost: 12, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Safety score • lowers danger risk" },
  { jobId: "comfort_care", name: "Comfort Care", shortName: "Comfort", description: "Assign calming creatures to improve ranch mood and activate Breeding Comfort for the next day. Charisma, will, affection, and strong abilities help.", iconPath: RANCH_JOB_ASSETS.comfort, preferredFamilies: ["feline"], preferredVariants: ["variant_dream_lop", "variant_unicorn"], energyCost: 8, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Breeding comfort score • next-day bonus" },
  { jobId: "stable_production", name: "Stable Production", shortName: "Production", description: "Assign production creatures to stock the feed shed. Strength, stamina, affection, and helpful abilities increase feed output.", iconPath: RANCH_JOB_ASSETS.production, preferredFamilies: ["bovine"], preferredVariants: ["variant_moon_yak"], energyCost: 12, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Feed output scales with assigned helpers" },
  { jobId: "garden_tending", name: "Garden Tending", shortName: "Garden", description: "Assign nimble garden helpers to grow food and future nursery materials. Dexterity, charisma, and ability quality improve output.", iconPath: RANCH_JOB_ASSETS.garden, preferredFamilies: ["lapine"], preferredVariants: ["variant_antlerhare"], energyCost: 10, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Garden feed output scales with helpers" },
  { jobId: "field_hauling", name: "Field Hauling", shortName: "Hauling", description: "Assign reliable field creatures to move supplies and improve ranch upkeep. Strength, stamina, and dexterity improve material output and upkeep protection.", iconPath: RANCH_JOB_ASSETS.hauling, preferredFamilies: ["equine"], preferredVariants: ["variant_minotaur"], energyCost: 14, baseGoldReward: 0, baseGuildPointReward: 0, affectionReward: 0, rewardLabel: "Materials + upkeep score" },
];

export function createDefaultRanchJobsState(): RanchJobsState {
  return { assignments: { security_patrol: [], comfort_care: [], stable_production: [], garden_tending: [], field_hauling: [] }, lastProcessedDayNumber: 0, lifetimeCompletions: 0 };
}

function normalizeAssignment(value: unknown): CreatureId[] { if (Array.isArray(value)) return value.filter(Boolean) as CreatureId[]; return value ? [value as CreatureId] : []; }
export function getRanchJobs(save: GameSave): RanchJobsState {
  const defaults = createDefaultRanchJobsState();
  const existingAssignments = save.ranchJobs?.assignments ?? {};
  return { ...defaults, ...(save.ranchJobs ?? {}), assignments: RANCH_JOB_IDS.reduce((assignments, jobId) => ({ ...assignments, [jobId]: normalizeAssignment((existingAssignments as Record<string, unknown>)[jobId]) }), defaults.assignments) };
}
export function getRanchJobDefinition(jobId: RanchJobId): RanchJobDefinition { const definition = RANCH_JOB_DEFINITIONS.find((job) => job.jobId === jobId); if (!definition) throw new Error(`Unknown ranch chore: ${jobId}`); return definition; }
export function getCreatureDisplayName(creature: CreatureRecord): string { const variant = getVariantDefinition(creature.variantId); return `${creature.nickname} (${variant.name})`; }
function isCreatureInjured(creature: CreatureRecord, dayNumber: number): boolean { return typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= dayNumber; }
export function isCreatureEligibleForJob(creature: CreatureRecord, job: RanchJobDefinition): boolean { const variant = getVariantDefinition(creature.variantId); return job.preferredFamilies.includes(variant.family) || Boolean(job.preferredVariants?.includes(variant.variantId)); }
export function getEligibleCreaturesForJob(save: GameSave, jobId: RanchJobId): CreatureRecord[] {
  const job = getRanchJobDefinition(jobId);
  const jobs = getRanchJobs(save);
  const assignedIds = new Set(RANCH_JOB_IDS.flatMap((id) => jobs.assignments[id] ?? []));
  return (save.creatures ?? []).filter((creature) => !isCreatureInjured(creature, save.dayState.dayNumber) && isCreatureEligibleForJob(creature, job) && (!assignedIds.has(creature.creatureId) || jobs.assignments[jobId]?.includes(creature.creatureId)));
}
function getFlagNumber(value: boolean | number | string | undefined, fallback = 0): number { const parsed = typeof value === "number" ? value : Number(value ?? fallback); return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback; }
function deterministicRoll(seed: string, modulo = 100): number { let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 100000; return hash % modulo; }
function getDailyFeedCost(creature: CreatureRecord): number { const variant = getVariantDefinition(creature.variantId); const familyBaseCost = variant.family === "bovine" || variant.family === "equine" ? 2 : 1; const rareCost = variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0; return familyBaseCost + rareCost; }
function getRelevantStats(jobId: RanchJobId): CreatureStatKey[] { if (jobId === "security_patrol") return ["STR", "STA", "WIL", "FER"]; if (jobId === "comfort_care") return ["CHA", "WIL"]; if (jobId === "stable_production") return ["STR", "STA"]; if (jobId === "garden_tending") return ["DEX", "CHA"]; return ["STR", "STA", "DEX"]; }
function getAbilityGradeValue(ability: CreatureAbility): number { const values: Record<CreatureAbility["grade"], number> = { F: 0, D: 1, C: 2, B: 3, A: 4, S: 5 }; return values[ability.grade] ?? 0; }
function calculateCreatureChoreScore(creature: CreatureRecord, job: RanchJobDefinition): number {
  const relevantStats = getRelevantStats(job.jobId);
  const statAverage = relevantStats.reduce((total, stat) => total + (creature.stats[stat] ?? 0), 0) / relevantStats.length;
  const abilityAverage = creature.abilities.length ? creature.abilities.reduce((total, ability) => total + getAbilityGradeValue(ability), 0) / creature.abilities.length : 0;
  const levelBonus = creature.level / 8;
  const affectionBonus = creature.affection / 25;
  const abilityBonus = abilityAverage * 0.75;
  const statBonus = statAverage / 6;
  return Math.max(1, Math.round((statBonus + levelBonus + affectionBonus + abilityBonus) * 10) / 10);
}
function getJobProvisionOutput(jobId: RanchJobId, score: number): number { if (jobId === "stable_production") return Math.max(1, Math.floor(5 + score)); if (jobId === "garden_tending") return Math.max(1, Math.floor(2 + score)); return 0; }
function getJobMaterialOutput(jobId: RanchJobId, score: number): number { if (jobId === "field_hauling") return Math.max(1, Math.floor(1 + score * 0.65)); return 0; }
function getJobEffectMessage(jobId: RanchJobId, creatureName: string, provisionOutput: number, materialOutput: number, score: number): string {
  if (jobId === "security_patrol") return `${creatureName} guarded the ranch. Security score +${Math.round(score)}.`;
  if (jobId === "comfort_care") return `${creatureName} kept the ranch calm. Breeding Comfort score +${Math.round(score)}.`;
  if (jobId === "stable_production") return `${creatureName} stocked the feed shed: +${provisionOutput} Feed.`;
  if (jobId === "garden_tending") return `${creatureName} harvested garden produce: +${provisionOutput} Feed.`;
  if (jobId === "field_hauling") return `${creatureName} moved supplies: +${materialOutput} Materials. Upkeep score +${Math.round(score)}.`;
  return `${creatureName} completed ${getRanchJobDefinition(jobId).name}.`;
}
function getSecurityEventChance(securityScore: number): number { return Math.max(2, 15 - Math.floor(securityScore * 2)); }
function getRanchConditionLabel(damage: number): string { if (damage >= 80) return "Critical"; if (damage >= 50) return "Damaged"; if (damage >= 20) return "Worn"; return "Good"; }
function getConditionRecoveryPenalty(damage: number): { energyPenalty: number; affectionPenalty: number; summary: string } {
  if (damage >= 80) return { energyPenalty: 0.25, affectionPenalty: -2, summary: "Critical ranch condition reduced sleep recovery by 25% and creature affection by 2." };
  if (damage >= 50) return { energyPenalty: 0.15, affectionPenalty: -1, summary: "Damaged ranch condition reduced sleep recovery by 15% and creature affection by 1." };
  if (damage >= 20) return { energyPenalty: 0.05, affectionPenalty: 0, summary: "Worn ranch condition reduced sleep recovery by 5%." };
  return { energyPenalty: 0, affectionPenalty: 0, summary: "Ranch condition caused no recovery penalty." };
}
function getInjurySeverity(seed: string): { label: CreatureInjurySeverity; days: number } { const roll = deterministicRoll(seed, 100); if (roll >= 85) return { label: "Badly Hurt", days: 3 }; if (roll >= 45) return { label: "Wounded", days: 2 }; return { label: "Bruised", days: 1 }; }
function readRanchEventLog(save: GameSave): string[] { try { const parsed = JSON.parse(String(save.flags.ranchEventLog ?? "[]")); return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []; } catch { return []; } }
function buildRanchEventLog(save: GameSave, entries: string[]): string { const nextEntries = entries.filter(Boolean); return JSON.stringify([...nextEntries, ...readRanchEventLog(save)].slice(0, MAX_RANCH_EVENT_LOG_ENTRIES)); }
function dayLog(save: GameSave, message: string): string { return `Day ${save.dayState.dayNumber}: ${message}`; }

type SecurityEventResult = { creatures: CreatureRecord[]; eggs: EggRecord[]; summary: string; eventType: string; dangerChance: number; success: boolean; damageAdded: number };
function resolveSecurityEvent(save: GameSave, creatures: CreatureRecord[], eggs: EggRecord[], securityScore: number): SecurityEventResult {
  const dangerChance = getSecurityEventChance(securityScore);
  const dangerRoll = deterministicRoll(`${save.saveId}_danger_${save.dayState.dayNumber}`, 100);
  const activeSecurity = securityScore > 0;
  if (dangerRoll >= dangerChance) {
    if (activeSecurity && deterministicRoll(`${save.saveId}_security_success_${save.dayState.dayNumber}`, 100) < Math.min(75, 20 + securityScore * 6)) {
      const successMessages = [`Security patrol found fresh tracks near the outer fence and scared the threat away.`, `Security patrol kept the nursery quiet overnight. No danger event occurred.`, `Security patrol spotted movement near the trail before it reached the ranch.`, `Security patrol reinforced the evening watch. The ranch stayed safe.`];
      const messageIndex = deterministicRoll(`${save.saveId}_security_success_message_${save.dayState.dayNumber}`, successMessages.length);
      return { creatures, eggs, summary: successMessages[messageIndex], eventType: "success", dangerChance, success: true, damageAdded: 0 };
    }
    return { creatures, eggs, summary: `No danger event occurred.`, eventType: "none", dangerChance, success: false, damageAdded: 0 };
  }
  const incubatingEggs = eggs.filter((egg) => egg.status === "incubating");
  const eventRoll = deterministicRoll(`${save.saveId}_danger_type_${save.dayState.dayNumber}`, 100);
  if (incubatingEggs.length && eventRoll < 45) {
    const targetEgg = incubatingEggs[deterministicRoll(`${save.saveId}_egg_target_${save.dayState.dayNumber}`, incubatingEggs.length)];
    const nextEggs = eggs.map((egg) => egg.eggId === targetEgg.eggId ? { ...egg, daysRemaining: egg.daysRemaining + 1 } : egg);
    return { creatures, eggs: nextEggs, summary: `A predator slipped near the nursery. One egg was disturbed, its hatch timer increased by 1 day, and ranch damage rose by 10.`, eventType: "egg_disturbed", dangerChance, success: false, damageAdded: 10 };
  }
  if (eventRoll >= 45 && eventRoll < 70) return { creatures, eggs, summary: `A fence line was damaged overnight. Ranch damage rose by 20.`, eventType: "fence_damage", dangerChance, success: false, damageAdded: 20 };
  const availableCreatures = creatures.filter((creature) => !isCreatureInjured(creature, save.dayState.dayNumber));
  if (availableCreatures.length) {
    const targetCreature = availableCreatures[deterministicRoll(`${save.saveId}_injury_target_${save.dayState.dayNumber}`, availableCreatures.length)];
    const severity = getInjurySeverity(`${save.saveId}_injury_severity_${save.dayState.dayNumber}`);
    const nextCreatures = creatures.map((creature) => creature.creatureId === targetCreature.creatureId ? { ...creature, injuryLabel: severity.label, injuredUntilDayNumber: save.dayState.dayNumber + severity.days - 1 } : creature);
    return { creatures: nextCreatures, eggs, summary: `${targetCreature.nickname} was ${severity.label.toLowerCase()} during a ranch danger event and cannot do chores or breed for ${severity.days} day${severity.days === 1 ? "" : "s"}. Ranch damage rose by 15.`, eventType: "creature_injured", dangerChance, success: false, damageAdded: 15 };
  }
  return { creatures, eggs, summary: `Something prowled near the ranch and damaged the outer path. Ranch damage rose by 5.`, eventType: "minor_disturbance", dangerChance, success: false, damageAdded: 5 };
}

export function assignCreatureToRanchJob(save: GameSave, jobId: RanchJobId, creatureId: CreatureId | null): RanchJobAssignmentResult {
  const jobs = getRanchJobs(save);
  const job = getRanchJobDefinition(jobId);
  if (creatureId === null) return { save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: [] } }, flags: { ...save.flags, m14RanchJobsUsed: true } }, ok: true, message: `${job.name} chore cleared.` };
  const creature = (save.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!creature) return { save, ok: false, message: "Creature not found." };
  if (isCreatureInjured(creature, save.dayState.dayNumber)) return { save, ok: false, message: `${creature.nickname} is ${creature.injuryLabel ?? "injured"} and cannot be assigned until they recover.` };
  if (!isCreatureEligibleForJob(creature, job)) return { save, ok: false, message: `${creature.nickname} is not a natural fit for ${job.name}.` };
  const alreadyAssigned = Object.entries(jobs.assignments).find(([assignedJobId, assignedCreatureIds]) => assignedJobId !== jobId && assignedCreatureIds.includes(creatureId));
  if (alreadyAssigned) return { save, ok: false, message: `${creature.nickname} is already assigned to ${getRanchJobDefinition(alreadyAssigned[0] as RanchJobId).name}.` };
  const currentAssignment = jobs.assignments[jobId] ?? [];
  if (currentAssignment.includes(creatureId)) {
    const nextAssignment = currentAssignment.filter((assignedCreatureId) => assignedCreatureId !== creatureId);
    return { save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: nextAssignment } }, flags: { ...save.flags, m14RanchJobsUsed: true } }, ok: true, message: `${creature.nickname} removed from ${job.name}.` };
  }
  if (currentAssignment.length >= MAX_CREATURES_PER_CHORE) return { save, ok: false, message: `${job.name} already has ${MAX_CREATURES_PER_CHORE} helpers assigned.` };
  const nextAssignment = [...currentAssignment, creatureId];
  return { save: { ...save, updatedAt: new Date().toISOString(), ranchJobs: { ...jobs, assignments: { ...jobs.assignments, [jobId]: nextAssignment } }, flags: { ...save.flags, m14RanchJobsUsed: true, m14RanchJobAssigned: true } }, ok: true, message: `${creature.nickname} added to ${job.name}. More helpers improve the outcome when you sleep.` };
}

export function processRanchJobsForNewDay(save: GameSave): { save: GameSave; results: RanchJobResult[] } {
  const jobs = getRanchJobs(save);
  if (jobs.lastProcessedDayNumber >= save.dayState.dayNumber) return { save, results: [] };
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
      if (isCreatureInjured(creature, save.dayState.dayNumber)) { results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward: 0, guildPointReward: 0, affectionReward: 0, energyCost: 0, message: `${creature.nickname} is ${creature.injuryLabel ?? "injured"} and could not complete ${job.name}.` }); continue; }
      if (!isCreatureEligibleForJob(creature, job)) continue;
      if (creature.energy < job.energyCost) { results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward: 0, guildPointReward: 0, affectionReward: 0, energyCost: 0, message: `${creature.nickname} was too tired for ${job.name}.` }); continue; }
      const choreScore = calculateCreatureChoreScore(creature, job);
      const provisionOutput = getJobProvisionOutput(jobId, choreScore);
      const materialOutput = getJobMaterialOutput(jobId, choreScore);
      producedFeed += provisionOutput;
      producedMaterials += materialOutput;
      if (jobId === "security_patrol") securityScore += choreScore;
      if (jobId === "comfort_care") comfortScore += choreScore;
      if (jobId === "field_hauling") upkeepScore += choreScore;
      creature.energy = Math.max(0, creature.energy - job.energyCost);
      completions += 1;
      results.push({ jobId, jobName: job.name, creatureId: creature.creatureId, creatureName: creature.nickname, goldReward: 0, guildPointReward: 0, affectionReward: 0, energyCost: job.energyCost, message: getJobEffectMessage(jobId, creature.nickname, provisionOutput, materialOutput, choreScore) });
    }
  }
  const securityEvent = resolveSecurityEvent(save, nextCreatures, save.eggs ?? [], securityScore);
  const creaturesAfterSecurity = securityEvent.creatures;
  const feedRequired = creaturesAfterSecurity.reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const startingFeed = getFlagNumber(save.flags.ranchFeedStock);
  const startingMaterials = getFlagNumber(save.flags.ranchMaterialsStock);
  const startingDamage = getFlagNumber(save.flags.ranchDamage);
  const repairAmount = Math.min(100, Math.round(upkeepScore));
  const damageBeforeRepair = Math.min(100, startingDamage + securityEvent.damageAdded);
  const repairedDamage = Math.min(damageBeforeRepair, repairAmount);
  const finalDamage = Math.max(0, damageBeforeRepair - repairedDamage);
  const conditionLabel = getRanchConditionLabel(finalDamage);
  const conditionPenalty = getConditionRecoveryPenalty(finalDamage);
  const feedAvailable = startingFeed + producedFeed;
  const feedConsumed = Math.min(feedAvailable, feedRequired);
  const remainingFeed = Math.max(0, feedAvailable - feedConsumed);
  const remainingMaterials = startingMaterials + producedMaterials;
  const fedRatio = feedRequired > 0 ? feedConsumed / feedRequired : 1;
  const foodStatus = fedRatio >= 1 ? "Fed" : fedRatio > 0 ? "Short" : "Empty";
  const basePlayerEnergyRatio = fedRatio >= 1 ? 1 : fedRatio > 0 ? 0.45 : 0.1;
  const baseCreatureEnergyRatio = fedRatio >= 1 ? 1 : fedRatio > 0 ? 0.45 : 0.1;
  const baseAffectionDelta = fedRatio >= 1 ? 0 : fedRatio > 0 ? -1 : -3;
  const playerEnergyRatio = Math.max(0.05, basePlayerEnergyRatio - conditionPenalty.energyPenalty);
  const creatureEnergyRatio = Math.max(0.05, baseCreatureEnergyRatio - conditionPenalty.energyPenalty);
  const affectionDelta = baseAffectionDelta + conditionPenalty.affectionPenalty;
  const feedingSummary = feedRequired <= 0 ? "No creatures needed feed today." : foodStatus === "Fed" ? `Ranch provisions covered daily feed: ${feedConsumed}/${feedRequired} Feed consumed.` : foodStatus === "Short" ? `Food shortage: ${feedConsumed}/${feedRequired} Feed consumed. Sleep recovery was weak and creature affection dropped by 1.` : `No food available: 0/${feedRequired} Feed consumed. Sleep recovered almost no energy and creature affection dropped by 3.`;
  const haulingSummary = producedMaterials > 0 ? `Field Hauling added ${producedMaterials} Materials. Ranch material stock is now ${remainingMaterials}.` : "No new ranch materials were hauled today.";
  const upkeepSummary = repairedDamage > 0 ? `Field Hauling repaired ${repairedDamage} ranch damage. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).` : securityEvent.damageAdded > 0 ? `No upkeep repairs were completed. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).` : `No new damage required repairs. Ranch condition is ${conditionLabel} (${finalDamage}/100 damage).`;
  const logEntries = [
    ...results.map((result) => dayLog(save, result.message)),
    dayLog(save, feedingSummary),
    dayLog(save, securityEvent.summary),
    dayLog(save, upkeepSummary),
    producedMaterials > 0 ? dayLog(save, haulingSummary) : "",
  ];
  const fedCreatures = creaturesAfterSecurity.map((creature) => {
    const maxEnergy = creature.maxEnergy ?? creature.energy;
    const targetEnergy = Math.floor(maxEnergy * creatureEnergyRatio);
    const injuryExpired = typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber < save.dayState.dayNumber;
    return { ...creature, injuryLabel: injuryExpired ? undefined : creature.injuryLabel, injuredUntilDayNumber: injuryExpired ? undefined : creature.injuredUntilDayNumber, energy: Math.min(creature.energy, targetEnergy), affection: Math.max(0, Math.min(100, creature.affection + affectionDelta)) };
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
        m14RanchConditionPenalties: conditionPenalty.energyPenalty > 0 || conditionPenalty.affectionPenalty < 0 || save.flags.m14RanchConditionPenalties === true,
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
        ranchDamageAddedToday: securityEvent.damageAdded,
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
