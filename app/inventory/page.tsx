"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";
import {
  type InventoryCategory,
  getCategoryLabel,
  getInventoryCategory,
  getUseHint,
} from "@/lib/game/inventoryUi";

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

function SummaryChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
      {label}: {value}
    </div>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        active
          ? "bg-sky-700 text-white"
          : "border border-sky-300 bg-white text-stone-800"
      }`}
    >
      {label}
    </button>
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

  const [activeCategory, setActiveCategory] = useState<InventoryCategory>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
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

  const filteredEntries = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();

    return inventoryEntries.filter((entry) => {
      if (activeCategory !== "all" && entry.category !== activeCategory) return false;
      if (!lowered) return true;

      const haystack = [
        entry.item?.name ?? entry.itemId,
        entry.item?.description ?? "",
        getCategoryLabel(entry.category),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(lowered);
    });
  }, [inventoryEntries, activeCategory, searchTerm]);

  const groupedEntries = useMemo(() => {
    const groups: Record<Exclude<InventoryCategory, "all">, typeof filteredEntries> = {
      seeds: [],
      ingredients: [],
      food: [],
      books: [],
      other: [],
    };

    filteredEntries.forEach((entry) => {
      groups[entry.category].push(entry);
    });

    return groups;
  }, [filteredEntries]);

  const totalItemCount = inventoryEntries.reduce((sum, entry) => sum + entry.count, 0);
  const seedTypeCount = inventoryEntries.filter((entry) => entry.category === "seeds").length;
  const cookedFoodCount = inventoryEntries
    .filter((entry) => entry.category === "food")
    .reduce((sum, entry) => sum + entry.count, 0);

  const selectedItem = selectedItemId ? ITEM_DATA[selectedItemId] : null;
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

          <section className="mb-6 rounded-3xl border-4 border-sky-900 bg-white/85 p-6 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-sky-950">Inventory Browser</h2>
                <p className="mt-1 text-stone-600">
                  Search, filter, inspect, and use eligible items from one place.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search inventory..."
                  className="w-full rounded-2xl border border-sky-300 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["all", "seeds", "ingredients", "food", "books", "other"] as InventoryCategory[]).map((category) => (
                <FilterButton
                  key={category}
                  active={activeCategory === category}
                  label={getCategoryLabel(category)}
                  onClick={() => setActiveCategory(category)}
                />
              ))}
            </div>
          </section>

          <div className="space-y-6">
            {(["seeds", "ingredients", "food", "books", "other"] as Exclude<InventoryCategory, "all">[]).map((category) => {
              const entries = groupedEntries[category];
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

                        <div className="mt-3 rounded-full border border-sky-300 bg-white px-3 py-1 text-[11px] font-semibold text-stone-700">
                          {getUseHint(entry.itemId)}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedItemId(entry.itemId)}
                            className="flex-1 rounded-2xl border border-sky-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow"
                          >
                            Inspect
                          </button>

                          {entry.item?.useTags.includes("edible") ? (
                            <button
                              type="button"
                              onClick={() => setSelectedFoodItemId(entry.itemId)}
                              className="flex-1 rounded-2xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow"
                            >
                              Use
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {filteredEntries.length === 0 ? (
              <section className="rounded-3xl border-4 border-sky-900 bg-white/85 p-6 shadow-xl">
                <p className="text-lg text-stone-700">
                  No items match your current search or filter.
                </p>
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
        open={selectedItem !== null}
        onClose={() => setSelectedItemId(null)}
        title={selectedItem ? selectedItem.name : "Item Details"}
      >
        {selectedItem ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-lg font-bold text-stone-900">{selectedItem.name}</p>
              <p className="mt-1 text-sm text-stone-600">{selectedItem.description}</p>
              <p className="mt-3 text-sm text-stone-700">
                <strong>Use Hint:</strong> {getUseHint(selectedItemId!)}
              </p>
            </div>

            {selectedItem.seedData ? (
              <div className="rounded-2xl border border-sky-200 bg-white p-4">
                <p className="text-lg font-bold text-stone-900">Seed Data</p>
                <div className="mt-3 space-y-2 text-sm text-stone-700">
                  <p><strong>Grow Time:</strong> {selectedItem.seedData.growDays} day(s)</p>
                  <p><strong>Yield:</strong> {selectedItem.seedData.minYield}–{selectedItem.seedData.maxYield}</p>
                  <p><strong>Crop Output:</strong> {selectedItem.seedData.cropId}</p>
                </div>
              </div>
            ) : null}

            {selectedItem.edibleEffects ? (
              <div className="rounded-2xl border border-sky-200 bg-white p-4">
                <p className="text-lg font-bold text-stone-900">Consumable Effects</p>
                <div className="mt-3 space-y-2 text-sm text-stone-700">
                  {selectedItem.edibleEffects.energyRestore ? (
                    <p><strong>Player Energy:</strong> +{selectedItem.edibleEffects.energyRestore}</p>
                  ) : null}
                  {selectedItem.edibleEffects.staminaRestore ? (
                    <p><strong>Creature Stamina:</strong> +{selectedItem.edibleEffects.staminaRestore}</p>
                  ) : null}
                  {selectedItem.edibleEffects.breedingRecoveryBoost ? (
                    <p><strong>Breeding Recovery:</strong> +{selectedItem.edibleEffects.breedingRecoveryBoost}</p>
                  ) : null}
                  {selectedItem.edibleEffects.happinessGain ? (
                    <p><strong>Happiness:</strong> +{selectedItem.edibleEffects.happinessGain}</p>
                  ) : null}
                  {selectedItem.edibleEffects.fertilityBoost ? (
                    <p><strong>Fertility:</strong> +{selectedItem.edibleEffects.fertilityBoost}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {selectedItem.recipeUnlockIds?.length ? (
              <div className="rounded-2xl border border-sky-200 bg-white p-4">
                <p className="text-lg font-bold text-stone-900">Recipe Unlocks</p>
                <div className="mt-3 space-y-2 text-sm text-stone-700">
                  {selectedItem.recipeUnlockIds.map((recipeId) => (
                    <p key={recipeId}>{recipeId}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-sky-200 bg-white p-4">
              <p className="text-lg font-bold text-stone-900">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selectedItem.useTags ?? []).length > 0 ? (
                  selectedItem.useTags.map((tag) => (
                    <div
                      key={tag}
                      className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900"
                    >
                      {tag}
                    </div>
                  ))
                ) : (
                  <div className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    No tags listed
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </OverlayModal>

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
