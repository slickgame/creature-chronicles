"use client";

import { useGame } from "@/context/GameContext";
import {
  getObjectiveWhyItMatters,
  getQuestObjectiveDisplayHint,
} from "@/lib/world/worldDisplay";

function getLocationLabel(location: string) {
  if (location === "ranch") return "Ranch";
  if (location === "town") return "Town";
  if (location === "market") return "Market";
  if (location === "guild_hall") return "Guild Hall";
  return "Home";
}

export default function StoryObjectiveStrip() {
  const {
    currentMainStoryChapter,
    currentMainStoryObjective,
    mainStoryChapterProgress,
    latestActionResult,
  } = useGame();
  const objectiveHint = getQuestObjectiveDisplayHint(currentMainStoryObjective.id);
  const whyItMatters = getObjectiveWhyItMatters(currentMainStoryObjective.id);

  return (
    <section className="rounded-2xl border-2 border-indigo-900 bg-white/92 p-3 shadow-lg">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase text-indigo-700">
            Chapter {currentMainStoryChapter.chapterNumber} - {currentMainStoryChapter.title}
          </p>
          <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="min-w-0 truncate text-base font-bold text-stone-950 sm:text-lg">
              {currentMainStoryObjective.title}
            </h2>
            <span className="w-fit rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
              {getLocationLabel(currentMainStoryObjective.locationHint)}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 max-w-5xl text-sm text-stone-700">
            {currentMainStoryObjective.description}
          </p>
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-indigo-900">
            Go to: {objectiveHint.where}
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-stone-600">
            Why: {whyItMatters}
          </p>
          {latestActionResult?.storyProgress.length ? (
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-emerald-800">
              Progress Triggered: {latestActionResult.storyProgress.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-950 sm:w-44">
          <p className="font-bold">
            {mainStoryChapterProgress.completedSteps}/{mainStoryChapterProgress.totalSteps} steps
          </p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-indigo-700"
              style={{ width: `${mainStoryChapterProgress.percent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
