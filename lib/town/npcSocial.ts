import { TOWN_NPC_DATA, type TownNpcGiftPreference } from "@/lib/town/npcData";
import type { RelationshipLevel } from "@/lib/town/relationshipDefaults";
import type { NpcMiniChainProgressMap } from "@/lib/town/npcMiniChains";

export type NpcGiftReaction = TownNpcGiftPreference["reaction"];

export type NpcGiftDailyRecord = {
  day: number;
  count: number;
};

export type NpcGiftRecordMap = Record<string, NpcGiftDailyRecord>;
export type NpcInvitationRecordMap = Record<string, number>;

export type NpcSocialActionKind = "gift" | "invitation";

export type NpcSocialActionResult = {
  success: boolean;
  kind: NpcSocialActionKind;
  npcId: string;
  title: string;
  dialogue: string;
  relationshipGain: number;
  day: number;
  itemId?: string;
  reaction?: NpcGiftReaction;
  invitationId?: string;
  timeCostMinutes?: number;
};

export type NpcInvitationOption = {
  id: string;
  npcId: string;
  requiredLevel: RelationshipLevel;
  title: string;
  flavorText: string;
  unavailableText: string;
  sceneText: string;
  rewardSummary: string;
  followUpFlavor: string;
  relationshipGain: number;
  timeCostMinutes: number;
  goldReward?: number;
  itemRewards?: NpcOutingItemReward[];
  imageUnlockId?: string;
  requiredMiniChainMilestoneId?: string;
  isRoutePayoff?: boolean;
};

export type NpcInvitationAvailability = NpcInvitationOption & {
  available: boolean;
  reason: string;
};

export type NpcOutingItemReward = {
  itemId: string;
  quantity: number;
};

export type NpcOutingCompletion = {
  id: string;
  npcId: string;
  invitationId: string;
  title: string;
  completed: true;
  dayCompleted: number;
  sceneText: string;
  relationshipReward: number;
  goldReward: number;
  rewardSummary: string;
  followUpFlavor: string;
  itemRewards: NpcOutingItemReward[];
  imageUnlockId?: string;
  memoryEventId?: string;
};

export type NpcOutingCompletionLog = NpcOutingCompletion[];

export const MAX_DAILY_GIFTS_PER_NPC = 2;

export const NPC_INVITATION_OPTIONS: NpcInvitationOption[] = [
  {
    id: "maris_greenhouse_walk",
    npcId: "maris_thorn",
    requiredLevel: 3,
    title: "Greenhouse Walk",
    flavorText:
      "Maris closes the seed drawer with a sly little smile and offers to show you what she keeps warm and growing out back.",
    unavailableText: "Maris will invite you behind the stall once she trusts your hands a little more.",
    sceneText:
      "Maris leads you between rows of glass-warmed seedlings, brushing leaves aside with the back of her hand. \"These little things need patience,\" she says, glancing over her shoulder with a grin. \"So do my favorite growers. Lucky for you, I like watching both of you bloom.\"",
    rewardSummary: "+14 relationship, Berry Seed x2, Greenhouse Walk memory",
    followUpFlavor:
      "Maris starts mentioning the greenhouse like it is already half yours, and her better seed bundles feel a little more personal.",
    relationshipGain: 14,
    timeCostMinutes: 45,
    itemRewards: [{ itemId: "berry_seed", quantity: 2 }],
    imageUnlockId: "maris_greenhouse_walk",
  },
  {
    id: "maris_after_hours_rows",
    npcId: "maris_thorn",
    requiredLevel: 5,
    title: "After-Hours Rows",
    flavorText:
      "Maris saves the last light for you, all low laughter, warm glass, and the sort of praise she does not bother softening anymore.",
    unavailableText: "Maris is not quite ready to make the greenhouse that private.",
    sceneText:
      "With the stall closed, Maris walks beside you under amber panes and lets the silence stretch warm. \"I spoil what matters to me,\" she murmurs, nudging your shoulder with hers. \"Seeds, fields, stubborn sweethearts who keep coming back exactly when I want them.\"",
    rewardSummary: "+20 relationship, Rich Fertilizer x1, After-Hours Rows memory",
    followUpFlavor:
      "Maris's after-hours greetings turn softer and more possessive, with future greenhouse scenes now easy to hang on this flag.",
    relationshipGain: 20,
    timeCostMinutes: 60,
    itemRewards: [{ itemId: "rich_fertilizer", quantity: 1 }],
    imageUnlockId: "maris_after_hours_rows",
  },
  {
    id: "maris_private_grower_payoff",
    npcId: "maris_thorn",
    requiredLevel: 5,
    title: "Private Grower Lesson",
    flavorText:
      "Maris waits until the stall is closed before tapping the greenhouse key against her palm, smiling like she has been saving this lesson for days.",
    unavailableText: "Maris will only offer this once her Greenhouse Route reaches After-Hours Bloom.",
    sceneText:
      "Maris locks the greenhouse door behind you, then turns with a slow, satisfied smile. \"You learned my rows, my stock, my little habits,\" she says, voice warm as the glass around you. \"So tonight, sweetheart, I teach you what I save for a grower who has truly earned private attention.\"",
    rewardSummary: "+30 relationship, Rich Fertilizer x3, Private Grower Lesson memory",
    followUpFlavor:
      "Maris now treats the greenhouse route as a private promise, ready for later CGs and deeper grower scenes.",
    relationshipGain: 30,
    timeCostMinutes: 90,
    itemRewards: [{ itemId: "rich_fertilizer", quantity: 3 }],
    imageUnlockId: "maris_private_grower_payoff",
    requiredMiniChainMilestoneId: "maris_after_hours_bloom",
    isRoutePayoff: true,
  },
  {
    id: "selene_market_stroll",
    npcId: "selene_voss",
    requiredLevel: 3,
    title: "Market Stroll",
    flavorText:
      "Selene lets you walk beside her through the better stalls, correcting your eye for quality with a smile that feels like a challenge.",
    unavailableText: "Selene reserves private market time for suppliers who have proven their value.",
    sceneText:
      "Selene guides you through the better stalls with a cool hand at your elbow, naming flaws, premiums, and hidden margins. \"Quality is never accidental,\" she says. Her smile sharpens. \"Neither is the company I keep beside me.\"",
    rewardSummary: "+14 relationship, 75g private-buyer gratuity, Market Stroll memory",
    followUpFlavor:
      "Selene begins framing premium boards as private opportunities instead of public listings.",
    relationshipGain: 14,
    timeCostMinutes: 45,
    imageUnlockId: "selene_market_stroll",
    goldReward: 75,
  },
  {
    id: "selene_after_hours_ledger",
    npcId: "selene_voss",
    requiredLevel: 5,
    title: "After-Hours Ledger",
    flavorText:
      "Selene draws the curtains on the exchange and reviews the day's private terms with you close enough to make every pause deliberate.",
    unavailableText: "Selene's after-hours ledger is still closed to you.",
    sceneText:
      "The market quiets behind drawn curtains while Selene opens a slim ledger meant for very few eyes. \"Public terms are for public people,\" she says, voice smooth and low. \"You, darling, have become a private exception.\"",
    rewardSummary: "+20 relationship, 150g private-contract gratuity, After-Hours Ledger memory",
    followUpFlavor:
      "Selene's private contract language grows more direct, and future elite buyer scenes have a clean hook.",
    relationshipGain: 20,
    timeCostMinutes: 60,
    imageUnlockId: "selene_after_hours_ledger_outing",
    goldReward: 150,
  },
  {
    id: "selene_private_buyer_payoff",
    npcId: "selene_voss",
    requiredLevel: 5,
    title: "Private Buyer Terms",
    flavorText:
      "Selene sends the clerk away and leaves your name visible on the private ledger, one manicured finger resting beside it.",
    unavailableText: "Selene will only negotiate these terms once her Private Buyer Route reaches After-Hours Terms.",
    sceneText:
      "Selene closes the ledger with deliberate care, but keeps you close. \"You have graduated from public terms,\" she says, eyes bright and exacting. \"From now on, certain buyers hear your name from my mouth first. Try not to look too pleased, darling. I have not even told you the private premium yet.\"",
    rewardSummary: "+30 relationship, 300g private premium, Private Buyer Terms memory",
    followUpFlavor:
      "Selene now has a route-payoff flag for elite buyer scenes, private premiums, and after-hours contract variants.",
    relationshipGain: 30,
    timeCostMinutes: 90,
    goldReward: 300,
    imageUnlockId: "selene_private_buyer_payoff",
    requiredMiniChainMilestoneId: "selene_after_hours_terms_route",
    isRoutePayoff: true,
  },
  {
    id: "tamsin_kitchen_tea",
    npcId: "tamsin_vale",
    requiredLevel: 3,
    title: "Kitchen Tea",
    flavorText:
      "Tamsin sets aside a quiet cup for you, warm fingers brushing the rim as she asks whether you have been feeding yourself properly.",
    unavailableText: "Tamsin will make time for a private cup once your visits feel less like errands.",
    sceneText:
      "Tamsin pours tea at the quiet end of the counter, close enough that steam curls between you. \"There,\" she says softly. \"A little warmth, a little sweetness, and someone making sure you sit still long enough to enjoy both.\"",
    rewardSummary: "+14 relationship, Warm Milk x1, Kitchen Tea memory",
    followUpFlavor:
      "Tamsin starts saving small comforts for your visits, and kitchen dialogue carries more private warmth.",
    relationshipGain: 14,
    timeCostMinutes: 45,
    itemRewards: [{ itemId: "warm_milk", quantity: 1 }],
    imageUnlockId: "tamsin_kitchen_tea",
  },
  {
    id: "tamsin_lamplit_table",
    npcId: "tamsin_vale",
    requiredLevel: 5,
    title: "Lamplit Table",
    flavorText:
      "Tamsin saves a small table after closing, the kitchen hushed and golden while she spoils you with her full attention.",
    unavailableText: "Tamsin's lamplit table is waiting for a more intimate trust.",
    sceneText:
      "The kitchen settles into lamplight while Tamsin sets a private plate before you. \"No rushing tonight,\" she murmurs, smile soft and pleased. \"Some appetites deserve patience, and you have been very good at earning mine.\"",
    rewardSummary: "+20 relationship, Apple Pie x1, Lamplit Table memory",
    followUpFlavor:
      "Tamsin's lover-stage dialogue now has a private table to return to, ready for later date scenes and comfort images.",
    relationshipGain: 20,
    timeCostMinutes: 60,
    itemRewards: [{ itemId: "apple_pie", quantity: 1 }],
    imageUnlockId: "tamsin_lamplit_table",
  },
  {
    id: "tamsin_private_dinner_payoff",
    npcId: "tamsin_vale",
    requiredLevel: 5,
    title: "Private Dinner Service",
    flavorText:
      "Tamsin dims the kitchen lamps and sets one table as if she has been planning exactly where you would sit.",
    unavailableText: "Tamsin will only set this table once her Kitchen Trust Route reaches Private Table.",
    sceneText:
      "Tamsin serves the first course herself, sleeves rolled up, smile quiet and sure. \"You kept showing up with care in your hands,\" she murmurs. \"So tonight I am going to feed you slowly, properly, and with no counter between us.\"",
    rewardSummary: "+30 relationship, Hearty Stew x2, Private Dinner Service memory",
    followUpFlavor:
      "Tamsin now has a route-payoff flag for private dinner scenes, comfort rewards, and later lamplit CGs.",
    relationshipGain: 30,
    timeCostMinutes: 90,
    itemRewards: [{ itemId: "hearty_stew", quantity: 2 }],
    imageUnlockId: "tamsin_private_dinner_payoff",
    requiredMiniChainMilestoneId: "tamsin_private_table_route",
    isRoutePayoff: true,
  },
];

export function getNpcGiftPreference(npcId: string, itemId: string): NpcGiftReaction {
  const npc = TOWN_NPC_DATA[npcId];
  return npc?.favoriteItems.find((item) => item.itemId === itemId)?.reaction ?? "neutral";
}

export function getNpcGiftDailyRecord(
  records: NpcGiftRecordMap,
  npcId: string,
  currentDay: number
): NpcGiftDailyRecord {
  const record = records[npcId];
  return record?.day === currentDay ? record : { day: currentDay, count: 0 };
}

export function canGiveNpcGift(records: NpcGiftRecordMap, npcId: string, currentDay: number) {
  return getNpcGiftDailyRecord(records, npcId, currentDay).count < MAX_DAILY_GIFTS_PER_NPC;
}

export function getNpcGiftRelationshipGain(reaction: NpcGiftReaction, giftsGivenToday: number) {
  const base = reaction === "love" ? 22 : reaction === "like" ? 14 : reaction === "neutral" ? 6 : -4;
  return giftsGivenToday === 0 ? base : Math.trunc(base / 2);
}

export function buildNpcGiftDialogue(
  npcId: string,
  itemName: string,
  reaction: NpcGiftReaction,
  relationshipLevel: RelationshipLevel
) {
  const intimate = relationshipLevel >= 4;

  if (npcId === "maris_thorn") {
    if (reaction === "love") return intimate
      ? `"Oh, sweetheart. You remembered exactly what I like. Keep spoiling me and I may have to return the favor properly."`
      : `"Now that's a gift worth leaning over the counter for. You do know how to make a rabbitkin smile."`;
    if (reaction === "like") return `"Useful and thoughtful. Careful, darling, I might start expecting you to be this charming."`;
    if (reaction === "dislike") return `"Mm. Not my favorite, but I'll give you points for trying instead of pretending you know better."`;
    return `"${itemName}, is it? Practical enough. I can work with practical."`;
  }

  if (npcId === "selene_voss") {
    if (reaction === "love") return intimate
      ? `"Exquisite. You are learning my tastes with dangerous accuracy, love."`
      : `"A polished choice. I do enjoy when someone pays attention before trying to impress me."`;
    if (reaction === "like") return `"Acceptable. Better than acceptable, actually. Presentation suits you."`;
    if (reaction === "dislike") return `"Bold of you to bring me that. We will call it... market research."`;
    return `"A neutral offering. Not memorable, but not an embarrassment either."`;
  }

  if (reaction === "love") return intimate
    ? `"Darling, this is lovely. Sit a moment and let me enjoy being known by you."`
    : `"Oh, sweetheart. You brought something I can actually fuss over. That was very kind."`;
  if (reaction === "like") return `"Thoughtful. I like a gift that says you were paying attention."`;
  if (reaction === "dislike") return `"Ah. Well. We cannot all have perfect taste on the first try, can we?"`;
  return `"Thank you, dear. A simple gift can still warm the room."`;
}

export function normalizeNpcGiftRecords(records: unknown): NpcGiftRecordMap {
  if (!records || typeof records !== "object") return {};

  return Object.fromEntries(
    Object.entries(records as Record<string, Partial<NpcGiftDailyRecord>>)
      .filter(([npcId, record]) => npcId.length > 0 && Boolean(record))
      .map(([npcId, record]) => [
        npcId,
        {
          day: Math.max(1, Math.floor(record.day ?? 1)),
          count: Math.max(0, Math.floor(record.count ?? 0)),
        },
      ])
  );
}

export function normalizeNpcInvitationRecords(records: unknown): NpcInvitationRecordMap {
  if (!records || typeof records !== "object") return {};

  return Object.fromEntries(
    Object.entries(records as Record<string, unknown>)
      .filter(([invitationId, day]) => invitationId.length > 0 && typeof day === "number" && Number.isFinite(day))
      .map(([invitationId, day]) => [invitationId, Math.max(1, Math.floor(day as number))])
  );
}

export function normalizeNpcOutingCompletionLog(log: unknown): NpcOutingCompletionLog {
  if (!Array.isArray(log)) return [];

  return log.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const value = entry as Partial<NpcOutingCompletion>;
      const invitation = NPC_INVITATION_OPTIONS.find((option) => option.id === value.invitationId);
      if (!invitation || !value.npcId || value.npcId !== invitation.npcId) return [];

      const completion: NpcOutingCompletion = {
        id: value.id ?? `${invitation.id}-${Math.max(1, Math.floor(value.dayCompleted ?? 1))}`,
        npcId: invitation.npcId,
        invitationId: invitation.id,
        title: invitation.title,
        completed: true as const,
        dayCompleted: Math.max(1, Math.floor(value.dayCompleted ?? 1)),
        sceneText: value.sceneText ?? invitation.sceneText,
        relationshipReward: Math.trunc(value.relationshipReward ?? invitation.relationshipGain),
        goldReward: Math.max(0, Math.floor(value.goldReward ?? invitation.goldReward ?? 0)),
        rewardSummary: value.rewardSummary ?? invitation.rewardSummary,
        followUpFlavor: value.followUpFlavor ?? invitation.followUpFlavor,
        itemRewards: Array.isArray(value.itemRewards)
          ? value.itemRewards
              .filter((reward): reward is NpcOutingItemReward =>
                Boolean(reward) &&
                typeof reward.itemId === "string" &&
                reward.itemId.length > 0 &&
                typeof reward.quantity === "number" &&
                Number.isFinite(reward.quantity)
              )
              .map((reward) => ({ itemId: reward.itemId, quantity: Math.max(1, Math.floor(reward.quantity)) }))
          : invitation.itemRewards ?? [],
        ...(value.imageUnlockId ?? invitation.imageUnlockId
          ? { imageUnlockId: value.imageUnlockId ?? invitation.imageUnlockId }
          : {}),
        ...(value.memoryEventId ? { memoryEventId: value.memoryEventId } : {}),
      };

      return [completion];
    });
}

export function normalizeNpcSocialActionResult(result: unknown): NpcSocialActionResult | null {
  if (!result || typeof result !== "object") return null;

  const value = result as Partial<NpcSocialActionResult>;
  if (!value.npcId || !value.kind || !value.title || !value.dialogue) return null;
  if (value.kind !== "gift" && value.kind !== "invitation") return null;

  return {
    success: Boolean(value.success),
    kind: value.kind,
    npcId: value.npcId,
    title: value.title,
    dialogue: value.dialogue,
    relationshipGain: Math.trunc(value.relationshipGain ?? 0),
    day: Math.max(1, Math.floor(value.day ?? 1)),
    itemId: value.itemId,
    reaction: value.reaction,
    invitationId: value.invitationId,
    timeCostMinutes: value.timeCostMinutes,
  };
}

export function getNpcOutingCompletionCounts(log: NpcOutingCompletionLog) {
  return log.reduce<Record<string, number>>((counts, outing) => {
    counts[outing.invitationId] = (counts[outing.invitationId] ?? 0) + 1;
    return counts;
  }, {});
}

export function buildNpcOutingCompletion(
  invitation: NpcInvitationOption,
  dayCompleted: number,
  memoryEventId?: string
): NpcOutingCompletion {
  return {
    id: `${invitation.id}-${dayCompleted}-${Date.now()}`,
    npcId: invitation.npcId,
    invitationId: invitation.id,
    title: invitation.title,
    completed: true,
    dayCompleted,
    sceneText: invitation.sceneText,
    relationshipReward: invitation.relationshipGain,
    goldReward: invitation.goldReward ?? 0,
    rewardSummary: invitation.rewardSummary,
    followUpFlavor: invitation.followUpFlavor,
    itemRewards: invitation.itemRewards ?? [],
    ...(invitation.imageUnlockId ? { imageUnlockId: invitation.imageUnlockId } : {}),
    ...(memoryEventId ? { memoryEventId } : {}),
  };
}

export function getNpcInvitationAvailability(
  npcId: string,
  relationshipLevel: RelationshipLevel,
  invitationRecords: NpcInvitationRecordMap,
  currentDay: number,
  miniChainProgress: NpcMiniChainProgressMap = {}
): NpcInvitationAvailability[] {
  return NPC_INVITATION_OPTIONS
    .filter((option) => option.npcId === npcId)
    .map((option) => {
      const levelLocked = relationshipLevel < option.requiredLevel;
      const usedToday = invitationRecords[option.id] === currentDay;
      const routeLocked = option.requiredMiniChainMilestoneId
        ? !miniChainProgress[npcId]?.completedMilestoneIds.includes(option.requiredMiniChainMilestoneId)
        : false;

      return {
        ...option,
        available: !levelLocked && !routeLocked && !usedToday,
        reason: levelLocked
          ? `Requires relationship level ${option.requiredLevel}.`
          : routeLocked
            ? `Requires route milestone: ${formatMiniChainMilestoneId(option.requiredMiniChainMilestoneId ?? "")}.`
            : usedToday
              ? "Already spent time together today."
              : option.isRoutePayoff
                ? "Route payoff available today."
                : "Available today.",
      };
    });
}

function formatMiniChainMilestoneId(milestoneId: string) {
  return milestoneId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
