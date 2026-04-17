import { TOWN_NPC_DATA, type TownNpcGiftPreference } from "@/lib/town/npcData";
import type { RelationshipLevel } from "@/lib/town/relationshipDefaults";

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
  relationshipGain: number;
  timeCostMinutes: number;
};

export type NpcInvitationAvailability = NpcInvitationOption & {
  available: boolean;
  reason: string;
};

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
    relationshipGain: 14,
    timeCostMinutes: 45,
  },
  {
    id: "maris_after_hours_rows",
    npcId: "maris_thorn",
    requiredLevel: 5,
    title: "After-Hours Rows",
    flavorText:
      "Maris saves the last light for you, all low laughter, warm glass, and the sort of praise she does not bother softening anymore.",
    unavailableText: "Maris is not quite ready to make the greenhouse that private.",
    relationshipGain: 20,
    timeCostMinutes: 60,
  },
  {
    id: "selene_market_stroll",
    npcId: "selene_voss",
    requiredLevel: 3,
    title: "Market Stroll",
    flavorText:
      "Selene lets you walk beside her through the better stalls, correcting your eye for quality with a smile that feels like a challenge.",
    unavailableText: "Selene reserves private market time for suppliers who have proven their value.",
    relationshipGain: 14,
    timeCostMinutes: 45,
  },
  {
    id: "selene_after_hours_ledger",
    npcId: "selene_voss",
    requiredLevel: 5,
    title: "After-Hours Ledger",
    flavorText:
      "Selene draws the curtains on the exchange and reviews the day's private terms with you close enough to make every pause deliberate.",
    unavailableText: "Selene's after-hours ledger is still closed to you.",
    relationshipGain: 20,
    timeCostMinutes: 60,
  },
  {
    id: "tamsin_kitchen_tea",
    npcId: "tamsin_vale",
    requiredLevel: 3,
    title: "Kitchen Tea",
    flavorText:
      "Tamsin sets aside a quiet cup for you, warm fingers brushing the rim as she asks whether you have been feeding yourself properly.",
    unavailableText: "Tamsin will make time for a private cup once your visits feel less like errands.",
    relationshipGain: 14,
    timeCostMinutes: 45,
  },
  {
    id: "tamsin_lamplit_table",
    npcId: "tamsin_vale",
    requiredLevel: 5,
    title: "Lamplit Table",
    flavorText:
      "Tamsin saves a small table after closing, the kitchen hushed and golden while she spoils you with her full attention.",
    unavailableText: "Tamsin's lamplit table is waiting for a more intimate trust.",
    relationshipGain: 20,
    timeCostMinutes: 60,
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

export function getNpcInvitationAvailability(
  npcId: string,
  relationshipLevel: RelationshipLevel,
  invitationRecords: NpcInvitationRecordMap,
  currentDay: number
): NpcInvitationAvailability[] {
  return NPC_INVITATION_OPTIONS
    .filter((option) => option.npcId === npcId)
    .map((option) => {
      const levelLocked = relationshipLevel < option.requiredLevel;
      const usedToday = invitationRecords[option.id] === currentDay;

      return {
        ...option,
        available: !levelLocked && !usedToday,
        reason: levelLocked
          ? `Requires relationship level ${option.requiredLevel}.`
          : usedToday
            ? "Already spent time together today."
            : "Available today.",
      };
    });
}

