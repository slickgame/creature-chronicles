import { CROP_DATA } from "@/lib/farming/cropData";
import { type CropQuality } from "@/lib/game/farming";
import { type GameSeason, getSeasonInfo } from "@/lib/game/weather";

export type NpcFarmingRewardItem = {
  itemId: string;
  quantity: number;
};

export type GeneratedNpcFarmingRequest = {
  id: number;
  npcId: string;
  npcName: string;
  title: string;
  description: string;
  requestLine: string;
  completionLine: string;
  rewardGold: number;
  rewardXp: number;
  relationshipGain: number;
  rewardItems: NpcFarmingRewardItem[];
  requestedCropId: string;
  requestedItemId: string;
  minimumQuality: CropQuality;
  requiredQuantity: number;
  seasonalFocus: GameSeason | null;
  deadlineDay: number;
  deadlineHour: number;
  deadlineMinute: number;
};

const NPC_DISPLAY: Record<string, string> = {
  maris_thorn: "Maris Thorn",
  selene_voss: "Selene Voss",
  tamsin_vale: "Tamsin Vale",
};

function pickByDay<T>(items: readonly T[], day: number, offset = 0): T {
  const index = Math.abs((day * 37 + offset * 11) % items.length);
  return items[index];
}

function getSeasonalCropIds(season: GameSeason) {
  const info = getSeasonInfo(season);
  return info.favoredCropIds.filter((cropId) => CROP_DATA[cropId]);
}

function getCropProduceItemId(cropId: string) {
  return CROP_DATA[cropId]?.produceItemId ?? cropId;
}

function buildMarisRequest(
  day: number,
  season: GameSeason,
  seedBase: number
): GeneratedNpcFarmingRequest {
  const seasonalCrop = pickByDay(getSeasonalCropIds(season), day, 1);
  const backupCrops = ["wheat", "carrot", "potato"] as const;
  const cropId = seasonalCrop ?? pickByDay(backupCrops, day, 2);
  const produceItemId = getCropProduceItemId(cropId);
  const cropName = CROP_DATA[cropId]?.name ?? cropId;
  const highTouchDay = day % 3 === 0;

  return {
    id: seedBase + 1,
    npcId: "maris_thorn",
    npcName: NPC_DISPLAY.maris_thorn,
    title: highTouchDay ? "Greenhouse Flirt Test" : "Soil Check Delivery",
    description: highTouchDay
      ? `Maris wants ${cropName} with enough polish to prove your field routine is paying off.`
      : `Maris is checking seed lines and wants a clean haul of ${cropName}.`,
    requestLine: highTouchDay
      ? `"Bring me ${cropName} with a little shine, sweetheart. I like seeing your hands do more than buy seed."`
      : `"I need a practical stack of ${cropName}. Show me your rows are behaving."`,
    completionLine: highTouchDay
      ? `"Mm. This is pretty work. Keep growing like this and I'll start setting aside better stock just for you."`
      : `"Good texture, good color. That's exactly what I hoped your ranch could do."`,
    rewardGold: highTouchDay ? 145 : 110,
    rewardXp: highTouchDay ? 30 : 22,
    relationshipGain: highTouchDay ? 14 : 10,
    rewardItems: highTouchDay
      ? [
          { itemId: "rich_fertilizer", quantity: 1 },
          { itemId: `${cropId}_seed`, quantity: 2 },
        ]
      : [{ itemId: "basic_fertilizer", quantity: 1 }],
    requestedCropId: cropId,
    requestedItemId: produceItemId,
    minimumQuality: highTouchDay ? "fine" : "standard",
    requiredQuantity: highTouchDay ? 5 : 6,
    seasonalFocus: seasonalCrop ? season : null,
    deadlineDay: day + 2,
    deadlineHour: 18,
    deadlineMinute: 0,
  };
}

function buildSeleneRequest(
  day: number,
  season: GameSeason,
  seedBase: number
): GeneratedNpcFarmingRequest {
  const fruitPriority = ["apple", "berry"] as const;
  const favored = getSeasonalCropIds(season);
  const prefersFruit = day % 2 === 0;
  const cropId = prefersFruit
    ? pickByDay(fruitPriority, day, 3)
    : pickByDay((favored.length > 0 ? favored : ["carrot", "potato", "wheat"]) as readonly string[], day, 4);
  const produceItemId = getCropProduceItemId(cropId);
  const cropName = CROP_DATA[cropId]?.name ?? cropId;
  const premiumDay = day % 4 === 0;

  return {
    id: seedBase + 2,
    npcId: "selene_voss",
    npcName: NPC_DISPLAY.selene_voss,
    title: premiumDay ? "Velvet Shelf Contract" : "Market Display Run",
    description: premiumDay
      ? `Selene has a premium buyer asking for ${cropName} at standout quality.`
      : `Selene needs ${cropName} for a same-day market display with clean visual appeal.`,
    requestLine: premiumDay
      ? `"Don't bore me with average produce. I need ${cropName} good enough to make a buyer pause."`
      : `"I need ${cropName} that sells at a glance. Keep it sharp, keep it tempting."`,
    completionLine: premiumDay
      ? `"There we are. This is the sort of quality that gets me better bids and keeps you in my good graces."`
      : `"Nicely done. You brought me exactly the kind of crate that turns heads."`,
    rewardGold: premiumDay ? 190 : 140,
    rewardXp: premiumDay ? 34 : 24,
    relationshipGain: premiumDay ? 15 : 11,
    rewardItems: premiumDay ? [{ itemId: "berry_seed", quantity: 2 }] : [],
    requestedCropId: cropId,
    requestedItemId: produceItemId,
    minimumQuality: premiumDay ? "lush" : "fine",
    requiredQuantity: premiumDay ? 4 : 6,
    seasonalFocus: favored.includes(cropId) ? season : null,
    deadlineDay: day + 2,
    deadlineHour: 20,
    deadlineMinute: 30,
  };
}

function buildTamsinRequest(
  day: number,
  season: GameSeason,
  seedBase: number
): GeneratedNpcFarmingRequest {
  const comfortCrops = ["carrot", "potato", "lettuce", "wheat"] as const;
  const sweetCrops = ["apple", "berry"] as const;
  const sweetDay = day % 3 === 1;
  const cropId = sweetDay
    ? pickByDay(sweetCrops, day, 5)
    : pickByDay(comfortCrops, day, 6);
  const produceItemId = getCropProduceItemId(cropId);
  const cropName = CROP_DATA[cropId]?.name ?? cropId;
  const recipeProgressDay = day % 5 === 0;

  return {
    id: seedBase + 3,
    npcId: "tamsin_vale",
    npcName: NPC_DISPLAY.tamsin_vale,
    title: sweetDay ? "Kitchen Temptation Prep" : "Comfort Pot Prep",
    description: sweetDay
      ? `Tamsin is drafting dessert specials and wants a thoughtful batch of ${cropName}.`
      : `Tamsin needs ${cropName} for a comfort-menu run and late service prep.`,
    requestLine: sweetDay
      ? `"Bring me lovely ${cropName}, darling. I want tonight's desserts to feel impossible to forget."`
      : `"I need ${cropName} for the evening pot. Feed me good ingredients and I'll feed you better."`,
    completionLine: sweetDay
      ? `"Beautiful. You always bring me ingredients that make me want to cook slowly for you."`
      : `"Perfect texture. This will turn into a meal worth lingering over."`,
    rewardGold: recipeProgressDay ? 155 : 125,
    rewardXp: recipeProgressDay ? 32 : 24,
    relationshipGain: recipeProgressDay ? 14 : 11,
    rewardItems: recipeProgressDay
      ? [{ itemId: "recipe_book_home_cooking_1", quantity: 1 }]
      : [{ itemId: "wheat_seed", quantity: 2 }],
    requestedCropId: cropId,
    requestedItemId: produceItemId,
    minimumQuality: sweetDay ? "fine" : "standard",
    requiredQuantity: sweetDay ? 5 : 7,
    seasonalFocus: getSeasonalCropIds(season).includes(cropId) ? season : null,
    deadlineDay: day + 3,
    deadlineHour: 21,
    deadlineMinute: 0,
  };
}

export function generateNpcFarmingRequests(
  currentDay: number,
  currentSeason: GameSeason,
  seedBase: number
): GeneratedNpcFarmingRequest[] {
  return [
    buildMarisRequest(currentDay, currentSeason, seedBase),
    buildSeleneRequest(currentDay, currentSeason, seedBase),
    buildTamsinRequest(currentDay, currentSeason, seedBase),
  ];
}
