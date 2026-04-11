import type { RecipeIngredient } from "@/lib/cooking/recipeData";
import {
  CROP_QUALITY_DATA,
  type CropQuality,
} from "@/lib/game/farming";
import {
  CROP_QUALITY_ORDER,
  type ProduceQualityInventoryState,
  getQualityProduceCount,
  removeQualityProduceFromInventory,
} from "@/lib/game/produceEconomy";
import type { ItemEffect } from "@/lib/items/itemData";

export type QualityIngredientUse = {
  itemId: string;
  quality: CropQuality;
  quantity: number;
};

export type QualityIngredientPlan = {
  uses: QualityIngredientUse[];
  outputQuality: CropQuality;
  averageQualityScore: number;
};

const QUALITY_SCORE: Record<CropQuality, number> = {
  standard: 0,
  fine: 1,
  lush: 2,
  pristine: 3,
};

const SCORE_TO_QUALITY: CropQuality[] = ["standard", "fine", "lush", "pristine"];

const QUALITY_DESCENDING = [...CROP_QUALITY_ORDER].reverse();

export function formatQualityLabel(quality: CropQuality) {
  return CROP_QUALITY_DATA[quality].label;
}

export function buildQualityIngredientPlan(
  qualityInventory: ProduceQualityInventoryState,
  baseInventory: Record<string, number>,
  ingredients: RecipeIngredient[]
): QualityIngredientPlan | null {
  const uses: QualityIngredientUse[] = [];

  for (const ingredient of ingredients) {
    let remaining = ingredient.quantity;

    for (const quality of QUALITY_DESCENDING) {
      if (remaining <= 0) break;

      const available = getQualityProduceCount(
        qualityInventory,
        baseInventory,
        ingredient.itemId,
        quality
      );
      const quantity = Math.min(remaining, available);

      if (quantity > 0) {
        uses.push({
          itemId: ingredient.itemId,
          quality,
          quantity,
        });
        remaining -= quantity;
      }
    }

    if (remaining > 0) return null;
  }

  const totalQuantity = uses.reduce((sum, use) => sum + use.quantity, 0);
  const averageQualityScore =
    totalQuantity > 0
      ? uses.reduce((sum, use) => sum + QUALITY_SCORE[use.quality] * use.quantity, 0) / totalQuantity
      : 0;
  const outputQuality = SCORE_TO_QUALITY[Math.max(0, Math.min(3, Math.round(averageQualityScore)))];

  return {
    uses,
    outputQuality,
    averageQualityScore,
  };
}

export function removeQualityIngredientUses(
  qualityInventory: ProduceQualityInventoryState,
  uses: QualityIngredientUse[]
): ProduceQualityInventoryState {
  return uses.reduce(
    (nextInventory, use) =>
      removeQualityProduceFromInventory(
        nextInventory,
        use.itemId,
        use.quality,
        use.quantity
      ),
    qualityInventory
  );
}

export function describeQualityIngredientPlan(plan: QualityIngredientPlan) {
  return CROP_QUALITY_ORDER
    .map((quality) => {
      const count = plan.uses
        .filter((use) => use.quality === quality)
        .reduce((sum, use) => sum + use.quantity, 0);
      return count > 0 ? `${count} ${formatQualityLabel(quality)}` : null;
    })
    .filter(Boolean)
    .join(", ");
}

function scaleEffectValue(value: number | undefined, quality: CropQuality) {
  if (value === undefined) return undefined;
  if (quality === "standard") return value;

  const multiplier = CROP_QUALITY_DATA[quality].valueMultiplier;
  return Math.max(value, Math.round(value * multiplier));
}

export function getQualityAdjustedItemEffects(
  effects: ItemEffect | undefined,
  quality: CropQuality
): ItemEffect | undefined {
  if (!effects) return undefined;
  if (quality === "standard") return effects;

  return {
    ...effects,
    staminaRestore: scaleEffectValue(effects.staminaRestore, quality),
    happinessGain: scaleEffectValue(effects.happinessGain, quality),
    energyRestore: scaleEffectValue(effects.energyRestore, quality),
    breedingRecoveryBoost: scaleEffectValue(effects.breedingRecoveryBoost, quality),
    fertilityBoost: effects.fertilityBoost === undefined
      ? undefined
      : Math.max(
          effects.fertilityBoost,
          Math.round(
            effects.fertilityBoost *
              (1 + (CROP_QUALITY_DATA[quality].valueMultiplier - 1) / 2)
          )
        ),
    taskBonus: effects.taskBonus
      ? {
          ...effects.taskBonus,
          amount:
            quality === "lush" || quality === "pristine"
              ? effects.taskBonus.amount + 1
              : effects.taskBonus.amount,
        }
      : undefined,
  };
}
