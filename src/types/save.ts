import type { BreedingState } from "./breeding";
import type { GuildState } from "./guild";
import type { MarketState } from "./market";
import type { CreatureId, EggId, HabitatId, PlayerId, PregnancyId, SaveId, SpeciesId, VariantId } from "./ids";
import type { CreatureAbility, CreatureRecord, CreatureStats, HabitatRecord } from "./creature";

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type PlayerProfile = {
  playerId: PlayerId;
  name: string;
  ranchName: string;
  breederRank: number;
  breederXp: number;
  breederXpToNext: number;
  ranchRank: number;
  stats: CreatureStats;
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

export type NurseryRecordStatus = "incubating" | "ready" | "hatched";
export type PregnancyStatus = "pregnant" | "delivered";

export type ParentSnapshot = {
  participantId: string;
  creatureId?: CreatureId;
  displayName: string;
  familyLabel: string;
  kind: "player" | "creature";
};

export type InheritancePreview = {
  projectedSpeciesId: SpeciesId;
  projectedVariantId: VariantId;
  projectedStats: CreatureStats;
  projectedAbilities: CreatureAbility[];
  statRollNotes: string[];
  abilityRollNotes: string[];
};

export type PregnancyRecord = {
  pregnancyId: PregnancyId;
  createdAtDayNumber: number;
  createdAt: string;
  daysRemaining: number;
  totalDays: number;
  status: PregnancyStatus;
  giver: ParentSnapshot;
  receiver: ParentSnapshot;
  inheritance: InheritancePreview;
};

export type EggRecord = {
  eggId: EggId;
  ownerSaveId: SaveId;
  createdAtDayNumber: number;
  createdAt: string;
  daysRemaining: number;
  totalDays: number;
  status: NurseryRecordStatus;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic";
  speciesId: SpeciesId;
  variantId: VariantId;
  habitatId: HabitatId;
  parents: {
    giver: ParentSnapshot;
    receiver: ParentSnapshot;
  };
  projectedStats: CreatureStats;
  projectedAbilities: CreatureAbility[];
  statRollNotes: string[];
  abilityRollNotes: string[];
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
  pregnancies?: PregnancyRecord[];
  eggs?: EggRecord[];
  market?: MarketState;
  guild?: GuildState;

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