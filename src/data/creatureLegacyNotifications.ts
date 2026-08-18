import { getChronicleEntries, type ChronicleEntry } from "@/data/creatureMemories";
import { getRetiredCreatureRecords } from "@/data/creatureRetirement";
import type { GameSave } from "@/types/save";

export type MorningLegacyAnnouncement = {
  entryId: string;
  kind: "retirement" | "hall";
  title: string;
  description: string;
  dayLabel: string;
  creatureNames: string[];
  entries: ChronicleEntry[];
};

function hasTag(entry: ChronicleEntry, tag: string): boolean {
  return (entry.tags ?? []).includes(tag);
}

function isRetirement(entry: ChronicleEntry): boolean {
  return hasTag(entry, "retirement") || entry.sourceKey.startsWith("retirement:");
}

function isHall(entry: ChronicleEntry): boolean {
  return hasTag(entry, "hall-of-legends") || entry.sourceKey.startsWith("hall-induction:");
}

export function getMorningLegacyAnnouncement(save: GameSave): MorningLegacyAnnouncement | null {
  const currentDay = Math.max(1, Number(save.dayState?.dayNumber ?? 1));
  if (currentDay <= 1) return null;
  const previousDay = currentDay - 1;
  const lifecycleEntries = getChronicleEntries(save).filter(
    (entry) => entry.dayNumber === previousDay && (isRetirement(entry) || isHall(entry)),
  );
  if (!lifecycleEntries.length) return null;

  const hall = lifecycleEntries.find(isHall) ?? null;
  const retirement = hall
    ? lifecycleEntries.find(
        (entry) => isRetirement(entry) && entry.creatureIds.some((id) => hall.creatureIds.includes(id)),
      ) ?? null
    : lifecycleEntries.find(isRetirement) ?? null;
  const primary = hall ?? retirement ?? lifecycleEntries[0];
  const related = [retirement, hall].filter(
    (entry, index, entries): entry is ChronicleEntry => Boolean(entry) && entries.indexOf(entry) === index,
  );
  const creatureIds = Array.from(new Set(related.flatMap((entry) => entry.creatureIds).map(String)));
  const retiredById = new Map(
    getRetiredCreatureRecords(save).map((record) => [String(record.creatureId), record.creature.nickname]),
  );
  const activeById = new Map(
    (save.creatures ?? []).map((creature) => [String(creature.creatureId), creature.nickname]),
  );
  const creatureNames = creatureIds
    .map((id) => retiredById.get(id) ?? activeById.get(id) ?? null)
    .filter((name): name is string => Boolean(name));

  return {
    entryId: related.map((entry) => entry.entryId).join("+") || primary.entryId,
    kind: hall ? "hall" : "retirement",
    title: hall ? hall.title : primary.title,
    description: related.length > 1
      ? related.map((entry) => entry.description).join(" ")
      : primary.description,
    dayLabel: `Ranch Day ${previousDay}`,
    creatureNames: Array.from(new Set(creatureNames)),
    entries: related.length ? related : [primary],
  };
}
