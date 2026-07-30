import * as base from "./chapterOneGuidedTutorial";
import type { GameSave } from "@/types/save";

export * from "./chapterOneGuidedTutorial";

export function getChapterOneGuidedTutorialStep(save: GameSave): base.ChapterOneTutorialStep | null {
  const baseStep = base.getChapterOneGuidedTutorialStep(save);
  const progress = base.getChapterOneTutorialProgress(save);
  if (!baseStep || !progress.battleOutfitterOpened || progress.firstBattleWon) return baseStep;
  return {
    id: "win-first-battle",
    dayLabel: "Day 5 — First Battle",
    title: "Win the Opening Scrimmage",
    body: "Enter the first authored Coliseum match. A battle coach will guide team confirmation, target-first selection, move choice, and the first round.",
    hint: "After the coached round, finish the match and record the result. A recorded victory completes the combat lesson.",
    action: "coliseum",
    actionLabel: "Enter the Coliseum",
    targetId: "tutorial-first-battle",
  };
}
