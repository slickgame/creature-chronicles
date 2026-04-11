import { ITEM_DATA } from "@/lib/items/itemData";

export type InventoryCategory = "all" | "seeds" | "ingredients" | "food" | "books" | "other";

export function getInventoryCategory(itemId: string): Exclude<InventoryCategory, "all"> {
  if (itemId.endsWith("_seed")) return "seeds";
  if (itemId.startsWith("recipe_book_")) return "books";
  if (
    [
      "apple_pie",
      "berry_tart",
      "hearty_stew",
      "warm_milk",
      "bread",
      "vegetable_soup",
      "porridge",
      "farm_salad",
    ].includes(itemId)
  ) {
    return "food";
  }

  const item = ITEM_DATA[itemId];
  if (item?.category === "ingredient") return "ingredients";
  if (item?.category === "recipe_book") return "books";
  if (item?.category === "food") return "food";
  return "other";
}

export function getCategoryLabel(category: InventoryCategory) {
  if (category === "all") return "All";
  if (category === "seeds") return "Seeds";
  if (category === "ingredients") return "Ingredients";
  if (category === "food") return "Cooked Food";
  if (category === "books") return "Recipe Books";
  return "Other";
}

export function getUseHint(itemId: string) {
  const item = ITEM_DATA[itemId];

  if (item?.useTags.includes("edible")) {
    return "Usable now from Inventory";
  }

  if (itemId.endsWith("_seed")) {
    return "Plant from Ranch Fields";
  }

  if (item?.category === "recipe_book") {
    return "Used automatically when purchased";
  }

  if (item?.category === "ingredient") {
    return "Used for cooking recipes";
  }

  return "No direct action yet";
}

export function getItemEffectSummary(itemId: string) {
  const item = ITEM_DATA[itemId];
  const effects = item?.edibleEffects;
  if (!effects) return null;

  const parts: string[] = [];
  if (effects.energyRestore) parts.push(`Energy +${effects.energyRestore}`);
  if (effects.staminaRestore) parts.push(`Stamina +${effects.staminaRestore}`);
  if (effects.breedingRecoveryBoost) {
    parts.push(`Breeding Recovery +${effects.breedingRecoveryBoost}`);
  }
  if (effects.happinessGain) parts.push(`Happiness +${effects.happinessGain}`);
  if (effects.fertilityBoost) parts.push(`Fertility +${effects.fertilityBoost}`);
  if (effects.taskBonus) {
    parts.push(
      `${effects.taskBonus.taskType} bonus +${effects.taskBonus.amount} for ${effects.taskBonus.durationTasks} task(s)`
    );
  }

  return parts.length > 0 ? parts.join(" • ") : null;
}
