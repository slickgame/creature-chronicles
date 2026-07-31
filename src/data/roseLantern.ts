import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import type { GameSave } from "@/types/save";

export const ROSE_LANTERN_STATE_FLAG = "roseLanternStateV1";
export const ROSE_LANTERN_VERSION = 1;

export type RoseLanternState = {
  version: number;
  houseRulesAccepted: boolean;
  visits: number;
  trust: number;
  rumorTokens: number;
  lastVisitDayNumber: number;
  lastShiftDayNumber: number;
  lastRumorDayNumber: number;
  lastRumor: string;
  history: string[];
};

export type RoseLanternAccess = {
  unlocked: boolean;
  reason: string;
};

export type RoseLanternActionResult = {
  save: GameSave;
  state: RoseLanternState;
  ok: boolean;
  message: string;
};

const DEFAULT_STATE: RoseLanternState = {
  version: ROSE_LANTERN_VERSION,
  houseRulesAccepted: false,
  visits: 0,
  trust: 0,
  rumorTokens: 0,
  lastVisitDayNumber: 0,
  lastShiftDayNumber: 0,
  lastRumorDayNumber: 0,
  lastRumor: "",
  history: [],
};

function deterministicRoll(seed: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  return Math.abs(hash) % Math.max(1, modulo);
}

function parseState(value: boolean | number | string | undefined): RoseLanternState {
  if (typeof value !== "string" || !value.trim()) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(value) as Partial<RoseLanternState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      version: ROSE_LANTERN_VERSION,
      houseRulesAccepted: parsed.houseRulesAccepted === true,
      visits: Math.max(0, Number(parsed.visits ?? 0)),
      trust: Math.max(0, Math.min(100, Number(parsed.trust ?? 0))),
      rumorTokens: Math.max(0, Number(parsed.rumorTokens ?? 0)),
      history: Array.isArray(parsed.history) ? parsed.history.filter((item) => typeof item === "string").slice(0, 20) : [],
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function withState(save: GameSave, state: RoseLanternState): GameSave {
  return {
    ...save,
    updatedAt: new Date().toISOString(),
    flags: {
      ...save.flags,
      [ROSE_LANTERN_STATE_FLAG]: JSON.stringify(state),
      m64RoseLanternFoundation: true,
    },
  };
}

function appendHistory(state: RoseLanternState, message: string): RoseLanternState {
  return { ...state, history: [message, ...state.history].slice(0, 20) };
}

export function getRoseLanternState(save: GameSave): RoseLanternState {
  return parseState(save.flags[ROSE_LANTERN_STATE_FLAG]);
}

export function getRoseLanternAccess(save: GameSave): RoseLanternAccess {
  const storyReady = save.flags.chapterOneGuidedComplete === true || save.flags.m24ChapterOneStoryComplete === true;
  if (storyReady || save.dayState.dayNumber >= 4) return { unlocked: true, reason: "The Rose Lantern is open for evening business." };
  return { unlocked: false, reason: "The Rose Lantern opens after Chapter 1 or on Ranch Day 4." };
}

export function acceptRoseLanternHouseRules(save: GameSave): RoseLanternActionResult {
  const access = getRoseLanternAccess(save);
  const current = getRoseLanternState(save);
  if (!access.unlocked) return { save, state: current, ok: false, message: access.reason };
  if (current.houseRulesAccepted) return { save, state: current, ok: true, message: "The Rose Lantern house rules are already acknowledged." };
  const state = appendHistory({ ...current, houseRulesAccepted: true, trust: Math.max(1, current.trust) }, `Day ${save.dayState.dayNumber}: House rules acknowledged.`);
  return { save: withState(save, state), state, ok: true, message: "House rules acknowledged. All current and future interactions remain optional, adult-only, and consent-based." };
}

export function visitRoseLanternSalon(save: GameSave): RoseLanternActionResult {
  const access = getRoseLanternAccess(save);
  const current = getRoseLanternState(save);
  if (!access.unlocked) return { save, state: current, ok: false, message: access.reason };
  if (!current.houseRulesAccepted) return { save, state: current, ok: false, message: "Acknowledge the house rules before entering the salon." };
  if (current.lastVisitDayNumber === save.dayState.dayNumber) return { save, state: current, ok: false, message: "You already spent time in the salon today." };
  if (save.currencies.gold < 10) return { save, state: current, ok: false, message: "A salon visit costs 10 Gold." };

  const state = appendHistory({
    ...current,
    visits: current.visits + 1,
    trust: Math.min(100, current.trust + 2),
    rumorTokens: current.rumorTokens + 1,
    lastVisitDayNumber: save.dayState.dayNumber,
  }, `Day ${save.dayState.dayNumber}: Salon visit completed; +2 House Trust and +1 Rumor Token.`);
  const nextSave = withState({ ...save, currencies: { ...save.currencies, gold: save.currencies.gold - 10 } }, state);
  return { save: nextSave, state, ok: true, message: "The salon visit cost 10 Gold and granted +2 House Trust and +1 Rumor Token." };
}

export function workRoseLanternHospitalityShift(save: GameSave): RoseLanternActionResult {
  const access = getRoseLanternAccess(save);
  const current = getRoseLanternState(save);
  if (!access.unlocked) return { save, state: current, ok: false, message: access.reason };
  if (!current.houseRulesAccepted) return { save, state: current, ok: false, message: "Acknowledge the house rules before taking a shift." };
  if (current.lastShiftDayNumber === save.dayState.dayNumber) return { save, state: current, ok: false, message: "You already completed a Rose Lantern shift today." };
  if (save.currencies.energy < 15) return { save, state: current, ok: false, message: "A hospitality shift requires 15 Energy." };

  const goldReward = 32 + Math.min(18, Math.floor(current.trust / 10) * 2);
  const state = appendHistory({
    ...current,
    trust: Math.min(100, current.trust + 3),
    rumorTokens: current.rumorTokens + 1,
    lastShiftDayNumber: save.dayState.dayNumber,
  }, `Day ${save.dayState.dayNumber}: Hospitality shift completed; +${goldReward} Gold, +3 House Trust, +1 Rumor Token.`);
  const nextSave = withState({
    ...save,
    currencies: {
      ...save.currencies,
      energy: Math.max(0, save.currencies.energy - 15),
      gold: save.currencies.gold + goldReward,
    },
  }, state);
  return { save: nextSave, state, ok: true, message: `Hospitality shift complete: +${goldReward} Gold, +3 House Trust, and +1 Rumor Token.` };
}

function buildRumors(save: GameSave): string[] {
  const threat = getPredatorThreatAssessment(save);
  const predatorRumor = threat.eligible
    ? `A woodcutter reports fresh ${threat.likelyPredator.replace(/_/g, " ")} tracks. Predator Pressure is ${threat.pressure}; Security needs ${threat.requiredSecurity} to fully discourage an attack.`
    : threat.blockers[0] ?? "The roads around the ranch are unusually quiet tonight.";
  const marketRumor = `Merchants expect the next weekly refresh on Ranch Day ${save.dayState.dayNumber + Math.max(1, 7 - ((save.dayState.dayNumber - 1) % 7))}. Holding extra Gold may open better choices.`;
  const builderRumor = Number(save.flags.ranchMaterialsStock ?? 0) < 10
    ? "Petra's crews are short on Materials. Field Hauling is the fastest reliable way to restock construction supplies."
    : "Petra has enough nearby material traffic to keep expansion work moving; land deeds remain the key prerequisite for new habitats.";
  const guildRumor = Number(save.currencies.guildPoints ?? 0) < 5
    ? "The Guild is quietly favoring ranchers who complete contracts and defensive work. A few more Guild Points could unlock better standing."
    : "Guild officers have noticed your standing. Higher-risk contracts may begin appearing as the ranch grows.";
  return [predatorRumor, marketRumor, builderRumor, guildRumor];
}

export function spendRoseLanternRumorToken(save: GameSave): RoseLanternActionResult {
  const current = getRoseLanternState(save);
  if (!current.houseRulesAccepted) return { save, state: current, ok: false, message: "Acknowledge the house rules before using the rumor network." };
  if (current.rumorTokens < 1) return { save, state: current, ok: false, message: "No Rumor Tokens are available. Salon visits and hospitality shifts provide them." };
  const rumors = buildRumors(save);
  const rumor = rumors[deterministicRoll(`${save.saveId}:rose-lantern-rumor:${save.dayState.dayNumber}:${current.visits}:${current.rumorTokens}`, rumors.length)];
  const state = appendHistory({
    ...current,
    rumorTokens: current.rumorTokens - 1,
    lastRumorDayNumber: save.dayState.dayNumber,
    lastRumor: rumor,
  }, `Day ${save.dayState.dayNumber}: Rumor network consulted.`);
  return { save: withState(save, state), state, ok: true, message: rumor };
}

export function getRoseLanternTrustRank(trust: number): { label: string; nextAt: number | null } {
  if (trust >= 60) return { label: "Inner Circle", nextAt: null };
  if (trust >= 35) return { label: "House Regular", nextAt: 60 };
  if (trust >= 15) return { label: "Known Guest", nextAt: 35 };
  return { label: "New Arrival", nextAt: 15 };
}
