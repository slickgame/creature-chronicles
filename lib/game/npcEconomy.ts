import { ITEM_DATA } from "@/lib/items/itemData";
import {
  addRelationshipProgress,
  createDefaultNpcRelationshipState,
  FINAL_RELATIONSHIP_LEVEL,
  type NpcRelationshipState,
  type RelationshipLevel,
} from "@/lib/town/relationshipDefaults";

export type FarmEconomyNpcId = "maris_thorn" | "selene_voss" | "tamsin_vale";

export type EconomicUnlock = {
  level: RelationshipLevel;
  title: string;
  description: string;
};

export type PremiumContract = {
  id: string;
  itemId: string;
  label: string;
  flavor: string;
  unlockLevel: RelationshipLevel;
  bonusMultiplier: number;
};

export type TownNpcRelationshipSource = {
  id: string;
  relationship?: number | null;
};

export const RELATIONSHIP_PROGRESS_PER_LEVEL = 100;
export const MAX_RELATIONSHIP_POINTS = FINAL_RELATIONSHIP_LEVEL * RELATIONSHIP_PROGRESS_PER_LEVEL;

const MARIS_SEED_PRICE_MULTIPLIER: Record<RelationshipLevel, number> = {
  1: 1,
  2: 0.95,
  3: 0.9,
  4: 0.86,
  5: 0.82,
};

const MARIS_FERTILIZER_PRICE_MULTIPLIER: Record<RelationshipLevel, number> = {
  1: 1,
  2: 0.94,
  3: 0.88,
  4: 0.83,
  5: 0.78,
};

const TAMSIN_RECIPE_PRICE_MULTIPLIER: Record<RelationshipLevel, number> = {
  1: 1,
  2: 0.95,
  3: 0.9,
  4: 0.85,
  5: 0.8,
};

const SELENE_BASE_BONUS_BY_LEVEL: Record<RelationshipLevel, number> = {
  1: 0,
  2: 0.05,
  3: 0.12,
  4: 0.2,
  5: 0.28,
};

const SELENE_COOKED_BONUS_BY_LEVEL: Record<RelationshipLevel, number> = {
  1: 0,
  2: 0,
  3: 0.04,
  4: 0.08,
  5: 0.12,
};

const MARIS_ECONOMIC_UNLOCKS: EconomicUnlock[] = [
  {
    level: 1,
    title: "Open Stall",
    description: "Starter seeds and basic fertilizer are available.",
  },
  {
    level: 2,
    title: "Preferred Grower Pricing",
    description: "Seed and fertilizer prices drop as Maris starts treating you like a favorite.",
  },
  {
    level: 3,
    title: "Bonus Seed Bundles",
    description: "Occasional purchases come with extra seeds tucked into your bag.",
  },
  {
    level: 4,
    title: "Greenhouse Priority",
    description: "Stronger input discounts and more frequent bonus bundles.",
  },
  {
    level: 5,
    title: "Lover's Grower Terms",
    description: "Best Maris pricing and the strongest bonus bundle odds.",
  },
];

const SELENE_ECONOMIC_UNLOCKS: EconomicUnlock[] = [
  {
    level: 1,
    title: "Standard Exchange",
    description: "Base produce-demand contracts are available.",
  },
  {
    level: 2,
    title: "Broker Boost",
    description: "All Selene sale contracts gain a stronger payout multiplier.",
  },
  {
    level: 3,
    title: "Premium Buyer Board",
    description: "Premium produce contracts unlock with richer payout curves.",
  },
  {
    level: 4,
    title: "Private Contracts",
    description: "Higher-value premium requests become available more often.",
  },
  {
    level: 5,
    title: "Elite Arrangement",
    description: "Maximum sale modifiers and full premium contract access.",
  },
];

const TAMSIN_ECONOMIC_UNLOCKS: EconomicUnlock[] = [
  {
    level: 1,
    title: "Open Recipe Counter",
    description: "Starter recipe books are available.",
  },
  {
    level: 2,
    title: "Kitchen Friend Discount",
    description: "Recipe books become cheaper as Tamsin starts fussing over your pantry.",
  },
  {
    level: 3,
    title: "Progression Perks",
    description: "Recipe advice perks and first cooking commissions unlock.",
  },
  {
    level: 4,
    title: "After-Hours Kitchen Work",
    description: "Higher-value cooking commissions and stronger recipe discounts.",
  },
  {
    level: 5,
    title: "Table-for-Two Terms",
    description: "Best recipe pricing and top-tier cooking commissions.",
  },
];

const SELENE_PREMIUM_CONTRACTS: PremiumContract[] = [
  {
    id: "selene_contract_pristine_apple",
    itemId: "apple",
    label: "Polished Orchard Lot",
    flavor: "Selene has a boutique buyer craving perfect table fruit.",
    unlockLevel: 3,
    bonusMultiplier: 1.55,
  },
  {
    id: "selene_contract_berry_crate",
    itemId: "berry",
    label: "Velvet Berry Display",
    flavor: "A luxury dessert house wants berries with real visual pop.",
    unlockLevel: 3,
    bonusMultiplier: 1.62,
  },
  {
    id: "selene_contract_stew_service",
    itemId: "hearty_stew",
    label: "Evening Service Contract",
    flavor: "Selene can route hot meal trays to private clients for a premium.",
    unlockLevel: 4,
    bonusMultiplier: 1.72,
  },
  {
    id: "selene_contract_signature_pie",
    itemId: "apple_pie",
    label: "Signature Pie Circuit",
    flavor: "A members-only board pays extra for seductive bakery stock.",
    unlockLevel: 5,
    bonusMultiplier: 1.85,
  },
];

const TAMSIN_COMMISSION_CONTRACTS: PremiumContract[] = [
  {
    id: "tamsin_commission_comfort",
    itemId: "vegetable_soup",
    label: "Comfort Pot Commission",
    flavor: "Tamsin needs warm bowls for a late kitchen run.",
    unlockLevel: 3,
    bonusMultiplier: 1.4,
  },
  {
    id: "tamsin_commission_hearty",
    itemId: "hearty_stew",
    label: "Hearty Night Tray",
    flavor: "A richer evening service order pays extra for deep, filling meals.",
    unlockLevel: 4,
    bonusMultiplier: 1.52,
  },
  {
    id: "tamsin_commission_sweets",
    itemId: "berry_tart",
    label: "Sweet Table Commission",
    flavor: "Tamsin can place premium dessert boxes for trusted cooks.",
    unlockLevel: 5,
    bonusMultiplier: 1.66,
  },
];

function roundGold(value: number) {
  return Math.max(1, Math.round(value));
}

function itemHash(itemId: string) {
  return itemId.split("").reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
}

export function normalizeRelationshipPoints(points: number) {
  const safe = Number.isFinite(points) ? points : 0;
  return Math.max(0, Math.min(MAX_RELATIONSHIP_POINTS, Math.floor(safe)));
}

export function buildNpcRelationshipStateFromPoints(
  npcId: string,
  points: number
): NpcRelationshipState {
  const startingState = createDefaultNpcRelationshipState(npcId);
  const normalizedPoints = normalizeRelationshipPoints(points);
  return addRelationshipProgress(startingState, normalizedPoints).state;
}

export function buildTownNpcRelationshipMap(
  npcIds: readonly string[],
  townNpcs: readonly TownNpcRelationshipSource[]
): Map<string, NpcRelationshipState> {
  const townNpcMap = new Map(townNpcs.map((npc) => [npc.id, npc]));

  return new Map(
    npcIds.map((npcId) => {
      const relationshipPoints = townNpcMap.get(npcId)?.relationship ?? 0;
      return [npcId, buildNpcRelationshipStateFromPoints(npcId, relationshipPoints)];
    })
  );
}

export function getNpcEconomicUnlocks(npcId: FarmEconomyNpcId): EconomicUnlock[] {
  if (npcId === "maris_thorn") return MARIS_ECONOMIC_UNLOCKS;
  if (npcId === "selene_voss") return SELENE_ECONOMIC_UNLOCKS;
  return TAMSIN_ECONOMIC_UNLOCKS;
}

export function getMarisAdjustedBuyPrice(
  itemId: string,
  basePrice: number,
  relationship: NpcRelationshipState
) {
  const item = ITEM_DATA[itemId];
  if (!item) return basePrice;

  const isSeed = item.category === "seed";
  const isFertilizer = item.useTags.includes("fertilizer");

  if (!isSeed && !isFertilizer) return basePrice;

  const multiplier = isFertilizer
    ? MARIS_FERTILIZER_PRICE_MULTIPLIER[relationship.level]
    : MARIS_SEED_PRICE_MULTIPLIER[relationship.level];

  return roundGold(basePrice * multiplier);
}

export function getMarisBonusSeedBundleQuantity(
  itemId: string,
  relationship: NpcRelationshipState,
  currentDay: number,
  currentHour: number,
  currentMinute: number
) {
  if (!itemId.endsWith("_seed")) return 0;
  if (relationship.level < 3) return 0;

  const chance = relationship.level === 3 ? 14 : relationship.level === 4 ? 22 : 30;
  const rareDoubleChance = relationship.level === 5 ? 10 : 0;
  const rollSeed = currentDay * 131 + currentHour * 17 + currentMinute * 7 + itemHash(itemId);
  const roll = Math.abs(rollSeed % 100);

  if (roll >= chance) return 0;
  if (roll < rareDoubleChance) return 2;
  return 1;
}

export function getTamsinRecipeBookPrice(basePrice: number, relationship: NpcRelationshipState) {
  return roundGold(basePrice * TAMSIN_RECIPE_PRICE_MULTIPLIER[relationship.level]);
}

export function getSeleneAdjustedDemandMultiplier(
  baseMultiplier: number,
  relationship: NpcRelationshipState,
  itemId: string
) {
  const item = ITEM_DATA[itemId];
  const baseBonus = SELENE_BASE_BONUS_BY_LEVEL[relationship.level];
  const cookedBonus = item?.category === "food" ? SELENE_COOKED_BONUS_BY_LEVEL[relationship.level] : 0;
  const effective = baseMultiplier + baseBonus + cookedBonus;
  return Math.round(effective * 100) / 100;
}

export function getSelenePremiumContracts(relationship: NpcRelationshipState) {
  return SELENE_PREMIUM_CONTRACTS.filter((entry) => relationship.level >= entry.unlockLevel);
}

export function getTamsinCookingCommissions(relationship: NpcRelationshipState) {
  return TAMSIN_COMMISSION_CONTRACTS.filter((entry) => relationship.level >= entry.unlockLevel);
}

export function getTamsinProgressionPerks(relationship: NpcRelationshipState): string[] {
  const level = relationship.level;
  const perks: string[] = ["Recipe counter access and warm kitchen guidance."];

  if (level >= 2) {
    perks.push("Recipe books discounted with Tamsin's kitchen-friend rates.");
  }
  if (level >= 3) {
    perks.push("Cooking commissions unlock for crafted comfort dishes.");
  }
  if (level >= 4) {
    perks.push("Commission payouts improve for high-effort evening service recipes.");
  }
  if (level >= 5) {
    perks.push("Top-tier commission board and deepest cookbook discounts unlocked.");
  }

  return perks;
}
