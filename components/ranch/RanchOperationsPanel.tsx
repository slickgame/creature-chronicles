"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";
import { RECIPE_DATA } from "@/lib/cooking/recipeData";

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

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
      {label}: {value}
    </div>
  );
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
    inventory,
    knownRecipeIds,
    getItemCount,
    cookMeal,
    cleanHome,
    workFields,
    breedCreatures,
    hatchEgg,
  } = useGame();

  const [activeTab, setActiveTab] = useState<RanchTab>(initialTab);

  const ownedSeedEntries = useMemo(() => {
    return Object.entries(inventory)
      .filter(([itemId, count]) => itemId.endsWith("_seed") && count > 0)
      .map(([itemId, count]) => ({
        itemId,
        count,
        item: ITEM_DATA[itemId],
      }))
      .filter((entry) => entry.item);
  }, [inventory]);

  const knownRecipes = useMemo(() => {
    return knownRecipeIds
      .map((recipeId) => RECIPE_DATA[recipeId])
      .filter(Boolean)
      .map((recipe) => {
        const craftable = recipe.ingredients.every(
          (ingredient) => getItemCount(ingredient.itemId) >= ingredient.quantity
        );

        return {
          ...recipe,
          craftable,
        };
      });
  }, [knownRecipeIds, getItemCount]);

  const firstCreature = creatures[0] ?? null;

  return (
    <section className="rounded-3xl border-4 border-emerald-900 bg-white/90 p-5 shadow-xl">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-emerald-950">Ranch Operations</h2>
          <p className="text-stone-600">
            Central ranch hub for chores, field work, creatures, eggs, breeding, and now your farm-economy ownership.
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
        <StatChip label="Inventory Entries" value={Object.keys(inventory).length} />
        <StatChip label="Seed Types" value={ownedSeedEntries.length} />
        <StatChip label="Known Recipes" value={knownRecipes.length} />
        <StatChip label="Eggs" value={eggs.length} />
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
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
            <p className="text-xl font-bold text-stone-900">House Chores</p>
            <p className="mt-2 text-sm text-stone-600">
              These still use your current basic home systems while the fuller cooking system is being layered in.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => firstCreature && cleanHome(firstCreature.id)}
                disabled={!firstCreature}
                className={`rounded-2xl border-2 p-4 text-left shadow ${
                  firstCreature
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-stone-300 bg-stone-100 text-stone-500"
                }`}
              >
                <p className="text-lg font-bold">Clean House</p>
                <p className="mt-2 text-sm">
                  Uses the first available creature under the current fallback flow.
                </p>
              </button>

              <button
                type="button"
                onClick={() => firstCreature && cookMeal(firstCreature.id)}
                disabled={!firstCreature}
                className={`rounded-2xl border-2 p-4 text-left shadow ${
                  firstCreature
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-stone-300 bg-stone-100 text-stone-500"
                }`}
              >
                <p className="text-lg font-bold">Cook Meal</p>
                <p className="mt-2 text-sm">
                  Current basic meal action. Uses ranch home resources while the full recipe system is phased in.
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-rose-200 bg-white p-4 shadow">
            <p className="text-xl font-bold text-stone-900">Known Recipes</p>
            <p className="mt-2 text-sm text-stone-600">
              These are the recipes currently learned from Tamsin’s books.
            </p>

            <div className="mt-4 space-y-3">
              {knownRecipes.length === 0 ? (
                <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                  No known recipes yet. Visit Tamsin in Town to buy recipe books.
                </div>
              ) : (
                knownRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-stone-900">{recipe.name}</p>
                        <p className="text-sm text-stone-600">{recipe.description}</p>
                        <p className="mt-2 text-xs text-stone-700">
                          Ingredients:{" "}
                          {recipe.ingredients
                            .map((ingredient) => `${ingredient.quantity} ${ITEM_DATA[ingredient.itemId]?.name ?? ingredient.itemId}`)
                            .join(", ")}
                        </p>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          recipe.craftable
                            ? "border border-emerald-300 bg-emerald-100 text-emerald-900"
                            : "border border-stone-300 bg-stone-100 text-stone-700"
                        }`}
                      >
                        {recipe.craftable ? "Ingredients Ready" : "Missing Ingredients"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <Link
                href="/town"
                className="inline-block rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow"
              >
                Visit Tamsin for More Recipes
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === "fields" && (
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
            <p className="text-xl font-bold text-stone-900">Field Work</p>
            <p className="mt-2 text-sm text-stone-600">
              The current field action still produces wheat through the older ranch loop.
            </p>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => firstCreature && workFields(firstCreature.id)}
                disabled={!firstCreature}
                className={`rounded-2xl border-2 p-4 text-left shadow ${
                  firstCreature
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-stone-300 bg-stone-100 text-stone-500"
                }`}
              >
                <p className="text-lg font-bold">Work Fields</p>
                <p className="mt-2 text-sm">
                  Uses the first available creature while the dedicated crop-planting system is phased in.
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-amber-200 bg-white p-4 shadow">
            <p className="text-xl font-bold text-stone-900">Owned Seeds</p>
            <p className="mt-2 text-sm text-stone-600">
              Seeds bought from Maris now appear here, ready for the next planting milestone.
            </p>

            <div className="mt-4 space-y-3">
              {ownedSeedEntries.length === 0 ? (
                <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                  No seeds owned yet. Visit Maris in Town to stock up.
                </div>
              ) : (
                ownedSeedEntries.map((entry) => (
                  <div
                    key={entry.itemId}
                    className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-stone-900">{entry.item?.name}</p>
                        <p className="text-sm text-stone-600">{entry.item?.description}</p>
                        <p className="mt-2 text-xs text-stone-700">
                          Grow Time: {entry.item?.seedData?.growDays ?? "?"} day(s) • Yield{" "}
                          {entry.item?.seedData?.minYield ?? "?"}–{entry.item?.seedData?.maxYield ?? "?"}
                        </p>
                      </div>

                      <div className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
                        Owned: {entry.count}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <Link
                href="/town"
                className="inline-block rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow"
              >
                Visit Maris for More Seeds
              </Link>
            </div>
          </div>
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
                <p className="mt-1 text-xs text-stone-700">
                  Happiness {creature.happiness}
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
