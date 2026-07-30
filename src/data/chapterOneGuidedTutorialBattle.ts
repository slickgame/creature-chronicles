import * as base from "./chapterOneGuidedTutorial";
import type { GameSave } from "@/types/save";

export * from "./chapterOneGuidedTutorial";

function flagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function prepareChapterOneGuidedTutorialSave(save: GameSave): GameSave {
  const prepared = base.prepareChapterOneGuidedTutorialSave(save);
  const stock = flagNumber(prepared.flags[base.QUICKHATCH_CATALYST_STOCK_FLAG]);
  const naturalHatchFinishedLesson =
    prepared.flags.chapterOneQuickhatchCatalystUsed !== true &&
    flagNumber(prepared.flags.m9TotalHatched) > 0;
  if (!naturalHatchFinishedLesson || stock <= 0) return prepared;
  return {
    ...prepared,
    flags: {
      ...prepared.flags,
      [base.QUICKHATCH_CATALYST_STOCK_FLAG]: 0,
      chapterOneQuickhatchCatalystExpired: true,
    },
  };
}

export function getChapterOneGuidedTutorialStep(save: GameSave): base.ChapterOneTutorialStep | null {
  const baseStep = base.getChapterOneGuidedTutorialStep(save);
  if (!baseStep || baseStep.id !== "win-first-battle") return baseStep;
  return {
    ...baseStep,
    title: "Win the Opening Scrimmage",
    body: "Enter the first authored Coliseum match. A battle coach will guide team confirmation, target-first selection, move choice, and the first round.",
    hint: "After the coached round, finish the match and record the result. A recorded victory completes the combat lesson.",
    targetId: "tutorial-first-battle",
  };
}
