import { ITEM_DATA } from "@/lib/items/itemData";
import type { CropQuality } from "@/lib/game/farming";
import { CROP_QUALITY_ORDER } from "@/lib/game/produceEconomy";
import type { FarmEconomyNpcId } from "@/lib/game/npcEconomy";
import {
  hasNpcLoverEvolution,
  type NpcLoverEvolutionId,
  type NpcLoverEvolutionState,
} from "@/lib/town/npcRoutePerks";

export type NpcExclusiveLoopId =
  | "maris_greenhouse_cultivation"
  | "selene_elite_buyer_board"
  | "tamsin_lovers_table";

export type NpcExclusiveLoopRequirement = {
  itemId: string;
  quantity: number;
  minimumQuality?: CropQuality;
};

export type NpcExclusiveLoopRewardItem = {
  itemId: string;
  quantity: number;
};

export type NpcExclusiveLoopReward = {
  gold: number;
  xp: number;
  relationshipGain: number;
  items: NpcExclusiveLoopRewardItem[];
};

export type NpcExclusiveLoopOffer = {
  id: string;
  loopId: NpcExclusiveLoopId;
  npcId: FarmEconomyNpcId;
  title: string;
  description: string;
  flavorText: string;
  completionText: string;
  generatedDay: number;
  expiryDay: number;
  expiryHour: number;
  expiryMinute: number;
  completed: boolean;
  requirements: NpcExclusiveLoopRequirement[];
  reward: NpcExclusiveLoopReward;
  rewardSummary: string;
};

export type NpcExclusiveLoopDefinition = {
  id: NpcExclusiveLoopId;
  npcId: FarmEconomyNpcId;
  requiredLoverEvolutionId: NpcLoverEvolutionId;
  title: string;
  subtitle: string;
  unlockSummary: string;
  activeSummary: string;
  lockedFlavor: string;
};

export type NpcExclusiveLoopState = {
  offers: NpcExclusiveLoopOffer[];
  completionCounts: Partial<Record<NpcExclusiveLoopId, number>>;
  lastCompletedDay: Partial<Record<NpcExclusiveLoopId, number>>;
};

const MARIS_EXCLUSIVE_PRODUCE = ["carrot", "potato", "lettuce", "apple", "berry"] as const;
const MARIS_RARE_SEEDS = ["apple_seed", "berry_seed"] as const;
const SELENE_LUXURY_ITEMS = ["apple", "berry", "apple_pie", "berry_tart", "hearty_stew"] as const;
const TAMSIN_FEAST_ITEMS = ["vegetable_soup", "hearty_stew", "apple_pie", "berry_tart", "warm_milk"] as const;

export const NPC_EXCLUSIVE_LOOPS: Record<NpcExclusiveLoopId, NpcExclusiveLoopDefinition> = {
  maris_greenhouse_cultivation: {
    id: "maris_greenhouse_cultivation",
    npcId: "maris_thorn",
    requiredLoverEvolutionId: "maris_greenhouse_bond",
    title: "Greenhouse Cultivation",
    subtitle: "Exclusive grower work that turns Maris's private rows into rare seed support.",
    unlockSummary: "Unlock Maris's Greenhouse Bond lover evolution.",
    activeSummary: "Rotating high-quality crop deliveries pay out rare seeds, fertilizer, gold, and relationship.",
    lockedFlavor:
      "Maris keeps this ledger under the greenhouse counter until your route has become something warmer than business.",
  },
  selene_elite_buyer_board: {
    id: "selene_elite_buyer_board",
    npcId: "selene_voss",
    requiredLoverEvolutionId: "selene_elite_buyer_status",
    title: "Elite Buyer Board",
    subtitle: "Selene's private clients pay for polished luxury lots with no public bidding.",
    unlockSummary: "Unlock Selene's Elite Buyer Status lover evolution.",
    activeSummary: "Rotating luxury produce and meal deals pay high gold, relationship, and market support.",
    lockedFlavor:
      "Selene keeps the elite board closed until your name belongs in the quiet part of her ledger.",
  },
  tamsin_lovers_table: {
    id: "tamsin_lovers_table",
    npcId: "tamsin_vale",
    requiredLoverEvolutionId: "tamsin_hearth_devotion",
    title: "Lover's Table",
    subtitle: "Private dinner commissions that turn comfort cooking into an endgame habit.",
    unlockSummary: "Unlock Tamsin's Hearth Devotion lover evolution.",
    activeSummary: "Rotating comfort-feast orders pay gold, relationship, pantry gifts, and cooking support.",
    lockedFlavor:
      "Tamsin saves this little table for someone who has already learned what her private hearth means.",
  },
};

export const NPC_EXCLUSIVE_LOOP_IDS = Object.keys(NPC_EXCLUSIVE_LOOPS) as NpcExclusiveLoopId[];

function itemName(itemId: string) {
  return ITEM_DATA[itemId]?.name ?? itemId;
}

function itemSellValue(itemId: string, fallback: number) {
  return ITEM_DATA[itemId]?.sellValue ?? fallback;
}

function pickBySeed<T>(items: readonly T[], day: number, completionCount: number, offset: number) {
  const index = Math.abs((day * 53 + completionCount * 31 + offset * 19) % items.length);
  return items[index];
}

function qualityLabel(quality?: CropQuality) {
  if (!quality || quality === "standard") return "standard";
  if (quality === "fine") return "fine+";
  if (quality === "lush") return "lush+";
  return "pristine";
}

function rewardScale(completionCount: number) {
  return 1 + Math.min(0.45, completionCount * 0.04);
}

function summarizeReward(reward: NpcExclusiveLoopReward) {
  return [
    reward.gold > 0 ? `${reward.gold}g` : null,
    reward.xp > 0 ? `${reward.xp} XP` : null,
    reward.relationshipGain > 0 ? `+${reward.relationshipGain} relationship` : null,
    ...reward.items.map((item) => `${itemName(item.itemId)} x${item.quantity}`),
  ].filter(Boolean).join(", ");
}

function withRewardSummary(offer: NpcExclusiveLoopOffer): NpcExclusiveLoopOffer {
  return {
    ...offer,
    rewardSummary: summarizeReward(offer.reward),
  };
}

function buildMarisOffer(day: number, completionCount: number): NpcExclusiveLoopOffer {
  const produceId = pickBySeed(MARIS_EXCLUSIVE_PRODUCE, day, completionCount, 1);
  const seedId = pickBySeed(MARIS_RARE_SEEDS, day, completionCount, 2);
  const quantity = 4 + (completionCount % 3);
  const quality: CropQuality = completionCount >= 6 ? "pristine" : "lush";
  const scale = rewardScale(completionCount);

  return withRewardSummary({
    id: `maris-exclusive-${day}-${produceId}`,
    loopId: "maris_greenhouse_cultivation",
    npcId: "maris_thorn",
    title: "Private Greenhouse Cultivation",
    description: `Bring ${quantity} ${itemName(produceId)} at ${qualityLabel(quality)} quality for Maris's private rows.`,
    flavorText:
      `"Bring me something pretty from your fields, sweetheart. I want to see what our little arrangement is doing to your soil."`,
    completionText:
      "Maris cups the delivery like she can feel your whole ranch in it, then tucks rare seed stock into your bag with a wink.",
    generatedDay: day,
    expiryDay: day + 3,
    expiryHour: 20,
    expiryMinute: 0,
    completed: false,
    requirements: [{ itemId: produceId, quantity, minimumQuality: quality }],
    reward: {
      gold: Math.round(itemSellValue(produceId, 6) * quantity * 2.4 * scale + 90),
      xp: Math.round(40 * scale),
      relationshipGain: 10,
      items: [
        { itemId: seedId, quantity: 3 + Math.floor(completionCount / 3) },
        { itemId: "rich_fertilizer", quantity: 1 + Math.floor(completionCount / 4) },
      ],
    },
    rewardSummary: "",
  });
}

function buildSeleneOffer(day: number, completionCount: number): NpcExclusiveLoopOffer {
  const itemId = pickBySeed(SELENE_LUXURY_ITEMS, day, completionCount, 3);
  const isFood = ITEM_DATA[itemId]?.category === "food";
  const quantity = isFood ? 2 : 4;
  const quality: CropQuality = completionCount >= 5 ? "pristine" : "lush";
  const scale = rewardScale(completionCount);

  return withRewardSummary({
    id: `selene-exclusive-${day}-${itemId}`,
    loopId: "selene_elite_buyer_board",
    npcId: "selene_voss",
    title: "Elite Private Buyer Lot",
    description: `Deliver ${quantity} ${itemName(itemId)} at ${qualityLabel(quality)} quality for Selene's quietest buyer board.`,
    flavorText:
      `"This buyer has taste, money, and very little patience. Naturally, I thought of you first."`,
    completionText:
      "Selene seals the lot with private-market ink, then lets her smile linger like a premium she meant you to notice.",
    generatedDay: day,
    expiryDay: day + 3,
    expiryHour: 21,
    expiryMinute: 0,
    completed: false,
    requirements: [{ itemId, quantity, minimumQuality: quality }],
    reward: {
      gold: Math.round(itemSellValue(itemId, 10) * quantity * 3.2 * scale + 180),
      xp: Math.round(46 * scale),
      relationshipGain: 10,
      items: completionCount % 2 === 0 ? [{ itemId: "berry_seed", quantity: 4 }] : [{ itemId: "apple_seed", quantity: 4 }],
    },
    rewardSummary: "",
  });
}

function buildTamsinOffer(day: number, completionCount: number): NpcExclusiveLoopOffer {
  const mealId = pickBySeed(TAMSIN_FEAST_ITEMS, day, completionCount, 4);
  const quantity = mealId === "warm_milk" ? 3 : 2;
  const scale = rewardScale(completionCount);

  return withRewardSummary({
    id: `tamsin-exclusive-${day}-${mealId}`,
    loopId: "tamsin_lovers_table",
    npcId: "tamsin_vale",
    title: "Private Comfort Feast",
    description: `Deliver ${quantity} ${itemName(mealId)} for Tamsin's lover's table commission.`,
    flavorText:
      `"Cook for me again, darling. Not because the counter needs it. Because I like tasting the care you bring back."`,
    completionText:
      "Tamsin takes the dish with both hands and sends you home with a pantry bundle that smells faintly of her hearth.",
    generatedDay: day,
    expiryDay: day + 3,
    expiryHour: 22,
    expiryMinute: 0,
    completed: false,
    requirements: [{ itemId: mealId, quantity, minimumQuality: "standard" }],
    reward: {
      gold: Math.round(itemSellValue(mealId, 12) * quantity * 2.7 * scale + 130),
      xp: Math.round(44 * scale),
      relationshipGain: 10,
      items: [
        { itemId: "milk", quantity: 2 + Math.floor(completionCount / 4) },
        { itemId: "egg_ingredient", quantity: 1 + Math.floor(completionCount / 5) },
      ],
    },
    rewardSummary: "",
  });
}

export function createDefaultNpcExclusiveLoopState(): NpcExclusiveLoopState {
  return {
    offers: [],
    completionCounts: {},
    lastCompletedDay: {},
  };
}

export function getNpcExclusiveLoopDefinition(loopId: NpcExclusiveLoopId) {
  return NPC_EXCLUSIVE_LOOPS[loopId];
}

export function getNpcExclusiveLoopsForNpc(npcId: string) {
  return NPC_EXCLUSIVE_LOOP_IDS.map((loopId) => NPC_EXCLUSIVE_LOOPS[loopId]).filter(
    (loop) => loop.npcId === npcId
  );
}

export function isNpcExclusiveLoopUnlocked(
  loopId: NpcExclusiveLoopId,
  loverEvolutions: NpcLoverEvolutionState
) {
  return hasNpcLoverEvolution(loverEvolutions, NPC_EXCLUSIVE_LOOPS[loopId].requiredLoverEvolutionId);
}

export function isNpcExclusiveLoopOfferExpired(
  offer: Pick<NpcExclusiveLoopOffer, "expiryDay" | "expiryHour" | "expiryMinute">,
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

export function generateNpcExclusiveLoopOfferForDay(
  loopId: NpcExclusiveLoopId,
  day: number,
  completionCount: number
) {
  if (loopId === "maris_greenhouse_cultivation") return buildMarisOffer(day, completionCount);
  if (loopId === "selene_elite_buyer_board") return buildSeleneOffer(day, completionCount);
  return buildTamsinOffer(day, completionCount);
}

export function normalizeNpcExclusiveLoopState(state: unknown): NpcExclusiveLoopState {
  if (!state || typeof state !== "object") return createDefaultNpcExclusiveLoopState();

  const value = state as Partial<NpcExclusiveLoopState>;
  return {
    offers: Array.isArray(value.offers)
      ? value.offers
          .map(normalizeNpcExclusiveLoopOffer)
          .filter((offer): offer is NpcExclusiveLoopOffer => Boolean(offer))
      : [],
    completionCounts: normalizeLoopCountMap(value.completionCounts),
    lastCompletedDay: normalizeLoopCountMap(value.lastCompletedDay),
  };
}

function normalizeLoopCountMap(value: unknown) {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([loopId, count]) =>
        NPC_EXCLUSIVE_LOOP_IDS.includes(loopId as NpcExclusiveLoopId) &&
        typeof count === "number" &&
        Number.isFinite(count)
      )
      .map(([loopId, count]) => [loopId, Math.max(0, Math.floor(count as number))])
  ) as Partial<Record<NpcExclusiveLoopId, number>>;
}

function normalizeNpcExclusiveLoopOffer(offer: Partial<NpcExclusiveLoopOffer> | null | undefined) {
  if (!offer?.id || !offer.loopId || !offer.npcId || !offer.title) return null;
  if (!NPC_EXCLUSIVE_LOOP_IDS.includes(offer.loopId)) return null;

  const normalized: NpcExclusiveLoopOffer = {
    id: offer.id,
    loopId: offer.loopId,
    npcId: offer.npcId,
    title: offer.title,
    description: offer.description ?? "",
    flavorText: offer.flavorText ?? "",
    completionText: offer.completionText ?? "",
    generatedDay: Math.max(1, Math.floor(offer.generatedDay ?? 1)),
    expiryDay: Math.max(1, Math.floor(offer.expiryDay ?? offer.generatedDay ?? 1)),
    expiryHour: Math.max(0, Math.min(23, Math.floor(offer.expiryHour ?? 20))),
    expiryMinute: Math.max(0, Math.min(59, Math.floor(offer.expiryMinute ?? 0))),
    completed: Boolean(offer.completed),
    requirements: Array.isArray(offer.requirements)
      ? offer.requirements
          .filter((requirement) => requirement?.itemId && (requirement.quantity ?? 0) > 0)
          .map((requirement) => ({
            itemId: requirement.itemId,
            quantity: Math.max(1, Math.floor(requirement.quantity)),
            minimumQuality: requirement.minimumQuality && CROP_QUALITY_ORDER.includes(requirement.minimumQuality)
              ? requirement.minimumQuality
              : undefined,
          }))
      : [],
    reward: {
      gold: Math.max(0, Math.floor(offer.reward?.gold ?? 0)),
      xp: Math.max(0, Math.floor(offer.reward?.xp ?? 0)),
      relationshipGain: Math.max(0, Math.floor(offer.reward?.relationshipGain ?? 0)),
      items: Array.isArray(offer.reward?.items)
        ? offer.reward.items
            .filter((item) => item?.itemId && (item.quantity ?? 0) > 0)
            .map((item) => ({ itemId: item.itemId, quantity: Math.max(1, Math.floor(item.quantity)) }))
        : [],
    },
    rewardSummary: offer.rewardSummary ?? "",
  };

  return withRewardSummary(normalized);
}

export function ensureNpcExclusiveLoopState(
  state: NpcExclusiveLoopState,
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  loverEvolutions: NpcLoverEvolutionState
): NpcExclusiveLoopState {
  const normalized = normalizeNpcExclusiveLoopState(state);
  const activeOffers = normalized.offers.filter(
    (offer) => !isNpcExclusiveLoopOfferExpired(offer, currentDay, currentHour, currentMinute)
  );
  const offerIds = new Set(activeOffers.map((offer) => offer.id));
  const generatedOffers = NPC_EXCLUSIVE_LOOP_IDS.flatMap((loopId) => {
    if (!isNpcExclusiveLoopUnlocked(loopId, loverEvolutions)) return [];
    const hasTodaysOffer = activeOffers.some(
      (offer) => offer.loopId === loopId && offer.generatedDay === currentDay
    );
    if (hasTodaysOffer) return [];

    const completionCount = normalized.completionCounts[loopId] ?? 0;
    const offer = generateNpcExclusiveLoopOfferForDay(loopId, currentDay, completionCount);
    return offerIds.has(offer.id) ? [] : [offer];
  });

  return {
    ...normalized,
    offers: [...activeOffers, ...generatedOffers],
  };
}

export function recordNpcExclusiveLoopCompletion(
  state: NpcExclusiveLoopState,
  offerId: string,
  completedDay: number
): NpcExclusiveLoopState {
  const normalized = normalizeNpcExclusiveLoopState(state);
  const offer = normalized.offers.find((entry) => entry.id === offerId);
  if (!offer || offer.completed) return normalized;

  return {
    offers: normalized.offers.map((entry) =>
      entry.id === offerId ? { ...entry, completed: true } : entry
    ),
    completionCounts: {
      ...normalized.completionCounts,
      [offer.loopId]: (normalized.completionCounts[offer.loopId] ?? 0) + 1,
    },
    lastCompletedDay: {
      ...normalized.lastCompletedDay,
      [offer.loopId]: completedDay,
    },
  };
}
