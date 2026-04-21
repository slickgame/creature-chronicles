"use client";

import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";

function getLocationLabel(location: string) {
  if (location === "ranch") return "Ranch";
  if (location === "town") return "Town";
  if (location === "market") return "Market";
  if (location === "guild_hall") return "Guild Hall";
  return "Home";
}

export default function MainStoryPanel() {
  const {
    mainStory,
    currentMainStoryChapter,
    currentMainStoryObjective,
    mainStoryChapterProgress,
    dismissMainStoryReward,
  } = useGame();

  const reward = mainStory.latestReward;
  const rewardItems = reward?.items
    .map((item) => `${ITEM_DATA[item.itemId]?.name ?? item.itemId} x${item.quantity}`)
    .join(", ");

  return (
    <section className="rounded-3xl border-4 border-indigo-950 bg-white/90 p-5 shadow-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-indigo-700">
            Main Story - Chapter {currentMainStoryChapter.chapterNumber}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">
            {currentMainStoryChapter.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-indigo-900">
            {currentMainStoryChapter.subtitle}
          </p>
          <p className="mt-2 max-w-3xl text-sm text-stone-700">
            {currentMainStoryChapter.summary}
          </p>
        </div>

        <div className="min-w-[180px] rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950">
          <p className="font-bold">
            {mainStoryChapterProgress.completedSteps}/{mainStoryChapterProgress.totalSteps} steps
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-indigo-700"
              style={{ width: `${mainStoryChapterProgress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold">
            {mainStoryChapterProgress.isComplete ? "Chapter complete" : `${mainStoryChapterProgress.percent}% complete`}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-800">Current Objective</p>
            <h3 className="text-xl font-bold text-stone-950">
              {currentMainStoryObjective.title}
            </h3>
          </div>
          <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-900">
            {getLocationLabel(currentMainStoryObjective.locationHint)}
          </span>
        </div>
        <p className="mt-2 text-sm text-stone-700">
          {mainStoryChapterProgress.isComplete
            ? currentMainStoryChapter.nextChapterHint
            : currentMainStoryObjective.description}
        </p>
        {currentMainStoryObjective.rewardPreview && !mainStoryChapterProgress.isComplete ? (
          <p className="mt-2 text-xs font-semibold text-amber-900">
            {currentMainStoryObjective.rewardPreview}
          </p>
        ) : null}
      </div>

      {reward ? (
        <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-stone-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-800">Reward Unlocked</p>
              <h3 className="text-lg font-bold text-stone-950">{reward.title}</h3>
              <p className="mt-1">{reward.description}</p>
              <p className="mt-2 font-semibold">
                {reward.gold} Gold{rewardItems ? ` - ${rewardItems}` : ""}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-900">
                {reward.unlockText}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissMainStoryReward}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow"
            >
              Noted
            </button>
          </div>
        </div>
      ) : null}

      {mainStory.completedChapterLog.length > 0 ? (
        <div className="mt-4 text-xs font-semibold text-stone-600">
          Completed:{" "}
          {mainStory.completedChapterLog
            .map((entry) => `${entry.title} on Day ${entry.completedDay}`)
            .join(" - ")}
        </div>
      ) : null}
    </section>
  );
}
