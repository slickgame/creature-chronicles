"use client";

import Link from "next/link";
import { useState } from "react";
import { useGame } from "@/context/GameContext";

type RanchTab = "house" | "fields" | "barn" | "nursery" | "breeding";

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

export default function RanchOperationsPanel({
  initialTab = "house",
}: {
  initialTab?: RanchTab;
}) {
  const {
    currentDay,
    currentHour,
    currentMinute,
    playerData,
    homeState,
    creatures,
    eggs,
    breedingSelection,
    cleanHome,
    cookMeal,
    workFields,
    breedCreatures,
    hatchEgg,
  } = useGame();

  const [activeTab, setActiveTab] = useState<RanchTab>(initialTab);

  return (
    <section className="rounded-3xl border-4 border-emerald-900 bg-white/90 p-5 shadow-xl">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-emerald-950">Ranch Operations</h2>
          <p className="text-stone-600">
            Central ranch hub for house chores, field work, creature care, eggs, and breeding.
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
            <p className="font-semibold text-stone-900">
              {homeState.foodStock} / {homeState.wheatStock}
            </p>
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
              activeTab === tab
                ? "bg-emerald-700 text-white"
                : "border border-emerald-300 bg-white text-stone-800"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "house" && (
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => creatures[0] && cleanHome(creatures[0].id)}
            className="rounded-2xl border-2 border-emerald-200 bg-white p-4 text-left shadow"
          >
            <p className="text-xl font-bold text-stone-900">Clean House</p>
            <p className="mt-2 text-sm text-stone-600">
              Quick fallback action using the first available creature.
            </p>
          </button>

          <button
            type="button"
            onClick={() => creatures[0] && cookMeal(creatures[0].id)}
            className="rounded-2xl border-2 border-emerald-200 bg-white p-4 text-left shadow"
          >
            <p className="text-xl font-bold text-stone-900">Cook Meal</p>
            <p className="mt-2 text-sm text-stone-600">
              Basic cook action from the ranch screen.
            </p>
          </button>
        </div>
      )}

      {activeTab === "fields" && (
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => creatures[0] && workFields(creatures[0].id)}
            className="rounded-2xl border-2 border-emerald-200 bg-white p-4 text-left shadow"
          >
            <p className="text-xl font-bold text-stone-900">Work Fields</p>
            <p className="mt-2 text-sm text-stone-600">
              Basic field work action from the ranch screen.
            </p>
          </button>
        </div>
      )}

      {activeTab === "barn" && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
          <p className="text-xl font-bold text-stone-900">Barn Roster</p>
          <p className="mt-2 text-sm text-stone-600">
            {creatures.length} creatures currently housed at the ranch.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {creatures.map((creature) => (
              <div
                key={creature.id}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
              >
                <p className="font-bold text-stone-900">{creature.nickname}</p>
                <p className="text-sm text-stone-600">
                  {creature.name} • Lv {creature.level}
                </p>
                <p className="mt-2 text-xs text-stone-700">
                  Stamina {creature.breedingStamina}/{creature.maxBreedingStamina}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "nursery" && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
          <p className="text-xl font-bold text-stone-900">Nursery</p>
          <p className="mt-2 text-sm text-stone-600">{eggs.length} egg(s) in nursery.</p>

          <div className="mt-4 space-y-3">
            {eggs.map((egg) => (
              <div
                key={egg.id}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
              >
                <p className="font-bold text-stone-900">{egg.name}</p>
                <p className="text-sm text-stone-600">Parents: {egg.parents}</p>
                <p className="text-xs text-stone-700">
                  {egg.hatchDaysRemaining <= 0
                    ? "Ready to hatch"
                    : `${egg.hatchDaysRemaining} day(s) remaining`}
                </p>
                <button
                  type="button"
                  disabled={egg.hatchDaysRemaining > 0}
                  onClick={() => hatchEgg(egg.id)}
                  className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold text-white ${
                    egg.hatchDaysRemaining <= 0 ? "bg-rose-700" : "bg-stone-400"
                  }`}
                >
                  {egg.hatchDaysRemaining <= 0 ? "Hatch Egg" : "Not Ready"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "breeding" && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
          <p className="text-xl font-bold text-stone-900">Breeding</p>
          <p className="mt-2 text-sm text-stone-600">
            Use the ranch breeding flow here or open the dedicated view while the broader migration settles.
          </p>

          <div className="mt-4 text-sm text-stone-700">
            <p>
              <strong>Current giver:</strong>{" "}
              {breedingSelection.giverType === "player"
                ? playerData.name
                : creatures.find((c) => c.id === breedingSelection.giverCreatureId)?.nickname ?? "None"}
            </p>
            <p>
              <strong>Current receiver:</strong>{" "}
              {breedingSelection.receiverType === "player"
                ? playerData.name
                : creatures.find((c) => c.id === breedingSelection.receiverCreatureId)?.nickname ?? "None"}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => breedCreatures()}
              className="rounded-2xl bg-rose-700 px-4 py-3 font-semibold text-white shadow"
            >
              Perform Breeding
            </button>
            <Link
              href="/breeding"
              className="rounded-2xl border border-emerald-300 bg-white px-4 py-3 font-semibold text-stone-800 shadow"
            >
              Open Breeding Page
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
