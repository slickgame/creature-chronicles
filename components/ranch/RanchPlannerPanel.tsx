"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_BUILDINGS,
  FeedQuality,
  PlannerCreature,
  RANCH_TASKS,
  RanchShift,
  RanchTaskId,
  SHIFTS,
  TaskAssignmentMap,
  calculateTaskProjection,
  createEmptyAssignments,
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
import StaminaStatusBar from "@/components/ui/StaminaStatusBar";

const PLANNER_DRAFT_KEY = "creature-chronicles-ranch-planner-draft";
const PLANNER_COMMITTED_KEY = "creature-chronicles-ranch-planner-committed";

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
        const nextScheduledCost = currentScheduledCost + Math.max(0, projected.projectedStaminaCost);

        if (nextScheduledCost > creature.breedingStamina) continue;

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
  locked,
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
  locked: boolean;
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
      ? Math.max(0, currentTotalProjected - Math.max(0, projection.projectedStaminaCost))
      : currentTotalProjected + Math.max(0, projection.projectedStaminaCost);

    const exceedsAvailableStamina = nextProjectedTotal > creature.breedingStamina;

    return {
      creature,
      projection,
      alreadyAssignedThisShift,
      currentlyInTask,
      nextProjectedTotal,
      exceedsAvailableStamina,
      roleTags: getCreatureRoleTags(creature),
    };
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border-4 border-emerald-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-200 px-5 py-4">
          <div>
            <h3 className="text-2xl font-bold text-emerald-950">
              {locked ? "View Assignments" : "Assign Creatures"} — {selectedTask.title}
            </h3>
            <p className="text-sm text-stone-600">
              {locked
                ? "This schedule is already committed for the day."
                : `Click a creature to fill or clear a slot for the ${shift} shift.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-stone-800 px-4 py-3 font-semibold text-white shadow"
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
                            locked ||
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
                              : locked || alreadyAssignedThisShift || exceedsAvailableStamina
                              ? "bg-stone-300 text-stone-600"
                              : "bg-emerald-700 text-white"
                          }`}
                        >
                          {currentlyInTask
                            ? locked
                              ? "Assigned"
                              : "Remove"
                            : locked
                            ? "Locked"
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
                        <StaminaStatusBar
                          current={creature.breedingStamina}
                          max={creature.maxBreedingStamina}
                          reserved={nextProjectedTotal}
                          label="Breeding Stamina"
                        />
                        <div className="mt-2 grid gap-1 text-xs text-stone-700">
                          <p><strong>Total Reserved Cost:</strong> {nextProjectedTotal}</p>
                          <p><strong>Remaining After Tasks:</strong> {Math.max(0, creature.breedingStamina - nextProjectedTotal)}</p>
                          <p className={Math.max(0, creature.breedingStamina - nextProjectedTotal) < 12 ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                            {Math.max(0, creature.breedingStamina - nextProjectedTotal) < 12
                              ? "Breeding blocked after this schedule."
                              : "Enough stamina remains for breeding."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-1 text-xs text-stone-700 sm:grid-cols-2">
                        <p><strong>Projected Task Score:</strong> {projection.score}</p>
                        <p><strong>Task Range:</strong> {projection.projectedOutputMin}–{projection.projectedOutputMax} {selectedTask.outputLabel}</p>
                        <p><strong>Shift Cost:</strong> {projection.projectedStaminaCost}</p>
                        <p><strong>Injury Risk:</strong> {projection.injuryRisk}</p>
                        <p><strong>Mood Change:</strong> {projection.moodDelta >= 0 ? "+" : ""}{projection.moodDelta}</p>
                        <p><strong>Cleanliness Change:</strong> {projection.cleanlinessDelta >= 0 ? "+" : ""}{projection.cleanlinessDelta}</p>
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
  onCommitSchedule,
}: {
  creatures: PlannerCreature[];
  currentDay: number;
  cleanliness: number;
  foodStock: number;
  onCommitSchedule?: (assignments: TaskAssignmentMap) => void;
}) {
  const weather = useMemo(() => getWeatherForDay(currentDay), [currentDay]);
  const feedQuality = useMemo<FeedQuality>(() => getFeedQualityFromStocks(foodStock), [foodStock]);

  const [assignments, setAssignments] = useState<TaskAssignmentMap>(createEmptyAssignments());
  const [activeShift, setActiveShift] = useState<RanchShift>("morning");
  const [selectedTaskId, setSelectedTaskId] = useState(RANCH_TASKS[0].id);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalTaskId, setAssignModalTaskId] = useState<RanchTaskId>(RANCH_TASKS[0].id);
  const [scheduleCommitted, setScheduleCommitted] = useState(false);
  const [plannerMessage, setPlannerMessage] = useState<string | null>(null);
  const hasLoadedFromStorage = useRef(false);

  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    try {
      const committedRaw = localStorage.getItem(PLANNER_COMMITTED_KEY);
      if (committedRaw) {
        const parsed = JSON.parse(committedRaw) as TaskAssignmentMap;
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
          setScheduleCommitted(true);
          hasLoadedFromStorage.current = true;
          return;
        }
      }

      const draftRaw = localStorage.getItem(PLANNER_DRAFT_KEY);
      if (draftRaw) {
        const parsed = JSON.parse(draftRaw) as TaskAssignmentMap;
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
      }
    } catch {}
    hasLoadedFromStorage.current = true;
  }, [creatures, weather, feedQuality, cleanliness]);

  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;
    const cleaned = sanitizeAssignmentsForCurrentCreatures(
      assignments,
      creatures,
      weather,
      feedQuality,
      cleanliness
    );

    if (scheduleCommitted) {
      localStorage.setItem(PLANNER_COMMITTED_KEY, JSON.stringify(cleaned));
      localStorage.removeItem(PLANNER_DRAFT_KEY);
    } else {
      localStorage.setItem(PLANNER_DRAFT_KEY, JSON.stringify(cleaned));
    }
  }, [assignments, creatures, weather, feedQuality, cleanliness, scheduleCommitted]);

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

  const dashboard = useMemo(() => {
    const totalProjectedCost = projectedCreatureSummaries.reduce((sum, item) => sum + item.totalProjectedCost, 0);
    const breedingReady = projectedCreatureSummaries.filter((item) => !item.breedingLocked).length;
    const totalOutputMin = SHIFTS.reduce((sum, shift) => {
      return sum + RANCH_TASKS.reduce((taskSum, task) => {
        return taskSum + getShiftTaskProjection(
          shift,
          task,
          assignments,
          creatures,
          weather,
          feedQuality,
          cleanliness,
          DEFAULT_BUILDINGS
        ).projectedOutputMin;
      }, 0);
    }, 0);
    const totalOutputMax = SHIFTS.reduce((sum, shift) => {
      return sum + RANCH_TASKS.reduce((taskSum, task) => {
        return taskSum + getShiftTaskProjection(
          shift,
          task,
          assignments,
          creatures,
          weather,
          feedQuality,
          cleanliness,
          DEFAULT_BUILDINGS
        ).projectedOutputMax;
      }, 0);
    }, 0);

    return {
      totalProjectedCost,
      breedingReady,
      totalOutputMin,
      totalOutputMax,
    };
  }, [projectedCreatureSummaries, assignments, creatures, weather, feedQuality, cleanliness]);

  function openAssignModal(taskId: RanchTaskId) {
    setSelectedTaskId(taskId);
    setAssignModalTaskId(taskId);
    setAssignModalOpen(true);
  }

  function handleCommitSchedule() {
    const cleaned = sanitizeAssignmentsForCurrentCreatures(
      assignments,
      creatures,
      weather,
      feedQuality,
      cleanliness
    );
    setAssignments(cleaned);
    setScheduleCommitted(true);
    setPlannerMessage("Schedule committed. These task reservations now define today's available stamina.");
    onCommitSchedule?.(cleaned);
  }

  return (
    <>
      <section className="mt-6 rounded-3xl border-4 border-emerald-900 bg-white/90 p-5 shadow-xl">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-emerald-950">Ranch Planner</h2>
            <p className="text-stone-600">
              Draft the workday first, then commit the schedule. Remaining stamina after reservation is what the creatures truly have left.
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
              <p className="text-stone-500">Planner Status</p>
              <p className="font-semibold text-stone-900">
                {scheduleCommitted ? "Committed" : "Draft"}
              </p>
            </div>
          </div>
        </div>

        {plannerMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {plannerMessage}
          </div>
        ) : null}

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">Projected Total Output</p>
            <p className="text-lg font-bold text-stone-900">
              {dashboard.totalOutputMin}–{dashboard.totalOutputMax}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">Reserved Stamina</p>
            <p className="text-lg font-bold text-stone-900">{dashboard.totalProjectedCost}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">Breeding Ready After Reservation</p>
            <p className="text-lg font-bold text-stone-900">{dashboard.breedingReady}/{creatures.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">Cleanliness</p>
            <p className="text-lg font-bold text-stone-900">{cleanliness}/100</p>
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
            onClick={handleCommitSchedule}
            disabled={scheduleCommitted}
            className={`ml-auto rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow ${
              scheduleCommitted ? "bg-stone-400" : "bg-rose-700"
            }`}
          >
            {scheduleCommitted ? "Schedule Committed" : "Commit Schedule"}
          </button>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {projectedCreatureSummaries.map(({ creature, totalProjectedCost, projectedRemaining, breedingLocked }) => (
            <div key={creature.id} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                  {getCreaturePortrait(creature.name)}
                </div>
                <div>
                  <p className="font-bold text-stone-900">{creature.nickname}</p>
                  <p className="text-xs text-stone-600">{creature.name}</p>
                </div>
              </div>

              <StaminaStatusBar
                current={creature.breedingStamina}
                max={creature.maxBreedingStamina}
                reserved={totalProjectedCost}
                label="Breeding Stamina"
                compact
              />
              <div className="mt-2 text-xs text-stone-700">
                <p><strong>Reserved:</strong> {totalProjectedCost}</p>
                <p><strong>Remaining:</strong> {projectedRemaining}</p>
                <p className={breedingLocked ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                  {breedingLocked ? "Breeding blocked." : "Breeding still possible."}
                </p>
              </div>
            </div>
          ))}
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
        locked={scheduleCommitted}
      />
    </>
  );
}
