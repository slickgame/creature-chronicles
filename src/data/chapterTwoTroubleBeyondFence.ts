import { isBuilderProjectBuilt } from "@/data/builderProjects";
import type { BattleOutcome } from "@/types/battle";
import type { GameSave } from "@/types/save";

export const CHAPTER_TWO_STATE_FLAG = "chapterTwoTroubleBeyondFenceV1";
export const CHAPTER_TWO_VERSION = 1;
export const CHAPTER_TWO_DEFENSE_TAG = "chapter-two-first-defense";

export type ChapterTwoStage =
  | "locked"
  | "tracks"
  | "petra"
  | "fortify"
  | "patrol"
  | "defense"
  | "doctrine"
  | "complete";

export type ChapterTwoDoctrine = "fortify" | "track" | "steward";

export type ChapterTwoState = {
  version: number;
  stage: ChapterTwoStage;
  startedDayNumber: number;
  tracksInspected: boolean;
  petraConsulted: boolean;
  fortificationBuilt: boolean;
  patrolPrepared: boolean;
  defenseEventId: string;
  defenseResolved: boolean;
  defenseOutcome: BattleOutcome | "";
  doctrine: ChapterTwoDoctrine | "";
  rewardClaimed: boolean;
  history: string[];
};

export type ChapterTwoObjective = {
  stage: ChapterTwoStage;
  chapterTitle: string;
  title: string;
  body: string;
  hint: string;
  action: "inspect" | "town" | "chores" | "end-day" | "choose" | "none";
  actionLabel: string;
};

export type ChapterTwoActionResult = {
  save: GameSave;
  state: ChapterTwoState;
  ok: boolean;
  message: string;
};

const DEFAULT_STATE: ChapterTwoState = {
  version: CHAPTER_TWO_VERSION,
  stage: "locked",
  startedDayNumber: 0,
  tracksInspected: false,
  petraConsulted: false,
  fortificationBuilt: false,
  patrolPrepared: false,
  defenseEventId: "",
  defenseResolved: false,
  defenseOutcome: "",
  doctrine: "",
  rewardClaimed: false,
  history: [],
};

function numberFlag(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function chapterOneComplete(save: GameSave): boolean {
  return save.flags.chapterOneGuidedComplete === true ||
    save.flags.m24ChapterOneStoryComplete === true ||
    save.flags.m15ChapterOneOnboardingComplete === true;
}

function hasSecurityAssignment(save: GameSave): boolean {
  const assigned = save.ranchJobs?.assignments?.security_patrol;
  return (Array.isArray(assigned) && assigned.length > 0) || numberFlag(save.flags.ranchSecurityScoreToday) > 0;
}

function hasPermanentFortification(save: GameSave): boolean {
  return isBuilderProjectBuilt(save, "reinforced_fence") || isBuilderProjectBuilt(save, "watchtower");
}

function parseState(value: boolean | number | string | undefined): ChapterTwoState {
  if (typeof value !== "string" || !value.trim()) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(value) as Partial<ChapterTwoState>;
    const stage: ChapterTwoStage = [
      "locked",
      "tracks",
      "petra",
      "fortify",
      "patrol",
      "defense",
      "doctrine",
      "complete",
    ].includes(String(parsed.stage)) ? parsed.stage as ChapterTwoStage : "locked";
    const outcome = ["player_won", "enemy_won", "draw"].includes(String(parsed.defenseOutcome))
      ? parsed.defenseOutcome as BattleOutcome
      : "";
    const doctrine = ["fortify", "track", "steward"].includes(String(parsed.doctrine))
      ? parsed.doctrine as ChapterTwoDoctrine
      : "";
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: CHAPTER_TWO_VERSION,
      stage,
      startedDayNumber: numberFlag(parsed.startedDayNumber as number | string | undefined),
      tracksInspected: parsed.tracksInspected === true,
      petraConsulted: parsed.petraConsulted === true,
      fortificationBuilt: parsed.fortificationBuilt === true,
      patrolPrepared: parsed.patrolPrepared === true,
      defenseEventId: typeof parsed.defenseEventId === "string" ? parsed.defenseEventId : "",
      defenseResolved: parsed.defenseResolved === true,
      defenseOutcome: outcome,
      doctrine,
      rewardClaimed: parsed.rewardClaimed === true,
      history: Array.isArray(parsed.history)
        ? parsed.history.filter((entry) => typeof entry === "string").slice(0, 24)
        : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function appendHistory(state: ChapterTwoState, entry: string): ChapterTwoState {
  return { ...state, history: [entry, ...state.history].slice(0, 24) };
}

function deriveStage(state: ChapterTwoState): ChapterTwoStage {
  if (state.stage === "locked") return "locked";
  if (!state.tracksInspected) return "tracks";
  if (!state.petraConsulted) return "petra";
  if (!state.fortificationBuilt) return "fortify";
  if (!state.patrolPrepared) return "patrol";
  if (!state.defenseResolved) return "defense";
  if (!state.doctrine) return "doctrine";
  return "complete";
}

function withState(save: GameSave, state: ChapterTwoState): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [CHAPTER_TWO_STATE_FLAG]: JSON.stringify(state),
      chapterTwoStarted: state.stage !== "locked",
      chapterTwoComplete: state.stage === "complete",
      chapterTwoDoctrine: state.doctrine || false,
      m65ChapterTwoTroubleBeyondFence: true,
    },
  };
}

export function getChapterTwoState(save: GameSave): ChapterTwoState {
  return parseState(save.flags[CHAPTER_TWO_STATE_FLAG]);
}

export function isChapterTwoEligible(save: GameSave): boolean {
  return chapterOneComplete(save) && save.flags.chapterTwoSkipped !== true;
}

export function prepareChapterTwoSave(save: GameSave): GameSave {
  const current = getChapterTwoState(save);
  if (!isChapterTwoEligible(save)) return save;

  let next = { ...current };
  if (next.stage === "locked") {
    next = appendHistory({
      ...next,
      stage: "tracks",
      startedDayNumber: save.dayState.dayNumber,
    }, `Day ${save.dayState.dayNumber}: Deep tracks appeared beyond the outer fence.`);
  }

  const fortificationBuilt = hasPermanentFortification(save);
  const patrolPrepared = hasSecurityAssignment(save);
  next = {
    ...next,
    fortificationBuilt,
    patrolPrepared,
  };
  next.stage = deriveStage(next);

  if (JSON.stringify(next) === JSON.stringify(current)) return save;
  return withState(save, next);
}

export function inspectChapterTwoTracks(save: GameSave): ChapterTwoActionResult {
  const prepared = prepareChapterTwoSave(save);
  const current = getChapterTwoState(prepared);
  if (current.stage === "locked") {
    return { save: prepared, state: current, ok: false, message: "Chapter 2 has not unlocked yet." };
  }
  if (current.tracksInspected) {
    return { save: prepared, state: current, ok: true, message: "The tracks are already documented." };
  }
  const state = appendHistory({ ...current, tracksInspected: true, stage: "petra" }, `Day ${save.dayState.dayNumber}: The tracks were identified as an organized wolf pack scouting the ranch.`);
  return {
    save: withState(prepared, state),
    state,
    ok: true,
    message: "The prints belong to a coordinated wolf pack. Petra should inspect the weak outer line.",
  };
}

export function consultChapterTwoPetra(save: GameSave): ChapterTwoActionResult {
  const prepared = prepareChapterTwoSave(save);
  const current = getChapterTwoState(prepared);
  if (!current.tracksInspected) {
    return { save: prepared, state: current, ok: false, message: "Inspect the tracks before asking Petra for a plan." };
  }
  if (current.petraConsulted) {
    return { save: prepared, state: current, ok: true, message: "Petra's security plan is already recorded." };
  }
  const state = appendHistory({ ...current, petraConsulted: true, stage: current.fortificationBuilt ? "patrol" : "fortify" }, `Day ${save.dayState.dayNumber}: Petra recommended a reinforced perimeter before the next night patrol.`);
  return {
    save: withState({
      ...prepared,
      flags: { ...prepared.flags, builderMetPetraHale: true, chapterTwoPetraBriefingSeen: true },
    }, state),
    state,
    ok: true,
    message: "Petra recommends completing the Reinforced Perimeter Fence before the pack returns.",
  };
}

export function shouldForceChapterTwoDefense(save: GameSave): boolean {
  if (!isChapterTwoEligible(save)) return false;
  const preparedState = getChapterTwoState(prepareChapterTwoSave(save));
  return preparedState.stage === "defense" &&
    preparedState.tracksInspected &&
    preparedState.petraConsulted &&
    preparedState.fortificationBuilt &&
    preparedState.patrolPrepared &&
    !preparedState.defenseResolved &&
    !preparedState.defenseEventId;
}

export function tagChapterTwoDefenseEvent(save: GameSave, eventId: string): GameSave {
  const prepared = prepareChapterTwoSave(save);
  const current = getChapterTwoState(prepared);
  if (current.defenseEventId === eventId) return prepared;
  const state = appendHistory({ ...current, stage: "defense", defenseEventId: eventId }, `Day ${save.dayState.dayNumber}: The Woodline Wolf Pack launched its first coordinated breach.`);
  return withState(prepared, state);
}

export function recordChapterTwoDefenseResolution(
  save: GameSave,
  eventId: string,
  outcome: BattleOutcome,
): GameSave {
  const prepared = prepareChapterTwoSave(save);
  const current = getChapterTwoState(prepared);
  if (current.defenseResolved) return prepared;
  if (current.defenseEventId && current.defenseEventId !== eventId) return prepared;
  const resultLabel = outcome === "player_won" ? "victory" : outcome === "draw" ? "stalemate" : "defeat";
  const state = appendHistory({
    ...current,
    stage: "doctrine",
    defenseEventId: eventId,
    defenseResolved: true,
    defenseOutcome: outcome,
  }, `Day ${save.dayState.dayNumber}: The first ranch defense ended in ${resultLabel}.`);
  return withState(prepared, state);
}

export function chooseChapterTwoDoctrine(
  save: GameSave,
  doctrine: ChapterTwoDoctrine,
): ChapterTwoActionResult {
  const prepared = prepareChapterTwoSave(save);
  const current = getChapterTwoState(prepared);
  if (!current.defenseResolved) {
    return { save: prepared, state: current, ok: false, message: "Resolve the first authored predator defense before choosing a doctrine." };
  }
  if (current.doctrine) {
    return { save: prepared, state: current, ok: false, message: `The ${current.doctrine} doctrine is already permanent for this save.` };
  }

  const doctrineText: Record<ChapterTwoDoctrine, string> = {
    fortify: "Fortified Perimeter: +10 permanent ranch Security.",
    track: "Trail Wardens: +12 interception chance and stronger opening ambushes.",
    steward: "Quiet Pastures: -8 Predator Pressure through safer feed and livestock routines.",
  };
  const state = appendHistory({
    ...current,
    stage: "complete",
    doctrine,
    rewardClaimed: true,
  }, `Day ${save.dayState.dayNumber}: ${doctrineText[doctrine]}`);

  const materials = numberFlag(prepared.flags.ranchMaterialsStock);
  const nextSave = withState({
    ...prepared,
    currencies: {
      ...prepared.currencies,
      gold: prepared.currencies.gold + 250,
      guildPoints: prepared.currencies.guildPoints + 5,
    },
    flags: {
      ...prepared.flags,
      ranchMaterialsStock: materials + 8,
      chapterTwoDoctrineSecurityBonus: doctrine === "fortify" ? 10 : 0,
      chapterTwoDoctrineInterceptBonus: doctrine === "track" ? 12 : 0,
      chapterTwoDoctrinePressureReduction: doctrine === "steward" ? 8 : 0,
      chapterTwoRewardGranted: true,
      chapterTwoCompletedDayNumber: prepared.dayState.dayNumber,
      m65ChapterTwoComplete: true,
    },
  }, state);

  return {
    save: nextSave,
    state,
    ok: true,
    message: `${doctrineText[doctrine]} Chapter 2 complete: +250 Gold, +5 Guild Points, and +8 Materials.`,
  };
}

export function getChapterTwoObjective(save: GameSave): ChapterTwoObjective | null {
  if (!isChapterTwoEligible(save)) return null;
  const state = getChapterTwoState(prepareChapterTwoSave(save));
  const base = { chapterTitle: "Chapter 2 — Trouble Beyond the Fence", stage: state.stage } as const;
  if (state.stage === "tracks") return { ...base, title: "Tracks at the Woodline", body: "Deep prints circle the feed shed and stop just beyond the fence. Determine what is scouting the ranch.", hint: "Inspecting the tracks starts the security storyline without spending Energy.", action: "inspect", actionLabel: "Inspect the Tracks" };
  if (state.stage === "petra") return { ...base, title: "Ask the Builder", body: "The tracks belong to a coordinated wolf pack. Petra Hale can identify the weak approaches and recommend a permanent response.", hint: "Record Petra's briefing, then review security projects in the Builder's Yard.", action: "town", actionLabel: "Consult Petra" };
  if (state.stage === "fortify") return { ...base, title: "Raise a Real Barrier", body: "Commission the Reinforced Perimeter Fence or complete the Woodline Watchtower before the pack returns.", hint: "The Reinforced Fence is the intended first option and has no land prerequisite.", action: "town", actionLabel: "Open Builder's Yard" };
  if (state.stage === "patrol") return { ...base, title: "Prepare the Night Watch", body: "Assign at least one available creature to Security Patrol. Permanent construction helps, but someone still has to watch the line.", hint: "A stronger patrol improves the chance that the wolves begin the battle wounded.", action: "chores", actionLabel: "Assign Security Patrol" };
  if (state.stage === "defense") return { ...base, title: "The Pack Returns Tonight", body: "Your preparations are complete. End the Ranch Day to trigger the authored Woodline Wolf Pack defense.", hint: "The event is saved immediately and cannot be rerolled by reloading.", action: "end-day", actionLabel: "Prepare to End Day" };
  if (state.stage === "doctrine") return { ...base, title: "Choose the Ranch's Defense Doctrine", body: "The first breach changed how the ranch will handle future threats. Choose one permanent strategic identity.", hint: "Fortify adds Security, Track improves interception, and Steward reduces Predator Pressure.", action: "choose", actionLabel: "Choose a Doctrine" };
  return { ...base, title: "The Fence Holds", body: "The ranch has survived its first coordinated predator threat and adopted a permanent defense doctrine.", hint: "Future chapters can build on this doctrine and the expanding woodline.", action: "none", actionLabel: "Chapter Complete" };
}

export function getChapterTwoDoctrineBonuses(save: GameSave): { security: number; intercept: number; pressureReduction: number } {
  return {
    security: numberFlag(save.flags.chapterTwoDoctrineSecurityBonus),
    intercept: numberFlag(save.flags.chapterTwoDoctrineInterceptBonus),
    pressureReduction: numberFlag(save.flags.chapterTwoDoctrinePressureReduction),
  };
}
