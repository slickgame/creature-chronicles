import { CREATURE_AMBITIONS, getCreatureAmbitionProgress } from "@/data/creatureAmbitions";
import { getCreatureCareerRecord } from "@/data/creatureCareerRecords";
import { getChronicleEntries } from "@/data/creatureMemories";
import { getLegacyPrestige } from "@/data/legacyProgressReconciliation";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type CreatureLegacyTitle =
  | "Rising Ranch Hand"
  | "Coliseum Veteran"
  | "Ranch Guardian"
  | "Master Caregiver"
  | "Guild Envoy"
  | "Dynasty Founder"
  | "Master Worker"
  | "Ranch Legend";

export type CreatureLegacyProfile = {
  creature: CreatureRecord;
  title: CreatureLegacyTitle;
  legacyScore: number;
  fulfilledAmbitions: number;
  strongestContribution: string;
  hallEligible: boolean;
};

export type RanchLegacySummary = {
  prestige: number;
  chronicleEntries: number;
  fulfilledAmbitions: number;
  hallEligibleCreatures: number;
  topCreature: CreatureLegacyProfile | null;
};

function scoreForCreature(save: GameSave, creatureId: CreatureId): number {
  const record = getCreatureCareerRecord(save, creatureId);
  return Math.floor(
    record.victories * 8 +
    record.knockouts * 3 +
    record.damageDealt / 100 +
    record.healingDone / 75 +
    record.alliesProtected * 3 +
    record.guildRequestsCompleted * 8 +
    record.featuredGuildRequestsCompleted * 12 +
    record.daysWorked * 2 +
    record.resourcesProduced / 25 +
    record.trainingSessionsCompleted * 3 +
    record.offspringCount * 6 +
    record.rareOffspringCount * 10 +
    record.epicOffspringCount * 18,
  );
}

function fulfilledAmbitionCount(save: GameSave, creatureId: CreatureId): number {
  return CREATURE_AMBITIONS.filter(
    (ambition) => getCreatureAmbitionProgress(save, creatureId, ambition.ambitionId).completed,
  ).length;
}

function strongestContribution(save: GameSave, creatureId: CreatureId): string {
  const record = getCreatureCareerRecord(save, creatureId);
  const contributions = [
    ["Coliseum victories", record.victories * 8],
    ["ally protection", record.alliesProtected * 3],
    ["battle healing", record.healingDone / 75],
    ["Guild service", record.guildRequestsCompleted * 8],
    ["ranch production", record.resourcesProduced / 25 + record.daysWorked * 2],
    ["family legacy", record.offspringCount * 6 + record.rareOffspringCount * 10 + record.epicOffspringCount * 18],
  ] as const;
  return [...contributions].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "ranch service";
}

function legacyTitle(save: GameSave, creatureId: CreatureId, score: number, fulfilled: number): CreatureLegacyTitle {
  if (fulfilled >= 2 || score >= 450) return "Ranch Legend";
  const record = getCreatureCareerRecord(save, creatureId);
  const candidates: Array<[CreatureLegacyTitle, number]> = [
    ["Coliseum Veteran", record.victories * 10 + record.knockouts * 2],
    ["Ranch Guardian", record.alliesProtected * 6],
    ["Master Caregiver", record.healingDone / 30],
    ["Guild Envoy", record.guildRequestsCompleted * 12 + record.featuredGuildRequestsCompleted * 10],
    ["Dynasty Founder", record.offspringCount * 10 + record.rareOffspringCount * 15 + record.epicOffspringCount * 25],
    ["Master Worker", record.daysWorked * 5 + record.resourcesProduced / 10],
  ];
  const strongest = candidates.sort((left, right) => right[1] - left[1])[0];
  return strongest && strongest[1] >= 20 ? strongest[0] : "Rising Ranch Hand";
}

export function getCreatureLegacyProfile(save: GameSave, creature: CreatureRecord): CreatureLegacyProfile {
  const legacyScore = scoreForCreature(save, creature.creatureId);
  const fulfilledAmbitions = fulfilledAmbitionCount(save, creature.creatureId);
  return {
    creature,
    legacyScore,
    fulfilledAmbitions,
    title: legacyTitle(save, creature.creatureId, legacyScore, fulfilledAmbitions),
    strongestContribution: strongestContribution(save, creature.creatureId),
    hallEligible: fulfilledAmbitions > 0 || legacyScore >= 150,
  };
}

export function getHallOfLegendsCandidates(save: GameSave, limit = 10): CreatureLegacyProfile[] {
  return (save.creatures ?? [])
    .map((creature) => getCreatureLegacyProfile(save, creature))
    .filter((profile) => profile.hallEligible)
    .sort(
      (left, right) =>
        right.fulfilledAmbitions - left.fulfilledAmbitions ||
        right.legacyScore - left.legacyScore ||
        left.creature.nickname.localeCompare(right.creature.nickname),
    )
    .slice(0, Math.max(1, limit));
}

export function getRanchLegacySummary(save: GameSave): RanchLegacySummary {
  const profiles = (save.creatures ?? [])
    .map((creature) => getCreatureLegacyProfile(save, creature))
    .sort((left, right) => right.legacyScore - left.legacyScore);
  return {
    prestige: getLegacyPrestige(save),
    chronicleEntries: getChronicleEntries(save).length,
    fulfilledAmbitions: profiles.reduce((sum, profile) => sum + profile.fulfilledAmbitions, 0),
    hallEligibleCreatures: profiles.filter((profile) => profile.hallEligible).length,
    topCreature: profiles[0] ?? null,
  };
}
