import type { BreedingAttemptId, CreatureId } from "./ids";
import type { CreatureAbility, CreatureStats, StatGrades } from "./creature";

export type BreedingRole = "giver" | "receiver";
export type BreedingParticipantKind = "player" | "creature";
export type BreedingOutcomeType = "pregnancy" | "failed";
export type BreedingSceneFamily = "player" | "feline" | "canine" | "bovine" | "lapine" | "equine" | "unknown";

export type BreedingProgressionEvent = {
  participantId: string;
  displayName: string;
  kind: BreedingParticipantKind;
  xpBefore: number;
  xpAfter: number;
  xpToNextBefore: number;
  xpToNextAfter: number;
  levelBefore: number;
  levelAfter: number;
  levelUps: number;
  statGrowth: Partial<CreatureStats>;
  gradeChanges?: Partial<Record<keyof CreatureStats, string>>;
  abilityTriggers: string[];
};

export type BreedingParticipant = {
  participantId: string;
  kind: BreedingParticipantKind;
  creatureId?: CreatureId;
  displayName: string;
  familyLabel: string;
  sceneFamily: BreedingSceneFamily;
  roleTags: readonly BreedingRole[];
  energy: number;
  maxEnergy: number;
  hearts: number;
  maxHearts: number;
  affection: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
  stats?: CreatureStats;
  statGrades?: StatGrades;
  abilities?: CreatureAbility[];
  isPregnant?: boolean;
  pregnancyDaysRemaining?: number;
  isInjured?: boolean;
  unavailableReason?: string | null;
  canBreed?: boolean;
  description?: string;
  portraitPath: string;
  profilePath?: string;
};

export type BreedingPairKey = string;

export type BreedingStreakRecord = {
  pairKey: BreedingPairKey;
  participantAId: string;
  participantBId: string;
  streakCount: number;
  lastAttemptDayNumber: number;
  lastOutcome: BreedingOutcomeType;
};

export type BreedingAttemptRecord = {
  attemptId: BreedingAttemptId;
  dayNumber: number;
  giverId: string;
  receiverId: string;
  giverName: string;
  receiverName: string;
  giverFamily: BreedingSceneFamily;
  receiverFamily: BreedingSceneFamily;
  pregnancyChance: number;
  energyCost: number;
  heartCost: number;
  xpGain: number;
  breederXpGain: number;
  streakBefore: number;
  streakAfter: number;
  outcome: BreedingOutcomeType;
  roll: number;
  summary: string;
  progression: BreedingProgressionEvent[];
};
