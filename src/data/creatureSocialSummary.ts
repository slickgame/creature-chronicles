import {
  getCreatureRelationshipKind,
  getCreatureRelationshipState,
  type CreatureRelationshipRecord,
} from "@/data/creatureRelationships";
import type { GameSave } from "@/types/save";

export type RanchSocialSummary = {
  totalRelationships: number;
  friendships: number;
  familyBonds: number;
  rivalries: number;
  dailyStories: number;
  strongestBond: {
    leftName: string;
    rightName: string;
    affinity: number;
    label: string;
  } | null;
};

function relationshipLabel(record: CreatureRelationshipRecord): string {
  const kind = getCreatureRelationshipKind(record);
  return kind.replaceAll("_", " ");
}

export function getRanchSocialSummary(save: GameSave): RanchSocialSummary {
  const records = Object.values(getCreatureRelationshipState(save).recordsByRelationshipId);
  const namesById = new Map((save.creatures ?? []).map((creature) => [String(creature.creatureId), creature.nickname]));
  const strongest = [...records].sort((left, right) => right.affinity - left.affinity || right.sharedEvents - left.sharedEvents)[0];

  return {
    totalRelationships: records.length,
    friendships: records.filter((record) => ["friend", "close_friend"].includes(getCreatureRelationshipKind(record))).length,
    familyBonds: records.filter((record) => record.family).length,
    rivalries: records.filter((record) => ["rival", "strained"].includes(getCreatureRelationshipKind(record))).length,
    dailyStories: Math.max(0, Number(save.flags.creatureDailyStoriesCreated ?? 0) || 0),
    strongestBond: strongest
      ? {
          leftName: namesById.get(String(strongest.creatureIds[0])) ?? "Former ranch creature",
          rightName: namesById.get(String(strongest.creatureIds[1])) ?? "Former ranch creature",
          affinity: strongest.affinity,
          label: relationshipLabel(strongest),
        }
      : null,
  };
}
