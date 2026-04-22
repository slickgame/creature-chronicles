"use client";

import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";

function getLocationLabel(location: string) {
  if (location === "ranch") return "Ranch";
  if (location === "town") return "Town";
  if (location === "market") return "Market";
  if (location === "guild_hall") return "Guild Hall";
  return "Home";
}

function formatRewardItems(items: Array<{ itemId: string; quantity: number }>) {
  return items
    .map((item) => `${ITEM_DATA[item.itemId]?.name ?? item.itemId} x${item.quantity}`)
    .join(", ");
}

export default function StoryJournal() {
  const {
    mainStory,
    mainStoryChapters,
    currentMainStoryChapter,
    currentMainStoryObjective,
    mainStoryChapterProgress,
  } = useGame();
  const [open, setOpen] = useState(false);

  const completedByChapter = new Map(
    mainStory.completedChapterLog.map((entry) => [entry.chapterId, entry])
  );
  const completedCount = mainStory.completedChapterLog.length;

  return (
    <section className="rounded-3xl border-4 border-stone-900 bg-white/90 p-5 shadow-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-stone-600">Story Journal</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Chapter Archive</h2>
          <p className="mt-2 max-w-3xl text-sm text-stone-700">
            Current: Chapter {currentMainStoryChapter.chapterNumber}, {currentMainStoryChapter.title}.{" "}
            {mainStoryChapterProgress.completedSteps}/{mainStoryChapterProgress.totalSteps} active steps complete.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow"
        >
          {open ? "Hide Journal" : "Open Journal"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-xs font-bold uppercase text-indigo-800">Current Chapter</p>
          <p className="mt-1 font-bold text-stone-950">{currentMainStoryChapter.title}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold uppercase text-amber-800">Current Objective</p>
          <p className="mt-1 font-bold text-stone-950">{currentMainStoryObjective.title}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-bold uppercase text-emerald-800">Completed Chapters</p>
          <p className="mt-1 font-bold text-stone-950">{completedCount}</p>
        </div>
      </div>

      {open ? (
        <div className="mt-4 grid gap-4">
          {mainStoryChapters.map((chapter) => {
            const completedEntry = completedByChapter.get(chapter.id);
            const isCurrent = chapter.id === mainStory.currentChapterId;
            const chapterComplete = chapter.objectives.every(
              (objective) => mainStory.chapterProgressFlags[objective.completionFlag]
            );
            const completedSteps = chapter.objectives.filter(
              (objective) => mainStory.chapterProgressFlags[objective.completionFlag]
            ).length;
            const rewardItems = formatRewardItems(chapter.completionReward.items);

            return (
              <article
                key={chapter.id}
                className={`rounded-2xl border p-4 ${
                  isCurrent
                    ? "border-indigo-300 bg-indigo-50"
                    : chapterComplete
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-stone-200 bg-stone-50"
                }`}
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-stone-600">
                      Chapter {chapter.chapterNumber}
                    </p>
                    <h3 className="text-xl font-bold text-stone-950">{chapter.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-stone-700">{chapter.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-stone-700">
                    {completedEntry
                      ? `Completed Day ${completedEntry.completedDay}`
                      : isCurrent
                        ? "Current"
                        : "Upcoming"}
                  </span>
                </div>

                <p className="mt-3 text-sm text-stone-700">{chapter.summary}</p>

                <div className="mt-3 rounded-xl border border-white bg-white/80 p-3 text-sm text-stone-800">
                  <p className="font-bold text-stone-950">Reward</p>
                  <p className="mt-1">
                    {chapter.completionReward.gold} Gold{rewardItems ? ` - ${rewardItems}` : ""}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-stone-600">
                    {completedEntry ? `Unlocked: ${completedEntry.rewardTitle}` : chapter.completionReward.unlockText}
                  </p>
                </div>

                <div className="mt-3 grid gap-2">
                  {chapter.objectives.map((objective, index) => {
                    const done = Boolean(mainStory.chapterProgressFlags[objective.completionFlag]);
                    const active = isCurrent && objective.id === currentMainStoryObjective.id && !chapterComplete;

                    return (
                      <div
                        key={`${chapter.id}-${objective.id}`}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          done
                            ? "border-emerald-200 bg-white text-emerald-950"
                            : active
                              ? "border-amber-300 bg-amber-50 text-amber-950"
                              : "border-white bg-white/70 text-stone-700"
                        }`}
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-semibold">
                            {index + 1}. {objective.title}
                          </p>
                          <span className="text-xs font-bold">
                            {done ? "Done" : active ? "Now" : getLocationLabel(objective.locationHint)}
                          </span>
                        </div>
                        {(active || done) && objective.description ? (
                          <p className="mt-1 text-xs">{objective.description}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs font-semibold text-stone-600">
                  Progress: {completedSteps}/{chapter.objectives.length} steps
                </p>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
