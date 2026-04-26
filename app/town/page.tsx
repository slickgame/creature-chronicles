"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import { PopupWindow } from "@/components/town/TownUi";
import { SellerStockList } from "@/components/town/TownSellerUi";
import { QuestOfferCard } from "@/components/town/TownQuestUi";
import { RelationshipCard } from "@/components/town/TownRelationshipUi";
import { NpcVisitImageFrame } from "@/components/town/TownNpcImageUi";
import StoryObjectiveStrip from "@/components/story/StoryObjectiveStrip";
import { GameActionCard, GameCard, GameFeedbackBox, GameStatusBadge } from "@/components/ui/GameUi";
import {
  formatQuestCategoryLabel,
  formatWorldLabel,
  formatWorldList,
  getQuestNextStep,
  getRegionImportance,
} from "@/lib/world/worldDisplay";
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
import {
  getNpcMiniChain,
  getNpcMiniChainNextMilestone,
  getNpcMiniChainProgress,
  getNpcMiniChainRequirementProgress,
  type NpcMiniChainProgressMap,
} from "@/lib/town/npcMiniChains";
import {
  getNpcLoverEvolutionsForNpc,
  getNpcRoutePerksForNpc,
  hasNpcLoverEvolution,
  hasNpcRoutePerk,
  type NpcLoverEvolutionState,
  type NpcRoutePerkState,
} from "@/lib/town/npcRoutePerks";
import {
  getNpcGiftDailyRecord,
  getNpcGiftPreference,
  getNpcGiftRelationshipGain,
  getNpcInvitationAvailability,
  getNpcOutingCompletionCounts,
  MAX_DAILY_GIFTS_PER_NPC,
  type NpcGiftRecordMap,
  type NpcInvitationRecordMap,
  type NpcOutingCompletionLog,
  type NpcSocialActionResult,
} from "@/lib/town/npcSocial";
import { ITEM_DATA } from "@/lib/items/itemData";
import type { QualitySellQuote } from "@/lib/game/produceEconomy";
import type { NpcContractOffer, NpcContractRequirement } from "@/lib/town/npcContractLedger";
import {
  getNpcExclusiveLoopsForNpc,
  isNpcExclusiveLoopOfferExpired,
  isNpcExclusiveLoopUnlocked,
  type NpcExclusiveLoopOffer,
  type NpcExclusiveLoopRequirement,
  type NpcExclusiveLoopState,
} from "@/lib/town/npcExclusiveLoops";
import {
  NPC_RELATIONSHIP_EVENT_SCENES,
  type NpcContractCompletionHistory,
  type NpcRelationshipEventScene,
  type NpcRelationshipEventUnlock,
} from "@/lib/town/npcRelationshipEvents";
import type { FarmEconomyNpcId } from "@/lib/game/npcEconomy";
import type { NpcRelationshipState } from "@/lib/town/relationshipDefaults";
import type { TownNpcData } from "@/lib/town/npcData";

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

type SelectedGiftItemsByNpc = Record<string, string>;
type TownSection = "market" | "people" | "work" | "travel";

const TOWN_SECTIONS: Array<{ id: TownSection; label: string; description: string }> = [
  { id: "market", label: "Market", description: "Buy, sell, and browse services." },
  { id: "people", label: "People", description: "Relationships, gifts, memories, and routes." },
  { id: "work", label: "Work", description: "Quests, requests, and contract ledgers." },
  { id: "travel", label: "Travel / World", description: "In-world travel, regions, and factions." },
];

function TownSectionTabs({
  activeSection,
  onSelect,
}: {
  activeSection: TownSection;
  onSelect: (section: TownSection) => void;
}) {
  return (
    <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {TOWN_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSelect(section.id)}
          className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left shadow-sm ${
            activeSection === section.id
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white text-stone-900"
          }`}
        >
          <p className="font-bold">{section.label}</p>
          <p className={`mt-1 text-xs ${activeSection === section.id ? "text-stone-200" : "text-stone-600"}`}>
            {section.description}
          </p>
        </button>
      ))}
    </div>
  );
}

function TownServiceCard({
  title,
  owner,
  description,
  meta,
  actionLabel,
  onClick,
  accentClasses,
}: {
  title: string;
  owner: string;
  description: string;
  meta: string;
  actionLabel: string;
  onClick: () => void;
  accentClasses: string;
}) {
  return (
    <div className={`flex min-h-52 flex-col rounded-2xl border-2 p-4 shadow ${accentClasses}`}>
      <div className="flex-1">
        <p className="text-xs font-bold uppercase text-stone-600">{owner}</p>
        <h3 className="mt-1 text-xl font-bold text-stone-950">{title}</h3>
        <p className="mt-2 text-sm text-stone-700">{description}</p>
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-stone-700">
          {meta}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 min-h-11 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function getNpcAccentClasses(npcId: string) {
  if (npcId === "maris_thorn") return "border-emerald-200 bg-emerald-50";
  if (npcId === "selene_voss") return "border-purple-200 bg-purple-50";
  return "border-rose-200 bg-rose-50";
}

function getNpcButtonClasses(npcId: string) {
  if (npcId === "maris_thorn") return "bg-emerald-700";
  if (npcId === "selene_voss") return "bg-purple-700";
  return "bg-rose-700";
}

function isNpcLoverVoiceUnlocked(npcId: string, loverEvolutions: NpcLoverEvolutionState) {
  return getNpcLoverEvolutionsForNpc(npcId).some((evolution) =>
    hasNpcLoverEvolution(loverEvolutions, evolution.id)
  );
}

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
  loverEvolutionUnlocked = false,
  accentClasses,
}: {
  npcId: string;
  relationship: NpcRelationshipState;
  loverEvolutionUnlocked?: boolean;
  accentClasses: string;
}) {
  return (
    <div className={`mt-3 rounded-lg border bg-white/80 p-3 text-sm text-stone-700 ${accentClasses}`}>
      <p className="text-xs font-semibold uppercase text-stone-500">Stage Visit Flavor</p>
      <div className="mt-2 grid gap-2 lg:grid-cols-3">
        <p className="rounded-lg bg-white px-3 py-2">
          <strong>Greeting:</strong> {getNpcGreeting(npcId, relationship, loverEvolutionUnlocked)}
        </p>
        <p className="rounded-lg bg-white px-3 py-2">
          <strong>Flirt:</strong> {getNpcFlirtLine(npcId, relationship, loverEvolutionUnlocked)}
        </p>
        <p className="rounded-lg bg-white px-3 py-2">
          <strong>Farewell:</strong> {getNpcFarewell(npcId, relationship, loverEvolutionUnlocked)}
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

function NpcSocialPanel({
  npc,
  relationship,
  currentDay,
  inventory,
  giftRecords,
  invitationRecords,
  outingLog,
  miniChainProgress,
  routePerks,
  loverEvolutions,
  latestResult,
  selectedGiftItemId,
  onSelectGift,
  onGiveGift,
  onInvite,
  accentClasses,
  buttonClasses,
  hasMounted,
}: {
  npc: TownNpcData;
  relationship: NpcRelationshipState;
  currentDay: number;
  inventory: Record<string, number>;
  giftRecords: NpcGiftRecordMap;
  invitationRecords: NpcInvitationRecordMap;
  outingLog: NpcOutingCompletionLog;
  miniChainProgress: NpcMiniChainProgressMap;
  routePerks: NpcRoutePerkState;
  loverEvolutions: NpcLoverEvolutionState;
  latestResult: NpcSocialActionResult | null;
  selectedGiftItemId: string;
  onSelectGift: (itemId: string) => void;
  onGiveGift: (itemId: string) => void;
  onInvite: (invitationId: string) => void;
  accentClasses: string;
  buttonClasses: string;
  hasMounted: boolean;
}) {
  const giftRecord = getNpcGiftDailyRecord(giftRecords, npc.id, currentDay);
  const giftSlotsLeft = Math.max(0, MAX_DAILY_GIFTS_PER_NPC - giftRecord.count);
  const ownedGiftItems = Object.entries(inventory)
    .filter(([, count]) => count > 0)
    .map(([itemId, count]) => ({ itemId, count, item: ITEM_DATA[itemId] }))
    .filter((entry) => entry.item);
  const preferredOwnedItem =
    npc.favoriteItems.find((favorite) => (inventory[favorite.itemId] ?? 0) > 0)?.itemId ?? "";
  const selectedOwnedItemId = selectedGiftItemId && (inventory[selectedGiftItemId] ?? 0) > 0
    ? selectedGiftItemId
    : "";
  const activeGiftItemId = selectedOwnedItemId || preferredOwnedItem || ownedGiftItems[0]?.itemId || "";
  const activeReaction = activeGiftItemId ? getNpcGiftPreference(npc.id, activeGiftItemId) : "neutral";
  const activeGiftGain = activeGiftItemId
    ? getNpcGiftRelationshipGain(activeReaction, giftRecord.count)
    : 0;
  const invitations = getNpcInvitationAvailability(
    npc.id,
    relationship.level,
    invitationRecords,
    currentDay,
    miniChainProgress,
    routePerks,
    loverEvolutions
  );
  const outingCounts = getNpcOutingCompletionCounts(outingLog);
  const npcLatestResult = latestResult?.npcId === npc.id ? latestResult : null;

  return (
    <div className={`rounded-2xl border p-4 ${accentClasses}`}>
      <p className="text-lg font-bold text-stone-950">Gifts & Invitations</p>
      <p className="mt-1 text-sm text-stone-700">
        Gifts use owned inventory and her tastes. Invitations open as the relationship warms.
      </p>

      {npcLatestResult ? (
        <div className="mt-3 rounded-lg border border-white bg-white/80 px-3 py-2 text-sm text-stone-700">
          <p className="font-semibold text-stone-950">{npcLatestResult.title}</p>
          <p className="mt-1">{npcLatestResult.dialogue}</p>
          <p className="mt-1 text-xs font-semibold text-stone-600">
            {npcLatestResult.relationshipGain >= 0 ? "+" : ""}{npcLatestResult.relationshipGain} relationship
            {npcLatestResult.timeCostMinutes ? ` - ${npcLatestResult.timeCostMinutes} minutes` : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-white bg-white/70 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold text-stone-950">Give a Gift</p>
              <p className="text-xs text-stone-600">
                Today: {giftRecord.count}/{MAX_DAILY_GIFTS_PER_NPC} gifts used
              </p>
            </div>
            <span className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
              {giftSlotsLeft} left
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={activeGiftItemId}
              onChange={(event) => onSelectGift(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800"
            >
              {ownedGiftItems.length === 0 ? (
                <option value="">No owned gift items</option>
              ) : (
                ownedGiftItems.map(({ itemId, count, item }) => (
                  <option key={`${npc.id}-gift-${itemId}`} value={itemId}>
                    {item?.name ?? itemId} x{count} - {getNpcGiftPreference(npc.id, itemId)}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              disabled={!hasMounted || !activeGiftItemId || giftSlotsLeft <= 0}
              onClick={() => onGiveGift(activeGiftItemId)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow ${
                hasMounted && activeGiftItemId && giftSlotsLeft > 0 ? buttonClasses : "bg-stone-400"
              }`}
            >
              Give Gift
            </button>
          </div>

          <p className="mt-2 text-xs text-stone-700">
            Selected reaction: <strong>{activeReaction}</strong> ({activeGiftGain >= 0 ? "+" : ""}{activeGiftGain} relationship)
          </p>

          <div className="mt-3 grid gap-2 text-xs text-stone-700 sm:grid-cols-2">
            {npc.favoriteItems.map((favorite) => (
              <p key={`${npc.id}-favorite-${favorite.itemId}`} className="rounded-lg bg-white px-3 py-2">
                <strong>{ITEM_DATA[favorite.itemId]?.name ?? favorite.itemId}:</strong> {favorite.reaction}
                {" "}({inventory[favorite.itemId] ?? 0} owned)
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white bg-white/70 p-3">
          <p className="font-semibold text-stone-950">Invite Out</p>
          <p className="text-xs text-stone-600">
            Outings unlock memories, follow-up flavor, and small social rewards.
          </p>

          <div className="mt-3 grid gap-2">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="rounded-lg bg-white p-3 text-sm text-stone-700">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-stone-950">{invitation.title}</p>
                    <p className="text-xs text-stone-600">
                      Level {invitation.requiredLevel} - +{invitation.relationshipGain} relationship - {invitation.timeCostMinutes} minutes
                    </p>
                    {invitation.isRoutePayoff ? (
                      <p className="mt-1 text-xs font-semibold text-pink-800">Route Payoff Invitation</p>
                    ) : null}
                    {invitation.isLoverEvolution ? (
                      <p className="mt-1 text-xs font-semibold text-rose-800">Lover-Tier Evolution</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={!hasMounted || !invitation.available}
                    onClick={() => onInvite(invitation.id)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold text-white shadow ${
                      hasMounted && invitation.available ? buttonClasses : "bg-stone-400"
                    }`}
                  >
                    Invite
                  </button>
                </div>
                <p className="mt-2 text-xs text-stone-700">
                  {invitation.available ? invitation.flavorText : invitation.reason}
                </p>
                <div className="mt-2 grid gap-1 text-xs text-stone-700">
                  <p><strong>Outing Reward:</strong> {invitation.rewardSummary}</p>
                  <p><strong>Memory Image:</strong> {invitation.imageUnlockId ?? "future outing image"}</p>
                  {invitation.requiredMiniChainMilestoneId ? (
                    <p><strong>Route Requirement:</strong> {invitation.reason}</p>
                  ) : null}
                  {invitation.requiredRoutePerkId ? (
                    <p><strong>Lover Requirement:</strong> {invitation.reason}</p>
                  ) : null}
                  <p><strong>Completed:</strong> {outingCounts[invitation.id] ?? 0} time(s)</p>
                  {outingLog.find((outing) => outing.invitationId === invitation.id) ? (
                    <p>
                      <strong>Last Outing:</strong> Day {outingLog.find((outing) => outing.invitationId === invitation.id)?.dayCompleted}
                    </p>
                  ) : (
                    <p><strong>Status:</strong> Not completed yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {outingLog.some((outing) => outing.npcId === npc.id) ? (
        <div className="mt-3 rounded-lg border border-white bg-white/70 p-3 text-sm text-stone-700">
          <p className="font-semibold text-stone-950">Outing History</p>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {outingLog
              .filter((outing) => outing.npcId === npc.id)
              .slice(0, 4)
              .map((outing) => (
                <div key={outing.id} className="rounded-lg bg-white px-3 py-2">
                  <p className="font-semibold text-stone-950">{outing.title}</p>
                  <p className="text-xs text-stone-600">
                    Day {outing.dayCompleted} - +{outing.relationshipReward} relationship
                  </p>
                  <p className="mt-1 text-xs">{outing.followUpFlavor}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-700">
                    {outing.rewardSummary}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NpcMiniChainPanel({
  npc,
  progressMap,
  accentClasses,
}: {
  npc: TownNpcData;
  progressMap: NpcMiniChainProgressMap;
  accentClasses: string;
}) {
  const chain = getNpcMiniChain(npc.id);
  if (!chain) return null;

  const progress = getNpcMiniChainProgress(progressMap, npc.id);
  const nextMilestone = getNpcMiniChainNextMilestone(chain, progress);
  const completedMilestones = chain.milestones.filter((milestone) =>
    progress.completedMilestoneIds.includes(milestone.id)
  );

  return (
    <div className={`rounded-2xl border p-4 ${accentClasses}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-bold text-stone-950">{chain.title}</p>
          <p className="mt-1 text-sm text-stone-700">{chain.routeFlavor}</p>
        </div>
        <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          {completedMilestones.length}/{chain.milestones.length} milestones
        </span>
      </div>

      {progress.lastUnlockedMilestoneId ? (
        <p className="mt-3 rounded-lg border border-white bg-white/80 px-3 py-2 text-xs font-semibold text-stone-700">
          Latest route unlock: {chain.milestones.find((milestone) => milestone.id === progress.lastUnlockedMilestoneId)?.title ?? progress.lastUnlockedMilestoneId}
          {progress.lastUnlockedDay ? ` on Day ${progress.lastUnlockedDay}` : ""}
        </p>
      ) : null}

      {nextMilestone ? (
        <div className="mt-3 rounded-lg border border-white bg-white/80 p-3 text-sm text-stone-700">
          <p className="font-semibold text-stone-950">Current Stage: {nextMilestone.title}</p>
          <p className="text-xs text-stone-600">{nextMilestone.subtitle}</p>
          <div className="mt-2 grid gap-2 text-xs lg:grid-cols-2">
            {nextMilestone.requirements.map((requirement) => {
              const requirementProgress = getNpcMiniChainRequirementProgress(requirement, progress);
              return (
                <p key={`${nextMilestone.id}-${requirement.actionKey}`} className="rounded-lg bg-white px-3 py-2">
                  <strong>{requirement.label}</strong>
                  <br />
                  {Math.min(requirementProgress.current, requirementProgress.required)}/{requirementProgress.required}
                </p>
              );
            })}
          </div>
          <p className="mt-2 text-xs font-semibold text-stone-700">
            Next Reward: {nextMilestone.rewardSummary}
          </p>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-white bg-white/80 px-3 py-2 text-sm text-stone-700">
          Route complete for now. Future updates can branch this into private scenes and image sets.
        </p>
      )}

      {completedMilestones.length > 0 ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {completedMilestones.map((milestone) => (
            <div key={milestone.id} className="rounded-lg bg-white/80 px-3 py-2 text-xs text-stone-700">
              <p className="font-semibold text-stone-950">{milestone.title}</p>
              <p>{milestone.followUpFlavor}</p>
              <p className="mt-1 font-semibold">{milestone.rewardSummary}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NpcRoutePerksPanel({
  npc,
  perkState,
  accentClasses,
}: {
  npc: TownNpcData;
  perkState: NpcRoutePerkState;
  accentClasses: string;
}) {
  const perks = getNpcRoutePerksForNpc(npc.id);
  if (perks.length === 0) return null;

  return (
    <div className={`rounded-2xl border p-4 ${accentClasses}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-bold text-stone-950">Route Passive Perks</p>
          <p className="mt-1 text-sm text-stone-700">
            Lasting route rewards that keep paying off back at the ranch and market.
          </p>
        </div>
        <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          {perks.filter((perk) => hasNpcRoutePerk(perkState, perk.id)).length}/{perks.length} active
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {perks.map((perk) => {
          const state = perkState[perk.id];
          const unlocked = state?.unlocked === true;

          return (
            <div key={perk.id} className="rounded-lg border border-white bg-white/80 p-3 text-sm text-stone-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-stone-950">{perk.title}</p>
                  <p className="text-xs text-stone-600">{perk.subtitle}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${unlocked ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-700"}`}>
                  {unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              <p className="mt-2 text-xs">
                <strong>Effect:</strong> {perk.effectSummary}
              </p>
              <p className="mt-1 text-xs">
                <strong>Unlock:</strong> {perk.unlockSummary}
              </p>
              {unlocked ? (
                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-stone-700">
                  Active since Day {state?.unlockedDay ?? "?"}: {perk.flavorText}
                </p>
              ) : (
                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-stone-600">
                  Finish the route milestone or its payoff invitation to make this an always-on advantage.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NpcLoverEvolutionPanel({
  npc,
  routePerks,
  loverEvolutions,
  accentClasses,
}: {
  npc: TownNpcData;
  routePerks: NpcRoutePerkState;
  loverEvolutions: NpcLoverEvolutionState;
  accentClasses: string;
}) {
  const evolutions = getNpcLoverEvolutionsForNpc(npc.id);
  if (evolutions.length === 0) return null;

  return (
    <div className={`rounded-2xl border p-4 ${accentClasses}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-bold text-stone-950">Lover-Tier Evolution</p>
          <p className="mt-1 text-sm text-stone-700">
            Deep-route rewards that build on the passive perk instead of replacing it.
          </p>
        </div>
        <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          {evolutions.filter((evolution) => hasNpcLoverEvolution(loverEvolutions, evolution.id)).length}/{evolutions.length} evolved
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {evolutions.map((evolution) => {
          const state = loverEvolutions[evolution.id];
          const unlocked = state?.unlocked === true;
          const routeReady = hasNpcRoutePerk(routePerks, evolution.requiredRoutePerkId);

          return (
            <div key={evolution.id} className="rounded-lg border border-white bg-white/80 p-3 text-sm text-stone-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-stone-950">{evolution.title}</p>
                  <p className="text-xs text-stone-600">{evolution.subtitle}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${unlocked ? "bg-rose-100 text-rose-900" : routeReady ? "bg-amber-100 text-amber-900" : "bg-stone-200 text-stone-700"}`}>
                  {unlocked ? "Evolved" : routeReady ? "Invitation Ready" : "Locked"}
                </span>
              </div>
              <p className="mt-2 text-xs">
                <strong>Unlock:</strong> {evolution.unlockSummary}
              </p>
              <p className="mt-1 text-xs">
                <strong>Active Effect:</strong> {unlocked ? evolution.effectSummary : "Locked until the lover-tier scene is completed."}
              </p>
              {unlocked ? (
                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-stone-700">
                  Evolved on Day {state?.unlockedDay ?? "?"}: {evolution.flavorText}
                </p>
              ) : (
                <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-stone-600">
                  {evolution.lockedHint}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatMultiplier(value: number) {
  return `x${value.toFixed(2)}`;
}

function formatOfferKind(kind: string) {
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
    const standardOwned = minimumQuality === "standard" ? getItemCount(requirement.itemId) : owned;
    const available = Math.max(owned, standardOwned);
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

function getExclusiveRequirementLabel(requirement: NpcExclusiveLoopRequirement) {
  const quality = requirement.minimumQuality && requirement.minimumQuality !== "standard"
    ? ` (${CROP_QUALITY_DATA[requirement.minimumQuality].label}+)`
    : "";
  return `${formatItemQuantity(requirement.itemId, requirement.quantity)}${quality}`;
}

function getExclusiveOfferAvailability(
  offer: NpcExclusiveLoopOffer,
  hasMounted: boolean,
  getItemCount: (itemId: string) => number,
  getQualityItemCount: (itemId: string, quality: CropQuality) => number
) {
  if (!hasMounted) return { canComplete: false, note: "Loading loop..." };
  if (offer.completed) return { canComplete: false, note: "Completed" };

  for (const requirement of offer.requirements) {
    const minimumQuality = requirement.minimumQuality ?? "standard";
    const owned = getAcceptedQualities(minimumQuality).reduce(
      (sum, quality) => sum + getQualityItemCount(requirement.itemId, quality),
      0
    );
    const standardOwned = minimumQuality === "standard" ? getItemCount(requirement.itemId) : owned;
    const available = Math.max(owned, standardOwned);
    if (available < requirement.quantity) {
      return {
        canComplete: false,
        note: `Need ${requirement.quantity} ${ITEM_DATA[requirement.itemId]?.name ?? requirement.itemId} (${available}/${requirement.quantity})`,
      };
    }
  }

  return { canComplete: true, note: "Complete loop" };
}

function NpcExclusiveLoopsPanel({
  npc,
  loopState,
  loverEvolutions,
  currentDay,
  currentHour,
  currentMinute,
  hasMounted,
  getItemCount,
  getQualityItemCount,
  onComplete,
  accentClasses,
  buttonClasses,
}: {
  npc: TownNpcData;
  loopState: NpcExclusiveLoopState;
  loverEvolutions: NpcLoverEvolutionState;
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  hasMounted: boolean;
  getItemCount: (itemId: string) => number;
  getQualityItemCount: (itemId: string, quality: CropQuality) => number;
  onComplete: (offerId: string) => boolean;
  accentClasses: string;
  buttonClasses: string;
}) {
  const loops = getNpcExclusiveLoopsForNpc(npc.id);
  if (loops.length === 0) return null;

  return (
    <div className={`rounded-2xl border p-4 ${accentClasses}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-bold text-stone-950">Exclusive High-Tier Loop</p>
          <p className="mt-1 text-sm text-stone-700">
            Lover-tier repeatable work that keeps this route active after the ladder is complete.
          </p>
        </div>
        <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          {loops.filter((loop) => isNpcExclusiveLoopUnlocked(loop.id, loverEvolutions)).length}/{loops.length} unlocked
        </span>
      </div>

      <div className="mt-3 grid gap-3">
        {loops.map((loop) => {
          const unlocked = isNpcExclusiveLoopUnlocked(loop.id, loverEvolutions);
          const loopOffers = loopState.offers.filter((offer) => offer.loopId === loop.id);
          const completionCount = loopState.completionCounts[loop.id] ?? 0;
          const lastCompletedDay = loopState.lastCompletedDay[loop.id];
          const streak = loopState.streaks[loop.id];
          const latestSpecial = streak?.latestSpecialCompletionId
            ? loopState.specialCompletions.find((special) => special.id === streak.latestSpecialCompletionId)
            : undefined;
          const latestFeedback = loopState.latestFeedback?.loopId === loop.id
            ? loopState.latestFeedback
            : null;

          return (
            <div key={loop.id} className="rounded-lg border border-white bg-white/80 p-3 text-sm text-stone-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-stone-950">{loop.title}</p>
                  <p className="text-xs text-stone-600">{loop.subtitle}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${unlocked ? "bg-rose-100 text-rose-900" : "bg-stone-200 text-stone-700"}`}>
                  {unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              <div className="mt-2 grid gap-2 text-xs lg:grid-cols-3">
                <p><strong>Unlock:</strong> {loop.unlockSummary}</p>
                <p><strong>Completions:</strong> {completionCount}</p>
                <p><strong>Last Complete:</strong> {lastCompletedDay ? `Day ${lastCompletedDay}` : "Never"}</p>
                <p><strong>Current Streak:</strong> {streak?.current ?? 0}</p>
                <p><strong>Best Streak:</strong> {streak?.best ?? 0}</p>
                <p><strong>Latest Special:</strong> {latestSpecial ? `${latestSpecial.title} on Day ${latestSpecial.day}` : "None yet"}</p>
              </div>
              <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-stone-700">
                {unlocked ? loop.activeSummary : loop.lockedFlavor}
              </p>
              {latestFeedback ? (
                <div className="mt-2 rounded-lg border border-white bg-white px-3 py-2 text-xs text-stone-700">
                  <p className="font-semibold text-stone-950">Latest Rhythm: {latestFeedback.title}</p>
                  <p className="mt-1">{latestFeedback.text}</p>
                  <p className="mt-1 font-semibold text-stone-600">
                    Streak {latestFeedback.streakCount} - Best {latestFeedback.bestStreak}
                    {latestFeedback.bonusReward ? ` - Bonus ${latestFeedback.specialCompletion?.rewardSummary ?? "reward"}` : ""}
                  </p>
                </div>
              ) : streak?.latestFlavorText ? (
                <p className="mt-2 rounded-lg border border-white bg-white px-3 py-2 text-xs text-stone-700">
                  <strong>Latest Flavor:</strong> {streak.latestFlavorText}
                </p>
              ) : null}
              {latestSpecial ? (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-stone-700">
                  <p className="font-semibold text-rose-950">Special Completion: {latestSpecial.title}</p>
                  <p className="mt-1">{latestSpecial.text}</p>
                  <p className="mt-1 font-semibold text-rose-800">{latestSpecial.rewardSummary}</p>
                </div>
              ) : null}

              {unlocked ? (
                <div className="mt-3 grid gap-2">
                  {loopOffers.length === 0 ? (
                    <p className="rounded-lg bg-white px-3 py-2 text-xs text-stone-600">
                      No active private offer right now. A new seeded offer appears when the loop refreshes.
                    </p>
                  ) : (
                    loopOffers.map((offer) => {
                      const expired = isNpcExclusiveLoopOfferExpired(
                        offer,
                        currentDay,
                        currentHour,
                        currentMinute
                      );
                      const availability = expired
                        ? { canComplete: false, note: "Expired" }
                        : getExclusiveOfferAvailability(offer, hasMounted, getItemCount, getQualityItemCount);
                      const requirements = offer.requirements.map(getExclusiveRequirementLabel).join(", ");

                      return (
                        <div key={offer.id} className="rounded-lg border border-white bg-white p-3 shadow-sm">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold text-stone-950">{offer.title}</p>
                              <p className="text-xs text-stone-600">
                                Generated Day {offer.generatedDay} - Expires Day {offer.expiryDay}, {formatTime(offer.expiryHour, offer.expiryMinute)}
                              </p>
                            </div>
                            <span className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700">
                              Repeatable
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-stone-700">{offer.description}</p>
                          <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-700">{offer.flavorText}</p>
                          <div className="mt-2 grid gap-2 text-xs lg:grid-cols-2">
                            <p><strong>Needs:</strong> {requirements}</p>
                            <p><strong>Reward:</strong> {offer.rewardSummary}</p>
                          </div>

                          {offer.completed ? (
                            <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-900">
                              {offer.completionText}
                            </p>
                          ) : (
                            <button
                              type="button"
                              disabled={!availability.canComplete}
                              onClick={() => onComplete(offer.id)}
                              className={`mt-3 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow ${
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
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getRouteJournalNextObjective({
  npc,
  miniChainProgress,
  routePerks,
  loverEvolutions,
  exclusiveLoops,
}: {
  npc: TownNpcData;
  miniChainProgress: NpcMiniChainProgressMap;
  routePerks: NpcRoutePerkState;
  loverEvolutions: NpcLoverEvolutionState;
  exclusiveLoops: NpcExclusiveLoopState;
}) {
  const chain = getNpcMiniChain(npc.id);
  const progress = getNpcMiniChainProgress(miniChainProgress, npc.id);
  const nextMilestone = chain ? getNpcMiniChainNextMilestone(chain, progress) : null;
  if (nextMilestone) return `Route stage: ${nextMilestone.title}. ${nextMilestone.subtitle}`;

  const lockedRoutePerk = getNpcRoutePerksForNpc(npc.id).find((perk) => !hasNpcRoutePerk(routePerks, perk.id));
  if (lockedRoutePerk) return `Route perk: ${lockedRoutePerk.unlockSummary}`;

  const lockedEvolution = getNpcLoverEvolutionsForNpc(npc.id).find(
    (evolution) => !hasNpcLoverEvolution(loverEvolutions, evolution.id)
  );
  if (lockedEvolution) return `Lover evolution: ${lockedEvolution.lockedHint}`;

  const activeLoop = getNpcExclusiveLoopsForNpc(npc.id).find((loop) =>
    isNpcExclusiveLoopUnlocked(loop.id, loverEvolutions)
  );
  if (activeLoop) {
    const activeOffer = exclusiveLoops.offers.find((offer) => offer.loopId === activeLoop.id && !offer.completed);
    return activeOffer
      ? `Endgame loop: finish ${activeOffer.title} before Day ${activeOffer.expiryDay}.`
      : `Endgame loop: keep ${activeLoop.title} streaks alive for rare special moments.`;
  }

  return "This route is ready for future seasonal events, CGs, and broader story content.";
}

function NpcRouteJournalPanel({
  npc,
  relationship,
  miniChainProgress,
  routePerks,
  loverEvolutions,
  exclusiveLoops,
  eventLog,
  accentClasses,
}: {
  npc: TownNpcData;
  relationship: NpcRelationshipState;
  miniChainProgress: NpcMiniChainProgressMap;
  routePerks: NpcRoutePerkState;
  loverEvolutions: NpcLoverEvolutionState;
  exclusiveLoops: NpcExclusiveLoopState;
  eventLog: NpcRelationshipEventUnlock[];
  accentClasses: string;
}) {
  const chain = getNpcMiniChain(npc.id);
  const progress = getNpcMiniChainProgress(miniChainProgress, npc.id);
  const completedMilestones = chain?.milestones.filter((milestone) =>
    progress.completedMilestoneIds.includes(milestone.id)
  ) ?? [];
  const nextMilestone = chain ? getNpcMiniChainNextMilestone(chain, progress) : null;
  const routePerkRows = getNpcRoutePerksForNpc(npc.id);
  const loverEvolutionRows = getNpcLoverEvolutionsForNpc(npc.id);
  const loopRows = getNpcExclusiveLoopsForNpc(npc.id);
  const unlockedMemories = eventLog.filter((event) => event.npcId === npc.id);
  const loverVoiceUnlocked = isNpcLoverVoiceUnlocked(npc.id, loverEvolutions);

  return (
    <article className={`rounded-2xl border p-4 ${accentClasses}`}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-2xl font-bold text-stone-950">{npc.name}</p>
          <p className="text-sm font-semibold text-stone-700">{npc.title} - {npc.race}</p>
          <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>
        </div>
        <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          {getRelationshipDisplayLabel(relationship)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-stone-700 lg:grid-cols-3">
        <p className="rounded-lg bg-white px-3 py-2"><strong>Mini-Chain:</strong> {completedMilestones.length}/{chain?.milestones.length ?? 0} milestones</p>
        <p className="rounded-lg bg-white px-3 py-2"><strong>Memories:</strong> {unlockedMemories.length} unlocked</p>
        <p className="rounded-lg bg-white px-3 py-2"><strong>Lover Voice:</strong> {loverVoiceUnlocked ? "Active" : "Locked"}</p>
      </div>

      <div className="mt-3 rounded-lg bg-white/80 p-3 text-sm text-stone-700">
        <p className="font-semibold text-stone-950">Daily Voice</p>
        <div className="mt-2 grid gap-2 text-xs lg:grid-cols-3">
          <p><strong>Greeting:</strong> {getNpcGreeting(npc.id, relationship, loverVoiceUnlocked)}</p>
          <p><strong>Flirt:</strong> {getNpcFlirtLine(npc.id, relationship, loverVoiceUnlocked)}</p>
          <p><strong>Farewell:</strong> {getNpcFarewell(npc.id, relationship, loverVoiceUnlocked)}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg bg-white/80 p-3 text-xs text-stone-700">
          <p className="font-semibold text-stone-950">Route Progress</p>
          <p className="mt-1"><strong>Current:</strong> {nextMilestone ? nextMilestone.title : "Mini-chain complete"}</p>
          <p className="mt-1"><strong>Latest:</strong> {progress.lastUnlockedMilestoneId ?? "No route milestone yet"}</p>
          <p className="mt-1"><strong>Next:</strong> {nextMilestone ? nextMilestone.rewardSummary : "Route perk and lover layers carry the arc forward."}</p>
        </div>

        <div className="rounded-lg bg-white/80 p-3 text-xs text-stone-700">
          <p className="font-semibold text-stone-950">Passive Layers</p>
          {routePerkRows.map((perk) => (
            <p key={`${npc.id}-journal-perk-${perk.id}`} className="mt-1">
              <strong>{hasNpcRoutePerk(routePerks, perk.id) ? "Unlocked" : "Locked"}:</strong> {perk.title}
            </p>
          ))}
          {loverEvolutionRows.map((evolution) => (
            <p key={`${npc.id}-journal-evolution-${evolution.id}`} className="mt-1">
              <strong>{hasNpcLoverEvolution(loverEvolutions, evolution.id) ? "Evolved" : "Locked"}:</strong> {evolution.title}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {loopRows.map((loop) => {
          const streak = exclusiveLoops.streaks[loop.id];
          const latestSpecial = streak?.latestSpecialCompletionId
            ? exclusiveLoops.specialCompletions.find((special) => special.id === streak.latestSpecialCompletionId)
            : undefined;
          return (
            <div key={`${npc.id}-journal-loop-${loop.id}`} className="rounded-lg bg-white/80 p-3 text-xs text-stone-700">
              <p className="font-semibold text-stone-950">{loop.title}</p>
              <p className="mt-1"><strong>Status:</strong> {isNpcExclusiveLoopUnlocked(loop.id, loverEvolutions) ? "Unlocked" : "Locked"}</p>
              <p className="mt-1"><strong>Best Streak:</strong> {streak?.best ?? 0}</p>
              <p className="mt-1"><strong>Latest Special:</strong> {latestSpecial ? `${latestSpecial.title} on Day ${latestSpecial.day}` : "None yet"}</p>
            </div>
          );
        })}

        <div className="rounded-lg bg-white/80 p-3 text-xs text-stone-700">
          <p className="font-semibold text-stone-950">Unlocked Memories</p>
          {unlockedMemories.length > 0 ? (
            <div className="mt-1 space-y-1">
              {unlockedMemories.slice(0, 4).map((memory) => (
                <p key={`${npc.id}-journal-memory-${memory.id}`}>- {memory.title} (Day {memory.unlockedDay})</p>
              ))}
            </div>
          ) : (
            <p className="mt-1">No memories unlocked yet.</p>
          )}
        </div>
      </div>

      <p className="mt-3 rounded-lg border border-white bg-white px-3 py-2 text-sm text-stone-700">
        <strong>Next Hint:</strong> {getRouteJournalNextObjective({ npc, miniChainProgress, routePerks, loverEvolutions, exclusiveLoops })}
      </p>
    </article>
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
    npcGiftRecords,
    npcInvitationRecords,
    npcOutingCompletionLog,
    npcMiniChainProgress,
    npcRoutePerks,
    npcLoverEvolutions,
    npcExclusiveLoops,
    latestNpcSocialResult,
    travelLog,
    authoredQuests,
    factions,
    worldRegions,
    currentRegionId,
    visitedRegionIds,
    latestRegionTravelResult,
    worldRegionActions,
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
    completeNpcExclusiveLoopOffer,
    giveNpcGift,
    inviteNpc,
    travelToRegion,
    performRegionAction,
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
  const [routeJournalsOpen, setRouteJournalsOpen] = useState(false);
  const [npcRequestsOpen, setNpcRequestsOpen] = useState(false);
  const [travelLogOpen, setTravelLogOpen] = useState(false);
  const [contractLedgerOpen, setContractLedgerOpen] = useState(false);
  const [seedShopOpen, setSeedShopOpen] = useState(false);
  const [recipeShopOpen, setRecipeShopOpen] = useState(false);
  const [produceExchangeOpen, setProduceExchangeOpen] = useState(false);
  const [farmNpcOpen, setFarmNpcOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<TownSection>("market");
  const [selectedTownNpcId, setSelectedTownNpcId] = useState<string | null>(null);
  const [selectedGiftItems, setSelectedGiftItems] = useState<SelectedGiftItemsByNpc>({});

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
  const visibleAuthoredQuests = authoredQuests.filter((quest) => quest.status !== "locked");
  const activeAuthoredQuestCount = visibleAuthoredQuests.filter((quest) => quest.status === "active" || quest.status === "available").length;
  const knownFactionCount = factions.filter((faction) => faction.status !== "locked").length;
  const openRegionCount = worldRegions.filter((region) => region.status !== "locked").length;
  const selectedTownNpc = selectedTownNpcId
    ? FARM_ECONOMY_ACTIVE_NPCS.find((npc) => npc.id === selectedTownNpcId) ?? null
    : null;
  const selectedTownNpcRelationship = selectedTownNpc
    ? farmNpcRelationshipMap.get(selectedTownNpc.id) ?? createDefaultNpcRelationshipState(selectedTownNpc.id)
    : null;
  const selectedTownNpcVisitImage =
    selectedTownNpc && selectedTownNpcRelationship
      ? getNpcVisitImage(selectedTownNpc, selectedTownNpcRelationship)
      : null;
  const selectedTownNpcLoverVoice =
    selectedTownNpc ? isNpcLoverVoiceUnlocked(selectedTownNpc.id, npcLoverEvolutions) : false;

  return (
    <main className="h-[calc(100vh-6rem)] min-h-[760px] overflow-hidden bg-gradient-to-b from-stone-100 to-amber-200 p-3 sm:p-4 md:h-screen md:min-h-0 md:p-5">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-3">
        <header className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-800">Town Hub</p>
            <h1 className="text-3xl font-bold text-stone-950 sm:text-4xl">Town</h1>
            <p className="mt-1 max-w-3xl text-sm text-stone-700">
              Free navigation stays in the global nav. The travel cards here are in-world actions that spend time and update location.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[520px]">
            <div className="rounded-2xl border border-stone-200 bg-white/90 px-3 py-2">
              <p className="text-stone-500">Day / Time</p>
              <p className="font-bold text-stone-950">Day {currentDay}, {formatTime(currentHour, currentMinute)}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/90 px-3 py-2">
              <p className="text-stone-500">Location</p>
              <p className="font-bold capitalize text-stone-950">{currentLocation}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/90 px-3 py-2">
              <p className="text-stone-500">Gold</p>
              <p className="font-bold text-stone-950">{playerData.gold}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white/90 px-3 py-2">
              <p className="text-stone-500">Energy</p>
              <p className="font-bold text-stone-950">{playerData.energy}</p>
            </div>
          </div>
        </header>

        <div className="shrink-0">
          <StoryObjectiveStrip />
        </div>

        <section className="shrink-0 rounded-2xl border-2 border-stone-900 bg-white/88 p-3 shadow-lg">
          <div className="flex flex-wrap gap-2">
            <InventoryChip label="Inventory" value={displayedInventoryCount} />
            <InventoryChip label="Recipes" value={displayedKnownRecipes} />
            <InventoryChip label="Wheat" value={hasMounted ? getItemCount("wheat") : 0} />
            <InventoryChip label="Seeds" value={displayedSeedOwned} />
            <InventoryChip label="Creatures" value={creatures.length} />
            <InventoryChip label="Open Work" value={openBoardCount + openNpcRequestCount + activeAuthoredQuestCount} />
          </div>
        </section>

        <TownSectionTabs activeSection={activeSection} onSelect={setActiveSection} />

        <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border-4 border-stone-900 bg-white/90 p-3 shadow-xl sm:p-4">
          {activeSection === "market" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">Market</h2>
                <p className="mt-1 text-sm text-stone-700">
                  Buying, selling, seeds, recipes, and creature offers live here. Detailed stock lists open in scrollable windows.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <TownServiceCard title="Creature Seller" owner="Town Stock" description="Browse today's creature offers and purchase directly with gold." meta={hasMounted ? `${displayedSellerCount} in stock${displayedCheapest !== null ? ` - Cheapest ${displayedCheapest} Gold` : ""}` : "Loading market..."} actionLabel="Open Seller" onClick={() => setSellerOpen(true)} accentClasses="border-amber-300 bg-amber-50" />
                <TownServiceCard title="Seed Stall" owner="Maris Thorn" description={seedShopSection?.description ?? "Buy crop seeds and relationship-shaped field advantages."} meta={`${displayedSeedOwned} seed type(s) owned - Level ${marisRelationship.level}`} actionLabel="Open Seed Stall" onClick={() => setSeedShopOpen(true)} accentClasses="border-emerald-300 bg-emerald-50" />
                <TownServiceCard title="Produce Exchange" owner="Selene Voss" description="Sell produce by quality, check demand pressure, and use premium market offers." meta={`${DEFAULT_PRODUCE_DEMANDS.length} demand lane(s) - Level ${seleneRelationship.level}`} actionLabel="Open Exchange" onClick={() => setProduceExchangeOpen(true)} accentClasses="border-purple-300 bg-purple-50" />
                <TownServiceCard title="Recipe Counter" owner="Tamsin Vale" description={recipeShopSection?.description ?? "Buy recipe books and track cooking commissions."} meta={`${displayedKnownRecipes} known recipe(s) - Level ${tamsinRelationship.level}`} actionLabel="Open Recipes" onClick={() => setRecipeShopOpen(true)} accentClasses="border-rose-300 bg-rose-50" />
              </div>
            </div>
          ) : null}

          {activeSection === "people" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-stone-950">People</h2>
                  <p className="mt-1 text-sm text-stone-700">
                    Relationship cards stay compact here. Open an NPC to see image flavor, gifts, outings, route progress, memories, perks, evolutions, and exclusive loops together.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button type="button" onClick={() => setRelationshipsOpen(true)} className="min-h-11 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow">Overview</button>
                  <button type="button" onClick={() => setMemoriesOpen(true)} className="min-h-11 rounded-xl bg-pink-700 px-4 py-2 text-sm font-semibold text-white shadow">Memories</button>
                  <button type="button" onClick={() => setRouteJournalsOpen(true)} className="min-h-11 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow">Route Journals</button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {FARM_ECONOMY_ACTIVE_NPCS.map((npc) => {
                  const relationship = farmNpcRelationshipMap.get(npc.id) ?? createDefaultNpcRelationshipState(npc.id);
                  const openRequests = npcRequestCounts.get(npc.name) ?? 0;
                  return (
                    <button key={npc.id} type="button" onClick={() => setSelectedTownNpcId(npc.id)} className={`min-h-56 rounded-2xl border-2 p-4 text-left shadow ${getNpcAccentClasses(npc.id)}`}>
                      <p className="text-xs font-bold uppercase text-stone-600">{npc.title}</p>
                      <h3 className="mt-1 text-xl font-bold text-stone-950">{npc.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-stone-700">{getRelationshipDisplayLabel(relationship)}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-stone-800" style={{ width: `${Math.min(100, relationship.progress)}%` }} /></div>
                      <p className="mt-3 line-clamp-3 text-sm text-stone-700">{npc.shortDescription}</p>
                      <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-stone-700">{openRequests} open request(s) - {getNpcRoutePerksForNpc(npc.id).filter((perk) => hasNpcRoutePerk(npcRoutePerks, perk.id)).length} perk(s)</p>
                    </button>
                  );
                })}
              </div>

              <NpcRelationshipEventPanel latestEvent={latestNpcRelationshipEvent} eventLog={npcRelationshipEventLog} />
            </div>
          ) : null}

          {activeSection === "work" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-950">Work</h2>
                <p className="mt-1 text-sm text-stone-700">Authored quests, repeatable boards, NPC farming requests, and farm-economy ledgers are grouped here.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <TownServiceCard title="Breeding Quest Board" owner="Town Board" description="Creature submission contracts with deadlines, requirements, rewards, and eligible helpers." meta={`${openBoardCount} open contract(s)`} actionLabel="Open Board" onClick={() => setBoardOpen(true)} accentClasses="border-sky-300 bg-sky-50" />
                <TownServiceCard title="NPC Requests" owner="Farm-Economy Clients" description="Deliver crops, handle NPC jobs, and build relationship pressure through work." meta={`${openNpcRequestCount} open request(s)`} actionLabel="Open Requests" onClick={() => setNpcRequestsOpen(true)} accentClasses="border-purple-300 bg-purple-50" />
                <TownServiceCard title="Contract Ledgers" owner="Maris, Selene, Tamsin" description="Relationship-led market offers, restock pressure, premiums, and commissions." meta={`${npcContractLedger.filter((offer) => !offer.completed).length} active ledger offer(s)`} actionLabel="Open Ledgers" onClick={() => setContractLedgerOpen(true)} accentClasses="border-fuchsia-300 bg-fuchsia-50" />
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-xs font-bold uppercase text-sky-800">Authored Quests</p><h3 className="text-xl font-bold text-stone-950">Story & Faction Work</h3></div>
                  <span className="w-fit rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-bold text-sky-900">{activeAuthoredQuestCount} actionable</span>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  {visibleAuthoredQuests.map((quest) => {
                    const completedObjectives = quest.objectives.filter((objective) => objective.completed).length;
                    const nextStep = getQuestNextStep(quest.objectives);
                    return (
                      <div key={quest.id} className="rounded-2xl border border-white bg-white/85 p-3 text-sm text-stone-700">
                        <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase text-sky-800">{formatQuestCategoryLabel(quest.category)}</p><p className="font-bold text-stone-950">{quest.title}</p></div><span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-900">{formatWorldLabel(quest.status)}</span></div>
                        <p className="mt-2 line-clamp-3">{quest.description}</p>
                        <p className="mt-2 text-xs"><strong>Source:</strong> {quest.source.name}</p>
                        {nextStep ? <p className="mt-1 text-xs"><strong>Next:</strong> {nextStep.where} - {nextStep.next}</p> : null}
                        <p className="mt-1 text-xs"><strong>Progress:</strong> {completedObjectives}/{quest.objectives.length} objectives</p>
                        <p className="mt-1 text-xs"><strong>Reward:</strong> {quest.rewardSummary}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "travel" ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div><h2 className="text-2xl font-bold text-stone-950">Travel / World</h2><p className="mt-1 text-sm text-stone-700">These buttons are explicit in-world travel actions. They can spend time, change location, and count for story travel.</p></div>
                <button type="button" onClick={() => setTravelLogOpen(true)} className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow">Travel Log ({travelLog.length})</button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <GameCard tone="teal" className="shadow-sm">
                  <p className="text-lg font-bold text-stone-950">Region Routes</p>
                  <p className="mt-2 text-sm text-stone-700">Open the dedicated world route screen for Brindlewood Road, Silvergrain Exchange, and future destinations.</p>
                  <Link href="/regions" className="mt-4 block min-h-11 rounded-xl bg-teal-700 px-4 py-2 text-center text-sm font-semibold text-white shadow">
                    Open Regions
                  </Link>
                </GameCard>
                <GameCard tone="emerald" className="shadow-sm">
                  <p className="text-lg font-bold text-stone-950">Current Region</p>
                  <p className="mt-2 text-sm text-stone-700">{worldRegions.find((region) => region.id === currentRegionId)?.name ?? "Unknown"}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-900">Region travel costs time. Global navigation remains free UI movement.</p>
                </GameCard>
                <GameCard tone="amber" className="shadow-sm">
                  <p className="text-lg font-bold text-stone-950">Outside Activity</p>
                  <p className="mt-2 text-sm text-stone-700">{worldRegionActions.length} available region action hooks across open and future destinations.</p>
                  <p className="mt-2 text-xs font-semibold text-amber-900">{openNpcRequestCount} town request(s) can still support route reputation.</p>
                </GameCard>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-teal-800">Regions</p>
                      <h3 className="text-xl font-bold text-stone-950">{openRegionCount}/{worldRegions.length} regions open</h3>
                    </div>
                    <GameStatusBadge tone="teal">
                      Current: {worldRegions.find((region) => region.id === currentRegionId)?.name ?? "Unknown"}
                    </GameStatusBadge>
                  </div>
                  {latestRegionTravelResult ? (
                    <div className="mt-3">
                      <GameFeedbackBox
                        tone={latestRegionTravelResult.success ? "emerald" : "rose"}
                        message={`${latestRegionTravelResult.title}: ${latestRegionTravelResult.message}`}
                      />
                    </div>
                  ) : null}
                  <div className="mt-3 grid gap-3">
                    {worldRegions.map((region) => {
                      const locked = region.status === "locked";
                      const isCurrent = currentRegionId === region.id;
                      const visited = visitedRegionIds.includes(region.id);
                      const primaryAction = worldRegionActions.find((action) => action.regionId === region.id);
                      return (
                        <div key={region.id} className="rounded-2xl border border-white bg-white/85 p-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-stone-950">{region.name}</p>
                            <div className="flex flex-wrap justify-end gap-1">
                              <GameStatusBadge tone={locked ? "stone" : isCurrent ? "emerald" : "teal"}>{locked ? "Locked" : isCurrent ? "Current" : "Open"}</GameStatusBadge>
                              {!locked ? <GameStatusBadge tone={visited ? "amber" : "stone"}>{visited ? "Visited" : "Unvisited"}</GameStatusBadge> : null}
                            </div>
                          </div>
                          <p className="mt-1">{region.description}</p>
                          <p className="mt-2 text-xs"><strong>Why it matters:</strong> {getRegionImportance(region.id)}</p>
                          <p className="mt-1 text-xs"><strong>Access:</strong> {region.access.requirement} - {region.access.travelMinutes} min via {region.access.route}</p>
                          <p className="mt-1 text-xs"><strong>Linked factions:</strong> {formatWorldList(region.factionHooks)}</p>
                          {locked ? (
                            <p className="mt-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700">
                              Unlock: {region.unlockCondition}
                            </p>
                          ) : (
                            <div className="mt-3 grid gap-2 lg:grid-cols-2">
                              <GameActionCard
                                title={isCurrent ? "Current Region" : `Travel to ${region.name}`}
                                performer="Player"
                                targetLabel="Traveler"
                                cost={`${region.access.travelMinutes} minutes`}
                                outcome={isCurrent ? "Already here; take a region action when ready." : "Spends in-game time and updates the current region."}
                                disabledReason={isCurrent ? "Already in this region." : undefined}
                                buttonLabel={isCurrent ? "Here Now" : "Travel"}
                                onAction={() => travelToRegion(region.id)}
                                tone="teal"
                              />
                              {primaryAction ? (
                                <GameActionCard
                                  title={primaryAction.title}
                                  performer={region.name}
                                  targetLabel="Region"
                                  cost={`${primaryAction.timeCostMinutes} minutes`}
                                  outcome={primaryAction.outcome}
                                  disabledReason={isCurrent ? undefined : `Travel to ${region.name} first.`}
                                  buttonLabel="Do Action"
                                  onAction={() => performRegionAction(region.id, primaryAction.id)}
                                  tone="emerald"
                                />
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4"><p className="text-xs font-bold uppercase text-fuchsia-800">Factions</p><h3 className="text-xl font-bold text-stone-950">{knownFactionCount}/{factions.length} known organizations</h3><div className="mt-3 grid gap-3">{factions.map((faction) => (<div key={faction.id} className="rounded-2xl border border-white bg-white/85 p-3 text-sm text-stone-700"><div className="flex items-start justify-between gap-2"><div><p className="font-bold text-stone-950">{faction.name}</p><p className="text-xs font-semibold uppercase text-fuchsia-800">{formatWorldLabel(faction.standing)} - Rep {faction.reputation}</p></div><span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-bold text-fuchsia-900">{formatWorldLabel(faction.status)}</span></div><p className="mt-2">{faction.description}</p><p className="mt-2 text-xs"><strong>Unlock:</strong> {faction.unlockCondition}</p><p className="mt-1 text-xs"><strong>Known rewards:</strong> {formatWorldList(faction.rewardHooks)}</p></div>))}</div></div>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <PopupWindow open={contractLedgerOpen} onClose={() => setContractLedgerOpen(false)} title="Contract Ledgers" maxWidth="max-w-6xl">
        <div className="grid gap-4 xl:grid-cols-3">
          <NpcContractLedgerPanel
            title="Maris Thorn Ledger"
            offers={marisLedgerOffers}
            currentDay={currentDay}
            currentHour={currentHour}
            currentMinute={currentMinute}
            playerGold={playerData.gold}
            hasMounted={hasMounted}
            getItemCount={getItemCount}
            getQualityItemCount={getQualityItemCount}
            onComplete={completeNpcContractOffer}
            accentClasses="border-emerald-200 bg-emerald-50"
            buttonClasses="bg-emerald-700"
          />
          <NpcContractLedgerPanel
            title="Selene Voss Ledger"
            offers={seleneLedgerOffers}
            currentDay={currentDay}
            currentHour={currentHour}
            currentMinute={currentMinute}
            playerGold={playerData.gold}
            hasMounted={hasMounted}
            getItemCount={getItemCount}
            getQualityItemCount={getQualityItemCount}
            onComplete={completeNpcContractOffer}
            accentClasses="border-purple-200 bg-purple-50"
            buttonClasses="bg-purple-700"
          />
          <NpcContractLedgerPanel
            title="Tamsin Vale Ledger"
            offers={tamsinLedgerOffers}
            currentDay={currentDay}
            currentHour={currentHour}
            currentMinute={currentMinute}
            playerGold={playerData.gold}
            hasMounted={hasMounted}
            getItemCount={getItemCount}
            getQualityItemCount={getQualityItemCount}
            onComplete={completeNpcContractOffer}
            accentClasses="border-rose-200 bg-rose-50"
            buttonClasses="bg-rose-700"
          />
        </div>
      </PopupWindow>

      <PopupWindow
        open={Boolean(selectedTownNpc && selectedTownNpcRelationship && selectedTownNpcVisitImage)}
        onClose={() => setSelectedTownNpcId(null)}
        title={selectedTownNpc ? selectedTownNpc.name : "NPC Details"}
        maxWidth="max-w-6xl"
      >
        {selectedTownNpc && selectedTownNpcRelationship && selectedTownNpcVisitImage ? (
          <div className={`rounded-2xl border-2 p-4 shadow-sm ${getNpcAccentClasses(selectedTownNpc.id)}`}>
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-2xl font-bold text-stone-950">{selectedTownNpc.name}</p>
                <p className="text-sm font-semibold text-stone-700">
                  {selectedTownNpc.title} - {selectedTownNpc.race}
                </p>
                <p className="mt-2 text-sm text-stone-700">{selectedTownNpc.shortDescription}</p>
                <NpcVisitImageFrame
                  image={selectedTownNpcVisitImage}
                  accentClasses="mt-3 border-white bg-white/70 text-stone-950"
                />
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/80 p-3 text-sm text-stone-700">
                  <p><strong>Relationship:</strong> {getRelationshipDisplayLabel(selectedTownNpcRelationship)}</p>
                  <p><strong>Current Reward:</strong> {getNpcRelationshipRewardSummary(selectedTownNpc.id, selectedTownNpcRelationship)}</p>
                  <p><strong>Next Hint:</strong> {getNpcStageProgressHint(selectedTownNpc.id, selectedTownNpcRelationship)}</p>
                </div>
                <NpcStageVisitPanel
                  npcId={selectedTownNpc.id}
                  relationship={selectedTownNpcRelationship}
                  loverEvolutionUnlocked={selectedTownNpcLoverVoice}
                  accentClasses="border-white"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <NpcSocialPanel
                npc={selectedTownNpc}
                relationship={selectedTownNpcRelationship}
                currentDay={currentDay}
                inventory={inventory}
                giftRecords={npcGiftRecords}
                invitationRecords={npcInvitationRecords}
                outingLog={npcOutingCompletionLog}
                miniChainProgress={npcMiniChainProgress}
                routePerks={npcRoutePerks}
                loverEvolutions={npcLoverEvolutions}
                latestResult={latestNpcSocialResult}
                selectedGiftItemId={selectedGiftItems[selectedTownNpc.id] ?? ""}
                onSelectGift={(itemId) => setSelectedGiftItems((prev) => ({ ...prev, [selectedTownNpc.id]: itemId }))}
                onGiveGift={(itemId) => giveNpcGift(selectedTownNpc.id, itemId)}
                onInvite={(invitationId) => inviteNpc(selectedTownNpc.id, invitationId)}
                accentClasses="border-white bg-white/70"
                buttonClasses={getNpcButtonClasses(selectedTownNpc.id)}
                hasMounted={hasMounted}
              />
              <div className="space-y-4">
                <NpcMiniChainPanel
                  npc={selectedTownNpc}
                  progressMap={npcMiniChainProgress}
                  accentClasses="border-white bg-white/70"
                />
                <NpcRoutePerksPanel
                  npc={selectedTownNpc}
                  perkState={npcRoutePerks}
                  accentClasses="border-white bg-white/70"
                />
                <NpcLoverEvolutionPanel
                  npc={selectedTownNpc}
                  routePerks={npcRoutePerks}
                  loverEvolutions={npcLoverEvolutions}
                  accentClasses="border-white bg-white/70"
                />
                <NpcExclusiveLoopsPanel
                  npc={selectedTownNpc}
                  loopState={npcExclusiveLoops}
                  loverEvolutions={npcLoverEvolutions}
                  currentDay={currentDay}
                  currentHour={currentHour}
                  currentMinute={currentMinute}
                  hasMounted={hasMounted}
                  getItemCount={getItemCount}
                  getQualityItemCount={getQualityItemCount}
                  onComplete={completeNpcExclusiveLoopOffer}
                  accentClasses="border-white bg-white/70"
                  buttonClasses={getNpcButtonClasses(selectedTownNpc.id)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </PopupWindow>

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
            const loverVoiceUnlocked = isNpcLoverVoiceUnlocked(npc.id, npcLoverEvolutions);
            return (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                <p className="text-lg font-bold text-emerald-950">{npc.name}</p>
                <p className="text-sm font-semibold text-emerald-800">{npc.title} • {npc.race}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>
                <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting("maris_thorn", relationship, loverVoiceUnlocked)}
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
                  loverEvolutionUnlocked={loverVoiceUnlocked}
                  accentClasses="border-emerald-200"
                />
                <div className="mt-3">
                  <NpcSocialPanel
                    npc={npc}
                    relationship={relationship}
                    currentDay={currentDay}
                    inventory={inventory}
                    giftRecords={npcGiftRecords}
                    invitationRecords={npcInvitationRecords}
                    outingLog={npcOutingCompletionLog}
                    miniChainProgress={npcMiniChainProgress}
                    routePerks={npcRoutePerks}
                    loverEvolutions={npcLoverEvolutions}
                    latestResult={latestNpcSocialResult}
                    selectedGiftItemId={selectedGiftItems.maris_thorn ?? ""}
                    onSelectGift={(itemId) => setSelectedGiftItems((prev) => ({ ...prev, maris_thorn: itemId }))}
                    onGiveGift={(itemId) => giveNpcGift("maris_thorn", itemId)}
                    onInvite={(invitationId) => inviteNpc("maris_thorn", invitationId)}
                    accentClasses="border-emerald-200 bg-emerald-100/70"
                    buttonClasses="bg-emerald-700"
                    hasMounted={hasMounted}
                  />
                </div>
                <div className="mt-3">
                  <NpcMiniChainPanel
                    npc={npc}
                    progressMap={npcMiniChainProgress}
                    accentClasses="border-emerald-200 bg-emerald-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcRoutePerksPanel
                    npc={npc}
                    perkState={npcRoutePerks}
                    accentClasses="border-emerald-200 bg-emerald-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcLoverEvolutionPanel
                    npc={npc}
                    routePerks={npcRoutePerks}
                    loverEvolutions={npcLoverEvolutions}
                    accentClasses="border-emerald-200 bg-emerald-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcExclusiveLoopsPanel
                    npc={npc}
                    loopState={npcExclusiveLoops}
                    loverEvolutions={npcLoverEvolutions}
                    currentDay={currentDay}
                    currentHour={currentHour}
                    currentMinute={currentMinute}
                    hasMounted={hasMounted}
                    getItemCount={getItemCount}
                    getQualityItemCount={getQualityItemCount}
                    onComplete={completeNpcExclusiveLoopOffer}
                    accentClasses="border-emerald-200 bg-emerald-100/70"
                    buttonClasses="bg-emerald-700"
                  />
                </div>
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
              const routePurchaseBonusActive =
                hasNpcRoutePerk(npcRoutePerks, "maris_greenhouse_touch") &&
                (item.category === "seed" || item.useTags.includes("fertilizer"));
              const routePurchaseBonusQuantity = hasNpcLoverEvolution(
                npcLoverEvolutions,
                "maris_greenhouse_bond"
              )
                ? 2
                : 1;
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
                  {routePurchaseBonusActive ? (
                    <p className="mt-1 text-xs font-semibold text-emerald-800">
                      Greenhouse Touch active: +{routePurchaseBonusQuantity} extra {item.name} on paid purchases.
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
            const loverVoiceUnlocked = isNpcLoverVoiceUnlocked(npc.id, npcLoverEvolutions);
            return (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4">
                <p className="text-lg font-bold text-rose-950">{npc.name}</p>
                <p className="text-sm font-semibold text-rose-800">{npc.title} • {npc.race}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>
                <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting("tamsin_vale", relationship, loverVoiceUnlocked)}
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
                  loverEvolutionUnlocked={loverVoiceUnlocked}
                  accentClasses="border-rose-200"
                />
                <div className="mt-3">
                  <NpcSocialPanel
                    npc={npc}
                    relationship={relationship}
                    currentDay={currentDay}
                    inventory={inventory}
                    giftRecords={npcGiftRecords}
                    invitationRecords={npcInvitationRecords}
                    outingLog={npcOutingCompletionLog}
                    miniChainProgress={npcMiniChainProgress}
                    routePerks={npcRoutePerks}
                    loverEvolutions={npcLoverEvolutions}
                    latestResult={latestNpcSocialResult}
                    selectedGiftItemId={selectedGiftItems.tamsin_vale ?? ""}
                    onSelectGift={(itemId) => setSelectedGiftItems((prev) => ({ ...prev, tamsin_vale: itemId }))}
                    onGiveGift={(itemId) => giveNpcGift("tamsin_vale", itemId)}
                    onInvite={(invitationId) => inviteNpc("tamsin_vale", invitationId)}
                    accentClasses="border-rose-200 bg-rose-100/70"
                    buttonClasses="bg-rose-700"
                    hasMounted={hasMounted}
                  />
                </div>
                <div className="mt-3">
                  <NpcMiniChainPanel
                    npc={npc}
                    progressMap={npcMiniChainProgress}
                    accentClasses="border-rose-200 bg-rose-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcRoutePerksPanel
                    npc={npc}
                    perkState={npcRoutePerks}
                    accentClasses="border-rose-200 bg-rose-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcLoverEvolutionPanel
                    npc={npc}
                    routePerks={npcRoutePerks}
                    loverEvolutions={npcLoverEvolutions}
                    accentClasses="border-rose-200 bg-rose-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcExclusiveLoopsPanel
                    npc={npc}
                    loopState={npcExclusiveLoops}
                    loverEvolutions={npcLoverEvolutions}
                    currentDay={currentDay}
                    currentHour={currentHour}
                    currentMinute={currentMinute}
                    hasMounted={hasMounted}
                    getItemCount={getItemCount}
                    getQualityItemCount={getQualityItemCount}
                    onComplete={completeNpcExclusiveLoopOffer}
                    accentClasses="border-rose-200 bg-rose-100/70"
                    buttonClasses="bg-rose-700"
                  />
                </div>
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
            const loverVoiceUnlocked = isNpcLoverVoiceUnlocked(npc.id, npcLoverEvolutions);
            return (
              <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4">
                <p className="text-lg font-bold text-purple-950">{npc.name}</p>
                <p className="text-sm font-semibold text-purple-800">{npc.title} • {npc.race}</p>
                <p className="mt-2 text-sm text-stone-700">{npc.shortDescription}</p>
                <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting("selene_voss", relationship, loverVoiceUnlocked)}
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
                  loverEvolutionUnlocked={loverVoiceUnlocked}
                  accentClasses="border-purple-200"
                />
                <div className="mt-3">
                  <NpcSocialPanel
                    npc={npc}
                    relationship={relationship}
                    currentDay={currentDay}
                    inventory={inventory}
                    giftRecords={npcGiftRecords}
                    invitationRecords={npcInvitationRecords}
                    outingLog={npcOutingCompletionLog}
                    miniChainProgress={npcMiniChainProgress}
                    routePerks={npcRoutePerks}
                    loverEvolutions={npcLoverEvolutions}
                    latestResult={latestNpcSocialResult}
                    selectedGiftItemId={selectedGiftItems.selene_voss ?? ""}
                    onSelectGift={(itemId) => setSelectedGiftItems((prev) => ({ ...prev, selene_voss: itemId }))}
                    onGiveGift={(itemId) => giveNpcGift("selene_voss", itemId)}
                    onInvite={(invitationId) => inviteNpc("selene_voss", invitationId)}
                    accentClasses="border-purple-200 bg-purple-100/70"
                    buttonClasses="bg-purple-700"
                    hasMounted={hasMounted}
                  />
                </div>
                <div className="mt-3">
                  <NpcMiniChainPanel
                    npc={npc}
                    progressMap={npcMiniChainProgress}
                    accentClasses="border-purple-200 bg-purple-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcRoutePerksPanel
                    npc={npc}
                    perkState={npcRoutePerks}
                    accentClasses="border-purple-200 bg-purple-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcLoverEvolutionPanel
                    npc={npc}
                    routePerks={npcRoutePerks}
                    loverEvolutions={npcLoverEvolutions}
                    accentClasses="border-purple-200 bg-purple-100/70"
                  />
                </div>
                <div className="mt-3">
                  <NpcExclusiveLoopsPanel
                    npc={npc}
                    loopState={npcExclusiveLoops}
                    loverEvolutions={npcLoverEvolutions}
                    currentDay={currentDay}
                    currentHour={currentHour}
                    currentMinute={currentMinute}
                    hasMounted={hasMounted}
                    getItemCount={getItemCount}
                    getQualityItemCount={getQualityItemCount}
                    onComplete={completeNpcExclusiveLoopOffer}
                    accentClasses="border-purple-200 bg-purple-100/70"
                    buttonClasses="bg-purple-700"
                  />
                </div>
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

      <PopupWindow open={routeJournalsOpen} onClose={() => setRouteJournalsOpen(false)} title="Route Journals" maxWidth="max-w-6xl">
        <div className="space-y-4">
          {FARM_ECONOMY_ACTIVE_NPCS.map((npc) => {
            const relationship = farmNpcRelationshipMap.get(npc.id) ?? createDefaultNpcRelationshipState(npc.id);
            const accentClasses = npc.id === "maris_thorn"
              ? "border-emerald-200 bg-emerald-100/70"
              : npc.id === "selene_voss"
                ? "border-purple-200 bg-purple-100/70"
                : "border-rose-200 bg-rose-100/70";
            return (
              <NpcRouteJournalPanel
                key={`${npc.id}-route-journal`}
                npc={npc}
                relationship={relationship}
                miniChainProgress={npcMiniChainProgress}
                routePerks={npcRoutePerks}
                loverEvolutions={npcLoverEvolutions}
                exclusiveLoops={npcExclusiveLoops}
                eventLog={npcRelationshipEventLog}
                accentClasses={accentClasses}
              />
            );
          })}
        </div>
      </PopupWindow>

      <PopupWindow open={farmNpcOpen} onClose={() => setFarmNpcOpen(false)} title="Farm-Economy NPCs" maxWidth="max-w-6xl">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FARM_ECONOMY_ACTIVE_NPCS.map((npc) => {
            const relationship = farmNpcRelationshipMap.get(npc.id) ?? createDefaultNpcRelationshipState(npc.id);
            const visitImage = getNpcVisitImage(npc, relationship);
            const loverVoiceUnlocked = isNpcLoverVoiceUnlocked(npc.id, npcLoverEvolutions);
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
                  loverEvolutionUnlocked={loverVoiceUnlocked}
                  accentClasses="border-fuchsia-200"
                />

                <div className="mt-3 space-y-2 text-xs text-stone-700">
                  <p><strong>Build:</strong> {npc.bodyType}</p>
                  <p><strong>Romance Tone:</strong> {npc.romanceStyle}</p>
                  <p><strong>Personality Tags:</strong> {npc.personalityTags.join(", ")}</p>
                </div>

                <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm text-stone-700">
                  {getNpcGreeting(npc.id, relationship, loverVoiceUnlocked)}
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

                <div className="mt-3">
                  <NpcRoutePerksPanel
                    npc={npc}
                    perkState={npcRoutePerks}
                    accentClasses="border-fuchsia-200 bg-white"
                  />
                </div>

                <div className="mt-3">
                  <NpcLoverEvolutionPanel
                    npc={npc}
                    routePerks={npcRoutePerks}
                    loverEvolutions={npcLoverEvolutions}
                    accentClasses="border-fuchsia-200 bg-white"
                  />
                </div>

                <div className="mt-3">
                  <NpcExclusiveLoopsPanel
                    npc={npc}
                    loopState={npcExclusiveLoops}
                    loverEvolutions={npcLoverEvolutions}
                    currentDay={currentDay}
                    currentHour={currentHour}
                    currentMinute={currentMinute}
                    hasMounted={hasMounted}
                    getItemCount={getItemCount}
                    getQualityItemCount={getQualityItemCount}
                    onComplete={completeNpcExclusiveLoopOffer}
                    accentClasses="border-fuchsia-200 bg-white"
                    buttonClasses="bg-fuchsia-700"
                  />
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
