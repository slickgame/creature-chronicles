export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;
export type RelationshipStageName =
  | "stranger"
  | "interested"
  | "familiar"
  | "close"
  | "lover";

export type NpcRelationshipState = {
  npcId: string;
  level: RelationshipLevel;
  progress: number; // 0-100 progress inside the current level
  unlockedFlags: string[];
  lastGiftedItemId?: string | null;
  notes?: string[];
};

export type TownRelationshipState = Record<string, NpcRelationshipState>;

export const FINAL_RELATIONSHIP_LEVEL: RelationshipLevel = 5;
export const LEVEL_PROGRESS_MAX = 100;

export function getRelationshipStageName(level: RelationshipLevel): RelationshipStageName {
  if (level === 1) return "stranger";
  if (level === 2) return "interested";
  if (level === 3) return "familiar";
  if (level === 4) return "close";
  return "lover";
}

export function createDefaultNpcRelationshipState(npcId: string): NpcRelationshipState {
  return {
    npcId,
    level: 1,
    progress: 0,
    unlockedFlags: [],
    lastGiftedItemId: null,
    notes: [],
  };
}

export function createDefaultTownRelationships(npcIds: string[]): TownRelationshipState {
  return Object.fromEntries(
    npcIds.map((npcId) => [npcId, createDefaultNpcRelationshipState(npcId)])
  );
}

export type RelationshipProgressResult = {
  state: NpcRelationshipState;
  leveledUp: boolean;
  oldLevel: RelationshipLevel;
  newLevel: RelationshipLevel;
};

export function addRelationshipProgress(
  state: NpcRelationshipState,
  amount: number
): RelationshipProgressResult {
  let level = state.level;
  let progress = Math.max(0, state.progress + amount);
  let leveledUp = false;
  const oldLevel = state.level;

  while (progress >= LEVEL_PROGRESS_MAX && level < FINAL_RELATIONSHIP_LEVEL) {
    progress -= LEVEL_PROGRESS_MAX;
    level = (level + 1) as RelationshipLevel;
    leveledUp = true;
  }

  if (level === FINAL_RELATIONSHIP_LEVEL) {
    progress = Math.min(progress, LEVEL_PROGRESS_MAX);
  }

  return {
    state: {
      ...state,
      level,
      progress,
    },
    leveledUp,
    oldLevel,
    newLevel: level,
  };
}

export function getRelationshipDisplayLabel(state: NpcRelationshipState) {
  return `Level ${state.level} — ${getRelationshipStageName(state.level)} (${state.progress}/${LEVEL_PROGRESS_MAX})`;
}

export function applyQuestRelationshipReward(
  state: NpcRelationshipState,
  questType: "delivery" | "favor" | "story" | "event" | "shop_request",
  difficulty: "easy" | "normal" | "hard"
): RelationshipProgressResult {
  const base =
    questType === "story"
      ? 30
      : questType === "event"
      ? 24
      : questType === "shop_request"
      ? 18
      : questType === "favor"
      ? 16
      : 12;

  const difficultyBonus = difficulty === "hard" ? 10 : difficulty === "normal" ? 5 : 0;

  return addRelationshipProgress(state, base + difficultyBonus);
}
