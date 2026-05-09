export type StatKey = "STR" | "DEX" | "STA" | "CHA" | "WIL" | "FER";

export type StatBlock = Record<StatKey, number>;

export type Grade = "F" | "D" | "C" | "B" | "A" | "S";

export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export const STAT_KEYS: StatKey[] = ["STR", "DEX", "STA", "CHA", "WIL", "FER"];

export const GRADE_ORDER: Grade[] = ["F", "D", "C", "B", "A", "S"];

export function clampStat(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}