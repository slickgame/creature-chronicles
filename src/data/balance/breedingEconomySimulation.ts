import { BREEDING_ECONOMY_CONFIG, getBreederXpToNext, getCreatureXpToNext } from "./breedingEconomyConfig";
import type {
  BalanceSimulationProgress,
  BreedingEconomyResult,
  BreedingEconomyScenario,
} from "./breedingEconomyTypes";
import { average, createSeededRandom, median, percentile, rollPercent } from "./seededRandom";

const EPSILON = 0.000001;

type SimulationVariant = {
  abilities: boolean;
  streaks: boolean;
};

type ProgressionState = {
  kind: "player" | "creature";
  level: number;
  xp: number;
  xpToNext: number;
};

type ReceiverState = ProgressionState & {
  energy: number;
  hearts: number;
  maxEnergy: number;
  maxHearts: number;
  unavailableUntilDay: number;
  streak: number;
};

type RunMetrics = {
  attempts: number;
  eligibleAttempts: number;
  pregnancies: number;
  offspring: number;
  displayedChanceTotal: number;
  energySpent: number;
  unusedEnergyTotal: number;
  unusedEnergySamples: number;
  snacksUsed: number;
  snackEnergyRestored: number;
  snackEnergyWasted: number;
  snackEnabledAttempts: number;
  tonicsUsed: number;
  goldEarned: number;
  goldSpent: number;
  creatureXp: number;
  breederXp: number;
  creatureLevelUps: number;
  breederRankUps: number;
  streakAtConception: number[];
  failureStreaks: number[];
  streakCapAttempts: number;
  attemptsPerDay: number[];
  daysToFirstConception: number[];
  daysToOffspring: number[];
  daysSimulated: number;
  daysWithNoAttempt: number;
  energyLimitedDays: number;
  heartLimitedDays: number;
  pregnancyLockedDays: number;
};

function emptyMetrics(): RunMetrics {
  return {
    attempts: 0,
    eligibleAttempts: 0,
    pregnancies: 0,
    offspring: 0,
    displayedChanceTotal: 0,
    energySpent: 0,
    unusedEnergyTotal: 0,
    unusedEnergySamples: 0,
    snacksUsed: 0,
    snackEnergyRestored: 0,
    snackEnergyWasted: 0,
    snackEnabledAttempts: 0,
    tonicsUsed: 0,
    goldEarned: 0,
    goldSpent: 0,
    creatureXp: 0,
    breederXp: 0,
    creatureLevelUps: 0,
    breederRankUps: 0,
    streakAtConception: [],
    failureStreaks: [],
    streakCapAttempts: 0,
    attemptsPerDay: [],
    daysToFirstConception: [],
    daysToOffspring: [],
    daysSimulated: 0,
    daysWithNoAttempt: 0,
    energyLimitedDays: 0,
    heartLimitedDays: 0,
    pregnancyLockedDays: 0,
  };
}

function mergeMetrics(target: RunMetrics, source: RunMetrics): void {
  target.attempts += source.attempts;
  target.eligibleAttempts += source.eligibleAttempts;
  target.pregnancies += source.pregnancies;
  target.offspring += source.offspring;
  target.displayedChanceTotal += source.displayedChanceTotal;
  target.energySpent += source.energySpent;
  target.unusedEnergyTotal += source.unusedEnergyTotal;
  target.unusedEnergySamples += source.unusedEnergySamples;
  target.snacksUsed += source.snacksUsed;
  target.snackEnergyRestored += source.snackEnergyRestored;
  target.snackEnergyWasted += source.snackEnergyWasted;
  target.snackEnabledAttempts += source.snackEnabledAttempts;
  target.tonicsUsed += source.tonicsUsed;
  target.goldEarned += source.goldEarned;
  target.goldSpent += source.goldSpent;
  target.creatureXp += source.creatureXp;
  target.breederXp += source.breederXp;
  target.creatureLevelUps += source.creatureLevelUps;
  target.breederRankUps += source.breederRankUps;
  target.streakAtConception.push(...source.streakAtConception);
  target.failureStreaks.push(...source.failureStreaks);
  target.streakCapAttempts += source.streakCapAttempts;
  target.attemptsPerDay.push(...source.attemptsPerDay);
  target.daysToFirstConception.push(...source.daysToFirstConception);
  target.daysToOffspring.push(...source.daysToOffspring);
  target.daysSimulated += source.daysSimulated;
  target.daysWithNoAttempt += source.daysWithNoAttempt;
  target.energyLimitedDays += source.energyLimitedDays;
  target.heartLimitedDays += source.heartLimitedDays;
  target.pregnancyLockedDays += source.pregnancyLockedDays;
}

function progressState(state: ProgressionState, amount: number): number {
  if (amount <= 0) return 0;
  state.xp += amount;
  let levelUps = 0;
  while (state.xp >= state.xpToNext && levelUps < 100) {
    state.xp -= state.xpToNext;
    state.level += 1;
    levelUps += 1;
    state.xpToNext = state.kind === "player"
      ? getBreederXpToNext(state.level)
      : getCreatureXpToNext(state.level);
  }
  return levelUps;
}

function getChance(
  scenario: BreedingEconomyScenario,
  streak: number,
  tonicUsed: boolean,
  variant: SimulationVariant,
): number {
  const streakBonus = variant.streaks
    ? Math.min(scenario.pairStreakBonusCap, Math.max(0, streak) * scenario.pairStreakBonusPerFailure)
    : 0;
  const abilityBonus = variant.abilities ? scenario.abilityChanceBonus : 0;
  const tonicBonus = tonicUsed ? scenario.fertilityTonicBonus : 0;
  return Math.max(
    0,
    Math.min(
      scenario.chanceCap,
      scenario.baseChance +
        scenario.affectionBonus +
        scenario.fertilityBonus +
        scenario.charmBonus +
        scenario.facilityChanceBonus +
        abilityBonus +
        streakBonus +
        tonicBonus,
    ),
  );
}

function shouldUseTonic(scenario: BreedingEconomyScenario, streak: number): boolean {
  if (scenario.tonicPolicy === "every-attempt") return true;
  if (scenario.tonicPolicy === "new-pairs") return streak === 0;
  if (scenario.tonicPolicy === "after-three-failures") return streak >= 3;
  return false;
}

function getEnergyCost(scenario: BreedingEconomyScenario, variant: SimulationVariant): number {
  return variant.abilities ? scenario.energyCost : scenario.energyCostWithoutAbilities;
}

function getCreatureXp(scenario: BreedingEconomyScenario, variant: SimulationVariant): number {
  return variant.abilities ? scenario.creatureXpGain : scenario.creatureXpGainWithoutAbilities;
}

function getBreederXp(scenario: BreedingEconomyScenario, variant: SimulationVariant): number {
  return variant.abilities ? scenario.breederXpGain : scenario.breederXpGainWithoutAbilities;
}

function makeProgressionState(template: BreedingEconomyScenario["giver"]): ProgressionState {
  return {
    kind: template.kind,
    level: template.level,
    xp: template.xp,
    xpToNext: Math.max(1, template.xpToNext),
  };
}

function makeReceiverState(scenario: BreedingEconomyScenario): ReceiverState {
  return {
    ...makeProgressionState(scenario.receiver),
    energy: scenario.receiver.maxEnergy,
    hearts: scenario.receiver.maxHearts,
    maxEnergy: scenario.receiver.maxEnergy,
    maxHearts: scenario.receiver.maxHearts,
    unavailableUntilDay: 0,
    streak: scenario.initialStreak,
  };
}

function attemptBatch(
  scenario: BreedingEconomyScenario,
  variant: SimulationVariant,
  runCount: number,
  seedOffset: number,
): RunMetrics {
  const metrics = emptyMetrics();
  const random = createSeededRandom(scenario.seed + seedOffset);
  const giverProgress = makeProgressionState(scenario.giver);
  const receiverProgress = makeProgressionState(scenario.receiver);
  let streak = scenario.initialStreak;
  let gold = scenario.startingGold;
  let longestFailureStreak = streak;

  for (let index = 0; index < runCount; index += 1) {
    const tonicRequested = shouldUseTonic(scenario, streak);
    const tonicUsed = tonicRequested && gold >= scenario.fertilityTonicPrice;
    if (tonicUsed) {
      gold -= scenario.fertilityTonicPrice;
      metrics.goldSpent += scenario.fertilityTonicPrice;
      metrics.tonicsUsed += 1;
    }

    const chance = scenario.receiverCanBecomePregnant
      ? getChance(scenario, streak, tonicUsed, variant)
      : 0;
    metrics.attempts += 1;
    metrics.eligibleAttempts += 1;
    metrics.displayedChanceTotal += chance;
    const energyCost = getEnergyCost(scenario, variant);
    metrics.energySpent += energyCost * 2;
    const creatureXp = getCreatureXp(scenario, variant);
    const breederXp = getBreederXp(scenario, variant);
    const creatureParticipants = Number(scenario.giver.kind === "creature") + Number(scenario.receiver.kind === "creature");
    metrics.creatureXp += creatureXp * creatureParticipants;
    metrics.breederXp += breederXp;
    if (scenario.giver.kind === "creature") metrics.creatureLevelUps += progressState(giverProgress, creatureXp);
    else metrics.breederRankUps += progressState(giverProgress, breederXp);
    if (scenario.receiver.kind === "creature") metrics.creatureLevelUps += progressState(receiverProgress, creatureXp);
    else metrics.breederRankUps += progressState(receiverProgress, breederXp);

    if (variant.streaks && streak * scenario.pairStreakBonusPerFailure >= scenario.pairStreakBonusCap) {
      metrics.streakCapAttempts += 1;
    }

    if (scenario.receiverCanBecomePregnant && rollPercent(random, chance)) {
      metrics.pregnancies += 1;
      metrics.offspring += 1;
      metrics.streakAtConception.push(streak);
      metrics.failureStreaks.push(streak);
      longestFailureStreak = Math.max(longestFailureStreak, streak);
      streak = 0;
    } else {
      streak += 1;
      longestFailureStreak = Math.max(longestFailureStreak, streak);
    }
  }

  metrics.failureStreaks.push(longestFailureStreak);
  return metrics;
}

function buySnack(
  scenario: BreedingEconomyScenario,
  state: { energy: number; maxEnergy: number },
  economy: { gold: number; snacksToday: number },
  metrics: RunMetrics,
): boolean {
  if (economy.snacksToday >= scenario.snackMaxPerDay || economy.gold < scenario.energySnackPrice) return false;
  const missing = Math.max(0, state.maxEnergy - state.energy);
  if (missing <= 0) return false;
  economy.gold -= scenario.energySnackPrice;
  economy.snacksToday += 1;
  metrics.snacksUsed += 1;
  metrics.goldSpent += scenario.energySnackPrice;
  const restored = Math.min(missing, scenario.energySnackRestore);
  metrics.snackEnergyRestored += restored;
  metrics.snackEnergyWasted += Math.max(0, scenario.energySnackRestore - restored);
  state.energy += restored;
  return true;
}

function restoreForAttempt(
  scenario: BreedingEconomyScenario,
  giver: { energy: number; maxEnergy: number },
  receiver: { energy: number; maxEnergy: number },
  cost: number,
  economy: { gold: number; snacksToday: number },
  metrics: RunMetrics,
): boolean {
  if (scenario.snackPolicy === "never") return giver.energy >= cost && receiver.energy >= cost;
  const wasBlocked = giver.energy < cost || receiver.energy < cost;
  const shouldTopUp = scenario.snackPolicy === "whenever-affordable" ||
    scenario.snackPolicy === "below-quarter" ||
    scenario.snackPolicy === "when-blocked";
  if (!shouldTopUp) return !wasBlocked;

  let guard = 0;
  while (giver.energy < cost && guard < 20 && buySnack(scenario, giver, economy, metrics)) guard += 1;
  guard = 0;
  while (receiver.energy < cost && guard < 20 && buySnack(scenario, receiver, economy, metrics)) guard += 1;
  const enabled = giver.energy >= cost && receiver.energy >= cost;
  if (wasBlocked && enabled) metrics.snackEnabledAttempts += 1;
  return enabled;
}

function timelineRun(
  scenario: BreedingEconomyScenario,
  variant: SimulationVariant,
  sampleIndex: number,
): RunMetrics {
  const metrics = emptyMetrics();
  const random = createSeededRandom(scenario.seed + sampleIndex * 104729 + (variant.abilities ? 0 : 17) + (variant.streaks ? 0 : 31));
  const giverProgress = makeProgressionState(scenario.giver);
  const giver = {
    energy: scenario.giver.maxEnergy,
    hearts: scenario.giver.maxHearts,
    maxEnergy: scenario.giver.maxEnergy,
    maxHearts: scenario.giver.maxHearts,
  };
  const receiverTotal = scenario.pairStrategy === "repeat-pair" ? 1 : Math.max(1, scenario.receiverCount);
  const receivers = Array.from({ length: receiverTotal }, () => makeReceiverState(scenario));
  const hatchDays: number[] = [];
  let gold = scenario.startingGold;
  let firstConceptionDay: number | null = null;
  let rotateIndex = 0;

  for (let day = 1; day <= scenario.timelineDays; day += 1) {
    gold += scenario.goldIncomePerDay;
    metrics.goldEarned += scenario.goldIncomePerDay;
    const fixedSpend = Math.min(gold, Math.max(0, scenario.fixedGoldSpendPerDay));
    gold -= fixedSpend;
    metrics.goldSpent += fixedSpend;
    giver.energy = giver.maxEnergy;
    giver.hearts = giver.maxHearts;
    for (const receiver of receivers) {
      receiver.energy = receiver.maxEnergy;
      receiver.hearts = receiver.maxHearts;
    }

    const economy = { gold, snacksToday: 0 };
    let attemptsToday = 0;
    let energyBlocked = false;
    let heartBlocked = false;
    let pregnancyBlocked = false;

    for (let safety = 0; safety < BREEDING_ECONOMY_CONFIG.simulationSafetyAttemptsPerDay; safety += 1) {
      const available = receivers.filter((receiver) => receiver.unavailableUntilDay <= day);
      if (!available.length) {
        pregnancyBlocked = true;
        break;
      }

      let receiver: ReceiverState;
      if (scenario.pairStrategy === "random-eligible") {
        receiver = available[Math.floor(random() * available.length)] ?? available[0];
      } else if (scenario.pairStrategy === "rotate-receivers") {
        receiver = available[rotateIndex % available.length] ?? available[0];
        rotateIndex += 1;
      } else {
        receiver = available[0];
      }

      const energyCost = getEnergyCost(scenario, variant);
      if (!restoreForAttempt(scenario, giver, receiver, energyCost, economy, metrics)) {
        energyBlocked = true;
        break;
      }
      if (giver.hearts < scenario.heartCost || receiver.hearts < scenario.heartCost) {
        heartBlocked = true;
        break;
      }

      const tonicRequested = shouldUseTonic(scenario, receiver.streak);
      const tonicUsed = tonicRequested && economy.gold >= scenario.fertilityTonicPrice;
      if (tonicUsed) {
        economy.gold -= scenario.fertilityTonicPrice;
        metrics.goldSpent += scenario.fertilityTonicPrice;
        metrics.tonicsUsed += 1;
      }

      const chance = scenario.receiverCanBecomePregnant
        ? getChance(scenario, receiver.streak, tonicUsed, variant)
        : 0;
      metrics.attempts += 1;
      metrics.eligibleAttempts += 1;
      metrics.displayedChanceTotal += chance;
      attemptsToday += 1;
      giver.energy -= energyCost;
      receiver.energy -= energyCost;
      giver.hearts -= scenario.heartCost;
      receiver.hearts -= scenario.heartCost;
      metrics.energySpent += energyCost * 2;

      const creatureXp = getCreatureXp(scenario, variant);
      const breederXp = getBreederXp(scenario, variant);
      const creatureParticipants = Number(scenario.giver.kind === "creature") + Number(scenario.receiver.kind === "creature");
      metrics.creatureXp += creatureXp * creatureParticipants;
      metrics.breederXp += breederXp;
      if (scenario.giver.kind === "creature") metrics.creatureLevelUps += progressState(giverProgress, creatureXp);
      else metrics.breederRankUps += progressState(giverProgress, breederXp);
      if (scenario.receiver.kind === "creature") metrics.creatureLevelUps += progressState(receiver, creatureXp);
      else metrics.breederRankUps += progressState(receiver, breederXp);

      if (variant.streaks && receiver.streak * scenario.pairStreakBonusPerFailure >= scenario.pairStreakBonusCap) {
        metrics.streakCapAttempts += 1;
      }

      if (scenario.receiverCanBecomePregnant && rollPercent(random, chance)) {
        metrics.pregnancies += 1;
        metrics.streakAtConception.push(receiver.streak);
        metrics.failureStreaks.push(receiver.streak);
        if (firstConceptionDay === null) firstConceptionDay = day;
        const hatchDay = day + scenario.pregnancyDays + scenario.eggDays;
        hatchDays.push(hatchDay);
        receiver.unavailableUntilDay = day + scenario.pregnancyDays + 1;
        receiver.streak = 0;
      } else {
        receiver.streak += 1;
      }

      if (scenario.snackPolicy === "below-quarter") {
        if (giver.energy / Math.max(1, giver.maxEnergy) <= 0.25) buySnack(scenario, giver, economy, metrics);
        if (receiver.energy / Math.max(1, receiver.maxEnergy) <= 0.25) buySnack(scenario, receiver, economy, metrics);
      } else if (scenario.snackPolicy === "whenever-affordable") {
        if (giver.energy < giver.maxEnergy) buySnack(scenario, giver, economy, metrics);
        if (receiver.energy < receiver.maxEnergy) buySnack(scenario, receiver, economy, metrics);
      }
    }

    gold = economy.gold;
    metrics.attemptsPerDay.push(attemptsToday);
    metrics.daysSimulated += 1;
    if (attemptsToday === 0) metrics.daysWithNoAttempt += 1;
    if (energyBlocked) metrics.energyLimitedDays += 1;
    else if (heartBlocked) metrics.heartLimitedDays += 1;
    else if (pregnancyBlocked) metrics.pregnancyLockedDays += 1;

    const energyCurrent = giver.energy + receivers.reduce((sum, receiver) => sum + receiver.energy, 0);
    const energyMax = giver.maxEnergy + receivers.reduce((sum, receiver) => sum + receiver.maxEnergy, 0);
    metrics.unusedEnergyTotal += energyCurrent / Math.max(1, energyMax);
    metrics.unusedEnergySamples += 1;
  }

  if (firstConceptionDay !== null) metrics.daysToFirstConception.push(firstConceptionDay);
  const completedHatches = hatchDays.filter((day) => day <= scenario.timelineDays);
  metrics.offspring += completedHatches.length;
  metrics.daysToOffspring.push(...completedHatches);
  return metrics;
}

async function yieldToBrowser(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

async function runVariant(
  scenario: BreedingEconomyScenario,
  variant: SimulationVariant,
  phase: "primary" | "comparison",
  onProgress?: (progress: BalanceSimulationProgress) => void,
  signal?: AbortSignal,
): Promise<RunMetrics> {
  if (scenario.mode === "attempts") {
    const aggregate = emptyMetrics();
    const chunkSize = scenario.runs === 10000 ? 500 : scenario.runs === 1000 ? 200 : 100;
    let completed = 0;
    let seedOffset = 0;
    while (completed < scenario.runs) {
      if (signal?.aborted) throw new DOMException("Simulation cancelled", "AbortError");
      const count = Math.min(chunkSize, scenario.runs - completed);
      mergeMetrics(aggregate, attemptBatch(scenario, variant, count, seedOffset));
      completed += count;
      seedOffset += count * 37;
      onProgress?.({ completed, total: scenario.runs, percentage: Math.round((completed / scenario.runs) * 100), phase });
      await yieldToBrowser();
    }
    return aggregate;
  }

  const aggregate = emptyMetrics();
  const chunkSize = scenario.runs === 10000 ? 40 : scenario.runs === 1000 ? 25 : 10;
  for (let start = 0; start < scenario.runs; start += chunkSize) {
    if (signal?.aborted) throw new DOMException("Simulation cancelled", "AbortError");
    const end = Math.min(scenario.runs, start + chunkSize);
    for (let sample = start; sample < end; sample += 1) {
      mergeMetrics(aggregate, timelineRun(scenario, variant, sample));
    }
    onProgress?.({ completed: end, total: scenario.runs, percentage: Math.round((end / scenario.runs) * 100), phase });
    await yieldToBrowser();
  }
  return aggregate;
}

function buildFlags(result: Omit<BreedingEconomyResult, "flags">): BreedingEconomyResult["flags"] {
  const thresholds = BREEDING_ECONOMY_CONFIG.reviewThresholds;
  const flags: BreedingEconomyResult["flags"] = [];
  const dayCount = Math.max(1, result.daysSimulated);
  const energyLimitedRate = result.energyLimitedDays / dayCount;
  const heartLimitedRate = result.heartLimitedDays / dayCount;

  if (result.mode === "timeline" && energyLimitedRate < thresholds.energyLimitedDayRateLow && result.unusedEnergyRate > thresholds.unusedEnergyRateHigh) {
    flags.push({
      severity: "review",
      title: "Energy may be irrelevant",
      detail: `Only ${(energyLimitedRate * 100).toFixed(1)}% of simulated days ended on Energy while ${(result.unusedEnergyRate * 100).toFixed(1)}% remained unused at sleep.`,
    });
  }
  if (result.mode === "timeline" && heartLimitedRate > thresholds.heartLimitedDayRateHigh && result.heartLimitedDays > result.energyLimitedDays) {
    flags.push({
      severity: "review",
      title: "Hearts are the primary bottleneck",
      detail: `${(heartLimitedRate * 100).toFixed(1)}% of simulated days ended because a participant ran out of Hearts.`,
    });
  }
  if (result.pregnancyRate < thresholds.pregnancyRateLow) {
    flags.push({ severity: "warning", title: "Pregnancy rate is low", detail: `Observed pregnancy rate was ${(result.pregnancyRate * 100).toFixed(1)}%. Long failure streaks may dominate the loop.` });
  } else if (result.pregnancyRate > thresholds.pregnancyRateHigh) {
    flags.push({ severity: "review", title: "Pregnancy rate is very high", detail: `Observed pregnancy rate was ${(result.pregnancyRate * 100).toFixed(1)}%. Pair choice and familiarity may have little room to matter.` });
  }
  if (result.comparison.abilityPregnancyDelta > thresholds.abilityOutputDeltaHigh) {
    flags.push({ severity: "warning", title: "Ability dominance", detail: `Abilities increased pregnancy output by ${(result.comparison.abilityPregnancyDelta * 100).toFixed(1)}% versus the no-ability baseline.` });
  }
  if (result.snacksUsed > 0 && result.goldSpent > result.goldEarned + result.startingGold) {
    flags.push({ severity: "warning", title: "Snack economy is unsustainable", detail: "Modeled breeding spending exceeded starting Gold plus simulated income." });
  }
  if (result.daysToOffspringMedian !== null && result.daysToOffspringMedian > thresholds.offspringDaysHigh) {
    flags.push({ severity: "review", title: "Offspring production is slow", detail: `Median first completed offspring arrived on Day ${result.daysToOffspringMedian}.` });
  }
  if (!flags.length) flags.push({ severity: "info", title: "No major threshold flags", detail: "The selected scenario stayed inside the current review thresholds. Compare other presets before changing live values." });
  return flags;
}

function finalizeResult(
  scenario: BreedingEconomyScenario,
  primary: RunMetrics,
  noAbilities: RunMetrics,
  noStreak: RunMetrics,
): BreedingEconomyResult {
  const pregnancyRate = primary.pregnancies / Math.max(1, primary.eligibleAttempts);
  const noAbilitiesRate = noAbilities.pregnancies / Math.max(1, noAbilities.eligibleAttempts);
  const noStreakRate = noStreak.pregnancies / Math.max(1, noStreak.eligibleAttempts);
  const abilityPregnancyDelta = noAbilitiesRate > EPSILON ? (pregnancyRate - noAbilitiesRate) / noAbilitiesRate : 0;
  const streakPregnancyDelta = noStreakRate > EPSILON ? (pregnancyRate - noStreakRate) / noStreakRate : 0;
  const averageAttemptsPerDay = primary.daysSimulated ? primary.attempts / primary.daysSimulated : 0;
  const netGold = scenario.startingGold + primary.goldEarned - primary.goldSpent;
  const dailyNetSpend = primary.daysSimulated ? (primary.goldSpent - primary.goldEarned) / primary.daysSimulated : 0;
  const resultWithoutFlags: Omit<BreedingEconomyResult, "flags"> = {
    scenarioName: scenario.name,
    mode: scenario.mode,
    runs: scenario.runs,
    timelineDays: scenario.timelineDays,
    seed: scenario.seed,
    generatedAt: new Date().toISOString(),
    attempts: primary.attempts,
    eligibleAttempts: primary.eligibleAttempts,
    pregnancies: primary.pregnancies,
    offspring: primary.offspring,
    pregnancyRate,
    displayedAverageChance: primary.displayedChanceTotal / Math.max(1, primary.eligibleAttempts),
    averageAttemptsPerDay,
    medianAttemptsPerDay: median(primary.attemptsPerDay) ?? 0,
    attemptsPerPregnancy: primary.attempts / Math.max(1, primary.pregnancies),
    averageEnergyCost: primary.energySpent / Math.max(1, primary.attempts * 2),
    totalEnergySpent: primary.energySpent,
    energyPerPregnancy: primary.energySpent / Math.max(1, primary.pregnancies),
    energyPerOffspring: primary.energySpent / Math.max(1, primary.offspring),
    unusedEnergyRate: primary.unusedEnergyTotal / Math.max(1, primary.unusedEnergySamples),
    snacksUsed: primary.snacksUsed,
    snackEnergyRestored: primary.snackEnergyRestored,
    snackEnergyWasted: primary.snackEnergyWasted,
    snackEnabledAttempts: primary.snackEnabledAttempts,
    tonicsUsed: primary.tonicsUsed,
    startingGold: scenario.startingGold,
    goldEarned: primary.goldEarned,
    goldSpent: primary.goldSpent,
    netGold,
    daysUntilGoldDepletion: dailyNetSpend > EPSILON ? Math.ceil(scenario.startingGold / dailyNetSpend) : null,
    goldPerPregnancy: primary.goldSpent / Math.max(1, primary.pregnancies),
    goldPerOffspring: primary.goldSpent / Math.max(1, primary.offspring),
    creatureXp: primary.creatureXp,
    breederXp: primary.breederXp,
    creatureLevelUps: primary.creatureLevelUps,
    breederRankUps: primary.breederRankUps,
    attemptsPerCreatureLevel: primary.attempts / Math.max(1, primary.creatureLevelUps),
    attemptsPerBreederRank: primary.attempts / Math.max(1, primary.breederRankUps),
    averageStreakAtConception: average(primary.streakAtConception),
    medianFailureStreak: median(primary.failureStreaks) ?? 0,
    longestFailureStreak: primary.failureStreaks.length ? Math.max(...primary.failureStreaks) : 0,
    streakCapAttemptRate: primary.streakCapAttempts / Math.max(1, primary.attempts),
    daysToFirstConceptionMedian: median(primary.daysToFirstConception),
    daysToOffspringMedian: median(primary.daysToOffspring),
    daysToOffspringP10: percentile(primary.daysToOffspring, 0.1),
    daysToOffspringP90: percentile(primary.daysToOffspring, 0.9),
    offspringPer30Days: primary.daysSimulated ? (primary.offspring / primary.daysSimulated) * 30 : primary.offspring,
    daysSimulated: primary.daysSimulated,
    daysWithNoAttempt: primary.daysWithNoAttempt,
    energyLimitedDays: primary.energyLimitedDays,
    heartLimitedDays: primary.heartLimitedDays,
    pregnancyLockedDays: primary.pregnancyLockedDays,
    comparison: {
      noAbilitiesPregnancyRate: noAbilitiesRate,
      noStreakPregnancyRate: noStreakRate,
      abilityPregnancyDelta,
      streakPregnancyDelta,
      abilityAdditionalPregnancies: primary.pregnancies - noAbilities.pregnancies,
      streakAdditionalPregnancies: primary.pregnancies - noStreak.pregnancies,
    },
  };
  return { ...resultWithoutFlags, flags: buildFlags(resultWithoutFlags) };
}

export async function runBreedingEconomySimulation(
  scenario: BreedingEconomyScenario,
  onProgress?: (progress: BalanceSimulationProgress) => void,
  signal?: AbortSignal,
): Promise<BreedingEconomyResult> {
  const primary = await runVariant(scenario, { abilities: true, streaks: true }, "primary", onProgress, signal);
  const comparisonProgress = (progress: BalanceSimulationProgress) => onProgress?.({
    ...progress,
    phase: "comparison",
    percentage: Math.round(progress.percentage / 2),
  });
  const noAbilities = await runVariant(scenario, { abilities: false, streaks: true }, "comparison", comparisonProgress, signal);
  const noStreak = await runVariant(scenario, { abilities: true, streaks: false }, "comparison", (progress) => onProgress?.({
    ...progress,
    phase: "comparison",
    percentage: 50 + Math.round(progress.percentage / 2),
  }), signal);
  return finalizeResult(scenario, primary, noAbilities, noStreak);
}
