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
  if (baseStep?.id === "first-pairing" && (save.creatures?.length ?? 0) < 2) return {...baseStep,title:"Find an equine partner",body:"Your ranch begins with one equine companion. Adopt a horse from Tamsin’s Adoption Hearth before the two-creature pairing lesson. Earn Gold through instant farm work and Guild deliveries; Petra unlocks other family habitats.",hint:"The Adoption Hearth always offers a horse for new ranches. The equine habitat starts with four spaces.",action:"market",actionLabel:"Visit Adoption Hearth",lockToTarget:false,targetId:undefined};
  if (!baseStep || baseStep.id !== "win-first-battle") return baseStep;
  return {
    ...baseStep,
    title: "Win the Opening Scrimmage",
    body: (save.creatures?.length ?? 0) < 3 ? "Grow your team to three creatures first: hatch equine offspring in the Nursery or adopt horses from Tamsin. Petra can unlock other family habitats. Then enter the Opening Scrimmage on the first Circuit page." : "Choose the Opening Scrimmage on the first Circuit page. Select three available creatures, then queue one move and a legal target for each living teammate. Confirm Round when all are ready.",
    hint: "Focus attacks on one enemy, use support when needed, and watch HP and Battle Energy. After winning, confirm the result ledger: only a recorded victory completes the lesson.",
    targetId: "tutorial-first-battle",
  };
}

