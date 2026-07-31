import { getChapterTwoAftermathState } from "@/data/chapterTwoWoodlineAftermath";
import { getPredatorThreatAssessment, type PredatorThreatTier } from "@/data/predatorThreat";
import {
  PREDATOR_EVENT_VERSION,
  PREDATOR_PENDING_EVENT_FLAG,
  getPendingPredatorEvent,
  type PredatorNightEvent,
} from "./predatorEvents";
import type { BattleOutcome } from "@/types/battle";
import type { GameSave } from "@/types/save";

export const CHAPTER_TWO_WOODLINE_STATE_FLAG = "chapterTwoIntoWoodlineV1";
export const CHAPTER_TWO_WOODLINE_VERSION = 1;
export const CHAPTER_TWO_WOODLINE_HUNT_TAG = "chapter_two_into_woodline_hunt";
export const CHAPTER_TWO_WOODLINE_ART = "/images/story/chapter-two/chapter_two_into_woodline.svg";

export type WoodlineExpeditionStage =
  | "locked"
  | "briefing"
  | "approach"
  | "battle"
  | "decision"
  | "complete";

export type WoodlineApproach = "cautious" | "swift" | "bait";
export type WoodlineResolution = "preserve" | "boundary" | "rangers";

export type WoodlineExpeditionState = {
  version: number;
  stage: WoodlineExpeditionStage;
  startedDayNumber: number;
  briefingRead: boolean;
  approach: WoodlineApproach | "";
  expeditionEventId: string;
  battleResolved: boolean;
  battleOutcome: BattleOutcome | "";
  resolution: WoodlineResolution | "";
  rewardClaimed: boolean;
  history: string[];
};

export type WoodlineExpeditionActionResult = {
  save: GameSave;
  state: WoodlineExpeditionState;
  ok: boolean;
  message: string;
};

export type WoodlineExpeditionBonuses = {
  security: number;
  pressureReduction: number;
  intercept: number;
  openingHpReduction: number;
};

export type WoodlineApproachDefinition = {
  id: WoodlineApproach;
  name: string;
  costLabel: string;
  description: string;
  startingHpPercent: number;
  tier: PredatorThreatTier;
};

export type WoodlineResolutionDefinition = {
  id: WoodlineResolution;
  name: string;
  description: string;
  effect: string;
};

const DEFAULT_STATE: WoodlineExpeditionState = {
  version: CHAPTER_TWO_WOODLINE_VERSION,
  stage: "locked",
  startedDayNumber: 0,
  briefingRead: false,
  approach: "",
  expeditionEventId: "",
  battleResolved: false,
  battleOutcome: "",
  resolution: "",
  rewardClaimed: false,
  history: [],
};

export const WOODLINE_APPROACHES: readonly WoodlineApproachDefinition[] = [
  {
    id: "cautious",
    name: "Cautious Survey",
    costLabel: "Free",
    description: "Petra's route keeps the team together and uses the existing ward markers. Reliable, slower, and always available.",
    startingHpPercent: 82,
    tier: "elevated",
  },
  {
    id: "swift",
    name: "Swift Pursuit",
    costLabel: "80 Gold",
    description: "Hire two Guild outriders to close the ridge path before the pack can scatter. The enemy begins more heavily worn down.",
    startingHpPercent: 72,
    tier: "severe",
  },
  {
    id: "bait",
    name: "Baited Trail",
    costLabel: "4 Feed",
    description: "Use a controlled scent trail to pull the pack into a prepared clearing. It creates the strongest opening advantage.",
    startingHpPercent: 62,
    tier: "severe",
  },
] as const;

export const WOODLINE_RESOLUTIONS: readonly WoodlineResolutionDefinition[] = [
  {
    id: "preserve",
    name: "Protected Woodline",
    description: "Relocate the den beyond the settled trail and establish a protected buffer where predators are not driven toward ranches.",
    effect: "−6 permanent Predator Pressure and +1 Guild Point.",
  },
  {
    id: "boundary",
    name: "Stone Boundary",
    description: "Petra and the Guild mark a permanent reinforced line between the ranch district and the deepwood hunting grounds.",
    effect: "+8 permanent Security and +4 Materials.",
  },
  {
    id: "rangers",
    name: "Ranger Network",
    description: "Fund trail watchers and signal posts that identify future packs before they reach the outer fields.",
    effect: "+8 interception strength, −5% intercepted enemy starting HP, and +75 Gold.",
  },
] as const;

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function parseState(value: boolean | number | string | undefined): WoodlineExpeditionState {
  if (typeof value !== "string" || !value.trim()) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(value) as Partial<WoodlineExpeditionState>;
    const stage = ["locked", "briefing", "approach", "battle", "decision", "complete"].includes(String(parsed.stage))
      ? parsed.stage as WoodlineExpeditionStage
      : "locked";
    const approach = ["cautious", "swift", "bait"].includes(String(parsed.approach))
      ? parsed.approach as WoodlineApproach
      : "";
    const resolution = ["preserve", "boundary", "rangers"].includes(String(parsed.resolution))
      ? parsed.resolution as WoodlineResolution
      : "";
    const outcome = ["player_won", "enemy_won", "draw"].includes(String(parsed.battleOutcome))
      ? parsed.battleOutcome as BattleOutcome
      : "";
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: CHAPTER_TWO_WOODLINE_VERSION,
      stage,
      startedDayNumber: numberFlag(parsed.startedDayNumber as number | string | undefined),
      briefingRead: parsed.briefingRead === true,
      approach,
      expeditionEventId: typeof parsed.expeditionEventId === "string" ? parsed.expeditionEventId : "",
      battleResolved: parsed.battleResolved === true,
      battleOutcome: outcome,
      resolution,
      rewardClaimed: parsed.rewardClaimed === true,
      history: Array.isArray(parsed.history)
        ? parsed.history.filter((entry) => typeof entry === "string").slice(0, 30)
        : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function appendHistory(state: WoodlineExpeditionState, entry: string): WoodlineExpeditionState {
  return { ...state, history: [entry, ...state.history].slice(0, 30) };
}

function withState(save: GameSave, state: WoodlineExpeditionState): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [CHAPTER_TWO_WOODLINE_STATE_FLAG]: JSON.stringify(state),
      chapterTwoIntoWoodlineStarted: state.stage !== "locked",
      chapterTwoIntoWoodlineComplete: state.stage === "complete",
      m67ChapterTwoIntoWoodline: true,
    },
  };
}

function approachDefinition(approach: WoodlineApproach): WoodlineApproachDefinition {
  return WOODLINE_APPROACHES.find((entry) => entry.id === approach) ?? WOODLINE_APPROACHES[0];
}

export function getChapterTwoIntoWoodlineState(save: GameSave): WoodlineExpeditionState {
  return parseState(save.flags[CHAPTER_TWO_WOODLINE_STATE_FLAG]);
}

export function isChapterTwoIntoWoodlineEligible(save: GameSave): boolean {
  return getChapterTwoAftermathState(save).stage === "complete" && save.flags.chapterTwoIntoWoodlineSkipped !== true;
}

export function prepareChapterTwoIntoWoodlineSave(save: GameSave): GameSave {
  if (!isChapterTwoIntoWoodlineEligible(save)) return save;
  const current = getChapterTwoIntoWoodlineState(save);
  if (current.stage !== "locked") return save;
  const state = appendHistory({
    ...current,
    stage: "briefing",
    startedDayNumber: save.dayState.dayNumber,
  }, `Day ${save.dayState.dayNumber}: The Guild report located Ashfang's deepwood den beyond the old boundary stones.`);
  return withState(save, state);
}

export function readWoodlineExpeditionBriefing(save: GameSave): WoodlineExpeditionActionResult {
  const prepared = prepareChapterTwoIntoWoodlineSave(save);
  const current = getChapterTwoIntoWoodlineState(prepared);
  if (current.stage === "locked") {
    return { save: prepared, state: current, ok: false, message: "Complete The Woodline Aftermath first." };
  }
  if (current.briefingRead) {
    return { save: prepared, state: current, ok: true, message: "The expedition map is already reviewed." };
  }
  const state = appendHistory({ ...current, stage: "approach", briefingRead: true },
    `Day ${save.dayState.dayNumber}: The ranch reviewed three routes to Ashfang's den.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: "Choose how the expedition will approach the deepwood den.",
  };
}

export function canLaunchWoodlineApproach(save: GameSave, approach: WoodlineApproach): boolean {
  if (approach === "swift") return save.currencies.gold >= 80;
  if (approach === "bait") return numberFlag(save.flags.ranchFeedStock) >= 4;
  return true;
}

export function launchWoodlineExpedition(
  save: GameSave,
  approach: WoodlineApproach,
): WoodlineExpeditionActionResult {
  const prepared = prepareChapterTwoIntoWoodlineSave(save);
  const current = getChapterTwoIntoWoodlineState(prepared);
  if (!current.briefingRead || current.stage !== "approach") {
    return { save: prepared, state: current, ok: false, message: "Review the expedition briefing before choosing a route." };
  }
  if (getPendingPredatorEvent(prepared)) {
    return { save: prepared, state: current, ok: false, message: "Resolve the current predator incident before launching the expedition." };
  }
  if (!canLaunchWoodlineApproach(prepared, approach)) {
    const requirement = approach === "swift" ? "80 Gold" : "4 Feed";
    return { save: prepared, state: current, ok: false, message: `${approachDefinition(approach).name} requires ${requirement}.` };
  }

  const definition = approachDefinition(approach);
  const feed = numberFlag(prepared.flags.ranchFeedStock);
  const assessment = getPredatorThreatAssessment(prepared);
  const eventId = `chapter_two_woodline_hunt_${prepared.saveId}_${prepared.dayState.dayNumber}`;
  const approachSummary = approach === "cautious"
    ? "Petra's marked route corners the pack near the boundary stones."
    : approach === "swift"
      ? "Guild outriders close the ridge path before the pack can scatter."
      : "The controlled bait trail draws the pack into a prepared clearing.";
  const event: PredatorNightEvent = {
    version: PREDATOR_EVENT_VERSION,
    eventId,
    dayNumber: prepared.dayState.dayNumber,
    nightOfDayNumber: prepared.dayState.dayNumber,
    predatorType: "wolves",
    predatorName: "Ashfang's Deepwood Pack",
    tier: definition.tier,
    status: "battle_pending",
    intercepted: true,
    startingHpPercent: definition.startingHpPercent,
    eventChance: 100,
    pressure: assessment.pressure,
    security: assessment.security,
    requiredSecurity: assessment.requiredSecurity,
    reasons: [
      "Chapter 2 Act III expedition reached the deepwood den.",
      `${definition.name}: ${definition.description}`,
    ],
    summary: `${approachSummary} Ashfang refuses to abandon the den without a final confrontation.`,
    imagePath: CHAPTER_TWO_WOODLINE_ART,
    rewardPreview: definition.tier === "severe"
      ? ["110 Gold", "3 Guild Points", "5 Materials", "Chapter resolution reward"]
      : ["75 Gold", "2 Guild Points", "3 Materials", "Chapter resolution reward"],
    penaltyPreview: definition.tier === "severe"
      ? ["Recoverable Feed loss", "Recoverable ranch damage", "Possible temporary injury", "Story still advances"]
      : ["Reduced Feed loss", "Reduced ranch damage", "Story still advances"],
    storyTag: CHAPTER_TWO_WOODLINE_HUNT_TAG,
  };

  const chargedSave: GameSave = {
    ...prepared,
    currencies: {
      ...prepared.currencies,
      gold: prepared.currencies.gold - (approach === "swift" ? 80 : 0),
    },
    flags: {
      ...prepared.flags,
      ranchFeedStock: feed - (approach === "bait" ? 4 : 0),
      [PREDATOR_PENDING_EVENT_FLAG]: JSON.stringify(event),
      predatorBattlePending: true,
      predatorBattleEventId: eventId,
      predatorBattleStartingHpPercent: definition.startingHpPercent,
      chapterTwoWoodlineApproach: approach,
      chapterTwoWoodlineExpeditionLaunched: true,
    },
  };
  const state = appendHistory({
    ...current,
    stage: "battle",
    approach,
    expeditionEventId: eventId,
  }, `Day ${save.dayState.dayNumber}: ${definition.name} reached Ashfang's deepwood den.`);
  return {
    save: withState(chargedSave, state),
    state,
    ok: true,
    message: `${definition.name} launched. Assemble three defenders for the deepwood confrontation.`,
  };
}

export function recordWoodlineExpeditionBattle(
  save: GameSave,
  eventId: string,
  outcome: BattleOutcome,
): GameSave {
  const current = getChapterTwoIntoWoodlineState(save);
  if (current.expeditionEventId !== eventId || current.battleResolved) return save;
  const outcomeLabel = outcome === "player_won" ? "victory" : outcome === "draw" ? "stalemate" : "defeat and withdrawal";
  const state = appendHistory({
    ...current,
    stage: "decision",
    battleResolved: true,
    battleOutcome: outcome,
  }, `Day ${save.dayState.dayNumber}: The deepwood confrontation ended in ${outcomeLabel}. The Guild still requires a lasting regional decision.`);
  return withState({
    ...save,
    flags: {
      ...save.flags,
      chapterTwoWoodlineBattleOutcome: outcome,
      chapterTwoWoodlineBattleResolved: true,
    },
  }, state);
}

export function chooseWoodlineResolution(
  save: GameSave,
  resolution: WoodlineResolution,
): WoodlineExpeditionActionResult {
  const current = getChapterTwoIntoWoodlineState(save);
  if (!current.battleResolved || current.stage !== "decision") {
    return { save, state: current, ok: false, message: "Resolve the deepwood confrontation before deciding the region's future." };
  }
  if (current.rewardClaimed || current.resolution) {
    return { save, state: current, ok: false, message: "The Woodline resolution is already permanent." };
  }

  const materials = numberFlag(save.flags.ranchMaterialsStock);
  const flags: GameSave["flags"] = {
    ...save.flags,
    chapterTwoWoodlineResolution: resolution,
    chapterTwoWoodlineRewardGranted: true,
    chapterTwoWoodlineCompletedDayNumber: save.dayState.dayNumber,
    m67ChapterTwoIntoWoodlineComplete: true,
  };
  let bonusGold = 0;
  let bonusGuildPoints = 0;
  let bonusMaterials = 0;
  if (resolution === "preserve") {
    flags.chapterTwoWoodlinePressureReduction = 6;
    bonusGuildPoints = 1;
  } else if (resolution === "boundary") {
    flags.chapterTwoWoodlineSecurityBonus = 8;
    bonusMaterials = 4;
  } else {
    flags.chapterTwoWoodlineInterceptBonus = 8;
    flags.chapterTwoWoodlineOpeningHpReduction = 5;
    bonusGold = 75;
  }

  const definition = WOODLINE_RESOLUTIONS.find((entry) => entry.id === resolution) ?? WOODLINE_RESOLUTIONS[0];
  const state = appendHistory({
    ...current,
    stage: "complete",
    resolution,
    rewardClaimed: true,
  }, `Day ${save.dayState.dayNumber}: ${definition.name} became the permanent Woodline policy.`);
  const nextSave = withState({
    ...save,
    currencies: {
      ...save.currencies,
      gold: save.currencies.gold + 200 + bonusGold,
      guildPoints: save.currencies.guildPoints + 4 + bonusGuildPoints,
    },
    flags: {
      ...flags,
      ranchMaterialsStock: materials + 6 + bonusMaterials,
    },
  }, state);
  return {
    save: nextSave,
    state,
    ok: true,
    message: `${definition.name} established. Chapter 2 complete: +${200 + bonusGold} Gold, +${4 + bonusGuildPoints} Guild Points, and +${6 + bonusMaterials} Materials.`,
  };
}

export function getChapterTwoIntoWoodlineBonuses(save: GameSave): WoodlineExpeditionBonuses {
  return {
    security: numberFlag(save.flags.chapterTwoWoodlineSecurityBonus),
    pressureReduction: numberFlag(save.flags.chapterTwoWoodlinePressureReduction),
    intercept: numberFlag(save.flags.chapterTwoWoodlineInterceptBonus),
    openingHpReduction: numberFlag(save.flags.chapterTwoWoodlineOpeningHpReduction),
  };
}

export function getChapterTwoIntoWoodlineObjective(save: GameSave): {
  title: string;
  body: string;
  hint: string;
  action: "briefing" | "approach" | "battle" | "decision" | "none";
} | null {
  if (!isChapterTwoIntoWoodlineEligible(save)) return null;
  const state = getChapterTwoIntoWoodlineState(prepareChapterTwoIntoWoodlineSave(save));
  if (state.stage === "briefing") return {
    title: "The Den Beyond the Stones",
    body: "The Guild report identifies Ashfang's deepwood den as the source of the pack route. Review the map before committing a team.",
    hint: "The expedition is optional until launched and does not interrupt the ordinary Ranch Day.",
    action: "briefing",
  };
  if (state.stage === "approach") return {
    title: "Choose the Approach",
    body: "Select a free cautious route or spend resources to create a stronger opening advantage in the final confrontation.",
    hint: "At least one route is always available. The selected cost and battle setup persist immediately.",
    action: "approach",
  };
  if (state.stage === "battle") return {
    title: "Confront Ashfang",
    body: "The expedition has reached the den. Resolve the pending Deepwood Pack battle to continue.",
    hint: "Victory, draw, and defeat all advance the story; ordinary battle rewards or recoverable penalties still apply.",
    action: "battle",
  };
  if (state.stage === "decision") return {
    title: "Decide the Woodline's Future",
    body: "Choose a permanent regional policy: protected habitat, a reinforced boundary, or an active ranger network.",
    hint: "The choice grants the Chapter 2 finale reward and permanently changes future predator calculations.",
    action: "decision",
  };
  return {
    title: "Into the Woodline Complete",
    body: "The deepwood route is resolved and the ranch's regional predator policy is permanent.",
    hint: "Future predator pressure, security, or interceptions now reflect the selected resolution.",
    action: "none",
  };
}
