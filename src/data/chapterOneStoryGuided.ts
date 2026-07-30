import * as base from "./chapterOneStory";
import { getChapterOneTutorialProgress } from "./chapterOneGuidedTutorial";
import { getStarterGoals } from "./starterGoals";
import type { GameSave } from "@/types/save";

export * from "./chapterOneStory";

const STORY_MILESTONE_GOAL_IDS = new Set([
  "resolve-chores",
  "produce-feed",
  "gather-materials",
  "breed",
  "egg",
  "guild",
]);

export function getChapterOneGoalScene(save: GameSave): base.StoryScene | null {
  const goal = getStarterGoals(save).find(
    (candidate) =>
      STORY_MILESTONE_GOAL_IDS.has(candidate.id) &&
      candidate.complete &&
      save.flags[base.getGoalStoryFlag(candidate)] !== true,
  );
  return goal ? base.buildGoalStoryScene(goal) : null;
}

export function getChapterOneCompletionScene(save: GameSave): base.StoryScene | null {
  const guidedComplete = getChapterOneTutorialProgress(save).complete;
  const legacyComplete = getStarterGoals(save).every((goal) => goal.complete);
  if ((!guidedComplete && !legacyComplete) || save.flags.m24ChapterOneStoryComplete === true) return null;
  return base.buildChapterOneCompletionScene();
}

export function getNextChapterOneStoryScene(save: GameSave): base.StoryScene | null {
  return base.getChapterOneIntroScene(save) ?? getChapterOneCompletionScene(save) ?? getChapterOneGoalScene(save);
}

export function getChapterOneStoryLog(save: GameSave): base.StoryLogEntry[] {
  const progress = getChapterOneTutorialProgress(save);
  return base.getChapterOneStoryLog(save).map((entry) => {
    if (entry.id !== "chapter-one-complete") return entry;
    return {
      ...entry,
      lockedReason: progress.complete
        ? undefined
        : "Complete the guided ranch loop, first Guild request, first hatch, item lesson, and first battle.",
    };
  });
}
