import type {
  BattleMoveId,
  BattleMoveInheritanceResult,
  BattleMoveLoadout,
} from "./battle";
import type { BreedingState } from "./breeding";
import type { CreatureCareerSaveState } from "./career";
import type {
  CreatureAbility,
  CreatureFamily,
  CreatureLineageRisk,
  CreatureRecord,
  CreatureSex,
  CreatureStats,
  HabitatRecord,
  StatGrades,
} from "./creature";
import type { CreatureMemorySaveState } from "@/data/creatureMemories";
import type { GuildState } from "./guild";
import type {
  BreedingAttemptId,
  CreatureId,
  EggId,
  HabitatId,
  PlayerId,
  PregnancyId,
  SaveId,
  SpeciesId,
  VariantId,
} from "./ids";
import type { ItemUseRecord } from "./items";
import type { MarketState } from "./market";
import type { RanchDayState } from "./ranchDay";
import type { RanchJobsState } from "./ranchJobs";
import type { RanchUpgradeState } from "./ranchUpgrades";
import type { TownNpcTrustState } from "./townNpc";
import type { TownUpgradeState } from "./upgrades";

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
  statGrades: StatGrades;
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

export type SaveReliabilityState = {
  lastValidatedAt?: string;
  lastValidationIssues?: string[];
  lastMigrationAt?: string;
  lastMigrationFromSchema?: number;
  lastBackupAt?: string;
  lastAutosaveAt?: string;
  lastAutosaveReason?: string;
  lastCommittedTransactionId?: string;
  recoveredInterruptedTransactions?: number;
  preventedDuplicateOutcomes?: number;
  repairedCollectionEntries?: number;
};

export type NurseryRecordStatus = "incubating" | "ready" | "hatched";
export type PregnancyStatus = "pregnant" | "delivered";

export type ParentSnapshot = {
  participantId: string;
  creatureId?: CreatureId;
  displayName: string;
  familyLabel: string;
  kind: "player" | "creature";
  speciesId?: SpeciesId;
  variantId?: VariantId;
  family?: CreatureFamily;
  rarity?: "Common" | "Uncommon" | "Rare" | "Epic";
  sex?: CreatureSex;
  shiny?: boolean;
  portraitPath?: string;
};

export type InheritancePreview = {
  projectedSpeciesId: SpeciesId;
  projectedVariantId: VariantId;
  projectedStats: CreatureStats;
  projectedStatGrades: StatGrades;
  projectedAbilities: CreatureAbility[];
  projectedShiny?: boolean;
  statRollNotes: string[];
  abilityRollNotes: string[];
  geneticsNotes?: string[];
  battleMoveInheritance?: BattleMoveInheritanceResult;
  lineageRisk: CreatureLineageRisk;
  lineageRiskLabel: string;
  lineageNotes: string[];
  lineageTraits: string[];
  suggestedName: string;
};

export type PregnancyRecord = {
  pregnancyId: PregnancyId;
  sourceAttemptId?: BreedingAttemptId;
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
  sourceAttemptId?: BreedingAttemptId;
  sourcePregnancyId?: PregnancyId;
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
  parents: { giver: ParentSnapshot; receiver: ParentSnapshot };
  projectedStats: CreatureStats;
  projectedStatGrades: StatGrades;
  projectedAbilities: CreatureAbility[];
  battleMoveInheritance?: BattleMoveInheritanceResult;
  shiny?: boolean;
  statRollNotes: string[];
  abilityRollNotes: string[];
  geneticsNotes?: string[];
  lineageRisk: CreatureLineageRisk;
  lineageRiskLabel: string;
  lineageNotes: string[];
  lineageTraits: string[];
  suggestedName: string;
};

export type BirthRecord = {
  birthId: string;
  eggId: EggId;
  sourceAttemptId?: BreedingAttemptId;
  sourcePregnancyId?: PregnancyId;
  creatureId: CreatureId;
  hatchedAtDayNumber: number;
  hatchedAt: string;
  nickname: string;
  rarity: EggRecord["rarity"];
  speciesId: SpeciesId;
  variantId: VariantId;
  shiny?: boolean;
  parents: { giver: ParentSnapshot; receiver: ParentSnapshot };
  inheritedStatGrades: StatGrades;
  inheritedAbilities: CreatureAbility[];
  inheritedMoveIds?: BattleMoveId[];
  combinationMoveIds?: BattleMoveId[];
  startingBattleMoveLoadout?: BattleMoveLoadout;
  lineageRisk: CreatureLineageRisk;
  lineageRiskLabel: string;
  lineageTraits: string[];
};

export type GameSave = {
  version: string;
  schemaVersion?: number;
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
  birthHistory?: BirthRecord[];
  itemUseHistory?: ItemUseRecord[];
  market?: MarketState;
  guild?: GuildState;
  townUpgrades?: TownUpgradeState;
  townNpcTrust?: TownNpcTrustState;
  ranchUpgrades?: RanchUpgradeState;
  ranchJobs?: RanchJobsState;
  ranchDay?: RanchDayState;
  creatureMemories?: CreatureMemorySaveState;
  creatureCareers?: CreatureCareerSaveState;
  saveReliability?: SaveReliabilityState;
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
