import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "src", "data", "balance", "breedingEconomyConfig.json"),
    "utf8",
  ),
);

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((entry) => entry.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

function numericArg(name, fallback) {
  const value = Number(arg(name, fallback));
  return Number.isFinite(value) ? value : fallback;
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))];
}

function chanceFor(streak, tonic, abilities = true, streaks = true) {
  const base = numericArg("chance", config.basePregnancyChance);
  const affection = numericArg("affection-bonus", 3);
  const fertility = numericArg("fertility-bonus", 5);
  const charm = numericArg("charm-bonus", 3);
  const facility = numericArg("facility-bonus", 3);
  const ability = abilities ? numericArg("ability-bonus", 3) : 0;
  const streakBonus = streaks
    ? Math.min(config.pairStreakBonusCap, streak * config.pairStreakBonusPerFailure)
    : 0;
  return Math.min(
    config.pregnancyChanceCap,
    base + affection + fertility + charm + facility + ability + streakBonus + (tonic ? config.fertilityTonicBonus : 0),
  );
}

function simulateAttempts(runs, seed, abilities = true, streaks = true) {
  const random = mulberry32(seed);
  let streak = 0;
  let pregnancies = 0;
  let chanceTotal = 0;
  let longest = 0;
  const conceptionStreaks = [];
  for (let index = 0; index < runs; index += 1) {
    const pregnancyChance = chanceFor(streak, false, abilities, streaks);
    chanceTotal += pregnancyChance;
    if (random() * 100 < pregnancyChance) {
      pregnancies += 1;
      conceptionStreaks.push(streak);
      streak = 0;
    } else {
      streak += 1;
      longest = Math.max(longest, streak);
    }
  }
  return {
    attempts: runs,
    pregnancies,
    pregnancyRate: pregnancies / Math.max(1, runs),
    averageChance: chanceTotal / Math.max(1, runs),
    attemptsPerPregnancy: runs / Math.max(1, pregnancies),
    averageStreakAtConception: conceptionStreaks.reduce((sum, value) => sum + value, 0) / Math.max(1, conceptionStreaks.length),
    longestFailureStreak: longest,
  };
}

function simulateTimeline(runs, days, seed, abilities = true, streaks = true) {
  const energyCost = abilities
    ? numericArg("energy-cost", 26)
    : numericArg("energy-cost-no-abilities", 29);
  const maxEnergy = numericArg("creature-energy", 112);
  const maxHearts = numericArg("hearts", 5);
  const receiverCount = Math.max(1, Math.floor(numericArg("receivers", 4)));
  const goldIncome = Math.max(0, numericArg("gold-per-day", 110));
  const startingGold = Math.max(0, numericArg("starting-gold", 1200));
  const snackPolicy = arg("snacks", "when-blocked");
  const tonicPolicy = arg("tonics", "never");
  const pregnancyDays = Math.max(1, Math.floor(numericArg("pregnancy-days", config.defaultPregnancyDays)));
  const eggDays = Math.max(1, Math.floor(numericArg("egg-days", config.defaultEggDays)));
  const attemptsPerDay = [];
  const offspringDays = [];
  let totalAttempts = 0;
  let totalPregnancies = 0;
  let totalOffspring = 0;
  let snacksUsed = 0;
  let tonicsUsed = 0;
  let goldEarned = 0;
  let goldSpent = 0;
  let energyLimitedDays = 0;
  let heartLimitedDays = 0;
  let pregnancyLockedDays = 0;

  for (let run = 0; run < runs; run += 1) {
    const random = mulberry32(seed + run * 104729 + (abilities ? 0 : 17) + (streaks ? 0 : 31));
    const receivers = Array.from({ length: receiverCount }, () => ({ availableDay: 1, streak: 0 }));
    const hatches = [];
    let gold = startingGold;
    for (let day = 1; day <= days; day += 1) {
      gold += goldIncome;
      goldEarned += goldIncome;
      let giverEnergy = maxEnergy;
      let giverHearts = maxHearts;
      let attemptsToday = 0;
      let dayEnergyBlocked = false;
      let dayHeartBlocked = false;
      let dayPregnancyBlocked = false;
      const receiverResources = receivers.map(() => ({ energy: maxEnergy, hearts: maxHearts }));

      for (let safety = 0; safety < config.simulationSafetyAttemptsPerDay; safety += 1) {
        const availableIndexes = receivers
          .map((receiver, index) => ({ receiver, index }))
          .filter(({ receiver }) => receiver.availableDay <= day);
        if (!availableIndexes.length) {
          dayPregnancyBlocked = true;
          break;
        }
        const selected = availableIndexes[attemptsToday % availableIndexes.length];
        const receiver = selected.receiver;
        const resources = receiverResources[selected.index];

        const restore = (target) => {
          if (snackPolicy === "never") return;
          while (target.energy < energyCost && gold >= config.energySnackPrice) {
            gold -= config.energySnackPrice;
            goldSpent += config.energySnackPrice;
            snacksUsed += 1;
            target.energy = Math.min(maxEnergy, target.energy + config.energySnackRestore);
          }
        };
        const giverResource = { energy: giverEnergy };
        restore(giverResource);
        giverEnergy = giverResource.energy;
        restore(resources);

        if (giverEnergy < energyCost || resources.energy < energyCost) {
          dayEnergyBlocked = true;
          break;
        }
        if (giverHearts < 2 || resources.hearts < 2) {
          dayHeartBlocked = true;
          break;
        }

        const useTonic = tonicPolicy === "every-attempt" ||
          (tonicPolicy === "new-pairs" && receiver.streak === 0) ||
          (tonicPolicy === "after-three-failures" && receiver.streak >= 3);
        const tonic = useTonic && gold >= config.fertilityTonicPrice;
        if (tonic) {
          gold -= config.fertilityTonicPrice;
          goldSpent += config.fertilityTonicPrice;
          tonicsUsed += 1;
        }

        const pregnancyChance = chanceFor(receiver.streak, tonic, abilities, streaks);
        giverEnergy -= energyCost;
        resources.energy -= energyCost;
        giverHearts -= 2;
        resources.hearts -= 2;
        totalAttempts += 1;
        attemptsToday += 1;
        if (random() * 100 < pregnancyChance) {
          totalPregnancies += 1;
          receiver.availableDay = day + pregnancyDays + 1;
          receiver.streak = 0;
          hatches.push(day + pregnancyDays + eggDays);
        } else {
          receiver.streak += 1;
        }
      }

      attemptsPerDay.push(attemptsToday);
      if (dayEnergyBlocked) energyLimitedDays += 1;
      else if (dayHeartBlocked) heartLimitedDays += 1;
      else if (dayPregnancyBlocked) pregnancyLockedDays += 1;
    }
    const completed = hatches.filter((day) => day <= days);
    totalOffspring += completed.length;
    offspringDays.push(...completed);
  }

  return {
    attempts: totalAttempts,
    pregnancies: totalPregnancies,
    offspring: totalOffspring,
    pregnancyRate: totalPregnancies / Math.max(1, totalAttempts),
    attemptsPerDay: totalAttempts / Math.max(1, runs * days),
    medianAttemptsPerDay: percentile(attemptsPerDay, 0.5),
    offspringPer30Days: (totalOffspring / Math.max(1, runs * days)) * 30,
    medianOffspringDay: percentile(offspringDays, 0.5),
    snacksUsed,
    tonicsUsed,
    goldEarned,
    goldSpent,
    netGoldPerRun: startingGold + (goldEarned - goldSpent) / Math.max(1, runs),
    energyLimitedDays,
    heartLimitedDays,
    pregnancyLockedDays,
  };
}

const mode = arg("mode", "timeline");
const runs = Math.max(100, Math.floor(numericArg("runs", 1000)));
const days = Math.max(1, Math.floor(numericArg("days", 30)));
const seed = Math.floor(numericArg("seed", 260728));

console.log(`Breeding Economy Simulation — ${runs.toLocaleString("en-US")} samples — seed ${seed}`);
console.log(`Mode: ${mode}${mode === "timeline" ? ` — ${days} days each` : ""}`);

if (mode === "attempts") {
  const primary = simulateAttempts(runs, seed, true, true);
  const noAbilities = simulateAttempts(runs, seed, false, true);
  const noStreak = simulateAttempts(runs, seed, true, false);
  console.table({
    Primary: primary,
    "No Abilities": noAbilities,
    "No Pair Streak": noStreak,
  });
} else {
  const primary = simulateTimeline(runs, days, seed, true, true);
  const noAbilities = simulateTimeline(runs, days, seed, false, true);
  const noStreak = simulateTimeline(runs, days, seed, true, false);
  console.table({
    Primary: primary,
    "No Abilities": noAbilities,
    "No Pair Streak": noStreak,
  });
}
