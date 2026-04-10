
"use client";

import { useState } from "react";
import { useGame } from "@/context/GameContext";
import StaminaStatusBar from "@/components/ui/StaminaStatusBar";
import { CreatureTraitBadgeRow } from "@/components/creatures/CreatureTraitUi";
import type { CreatureTraitEntry } from "@/components/creatures/CreatureTraitUi";

type RanchTab = "house" | "fields" | "barn" | "nursery" | "breeding";
type HouseTaskId = "clean_home" | "cook_meal";
type FieldTaskId = "work_fields";

const TAB_LABELS: Record<RanchTab, string> = {
  house: "House",
  fields: "Fields",
  barn: "Barn",
  nursery: "Nursery",
  breeding: "Breeding",
};

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

function gradeMultiplier(grade: "F" | "D" | "C" | "B" | "A" | "S") {
  if (grade === "F") return 0.35;
  if (grade === "D") return 0.5;
  if (grade === "C") return 0.7;
  if (grade === "B") return 0.9;
  if (grade === "A") return 1.15;
  return 1.4;
}

function getBestTraitEntry(creature: any, trait: string) {
  const traits = Array.isArray(creature.traits) ? creature.traits : [];
  const matches = traits.filter((entry: any) => entry.trait === trait);
  if (matches.length === 0) return null;
  return matches.reduce((best: any, current: any) =>
    gradeMultiplier(current.grade) > gradeMultiplier(best.grade) ? current : best
  );
}

function getTraitFlatBonus(creature: any, trait: string, maxBonus: number) {
  const best = getBestTraitEntry(creature, trait);
  if (!best) return 0;
  return Math.max(1, Math.round(maxBonus * gradeMultiplier(best.grade)));
}

function getCreaturePortrait(species: string) {
  if (species === "Horse") return "🐎";
  if (species === "Cat") return "🐈";
  return "🩷";
}

function estimateCookMeal(creature: any) {
  const speciesBonus = creature.name === "Cat" ? 2 : 0;
  const traitBonus = getTraitFlatBonus(creature, "domestic", 3) + getTraitFlatBonus(creature, "quick", 2);
  const minutesSpent = Math.max(
    12,
    45 - Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cooking.level + speciesBonus + traitBonus) / 2)
  );
  const staminaCost = Math.max(
    4,
    14 - Math.floor((creature.stats.endurance + creature.stats.vitality) / 6) - getTraitFlatBonus(creature, "sturdy", 3)
  );
  return { minutesSpent, staminaCost };
}

function estimateCleanHome(creature: any) {
  const speciesBonus = creature.name === "Cat" ? 2 : 0;
  const traitBonus = getTraitFlatBonus(creature, "domestic", 3) + getTraitFlatBonus(creature, "quick", 2);
  const minutesSpent = Math.max(
    8,
    35 - Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cleaning.level + speciesBonus + traitBonus) / 2)
  );
  const staminaCost = Math.max(
    4,
    12 - Math.floor((creature.stats.endurance + creature.stats.speed) / 6) - getTraitFlatBonus(creature, "sturdy", 3)
  );
  return { minutesSpent, staminaCost };
}

function estimateWorkFields(creature: any) {
  const speciesBonus = creature.name === "Horse" ? 3 : 0;
  const traitBonus = getTraitFlatBonus(creature, "industrious", 4) + getTraitFlatBonus(creature, "quick", 2);
  const minutesSpent = Math.max(
    25,
    90 - Math.floor((creature.stats.strength + creature.stats.endurance + creature.skills.fieldWork.level * 2 + speciesBonus + traitBonus) / 2)
  );
  const staminaCost = Math.max(
    6,
    18 - Math.floor((creature.stats.endurance + creature.stats.strength) / 6) - getTraitFlatBonus(creature, "sturdy", 3)
  );
  return { minutesSpent, staminaCost };
}

function getBreedingStaminaCost(creature: any) {
  return Math.max(6, 22 - Math.floor(creature.stats.endurance / 2) - getTraitFlatBonus(creature, "sturdy", 3));
}

function CreatureCard({
  creature,
  selected,
  onToggle,
  subtitle,
  reserved = 0,
}: {
  creature: any;
  selected?: boolean;
  onToggle?: () => void;
  subtitle?: string;
  reserved?: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-2xl border-2 p-3 text-left shadow ${
        selected ? "border-emerald-700 bg-emerald-100" : "border-emerald-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
          {getCreaturePortrait(creature.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-stone-900">{creature.nickname}</p>
          <p className="truncate text-sm text-stone-600">{creature.name} • Lv {creature.level}</p>
          {subtitle ? <p className="mt-1 text-xs text-stone-600">{subtitle}</p> : null}
          <div className="mt-2">
            <StaminaStatusBar
              current={creature.breedingStamina}
              max={creature.maxBreedingStamina}
              reserved={reserved}
              label="Breeding Stamina"
              compact
            />
          </div>
          <div className="mt-2">
            <CreatureTraitBadgeRow
              traits={(Array.isArray(creature.traits) ? creature.traits : []) as CreatureTraitEntry[]}
              compact
              maxVisible={2}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function ResultModal({
  open,
  title,
  bodyLines,
  onClose,
}: {
  open: boolean;
  title: string;
  bodyLines: string[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border-4 border-emerald-900 bg-white shadow-2xl">
        <div className="border-b border-emerald-200 px-5 py-4">
          <h3 className="text-2xl font-bold text-emerald-950">{title}</h3>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5 text-stone-800">
          <div className="space-y-2">
            {bodyLines.map((line, index) => (
              <p key={`${title}-${index}`}>{line}</p>
            ))}
          </div>
        </div>
        <div className="border-t border-emerald-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-semibold text-white shadow"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RanchOperationsPanel({ initialTab = "house" }: { initialTab?: RanchTab }) {
  const {
    currentDay,
    currentHour,
    currentMinute,
    playerData,
    homeState,
    creatures,
    eggs,
    breedingSelection,
    setBreedingSelection,
    cleanHome,
    cookMeal,
    workFields,
    breedCreatures,
    hatchEgg,
  } = useGame();

  const [activeTab, setActiveTab] = useState<RanchTab>(initialTab);
  const [houseAssignments, setHouseAssignments] = useState<Record<HouseTaskId, number[]>>({
    clean_home: [],
    cook_meal: [],
  });
  const [fieldAssignments, setFieldAssignments] = useState<Record<FieldTaskId, number[]>>({
    work_fields: [],
  });
  const [barnCreatureId, setBarnCreatureId] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultTitle, setResultTitle] = useState("Action Result");
  const [resultLines, setResultLines] = useState<string[]>([]);

  const assignedInHouse = new Set(Object.values(houseAssignments).flat());
  const assignedInFields = new Set(Object.values(fieldAssignments).flat());

  const barnCreature =
    barnCreatureId !== null ? creatures.find((creature) => creature.id === barnCreatureId) ?? null : null;

  const giverCreature =
    breedingSelection.giverCreatureId !== null
      ? creatures.find((creature) => creature.id === breedingSelection.giverCreatureId) ?? null
      : null;

  const receiverCreature =
    breedingSelection.receiverCreatureId !== null
      ? creatures.find((creature) => creature.id === breedingSelection.receiverCreatureId) ?? null
      : null;

  function toggleHouseAssignment(taskId: HouseTaskId, creatureId: number) {
    setHouseAssignments((current) => {
      const alreadyInTask = current[taskId].includes(creatureId);
      if (alreadyInTask) {
        return { ...current, [taskId]: current[taskId].filter((id) => id !== creatureId) };
      }
      const alreadyElsewhere = Object.values(current).some((ids) => ids.includes(creatureId));
      if (alreadyElsewhere) return current;
      return { ...current, [taskId]: [...current[taskId], creatureId] };
    });
  }

  function toggleFieldAssignment(taskId: FieldTaskId, creatureId: number) {
    setFieldAssignments((current) => {
      const alreadyInTask = current[taskId].includes(creatureId);
      if (alreadyInTask) {
        return { ...current, [taskId]: current[taskId].filter((id) => id !== creatureId) };
      }
      const alreadyElsewhere = Object.values(current).some((ids) => ids.includes(creatureId));
      if (alreadyElsewhere) return current;
      return { ...current, [taskId]: [...current[taskId], creatureId] };
    });
  }

  function performHouseBatch() {
    const ops: { creature: any; taskId: HouseTaskId; minutes: number }[] = [];

    houseAssignments.clean_home.forEach((id) => {
      const creature = creatures.find((item) => item.id === id);
      if (creature) ops.push({ creature, taskId: "clean_home", minutes: estimateCleanHome(creature).minutesSpent });
    });

    houseAssignments.cook_meal.forEach((id) => {
      const creature = creatures.find((item) => item.id === id);
      if (creature) ops.push({ creature, taskId: "cook_meal", minutes: estimateCookMeal(creature).minutesSpent });
    });

    if (ops.length === 0) return;

    const longestMinutes = Math.max(...ops.map((op) => op.minutes));
    ops.sort((a, b) => a.minutes - b.minutes).forEach((op) => {
      if (op.taskId === "clean_home") cleanHome(op.creature.id);
      if (op.taskId === "cook_meal") cookMeal(op.creature.id);
    });

    setHouseAssignments({ clean_home: [], cook_meal: [] });
    setResultTitle("House Tasks Performed");
    setResultLines([
      "The selected house tasks were performed together.",
      `Time advanced by ${longestMinutes} minutes for the batch.`,
      "Each assigned creature paid her own stamina cost immediately.",
    ]);
    setResultOpen(true);
  }

  function performFieldBatch() {
    const ops: { creature: any; taskId: FieldTaskId; minutes: number }[] = [];

    fieldAssignments.work_fields.forEach((id) => {
      const creature = creatures.find((item) => item.id === id);
      if (creature) ops.push({ creature, taskId: "work_fields", minutes: estimateWorkFields(creature).minutesSpent });
    });

    if (ops.length === 0) return;

    const longestMinutes = Math.max(...ops.map((op) => op.minutes));
    ops.sort((a, b) => a.minutes - b.minutes).forEach((op) => {
      if (op.taskId === "work_fields") workFields(op.creature.id);
    });

    setFieldAssignments({ work_fields: [] });
    setResultTitle("Field Tasks Performed");
    setResultLines([
      "The selected field tasks were performed together.",
      `Time advanced by ${longestMinutes} minutes for the batch.`,
      "Wheat gains, stamina loss, and field-work progress were applied immediately.",
    ]);
    setResultOpen(true);
  }

  function performBreeding() {
    breedCreatures();
    setResultTitle("Breeding Session");
    setResultLines([
      "The selected pair entered a breeding session.",
      "Time, stamina, energy, and egg results were applied immediately through the live breeding system.",
      "Check the Nursery tab for ready eggs or newly added eggs.",
    ]);
    setResultOpen(true);
  }

  function performHatchReadyEgg(egg: any) {
    const result = hatchEgg(egg.id);
    setResultTitle(result ? "Egg Hatched" : "Hatch Failed");
    setResultLines(
      result
        ? [`${egg.name} hatched successfully.`, `${result.nickname} the ${result.name} was added to your Barn roster.`]
        : [`${egg.name} could not be hatched right now.`]
    );
    setResultOpen(true);
  }

  return (
    <>
      <section className="rounded-3xl border-4 border-emerald-900 bg-white/90 p-5 shadow-xl">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-emerald-950">Ranch Operations</h2>
            <p className="text-stone-600">
              Assign multiple creatures to multiple tasks in one area, then perform them together.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Day / Time</p>
              <p className="font-semibold text-stone-900">
                Day {currentDay} • {formatTime(currentHour, currentMinute)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Energy</p>
              <p className="font-semibold text-stone-900">{playerData.energy}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Cleanliness</p>
              <p className="font-semibold text-stone-900">{homeState.cleanliness}/100</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Food / Wheat</p>
              <p className="font-semibold text-stone-900">{homeState.foodStock} / {homeState.wheatStock}</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {(Object.keys(TAB_LABELS) as RanchTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab ? "bg-emerald-700 text-white" : "border border-emerald-300 bg-white text-stone-800"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {activeTab === "house" ? (
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
                <h3 className="mb-3 text-xl font-bold text-stone-900">Clean House</h3>
                <div className="space-y-3">
                  {creatures.map((creature) => {
                    const estimate = estimateCleanHome(creature);
                    const selected = houseAssignments.clean_home.includes(creature.id);
                    const blocked = assignedInHouse.has(creature.id) && !selected;
                    return (
                      <div key={`clean-${creature.id}`} className={blocked ? "opacity-50" : ""}>
                        <CreatureCard
                          creature={creature}
                          selected={selected}
                          onToggle={blocked ? undefined : () => toggleHouseAssignment("clean_home", creature.id)}
                          subtitle={`~${estimate.minutesSpent}m • ~${estimate.staminaCost} stamina`}
                          reserved={selected ? estimate.staminaCost : 0}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
                <h3 className="mb-3 text-xl font-bold text-stone-900">Cook Meal</h3>
                <div className="space-y-3">
                  {creatures.map((creature) => {
                    const estimate = estimateCookMeal(creature);
                    const selected = houseAssignments.cook_meal.includes(creature.id);
                    const blocked = assignedInHouse.has(creature.id) && !selected;
                    return (
                      <div key={`cook-${creature.id}`} className={blocked ? "opacity-50" : ""}>
                        <CreatureCard
                          creature={creature}
                          selected={selected}
                          onToggle={blocked ? undefined : () => toggleHouseAssignment("cook_meal", creature.id)}
                          subtitle={`~${estimate.minutesSpent}m • ~${estimate.staminaCost} stamina`}
                          reserved={selected ? estimate.staminaCost : 0}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow">
              <h3 className="text-xl font-bold text-stone-900">Perform House Tasks</h3>
              <p className="mt-2 text-sm text-stone-700">
                All selected house actions resolve together. Time advances once by the longest selected task.
              </p>
              <div className="mt-4 text-sm text-stone-800">
                <p><strong>Cleaning Team:</strong> {houseAssignments.clean_home.length}</p>
                <p><strong>Kitchen Team:</strong> {houseAssignments.cook_meal.length}</p>
              </div>
              <button
                type="button"
                onClick={performHouseBatch}
                className="mt-4 w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white shadow"
              >
                Perform Selected House Tasks
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "fields" ? (
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
              <h3 className="mb-3 text-xl font-bold text-stone-900">Work Fields</h3>
              <div className="space-y-3">
                {creatures.map((creature) => {
                  const estimate = estimateWorkFields(creature);
                  const selected = fieldAssignments.work_fields.includes(creature.id);
                  const blocked = assignedInFields.has(creature.id) && !selected;
                  return (
                    <div key={`field-${creature.id}`} className={blocked ? "opacity-50" : ""}>
                      <CreatureCard
                        creature={creature}
                        selected={selected}
                        onToggle={blocked ? undefined : () => toggleFieldAssignment("work_fields", creature.id)}
                        subtitle={`~${estimate.minutesSpent}m • ~${estimate.staminaCost} stamina`}
                        reserved={selected ? estimate.staminaCost : 0}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow">
              <h3 className="text-xl font-bold text-stone-900">Perform Field Tasks</h3>
              <p className="mt-2 text-sm text-stone-700">
                Selected field workers act together, and the batch advances time only once.
              </p>
              <div className="mt-4 text-sm text-stone-800">
                <p><strong>Field Team Size:</strong> {fieldAssignments.work_fields.length}</p>
              </div>
              <button
                type="button"
                onClick={performFieldBatch}
                className="mt-4 w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white shadow"
              >
                Perform Selected Field Tasks
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "barn" ? (
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
              <h3 className="mb-3 text-xl font-bold text-stone-900">Creature Roster</h3>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {creatures.map((creature) => (
                  <CreatureCard
                    key={`barn-${creature.id}`}
                    creature={creature}
                    selected={barnCreatureId === creature.id}
                    onToggle={() => setBarnCreatureId(creature.id)}
                    subtitle={`Happy ${creature.happiness} • Daily breedings ${creature.breedingsToday}/${creature.dailyBreedingLimit}`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow">
              <h3 className="text-xl font-bold text-stone-900">Barn Care</h3>
              {!barnCreature ? (
                <p className="mt-3 text-stone-700">Select a creature from the Barn roster to inspect her fully.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-5xl">
                      {getCreaturePortrait(barnCreature.name)}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-stone-900">{barnCreature.nickname}</p>
                      <p className="text-stone-700">{barnCreature.name} • Lv {barnCreature.level}</p>
                      <p className="text-sm text-stone-600">
                        Happy {barnCreature.happiness} • Fertility {barnCreature.stats.fertility} • Vitality {barnCreature.stats.vitality}
                      </p>
                    </div>
                  </div>

                  <StaminaStatusBar
                    current={barnCreature.breedingStamina}
                    max={barnCreature.maxBreedingStamina}
                    label="Breeding Stamina"
                  />

                  <div className="grid gap-2 text-sm text-stone-800 sm:grid-cols-2">
                    <p><strong>STR:</strong> {barnCreature.stats.strength}</p>
                    <p><strong>END:</strong> {barnCreature.stats.endurance}</p>
                    <p><strong>INT:</strong> {barnCreature.stats.intelligence}</p>
                    <p><strong>SPD:</strong> {barnCreature.stats.speed}</p>
                    <p><strong>FER:</strong> {barnCreature.stats.fertility}</p>
                    <p><strong>VIT:</strong> {barnCreature.stats.vitality}</p>
                  </div>

                  <div className="rounded-2xl bg-white p-3">
                    <p className="mb-2 text-sm font-semibold text-stone-900">Traits</p>
                    <CreatureTraitBadgeRow
                      traits={(Array.isArray(barnCreature.traits) ? barnCreature.traits : []) as CreatureTraitEntry[]}
                    />
                  </div>

                  <div className="rounded-2xl bg-white p-3 text-sm text-stone-700">
                    <p><strong>Barn use now:</strong> creature roster and care overview live here.</p>
                    <p className="mt-2">Feed / grooming / recovery actions are the next best pass once the simplified ranch flow is stable.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "nursery" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
              <h3 className="mb-3 text-xl font-bold text-stone-900">Eggs</h3>
              <div className="space-y-3">
                {eggs.length === 0 ? (
                  <p className="text-stone-700">No eggs are currently in the nursery.</p>
                ) : (
                  eggs.map((egg) => (
                    <div key={egg.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-lg font-bold text-stone-900">{egg.name}</p>
                      <p className="text-sm text-stone-700">Parents: {egg.parents}</p>
                      <p className="text-sm text-stone-700">Days to hatch: {egg.hatchDaysRemaining}</p>
                      <p className="text-sm text-stone-700">Quality: {egg.quality}</p>
                      <div className="mt-3">
                        <button
                          type="button"
                          disabled={egg.hatchDaysRemaining > 0}
                          onClick={() => performHatchReadyEgg(egg)}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow ${
                            egg.hatchDaysRemaining <= 0 ? "bg-rose-700" : "bg-stone-400"
                          }`}
                        >
                          {egg.hatchDaysRemaining <= 0 ? "Hatch Egg" : "Not Ready"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow">
              <h3 className="text-xl font-bold text-stone-900">Nursery Notes</h3>
              <div className="mt-3 space-y-3 text-sm text-stone-700">
                <p>Nursery is now the egg hub: view eggs and hatch ready eggs here.</p>
                <p>Future expansion: nursery security, anti-theft protection, and predator-event prevention.</p>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "breeding" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr_0.9fr]">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900">Choose Giver</h3>
                <button
                  type="button"
                  onClick={() =>
                    setBreedingSelection({
                      ...breedingSelection,
                      giverType: "player",
                      giverCreatureId: null,
                    })
                  }
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow ${
                    breedingSelection.giverType === "player"
                      ? "bg-emerald-700 text-white"
                      : "border border-emerald-300 bg-white text-stone-800"
                  }`}
                >
                  Select Player
                </button>
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {creatures.map((creature) => (
                  <CreatureCard
                    key={`giver-${creature.id}`}
                    creature={creature}
                    selected={breedingSelection.giverType === "creature" && breedingSelection.giverCreatureId === creature.id}
                    onToggle={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        giverType: "creature",
                        giverCreatureId: creature.id,
                      })
                    }
                    subtitle={`Cost ${getBreedingStaminaCost(creature)} stamina`}
                    reserved={
                      breedingSelection.giverType === "creature" && breedingSelection.giverCreatureId === creature.id
                        ? getBreedingStaminaCost(creature)
                        : 0
                    }
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900">Choose Receiver</h3>
                <button
                  type="button"
                  onClick={() =>
                    setBreedingSelection({
                      ...breedingSelection,
                      receiverType: "player",
                      receiverCreatureId: null,
                    })
                  }
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow ${
                    breedingSelection.receiverType === "player"
                      ? "bg-emerald-700 text-white"
                      : "border border-emerald-300 bg-white text-stone-800"
                  }`}
                >
                  Select Player
                </button>
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {creatures.map((creature) => (
                  <CreatureCard
                    key={`receiver-${creature.id}`}
                    creature={creature}
                    selected={breedingSelection.receiverType === "creature" && breedingSelection.receiverCreatureId === creature.id}
                    onToggle={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        receiverType: "creature",
                        receiverCreatureId: creature.id,
                      })
                    }
                    subtitle={`Cost ${getBreedingStaminaCost(creature)} stamina`}
                    reserved={
                      breedingSelection.receiverType === "creature" && breedingSelection.receiverCreatureId === creature.id
                        ? getBreedingStaminaCost(creature)
                        : 0
                    }
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow">
              <h3 className="text-xl font-bold text-stone-900">Breeding Session</h3>
              <div className="mt-3 space-y-2 text-sm text-stone-800">
                <p><strong>Giver:</strong> {breedingSelection.giverType === "player" ? playerData.name : giverCreature?.nickname ?? "None"}</p>
                <p><strong>Receiver:</strong> {breedingSelection.receiverType === "player" ? playerData.name : receiverCreature?.nickname ?? "None"}</p>
                <p><strong>Energy Cost:</strong> 8</p>
                <p><strong>Nursery:</strong> check the Nursery tab after performing breeding.</p>
              </div>

              <button
                type="button"
                onClick={performBreeding}
                className="mt-4 w-full rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white shadow"
              >
                Perform Breeding
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <ResultModal
        open={resultOpen}
        title={resultTitle}
        bodyLines={resultLines}
        onClose={() => setResultOpen(false)}
      />
    </>
  );
}
