"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";

type JournalTab = "story" | "quests" | "factions" | "world";

type ChapterLike = ReturnType<typeof useGame>["mainStoryChapters"][number];
type QuestLike = ReturnType<typeof useGame>["authoredQuests"][number];
type FactionLike = ReturnType<typeof useGame>["factions"][number];
type RegionLike = ReturnType<typeof useGame>["worldRegions"][number];

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

function formatQuestCategory(category: string) {
  if (category === "main_story") return "Main Story";
  if (category === "side_quest") return "Side Quest";
  if (category === "faction_quest") return "Faction Quest";
  return "Regional Assignment";
}

function formatItemList(items: Array<{ itemId: string; quantity: number }>) {
  if (items.length === 0) return "No item reward";
  return items
    .map((item) => `${ITEM_DATA[item.itemId]?.name ?? item.itemId} x${item.quantity}`)
    .join(", ");
}

function JournalStatCard({
  label,
  value,
  accentClasses,
}: {
  label: string;
  value: string | number;
  accentClasses: string;
}) {
  return (
    <div className={`rounded-2xl border p-3 text-sm ${accentClasses}`}>
      <p className="text-xs font-bold uppercase">{label}</p>
      <p className="mt-1 font-bold text-stone-950">{value}</p>
    </div>
  );
}

function JournalTabButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-16 rounded-2xl border-2 px-4 py-3 text-left shadow-sm ${
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-300 bg-white text-stone-900"
      }`}
    >
      <p className="font-bold">{label}</p>
      <p className={`mt-1 text-xs ${active ? "text-stone-200" : "text-stone-600"}`}>
        {description}
      </p>
    </button>
  );
}

function ObjectiveChecklist({
  objectives,
  getDone,
  activeObjectiveId,
}: {
  objectives: Array<{ id: string; title: string; description: string; locationHint?: string }>;
  getDone: (objective: { id: string; title: string }) => boolean;
  activeObjectiveId?: string;
}) {
  return (
    <div className="mt-3 grid gap-2">
      {objectives.map((objective, index) => {
        const done = getDone(objective);
        const active = objective.id === activeObjectiveId && !done;

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
                <span className="w-fit rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-stone-700">
                  {completedEntry ? `${status} Day ${completedEntry.completedDay}` : status}
                </span>
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

function QuestCard({ quest }: { quest: QuestLike }) {
  const completedObjectives = quest.objectives.filter((objective) => objective.completed).length;

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
          <p className="text-xs font-bold uppercase text-sky-800">{formatQuestCategory(quest.category)}</p>
          <h3 className="text-xl font-bold text-stone-950">{quest.title}</h3>
        </div>
        <span className="w-fit rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-stone-700">
          {formatStatus(quest.status)}
        </span>
      </div>
      <p className="mt-2">{quest.description}</p>
      <p className="mt-2 text-xs font-semibold">Source: {quest.source.name}</p>
      {quest.gate ? (
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          Gate: {quest.gate.note}
        </p>
      ) : null}
      <ObjectiveChecklist
        objectives={quest.objectives}
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
          <p className="mt-1">
            <strong>Faction consequence:</strong>{" "}
            {quest.reward.factionReputation
              .map((reward) => `+${reward.amount} ${reward.factionId}${reward.standing ? ` to ${reward.standing}` : ""}`)
              .join(", ")}
          </p>
        ) : null}
        {quest.reward.unlockRegions.length > 0 ? (
          <p className="mt-1"><strong>Region consequence:</strong> {quest.reward.unlockRegions.join(", ")}</p>
        ) : null}
        {quest.status === "completed" ? (
          <p className="mt-1 font-semibold text-emerald-800">{quest.reward.summary}</p>
        ) : null}
      </div>
    </article>
  );
}

function QuestLogSection({ quests }: { quests: QuestLike[] }) {
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
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-900">
              {group.quests.length}
            </span>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {group.quests.length === 0 ? (
              <p className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                No quests in this section.
              </p>
            ) : (
              group.quests.map((quest) => <QuestCard key={quest.id} quest={quest} />)
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function FactionsSection({ factions }: { factions: FactionLike[] }) {
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
                    {faction.standing} - Reputation {faction.reputation}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-stone-700">
                  {formatStatus(faction.status)}
                </span>
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
                <p><strong>Perk hooks:</strong> {faction.perkHooks.join(", ")}</p>
                <p><strong>Reward hooks:</strong> {faction.rewardHooks.join(", ")}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function WorldMapSection({ regions }: { regions: RegionLike[] }) {
  const openRegions = regions.filter((region) => region.status !== "locked");
  const lockedRegions = regions.filter((region) => region.status === "locked");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-stone-700">
        <p className="text-xs font-bold uppercase text-teal-800">Travel & Access</p>
        <h3 className="text-xl font-bold text-stone-950">World Map</h3>
        <p className="mt-1">
          Global navigation is free UI movement. Region access here represents in-world progression, travel metadata, and quest/faction hooks.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <JournalStatCard label="Open Regions" value={openRegions.length} accentClasses="border-teal-200 bg-teal-50 text-teal-900" />
        <JournalStatCard label="Locked Regions" value={lockedRegions.length} accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
      </div>

      {[
        { title: "Open Regions", regions: openRegions, locked: false },
        { title: "Locked Regions", regions: lockedRegions, locked: true },
      ].map((group) => (
        <section key={group.title} className="rounded-2xl border border-teal-100 bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-stone-950">{group.title}</h3>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-900">
              {group.regions.length}
            </span>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {group.regions.length === 0 ? (
              <p className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                No regions in this section.
              </p>
            ) : (
              group.regions.map((region) => (
                <article
                  key={region.id}
                  className={`rounded-2xl border-2 p-4 text-sm ${
                    group.locked
                      ? "border-stone-200 bg-stone-50 text-stone-600"
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
                    <span className="w-fit rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-stone-700">
                      {region.status === "locked" ? "Locked" : "Open"}
                    </span>
                  </div>
                  <p className="mt-2">{region.description}</p>
                  <div className="mt-3 grid gap-2 text-xs">
                    <p><strong>Unlock:</strong> {region.unlockCondition}</p>
                    <p><strong>Access:</strong> {region.access.requirement}</p>
                    <p><strong>Quest hooks:</strong> {region.questHooks.join(", ")}</p>
                    <p><strong>Faction hooks:</strong> {region.factionHooks.join(", ")}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ))}
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
  } = useGame();
  const [activeTab, setActiveTab] = useState<JournalTab>("story");

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

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {JOURNAL_TABS.map((tab) => (
          <JournalTabButton
            key={tab.id}
            label={tab.label}
            description={tab.description}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

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

        {activeTab === "quests" ? <QuestLogSection quests={authoredQuests} /> : null}
        {activeTab === "factions" ? <FactionsSection factions={factions} /> : null}
        {activeTab === "world" ? <WorldMapSection regions={worldRegions} /> : null}
      </div>
    </section>
  );
}
