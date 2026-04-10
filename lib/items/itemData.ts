export type ItemCategory =
  | "food"
  | "ingredient"
  | "seed"
  | "material"
  | "medicine"
  | "recipe_book"
  | "misc";

export type ItemUseTag =
  | "edible"
  | "cookable"
  | "plantable"
  | "recipe_component"
  | "sellable"
  | "giftable"
  | "healing"
  | "stamina_restore"
  | "mood_boost"
  | "fertility_support";

export type TaskBonusType = "house" | "fields" | "barn" | "nursery" | "breeding";

export type ItemEffect = {
  staminaRestore?: number;
  happinessGain?: number;
  energyRestore?: number;
  fertilityBoost?: number;
  breedingRecoveryBoost?: number;
  taskBonus?: {
    taskType: TaskBonusType;
    amount: number;
    durationTasks: number;
  };
};

export type ItemData = {
  id: string;
  name: string;
  category: ItemCategory;
  useTags: ItemUseTag[];
  description: string;
  sellValue: number;
  buyValue?: number;
  stackLimit?: number;
  edibleEffects?: ItemEffect;
  recipeIngredientFor?: string[];
  recipeUnlockIds?: string[];
  seedData?: {
    cropId: string;
    growDays: number;
    minYield: number;
    maxYield: number;
  };
};

export const ITEM_DATA: Record<string, ItemData> = {
  wheat: {
    id: "wheat",
    name: "Wheat",
    category: "ingredient",
    useTags: ["cookable", "recipe_component", "sellable"],
    description: "A staple grain used in breads, porridges, and pie crusts.",
    sellValue: 4,
    recipeIngredientFor: ["bread", "porridge", "apple_pie"],
  },
  carrot: {
    id: "carrot",
    name: "Carrot",
    category: "food",
    useTags: ["edible", "cookable", "recipe_component", "sellable"],
    description: "A crunchy root vegetable. Simple on its own, better in a pot.",
    sellValue: 5,
    edibleEffects: {
      staminaRestore: 2,
    },
    recipeIngredientFor: ["farm_salad", "vegetable_soup", "hearty_stew"],
  },
  potato: {
    id: "potato",
    name: "Potato",
    category: "ingredient",
    useTags: ["cookable", "recipe_component", "sellable"],
    description: "Dense, filling, and perfect for hearty farmhouse meals.",
    sellValue: 5,
    recipeIngredientFor: ["vegetable_soup", "hearty_stew"],
  },
  lettuce: {
    id: "lettuce",
    name: "Lettuce",
    category: "food",
    useTags: ["edible", "cookable", "recipe_component", "sellable"],
    description: "A crisp leaf crop that keeps meals light and fresh.",
    sellValue: 4,
    edibleEffects: {
      staminaRestore: 1,
      happinessGain: 1,
    },
    recipeIngredientFor: ["farm_salad"],
  },
  apple: {
    id: "apple",
    name: "Apple",
    category: "food",
    useTags: ["edible", "cookable", "recipe_component", "sellable", "giftable"],
    description: "Sweet, bright, and tempting enough to eat raw or bake into something worth craving.",
    sellValue: 6,
    edibleEffects: {
      staminaRestore: 3,
      happinessGain: 2,
    },
    recipeIngredientFor: ["apple_pie"],
  },
  berry: {
    id: "berry",
    name: "Berry",
    category: "food",
    useTags: ["edible", "cookable", "recipe_component", "sellable", "giftable"],
    description: "Small and juicy. Easy to snack on, better folded into sweets.",
    sellValue: 6,
    edibleEffects: {
      staminaRestore: 2,
      happinessGain: 3,
    },
    recipeIngredientFor: ["berry_tart"],
  },
  milk: {
    id: "milk",
    name: "Fresh Milk",
    category: "food",
    useTags: ["edible", "cookable", "recipe_component", "sellable", "fertility_support"],
    description: "A creamy staple that soothes the nerves and supports recovery.",
    sellValue: 8,
    edibleEffects: {
      happinessGain: 4,
      breedingRecoveryBoost: 2,
    },
    recipeIngredientFor: ["warm_milk", "hearty_stew"],
  },
  egg_ingredient: {
    id: "egg_ingredient",
    name: "Farm Egg",
    category: "ingredient",
    useTags: ["cookable", "recipe_component", "sellable"],
    description: "A rich kitchen ingredient collected from the coop.",
    sellValue: 7,
    recipeIngredientFor: ["berry_tart"],
  },

  bread: {
    id: "bread",
    name: "Bread",
    category: "food",
    useTags: ["edible", "sellable", "giftable", "stamina_restore"],
    description: "Warm bread with enough substance to keep a long day moving.",
    sellValue: 12,
    edibleEffects: {
      staminaRestore: 6,
    },
  },
  porridge: {
    id: "porridge",
    name: "Porridge",
    category: "food",
    useTags: ["edible", "sellable", "stamina_restore"],
    description: "Soft, filling, and dependable. Not glamorous, but it does the job.",
    sellValue: 13,
    edibleEffects: {
      staminaRestore: 8,
      happinessGain: 2,
    },
  },
  farm_salad: {
    id: "farm_salad",
    name: "Farm Salad",
    category: "food",
    useTags: ["edible", "sellable", "mood_boost"],
    description: "Fresh produce tossed into a bright, clean meal.",
    sellValue: 15,
    edibleEffects: {
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
    category: "food",
    useTags: ["edible", "sellable", "stamina_restore"],
    description: "A steady bowl of warmth that settles the body and clears the head.",
    sellValue: 17,
    edibleEffects: {
      staminaRestore: 10,
    },
  },
  hearty_stew: {
    id: "hearty_stew",
    name: "Hearty Stew",
    category: "food",
    useTags: ["edible", "sellable", "stamina_restore"],
    description: "Thick, rich, and deeply satisfying. The sort of meal that makes hard work feel worth it.",
    sellValue: 22,
    edibleEffects: {
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
    category: "food",
    useTags: ["edible", "sellable", "mood_boost", "fertility_support"],
    description: "Comfort in a cup. Soft, soothing, and quietly intimate.",
    sellValue: 14,
    edibleEffects: {
      happinessGain: 6,
      breedingRecoveryBoost: 3,
      fertilityBoost: 1,
    },
  },
  apple_pie: {
    id: "apple_pie",
    name: "Apple Pie",
    category: "food",
    useTags: ["edible", "sellable", "giftable", "mood_boost"],
    description: "Flaky, warm, and almost unfairly inviting. A proper reward after a long day.",
    sellValue: 24,
    edibleEffects: {
      staminaRestore: 8,
      happinessGain: 10,
    },
  },
  berry_tart: {
    id: "berry_tart",
    name: "Berry Tart",
    category: "food",
    useTags: ["edible", "sellable", "giftable", "mood_boost"],
    description: "Sweet, sharp, and pretty enough to make an impression before the first bite.",
    sellValue: 23,
    edibleEffects: {
      staminaRestore: 6,
      happinessGain: 8,
    },
  },

  wheat_seed: {
    id: "wheat_seed",
    name: "Wheat Seed",
    category: "seed",
    useTags: ["plantable", "sellable"],
    description: "A simple starter grain that grows quickly and pays for itself easily.",
    sellValue: 2,
    buyValue: 4,
    seedData: {
      cropId: "wheat",
      growDays: 2,
      minYield: 2,
      maxYield: 4,
    },
  },
  carrot_seed: {
    id: "carrot_seed",
    name: "Carrot Seed",
    category: "seed",
    useTags: ["plantable", "sellable"],
    description: "A reliable root crop with good kitchen value.",
    sellValue: 2,
    buyValue: 5,
    seedData: {
      cropId: "carrot",
      growDays: 2,
      minYield: 2,
      maxYield: 5,
    },
  },
  potato_seed: {
    id: "potato_seed",
    name: "Potato Seed",
    category: "seed",
    useTags: ["plantable", "sellable"],
    description: "A hearty staple crop that turns into strong meals.",
    sellValue: 3,
    buyValue: 6,
    seedData: {
      cropId: "potato",
      growDays: 3,
      minYield: 2,
      maxYield: 4,
    },
  },
  lettuce_seed: {
    id: "lettuce_seed",
    name: "Lettuce Seed",
    category: "seed",
    useTags: ["plantable", "sellable"],
    description: "Quick to grow and ideal for fresh, lighter meals.",
    sellValue: 2,
    buyValue: 4,
    seedData: {
      cropId: "lettuce",
      growDays: 2,
      minYield: 2,
      maxYield: 4,
    },
  },
  apple_seed: {
    id: "apple_seed",
    name: "Apple Seed",
    category: "seed",
    useTags: ["plantable", "sellable"],
    description: "A slower fruit seed that pays off in sweeter harvests.",
    sellValue: 3,
    buyValue: 7,
    seedData: {
      cropId: "apple",
      growDays: 3,
      minYield: 2,
      maxYield: 4,
    },
  },
  berry_seed: {
    id: "berry_seed",
    name: "Berry Seed",
    category: "seed",
    useTags: ["plantable", "sellable"],
    description: "Fast-growing and charmingly profitable.",
    sellValue: 3,
    buyValue: 7,
    seedData: {
      cropId: "berry",
      growDays: 3,
      minYield: 2,
      maxYield: 5,
    },
  },

  recipe_book_home_cooking_1: {
    id: "recipe_book_home_cooking_1",
    name: "Recipe Book: Home Cooking Vol. 1",
    category: "recipe_book",
    useTags: ["sellable"],
    description: "A soft little collection of beginner farmhouse staples.",
    sellValue: 30,
    buyValue: 60,
    recipeUnlockIds: ["bread", "porridge", "farm_salad"],
  },
  recipe_book_sweets_1: {
    id: "recipe_book_sweets_1",
    name: "Recipe Book: Sweets Vol. 1",
    category: "recipe_book",
    useTags: ["sellable", "giftable"],
    description: "Desserts worth making when you want to be remembered.",
    sellValue: 40,
    buyValue: 80,
    recipeUnlockIds: ["apple_pie", "berry_tart"],
  },
  recipe_book_hearty_meals_1: {
    id: "recipe_book_hearty_meals_1",
    name: "Recipe Book: Hearty Meals Vol. 1",
    category: "recipe_book",
    useTags: ["sellable"],
    description: "Rich soups and stews for harder work and longer nights.",
    sellValue: 45,
    buyValue: 90,
    recipeUnlockIds: ["vegetable_soup", "hearty_stew", "warm_milk"],
  },
};

export const STARTER_SEED_IDS = [
  "wheat_seed",
  "carrot_seed",
  "potato_seed",
  "lettuce_seed",
  "apple_seed",
  "berry_seed",
] as const;

export const STARTER_RECIPE_BOOK_IDS = [
  "recipe_book_home_cooking_1",
  "recipe_book_sweets_1",
  "recipe_book_hearty_meals_1",
] as const;
