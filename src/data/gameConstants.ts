export const GAME_TITLE = "Creature Chronicles";

export const MVP_VERSION = "0.0.1-m0";

export const FILE_SIZE_RULE = {
  preferredMaxLines: 1200,
  hardMaxLines: 2000,
  splitBeforeLines: 1500,
} as const;

export const STARTING_PLAYER_STATE = {
  gold: 1000,
  guildPoints: 0,
  energy: 1050,
  maxEnergy: 1050,
  dayNumber: 1,
  weekday: "Mon",
  month: 8,
  dayOfMonth: 1,
  weekNumber: 1,
} as const;