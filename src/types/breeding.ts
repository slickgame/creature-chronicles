import type { BreedingAttemptId, CreatureId } from "./ids";

export type BreedingRole = "giver" | "receiver";
export type BreedingParticipantKind = "player" | "creature";
export type BreedingOutcomeType = "pregnancy" | "failed";

export type BreedingParticipant = {
  participantId: string;
  kind: BreedingParticipantKind;
  creatureId?: CreatureId;
  displayName: string;
  familyLabel: string;
  roleTags: BreedingRole[];
  energy: number;
  maxEnergy: number;
  affection: number;
  portraitPath: string;
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
  pregnancyChance: number;
  energyCost: number;
  heartCost: number;
  xpGain: number;
  streakBefore: number;
  streakAfter: number;
  outcome: BreedingOutcomeType;
  resultText: string;
  createdAt: string;
};

export type BreedingState = {
  hearts: number;
  maxHearts: number;
  attempts: BreedingAttemptRecord[];
  streaks: BreedingStreakRecord[];
};

export type BreedingPreview = {
  pairKey: BreedingPairKey;
  pregnancyChance: number;
  baseChance: number;
  streakBonus: number;
  streakCount: number;
  energyCost: number;
  heartCost: number;
  xpGain: number;
  canAttempt: boolean;
  blockedReason: string | null;
};
