import {
  BREEDING_SUPPORT_ITEMS,
  ENERGY_SNACK_RESTORE,
  getBreedingSupportItem,
  getBreedingSupportItemActiveCount,
  getBreedingSupportItemCount,
  useBreedingSupportItem,
} from "@/data/breedingItems";
import { getPellaSupplyPriceMultiplier, grantNpcTrust } from "@/data/townNpcs";
import type { BreedingSupportItemId, ItemRarity } from "@/types/items";
import type { GameSave } from "@/types/save";

export type SupplyDepotItemId =
  | "feed_bundle"
  | "material_crate"
  | "repair_kit"
  | "nursery_supply_kit"
  | BreedingSupportItemId;

export type SupplyDepotItem = {
  itemId: SupplyDepotItemId;
  name: string;
  category: "Feed" | "Materials" | "Energy" | "Care" | "Repair" | "Breeding" | "Pregnancy" | "Nursery";
  rarity: ItemRarity;
  description: string;
  exactEffect: string;
  price: number;
  iconPath: string;
  purchaseLabel: string;
  quantityLabel: string;
  storageLabel: string;
  usageLabel: string;
  stockFlag: string;
  confirmationRequired: boolean;
};

export type SupplyDepotPurchaseResult = { save: GameSave; ok: boolean; message: string };
export type SupplyDepotUseResult = { save: GameSave; ok: boolean; message: string };
export type SupplyDepotSupplyCounts = {
  feed: number;
  materials: number;
  energySnacks: number;
  energyMeals: number;
  energySnacksUsed: number;
  repairKits: number;
  fertilityTonics: number;
  affectionTreats: number;
  recoveryBalms: number;
  traitStabilizers: number;
  mutationCatalysts: number;
  gestationTonics: number;
  nurserySupplyKits: number;
};

export const ENERGY_SNACK_RESTORE_AMOUNT = ENERGY_SNACK_RESTORE;

export const SUPPLY_DEPOT_FLAGS = {
  feed: "ranchFeedStock",
  materials: "ranchMaterialsStock",
  energySnacks: "energySnackStock",
  energyMeals: "energyMealStock",
  energySnacksUsed: "supplyDepotEnergySnacksUsed",
  repairKits: "ranchRepairKits",
  fertilityTonics: "breedingFertilityTonics",
  affectionTreats: "affectionTreatStock",
  recoveryBalms: "recoveryBalmStock",
  traitStabilizers: "traitStabilizerStock",
  mutationCatalysts: "mutationCatalystStock",
  gestationTonics: "gestationTonicStock",
  nurserySupplyKits: "nurserySupplyKits",
} as const;

export const PELLA_MOSSWICK = {
  npcId: "pella_mosswick",
  name: "Pella Mosswick",
  title: "Supply Depot Keeper",
  portraitPath: "/images/npcs/town/pella_mosswick_portrait.png",
  profilePath: "/images/backgrounds/market/market_road_interior.png",
  intro: "Pella Mosswick runs the Supply Depot, a crowded little shop stacked with feed sacks, repair kits, tools, gossip, and emergency bundles for ranchers who should have planned better.",
} as const;

const BASE_SUPPLIES: SupplyDepotItem[] = [
  {
    itemId: "feed_bundle",
    name: "Feed Bundle",
    category: "Feed",
    rarity: "Common",
    description: "A practical sack of ranch feed for overnight ranch care.",
    exactEffect: "Adds exactly 5 Feed to Ranch Feed Stock.",
    price: 50,
    iconPath: "/images/items/supply_depot/feed_bundle.png",
    purchaseLabel: "+5 Feed",
    quantityLabel: "5 Feed",
    storageLabel: "Ranch Feed Stock",
    usageLabel: "Adds 5 Feed. Feed is consumed automatically during overnight ranch feeding.",
    stockFlag: SUPPLY_DEPOT_FLAGS.feed,
    confirmationRequired: false,
  },
  {
    itemId: "material_crate",
    name: "Material Crate",
    category: "Materials",
    rarity: "Common",
    description: "Boards, nails, rope, patch cloth, and other repair basics.",
    exactEffect: "Adds exactly 5 Materials to Ranch Material Stock.",
    price: 75,
    iconPath: "/images/items/supply_depot/material_crate.png",
    purchaseLabel: "+5 Materials",
    quantityLabel: "5 Materials",
    storageLabel: "Ranch Material Stock",
    usageLabel: "Adds 5 Materials for Ranch Office construction, habitat upgrades, nursery upgrades, chores, and repairs.",
    stockFlag: SUPPLY_DEPOT_FLAGS.materials,
    confirmationRequired: false,
  },
  {
    itemId: "repair_kit",
    name: "Repair Kit",
    category: "Repair",
    rarity: "Uncommon",
    description: "A bundled kit for ranch damage and emergency systems.",
    exactEffect: "Provides one Repair Kit. Ranch Office repairs consume a kit before loose Materials.",
    price: 120,
    iconPath: "/images/items/supply_depot/repair_kit.png",
    purchaseLabel: "+1 Repair Kit",
    quantityLabel: "1 Kit",
    storageLabel: "Ranch Repair Kit Stock",
    usageLabel: "Consumed first by Ranch Office manual repairs. Repairs fall back to loose Materials when no kit is owned.",
    stockFlag: SUPPLY_DEPOT_FLAGS.repairKits,
    confirmationRequired: false,
  },
  {
    itemId: "nursery_supply_kit",
    name: "Nursery Supply Kit",
    category: "Nursery",
    rarity: "Uncommon",
    description: "Clean bedding, record tags, soothing oils, and egg-care basics.",
    exactEffect: "Provides one Nursery Supply Kit for Egg Atelier services and nursery upgrades.",
    price: 150,
    iconPath: "/images/items/supply_depot/nursery_supply_kit.png",
    purchaseLabel: "+1 Nursery Supply",
    quantityLabel: "1 Kit",
    storageLabel: "Nursery Supply Kit Stock",
    usageLabel: "Spent by Egg Atelier services and nursery improvements.",
    stockFlag: SUPPLY_DEPOT_FLAGS.nurserySupplyKits,
    confirmationRequired: false,
  },
];

const BREEDING_ITEM_PRICES: Record<BreedingSupportItemId, number> = {
  energy_snack: 90,
  energy_meal: 180,
  fertility_tonic: 180,
  affection_treat: 75,
  recovery_balm: 130,
  trait_stabilizer: 350,
  mutation_catalyst: 500,
  gestation_tonic: 260,
};

function supportStorageLabel(itemId: BreedingSupportItemId): string {
  if (itemId === "fertility_tonic" || itemId === "trait_stabilizer" || itemId === "mutation_catalyst") return "Breeding Support Stock";
  if (itemId === "gestation_tonic") return "Pregnancy Care Stock";
  return "Player Inventory";
}

const SUPPORT_SUPPLIES: SupplyDepotItem[] = BREEDING_SUPPORT_ITEMS.map((item) => ({
  itemId: item.itemId,
  name: item.name,
  category: item.category,
  rarity: item.rarity,
  description: item.description,
  exactEffect: item.exactEffect,
  price: BREEDING_ITEM_PRICES[item.itemId],
  iconPath: item.iconPath,
  purchaseLabel: `+1 ${item.name}`,
  quantityLabel: `1 ${item.name}`,
  storageLabel: supportStorageLabel(item.itemId),
  usageLabel: item.exactEffect,
  stockFlag: item.stockFlag,
  confirmationRequired: item.confirmationRequired,
}));

export const SUPPLY_DEPOT_ITEMS: SupplyDepotItem[] = [
  ...BASE_SUPPLIES,
  ...SUPPORT_SUPPLIES,
];

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getSupplyDepotCount(save: GameSave, flagKey: string): number {
  return getFlagNumber(save.flags[flagKey]);
}

export function getSupplyDepotSupplyCounts(save: GameSave): SupplyDepotSupplyCounts {
  return {
    feed: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.feed]),
    materials: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.materials]),
    energySnacks: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.energySnacks]),
    energyMeals: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.energyMeals]),
    energySnacksUsed: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.energySnacksUsed]),
    repairKits: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.repairKits]),
    fertilityTonics: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.fertilityTonics]),
    affectionTreats: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.affectionTreats]),
    recoveryBalms: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.recoveryBalms]),
    traitStabilizers: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.traitStabilizers]),
    mutationCatalysts: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.mutationCatalysts]),
    gestationTonics: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.gestationTonics]),
    nurserySupplyKits: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.nurserySupplyKits]),
  };
}

export function getSupplyDepotItem(itemId: string): SupplyDepotItem | null {
  return SUPPLY_DEPOT_ITEMS.find((item) => item.itemId === itemId) ?? null;
}

export function getSupplyDepotPrice(save: GameSave, item: SupplyDepotItem): number {
  return Math.max(1, Math.round((item.price * getPellaSupplyPriceMultiplier(save)) / 5) * 5);
}

export function getSupplyDepotStockLabel(save: GameSave): string {
  const counts = getSupplyDepotSupplyCounts(save);
  return `${counts.feed} Feed • ${counts.materials} Materials • ${counts.energySnacks + counts.energyMeals} Energy Items • ${counts.fertilityTonics + counts.traitStabilizers + counts.mutationCatalysts} Breeding Items • ${counts.gestationTonics} Pregnancy Items`;
}

function countForItem(save: GameSave, item: SupplyDepotItem): number {
  if (item.itemId === "feed_bundle") return getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.feed]);
  if (item.itemId === "material_crate") return getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.materials]);
  if (item.itemId === "repair_kit") return getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.repairKits]);
  if (item.itemId === "nursery_supply_kit") return getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.nurserySupplyKits]);
  return getBreedingSupportItemCount(save, item.itemId);
}

function countLabel(item: SupplyDepotItem, count: number): string {
  if (item.itemId === "feed_bundle") return `${count} Feed`;
  if (item.itemId === "material_crate") return `${count} Materials`;
  if (item.itemId === "repair_kit" || item.itemId === "nursery_supply_kit") return `${count} Kit(s)`;
  return `${count} Owned`;
}

export function getSupplyDepotUsageRows(save: GameSave): Array<{
  item: SupplyDepotItem;
  countLabel: string;
  storageLabel: string;
  usageLabel: string;
  activeLabel?: string;
}> {
  return SUPPLY_DEPOT_ITEMS.map((item) => {
    const count = countForItem(save, item);
    const supportItem = getBreedingSupportItem(item.itemId);
    const active = supportItem?.activeFlag
      ? getBreedingSupportItemActiveCount(save, supportItem.itemId)
      : 0;
    return {
      item,
      countLabel: countLabel(item, count),
      storageLabel: item.storageLabel,
      usageLabel: item.usageLabel,
      activeLabel: active > 0 ? "Armed" : undefined,
    };
  });
}

export function useSupplyDepotEnergySnack(save: GameSave): SupplyDepotUseResult {
  const result = useBreedingSupportItem(save, "energy_snack", {
    source: "inventory",
    targetId: "player",
  });
  if (!result.ok) return result;
  return {
    ...result,
    save: {
      ...result.save,
      flags: {
        ...result.save.flags,
        supplyDepotEnergySnacksUsed: getFlagNumber(save.flags.supplyDepotEnergySnacksUsed) + 1,
        m44EnergySnackUsed: true,
      },
    },
  };
}

export function useSupplyDepotEnergySnackOnCreature(save: GameSave, creatureId: string): SupplyDepotUseResult {
  const result = useBreedingSupportItem(save, "energy_snack", {
    source: "inventory",
    targetId: creatureId,
  });
  if (!result.ok) return result;
  return {
    ...result,
    save: {
      ...result.save,
      flags: {
        ...result.save.flags,
        supplyDepotEnergySnacksUsed: getFlagNumber(save.flags.supplyDepotEnergySnacksUsed) + 1,
        m58EnergySnackUsedOnCreature: true,
        lastEnergySnackCreatureId: creatureId,
      },
    },
  };
}

export function purchaseSupplyDepotItem(save: GameSave, itemId: string): SupplyDepotPurchaseResult {
  const item = getSupplyDepotItem(itemId);
  if (!item) return { save, ok: false, message: "Pella cannot find that item on the shelf." };
  const price = getSupplyDepotPrice(save, item);
  if (save.currencies.gold < price) return { save, ok: false, message: `Not enough Gold for ${item.name}. Need ${price} Gold.` };

  const nextFlags: GameSave["flags"] = {
    ...save.flags,
    m35SupplyDepotUnlocked: true,
    pellaMosswickIntroduced: true,
  };
  let amount = 1;
  if (item.itemId === "feed_bundle" || item.itemId === "material_crate") amount = 5;
  nextFlags[item.stockFlag] = getFlagNumber(save.flags[item.stockFlag]) + amount;

  const purchasedSave: GameSave = {
    ...save,
    updatedAt: new Date().toISOString(),
    currencies: { ...save.currencies, gold: save.currencies.gold - price },
    flags: nextFlags,
  };
  const trustedSave = grantNpcTrust(
    purchasedSave,
    "pella_mosswick",
    item.category === "Breeding" || item.category === "Pregnancy" || item.category === "Nursery" ? 3 : 2,
  );
  return {
    save: trustedSave,
    ok: true,
    message: `Bought ${item.name} from Pella for ${price} Gold. ${item.purchaseLabel} added to ${item.storageLabel}. Pella Trust increased.`,
  };
}
