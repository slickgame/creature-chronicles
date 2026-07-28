export type BalanceSimulationMode = "attempts" | "timeline";
export type BalancePairStrategy = "repeat-pair" | "rotate-receivers" | "random-eligible";
export type BalanceSnackPolicy = "never" | "when-blocked" | "below-quarter" | "whenever-affordable";
export type BalanceTonicPolicy = "never" | "new-pairs" | "after-three-failures" | "every-attempt";
export type BalanceScenarioSource = "current" | "new-ranch" | "typical-ranch" | "established-ranch" | "optimized-ranch";

export type BalanceParticipantTemplate = {
  name: string;
  kind: "player" | "creature";
  maxEnergy: number;
  maxHearts: number;
  level: number;
  xp: number;
  xpToNext: number;
};

export type BreedingEconomyScenario = {
  id: string;
  name: string;
  description: string;
  source: BalanceScenarioSource;
  seed: number;
  mode: BalanceSimulationMode;
  runs: 100 | 1000 | 10000;
  timelineDays: number;
  pairStrategy: BalancePairStrategy;
  receiverCount: number;
  receiverCanBecomePregnant: boolean;
  playerInvolved: boolean;

  baseChance: number;
  chanceCap: number;
  affectionBonus: number;
  fertilityBonus: number;
  charmBonus: number;
  facilityChanceBonus: number;
  abilityChanceBonus: number;
  pairStreakBonusPerFailure: number;
  pairStreakBonusCap: number;
  initialStreak: number;

  energyCost: number;
  energyCostWithoutAbilities: number;
  heartCost: number;
  creatureXpGain: number;
  creatureXpGainWithoutAbilities: number;
  breederXpGain: number;
  breederXpGainWithoutAbilities: number;

  giver: BalanceParticipantTemplate;
  receiver: BalanceParticipantTemplate;
  pregnancyDays: number;
  eggDays: number;

  startingGold: number;
  goldIncomePerDay: number;
  fixedGoldSpendPerDay: number;
  snackPolicy: BalanceSnackPolicy;
  snackMaxPerDay: number;
  energySnackRestore: number;
  energySnackPrice: number;
  tonicPolicy: BalanceTonicPolicy;
  fertilityTonicBonus: number;
  fertilityTonicPrice: number;
};

export type BalanceReviewFlag = {
  severity: "info" | "review" | "warning";
  title: string;
  detail: string;
};

export type BalanceComparisonSummary = {
  noAbilitiesPregnancyRate: number;
  noStreakPregnancyRate: number;
  abilityPregnancyDelta: number;
  streakPregnancyDelta: number;
  abilityAdditionalPregnancies: number;
  streakAdditionalPregnancies: number;
};

export type BreedingEconomyResult = {
  scenarioName: string;
  mode: BalanceSimulationMode;
  runs: number;
  timelineDays: number;
  seed: number;
  generatedAt: string;

  attempts: number;
  eligibleAttempts: number;
  pregnancies: number;
  offspring: number;
  pregnancyRate: number;
  displayedAverageChance: number;
  averageAttemptsPerDay: number;
  medianAttemptsPerDay: number;
  attemptsPerPregnancy: number;
  averageEnergyCost: number;
  totalEnergySpent: number;
  energyPerPregnancy: number;
  energyPerOffspring: number;
  unusedEnergyRate: number;

  snacksUsed: number;
  snackEnergyRestored: number;
  snackEnergyWasted: number;
  snackEnabledAttempts: number;
  tonicsUsed: number;

  startingGold: number;
  goldEarned: number;
  goldSpent: number;
  netGold: number;
  daysUntilGoldDepletion: number | null;
  goldPerPregnancy: number;
  goldPerOffspring: number;

  creatureXp: number;
  breederXp: number;
  creatureLevelUps: number;
  breederRankUps: number;
  attemptsPerCreatureLevel: number;
  attemptsPerBreederRank: number;

  averageStreakAtConception: number;
  medianFailureStreak: number;
  longestFailureStreak: number;
  streakCapAttemptRate: number;
  daysToFirstConceptionMedian: number | null;
  daysToOffspringMedian: number | null;
  daysToOffspringP10: number | null;
  daysToOffspringP90: number | null;
  offspringPer30Days: number;

  daysSimulated: number;
  daysWithNoAttempt: number;
  energyLimitedDays: number;
  heartLimitedDays: number;
  pregnancyLockedDays: number;

  comparison: BalanceComparisonSummary;
  flags: BalanceReviewFlag[];
};

export type BalanceSimulationProgress = {
  completed: number;
  total: number;
  percentage: number;
  phase: "primary" | "comparison";
};
