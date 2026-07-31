import {
  getChapterTwoState,
  type ChapterTwoDoctrine,
} from "@/data/chapterTwoTroubleBeyondFence";
import type { GameSave } from "@/types/save";

export const CHAPTER_TWO_AFTERMATH_STATE_FLAG = "chapterTwoWoodlineAftermathV1";
export const CHAPTER_TWO_AFTERMATH_VERSION = 1;

export type ChapterTwoAftermathStage =
  | "locked"
  | "survey"
  | "recover"
  | "operation"
  | "aid"
  | "wait"
  | "report"
  | "complete";

export type ChapterTwoAidType = "feed" | "materials" | "gold";
export type ChapterTwoRecoveryMode = "materials" | "gold" | "volunteer";

export type ChapterTwoAftermathState = {
  version: number;
  stage: ChapterTwoAftermathStage;
  startedDayNumber: number;
  aftermathReviewed: boolean;
  recoveryCompleted: boolean;
  recoveryMode: ChapterTwoRecoveryMode | "";
  doctrineOperationCompleted: boolean;
  guildAidCompleted: boolean;
  guildAidType: ChapterTwoAidType | "";
  readyDayNumber: number;
  finalReportRead: boolean;
  rewardClaimed: boolean;
  history: string[];
};

export type ChapterTwoAftermathActionResult = {
  save: GameSave;
  state: ChapterTwoAftermathState;
  ok: boolean;
  message: string;
};

export type ChapterTwoAftermathObjective = {
  stage: ChapterTwoAftermathStage;
  title: string;
  body: string;
  hint: string;
  action: "review" | "recover" | "operation" | "aid" | "wait" | "report" | "none";
  actionLabel: string;
};

export type ChapterTwoAftermathBonuses = {
  security: number;
  intercept: number;
  pressureReduction: number;
  openingHpReduction: number;
  damageReductionPercent: number;
  feedLossReduction: number;
};

const DEFAULT_STATE: ChapterTwoAftermathState = {
  version: CHAPTER_TWO_AFTERMATH_VERSION,
  stage: "locked",
  startedDayNumber: 0,
  aftermathReviewed: false,
  recoveryCompleted: false,
  recoveryMode: "",
  doctrineOperationCompleted: false,
  guildAidCompleted: false,
  guildAidType: "",
  readyDayNumber: 0,
  finalReportRead: false,
  rewardClaimed: false,
  history: [],
};

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function parseState(value: boolean | number | string | undefined): ChapterTwoAftermathState {
  if (typeof value !== "string" || !value.trim()) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(value) as Partial<ChapterTwoAftermathState>;
    const stage: ChapterTwoAftermathStage = [
      "locked",
      "survey",
      "recover",
      "operation",
      "aid",
      "wait",
      "report",
      "complete",
    ].includes(String(parsed.stage)) ? parsed.stage as ChapterTwoAftermathStage : "locked";
    const recoveryMode = ["materials", "gold", "volunteer"].includes(String(parsed.recoveryMode))
      ? parsed.recoveryMode as ChapterTwoRecoveryMode
      : "";
    const guildAidType = ["feed", "materials", "gold"].includes(String(parsed.guildAidType))
      ? parsed.guildAidType as ChapterTwoAidType
      : "";
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: CHAPTER_TWO_AFTERMATH_VERSION,
      stage,
      startedDayNumber: numberFlag(parsed.startedDayNumber as number | string | undefined),
      aftermathReviewed: parsed.aftermathReviewed === true,
      recoveryCompleted: parsed.recoveryCompleted === true,
      recoveryMode,
      doctrineOperationCompleted: parsed.doctrineOperationCompleted === true,
      guildAidCompleted: parsed.guildAidCompleted === true,
      guildAidType,
      readyDayNumber: numberFlag(parsed.readyDayNumber as number | string | undefined),
      finalReportRead: parsed.finalReportRead === true,
      rewardClaimed: parsed.rewardClaimed === true,
      history: Array.isArray(parsed.history)
        ? parsed.history.filter((entry) => typeof entry === "string").slice(0, 30)
        : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function appendHistory(state: ChapterTwoAftermathState, entry: string): ChapterTwoAftermathState {
  return { ...state, history: [entry, ...state.history].slice(0, 30) };
}

function deriveStage(state: ChapterTwoAftermathState): ChapterTwoAftermathStage {
  if (state.stage === "locked") return "locked";
  if (!state.aftermathReviewed) return "survey";
  if (!state.recoveryCompleted) return "recover";
  if (!state.doctrineOperationCompleted) return "operation";
  if (!state.guildAidCompleted) return "aid";
  if (!state.finalReportRead) return state.stage === "report" ? "report" : "wait";
  return "complete";
}

function withState(save: GameSave, state: ChapterTwoAftermathState): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [CHAPTER_TWO_AFTERMATH_STATE_FLAG]: JSON.stringify(state),
      chapterTwoAftermathStarted: state.stage !== "locked",
      chapterTwoAftermathComplete: state.stage === "complete",
      m66ChapterTwoWoodlineAftermath: true,
    },
  };
}

function doctrineLabel(doctrine: ChapterTwoDoctrine | ""): string {
  if (doctrine === "fortify") return "Fortified Perimeter";
  if (doctrine === "track") return "Trail Wardens";
  if (doctrine === "steward") return "Quiet Pastures";
  return "Unchosen Doctrine";
}

export function getChapterTwoAftermathState(save: GameSave): ChapterTwoAftermathState {
  return parseState(save.flags[CHAPTER_TWO_AFTERMATH_STATE_FLAG]);
}

export function isChapterTwoAftermathEligible(save: GameSave): boolean {
  return getChapterTwoState(save).stage === "complete" && save.flags.chapterTwoAftermathSkipped !== true;
}

export function prepareChapterTwoAftermathSave(save: GameSave): GameSave {
  if (!isChapterTwoAftermathEligible(save)) return save;
  const current = getChapterTwoAftermathState(save);
  let next = { ...current };

  if (next.stage === "locked") {
    next = appendHistory({
      ...next,
      stage: "survey",
      startedDayNumber: save.dayState.dayNumber,
    }, `Day ${save.dayState.dayNumber}: Petra called a dawn meeting to assess the Woodline breach.`);
  }

  if (next.stage === "wait" && next.guildAidCompleted && save.dayState.dayNumber > next.readyDayNumber) {
    next = appendHistory({
      ...next,
      stage: "report",
    }, `Day ${save.dayState.dayNumber}: The Guild returned with a final Woodline assessment.`);
  }

  next.stage = deriveStage(next);
  if (JSON.stringify(next) === JSON.stringify(current)) return save;
  return withState(save, next);
}

export function reviewChapterTwoAftermath(save: GameSave): ChapterTwoAftermathActionResult {
  const prepared = prepareChapterTwoAftermathSave(save);
  const current = getChapterTwoAftermathState(prepared);
  if (current.stage === "locked") {
    return { save: prepared, state: current, ok: false, message: "Complete Trouble Beyond the Fence first." };
  }
  if (current.aftermathReviewed) {
    return { save: prepared, state: current, ok: true, message: "The breach assessment is already recorded." };
  }
  const outcome = String(prepared.flags.predatorLastOutcome ?? "victory").replace(/_/g, " ");
  const state = appendHistory({
    ...current,
    stage: "recover",
    aftermathReviewed: true,
  }, `Day ${save.dayState.dayNumber}: Petra documented the first defense as ${outcome}.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: "The outer line is stable, but the breach must be repaired before the ranch can investigate the pack route.",
  };
}

export function stabilizeChapterTwoRanch(save: GameSave): ChapterTwoAftermathActionResult {
  const prepared = prepareChapterTwoAftermathSave(save);
  const current = getChapterTwoAftermathState(prepared);
  if (!current.aftermathReviewed) {
    return { save: prepared, state: current, ok: false, message: "Review the aftermath before beginning repairs." };
  }
  if (current.recoveryCompleted) {
    return { save: prepared, state: current, ok: true, message: "Emergency stabilization is already complete." };
  }

  const materials = numberFlag(prepared.flags.ranchMaterialsStock);
  const damage = numberFlag(prepared.flags.ranchDamage);
  let recoveryMode: ChapterTwoRecoveryMode = "volunteer";
  let repaired = Math.min(damage, 4);
  let nextSave = prepared;
  let detail = "Neighbors and available ranch hands completed a temporary volunteer repair.";

  if (materials >= 3) {
    recoveryMode = "materials";
    repaired = Math.min(damage, 12);
    nextSave = {
      ...prepared,
      flags: {
        ...prepared.flags,
        ranchMaterialsStock: materials - 3,
      },
    };
    detail = "Petra used 3 Materials to brace the damaged line.";
  } else if (prepared.currencies.gold >= 90) {
    recoveryMode = "gold";
    repaired = Math.min(damage, 8);
    nextSave = {
      ...prepared,
      currencies: { ...prepared.currencies, gold: prepared.currencies.gold - 90 },
    };
    detail = "A 90 Gold emergency work order stabilized the damaged line.";
  }

  nextSave = {
    ...nextSave,
    flags: {
      ...nextSave.flags,
      ranchDamage: Math.max(0, damage - repaired),
      chapterTwoAftermathDamageRepaired: repaired,
      chapterTwoAftermathRecoveryMode: recoveryMode,
    },
  };
  const state = appendHistory({
    ...current,
    stage: "operation",
    recoveryCompleted: true,
    recoveryMode,
  }, `Day ${save.dayState.dayNumber}: ${detail} Ranch damage fell by ${repaired}.`);
  return {
    save: withState(nextSave, state),
    state,
    ok: true,
    message: `${detail} Ranch damage reduced by ${repaired}.`,
  };
}

export function completeChapterTwoDoctrineOperation(save: GameSave): ChapterTwoAftermathActionResult {
  const prepared = prepareChapterTwoAftermathSave(save);
  const current = getChapterTwoAftermathState(prepared);
  if (!current.recoveryCompleted) {
    return { save: prepared, state: current, ok: false, message: "Stabilize the ranch before sending anyone beyond the fence." };
  }
  if (current.doctrineOperationCompleted) {
    return { save: prepared, state: current, ok: true, message: "The doctrine operation is already complete." };
  }

  const doctrine = getChapterTwoState(prepared).doctrine;
  if (!doctrine) {
    return { save: prepared, state: current, ok: false, message: "A permanent Chapter 2 doctrine is required." };
  }

  const flags: GameSave["flags"] = { ...prepared.flags };
  let detail = "";
  if (doctrine === "fortify") {
    flags.chapterTwoAftermathSecurityBonus = 5;
    flags.chapterTwoAftermathDamageReductionPercent = 20;
    detail = "Petra mapped three secondary approaches and added reinforced fallback gates.";
  } else if (doctrine === "track") {
    flags.chapterTwoAftermathInterceptBonus = 6;
    flags.chapterTwoAftermathOpeningHpReduction = 5;
    detail = "The wardens marked the pack's return trails and prepared two safe ambush points.";
  } else {
    flags.chapterTwoAftermathPressureReduction = 4;
    flags.chapterTwoAftermathFeedLossReduction = 2;
    detail = "The ranch moved feed storage, cleaned scent trails, and established quiet livestock lanes.";
  }

  const state = appendHistory({
    ...current,
    stage: "aid",
    doctrineOperationCompleted: true,
  }, `Day ${save.dayState.dayNumber}: ${doctrineLabel(doctrine)} operation completed. ${detail}`);
  return {
    save: withState({ ...prepared, flags }, state),
    state,
    ok: true,
    message: `${doctrineLabel(doctrine)} operation complete. ${detail}`,
  };
}

export function canDeliverChapterTwoGuildAid(save: GameSave, type: ChapterTwoAidType): boolean {
  if (type === "feed") return numberFlag(save.flags.ranchFeedStock) >= 6;
  if (type === "materials") return numberFlag(save.flags.ranchMaterialsStock) >= 4;
  return save.currencies.gold >= 120;
}

export function deliverChapterTwoGuildAid(
  save: GameSave,
  type: ChapterTwoAidType,
): ChapterTwoAftermathActionResult {
  const prepared = prepareChapterTwoAftermathSave(save);
  const current = getChapterTwoAftermathState(prepared);
  if (!current.doctrineOperationCompleted) {
    return { save: prepared, state: current, ok: false, message: "Complete the doctrine operation before answering the Guild request." };
  }
  if (current.guildAidCompleted) {
    return { save: prepared, state: current, ok: false, message: "The emergency Guild contribution was already delivered." };
  }
  if (!canDeliverChapterTwoGuildAid(prepared, type)) {
    const need = type === "feed" ? "6 Feed" : type === "materials" ? "4 Materials" : "120 Gold";
    return { save: prepared, state: current, ok: false, message: `This contribution requires ${need}.` };
  }

  const feed = numberFlag(prepared.flags.ranchFeedStock);
  const materials = numberFlag(prepared.flags.ranchMaterialsStock);
  const nextSave: GameSave = {
    ...prepared,
    currencies: {
      ...prepared.currencies,
      gold: prepared.currencies.gold - (type === "gold" ? 120 : 0),
    },
    flags: {
      ...prepared.flags,
      ranchFeedStock: feed - (type === "feed" ? 6 : 0),
      ranchMaterialsStock: materials - (type === "materials" ? 4 : 0),
      chapterTwoAftermathGuildAidType: type,
      chapterTwoAftermathGuildAidDelivered: true,
    },
  };
  const label = type === "feed" ? "6 Feed" : type === "materials" ? "4 Materials" : "120 Gold";
  const state = appendHistory({
    ...current,
    stage: "wait",
    guildAidCompleted: true,
    guildAidType: type,
    readyDayNumber: save.dayState.dayNumber,
  }, `Day ${save.dayState.dayNumber}: The ranch contributed ${label} to the Guild's Woodline response.`);
  return {
    save: withState(nextSave, state),
    state,
    ok: true,
    message: `${label} delivered. End the day and wait for the Guild's final assessment.`,
  };
}

export function claimChapterTwoAftermathReport(save: GameSave): ChapterTwoAftermathActionResult {
  const prepared = prepareChapterTwoAftermathSave(save);
  const current = getChapterTwoAftermathState(prepared);
  if (current.stage !== "report" && current.stage !== "complete") {
    return { save: prepared, state: current, ok: false, message: "The final Woodline report is not ready yet." };
  }
  if (current.rewardClaimed) {
    return { save: prepared, state: current, ok: false, message: "The final report reward was already claimed." };
  }

  const materials = numberFlag(prepared.flags.ranchMaterialsStock);
  const state = appendHistory({
    ...current,
    stage: "complete",
    finalReportRead: true,
    rewardClaimed: true,
  }, `Day ${save.dayState.dayNumber}: The Guild declared the Woodline route contained and the ranch response proven.`);
  const nextSave = withState({
    ...prepared,
    currencies: {
      ...prepared.currencies,
      gold: prepared.currencies.gold + 150,
      guildPoints: prepared.currencies.guildPoints + 3,
    },
    flags: {
      ...prepared.flags,
      ranchMaterialsStock: materials + 4,
      chapterTwoAftermathRewardGranted: true,
      chapterTwoAftermathCompletedDayNumber: save.dayState.dayNumber,
      m66ChapterTwoAftermathComplete: true,
    },
  }, state);
  return {
    save: nextSave,
    state,
    ok: true,
    message: "Woodline Aftermath complete: +150 Gold, +3 Guild Points, and +4 Materials.",
  };
}

export function getChapterTwoAftermathObjective(save: GameSave): ChapterTwoAftermathObjective | null {
  if (!isChapterTwoAftermathEligible(save)) return null;
  const state = getChapterTwoAftermathState(prepareChapterTwoAftermathSave(save));
  if (state.stage === "survey") return {
    stage: state.stage,
    title: "Count the Cost",
    body: "Meet Petra at the damaged fence, review the first defense, and identify what still threatens the ranch.",
    hint: "The review records the battle outcome but never changes its rewards or penalties.",
    action: "review",
    actionLabel: "Review the Aftermath",
  };
  if (state.stage === "recover") return {
    stage: state.stage,
    title: "Stabilize the Outer Line",
    body: "Repair immediate damage before sending a team deeper into the woodline. Materials are preferred, Gold is a fallback, and volunteer labor prevents a resource lock.",
    hint: "The repair automatically chooses the strongest affordable option and cannot trap the story.",
    action: "recover",
    actionLabel: "Begin Emergency Repairs",
  };
  if (state.stage === "operation") return {
    stage: state.stage,
    title: `${doctrineLabel(getChapterTwoState(save).doctrine)} Operation`,
    body: "Put the ranch's chosen doctrine into practice beyond the original fence line and turn it into an improved permanent defense.",
    hint: "This strengthens the doctrine already chosen in Chapter 2; it does not replace it.",
    action: "operation",
    actionLabel: "Conduct the Operation",
  };
  if (state.stage === "aid") return {
    stage: state.stage,
    title: "Answer the Guild Emergency Request",
    body: "The Guild is supporting neighboring farms affected by the same pack route. Contribute Feed, Materials, or Gold.",
    hint: "Only one contribution is required. Choose the resource your ranch can spare.",
    action: "aid",
    actionLabel: "Choose a Contribution",
  };
  if (state.stage === "wait") return {
    stage: state.stage,
    title: "Wait for the Woodline Report",
    body: "Your contribution is moving through the Guild network. Advance one Ranch Day to receive the final assessment.",
    hint: "The result is deterministic and cannot be accelerated or rerolled by reloading.",
    action: "wait",
    actionLabel: "End the Ranch Day",
  };
  if (state.stage === "report") return {
    stage: state.stage,
    title: "The Woodline Holds",
    body: "The Guild has confirmed that the pack route is contained and Petra's new procedures are working.",
    hint: "Reading the final report grants the Act II completion reward exactly once.",
    action: "report",
    actionLabel: "Read the Final Report",
  };
  return {
    stage: state.stage,
    title: "Woodline Aftermath Complete",
    body: "The ranch has repaired the breach, supported the region, and converted its doctrine into a stronger permanent defense.",
    hint: "Future predator incidents now use the improved doctrine bonuses.",
    action: "none",
    actionLabel: "Act II Complete",
  };
}

export function getChapterTwoAftermathBonuses(save: GameSave): ChapterTwoAftermathBonuses {
  return {
    security: numberFlag(save.flags.chapterTwoAftermathSecurityBonus),
    intercept: numberFlag(save.flags.chapterTwoAftermathInterceptBonus),
    pressureReduction: numberFlag(save.flags.chapterTwoAftermathPressureReduction),
    openingHpReduction: numberFlag(save.flags.chapterTwoAftermathOpeningHpReduction),
    damageReductionPercent: Math.min(90, numberFlag(save.flags.chapterTwoAftermathDamageReductionPercent)),
    feedLossReduction: numberFlag(save.flags.chapterTwoAftermathFeedLossReduction),
  };
}
