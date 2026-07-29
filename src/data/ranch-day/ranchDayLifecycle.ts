import { getBattleOutfitterDailySummaryItems } from "@/data/battleOutfitter";
import { buildDailyReportBundle, serializeDailyReportBundle } from "@/data/dailyReport";
import { ensureCurrentGuildState } from "@/data/guild";
import { ensureCurrentMarketState } from "@/data/market";
import { advanceNurseryDay } from "@/data/nursery";
import { processRanchJobsForNewDay } from "@/data/ranchJobs";
import { getRanchUpgradeEffects } from "@/data/ranchUpgrades";
import { applyStarterGoalRewards } from "@/data/starterGoals";
import { processMonthlyTaxes } from "@/data/taxes";
import { getTrainingReturnSummaryItems, getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { formatGameDate } from "@/lib/formatters";
import {
  abortSaveTransaction,
  beginSaveTransaction,
  tagSaveTransaction,
} from "@/lib/save/saveReliability";
import type { RanchJobResult } from "@/types/ranchJobs";
import type { DayState, GameSave } from "@/types/save";
import { updateDailyGoalsAndRewards } from "./ranchDayGoals";
import { normalizeRanchDaySave, createRanchDayState } from "./ranchDayState";
import { buildCompletedDaySummary, buildMorningBrief } from "./ranchDaySummary";

const WEEKDAYS: DayState["weekday"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type RanchDayAdvanceResult = {
  previousDateLabel: string;
  nextDateLabel: string;
  summaryItems: string[];
  ranchJobResults: RanchJobResult[];
};

export type RanchDayAdvanceBundle = {
  save: GameSave;
  result: RanchDayAdvanceResult;
};

function nextDayState(dayState: DayState): DayState {
  const currentWeekdayIndex = WEEKDAYS.indexOf(dayState.weekday);
  const nextWeekdayIndex = (currentWeekdayIndex + 1) % WEEKDAYS.length;
  return {
    dayNumber: dayState.dayNumber + 1,
    weekday: WEEKDAYS[nextWeekdayIndex],
    month: dayState.dayOfMonth >= 30 ? dayState.month + 1 : dayState.month,
    dayOfMonth: dayState.dayOfMonth >= 30 ? 1 : dayState.dayOfMonth + 1,
    weekNumber: nextWeekdayIndex === 0 ? dayState.weekNumber + 1 : dayState.weekNumber,
  };
}

export function advanceRanchDay(save: GameSave): RanchDayAdvanceBundle | null {
  const normalized = normalizeRanchDaySave(save);
  if (!normalized.ranchDay || normalized.ranchDay.phase !== "evening") return null;
  const transaction = beginSaveTransaction(
    normalized,
    "day-end",
    `${normalized.saveId}:day-end:${normalized.dayState.dayNumber}`,
  );

  try {
    const previousSave = updateDailyGoalsAndRewards(normalized);
    const previousDateLabel = formatGameDate(previousSave.dayState.weekday, previousSave.dayState.month, previousSave.dayState.dayOfMonth);
    const nextState = nextDayState(previousSave.dayState);
    const nextDateLabel = formatGameDate(nextState.weekday, nextState.month, nextState.dayOfMonth);
    const recovery = getRanchUpgradeEffects(previousSave);

    const restoredSave: GameSave = {
      ...previousSave,
      updatedAt: new Date().toISOString(),
      dayState: nextState,
      player: { ...previousSave.player, hearts: previousSave.player.maxHearts ?? 4 },
      currencies: { ...previousSave.currencies, energy: previousSave.currencies.maxEnergy },
      creatures: (previousSave.creatures ?? []).map((creature) => getTrainingUnavailableReason(previousSave, creature.creatureId) ? creature : ({
        ...creature,
        energy: creature.maxEnergy + recovery.sleepCreatureEnergyBonus,
        hearts: creature.maxHearts ?? 4,
        affection: Math.min(100, creature.affection + recovery.sleepAffectionBonus),
      })),
      flags: {
        ...previousSave.flags,
        lastSleptDayNumber: nextState.dayNumber,
        m2SleepUsed: true,
        m11SleepRecoveryApplied: recovery.sleepCreatureEnergyBonus > 0 || recovery.sleepAffectionBonus > 0,
        m47TrainingAvailability: true,
        m60RanchDayLoop: true,
      },
    };

    const nurseryResult = advanceNurseryDay(restoredSave);
    const marketSyncedSave = ensureCurrentMarketState(nurseryResult.save);
    const guildSyncedSave = ensureCurrentGuildState(marketSyncedSave);
    const jobResult = processRanchJobsForNewDay(guildSyncedSave);

    const goalEvaluationInput: GameSave = {
      ...jobResult.save,
      dayState: previousSave.dayState,
      ranchDay: previousSave.ranchDay,
    };
    const goalEvaluated = updateDailyGoalsAndRewards(goalEvaluationInput);
    const returnedToNextDay: GameSave = { ...goalEvaluated, dayState: nextState };
    const rewardedSave = applyStarterGoalRewards(returnedToNextDay);
    const trainingReturnItems = getTrainingReturnSummaryItems(rewardedSave);
    const battleReadinessItems = getBattleOutfitterDailySummaryItems(rewardedSave);
    const taxResult = processMonthlyTaxes(rewardedSave, previousSave);
    const dailyReport = buildDailyReportBundle(taxResult.save, jobResult.results);
    const reportSave: GameSave = {
      ...taxResult.save,
      flags: {
        ...taxResult.save.flags,
        ...serializeDailyReportBundle(dailyReport),
      },
    };

    const summaryItems = [
      `Advanced from ${previousDateLabel} to ${nextDateLabel}.`,
      `Energy recovery processed for Ranch Day ${nextState.dayNumber}.`,
      "Player Hearts restored to full.",
      recovery.sleepCreatureEnergyBonus || recovery.sleepAffectionBonus
        ? `Ranch recovery bonus applied: +${recovery.sleepCreatureEnergyBonus} creature Energy buffer, +${recovery.sleepAffectionBonus} Affection.`
        : "Creature Energy and Hearts recovery processed.",
      ...trainingReturnItems,
      ...battleReadinessItems,
      ...(nurseryResult.summaryItems.length ? nurseryResult.summaryItems : ["No active pregnancy or egg timers advanced today."]),
      ...(jobResult.results.length ? jobResult.results.map((result) => result.message) : ["No ranch chore assignments resolved today."]),
      ...dailyReport.summaryItems,
      ...taxResult.summaryItems,
    ];
    if (nextState.weekday === "Mon") summaryItems.push("New week started. Vale's Adoption Hearth and the Guild board have fresh listings.");

    const completedSummary = buildCompletedDaySummary(
      previousSave,
      reportSave,
      dailyReport.highlights,
      dailyReport.warnings,
    );
    const nextDayShell = createRanchDayState(reportSave, "morning");
    const nextSaveWithDay: GameSave = {
      ...reportSave,
      ranchDay: {
        ...nextDayShell,
        lastCompletedSummary: completedSummary,
      },
    };
    const morningBrief = buildMorningBrief(previousSave, nextSaveWithDay, completedSummary, dailyReport.nextSteps);
    const finalSave: GameSave = {
      ...nextSaveWithDay,
      ranchDay: {
        ...nextSaveWithDay.ranchDay!,
        morningBrief,
      },
      saveReliability: {
        ...(nextSaveWithDay.saveReliability ?? {}),
        lastAutosaveAt: new Date().toISOString(),
        lastAutosaveReason: "day-end",
      },
      flags: {
        ...nextSaveWithDay.flags,
        m60RanchMorningBrief: true,
        m60RanchEveningReview: true,
        lastCompletedRanchDay: previousSave.dayState.dayNumber,
        lastRanchDaySummary: JSON.stringify(completedSummary),
      },
    };

    return {
      save: tagSaveTransaction(finalSave, transaction, `ranch-day-${previousSave.dayState.dayNumber}`),
      result: { previousDateLabel, nextDateLabel, summaryItems, ranchJobResults: jobResult.results },
    };
  } catch (error) {
    abortSaveTransaction(transaction);
    throw error;
  }
}
