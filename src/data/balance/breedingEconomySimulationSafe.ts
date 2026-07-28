import { BREEDING_ECONOMY_CONFIG, getBreederXpToNext, getCreatureXpToNext } from "./breedingEconomyConfig";
import type {
  BalanceSimulationProgress,
  BreedingEconomyResult,
  BreedingEconomyScenario,
} from "./breedingEconomyTypes";
import { average, createSeededRandom, median, percentile, rollPercent } from "./seededRandom";

type Variant = { abilities: boolean; streaks: boolean };
type ProgressState = { kind: "player" | "creature"; level: number; xp: number; xpToNext: number };
type ReceiverState = ProgressState & {
  energy: number;
  hearts: number;
  maxEnergy: number;
  maxHearts: number;
  availableDay: number;
  streak: number;
};

type Metrics = {
  attempts: number;
  eligibleAttempts: number;
  pregnancies: number;
  offspring: number;
  chanceTotal: number;
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
  conceptionStreaks: number[];
  failureStreaks: number[];
  streakCapAttempts: number;
  attemptsPerDay: number[];
  firstConceptionDays: number[];
  offspringDays: number[];
  daysSimulated: number;
  daysWithNoAttempt: number;
  energyLimitedDays: number;
  heartLimitedDays: number;
  pregnancyLockedDays: number;
};

function metrics(): Metrics {
  return {
    attempts: 0,
    eligibleAttempts: 0,
    pregnancies: 0,
    offspring: 0,
    chanceTotal: 0,
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
    conceptionStreaks: [],
    failureStreaks: [],
    streakCapAttempts: 0,
    attemptsPerDay: [],
    firstConceptionDays: [],
    offspringDays: [],
    daysSimulated: 0,
    daysWithNoAttempt: 0,
    energyLimitedDays: 0,
    heartLimitedDays: 0,
    pregnancyLockedDays: 0,
  };
}

function merge(target: Metrics, source: Metrics) {
  target.attempts += source.attempts;
  target.eligibleAttempts += source.eligibleAttempts;
  target.pregnancies += source.pregnancies;
  target.offspring += source.offspring;
  target.chanceTotal += source.chanceTotal;
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
  for (const value of source.conceptionStreaks) target.conceptionStreaks.push(value);
  for (const value of source.failureStreaks) target.failureStreaks.push(value);
  target.streakCapAttempts += source.streakCapAttempts;
  for (const value of source.attemptsPerDay) target.attemptsPerDay.push(value);
  for (const value of source.firstConceptionDays) target.firstConceptionDays.push(value);
  for (const value of source.offspringDays) target.offspringDays.push(value);
  target.daysSimulated += source.daysSimulated;
  target.daysWithNoAttempt += source.daysWithNoAttempt;
  target.energyLimitedDays += source.energyLimitedDays;
  target.heartLimitedDays += source.heartLimitedDays;
  target.pregnancyLockedDays += source.pregnancyLockedDays;
}

function progress(state: ProgressState, xpGain: number): number {
  if (xpGain <= 0) return 0;
  state.xp += xpGain;
  let levels = 0;
  while (state.xp >= state.xpToNext && levels < 100) {
    state.xp -= state.xpToNext;
    state.level += 1;
    levels += 1;
    state.xpToNext = state.kind === "player" ? getBreederXpToNext(state.level) : getCreatureXpToNext(state.level);
  }
  return levels;
}

function progressionState(template: BreedingEconomyScenario["giver"]): ProgressState {
  return { kind: template.kind, level: template.level, xp: template.xp, xpToNext: Math.max(1, template.xpToNext) };
}

function receiverState(scenario: BreedingEconomyScenario): ReceiverState {
  return {
    ...progressionState(scenario.receiver),
    energy: scenario.receiver.maxEnergy,
    hearts: scenario.receiver.maxHearts,
    maxEnergy: scenario.receiver.maxEnergy,
    maxHearts: scenario.receiver.maxHearts,
    availableDay: 1,
    streak: scenario.initialStreak,
  };
}

function energyCost(scenario: BreedingEconomyScenario, variant: Variant): number {
  return variant.abilities ? scenario.energyCost : scenario.energyCostWithoutAbilities;
}

function creatureXp(scenario: BreedingEconomyScenario, variant: Variant): number {
  return variant.abilities ? scenario.creatureXpGain : scenario.creatureXpGainWithoutAbilities;
}

function breederXp(scenario: BreedingEconomyScenario, variant: Variant): number {
  return variant.abilities ? scenario.breederXpGain : scenario.breederXpGainWithoutAbilities;
}

function wantsTonic(scenario: BreedingEconomyScenario, streak: number): boolean {
  if (scenario.tonicPolicy === "every-attempt") return true;
  if (scenario.tonicPolicy === "new-pairs") return streak === 0;
  if (scenario.tonicPolicy === "after-three-failures") return streak >= 3;
  return false;
}

function pregnancyChance(scenario: BreedingEconomyScenario, streak: number, tonic: boolean, variant: Variant): number {
  const streakBonus = variant.streaks
    ? Math.min(scenario.pairStreakBonusCap, Math.max(0, streak) * scenario.pairStreakBonusPerFailure)
    : 0;
  return Math.max(0, Math.min(
    scenario.chanceCap,
    scenario.baseChance +
      scenario.affectionBonus +
      scenario.fertilityBonus +
      scenario.charmBonus +
      scenario.facilityChanceBonus +
      (variant.abilities ? scenario.abilityChanceBonus : 0) +
      streakBonus +
      (tonic ? scenario.fertilityTonicBonus : 0),
  ));
}

function applyProgression(
  scenario: BreedingEconomyScenario,
  variant: Variant,
  giverProgress: ProgressState,
  receiverProgress: ProgressState,
  output: Metrics,
) {
  const creatureGain = creatureXp(scenario, variant);
  const breederGain = breederXp(scenario, variant);
  const creatureParticipants = Number(scenario.giver.kind === "creature") + Number(scenario.receiver.kind === "creature");
  output.creatureXp += creatureGain * creatureParticipants;
  output.breederXp += breederGain;
  if (scenario.giver.kind === "creature") output.creatureLevelUps += progress(giverProgress, creatureGain);
  else output.breederRankUps += progress(giverProgress, breederGain);
  if (scenario.receiver.kind === "creature") output.creatureLevelUps += progress(receiverProgress, creatureGain);
  else output.breederRankUps += progress(receiverProgress, breederGain);
}

function buySnack(
  scenario: BreedingEconomyScenario,
  target: { energy: number; maxEnergy: number },
  economy: { gold: number; snacksToday: number },
  output: Metrics,
): boolean {
  if (economy.snacksToday >= scenario.snackMaxPerDay || economy.gold < scenario.energySnackPrice) return false;
  const missing = Math.max(0, target.maxEnergy - target.energy);
  if (missing <= 0) return false;
  economy.gold -= scenario.energySnackPrice;
  economy.snacksToday += 1;
  output.snacksUsed += 1;
  output.goldSpent += scenario.energySnackPrice;
  const restored = Math.min(missing, scenario.energySnackRestore);
  output.snackEnergyRestored += restored;
  output.snackEnergyWasted += Math.max(0, scenario.energySnackRestore - restored);
  target.energy += restored;
  return true;
}

function restoreForAttempt(
  scenario: BreedingEconomyScenario,
  giver: { energy: number; maxEnergy: number },
  receiver: { energy: number; maxEnergy: number },
  cost: number,
  economy: { gold: number; snacksToday: number },
  output: Metrics,
): boolean {
  if (scenario.snackPolicy === "never") return giver.energy >= cost && receiver.energy >= cost;
  const blockedBefore = giver.energy < cost || receiver.energy < cost;
  let guard = 0;
  while (giver.energy < cost && guard < 20 && buySnack(scenario, giver, economy, output)) guard += 1;
  guard = 0;
  while (receiver.energy < cost && guard < 20 && buySnack(scenario, receiver, economy, output)) guard += 1;
  const enabled = giver.energy >= cost && receiver.energy >= cost;
  if (blockedBefore && enabled) output.snackEnabledAttempts += 1;
  return enabled;
}

async function yieldControl() {
  await new Promise<void>((resolve) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

async function runAttemptVariant(
  scenario: BreedingEconomyScenario,
  variant: Variant,
  phase: "primary" | "comparison",
  onProgress?: (progress: BalanceSimulationProgress) => void,
  signal?: AbortSignal,
): Promise<Metrics> {
  const output = metrics();
  const random = createSeededRandom(scenario.seed);
  const giverProgress = progressionState(scenario.giver);
  const receiverProgress = progressionState(scenario.receiver);
  let streak = scenario.initialStreak;
  let gold = scenario.startingGold;
  let longest = streak;
  const chunk = scenario.runs === 10000 ? 500 : scenario.runs === 1000 ? 200 : 100;

  for (let start = 0; start < scenario.runs; start += chunk) {
    if (signal?.aborted) throw new DOMException("Simulation cancelled", "AbortError");
    const end = Math.min(scenario.runs, start + chunk);
    for (let index = start; index < end; index += 1) {
      const tonic = wantsTonic(scenario, streak) && gold >= scenario.fertilityTonicPrice;
      if (tonic) {
        gold -= scenario.fertilityTonicPrice;
        output.goldSpent += scenario.fertilityTonicPrice;
        output.tonicsUsed += 1;
      }
      const chance = scenario.receiverCanBecomePregnant ? pregnancyChance(scenario, streak, tonic, variant) : 0;
      output.attempts += 1;
      output.eligibleAttempts += 1;
      output.chanceTotal += chance;
      output.energySpent += energyCost(scenario, variant) * 2;
      applyProgression(scenario, variant, giverProgress, receiverProgress, output);
      if (variant.streaks && streak * scenario.pairStreakBonusPerFailure >= scenario.pairStreakBonusCap) output.streakCapAttempts += 1;
      if (scenario.receiverCanBecomePregnant && rollPercent(random, chance)) {
        output.pregnancies += 1;
        output.offspring += 1;
        output.conceptionStreaks.push(streak);
        output.failureStreaks.push(streak);
        longest = Math.max(longest, streak);
        streak = 0;
      } else {
        streak += 1;
        longest = Math.max(longest, streak);
      }
    }
    onProgress?.({ completed: end, total: scenario.runs, percentage: Math.round((end / scenario.runs) * 100), phase });
    await yieldControl();
  }
  output.failureStreaks.push(longest);
  return output;
}

function runTimelineSample(scenario: BreedingEconomyScenario, variant: Variant, sample: number): Metrics {
  const output = metrics();
  const random = createSeededRandom(scenario.seed + sample * 104729);
  const giverProgress = progressionState(scenario.giver);
  const giver = { energy: scenario.giver.maxEnergy, hearts: scenario.giver.maxHearts, maxEnergy: scenario.giver.maxEnergy, maxHearts: scenario.giver.maxHearts };
  const receiverCount = scenario.pairStrategy === "repeat-pair" ? 1 : Math.max(1, scenario.receiverCount);
  const receivers = Array.from({ length: receiverCount }, () => receiverState(scenario));
  const hatchDays: number[] = [];
  let firstConception: number | null = null;
  let gold = scenario.startingGold;
  let rotation = 0;

  for (let day = 1; day <= scenario.timelineDays; day += 1) {
    gold += scenario.goldIncomePerDay;
    output.goldEarned += scenario.goldIncomePerDay;
    const fixedSpend = Math.min(gold, Math.max(0, scenario.fixedGoldSpendPerDay));
    gold -= fixedSpend;
    output.goldSpent += fixedSpend;
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
      const available = receivers.filter((receiver) => receiver.availableDay <= day);
      if (!available.length) {
        pregnancyBlocked = true;
        break;
      }
      const receiver = scenario.pairStrategy === "random-eligible"
        ? available[Math.floor(random() * available.length)] ?? available[0]
        : scenario.pairStrategy === "rotate-receivers"
          ? available[rotation++ % available.length] ?? available[0]
          : available[0];
      const cost = energyCost(scenario, variant);
      if (!restoreForAttempt(scenario, giver, receiver, cost, economy, output)) {
        energyBlocked = true;
        break;
      }
      if (giver.hearts < scenario.heartCost || receiver.hearts < scenario.heartCost) {
        heartBlocked = true;
        break;
      }
      const tonic = wantsTonic(scenario, receiver.streak) && economy.gold >= scenario.fertilityTonicPrice;
      if (tonic) {
        economy.gold -= scenario.fertilityTonicPrice;
        output.goldSpent += scenario.fertilityTonicPrice;
        output.tonicsUsed += 1;
      }
      const chance = scenario.receiverCanBecomePregnant ? pregnancyChance(scenario, receiver.streak, tonic, variant) : 0;
      output.attempts += 1;
      output.eligibleAttempts += 1;
      output.chanceTotal += chance;
      attemptsToday += 1;
      giver.energy -= cost;
      receiver.energy -= cost;
      giver.hearts -= scenario.heartCost;
      receiver.hearts -= scenario.heartCost;
      output.energySpent += cost * 2;
      applyProgression(scenario, variant, giverProgress, receiver, output);
      if (variant.streaks && receiver.streak * scenario.pairStreakBonusPerFailure >= scenario.pairStreakBonusCap) output.streakCapAttempts += 1;

      if (scenario.receiverCanBecomePregnant && rollPercent(random, chance)) {
        output.pregnancies += 1;
        output.conceptionStreaks.push(receiver.streak);
        output.failureStreaks.push(receiver.streak);
        if (firstConception === null) firstConception = day;
        hatchDays.push(day + scenario.pregnancyDays + scenario.eggDays);
        receiver.availableDay = day + scenario.pregnancyDays + 1;
        receiver.streak = 0;
      } else {
        receiver.streak += 1;
      }

      if (scenario.snackPolicy === "below-quarter") {
        if (giver.energy / Math.max(1, giver.maxEnergy) <= 0.25) buySnack(scenario, giver, economy, output);
        if (receiver.energy / Math.max(1, receiver.maxEnergy) <= 0.25) buySnack(scenario, receiver, economy, output);
      } else if (scenario.snackPolicy === "whenever-affordable") {
        if (giver.energy < giver.maxEnergy) buySnack(scenario, giver, economy, output);
        if (receiver.energy < receiver.maxEnergy) buySnack(scenario, receiver, economy, output);
      }
    }

    gold = economy.gold;
    output.attemptsPerDay.push(attemptsToday);
    output.daysSimulated += 1;
    if (attemptsToday === 0) output.daysWithNoAttempt += 1;
    if (energyBlocked) output.energyLimitedDays += 1;
    else if (heartBlocked) output.heartLimitedDays += 1;
    else if (pregnancyBlocked) output.pregnancyLockedDays += 1;
    const energyCurrent = giver.energy + receivers.reduce((sum, receiver) => sum + receiver.energy, 0);
    const energyMax = giver.maxEnergy + receivers.reduce((sum, receiver) => sum + receiver.maxEnergy, 0);
    output.unusedEnergyTotal += energyCurrent / Math.max(1, energyMax);
    output.unusedEnergySamples += 1;
  }

  if (firstConception !== null) output.firstConceptionDays.push(firstConception);
  const completed = hatchDays.filter((day) => day <= scenario.timelineDays);
  output.offspring += completed.length;
  for (const day of completed) output.offspringDays.push(day);
  return output;
}

async function runTimelineVariant(
  scenario: BreedingEconomyScenario,
  variant: Variant,
  phase: "primary" | "comparison",
  onProgress?: (progress: BalanceSimulationProgress) => void,
  signal?: AbortSignal,
): Promise<Metrics> {
  const output = metrics();
  const chunk = scenario.runs === 10000 ? 40 : scenario.runs === 1000 ? 25 : 10;
  for (let start = 0; start < scenario.runs; start += chunk) {
    if (signal?.aborted) throw new DOMException("Simulation cancelled", "AbortError");
    const end = Math.min(scenario.runs, start + chunk);
    for (let sample = start; sample < end; sample += 1) merge(output, runTimelineSample(scenario, variant, sample));
    onProgress?.({ completed: end, total: scenario.runs, percentage: Math.round((end / scenario.runs) * 100), phase });
    await yieldControl();
  }
  return output;
}

async function runVariant(
  scenario: BreedingEconomyScenario,
  variant: Variant,
  phase: "primary" | "comparison",
  onProgress?: (progress: BalanceSimulationProgress) => void,
  signal?: AbortSignal,
): Promise<Metrics> {
  return scenario.mode === "attempts"
    ? runAttemptVariant(scenario, variant, phase, onProgress, signal)
    : runTimelineVariant(scenario, variant, phase, onProgress, signal);
}

function maxValue(values: number[]): number {
  return values.reduce((maximum, value) => Math.max(maximum, value), 0);
}

function reviewFlags(result: Omit<BreedingEconomyResult, "flags">): BreedingEconomyResult["flags"] {
  const threshold = BREEDING_ECONOMY_CONFIG.reviewThresholds;
  const days = Math.max(1, result.daysSimulated);
  const flags: BreedingEconomyResult["flags"] = [];
  if (result.mode === "timeline" && result.energyLimitedDays / days < threshold.energyLimitedDayRateLow && result.unusedEnergyRate > threshold.unusedEnergyRateHigh) {
    flags.push({ severity: "review", title: "Energy may be irrelevant", detail: `Only ${((result.energyLimitedDays / days) * 100).toFixed(1)}% of days ended on Energy while ${(result.unusedEnergyRate * 100).toFixed(1)}% remained unused at sleep.` });
  }
  if (result.mode === "timeline" && result.heartLimitedDays / days > threshold.heartLimitedDayRateHigh && result.heartLimitedDays > result.energyLimitedDays) {
    flags.push({ severity: "review", title: "Hearts are the primary bottleneck", detail: `${((result.heartLimitedDays / days) * 100).toFixed(1)}% of days ended because a participant ran out of Hearts.` });
  }
  if (result.pregnancyRate < threshold.pregnancyRateLow) flags.push({ severity: "warning", title: "Pregnancy rate is low", detail: `Observed pregnancy rate was ${(result.pregnancyRate * 100).toFixed(1)}%.` });
  else if (result.pregnancyRate > threshold.pregnancyRateHigh) flags.push({ severity: "review", title: "Pregnancy rate is very high", detail: `Observed pregnancy rate was ${(result.pregnancyRate * 100).toFixed(1)}%.` });
  if (result.comparison.abilityPregnancyDelta > threshold.abilityOutputDeltaHigh) flags.push({ severity: "warning", title: "Ability dominance", detail: `Abilities increased pregnancy output by ${(result.comparison.abilityPregnancyDelta * 100).toFixed(1)}% versus the no-ability baseline.` });
  if (result.daysToOffspringMedian !== null && result.daysToOffspringMedian > threshold.offspringDaysHigh) flags.push({ severity: "review", title: "Offspring production is slow", detail: `Median first completed offspring arrived on Day ${result.daysToOffspringMedian}.` });
  if (!flags.length) flags.push({ severity: "info", title: "No major threshold flags", detail: "The scenario stayed inside current review thresholds. Compare several presets before changing live values." });
  return flags;
}

function finalize(scenario: BreedingEconomyScenario, primary: Metrics, noAbilities: Metrics, noStreak: Metrics): BreedingEconomyResult {
  const pregnancyRate = primary.pregnancies / Math.max(1, primary.eligibleAttempts);
  const noAbilitiesRate = noAbilities.pregnancies / Math.max(1, noAbilities.eligibleAttempts);
  const noStreakRate = noStreak.pregnancies / Math.max(1, noStreak.eligibleAttempts);
  const dailyNetSpend = primary.daysSimulated ? (primary.goldSpent - primary.goldEarned) / primary.daysSimulated : 0;
  const withoutFlags: Omit<BreedingEconomyResult, "flags"> = {
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
    displayedAverageChance: primary.chanceTotal / Math.max(1, primary.eligibleAttempts),
    averageAttemptsPerDay: primary.daysSimulated ? primary.attempts / primary.daysSimulated : 0,
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
    netGold: scenario.startingGold + primary.goldEarned - primary.goldSpent,
    daysUntilGoldDepletion: dailyNetSpend > 0.000001 ? Math.ceil(scenario.startingGold / dailyNetSpend) : null,
    goldPerPregnancy: primary.goldSpent / Math.max(1, primary.pregnancies),
    goldPerOffspring: primary.goldSpent / Math.max(1, primary.offspring),
    creatureXp: primary.creatureXp,
    breederXp: primary.breederXp,
    creatureLevelUps: primary.creatureLevelUps,
    breederRankUps: primary.breederRankUps,
    attemptsPerCreatureLevel: primary.attempts / Math.max(1, primary.creatureLevelUps),
    attemptsPerBreederRank: primary.attempts / Math.max(1, primary.breederRankUps),
    averageStreakAtConception: average(primary.conceptionStreaks),
    medianFailureStreak: median(primary.failureStreaks) ?? 0,
    longestFailureStreak: maxValue(primary.failureStreaks),
    streakCapAttemptRate: primary.streakCapAttempts / Math.max(1, primary.attempts),
    daysToFirstConceptionMedian: median(primary.firstConceptionDays),
    daysToOffspringMedian: median(primary.offspringDays),
    daysToOffspringP10: percentile(primary.offspringDays, 0.1),
    daysToOffspringP90: percentile(primary.offspringDays, 0.9),
    offspringPer30Days: primary.daysSimulated ? (primary.offspring / primary.daysSimulated) * 30 : primary.offspring,
    daysSimulated: primary.daysSimulated,
    daysWithNoAttempt: primary.daysWithNoAttempt,
    energyLimitedDays: primary.energyLimitedDays,
    heartLimitedDays: primary.heartLimitedDays,
    pregnancyLockedDays: primary.pregnancyLockedDays,
    comparison: {
      noAbilitiesPregnancyRate: noAbilitiesRate,
      noStreakPregnancyRate: noStreakRate,
      abilityPregnancyDelta: noAbilitiesRate > 0.000001 ? (pregnancyRate - noAbilitiesRate) / noAbilitiesRate : 0,
      streakPregnancyDelta: noStreakRate > 0.000001 ? (pregnancyRate - noStreakRate) / noStreakRate : 0,
      abilityAdditionalPregnancies: primary.pregnancies - noAbilities.pregnancies,
      streakAdditionalPregnancies: primary.pregnancies - noStreak.pregnancies,
    },
  };
  return { ...withoutFlags, flags: reviewFlags(withoutFlags) };
}

export async function runBreedingEconomySimulation(
  scenario: BreedingEconomyScenario,
  onProgress?: (progress: BalanceSimulationProgress) => void,
  signal?: AbortSignal,
): Promise<BreedingEconomyResult> {
  const primary = await runVariant(scenario, { abilities: true, streaks: true }, "primary", onProgress, signal);
  const noAbilities = await runVariant(scenario, { abilities: false, streaks: true }, "comparison", (progressValue) => onProgress?.({ ...progressValue, percentage: Math.round(progressValue.percentage / 2) }), signal);
  const noStreak = await runVariant(scenario, { abilities: true, streaks: false }, "comparison", (progressValue) => onProgress?.({ ...progressValue, percentage: 50 + Math.round(progressValue.percentage / 2) }), signal);
  return finalize(scenario, primary, noAbilities, noStreak);
}
