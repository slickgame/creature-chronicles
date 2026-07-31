import * as base from "./predatorEvents";
import { getChapterTwoAftermathBonuses } from "@/data/chapterTwoWoodlineAftermath";
import type { BattleOutcome } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export * from "./predatorEvents";

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function parseHistory(value: boolean | number | string | undefined): base.PredatorNightEvent[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.eventId === "string") : [];
  } catch {
    return [];
  }
}

export function resolvePredatorNightCheck(
  save: GameSave,
  securityScore: number,
): base.PredatorNightCheckResult {
  const bonuses = getChapterTwoAftermathBonuses(save);
  const patrolEquivalent = Math.floor(bonuses.intercept / 3);
  const result = base.resolvePredatorNightCheck(save, securityScore + patrolEquivalent);
  if (!result.event || !result.event.intercepted || bonuses.openingHpReduction <= 0) return result;

  const startingHpPercent = Math.max(35, result.event.startingHpPercent - bonuses.openingHpReduction);
  if (startingHpPercent === result.event.startingHpPercent) return result;
  const event: base.PredatorNightEvent = {
    ...result.event,
    startingHpPercent,
    summary: `${result.event.summary} Trail Wardens intelligence weakens the attackers by an additional ${bonuses.openingHpReduction}% HP.`,
  };
  const nextSave: GameSave = {
    ...result.save,
    flags: {
      ...result.save.flags,
      [base.PREDATOR_PENDING_EVENT_FLAG]: JSON.stringify(event),
      predatorBattleStartingHpPercent: startingHpPercent,
      predatorLastCheckSummary: event.summary,
    },
  };
  return {
    ...result,
    event,
    save: nextSave,
    summary: event.summary,
  };
}

export function recordPredatorBattleOutcome(
  save: GameSave,
  eventId: string,
  outcome: BattleOutcome,
  rounds: number,
  teamCreatureIds: CreatureId[],
): base.PredatorBattleResolution {
  const bonuses = getChapterTwoAftermathBonuses(save);
  const feedBefore = numberFlag(save.flags.ranchFeedStock);
  const damageBefore = numberFlag(save.flags.ranchDamage);
  const result = base.recordPredatorBattleOutcome(save, eventId, outcome, rounds, teamCreatureIds);
  if (result.duplicate || !result.event || outcome === "player_won") return result;

  const feedAfter = numberFlag(result.save.flags.ranchFeedStock);
  const damageAfter = numberFlag(result.save.flags.ranchDamage);
  const baseFeedLoss = Math.max(0, feedBefore - feedAfter);
  const baseDamageGain = Math.max(0, damageAfter - damageBefore);
  const feedRestored = Math.min(baseFeedLoss, bonuses.feedLossReduction);
  const damagePrevented = Math.min(
    baseDamageGain,
    Math.round(baseDamageGain * bonuses.damageReductionPercent / 100),
  );
  if (feedRestored <= 0 && damagePrevented <= 0) return result;

  const protection: string[] = [];
  if (feedRestored > 0) protection.push(`${feedRestored} Feed preserved`);
  if (damagePrevented > 0) protection.push(`${damagePrevented} ranch damage prevented`);
  const message = `${result.message} Improved Woodline procedures: ${protection.join(" and ")}.`;
  const event: base.PredatorNightEvent = {
    ...result.event,
    resolutionSummary: message,
  };
  const history = parseHistory(result.save.flags[base.PREDATOR_HISTORY_FLAG]).map((entry) => (
    entry.eventId === event.eventId ? event : entry
  ));
  const nextSave: GameSave = {
    ...result.save,
    flags: {
      ...result.save.flags,
      ranchFeedStock: feedAfter + feedRestored,
      ranchDamage: Math.max(0, damageAfter - damagePrevented),
      predatorLastResolutionSummary: message,
      [base.PREDATOR_LAST_EVENT_FLAG]: JSON.stringify(event),
      [base.PREDATOR_HISTORY_FLAG]: JSON.stringify(history),
      chapterTwoAftermathFeedPreservedTotal: numberFlag(result.save.flags.chapterTwoAftermathFeedPreservedTotal) + feedRestored,
      chapterTwoAftermathDamagePreventedTotal: numberFlag(result.save.flags.chapterTwoAftermathDamagePreventedTotal) + damagePrevented,
    },
  };
  return {
    ...result,
    save: nextSave,
    event,
    message,
  };
}
