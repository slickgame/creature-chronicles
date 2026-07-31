import {
  PREDATOR_EVENT_VERSION,
  PREDATOR_HISTORY_FLAG,
  PREDATOR_LAST_EVENT_FLAG,
  PREDATOR_PENDING_EVENT_FLAG,
  getPendingPredatorEvent,
  recordPredatorBattleOutcome,
  type PredatorKind,
  type PredatorNightEvent,
} from "@/data/predatorEvents";
import { PREDATOR_EVENT_ASSETS, getPredatorThreatAssessment, type PredatorThreatTier } from "@/data/predatorThreat";
import type { BattleOutcome } from "@/types/battle";
import type { GameSave } from "@/types/save";

export type PredatorDevTier = Extract<PredatorThreatTier, "low" | "elevated" | "severe">;
export type PredatorDevApproach = "intercepted" | "breach";

export type PredatorDevResult = {
  save: GameSave;
  ok: boolean;
  message: string;
  event: PredatorNightEvent | null;
};

function numericFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function predatorLabel(kind: PredatorKind): string {
  if (kind === "feral_hounds") return "Feral Hound Pack";
  if (kind === "wolves") return "Woodline Wolf Pack";
  if (kind === "boars") return "Ridge Boar Sounder";
  return "Night Fox Pack";
}

function rewardPreview(tier: PredatorDevTier): string[] {
  if (tier === "severe") return ["110 Gold", "3 Guild Points", "5 Materials"];
  if (tier === "elevated") return ["75 Gold", "2 Guild Points", "3 Materials"];
  return ["45 Gold", "1 Guild Point", "2 Materials"];
}

function penaltyPreview(tier: PredatorDevTier): string[] {
  if (tier === "severe") return ["Lose 7–10 Feed", "Gain 14–20 ranch damage", "One defender may be injured for 2 days"];
  if (tier === "elevated") return ["Lose 4–7 Feed", "Gain 8–14 ranch damage", "One defender may be bruised for 1 day"];
  return ["Lose 2–4 Feed", "Gain 4–8 ranch damage"];
}

function pressureForTier(tier: PredatorDevTier): number {
  if (tier === "severe") return 62;
  if (tier === "elevated") return 42;
  return 24;
}

function startingHpForApproach(tier: PredatorDevTier, approach: PredatorDevApproach): number {
  if (approach === "breach") return 100;
  if (tier === "severe") return 76;
  if (tier === "elevated") return 68;
  return 60;
}

export function createForcedPredatorIncident(
  save: GameSave,
  predatorType: PredatorKind,
  tier: PredatorDevTier,
  approach: PredatorDevApproach,
): PredatorDevResult {
  const existing = getPendingPredatorEvent(save);
  if (existing) {
    return { save, ok: false, event: existing, message: `Resolve or clear ${existing.predatorName} before creating another incident.` };
  }

  const assessment = getPredatorThreatAssessment(save);
  const serial = numericFlag(save.flags.predatorDevIncidentSerial) + 1;
  const pressure = Math.max(assessment.pressure, pressureForTier(tier));
  const security = assessment.security;
  const requiredSecurity = Math.max(assessment.requiredSecurity, pressure + 6);
  const intercepted = approach === "intercepted";
  const startingHpPercent = startingHpForApproach(tier, approach);
  const predatorName = predatorLabel(predatorType);
  const eventId = `dev_predator_${save.saveId}_${save.dayState.dayNumber}_${serial}_${predatorType}`;
  const summary = intercepted
    ? `Developer test: ranch security intercepted ${predatorName.toLowerCase()}. The attackers begin wounded at ${startingHpPercent}% HP.`
    : `Developer test: ${predatorName} breached the outer line at full strength.`;
  const event: PredatorNightEvent = {
    version: PREDATOR_EVENT_VERSION,
    eventId,
    dayNumber: save.dayState.dayNumber,
    nightOfDayNumber: Math.max(1, save.dayState.dayNumber - 1),
    predatorType,
    predatorName,
    tier,
    status: "battle_pending",
    intercepted,
    startingHpPercent,
    eventChance: 100,
    pressure,
    security,
    requiredSecurity,
    reasons: ["Developer-forced vacation test incident.", ...assessment.reasons],
    summary,
    imagePath: intercepted ? PREDATOR_EVENT_ASSETS.repelled : PREDATOR_EVENT_ASSETS.breached,
    rewardPreview: rewardPreview(tier),
    penaltyPreview: penaltyPreview(tier),
  };

  return {
    ok: true,
    event,
    message: `${predatorName} created as a ${tier} ${approach === "intercepted" ? "intercepted" : "full-strength breach"} incident.`,
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      flags: {
        ...save.flags,
        [PREDATOR_PENDING_EVENT_FLAG]: JSON.stringify(event),
        predatorBattlePending: true,
        predatorBattleEventId: event.eventId,
        predatorBattleStartingHpPercent: event.startingHpPercent,
        predatorDevIncidentSerial: serial,
        m64PredatorDevControls: true,
      },
    },
  };
}

export function prepareNaturalPredatorTestConditions(save: GameSave): PredatorDevResult {
  const feed = Math.max(30, numericFlag(save.flags.ranchFeedStock));
  const damage = Math.max(25, numericFlag(save.flags.ranchDamage));
  return {
    ok: true,
    event: getPendingPredatorEvent(save),
    message: "Natural predator test conditions prepared: story gate open, 30+ Feed, and 25+ ranch damage. End days normally until the deterministic incident roll succeeds.",
    save: {
      ...save,
      updatedAt: new Date().toISOString(),
      flags: {
        ...save.flags,
        chapterOneGuidedComplete: true,
        ranchFeedStock: feed,
        ranchDamage: damage,
        predatorLastCheckDayNumber: 0,
        m64PredatorDevControls: true,
      },
    },
  };
}

export function resolvePendingPredatorDevOutcome(save: GameSave, outcome: BattleOutcome): PredatorDevResult {
  const pending = getPendingPredatorEvent(save);
  if (!pending) return { save, ok: false, event: null, message: "No pending predator incident exists." };
  const teamIds = (save.creatures ?? []).slice(0, 3).map((creature) => creature.creatureId);
  const result = recordPredatorBattleOutcome(save, pending.eventId, outcome, 1, teamIds);
  return { save: result.save, ok: !result.duplicate, event: result.event, message: result.message };
}

export function clearPendingPredatorDevIncident(save: GameSave, clearHistory = false): PredatorDevResult {
  const pending = getPendingPredatorEvent(save);
  const flags = { ...save.flags };
  flags[PREDATOR_PENDING_EVENT_FLAG] = false;
  flags.predatorBattlePending = false;
  flags.predatorBattleEventId = "";
  flags.predatorBattleStartingHpPercent = 0;
  flags.devForcePredatorEvent = false;
  flags.devForcePredatorIntercept = false;
  flags.devForcePredatorType = "";
  if (clearHistory) {
    flags[PREDATOR_LAST_EVENT_FLAG] = false;
    flags[PREDATOR_HISTORY_FLAG] = "[]";
    flags.predatorVictories = 0;
    flags.predatorDefeats = 0;
    flags.predatorDraws = 0;
  }
  return {
    ok: true,
    event: null,
    message: pending ? `${pending.predatorName} test incident cleared.` : clearHistory ? "Predator test state and history cleared." : "No pending predator incident was present.",
    save: { ...save, updatedAt: new Date().toISOString(), flags },
  };
}
