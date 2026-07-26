import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(
  __dirname,
  "..",
  "src",
  "data",
  "geneticsBalanceConfig.json",
);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const STAT_KEYS = ["STR", "DEX", "STA", "CHA", "WIL", "FER"];
const GRADE_ORDER = ["D", "C", "B", "A", "S"];
const GRADE_MULTIPLIER = { D: 0.9, C: 1, B: 1.08, A: 1.16, S: 1.25 };
const FAMILY_BASE = {
  feline: { STR: 6, DEX: 9, STA: 6, CHA: 8, WIL: 6, FER: 7 },
  canine: { STR: 9, DEX: 7, STA: 8, CHA: 6, WIL: 8, FER: 6 },
  bovine: { STR: 8, DEX: 5, STA: 11, CHA: 6, WIL: 8, FER: 8 },
  lapine: { STR: 5, DEX: 10, STA: 6, CHA: 7, WIL: 6, FER: 10 },
  equine: { STR: 8, DEX: 9, STA: 9, CHA: 7, WIL: 7, FER: 6 },
};

function getRuns() {
  const argument = process.argv.find((value) => value.startsWith("--runs="));
  const parsed = argument ? Number(argument.split("=")[1]) : config.simulationRuns;
  return Number.isFinite(parsed) ? Math.max(1000, Math.floor(parsed)) : 10000;
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function chance(random, percentage) {
  return random() * 100 < percentage;
}

function getStability(affection, streak, tier) {
  return clamp(
    Math.round(affection * 0.72 + Math.min(streak, 10) * 2 + tier * 3),
    0,
    100,
  );
}

function getChances(affection, streak, tier, shinyParents = 0) {
  const stability = getStability(affection, streak, tier);
  return {
    stability,
    gradeUpgrade: clamp(
      3 + Math.min(streak, 7) + Math.floor(stability / 28) + tier,
      3,
      18,
    ),
    gradeDowngrade: clamp(
      10 - Math.floor(stability / 16) - Math.floor(streak / 3),
      2,
      10,
    ),
    abilityInheritance: clamp(
      18 + tier * 8 + Math.min(streak, 8) * 3 + Math.floor(stability / 10),
      18,
      82,
    ),
    secondAbility: clamp(
      tier * 3 + Math.floor(streak / 2) * 2 + Math.floor(stability / 25),
      0,
      25,
    ),
    mutation: clamp(
      2 + Math.floor(streak / 4) + Math.floor(stability / 40) + Math.floor(tier / 2),
      2,
      9,
    ),
    rareVariant: clamp(
      4 + Math.min(streak, 6) + Math.floor(stability / 25) + tier,
      4,
      28,
    ),
    shiny: clamp(
      0.5 + shinyParents * 0.75 + Math.min(streak, 10) * 0.15 +
        Math.floor(stability / 25) * 0.2 + tier * 0.25,
      0.5,
      5,
    ),
  };
}

function getVarianceWindow(stability) {
  if (stability >= 85) return config.stabilityVariance.highlyStable;
  if (stability >= 68) return config.stabilityVariance.stable;
  if (stability >= 48) return config.stabilityVariance.variable;
  return config.stabilityVariance.unpredictable;
}

function shiftGrade(grade, amount) {
  const index = GRADE_ORDER.indexOf(grade);
  return GRADE_ORDER[clamp(index + amount, 0, GRADE_ORDER.length - 1)];
}

function simulateStat({
  random,
  family,
  statKey,
  parentPotential,
  parentCurrent,
  grade,
  stability,
  rarity = "Common",
  mutationBonus = 0,
}) {
  const familyBase = FAMILY_BASE[family][statKey];
  const offspringBase = Math.max(1, Math.round(familyBase * GRADE_MULTIPLIER[grade]));
  const developedSignal = Math.min(
    parentPotential + config.maxDevelopedStatSignal,
    parentCurrent,
  );
  const familyBonus = config.familyStatBonuses[family][statKey] ?? 0;
  const weights = config.inheritanceWeights;
  const anchor = Math.round(
    parentPotential * weights.parentGeneticPotential +
      offspringBase * weights.offspringSpeciesBaseline +
      developedSignal * weights.parentDevelopedStats,
  );
  const varianceWindow = getVarianceWindow(stability);
  const variance = Math.floor(random() * (varianceWindow * 2 + 1)) - varianceWindow;
  const floor = Math.max(
    1,
    offspringBase - config.levelOneFloorOffset + familyBonus,
  );
  const ceiling =
    offspringBase +
    config.gradeHeadroom[grade] +
    config.rarityHeadroom[rarity] +
    familyBonus +
    mutationBonus;
  return clamp(anchor + familyBonus + variance + mutationBonus, floor, ceiling);
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function simulateScenario(scenario, runs) {
  const random = mulberry32(scenario.seed);
  const odds = getChances(
    scenario.affection,
    scenario.streak,
    scenario.tier,
    scenario.shinyParents,
  );
  const totals = Object.fromEntries(STAT_KEYS.map((key) => [key, 0]));
  const totalStatValues = [];
  const counters = {
    gradeUpgrade: 0,
    gradeDowngrade: 0,
    ability: 0,
    secondAbility: 0,
    mutation: 0,
    rareVariant: 0,
    shiny: 0,
  };

  for (let run = 0; run < runs; run += 1) {
    const upgraded = chance(random, odds.gradeUpgrade);
    const downgraded = !upgraded && chance(random, odds.gradeDowngrade);
    const grade = upgraded
      ? shiftGrade(scenario.parentGrade, 1)
      : downgraded
        ? shiftGrade(scenario.parentGrade, -1)
        : scenario.parentGrade;
    const inheritedAbility = chance(random, odds.abilityInheritance);
    const secondAbility = inheritedAbility && chance(random, odds.secondAbility);
    const mutation = chance(random, odds.mutation);
    const mutationStat = mutation
      ? STAT_KEYS[Math.floor(random() * STAT_KEYS.length)]
      : null;
    let total = 0;

    for (const statKey of STAT_KEYS) {
      const value = simulateStat({
        random,
        family: scenario.family,
        statKey,
        parentPotential: scenario.parentPotential[statKey],
        parentCurrent: scenario.parentCurrent[statKey],
        grade,
        stability: odds.stability,
        rarity: chance(random, odds.rareVariant) ? "Rare" : "Common",
        mutationBonus: mutationStat === statKey ? 1 : 0,
      });
      totals[statKey] += value;
      total += value;
    }

    totalStatValues.push(total);
    counters.gradeUpgrade += Number(upgraded);
    counters.gradeDowngrade += Number(downgraded);
    counters.ability += Number(inheritedAbility);
    counters.secondAbility += Number(secondAbility);
    counters.mutation += Number(mutation);
    counters.rareVariant += Number(chance(random, odds.rareVariant));
    counters.shiny += Number(chance(random, odds.shiny));
  }

  return {
    Scenario: scenario.name,
    Stability: `${odds.stability}/100`,
    "Avg Total": (totalStatValues.reduce((sum, value) => sum + value, 0) / runs).toFixed(2),
    "P95 Total": percentile(totalStatValues, 0.95),
    "Grade Up": `${((counters.gradeUpgrade / runs) * 100).toFixed(2)}%`,
    "Grade Down": `${((counters.gradeDowngrade / runs) * 100).toFixed(2)}%`,
    "Ability": `${((counters.ability / runs) * 100).toFixed(2)}%`,
    "Second Ability": `${((counters.secondAbility / runs) * 100).toFixed(2)}%`,
    "Mutation": `${((counters.mutation / runs) * 100).toFixed(2)}%`,
    "Rare Variant": `${((counters.rareVariant / runs) * 100).toFixed(2)}%`,
    "Shiny": `${((counters.shiny / runs) * 100).toFixed(2)}%`,
    "Avg Stats": STAT_KEYS.map(
      (key) => `${key} ${(totals[key] / runs).toFixed(1)}`,
    ).join(" · "),
  };
}

function simulateFiveGenerations(runs) {
  const random = mulberry32(774411);
  let parentGrade = "C";
  let parentPotential = 8;
  const rows = [];

  for (let generation = 2; generation <= 6; generation += 1) {
    const odds = getChances(82, 4, 2, 0);
    const totals = [];
    const grades = [];

    for (let run = 0; run < runs; run += 1) {
      const upgraded = chance(random, odds.gradeUpgrade);
      const downgraded = !upgraded && chance(random, odds.gradeDowngrade);
      const grade = upgraded
        ? shiftGrade(parentGrade, 1)
        : downgraded
          ? shiftGrade(parentGrade, -1)
          : parentGrade;
      grades.push(GRADE_ORDER.indexOf(grade));
      totals.push(
        simulateStat({
          random,
          family: "lapine",
          statKey: "FER",
          parentPotential,
          parentCurrent: parentPotential + 6,
          grade,
          stability: odds.stability,
          rarity: "Common",
          mutationBonus: chance(random, odds.mutation) ? 1 : 0,
        }),
      );
    }

    const average = totals.reduce((sum, value) => sum + value, 0) / runs;
    const gradeIndex = Math.round(
      grades.reduce((sum, value) => sum + value, 0) / runs,
    );
    rows.push({
      Generation: generation,
      "Mean FER": average.toFixed(2),
      "P95 FER": percentile(totals, 0.95),
      "Representative Grade": GRADE_ORDER[gradeIndex],
    });
    parentPotential = average;
    parentGrade = GRADE_ORDER[gradeIndex];
  }

  return rows;
}

const runs = getRuns();
const basePotential = { STR: 7, DEX: 9, STA: 7, CHA: 7, WIL: 7, FER: 9 };
const scenarios = [
  {
    name: "New pair / low affection",
    seed: 101,
    family: "lapine",
    affection: 40,
    streak: 0,
    tier: 0,
    shinyParents: 0,
    parentGrade: "C",
    parentPotential: basePotential,
    parentCurrent: { STR: 8, DEX: 11, STA: 8, CHA: 8, WIL: 8, FER: 11 },
  },
  {
    name: "Established pair",
    seed: 202,
    family: "lapine",
    affection: 75,
    streak: 4,
    tier: 2,
    shinyParents: 0,
    parentGrade: "B",
    parentPotential: basePotential,
    parentCurrent: { STR: 12, DEX: 17, STA: 13, CHA: 13, WIL: 13, FER: 17 },
  },
  {
    name: "Elite setup / one shiny parent",
    seed: 303,
    family: "lapine",
    affection: 95,
    streak: 7,
    tier: 4,
    shinyParents: 1,
    parentGrade: "A",
    parentPotential: { STR: 8, DEX: 11, STA: 8, CHA: 9, WIL: 8, FER: 11 },
    parentCurrent: { STR: 20, DEX: 28, STA: 22, CHA: 23, WIL: 22, FER: 29 },
  },
];

console.log(`\nCreature Chronicles genetics simulation (${runs.toLocaleString("en-US")} offspring per scenario)\n`);
console.table(scenarios.map((scenario) => simulateScenario(scenario, runs)));
console.log("\nFive-generation power-curve check (FER, established Lapine pairing)\n");
console.table(simulateFiveGenerations(runs));
console.log(
  "\nInterpretation: trained parent stats are deliberately damped to 10%, while grade headroom and level-1 ceilings keep repeated generations from producing runaway hatchling stats.\n",
);
