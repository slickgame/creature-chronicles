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

function formatStatus(status: string) {
  if (status === "available") return "Available";
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  return "Locked";
}

function formatQuestCategory(category: string) {
  if (category === "main_story") return "Main Story";
  if (category === "side_quest") return "Side Quest";
  if (category === "faction_quest") return "Faction Quest";
  return "Regional Assignment";
}

function formatSimpleItems(items: Array<{ itemId: string; quantity: number }>) {
  if (items.length === 0) return "No item reward";
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
    authoredQuests,
    factions,
    worldRegions,
  } = useGame();
  const [open, setOpen] = useState(false);

  const completedByChapter = new Map(
    mainStory.completedChapterLog.map((entry) => [entry.chapterId, entry])
  );
  const completedCount = mainStory.completedChapterLog.length;
  const visibleQuestCount = authoredQuests.filter((quest) => quest.status !== "locked").length;
  const visibleFactionCount = factions.filter((faction) => faction.status !== "locked").length;
  const availableRegionCount = worldRegions.filter((region) => region.status !== "locked").length;

  return (
    <section className="rounded-3xl border-4 border-stone-900 bg-white/90 p-5 shadow-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-stone-600">Story Journal</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Chapter Archive & World</h2>
          <p className="mt-2 max-w-3xl text-sm text-stone-700">
            Current: Chapter {currentMainStoryChapter.chapterNumber}, {currentMainStoryChapter.title}.{" "}
            {mainStoryChapterProgress.completedSteps}/{mainStoryChapterProgress.totalSteps} active steps complete.
            {" "}The wider quest, faction, and region framework is now tracked here for future chapters.
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

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
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
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-xs font-bold uppercase text-sky-800">Authored Quests</p>
          <p className="mt-1 font-bold text-stone-950">{visibleQuestCount}/{authoredQuests.length} visible</p>
        </div>
        <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-3">
          <p className="text-xs font-bold uppercase text-fuchsia-800">Factions</p>
          <p className="mt-1 font-bold text-stone-950">{visibleFactionCount}/{factions.length} known</p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3">
          <p className="text-xs font-bold uppercase text-teal-800">Regions</p>
          <p className="mt-1 font-bold text-stone-950">{availableRegionCount}/{worldRegions.length} open</p>
        </div>
      </div>

      {open ? (
        <div className="mt-4 grid gap-4">
          <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-sky-800">Quest Framework</p>
                <h3 className="text-xl font-bold text-stone-950">Authored Quest Ledger</h3>
                <p className="mt-1 text-sm text-stone-700">
                  These are authored quest foundations, separate from repeatable town boards and NPC request loops.
                </p>
              </div>
              <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-sky-900">
                {authoredQuests.length} quest hooks
              </span>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {authoredQuests.map((quest) => {
                const completedObjectives = quest.objectives.filter((objective) => objective.completed).length;

                return (
                  <div key={quest.id} className="rounded-2xl border border-white bg-white/85 p-3 text-sm text-stone-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-sky-800">
                          {formatQuestCategory(quest.category)}
                        </p>
                        <p className="font-bold text-stone-950">{quest.title}</p>
                      </div>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-900">
                        {formatStatus(quest.status)}
                      </span>
                    </div>
                    <p className="mt-2">{quest.description}</p>
                    <p className="mt-2 text-xs font-semibold text-stone-600">
                      Source: {quest.source.name}
                    </p>
                    {quest.gate ? (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                        Gate: {quest.gate.note}
                      </p>
                    ) : null}
                    <div className="mt-3 grid gap-2">
                      {quest.objectives.map((objective) => (
                        <div
                          key={`${quest.id}-${objective.id}`}
                          className={`rounded-lg px-3 py-2 text-xs ${
                            objective.completed
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-950"
                              : "bg-sky-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-stone-900">{objective.title}</p>
                            <span className="font-bold">
                              {objective.completed ? "Done" : quest.status === "locked" ? "Locked" : "Open"}
                            </span>
                          </div>
                          <p className="mt-1">{objective.description}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs font-semibold text-stone-600">
                      Progress: {completedObjectives}/{quest.objectives.length} objectives
                    </p>
                    <p className="mt-1 text-xs font-semibold text-sky-900">
                      Reward hooks: {quest.rewardSummary}
                    </p>
                    <div className="mt-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-stone-700">
                      <p><strong>Reward:</strong> {quest.reward.gold} Gold, {formatSimpleItems(quest.reward.items)}</p>
                      {quest.reward.factionReputation.length > 0 ? (
                        <p>
                          <strong>Faction consequence:</strong>{" "}
                          {quest.reward.factionReputation
                            .map((reward) => `+${reward.amount} ${reward.factionId}${reward.standing ? ` to ${reward.standing}` : ""}`)
                            .join(", ")}
                        </p>
                      ) : null}
                      {quest.reward.unlockRegions.length > 0 ? (
                        <p><strong>Region unlock:</strong> {quest.reward.unlockRegions.join(", ")}</p>
                      ) : null}
                      {quest.status === "completed" ? (
                        <p className="mt-1 font-semibold text-emerald-800">{quest.reward.summary}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
            <p className="text-xs font-bold uppercase text-fuchsia-800">Faction Scaffolding</p>
            <h3 className="text-xl font-bold text-stone-950">Organizations Watching the Ranch</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {factions.map((faction) => (
                <div key={faction.id} className="rounded-2xl border border-white bg-white/85 p-3 text-sm text-stone-700">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-stone-950">{faction.name}</p>
                      <p className="text-xs font-semibold uppercase text-fuchsia-800">
                        {faction.standing} - Reputation {faction.reputation}
                      </p>
                    </div>
                    <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-bold text-fuchsia-900">
                      {formatStatus(faction.status)}
                    </span>
                  </div>
                  <p className="mt-2">{faction.description}</p>
                  <p className="mt-2 text-xs"><strong>Unlock:</strong> {faction.unlockCondition}</p>
                  <p className="mt-2 text-xs"><strong>Relationship:</strong> {faction.relationshipToPlayer}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-fuchsia-100">
                    <div
                      className="h-full rounded-full bg-fuchsia-700"
                      style={{ width: `${Math.min(100, Math.max(0, faction.reputation))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-fuchsia-900">
                    Perks: {faction.perkHooks.join(", ")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-stone-600">
                    Rewards: {faction.rewardHooks.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-xs font-bold uppercase text-teal-800">World Structure</p>
            <h3 className="text-xl font-bold text-stone-950">Regions & Destination Hooks</h3>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {worldRegions.map((region) => (
                <div key={region.id} className="rounded-2xl border border-white bg-white/85 p-3 text-sm text-stone-700">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-stone-950">{region.name}</p>
                      <p className="text-xs font-semibold uppercase text-teal-800">
                        {region.access.travelMinutes} minutes - {region.access.route}
                      </p>
                    </div>
                    <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-900">
                      {region.status === "locked" ? "Locked" : "Destination Open"}
                    </span>
                  </div>
                  <p className="mt-2">{region.description}</p>
                  <p className="mt-2 text-xs"><strong>Unlock:</strong> {region.unlockCondition}</p>
                  <p className="mt-1 text-xs"><strong>Access:</strong> {region.access.requirement}</p>
                  <p className="mt-2 text-xs font-semibold text-teal-900">
                    Quest hooks: {region.questHooks.join(", ")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-stone-600">
                    Faction hooks: {region.factionHooks.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </article>

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
