export const GAME_TITLE = "Creature Chronicles";

export const MVP_VERSION = "0.2.0-m2";

export const FILE_SIZE_RULE = {
  preferredMaxLines: 1200,
  hardMaxLines: 2000,
  splitBeforeLines: 1500,
} as const;

export const STARTING_PLAYER_STATE = {
  gold: 1200,
  guildPoints: 0,
  energy: 500,
  maxEnergy: 500,
  dayNumber: 1,
  weekday: "Mon",
  month: 1,
  dayOfMonth: 1,
  weekNumber: 1,
} as const;


/** Two nights of provisions for the five-creature starter ranch; new saves only. */
export const STARTING_RANCH_SUPPLIES = { feed: 14, materials: 4 } as const;
