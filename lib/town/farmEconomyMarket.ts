import { FARM_ECONOMY_NPC_IDS, TOWN_NPC_DATA } from "@/lib/town/npcData";
import { ITEM_DATA, STARTER_RECIPE_BOOK_IDS, STARTER_SEED_IDS } from "@/lib/items/itemData";

export type MarketInventoryEntry = {
  itemId: string;
  stock: number;
  buyPrice: number;
  sellerNpcId: string;
  unlockRelationshipLevel?: number;
  note?: string;
};

export type ProduceDemandEntry = {
  itemId: string;
  label: string;
  bonusSellMultiplier: number;
  buyerNpcId: string;
  unlockRelationshipLevel?: number;
  flavor: string;
};

export type MarketShopSection = {
  id: string;
  title: string;
  description: string;
  sellerNpcId: string;
  entries: MarketInventoryEntry[];
};

function getItemBuyValue(itemId: string, fallback: number) {
  return ITEM_DATA[itemId]?.buyValue ?? fallback;
}

export const SEED_SHOP_SECTION: MarketShopSection = {
  id: "seed_shop",
  title: "Maris Thorn's Seed Stall",
  description:
    "Starter seed stock sold by Maris, with rarer bundles and more tempting options unlocking as her relationship deepens.",
  sellerNpcId: "maris_thorn",
  entries: STARTER_SEED_IDS.map((itemId) => ({
    itemId,
    stock: 25,
    buyPrice: getItemBuyValue(itemId, 5),
    sellerNpcId: "maris_thorn",
  })).concat([
    {
      itemId: "apple_seed",
      stock: 12,
      buyPrice: getItemBuyValue("apple_seed", 7),
      sellerNpcId: "maris_thorn",
      unlockRelationshipLevel: 2,
      note: "Maris starts setting aside sweeter stock once she likes you more.",
    },
    {
      itemId: "berry_seed",
      stock: 12,
      buyPrice: getItemBuyValue("berry_seed", 7),
      sellerNpcId: "maris_thorn",
      unlockRelationshipLevel: 2,
      note: "Berry seeds get easier to source once Maris takes a personal interest.",
    },
  ]),
};

export const RECIPE_SHOP_SECTION: MarketShopSection = {
  id: "recipe_shop",
  title: "Tamsin Vale's Recipe Counter",
  description:
    "Recipe books and kitchen guidance sold by Tamsin, with richer dishes unlocking as her affection and curiosity grow.",
  sellerNpcId: "tamsin_vale",
  entries: STARTER_RECIPE_BOOK_IDS.map((itemId) => ({
    itemId,
    stock: 5,
    buyPrice: getItemBuyValue(itemId, 60),
    sellerNpcId: "tamsin_vale",
  })),
};

export const DEFAULT_PRODUCE_DEMANDS: ProduceDemandEntry[] = [
  {
    itemId: "apple",
    label: "Fresh Apples Wanted",
    bonusSellMultiplier: 1.25,
    buyerNpcId: "selene_voss",
    flavor: "Selene is in the mood for produce with brighter color and cleaner presentation.",
  },
  {
    itemId: "berry",
    label: "Berry Rush",
    bonusSellMultiplier: 1.3,
    buyerNpcId: "selene_voss",
    flavor: "Sweet, eye-catching fruit is pulling better offers in the market today.",
  },
  {
    itemId: "apple_pie",
    label: "Dessert Premium",
    bonusSellMultiplier: 1.5,
    buyerNpcId: "selene_voss",
    unlockRelationshipLevel: 2,
    flavor: "Selene is quietly paying extra for finished goods with real temptation value.",
  },
  {
    itemId: "hearty_stew",
    label: "Worker's Meal Contract",
    bonusSellMultiplier: 1.4,
    buyerNpcId: "selene_voss",
    unlockRelationshipLevel: 3,
    flavor: "A larger buyer wants reliable, filling meals for labor crews.",
  },
];

export const FARM_ECONOMY_MARKET_SECTIONS: MarketShopSection[] = [
  SEED_SHOP_SECTION,
  RECIPE_SHOP_SECTION,
];

export const FARM_ECONOMY_ACTIVE_NPCS = FARM_ECONOMY_NPC_IDS.map((npcId) => TOWN_NPC_DATA[npcId]);
