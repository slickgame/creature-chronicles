import { getBuilderWorkOrder, getBuilderProject } from "./builderProjects";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import type { GameSave } from "@/types/save";

export const ROSE_LANTERN_STATE_FLAG = "roseLanternStateV1";
export const ROSE_LANTERN_VERSION = 1;

export type RoseLanternState = {
  version: number;
  houseRulesAccepted: boolean;
  visits: number;
  shifts: number;
  rumorsHeard: number;
  topicDays: Partial<Record<RoseRumorTopic, number>>;
  lastFavorWeek: number;
  requestStage: number;
  requestAccepted: boolean;
  requestBaseline: { visits: number; shifts: number; rumors: number };
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
  visits: 0, shifts: 0, rumorsHeard: 0, topicDays: {}, lastFavorWeek: -1, requestStage: 0, requestAccepted: false, requestBaseline: { visits: 0, shifts: 0, rumors: 0 },
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

function finiteCount(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(max, Math.floor(parsed))) : 0;
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
      visits: finiteCount(parsed.visits),
      shifts: finiteCount(parsed.shifts), rumorsHeard: finiteCount(parsed.rumorsHeard),
      topicDays: Object.fromEntries(ROSE_RUMOR_TOPICS.filter(t => Number.isSafeInteger(parsed.topicDays?.[t.id]) && Number(parsed.topicDays?.[t.id]) >= 0).map(t => [t.id, parsed.topicDays![t.id]])),
      lastFavorWeek: typeof parsed.lastFavorWeek === "number" && Number.isSafeInteger(parsed.lastFavorWeek) ? Math.max(-1, parsed.lastFavorWeek) : -1,
      requestStage: finiteCount(parsed.requestStage, 3), requestAccepted: parsed.requestAccepted === true,
      requestBaseline: { visits: finiteCount(parsed.requestBaseline?.visits), shifts: finiteCount(parsed.requestBaseline?.shifts), rumors: finiteCount(parsed.requestBaseline?.rumors) },
      trust: finiteCount(parsed.trust, 100),
      rumorTokens: finiteCount(parsed.rumorTokens),
      lastVisitDayNumber: finiteCount(parsed.lastVisitDayNumber),
      lastShiftDayNumber: finiteCount(parsed.lastShiftDayNumber),
      lastRumorDayNumber: finiteCount(parsed.lastRumorDayNumber),
      lastRumor: typeof parsed.lastRumor === "string" ? parsed.lastRumor : "",
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

  const goldReward = getRoseLanternShiftReward(save);
  const state = appendHistory({
    ...current,
    trust: Math.min(100, current.trust + 3),
    rumorTokens: current.rumorTokens + 1,
    lastShiftDayNumber: save.dayState.dayNumber,
    shifts: current.shifts + 1,
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

export type RoseRumorTopic = "ranch" | "builder" | "guild";
export const ROSE_RUMOR_TOPICS: readonly { id: RoseRumorTopic; name: string }[] = [
  { id: "ranch", name: "Ranch safety" }, { id: "builder", name: "Construction news" }, { id: "guild", name: "Guild & market" },
];

export function getRoseLanternShiftReward(save: GameSave): number {
  const state = getRoseLanternState(save);
  return 32 + Math.min(18, Math.floor(state.trust / 10) * 2) + (state.requestStage >= 3 ? 10 : 0);
}

export function getRoseLanternWeek(save: GameSave): number {
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(save.dayState.weekday);
  return save.dayState.dayNumber - Math.max(0, weekday);
}

export function getRoseLanternActivityBlocker(save: GameSave, action: "visit" | "shift" | "rumor" | "favor", topic: RoseRumorTopic = "ranch"): string | null {
  const access = getRoseLanternAccess(save), current = getRoseLanternState(save);
  if (!access.unlocked) return access.reason;
  if (!current.houseRulesAccepted) return "Acknowledge the house rules first.";
  if (action === "visit") return current.lastVisitDayNumber === save.dayState.dayNumber ? "Salon visit complete today." : save.currencies.gold < 10 ? "Needs 10 Gold." : null;
  if (action === "shift") return current.lastShiftDayNumber === save.dayState.dayNumber ? "Shift complete today." : save.currencies.energy < 15 ? "Needs 15 Energy." : null;
  if (action === "favor") return current.trust < 15 ? "Requires 15 House Trust." : current.lastFavorWeek === getRoseLanternWeek(save) ? "Supply favor collected this week. Resets Monday." : current.rumorTokens < 2 ? "Needs 2 Rumor Tokens." : null;
  if (!ROSE_RUMOR_TOPICS.some(t => t.id === topic)) return "Choose an available rumor topic.";
  return current.topicDays[topic] === save.dayState.dayNumber ? "Already heard today. Your note is saved in the ledger." : current.rumorTokens < 1 ? "Needs 1 Rumor Token." : null;
}

function buildRumor(save: GameSave, topic: RoseRumorTopic): string {
  if (topic === "ranch") {
    const threat = getPredatorThreatAssessment(save);
    return `Ranch survey: Pressure ${threat.pressure}, Security ${threat.security}, current incident chance ${threat.eventChance}%. ${threat.eligible ? `Tracks of ${threat.likelyPredator.replace(/_/g, " ")} have been reported. Security ${threat.requiredSecurity} would meet the current requirement; assign a patrol or build permanent defenses.` : threat.blockers.join(" ") || "No incident conditions are currently met."}`;
  }
  if (topic === "builder") {
    const order = getBuilderWorkOrder(save);
    return order ? `Petra is building ${getBuilderProject(order.projectId).title}. Completion is Ranch Day ${order.readyDay}; finish ranch days to advance the work. Your Materials stock is ${finiteCount(save.flags.ranchMaterialsStock)}.` : `Petra's crew is free. You have ${finiteCount(save.flags.ranchMaterialsStock)} Materials. The Yard lists exact project requirements; the Supply Depot sells Materials and Field Hauling earns them through chores.`;
  }
  const nextMonday = getRoseLanternWeek(save) + 7;
  return `The Guild board and adoption listings refresh on Monday, Ranch Day ${nextMonday}. Accepted and completed requests stay on the board. Board reroll costs also reset then. You have ${finiteCount(save.currencies.guildPoints)} GP; check the Guild for requests and exact rewards.`;
}

export function spendRoseLanternRumorToken(save: GameSave, topic?: RoseRumorTopic): RoseLanternActionResult {
  const current = getRoseLanternState(save);
  const available = ROSE_RUMOR_TOPICS.filter(t => current.topicDays[t.id] !== save.dayState.dayNumber);
  const chosen = topic ?? available[deterministicRoll(`${save.saveId}:rose:${save.dayState.dayNumber}`, Math.max(1, available.length))]?.id ?? "ranch";
  const blocker = getRoseLanternActivityBlocker(save, "rumor", chosen);
  if (blocker) return { save, state: current, ok: false, message: blocker };
  const rumor = buildRumor(save, chosen);
  const state = appendHistory({ ...current, rumorTokens: current.rumorTokens - 1, rumorsHeard: current.rumorsHeard + 1, topicDays: { ...current.topicDays, [chosen]: save.dayState.dayNumber }, lastRumorDayNumber: save.dayState.dayNumber, lastRumor: rumor }, `Day ${save.dayState.dayNumber}: ${rumor}`);
  return { save: withState(save, state), state, ok: true, message: rumor };
}

export function collectRoseLanternSupplyFavor(save: GameSave): RoseLanternActionResult {
  const current = getRoseLanternState(save), blocker = getRoseLanternActivityBlocker(save, "favor");
  if (blocker) return { save, state: current, ok: false, message: blocker };
  const state = appendHistory({ ...current, rumorTokens: current.rumorTokens - 2, lastFavorWeek: getRoseLanternWeek(save) }, `Day ${save.dayState.dayNumber}: Supply favor collected: +3 Feed, +2 Materials.`);
  const next = { ...save, flags: { ...save.flags, ranchFeedStock: finiteCount(save.flags.ranchFeedStock) + 3, ranchMaterialsStock: finiteCount(save.flags.ranchMaterialsStock) + 2 } };
  return { save: withState(next, state), state, ok: true, message: "Supply favor collected: +3 Feed and +2 Materials for 2 Rumor Tokens. Available again Monday." };
}

export const ROSE_HOUSE_REQUESTS = [
  { title: "A Familiar Face", description: "Get to know the public salon and help the front-of-house crew.", visits: 2, shifts: 1, rumors: 0, trust: 0, gold: 70, gp: 3, trustReward: 3 },
  { title: "A Useful Connection", description: "Listen to local news and lend a hand on two shifts.", visits: 0, shifts: 2, rumors: 2, trust: 0, gold: 120, gp: 5, trustReward: 4 },
  { title: "One of the Regulars", description: "Build a lasting place in the house through regular visits and reliable work.", visits: 3, shifts: 3, rumors: 0, trust: 35, gold: 200, gp: 8, trustReward: 5 },
] as const;

export function getRoseLanternRequest(save: GameSave) {
  const state = getRoseLanternState(save), definition = ROSE_HOUSE_REQUESTS[state.requestStage];
  if (!definition) return null;
  const progress = { visits: Math.max(0, state.visits - state.requestBaseline.visits), shifts: Math.max(0, state.shifts - state.requestBaseline.shifts), rumors: Math.max(0, state.rumorsHeard - state.requestBaseline.rumors), trust: state.trust };
  const ready = state.requestAccepted && progress.visits >= definition.visits && progress.shifts >= definition.shifts && progress.rumors >= definition.rumors && progress.trust >= definition.trust;
  return { definition, progress, accepted: state.requestAccepted, ready, stage: state.requestStage };
}

export function acceptRoseLanternRequest(save: GameSave): RoseLanternActionResult {
  const current = getRoseLanternState(save), request = getRoseLanternRequest(save);
  if (!getRoseLanternAccess(save).unlocked || !current.houseRulesAccepted) return { save, state: current, ok: false, message: "Enter the house and acknowledge its rules first." };
  if (!request || request.accepted) return { save, state: current, ok: false, message: "No new house request is available." };
  const state = appendHistory({ ...current, requestAccepted: true, requestBaseline: { visits: current.visits, shifts: current.shifts, rumors: current.rumorsHeard } }, `Day ${save.dayState.dayNumber}: Accepted ${request.definition.title}.`);
  return { save: withState(save,state), state, ok: true, message: `${request.definition.title} accepted. Activities count from now; current Trust counts toward the requirement.` };
}

export function claimRoseLanternRequest(save: GameSave): RoseLanternActionResult {
  const current = getRoseLanternState(save), request = getRoseLanternRequest(save);
  if (!getRoseLanternAccess(save).unlocked || !current.houseRulesAccepted || !request?.ready) return { save, state: current, ok: false, message: "The house request is not ready to claim." };
  const reward = request.definition;
  const state = appendHistory({ ...current, requestStage: current.requestStage + 1, requestAccepted: false, trust: Math.min(100,current.trust + reward.trustReward) }, `Day ${save.dayState.dayNumber}: ${reward.title} completed; +${reward.gold} Gold, +${reward.gp} GP, +${reward.trustReward} Trust.`);
  const next = { ...save, currencies: { ...save.currencies, gold: save.currencies.gold + reward.gold, guildPoints: save.currencies.guildPoints + reward.gp } };
  return { save: withState(next,state), state, ok: true, message: `Request complete: +${reward.gold} Gold, +${reward.gp} GP and +${reward.trustReward} Trust.${state.requestStage >= 3 ? " House partnership unlocked: +10 Gold on each future hospitality shift." : " The next request is now available."}` };
}

export function getRoseLanternTrustRank(trust: number): { label: string; nextAt: number | null } {
  if (trust >= 60) return { label: "Inner Circle", nextAt: null };
  if (trust >= 35) return { label: "House Regular", nextAt: 60 };
  if (trust >= 15) return { label: "Known Guest", nextAt: 35 };
  return { label: "New Arrival", nextAt: 15 };
}

