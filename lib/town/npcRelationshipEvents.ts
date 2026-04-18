import type { FarmEconomyNpcId } from "@/lib/game/npcEconomy";
import type { NpcContractOfferKind } from "@/lib/town/npcContractLedger";
import type { RelationshipLevel } from "@/lib/town/relationshipDefaults";

export type NpcRelationshipEventSourceKind = NpcContractOfferKind | "npc_outing";
export type NpcContractCompletionHistory = Record<string, number>;

export type NpcRelationshipEventScene = {
  id: string;
  npcId: FarmEconomyNpcId;
  title: string;
  subtitle: string;
  sceneText: string;
  rewardSummary: string;
  requiredRelationshipLevel: RelationshipLevel;
  eligibleOfferKinds: NpcContractOfferKind[];
  completionHistoryKey: string;
  requiredCompletionCount: number;
  imageUnlockId?: string;
};

export type NpcRelationshipEventUnlock = NpcRelationshipEventScene & {
  unlockedDay: number;
  sourceOfferId: string;
  sourceOfferKind: NpcRelationshipEventSourceKind;
};

export type NpcRelationshipEventEligibilityInput = {
  npcId: FarmEconomyNpcId;
  relationshipLevel: RelationshipLevel;
  offerId: string;
  offerKind: NpcContractOfferKind;
  currentDay: number;
  eventFlags: readonly string[];
  completionHistory: NpcContractCompletionHistory;
};

export const NPC_RELATIONSHIP_EVENT_SCENES: NpcRelationshipEventScene[] = [
  {
    id: "maris_seed_counter_warmup",
    npcId: "maris_thorn",
    title: "Seed Counter Warmth",
    subtitle: "Maris starts saving the better sacks where only you can see them.",
    sceneText:
      "Maris lets her fingers linger over the tied seed sack before sliding it across the counter. Her grin is all country sunshine and trouble. \"You're becoming a habit, sweetheart. A useful one. Keep bringing me proof that my stock thrives in your hands, and I may start making the good bundles a little more personal.\"",
    rewardSummary: "Maris ledger events can now tease future greenhouse and private-stock scenes.",
    requiredRelationshipLevel: 2,
    eligibleOfferKinds: ["maris_bundle", "maris_grower_deal"],
    completionHistoryKey: "maris_thorn:total",
    requiredCompletionCount: 1,
    imageUnlockId: "maris_counter_smile",
  },
  {
    id: "maris_greenhouse_invitation",
    npcId: "maris_thorn",
    title: "Greenhouse Invitation",
    subtitle: "Her teasing turns possessive enough to feel like a promise.",
    sceneText:
      "When the delivery is counted, Maris hooks one thumb toward the greenhouse door. \"You know,\" she says softly, \"some growers need closer supervision. If you keep spoiling my expectations like this, I might have to get you alone among the warm rows and see exactly what else blooms for me.\"",
    rewardSummary: "Future Maris level 4+ offers carry more intimate greenhouse flavor.",
    requiredRelationshipLevel: 4,
    eligibleOfferKinds: ["maris_grower_deal"],
    completionHistoryKey: "maris_thorn:maris_grower_deal",
    requiredCompletionCount: 2,
    imageUnlockId: "maris_greenhouse_door",
  },
  {
    id: "selene_private_buyer_glance",
    npcId: "selene_voss",
    title: "Private Buyer Glance",
    subtitle: "Selene stops treating you like a vendor and starts treating you like leverage.",
    sceneText:
      "Selene reviews the lot in silence, then looks up through her lashes with a smile sharp enough to raise the room's price. \"There you are. Quality with discipline. I can work with that.\" Her tail flicks once. \"Keep this up and I'll stop putting you on the public board.\"",
    rewardSummary: "Selene private-board story hooks are now unlocked.",
    requiredRelationshipLevel: 3,
    eligibleOfferKinds: ["selene_market_contract", "selene_premium_board"],
    completionHistoryKey: "selene_voss:total",
    requiredCompletionCount: 1,
    imageUnlockId: "selene_private_buyer",
  },
  {
    id: "selene_after_hours_terms",
    npcId: "selene_voss",
    title: "After-Hours Terms",
    subtitle: "The market feels quieter when Selene decides your attention is hers.",
    sceneText:
      "Selene closes her ledger with deliberate care. \"These terms are no longer for everyone,\" she says, voice smooth and low. \"You bring me goods worth admiring. I bring you buyers worth keeping. And after hours... perhaps we discuss what else you're learning to offer.\"",
    rewardSummary: "Future Selene level 5 contracts can lead into after-hours market scenes.",
    requiredRelationshipLevel: 5,
    eligibleOfferKinds: ["selene_premium_board"],
    completionHistoryKey: "selene_voss:selene_premium_board",
    requiredCompletionCount: 1,
    imageUnlockId: "selene_after_hours_ledger",
  },
  {
    id: "tamsin_counter_confidence",
    npcId: "tamsin_vale",
    title: "Counter Confidence",
    subtitle: "Tamsin's praise starts sounding less like service and more like appetite.",
    sceneText:
      "Tamsin accepts the delivery with both hands, warm gaze dropping to the goods before returning to you. \"Reliable ingredients. Reliable hands.\" Her smile turns tender at the edges. \"That combination can make a kitchen feel very intimate, darling. I hope you don't mind being invited closer.\"",
    rewardSummary: "Tamsin kitchen story hooks are now unlocked.",
    requiredRelationshipLevel: 3,
    eligibleOfferKinds: ["tamsin_ingredient_request", "tamsin_commission"],
    completionHistoryKey: "tamsin_vale:total",
    requiredCompletionCount: 1,
    imageUnlockId: "tamsin_counter_invite",
  },
  {
    id: "tamsin_after_hours_table",
    npcId: "tamsin_vale",
    title: "After-Hours Table",
    subtitle: "The kitchen gets warmer after the counter closes.",
    sceneText:
      "Tamsin sets the finished meal aside, but her attention stays on you. \"This deserves a proper tasting,\" she murmurs. \"Not rushed, not public. Come back when the lamps are low, and I'll show you how much care a good cook can put into one private table.\"",
    rewardSummary: "Future Tamsin level 5 commissions can build toward private dinner events.",
    requiredRelationshipLevel: 5,
    eligibleOfferKinds: ["tamsin_commission"],
    completionHistoryKey: "tamsin_vale:tamsin_commission",
    requiredCompletionCount: 1,
    imageUnlockId: "tamsin_after_hours_table",
  },
  {
    id: "maris_greenhouse_walk_memory",
    npcId: "maris_thorn",
    title: "Greenhouse Walk",
    subtitle: "Maris lets the warm rows turn a little more personal.",
    sceneText:
      "Maris leads you between rows of glass-warmed seedlings, brushing leaves aside with the back of her hand. \"These little things need patience,\" she says, glancing over her shoulder with a grin. \"So do my favorite growers. Lucky for you, I like watching both of you bloom.\"",
    rewardSummary: "Maris outings now add greenhouse follow-up flavor and a small seed-stall goodwill reward.",
    requiredRelationshipLevel: 3,
    eligibleOfferKinds: [],
    completionHistoryKey: "maris_thorn:outing:maris_greenhouse_walk",
    requiredCompletionCount: 1,
    imageUnlockId: "maris_greenhouse_walk",
  },
  {
    id: "maris_after_hours_rows_memory",
    npcId: "maris_thorn",
    title: "After-Hours Rows",
    subtitle: "The greenhouse feels private when Maris saves the last light for you.",
    sceneText:
      "With the stall closed, Maris walks beside you under amber panes and lets the silence stretch warm. \"I spoil what matters to me,\" she murmurs, nudging your shoulder with hers. \"Seeds, fields, stubborn sweethearts who keep coming back exactly when I want them.\"",
    rewardSummary: "Maris lover outings can seed future after-hours greenhouse scenes.",
    requiredRelationshipLevel: 5,
    eligibleOfferKinds: [],
    completionHistoryKey: "maris_thorn:outing:maris_after_hours_rows",
    requiredCompletionCount: 1,
    imageUnlockId: "maris_after_hours_rows",
  },
  {
    id: "selene_market_stroll_memory",
    npcId: "selene_voss",
    title: "Market Stroll",
    subtitle: "Selene teaches you how to read value while making sure you know yours.",
    sceneText:
      "Selene guides you through the better stalls with a cool hand at your elbow, naming flaws, premiums, and hidden margins. \"Quality is never accidental,\" she says. Her smile sharpens. \"Neither is the company I keep beside me.\"",
    rewardSummary: "Selene outings now add private-buyer follow-up flavor and market goodwill.",
    requiredRelationshipLevel: 3,
    eligibleOfferKinds: [],
    completionHistoryKey: "selene_voss:outing:selene_market_stroll",
    requiredCompletionCount: 1,
    imageUnlockId: "selene_market_stroll",
  },
  {
    id: "selene_after_hours_ledger_memory",
    npcId: "selene_voss",
    title: "After-Hours Ledger",
    subtitle: "Selene closes the exchange before showing you the private terms.",
    sceneText:
      "The market quiets behind drawn curtains while Selene opens a slim ledger meant for very few eyes. \"Public terms are for public people,\" she says, voice smooth and low. \"You, darling, have become a private exception.\"",
    rewardSummary: "Selene lover outings can lead into elite private-contract scenes.",
    requiredRelationshipLevel: 5,
    eligibleOfferKinds: [],
    completionHistoryKey: "selene_voss:outing:selene_after_hours_ledger",
    requiredCompletionCount: 1,
    imageUnlockId: "selene_after_hours_ledger_outing",
  },
  {
    id: "tamsin_kitchen_tea_memory",
    npcId: "tamsin_vale",
    title: "Kitchen Tea",
    subtitle: "Tamsin makes room for you where the kitchen is warmest.",
    sceneText:
      "Tamsin pours tea at the quiet end of the counter, close enough that steam curls between you. \"There,\" she says softly. \"A little warmth, a little sweetness, and someone making sure you sit still long enough to enjoy both.\"",
    rewardSummary: "Tamsin outings now add kitchen follow-up flavor and a comfort-food goodwill reward.",
    requiredRelationshipLevel: 3,
    eligibleOfferKinds: [],
    completionHistoryKey: "tamsin_vale:outing:tamsin_kitchen_tea",
    requiredCompletionCount: 1,
    imageUnlockId: "tamsin_kitchen_tea",
  },
  {
    id: "tamsin_lamplit_table_memory",
    npcId: "tamsin_vale",
    title: "Lamplit Table",
    subtitle: "Tamsin saves her gentlest attention for after closing.",
    sceneText:
      "The kitchen settles into lamplight while Tamsin sets a private plate before you. \"No rushing tonight,\" she murmurs, smile soft and pleased. \"Some appetites deserve patience, and you have been very good at earning mine.\"",
    rewardSummary: "Tamsin lover outings can lead into private table scenes and future comfort images.",
    requiredRelationshipLevel: 5,
    eligibleOfferKinds: [],
    completionHistoryKey: "tamsin_vale:outing:tamsin_lamplit_table",
    requiredCompletionCount: 1,
    imageUnlockId: "tamsin_lamplit_table",
  },
];

export function getNpcContractCompletionHistoryKey(npcId: FarmEconomyNpcId, offerKind?: NpcContractOfferKind) {
  return offerKind ? `${npcId}:${offerKind}` : `${npcId}:total`;
}

export function recordNpcContractCompletion(
  history: NpcContractCompletionHistory,
  npcId: FarmEconomyNpcId,
  offerKind: NpcContractOfferKind
): NpcContractCompletionHistory {
  const totalKey = getNpcContractCompletionHistoryKey(npcId);
  const kindKey = getNpcContractCompletionHistoryKey(npcId, offerKind);

  return {
    ...history,
    [totalKey]: (history[totalKey] ?? 0) + 1,
    [kindKey]: (history[kindKey] ?? 0) + 1,
  };
}

export function normalizeNpcRelationshipEventFlags(flags: unknown): string[] {
  return Array.isArray(flags)
    ? Array.from(new Set(flags.filter((flag): flag is string => typeof flag === "string" && flag.length > 0)))
    : [];
}

export function normalizeNpcContractCompletionHistory(history: unknown): NpcContractCompletionHistory {
  if (!history || typeof history !== "object") return {};

  return Object.fromEntries(
    Object.entries(history as Record<string, unknown>)
      .filter(([key, value]) => key.length > 0 && typeof value === "number" && Number.isFinite(value))
      .map(([key, value]) => [key, Math.max(0, Math.floor(value as number))])
  );
}

export function normalizeNpcRelationshipEventLog(log: unknown): NpcRelationshipEventUnlock[] {
  if (!Array.isArray(log)) return [];

  return log
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const value = entry as Partial<NpcRelationshipEventUnlock>;
      const event = NPC_RELATIONSHIP_EVENT_SCENES.find((scene) => scene.id === value.id);
      if (!event || !value.sourceOfferId || !value.sourceOfferKind) return null;

      return {
        ...event,
        unlockedDay: Math.max(1, Math.floor(value.unlockedDay ?? 1)),
        sourceOfferId: value.sourceOfferId,
        sourceOfferKind: value.sourceOfferKind,
      };
    })
    .filter((entry): entry is NpcRelationshipEventUnlock => Boolean(entry));
}

export function buildNpcOutingRelationshipEventUnlock(
  invitationId: string,
  currentDay: number
): NpcRelationshipEventUnlock | null {
  const event = NPC_RELATIONSHIP_EVENT_SCENES.find(
    (scene) => scene.completionHistoryKey.endsWith(`:outing:${invitationId}`)
  );

  if (!event) return null;

  return {
    ...event,
    unlockedDay: currentDay,
    sourceOfferId: invitationId,
    sourceOfferKind: "npc_outing",
  };
}

export function findEligibleNpcRelationshipEvent({
  npcId,
  relationshipLevel,
  offerId,
  offerKind,
  currentDay,
  eventFlags,
  completionHistory,
}: NpcRelationshipEventEligibilityInput): NpcRelationshipEventUnlock | null {
  const flags = new Set(eventFlags);
  const event = NPC_RELATIONSHIP_EVENT_SCENES.find((scene) => {
    if (scene.npcId !== npcId) return false;
    if (flags.has(scene.id)) return false;
    if (relationshipLevel < scene.requiredRelationshipLevel) return false;
    if (!scene.eligibleOfferKinds.includes(offerKind)) return false;
    return (completionHistory[scene.completionHistoryKey] ?? 0) >= scene.requiredCompletionCount;
  });

  if (!event) return null;

  return {
    ...event,
    unlockedDay: currentDay,
    sourceOfferId: offerId,
    sourceOfferKind: offerKind,
  };
}
