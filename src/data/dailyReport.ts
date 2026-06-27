import type { RanchJobResult } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

function readNumber(value: boolean | number | string | undefined, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function readString(value: boolean | number | string | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export type DailyReportBundle = {
  highlights: string[];
  warnings: string[];
  nextSteps: string[];
  summaryItems: string[];
};

export function buildDailyReportBundle(save: GameSave, jobResults: RanchJobResult[]): DailyReportBundle {
  const feedProduced = readNumber(save.flags.ranchFeedProducedToday);
  const feedRequired = readNumber(save.flags.ranchFeedRequiredToday);
  const feedConsumed = readNumber(save.flags.ranchFeedConsumedToday);
  const feedStock = readNumber(save.flags.ranchFeedStock);
  const materialsProduced = readNumber(save.flags.ranchMaterialsProducedToday);
  const materialsStock = readNumber(save.flags.ranchMaterialsStock);
  const damage = readNumber(save.flags.ranchDamage);
  const damageAdded = readNumber(save.flags.ranchDamageAddedToday);
  const damageRepaired = readNumber(save.flags.ranchDamageRepairedToday);
  const securityScore = readNumber(save.flags.ranchSecurityScoreToday);
  const dangerChance = readNumber(save.flags.ranchSecurityDangerChanceToday);
  const comfortBonus = readNumber(save.flags.ranchBreedingComfortBonusToday);
  const upkeepScore = readNumber(save.flags.ranchUpkeepScoreToday);
  const foodStatus = readString(save.flags.ranchFoodStatus, "Unknown");
  const condition = readString(save.flags.ranchConditionToday, "Good");
  const taxDue = readNumber(save.flags.taxCurrentMonthDue);
  const taxDays = readNumber(save.flags.taxDaysUntilDue, 30);
  const readyEggs = (save.eggs ?? []).filter((egg) => egg.status === "ready").length;
  const incubatingEggs = (save.eggs ?? []).filter((egg) => egg.status === "incubating").length;
  const injuredCreatures = (save.creatures ?? []).filter((creature) => typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= save.dayState.dayNumber);
  const tiredCreatures = (save.creatures ?? []).filter((creature) => creature.energy < Math.max(12, Math.floor(creature.maxEnergy * 0.25)));
  const highlights: string[] = [];
  const warnings: string[] = [];
  const nextSteps: string[] = [];

  highlights.push(`Chores completed: ${jobResults.length}. Feed +${feedProduced}, Materials +${materialsProduced}.`);
  highlights.push(`Ranch condition: ${condition} (${damage}/100 damage). Damage +${damageAdded}, repairs -${damageRepaired}.`);
  if (securityScore > 0) highlights.push(`Security Patrol scored ${securityScore}, leaving danger around ${dangerChance}%.`);
  if (comfortBonus > 0) highlights.push(`Comfort Care created a +${comfortBonus}% breeding comfort bonus for today.`);
  if (upkeepScore > 0) highlights.push(`Field Hauling created ${upkeepScore} upkeep score and ${materialsStock} total Materials.`);
  if (readyEggs > 0) highlights.push(`${readyEggs} egg${readyEggs === 1 ? " is" : "s are"} ready to hatch.`);
  else if (incubatingEggs > 0) highlights.push(`${incubatingEggs} egg${incubatingEggs === 1 ? " is" : "s are"} still incubating.`);

  if (foodStatus !== "Fed") warnings.push(`Food status is ${foodStatus}: ${feedConsumed}/${feedRequired} Feed consumed, ${feedStock} left.`);
  if (securityScore <= 0) warnings.push("No Security Patrol resolved overnight. Danger remains high until a guard is assigned.");
  if (upkeepScore <= 0) warnings.push("No Field Hauling resolved overnight. Routine ranch wear can build up without upkeep.");
  if (damage >= 50) warnings.push(`Ranch damage is ${damage}/100. Repair or assign hauling before condition penalties get worse.`);
  if (injuredCreatures.length) warnings.push(`${injuredCreatures.length} creature${injuredCreatures.length === 1 ? " is" : "s are"} injured and unavailable for some work.`);
  if (tiredCreatures.length) warnings.push(`${tiredCreatures.length} creature${tiredCreatures.length === 1 ? " is" : "s are"} very tired after recovery.`);
  if (taxDue > 0 && taxDays <= 7) warnings.push(`Tax pressure: ${taxDue} Gold due in ${taxDays} day${taxDays === 1 ? "" : "s"}.`);

  if (readyEggs > 0) nextSteps.push("Open the Nursery and hatch ready eggs before starting more incubation pressure.");
  if (feedStock < Math.max(10, feedRequired)) nextSteps.push("Run Stable Production or Garden Tending today to rebuild Feed stock.");
  if (securityScore <= 0) nextSteps.push("Assign a canine or strong guard to Security Patrol before sleeping again.");
  if (damage >= 20 || upkeepScore <= 0) nextSteps.push("Assign an equine-style helper to Field Hauling or repair from the Ranch Office.");
  if (comfortBonus <= 0) nextSteps.push("Assign a feline-style helper to Comfort Care if breeding is part of today's plan.");
  if (!nextSteps.length) nextSteps.push("Ranch pressure is stable. Use the day for breeding, market scouting, upgrades, or collection planning.");

  const summaryItems = [
    "Daily Report Highlights:",
    ...highlights.map((item) => `• ${item}`),
    warnings.length ? "Daily Report Warnings:" : "Daily Report Warnings: none.",
    ...warnings.map((item) => `• ${item}`),
    "Veyra's Suggested Next Steps:",
    ...nextSteps.map((item) => `• ${item}`),
  ];
  return { highlights, warnings, nextSteps, summaryItems };
}

export function serializeDailyReportBundle(bundle: DailyReportBundle): Record<string, string | number | boolean> {
  return {
    m21DailyReportUpgrade: true,
    dailyReportHighlights: JSON.stringify(bundle.highlights),
    dailyReportWarnings: JSON.stringify(bundle.warnings),
    dailyReportNextSteps: JSON.stringify(bundle.nextSteps),
    dailyReportPrimaryNextStep: bundle.nextSteps[0] ?? "Review the ranch.",
    dailyReportWarningCount: bundle.warnings.length,
    dailyReportHighlightCount: bundle.highlights.length,
  };
}
