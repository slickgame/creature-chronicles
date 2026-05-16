import type { BreedingState } from "./breeding";
import type { CreatureId, EggId, HabitatId, PlayerId, SaveId } from "./ids";
import type { CreatureRecord, HabitatRecord } from "./creature";

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type PlayerProfile = {
  playerId: PlayerId;
  name: string;
  ranchName: string;
  breederRank: number;
  ranchRank: number;
  hearts: number;
  maxHearts: number;
};

export type Currencies = {
  gold: number;
  guildPoints: number;
  energy: number;
  maxEnergy: number;
};

export type DayState = {
  dayNumber: number;
  weekday: Weekday;
  month: number;
  dayOfMonth: number;
  weekNumber: number;
};

export type SettingsState = {
  musicVolume: number;
  sfxVolume: number;
  textSpeed: "slow" | "normal" | "fast" | "instant";
  devMode: boolean;
};

export type GameSave = {
  version: string;
  saveId: SaveId;
  slotIndex: number;
  createdAt: string;
  updatedAt: string;

  player: PlayerProfile;
  currencies: Currencies;
  dayState: DayState;
  settings: SettingsState;

  creatureIds: CreatureId[];
  eggIds: EggId[];
  habitatIds: HabitatId[];

  creatures?: CreatureRecord[];
  habitats?: HabitatRecord[];
  breeding?: BreedingState;

  flags: Record<string, boolean | number | string>;
};

export type SaveSlotSummary = {
  saveId: SaveId;
  slotIndex: number;
  playerName: string;
  ranchName: string;
  dayNumber: number;
  dateLabel: string;
  gold: number;
  guildPoints: number;
  energy: number;
  maxEnergy: number;
  creatureCount: number;
  eggCount: number;
  updatedAt: string;
};