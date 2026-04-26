"use client";

import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";
import {
  GameStatCard as JournalStatCard,
  GameStatusBadge,
  GameTabGroup,
  GameCard,
  GameEmptyState,
  GameActionCard,
  GameFeedbackBox,
  GameStatChip,
} from "@/components/ui/GameUi";
import {
  formatQuestCategoryLabel,
  formatWorldLabel,
  formatWorldList,
  getFactionInfluenceHint,
  getFactionQuestChain,
  getFactionNextGoal,
  getQuestObjectiveDisplayHint,
  getQuestNextStep,
  getRegionImportance,
} from "@/lib/world/worldDisplay";

type JournalTab = "story" | "quests" | "factions" | "world";

type ChapterLike = ReturnType<typeof useGame>["mainStoryChapters"][number];
type QuestLike = ReturnType<typeof useGame>["authoredQuests"][number];
type FactionLike = ReturnType<typeof useGame>["factions"][number];
type RegionLike = ReturnType<typeof useGame>["worldRegions"][number];
type RegionActionLike = ReturnType<typeof useGame>["worldRegionActions"][number];
type QuestActionLike = ReturnType<typeof useGame>["authoredQuestProgressActions"][number];
type FactionChainLike = ReturnType<typeof useGame>["factionQuestChains"][number];
type RegionTaskChainLike = ReturnType<typeof useGame>["regionTaskChains"][number];

const JOURNAL_TABS: Array<{ id: JournalTab; label: string; description: string }> = [
  { id: "story", label: "Story", description: "Chapters and current objective" },
  { id: "quests", label: "Quest Log", description: "Authored quests only" },
  { id: "factions", label: "Factions", description: "Reputation and standing" },
  { id: "world", label: "World Map", description: "Regions and access" },
];

function getLocationLabel(location: string) {
  if (location === "ranch") return "Ranch";
  if (location === "town") return "Town";
  if (location === "market") return "Market";
  if (location === "guild_hall") return "Guild Hall";
  return "Home";
}

function formatStatus(status: string) {
  if (status === "available") return "Available";
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  return "Locked";
}

function formatItemList(items: Array<{ itemId: string; quantity: number }>) {
  if (items.length === 0) return "No item reward";
  return items
    .map((item) => `${ITEM_DATA[item.itemId]?.name ?? item.itemId} x${item.quantity}`)
    .join(", ");
}

function ObjectiveChecklist({
  objectives,
  getDone,
  activeObjectiveId,
  showProgressHints = false,
}: {
  objectives: Array<{ id: string; title: string; description: string; locationHint?: string }>;
  getDone: (objective: { id: string; title: string }) => boolean;
  activeObjectiveId?: string;
  showProgressHints?: boolean;
}) {
  return (
    <div className="mt-3 grid gap-2">
      {objectives.map((objective, index) => {
        const done = getDone(objective);
        const active = objective.id === activeObjectiveId && !done;
        const progressHint = showProgressHints ? getQuestObjectiveDisplayHint(objective.id) : null;

        return (
          <div
            key={objective.id}
            className={`rounded-xl border px-3 py-2 text-sm ${
              done
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : active
                  ? "border-amber-300 bg-amber-50 text-amber-950"
                  : "border-stone-200 bg-white text-stone-700"
            }`}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <p className="font-semibold">
                {index + 1}. {objective.title}
              </p>
              <span className="text-xs font-bold">
                {done ? "Done" : active ? "Now" : objective.locationHint ? getLocationLabel(objective.locationHint) : "Open"}
              </span>
            </div>
            <p className="mt-1 text-xs">{objective.description}</p>
            {progressHint ? (
              <div className="mt-2 rounded-lg border border-white bg-white/80 px-2 py-1.5 text-xs">
                <p><strong>Where:</strong> {progressHint.where}</p>
                <p className="mt-0.5"><strong>Progresses through:</strong> {progressHint.action}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StoryArchiveSection({
  chapters,
  currentChapter,
  currentObjective,
  progress,
  mainStory,
}: {
  chapters: ChapterLike[];
  currentChapter: ChapterLike;
  currentObjective: ChapterLike["objectives"][number];
  progress: ReturnType<typeof useGame>["mainStoryChapterProgress"];
  mainStory: ReturnType<typeof useGame>["mainStory"];
}) {
  const completedByChapter = new Map(
    mainStory.completedChapterLog.map((entry) => [entry.chapterId, entry])
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-indigo-800">Current Story</p>
            <h3 className="text-2xl font-bold text-stone-950">
              Chapter {currentChapter.chapterNumber}: {currentChapter.title}
            </h3>
            <p className="mt-1 text-sm font-semibold text-indigo-950">{currentChapter.subtitle}</p>
            <p className="mt-2 text-sm text-stone-700">{currentChapter.summary}</p>
          </div>
          <div className="min-w-[180px] rounded-2xl border border-indigo-200 bg-white p-3 text-sm text-indigo-950">
            <p className="font-bold">
              {progress.completedSteps}/{progress.totalSteps} steps
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
              <div className="h-full rounded-full bg-indigo-700" style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="mt-2 text-xs font-semibold">
              {progress.isComplete ? "Chapter complete" : currentObjective.title}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <JournalStatCard label="Current Objective" value={currentObjective.title} accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
        <JournalStatCard label="Completed Chapters" value={mainStory.completedChapterLog.length} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
        <JournalStatCard label="Archive Entries" value={chapters.length} accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
      </div>

      <div className="grid gap-4">
        {chapters.map((chapter) => {
          const completedEntry = completedByChapter.get(chapter.id);
          const isCurrent = chapter.id === currentChapter.id;
          const completedSteps = chapter.objectives.filter(
            (objective) => mainStory.chapterProgressFlags[objective.completionFlag]
          ).length;
          const status = isCurrent ? "Current" : completedEntry ? "Completed" : "Upcoming";
          const rewardItems = formatItemList(chapter.completionReward.items);

          return (
            <article
              key={chapter.id}
              className={`rounded-2xl border-2 p-4 ${
                isCurrent
                  ? "border-indigo-300 bg-indigo-50"
                  : completedEntry
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-stone-200 bg-stone-50"
              }`}
            >
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-stone-600">Chapter {chapter.chapterNumber}</p>
                  <h3 className="text-xl font-bold text-stone-950">{chapter.title}</h3>
                  <p className="text-sm font-semibold text-stone-700">{chapter.subtitle}</p>
                </div>
                <GameStatusBadge>
                  {completedEntry ? `${status} Day ${completedEntry.completedDay}` : status}
                </GameStatusBadge>
              </div>

              <p className="mt-3 text-sm text-stone-700">{chapter.summary}</p>
              <div className="mt-3 rounded-xl border border-white bg-white/80 p-3 text-sm text-stone-800">
                <p><strong>Reward:</strong> {chapter.completionReward.title}</p>
                <p className="mt-1">
                  {chapter.completionReward.gold} Gold - {rewardItems}
                </p>
                <p className="mt-1 text-xs font-semibold text-stone-600">
                  {completedEntry ? `Unlocked: ${completedEntry.rewardTitle}` : chapter.completionReward.unlockText}
                </p>
              </div>
              <ObjectiveChecklist
                objectives={chapter.objectives}
                activeObjectiveId={isCurrent ? currentObjective.id : undefined}
                getDone={(objective) => {
                  const chapterObjective = chapter.objectives.find((item) => item.id === objective.id);
                  return Boolean(chapterObjective && mainStory.chapterProgressFlags[chapterObjective.completionFlag]);
                }}
              />
              <p className="mt-3 text-xs font-semibold text-stone-600">
                Progress: {completedSteps}/{chapter.objectives.length} objectives
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function QuestCard({
  quest,
  questActions,
  performAuthoredQuestAction,
}: {
  quest: QuestLike;
  questActions: QuestActionLike[];
  performAuthoredQuestAction: ReturnType<typeof useGame>["performAuthoredQuestAction"];
}) {
  const completedObjectives = quest.objectives.filter((objective) => objective.completed).length;
  const nextStep = getQuestNextStep(quest.objectives);
  const availableQuestActions = questActions.filter((action) => action.questId === quest.id);
  const factionConsequences = quest.reward.factionReputation
    .map((reward) => `+${reward.amount} ${formatWorldLabel(reward.factionId)}${reward.standing ? ` toward ${formatWorldLabel(reward.standing)}` : ""}`)
    .join(", ");
  const regionConsequences = formatWorldList(quest.reward.unlockRegions);

  return (
    <article
      className={`rounded-2xl border-2 p-4 text-sm ${
        quest.status === "locked"
          ? "border-stone-200 bg-stone-50 text-stone-600"
          : quest.status === "completed"
            ? "border-emerald-200 bg-emerald-50 text-stone-700"
            : "border-sky-200 bg-sky-50 text-stone-700"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-sky-800">{formatQuestCategoryLabel(quest.category)}</p>
          <h3 className="text-xl font-bold text-stone-950">{quest.title}</h3>
        </div>
        <GameStatusBadge>
          {formatStatus(quest.status)}
        </GameStatusBadge>
      </div>
      <p className="mt-2">{quest.description}</p>
      <p className="mt-2 text-xs font-semibold">
        Source: {quest.source.type === "faction" ? formatWorldLabel(quest.source.factionId) : formatWorldLabel(quest.source.name)}
      </p>
      {quest.gate ? (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          Unlocks When: {quest.gate.note}
        </p>
      ) : null}
      {quest.status === "locked" ? (
        <GameCard tone="stone" className="mt-3 text-xs shadow-none">
          <p className="font-bold text-stone-950">Locked</p>
          <p className="mt-1">{quest.gate?.note ?? "Progress the current story and related world systems to reveal this quest."}</p>
        </GameCard>
      ) : quest.status === "completed" ? (
        <GameCard tone="emerald" className="mt-3 text-xs shadow-none">
          <p className="font-bold text-stone-950">Completion Result</p>
          <p className="mt-1">{quest.reward.summary}</p>
        </GameCard>
      ) : nextStep ? (
        <GameCard tone="amber" className="mt-3 text-xs shadow-none">
          <p className="font-bold text-stone-950">Next Step</p>
          <p className="mt-1"><strong>Where:</strong> {nextStep.where}</p>
          <p className="mt-1"><strong>Likely Action:</strong> {nextStep.action}</p>
          <p className="mt-1"><strong>Try:</strong> {nextStep.next}</p>
        </GameCard>
      ) : null}
      <ObjectiveChecklist
        objectives={quest.objectives}
        showProgressHints
        getDone={(objective) => {
          const questObjective = quest.objectives.find((item) => item.id === objective.id);
          return Boolean(questObjective?.completed);
        }}
      />
      <div className="mt-3 rounded-xl border border-white bg-white/80 p-3 text-xs text-stone-700">
        <p><strong>Progress:</strong> {completedObjectives}/{quest.objectives.length} objectives</p>
        <p className="mt-1"><strong>Reward Summary:</strong> {quest.rewardSummary}</p>
        <p className="mt-1"><strong>Reward:</strong> {quest.reward.gold} Gold, {formatItemList(quest.reward.items)}</p>
        {quest.reward.factionReputation.length > 0 ? (
          <p className="mt-1"><strong>Faction consequence:</strong> {factionConsequences}</p>
        ) : null}
        {quest.reward.unlockRegions.length > 0 ? (
          <p className="mt-1"><strong>Region consequence:</strong> {regionConsequences}</p>
        ) : null}
        {quest.status === "completed" ? (
          <p className="mt-1 font-semibold text-emerald-800">{quest.reward.summary}</p>
        ) : null}
      </div>
      {availableQuestActions.length > 0 ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {availableQuestActions.map((action) => {
            const objective = quest.objectives.find((item) => item.id === action.objectiveId);
            const disabledReason =
              quest.status === "locked"
                ? quest.gate?.note ?? "Quest is locked."
                : quest.status === "completed" || objective?.completed
                  ? "Already registered."
                  : undefined;

            return (
              <GameActionCard
                key={action.id}
                title={action.title}
                performer={formatWorldLabel(quest.source.type === "faction" ? quest.source.factionId : quest.source.name)}
                targetLabel="Report To"
                cost={`${action.timeCostMinutes} minutes`}
                outcome={`${action.outcome} Where: ${action.where}.`}
                disabledReason={disabledReason}
                buttonLabel="Register Progress"
                onAction={() => performAuthoredQuestAction(action.id)}
                tone="sky"
              />
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function QuestLogSection({
  quests,
  questActions,
  performAuthoredQuestAction,
}: {
  quests: QuestLike[];
  questActions: QuestActionLike[];
  performAuthoredQuestAction: ReturnType<typeof useGame>["performAuthoredQuestAction"];
}) {
  const actionable = quests.filter((quest) => quest.status === "active" || quest.status === "available");
  const completed = quests.filter((quest) => quest.status === "completed");
  const locked = quests.filter((quest) => quest.status === "locked");
  const categories = Array.from(new Set(quests.map((quest) => quest.category)));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <JournalStatCard label="Active / Available" value={actionable.length} accentClasses="border-sky-200 bg-sky-50 text-sky-900" />
        <JournalStatCard label="Completed" value={completed.length} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
        <JournalStatCard label="Locked" value={locked.length} accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
        <JournalStatCard label="Categories" value={categories.length} accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
      </div>

      {[
        { title: "Active / Available", quests: actionable },
        { title: "Completed", quests: completed },
        { title: "Locked", quests: locked },
      ].map((group) => (
        <section key={group.title} className="rounded-2xl border border-sky-100 bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-stone-950">{group.title}</h3>
            <GameStatusBadge tone="sky">
              {group.quests.length}
            </GameStatusBadge>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {group.quests.length === 0 ? (
              <GameEmptyState>No quests in this section.</GameEmptyState>
            ) : (
              group.quests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  questActions={questActions}
                  performAuthoredQuestAction={performAuthoredQuestAction}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function FactionsSection({
  factions,
  factionQuestChains,
}: {
  factions: FactionLike[];
  factionQuestChains: FactionChainLike[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <JournalStatCard label="Known" value={factions.filter((faction) => faction.status !== "locked").length} accentClasses="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900" />
        <JournalStatCard label="Locked" value={factions.filter((faction) => faction.status === "locked").length} accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
        <JournalStatCard label="Highest Reputation" value={Math.max(0, ...factions.map((faction) => faction.reputation))} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {factions.map((faction) => {
          const locked = faction.status === "locked";
          const nextGoal = getFactionNextGoal(faction.reputation);
          const influenceHint = getFactionInfluenceHint(faction.id);
          const persistentChain = factionQuestChains.find((chain) => chain.factionId === faction.id);
          const derivedChain = getFactionQuestChain(faction.id, faction.reputation, faction.status);
          const currentStep = persistentChain?.steps.find((step) => step.id === persistentChain.currentStepId);
          const completedSteps = persistentChain?.completedStepIds.length ?? 0;
          const totalSteps = persistentChain?.steps.length ?? 1;
          return (
            <article
              key={faction.id}
              className={`rounded-2xl border-2 p-4 text-sm ${
                locked
                  ? "border-stone-200 bg-stone-50 text-stone-600"
                  : "border-fuchsia-200 bg-fuchsia-50 text-stone-700"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-stone-950">{faction.name}</h3>
                  <p className="text-xs font-bold uppercase text-fuchsia-800">
                    {formatWorldLabel(faction.standing)} - Reputation {faction.reputation}
                  </p>
                </div>
                <GameStatusBadge>
                  {formatStatus(faction.status)}
                </GameStatusBadge>
              </div>
              <p className="mt-2">{faction.description}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${locked ? "bg-stone-400" : "bg-fuchsia-700"}`}
                  style={{ width: `${Math.min(100, Math.max(0, faction.reputation))}%` }}
                />
              </div>
              <div className="mt-3 grid gap-2 text-xs">
                <p><strong>Unlock:</strong> {faction.unlockCondition}</p>
                <p><strong>Relationship:</strong> {faction.relationshipToPlayer}</p>
                <p><strong>Next goal:</strong> {nextGoal}</p>
                <p><strong>What affects them:</strong> {influenceHint}</p>
                <div className="rounded-xl border border-white bg-white/80 p-3">
                  <p className="font-bold text-stone-950">{persistentChain?.title ?? derivedChain.title}</p>
                  {persistentChain ? (
                    <>
                      <p className="mt-1"><strong>Status:</strong> {formatWorldLabel(persistentChain.status)}</p>
                      <p className="mt-1"><strong>Progress:</strong> {completedSteps}/{totalSteps} steps</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-fuchsia-700"
                          style={{ width: `${Math.round((completedSteps / Math.max(1, totalSteps)) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-2"><strong>Current step:</strong> {currentStep?.title ?? persistentChain.nextHint}</p>
                      <p className="mt-1"><strong>Next requirement:</strong> {currentStep?.requirement ?? persistentChain.nextHint}</p>
                      <p className="mt-1"><strong>Reward:</strong> {persistentChain.rewardSummary}</p>
                      <p className="mt-1"><strong>Reputation reward:</strong> +{persistentChain.factionReputationReward} possible reputation</p>
                      <p className="mt-1"><strong>Next hint:</strong> {currentStep?.nextHint ?? persistentChain.nextHint}</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1"><strong>State:</strong> {derivedChain.state}</p>
                      <p className="mt-1"><strong>Current step:</strong> {derivedChain.currentStep}</p>
                      <p className="mt-1"><strong>Next requirement:</strong> {derivedChain.nextRequirement}</p>
                      <p className="mt-1"><strong>Reward:</strong> {derivedChain.reward}</p>
                      <p className="mt-1"><strong>Reputation:</strong> {derivedChain.reputationReward}</p>
                    </>
                  )}
                </div>
                <p><strong>Known perks:</strong> {formatWorldList(faction.perkHooks)}</p>
                <p><strong>Known rewards:</strong> {formatWorldList(faction.rewardHooks)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function formatClock(day: number, hour: number, minute: number) {
  return `Day ${day}, ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function WorldMapSection({
  regions,
  currentRegionId,
  visitedRegionIds,
  regionActions,
  regionTaskChains,
  latestRegionTravelResult,
  regionTravelLog,
  travelToRegion,
  performRegionAction,
}: {
  regions: RegionLike[];
  currentRegionId: string;
  visitedRegionIds: string[];
  regionActions: RegionActionLike[];
  regionTaskChains: RegionTaskChainLike[];
  latestRegionTravelResult: ReturnType<typeof useGame>["latestRegionTravelResult"];
  regionTravelLog: ReturnType<typeof useGame>["regionTravelLog"];
  travelToRegion: ReturnType<typeof useGame>["travelToRegion"];
  performRegionAction: ReturnType<typeof useGame>["performRegionAction"];
}) {
  const openRegions = regions.filter((region) => region.status !== "locked");
  const lockedRegions = regions.filter((region) => region.status === "locked");
  const currentRegion = regions.find((region) => region.id === currentRegionId);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-stone-700">
        <p className="text-xs font-bold uppercase text-teal-800">Travel & Access</p>
        <h3 className="text-xl font-bold text-stone-950">World Map</h3>
        <p className="mt-1">
          Global navigation is free UI movement. Region travel here is in-world travel: it spends time, updates your current region, and can support story, quest, and faction progress.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <JournalStatCard label="Open Regions" value={openRegions.length} accentClasses="border-teal-200 bg-teal-50 text-teal-900" />
        <JournalStatCard label="Locked Regions" value={lockedRegions.length} accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
        <JournalStatCard label="Current Region" value={currentRegion?.name ?? "Unknown"} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
        <JournalStatCard label="Visited" value={`${visitedRegionIds.length}/${regions.length}`} accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
      </div>

      {latestRegionTravelResult ? (
        <GameFeedbackBox
          tone={latestRegionTravelResult.success ? "emerald" : "rose"}
          message={`${latestRegionTravelResult.title}: ${latestRegionTravelResult.message}`}
        />
      ) : null}

      {[
        { title: "Open Regions", regions: openRegions, locked: false },
        { title: "Locked Regions", regions: lockedRegions, locked: true },
      ].map((group) => (
        <section key={group.title} className="rounded-2xl border border-teal-100 bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-stone-950">{group.title}</h3>
            <GameStatusBadge tone="teal">
              {group.regions.length}
            </GameStatusBadge>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {group.regions.length === 0 ? (
              <GameEmptyState>No regions in this section.</GameEmptyState>
            ) : (
              group.regions.map((region) => {
                const isCurrent = currentRegionId === region.id;
                const visited = visitedRegionIds.includes(region.id);
                const actions = regionActions.filter((action) => action.regionId === region.id);
                const taskChain = regionTaskChains.find((chain) => chain.regionId === region.id);
                const currentTaskStep = taskChain?.steps.find((step) => step.id === taskChain.currentStepId);

                return (
                  <article
                    key={region.id}
                    className={`rounded-2xl border-2 p-4 text-sm ${
                      group.locked
                        ? "border-stone-200 bg-stone-50 text-stone-600"
                        : isCurrent
                          ? "border-emerald-300 bg-emerald-50 text-stone-700"
                          : "border-teal-200 bg-teal-50 text-stone-700"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-stone-950">{region.name}</h3>
                        <p className="text-xs font-bold uppercase text-teal-800">
                          {region.access.travelMinutes} minutes - {region.access.route}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <GameStatusBadge tone={group.locked ? "stone" : isCurrent ? "emerald" : "teal"}>
                          {group.locked ? "Locked" : isCurrent ? "Current" : "Open"}
                        </GameStatusBadge>
                        {!group.locked ? (
                          <GameStatusBadge tone={visited ? "amber" : "stone"}>
                            {visited ? "Visited" : "Unvisited"}
                          </GameStatusBadge>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2">{region.description}</p>
                    <p className="mt-2 rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-semibold text-stone-700">
                      {group.locked ? "How to unlock: " : "Available destination: "}
                      {group.locked ? region.unlockCondition : getRegionImportance(region.id)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <GameStatChip label="Travel Time" value={`${region.access.travelMinutes}m`} />
                      <GameStatChip label="Route" value={region.access.route} />
                      {taskChain ? (
                        <GameStatChip label="Task Chain" value={`${taskChain.completedStepIds.length}/${taskChain.steps.length}`} />
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs">
                      <p><strong>Unlock:</strong> {region.unlockCondition}</p>
                      <p><strong>Access:</strong> {region.access.requirement}</p>
                      <p><strong>Associated quests:</strong> {formatWorldList(region.questHooks)}</p>
                      <p><strong>Associated factions:</strong> {formatWorldList(region.factionHooks)}</p>
                    </div>

                    {taskChain ? (
                      <div className="mt-3 rounded-xl border border-white bg-white/80 p-3 text-xs text-stone-700">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-bold text-stone-950">{taskChain.title}</p>
                            <p className="mt-1">{taskChain.description}</p>
                          </div>
                          <GameStatusBadge tone={taskChain.status === "completed" ? "emerald" : taskChain.status === "locked" ? "stone" : "teal"}>
                            {formatWorldLabel(taskChain.status)}
                          </GameStatusBadge>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-teal-700"
                            style={{ width: `${Math.round((taskChain.completedStepIds.length / Math.max(1, taskChain.steps.length)) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 font-semibold">
                          {taskChain.completedStepIds.length}/{taskChain.steps.length} regional steps complete
                        </p>
                        <p className="mt-1"><strong>Current step:</strong> {currentTaskStep?.title ?? taskChain.nextHint}</p>
                        <p className="mt-1"><strong>Requirement:</strong> {currentTaskStep?.requirement ?? taskChain.requirements.join(", ")}</p>
                        <p className="mt-1"><strong>Reward:</strong> {taskChain.rewardSummary}</p>
                        <p className="mt-1"><strong>Next:</strong> {currentTaskStep?.nextHint ?? taskChain.nextHint}</p>
                      </div>
                    ) : null}

                    {group.locked ? null : (
                      <div className="mt-4 space-y-3">
                        <GameActionCard
                          title={isCurrent ? "Current Region" : `Travel to ${region.name}`}
                          performer="Player"
                          targetLabel="Traveler"
                          cost={`${region.access.travelMinutes} minutes`}
                          outcome={isCurrent ? "You are already here and can take region actions." : `Updates current region to ${region.name}.`}
                          disabledReason={isCurrent ? "Already in this region." : undefined}
                          buttonLabel={isCurrent ? "Here Now" : "Travel"}
                          onAction={() => travelToRegion(region.id)}
                          tone="teal"
                        />
                        <div className="grid gap-3 md:grid-cols-2">
                          {actions.map((action) => {
                            const disabledReason = isCurrent ? undefined : `Travel to ${region.name} first.`;
                            return (
                              <GameActionCard
                                key={action.id}
                                title={action.title}
                                performer={region.name}
                                targetLabel="Region"
                                cost={`${action.timeCostMinutes} minutes`}
                                outcome={action.outcome}
                                disabledReason={disabledReason}
                                buttonLabel="Do Action"
                                onAction={() => performRegionAction(region.id, action.id)}
                                tone="emerald"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-stone-950">Region Travel Log</h3>
          <GameStatusBadge>{regionTravelLog.length}</GameStatusBadge>
        </div>
        <div className="mt-3 grid gap-2">
          {regionTravelLog.length === 0 ? (
            <GameEmptyState>No region travel recorded yet.</GameEmptyState>
          ) : (
            regionTravelLog.slice(0, 6).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-white bg-white px-3 py-2 text-xs text-stone-700">
                <p className="font-bold text-stone-950">{entry.actionTitle} - {entry.regionName}</p>
                <p className="mt-1">{entry.summary}</p>
                <p className="mt-1 font-semibold text-stone-500">{formatClock(entry.day, entry.hour, entry.minute)} - {entry.minutesSpent}m</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
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
    currentRegionId,
    visitedRegionIds,
    regionTravelLog,
    latestRegionTravelResult,
    worldRegionActions,
    authoredQuestProgressActions,
    factionQuestChains,
    regionTaskChains,
    acknowledgeStoryJournalSection,
    travelToRegion,
    performRegionAction,
    performAuthoredQuestAction,
  } = useGame();
  const [activeTab, setActiveTab] = useState<JournalTab>("story");

  useEffect(() => {
    acknowledgeStoryJournalSection(activeTab);
  }, [activeTab]);

  const completedCount = mainStory.completedChapterLog.length;
  const actionableQuestCount = authoredQuests.filter(
    (quest) => quest.status === "active" || quest.status === "available"
  ).length;
  const visibleFactionCount = factions.filter((faction) => faction.status !== "locked").length;
  const openRegionCount = worldRegions.filter((region) => region.status !== "locked").length;
  const activeTabMeta = useMemo(
    () => JOURNAL_TABS.find((tab) => tab.id === activeTab) ?? JOURNAL_TABS[0],
    [activeTab]
  );

  return (
    <section className="rounded-3xl border-4 border-stone-900 bg-white/90 p-4 shadow-xl sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-stone-600">Journal</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Story, Quests, Factions & World</h2>
          <p className="mt-2 max-w-3xl text-sm text-stone-700">
            Current: Chapter {currentMainStoryChapter.chapterNumber}, {currentMainStoryChapter.title}.{" "}
            {mainStoryChapterProgress.completedSteps}/{mainStoryChapterProgress.totalSteps} active steps complete.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:min-w-[420px]">
          <JournalStatCard label="Chapters" value={`${completedCount}/${mainStoryChapters.length}`} accentClasses="border-indigo-200 bg-indigo-50 text-indigo-900" />
          <JournalStatCard label="Quests" value={actionableQuestCount} accentClasses="border-sky-200 bg-sky-50 text-sky-900" />
          <JournalStatCard label="Factions" value={`${visibleFactionCount}/${factions.length}`} accentClasses="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900" />
          <JournalStatCard label="Regions" value={`${openRegionCount}/${worldRegions.length}`} accentClasses="border-teal-200 bg-teal-50 text-teal-900" />
        </div>
      </div>

      <GameTabGroup
        items={JOURNAL_TABS}
        activeId={activeTab}
        onSelect={setActiveTab}
        className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      />

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white/80 p-3 sm:p-4">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase text-stone-600">{activeTabMeta.label}</p>
          <p className="mt-1 text-sm text-stone-700">{activeTabMeta.description}</p>
        </div>

        {activeTab === "story" ? (
          <StoryArchiveSection
            chapters={mainStoryChapters}
            currentChapter={currentMainStoryChapter}
            currentObjective={currentMainStoryObjective}
            progress={mainStoryChapterProgress}
            mainStory={mainStory}
          />
        ) : null}

        {activeTab === "quests" ? (
          <QuestLogSection
            quests={authoredQuests}
            questActions={authoredQuestProgressActions}
            performAuthoredQuestAction={performAuthoredQuestAction}
          />
        ) : null}
        {activeTab === "factions" ? (
          <FactionsSection factions={factions} factionQuestChains={factionQuestChains} />
        ) : null}
        {activeTab === "world" ? (
          <WorldMapSection
            regions={worldRegions}
            currentRegionId={currentRegionId}
            visitedRegionIds={visitedRegionIds}
            regionActions={worldRegionActions}
            regionTaskChains={regionTaskChains}
            latestRegionTravelResult={latestRegionTravelResult}
            regionTravelLog={regionTravelLog}
            travelToRegion={travelToRegion}
            performRegionAction={performRegionAction}
          />
        ) : null}
      </div>
    </section>
  );
}
