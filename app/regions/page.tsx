"use client";

import Link from "next/link";
import { useGame } from "@/context/GameContext";
import {
  GameActionCard,
  GameCard,
  GameEmptyState,
  GameFeedbackBox,
  GameSectionHeader,
  GameStatCard,
  GameStatChip,
  GameStatusBadge,
} from "@/components/ui/GameUi";
import {
  formatWorldList,
  getRegionImportance,
} from "@/lib/world/worldDisplay";

function formatClock(day: number, hour: number, minute: number) {
  return `Day ${day}, ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export default function RegionsPage() {
  const {
    currentDay,
    currentHour,
    currentMinute,
    worldRegions,
    currentRegionId,
    visitedRegionIds,
    regionTravelLog,
    latestRegionTravelResult,
    worldRegionActions,
    travelToRegion,
    performRegionAction,
  } = useGame();

  const currentRegion = worldRegions.find((region) => region.id === currentRegionId);
  const openRegions = worldRegions.filter((region) => region.status !== "locked");
  const lockedRegions = worldRegions.filter((region) => region.status === "locked");
  const firstOutsideRegion = worldRegions.find((region) => region.id === "brindlewood_road");

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-100 to-stone-200 p-3 sm:p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-teal-800">Regions</p>
            <h1 className="text-4xl font-bold text-stone-950">World Routes</h1>
            <p className="mt-2 max-w-3xl text-sm text-stone-700">
              Region travel is in-world progression. It spends time, changes your current region, logs the route, and can move story, faction, or authored quest hooks.
            </p>
          </div>
          <Link href="/town" className="min-h-11 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white shadow">
            Town Hub
          </Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GameStatCard label="Day" value={currentDay} accentClasses="border-teal-200 bg-teal-50 text-teal-900" />
          <GameStatCard label="Time" value={formatClock(currentDay, currentHour, currentMinute).replace(`Day ${currentDay}, `, "")} accentClasses="border-amber-200 bg-amber-50 text-amber-900" />
          <GameStatCard label="Current Region" value={currentRegion?.name ?? "Unknown"} accentClasses="border-emerald-200 bg-emerald-50 text-emerald-900" />
          <GameStatCard label="Visited" value={`${visitedRegionIds.length}/${worldRegions.length}`} accentClasses="border-stone-200 bg-stone-50 text-stone-700" />
        </section>

        {latestRegionTravelResult ? (
          <GameFeedbackBox
            tone={latestRegionTravelResult.success ? "emerald" : "rose"}
            message={`${latestRegionTravelResult.title}: ${latestRegionTravelResult.message}`}
          />
        ) : null}

        {firstOutsideRegion ? (
          <GameCard tone={firstOutsideRegion.status === "locked" ? "stone" : "teal"} className="shadow-lg">
            <GameSectionHeader
              eyebrow="First Outside Route"
              title={firstOutsideRegion.name}
              description={firstOutsideRegion.description}
              tone={firstOutsideRegion.status === "locked" ? "stone" : "teal"}
            >
              <GameStatusBadge tone={firstOutsideRegion.status === "locked" ? "stone" : "teal"}>
                {firstOutsideRegion.status === "locked" ? "Locked" : currentRegionId === firstOutsideRegion.id ? "Current" : "Open"}
              </GameStatusBadge>
            </GameSectionHeader>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded-2xl border border-white bg-white/80 p-4 text-sm text-stone-700">
                <p><strong>Why it matters:</strong> {getRegionImportance(firstOutsideRegion.id)}</p>
                <p className="mt-2"><strong>Access:</strong> {firstOutsideRegion.access.requirement}</p>
                <p className="mt-2"><strong>Route:</strong> {firstOutsideRegion.access.route}</p>
                <p className="mt-2"><strong>Travel time:</strong> {firstOutsideRegion.access.travelMinutes} minutes</p>
                <p className="mt-2"><strong>Factions:</strong> {formatWorldList(firstOutsideRegion.factionHooks)}</p>
                <p className="mt-2"><strong>Authored quests:</strong> {formatWorldList(firstOutsideRegion.questHooks)}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {firstOutsideRegion.status === "locked" ? (
                  <GameEmptyState>Unlock: {firstOutsideRegion.unlockCondition}</GameEmptyState>
                ) : (
                  <>
                    <GameActionCard
                      title={currentRegionId === firstOutsideRegion.id ? "Current Region" : `Travel to ${firstOutsideRegion.name}`}
                      performer="Player"
                      targetLabel="Traveler"
                      cost={`${firstOutsideRegion.access.travelMinutes} minutes`}
                      outcome={currentRegionId === firstOutsideRegion.id ? "You are already on the first outside route." : "Updates current region and marks the road visited."}
                      disabledReason={currentRegionId === firstOutsideRegion.id ? "Already in this region." : undefined}
                      buttonLabel={currentRegionId === firstOutsideRegion.id ? "Here Now" : "Travel"}
                      onAction={() => travelToRegion(firstOutsideRegion.id)}
                      tone="teal"
                    />
                    {worldRegionActions
                      .filter((action) => action.regionId === firstOutsideRegion.id)
                      .map((action) => (
                        <GameActionCard
                          key={action.id}
                          title={action.title}
                          performer={firstOutsideRegion.name}
                          targetLabel="Region"
                          cost={`${action.timeCostMinutes} minutes`}
                          outcome={action.outcome}
                          disabledReason={currentRegionId === firstOutsideRegion.id ? undefined : `Travel to ${firstOutsideRegion.name} first.`}
                          buttonLabel="Do Action"
                          onAction={() => performRegionAction(firstOutsideRegion.id, action.id)}
                          tone="emerald"
                        />
                      ))}
                  </>
                )}
              </div>
            </div>
          </GameCard>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <GameSectionHeader
              eyebrow="All Destinations"
              title="Region Overview"
              description="Open regions can be traveled to. Locked regions show what still needs to happen."
              tone="teal"
            />
            <div className="grid gap-3 lg:grid-cols-2">
              {worldRegions.map((region) => {
                const locked = region.status === "locked";
                const isCurrent = currentRegionId === region.id;
                const visited = visitedRegionIds.includes(region.id);
                const actions = worldRegionActions.filter((action) => action.regionId === region.id);

                return (
                  <GameCard key={region.id} tone={locked ? "stone" : isCurrent ? "emerald" : "teal"} className="shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-stone-950">{region.name}</h2>
                        <p className="text-xs font-bold uppercase text-teal-800">{region.access.route}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <GameStatusBadge tone={locked ? "stone" : isCurrent ? "emerald" : "teal"}>
                          {locked ? "Locked" : isCurrent ? "Current" : "Open"}
                        </GameStatusBadge>
                        {!locked ? (
                          <GameStatusBadge tone={visited ? "amber" : "stone"}>
                            {visited ? "Visited" : "Unvisited"}
                          </GameStatusBadge>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-stone-700">{region.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <GameStatChip label="Travel" value={`${region.access.travelMinutes}m`} />
                      <GameStatChip label="Actions" value={actions.length} />
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-stone-700">
                      <p><strong>Access:</strong> {region.access.requirement}</p>
                      <p><strong>Factions:</strong> {formatWorldList(region.factionHooks)}</p>
                      <p><strong>Quests:</strong> {formatWorldList(region.questHooks)}</p>
                    </div>
                    {locked ? (
                      <p className="mt-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700">
                        Unlock: {region.unlockCondition}
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => travelToRegion(region.id)}
                        className={`mt-4 min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow ${isCurrent ? "bg-stone-400" : "bg-teal-700"}`}
                      >
                        {isCurrent ? "Current Region" : `Travel ${region.access.travelMinutes}m`}
                      </button>
                    )}
                  </GameCard>
                );
              })}
            </div>
          </div>

          <GameCard tone="stone" className="shadow-lg">
            <GameSectionHeader
              eyebrow="Travel Log"
              title="Recent Region Activity"
              description="Outside-region travel and actions are logged here."
              tone="stone"
            />
            <div className="mt-4 grid gap-2">
              {regionTravelLog.length === 0 ? (
                <GameEmptyState>No region travel recorded yet.</GameEmptyState>
              ) : (
                regionTravelLog.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700">
                    <p className="font-bold text-stone-950">{entry.actionTitle} - {entry.regionName}</p>
                    <p className="mt-1 text-xs">{entry.summary}</p>
                    <p className="mt-1 text-xs font-semibold text-stone-500">{formatClock(entry.day, entry.hour, entry.minute)} - {entry.minutesSpent}m</p>
                  </div>
                ))
              )}
            </div>
          </GameCard>
        </section>
      </div>
    </main>
  );
}
