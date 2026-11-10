import type { BattleCombatantId, BattleLogEventCategory, BattleMoveLogGroup, BattleOrderShiftLogEntry, BattleOrderShiftReason, BattleState } from "@/types/battle";
import { getBattleStatusGlossary } from "./battleGlossary";
import { formatBattleLogDelta, getBattleLogEventCategory } from "./battleLog";

export type BattleLogSearchResult = {
  index: number;
  roundNumber: number | undefined;
  text: string;
  orderShiftDetail?: { actorId: BattleCombatantId; detailId: string; matchedSourceIndex?: number; matchedSourceActor?: true };
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

export function getOrderShiftSources(
  detail: OrderShiftDetail,
  actorId: BattleCombatantId,
  moveGroups: ReadonlyMap<number, BattleMoveLogGroup>,
) {
  return (detail.sourceMoveLogIndexes ?? []).flatMap(index => {
    const group = moveGroups.get(index);
    const target = group?.targets.find(target => target.targetId === actorId);
    if (!group || !target) return [];
    const delta = detail.sourceMoveSpeedDeltas?.[index];
    const modifier = delta === undefined ? undefined : `${formatBattleLogDelta(delta)} Speed modifier`;
    return [{ group, target, delta, modifier }];
  });
}

function getOrderShiftSearchMatch(
  shift: BattleOrderShiftLogEntry,
  combatants: BattleState["combatants"],
  moveGroups: ReadonlyMap<number, BattleMoveLogGroup>,
  matcher: RegExp,
): Pick<BattleLogSearchResult, "text" | "orderShiftDetail"> | undefined {
  // A shift with a missing row actor is rendered as its original text log line.
  if (shift.moves.some(({ actorId }) => !combatants[actorId])) return;
  let sourceMatch: Pick<BattleLogSearchResult, "text" | "orderShiftDetail"> | undefined;
  for (const move of shift.moves) {
    for (const detail of getOrderShiftDetails(move, combatants)) {
      const text = `${combatants[move.actorId].name} · ${detail.text}`;
      const orderShiftDetail = { actorId: move.actorId, detailId: detail.id };
      if (matcher.test(detail.text)) return { text, orderShiftDetail };

      const expiry = detail.expirySpeedDelta;
      const amount = expiry === undefined ? undefined : `${formatBattleLogDelta(expiry)} Speed`;
      if (amount && matcher.test(amount)) return { text: `${text} · ${amount}`, orderShiftDetail };

      // Keep existing reason and expiry matches ahead of the first matching source badge.
      if (sourceMatch) continue;
      const sources = getOrderShiftSources(detail, move.actorId, moveGroups);
      for (const { group, modifier } of sources) {
        const moveText = modifier ? `${group.moveName} ${modifier}` : group.moveName;
        const amountMatches = modifier !== undefined && matcher.test(modifier);
        const combined = modifier && !amountMatches && matcher.exec(moveText);
        const spansBoth = combined && combined.index < group.moveName.length
          && combined.index + combined[0].length > group.moveName.length + 1;
        const qualifiedText = `${group.actorName} ${moveText}`;
        const qualified = !amountMatches && !spansBoth && matcher.exec(qualifiedText);
        // A qualifier starts with the full recorded actor name and reaches the move.
        const actorMatches = qualified && qualified.index === 0 && qualified[0].length > group.actorName.length + 1;
        if (!amountMatches && !spansBoth && !actorMatches) continue;
        const moveName = sources.length > 1 ? `${group.actorName} · ${group.moveName}` : group.moveName;
        const sourceText = actorMatches ? qualifiedText : `${moveName}${amountMatches ? " · " : " "}${modifier}`;
        sourceMatch = {
          text: `${text} · ${sourceText}`,
          orderShiftDetail: { ...orderShiftDetail, matchedSourceIndex: group.logIndex, ...(actorMatches ? { matchedSourceActor: true } : {}) },
        };
        break;
      }
    }
  }
  return sourceMatch;
}

function getSearchPattern(query: string): string {
  return query.trim().split(/\s+/)
    .map(word => {
      const literal = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[-−](?=\d)/g, "[-−]");
      // A signed number is an exact amount, even during a search without a unit.
      return /^[+−-]\d+(?:\.\d+)?$/.test(word) ? `${literal}(?!\\d|\\.\\d)` : literal;
    })
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
  const moveGroups = new Map(state.moveLog?.map(group => [group.logIndex, group]));
  const matches: BattleLogSearchResult[] = [];
  let boundaryIndex = -1;

  for (const [index, text] of state.log.entries()) {
    const shift = shifts.get(index);
    const summaryMatches = matcher.test(text);
    const detail = !summaryMatches && shift ? getOrderShiftSearchMatch(shift, state.combatants, moveGroups, matcher) : undefined;
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

export type BattleLogSearchContext = { before?: string; after?: string };

export function getBattleLogSearchTextParts(
  text: string,
  query: string,
  { before = "", after = "" }: BattleLogSearchContext = {},
): { text: string; matched: boolean }[] {
  const pattern = getSearchPattern(query);
  if (!pattern) return [{ text, matched: false }];

  const parts: { text: string; matched: boolean }[] = [];
  let offset = 0;
  for (const match of `${before}${text}${after}`.matchAll(new RegExp(pattern, "giu"))) {
    const start = Math.max(0, match.index - before.length);
    const end = Math.min(text.length, match.index + match[0].length - before.length);
    if (end <= start) continue;
    if (start > offset) parts.push({ text: text.slice(offset, start), matched: false });
    parts.push({ text: text.slice(start, end), matched: true });
    offset = end;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset), matched: false });
  return parts;
}
