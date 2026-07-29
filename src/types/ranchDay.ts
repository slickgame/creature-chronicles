export type RanchDayPhase = "morning" | "active" | "evening";

export type RanchDayActivityType =
  | "breeding"
  | "item-use"
  | "purchase"
  | "chore-assignment"
  | "training"
  | "contract"
  | "egg-hatch"
  | "care"
  | "upgrade"
  | "repair"
  | "event";

export type RanchDayActivity = {
  activityId: string;
  dayNumber: number;
  type: RanchDayActivityType;
  label: string;
  participantIds?: string[];
  goldChange?: number;
  feedChange?: number;
  materialChange?: number;
  energySpent?: number;
  createdAt: string;
};

export type RanchDayReward = {
  gold?: number;
  feed?: number;
  materials?: number;
  affection?: number;
  comfortBonus?: number;
};

export type DailyGoalRecord = {
  goalId: string;
  dayNumber: number;
  label: string;
  description: string;
  progressLabel: string;
  target: number;
  progress: number;
  complete: boolean;
  reward: RanchDayReward;
  rewardLabel: string;
  rewardClaimed: boolean;
  completedAt?: string;
};

export type DailyRanchEventChoice = {
  choiceId: string;
  label: string;
  description: string;
  requirementLabel?: string;
};

export type DailyRanchEventRecord = {
  eventId: string;
  dayNumber: number;
  eventType: "supplier" | "fence" | "nursery" | "messenger" | "forage" | "bonding";
  title: string;
  description: string;
  choices: DailyRanchEventChoice[];
  selectedChoiceId?: string;
  resultText?: string;
  resolvedAt?: string;
};

export type RanchResourceSnapshot = {
  gold: number;
  feed: number;
  materials: number;
  energy: number;
};

export type RanchResourceFlow = {
  starting: RanchResourceSnapshot;
  ending: RanchResourceSnapshot;
  goldChange: number;
  feedChange: number;
  materialChange: number;
  energyChange: number;
};

export type RanchMorningBrief = {
  generatedAt: string;
  previousDayNumber: number;
  currentDayNumber: number;
  dateLabel: string;
  highlights: string[];
  warnings: string[];
  nextSteps: string[];
  moodSummary: string[];
  resourceFlow: RanchResourceFlow;
};

export type RanchEveningPreview = {
  generatedAt: string;
  dayNumber: number;
  goalsCompleted: number;
  goalsTotal: number;
  activities: number;
  breedingAttempts: number;
  purchases: number;
  itemsUsed: number;
  choreChanges: number;
  goldChange: number;
  projectedFeedRequired: number;
  currentFeed: number;
  activePregnancies: number;
  incubatingEggs: number;
  readyEggs: number;
  ranchCondition: string;
  warnings: string[];
};

export type RanchDaySummary = {
  dayNumber: number;
  completedAt: string;
  dateLabel: string;
  goalsCompleted: number;
  goalsTotal: number;
  activities: RanchDayActivity[];
  highlights: string[];
  warnings: string[];
  resourceFlow: RanchResourceFlow;
};

export type RanchDayState = {
  dayNumber: number;
  phase: RanchDayPhase;
  startedAt: string;
  startingResources: RanchResourceSnapshot;
  activities: RanchDayActivity[];
  goals: DailyGoalRecord[];
  event?: DailyRanchEventRecord;
  morningBrief?: RanchMorningBrief;
  eveningPreview?: RanchEveningPreview;
  lastCompletedSummary?: RanchDaySummary;
};

export type CreatureMoodLabel =
  | "Thriving"
  | "Content"
  | "Restless"
  | "Tired"
  | "Hungry"
  | "Injured"
  | "Expecting"
  | "Overworked";

export type CreatureMoodSummary = {
  creatureId: string;
  creatureName: string;
  mood: CreatureMoodLabel;
  reason: string;
};
