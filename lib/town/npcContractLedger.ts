import { ITEM_DATA } from "@/lib/items/itemData";
import type { CropQuality } from "@/lib/game/farming";
import type { GameSeason } from "@/lib/game/weather";
import {
  buildTownNpcRelationshipMap,
  type FarmEconomyNpcId,
} from "@/lib/game/npcEconomy";
import { CROP_QUALITY_ORDER } from "@/lib/game/produceEconomy";
import { FARM_ECONOMY_NPC_IDS } from "@/lib/town/npcData";
import type { RelationshipLevel } from "@/lib/town/relationshipDefaults";

export type NpcContractOfferKind =
  | "maris_bundle"
  | "maris_grower_deal"
  | "selene_market_contract"
  | "selene_premium_board"
  | "tamsin_commission"
  | "tamsin_ingredient_request";

export type NpcContractRequirement = {
  itemId: string;
  quantity: number;
  minimumQuality?: CropQuality;
};

export type NpcContractRewardItem = {
  itemId: string;
  quantity: number;
};

export type NpcContractReward = {
  gold: number;
  xp: number;
  relationshipGain: number;
  items: NpcContractRewardItem[];
};

export type NpcContractOffer = {
  id: string;
  npcId: FarmEconomyNpcId;
  kind: NpcContractOfferKind;
  title: string;
  description: string;
  flavorText: string;
  completionText: string;
  generatedDay: number;
  expiryDay: number;
  expiryHour: number;
  expiryMinute: number;
  completed: boolean;
  relationshipLevel: RelationshipLevel;
  requiredRelationshipLevel: RelationshipLevel;
  qualityLabel: string;
  rewardSummary: string;
  requirements: NpcContractRequirement[];
  reward: NpcContractReward;
  purchaseCostGold?: number;
};

export type TownNpcRelationshipSource = {
  id: string;
  relationship?: number | null;
};

const NPC_IDS = FARM_ECONOMY_NPC_IDS as readonly FarmEconomyNpcId[];
const SEED_IDS = ["wheat_seed", "carrot_seed", "potato_seed", "lettuce_seed", "apple_seed", "berry_seed"] as const;
const FERTILIZER_IDS = ["basic_fertilizer", "rich_fertilizer"] as const;
const PRODUCE_IDS = ["wheat", "carrot", "potato", "lettuce", "apple", "berry"] as const;
const PREMIUM_PRODUCE_IDS = ["apple", "berry", "apple_pie", "berry_tart", "hearty_stew"] as const;
const COOKED_MEAL_IDS = ["bread", "porridge", "farm_salad", "vegetable_soup", "hearty_stew", "apple_pie", "berry_tart", "warm_milk"] as const;
const INGREDIENT_IDS = ["wheat", "carrot", "potato", "lettuce", "apple", "berry", "milk", "egg_ingredient"] as const;

function pickBySeed<T>(items: readonly T[], day: number, relationshipLevel: RelationshipLevel, offset: number): T {
  const index = Math.abs((day * 41 + relationshipLevel * 17 + offset * 13) % items.length);
  return items[index];
}

function clampRelationshipLevel(level: number): RelationshipLevel {
  if (level <= 1) return 1;
  if (level === 2) return 2;
  if (level === 3) return 3;
  if (level === 4) return 4;
  return 5;
}

function itemName(itemId: string) {
  return ITEM_DATA[itemId]?.name ?? itemId;
}

function itemBuyValue(itemId: string, fallback: number) {
  return ITEM_DATA[itemId]?.buyValue ?? fallback;
}

function itemSellValue(itemId: string, fallback: number) {
  return ITEM_DATA[itemId]?.sellValue ?? fallback;
}

function qualityForLevel(level: RelationshipLevel): CropQuality {
  if (level >= 5) return "pristine";
  if (level >= 4) return "lush";
  if (level >= 2) return "fine";
  return "standard";
}

function qualityLabel(quality?: CropQuality) {
  if (!quality) return "standard terms";
  if (quality === "standard") return "standard quality";
  if (quality === "fine") return "fine+ quality";
  if (quality === "lush") return "lush+ quality";
  return "pristine quality";
}

function summarizeReward(reward: NpcContractReward, purchaseCostGold?: number) {
  const parts = [
    reward.gold > 0 ? `${reward.gold}g` : null,
    reward.xp > 0 ? `${reward.xp} XP` : null,
    reward.relationshipGain > 0 ? `+${reward.relationshipGain} relationship` : null,
    ...reward.items.map((item) => `${itemName(item.itemId)} x${item.quantity}`),
  ].filter(Boolean);

  const base = parts.join(", ") || "No direct reward";
  return purchaseCostGold ? `${base} for ${purchaseCostGold}g` : base;
}

function getFamiliarity(level: RelationshipLevel) {
  if (level >= 5) return "lover";
  if (level >= 4) return "intimate";
  if (level >= 3) return "trusted";
  if (level >= 2) return "warming";
  return "new";
}

function buildMarisFlavor(level: RelationshipLevel, itemId: string) {
  const familiarity = getFamiliarity(level);
  if (familiarity === "lover") {
    return `"I tucked this away for you, sweetheart. Don't make me admit how much I like spoiling your fields."`;
  }
  if (familiarity === "intimate") {
    return `"I've started setting aside prettier stock when I think of you. Dangerous habit, that."`;
  }
  if (familiarity === "trusted") {
    return `"You've earned something a little better under the counter. Keep making me proud."`;
  }
  if (familiarity === "warming") {
    return `"You're getting steady enough that I can risk a nicer grower deal on you."`;
  }
  return `"A practical little bundle for ${itemName(itemId)}. Show me your rows can behave."`;
}

function buildSeleneFlavor(level: RelationshipLevel, itemId: string) {
  const familiarity = getFamiliarity(level);
  if (familiarity === "lover") {
    return `"Bring me ${itemName(itemId)} worth staring at, darling. I do enjoy watching you learn my standards."`;
  }
  if (familiarity === "intimate") {
    return `"I have a private buyer and a very specific appetite for quality. Impress me."`;
  }
  if (familiarity === "trusted") {
    return `"You are becoming useful in a way I find very hard to ignore."`;
  }
  if (familiarity === "warming") {
    return `"Give me ${itemName(itemId)} with polish and I'll make the numbers worth your trip."`;
  }
  return `"Clean goods, clean terms. Don't bring me anything dull."`;
}

function buildTamsinFlavor(level: RelationshipLevel, itemId: string) {
  const familiarity = getFamiliarity(level);
  if (familiarity === "lover") {
    return `"Bring me ${itemName(itemId)}, darling. I'll turn it into something that makes us both linger."`;
  }
  if (familiarity === "intimate") {
    return `"I saved this commission for someone who knows how to feed a kitchen's appetite."`;
  }
  if (familiarity === "trusted") {
    return `"You bring me the good things and I will make the evening warmer for both of us."`;
  }
  if (familiarity === "warming") {
    return `"A thoughtful delivery would help my counter, sweetheart. I know you can manage that."`;
  }
  return `"A simple kitchen request today. Good ingredients make good habits."`;
}

function buildMarisOffers(day: number, level: RelationshipLevel): NpcContractOffer[] {
  const seedId = pickBySeed(SEED_IDS, day, level, 1);
  const fertilizerId = level >= 3 ? pickBySeed(FERTILIZER_IDS, day, level, 2) : "basic_fertilizer";
  const seedQuantity = 3 + level;
  const fertilizerQuantity = level >= 4 ? 2 : 1;
  const bundleValue = itemBuyValue(seedId, 6) * seedQuantity + itemBuyValue(fertilizerId, 10) * fertilizerQuantity;
  const bundlePrice = Math.max(1, Math.round(bundleValue * (0.95 - level * 0.05)));
  const growerProduceId = pickBySeed(PRODUCE_IDS, day, level, 3);
  const growerQuantity = Math.max(3, 7 - level);
  const growerQuality = level >= 4 ? "fine" : "standard";
  const growerGold = Math.round((itemSellValue(growerProduceId, 5) * growerQuantity + 35) * (1 + level * 0.12));

  const offers: NpcContractOffer[] = [
    {
      id: `maris-bundle-${day}-${seedId}-${fertilizerId}`,
      npcId: "maris_thorn",
      kind: "maris_bundle",
      title: level >= 4 ? "Under-Counter Grow Kit" : "Rotating Seed Bundle",
      description: `${itemName(seedId)} x${seedQuantity} bundled with ${itemName(fertilizerId)} x${fertilizerQuantity}.`,
      flavorText: buildMarisFlavor(level, seedId),
      completionText: level >= 4 ? "Maris smiles like she knew you would take the bait." : "Maris packs the bundle with a pleased little hum.",
      generatedDay: day,
      expiryDay: day + 1,
      expiryHour: 20,
      expiryMinute: 0,
      completed: false,
      relationshipLevel: level,
      requiredRelationshipLevel: 1,
      qualityLabel: "grower bundle",
      requirements: [],
      reward: {
        gold: 0,
        xp: 4 + level,
        relationshipGain: level >= 3 ? 3 : 2,
        items: [
          { itemId: seedId, quantity: seedQuantity },
          { itemId: fertilizerId, quantity: fertilizerQuantity },
        ],
      },
      purchaseCostGold: bundlePrice,
      rewardSummary: "",
    },
    {
      id: `maris-grower-${day}-${growerProduceId}`,
      npcId: "maris_thorn",
      kind: "maris_grower_deal",
      title: level >= 3 ? "Favorite Grower Test" : "Grower Counter Trade",
      description: `Deliver ${growerQuantity} ${itemName(growerProduceId)} at ${qualityLabel(growerQuality)} for a field-focused payout.`,
      flavorText: buildMarisFlavor(level, growerProduceId),
      completionText: "Maris turns the crate in her hands, ears lifting with unmistakable approval.",
      generatedDay: day,
      expiryDay: day + 2,
      expiryHour: 18,
      expiryMinute: 0,
      completed: false,
      relationshipLevel: level,
      requiredRelationshipLevel: 1,
      qualityLabel: qualityLabel(growerQuality),
      requirements: [{ itemId: growerProduceId, quantity: growerQuantity, minimumQuality: growerQuality }],
      reward: {
        gold: growerGold,
        xp: 18 + level * 4,
        relationshipGain: 7 + level,
        items: [{ itemId: fertilizerId, quantity: level >= 4 ? 2 : 1 }],
      },
      rewardSummary: "",
    },
  ];

  return offers.map(withRewardSummary);
}

function buildSeleneOffers(day: number, level: RelationshipLevel): NpcContractOffer[] {
  const marketItemId = pickBySeed(PRODUCE_IDS, day, level, 4);
  const premiumItemId = pickBySeed(PREMIUM_PRODUCE_IDS, day, level, 5);
  const marketQuality = qualityForLevel(clampRelationshipLevel(level - 1));
  const premiumQuality = qualityForLevel(level);
  const marketQuantity = Math.max(2, 7 - level);
  const premiumQuantity = level >= 4 ? 2 : 3;
  const marketGold = Math.round(itemSellValue(marketItemId, 5) * marketQuantity * (1.65 + level * 0.16));
  const premiumGold = Math.round(itemSellValue(premiumItemId, 8) * premiumQuantity * (2.2 + level * 0.22));

  const offers: NpcContractOffer[] = [
    {
      id: `selene-market-${day}-${marketItemId}`,
      npcId: "selene_voss",
      kind: "selene_market_contract",
      title: level >= 3 ? "Polished Market Placement" : "Market Display Contract",
      description: `Deliver ${marketQuantity} ${itemName(marketItemId)} at ${qualityLabel(marketQuality)} for Selene's buyer board.`,
      flavorText: buildSeleneFlavor(level, marketItemId),
      completionText: "Selene checks the presentation, then lets her smile soften by exactly one dangerous degree.",
      generatedDay: day,
      expiryDay: day + 2,
      expiryHour: 20,
      expiryMinute: 30,
      completed: false,
      relationshipLevel: level,
      requiredRelationshipLevel: 1,
      qualityLabel: qualityLabel(marketQuality),
      requirements: [{ itemId: marketItemId, quantity: marketQuantity, minimumQuality: marketQuality }],
      reward: {
        gold: marketGold,
        xp: 20 + level * 5,
        relationshipGain: 8 + level,
        items: [],
      },
      rewardSummary: "",
    },
  ];

  if (level >= 3) {
    offers.push({
      id: `selene-premium-${day}-${premiumItemId}`,
      npcId: "selene_voss",
      kind: "selene_premium_board",
      title: level >= 5 ? "Private Velvet Buyer" : "Premium Buyer Board",
      description: `Deliver ${premiumQuantity} ${itemName(premiumItemId)} at ${qualityLabel(premiumQuality)} for a richer private-market payout.`,
      flavorText: buildSeleneFlavor(level, premiumItemId),
      completionText: "Selene files the lot under a private buyer's seal and gives you a look that feels like a bonus.",
      generatedDay: day,
      expiryDay: day + 3,
      expiryHour: 21,
      expiryMinute: 0,
      completed: false,
      relationshipLevel: level,
      requiredRelationshipLevel: 3,
      qualityLabel: qualityLabel(premiumQuality),
      requirements: [{ itemId: premiumItemId, quantity: premiumQuantity, minimumQuality: premiumQuality }],
      reward: {
        gold: premiumGold,
        xp: 34 + level * 6,
        relationshipGain: 11 + level,
        items: level >= 5 ? [{ itemId: "berry_seed", quantity: 3 }] : [],
      },
      rewardSummary: "",
    });
  }

  return offers.map(withRewardSummary);
}

function buildTamsinOffers(day: number, level: RelationshipLevel): NpcContractOffer[] {
  const ingredientId = pickBySeed(INGREDIENT_IDS, day, level, 6);
  const mealId = pickBySeed(COOKED_MEAL_IDS, day, level, 7);
  const ingredientQuantity = Math.max(2, 7 - level);
  const mealQuantity = level >= 4 ? 2 : 1;
  const ingredientQuality = ingredientId === "milk" || ingredientId === "egg_ingredient"
    ? "standard"
    : level >= 3
    ? "fine"
    : "standard";
  const ingredientGold = Math.round((itemSellValue(ingredientId, 5) * ingredientQuantity + 45) * (1 + level * 0.11));
  const mealGold = Math.round(itemSellValue(mealId, 12) * mealQuantity * (2.1 + level * 0.18));

  const offers: NpcContractOffer[] = [
    {
      id: `tamsin-ingredient-${day}-${ingredientId}`,
      npcId: "tamsin_vale",
      kind: "tamsin_ingredient_request",
      title: level >= 3 ? "Countertop Ingredient Favor" : "Kitchen Prep Request",
      description: `Bring ${ingredientQuantity} ${itemName(ingredientId)} at ${qualityLabel(ingredientQuality)} for Tamsin's evening prep.`,
      flavorText: buildTamsinFlavor(level, ingredientId),
      completionText: "Tamsin tucks the ingredients away with a warm, lingering thank-you.",
      generatedDay: day,
      expiryDay: day + 2,
      expiryHour: 21,
      expiryMinute: 0,
      completed: false,
      relationshipLevel: level,
      requiredRelationshipLevel: 1,
      qualityLabel: qualityLabel(ingredientQuality),
      requirements: [{ itemId: ingredientId, quantity: ingredientQuantity, minimumQuality: ingredientQuality }],
      reward: {
        gold: ingredientGold,
        xp: 18 + level * 5,
        relationshipGain: 8 + level,
        items: level >= 3 ? [{ itemId: "wheat_seed", quantity: 2 }] : [],
      },
      rewardSummary: "",
    },
  ];

  if (level >= 3) {
    offers.push({
      id: `tamsin-commission-${day}-${mealId}`,
      npcId: "tamsin_vale",
      kind: "tamsin_commission",
      title: level >= 5 ? "After-Hours Table Request" : "Cooking Commission",
      description: `Deliver ${mealQuantity} ${itemName(mealId)} for a personal kitchen commission.`,
      flavorText: buildTamsinFlavor(level, mealId),
      completionText: "Tamsin breathes in the dish like she is memorizing you through it.",
      generatedDay: day,
      expiryDay: day + 3,
      expiryHour: 22,
      expiryMinute: 0,
      completed: false,
      relationshipLevel: level,
      requiredRelationshipLevel: 3,
      qualityLabel: "finished meal",
      requirements: [{ itemId: mealId, quantity: mealQuantity, minimumQuality: "standard" }],
      reward: {
        gold: mealGold,
        xp: 32 + level * 6,
        relationshipGain: 10 + level,
        items: level >= 5 ? [{ itemId: "recipe_book_hearty_meals_1", quantity: 1 }] : [],
      },
      rewardSummary: "",
    });
  }

  return offers.map(withRewardSummary);
}

function withRewardSummary(offer: NpcContractOffer): NpcContractOffer {
  return {
    ...offer,
    rewardSummary: summarizeReward(offer.reward, offer.purchaseCostGold),
  };
}

export function generateNpcContractOffersForDay(
  day: number,
  _season: GameSeason,
  townNpcs: readonly TownNpcRelationshipSource[]
): NpcContractOffer[] {
  const relationshipMap = buildTownNpcRelationshipMap(NPC_IDS, townNpcs);

  return NPC_IDS.flatMap((npcId) => {
    const relationshipLevel = relationshipMap.get(npcId)?.level ?? 1;
    if (npcId === "maris_thorn") return buildMarisOffers(day, relationshipLevel);
    if (npcId === "selene_voss") return buildSeleneOffers(day, relationshipLevel);
    return buildTamsinOffers(day, relationshipLevel);
  });
}

export function isNpcContractExpired(
  offer: Pick<NpcContractOffer, "expiryDay" | "expiryHour" | "expiryMinute">,
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

export function ensureNpcContractLedger(
  ledger: readonly NpcContractOffer[] | undefined,
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  currentSeason: GameSeason,
  townNpcs: readonly TownNpcRelationshipSource[]
): NpcContractOffer[] {
  const activeLedger = (Array.isArray(ledger) ? ledger : [])
    .map(normalizeNpcContractOffer)
    .filter((offer): offer is NpcContractOffer => Boolean(offer))
    .filter((offer) => !isNpcContractExpired(offer, currentDay, currentHour, currentMinute));
  const offerIds = new Set(activeLedger.map((offer) => offer.id));
  const todaysOffers = generateNpcContractOffersForDay(currentDay, currentSeason, townNpcs)
    .filter((offer) => !offerIds.has(offer.id));

  return [...activeLedger, ...todaysOffers];
}

export function normalizeNpcContractOffer(offer: Partial<NpcContractOffer> | null | undefined): NpcContractOffer | null {
  if (!offer?.id || !offer.npcId || !offer.kind || !offer.title) return null;

  const relationshipLevel = clampRelationshipLevel(offer.relationshipLevel ?? 1);
  const reward = {
    gold: Math.max(0, Math.floor(offer.reward?.gold ?? 0)),
    xp: Math.max(0, Math.floor(offer.reward?.xp ?? 0)),
    relationshipGain: Math.max(0, Math.floor(offer.reward?.relationshipGain ?? 0)),
    items: Array.isArray(offer.reward?.items)
      ? offer.reward.items
          .filter((item) => item?.itemId && (item.quantity ?? 0) > 0)
          .map((item) => ({ itemId: item.itemId, quantity: Math.floor(item.quantity) }))
      : [],
  };
  const normalized = {
    id: offer.id,
    npcId: offer.npcId,
    kind: offer.kind,
    title: offer.title,
    description: offer.description ?? "",
    flavorText: offer.flavorText ?? "",
    completionText: offer.completionText ?? "",
    generatedDay: Math.max(1, Math.floor(offer.generatedDay ?? 1)),
    expiryDay: Math.max(1, Math.floor(offer.expiryDay ?? offer.generatedDay ?? 1)),
    expiryHour: Math.max(0, Math.min(23, Math.floor(offer.expiryHour ?? 20))),
    expiryMinute: Math.max(0, Math.min(59, Math.floor(offer.expiryMinute ?? 0))),
    completed: Boolean(offer.completed),
    relationshipLevel,
    requiredRelationshipLevel: clampRelationshipLevel(offer.requiredRelationshipLevel ?? 1),
    qualityLabel: offer.qualityLabel ?? "standard terms",
    requirements: Array.isArray(offer.requirements)
      ? offer.requirements
          .filter((requirement) => requirement?.itemId && (requirement.quantity ?? 0) > 0)
          .map((requirement) => ({
            itemId: requirement.itemId,
            quantity: Math.floor(requirement.quantity),
            minimumQuality: requirement.minimumQuality && CROP_QUALITY_ORDER.includes(requirement.minimumQuality)
              ? requirement.minimumQuality
              : undefined,
          }))
      : [],
    reward,
    purchaseCostGold: offer.purchaseCostGold === undefined ? undefined : Math.max(0, Math.floor(offer.purchaseCostGold)),
    rewardSummary: offer.rewardSummary ?? "",
  };

  return withRewardSummary(normalized);
}
