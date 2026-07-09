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
};

export type SupplyDepotPurchaseResult = { save: GameSave; ok: boolean; message: string };

export const PELLA_MOSSWICK = {
  npcId: "pella_mosswick",
  name: "Pella Mosswick",
  title: "Supply Depot Keeper",
  portraitPath: "/images/npcs/town/pella_mosswick_portrait.png",
  profilePath: "/images/backgrounds/market/market_road_interior.png",
  intro: "Pella Mosswick runs the Supply Depot, a crowded little shop stacked with feed sacks, repair kits, tools, gossip, and emergency bundles for ranchers who should have planned better.",
} as const;

export const SUPPLY_DEPOT_ITEMS: SupplyDepotItem[] = [
  { itemId: "feed_bundle", name: "Feed Bundle", category: "Feed", description: "A practical sack of ranch feed. Adds directly to your ranch feed stock.", price: 50, iconPath: "/images/items/supply_depot/feed_bundle.png", purchaseLabel: "+5 Feed", quantityLabel: "5 Feed" },
  { itemId: "material_crate", name: "Material Crate", category: "Materials", description: "Boards, nails, rope, patch cloth, and other repair basics. Adds directly to your material stock.", price: 75, iconPath: "/images/items/supply_depot/material_crate.png", purchaseLabel: "+5 Materials", quantityLabel: "5 Materials" },
  { itemId: "energy_snack", name: "Energy Snack", category: "Energy", description: "A shelf-stable snack for long ranch days. Restores a small amount of player energy immediately.", price: 90, iconPath: "/images/items/supply_depot/energy_snack.png", purchaseLabel: "+12 Energy", quantityLabel: "12 Energy" },
  { itemId: "repair_kit", name: "Repair Kit", category: "Repair", description: "A bundled kit for future repair and emergency systems. Stored as depot stock for now.", price: 120, iconPath: "/images/items/supply_depot/repair_kit.png", purchaseLabel: "+1 Repair Kit", quantityLabel: "1 Kit" },
  { itemId: "fertility_tonic", name: "Fertility Tonic", category: "Breeding", description: "A careful breeding support tonic. One is consumed automatically on the next valid breeding attempt for +12% pregnancy chance.", price: 180, iconPath: "/images/items/supply_depot/fertility_tonic.png", purchaseLabel: "+1 Fertility Tonic", quantityLabel: "1 Tonic" },
  { itemId: "nursery_supply_kit", name: "Nursery Supply Kit", category: "Nursery", description: "Clean bedding, record tags, soothing oils, and egg-care basics. Stored for future nursery upgrades and events.", price: 150, iconPath: "/images/items/supply_depot/nursery_supply_kit.png", purchaseLabel: "+1 Nursery Supply", quantityLabel: "1 Kit" },
];

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getSupplyDepotCount(save: GameSave, flagKey: string): number {
  return getFlagNumber(save.flags[flagKey]);
}

export function getSupplyDepotItem(itemId: string): SupplyDepotItem | null {
  return SUPPLY_DEPOT_ITEMS.find((item) => item.itemId === itemId) ?? null;
}

export function getSupplyDepotPrice(save: GameSave, item: SupplyDepotItem): number {
  return Math.max(1, Math.round((item.price * getPellaSupplyPriceMultiplier(save)) / 5) * 5);
}

export function getSupplyDepotStockLabel(save: GameSave): string {
  const feed = getFlagNumber(save.flags.ranchFeedStock);
  const materials = getFlagNumber(save.flags.ranchMaterialsStock);
  const kits = getFlagNumber(save.flags.ranchRepairKits);
  const tonics = getFlagNumber(save.flags.breedingFertilityTonics);
  const nursery = getFlagNumber(save.flags.nurserySupplyKits);
  return `${feed} Feed • ${materials} Materials • ${kits} Repair Kits • ${tonics} Tonics • ${nursery} Nursery Kits`;
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
    message += " Ranch feed stock increased by 5.";
  } else if (item.itemId === "material_crate") {
    nextFlags.ranchMaterialsStock = getFlagNumber(save.flags.ranchMaterialsStock) + 5;
    message += " Ranch materials increased by 5.";
  } else if (item.itemId === "energy_snack") {
    nextCurrencies = { ...nextCurrencies, energy: Math.min(save.currencies.maxEnergy, save.currencies.energy + 12) };
    message += " Player energy restored by 12.";
  } else if (item.itemId === "repair_kit") {
    nextFlags.ranchRepairKits = getFlagNumber(save.flags.ranchRepairKits) + 1;
    message += " Repair kit stock increased by 1.";
  } else if (item.itemId === "fertility_tonic") {
    nextFlags.breedingFertilityTonics = getFlagNumber(save.flags.breedingFertilityTonics) + 1;
    message += " The next valid breeding attempt can consume one tonic for +12% pregnancy chance.";
  } else if (item.itemId === "nursery_supply_kit") {
    nextFlags.nurserySupplyKits = getFlagNumber(save.flags.nurserySupplyKits) + 1;
    message += " Nursery supply stock increased by 1.";
  }

  const purchasedSave: GameSave = { ...save, updatedAt: new Date().toISOString(), currencies: nextCurrencies, flags: nextFlags };
  const trustedSave = grantNpcTrust(purchasedSave, "pella_mosswick", item.category === "Breeding" || item.category === "Nursery" ? 3 : 2);
  return {
    save: trustedSave,
    ok: true,
    message: `${message} Pella Trust increased.`,
  };
}



