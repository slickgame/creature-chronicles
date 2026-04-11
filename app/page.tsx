"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import { HubCard, PopupWindow } from "@/components/town/TownUi";
import { SellerStockList } from "@/components/town/TownSellerUi";
import { QuestOfferCard } from "@/components/town/TownQuestUi";
import { RelationshipCard } from "@/components/town/TownRelationshipUi";
import {
  FARM_ECONOMY_MARKET_SECTIONS,
  DEFAULT_PRODUCE_DEMANDS,
  FARM_ECONOMY_ACTIVE_NPCS,
} from "@/lib/town/farmEconomyMarket";
import {
  CROP_QUALITY_DATA,
  type CropQuality,
} from "@/lib/game/farming";
import { CROP_QUALITY_ORDER } from "@/lib/game/produceEconomy";
import {
  createDefaultNpcRelationshipState,
  getRelationshipDisplayLabel,
} from "@/lib/town/relationshipDefaults";
import {
  getNpcGreeting,
  getNpcRelationshipImageId,
  getNpcRelationshipRewardSummary,
} from "@/lib/town/npcDialogue";
import { ITEM_DATA } from "@/lib/items/itemData";

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${suffix}`;
}

function isExpired(
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  deadlineDay: number,
  deadlineHour: number,
  deadlineMinute: number
) {
  if (currentDay > deadlineDay) return true;
  if (currentDay < deadlineDay) return false;
  if (currentHour > deadlineHour) return true;
  if (currentHour < deadlineHour) return false;
  return currentMinute > deadlineMinute;
}

function isExpiringSoon(
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  deadlineDay: number,
  deadlineHour: number,
  deadlineMinute: number
) {
  if (
    isExpired(
      currentDay,
      currentHour,
      currentMinute,
      deadlineDay,
      deadlineHour,
      deadlineMinute
    )
  ) {
    return false;
  }

  const currentTotal = currentDay * 24 * 60 + currentHour * 60 + currentMinute;
  const deadlineTotal = deadlineDay * 24 * 60 + deadlineHour * 60 + deadlineMinute;
  return deadlineTotal - currentTotal <= 24 * 60;
}

function InventoryChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
      {label}: {value}
    </div>
  );
}

function formatMultiplier(value: number) {
  return `x${value.toFixed(2)}`;
}

export default function TownPage() {
  const router = useRouter();
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    creatures,
    inventory,
    knownRecipeIds,
    townStock,
    townQuests,
    townNpcs,
    townNpcQuests,
    travelLog,
    purchaseTownCreature,
    purchaseMarketItem,
    getItemCount,
    getQualityItemCount,
    getQualitySellQuote,
    sellQualityProduce,
    knowsRecipe,
    submitCreatureToQuest,
    submitCreatureToNpcQuest,
    travelTo,
  } = useGame();

  const [sellerOpen, setSellerOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [relationshipsOpen, setRelationshipsOpen] = useState(false);
  const [npcRequestsOpen, setNpcRequestsOpen] = useState(false);
  const [travelLogOpen, setTravelLogOpen] = useState(false);
  const [seedShopOpen, setSeedShopOpen] = useState(false);
  const [recipeShopOpen, setRecipeShopOpen] = useState(false);
  const [produceExchangeOpen, setProduceExchangeOpen] = useState(false);
  const [farmNpcOpen, setFarmNpcOpen] = useState(false);

  function handleTravelTo(
    destination: "ranch" | "town" | "market" | "guild_hall"
  ) {
    travelTo(destination);

    if (destination === "ranch") {
      router.push("/ranch");
      return;
    }

    if (destination === "market") {
      router.push("/market");
      return;
    }

    if (destination === "guild_hall") {
      router.push("/guild_hall");
      return;
    }

    router.push("/town");
  }

  const sellerSummary = useMemo(() => {
    const cheapest =
      townStock.length > 0 ? Math.min(...townStock.map((entry) => entry.price)) : null;
    return {
      count: townStock.length,
      cheapest,
    };
  }, [townStock]);

  const openBoardCount = useMemo(() => {
    return townQuests.filter(
      (quest) =>
        !quest.completed &&
        !isExpired(
          currentDay,
          currentHour,
          currentMinute,
          quest.deadlineDay,
          quest.deadlineHour,
          quest.deadlineMinute
        )
    ).length;
  }, [townQuests, currentDay, currentHour, currentMinute]);

  const openNpcRequestCount = useMemo(() => {
    return townNpcQuests.filter(
      (quest) =>
        !quest.completed &&
        !isExpired(
          currentDay,
          currentHour,
          currentMinute,
          quest.deadlineDay,
          quest.deadlineHour,
          quest.deadlineMinute
        )
    ).length;
  }, [townNpcQuests, currentDay, currentHour, currentMinute]);

  const npcRequestCounts = useMemo(() => {
    const counts = new Map<string, number>();

    townNpcQuests.forEach((quest) => {
      const expired = isExpired(
        currentDay,
        currentHour,
        currentMinute,
        quest.deadlineDay,
        quest.deadlineHour,
        quest.deadlineMinute
      );

      if (!quest.completed && !expired) {
        counts.set(quest.npcName, (counts.get(quest.npcName) ?? 0) + 1);
      }
    });

    return counts;
  }, [townNpcQuests, currentDay, currentHour, currentMinute]);

  const farmNpcRelationshipMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof createDefaultNpcRelationshipState>>();

    FARM_ECONOMY_ACTIVE_NPCS.forEach((npc) => {
      const fallback = createDefaultNpcRelationshipState(npc.id);
      const legacyNpc = townNpcs.find((entry) => entry.id === npc.id);

      if (!legacyNpc) {
        map.set(npc.id, fallback);
        return;
      }

      const relationshipValue = Math.max(0, Number(legacyNpc.relationship ?? 0));
      const derivedLevel =
        relationshipValue >= 80 ? 5 :
        relationshipValue >= 60 ? 4 :
        relationshipValue >= 40 ? 3 :
        relationshipValue >= 20 ? 2 : 1;

      const derivedProgress =
        derivedLevel === 5
          ? Math.min(100, relationshipValue)
          : relationshipValue % 20 === 0 && relationshipValue > 0
          ? 100
          : (relationshipValue % 20) * 5;

      map.set(npc.id, {
        npcId: npc.id,
        level: derivedLevel as 1 | 2 | 3 | 4 | 5,
        progress: Math.min(100, derivedProgress),
        unlockedFlags: [],
        lastGiftedItemId: null,
        notes: [],
      });
    });

    return map;
  }, [townNpcs]);

  const seedShopSection = FARM_ECONOMY_MARKET_SECTIONS.find((section) => section.id === "seed_shop");
  const recipeShopSection = FARM_ECONOMY_MARKET_SECTIONS.find((section) => section.id === "recipe_shop");

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-stone-100 to-amber-200 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-4xl font-bold text-stone-900">🏘️ Town</h1>

        <div className="mb-6 rounded-3xl border-4 border-stone-900 bg-white/85 p-6 shadow-xl">
          <div className="grid gap-3 text-lg text-stone-800 sm:grid-cols-2 lg:grid-cols-4">
            <p><strong>Day:</strong> {currentDay}</p>
            <p><strong>Time:</strong> {formatTime(currentHour, currentMinute)}</p>
            <p><strong>Location:</strong> {currentLocation}</p>
            <p><strong>Gold:</strong> {playerData.gold}</p>
            <p><strong>Energy:</strong> {playerData.energy}</p>
            <p><strong>Player Level:</strong> {playerData.level}</p>
            <p><strong>Player XP:</strong> {playerData.xp}/{playerData.xpToNextLevel}</p>
            <p><strong>Creatures Owned:</strong> {creatures.length}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <InventoryChip label="Inventory Entries" value={Object.keys(inventory).length} />
            <InventoryChip label="Known Recipes" value={knownRecipeIds.length} />
            <InventoryChip label="Wheat" value={getItemCount("wheat")} />
            <InventoryChip label="Seeds" value={Object.keys(inventory).filter((id) => id.endsWith("_seed") && (inventory[id] ?? 0) > 0).length} />
          </div>
        </div>

        <section className="mb-6 rounded-3xl border-4 border-stone-900 bg-white/85 p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-stone-900">Town Destinations</h2>
            <p className="mt-1 text-stone-600">
              Travel from town through destination cards instead of plain buttons.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <HubCard
              icon="🌿"
              title="Ranch"
              subtitle="Return home to your creatures, eggs, and daily management."
              meta="Travel time: 30m"
              accentClasses="border-emerald-300 bg-emerald-50"
              onClick={() => handleTravelTo("ranch")}
            />

            <HubCard
              icon="🛒"
              title="Market"
              subtitle="Browse creature offers and future stall inventory."
              meta={`${sellerSummary.count} creature offers today`}
              accentClasses="border-amber-300 bg-amber-50"
              onClick={() => handleTravelTo("market")}
            />

            <HubCard
              icon="🏛️"
              title="Guild Hall"
              subtitle="Check jobs, contacts, and future guild progression."
              meta={`${openNpcRequestCount} open guild-linked requests`}
              accentClasses="border-violet-300 bg-violet-50"
              onClick={() => handleTravelTo("guild_hall")}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border-4 border-amber-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-2 text-3xl font-bold text-amber-900">Town Services</h2>
            <p className="mb-5 text-stone-600">
              Open the seller or contract board in pop-up windows so the main town screen stays clean.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSellerOpen(true)}
                className="rounded-2xl bg-amber-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Creature Seller
                <div className="mt-1 text-sm font-medium text-amber-100">
                  {sellerSummary.count} in stock
                  {sellerSummary.cheapest !== null ? ` • Cheapest ${sellerSummary.cheapest} Gold` : ""}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBoardOpen(true)}
                className="rounded-2xl bg-sky-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Breeding Quest Board
                <div className="mt-1 text-sm font-medium text-sky-100">
                  {openBoardCount} open contracts
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSeedShopOpen(true)}
                className="rounded-2xl bg-emerald-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Seed Stall
                <div className="mt-1 text-sm font-medium text-emerald-100">
                  Maris Thorn • buyable crop seeds
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRecipeShopOpen(true)}
                className="rounded-2xl bg-rose-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Recipe Counter
                <div className="mt-1 text-sm font-medium text-rose-100">
                  Tamsin Vale • buyable recipe books
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProduceExchangeOpen(true)}
                className="rounded-2xl bg-purple-700 px-4 py-4 text-left font-semibold text-white shadow sm:col-span-2"
              >
                Produce Exchange
                <div className="mt-1 text-sm font-medium text-purple-100">
                  Selene Voss • current demand bonuses
                </div>
              </button>
            </div>
          </section>

          <section className="rounded-3xl border-4 border-rose-800 bg-white/85 p-6 shadow-xl">
            <h2 className="mb-2 text-3xl font-bold text-rose-900">Town Info</h2>
            <p className="mb-5 text-stone-600">
              Secondary information opens in pop-up windows instead of stretching the main page.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRelationshipsOpen(true)}
                className="rounded-2xl bg-rose-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Relationships
                <div className="mt-1 text-sm font-medium text-rose-100">
                  {townNpcs.length} tracked NPCs
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFarmNpcOpen(true)}
                className="rounded-2xl bg-fuchsia-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Farm-Economy NPCs
                <div className="mt-1 text-sm font-medium text-fuchsia-100">
                  identity, romance tone, and stage rewards
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNpcRequestsOpen(true)}
                className="rounded-2xl bg-purple-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                NPC Requests
                <div className="mt-1 text-sm font-medium text-purple-100">
                  {openNpcRequestCount} open requests
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTravelLogOpen(true)}
                className="rounded-2xl bg-emerald-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Travel Log
                <div className="mt-1 text-sm font-medium text-emerald-100">
                  {travelLog.length} recent entries
                </div>
              </button>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/ranch" className="rounded-2xl bg-stone-800 px-4 py-4 text-center font-semibold text-white shadow">Go to Ranch</Link>
          <Link href="/ranch?tab=breeding" className="rounded-2xl bg-stone-800 px-4 py-4 text-center font-semibold text-white shadow">Ranch Breeding</Link>
          <Link href="/ranch?tab=nursery" className="rounded-2xl bg-stone-800 px-4 py-4 text-center font-semibold text-white shadow">Ranch Nursery</Link>
        </div>
      </div>

      <PopupWindow open={sellerOpen} onClose={() => setSellerOpen(false)} title="Creature Seller">
        <SellerStockList
          stock={townStock}
          playerGold={playerData.gold}
          onPurchase={purchaseTownCreature}
        />
      </PopupWindow>

      <PopupWindow open={seedShopOpen} onClose={() => setSeedShopOpen(false)} title="Maris Thorn's Seed Stall" maxWidth="max-w-4xl">
        <div className="space-y-4">
          {(() => {
            const npc = FARM_ECONOMY_ACTIVE_NPCS.find((entry) => entry.id === "maris_thorn")!;
            const relationship = farmNpcRelationshipMap.get("maris_thorn") ?? createDefaultNpcRelationshipState("maris_thorn");
            return (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                <p className="text-lg font-bold text-emerald-950">{npc.name}</p>
                <p className="text-sm font-semibold text-emerald-800">{npc.title} • {npc.race}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>
                <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting("maris_thorn", relationship)}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-stone-700 sm:grid-cols-2">
                  <p><strong>Relationship:</strong> {getRelationshipDisplayLabel(relationship)}</p>
                  <p><strong>Current Reward:</strong> {getNpcRelationshipRewardSummary("maris_thorn", relationship)}</p>
                  <p><strong>Image Slot:</strong> {getNpcRelationshipImageId("maris_thorn", relationship) ?? "none"}</p>
                  <p><strong>Current Seeds Owned:</strong> {Object.keys(inventory).filter((id) => id.endsWith("_seed") && (inventory[id] ?? 0) > 0).length}</p>
                </div>
              </div>
            );
          })()}

          <div className="grid gap-3">
            {seedShopSection?.entries.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              if (!item) return null;
              const locked = entry.unlockRelationshipLevel
                ? (farmNpcRelationshipMap.get("maris_thorn")?.level ?? 1) < entry.unlockRelationshipLevel
                : false;

              return (
                <div key={`seed-${entry.itemId}`} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-stone-900">{item.name}</p>
                      <p className="text-sm text-stone-700">{item.description}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        Grow time: {item.seedData?.growDays ?? "?"} days • Yield {item.seedData?.minYield ?? "?"}–{item.seedData?.maxYield ?? "?"}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-emerald-800">
                        Owned: {getItemCount(entry.itemId)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-stone-700">
                      <p><strong>{entry.buyPrice} Gold</strong></p>
                      <p>Stock: {entry.stock}</p>
                    </div>
                  </div>

                  {entry.unlockRelationshipLevel ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-800">
                      Unlocks at relationship level {entry.unlockRelationshipLevel}.
                    </p>
                  ) : null}

                  {entry.note ? <p className="mt-1 text-xs text-stone-600">{entry.note}</p> : null}

                  <button
                    type="button"
                    disabled={locked || playerData.gold < entry.buyPrice}
                    onClick={() => purchaseMarketItem(entry.itemId, entry.buyPrice)}
                    className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow ${
                      locked || playerData.gold < entry.buyPrice ? "bg-stone-400" : "bg-emerald-700"
                    }`}
                  >
                    {locked ? "Relationship Locked" : playerData.gold < entry.buyPrice ? "Not Enough Gold" : "Buy Seed"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </PopupWindow>

      <PopupWindow open={recipeShopOpen} onClose={() => setRecipeShopOpen(false)} title="Tamsin Vale's Recipe Counter" maxWidth="max-w-4xl">
        <div className="space-y-4">
          {(() => {
            const npc = FARM_ECONOMY_ACTIVE_NPCS.find((entry) => entry.id === "tamsin_vale")!;
            const relationship = farmNpcRelationshipMap.get("tamsin_vale") ?? createDefaultNpcRelationshipState("tamsin_vale");
            return (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4">
                <p className="text-lg font-bold text-rose-950">{npc.name}</p>
                <p className="text-sm font-semibold text-rose-800">{npc.title} • {npc.race}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>
                <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting("tamsin_vale", relationship)}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-stone-700 sm:grid-cols-2">
                  <p><strong>Relationship:</strong> {getRelationshipDisplayLabel(relationship)}</p>
                  <p><strong>Current Reward:</strong> {getNpcRelationshipRewardSummary("tamsin_vale", relationship)}</p>
                  <p><strong>Image Slot:</strong> {getNpcRelationshipImageId("tamsin_vale", relationship) ?? "none"}</p>
                  <p><strong>Known Recipes:</strong> {knownRecipeIds.length}</p>
                </div>
              </div>
            );
          })()}

          <div className="grid gap-3">
            {recipeShopSection?.entries.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              if (!item) return null;
              const unlocks = item.recipeUnlockIds ?? [];
              const fullyKnown = unlocks.length > 0 && unlocks.every((recipeId) => knowsRecipe(recipeId));

              return (
                <div key={`recipe-${entry.itemId}`} className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-stone-900">{item.name}</p>
                      <p className="text-sm text-stone-700">{item.description}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        Unlocks: {unlocks.join(", ") || "No recipes listed"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-stone-700">
                      <p><strong>{entry.buyPrice} Gold</strong></p>
                      <p>Stock: {entry.stock}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={fullyKnown || playerData.gold < entry.buyPrice}
                    onClick={() => purchaseMarketItem(entry.itemId, entry.buyPrice)}
                    className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow ${
                      fullyKnown || playerData.gold < entry.buyPrice ? "bg-stone-400" : "bg-rose-700"
                    }`}
                  >
                    {fullyKnown ? "Already Learned" : playerData.gold < entry.buyPrice ? "Not Enough Gold" : "Buy Recipe Book"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </PopupWindow>

      <PopupWindow open={produceExchangeOpen} onClose={() => setProduceExchangeOpen(false)} title="Selene Voss's Produce Exchange" maxWidth="max-w-4xl">
        <div className="space-y-4">
          {(() => {
            const npc = FARM_ECONOMY_ACTIVE_NPCS.find((entry) => entry.id === "selene_voss")!;
            const relationship = farmNpcRelationshipMap.get("selene_voss") ?? createDefaultNpcRelationshipState("selene_voss");
            return (
              <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4">
                <p className="text-lg font-bold text-purple-950">{npc.name}</p>
                <p className="text-sm font-semibold text-purple-800">{npc.title} • {npc.race}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>
                <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting("selene_voss", relationship)}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-stone-700 sm:grid-cols-2">
                  <p><strong>Relationship:</strong> {getRelationshipDisplayLabel(relationship)}</p>
                  <p><strong>Current Reward:</strong> {getNpcRelationshipRewardSummary("selene_voss", relationship)}</p>
                  <p><strong>Image Slot:</strong> {getNpcRelationshipImageId("selene_voss", relationship) ?? "none"}</p>
                  <p><strong>Cooked Goods Owned:</strong> {getItemCount("apple_pie") + getItemCount("berry_tart") + getItemCount("hearty_stew")}</p>
                </div>
              </div>
            );
          })()}

          <div className="grid gap-3">
            {DEFAULT_PRODUCE_DEMANDS.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              const qualityRows = CROP_QUALITY_ORDER.map((quality) => {
                const owned = getQualityItemCount(entry.itemId, quality);
                const quote = getQualitySellQuote(entry.itemId, quality, 1, entry.bonusSellMultiplier);
                return { quality, owned, quote };
              }).filter((row) => row.quote);

              return (
                <div key={`demand-${entry.itemId}`} className="rounded-2xl border border-purple-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-stone-900">{entry.label}</p>
                      <p className="text-sm text-stone-700">
                        {item?.name ?? entry.itemId} • {entry.flavor}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-purple-800">
                        You currently own: {getItemCount(entry.itemId)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-stone-700">
                      <p><strong>x{entry.bonusSellMultiplier.toFixed(2)}</strong></p>
                      <p>sell bonus</p>
                    </div>
                  </div>

                  {entry.unlockRelationshipLevel ? (
                    <p className="mt-2 text-xs font-semibold text-purple-800">
                      Unlocks at relationship level {entry.unlockRelationshipLevel}.
                    </p>
                  ) : null}

                  <div className="mt-4 grid gap-2">
                    {qualityRows.map(({ quality, owned, quote }) => {
                      if (!quote) return null;

                      const qualityInfo = CROP_QUALITY_DATA[quality as CropQuality];
                      const sellAllQuote =
                        owned > 0
                          ? getQualitySellQuote(entry.itemId, quality, owned, entry.bonusSellMultiplier)
                          : null;

                      return (
                        <div
                          key={`${entry.itemId}-${quality}`}
                          className={`rounded-2xl border p-3 ${
                            owned > 0
                              ? "border-purple-200 bg-purple-50"
                              : "border-stone-200 bg-stone-50"
                          }`}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="font-semibold text-stone-900">
                                {qualityInfo.label} {item?.name ?? entry.itemId}
                              </p>
                              <p className="text-xs text-stone-600">
                                Base {quote.basePrice}g - Quality {formatMultiplier(quote.qualityMultiplier)} - Demand {formatMultiplier(quote.demandMultiplier)} - Final {quote.unitPrice}g each
                              </p>
                              <p className="mt-1 text-xs font-semibold text-purple-800">
                                Owned at this quality: {owned}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={owned < 1}
                                onClick={() => sellQualityProduce(entry.itemId, quality, 1, entry.bonusSellMultiplier)}
                                className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                                  owned > 0 ? "bg-purple-700" : "bg-stone-400"
                                }`}
                              >
                                Sell 1 for {quote.unitPrice}g
                              </button>
                              <button
                                type="button"
                                disabled={owned < 1 || !sellAllQuote}
                                onClick={() => {
                                  if (sellAllQuote) {
                                    sellQualityProduce(entry.itemId, quality, owned, entry.bonusSellMultiplier);
                                  }
                                }}
                                className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                                  owned > 0 && sellAllQuote ? "bg-fuchsia-700" : "bg-stone-400"
                                }`}
                              >
                                Sell All {owned > 0 && sellAllQuote ? `for ${sellAllQuote.totalValue}g` : ""}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PopupWindow>

      <PopupWindow open={boardOpen} onClose={() => setBoardOpen(false)} title="Breeding Quest Board">
        <div className="space-y-4">
          {townQuests.map((quest) => {
            const expired = isExpired(
              currentDay,
              currentHour,
              currentMinute,
              quest.deadlineDay,
              quest.deadlineHour,
              quest.deadlineMinute
            );

            const expiringSoon = isExpiringSoon(
              currentDay,
              currentHour,
              currentMinute,
              quest.deadlineDay,
              quest.deadlineHour,
              quest.deadlineMinute
            );

            const eligibleCreatures = creatures.filter((creature) => {
              if (quest.completed || expired) return false;
              if (quest.requirement.species !== "any" && creature.name !== quest.requirement.species) return false;
              if (creature.level < quest.requirement.minimumLevel) return false;
              if (quest.requirement.requiredTrait && !creature.traits.some((entry) => entry.trait === quest.requirement.requiredTrait)) return false;

              const minimumStats = quest.requirement.minimumStats;
              if (minimumStats.strength !== undefined && creature.stats.strength < minimumStats.strength) return false;
              if (minimumStats.endurance !== undefined && creature.stats.endurance < minimumStats.endurance) return false;
              if (minimumStats.intelligence !== undefined && creature.stats.intelligence < minimumStats.intelligence) return false;
              if (minimumStats.speed !== undefined && creature.stats.speed < minimumStats.speed) return false;
              if (minimumStats.fertility !== undefined && creature.stats.fertility < minimumStats.fertility) return false;
              if (minimumStats.vitality !== undefined && creature.stats.vitality < minimumStats.vitality) return false;
              if (quest.title === "Healthy Bloodline" && creature.inbreedingRisk !== "none") return false;

              return true;
            });

            return (
              <QuestOfferCard
                key={quest.id}
                title={quest.title}
                description={quest.description}
                completed={quest.completed}
                expired={expired}
                expiringSoon={expiringSoon}
                requirement={{
                  species: quest.requirement.species,
                  minimumLevel: quest.requirement.minimumLevel,
                  requiredTrait: quest.requirement.requiredTrait ?? null,
                }}
                deadlineDay={quest.deadlineDay}
                deadlineHour={quest.deadlineHour}
                deadlineMinute={quest.deadlineMinute}
                rewardGold={quest.rewardGold}
                rewardXp={quest.rewardXp}
                eligibleCreatures={eligibleCreatures.map((creature) => ({
                  id: creature.id,
                  nickname: creature.nickname,
                  name: creature.name,
                  level: creature.level,
                }))}
                onSubmit={(creatureId) => submitCreatureToQuest(quest.id, creatureId)}
                accentClasses="border-sky-200 bg-sky-50"
                openClasses="border-amber-300 bg-amber-100 text-amber-900"
              />
            );
          })}
        </div>
      </PopupWindow>

      <PopupWindow open={relationshipsOpen} onClose={() => setRelationshipsOpen(false)} title="Town Relationships" maxWidth="max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {townNpcs.map((npc) => (
            <RelationshipCard
              key={npc.id}
              name={npc.name}
              role={npc.role}
              personality={npc.personality}
              relationship={npc.relationship}
              extraNote={`Open requests: ${npcRequestCounts.get(npc.name) ?? 0} • Current milestone notes still use legacy relationship values.`}
            />
          ))}
        </div>
      </PopupWindow>

      <PopupWindow open={farmNpcOpen} onClose={() => setFarmNpcOpen(false)} title="Farm-Economy NPCs" maxWidth="max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FARM_ECONOMY_ACTIVE_NPCS.map((npc) => {
            const relationship = farmNpcRelationshipMap.get(npc.id) ?? createDefaultNpcRelationshipState(npc.id);
            return (
              <div key={npc.id} className="rounded-2xl border-2 border-fuchsia-200 bg-fuchsia-50 p-4 shadow-sm">
                <p className="text-xl font-bold text-fuchsia-950">{npc.name}</p>
                <p className="text-sm font-semibold text-fuchsia-800">{npc.title} • {npc.race}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>

                <div className="mt-3 space-y-2 text-xs text-stone-700">
                  <p><strong>Build:</strong> {npc.bodyType}</p>
                  <p><strong>Romance Tone:</strong> {npc.romanceStyle}</p>
                  <p><strong>Personality Tags:</strong> {npc.personalityTags.join(", ")}</p>
                </div>

                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting(npc.id, relationship)}
                </p>

                <div className="mt-3 space-y-1 text-xs text-stone-700">
                  <p><strong>Relationship:</strong> {getRelationshipDisplayLabel(relationship)}</p>
                  <p><strong>Current Reward:</strong> {getNpcRelationshipRewardSummary(npc.id, relationship)}</p>
                  <p><strong>Current Image Slot:</strong> {getNpcRelationshipImageId(npc.id, relationship) ?? "none"}</p>
                  <p><strong>Favorite Items:</strong> {npc.favoriteItems.map((item) => `${item.itemId} (${item.reaction})`).join(", ")}</p>
                </div>

                <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-stone-700">
                  <p className="font-semibold text-stone-900">Relationship Notes</p>
                  <div className="mt-2 space-y-1">
                    {npc.relationshipNotes.map((note, index) => (
                      <p key={`${npc.id}-note-${index}`}>• {note}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-stone-700">
                  <p className="font-semibold text-stone-900">Farewell Flavor</p>
                  <p className="mt-1">{npc.farewellText?.[0] ?? "See you next time."}</p>
                </div>
              </div>
            );
          })}
        </div>
      </PopupWindow>

      <PopupWindow open={npcRequestsOpen} onClose={() => setNpcRequestsOpen(false)} title="NPC Requests">
        <div className="space-y-4">
          {townNpcQuests.map((quest) => {
            const expired = isExpired(
              currentDay,
              currentHour,
              currentMinute,
              quest.deadlineDay,
              quest.deadlineHour,
              quest.deadlineMinute
            );

            const eligibleCreatures = creatures.filter((creature) => {
              if (quest.completed || expired) return false;
              if (quest.requirement.species !== "any" && creature.name !== quest.requirement.species) return false;
              if (creature.level < quest.requirement.minimumLevel) return false;
              if (quest.requirement.requiredTrait && !creature.traits.some((entry) => entry.trait === quest.requirement.requiredTrait)) return false;

              const minimumStats = quest.requirement.minimumStats;
              if (minimumStats.strength !== undefined && creature.stats.strength < minimumStats.strength) return false;
              if (minimumStats.endurance !== undefined && creature.stats.endurance < minimumStats.endurance) return false;
              if (minimumStats.intelligence !== undefined && creature.stats.intelligence < minimumStats.intelligence) return false;
              if (minimumStats.speed !== undefined && creature.stats.speed < minimumStats.speed) return false;
              if (minimumStats.fertility !== undefined && creature.stats.fertility < minimumStats.fertility) return false;
              if (minimumStats.vitality !== undefined && creature.stats.vitality < minimumStats.vitality) return false;

              return true;
            });

            return (
              <QuestOfferCard
                key={quest.id}
                title={quest.title}
                description={quest.description}
                giverName={quest.npcName}
                completed={quest.completed}
                expired={expired}
                requirement={{
                  species: quest.requirement.species,
                  minimumLevel: quest.requirement.minimumLevel,
                  requiredTrait: quest.requirement.requiredTrait ?? null,
                }}
                deadlineDay={quest.deadlineDay}
                deadlineHour={quest.deadlineHour}
                deadlineMinute={quest.deadlineMinute}
                rewardGold={quest.rewardGold}
                rewardXp={quest.rewardXp}
                relationshipGain={quest.relationshipGain}
                eligibleCreatures={eligibleCreatures.map((creature) => ({
                  id: creature.id,
                  nickname: creature.nickname,
                  name: creature.name,
                  level: creature.level,
                }))}
                onSubmit={(creatureId) => submitCreatureToNpcQuest(quest.id, creatureId)}
                accentClasses="border-purple-200 bg-purple-50"
                openClasses="border-purple-300 bg-white text-purple-900"
              />
            );
          })}
        </div>
      </PopupWindow>

      <PopupWindow open={travelLogOpen} onClose={() => setTravelLogOpen(false)} title="Travel Log" maxWidth="max-w-3xl">
        {travelLog.length === 0 ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-stone-700">No travel logged yet.</div>
        ) : (
          <div className="space-y-3">
            {travelLog.map((entry) => (
              <div key={entry.id} className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-stone-900">{entry.from} → {entry.to}</p>
                <p className="text-sm text-stone-700">Day {entry.day}, {formatTime(entry.hour, entry.minute)}</p>
                <p className="text-sm text-stone-600">Travel time: {entry.minutesSpent} minutes</p>
              </div>
            ))}
          </div>
        )}
      </PopupWindow>
    </main>
  );
}
