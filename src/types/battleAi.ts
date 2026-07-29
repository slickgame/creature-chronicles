import type {
  BattleAction,
  BattleCombatantId,
  BattleMoveId,
  BattleSideId,
} from "@/types/battle";

export type BattleAiDifficulty = "basic" | "tactical" | "champion";

export type BattleAiCandidate = {
  action: BattleAction;
  moveId: BattleMoveId;
  score: number;
  reasons: string[];
  projectedDamageByTarget: Partial<Record<BattleCombatantId, number>>;
  projectedHealingByTarget: Partial<Record<BattleCombatantId, number>>;
  plannedStatusKeys: string[];
};

export type BattleAiDecision = {
  difficulty: BattleAiDifficulty;
  actorId: BattleCombatantId;
  actorName: string;
  action: BattleAction;
  moveName: string;
  targetNames: string[];
  score: number;
  reasons: string[];
};

export type BattleAiPlan = {
  difficulty: BattleAiDifficulty;
  sideId: BattleSideId;
  actions: BattleAction[];
  decisions: BattleAiDecision[];
};
