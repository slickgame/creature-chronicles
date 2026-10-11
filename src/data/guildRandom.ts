import type { GameSave } from "@/types/save";

/** Save-specific deterministic randomness: reopening the board never rerolls it. */
export function guildRoll(save: GameSave): number {
  const count = Number(save.guild?.rerollCount ?? 0);
  return save.guild?.weekNumber === save.dayState.weekNumber && Number.isFinite(count)
    ? Math.max(0, Math.floor(count)) : 0;
}
export function guildRandom(save: GameSave, key: string, includeReroll = true): number {
  const text = `${save.saveId}:${save.dayState.weekNumber}:${includeReroll ? guildRoll(save) : 0}:${key}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}
