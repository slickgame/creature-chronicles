import type { ItemEffect } from "@/lib/items/itemData";

export type RecipeIngredient = {
  itemId: string;
  quantity: number;
};

export type RecipeUnlockType = "default" | "shop" | "relationship" | "event";

export type RecipeData = {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  outputItemId: string;
  outputQuantity: number;
  cookMinutes: number;
  description: string;
  unlockType: RecipeUnlockType;
  unlockValue?: string;
  effectPreview?: ItemEffect;
};

export const RECIPE_DATA: Record<string, RecipeData> = {
  bread: {
    id: "bread",
    name: "Bread",
    ingredients: [{ itemId: "wheat", quantity: 2 }],
    outputItemId: "bread",
    outputQuantity: 1,
    cookMinutes: 30,
    description: "Simple fresh bread with good stamina value.",
    unlockType: "default",
    effectPreview: {
      staminaRestore: 6,
    },
  },
  porridge: {
    id: "porridge",
    name: "Porridge",
    ingredients: [
      { itemId: "wheat", quantity: 2 },
      { itemId: "milk", quantity: 1 },
    ],
    outputItemId: "porridge",
    outputQuantity: 1,
    cookMinutes: 35,
    description: "A warm, easy breakfast that steadies the body.",
    unlockType: "default",
    effectPreview: {
      staminaRestore: 8,
      happinessGain: 2,
    },
  },
  farm_salad: {
    id: "farm_salad",
    name: "Farm Salad",
    ingredients: [
      { itemId: "lettuce", quantity: 1 },
      { itemId: "carrot", quantity: 1 },
    ],
    outputItemId: "farm_salad",
    outputQuantity: 1,
    cookMinutes: 20,
    description: "A crisp, refreshing dish that supports lighter work.",
    unlockType: "default",
    effectPreview: {
      staminaRestore: 5,
      happinessGain: 4,
      taskBonus: {
        taskType: "house",
        amount: 1,
        durationTasks: 1,
      },
    },
  },
  vegetable_soup: {
    id: "vegetable_soup",
    name: "Vegetable Soup",
    ingredients: [
      { itemId: "carrot", quantity: 1 },
      { itemId: "potato", quantity: 1 },
    ],
    outputItemId: "vegetable_soup",
    outputQuantity: 1,
    cookMinutes: 40,
    description: "A solid farmhouse soup that restores steady energy.",
    unlockType: "shop",
    unlockValue: "recipe_book_hearty_meals_1",
    effectPreview: {
      staminaRestore: 10,
    },
  },
  hearty_stew: {
    id: "hearty_stew",
    name: "Hearty Stew",
    ingredients: [
      { itemId: "potato", quantity: 1 },
      { itemId: "carrot", quantity: 1 },
      { itemId: "milk", quantity: 1 },
    ],
    outputItemId: "hearty_stew",
    outputQuantity: 1,
    cookMinutes: 55,
    description: "A richer meal for longer work and heavier tasks.",
    unlockType: "shop",
    unlockValue: "recipe_book_hearty_meals_1",
    effectPreview: {
      staminaRestore: 14,
      taskBonus: {
        taskType: "fields",
        amount: 1,
        durationTasks: 1,
      },
    },
  },
  warm_milk: {
    id: "warm_milk",
    name: "Warm Milk",
    ingredients: [{ itemId: "milk", quantity: 1 }],
    outputItemId: "warm_milk",
    outputQuantity: 1,
    cookMinutes: 10,
    description: "A soothing, intimate little comfort drink.",
    unlockType: "shop",
    unlockValue: "recipe_book_hearty_meals_1",
    effectPreview: {
      happinessGain: 6,
      breedingRecoveryBoost: 3,
      fertilityBoost: 1,
    },
  },
  apple_pie: {
    id: "apple_pie",
    name: "Apple Pie",
    ingredients: [
      { itemId: "apple", quantity: 2 },
      { itemId: "wheat", quantity: 2 },
    ],
    outputItemId: "apple_pie",
    outputQuantity: 1,
    cookMinutes: 50,
    description: "A warm dessert with serious comfort value.",
    unlockType: "shop",
    unlockValue: "recipe_book_sweets_1",
    effectPreview: {
      staminaRestore: 8,
      happinessGain: 10,
    },
  },
  berry_tart: {
    id: "berry_tart",
    name: "Berry Tart",
    ingredients: [
      { itemId: "berry", quantity: 2 },
      { itemId: "wheat", quantity: 1 },
      { itemId: "egg_ingredient", quantity: 1 },
    ],
    outputItemId: "berry_tart",
    outputQuantity: 1,
    cookMinutes: 45,
    description: "Sweet and bright, with enough charm to leave an impression.",
    unlockType: "shop",
    unlockValue: "recipe_book_sweets_1",
    effectPreview: {
      staminaRestore: 6,
      happinessGain: 8,
    },
  },
};

export const DEFAULT_KNOWN_RECIPE_IDS = [
  "bread",
  "porridge",
  "farm_salad",
] as const;
