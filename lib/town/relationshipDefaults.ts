import { FARM_ECONOMY_NPC_IDS } from "@/lib/town/npcData";

export type RelationshipRank =
  | "stranger"
  | "interested"
  | "familiar"
  | "close"
  | "intimate";

export type NpcRelationshipState = {
  npcId: string;
  points: number;
  level: number;
  rank: RelationshipRank;
  unlockedFlags: string[];
  lastGiftedItemId?: string | null;
  notes?: string[];
};

export type TownRelationshipState = Record<string, NpcRelationshipState>;

export function getRelationshipRank(level: number): RelationshipRank {
  if (level >= 5) return "intimate";
  if (level >= 4) return "close";
  if (level >= 2) return "familiar";
  if (level >= 1) return "interested";
  return "stranger";
}

export function createDefaultNpcRelationshipState(npcId: string): NpcRelationshipState {
  return {
    npcId,
    points: 0,
    level: 0,
    rank: "stranger",
    unlockedFlags: [],
    lastGiftedItemId: null,
    notes: [],
  };
}

export function createDefaultTownRelationships(): TownRelationshipState {
  return Object.fromEntries(
    FARM_ECONOMY_NPC_IDS.map((npcId) => [npcId, createDefaultNpcRelationshipState(npcId)])
  );
}

export function addRelationshipPoints(
  state: NpcRelationshipState,
  amount: number
): NpcRelationshipState {
  const nextPoints = Math.max(0, state.points + amount);
  const nextLevel =
    nextPoints >= 100 ? 5 :
    nextPoints >= 70 ? 4 :
    nextPoints >= 40 ? 3 :
    nextPoints >= 20 ? 2 :
    nextPoints >= 8 ? 1 : 0;

  return {
    ...state,
    points: nextPoints,
    level: nextLevel,
    rank: getRelationshipRank(nextLevel),
  };
}
