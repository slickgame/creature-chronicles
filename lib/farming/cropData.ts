export type CropData = {
  id: string;
  name: string;
  seedItemId: string;
  produceItemId: string;
  growDays: number;
  minYield: number;
  maxYield: number;
  description: string;
};

export const CROP_DATA: Record<string, CropData> = {
  wheat: {
    id: "wheat",
    name: "Wheat",
    seedItemId: "wheat_seed",
    produceItemId: "wheat",
    growDays: 2,
    minYield: 2,
    maxYield: 4,
    description: "A dependable staple grain used in bread, porridge, and pastry crusts.",
  },
  carrot: {
    id: "carrot",
    name: "Carrot",
    seedItemId: "carrot_seed",
    produceItemId: "carrot",
    growDays: 2,
    minYield: 2,
    maxYield: 5,
    description: "A quick-growing root crop with direct food and cooking value.",
  },
  potato: {
    id: "potato",
    name: "Potato",
    seedItemId: "potato_seed",
    produceItemId: "potato",
    growDays: 3,
    minYield: 2,
    maxYield: 4,
    description: "A slower, heavier crop that supports richer meals.",
  },
  lettuce: {
    id: "lettuce",
    name: "Lettuce",
    seedItemId: "lettuce_seed",
    produceItemId: "lettuce",
    growDays: 2,
    minYield: 2,
    maxYield: 4,
    description: "A light, fresh crop suited to salads and cleaner meals.",
  },
  apple: {
    id: "apple",
    name: "Apple",
    seedItemId: "apple_seed",
    produceItemId: "apple",
    growDays: 3,
    minYield: 2,
    maxYield: 4,
    description: "A sweeter harvest with good direct-eating and dessert value.",
  },
  berry: {
    id: "berry",
    name: "Berry",
    seedItemId: "berry_seed",
    produceItemId: "berry",
    growDays: 3,
    minYield: 2,
    maxYield: 5,
    description: "A charming fruit crop with strong dessert and gifting appeal.",
  },
};

export const STARTER_CROP_IDS = [
  "wheat",
  "carrot",
  "potato",
  "lettuce",
  "apple",
  "berry",
] as const;
