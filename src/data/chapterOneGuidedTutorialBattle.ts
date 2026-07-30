import * as base from "./chapterOneGuidedTutorial";
import type { GameSave } from "@/types/save";

export * from "./chapterOneGuidedTutorial";

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
