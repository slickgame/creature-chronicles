import type { RelationshipStageName } from "@/lib/town/relationshipDefaults";

export type TownNpcRole = "seed_seller" | "cook" | "produce_buyer";
export type TownNpcRace =
  | "human"
  | "elf"
  | "satyr"
  | "minotaur"
  | "centaur"
  | "orc"
  | "catfolk"
  | "rabbitkin";

export type TownNpcUnlock = {
  level: number;
  unlockType: "inventory" | "recipe" | "discount" | "quest" | "dialogue";
  value: string;
};

export type TownNpcGiftPreference = {
  itemId: string;
  reaction: "love" | "like" | "neutral" | "dislike";
};

export type TownNpcStageImageIds = Partial<Record<RelationshipStageName, string>>;

export type TownNpcData = {
  id: string;
  name: string;
  title: string;
  role: TownNpcRole;
  race: TownNpcRace;
  bodyType: string;
  romanceStyle: string;
  personalityTags: string[];
  shortDescription: string;
  introText: string;
  greetingText: string[];
  farewellText: string[];
  flirtText: string[];
  relationshipNotes: string[];
  baseImageId: string;
  relationshipStageImageIds?: TownNpcStageImageIds;
  shopInventoryIds?: string[];
  unlocksByLevel: TownNpcUnlock[];
  favoriteItems: TownNpcGiftPreference[];
};

export const TOWN_NPC_DATA: Record<string, TownNpcData> = {
  maris_thorn: {
    id: "maris_thorn",
    name: "Maris Thorn",
    title: "Seed Seller",
    role: "seed_seller",
    race: "rabbitkin",
    bodyType: "long-legged rabbitkin with a soft country look and a shamelessly teasing smile",
    romanceStyle: "playful, earthy, smugly affectionate, and a little possessive once she decides you are hers to spoil",
    personalityTags: ["playful", "smug", "earthy", "flirtatious"],
    shortDescription:
      "A rabbitkin seed merchant with dirt under her nails, quick little grins, and the kind of confidence that turns every sale into flirtation.",
    introText:
      "Maris leans over her seed counter like she already knows why you came back. Her smile is slow, warm, and just a little dangerous.",
    greetingText: [
      "Back for more seeds already? Good. I’d hate to think your hands were sitting idle.",
      "You grow it, darling, I’ll keep you stocked. That sounds like a very satisfying arrangement.",
      "Careful with those rare seeds. They like attention almost as much as I do.",
    ],
    farewellText: [
      "Don’t keep me waiting too long, sweetheart. I notice when my favorite customer disappears.",
      "Go make something lush for me to admire next time.",
    ],
    flirtText: [
      "Bring me a beautiful harvest and I might start saving my best stock for you under the counter.",
      "You always look a little too good carrying seed sacks around. It’s distracting in the nicest way.",
    ],
    relationshipNotes: [
      "Maris responds to consistency, ambition, and gifts that prove the player is actually using what she sells.",
      "Her affection path leans earthy, teasing, and possessive in a low-heat way.",
    ],
    baseImageId: "maris_base_visit",
    shopInventoryIds: [
      "wheat_seed",
      "carrot_seed",
      "potato_seed",
      "lettuce_seed",
      "apple_seed",
      "berry_seed",
    ],
    unlocksByLevel: [
      { level: 2, unlockType: "discount", value: "seed_shop_5_percent" },
      { level: 3, unlockType: "inventory", value: "rare_seed_bundle_1" },
      { level: 4, unlockType: "quest", value: "maris_special_harvest_request" },
      { level: 5, unlockType: "dialogue", value: "maris_private_greenhouse_scene" },
    ],
    favoriteItems: [
      { itemId: "apple", reaction: "like" },
      { itemId: "berry", reaction: "love" },
      { itemId: "apple_pie", reaction: "love" },
      { itemId: "bread", reaction: "neutral" },
    ],
  },

  tamsin_vale: {
    id: "tamsin_vale",
    name: "Tamsin Vale",
    title: "Recipe Keeper",
    role: "cook",
    race: "elf",
    bodyType: "graceful elven homemaker with elegant posture, long ears, and a soft domestic warmth",
    romanceStyle: "nurturing, indulgent, domestic, and increasingly intimate in a way that makes being fed feel dangerous",
    personalityTags: ["warm", "domestic", "indulgent", "suggestive"],
    shortDescription:
      "An elven cook with a velvet-soft voice and enough patience to make every recipe lesson feel suspiciously intimate.",
    introText:
      "Tamsin greets you from behind a warm counter, sleeves rolled up and smile gentle enough to feel personal.",
    greetingText: [
      "A proper meal changes everything, darling. Mood, stamina, even the trouble you go looking for after dark.",
      "Bring me good ingredients and I’ll show you how to turn them into something worth craving.",
      "Sit a while if you like. People make better choices when they’ve been fed properly.",
    ],
    farewellText: [
      "Try not to skip meals before you come back to me. I prefer my company fed and receptive.",
      "Bring me something fresh next time, sweetheart. I already have ideas for it.",
    ],
    flirtText: [
      "I don’t just teach recipes. I teach comfort, appetite, and how to leave someone wanting seconds.",
      "You bring the apples, I’ll bring the patience. Between us, we can make something indecently tempting.",
    ],
    relationshipNotes: [
      "Tamsin’s affection route leans nurturing, indulgent, and slowly more openly hungry.",
      "She favors thoughtful gifts, comfort foods, and players who invest in cooking.",
    ],
    baseImageId: "tamsin_base_visit",
    shopInventoryIds: [
      "recipe_book_home_cooking_1",
      "recipe_book_sweets_1",
      "recipe_book_hearty_meals_1",
    ],
    unlocksByLevel: [
      { level: 2, unlockType: "recipe", value: "vegetable_soup" },
      { level: 3, unlockType: "recipe", value: "hearty_stew" },
      { level: 4, unlockType: "quest", value: "tamsin_dinner_request" },
      { level: 5, unlockType: "dialogue", value: "tamsin_after_hours_kitchen_scene" },
    ],
    favoriteItems: [
      { itemId: "warm_milk", reaction: "love" },
      { itemId: "apple_pie", reaction: "love" },
      { itemId: "berry_tart", reaction: "like" },
      { itemId: "wheat", reaction: "neutral" },
    ],
  },

  selene_voss: {
    id: "selene_voss",
    name: "Selene Voss",
    title: "Produce Buyer",
    role: "produce_buyer",
    race: "catfolk",
    bodyType: "sleek catfolk broker with a polished silhouette, sharp eyes, and immaculate market poise",
    romanceStyle: "controlled, high-class, predatory in a stylish way, and very aware of the leverage in every smile",
    personalityTags: ["polished", "sly", "confident", "charming"],
    shortDescription:
      "A poised catfolk market buyer who makes every sale feel like a test you secretly want to pass.",
    introText:
      "Selene looks you over once, decides you might be interesting, and then starts negotiating like it’s foreplay.",
    greetingText: [
      "You bring me quality, I bring you gold. Bring me something irresistible, and we both leave smiling.",
      "Cute little harvest. Now tell me you didn’t come all this way just to impress me with something ordinary.",
      "I pay well for goods with real appeal. Bland things bore me.",
    ],
    farewellText: [
      "Go on, then. Bring me something worth admiring next time.",
      "I do hope your next delivery is as attractive as your last attempt to charm me.",
    ],
    flirtText: [
      "A fine pie, polished produce, that look in your eyes... you’re learning how to market yourself beautifully.",
      "Bring me the kind of goods that make me stare, and I may start reserving buyers just for you.",
    ],
    relationshipNotes: [
      "Selene rewards ambition, consistency, and high-quality finished goods.",
      "Her romance lane leans sleek, controlled, and very aware of leverage.",
    ],
    baseImageId: "selene_base_visit",
    shopInventoryIds: [],
    unlocksByLevel: [
      { level: 2, unlockType: "discount", value: "market_fee_reduction_5_percent" },
      { level: 3, unlockType: "inventory", value: "premium_buyer_board_1" },
      { level: 4, unlockType: "quest", value: "selene_special_order_contract" },
      { level: 5, unlockType: "dialogue", value: "selene_private_market_evening_scene" },
    ],
    favoriteItems: [
      { itemId: "apple_pie", reaction: "love" },
      { itemId: "berry_tart", reaction: "love" },
      { itemId: "hearty_stew", reaction: "like" },
      { itemId: "lettuce", reaction: "dislike" },
    ],
  },
};

export const FARM_ECONOMY_NPC_IDS = [
  "maris_thorn",
  "tamsin_vale",
  "selene_voss",
] as const;
