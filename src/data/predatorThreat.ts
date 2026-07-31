import {
  getBuilderPredatorPressure,
  getBuilderSecurityBonus,
  getBuiltFutureHabitatIds,
  isBuilderProjectBuilt,
} from "@/data/builderProjects";
import { getChapterTwoDoctrineBonuses } from "@/data/chapterTwoTroubleBeyondFence";
import { getChapterTwoAftermathBonuses } from "@/data/chapterTwoWoodlineAftermath";
import type { GameSave } from "@/types/save";

export type PredatorThreatTier = "none" | "low" | "guarded" | "elevated" | "severe";

export type PredatorThreatAssessment = {
  eligible: boolean;
  tier: PredatorThreatTier;
  eventChance: number;
  pressure: number;
  security: number;
  requiredSecurity: number;
  reasons: string[];
  blockers: string[];
  likelyPredator: "foxes" | "feral_hounds" | "wolves" | "boars";
};

export const PREDATOR_EVENT_ASSETS = {
  repelled: "/images/events/predators/predators_repelled.svg",
  breached: "/images/events/predators/predators_breached.svg",
} as const;

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function getPredatorThreatAssessment(save: GameSave): PredatorThreatAssessment {
  const creatureCount = (save.creatures ?? []).length;
  const feedStock = numberFlag(save.flags.ranchFeedStock);
  const ranchDamage = numberFlag(save.flags.ranchDamage);
  const patrolScore = numberFlag(save.flags.ranchSecurityScoreToday);
  const permanentSecurity = getBuilderSecurityBonus(save);
  const habitatPressure = getBuilderPredatorPressure(save);
  const builtFutureHabitats = getBuiltFutureHabitatIds(save);
  const doctrine = getChapterTwoDoctrineBonuses(save);
  const aftermath = getChapterTwoAftermathBonuses(save);
  const chapterGate = save.flags.chapterOneGuidedComplete === true ||
    save.flags.m24ChapterOneStoryComplete === true ||
    save.dayState.dayNumber >= 7;

  const reasons: string[] = [];
  const blockers: string[] = [];
  let pressure = 0;

  if (creatureCount >= 7) {
    const livestockPressure = Math.min(24, 8 + (creatureCount - 7) * 2);
    pressure += livestockPressure;
    reasons.push(`${creatureCount} resident creatures create ${livestockPressure} livestock pressure.`);
  }
  if (feedStock >= 12) {
    const feedPressure = Math.min(18, 6 + Math.floor((feedStock - 12) / 3));
    pressure += feedPressure;
    reasons.push(`${feedStock} stored Feed creates ${feedPressure} scent pressure.`);
  }
  if (ranchDamage >= 20) {
    const damagePressure = Math.min(22, 8 + Math.floor((ranchDamage - 20) / 5));
    pressure += damagePressure;
    reasons.push(`${ranchDamage}/100 ranch damage creates ${damagePressure} breach pressure.`);
  }
  if (habitatPressure > 0) {
    pressure += habitatPressure;
    reasons.push(`Expanded land and livestock habitats add ${habitatPressure} predator pressure.`);
  }
  if (doctrine.pressureReduction > 0) {
    pressure = Math.max(0, pressure - doctrine.pressureReduction);
    reasons.push(`Quiet Pastures routines remove ${doctrine.pressureReduction} Predator Pressure.`);
  }
  if (aftermath.pressureReduction > 0) {
    pressure = Math.max(0, pressure - aftermath.pressureReduction);
    reasons.push(`The Woodline aftermath operation removes another ${aftermath.pressureReduction} Predator Pressure.`);
  }

  if (!chapterGate) blockers.push("Predator incidents remain disabled until Chapter 1 is complete or Day 7 begins.");
  const hasAttractor = creatureCount >= 7 || feedStock >= 12 || builtFutureHabitats.length > 0;
  if (!hasAttractor) blockers.push("The ranch does not yet have enough livestock, stored feed, or expansion habitats to attract predators.");
  if (chapterGate && hasAttractor && pressure < 18) {
    blockers.push(`Predator pressure ${pressure} is below the 18-point incident threshold.`);
  }

  const security = 6 + patrolScore + permanentSecurity + doctrine.security + aftermath.security;
  if (doctrine.security > 0) reasons.push(`Fortified Perimeter doctrine adds ${doctrine.security} permanent Security.`);
  if (aftermath.security > 0) reasons.push(`Woodline fallback gates add ${aftermath.security} permanent Security.`);
  const requiredSecurity = Math.max(18, pressure + 6);
  const eligible = chapterGate && hasAttractor && pressure >= 18 && security < requiredSecurity;
  const eventChance = eligible ? clamp(12 + pressure - Math.floor(security * 0.65), 8, 72) : 0;

  let tier: PredatorThreatTier = "none";
  if (eligible && eventChance >= 55) tier = "severe";
  else if (eligible && eventChance >= 32) tier = "elevated";
  else if (eligible) tier = "low";
  else if (pressure >= 18 && security >= requiredSecurity) tier = "guarded";

  let likelyPredator: PredatorThreatAssessment["likelyPredator"] = "foxes";
  if (isBuilderProjectBuilt(save, "woodline_acre_land") && creatureCount >= 12) likelyPredator = "wolves";
  else if (ranchDamage >= 50) likelyPredator = "feral_hounds";
  else if (feedStock >= 24) likelyPredator = "boars";

  if (!eligible && pressure >= 18 && security >= requiredSecurity) {
    blockers.push(`Security ${security} meets the current ${requiredSecurity} requirement.`);
  }

  return {
    eligible,
    tier,
    eventChance,
    pressure,
    security,
    requiredSecurity,
    reasons,
    blockers,
    likelyPredator,
  };
}

export function getPredatorBattleStartingHpPercent(assessment: PredatorThreatAssessment): number {
  if (!assessment.eligible) return 100;
  const securityAdvantage = Math.max(0, assessment.security - Math.floor(assessment.pressure * 0.45));
  return clamp(82 - securityAdvantage, 55, 82);
}

export function getPredatorFailurePenaltyPreview(assessment: PredatorThreatAssessment): string[] {
  if (!assessment.eligible) return ["No predator penalty is currently possible."];
  if (assessment.tier === "severe") {
    return ["Lose 6–10 Feed", "Gain 12–20 ranch damage", "One available creature may be injured for 1–2 days"];
  }
  if (assessment.tier === "elevated") {
    return ["Lose 4–7 Feed", "Gain 8–14 ranch damage", "Small chance of a one-day injury"];
  }
  return ["Lose 2–4 Feed", "Gain 4–8 ranch damage"];
}
