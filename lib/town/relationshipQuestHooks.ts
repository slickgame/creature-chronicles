import type {
  NpcRelationshipState,
  RelationshipProgressResult,
} from "@/lib/town/relationshipDefaults";
import { applyQuestRelationshipReward } from "@/lib/town/relationshipDefaults";

export type NpcQuestRelationshipReward = {
  npcId: string;
  questType: "delivery" | "favor" | "story" | "event" | "shop_request";
  difficulty: "easy" | "normal" | "hard";
};

export function applyNpcQuestRewardMap(
  relationships: Record<string, NpcRelationshipState>,
  reward: NpcQuestRelationshipReward
): {
  relationships: Record<string, NpcRelationshipState>;
  result: RelationshipProgressResult | null;
} {
  const current = relationships[reward.npcId];
  if (!current) {
    return { relationships, result: null };
  }

  const result = applyQuestRelationshipReward(
    current,
    reward.questType,
    reward.difficulty
  );

  return {
    relationships: {
      ...relationships,
      [reward.npcId]: result.state,
    },
    result,
  };
}
