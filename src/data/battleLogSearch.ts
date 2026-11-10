import type { BattleCombatantId, BattleLogEventCategory, BattleOrderShiftLogEntry, BattleOrderShiftReason, BattleState } from "@/types/battle";
import { getBattleStatusGlossary } from "./battleGlossary";
import { getBattleLogEventCategory } from "./battleLog";

export type BattleLogSearchResult = {
  index: number;
  roundNumber: number | undefined;
  text: string;
  orderShiftDetail?: { actorId: BattleCombatantId; detailId: string };
};

const SPEED_EFFECT_RESULTS = {
  applied: "was applied",
  changed: "changed",
  cleared: "was cleared",
  "wore-off": "wore off",
  "stack-wore-off": "stack wore off",
} as const;

type OrderShiftDetail = {
  id: string;
  kind: "speed" | BattleOrderShiftReason["kind"];
  text: string;
  sourceMoveLogIndexes?: readonly number[];
  sourceMoveSpeedDeltas?: Readonly<Partial<Record<number, number>>>;
  expirySpeedDelta?: number;
};

export function getOrderShiftDetails(
  move: BattleOrderShiftLogEntry["moves"][number],
  combatants: BattleState["combatants"],
): OrderShiftDetail[] {
  const details: OrderShiftDetail[] = [];
  if (move.speed) {
    details.push({ id: "speed", kind: "speed", text: `Speed ${move.speed.before} → ${move.speed.after}` });
  }
  move.reasons?.forEach((reason, index) => {
    const id = `reason-${index}`;
    if (reason.kind === "speed-effect") {
      const label = getBattleStatusGlossary(reason.status).label;
      const sources = reason.sourceMoveLogIndexes ?? (reason.sourceMoveLogIndex === undefined ? [] : [reason.sourceMoveLogIndex]);
      const expirySpeedDelta = reason.expirySpeedDelta ?? reason.recoveredSpeed;
      details.push({ id, kind: reason.kind, text: `${label} ${SPEED_EFFECT_RESULTS[reason.result]}`,
        ...(sources.length ? { sourceMoveLogIndexes: [...new Set(sources)] } : {}),
        ...(sources.length && reason.sourceMoveSpeedDeltas ? { sourceMoveSpeedDeltas: reason.sourceMoveSpeedDeltas } : {}),
        ...(expirySpeedDelta !== undefined ? { expirySpeedDelta } : {}) });
      return;
    }
    const other = combatants[reason.actorId]?.name;
    if (!other) return;
    const comparison = reason.tied ? "on a Speed tie" : "on Speed";
    const text = reason.kind === "passed" ? `Passed ${other} ${comparison}` : `${other} moved ahead ${comparison}`;
    details.push({ id, kind: reason.kind, text });
  });
  return details;
}

function getOrderShiftSearchMatch(
  shift: BattleOrderShiftLogEntry,
  combatants: BattleState["combatants"],
  matcher: RegExp,
): Pick<BattleLogSearchResult, "text" | "orderShiftDetail"> | undefined {
  // A shift with a missing row actor is rendered as its original text log line.
  if (shift.moves.some(({ actorId }) => !combatants[actorId])) return;
  for (const move of shift.moves) {
    const detail = getOrderShiftDetails(move, combatants).find(candidate => matcher.test(candidate.text));
    if (detail) {
      return {
        text: `${combatants[move.actorId].name} · ${detail.text}`,
        orderShiftDetail: { actorId: move.actorId, detailId: detail.id },
      };
    }
  }
}

function getSearchPattern(query: string): string {
  return query.trim().split(/\s+/)
    .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

export function searchBattleLog(
  state: BattleState,
  query: string,
  filters: readonly BattleLogEventCategory[] = [],
): BattleLogSearchResult[] {
  const pattern = getSearchPattern(query);
  if (!pattern) return [];

  const matcher = new RegExp(pattern, "iu");
  const boundaries = state.roundLogBoundaries ?? [];
  const shifts = new Map(state.orderShiftLog?.map(shift => [shift.logIndex, shift]));
  const matches: BattleLogSearchResult[] = [];
  let boundaryIndex = -1;

  for (const [index, text] of state.log.entries()) {
    const shift = shifts.get(index);
    const summaryMatches = matcher.test(text);
    const detail = !summaryMatches && shift ? getOrderShiftSearchMatch(shift, state.combatants, matcher) : undefined;
    if (!summaryMatches && !detail) continue;
    if (filters.length) {
      const category = getBattleLogEventCategory(state, index);
      if (!category || !filters.includes(category)) continue;
    }

    while (boundaryIndex + 1 < boundaries.length && boundaries[boundaryIndex + 1].logIndex <= index) {
      boundaryIndex++;
    }
    const roundNumber = boundaries[boundaryIndex]?.roundNumber ?? shift?.roundNumber;
    matches.push({ index, roundNumber, ...(detail ?? { text }) });
  }

  return matches;
}

export function getBattleLogSearchTextParts(text: string, query: string): { text: string; matched: boolean }[] {
  const pattern = getSearchPattern(query);
  if (!pattern) return [{ text, matched: false }];

  const parts: { text: string; matched: boolean }[] = [];
  let offset = 0;
  for (const match of text.matchAll(new RegExp(pattern, "giu"))) {
    const start = match.index;
    if (start > offset) parts.push({ text: text.slice(offset, start), matched: false });
    parts.push({ text: match[0], matched: true });
    offset = start + match[0].length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset), matched: false });
  return parts;
}
