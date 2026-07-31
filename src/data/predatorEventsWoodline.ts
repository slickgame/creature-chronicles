import * as aftermath from "./predatorEventsAftermath";
import { buildAuthoredColiseumEnemyTeam } from "@/data/coliseumC2";
import {
  CHAPTER_TWO_WOODLINE_HUNT_TAG,
  getChapterTwoIntoWoodlineBonuses,
  recordWoodlineExpeditionBattle,
} from "@/data/chapterTwoIntoWoodline";
import type { BattleOutcome } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export * from "./predatorEventsAftermath";

export function resolvePredatorNightCheck(
  save: GameSave,
  securityScore: number,
): aftermath.PredatorNightCheckResult {
  const bonuses = getChapterTwoIntoWoodlineBonuses(save);
  const patrolEquivalent = Math.floor(bonuses.intercept / 3);
  const result = aftermath.resolvePredatorNightCheck(save, securityScore + patrolEquivalent);
  if (!result.event || !result.event.intercepted || bonuses.openingHpReduction <= 0) return result;
  if (result.event.storyTag === CHAPTER_TWO_WOODLINE_HUNT_TAG) return result;

  const startingHpPercent = Math.max(30, result.event.startingHpPercent - bonuses.openingHpReduction);
  if (startingHpPercent === result.event.startingHpPercent) return result;
  const event: aftermath.PredatorNightEvent = {
    ...result.event,
    startingHpPercent,
    summary: `${result.event.summary} The ranger network reduces enemy starting HP by another ${bonuses.openingHpReduction}%.`,
  };
  const nextSave: GameSave = {
    ...result.save,
    flags: {
      ...result.save.flags,
      [aftermath.PREDATOR_PENDING_EVENT_FLAG]: JSON.stringify(event),
      predatorBattleStartingHpPercent: startingHpPercent,
      predatorLastCheckSummary: event.summary,
    },
  };
  return { ...result, event, save: nextSave, summary: event.summary };
}

export function getPredatorEncounterDefinition(
  save: GameSave,
  event: aftermath.PredatorNightEvent,
): ReturnType<typeof aftermath.getPredatorEncounterDefinition> {
  const definition = aftermath.getPredatorEncounterDefinition(save, event);
  if (event.storyTag !== CHAPTER_TWO_WOODLINE_HUNT_TAG) return definition;

  const [alpha, runner, guard] = definition.enemyTeam;
  const enemyTeam = [
    { ...alpha, nickname: "Ashfang", level: alpha.level + 2, roleLabel: "Deepwood Alpha" },
    { ...runner, nickname: "Briarstep", level: runner.level + 1, roleLabel: "Den Flanker" },
    { ...guard, nickname: "Old Stonejaw", level: guard.level + 1, roleLabel: "Den Guardian" },
  ] as typeof definition.enemyTeam;

  return {
    ...definition,
    name: "Chapter 2 — Into the Woodline",
    opponentName: "Ashfang's Deepwood Pack",
    description: event.summary,
    strategyLabel: `${event.startingHpPercent}% starting HP · Deepwood formation`,
    aiDifficulty: "champion",
    recommendedLevel: definition.recommendedLevel + 2,
    enemyTeam,
  };
}

export function buildPredatorEnemyTeam(
  save: GameSave,
  event: aftermath.PredatorNightEvent,
): CreatureRecord[] {
  return buildAuthoredColiseumEnemyTeam(save.saveId, getPredatorEncounterDefinition(save, event));
}

export function recordPredatorBattleOutcome(
  save: GameSave,
  eventId: string,
  outcome: BattleOutcome,
  rounds: number,
  teamCreatureIds: CreatureId[],
): aftermath.PredatorBattleResolution {
  const result = aftermath.recordPredatorBattleOutcome(save, eventId, outcome, rounds, teamCreatureIds);
  if (result.duplicate || !result.event || result.event.storyTag !== CHAPTER_TWO_WOODLINE_HUNT_TAG) return result;

  const storySave = recordWoodlineExpeditionBattle(result.save, eventId, outcome);
  return {
    ...result,
    save: storySave,
    message: `${result.message} The expedition returns to choose a permanent Woodline policy.`,
  };
}
