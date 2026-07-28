import { runBreedingEconomySimulation as runCoreSimulation } from "./breedingEconomySimulation";
import type {
  BalanceSimulationProgress,
  BreedingEconomyResult,
  BreedingEconomyScenario,
} from "./breedingEconomyTypes";

function perRun(value: number, scenario: BreedingEconomyScenario): number {
  return scenario.mode === "timeline" ? value / Math.max(1, scenario.runs) : value;
}

function normalizeFlags(
  result: BreedingEconomyResult,
  scenario: BreedingEconomyScenario,
  goldEarned: number,
  goldSpent: number,
): BreedingEconomyResult["flags"] {
  const snackUnsustainable = result.snacksUsed > 0 && goldSpent > goldEarned + scenario.startingGold;
  const flags = result.flags.filter((flag) =>
    flag.title !== "Snack economy is unsustainable" &&
    (!snackUnsustainable || flag.title !== "No major threshold flags"),
  );
  if (snackUnsustainable) {
    flags.push({
      severity: "warning",
      title: "Snack economy is unsustainable",
      detail: "Average breeding spending exceeded starting Gold plus modeled income for one simulated ranch.",
    });
  }
  return flags;
}

export async function runBreedingEconomySimulation(
  scenario: BreedingEconomyScenario,
  onProgress?: (progress: BalanceSimulationProgress) => void,
  signal?: AbortSignal,
): Promise<BreedingEconomyResult> {
  const raw = await runCoreSimulation(scenario, onProgress, signal);
  if (scenario.mode !== "timeline") return raw;

  const goldEarned = perRun(raw.goldEarned, scenario);
  const goldSpent = perRun(raw.goldSpent, scenario);
  const normalized: BreedingEconomyResult = {
    ...raw,
    totalEnergySpent: perRun(raw.totalEnergySpent, scenario),
    snacksUsed: perRun(raw.snacksUsed, scenario),
    snackEnergyRestored: perRun(raw.snackEnergyRestored, scenario),
    snackEnergyWasted: perRun(raw.snackEnergyWasted, scenario),
    snackEnabledAttempts: perRun(raw.snackEnabledAttempts, scenario),
    tonicsUsed: perRun(raw.tonicsUsed, scenario),
    goldEarned,
    goldSpent,
    netGold: scenario.startingGold + goldEarned - goldSpent,
    creatureXp: perRun(raw.creatureXp, scenario),
    breederXp: perRun(raw.breederXp, scenario),
    creatureLevelUps: perRun(raw.creatureLevelUps, scenario),
    breederRankUps: perRun(raw.breederRankUps, scenario),
    daysSimulated: scenario.timelineDays,
    daysWithNoAttempt: perRun(raw.daysWithNoAttempt, scenario),
    energyLimitedDays: perRun(raw.energyLimitedDays, scenario),
    heartLimitedDays: perRun(raw.heartLimitedDays, scenario),
    pregnancyLockedDays: perRun(raw.pregnancyLockedDays, scenario),
    comparison: {
      ...raw.comparison,
      abilityAdditionalPregnancies: perRun(raw.comparison.abilityAdditionalPregnancies, scenario),
      streakAdditionalPregnancies: perRun(raw.comparison.streakAdditionalPregnancies, scenario),
    },
    flags: [],
  };
  normalized.flags = normalizeFlags(normalized, scenario, goldEarned, goldSpent);
  return normalized;
}
