import type { BattleLogEventCategory, BattleState } from "@/types/battle";
import { getBattleLogEventCategory } from "./battleLog";

export type BattleLogSearchResult = {
  index: number;
  roundNumber: number | undefined;
  text: string;
};

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
  const matches: BattleLogSearchResult[] = [];
  let boundaryIndex = -1;

  for (const [index, text] of state.log.entries()) {
    if (!matcher.test(text)) continue;
    if (filters.length) {
      const category = getBattleLogEventCategory(state, index);
      if (!category || !filters.includes(category)) continue;
    }

    while (boundaryIndex + 1 < boundaries.length && boundaries[boundaryIndex + 1].logIndex <= index) {
      boundaryIndex++;
    }
    const roundNumber = boundaries[boundaryIndex]?.roundNumber
      ?? state.orderShiftLog?.find(shift => shift.logIndex === index)?.roundNumber;
    matches.push({ index, roundNumber, text });
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
