"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import { HubCard, PopupWindow } from "@/components/town/TownUi";
import { SellerStockList } from "@/components/town/TownSellerUi";
import { QuestOfferCard } from "@/components/town/TownQuestUi";
import { RelationshipCard } from "@/components/town/TownRelationshipUi";
import { NpcVisitImageFrame } from "@/components/town/TownNpcImageUi";
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
  buildTownNpcRelationshipMap,
  getMarisAdjustedBuyPrice,
  getMarisBonusSeedBundleQuantity,
  getNpcEconomicUnlocks,
  getSeleneAdjustedDemandMultiplier,
  getSelenePremiumContracts,
  getTamsinCookingCommissions,
  getTamsinProgressionPerks,
  getTamsinRecipeBookPrice,
} from "@/lib/game/npcEconomy";
import {
  getNpcCurrentStageRewardSummary,
  getNpcFarewell,
  getNpcFlirtLine,
  getNpcGreeting,
  getNpcNextStageRewardSummary,
  getNpcRelationshipRewardSummary,
  getNpcStageProgressHint,
} from "@/lib/town/npcDialogue";
import { getNpcVisitImage } from "@/lib/town/npcImages";
import { ITEM_DATA } from "@/lib/items/itemData";
import type { QualitySellQuote } from "@/lib/game/produceEconomy";
import type { NpcContractOffer, NpcContractRequirement } from "@/lib/town/npcContractLedger";
import {
  NPC_RELATIONSHIP_EVENT_SCENES,
  type NpcContractCompletionHistory,
  type NpcRelationshipEventScene,
  type NpcRelationshipEventUnlock,
} from "@/lib/town/npcRelationshipEvents";
import type { FarmEconomyNpcId } from "@/lib/game/npcEconomy";
import type { NpcContractOfferKind } from "@/lib/town/npcContractLedger";
import type { NpcRelationshipState } from "@/lib/town/relationshipDefaults";

type ProduceQualityRow = {
  quality: CropQuality;
  owned: number;
  quote: QualitySellQuote | null;
};

type MemoryNpcGroup = {
  npcId: FarmEconomyNpcId;
  name: string;
  accentClasses: string;
  titleClasses: string;
  relationship: NpcRelationshipState;
};

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

function NpcStageVisitPanel({
  npcId,
  relationship,
  accentClasses,
}: {
  npcId: string;
  relationship: NpcRelationshipState;
  accentClasses: string;
}) {
  return (
    <div className={`mt-3 rounded-lg border bg-white/80 p-3 text-sm text-stone-700 ${accentClasses}`}>
      <p className="text-xs font-semibold uppercase text-stone-500">Stage Visit Flavor</p>
      <div className="mt-2 grid gap-2 lg:grid-cols-3">
        <p className="rounded-lg bg-white px-3 py-2">
          <strong>Greeting:</strong> {getNpcGreeting(npcId, relationship)}
        </p>
        <p className="rounded-lg bg-white px-3 py-2">
          <strong>Flirt:</strong> {getNpcFlirtLine(npcId, relationship)}
        </p>
        <p className="rounded-lg bg-white px-3 py-2">
          <strong>Farewell:</strong> {getNpcFarewell(npcId, relationship)}
        </p>
      </div>
      <div className="mt-3 grid gap-2 text-xs lg:grid-cols-3">
        <p><strong>Stage Reward:</strong> {getNpcCurrentStageRewardSummary(npcId, relationship)}</p>
        <p><strong>Next Stage:</strong> {getNpcNextStageRewardSummary(npcId, relationship)}</p>
        <p><strong>Hint:</strong> {getNpcStageProgressHint(npcId, relationship)}</p>
      </div>
    </div>
  );
}

function formatMultiplier(value: number) {
  return `x${value.toFixed(2)}`;
}

function formatOfferKind(kind: NpcContractOfferKind) {
  return kind
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAcceptedQualities(minimumQuality: CropQuality) {
  const minimumIndex = CROP_QUALITY_ORDER.indexOf(minimumQuality);
  if (minimumIndex === -1) return CROP_QUALITY_ORDER;
  return CROP_QUALITY_ORDER.slice(minimumIndex);
}

function formatItemQuantity(itemId: string, quantity: number) {
  return `${ITEM_DATA[itemId]?.name ?? itemId} x${quantity}`;
}

function getRequirementLabel(requirement: NpcContractRequirement) {
  const quality = requirement.minimumQuality && requirement.minimumQuality !== "standard"
    ? ` (${CROP_QUALITY_DATA[requirement.minimumQuality].label}+)`
    : "";
  return `${formatItemQuantity(requirement.itemId, requirement.quantity)}${quality}`;
}

function isOfferExpired(
  offer: NpcContractOffer,
  currentDay: number,
  currentHour: number,
  currentMinute: number
) {
  if (currentDay > offer.expiryDay) return true;
  if (currentDay < offer.expiryDay) return false;
  if (currentHour > offer.expiryHour) return true;
  if (currentHour < offer.expiryHour) return false;
  return currentMinute > offer.expiryMinute;
}

function getOfferAvailability(
  offer: NpcContractOffer,
  playerGold: number,
  hasMounted: boolean,
  getItemCount: (itemId: string) => number,
  getQualityItemCount: (itemId: string, quality: CropQuality) => number
) {
  if (!hasMounted) return { canComplete: false, note: "Loading ledger..." };
  if (offer.completed) return { canComplete: false, note: "Completed" };
  if ((offer.purchaseCostGold ?? 0) > playerGold) {
    return { canComplete: false, note: `Need ${offer.purchaseCostGold}g` };
  }

  for (const requirement of offer.requirements) {
    const minimumQuality = requirement.minimumQuality ?? "standard";
    const owned = getAcceptedQualities(minimumQuality).reduce(
      (sum, quality) => sum + getQualityItemCount(requirement.itemId, quality),
      0
    );
    const fallbackOwned = minimumQuality === "standard" ? getItemCount(requirement.itemId) : owned;
    const available = Math.max(owned, fallbackOwned);
    if (available < requirement.quantity) {
      return {
        canComplete: false,
        note: `Need ${requirement.quantity} ${ITEM_DATA[requirement.itemId]?.name ?? requirement.itemId} (${available}/${requirement.quantity})`,
      };
    }
  }

  return { canComplete: true, note: offer.purchaseCostGold ? "Buy offer" : "Complete offer" };
}

function NpcContractLedgerPanel({
  title,
  offers,
  currentDay,
  currentHour,
  currentMinute,
  playerGold,
  hasMounted,
  getItemCount,
  getQualityItemCount,
  onComplete,
  accentClasses,
  buttonClasses,
}: {
  title: string;
  offers: NpcContractOffer[];
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  playerGold: number;
  hasMounted: boolean;
  getItemCount: (itemId: string) => number;
  getQualityItemCount: (itemId: string, quality: CropQuality) => number;
  onComplete: (offerId: string) => boolean;
  accentClasses: string;
  buttonClasses: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accentClasses}`}>
      <p className="text-lg font-bold text-stone-950">{title}</p>
      <p className="mt-1 text-sm text-stone-700">
        Day-seeded offers stay on the ledger until they expire or you finish them.
      </p>

      <div className="mt-3 grid gap-3">
        {offers.length === 0 ? (
          <p className="rounded-2xl bg-white p-3 text-sm text-stone-600">No open ledger offers right now.</p>
        ) : (
          offers.map((offer) => {
            const expired = isOfferExpired(offer, currentDay, currentHour, currentMinute);
            const availability = expired
              ? { canComplete: false, note: "Expired" }
              : getOfferAvailability(offer, playerGold, hasMounted, getItemCount, getQualityItemCount);
            const requirements = offer.requirements.map(getRequirementLabel).join(", ");

            return (
              <div key={offer.id} className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-stone-900">{offer.title}</p>
                    <p className="text-xs text-stone-600">
                      Generated Day {offer.generatedDay} - Expires Day {offer.expiryDay}, {formatTime(offer.expiryHour, offer.expiryMinute)}
                    </p>
                  </div>
                  <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
                    L{offer.relationshipLevel} {offer.qualityLabel}
                  </span>
                </div>

                <p className="mt-2 text-sm text-stone-700">{offer.description}</p>
                <p className="mt-2 rounded-2xl bg-stone-50 px-3 py-2 text-sm text-stone-700">{offer.flavorText}</p>

                <div className="mt-3 grid gap-2 text-xs text-stone-700 md:grid-cols-2">
                  <p><strong>Terms:</strong> {requirements || `Pay ${offer.purchaseCostGold ?? 0}g`}</p>
                  <p><strong>Reward:</strong> {offer.rewardSummary}</p>
                </div>

                {offer.completed ? (
                  <p className="mt-3 rounded-2xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-900">
                    {offer.completionText}
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={!availability.canComplete}
                    onClick={() => onComplete(offer.id)}
                    className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow ${
                      availability.canComplete ? buttonClasses : "bg-stone-400"
                    }`}
                  >
                    {availability.note}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function NpcRelationshipEventPanel({
  latestEvent,
  eventLog,
}: {
  latestEvent: NpcRelationshipEventUnlock | null;
  eventLog: NpcRelationshipEventUnlock[];
}) {
  return (
    <section className="mt-6 rounded-3xl border-4 border-pink-900 bg-white/90 p-6 shadow-xl">
      <h2 className="text-3xl font-bold text-pink-950">Relationship Scenes</h2>
      <p className="mt-1 text-stone-600">
        Ledger completions can unlock private dialogue beats as trust turns warmer.
      </p>

      {latestEvent ? (
        <div className="mt-4 rounded-2xl border border-pink-300 bg-pink-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-800">Latest Scene</p>
          <h3 className="mt-1 text-xl font-bold text-stone-950">{latestEvent.title}</h3>
          <p className="text-sm font-semibold text-pink-800">{latestEvent.subtitle}</p>
          <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
            {latestEvent.sceneText}
          </p>
          <div className="mt-3 grid gap-2 text-xs text-stone-700 md:grid-cols-2">
            <p><strong>Unlocked Day:</strong> {latestEvent.unlockedDay}</p>
            <p><strong>Reward:</strong> {latestEvent.rewardSummary}</p>
            <p><strong>Image Hook:</strong> {latestEvent.imageUnlockId ?? "future scene slot"}</p>
            <p><strong>Source:</strong> {latestEvent.sourceOfferKind}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-pink-200 bg-pink-50 p-4 text-sm text-stone-700">
          No relationship scene has triggered yet. Complete ledger offers as relationships deepen.
        </p>
      )}

      {eventLog.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {eventLog.map((event) => (
            <div key={event.id} className="rounded-2xl border border-pink-200 bg-white p-3">
              <p className="font-semibold text-stone-900">{event.title}</p>
              <p className="text-xs text-stone-600">{event.subtitle}</p>
              <p className="mt-2 text-xs font-semibold text-pink-800">
                L{event.requiredRelationshipLevel} - {event.rewardSummary}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function getMemoryHint(
  scene: NpcRelationshipEventScene,
  relationship: NpcRelationshipState,
  completionHistory: NpcContractCompletionHistory
) {
  const relationshipHint =
    relationship.level < scene.requiredRelationshipLevel
      ? `Reach relationship level ${scene.requiredRelationshipLevel}.`
      : `Relationship level ${scene.requiredRelationshipLevel} met.`;
  const completionCount = completionHistory[scene.completionHistoryKey] ?? 0;
  const completionHint =
    completionCount < scene.requiredCompletionCount
      ? `Complete ${scene.requiredCompletionCount - completionCount} more matching ledger offer(s): ${scene.eligibleOfferKinds.map(formatOfferKind).join(", ")}.`
      : `Ledger completion requirement met with ${completionCount}/${scene.requiredCompletionCount}.`;

  return `${relationshipHint} ${completionHint}`;
}

function RelationshipMemoriesModalContent({
  npcGroups,
  eventLog,
  completionHistory,
}: {
  npcGroups: MemoryNpcGroup[];
  eventLog: NpcRelationshipEventUnlock[];
  completionHistory: NpcContractCompletionHistory;
}) {
  const unlockedById = new Map(eventLog.map((event) => [event.id, event]));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-pink-200 bg-pink-50 p-4">
        <p className="text-lg font-bold text-pink-950">Relationship Memories</p>
        <p className="mt-1 text-sm text-stone-700">
          Scenes unlocked from ledger completions are kept here as collectible moments, with image slots ready for future art.
        </p>
      </div>

      {npcGroups.map((group) => {
        const scenes = NPC_RELATIONSHIP_EVENT_SCENES.filter((scene) => scene.npcId === group.npcId);
        const unlockedCount = scenes.filter((scene) => unlockedById.has(scene.id)).length;

        return (
          <section key={group.npcId} className={`rounded-2xl border p-4 ${group.accentClasses}`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className={`text-xl font-bold ${group.titleClasses}`}>{group.name}</p>
                <p className="text-sm text-stone-700">
                  {unlockedCount}/{scenes.length} memories unlocked - {getRelationshipDisplayLabel(group.relationship)}
                </p>
              </div>
              <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                Image slots: {scenes.map((scene) => scene.imageUnlockId ?? scene.id).join(", ")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {scenes.map((scene) => {
                const unlocked = unlockedById.get(scene.id);
                const hint = getMemoryHint(scene, group.relationship, completionHistory);

                return (
                  <article
                    key={scene.id}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      unlocked ? "border-white bg-white" : "border-stone-300 bg-stone-100"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start">
                      <div
                        className={`flex h-24 w-full shrink-0 items-center justify-center rounded-2xl border text-center text-xs font-semibold md:w-28 ${
                          unlocked
                            ? "border-pink-200 bg-pink-50 text-pink-900"
                            : "border-stone-300 bg-stone-200 text-stone-600"
                        }`}
                      >
                        {unlocked ? scene.imageUnlockId ?? "scene image" : "Locked image slot"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-stone-950">{scene.title}</p>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            unlocked ? "bg-green-100 text-green-900" : "bg-stone-200 text-stone-700"
                          }`}>
                            {unlocked ? "Unlocked" : "Locked"}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-stone-700">{scene.subtitle}</p>
                        <p className="mt-2 text-xs text-stone-600">
                          Image Unlock ID: {scene.imageUnlockId ?? "future_scene_slot"}
                        </p>
                      </div>
                    </div>

                    {unlocked ? (
                      <div className="mt-3 space-y-2 text-sm text-stone-700">
                        <p><strong>Unlocked Day:</strong> {unlocked.unlockedDay}</p>
                        <p><strong>Source Contract:</strong> {formatOfferKind(unlocked.sourceOfferKind)}</p>
                        <p className="rounded-2xl bg-stone-50 px-3 py-2">{unlocked.sceneText}</p>
                        <p><strong>Reward:</strong> {unlocked.rewardSummary}</p>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 text-sm text-stone-700">
                        <p><strong>Next Hint:</strong> {hint}</p>
                        <p><strong>Likely Source:</strong> {scene.eligibleOfferKinds.map(formatOfferKind).join(", ")}</p>
                        <p><strong>Reward Preview:</strong> {scene.rewardSummary}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function subscribeToMountState() {
  return () => {};
}

function getClientMountSnapshot() {
  return true;
}

function getServerMountSnapshot() {
  return false;
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
    npcContractLedger,
    npcRelationshipEventLog,
    latestNpcRelationshipEvent,
    npcContractCompletionHistory,
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
    submitNpcFarmingRequest,
    completeNpcContractOffer,
    travelTo,
  } = useGame();

  const hasMounted = useSyncExternalStore(
    subscribeToMountState,
    getClientMountSnapshot,
    getServerMountSnapshot
  );
  const [sellerOpen, setSellerOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [relationshipsOpen, setRelationshipsOpen] = useState(false);
  const [memoriesOpen, setMemoriesOpen] = useState(false);
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
    return buildTownNpcRelationshipMap(
      FARM_ECONOMY_ACTIVE_NPCS.map((npc) => npc.id),
      townNpcs
    );
  }, [townNpcs]);

  const marisRelationship =
    farmNpcRelationshipMap.get("maris_thorn") ?? createDefaultNpcRelationshipState("maris_thorn");
  const seleneRelationship =
    farmNpcRelationshipMap.get("selene_voss") ?? createDefaultNpcRelationshipState("selene_voss");
  const tamsinRelationship =
    farmNpcRelationshipMap.get("tamsin_vale") ?? createDefaultNpcRelationshipState("tamsin_vale");

  const marisEconomicUnlocks = getNpcEconomicUnlocks("maris_thorn");
  const seleneEconomicUnlocks = getNpcEconomicUnlocks("selene_voss");
  const tamsinEconomicUnlocks = getNpcEconomicUnlocks("tamsin_vale");

  const selenePremiumContracts = getSelenePremiumContracts(seleneRelationship);
  const tamsinCommissions = getTamsinCookingCommissions(tamsinRelationship);
  const tamsinProgressionPerks = getTamsinProgressionPerks(tamsinRelationship);
  const marisLedgerOffers = npcContractLedger.filter((offer) => offer.npcId === "maris_thorn");
  const seleneLedgerOffers = npcContractLedger.filter((offer) => offer.npcId === "selene_voss");
  const tamsinLedgerOffers = npcContractLedger.filter((offer) => offer.npcId === "tamsin_vale");
  const memoryNpcGroups: MemoryNpcGroup[] = [
    {
      npcId: "maris_thorn",
      name: "Maris Thorn",
      accentClasses: "border-emerald-300 bg-emerald-50",
      titleClasses: "text-emerald-950",
      relationship: marisRelationship,
    },
    {
      npcId: "selene_voss",
      name: "Selene Voss",
      accentClasses: "border-purple-300 bg-purple-50",
      titleClasses: "text-purple-950",
      relationship: seleneRelationship,
    },
    {
      npcId: "tamsin_vale",
      name: "Tamsin Vale",
      accentClasses: "border-rose-300 bg-rose-50",
      titleClasses: "text-rose-950",
      relationship: tamsinRelationship,
    },
  ];

  const seedShopSection = FARM_ECONOMY_MARKET_SECTIONS.find((section) => section.id === "seed_shop");
  const recipeShopSection = FARM_ECONOMY_MARKET_SECTIONS.find((section) => section.id === "recipe_shop");

  const displayedSellerCount = hasMounted ? sellerSummary.count : 0;
  const displayedCheapest = hasMounted ? sellerSummary.cheapest : null;
  const displayedInventoryCount = hasMounted ? Object.keys(inventory).length : 0;
  const displayedKnownRecipes = hasMounted ? knownRecipeIds.length : 0;
  const displayedSeedOwned = hasMounted
    ? Object.keys(inventory).filter((id) => id.endsWith("_seed") && (inventory[id] ?? 0) > 0).length
    : 0;

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
            <InventoryChip label="Inventory Entries" value={displayedInventoryCount} />
            <InventoryChip label="Known Recipes" value={displayedKnownRecipes} />
            <InventoryChip label="Wheat" value={hasMounted ? getItemCount("wheat") : 0} />
            <InventoryChip label="Seeds" value={displayedSeedOwned} />
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
              meta={hasMounted ? `${displayedSellerCount} creature offers today` : "Loading market..."}
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
                <div className="mt-1 text-sm font-medium text-amber-100" suppressHydrationWarning>
                  {hasMounted
                    ? `${displayedSellerCount} in stock${displayedCheapest !== null ? ` • Cheapest ${displayedCheapest} Gold` : ""}`
                    : "Loading market..."}
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
                onClick={() => setMemoriesOpen(true)}
                className="rounded-2xl bg-pink-700 px-4 py-4 text-left font-semibold text-white shadow"
              >
                Relationship Memories
                <div className="mt-1 text-sm font-medium text-pink-100">
                  {npcRelationshipEventLog.length} scene memories unlocked
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

        <section className="mt-6 rounded-3xl border-4 border-fuchsia-900 bg-white/90 p-6 shadow-xl">
          <h2 className="text-3xl font-bold text-fuchsia-950">Relationship Economy Perks</h2>
          <p className="mt-1 text-stone-600">
            Each farm-economy relationship stage now unlocks distinct economic pressure and payoff.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
              <p className="text-lg font-bold text-emerald-950">Maris Thorn</p>
              <p className="text-xs font-semibold text-emerald-800">Level {marisRelationship.level}</p>
              <div className="mt-3 space-y-2 text-xs text-stone-700">
                {marisEconomicUnlocks.map((unlock) => (
                  <p key={`maris-unlock-${unlock.level}`}>
                    <strong>{marisRelationship.level >= unlock.level ? "Unlocked" : "Locked"} L{unlock.level}:</strong> {unlock.title}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4">
              <p className="text-lg font-bold text-purple-950">Selene Voss</p>
              <p className="text-xs font-semibold text-purple-800">Level {seleneRelationship.level}</p>
              <div className="mt-3 space-y-2 text-xs text-stone-700">
                {seleneEconomicUnlocks.map((unlock) => (
                  <p key={`selene-unlock-${unlock.level}`}>
                    <strong>{seleneRelationship.level >= unlock.level ? "Unlocked" : "Locked"} L{unlock.level}:</strong> {unlock.title}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4">
              <p className="text-lg font-bold text-rose-950">Tamsin Vale</p>
              <p className="text-xs font-semibold text-rose-800">Level {tamsinRelationship.level}</p>
              <div className="mt-3 space-y-2 text-xs text-stone-700">
                {tamsinEconomicUnlocks.map((unlock) => (
                  <p key={`tamsin-unlock-${unlock.level}`}>
                    <strong>{tamsinRelationship.level >= unlock.level ? "Unlocked" : "Locked"} L{unlock.level}:</strong> {unlock.title}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <NpcRelationshipEventPanel
          latestEvent={latestNpcRelationshipEvent}
          eventLog={npcRelationshipEventLog}
        />

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
            const relationship = marisRelationship;
            const visitImage = getNpcVisitImage(npc, relationship);
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
                  <p><strong>Visit Image:</strong> {visitImage.imageId}</p>
                  <p><strong>Current Seeds Owned:</strong> {displayedSeedOwned}</p>
                </div>
                <NpcVisitImageFrame
                  image={visitImage}
                  accentClasses="mt-3 border-emerald-200 bg-emerald-100/70 text-emerald-950"
                />
                <NpcStageVisitPanel
                  npcId="maris_thorn"
                  relationship={relationship}
                  accentClasses="border-emerald-200"
                />
              </div>
            );
          })()}

          <NpcContractLedgerPanel
            title="Maris's Grower Ledger"
            offers={marisLedgerOffers}
            currentDay={currentDay}
            currentHour={currentHour}
            currentMinute={currentMinute}
            playerGold={playerData.gold}
            hasMounted={hasMounted}
            getItemCount={getItemCount}
            getQualityItemCount={getQualityItemCount}
            onComplete={completeNpcContractOffer}
            accentClasses="border-emerald-300 bg-emerald-100/70"
            buttonClasses="bg-emerald-700"
          />

          <div className="grid gap-3">
            {seedShopSection?.entries.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              if (!item) return null;
              const adjustedPrice = getMarisAdjustedBuyPrice(
                entry.itemId,
                entry.buyPrice,
                marisRelationship
              );
              const bonusSeedQuantity = getMarisBonusSeedBundleQuantity(
                entry.itemId,
                marisRelationship,
                currentDay,
                currentHour,
                currentMinute
              );
              const locked = entry.unlockRelationshipLevel
                ? marisRelationship.level < entry.unlockRelationshipLevel
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
                        Owned: {hasMounted ? getItemCount(entry.itemId) : 0}
                      </p>
                    </div>
                    <div className="text-right text-sm text-stone-700">
                      <p><strong>{adjustedPrice} Gold</strong></p>
                      {adjustedPrice < entry.buyPrice ? (
                        <p className="text-xs font-semibold text-emerald-800">Base {entry.buyPrice}g</p>
                      ) : null}
                      <p>Stock: {entry.stock}</p>
                    </div>
                  </div>

                  {entry.unlockRelationshipLevel ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-800">
                      Unlocks at relationship level {entry.unlockRelationshipLevel}.
                    </p>
                  ) : null}

                  {entry.note ? <p className="mt-1 text-xs text-stone-600">{entry.note}</p> : null}
                  {bonusSeedQuantity > 0 ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-800">
                      Bonus bundle active: +{bonusSeedQuantity} free {item.name} on this purchase.
                    </p>
                  ) : null}

                  <button
                    type="button"
                    disabled={locked || playerData.gold < adjustedPrice || !hasMounted}
                    onClick={() => {
                      const purchased = purchaseMarketItem(entry.itemId, adjustedPrice);
                      if (purchased && bonusSeedQuantity > 0) {
                        for (let index = 0; index < bonusSeedQuantity; index += 1) {
                          purchaseMarketItem(entry.itemId, 0);
                        }
                      }
                    }}
                    className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow ${
                      locked || playerData.gold < adjustedPrice || !hasMounted ? "bg-stone-400" : "bg-emerald-700"
                    }`}
                  >
                    {locked ? "Relationship Locked" : playerData.gold < adjustedPrice ? "Not Enough Gold" : "Buy Seed"}
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
            const relationship = tamsinRelationship;
            const visitImage = getNpcVisitImage(npc, relationship);
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
                  <p><strong>Visit Image:</strong> {visitImage.imageId}</p>
                  <p><strong>Known Recipes:</strong> {displayedKnownRecipes}</p>
                </div>
                <NpcVisitImageFrame
                  image={visitImage}
                  accentClasses="mt-3 border-rose-200 bg-rose-100/70 text-rose-950"
                />
                <NpcStageVisitPanel
                  npcId="tamsin_vale"
                  relationship={relationship}
                  accentClasses="border-rose-200"
                />
                <div className="mt-3 rounded-2xl border border-rose-200 bg-white p-3 text-xs text-stone-700">
                  <p className="font-semibold text-stone-900">Progression Perks</p>
                  <div className="mt-2 space-y-1">
                    {tamsinProgressionPerks.map((perk, index) => (
                      <p key={`tamsin-perk-${index}`}>• {perk}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <NpcContractLedgerPanel
            title="Tamsin's Kitchen Ledger"
            offers={tamsinLedgerOffers}
            currentDay={currentDay}
            currentHour={currentHour}
            currentMinute={currentMinute}
            playerGold={playerData.gold}
            hasMounted={hasMounted}
            getItemCount={getItemCount}
            getQualityItemCount={getQualityItemCount}
            onComplete={completeNpcContractOffer}
            accentClasses="border-rose-300 bg-rose-100/70"
            buttonClasses="bg-rose-700"
          />

          <div className="grid gap-3">
            {recipeShopSection?.entries.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              if (!item) return null;
              const adjustedPrice = getTamsinRecipeBookPrice(entry.buyPrice, tamsinRelationship);
              const unlocks = item.recipeUnlockIds ?? [];
              const fullyKnown = hasMounted && unlocks.length > 0 && unlocks.every((recipeId) => knowsRecipe(recipeId));

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
                      <p><strong>{adjustedPrice} Gold</strong></p>
                      {adjustedPrice < entry.buyPrice ? (
                        <p className="text-xs font-semibold text-rose-800">Base {entry.buyPrice}g</p>
                      ) : null}
                      <p>Stock: {entry.stock}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={fullyKnown || playerData.gold < adjustedPrice || !hasMounted}
                    onClick={() => purchaseMarketItem(entry.itemId, adjustedPrice)}
                    className={`mt-3 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow ${
                      fullyKnown || playerData.gold < adjustedPrice || !hasMounted ? "bg-stone-400" : "bg-rose-700"
                    }`}
                  >
                    {fullyKnown ? "Already Learned" : playerData.gold < adjustedPrice ? "Not Enough Gold" : "Buy Recipe Book"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-rose-300 bg-rose-100/70 p-4">
            <p className="text-lg font-bold text-rose-950">Cooking Commissions</p>
            <p className="mt-1 text-sm text-stone-700">
              Fulfill Tamsin&apos;s kitchen orders with crafted meals to push gold back into your ranch loop.
            </p>

            {tamsinCommissions.length === 0 ? (
              <p className="mt-3 text-sm text-stone-600">Reach relationship level 3 with Tamsin to unlock commissions.</p>
            ) : (
              <div className="mt-3 grid gap-3">
                {tamsinCommissions.map((commission) => {
                  const owned = hasMounted ? getQualityItemCount(commission.itemId, "standard") : 0;
                  const quote = getQualitySellQuote(
                    commission.itemId,
                    "standard",
                    1,
                    commission.bonusMultiplier
                  );
                  const sellAllQuote =
                    owned > 0
                      ? getQualitySellQuote(
                          commission.itemId,
                          "standard",
                          owned,
                          commission.bonusMultiplier
                        )
                      : null;

                  return (
                    <div key={commission.id} className="rounded-2xl border border-rose-200 bg-white p-3">
                      <p className="font-semibold text-stone-900">{commission.label}</p>
                      <p className="text-xs text-stone-600">{commission.flavor}</p>
                      <p className="mt-1 text-xs font-semibold text-rose-800">
                        Unlock Level: {commission.unlockLevel} • Multiplier x{commission.bonusMultiplier.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-stone-700">Owned: {owned}</p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!quote || owned < 1 || !hasMounted}
                          onClick={() =>
                            sellQualityProduce(
                              commission.itemId,
                              "standard",
                              1,
                              commission.bonusMultiplier
                            )
                          }
                          className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                            quote && owned > 0 && hasMounted ? "bg-rose-700" : "bg-stone-400"
                          }`}
                        >
                          {quote ? `Deliver 1 for ${quote.unitPrice}g` : "Unavailable"}
                        </button>

                        <button
                          type="button"
                          disabled={!sellAllQuote || owned < 1 || !hasMounted}
                          onClick={() =>
                            sellQualityProduce(
                              commission.itemId,
                              "standard",
                              owned,
                              commission.bonusMultiplier
                            )
                          }
                          className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                            sellAllQuote && owned > 0 && hasMounted ? "bg-fuchsia-700" : "bg-stone-400"
                          }`}
                        >
                          {sellAllQuote ? `Deliver All for ${sellAllQuote.totalValue}g` : "Deliver All"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopupWindow>

      <PopupWindow open={produceExchangeOpen} onClose={() => setProduceExchangeOpen(false)} title="Selene Voss's Produce Exchange" maxWidth="max-w-4xl">
        <div className="space-y-4">
          {(() => {
            const npc = FARM_ECONOMY_ACTIVE_NPCS.find((entry) => entry.id === "selene_voss")!;
            const relationship = seleneRelationship;
            const visitImage = getNpcVisitImage(npc, relationship);
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
                  <p><strong>Visit Image:</strong> {visitImage.imageId}</p>
                  <p><strong>Cooked Goods Owned:</strong> {hasMounted ? getItemCount("apple_pie") + getItemCount("berry_tart") + getItemCount("hearty_stew") : 0}</p>
                </div>
                <NpcVisitImageFrame
                  image={visitImage}
                  accentClasses="mt-3 border-purple-200 bg-purple-100/70 text-purple-950"
                />
                <NpcStageVisitPanel
                  npcId="selene_voss"
                  relationship={relationship}
                  accentClasses="border-purple-200"
                />
              </div>
            );
          })()}

          <NpcContractLedgerPanel
            title="Selene's Buyer Ledger"
            offers={seleneLedgerOffers}
            currentDay={currentDay}
            currentHour={currentHour}
            currentMinute={currentMinute}
            playerGold={playerData.gold}
            hasMounted={hasMounted}
            getItemCount={getItemCount}
            getQualityItemCount={getQualityItemCount}
            onComplete={completeNpcContractOffer}
            accentClasses="border-purple-300 bg-purple-100/70"
            buttonClasses="bg-purple-700"
          />

          <div className="grid gap-3">
            {DEFAULT_PRODUCE_DEMANDS.map((entry) => {
              const item = ITEM_DATA[entry.itemId];
              const locked = entry.unlockRelationshipLevel
                ? seleneRelationship.level < entry.unlockRelationshipLevel
                : false;
              const adjustedMultiplier = getSeleneAdjustedDemandMultiplier(
                entry.bonusSellMultiplier,
                seleneRelationship,
                entry.itemId
              );
              const qualityOptions: CropQuality[] = CROP_QUALITY_ORDER;
              const qualityRows: ProduceQualityRow[] = qualityOptions.map((quality: CropQuality) => {
                const owned = hasMounted ? getQualityItemCount(entry.itemId, quality) : 0;
                const quote = getQualitySellQuote(entry.itemId, quality, 1, adjustedMultiplier);
                return { quality, owned, quote };
              }).filter((row: ProduceQualityRow) => row.quote);

              return (
                <div key={`demand-${entry.itemId}`} className="rounded-2xl border border-purple-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-stone-900">{entry.label}</p>
                      <p className="text-sm text-stone-700">
                        {item?.name ?? entry.itemId} • {entry.flavor}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-purple-800">
                        You currently own: {hasMounted ? getItemCount(entry.itemId) : 0}
                      </p>
                    </div>
                    <div className="text-right text-sm text-stone-700">
                      <p><strong>x{adjustedMultiplier.toFixed(2)}</strong></p>
                      {adjustedMultiplier > entry.bonusSellMultiplier ? (
                        <p className="text-xs font-semibold text-purple-800">Base x{entry.bonusSellMultiplier.toFixed(2)}</p>
                      ) : null}
                      <p>sell bonus</p>
                    </div>
                  </div>

                  {entry.unlockRelationshipLevel ? (
                    <p className="mt-2 text-xs font-semibold text-purple-800">
                      Unlocks at relationship level {entry.unlockRelationshipLevel}.
                    </p>
                  ) : null}

                  {locked ? (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      Relationship locked. Reach level {entry.unlockRelationshipLevel} with Selene.
                    </p>
                  ) : null}

                  <div className="mt-4 grid gap-2">
                    {qualityRows.map(({ quality, owned, quote }: ProduceQualityRow) => {
                      if (!quote) return null;
                      const qualityInfo = CROP_QUALITY_DATA[quality as CropQuality];
                      const sellAllQuote =
                        owned > 0
                          ? getQualitySellQuote(entry.itemId, quality, owned, adjustedMultiplier)
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
                                disabled={locked || owned < 1 || !hasMounted}
                                onClick={() => sellQualityProduce(entry.itemId, quality, 1, adjustedMultiplier)}
                                className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                                  !locked && owned > 0 && hasMounted ? "bg-purple-700" : "bg-stone-400"
                                }`}
                              >
                                Sell 1 for {quote.unitPrice}g
                              </button>
                              <button
                                type="button"
                                disabled={locked || owned < 1 || !sellAllQuote || !hasMounted}
                                onClick={() => {
                                  if (sellAllQuote) {
                                    sellQualityProduce(entry.itemId, quality, owned, adjustedMultiplier);
                                  }
                                }}
                                className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                                  !locked && owned > 0 && sellAllQuote && hasMounted ? "bg-fuchsia-700" : "bg-stone-400"
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

          <div className="rounded-2xl border border-purple-300 bg-purple-100/70 p-4">
            <p className="text-lg font-bold text-purple-950">Premium Produce Contracts</p>
            <p className="mt-1 text-sm text-stone-700">
              Relationship level 3+ unlocks Selene&apos;s premium board with stronger deal terms.
            </p>

            {selenePremiumContracts.length === 0 ? (
              <p className="mt-3 text-sm text-stone-600">No premium contracts yet. Raise Selene to level 3.</p>
            ) : (
              <div className="mt-3 grid gap-3">
                {selenePremiumContracts.map((contract) => {
                  const owned = hasMounted ? getQualityItemCount(contract.itemId, "standard") : 0;
                  const adjustedMultiplier = getSeleneAdjustedDemandMultiplier(
                    contract.bonusMultiplier,
                    seleneRelationship,
                    contract.itemId
                  );
                  const quote = getQualitySellQuote(contract.itemId, "standard", 1, adjustedMultiplier);
                  const sellAllQuote =
                    owned > 0
                      ? getQualitySellQuote(contract.itemId, "standard", owned, adjustedMultiplier)
                      : null;

                  return (
                    <div key={contract.id} className="rounded-2xl border border-purple-200 bg-white p-3">
                      <p className="font-semibold text-stone-900">{contract.label}</p>
                      <p className="text-xs text-stone-600">{contract.flavor}</p>
                      <p className="mt-1 text-xs font-semibold text-purple-800">
                        Unlock Level: {contract.unlockLevel} • Effective x{adjustedMultiplier.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-stone-700">Owned: {owned}</p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!quote || owned < 1 || !hasMounted}
                          onClick={() =>
                            sellQualityProduce(
                              contract.itemId,
                              "standard",
                              1,
                              adjustedMultiplier
                            )
                          }
                          className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                            quote && owned > 0 && hasMounted ? "bg-purple-700" : "bg-stone-400"
                          }`}
                        >
                          {quote ? `Sell 1 for ${quote.unitPrice}g` : "Unavailable"}
                        </button>

                        <button
                          type="button"
                          disabled={!sellAllQuote || owned < 1 || !hasMounted}
                          onClick={() =>
                            sellQualityProduce(
                              contract.itemId,
                              "standard",
                              owned,
                              adjustedMultiplier
                            )
                          }
                          className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white shadow ${
                            sellAllQuote && owned > 0 && hasMounted ? "bg-fuchsia-700" : "bg-stone-400"
                          }`}
                        >
                          {sellAllQuote ? `Sell All for ${sellAllQuote.totalValue}g` : "Sell All"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              npcId={npc.id}
              name={npc.name}
              role={npc.role}
              personality={npc.personality}
              relationship={npc.relationship}
              extraNote={`Open requests: ${npcRequestCounts.get(npc.name) ?? 0} • Stage progress uses level-based relationship tracks.`}
            />
          ))}
        </div>
      </PopupWindow>

      <PopupWindow open={memoriesOpen} onClose={() => setMemoriesOpen(false)} title="Relationship Memories" maxWidth="max-w-6xl">
        <RelationshipMemoriesModalContent
          npcGroups={memoryNpcGroups}
          eventLog={npcRelationshipEventLog}
          completionHistory={npcContractCompletionHistory}
        />
      </PopupWindow>

      <PopupWindow open={farmNpcOpen} onClose={() => setFarmNpcOpen(false)} title="Farm-Economy NPCs" maxWidth="max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FARM_ECONOMY_ACTIVE_NPCS.map((npc) => {
            const relationship = farmNpcRelationshipMap.get(npc.id) ?? createDefaultNpcRelationshipState(npc.id);
            const visitImage = getNpcVisitImage(npc, relationship);
            return (
              <div key={npc.id} className="rounded-2xl border-2 border-fuchsia-200 bg-fuchsia-50 p-4 shadow-sm">
                <p className="text-xl font-bold text-fuchsia-950">{npc.name}</p>
                <p className="text-sm font-semibold text-fuchsia-800">{npc.title} • {npc.race}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>

                <NpcVisitImageFrame
                  image={visitImage}
                  accentClasses="mt-3 border-fuchsia-200 bg-fuchsia-100/70 text-fuchsia-950"
                />
                <NpcStageVisitPanel
                  npcId={npc.id}
                  relationship={relationship}
                  accentClasses="border-fuchsia-200"
                />

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
                  <p><strong>Visit Image:</strong> {visitImage.imageId}</p>
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
                  <p className="font-semibold text-stone-900">Economic Unlock Thresholds</p>
                  <div className="mt-2 space-y-1">
                    {getNpcEconomicUnlocks(npc.id as "maris_thorn" | "selene_voss" | "tamsin_vale").map((unlock) => (
                      <p key={`${npc.id}-economy-${unlock.level}`}>
                        • <strong>{relationship.level >= unlock.level ? "Unlocked" : "Locked"} L{unlock.level}:</strong> {unlock.title}
                      </p>
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

            if (quest.questType === "farming_delivery") {
              const requestedItemId = quest.requestedItemId ?? "";
              const requiredQuantity = quest.requiredQuantity ?? 0;
              const minimumQuality = quest.minimumQuality ?? "standard";
              const acceptedQualities = getAcceptedQualities(minimumQuality);
              const qualitySummary = acceptedQualities
                .map((quality: CropQuality) => {
                  const count = hasMounted ? getQualityItemCount(requestedItemId, quality) : 0;
                  return `${CROP_QUALITY_DATA[quality].label}: ${count}`;
                })
                .join(" - ");
              const availableCount = acceptedQualities.reduce((sum: number, quality: CropQuality) => {
                const count = hasMounted ? getQualityItemCount(requestedItemId, quality) : 0;
                return sum + count;
              }, 0);
              const canDeliver = hasMounted && !quest.completed && !expired && availableCount >= requiredQuantity;
              const rewardItemLabel = (quest.rewardItems ?? [])
                .map((reward) => {
                  const itemName = ITEM_DATA[reward.itemId]?.name ?? reward.itemId;
                  return `${itemName} x${reward.quantity}`;
                })
                .join(", ");
              const requestedItemName = ITEM_DATA[requestedItemId]?.name ?? requestedItemId;

              return (
                <div key={quest.id} className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-purple-800">{quest.npcName}</p>
                      <h3 className="text-xl font-bold text-stone-900">{quest.title}</h3>
                      <p className="text-stone-700">{quest.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 text-right text-sm">
                      {quest.completed ? (
                        <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 font-semibold text-green-900">
                          Completed
                        </span>
                      ) : expired ? (
                        <span className="rounded-full border border-red-300 bg-red-100 px-3 py-1 font-semibold text-red-900">
                          Expired
                        </span>
                      ) : (
                        <span className="rounded-full border border-purple-300 bg-white px-3 py-1 font-semibold text-purple-900">
                          Open
                        </span>
                      )}
                    </div>
                  </div>

                  {quest.requestLine ? (
                    <p className="mb-3 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">{quest.requestLine}</p>
                  ) : null}

                  <div className="mb-3 rounded-2xl bg-white/90 p-3 text-sm text-stone-800">
                    <p><strong>Request:</strong> Deliver {requiredQuantity} {requestedItemName}</p>
                    <p><strong>Minimum Quality:</strong> {CROP_QUALITY_DATA[minimumQuality].label}</p>
                    <p><strong>Accepted Stack:</strong> {qualitySummary}</p>
                    <p><strong>Seasonal Note:</strong> {quest.seasonalFocus ? `${quest.seasonalFocus} favored request` : "General restock request"}</p>
                    <p><strong>Deadline:</strong> Day {quest.deadlineDay} {formatTime(quest.deadlineHour, quest.deadlineMinute)}</p>
                    <p>
                      <strong>Rewards:</strong> {quest.rewardGold} Gold, {quest.rewardXp} XP, +{quest.relationshipGain} Relationship
                      {rewardItemLabel ? `, ${rewardItemLabel}` : ""}
                    </p>
                  </div>

                  {quest.completed || expired ? null : (
                    <button
                      type="button"
                      disabled={!canDeliver}
                      onClick={() => submitNpcFarmingRequest(quest.id)}
                      className={`w-full rounded-2xl px-4 py-3 text-left font-semibold text-white shadow ${
                        canDeliver ? "bg-purple-700" : "bg-stone-400"
                      }`}
                    >
                      {canDeliver
                        ? `Deliver ${requiredQuantity} ${requestedItemName}`
                        : `Need ${requiredQuantity} total at ${CROP_QUALITY_DATA[minimumQuality].label}+ quality (${availableCount}/${requiredQuantity})`}
                    </button>
                  )}

                  {quest.completionLine && !quest.completed ? (
                    <p className="mt-2 text-xs text-stone-600">Completion flavor: {quest.completionLine}</p>
                  ) : null}
                </div>
              );
            }

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
