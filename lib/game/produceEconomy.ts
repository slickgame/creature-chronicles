import {
  type CropQuality,
  CROP_QUALITY_DATA,
} from "@/lib/game/farming";
import { ITEM_DATA } from "@/lib/items/itemData";

export type ProduceQualityInventoryState = Record<string, Partial<Record<CropQuality, number>>>;

export type QualitySellQuote = {
  itemId: string;
  quality: CropQuality;
  quantity: number;
  basePrice: number;
  qualityMultiplier: number;
  demandMultiplier: number;
  unitPrice: number;
  totalValue: number;
};

export const CROP_QUALITY_ORDER: CropQuality[] = [
  "standard",
  "fine",
  "lush",
  "pristine",
];

export function normalizeProduceQualityInventory(
  inventory?: ProduceQualityInventoryState
): ProduceQualityInventoryState {
  if (!inventory || typeof inventory !== "object") return {};

  const normalized: ProduceQualityInventoryState = {};

  for (const [itemId, qualityCounts] of Object.entries(inventory)) {
    if (!qualityCounts || typeof qualityCounts !== "object") continue;

    for (const quality of CROP_QUALITY_ORDER) {
      const count = qualityCounts[quality];
      if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) continue;

      normalized[itemId] = {
        ...(normalized[itemId] ?? {}),
        [quality]: Math.floor(count),
      };
    }
  }

  return normalized;
}

export function addQualityProduceToInventory(
  inventory: ProduceQualityInventoryState,
  itemId: string,
  quality: CropQuality,
  quantity: number
): ProduceQualityInventoryState {
  if (quantity <= 0) return inventory;

  return {
    ...inventory,
    [itemId]: {
      ...(inventory[itemId] ?? {}),
      [quality]: (inventory[itemId]?.[quality] ?? 0) + quantity,
    },
  };
}

export function removeQualityProduceFromInventory(
  inventory: ProduceQualityInventoryState,
  itemId: string,
  quality: CropQuality,
  quantity: number
): ProduceQualityInventoryState {
  if (quantity <= 0) return inventory;

  const currentItem = inventory[itemId];
  if (!currentItem) return inventory;

  const currentQualityCount = currentItem[quality] ?? 0;
  const nextQualityCount = Math.max(0, currentQualityCount - quantity);
  const nextItem = { ...currentItem };

  if (nextQualityCount <= 0) {
    delete nextItem[quality];
  } else {
    nextItem[quality] = nextQualityCount;
  }

  if (Object.values(nextItem).some((count) => (count ?? 0) > 0)) {
    return {
      ...inventory,
      [itemId]: nextItem,
    };
  }

  const rest = { ...inventory };
  delete rest[itemId];
  return rest;
}

export function getQualityProduceCount(
  inventory: ProduceQualityInventoryState,
  baseInventory: Record<string, number>,
  itemId: string,
  quality: CropQuality
) {
  const trackedCount = inventory[itemId]?.[quality] ?? 0;
  if (quality !== "standard") return trackedCount;

  const totalTrackedCount = CROP_QUALITY_ORDER.reduce(
    (sum, entry) => sum + (inventory[itemId]?.[entry] ?? 0),
    0
  );
  const untrackedStandardCount = Math.max(0, (baseInventory[itemId] ?? 0) - totalTrackedCount);

  return trackedCount + untrackedStandardCount;
}

export function getQualitySellQuote(
  itemId: string,
  quality: CropQuality,
  quantity: number,
  demandMultiplier: number
): QualitySellQuote | null {
  const item = ITEM_DATA[itemId];
  const qualityInfo = CROP_QUALITY_DATA[quality];
  if (!item || quantity <= 0) return null;

  const unitPrice = Math.max(
    1,
    Math.round(item.sellValue * qualityInfo.valueMultiplier * demandMultiplier)
  );

  return {
    itemId,
    quality,
    quantity,
    basePrice: item.sellValue,
    qualityMultiplier: qualityInfo.valueMultiplier,
    demandMultiplier,
    unitPrice,
    totalValue: unitPrice * quantity,
  };
}
