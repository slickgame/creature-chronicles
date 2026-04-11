"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";
import { RECIPE_DATA } from "@/lib/cooking/recipeData";
import { CROP_DATA } from "@/lib/farming/cropData";
import {
  type InventoryCategory,
  getCategoryLabel,
  getInventoryCategory,
  getItemEffectSummary,
} from "@/lib/game/inventoryUi";

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

function OverlayModal({
  open,
  title,
  onClose,
  children,
  maxWidth = "max-w-5xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className={`flex h-[86vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border-4 border-emerald-900 bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-emerald-200 px-5 py-4">
          <h3 className="text-2xl font-bold text-emerald-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function getMoodLabel(happiness: number) {
  if (happiness >= 85) return "Smug / Thriving";
  if (happiness >= 65) return "Content";
  if (happiness >= 40) return "Restless";
  return "Touchy";
}

function getStaminaPercent(current: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

export default function RanchOperationsPanel({
  initialTab = "house",
  initialInventoryOpen = false,
}: {
  initialTab?: RanchTab;
  initialInventoryOpen?: boolean;
}) {
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    homeState,
    creatures,
    eggs,
    breedingSelection,
    inventory,
    fieldPlots,
    knownRecipeIds,
    getItemCount,
    cookMeal,
    cookRecipe,
    cleanHome,
    plantCrop,
    harvestPlot,
    breedCreatures,
    hatchEgg,
  } = useGame();

  const [activeTab, setActiveTab] = useState<RanchTab>(initialTab);
  const [inventoryOpen, setInventoryOpen] = useState(initialInventoryOpen);
  const [selectedCreatureId, setSelectedCreatureId] = useState<number | null>(null);
  const [selectedSeedItemId, setSelectedSeedItemId] = useState<string>("");
  const [selectedFieldCreatureId, setSelectedFieldCreatureId] = useState<number | null>(null);

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

  const inventoryEntries = useMemo(() => {
    return Object.entries(inventory)
      .filter(([, count]) => count > 0)
      .map(([itemId, count]) => ({
        itemId,
        count,
        item: ITEM_DATA[itemId],
        category: getInventoryCategory(itemId),
      }))
      .sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return (a.item?.name ?? a.itemId).localeCompare(b.item?.name ?? b.itemId);
      });
  }, [inventory]);

  const inventoryGroups = useMemo(() => {
    return {
      seeds: inventoryEntries.filter((entry) => entry.category === "seeds"),
      ingredients: inventoryEntries.filter((entry) => entry.category === "ingredients"),
      food: inventoryEntries.filter((entry) => entry.category === "food"),
      books: inventoryEntries.filter((entry) => entry.category === "books"),
      other: inventoryEntries.filter((entry) => entry.category === "other"),
    };
  }, [inventoryEntries]);

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
          outputItem: ITEM_DATA[recipe.outputItemId],
        };
      });
  }, [knownRecipeIds, getItemCount]);

  const firstCreature = creatures[0] ?? null;
  const selectedSeedEntry =
    ownedSeedEntries.find((entry) => entry.itemId === selectedSeedItemId) ??
    ownedSeedEntries[0] ??
    null;
  const fieldCreature =
    creatures.find((creature) => creature.id === selectedFieldCreatureId) ??
    firstCreature;
  const growingPlotCount = fieldPlots.filter((plot) => plot.cropId && plot.daysRemaining > 0).length;
  const readyPlotCount = fieldPlots.filter((plot) => plot.cropId && plot.daysRemaining <= 0).length;
  const selectedCreature =
    creatures.find((creature) => creature.id === selectedCreatureId) ?? null;

  return (
    <>
      <section className="rounded-3xl border-4 border-emerald-900 bg-white/90 p-5 shadow-xl">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-emerald-950">Ranch Operations</h2>
            <p className="text-stone-600">
              Central ranch hub for chores, field work, creatures, eggs, breeding, inventory, and recipe crafting.
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

        <div className="mb-4 flex flex-wrap gap-2">
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
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
              <p className="text-xl font-bold text-stone-900">House Chores</p>
              <p className="mt-2 text-sm text-stone-600">
                These use your current ranch-side home actions, now allowed from the Ranch screen too.
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
                  <p className="text-lg font-bold">Basic Cook Meal</p>
                  <p className="mt-2 text-sm">
                    Older fallback meal action using ranch home resources.
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-rose-200 bg-white p-4 shadow">
              <p className="text-xl font-bold text-stone-900">Recipe Workshop</p>
              <p className="mt-2 text-sm text-stone-600">
                Learned recipes can now be crafted here into actual inventory items.
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
                          <p className="mt-1 text-xs text-stone-700">
                            Output: {recipe.outputQuantity} {recipe.outputItem?.name ?? recipe.outputItemId}
                          </p>
                          <p className="mt-1 text-xs text-stone-700">
                            Cook Time: {recipe.cookMinutes} min
                          </p>
                        </div>

                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            recipe.craftable
                              ? "border border-emerald-300 bg-emerald-100 text-emerald-900"
                              : "border border-stone-300 bg-stone-100 text-stone-700"
                          }`}
                        >
                          {recipe.craftable ? "Ready to Cook" : "Missing Ingredients"}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {creatures.slice(0, 3).map((creature) => (
                          <button
                            key={`${recipe.id}-${creature.id}`}
                            type="button"
                            disabled={!recipe.craftable}
                            onClick={() => cookRecipe(recipe.id, creature.id)}
                            className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                              recipe.craftable ? "bg-rose-700" : "bg-stone-400"
                            }`}
                          >
                            Cook with {creature.nickname}
                          </button>
                        ))}
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
                Plant owned seeds, wait out the day countdown, then harvest produce into inventory.
              </p>

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-semibold text-stone-800">
                  Seed
                  <select
                    value={selectedSeedEntry?.itemId ?? ""}
                    onChange={(event) => setSelectedSeedItemId(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm text-stone-800"
                  >
                    {ownedSeedEntries.length === 0 ? (
                      <option value="">No seeds owned</option>
                    ) : (
                      ownedSeedEntries.map((entry) => (
                        <option key={entry.itemId} value={entry.itemId}>
                          {entry.item?.name ?? entry.itemId} x{entry.count}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-stone-800">
                  Creature
                  <select
                    value={fieldCreature?.id ?? ""}
                    onChange={(event) => setSelectedFieldCreatureId(Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm text-stone-800"
                  >
                    {creatures.map((creature) => (
                      <option key={creature.id} value={creature.id}>
                        {creature.nickname} - Stamina {creature.breedingStamina}/{creature.maxBreedingStamina} - Field Lv {creature.skills.fieldWork.level}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-2 text-sm text-stone-700 sm:grid-cols-3">
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2">
                    <p className="text-stone-500">Empty</p>
                    <p className="font-bold text-stone-900">{fieldPlots.length - growingPlotCount - readyPlotCount}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-2">
                    <p className="text-stone-500">Growing</p>
                    <p className="font-bold text-stone-900">{growingPlotCount}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 px-3 py-2">
                    <p className="text-stone-500">Ready</p>
                    <p className="font-bold text-stone-900">{readyPlotCount}</p>
                  </div>
                </div>

                {currentLocation !== "home" && currentLocation !== "ranch" ? (
                  <div className="rounded-2xl border border-stone-300 bg-stone-50 p-3 text-sm text-stone-600">
                    Return home or to the ranch before field work.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-amber-200 bg-white p-4 shadow">
              <p className="text-xl font-bold text-stone-900">Owned Seeds</p>
              <p className="mt-2 text-sm text-stone-600">
                Seeds bought from Maris can be planted in any empty plot.
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

            <div className="rounded-2xl border-2 border-lime-200 bg-white p-4 shadow xl:col-span-2">
              <p className="text-xl font-bold text-stone-900">Crop Plots</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {fieldPlots.map((plot) => {
                  const crop = plot.cropId ? CROP_DATA[plot.cropId] : null;
                  const produceItem = crop ? ITEM_DATA[crop.produceItemId] : null;
                  const isReady = Boolean(plot.cropId && plot.daysRemaining <= 0);
                  const canPlant =
                    !plot.cropId &&
                    Boolean(selectedSeedEntry && fieldCreature) &&
                    (currentLocation === "home" || currentLocation === "ranch");
                  const canHarvest =
                    isReady &&
                    Boolean(fieldCreature) &&
                    (currentLocation === "home" || currentLocation === "ranch");

                  return (
                    <div
                      key={plot.id}
                      className={`rounded-2xl border-2 p-4 shadow ${
                        isReady
                          ? "border-rose-300 bg-rose-50"
                          : plot.cropId
                          ? "border-amber-300 bg-amber-50"
                          : "border-emerald-200 bg-emerald-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-stone-900">Plot {plot.id}</p>
                          <p className="text-sm text-stone-600">{crop ? crop.name : "Empty soil"}</p>
                        </div>
                        <div className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-800">
                          {isReady ? "Ready" : plot.cropId ? `${plot.daysRemaining} day(s)` : "Open"}
                        </div>
                      </div>

                      {crop ? (
                        <div className="mt-3 space-y-1 text-sm text-stone-700">
                          <p>{crop.description}</p>
                          <p>
                            Harvest: {plot.minYield}-{plot.maxYield} {produceItem?.name ?? crop.produceItemId}
                          </p>
                          <p>Planted Day {plot.plantedDay ?? "?"}</p>
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-stone-700">
                          {selectedSeedEntry ? (
                            <p>Ready for {selectedSeedEntry.item?.name ?? selectedSeedEntry.itemId}.</p>
                          ) : (
                            <p>Buy seeds in Town to start a crop here.</p>
                          )}
                        </div>
                      )}

                      <div className="mt-4">
                        {plot.cropId ? (
                          <button
                            type="button"
                            disabled={!canHarvest}
                            onClick={() => {
                              if (fieldCreature) harvestPlot(plot.id, fieldCreature.id);
                            }}
                            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow ${
                              canHarvest ? "bg-rose-700" : "bg-stone-400"
                            }`}
                          >
                            {isReady ? "Harvest" : "Growing"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canPlant}
                            onClick={() => {
                              if (selectedSeedEntry && fieldCreature) {
                                plantCrop(plot.id, selectedSeedEntry.itemId, fieldCreature.id);
                              }
                            }}
                            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow ${
                              canPlant ? "bg-emerald-700" : "bg-stone-400"
                            }`}
                          >
                            Plant
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "barn" && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
              <p className="text-xl font-bold text-stone-900">Barn Roster</p>
              <p className="mt-2 text-sm text-stone-600">
                {creatures.length} creatures currently housed at the ranch. Click a creature to open her full card.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {creatures.map((creature) => {
                const staminaPct = getStaminaPercent(
                  creature.breedingStamina,
                  creature.maxBreedingStamina
                );

                return (
                  <button
                    key={creature.id}
                    type="button"
                    onClick={() => setSelectedCreatureId(creature.id)}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left shadow transition hover:border-emerald-400 hover:bg-emerald-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-stone-900">{creature.nickname}</p>
                        <p className="text-sm text-stone-600">
                          {creature.name} • Lv {creature.level}
                        </p>
                      </div>
                      <div className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
                        {getMoodLabel(creature.happiness)}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-stone-700">
                          <span>Stamina</span>
                          <span>
                            {creature.breedingStamina}/{creature.maxBreedingStamina}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-stone-200">
                          <div
                            className="h-3 rounded-full bg-emerald-600"
                            style={{ width: `${staminaPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-stone-700">
                        <p><strong>Happiness:</strong> {creature.happiness}</p>
                        <p><strong>Generation:</strong> {creature.generation}</p>
                        <p><strong>Giver:</strong> {creature.giver ?? "Unknown"}</p>
                        <p><strong>Receiver:</strong> {creature.receiver ?? "Unknown"}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-stone-700">
                      Open full creature card
                    </div>
                  </button>
                );
              })}
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

      <OverlayModal
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        title="Ranch Inventory"
      >
        <div className="space-y-6">
          {(["seeds", "ingredients", "food", "books", "other"] as Exclude<InventoryCategory, "all">[]).map((category) => {
            const entries = inventoryGroups[category];
            if (entries.length === 0) return null;

            return (
              <section key={category} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-xl font-bold text-emerald-950">{getCategoryLabel(category)}</h4>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {entries.map((entry) => (
                    <div key={entry.itemId} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-stone-900">{entry.item?.name ?? entry.itemId}</p>
                          <p className="text-sm text-stone-600">{entry.item?.description ?? "No description yet."}</p>
                        </div>
                        <div className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                          x{entry.count}
                        </div>
                      </div>

                      {entry.item?.seedData ? (
                        <p className="mt-2 text-xs text-stone-700">
                          Seed: {entry.item.seedData.growDays} day grow time • Yield {entry.item.seedData.minYield}–{entry.item.seedData.maxYield}
                        </p>
                      ) : null}

                      {getItemEffectSummary(entry.itemId) ? (
                        <p className="mt-2 text-xs text-stone-700">
                          Effect: {getItemEffectSummary(entry.itemId)}
                        </p>
                      ) : null}

                      {entry.item?.recipeUnlockIds?.length ? (
                        <p className="mt-2 text-xs text-stone-700">
                          Unlocks: {entry.item.recipeUnlockIds.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {inventoryEntries.length === 0 ? (
            <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
              Inventory is currently empty.
            </div>
          ) : null}
        </div>
      </OverlayModal>

      <OverlayModal
        open={selectedCreature !== null}
        onClose={() => setSelectedCreatureId(null)}
        title={selectedCreature ? `${selectedCreature.nickname} — Creature Card` : "Creature Card"}
        maxWidth="max-w-4xl"
      >
        {selectedCreature ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold text-emerald-950">{selectedCreature.nickname}</p>
                  <p className="text-sm text-stone-700">
                    {selectedCreature.name} • Level {selectedCreature.level} • Generation {selectedCreature.generation}
                  </p>
                </div>
                <div className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-sm font-semibold text-emerald-900">
                  {getMoodLabel(selectedCreature.happiness)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="mb-3 text-lg font-bold text-stone-900">Condition</p>
                <div className="space-y-2 text-sm text-stone-700">
                  <p><strong>Stamina:</strong> {selectedCreature.breedingStamina}/{selectedCreature.maxBreedingStamina}</p>
                  <p><strong>Happiness:</strong> {selectedCreature.happiness}</p>
                  <p><strong>Inbreeding Risk:</strong> {selectedCreature.inbreedingRisk}</p>
                  <p><strong>Inbred Trait:</strong> {selectedCreature.inbredTrait}</p>
                  <p><strong>Severity:</strong> {selectedCreature.inbredTraitSeverity}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="mb-3 text-lg font-bold text-stone-900">Lineage</p>
                <div className="space-y-2 text-sm text-stone-700">
                  <p><strong>Giver:</strong> {selectedCreature.giver ?? "Unknown"}</p>
                  <p><strong>Receiver:</strong> {selectedCreature.receiver ?? "Unknown"}</p>
                  <p><strong>Born On Day:</strong> {selectedCreature.bornOnDay}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Stats</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-stone-700">
                <p><strong>Strength:</strong> {selectedCreature.stats.strength}</p>
                <p><strong>Endurance:</strong> {selectedCreature.stats.endurance}</p>
                <p><strong>Intelligence:</strong> {selectedCreature.stats.intelligence}</p>
                <p><strong>Speed:</strong> {selectedCreature.stats.speed}</p>
                <p><strong>Fertility:</strong> {selectedCreature.stats.fertility}</p>
                <p><strong>Vitality:</strong> {selectedCreature.stats.vitality}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Skills</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-stone-700">
                <p><strong>Cooking:</strong> Lv {selectedCreature.skills.cooking.level}</p>
                <p><strong>Cleaning:</strong> Lv {selectedCreature.skills.cleaning.level}</p>
                <p><strong>Breeding Care:</strong> Lv {selectedCreature.skills.breedingCare.level}</p>
                <p><strong>Field Work:</strong> Lv {selectedCreature.skills.fieldWork.level}</p>
                <p><strong>Hauling:</strong> Lv {selectedCreature.skills.hauling.level}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Traits</p>
              <div className="flex flex-wrap gap-2">
                {selectedCreature.traits.length > 0 ? (
                  selectedCreature.traits.map((trait, index) => (
                    <div
                      key={`${selectedCreature.id}-${trait.trait}-${index}`}
                      className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900"
                    >
                      {trait.trait} • {trait.grade}
                    </div>
                  ))
                ) : (
                  <div className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    No traits listed
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </OverlayModal>
    </>
  );
}
