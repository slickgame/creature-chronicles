"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_BUILDINGS,
  FeedQuality,
  PlannerCreature,
  RANCH_TASKS,
  RanchRecapSlide,
  RanchShift,
  RanchTaskId,
  SHIFTS,
  TaskAssignmentMap,
  calculateTaskProjection,
  createEmptyAssignments,
  generateRecapSlides,
  getCreaturePortrait,
  getCreatureRoleTags,
  getFeedQualityFromStocks,
  getFeedQualityLabel,
  getShiftTaskProjection,
  getTaskById,
  getTotalProjectedCostForCreature,
  getWeatherForDay,
  getWeatherLabel,
  toggleAssignment,
} from "@/lib/ranch/planner";

function staminaBarWidth(current: number, max: number) {
  if (max <= 0) return "0%";
  return `${Math.max(0, Math.min(100, Math.round((current / max) * 100)))}%`;
}

function projectedBarWidth(current: number, cost: number, max: number) {
  if (max <= 0) return "0%";
  const remaining = Math.max(0, current - cost);
  return `${Math.max(0, Math.min(100, Math.round((remaining / max) * 100)))}%`;
}

function sanitizeAssignmentsForCurrentCreatures(
  assignments: TaskAssignmentMap,
  creatures: PlannerCreature[],
  weather: ReturnType<typeof getWeatherForDay>,
  feedQuality: FeedQuality,
  cleanliness: number
): TaskAssignmentMap {
  const validCreatureIds = new Set(creatures.map((creature) => creature.id));
  const cleaned = createEmptyAssignments();
  const perCreatureCost = new Map<number, number>();

  for (const shift of SHIFTS) {
    for (const task of RANCH_TASKS) {
      const taskDef = getTaskById(task.id);
      const originalIds = assignments?.[shift]?.[task.id] ?? [];
      const uniqueIds = Array.from(new Set(originalIds)).filter((id) => validCreatureIds.has(id));

      for (const creatureId of uniqueIds) {
        if (cleaned[shift][task.id].length >= taskDef.slotCount) continue;

        const creature = creatures.find((item) => item.id === creatureId);
        if (!creature) continue;

        const alreadyAssignedThisShift = Object.values(cleaned[shift]).some((ids) =>
          ids.includes(creatureId)
        );
        if (alreadyAssignedThisShift) continue;

        const projected = calculateTaskProjection(
          creature,
          taskDef,
          weather,
          feedQuality,
          cleanliness,
          DEFAULT_BUILDINGS
        );

        const currentScheduledCost = perCreatureCost.get(creatureId) ?? 0;
        const nextScheduledCost = currentScheduledCost + projected.projectedStaminaCost;

        if (nextScheduledCost > creature.breedingStamina) {
          continue;
        }

        cleaned[shift][task.id].push(creatureId);
        perCreatureCost.set(creatureId, nextScheduledCost);
      }
    }
  }

  return cleaned;
}

function AssignCreatureModal({
  open,
  onClose,
  shift,
  taskId,
  creatures,
  assignments,
  setAssignments,
  weather,
  feedQuality,
  cleanliness,
}: {
  open: boolean;
  onClose: () => void;
  shift: RanchShift;
  taskId: RanchTaskId;
  creatures: PlannerCreature[];
  assignments: TaskAssignmentMap;
  setAssignments: React.Dispatch<React.SetStateAction<TaskAssignmentMap>>;
  weather: ReturnType<typeof getWeatherForDay>;
  feedQuality: FeedQuality;
  cleanliness: number;
}) {
  if (!open) return null;

  const selectedTask = getTaskById(taskId);

  const candidateCards = creatures.map((creature) => {
    const projection = calculateTaskProjection(
      creature,
      selectedTask,
      weather,
      feedQuality,
      cleanliness,
      DEFAULT_BUILDINGS
    );

    const alreadyAssignedThisShift =
      Object.values(assignments[shift]).some((ids) => ids.includes(creature.id)) &&
      !assignments[shift][taskId].includes(creature.id);

    const currentTotalProjected = getTotalProjectedCostForCreature(
      creature,
      assignments,
      weather,
      feedQuality,
      cleanliness,
      DEFAULT_BUILDINGS
    );

    const currentlyInTask = assignments[shift][taskId].includes(creature.id);

    const nextProjectedTotal = currentlyInTask
      ? currentTotalProjected - projection.projectedStaminaCost
      : currentTotalProjected + projection.projectedStaminaCost;

    const exceedsAvailableStamina = nextProjectedTotal > creature.breedingStamina;

    const roleTags = getCreatureRoleTags(creature);

    return {
      creature,
      projection,
      alreadyAssignedThisShift,
      currentlyInTask,
      currentTotalProjected,
      nextProjectedTotal,
      exceedsAvailableStamina,
      roleTags,
    };
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border-4 border-emerald-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-200 px-5 py-4">
          <div>
            <h3 className="text-2xl font-bold text-emerald-950">
              Assign Creatures — {selectedTask.title}
            </h3>
            <p className="text-sm text-stone-600">
              Click a creature to fill or clear a slot for the {shift} shift.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-stone-800 px-4 py-3 text-white font-semibold shadow"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow">
            <h4 className="text-xl font-bold text-stone-900">{selectedTask.title}</h4>
            <p className="text-sm text-stone-700">{selectedTask.description}</p>
            <div className="mt-3 grid gap-1 text-sm text-stone-800">
              <p><strong>Location:</strong> {selectedTask.location}</p>
              <p><strong>Current Assignments:</strong> {assignments[shift][taskId].length}/{selectedTask.slotCount}</p>
            </div>
          </div>

          <div className="space-y-3">
            {candidateCards.map(
              ({
                creature,
                projection,
                alreadyAssignedThisShift,
                currentlyInTask,
                exceedsAvailableStamina,
                nextProjectedTotal,
                roleTags,
              }) => (
                <div
                  key={creature.id}
                  className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                      {getCreaturePortrait(creature.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-bold text-stone-900">{creature.nickname}</p>
                          <p className="text-sm text-stone-600">
                            {creature.name} • Lv {creature.level}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={
                            (alreadyAssignedThisShift && !currentlyInTask) ||
                            (!currentlyInTask && exceedsAvailableStamina)
                          }
                          onClick={() => {
                            setAssignments((prev) => {
                              const next = toggleAssignment(prev, shift, taskId, creature.id);
                              return sanitizeAssignmentsForCurrentCreatures(
                                next,
                                creatures,
                                weather,
                                feedQuality,
                                cleanliness
                              );
                            });
                          }}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                            currentlyInTask
                              ? "bg-red-600 text-white"
                              : alreadyAssignedThisShift || exceedsAvailableStamina
                              ? "bg-stone-300 text-stone-600"
                              : "bg-emerald-700 text-white"
                          }`}
                        >
                          {currentlyInTask
                            ? "Remove"
                            : alreadyAssignedThisShift
                            ? "Busy This Shift"
                            : exceedsAvailableStamina
                            ? "Not Enough Stamina"
                            : "Assign"}
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {roleTags.map((tag) => (
                          <div
                            key={`${creature.id}-${tag}`}
                            className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-900"
                          >
                            {tag}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-2xl bg-stone-50 p-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-stone-600">
                          <span>Breeding Stamina</span>
                          <span>{creature.breedingStamina}/{creature.maxBreedingStamina}</span>
                        </div>
                        <div className="relative h-3 overflow-hidden rounded-full bg-stone-200">
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-emerald-500"
                            style={{
                              width: staminaBarWidth(
                                creature.breedingStamina,
                                creature.maxBreedingStamina
                              ),
                            }}
                          />
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-rose-400/70"
                            style={{
                              width: projectedBarWidth(
                                creature.breedingStamina,
                                nextProjectedTotal,
                                creature.maxBreedingStamina
                              ),
                            }}
                          />
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-stone-700">
                          <p><strong>Task Cost (day total if assigned):</strong> {nextProjectedTotal}</p>
                          <p>
                            <strong>Remaining After Tasks:</strong>{" "}
                            {Math.max(0, creature.breedingStamina - nextProjectedTotal)}
                          </p>
                          <p
                            className={
                              Math.max(0, creature.breedingStamina - nextProjectedTotal) < 12
                                ? "font-semibold text-red-700"
                                : "font-semibold text-emerald-700"
                            }
                          >
                            {Math.max(0, creature.breedingStamina - nextProjectedTotal) < 12
                              ? "Breeding blocked after this schedule."
                              : "Enough stamina remains for breeding."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-1 text-xs text-stone-700 sm:grid-cols-2">
                        <p><strong>Projected Task Score:</strong> {projection.score}</p>
                        <p>
                          <strong>Task Range:</strong> {projection.projectedOutputMin}–
                          {projection.projectedOutputMax} {selectedTask.outputLabel}
                        </p>
                        <p><strong>Shift Cost:</strong> {projection.projectedStaminaCost}</p>
                        <p><strong>Injury Risk:</strong> {projection.injuryRisk}</p>
                        <p><strong>Mood Change:</strong> {projection.moodDelta >= 0 ? "+" : ""}{projection.moodDelta}</p>
                        <p>
                          <strong>Cleanliness Change:</strong>{" "}
                          {projection.cleanlinessDelta >= 0 ? "+" : ""}
                          {projection.cleanlinessDelta}
                        </p>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-stone-600">
                        {projection.notes.slice(0, 3).map((note, index) => (
                          <p key={`${creature.id}-note-${index}`}>• {note}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RanchPlannerPanel({
  creatures,
  currentDay,
  cleanliness,
  foodStock,
  onAdvanceDay,
}: {
  creatures: PlannerCreature[];
  currentDay: number;
  cleanliness: number;
  foodStock: number;
  onAdvanceDay?: () => void;
}) {
  const storageKey = "creature-chronicles-ranch-planner";
  const weather = useMemo(() => getWeatherForDay(currentDay), [currentDay]);
  const feedQuality = useMemo<FeedQuality>(() => getFeedQualityFromStocks(foodStock), [foodStock]);

  const [assignments, setAssignments] = useState<TaskAssignmentMap>(createEmptyAssignments());
  const [activeShift, setActiveShift] = useState<RanchShift>("morning");
  const [selectedTaskId, setSelectedTaskId] = useState(RANCH_TASKS[0].id);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalTaskId, setAssignModalTaskId] = useState<RanchTaskId>(RANCH_TASKS[0].id);
  const [recapOpen, setRecapOpen] = useState(false);
  const [recapSlides, setRecapSlides] = useState<RanchRecapSlide[]>([]);
  const [recapIndex, setRecapIndex] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TaskAssignmentMap;
      if (parsed?.morning && parsed?.afternoon && parsed?.evening) {
        setAssignments(
          sanitizeAssignmentsForCurrentCreatures(
            parsed,
            creatures,
            weather,
            feedQuality,
            cleanliness
          )
        );
      }
    } catch {}
  }, [creatures, weather, feedQuality, cleanliness]);

  useEffect(() => {
    const cleaned = sanitizeAssignmentsForCurrentCreatures(
      assignments,
      creatures,
      weather,
      feedQuality,
      cleanliness
    );
    localStorage.setItem(storageKey, JSON.stringify(cleaned));
  }, [assignments, creatures, weather, feedQuality, cleanliness]);

  const selectedTask = getTaskById(selectedTaskId);

  const projectedCreatureSummaries = useMemo(() => {
    return creatures.map((creature) => {
      const totalProjectedCost = getTotalProjectedCostForCreature(
        creature,
        assignments,
        weather,
        feedQuality,
        cleanliness,
        DEFAULT_BUILDINGS
      );
      const projectedRemaining = Math.max(0, creature.breedingStamina - totalProjectedCost);

      return {
        creature,
        totalProjectedCost,
        projectedRemaining,
        breedingLocked: projectedRemaining < 12,
        roleTags: getCreatureRoleTags(creature),
      };
    });
  }, [creatures, assignments, weather, feedQuality, cleanliness]);

  const taskProjection = useMemo(() => {
    return getShiftTaskProjection(
      activeShift,
      selectedTask,
      assignments,
      creatures,
      weather,
      feedQuality,
      cleanliness,
      DEFAULT_BUILDINGS
    );
  }, [activeShift, selectedTask, assignments, creatures, weather, feedQuality, cleanliness]);

  const dashboard = useMemo(() => {
    const totalProjectedCost = projectedCreatureSummaries.reduce(
      (sum, item) => sum + item.totalProjectedCost,
      0
    );
    const breedingReady = projectedCreatureSummaries.filter(
      (item) => !item.breedingLocked
    ).length;
    const totalOutputMin = SHIFTS.reduce((sum, shift) => {
      return (
        sum +
        RANCH_TASKS.reduce((taskSum, task) => {
          return (
            taskSum +
            getShiftTaskProjection(
              shift,
              task,
              assignments,
              creatures,
              weather,
              feedQuality,
              cleanliness,
              DEFAULT_BUILDINGS
            ).projectedOutputMin
          );
        }, 0)
      );
    }, 0);
    const totalOutputMax = SHIFTS.reduce((sum, shift) => {
      return (
        sum +
        RANCH_TASKS.reduce((taskSum, task) => {
          return (
            taskSum +
            getShiftTaskProjection(
              shift,
              task,
              assignments,
              creatures,
              weather,
              feedQuality,
              cleanliness,
              DEFAULT_BUILDINGS
            ).projectedOutputMax
          );
        }, 0)
      );
    }, 0);
    const averageCleanlinessTrend = SHIFTS.reduce((sum, shift) => {
      return (
        sum +
        RANCH_TASKS.reduce((taskSum, task) => {
          const ids = assignments[shift][task.id];
          return (
            taskSum +
            ids.reduce((creatureSum, creatureId) => {
              const creature = creatures.find((item) => item.id === creatureId);
              if (!creature) return creatureSum;
              return (
                creatureSum +
                calculateTaskProjection(
                  creature,
                  task,
                  weather,
                  feedQuality,
                  cleanliness,
                  DEFAULT_BUILDINGS
                ).cleanlinessDelta
              );
            }, 0)
          );
        }, 0)
      );
    }, 0);

    return {
      totalProjectedCost,
      breedingReady,
      totalOutputMin,
      totalOutputMax,
      averageCleanlinessTrend,
    };
  }, [projectedCreatureSummaries, assignments, creatures, weather, feedQuality, cleanliness]);

  function openAssignModal(taskId: RanchTaskId) {
    setSelectedTaskId(taskId);
    setAssignModalTaskId(taskId);
    setAssignModalOpen(true);
  }

  function handleResolveDay() {
    const cleaned = sanitizeAssignmentsForCurrentCreatures(
      assignments,
      creatures,
      weather,
      feedQuality,
      cleanliness
    );
    setAssignments(cleaned);

    const slides = generateRecapSlides(
      cleaned,
      creatures,
      weather,
      feedQuality,
      cleanliness,
      DEFAULT_BUILDINGS
    );
    setRecapSlides(slides);
    setRecapIndex(0);
    setRecapOpen(true);
  }

  function handleAdvanceRecap() {
    if (recapIndex < recapSlides.length - 1) {
      setRecapIndex((prev) => prev + 1);
      return;
    }

    setRecapOpen(false);
    setAssignments(createEmptyAssignments());
    localStorage.removeItem(storageKey);
    onAdvanceDay?.();
  }

  const currentSlide = recapSlides[recapIndex] ?? null;

  return (
    <>
      <section className="mt-6 rounded-3xl border-4 border-emerald-900 bg-white/90 p-5 shadow-xl">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-emerald-950">Ranch Planner</h2>
            <p className="text-stone-600">
              Assign daily jobs by shift. Projections use stats, skills, species fit, role tags, feed, weather, and traits.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Weather</p>
              <p className="font-semibold text-stone-900">{getWeatherLabel(weather)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Feed Quality</p>
              <p className="font-semibold text-stone-900">{getFeedQualityLabel(feedQuality)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Cleanliness</p>
              <p className="font-semibold text-stone-900">{cleanliness}/100</p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">Projected Total Output</p>
            <p className="text-lg font-bold text-stone-900">
              {dashboard.totalOutputMin}–{dashboard.totalOutputMax}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">Projected Stamina Burn</p>
            <p className="text-lg font-bold text-stone-900">{dashboard.totalProjectedCost}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">Breeding Ready After Tasks</p>
            <p className="text-lg font-bold text-stone-900">{dashboard.breedingReady}/{creatures.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">Cleanliness Trend</p>
            <p className="text-lg font-bold text-stone-900">
              {dashboard.averageCleanlinessTrend >= 0 ? "+" : ""}
              {dashboard.averageCleanlinessTrend}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {SHIFTS.map((shift) => (
            <button
              key={shift}
              type="button"
              onClick={() => setActiveShift(shift)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeShift === shift
                  ? "bg-emerald-700 text-white"
                  : "border border-emerald-300 bg-white text-stone-800"
              }`}
            >
              {shift[0].toUpperCase() + shift.slice(1)}
            </button>
          ))}

          <button
            type="button"
            onClick={handleResolveDay}
            className="ml-auto rounded-2xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Resolve Day
          </button>
        </div>

        <div className="grid gap-5">
          <div>
            <h3 className="mb-3 text-xl font-bold text-stone-900">Task Boxes</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {RANCH_TASKS.map((task) => {
                const shiftProjection = getShiftTaskProjection(
                  activeShift,
                  task,
                  assignments,
                  creatures,
                  weather,
                  feedQuality,
                  cleanliness,
                  DEFAULT_BUILDINGS
                );
                const assignedCreatures = creatures.filter((creature) =>
                  assignments[activeShift][task.id].includes(creature.id)
                );

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl border-2 p-4 text-left shadow ${
                      selectedTaskId === task.id
                        ? "border-emerald-700 bg-emerald-100"
                        : "border-emerald-200 bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(task.id)}
                        className="text-left"
                      >
                        <p className="text-lg font-bold text-stone-900">{task.title}</p>
                        <p className="text-sm text-stone-600">{task.location}</p>
                      </button>

                      <div className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900">
                        {assignedCreatures.length}/{task.slotCount}
                      </div>
                    </div>

                    <p className="mb-3 text-sm text-stone-700">{task.description}</p>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {Array.from({ length: task.slotCount }).map((_, index) => {
                        const assigned = assignedCreatures[index];
                        return (
                          <button
                            key={`${task.id}-slot-${index}`}
                            type="button"
                            onClick={() => openAssignModal(task.id)}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 text-2xl hover:border-emerald-500"
                            title={assigned ? `${assigned.nickname} — click to manage` : "Open slot — click to assign"}
                          >
                            {assigned ? getCreaturePortrait(assigned.name) : "＋"}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid gap-1 text-xs text-stone-700">
                      <p><strong>Projected Outcome:</strong> {shiftProjection.projectedOutputMin}–{shiftProjection.projectedOutputMax} {task.outputLabel}</p>
                      <p><strong>Projected Cost:</strong> {shiftProjection.totalProjectedCost} stamina</p>
                      {shiftProjection.summaryNotes.length > 0 ? (
                        <p><strong>Notes:</strong> {shiftProjection.summaryNotes[0]}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <AssignCreatureModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        shift={activeShift}
        taskId={assignModalTaskId}
        creatures={creatures}
        assignments={assignments}
        setAssignments={setAssignments}
        weather={weather}
        feedQuality={feedQuality}
        cleanliness={cleanliness}
      />

      {recapOpen && currentSlide ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
          <div className="flex h-[84vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-4 border-rose-900 bg-white shadow-2xl">
            <div className="border-b border-rose-200 px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-rose-700">
                    End of Day Recap • Slide {recapIndex + 1} / {recapSlides.length}
                  </p>
                  <h3 className="text-3xl font-bold text-rose-950">{currentSlide.headline}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setRecapOpen(false)}
                  className="rounded-2xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex min-h-full flex-col items-center justify-center rounded-3xl bg-rose-50 p-6 text-center">
                <div className="mb-5 text-8xl">{currentSlide.image}</div>
                <p className="max-w-2xl text-lg text-stone-800">{currentSlide.body}</p>
                <p className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-stone-700 shadow">
                  {currentSlide.resultLine}
                </p>
              </div>
            </div>

            <div className="border-t border-rose-200 bg-white px-6 py-4">
              <button
                type="button"
                onClick={handleAdvanceRecap}
                className="w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white shadow"
              >
                {recapIndex < recapSlides.length - 1 ? "Next Scene" : "Finish Day"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
