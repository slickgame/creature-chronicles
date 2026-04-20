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

export type NpcExclusiveLoopSpecialCompletion = {
  id: string;
  loopId: NpcExclusiveLoopId;
  npcId: FarmEconomyNpcId;
  title: string;
  day: number;
  text: string;
  rewardSummary: string;
  memoryEventId?: string;
};

export type NpcExclusiveLoopCompletionFeedback = {
  loopId: NpcExclusiveLoopId;
  npcId: FarmEconomyNpcId;
  title: string;
  text: string;
  streakCount: number;
  bestStreak: number;
  specialCompletion?: NpcExclusiveLoopSpecialCompletion;
  bonusReward?: NpcExclusiveLoopReward;
};

export type NpcExclusiveLoopStreakState = {
  current: number;
  best: number;
  lastCompletedDay?: number;
  latestFlavorText?: string;
  latestSpecialCompletionId?: string;
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
  streaks: Partial<Record<NpcExclusiveLoopId, NpcExclusiveLoopStreakState>>;
  latestFeedback?: NpcExclusiveLoopCompletionFeedback;
  specialCompletions: NpcExclusiveLoopSpecialCompletion[];
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
    streaks: {},
    specialCompletions: [],
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
    streaks: normalizeLoopStreakMap(value.streaks),
    latestFeedback: normalizeCompletionFeedback(value.latestFeedback),
    specialCompletions: Array.isArray(value.specialCompletions)
      ? value.specialCompletions
          .map(normalizeSpecialCompletion)
          .filter((entry): entry is NpcExclusiveLoopSpecialCompletion => Boolean(entry))
      : [],
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

function normalizeLoopStreakMap(value: unknown) {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, Partial<NpcExclusiveLoopStreakState>>)
      .filter(([loopId, streak]) =>
        NPC_EXCLUSIVE_LOOP_IDS.includes(loopId as NpcExclusiveLoopId) &&
        Boolean(streak) &&
        typeof streak.current === "number" &&
        typeof streak.best === "number"
      )
      .map(([loopId, streak]) => [
        loopId,
        {
          current: Math.max(0, Math.floor(streak.current ?? 0)),
          best: Math.max(0, Math.floor(streak.best ?? 0)),
          ...(typeof streak.lastCompletedDay === "number"
            ? { lastCompletedDay: Math.max(1, Math.floor(streak.lastCompletedDay)) }
            : {}),
          ...(typeof streak.latestFlavorText === "string" ? { latestFlavorText: streak.latestFlavorText } : {}),
          ...(typeof streak.latestSpecialCompletionId === "string"
            ? { latestSpecialCompletionId: streak.latestSpecialCompletionId }
            : {}),
        },
      ])
  ) as Partial<Record<NpcExclusiveLoopId, NpcExclusiveLoopStreakState>>;
}

function normalizeReward(value: Partial<NpcExclusiveLoopReward> | undefined): NpcExclusiveLoopReward {
  return {
    gold: Math.max(0, Math.floor(value?.gold ?? 0)),
    xp: Math.max(0, Math.floor(value?.xp ?? 0)),
    relationshipGain: Math.max(0, Math.floor(value?.relationshipGain ?? 0)),
    items: Array.isArray(value?.items)
      ? value.items
          .filter((item) => item?.itemId && (item.quantity ?? 0) > 0)
          .map((item) => ({ itemId: item.itemId, quantity: Math.max(1, Math.floor(item.quantity)) }))
      : [],
  };
}

function normalizeSpecialCompletion(value: unknown): NpcExclusiveLoopSpecialCompletion | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<NpcExclusiveLoopSpecialCompletion>;
  if (!entry.id || !entry.loopId || !entry.npcId || !entry.title || !entry.text) return null;
  if (!NPC_EXCLUSIVE_LOOP_IDS.includes(entry.loopId)) return null;

  return {
    id: entry.id,
    loopId: entry.loopId,
    npcId: entry.npcId,
    title: entry.title,
    day: Math.max(1, Math.floor(entry.day ?? 1)),
    text: entry.text,
    rewardSummary: entry.rewardSummary ?? "Special completion recorded.",
    ...(entry.memoryEventId ? { memoryEventId: entry.memoryEventId } : {}),
  };
}

function normalizeCompletionFeedback(value: unknown): NpcExclusiveLoopCompletionFeedback | undefined {
  if (!value || typeof value !== "object") return undefined;
  const entry = value as Partial<NpcExclusiveLoopCompletionFeedback>;
  if (!entry.loopId || !entry.npcId || !entry.title || !entry.text) return undefined;
  if (!NPC_EXCLUSIVE_LOOP_IDS.includes(entry.loopId)) return undefined;

  return {
    loopId: entry.loopId,
    npcId: entry.npcId,
    title: entry.title,
    text: entry.text,
    streakCount: Math.max(0, Math.floor(entry.streakCount ?? 0)),
    bestStreak: Math.max(0, Math.floor(entry.bestStreak ?? 0)),
    specialCompletion: normalizeSpecialCompletion(entry.specialCompletion) ?? undefined,
    bonusReward: entry.bonusReward ? normalizeReward(entry.bonusReward) : undefined,
  };
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
    reward: normalizeReward(offer.reward),
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

function buildStreakFlavor(loopId: NpcExclusiveLoopId, streakCount: number) {
  if (loopId === "maris_greenhouse_cultivation") {
    if (streakCount >= 5) {
      return "Maris looks at the crate, then at you, ears high and eyes bright. \"There she is. My favorite grower, making my greenhouse jealous of her ranch again.\"";
    }
    if (streakCount >= 3) {
      return "Maris runs a thumb over one perfect leaf and grins. \"Careful, sweetheart. Keep this up and I will start bragging about you where people can hear.\"";
    }
    return "Maris accepts the delivery with warm pride, already reaching for the rare seed drawer she pretends is not just for you.";
  }

  if (loopId === "selene_elite_buyer_board") {
    if (streakCount >= 5) {
      return "Selene studies the lot in silence, then smiles with dangerous polish. \"Consistent excellence. How very inconvenient for anyone hoping to compete with you.\"";
    }
    if (streakCount >= 3) {
      return "Selene seals the contract and lets her approval linger. \"You are becoming a habit among my private buyers. A profitable one.\"";
    }
    return "Selene notes the delivery in her private hand, neat and deliberate, as if your name deserves better ink now.";
  }

  if (streakCount >= 5) {
    return "Tamsin closes her eyes over the dish, then smiles at you like the whole kitchen softened. \"Darling, you keep feeding me care like this and I may forget how to be sensible.\"";
  }
  if (streakCount >= 3) {
    return "Tamsin sets the plate aside for the private table, cheeks warm. \"You know exactly how to make a room feel tended.\"";
  }
  return "Tamsin takes the dish with both hands, her thanks quiet enough to feel like it belongs only to you.";
}

function getSpecialCompletion(loopId: NpcExclusiveLoopId, day: number, completionCount: number, streakCount: number) {
  const rareRoll = Math.abs((day * 47 + completionCount * 29 + streakCount * 13) % 9);
  const triggered = streakCount > 0 && (streakCount % 4 === 0 || rareRoll === 0);
  if (!triggered) return null;

  if (loopId === "maris_greenhouse_cultivation") {
    return {
      title: "Hidden Seed Drawer",
      text:
        "Maris catches your wrist before you leave and opens a drawer under the greenhouse bench. \"This stock is not for sale,\" she says, slipping the packet into your palm. \"It is for the grower I like spoiling when nobody is looking.\"",
      memoryEventId: "maris_hidden_seed_drawer_micro",
      bonusReward: {
        gold: 0,
        xp: 12,
        relationshipGain: 3,
        items: [{ itemId: "berry_seed", quantity: 2 }],
      },
    };
  }

  if (loopId === "selene_elite_buyer_board") {
    return {
      title: "Velvet Contract Seal",
      text:
        "Selene presses a velvet seal beside your name and gives you a look sharp enough to feel private. \"There. A mark reserved for suppliers who make me look very, very clever.\"",
      memoryEventId: "selene_velvet_contract_seal_micro",
      bonusReward: {
        gold: 120,
        xp: 12,
        relationshipGain: 3,
        items: [],
      },
    };
  }

  return {
    title: "Hearthside Taste",
    text:
      "Tamsin pulls you close enough to taste from her spoon, smiling when you do. \"Good,\" she murmurs. \"Now I know exactly what part of this supper tastes like you.\"",
    memoryEventId: "tamsin_hearthside_taste_micro",
    bonusReward: {
      gold: 0,
      xp: 12,
      relationshipGain: 3,
      items: [{ itemId: "warm_milk", quantity: 1 }],
    },
  };
}

export function recordNpcExclusiveLoopCompletion(
  state: NpcExclusiveLoopState,
  offerId: string,
  completedDay: number
): { state: NpcExclusiveLoopState; feedback: NpcExclusiveLoopCompletionFeedback | null } {
  const normalized = normalizeNpcExclusiveLoopState(state);
  const offer = normalized.offers.find((entry) => entry.id === offerId);
  if (!offer || offer.completed) return { state: normalized, feedback: null };

  const previousStreak = normalized.streaks[offer.loopId];
  const previousDay = previousStreak?.lastCompletedDay;
  const isConsecutive =
    typeof previousDay === "number" && completedDay >= previousDay && completedDay - previousDay <= 3;
  const streakCount = isConsecutive ? (previousStreak?.current ?? 0) + 1 : 1;
  const bestStreak = Math.max(previousStreak?.best ?? 0, streakCount);
  const completionCount = (normalized.completionCounts[offer.loopId] ?? 0) + 1;
  const specialData = getSpecialCompletion(offer.loopId, completedDay, completionCount, streakCount);
  const specialCompletion: NpcExclusiveLoopSpecialCompletion | undefined = specialData
    ? {
        id: `${offer.loopId}-${completedDay}-${completionCount}`,
        loopId: offer.loopId,
        npcId: offer.npcId,
        title: specialData.title,
        day: completedDay,
        text: specialData.text,
        rewardSummary: summarizeReward(specialData.bonusReward),
        memoryEventId: specialData.memoryEventId,
      }
    : undefined;
  const feedback: NpcExclusiveLoopCompletionFeedback = {
    loopId: offer.loopId,
    npcId: offer.npcId,
    title: specialCompletion?.title ?? NPC_EXCLUSIVE_LOOPS[offer.loopId].title,
    text: specialCompletion?.text ?? buildStreakFlavor(offer.loopId, streakCount),
    streakCount,
    bestStreak,
    specialCompletion,
    bonusReward: specialData?.bonusReward,
  };

  return {
    state: {
      offers: normalized.offers.map((entry) =>
        entry.id === offerId ? { ...entry, completed: true } : entry
      ),
      completionCounts: {
        ...normalized.completionCounts,
        [offer.loopId]: completionCount,
      },
      lastCompletedDay: {
        ...normalized.lastCompletedDay,
        [offer.loopId]: completedDay,
      },
      streaks: {
        ...normalized.streaks,
        [offer.loopId]: {
          current: streakCount,
          best: bestStreak,
          lastCompletedDay: completedDay,
          latestFlavorText: feedback.text,
          ...(specialCompletion ? { latestSpecialCompletionId: specialCompletion.id } : {}),
        },
      },
      latestFeedback: feedback,
      specialCompletions: specialCompletion
        ? [specialCompletion, ...normalized.specialCompletions.filter((entry) => entry.id !== specialCompletion.id)]
        : normalized.specialCompletions,
    },
    feedback,
  };
}
