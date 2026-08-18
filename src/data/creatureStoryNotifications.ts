import { getChronicleEntries, type ChronicleEntry } from "@/data/creatureMemories";
import type { GameSave } from "@/types/save";

export type MorningCreatureStory = {
  entry: ChronicleEntry;
  creatureNames: string[];
  dayLabel: string;
};

export function getMorningCreatureStory(save: GameSave): MorningCreatureStory | null {
  const currentDay = save.dayState.dayNumber;
  if (currentDay <= 1) return null;
  const previousDay = currentDay - 1;
  const entry = getChronicleEntries(save).find(
    (candidate) =>
      candidate.dayNumber === previousDay &&
      candidate.tags?.includes("daily-story"),
  );
  if (!entry) return null;

  const names = entry.creatureIds
    .map((creatureId) =>
      (save.creatures ?? []).find((creature) => creature.creatureId === creatureId)?.nickname,
    )
    .filter((name): name is string => Boolean(name));

  return {
    entry,
    creatureNames: Array.from(new Set(names)),
    dayLabel: `Ranch Day ${previousDay}`,
  };
}
