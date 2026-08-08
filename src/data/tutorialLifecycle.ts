import { getColiseumProgress } from "@/data/coliseum";
import { TUTORIAL_LIFECYCLE_VERSION, type TutorialLifecycleState } from "@/types/tutorial";
import type { GameSave } from "@/types/save";

export const TUTORIAL_IDS = {
  chapterOneGuided: "chapter-one-guided",
  chapterOneFirstBattle: "chapter-one-first-battle",
} as const;

const MAX_TUTORIAL_HISTORY = 256;

function uniqueIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const ids = values
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  return Array.from(new Set(ids)).slice(-MAX_TUTORIAL_HISTORY);
}

function hasLegacyChapterOneCompletion(save: GameSave): boolean {
  return save.flags.chapterOneGuidedComplete === true ||
    save.flags.m15ChapterOneOnboardingComplete === true ||
    save.flags.m24ChapterOneStoryComplete === true;
}

function hasLegacyFirstBattleCompletion(save: GameSave): boolean {
  return save.flags.chapterOneFirstBattleWon === true ||
    save.flags.m62FirstBattleWon === true ||
    getColiseumProgress(save).totalWins > 0;
}

function legacyState(save: GameSave): TutorialLifecycleState {
  const completedIds: string[] = [];
  const dismissedIds: string[] = [];
  const replayIds: string[] = [];

  if (hasLegacyChapterOneCompletion(save)) completedIds.push(TUTORIAL_IDS.chapterOneGuided);
  if (hasLegacyFirstBattleCompletion(save)) completedIds.push(TUTORIAL_IDS.chapterOneFirstBattle);

  if (save.flags.chapterOneGuidedSkipped === true) {
    dismissedIds.push(TUTORIAL_IDS.chapterOneGuided, TUTORIAL_IDS.chapterOneFirstBattle);
  }
  if (save.flags.chapterOneGuidedReplay === true) {
    replayIds.push(TUTORIAL_IDS.chapterOneGuided, TUTORIAL_IDS.chapterOneFirstBattle);
  }

  return {
    version: TUTORIAL_LIFECYCLE_VERSION,
    completedIds,
    dismissedIds,
    replayIds,
  };
}

export function getTutorialLifecycleState(save: GameSave): TutorialLifecycleState {
  const persisted = save.tutorials;
  const legacy = legacyState(save);
  return {
    version: TUTORIAL_LIFECYCLE_VERSION,
    completedIds: uniqueIds([
      ...(persisted?.completedIds ?? []),
      ...legacy.completedIds,
    ]),
    dismissedIds: uniqueIds([
      ...(persisted?.dismissedIds ?? []),
      ...legacy.dismissedIds,
    ]),
    replayIds: uniqueIds([
      ...(persisted?.replayIds ?? []),
      ...legacy.replayIds,
    ]),
  };
}

export function normalizeTutorialLifecycle(save: GameSave): GameSave {
  const tutorials = getTutorialLifecycleState(save);
  const current = save.tutorials;
  if (
    current?.version === tutorials.version &&
    JSON.stringify(current.completedIds ?? []) === JSON.stringify(tutorials.completedIds) &&
    JSON.stringify(current.dismissedIds ?? []) === JSON.stringify(tutorials.dismissedIds) &&
    JSON.stringify(current.replayIds ?? []) === JSON.stringify(tutorials.replayIds)
  ) {
    return save;
  }
  return { ...save, tutorials };
}

export function isTutorialCompleted(save: GameSave, tutorialId: string): boolean {
  return getTutorialLifecycleState(save).completedIds.includes(tutorialId);
}

export function isTutorialDismissed(save: GameSave, tutorialId: string): boolean {
  return getTutorialLifecycleState(save).dismissedIds.includes(tutorialId);
}

export function isTutorialReplayActive(save: GameSave, tutorialId: string): boolean {
  return getTutorialLifecycleState(save).replayIds.includes(tutorialId);
}

export function shouldShowTutorial(save: GameSave, tutorialId: string): boolean {
  if (isTutorialReplayActive(save, tutorialId)) return true;
  return !isTutorialCompleted(save, tutorialId) && !isTutorialDismissed(save, tutorialId);
}

function writeLifecycle(save: GameSave, updater: (state: TutorialLifecycleState) => TutorialLifecycleState): GameSave {
  const state = getTutorialLifecycleState(save);
  return { ...save, tutorials: updater(state) };
}

export function markTutorialCompleted(save: GameSave, tutorialId: string): GameSave {
  if (isTutorialCompleted(save, tutorialId) && !isTutorialReplayActive(save, tutorialId)) return normalizeTutorialLifecycle(save);
  return writeLifecycle(save, (state) => ({
    ...state,
    completedIds: uniqueIds([...state.completedIds, tutorialId]),
    dismissedIds: state.dismissedIds.filter((id) => id !== tutorialId),
    replayIds: state.replayIds.filter((id) => id !== tutorialId),
  }));
}

export function dismissTutorial(save: GameSave, tutorialId: string): GameSave {
  if (isTutorialDismissed(save, tutorialId) && !isTutorialReplayActive(save, tutorialId)) return normalizeTutorialLifecycle(save);
  return writeLifecycle(save, (state) => ({
    ...state,
    dismissedIds: uniqueIds([...state.dismissedIds, tutorialId]),
    replayIds: state.replayIds.filter((id) => id !== tutorialId),
  }));
}

export function beginTutorialReplay(save: GameSave, tutorialId: string): GameSave {
  return writeLifecycle(save, (state) => ({
    ...state,
    replayIds: uniqueIds([...state.replayIds, tutorialId]),
  }));
}

export function clearTutorialReplay(save: GameSave, tutorialId: string): GameSave {
  return writeLifecycle(save, (state) => ({
    ...state,
    replayIds: state.replayIds.filter((id) => id !== tutorialId),
  }));
}
