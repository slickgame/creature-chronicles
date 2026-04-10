"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import { HubCard, PopupWindow } from "@/components/town/TownUi";
import { SellerStockList } from "@/components/town/TownSellerUi";
import { QuestOfferCard } from "@/components/town/TownQuestUi";
import { RelationshipCard } from "@/components/town/TownRelationshipUi";
import { FARM_ECONOMY_MARKET_SECTIONS, DEFAULT_PRODUCE_DEMANDS } from "@/lib/town/farmEconomyMarket";
import { FARM_ECONOMY_ACTIVE_NPCS } from "@/lib/town/farmEconomyMarket";
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

type CreatureTrait =
  | "none"
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

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

export default function TownPage() {
  const router = useRouter();
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentLocation,
    playerData,
    creatures,
    townStock,
    townQuests,
    townNpcs,
    townNpcQuests,
    travelLog,
    purchaseTownCreature,
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
                  Maris Thorn • starter crop seeds
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRecipeShopOpen(true)}
                className="rounded-2xl bg-rose-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Recipe Counter
                <div className="mt-1 text-sm font-medium text-rose-100">
                  Tamsin Vale • cookbooks and kitchen charm
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
                  unique dialogue, rewards, and image slots
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
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="text-lg font-bold text-emerald-950">Maris Thorn</p>
            <p className="mt-1 text-sm text-stone-700">
              {getNpcGreeting("maris_thorn", farmNpcRelationshipMap.get("maris_thorn"))}
            </p>
            <p className="mt-2 text-xs font-semibold text-emerald-900">
              {getRelationshipDisplayLabel(farmNpcRelationshipMap.get("maris_thorn") ?? createDefaultNpcRelationshipState("maris_thorn"))}
            </p>
          </div>

          <div className="grid gap-3">
            {FARM_ECONOMY_MARKET_SECTIONS.find((section) => section.id === "seed_shop")?.entries.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              if (!item) return null;
              return (
                <div key={`seed-${entry.itemId}`} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-stone-900">{item.name}</p>
                      <p className="text-sm text-stone-700">{item.description}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        Grow time: {item.seedData?.growDays ?? "?"} days • Yield {item.seedData?.minYield ?? "?"}–{item.seedData?.maxYield ?? "?"}
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
                  {entry.note ? (
                    <p className="mt-1 text-xs text-stone-600">{entry.note}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </PopupWindow>

      <PopupWindow open={recipeShopOpen} onClose={() => setRecipeShopOpen(false)} title="Tamsin Vale's Recipe Counter" maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4">
            <p className="text-lg font-bold text-rose-950">Tamsin Vale</p>
            <p className="mt-1 text-sm text-stone-700">
              {getNpcGreeting("tamsin_vale", farmNpcRelationshipMap.get("tamsin_vale"))}
            </p>
            <p className="mt-2 text-xs font-semibold text-rose-900">
              {getRelationshipDisplayLabel(farmNpcRelationshipMap.get("tamsin_vale") ?? createDefaultNpcRelationshipState("tamsin_vale"))}
            </p>
          </div>

          <div className="grid gap-3">
            {FARM_ECONOMY_MARKET_SECTIONS.find((section) => section.id === "recipe_shop")?.entries.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              if (!item) return null;
              return (
                <div key={`recipe-${entry.itemId}`} className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-stone-900">{item.name}</p>
                      <p className="text-sm text-stone-700">{item.description}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        Unlocks: {item.recipeUnlockIds?.join(", ") ?? "No recipes listed"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-stone-700">
                      <p><strong>{entry.buyPrice} Gold</strong></p>
                      <p>Stock: {entry.stock}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PopupWindow>

      <PopupWindow open={produceExchangeOpen} onClose={() => setProduceExchangeOpen(false)} title="Selene Voss's Produce Exchange" maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4">
            <p className="text-lg font-bold text-purple-950">Selene Voss</p>
            <p className="mt-1 text-sm text-stone-700">
              {getNpcGreeting("selene_voss", farmNpcRelationshipMap.get("selene_voss"))}
            </p>
            <p className="mt-2 text-xs font-semibold text-purple-900">
              {getRelationshipDisplayLabel(farmNpcRelationshipMap.get("selene_voss") ?? createDefaultNpcRelationshipState("selene_voss"))}
            </p>
          </div>

          <div className="grid gap-3">
            {DEFAULT_PRODUCE_DEMANDS.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              return (
                <div key={`demand-${entry.itemId}`} className="rounded-2xl border border-purple-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-stone-900">{entry.label}</p>
                      <p className="text-sm text-stone-700">
                        {item?.name ?? entry.itemId} • {entry.flavor}
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

      <PopupWindow open={farmNpcOpen} onClose={() => setFarmNpcOpen(false)} title="Farm-Economy NPCs" maxWidth="max-w-5xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FARM_ECONOMY_ACTIVE_NPCS.map((npc) => {
            const relationship = farmNpcRelationshipMap.get(npc.id) ?? createDefaultNpcRelationshipState(npc.id);
            return (
              <div key={npc.id} className="rounded-2xl border-2 border-fuchsia-200 bg-fuchsia-50 p-4 shadow-sm">
                <p className="text-xl font-bold text-fuchsia-950">{npc.name}</p>
                <p className="text-sm font-semibold text-fuchsia-800">{npc.title}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>
                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting(npc.id, relationship)}
                </p>
                <div className="mt-3 space-y-1 text-xs text-stone-700">
                  <p><strong>Relationship:</strong> {getRelationshipDisplayLabel(relationship)}</p>
                  <p><strong>Current Reward:</strong> {getNpcRelationshipRewardSummary(npc.id, relationship)}</p>
                  <p><strong>Current Image Slot:</strong> {getNpcRelationshipImageId(npc.id, relationship) ?? "none"}</p>
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
