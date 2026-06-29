import type { GameSave } from "@/types/save";

export type SupplyDepotItemId = "feed_bundle" | "material_crate" | "energy_snack" | "repair_kit";
export type SupplyDepotItem = {
  itemId: SupplyDepotItemId;
  name: string;
  category: "Feed" | "Materials" | "Energy" | "Repair";
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
  profilePath: "/images/npcs/town/pella_mosswick_profile.png",
  intro: "Pella Mosswick runs the Supply Depot, a crowded little shop stacked with feed sacks, repair kits, tools, gossip, and emergency bundles for ranchers who should have planned better.",
} as const;

export const SUPPLY_DEPOT_ITEMS: SupplyDepotItem[] = [
  { itemId: "feed_bundle", name: "Feed Bundle", category: "Feed", description: "A practical sack of ranch feed. Adds directly to your ranch feed stock.", price: 50, iconPath: "/images/ui/icons/icon_feed_bundle.png", purchaseLabel: "+5 Feed", quantityLabel: "5 Feed" },
  { itemId: "material_crate", name: "Material Crate", category: "Materials", description: "Boards, nails, rope, patch cloth, and other repair basics. Adds directly to your material stock.", price: 75, iconPath: "/images/ui/icons/icon_material_crate.png", purchaseLabel: "+5 Materials", quantityLabel: "5 Materials" },
  { itemId: "energy_snack", name: "Energy Snack", category: "Energy", description: "A shelf-stable snack for long ranch days. Restores a small amount of player energy immediately.", price: 90, iconPath: "/images/ui/icons/icon_energy_snack.png", purchaseLabel: "+12 Energy", quantityLabel: "12 Energy" },
  { itemId: "repair_kit", name: "Repair Kit", category: "Repair", description: "A bundled kit for future repair and emergency systems. Stored as depot stock for now.", price: 120, iconPath: "/images/ui/icons/icon_repair_kit.png", purchaseLabel: "+1 Repair Kit", quantityLabel: "1 Kit" },
];

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

export function getSupplyDepotItem(itemId: string): SupplyDepotItem | null {
  return SUPPLY_DEPOT_ITEMS.find((item) => item.itemId === itemId) ?? null;
}

export function getSupplyDepotStockLabel(save: GameSave): string {
  const feed = getFlagNumber(save.flags.ranchFeedStock);
  const materials = getFlagNumber(save.flags.ranchMaterialsStock);
  const kits = getFlagNumber(save.flags.ranchRepairKits);
  return `${feed} Feed • ${materials} Materials • ${kits} Repair Kits`;
}

export function purchaseSupplyDepotItem(save: GameSave, itemId: string): SupplyDepotPurchaseResult {
  const item = getSupplyDepotItem(itemId);
  if (!item) return { save, ok: false, message: "Pella cannot find that item on the shelf." };
  if (save.currencies.gold < item.price) return { save, ok: false, message: `Not enough Gold for ${item.name}. Need ${item.price} Gold.` };

  const nextFlags: GameSave["flags"] = { ...save.flags, m35SupplyDepotUnlocked: true, pellaMosswickIntroduced: true };
  let nextCurrencies = { ...save.currencies, gold: save.currencies.gold - item.price };
  let message = `Bought ${item.name} from Pella for ${item.price} Gold.`;

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
  }

  return {
    save: { ...save, updatedAt: new Date().toISOString(), currencies: nextCurrencies, flags: nextFlags },
    ok: true,
    message,
  };
}
