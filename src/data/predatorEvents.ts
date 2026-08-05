import {
  buildAuthoredColiseumEnemyTeam,
  type ColiseumC2EncounterDefinition,
  type ColiseumC2EncounterId,
  type ColiseumEnemySlotDefinition,
} from "@/data/coliseumC2";
import {
  CHAPTER_TWO_DEFENSE_TAG,
  getChapterTwoDoctrineBonuses,
  recordChapterTwoDefenseResolution,
  shouldForceChapterTwoDefense,
  tagChapterTwoDefenseEvent,
} from "@/data/chapterTwoTroubleBeyondFence";
import {
  PREDATOR_EVENT_ASSETS,
  getPredatorBattleStartingHpPercent,
  getPredatorThreatAssessment,
  type PredatorThreatAssessment,
  type PredatorThreatTier,
} from "@/data/predatorThreat";
import type { BattleOutcome, BattleState } from "@/types/battle";
import type { BattleAiDifficulty } from "@/types/battleAi";
import type { AbilityGrade, CreatureRecord, StatGrades } from "@/types/creature";
import type { BattleMoveId } from "@/types/battle";
import type { CreatureId, VariantId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export const PREDATOR_PENDING_EVENT_FLAG = "predatorPendingEventV1";
export const PREDATOR_LAST_EVENT_FLAG = "predatorLastEventV1";
export const PREDATOR_HISTORY_FLAG = "predatorEventHistoryV1";
export const PREDATOR_EVENT_VERSION = 1;

export type PredatorKind = PredatorThreatAssessment["likelyPredator"];
export type PredatorEventStatus = "battle_pending" | "victory" | "defeat" | "draw";

export type PredatorNightEvent = {
  version: number;
  eventId: string;
  dayNumber: number;
  nightOfDayNumber: number;
  predatorType: PredatorKind;
  predatorName: string;
  tier: PredatorThreatTier;
  status: PredatorEventStatus;
  intercepted: boolean;
  startingHpPercent: number;
  eventChance: number;
  pressure: number;
  security: number;
  requiredSecurity: number;
  reasons: string[];
  summary: string;
  imagePath: string;
  rewardPreview: string[];
  penaltyPreview: string[];
  storyTag?: string;
  resolvedOutcome?: BattleOutcome;
  resolvedRounds?: number;
  resolvedTeamCreatureIds?: CreatureId[];
  resolutionSummary?: string;
};

export type PredatorNightCheckResult = {
  save: GameSave;
  event: PredatorNightEvent | null;
  assessment: PredatorThreatAssessment;
  summary: string;
  rolled: boolean;
};

export type PredatorBattleResolution = {
  save: GameSave;
  event: PredatorNightEvent | null;
  duplicate: boolean;
  message: string;
};

function numericFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function deterministicRoll(seed: string, modulo = 100): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  return Math.abs(hash) % Math.max(1, modulo);
}

function parseEvent(value: boolean | number | string | undefined): PredatorNightEvent | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PredatorNightEvent>;
    if (!parsed.eventId || !parsed.predatorType || !parsed.status) return null;
    return parsed as PredatorNightEvent;
  } catch {
    return null;
  }
}

function parseHistory(value: boolean | number | string | undefined): PredatorNightEvent[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.eventId === "string") : [];
  } catch {
    return [];
  }
}

function predatorLabel(kind: PredatorKind): string {
  if (kind === "feral_hounds") return "Feral Hound Pack";
  if (kind === "wolves") return "Woodline Wolf Pack";
  if (kind === "boars") return "Ridge Boar Sounder";
  return "Night Fox Pack";
}

function rewardPreview(tier: PredatorThreatTier): string[] {
  if (tier === "severe") return ["110 Gold", "3 Guild Points", "5 Materials"];
  if (tier === "elevated") return ["75 Gold", "2 Guild Points", "3 Materials"];
  return ["45 Gold", "1 Guild Point", "2 Materials"];
}

function penaltyPreview(tier: PredatorThreatTier): string[] {
  if (tier === "severe") return ["Lose 7–10 Feed", "Gain 14–20 ranch damage", "One defender may be injured for 2 days"];
  if (tier === "elevated") return ["Lose 4–7 Feed", "Gain 8–14 ranch damage", "One defender may be bruised for 1 day"];
  return ["Lose 2–4 Feed", "Gain 4–8 ranch damage"];
}

export function getPendingPredatorEvent(save: GameSave): PredatorNightEvent | null {
  const event = parseEvent(save.flags[PREDATOR_PENDING_EVENT_FLAG]);
  return event?.status === "battle_pending" ? event : null;
}

export function getLatestPredatorEvent(save: GameSave): PredatorNightEvent | null {
  return parseEvent(save.flags[PREDATOR_LAST_EVENT_FLAG]) ?? getPendingPredatorEvent(save);
}

export function resolvePredatorNightCheck(save: GameSave, securityScore: number): PredatorNightCheckResult {
  const pending = getPendingPredatorEvent(save);
  const assessmentInput: GameSave = {
    ...save,
    flags: { ...save.flags, ranchSecurityScoreToday: Math.max(0, Math.round(securityScore)) },
  };
  const assessment = getPredatorThreatAssessment(assessmentInput);
  if (pending) {
    return { save: assessmentInput, event: pending, assessment, summary: pending.summary, rolled: false };
  }

  const chapterTwoForced = shouldForceChapterTwoDefense(assessmentInput);
  const lastCheckedDay = numericFlag(save.flags.predatorLastCheckDayNumber);
  if (!chapterTwoForced && lastCheckedDay >= save.dayState.dayNumber) {
    return {
      save: assessmentInput,
      event: null,
      assessment,
      summary: String(save.flags.predatorLastCheckSummary ?? "The overnight predator check was already resolved."),
      rolled: false,
    };
  }

  const devForced = save.flags.devForcePredatorEvent === true;
  const forced = devForced || chapterTwoForced;
  const forcedType = chapterTwoForced ? "wolves" : String(save.flags.devForcePredatorType ?? "");
  const roll = deterministicRoll(`${save.saveId}:predator-check:${save.dayState.dayNumber}`, 100);
  const occurred = forced || (assessment.eligible && roll < assessment.eventChance);

  if (!occurred) {
    const summary = assessment.eligible
      ? `Predator pressure was present, but the night passed without an attack (${roll}/${assessment.eventChance} incident roll).`
      : assessment.blockers[0] ?? "The ranch did not meet the conditions for a predator incident.";
    return {
      save: {
        ...assessmentInput,
        flags: {
          ...assessmentInput.flags,
          predatorLastCheckDayNumber: save.dayState.dayNumber,
          predatorLastCheckSummary: summary,
          predatorThreatTierToday: assessment.tier,
          predatorThreatChanceToday: assessment.eventChance,
          predatorThreatPressureToday: assessment.pressure,
          predatorThreatSecurityToday: assessment.security,
          m62ConditionGatedPredators: true,
        },
      },
      event: null,
      assessment,
      summary,
      rolled: true,
    };
  }

  const predatorType = (["foxes", "feral_hounds", "wolves", "boars"] as PredatorKind[]).includes(forcedType as PredatorKind)
    ? forcedType as PredatorKind
    : assessment.likelyPredator;
  const doctrine = getChapterTwoDoctrineBonuses(save);
  const interceptChance = clamp(18 + assessment.security * 3 - assessment.pressure + doctrine.intercept, 8, 96);
  const interceptRoll = deterministicRoll(`${save.saveId}:predator-intercept:${save.dayState.dayNumber}`, 100);
  const intercepted = save.flags.devForcePredatorIntercept === true || interceptRoll < interceptChance;
  const baseStartingHp = intercepted ? getPredatorBattleStartingHpPercent({ ...assessment, eligible: true }) : 100;
  const startingHpPercent = intercepted && doctrine.intercept > 0 ? clamp(baseStartingHp - 10, 45, 82) : baseStartingHp;
  const eventId = chapterTwoForced
    ? `chapter_two_defense_${save.saveId}_${save.dayState.dayNumber}`
    : `predator_${save.saveId}_${save.dayState.dayNumber}_${predatorType}`;
  const name = predatorLabel(predatorType);
  const summary = chapterTwoForced
    ? intercepted
      ? "The prepared patrol catches Ashfang's Woodline Wolf Pack against the reinforced perimeter. The wolves are wounded, but the ranch team must finish the defense."
      : "Ashfang's Woodline Wolf Pack finds a weak approach despite the new preparations. Defend the ranch and prove the new security plan under pressure."
    : intercepted
      ? `Security spotted ${name.toLowerCase()} before it reached the pens. The pack is wounded and cornered, but the ranch team must finish the defense.`
      : `${name} breached the outer line before the patrol could contain it. Defend the ranch before morning work can begin.`;
  const tier: PredatorThreatTier = chapterTwoForced
    ? "elevated"
    : assessment.tier === "none" || assessment.tier === "guarded" ? "low" : assessment.tier;
  const event: PredatorNightEvent = {
    version: PREDATOR_EVENT_VERSION,
    eventId,
    dayNumber: save.dayState.dayNumber,
    nightOfDayNumber: Math.max(1, save.dayState.dayNumber - 1),
    predatorType,
    predatorName: name,
    tier,
    status: "battle_pending",
    intercepted,
    startingHpPercent,
    eventChance: chapterTwoForced ? 100 : assessment.eventChance,
    pressure: assessment.pressure,
    security: assessment.security,
    requiredSecurity: assessment.requiredSecurity,
    reasons: chapterTwoForced
      ? ["Chapter 2 authored defense became ready.", ...assessment.reasons]
      : assessment.reasons,
    summary,
    imagePath: intercepted ? PREDATOR_EVENT_ASSETS.repelled : PREDATOR_EVENT_ASSETS.breached,
    rewardPreview: rewardPreview(tier),
    penaltyPreview: penaltyPreview(tier),
    ...(chapterTwoForced ? { storyTag: CHAPTER_TWO_DEFENSE_TAG } : {}),
  };

  let eventSave: GameSave = {
    ...assessmentInput,
    flags: {
      ...assessmentInput.flags,
      [PREDATOR_PENDING_EVENT_FLAG]: JSON.stringify(event),
      predatorLastCheckDayNumber: save.dayState.dayNumber,
      predatorLastCheckSummary: summary,
      predatorThreatTierToday: event.tier,
      predatorThreatChanceToday: event.eventChance,
      predatorThreatPressureToday: assessment.pressure,
      predatorThreatSecurityToday: assessment.security,
      predatorBattlePending: true,
      predatorBattleEventId: eventId,
      predatorBattleStartingHpPercent: startingHpPercent,
      m62ConditionGatedPredators: true,
      m63PredatorBattles: true,
      ...(chapterTwoForced ? { chapterTwoAuthoredDefenseTriggered: true } : {}),
    },
  };
  if (chapterTwoForced) eventSave = tagChapterTwoDefenseEvent(eventSave, eventId);

  return {
    save: eventSave,
    event,
    assessment,
    summary,
    rolled: true,
  };
}

const grades = (STR: StatGrades["STR"], DEX: StatGrades["DEX"], STA: StatGrades["STA"], CHA: StatGrades["CHA"], WIL: StatGrades["WIL"], FER: StatGrades["FER"]): StatGrades => ({ STR, DEX, STA, CHA, WIL, FER });

function slot(
  slotId: string,
  nickname: string,
  variantId: string,
  level: number,
  statGrades: StatGrades,
  talentId: string,
  talentGrade: AbilityGrade,
  moves: BattleMoveId[],
  roleLabel: string,
): ColiseumEnemySlotDefinition {
  return {
    slotId,
    nickname,
    variantId: variantId as VariantId,
    level,
    statGrades,
    talentGrades: [{ talentId, grade: talentGrade }],
    learnedMoveIds: moves,
    equippedMoveIds: moves.slice(0, 4),
    roleLabel,
  };
}

export function getPredatorEncounterDefinition(save: GameSave, event: PredatorNightEvent): ColiseumC2EncounterDefinition {
  const roster = save.creatures ?? [];
  const averageLevel = Math.max(1, Math.round(roster.reduce((sum, creature) => sum + creature.level, 0) / Math.max(1, roster.length)));
  const tierOffset = event.tier === "severe" ? 2 : event.tier === "elevated" ? 1 : 0;
  const level = Math.max(1, averageLevel + tierOffset);
  const canineMoves = ["strike", "bite_down", "pack_howl", "defend"] as BattleMoveId[];
  const guardCanineMoves = ["strike", "protective_lunge", "bite_down", "defend"] as BattleMoveId[];
  const bovineMoves = ["strike", "heavy_shove", "stubborn_guard", "defend"] as BattleMoveId[];

  let enemyTeam: readonly [ColiseumEnemySlotDefinition, ColiseumEnemySlotDefinition, ColiseumEnemySlotDefinition];
  if (event.predatorType === "wolves") {
    enemyTeam = [
      slot("alpha", "Ashfang", "variant_direwolf", level + 1, grades("B", "B", "B", "D", "B", "B"), "gentle_guard", "B", canineMoves, "Pack Alpha"),
      slot("runner", "Greywind", "variant_direwolf", level, grades("B", "A", "C", "D", "B", "B"), "bright_eyes", "B", canineMoves, "Flanker"),
      slot("guard", "Stonejaw", "variant_direwolf", level, grades("B", "C", "A", "D", "B", "B"), "gentle_guard", "B", guardCanineMoves, "Guard Breaker"),
    ];
  } else if (event.predatorType === "feral_hounds") {
    enemyTeam = [
      slot("leader", "Ripper", "variant_direwolf", level + 1, grades("B", "B", "B", "D", "C", "B"), "bright_eyes", "C", canineMoves, "Leader"),
      slot("ember", "Cinder", "variant_hellhound", level, grades("B", "B", "C", "D", "B", "B"), "gentle_guard", "C", canineMoves, "Aggressor"),
      slot("scout", "Scrap", "variant_base_canine", level, grades("C", "B", "C", "D", "C", "B"), "bright_eyes", "C", guardCanineMoves, "Scout"),
    ];
  } else if (event.predatorType === "boars") {
    enemyTeam = [
      slot("tusk", "Iron Tusk", "variant_minotaur", level + 1, grades("A", "C", "A", "D", "B", "B"), "pasture_calm", "B", bovineMoves, "Sounder Lead"),
      slot("ridge", "Ridgeback", "variant_moon_yak", level, grades("B", "D", "A", "D", "B", "B"), "pasture_calm", "B", bovineMoves, "Bulwark"),
      slot("rooter", "Rooter", "variant_cow", level, grades("B", "D", "B", "D", "C", "B"), "pasture_calm", "C", bovineMoves, "Charger"),
    ];
  } else {
    enemyTeam = [
      slot("vixen", "Redtail", "variant_base_canine", level, grades("C", "A", "C", "B", "C", "B"), "bright_eyes", "B", canineMoves, "Fox Lead"),
      slot("slink", "Slink", "variant_base_canine", level, grades("C", "B", "C", "B", "C", "B"), "bright_eyes", "C", canineMoves, "Feed Thief"),
      slot("brush", "Brush", "variant_base_canine", level, grades("C", "B", "C", "B", "C", "B"), "gentle_guard", "C", guardCanineMoves, "Distraction"),
    ];
  }

  const aiDifficulty: BattleAiDifficulty = event.tier === "severe" ? "champion" : event.tier === "elevated" ? "tactical" : "basic";
  return {
    encounterId: `predator_${event.predatorType}_${event.dayNumber}` as ColiseumC2EncounterId,
    divisionId: "novice",
    name: event.storyTag === CHAPTER_TWO_DEFENSE_TAG
      ? "Chapter 2 — Woodline Breach"
      : event.intercepted ? "Intercepted Predator Defense" : "Ranch Breach Defense",
    opponentName: event.predatorName,
    description: event.summary,
    strategyLabel: event.intercepted ? `${event.startingHpPercent}% starting HP` : "Full-strength breach",
    aiDifficulty,
    recommendedLevel: level,
    prerequisiteEncounterIds: [],
    firstClearReward: { gold: 0, guildPoints: 0 },
    repeatRewardPool: [{ weight: 1, label: "Ranch defense", reward: { gold: 0, guildPoints: 0 } }],
    baseCombatXp: 0,
    enemyTeam,
  };
}

export function buildPredatorEnemyTeam(save: GameSave, event: PredatorNightEvent): CreatureRecord[] {
  return buildAuthoredColiseumEnemyTeam(save.saveId, getPredatorEncounterDefinition(save, event));
}

export function applyPredatorBattleOpening(state: BattleState, event: PredatorNightEvent): BattleState {
  if (event.startingHpPercent >= 100) return { ...state, log: [...state.log, `${event.predatorName} reached the ranch at full strength.`] };
  const combatants = Object.fromEntries(Object.entries(state.combatants).map(([id, combatant]) => {
    if (combatant.sideId !== "enemy") return [id, combatant];
    const currentHp = Math.max(1, Math.round(combatant.maxHp * event.startingHpPercent / 100));
    return [id, { ...combatant, currentHp }];
  })) as BattleState["combatants"];
  return {
    ...state,
    combatants,
    log: [...state.log, `Ranch security wounded the attackers. Enemies begin at ${event.startingHpPercent}% HP.`],
  };
}

function resultAmounts(event: PredatorNightEvent): { gold: number; guildPoints: number; materials: number; feedLoss: number; damage: number; injure: boolean; injuryDays: number } {
  const seed = event.eventId;
  if (event.tier === "severe") return { gold: 110, guildPoints: 3, materials: 5, feedLoss: 7 + deterministicRoll(`${seed}:feed`, 4), damage: 14 + deterministicRoll(`${seed}:damage`, 7), injure: true, injuryDays: 2 };
  if (event.tier === "elevated") return { gold: 75, guildPoints: 2, materials: 3, feedLoss: 4 + deterministicRoll(`${seed}:feed`, 4), damage: 8 + deterministicRoll(`${seed}:damage`, 7), injure: deterministicRoll(`${seed}:injury`, 100) < 45, injuryDays: 1 };
  return { gold: 45, guildPoints: 1, materials: 2, feedLoss: 2 + deterministicRoll(`${seed}:feed`, 3), damage: 4 + deterministicRoll(`${seed}:damage`, 5), injure: false, injuryDays: 0 };
}

export function recordPredatorBattleOutcome(
  save: GameSave,
  eventId: string,
  outcome: BattleOutcome,
  rounds: number,
  teamCreatureIds: CreatureId[],
): PredatorBattleResolution {
  const pending = getPendingPredatorEvent(save);
  const latest = getLatestPredatorEvent(save);
  if (!pending || pending.eventId !== eventId) {
    const duplicate = latest?.eventId === eventId && latest.status !== "battle_pending";
    return { save, event: latest, duplicate, message: duplicate ? "This predator defense was already resolved. No duplicate reward or penalty was applied." : "No matching pending predator defense exists." };
  }

  const amounts = resultAmounts(pending);
  const status: PredatorEventStatus = outcome === "player_won" ? "victory" : outcome === "draw" ? "draw" : "defeat";
  let nextSave = { ...save, flags: { ...save.flags } };
  let resolutionSummary = "";

  if (status === "victory") {
    nextSave = {
      ...nextSave,
      currencies: {
        ...nextSave.currencies,
        gold: nextSave.currencies.gold + amounts.gold,
        guildPoints: nextSave.currencies.guildPoints + amounts.guildPoints,
      },
      flags: {
        ...nextSave.flags,
        ranchMaterialsStock: numericFlag(nextSave.flags.ranchMaterialsStock) + amounts.materials,
        predatorVictories: numericFlag(nextSave.flags.predatorVictories) + 1,
      },
    };
    resolutionSummary = `The ranch team drove off ${pending.predatorName.toLowerCase()} and recovered ${amounts.gold} Gold, ${amounts.guildPoints} Guild Points, and ${amounts.materials} Materials.`;
  } else {
    const drawMultiplier = status === "draw" ? 0.5 : 1;
    const feedLoss = Math.min(numericFlag(nextSave.flags.ranchFeedStock), Math.max(1, Math.round(amounts.feedLoss * drawMultiplier)));
    const damage = Math.max(1, Math.round(amounts.damage * drawMultiplier));
    let creatures = nextSave.creatures ?? [];
    let injuryText = "";
    if (amounts.injure && status === "defeat") {
      const candidates = creatures.filter((creature) => teamCreatureIds.includes(creature.creatureId));
      const target = candidates[deterministicRoll(`${pending.eventId}:injury-target`, Math.max(1, candidates.length))];
      if (target) {
        creatures = creatures.map((creature) => creature.creatureId === target.creatureId ? {
          ...creature,
          injuryLabel: amounts.injuryDays > 1 ? "Wounded" : "Bruised",
          injuredUntilDayNumber: save.dayState.dayNumber + amounts.injuryDays - 1,
        } : creature);
        injuryText = ` ${target.nickname} was ${amounts.injuryDays > 1 ? "wounded for 2 days" : "bruised for 1 day"}.`;
      }
    }
    nextSave = {
      ...nextSave,
      creatures,
      flags: {
        ...nextSave.flags,
        ranchFeedStock: Math.max(0, numericFlag(nextSave.flags.ranchFeedStock) - feedLoss),
        ranchDamage: clamp(numericFlag(nextSave.flags.ranchDamage) + damage, 0, 100),
        predatorDefeats: numericFlag(nextSave.flags.predatorDefeats) + (status === "defeat" ? 1 : 0),
        predatorDraws: numericFlag(nextSave.flags.predatorDraws) + (status === "draw" ? 1 : 0),
      },
    };
    resolutionSummary = status === "draw"
      ? `The predators withdrew after a stalemate, but the ranch lost ${feedLoss} Feed and gained ${damage} damage.`
      : `The defense failed. The ranch lost ${feedLoss} Feed and gained ${damage} damage.${injuryText}`;
  }

  const resolvedEvent: PredatorNightEvent = {
    ...pending,
    status,
    resolvedOutcome: outcome,
    resolvedRounds: Math.max(1, rounds),
    resolvedTeamCreatureIds: [...teamCreatureIds],
    resolutionSummary,
    imagePath: status === "victory" ? PREDATOR_EVENT_ASSETS.repelled : PREDATOR_EVENT_ASSETS.breached,
  };
  const history = [resolvedEvent, ...parseHistory(nextSave.flags[PREDATOR_HISTORY_FLAG]).filter((entry) => entry.eventId !== resolvedEvent.eventId)].slice(0, 20);
  nextSave = {
    ...nextSave,
    updatedAt: new Date().toISOString(),
    flags: {
      ...nextSave.flags,
      [PREDATOR_PENDING_EVENT_FLAG]: false,
      [PREDATOR_LAST_EVENT_FLAG]: JSON.stringify(resolvedEvent),
      [PREDATOR_HISTORY_FLAG]: JSON.stringify(history),
      predatorBattlePending: false,
      predatorBattleEventId: resolvedEvent.eventId,
      predatorLastOutcome: status,
      predatorLastResolutionSummary: resolutionSummary,
      predatorLastResolvedDayNumber: save.dayState.dayNumber,
      m63PredatorBattleResolved: true,
    },
  };
  if (pending.storyTag === CHAPTER_TWO_DEFENSE_TAG) {
    nextSave = recordChapterTwoDefenseResolution(nextSave, pending.eventId, outcome);
  }

  return { save: nextSave, event: resolvedEvent, duplicate: false, message: resolutionSummary };
}
