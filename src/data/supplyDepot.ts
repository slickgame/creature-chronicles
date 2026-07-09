import { getPellaSupplyPriceMultiplier, grantNpcTrust } from "@/data/townNpcs";
import type { GameSave } from "@/types/save";

export type SupplyDepotItemId = "feed_bundle" | "material_crate" | "energy_snack" | "repair_kit" | "fertility_tonic" | "nursery_supply_kit";
export type SupplyDepotItem = {
  itemId: SupplyDepotItemId;
  name: string;
  category: "Feed" | "Materials" | "Energy" | "Repair" | "Breeding" | "Nursery";
  description: string;
  price: number;
  iconPath: string;
  purchaseLabel: string;
  quantityLabel: string;
  storageLabel: string;
  usageLabel: string;
};

export type SupplyDepotPurchaseResult = { save: GameSave; ok: boolean; message: string };
export type SupplyDepotSupplyCounts = {
  feed: number;
  materials: number;
  energySnacksUsed: number;
  repairKits: number;
  fertilityTonics: number;
  nurserySupplyKits: number;
};

export const SUPPLY_DEPOT_FLAGS = {
  feed: "ranchFeedStock",
  materials: "ranchMaterialsStock",
  energySnacksUsed: "supplyDepotEnergySnacksUsed",
  repairKits: "ranchRepairKits",
  fertilityTonics: "breedingFertilityTonics",
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

export const SUPPLY_DEPOT_ITEMS: SupplyDepotItem[] = [
  {
    itemId: "feed_bundle",
    name: "Feed Bundle",
    category: "Feed",
    description: "A practical sack of ranch feed. Stored in Feed Stock and consumed automatically during overnight ranch feeding.",
    price: 50,
    iconPath: "/images/items/supply_depot/feed_bundle.png",
    purchaseLabel: "+5 Feed",
    quantityLabel: "5 Feed",
    storageLabel: "Ranch Feed Stock",
    usageLabel: "Used automatically when the ranch processes daily creature feeding after Sleep.",
  },
  {
    itemId: "material_crate",
    name: "Material Crate",
    category: "Materials",
    description: "Boards, nails, rope, patch cloth, and other repair basics. Stored in Materials and spent on Ranch Office upgrades and repairs.",
    price: 75,
    iconPath: "/images/items/supply_depot/material_crate.png",
    purchaseLabel: "+5 Materials",
    quantityLabel: "5 Materials",
    storageLabel: "Ranch Material Stock",
    usageLabel: "Spent by Ranch Office construction, habitat upgrades, nursery upgrades, chore upgrades, and repair actions.",
  },
  {
    itemId: "energy_snack",
    name: "Energy Snack",
    category: "Energy",
    description: "A shelf-stable snack for long ranch days. Consumed immediately on purchase to restore player energy.",
    price: 90,
    iconPath: "/images/items/supply_depot/energy_snack.png",
    purchaseLabel: "+12 Player Energy",
    quantityLabel: "12 Energy",
    storageLabel: "Instant Use",
    usageLabel: "Applied immediately at purchase; it does not create an inventory stack yet.",
  },
  {
    itemId: "repair_kit",
    name: "Repair Kit",
    category: "Repair",
    description: "A bundled kit for ranch damage and emergency systems. Stored as Repair Kit stock for Ranch Office repair integration.",
    price: 120,
    iconPath: "/images/items/supply_depot/repair_kit.png",
    purchaseLabel: "+1 Repair Kit",
    quantityLabel: "1 Kit",
    storageLabel: "Ranch Repair Kit Stock",
    usageLabel: "Stored for ranch repair systems. Next polish pass should let Ranch Office repairs consume kits before loose Materials.",
  },
  {
    itemId: "fertility_tonic",
    name: "Fertility Tonic",
    category: "Breeding",
    description: "A careful breeding support tonic. Stored until the next valid breeding attempt, then consumed for a pregnancy chance bonus.",
    price: 180,
    iconPath: "/images/items/supply_depot/fertility_tonic.png",
    purchaseLabel: "+1 Fertility Tonic",
    quantityLabel: "1 Tonic",
    storageLabel: "Breeding Tonic Stock",
    usageLabel: "Automatically adds +12% pregnancy chance in the Breeding Pen and consumes one tonic on a valid attempt.",
  },
  {
    itemId: "nursery_supply_kit",
    name: "Nursery Supply Kit",
    category: "Nursery",
    description: "Clean bedding, record tags, soothing oils, and egg-care basics. Stored for Egg Atelier services and nursery upgrades.",
    price: 150,
    iconPath: "/images/items/supply_depot/nursery_supply_kit.png",
    purchaseLabel: "+1 Nursery Supply",
    quantityLabel: "1 Kit",
    storageLabel: "Nursery Supply Kit Stock",
    usageLabel: "Spent by Egg Atelier services and furniture/upgrades such as accelerated incubation and egg-care improvements.",
  },
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
    energySnacksUsed: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.energySnacksUsed]),
    repairKits: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.repairKits]),
    fertilityTonics: getFlagNumber(save.flags[SUPPLY_DEPOT_FLAGS.fertilityTonics]),
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
  return `${counts.feed} Feed • ${counts.materials} Materials • ${counts.repairKits} Repair Kits • ${counts.fertilityTonics} Tonics • ${counts.nurserySupplyKits} Nursery Kits`;
}

export function getSupplyDepotUsageRows(save: GameSave): Array<{ item: SupplyDepotItem; countLabel: string; storageLabel: string; usageLabel: string }> {
  const counts = getSupplyDepotSupplyCounts(save);
  return SUPPLY_DEPOT_ITEMS.map((item) => {
    const countLabel = item.itemId === "feed_bundle"
      ? `${counts.feed} Feed`
      : item.itemId === "material_crate"
        ? `${counts.materials} Materials`
        : item.itemId === "energy_snack"
          ? `${counts.energySnacksUsed} used`
          : item.itemId === "repair_kit"
            ? `${counts.repairKits} Kit(s)`
            : item.itemId === "fertility_tonic"
              ? `${counts.fertilityTonics} Tonic(s)`
              : `${counts.nurserySupplyKits} Kit(s)`;

    return {
      item,
      countLabel,
      storageLabel: item.storageLabel,
      usageLabel: item.usageLabel,
    };
  });
}

export function purchaseSupplyDepotItem(save: GameSave, itemId: string): SupplyDepotPurchaseResult {
  const item = getSupplyDepotItem(itemId);
  if (!item) return { save, ok: false, message: "Pella cannot find that item on the shelf." };
  const price = getSupplyDepotPrice(save, item);
  if (save.currencies.gold < price) return { save, ok: false, message: `Not enough Gold for ${item.name}. Need ${price} Gold.` };

  const nextFlags: GameSave["flags"] = { ...save.flags, m35SupplyDepotUnlocked: true, pellaMosswickIntroduced: true };
  let nextCurrencies = { ...save.currencies, gold: save.currencies.gold - price };
  let message = `Bought ${item.name} from Pella for ${price} Gold.`;

  if (item.itemId === "feed_bundle") {
    nextFlags.ranchFeedStock = getFlagNumber(save.flags.ranchFeedStock) + 5;
    message += " Ranch feed stock increased by 5. It will be consumed automatically during overnight feeding.";
  } else if (item.itemId === "material_crate") {
    nextFlags.ranchMaterialsStock = getFlagNumber(save.flags.ranchMaterialsStock) + 5;
    message += " Ranch materials increased by 5 for upgrades and repairs.";
  } else if (item.itemId === "energy_snack") {
    const oldEnergy = save.currencies.energy;
    const newEnergy = Math.min(save.currencies.maxEnergy, save.currencies.energy + 12);
    nextCurrencies = { ...nextCurrencies, energy: newEnergy };
    nextFlags.supplyDepotEnergySnacksUsed = getFlagNumber(save.flags.supplyDepotEnergySnacksUsed) + 1;
    message += ` Player energy restored by ${newEnergy - oldEnergy}. Energy Snacks are instant-use items for now.`;
  } else if (item.itemId === "repair_kit") {
    nextFlags.ranchRepairKits = getFlagNumber(save.flags.ranchRepairKits) + 1;
    message += " Repair kit stock increased by 1 for ranch repair integration.";
  } else if (item.itemId === "fertility_tonic") {
    nextFlags.breedingFertilityTonics = getFlagNumber(save.flags.breedingFertilityTonics) + 1;
    message += " The next valid breeding attempt can consume one tonic for +12% pregnancy chance.";
  } else if (item.itemId === "nursery_supply_kit") {
    nextFlags.nurserySupplyKits = getFlagNumber(save.flags.nurserySupplyKits) + 1;
    message += " Nursery supply stock increased by 1 for Egg Atelier services and upgrades.";
  }

  const purchasedSave: GameSave = { ...save, updatedAt: new Date().toISOString(), currencies: nextCurrencies, flags: nextFlags };
  const trustedSave = grantNpcTrust(purchasedSave, "pella_mosswick", item.category === "Breeding" || item.category === "Nursery" ? 3 : 2);
  return {
    save: trustedSave,
    ok: true,
    message: `${message} Pella Trust increased.`,
  };
}
