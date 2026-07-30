import { getVariantDefinition } from "@/data/creatures";
import type {
  RanchDaySummary,
  RanchEveningPreview,
  RanchMorningBrief,
  RanchResourceFlow,
  RanchResourceSnapshot,
} from "@/types/ranchDay";
import type { GameSave } from "@/types/save";
import { summarizeCreatureMoods } from "./ranchDayMood";
import { getRanchDayDateLabel, getRanchResourceSnapshot } from "./ranchDayState";

function readFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function buildResourceFlow(starting: RanchResourceSnapshot, ending: RanchResourceSnapshot): RanchResourceFlow {
  return {
    starting,
    ending,
    goldChange: ending.gold - starting.gold,
    feedChange: ending.feed - starting.feed,
    materialChange: ending.materials - starting.materials,
    energyChange: ending.energy - starting.energy,
  };
}

function projectedFeedRequired(save: GameSave): number {
  return (save.creatures ?? []).reduce((total, creature) => {
    const variant = getVariantDefinition(creature.variantId);
    const familyCost = variant.family === "bovine" || variant.family === "equine" ? 2 : 1;
    const rarityCost = variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0;
    return total + familyCost + rarityCost;
  }, 0);
}

export function buildEveningPreview(save: GameSave): RanchEveningPreview {
  const day = save.ranchDay;
  const activities = day?.activities ?? [];
  const goals = day?.goals ?? [];
  const currentFeed = readFlagNumber(save.flags.ranchFeedStock);
  const feedRequired = projectedFeedRequired(save);
  const assignments = (save.ranchJobs?.assignments ?? {}) as Record<string, string[] | undefined>;
  const securityAssigned = (assignments.security_patrol ?? []).length > 0;
  const readyEggs = (save.eggs ?? []).filter((egg) => egg.status === "ready").length;
  const warnings: string[] = [];
  if (!securityAssigned) warnings.push("No creature is assigned to Security Patrol.");
  if (currentFeed < feedRequired) warnings.push(`Projected Feed shortage: ${currentFeed} available for about ${feedRequired} required.`);
  if (readyEggs > 0) warnings.push(`${readyEggs} ready egg${readyEggs === 1 ? " remains" : "s remain"} unhatched.`);
  if (goals.some((goal) => !goal.complete)) warnings.push(`${goals.filter((goal) => !goal.complete).length} daily goal${goals.filter((goal) => !goal.complete).length === 1 ? " is" : "s are"} incomplete.`);
  const lowEnergy = (save.creatures ?? []).filter((creature) => creature.maxEnergy > 0 && creature.energy / creature.maxEnergy <= 0.2).length;
  if (lowEnergy > 0) warnings.push(`${lowEnergy} creature${lowEnergy === 1 ? " has" : "s have"} critically low Energy.`);

  return {
    generatedAt: new Date().toISOString(),
    dayNumber: save.dayState.dayNumber,
    goalsCompleted: goals.filter((goal) => goal.complete).length,
    goalsTotal: goals.length,
    activities: activities.length,
    breedingAttempts: activities.filter((item) => item.type === "breeding").length,
    purchases: activities.filter((item) => item.type === "purchase").length,
    itemsUsed: activities.filter((item) => item.type === "item-use").length,
    choreChanges: activities.filter((item) => item.type === "chore-assignment").length,
    goldChange: save.currencies.gold - (day?.startingResources.gold ?? save.currencies.gold),
    projectedFeedRequired: feedRequired,
    currentFeed,
    activePregnancies: (save.pregnancies ?? []).filter((record) => record.status === "pregnant").length,
    incubatingEggs: (save.eggs ?? []).filter((egg) => egg.status === "incubating").length,
    readyEggs,
    ranchCondition: String(save.flags.ranchConditionToday ?? "Good"),
    warnings,
  };
}

export function buildCompletedDaySummary(
  previousSave: GameSave,
  completedSave: GameSave,
  highlights: string[],
  warnings: string[],
): RanchDaySummary {
  const starting = previousSave.ranchDay?.startingResources ?? getRanchResourceSnapshot(previousSave);
  const ending = getRanchResourceSnapshot(completedSave);
  return {
    dayNumber: previousSave.dayState.dayNumber,
    completedAt: new Date().toISOString(),
    dateLabel: getRanchDayDateLabel(previousSave),
    goalsCompleted: previousSave.ranchDay?.goals.filter((goal) => goal.complete).length ?? 0,
    goalsTotal: previousSave.ranchDay?.goals.length ?? 0,
    activities: [...(previousSave.ranchDay?.activities ?? [])],
    highlights,
    warnings,
    resourceFlow: buildResourceFlow(starting, ending),
  };
}

export function buildMorningBrief(
  previousSave: GameSave,
  currentSave: GameSave,
  summary: RanchDaySummary,
  nextSteps: string[],
): RanchMorningBrief {
  const warnings = [...summary.warnings];
  const readyEggs = (currentSave.eggs ?? []).filter((egg) => egg.status === "ready").length;
  if (readyEggs > 0 && !warnings.some((item) => /ready egg/i.test(item))) warnings.push(`${readyEggs} egg${readyEggs === 1 ? " is" : "s are"} ready to hatch.`);
  return {
    generatedAt: new Date().toISOString(),
    previousDayNumber: previousSave.dayState.dayNumber,
    currentDayNumber: currentSave.dayState.dayNumber,
    dateLabel: getRanchDayDateLabel(currentSave),
    highlights: summary.highlights,
    warnings,
    nextSteps,
    moodSummary: summarizeCreatureMoods(currentSave),
    resourceFlow: summary.resourceFlow,
  };
}
