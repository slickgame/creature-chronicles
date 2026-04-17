export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

export type RelationshipRewardType =
  | "discount"
  | "inventory"
  | "recipe"
  | "quest"
  | "scene"
  | "image"
  | "flavor";

export type NpcRelationshipLevelContent = {
  level: RelationshipLevel;
  stageName: string;
  imageId: string;
  rewardSummary: string;
  stageRewardSummary: string;
  nextStageHint: string;
  rewardType: RelationshipRewardType;
  greetingLines: string[];
  flirtLines: string[];
  farewellLines: string[];
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
        stageRewardSummary: "Maris keeps things playful but still tests whether your hands can make her stock thrive.",
        nextStageHint: "Buy from her stall or finish grower requests to earn softer prices and warmer teasing.",
        rewardType: "inventory",
        greetingLines: [
          "You're new to my stall, sweetheart. Try not to waste good seed with clumsy hands.",
          "If you're buying, buy properly. I like ambitious growers more than timid ones.",
        ],
        flirtLines: [
          "Show me a field worth admiring and I might start remembering your favorite rows.",
        ],
        farewellLines: [
          "Go on, then. Let me see whether those hands can make something worth my attention.",
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
        stageRewardSummary: "Maris starts leaning closer at the counter and saves little bits of advice for you.",
        nextStageHint: "Keep bringing proof from the fields to unlock private-stock trust and rarer seed access.",
        rewardType: "discount",
        greetingLines: [
          "There you are. I was starting to think the fields had stolen you from me.",
          "You've been good for business. Keep it up and I may start spoiling you a little.",
        ],
        flirtLines: [
          "Reliable and sun-warmed. Dangerous combination, darling.",
        ],
        farewellLines: [
          "Don't keep me wondering too long. I notice when my favorite grower disappears.",
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
        stageRewardSummary: "Maris opens her private stock and treats your visits like part of her routine.",
        nextStageHint: "Complete stronger grower deals to earn greenhouse invitations and more possessive attention.",
        rewardType: "inventory",
        greetingLines: [
          "I set a few better seeds aside. Don't make me regret being generous.",
          "You know, most people don't get to see what I keep under the counter.",
        ],
        flirtLines: [
          "You keep coming back with dirt on your boots and that look on your face. I could get used to it.",
        ],
        farewellLines: [
          "Bring me something lush next time. I like seeing what happens when you take my advice.",
        ],
        questCompletionLines: [
          "Good work. Come closer next time and I'll tell you what actually sells best.",
        ],
      },
      {
        level: 4,
        stageName: "Close",
        imageId: "maris_lv4_greenhouse_evening",
        rewardSummary: "Special harvest request and private greenhouse scene hooks.",
        stageRewardSummary: "Maris lets the teasing turn territorial, with greenhouse dialogue and warmer ledger flavor.",
        nextStageHint: "Keep finishing Maris's personal grower deals to turn favorite-customer privilege into something unmistakably intimate.",
        rewardType: "scene",
        greetingLines: [
          "You keep bringing me gorgeous produce and that smug little look. It's doing things to my patience.",
          "After hours, meet me by the greenhouse. I have stock that deserves more careful hands.",
        ],
        flirtLines: [
          "Careful, sweetheart. Keep blooming like that and I may start calling you mine in public.",
        ],
        farewellLines: [
          "I'll be counting the minutes and the seed sacks. Try to make both worth my while.",
        ],
        questCompletionLines: [
          "Beautiful work. You really do know how to make me stare.",
        ],
      },
      {
        level: 5,
        stageName: "Lover",
        imageId: "maris_lv5_lovers_bloom",
        rewardSummary: "Lover status, premium stock, exclusive image path.",
        stageRewardSummary: "Maris treats the stall like your shared little secret, all premium stock and shameless fondness.",
        nextStageHint: "Maris is fully opened up. Future milestones can add lover events, image sets, and seasonal greenhouse dates.",
        rewardType: "image",
        greetingLines: [
          "Come here, darling. I saved the best seeds for you, and not only the seeds.",
          "You know exactly how to keep me wanting more. Lucky for you, I'm generous when I'm satisfied.",
        ],
        flirtLines: [
          "That's my favorite grower. Hands full, eyes bright, and still somehow asking for trouble.",
        ],
        farewellLines: [
          "Go make something beautiful for me, love. Then come back and let me praise you properly.",
        ],
        questCompletionLines: [
          "That's my girl. Bring me something lovely and I'll always make room for you.",
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
        stageRewardSummary: "Tamsin starts with practical care: food, steadiness, and a warm place at the counter.",
        nextStageHint: "Bring ingredients and complete kitchen requests to make her lessons more personal.",
        rewardType: "recipe",
        greetingLines: [
          "You look half-starved, darling. Sit down before you make another bad choice on an empty stomach.",
          "A kitchen tells me everything about a person. Yours can be taught better habits.",
        ],
        flirtLines: [
          "I can teach patience, appetite, and when to stop pretending you are not hungry.",
        ],
        farewellLines: [
          "Eat properly before you wander off. I prefer my company steady on their feet.",
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
        stageRewardSummary: "Tamsin begins tailoring recipe lessons to you, with warmer praise and gentler correction.",
        nextStageHint: "Practice cooking and bring comfort ingredients to unlock richer meals and closer kitchen invitations.",
        rewardType: "recipe",
        greetingLines: [
          "There's my favorite hungry little student. Ready to learn something warmer?",
          "You've been practicing. I can tell. It makes me want to keep teaching you.",
        ],
        flirtLines: [
          "You are getting easier and easier to indulge, sweetheart.",
        ],
        farewellLines: [
          "Take something warm with you. No arguing. I know that look.",
        ],
        questCompletionLines: [
          "Well done. You're getting easier and easier to indulge.",
        ],
      },
      {
        level: 3,
        stageName: "Familiar",
        imageId: "tamsin_lv3_kitchen_apron",
        rewardSummary: "Hearty meals and cooking commissions unlocked.",
        stageRewardSummary: "Tamsin lets you closer to the kitchen rhythm, where praise starts sounding like appetite.",
        nextStageHint: "Finish commissions with crafted meals to unlock after-hours dinner hooks.",
        rewardType: "recipe",
        greetingLines: [
          "Come into the kitchen, sweetheart. I've got something richer in mind for you today.",
          "You're picking up the rhythm nicely. It's almost intimate watching you work.",
        ],
        flirtLines: [
          "Reliable hands in a warm kitchen can make a person imagine all sorts of things.",
        ],
        farewellLines: [
          "Bring me something fresh next time. I already know how I want to use it.",
        ],
        questCompletionLines: [
          "Mmm. That's the kind of effort I like to reward.",
        ],
      },
      {
        level: 4,
        stageName: "Close",
        imageId: "tamsin_lv4_after_hours",
        rewardSummary: "Dinner request quest and private after-hours scene hooks.",
        stageRewardSummary: "Tamsin's counter feels private even when the room is full, with after-hours hints in her visits.",
        nextStageHint: "Keep completing commissions to turn private dinner promises into lover-level comfort.",
        rewardType: "scene",
        greetingLines: [
          "Stay after the stall closes. I'd rather have you to myself while the ovens are still warm.",
          "You always bring me ingredients worth touching. Dangerous habit.",
        ],
        flirtLines: [
          "You make it very easy to imagine keeping you close to my table.",
        ],
        farewellLines: [
          "Come back when the lamps are low. Some lessons should not be rushed.",
        ],
        questCompletionLines: [
          "Lovely. You make it very easy to imagine keeping you close to my kitchen.",
        ],
      },
      {
        level: 5,
        stageName: "Lover",
        imageId: "tamsin_lv5_table_for_two",
        rewardSummary: "Lover status, exclusive comfort recipe, final image path.",
        stageRewardSummary: "Tamsin folds you into her private rituals: table for two, favorite dishes, and open affection.",
        nextStageHint: "Tamsin is fully opened up. Future milestones can add lover recipes, home scenes, and private image sets.",
        rewardType: "image",
        greetingLines: [
          "Sit. Eat. Stay. I'm not in the mood to let you wander off hungry or unattended.",
          "I made something special for you, sweetheart. Come taste it while it's still hot.",
        ],
        flirtLines: [
          "You are exactly who I wanted at my table tonight. Convenient, isn't it?",
        ],
        farewellLines: [
          "Take care of yourself for me, darling. I have plans for you later.",
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
        stageRewardSummary: "Selene measures your quality, discipline, and nerve before giving you anything extra.",
        nextStageHint: "Bring quality produce and complete market requests to earn better terms and a sharper smile.",
        rewardType: "inventory",
        greetingLines: [
          "Show me something worth pricing. I'm not interested in bland stock or bland people.",
          "Quality first. Charm second. If you can manage both, we'll get along.",
        ],
        flirtLines: [
          "Impress me with the goods first. Then we can discuss your presentation.",
        ],
        farewellLines: [
          "Come back with something better than ordinary. I dislike being bored.",
        ],
        questCompletionLines: [
          "Acceptable. Better than acceptable, actually. Don't look so pleased with yourself.",
        ],
      },
      {
        level: 2,
        stageName: "Interested",
        imageId: "selene_lv2_contract_offer",
        rewardSummary: "Reduced market fees.",
        stageRewardSummary: "Selene starts treating you like a promising supplier and lets the compliments turn edged.",
        nextStageHint: "Keep delivering polished goods to gain premium board access and private buyer attention.",
        rewardType: "discount",
        greetingLines: [
          "There you are. I was wondering when my most promising supplier would come back.",
          "You're beginning to understand presentation. It suits you.",
        ],
        flirtLines: [
          "You are learning to package quality with confidence. A profitable look on you.",
        ],
        farewellLines: [
          "Do try to miss me productively. Bring something worth my time.",
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
        stageRewardSummary: "Selene brings you into better rooms, better clients, and more deliberately private praise.",
        nextStageHint: "Complete premium contracts to unlock after-hours terms and special-order leverage.",
        rewardType: "inventory",
        greetingLines: [
          "I have clients who pay extra for goods with real appeal. You may be ready for them.",
          "You've become useful in a very attractive way.",
        ],
        flirtLines: [
          "You keep making yourself difficult to ignore. I appreciate ambition when it is well dressed.",
        ],
        farewellLines: [
          "Leave the next delivery with me personally. I prefer handling valuable things myself.",
        ],
        questCompletionLines: [
          "That quality could turn heads. I do appreciate being impressed.",
        ],
      },
      {
        level: 4,
        stageName: "Close",
        imageId: "selene_lv4_evening_contract",
        rewardSummary: "Special order contract and private market scene hooks.",
        stageRewardSummary: "Selene's negotiations become pointedly personal, with evening terms and private ledgers.",
        nextStageHint: "Finish premium-board offers to earn lover-level arrangements and elite private-contract flavor.",
        rewardType: "scene",
        greetingLines: [
          "Stay after the crowd thins. I negotiate better when I'm not being watched.",
          "You bring me excellent goods and dangerous eye contact. It's becoming a pattern.",
        ],
        flirtLines: [
          "Careful. If you keep exceeding terms, I may have to renegotiate you privately.",
        ],
        farewellLines: [
          "Do not keep me waiting. Anticipation is useful, but only in controlled amounts.",
        ],
        questCompletionLines: [
          "Very good. You're learning how to give me exactly what I want.",
        ],
      },
      {
        level: 5,
        stageName: "Lover",
        imageId: "selene_lv5_private_suite",
        rewardSummary: "Lover status, elite contracts, exclusive image path.",
        stageRewardSummary: "Selene reserves her best contracts and most dangerous softness for you alone.",
        nextStageHint: "Selene is fully opened up. Future milestones can add lover contracts, private suites, and prestige image sets.",
        rewardType: "image",
        greetingLines: [
          "Come closer. The public rate is for everyone else. You know better by now.",
          "You've earned a different kind of arrangement with me, and I intend to enjoy it.",
        ],
        flirtLines: [
          "My favorite supplier, my favorite exception. Try not to look too pleased; it gives me ideas.",
        ],
        farewellLines: [
          "Run along, love. Bring me excellence, then let me decide how to reward you.",
        ],
        questCompletionLines: [
          "Perfect. That's why I keep making room for you in my schedule.",
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

export function getNextNpcRelationshipLevelContent(
  npcId: string,
  level: RelationshipLevel
) {
  const npcContent = NPC_RELATIONSHIP_CONTENT[npcId];
  if (!npcContent || level >= 5) return null;
  return npcContent.levels.find((entry) => entry.level === level + 1) ?? null;
}
