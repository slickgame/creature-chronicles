import type { BattleLogEventCategory, BattleState } from "@/types/battle";

export type BattleLogEntry = string | {
  text: string;
  category: Exclude<BattleLogEventCategory, "order-shifts">;
};

export function getBattleLogEntryText(entry: BattleLogEntry): string {
  return typeof entry === "string" ? entry : entry.text;
}

export function formatBattleLogDelta(delta: number): string {
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

/** Keep the text log and its sparse event index in sync. */
export function appendBattleLog(state: BattleState, entries: readonly BattleLogEntry[]): BattleState {
  if (!entries.length) return state;
  const logEventCategories = { ...state.logEventCategories };
  entries.forEach((entry, offset) => {
    if (typeof entry !== "string") logEventCategories[state.log.length + offset] = entry.category;
  });
  return {
    ...state,
    log: [...state.log, ...entries.map(getBattleLogEntryText)],
    logEventCategories,
  };
}

export function getBattleLogEventCategory(state: BattleState, logIndex: number): BattleLogEventCategory | undefined {
  return state.orderShiftLog?.some(entry => entry.logIndex === logIndex)
    ? "order-shifts"
    : state.logEventCategories?.[logIndex];
}
