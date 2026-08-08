import * as base from "./chapterOneGuidedTutorial";
import {
  TUTORIAL_IDS,
  beginTutorialReplay,
  dismissTutorial,
  isTutorialReplayActive,
  markTutorialCompleted,
  normalizeTutorialLifecycle,
  shouldShowTutorial,
} from "./tutorialLifecycle";
import type { GameSave } from "@/types/save";

export * from "./chapterOneGuidedTutorial";
export { TUTORIAL_IDS } from "./tutorialLifecycle";

function flagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function isChapterOneGuidedTutorialActive(save: GameSave): boolean {
  if (save.flags.chapterOneGuidedReplay === true || isTutorialReplayActive(save, TUTORIAL_IDS.chapterOneGuided)) {
    return true;
  }
  if (!shouldShowTutorial(save, TUTORIAL_IDS.chapterOneGuided)) return false;
  return base.isChapterOneGuidedTutorialActive(save);
}

export function normalizeChapterOneTutorialLifecycle(save: GameSave): GameSave {
  let normalized = normalizeTutorialLifecycle(save);
  const progress = base.getChapterOneTutorialProgress(normalized);

  if (progress.firstBattleWon) {
    normalized = markTutorialCompleted(normalized, TUTORIAL_IDS.chapterOneFirstBattle);
  }
  if (
    progress.complete ||
    normalized.flags.chapterOneGuidedComplete === true ||
    normalized.flags.m15ChapterOneOnboardingComplete === true ||
    normalized.flags.m24ChapterOneStoryComplete === true
  ) {
    normalized = markTutorialCompleted(normalized, TUTORIAL_IDS.chapterOneGuided);
  }
  if (normalized.flags.chapterOneGuidedSkipped === true) {
    normalized = dismissTutorial(normalized, TUTORIAL_IDS.chapterOneGuided);
    normalized = dismissTutorial(normalized, TUTORIAL_IDS.chapterOneFirstBattle);
  }
  if (normalized.flags.chapterOneGuidedReplay === true) {
    normalized = beginTutorialReplay(normalized, TUTORIAL_IDS.chapterOneGuided);
    normalized = beginTutorialReplay(normalized, TUTORIAL_IDS.chapterOneFirstBattle);
  }

  return normalizeTutorialLifecycle(normalized);
}

export function prepareChapterOneGuidedTutorialSave(save: GameSave): GameSave {
  let prepared = base.prepareChapterOneGuidedTutorialSave(save);
  const progress = base.getChapterOneTutorialProgress(prepared);

  if (progress.firstBattleWon) {
    prepared = markTutorialCompleted(prepared, TUTORIAL_IDS.chapterOneFirstBattle);
  }
  if (progress.complete || prepared.flags.chapterOneGuidedComplete === true) {
    prepared = markTutorialCompleted(prepared, TUTORIAL_IDS.chapterOneGuided);
  }

  const stock = flagNumber(prepared.flags[base.QUICKHATCH_CATALYST_STOCK_FLAG]);
  const naturalHatchFinishedLesson =
    prepared.flags.chapterOneQuickhatchCatalystUsed !== true &&
    flagNumber(prepared.flags.m9TotalHatched) > 0;
  if (naturalHatchFinishedLesson && stock > 0) {
    prepared = {
      ...prepared,
      flags: {
        ...prepared.flags,
        [base.QUICKHATCH_CATALYST_STOCK_FLAG]: 0,
        chapterOneQuickhatchCatalystExpired: true,
      },
    };
  }

  return normalizeChapterOneTutorialLifecycle(prepared);
}

export function skipChapterOneGuidedTutorial(save: GameSave): GameSave {
  let skipped = base.skipChapterOneGuidedTutorial(save);
  skipped = dismissTutorial(skipped, TUTORIAL_IDS.chapterOneGuided);
  skipped = dismissTutorial(skipped, TUTORIAL_IDS.chapterOneFirstBattle);
  return normalizeTutorialLifecycle(skipped);
}

export function replayChapterOneGuidedTutorial(save: GameSave): GameSave {
  let replay = base.replayChapterOneGuidedTutorial(save);
  replay = beginTutorialReplay(replay, TUTORIAL_IDS.chapterOneGuided);
  replay = beginTutorialReplay(replay, TUTORIAL_IDS.chapterOneFirstBattle);
  return normalizeTutorialLifecycle(replay);
}

export function getChapterOneGuidedTutorialStep(save: GameSave): base.ChapterOneTutorialStep | null {
  if (!isChapterOneGuidedTutorialActive(save)) return null;
  const baseStep = base.getChapterOneGuidedTutorialStep(save);
  if (!baseStep || baseStep.id !== "win-first-battle") return baseStep;
  return {
    ...baseStep,
    title: "Win the Opening Scrimmage",
    body: "Enter the first authored Coliseum match. A battle coach will guide team confirmation, target-first selection, move choice, and the first round.",
    hint: "After the coached round, finish the match and record the result. A recorded victory completes the combat lesson permanently.",
    targetId: "tutorial-first-battle",
  };
}
