import type { CreatureMoodSummary } from "@/types/ranchDay";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

function readFlagString(value: boolean | number | string | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function assignedCreatureIds(save: GameSave): Set<CreatureId> {
  const ids = Object.values(save.ranchJobs?.assignments ?? {}).flatMap((value) => Array.isArray(value) ? value : value ? [value] : []);
  return new Set(ids as CreatureId[]);
}

export function deriveCreatureMoods(save: GameSave): CreatureMoodSummary[] {
  const assigned = assignedCreatureIds(save);
  const expecting = new Set(
    (save.pregnancies ?? [])
      .filter((pregnancy) => pregnancy.status === "pregnant" && pregnancy.receiver.creatureId)
      .map((pregnancy) => pregnancy.receiver.creatureId as CreatureId),
  );
  const foodStatus = readFlagString(save.flags.ranchFoodStatus, "Fed");

  return (save.creatures ?? []).map((creature) => {
    const energyRatio = creature.maxEnergy > 0 ? creature.energy / creature.maxEnergy : 0;
    const injured = typeof creature.injuredUntilDayNumber === "number"
      && creature.injuredUntilDayNumber >= save.dayState.dayNumber;

    if (injured) {
      return {
        creatureId: String(creature.creatureId),
        creatureName: creature.nickname,
        mood: "Injured",
        reason: `${creature.injuryLabel ?? "Injured"} until Ranch Day ${creature.injuredUntilDayNumber}.`,
      };
    }
    if (expecting.has(creature.creatureId)) {
      const pregnancy = (save.pregnancies ?? []).find((record) => record.receiver.creatureId === creature.creatureId && record.status === "pregnant");
      return {
        creatureId: String(creature.creatureId),
        creatureName: creature.nickname,
        mood: "Expecting",
        reason: `Pregnant with ${pregnancy?.daysRemaining ?? 0} day${pregnancy?.daysRemaining === 1 ? "" : "s"} remaining.`,
      };
    }
    if (foodStatus === "Empty") {
      return { creatureId: String(creature.creatureId), creatureName: creature.nickname, mood: "Hungry", reason: "The ranch had no Feed during the last recovery cycle." };
    }
    if (assigned.has(creature.creatureId) && energyRatio <= 0.4) {
      return { creatureId: String(creature.creatureId), creatureName: creature.nickname, mood: "Overworked", reason: `${Math.round(energyRatio * 100)}% Energy while assigned to ranch work.` };
    }
    if (energyRatio <= 0.25 || creature.hearts <= 1) {
      return { creatureId: String(creature.creatureId), creatureName: creature.nickname, mood: "Tired", reason: `${Math.round(energyRatio * 100)}% Energy and ${creature.hearts}/${creature.maxHearts} Hearts.` };
    }
    if (creature.affection >= 75 && energyRatio >= 0.6) {
      return { creatureId: String(creature.creatureId), creatureName: creature.nickname, mood: "Thriving", reason: `High Affection (${creature.affection}) and healthy Energy.` };
    }
    if (creature.affection >= 40) {
      return { creatureId: String(creature.creatureId), creatureName: creature.nickname, mood: "Content", reason: `Affection ${creature.affection} with no urgent care warning.` };
    }
    return { creatureId: String(creature.creatureId), creatureName: creature.nickname, mood: "Restless", reason: `Affection is only ${creature.affection}; care or bonding may help.` };
  });
}

export function summarizeCreatureMoods(save: GameSave): string[] {
  const moods = deriveCreatureMoods(save);
  const counts = new Map<string, number>();
  for (const mood of moods) counts.set(mood.mood, (counts.get(mood.mood) ?? 0) + 1);
  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([mood, count]) => `${count} creature${count === 1 ? " is" : "s are"} ${mood}.`);
}
