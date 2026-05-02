"use client";

import Link from "next/link";
import { useState } from "react";
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
  formatWorldLabel,
  formatWorldList,
  getRegionImportance,
} from "@/lib/world/worldDisplay";

function formatClock(day: number, hour: number, minute: number) {
  return `Day ${day}, ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function getRegionActionDisabledReason({
  currentRegionId,
  regionId,
  regionName,
  actionId,
  taskChain,
  hasSilvergrainSample,
}: {
  currentRegionId: string;
  regionId: string;
  regionName: string;
  actionId: string;
  taskChain?: ReturnType<typeof useGame>["regionTaskChains"][number];
  hasSilvergrainSample?: boolean;
}) {
  if (currentRegionId !== regionId) return `Travel to ${regionName} first.`;
  if (actionId === "silvergrain-submit-premium-sample" && !hasSilvergrainSample) {
    return "Bring any quality produce or cooked good.";
  }
  if (!taskChain) return undefined;

  const actionStep = taskChain.steps.find((step) => step.actionId === actionId);
  if (!actionStep) return undefined;
  if (actionId.startsWith("silvergrain-") && taskChain.completedStepIds.includes(actionStep.id)) return undefined;
  if (taskChain.completedStepIds.includes(actionStep.id)) return `${actionStep.title} is already recorded.`;
  if (taskChain.currentStepId !== actionStep.id) {
    const currentStep = taskChain.steps.find((step) => step.id === taskChain.currentStepId);
    return currentStep ? `Current chain step: ${currentStep.title}.` : taskChain.nextHint;
  }

  return undefined;
}

function getTotalMinutes(day: number, hour: number, minute: number) {
  return day * 24 * 60 + hour * 60 + minute;
}

function formatReadyTime(totalMinutes: number) {
  const day = Math.floor(totalMinutes / (24 * 60));
  const minutesInDay = totalMinutes % (24 * 60);
  const hour = Math.floor(minutesInDay / 60);
  const minute = minutesInDay % 60;
  return `Day ${day}, ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export default function RegionsPage() {
  const {
    currentDay,
    currentHour,
    currentMinute,
    worldRegions,
    worldLocations,
    currentRegionId,
    visitedRegionIds,
    regionTravelLog,
    latestRegionTravelResult,
    worldRegionActions,
    factionQuestChains,
    regionTaskChains,
    creatures,
    roadDispatchJobs,
    activeDispatches,
    completedDispatchLog,
    latestDispatchResult,
    roadDispatchUnlocked,
    latestRoadIncident,
    roadIncidentLog,
    roadIncidentCountsByRegion,
    silvergrainPremiumSample,
    travelToRegion,
    performRegionAction,
    startRoadDispatch,
    resolveRoadDispatch,
  } = useGame();

  const [selectedDispatchCreatures, setSelectedDispatchCreatures] = useState<Record<string, number[]>>({});
  const currentRegion = worldRegions.find((region) => region.id === currentRegionId);
  const openRegions = worldRegions.filter((region) => region.status !== "locked");
  const lockedRegions = worldRegions.filter((region) => region.status === "locked");
  const firstOutsideRegion = worldRegions.find((region) => region.id === "brindlewood_road");
  const firstOutsideLocations = worldLocations.filter((location) => location.regionId === "brindlewood_road");
  const firstOutsideTaskChain = regionTaskChains.find((chain) => chain.regionId === "brindlewood_road");
  const firstOutsideFactionChain = firstOutsideTaskChain?.factionId
    ? factionQuestChains.find((chain) => chain.factionId === firstOutsideTaskChain.factionId)
    : null;
  const currentTotalMinutes = getTotalMinutes(currentDay, currentHour, currentMinute);
  const assignedDispatchCreatureIds = new Set(activeDispatches.flatMap((dispatch) => dispatch.creatureIds));
  const brindlewoodDispatchJobs = roadDispatchJobs.filter((job) => job.regionId === "brindlewood_road");
  const silvergrainRegion = worldRegions.find((region) => region.id === "silvergrain_exchange");
  const silvergrainLocations = worldLocations.filter((location) => location.regionId === "silvergrain_exchange");
  const silvergrainTaskChain = regionTaskChains.find((chain) => chain.regionId === "silvergrain_exchange");
  const silvergrainFactionChain = factionQuestChains.find((chain) => chain.factionId === "velvet_market_ring");
  const silvergrainActions = worldRegionActions.filter((action) => action.regionId === "silvergrain_exchange");

  function toggleDispatchCreature(jobId: string, creatureId: number, maxAssignedCreatures: number) {
    setSelectedDispatchCreatures((prev) => {
      const currentSelection = prev[jobId] ?? [];
      const isSelected = currentSelection.includes(creatureId);
      const nextSelection = isSelected
        ? currentSelection.filter((id) => id !== creatureId)
        : currentSelection.length >= maxAssignedCreatures
          ? currentSelection
          : [...currentSelection, creatureId];

      return { ...prev, [jobId]: nextSelection };
    });
  }

  function getDispatchDisabledReason(job: ReturnType<typeof useGame>["roadDispatchJobs"][number]) {
    if (!roadDispatchUnlocked) return "Complete Road Work on Brindlewood Road to unlock creature dispatch assignments.";
    const region = worldRegions.find((entry) => entry.id === job.regionId);
    if (!region || region.status === "locked") return "Brindlewood Road must be open first.";
    const selectedIds = selectedDispatchCreatures[job.jobId] ?? [];
    if (selectedIds.length === 0) return "Choose at least one creature.";
    if (selectedIds.length > job.maxAssignedCreatures) return `Choose up to ${job.maxAssignedCreatures} creatures.`;
    const busyCreature = selectedIds
      .map((creatureId) => creatures.find((creature) => creature.id === creatureId))
      .find((creature) => creature && assignedDispatchCreatureIds.has(creature.id));
    if (busyCreature) return `${busyCreature.nickname} is already assigned.`;
    const tiredCreature = selectedIds
      .map((creatureId) => creatures.find((creature) => creature.id === creatureId))
      .find((creature) => creature && creature.breedingStamina < job.minStamina);
    if (tiredCreature) return `${tiredCreature.nickname} needs ${job.minStamina} stamina.`;
    return undefined;
  }

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
                <p className="mt-2"><strong>Role:</strong> {firstOutsideRegion.gameplayRole}</p>
                <p className="mt-2"><strong>Specialty:</strong> {firstOutsideRegion.regionSpecialty}</p>
                <p className="mt-2"><strong>Mechanic:</strong> {firstOutsideRegion.uniqueMechanicSummary}</p>
                <p className="mt-2"><strong>Loop:</strong> {firstOutsideRegion.repeatableLoopSummary}</p>
                <p className="mt-2"><strong>Preparation:</strong> {firstOutsideRegion.preparationHint}</p>
                <p className="mt-2"><strong>Rewards:</strong> {formatWorldList(firstOutsideRegion.uniqueRewardHooks)}</p>
                <p className="mt-2"><strong>Risk / cost:</strong> {firstOutsideRegion.riskOrCostSummary}</p>
                <p className="mt-2"><strong>Factions:</strong> {formatWorldList(firstOutsideRegion.factionHooks)}</p>
                <p className="mt-2"><strong>Authored quests:</strong> {formatWorldList(firstOutsideRegion.questHooks)}</p>
                <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-3">
                  <p className="font-bold text-stone-950">Road Locations</p>
                  <div className="mt-2 grid gap-2">
                    {firstOutsideLocations.map((location) => (
                      <div key={location.locationId} className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-stone-950">{location.name}</p>
                          <GameStatusBadge tone={location.status === "locked" ? "stone" : "teal"}>
                            {formatWorldLabel(location.status)}
                          </GameStatusBadge>
                        </div>
                        <p className="mt-1">{location.description}</p>
                        <p className="mt-1"><strong>Actions:</strong> {formatWorldList(location.actionHooks)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {firstOutsideTaskChain ? (
                  <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-3">
                    <p className="font-bold text-stone-950">{firstOutsideTaskChain.title}</p>
                    <p className="mt-1 text-xs">{firstOutsideTaskChain.description}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-teal-700"
                        style={{ width: `${Math.round((firstOutsideTaskChain.completedStepIds.length / firstOutsideTaskChain.steps.length) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold">
                      {firstOutsideTaskChain.completedStepIds.length}/{firstOutsideTaskChain.steps.length} steps - {formatWorldLabel(firstOutsideTaskChain.status)}
                    </p>
                    <p className="mt-1 text-xs"><strong>Next:</strong> {firstOutsideTaskChain.steps.find((step) => step.id === firstOutsideTaskChain.currentStepId)?.nextHint ?? firstOutsideTaskChain.nextHint}</p>
                  </div>
                ) : null}
                {firstOutsideFactionChain ? (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="font-bold text-stone-950">Faction backing: {firstOutsideFactionChain.title}</p>
                    <p className="mt-1 text-xs">{firstOutsideFactionChain.completedStepIds.length}/{firstOutsideFactionChain.steps.length} faction steps - {formatWorldLabel(firstOutsideFactionChain.status)}</p>
                    <p className="mt-1 text-xs"><strong>Reward:</strong> {firstOutsideFactionChain.rewardSummary}</p>
                  </div>
                ) : null}
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
                          disabledReason={getRegionActionDisabledReason({
                            currentRegionId,
                            regionId: firstOutsideRegion.id,
                            regionName: firstOutsideRegion.name,
                            actionId: action.id,
                            taskChain: firstOutsideTaskChain,
                            hasSilvergrainSample: Boolean(silvergrainPremiumSample),
                          })}
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

        <GameCard tone={roadDispatchUnlocked ? "emerald" : "stone"} className="shadow-lg">
          <GameSectionHeader
            eyebrow="Creature Road Dispatch"
            title="Brindlewood Assignments"
            description="After the player proves the road personally, barn creatures can take repeatable road jobs for Wayfarer Dispatch."
            tone={roadDispatchUnlocked ? "emerald" : "stone"}
          >
            <GameStatusBadge tone={roadDispatchUnlocked ? "emerald" : "stone"}>
              {roadDispatchUnlocked ? "Unlocked" : "Locked"}
            </GameStatusBadge>
          </GameSectionHeader>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div className="space-y-4">
              {!roadDispatchUnlocked ? (
                <GameFeedbackBox
                  tone="amber"
                  message="Complete Road Work on Brindlewood Road to unlock creature dispatch assignments."
                />
              ) : null}

              {latestDispatchResult ? (
                <GameFeedbackBox
                  tone={latestDispatchResult.success ? "emerald" : "rose"}
                  message={`${latestDispatchResult.title}: ${latestDispatchResult.message}`}
                />
              ) : null}

              {latestRoadIncident ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase">Latest Road Incident</p>
                      <h3 className="text-lg font-bold text-stone-950">{latestRoadIncident.title}</h3>
                    </div>
                    <GameStatusBadge tone="amber">{formatWorldLabel(latestRoadIncident.triggerType)}</GameStatusBadge>
                  </div>
                  <p className="mt-2">{latestRoadIncident.summary}</p>
                  <p className="mt-2 text-xs font-semibold">Effect: {latestRoadIncident.rewardSummary}</p>
                  {latestRoadIncident.factionConsequence ? (
                    <p className="mt-1 text-xs"><strong>Faction:</strong> {latestRoadIncident.factionConsequence}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-2">
                {brindlewoodDispatchJobs.map((job) => {
                  const selectedIds = selectedDispatchCreatures[job.jobId] ?? [];
                  const disabledReason = getDispatchDisabledReason(job);

                  return (
                    <div key={job.jobId} className="rounded-2xl border border-emerald-200 bg-white/85 p-4 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-stone-950">{job.title}</h3>
                          <p className="mt-1 text-sm text-stone-700">{job.description}</p>
                        </div>
                        <GameStatusBadge tone="teal">{job.durationMinutes}m</GameStatusBadge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <GameStatChip label="Crew" value={`1-${job.maxAssignedCreatures}`} />
                        <GameStatChip label="Stamina" value={`${job.minStamina}+ / -${job.staminaCost}`} />
                        <GameStatChip label="Gold" value={job.baseRewardGold} />
                        <GameStatChip label="Rep" value={`+${job.factionReputationReward}`} />
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-stone-700">
                        <p><strong>Best helpers:</strong> {job.idealSpecies.join(", ")}</p>
                        <p><strong>Looks for:</strong> {formatWorldList(job.idealStats)}; {formatWorldList(job.idealSkills)}</p>
                        <p><strong>Success:</strong> {job.successSummary}</p>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase text-emerald-900">Choose Crew</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {creatures.map((creature) => {
                            const selected = selectedIds.includes(creature.id);
                            const busy = assignedDispatchCreatureIds.has(creature.id);
                            const tired = creature.breedingStamina < job.minStamina;
                            return (
                              <button
                                key={`${job.jobId}-${creature.id}`}
                                type="button"
                                disabled={busy || (!selected && selectedIds.length >= job.maxAssignedCreatures)}
                                onClick={() => toggleDispatchCreature(job.jobId, creature.id, job.maxAssignedCreatures)}
                                className={`min-h-14 rounded-xl border px-3 py-2 text-left text-xs shadow-sm ${
                                  selected
                                    ? "border-emerald-700 bg-emerald-700 text-white"
                                    : busy || tired
                                      ? "border-stone-200 bg-stone-100 text-stone-500"
                                      : "border-emerald-200 bg-emerald-50 text-stone-800"
                                }`}
                              >
                                <span className="block font-bold">{creature.nickname}</span>
                                <span className="block">
                                  {creature.name} - Sta {creature.breedingStamina}/{creature.maxBreedingStamina}
                                  {busy ? " - Assigned" : tired ? " - Low stamina" : ""}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {disabledReason ? (
                        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950">
                          {disabledReason}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        disabled={Boolean(disabledReason)}
                        onClick={() => startRoadDispatch(job.jobId, selectedIds)}
                        className={`mt-4 min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow ${
                          disabledReason ? "bg-stone-400" : "bg-emerald-700"
                        }`}
                      >
                        Start Dispatch
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                <h3 className="text-lg font-bold text-stone-950">Active Crews</h3>
                <div className="mt-3 grid gap-2">
                  {activeDispatches.length === 0 ? (
                    <GameEmptyState>No creatures are out on road dispatch right now.</GameEmptyState>
                  ) : (
                    activeDispatches.map((dispatch) => {
                      const job = roadDispatchJobs.find((entry) => entry.jobId === dispatch.jobId);
                      const crew = dispatch.creatureIds
                        .map((creatureId) => creatures.find((creature) => creature.id === creatureId)?.nickname)
                        .filter(Boolean)
                        .join(", ");
                      const ready = currentTotalMinutes >= dispatch.readyAtTotalMinutes;
                      return (
                        <div key={dispatch.dispatchId} className="rounded-xl border border-teal-200 bg-white p-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-stone-950">{job?.title ?? dispatch.jobId}</p>
                            <GameStatusBadge tone={ready ? "emerald" : "amber"}>
                              {ready ? "Ready" : "On Road"}
                            </GameStatusBadge>
                          </div>
                          <p className="mt-1 text-xs"><strong>Crew:</strong> {crew || "Unknown crew"}</p>
                          <p className="mt-1 text-xs"><strong>Due:</strong> {formatReadyTime(dispatch.readyAtTotalMinutes)}</p>
                          <button
                            type="button"
                            disabled={!ready}
                            onClick={() => resolveRoadDispatch(dispatch.dispatchId)}
                            className={`mt-3 min-h-11 w-full rounded-xl px-3 py-2 text-xs font-semibold text-white shadow ${
                              ready ? "bg-teal-700" : "bg-stone-400"
                            }`}
                          >
                            {ready ? "Resolve Dispatch" : "Not Ready Yet"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white/85 p-4">
                <h3 className="text-lg font-bold text-stone-950">Recent Dispatch Log</h3>
                <div className="mt-3 grid gap-2">
                  {completedDispatchLog.length === 0 ? (
                    <GameEmptyState>No completed road dispatches yet.</GameEmptyState>
                  ) : (
                    completedDispatchLog.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-stone-950">{entry.title}</p>
                          <GameStatusBadge tone={entry.success ? "emerald" : "amber"}>
                            {entry.success ? "Success" : "Partial"}
                          </GameStatusBadge>
                        </div>
                        <p className="mt-1">{entry.summary}</p>
                        <p className="mt-1 font-semibold">{entry.rewardSummary}</p>
                        <p className="mt-1 text-stone-500">{formatClock(entry.day, entry.hour, entry.minute)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-950">Road Incident Log</h3>
                    <p className="text-xs text-stone-700">
                      Brindlewood incidents seen: {roadIncidentCountsByRegion.brindlewood_road ?? 0}
                    </p>
                  </div>
                  <GameStatusBadge tone="amber">Risk / Reward</GameStatusBadge>
                </div>
                <div className="mt-3 grid gap-2">
                  {roadIncidentLog.length === 0 ? (
                    <GameEmptyState>No road incidents have been recorded yet.</GameEmptyState>
                  ) : (
                    roadIncidentLog.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-amber-200 bg-white p-3 text-xs text-stone-700">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-stone-950">{entry.title}</p>
                          <GameStatusBadge tone="amber">{formatWorldLabel(entry.triggerType)}</GameStatusBadge>
                        </div>
                        <p className="mt-1">{entry.summary}</p>
                        <p className="mt-1 font-semibold">Effect: {entry.rewardSummary}</p>
                        {entry.creatureNames && entry.creatureNames.length > 0 ? (
                          <p className="mt-1">Crew: {entry.creatureNames.join(", ")}</p>
                        ) : null}
                        <p className="mt-1 text-stone-500">{formatClock(entry.day, entry.hour, entry.minute)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </GameCard>

        {silvergrainRegion ? (
          <GameCard tone={silvergrainRegion.status === "locked" ? "stone" : "fuchsia"} className="shadow-lg">
            <GameSectionHeader
              eyebrow="Second Outside Route"
              title={silvergrainRegion.name}
              description="Silvergrain is the premium market route: samples, buyer terms, rare stock, price rumors, and Velvet Market Ring attention."
              tone={silvergrainRegion.status === "locked" ? "stone" : "fuchsia"}
            >
              <GameStatusBadge tone={silvergrainRegion.status === "locked" ? "stone" : currentRegionId === silvergrainRegion.id ? "emerald" : "fuchsia"}>
                {silvergrainRegion.status === "locked" ? "Locked" : currentRegionId === silvergrainRegion.id ? "Current" : "Open"}
              </GameStatusBadge>
            </GameSectionHeader>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-fuchsia-200 bg-white/85 p-4 text-sm text-stone-700">
                  <p><strong>Role:</strong> {silvergrainRegion.gameplayRole}</p>
                  <p className="mt-2"><strong>Specialty:</strong> {silvergrainRegion.regionSpecialty}</p>
                  <p className="mt-2"><strong>Preparation:</strong> {silvergrainRegion.preparationHint}</p>
                  <p className="mt-2"><strong>Rewards:</strong> {formatWorldList(silvergrainRegion.uniqueRewardHooks)}</p>
                  <p className="mt-2"><strong>Access:</strong> {silvergrainRegion.access.requirement}</p>
                  <p className="mt-2"><strong>Velvet backing:</strong> {silvergrainFactionChain?.title ?? "Private Goods Channel"}</p>
                </div>

                <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm text-stone-700">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-fuchsia-800">Premium Sample</p>
                      <h3 className="text-lg font-bold text-stone-950">
                        {silvergrainPremiumSample ? silvergrainPremiumSample.itemName : "No sample ready"}
                      </h3>
                    </div>
                    <GameStatusBadge tone={silvergrainPremiumSample ? "fuchsia" : "stone"}>
                      {silvergrainPremiumSample ? "Ready" : "Needed"}
                    </GameStatusBadge>
                  </div>
                  <p className="mt-2">
                    {silvergrainPremiumSample
                      ? `${silvergrainPremiumSample.description}. Submitting it adds ${silvergrainPremiumSample.rewardGoldBonus} gold and ${silvergrainPremiumSample.reputationBonus} Velvet reputation.`
                      : "Bring any quality produce from the Fields or a cooked good from the Ranch House before submitting a premium sample."}
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white/85 p-4">
                  <p className="text-xs font-bold uppercase text-fuchsia-800">Notable Locations</p>
                  <div className="mt-3 grid gap-2">
                    {silvergrainLocations.map((location) => (
                      <div key={location.locationId} className="rounded-xl border border-fuchsia-100 bg-fuchsia-50 px-3 py-2 text-xs text-stone-700">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-stone-950">{location.name}</p>
                          <GameStatusBadge tone={location.status === "locked" ? "stone" : "fuchsia"}>
                            {formatWorldLabel(location.status)}
                          </GameStatusBadge>
                        </div>
                        <p className="mt-1">{location.description}</p>
                        <p className="mt-1"><strong>Actions:</strong> {formatWorldList(location.actionHooks)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {silvergrainTaskChain ? (
                  <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase text-fuchsia-800">Task Chain</p>
                        <h3 className="text-lg font-bold text-stone-950">{silvergrainTaskChain.title}</h3>
                      </div>
                      <GameStatusBadge tone={silvergrainTaskChain.status === "completed" ? "emerald" : "fuchsia"}>
                        {formatWorldLabel(silvergrainTaskChain.status)}
                      </GameStatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-stone-700">{silvergrainTaskChain.description}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-fuchsia-700"
                        style={{ width: `${Math.round((silvergrainTaskChain.completedStepIds.length / silvergrainTaskChain.steps.length) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold">
                      {silvergrainTaskChain.completedStepIds.length}/{silvergrainTaskChain.steps.length} steps - Next: {silvergrainTaskChain.steps.find((step) => step.id === silvergrainTaskChain.currentStepId)?.title ?? silvergrainTaskChain.nextHint}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {silvergrainRegion.status === "locked" ? (
                  <GameEmptyState>Unlock: {silvergrainRegion.unlockCondition}</GameEmptyState>
                ) : (
                  <>
                    <GameActionCard
                      title={currentRegionId === silvergrainRegion.id ? "Current Region" : `Travel to ${silvergrainRegion.name}`}
                      performer="Player"
                      targetLabel="Traveler"
                      cost={`${silvergrainRegion.access.travelMinutes} minutes`}
                      outcome={currentRegionId === silvergrainRegion.id ? "You are already in the exchange district." : "Updates current region and marks Silvergrain visited."}
                      disabledReason={currentRegionId === silvergrainRegion.id ? "Already in this region." : undefined}
                      buttonLabel={currentRegionId === silvergrainRegion.id ? "Here Now" : "Travel"}
                      onAction={() => travelToRegion(silvergrainRegion.id)}
                      tone="fuchsia"
                    />
                    {silvergrainActions.map((action) => (
                      <GameActionCard
                        key={action.id}
                        title={action.title}
                        performer={silvergrainRegion.name}
                        targetLabel="Region"
                        cost={`${action.timeCostMinutes} minutes`}
                        outcome={action.outcome}
                        disabledReason={getRegionActionDisabledReason({
                          currentRegionId,
                          regionId: silvergrainRegion.id,
                          regionName: silvergrainRegion.name,
                          actionId: action.id,
                          taskChain: silvergrainTaskChain,
                          hasSilvergrainSample: Boolean(silvergrainPremiumSample),
                        })}
                        buttonLabel="Do Action"
                        onAction={() => performRegionAction(silvergrainRegion.id, action.id)}
                        tone="fuchsia"
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
                const locations = worldLocations.filter((location) => location.regionId === region.id);
                const taskChain = regionTaskChains.find((chain) => chain.regionId === region.id);
                const currentTaskStep = taskChain?.steps.find((step) => step.id === taskChain.currentStepId);

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
                      <GameStatChip label="Locations" value={locations.length} />
                      <GameStatChip label="Role" value={region.gameplayRole} />
                      <GameStatChip label="Specialty" value={region.regionSpecialty} />
                      {taskChain ? <GameStatChip label="Task Chain" value={`${taskChain.completedStepIds.length}/${taskChain.steps.length}`} /> : null}
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-stone-700">
                      <p><strong>Primary faction:</strong> {region.primaryFactionId ? formatWorldLabel(region.primaryFactionId) : "Local"}</p>
                      <p><strong>Unique mechanic:</strong> {region.uniqueMechanicSummary}</p>
                      <p><strong>Repeatable loop:</strong> {region.repeatableLoopSummary}</p>
                      <p><strong>Preparation:</strong> {region.preparationHint}</p>
                      <p><strong>Unique rewards:</strong> {formatWorldList(region.uniqueRewardHooks)}</p>
                      <p><strong>Risk / cost:</strong> {region.riskOrCostSummary}</p>
                      <p><strong>Future hook:</strong> {region.futureUnlockHint}</p>
                      <p><strong>Access:</strong> {region.access.requirement}</p>
                      <p><strong>Factions:</strong> {formatWorldList(region.factionHooks)}</p>
                      <p><strong>Quests:</strong> {formatWorldList(region.questHooks)}</p>
                      {taskChain ? (
                        <p><strong>Recommended:</strong> {currentTaskStep?.title ?? taskChain.nextHint}</p>
                      ) : null}
                    </div>
                    <div className="mt-3 rounded-2xl border border-white bg-white/80 p-3">
                      <p className="text-xs font-bold uppercase text-teal-800">Notable Locations</p>
                      <div className="mt-2 grid gap-2">
                        {locations.length === 0 ? (
                          <GameEmptyState>No named locations mapped yet.</GameEmptyState>
                        ) : (
                          locations.map((location) => (
                            <div key={location.locationId} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="font-bold text-stone-950">{location.name}</p>
                                  <p className="font-semibold uppercase text-teal-800">{formatWorldLabel(location.locationType)}</p>
                                </div>
                                <GameStatusBadge tone={location.status === "locked" ? "stone" : "teal"}>
                                  {formatWorldLabel(location.status)}
                                </GameStatusBadge>
                              </div>
                              <p className="mt-1">{location.description}</p>
                              <p className="mt-1"><strong>Faction:</strong> {location.associatedFactionId ? formatWorldLabel(location.associatedFactionId) : "Local"}</p>
                              <p className="mt-1"><strong>Hooks:</strong> {formatWorldList(location.actionHooks)}</p>
                              <p className="mt-1"><strong>Access:</strong> {location.travelAccessNote}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    {locked ? (
                      <p className="mt-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700">
                        Unlock: {region.unlockCondition}
                      </p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => travelToRegion(region.id)}
                          className={`min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow ${isCurrent ? "bg-stone-400" : "bg-teal-700"}`}
                        >
                          {isCurrent ? "Current Region" : `Travel ${region.access.travelMinutes}m`}
                        </button>
                        <div className="grid gap-2">
                          {actions.length === 0 ? (
                            <GameEmptyState>No local actions available yet.</GameEmptyState>
                          ) : (
                            actions.map((action) => (
                              <GameActionCard
                                key={action.id}
                                title={action.title}
                                performer={region.name}
                                targetLabel="Region"
                                cost={`${action.timeCostMinutes} minutes`}
                                outcome={action.outcome}
                                disabledReason={getRegionActionDisabledReason({
                                  currentRegionId,
                                  regionId: region.id,
                                  regionName: region.name,
                                  actionId: action.id,
                                  taskChain,
                                  hasSilvergrainSample: Boolean(silvergrainPremiumSample),
                                })}
                                buttonLabel="Do Action"
                                onAction={() => performRegionAction(region.id, action.id)}
                                tone="emerald"
                              />
                            ))
                          )}
                        </div>
                      </div>
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
