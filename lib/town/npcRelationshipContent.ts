export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

export type RelationshipRewardType =
  | "discount"
  | "inventory"
  | "recipe"
  | "quest"
  | "scene"
  | "image";

export type NpcRelationshipLevelContent = {
  level: RelationshipLevel;
  stageName: string;
  imageId: string;
  rewardSummary: string;
  rewardType: RelationshipRewardType;
  greetingLines: string[];
  questCompletionLines: string[];
};

export type NpcRelationshipContent = {
  npcId: string;
  levels: NpcRelationshipLevelContent[];
};

export const NPC_RELATIONSHIP_CONTENT: Record<string, NpcRelationshipContent> = {
  maris_thorn: {
    npcId: "maris_thorn",
    levels: [
      {
        level: 1,
        stageName: "Stranger",
        imageId: "maris_lv1_seed_stall",
        rewardSummary: "Starter seed stock unlocked.",
        rewardType: "inventory",
        greetingLines: [
          "You’re new to my stall, sweetheart. Try not to waste good seed with clumsy hands.",
          "If you’re buying, buy properly. I like ambitious growers more than timid ones.",
        ],
        questCompletionLines: [
          "Not bad. You actually followed through. That makes you more interesting already.",
        ],
      },
      {
        level: 2,
        stageName: "Interested",
        imageId: "maris_lv2_counter_lean",
        rewardSummary: "5% seed discount and sweeter small talk.",
        rewardType: "discount",
        greetingLines: [
          "There you are. I was starting to think the fields had stolen you from me.",
          "You’ve been good for business. Keep it up and I may start spoiling you a little.",
        ],
        questCompletionLines: [
          "Mmm. Reliable and easy on the eyes. Dangerous combination.",
        ],
      },
      {
        level: 3,
        stageName: "Familiar",
        imageId: "maris_lv3_private_stock",
        rewardSummary: "Rare seed bundle access.",
        rewardType: "inventory",
        greetingLines: [
          "I set a few better seeds aside. Don’t make me regret being generous.",
          "You know, most people don’t get to see what I keep under the counter.",
        ],
        questCompletionLines: [
          "Good work. Come closer next time and I’ll tell you what actually sells best.",
        ],
      },
      {
        level: 4,
        stageName: "Close",
        imageId: "maris_lv4_greenhouse_evening",
        rewardSummary: "Special harvest request and private greenhouse scene.",
        rewardType: "scene",
        greetingLines: [
          "You keep bringing me gorgeous produce and that smug little look. It’s doing things to my patience.",
          "After hours, meet me by the greenhouse. I have stock that deserves more careful hands.",
        ],
        questCompletionLines: [
          "Beautiful work. You really do know how to make me stare.",
        ],
      },
      {
        level: 5,
        stageName: "Lover",
        imageId: "maris_lv5_lovers_bloom",
        rewardSummary: "Lover status, premium stock, exclusive image.",
        rewardType: "image",
        greetingLines: [
          "Come here, darling. I saved the best seeds for you, and not only the seeds.",
          "You know exactly how to keep me wanting more. Lucky for you, I’m generous when I’m satisfied.",
        ],
        questCompletionLines: [
          "That’s my girl. Bring me something lovely and I’ll always make room for you.",
        ],
      },
    ],
  },

  tamsin_vale: {
    npcId: "tamsin_vale",
    levels: [
      {
        level: 1,
        stageName: "Stranger",
        imageId: "tamsin_lv1_counter_smile",
        rewardSummary: "Starter home recipes.",
        rewardType: "recipe",
        greetingLines: [
          "You look half-starved, darling. Sit down before you make another bad choice on an empty stomach.",
          "A kitchen tells me everything about a person. Yours can be taught better habits.",
        ],
        questCompletionLines: [
          "Good. You listened, and the result speaks nicely for you.",
        ],
      },
      {
        level: 2,
        stageName: "Interested",
        imageId: "tamsin_lv2_recipe_handout",
        rewardSummary: "Additional soup recipe unlock.",
        rewardType: "recipe",
        greetingLines: [
          "There’s my favorite hungry little student. Ready to learn something warmer?",
          "You’ve been practicing. I can tell. It makes me want to keep teaching you.",
        ],
        questCompletionLines: [
          "Well done. You’re getting easier and easier to indulge.",
        ],
      },
      {
        level: 3,
        stageName: "Familiar",
        imageId: "tamsin_lv3_kitchen_apron",
        rewardSummary: "Hearty meals unlocked.",
        rewardType: "recipe",
        greetingLines: [
          "Come into the kitchen, sweetheart. I’ve got something richer in mind for you today.",
          "You’re picking up the rhythm nicely. It’s almost intimate watching you work.",
        ],
        questCompletionLines: [
          "Mmm. That’s the kind of effort I like to reward.",
        ],
      },
      {
        level: 4,
        stageName: "Close",
        imageId: "tamsin_lv4_after_hours",
        rewardSummary: "Dinner request quest and private after-hours scene.",
        rewardType: "scene",
        greetingLines: [
          "Stay after the stall closes. I’d rather have you to myself while the ovens are still warm.",
          "You always bring me ingredients worth touching. Dangerous habit.",
        ],
        questCompletionLines: [
          "Lovely. You make it very easy to imagine keeping you close to my kitchen.",
        ],
      },
      {
        level: 5,
        stageName: "Lover",
        imageId: "tamsin_lv5_table_for_two",
        rewardSummary: "Lover status, exclusive comfort recipe, final image.",
        rewardType: "image",
        greetingLines: [
          "Sit. Eat. Stay. I’m not in the mood to let you wander off hungry or unattended.",
          "I made something special for you, sweetheart. Come taste it while it’s still hot.",
        ],
        questCompletionLines: [
          "Perfect. You always know how to leave me wanting the next evening already.",
        ],
      },
    ],
  },

  selene_voss: {
    npcId: "selene_voss",
    levels: [
      {
        level: 1,
        stageName: "Stranger",
        imageId: "selene_lv1_market_glance",
        rewardSummary: "Basic produce buyer access.",
        rewardType: "inventory",
        greetingLines: [
          "Show me something worth pricing. I’m not interested in bland stock or bland people.",
          "Quality first. Charm second. If you can manage both, we’ll get along.",
        ],
        questCompletionLines: [
          "Acceptable. Better than acceptable, actually. Don’t look so pleased with yourself.",
        ],
      },
      {
        level: 2,
        stageName: "Interested",
        imageId: "selene_lv2_contract_offer",
        rewardSummary: "Reduced market fees.",
        rewardType: "discount",
        greetingLines: [
          "There you are. I was wondering when my most promising supplier would come back.",
          "You’re beginning to understand presentation. It suits you.",
        ],
        questCompletionLines: [
          "Nicely done. I may start expecting this standard from you now.",
        ],
      },
      {
        level: 3,
        stageName: "Familiar",
        imageId: "selene_lv3_private_buyer_list",
        rewardSummary: "Premium buyer board access.",
        rewardType: "inventory",
        greetingLines: [
          "I have clients who pay extra for goods with real appeal. You may be ready for them.",
          "You’ve become useful in a very attractive way.",
        ],
        questCompletionLines: [
          "That quality could turn heads. I do appreciate being impressed.",
        ],
      },
      {
        level: 4,
        stageName: "Close",
        imageId: "selene_lv4_evening_contract",
        rewardSummary: "Special order contract and private market scene.",
        rewardType: "scene",
        greetingLines: [
          "Stay after the crowd thins. I negotiate better when I’m not being watched.",
          "You bring me excellent goods and dangerous eye contact. It’s becoming a pattern.",
        ],
        questCompletionLines: [
          "Very good. You’re learning how to give me exactly what I want.",
        ],
      },
      {
        level: 5,
        stageName: "Lover",
        imageId: "selene_lv5_private_suite",
        rewardSummary: "Lover status, elite contracts, exclusive image.",
        rewardType: "image",
        greetingLines: [
          "Come closer. The public rate is for everyone else. You know better by now.",
          "You’ve earned a different kind of arrangement with me, and I intend to enjoy it.",
        ],
        questCompletionLines: [
          "Perfect. That’s why I keep making room for you in my schedule.",
        ],
      },
    ],
  },
};

export function getNpcRelationshipLevelContent(
  npcId: string,
  level: RelationshipLevel
) {
  const npcContent = NPC_RELATIONSHIP_CONTENT[npcId];
  if (!npcContent) return null;
  return npcContent.levels.find((entry) => entry.level === level) ?? null;
}