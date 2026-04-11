"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";

type InventoryCategory = "seeds" | "ingredients" | "food" | "books" | "other";

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

function getInventoryCategory(itemId: string): InventoryCategory {
  if (itemId.endsWith("_seed")) return "seeds";
  if (itemId.startsWith("recipe_book_")) return "books";
  if (["apple_pie", "berry_tart", "hearty_stew", "warm_milk", "bread", "vegetable_soup", "porridge", "farm_salad"].includes(itemId)) {
    return "food";
  }

  const item = ITEM_DATA[itemId];
  if (item?.category === "ingredient") return "ingredients";
  if (item?.category === "recipe_book") return "books";
  if (item?.category === "food") return "food";
  return "other";
}

function getCategoryLabel(category: InventoryCategory) {
  if (category === "seeds") return "Seeds";
  if (category === "ingredients") return "Ingredients";
  if (category === "food") return "Cooked Food";
  if (category === "books") return "Recipe Books";
  return "Other";
}

function SummaryChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
      {label}: {value}
    </div>
  );
}

function OverlayModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-4 border-sky-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sky-200 px-5 py-4">
          <h3 className="text-2xl font-bold text-sky-950">{title}</h3>
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

export default function InventoryPage() {
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    inventory,
    knownRecipeIds,
    creatures,
    eggs,
    consumeInventoryItem,
  } = useGame();

  const [selectedFoodItemId, setSelectedFoodItemId] = useState<string | null>(null);

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

  const totalItemCount = inventoryEntries.reduce((sum, entry) => sum + entry.count, 0);
  const seedTypeCount = inventoryGroups.seeds.length;
  const cookedFoodCount = inventoryGroups.food.reduce((sum, entry) => sum + entry.count, 0);

  const selectedFoodItem = selectedFoodItemId ? ITEM_DATA[selectedFoodItemId] : null;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-200 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-4xl font-bold text-sky-900">🎒 Player Inventory</h1>

          <div className="mb-6 rounded-3xl border-4 border-sky-900 bg-white/85 p-6 shadow-xl">
            <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
              <p><strong>Day:</strong> {currentDay}</p>
              <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
              <p><strong>Location:</strong> {currentLocation}</p>
              <p><strong>Player:</strong> {playerData.name}</p>
              <p><strong>Gold:</strong> {playerData.gold}</p>
              <p><strong>Energy:</strong> {playerData.energy}</p>
              <p><strong>Creatures:</strong> {creatures.length}</p>
              <p><strong>Eggs:</strong> {eggs.length}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <SummaryChip label="Item Types" value={inventoryEntries.length} />
              <SummaryChip label="Total Items" value={totalItemCount} />
              <SummaryChip label="Seed Types" value={seedTypeCount} />
              <SummaryChip label="Known Recipes" value={knownRecipeIds.length} />
              <SummaryChip label="Cooked Food" value={cookedFoodCount} />
            </div>
          </div>

          <div className="space-y-6">
            {(["seeds", "ingredients", "food", "books", "other"] as InventoryCategory[]).map((category) => {
              const entries = inventoryGroups[category];
              if (entries.length === 0) return null;

              return (
                <section
                  key={category}
                  className="rounded-3xl border-4 border-sky-900 bg-white/85 p-6 shadow-xl"
                >
                  <h2 className="text-2xl font-bold text-sky-950">{getCategoryLabel(category)}</h2>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {entries.map((entry) => (
                      <div
                        key={entry.itemId}
                        className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-stone-900">{entry.item?.name ?? entry.itemId}</p>
                            <p className="text-sm text-stone-600">
                              {entry.item?.description ?? "No description yet."}
                            </p>
                          </div>
                          <div className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-900">
                            x{entry.count}
                          </div>
                        </div>

                        {entry.item?.seedData ? (
                          <p className="mt-3 text-xs text-stone-700">
                            Seed: {entry.item.seedData.growDays} day grow time • Yield {entry.item.seedData.minYield}–{entry.item.seedData.maxYield}
                          </p>
                        ) : null}

                        {entry.item?.edibleEffects ? (
                          <div className="mt-3 space-y-1 text-xs text-stone-700">
                            {entry.item.edibleEffects.energyRestore ? (
                              <p>Restores {entry.item.edibleEffects.energyRestore} player energy</p>
                            ) : null}
                            {entry.item.edibleEffects.staminaRestore ? (
                              <p>Restores {entry.item.edibleEffects.staminaRestore} creature stamina</p>
                            ) : null}
                            {entry.item.edibleEffects.breedingRecoveryBoost ? (
                              <p>Breeding recovery +{entry.item.edibleEffects.breedingRecoveryBoost}</p>
                            ) : null}
                            {entry.item.edibleEffects.happinessGain ? (
                              <p>Happiness +{entry.item.edibleEffects.happinessGain}</p>
                            ) : null}
                            {entry.item.edibleEffects.fertilityBoost ? (
                              <p>Fertility +{entry.item.edibleEffects.fertilityBoost}</p>
                            ) : null}
                          </div>
                        ) : null}

                        {entry.item?.recipeUnlockIds?.length ? (
                          <p className="mt-3 text-xs text-stone-700">
                            Unlocks: {entry.item.recipeUnlockIds.join(", ")}
                          </p>
                        ) : null}

                        <div className="mt-3 rounded-full border border-sky-300 bg-white px-3 py-1 text-[11px] font-semibold text-stone-700">
                          Category: {getCategoryLabel(category)}
                        </div>

                        {entry.item?.useTags.includes("edible") ? (
                          <button
                            type="button"
                            onClick={() => setSelectedFoodItemId(entry.itemId)}
                            className="mt-3 w-full rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow"
                          >
                            Use Item
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {inventoryEntries.length === 0 ? (
              <section className="rounded-3xl border-4 border-sky-900 bg-white/85 p-6 shadow-xl">
                <p className="text-lg text-stone-700">Your inventory is currently empty.</p>
              </section>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/town"
              className="rounded-2xl bg-stone-800 px-4 py-3 font-semibold text-white shadow"
            >
              Go to Town
            </Link>
            <Link
              href="/ranch"
              className="rounded-2xl bg-stone-800 px-4 py-3 font-semibold text-white shadow"
            >
              Go to Ranch
            </Link>
          </div>
        </div>
      </main>

      <OverlayModal
        open={selectedFoodItem !== null}
        onClose={() => setSelectedFoodItemId(null)}
        title={selectedFoodItem ? `Use ${selectedFoodItem.name}` : "Use Item"}
      >
        {selectedFoodItem ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-lg font-bold text-stone-900">{selectedFoodItem.name}</p>
              <p className="mt-1 text-sm text-stone-600">{selectedFoodItem.description}</p>

              <div className="mt-3 space-y-1 text-sm text-stone-700">
                {selectedFoodItem.edibleEffects?.energyRestore ? (
                  <p><strong>Player Energy:</strong> +{selectedFoodItem.edibleEffects.energyRestore}</p>
                ) : null}
                {selectedFoodItem.edibleEffects?.staminaRestore ? (
                  <p><strong>Creature Stamina:</strong> +{selectedFoodItem.edibleEffects.staminaRestore}</p>
                ) : null}
                {selectedFoodItem.edibleEffects?.breedingRecoveryBoost ? (
                  <p><strong>Breeding Recovery:</strong> +{selectedFoodItem.edibleEffects.breedingRecoveryBoost}</p>
                ) : null}
                {selectedFoodItem.edibleEffects?.happinessGain ? (
                  <p><strong>Happiness:</strong> +{selectedFoodItem.edibleEffects.happinessGain}</p>
                ) : null}
                {selectedFoodItem.edibleEffects?.fertilityBoost ? (
                  <p><strong>Fertility:</strong> +{selectedFoodItem.edibleEffects.fertilityBoost}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Use on Player</p>
              <button
                type="button"
                onClick={() => {
                  const success = consumeInventoryItem(selectedFoodItem.id, { type: "player" });
                  if (success) setSelectedFoodItemId(null);
                }}
                className="w-full rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow"
              >
                Feed to {playerData.name}
              </button>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Use on Creature</p>
              <div className="grid gap-3 md:grid-cols-2">
                {creatures.map((creature) => (
                  <button
                    key={creature.id}
                    type="button"
                    onClick={() => {
                      const success = consumeInventoryItem(selectedFoodItem.id, {
                        type: "creature",
                        creatureId: creature.id,
                      });
                      if (success) setSelectedFoodItemId(null);
                    }}
                    className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left shadow hover:bg-sky-100"
                  >
                    <p className="font-bold text-stone-900">{creature.nickname}</p>
                    <p className="text-sm text-stone-600">
                      {creature.name} • Stamina {creature.breedingStamina}/{creature.maxBreedingStamina}
                    </p>
                    <p className="text-sm text-stone-600">
                      Happiness {creature.happiness}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </OverlayModal>
    </>
  );
}
