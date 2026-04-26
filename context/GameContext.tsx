"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { ITEM_DATA, type ItemEffect } from "@/lib/items/itemData";
import { DEFAULT_KNOWN_RECIPE_IDS, RECIPE_DATA } from "@/lib/cooking/recipeData";
import {
  buildQualityIngredientPlan,
  getQualityAdjustedItemEffects,
  removeQualityIngredientUses,
} from "@/lib/game/cookingQuality";
import {
  type CropQuality,
  type FieldPlot,
  applyWateringToolToCost,
  advanceFieldPlotsByDay,
  createDefaultFieldPlots,
  createEmptyFieldPlot,
  createPlantedPlot,
  fertilizeFieldPlot,
  getFertilizerData,
  getFieldFertilizingCost,
  getFieldHarvestCost,
  getFieldPlantingCost,
  getFieldWateringCost,
  getHarvestOutcome,
  getPlotProduceItemId,
  normalizeFieldPlots,
  waterFieldPlot,
} from "@/lib/game/farming";
import {
  type FieldUpgradeId,
  type FieldUpgradeState,
  DEFAULT_FIELD_UPGRADES,
  FIELD_UPGRADE_DATA,
  canPurchaseFieldUpgrade,
  getFieldUpgradeEffects,
  normalizeFieldUpgrades,
  unlockFieldUpgrade,
} from "@/lib/game/fieldUpgrades";
import {
  buildFieldWorkSpecializationProfile,
  getFieldActionSpecializationNotes,
} from "@/lib/game/fieldSpecialization";
import {
  type ProduceQualityInventoryState,
  type QualitySellQuote,
  CROP_QUALITY_ORDER,
  addQualityProduceToInventory,
  getQualityProduceCount,
  getQualitySellQuote,
  normalizeProduceQualityInventory,
  removeQualityProduceFromInventory,
} from "@/lib/game/produceEconomy";
import {
  type GameSeason,
  type GameWeather,
  generateWeatherForDay,
  getSeasonForDay,
  normalizeWeather,
} from "@/lib/game/weather";
import {
  generateNpcFarmingRequests,
  type NpcFarmingRewardItem,
} from "@/lib/game/townNpcFarmingRequests";
import {
  ensureNpcContractLedger,
  isNpcContractExpired,
  type NpcContractOffer,
} from "@/lib/town/npcContractLedger";
import { buildNpcRelationshipStateFromPoints } from "@/lib/game/npcEconomy";
import {
  buildNpcExclusiveLoopSpecialEventUnlock,
  buildNpcOutingRelationshipEventUnlock,
  buildNpcRouteRelationshipEventUnlock,
  findEligibleNpcRelationshipEvent,
  normalizeNpcContractCompletionHistory,
  normalizeNpcRelationshipEventFlags,
  normalizeNpcRelationshipEventLog,
  recordNpcContractCompletion,
  type NpcContractCompletionHistory,
  type NpcRelationshipEventUnlock,
} from "@/lib/town/npcRelationshipEvents";
import {
  getGiftMiniChainActionKeys,
  getLedgerMiniChainActionKeys,
  getOutingMiniChainActionKeys,
  normalizeNpcMiniChainProgressMap,
  recordNpcMiniChainActions,
  type NpcMiniChainMilestone,
  type NpcMiniChainProgressMap,
} from "@/lib/town/npcMiniChains";
import {
  buildNpcGiftDialogue,
  buildNpcOutingCompletion,
  canGiveNpcGift,
  getNpcGiftDailyRecord,
  getNpcGiftPreference,
  getNpcGiftRelationshipGain,
  NPC_INVITATION_OPTIONS,
  normalizeNpcGiftRecords,
  normalizeNpcInvitationRecords,
  normalizeNpcOutingCompletionLog,
  normalizeNpcSocialActionResult,
  type NpcGiftRecordMap,
  type NpcInvitationRecordMap,
  type NpcOutingCompletionLog,
  type NpcSocialActionResult,
} from "@/lib/town/npcSocial";
import {
  ensureNpcExclusiveLoopState,
  isNpcExclusiveLoopOfferExpired,
  normalizeNpcExclusiveLoopState,
  recordNpcExclusiveLoopCompletion,
  type NpcExclusiveLoopState,
} from "@/lib/town/npcExclusiveLoops";
import {
  getNpcRoutePerkByInvitation,
  getNpcRoutePerkByMilestone,
  hasNpcRoutePerk,
  isTamsinComfortRecipe,
  ensureNpcRoutePerksForMiniChainProgress,
  getNpcLoverEvolutionByInvitation,
  getNpcLoverEvolutionsForNpc,
  normalizeNpcRoutePerkState,
  normalizeNpcLoverEvolutionState,
  unlockNpcLoverEvolution,
  unlockNpcRoutePerk,
  hasNpcLoverEvolution,
  type NpcLoverEvolutionState,
  type NpcRoutePerkState,
} from "@/lib/town/npcRoutePerks";


type CreatureStats = {
  strength: number;
  endurance: number;
  intelligence: number;
  speed: number;
  fertility: number;
  vitality: number;
};

type SkillProgress = {
  level: number;
  xp: number;
  xpToNextLevel: number;
};

type CreatureSkills = {
  cooking: SkillProgress;
  cleaning: SkillProgress;
  breedingCare: SkillProgress;
  fieldWork: SkillProgress;
  hauling: SkillProgress;
};

type InbreedingRisk =
  | "none"
  | "half_sibling"
  | "parent_child"
  | "full_sibling";

type InbredTrait = "none" | "weak" | "frail" | "dull" | "slow";
type InbredTraitSeverity = "none" | "mild" | "severe";

type CreatureTrait =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

type TraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

type CreatureTraitEntry = {
  trait: CreatureTrait;
  grade: TraitGrade;
};

type LegacyCreatureTrait =
  | "none"
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

type LocationName = "home" | "ranch" | "town" | "market" | "guild_hall";

type TravelLogEntry = {
  id: number;
  from: LocationName;
  to: LocationName;
  day: number;
  hour: number;
  minute: number;
  minutesSpent: number;
};

type HomeState = {
  cleanliness: number;
  foodStock: number;
  wheatStock: number;
};

type Creature = {
  id: number;
  name: string;
  nickname: string;
  theme: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  happiness: number;
  traits: CreatureTraitEntry[];
  stats: CreatureStats;
  skills: CreatureSkills;
  breedingStamina: number;
  maxBreedingStamina: number;
  breedingsToday: number;
  dailyBreedingLimit: number;
  giver: string | null;
  receiver: string | null;
  giverId: number | null;
  receiverId: number | null;
  giverIsPlayer: boolean;
  receiverIsPlayer: boolean;
  bornOnDay: number;
  generation: number;
  inbreedingRisk: InbreedingRisk;
  inbredTrait: InbredTrait;
  inbredTraitSeverity: InbredTraitSeverity;
  trait?: LegacyCreatureTrait;
};

type EggQuality = "poor" | "normal" | "strong" | "exceptional";

type Egg = {
  id: number;
  name: string;
  parents: string;
  hatchDaysRemaining: number;
  giver: string;
  receiver: string;
  giverId: number | null;
  receiverId: number | null;
  giverIsPlayer: boolean;
  receiverIsPlayer: boolean;
  inbreedingRisk: InbreedingRisk;
  quality: EggQuality;
};

type PlayerData = {
  name: string;
  gold: number;
  energy: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  happiness: number;
  stats: CreatureStats;
  breedingCare: SkillProgress;
};

type BreedingSelection = {
  giverType: "player" | "creature";
  giverCreatureId: number | null;
  receiverType: "player" | "creature";
  receiverCreatureId: number | null;
};

type TownStockEntry = {
  id: number;
  creature: Creature;
  price: number;
};

type QuestRequirement = {
  species: string;
  minimumLevel: number;
  minimumStats: Partial<CreatureStats>;
  requiredTrait?: CreatureTrait;
};

type TownQuest = {
  id: number;
  title: string;
  description: string;
  rewardGold: number;
  rewardXp: number;
  deadlineDay: number;
  deadlineHour: number;
  deadlineMinute: number;
  requirement: QuestRequirement;
  completed: boolean;
};

type TownQuestTemplate = {
  title: string;
  description: string;
  rewardGold: number;
  rewardXp: number;
  deadlineOffsetDays: number;
  deadlineHour: number;
  deadlineMinute: number;
  requirement: QuestRequirement;
};

type TownNpc = {
  id: string;
  name: string;
  role: string;
  personality: string;
  relationship: number;
  rewardMilestonesClaimed: number[];
};

type TownNpcQuest = {
  id: number;
  npcId: string;
  npcName: string;
  questType: "creature_delivery" | "farming_delivery";
  title: string;
  description: string;
  requestLine?: string;
  completionLine?: string;
  rewardGold: number;
  rewardXp: number;
  relationshipGain: number;
  rewardItems?: NpcFarmingRewardItem[];
  requestedCropId?: string;
  requestedItemId?: string;
  minimumQuality?: CropQuality;
  requiredQuantity?: number;
  seasonalFocus?: GameSeason | null;
  deadlineDay: number;
  deadlineHour: number;
  deadlineMinute: number;
  requirement: QuestRequirement;
  completed: boolean;
};

type InventoryState = Record<string, number>;

type FieldActionReport = {
  id: number;
  action: "plant" | "water" | "fertilize" | "harvest";
  plotId: number;
  day: number;
  message: string;
  details: string[];
};

type MainStoryChapterId =
  | "chapter_1"
  | "chapter_2"
  | "chapter_3"
  | "chapter_4"
  | "chapter_5"
  | "chapter_6"
  | "chapter_7";

type MainStoryObjectiveId =
  | "ranch_creature_care"
  | "first_town_visit"
  | "maris_seed_guidance"
  | "first_seed_planted"
  | "chapter2_ranch_preparation"
  | "chapter2_creature_fieldwork"
  | "chapter2_first_harvest"
  | "chapter2_crafted_or_crated"
  | "chapter2_town_delivery"
  | "chapter2_social_followup"
  | "chapter3_ranch_reputation_prep"
  | "chapter3_creature_proof"
  | "chapter3_produce_or_meal"
  | "chapter3_trusted_assignment"
  | "chapter3_route_signal"
  | "chapter3_reputation_registered"
  | "chapter4_creature_assessment"
  | "chapter4_breeding_preparation"
  | "chapter4_lineage_step"
  | "chapter4_creature_growth_work"
  | "chapter4_town_bloodline_proof"
  | "chapter4_lineage_registered"
  | "chapter5_regional_notice"
  | "chapter5_ranch_commission_prep"
  | "chapter5_creature_backed_proof"
  | "chapter5_significant_goods"
  | "chapter5_town_submission"
  | "chapter5_outside_acknowledgment"
  | "chapter5_future_route"
  | "chapter6_wider_invitation"
  | "chapter6_quest_log_review"
  | "chapter6_faction_signal"
  | "chapter6_route_goods"
  | "chapter6_creature_lineage_proof"
  | "chapter6_town_registration"
  | "chapter6_world_route_confirmed"
  | "chapter7_road_brief"
  | "chapter7_prepare_road_supplies"
  | "chapter7_ready_creature_helper"
  | "chapter7_travel_brindlewood"
  | "chapter7_scout_road"
  | "chapter7_complete_road_service"
  | "chapter7_return_road_report"
  | "chapter7_wayfarer_recognition";

type MainStoryReward = {
  title: string;
  description: string;
  gold: number;
  items: Array<{ itemId: string; quantity: number }>;
  factionReputation?: Array<{
    factionId: string;
    amount: number;
    standing?: FactionStanding;
  }>;
  unlockRegions?: string[];
  unlockText: string;
};

type MainStoryObjective = {
  id: MainStoryObjectiveId;
  title: string;
  description: string;
  locationHint: LocationName;
  completionFlag: MainStoryObjectiveId;
  rewardPreview?: string;
};

type MainStoryChapter = {
  id: MainStoryChapterId;
  chapterNumber: number;
  title: string;
  subtitle: string;
  summary: string;
  objectives: MainStoryObjective[];
  completionReward: MainStoryReward;
  nextChapterHint: string;
  nextChapterId?: MainStoryChapterId;
};

type MainStoryCompletedChapterLogEntry = {
  chapterId: MainStoryChapterId;
  title: string;
  completedDay: number;
  rewardTitle: string;
};

type MainStoryState = {
  currentChapterId: MainStoryChapterId;
  currentObjectiveId: MainStoryObjectiveId;
  chapterProgressFlags: Partial<Record<MainStoryObjectiveId, boolean>>;
  completedChapterLog: MainStoryCompletedChapterLogEntry[];
  latestReward: MainStoryReward | null;
};

type MainStoryChapterProgress = {
  completedSteps: number;
  totalSteps: number;
  percent: number;
  isComplete: boolean;
};

type WorldSupportStatus = "locked" | "available" | "active" | "completed";

type AuthoredQuestCategory =
  | "main_story"
  | "side_quest"
  | "faction_quest"
  | "regional_assignment";

type AuthoredQuestSource =
  | { type: "npc"; npcId: string; name: string }
  | { type: "faction"; factionId: string; name: string };

type AuthoredQuestGate = {
  chapterId?: MainStoryChapterId;
  requiredCompletedChapterId?: MainStoryChapterId;
  note: string;
};

type AuthoredQuestObjective = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
};

type AuthoredQuestReward = {
  gold: number;
  items: Array<{ itemId: string; quantity: number }>;
  factionReputation: Array<{
    factionId: string;
    amount: number;
    standing?: FactionStanding;
  }>;
  unlockRegions: string[];
  summary: string;
};

type AuthoredQuest = {
  id: string;
  title: string;
  description: string;
  category: AuthoredQuestCategory;
  source: AuthoredQuestSource;
  objectives: AuthoredQuestObjective[];
  rewardSummary: string;
  reward: AuthoredQuestReward;
  status: WorldSupportStatus;
  gate?: AuthoredQuestGate;
};

type FactionStanding = "unknown" | "neutral" | "warm" | "trusted" | "allied" | "strained";

type WorldFaction = {
  id: string;
  name: string;
  description: string;
  reputation: number;
  standing: FactionStanding;
  unlockCondition: string;
  relationshipToPlayer: string;
  perkHooks: string[];
  rewardHooks: string[];
  status: WorldSupportStatus;
};

type WorldRegion = {
  id: string;
  name: string;
  description: string;
  gameplayRole: string;
  primaryFactionId?: string;
  regionSpecialty: string;
  uniqueMechanicSummary: string;
  repeatableLoopSummary: string;
  preparationHint: string;
  uniqueRewardHooks: string[];
  riskOrCostSummary: string;
  futureUnlockHint: string;
  unlockCondition: string;
  access: {
    travelMinutes: number;
    route: string;
    requirement: string;
  };
  questHooks: string[];
  factionHooks: string[];
  status: WorldSupportStatus;
};

type RegionTravelLogEntry = {
  id: number;
  regionId: string;
  regionName: string;
  actionId?: string;
  actionTitle: string;
  day: number;
  hour: number;
  minute: number;
  minutesSpent: number;
  summary: string;
};

type RegionTravelResult = {
  success: boolean;
  title: string;
  message: string;
  regionId?: string;
  actionId?: string;
  rewardSummary?: string;
  day: number;
  hour: number;
  minute: number;
};

type WorldRegionAction = {
  id: string;
  regionId: string;
  title: string;
  description: string;
  timeCostMinutes: number;
  outcome: string;
  rewardGold?: number;
  rewardItems?: Array<{ itemId: string; quantity: number }>;
  factionReputation?: Array<{
    factionId: string;
    amount: number;
    standing?: FactionStanding;
  }>;
  factionChainStepIds?: string[];
  regionTaskStepIds?: string[];
  authoredQuestObjectives?: Array<{ questId: string; objectiveId: string }>;
  storyFlags?: MainStoryObjectiveId[];
};

type AuthoredQuestProgressAction = {
  id: string;
  questId: string;
  objectiveId: string;
  title: string;
  description: string;
  where: string;
  timeCostMinutes: number;
  outcome: string;
  storyFlags?: MainStoryObjectiveId[];
};

type ChainStatus = "locked" | "available" | "active" | "completed";

type FactionQuestChainStep = {
  id: string;
  title: string;
  requirement: string;
  reputationReward: number;
  nextHint: string;
};

type FactionQuestChain = {
  factionId: string;
  chainId: string;
  title: string;
  description: string;
  currentStepId: string;
  completedStepIds: string[];
  status: ChainStatus;
  requirements: string[];
  rewardSummary: string;
  factionReputationReward: number;
  nextHint: string;
  steps: FactionQuestChainStep[];
};

type RegionTaskChainStep = {
  id: string;
  title: string;
  requirement: string;
  actionId?: string;
  nextHint: string;
};

type RegionTaskChain = {
  regionId: string;
  chainId: string;
  title: string;
  description: string;
  currentStepId: string;
  completedStepIds: string[];
  status: ChainStatus;
  requirements: string[];
  rewardSummary: string;
  factionConsequence: string;
  regionUnlockConsequence?: string;
  factionId?: string;
  nextHint: string;
  steps: RegionTaskChainStep[];
};


type SaveData = {
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  currentWeather: GameWeather;
  currentLocation: LocationName;
  playerData: PlayerData;
  homeState: HomeState;
  creatures: Creature[];
  eggs: Egg[];
  breedingSelection: BreedingSelection;
  townStock: TownStockEntry[];
  townQuests: TownQuest[];
  townNpcs: TownNpc[];
  townNpcQuests: TownNpcQuest[];
  npcContractLedger: NpcContractOffer[];
  npcRelationshipEventFlags: string[];
  npcRelationshipEventLog: NpcRelationshipEventUnlock[];
  latestNpcRelationshipEvent: NpcRelationshipEventUnlock | null;
  npcContractCompletionHistory: NpcContractCompletionHistory;
  npcGiftRecords: NpcGiftRecordMap;
  npcInvitationRecords: NpcInvitationRecordMap;
  npcOutingCompletionLog: NpcOutingCompletionLog;
  npcMiniChainProgress: NpcMiniChainProgressMap;
  npcRoutePerks: NpcRoutePerkState;
  npcLoverEvolutions: NpcLoverEvolutionState;
  npcExclusiveLoops: NpcExclusiveLoopState;
  latestNpcSocialResult: NpcSocialActionResult | null;
  paidTaxMonths: number[];
  travelLog: TravelLogEntry[];
  inventory: InventoryState;
  produceQualityInventory: ProduceQualityInventoryState;
  knownRecipeIds: string[];
  fieldUpgrades: FieldUpgradeState;
  fieldPlots: FieldPlot[];
  mainStory: MainStoryState;
  authoredQuests: AuthoredQuest[];
  factions: WorldFaction[];
  worldRegions: WorldRegion[];
  currentRegionId: string;
  visitedRegionIds: string[];
  regionTravelLog: RegionTravelLogEntry[];
  latestRegionTravelResult: RegionTravelResult | null;
  factionQuestChains: FactionQuestChain[];
  regionTaskChains: RegionTaskChain[];
};

type GameContextType = {
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  currentWeather: GameWeather;
  currentSeason: GameSeason;
  currentLocation: LocationName;
  playerData: PlayerData;
  homeState: HomeState;
  creatures: Creature[];
  eggs: Egg[];
  breedingSelection: BreedingSelection;
  townStock: TownStockEntry[];
  townQuests: TownQuest[];
  townNpcs: TownNpc[];
  townNpcQuests: TownNpcQuest[];
  npcContractLedger: NpcContractOffer[];
  npcRelationshipEventFlags: string[];
  npcRelationshipEventLog: NpcRelationshipEventUnlock[];
  latestNpcRelationshipEvent: NpcRelationshipEventUnlock | null;
  npcContractCompletionHistory: NpcContractCompletionHistory;
  npcGiftRecords: NpcGiftRecordMap;
  npcInvitationRecords: NpcInvitationRecordMap;
  npcOutingCompletionLog: NpcOutingCompletionLog;
  npcMiniChainProgress: NpcMiniChainProgressMap;
  npcRoutePerks: NpcRoutePerkState;
  npcLoverEvolutions: NpcLoverEvolutionState;
  npcExclusiveLoops: NpcExclusiveLoopState;
  latestNpcSocialResult: NpcSocialActionResult | null;
  paidTaxMonths: number[];
  travelLog: TravelLogEntry[];
  fieldPlots: FieldPlot[];
  fieldUpgrades: FieldUpgradeState;
  lastFieldAction: FieldActionReport | null;
  mainStory: MainStoryState;
  mainStoryChapters: MainStoryChapter[];
  currentMainStoryChapter: MainStoryChapter;
  currentMainStoryObjective: MainStoryObjective;
  mainStoryChapterProgress: MainStoryChapterProgress;
  authoredQuests: AuthoredQuest[];
  factions: WorldFaction[];
  worldRegions: WorldRegion[];
  currentRegionId: string;
  visitedRegionIds: string[];
  regionTravelLog: RegionTravelLogEntry[];
  latestRegionTravelResult: RegionTravelResult | null;
  worldRegionActions: WorldRegionAction[];
  authoredQuestProgressActions: AuthoredQuestProgressAction[];
  factionQuestChains: FactionQuestChain[];
  regionTaskChains: RegionTaskChain[];
  dismissMainStoryReward: () => void;
  acknowledgeStoryJournalSection: (section: "story" | "quests" | "factions" | "world") => void;
  travelToRegion: (regionId: string) => boolean;
  performRegionAction: (regionId: string, actionId: string) => boolean;
  performAuthoredQuestAction: (actionId: string) => boolean;
  nextDay: () => void;
  hatchEgg: (eggId: number) => Creature | null;
  breedCreatures: () => void;
  setBreedingSelection: (selection: BreedingSelection) => void;
  resetGame: () => void;
  renameCreature: (creatureId: number, newNickname: string) => void;
  renamePlayer: (newName: string) => void;
  purchaseTownCreature: (stockEntryId: number) => void;
  submitCreatureToQuest: (questId: number, creatureId: number) => void;
  submitCreatureToNpcQuest: (questId: number, creatureId: number) => void;
  submitNpcFarmingRequest: (questId: number) => boolean;
  completeNpcContractOffer: (offerId: string) => boolean;
  completeNpcExclusiveLoopOffer: (offerId: string) => boolean;
  giveNpcGift: (npcId: string, itemId: string) => boolean;
  inviteNpc: (npcId: string, invitationId: string) => boolean;
  payMonthlyTax: () => void;
  travelTo: (destination: LocationName) => void;
  cookMeal: (creatureId: number) => void;
  cleanHome: (creatureId: number) => void;
  workFields: (creatureId: number) => void;
  plantCrop: (plotId: number, seedItemId: string, creatureId: number) => boolean;
  waterPlot: (plotId: number, creatureId: number) => boolean;
  fertilizePlot: (plotId: number, fertilizerItemId: string, creatureId: number) => boolean;
  harvestPlot: (plotId: number, creatureId: number) => boolean;
  purchaseFieldUpgrade: (upgradeId: FieldUpgradeId) => boolean;
  careForCreature: (creatureId: number, careType: "feed" | "groom" | "recovery") => void;
  inventory: InventoryState;
  produceQualityInventory: ProduceQualityInventoryState;
  knownRecipeIds: string[];
  purchaseMarketItem: (itemId: string, price: number) => boolean;
  getItemCount: (itemId: string) => number;
  getQualityItemCount: (itemId: string, quality: CropQuality) => number;
  getQualitySellQuote: (itemId: string, quality: CropQuality, quantity: number, demandMultiplier: number) => QualitySellQuote | null;
  sellQualityProduce: (itemId: string, quality: CropQuality, quantity: number, demandMultiplier: number) => boolean;
  getQualityItemEffects: (itemId: string, quality: CropQuality) => ItemEffect | undefined;
  knowsRecipe: (recipeId: string) => boolean;
  cookRecipe: (recipeId: string, creatureId: number) => boolean;
  consumeInventoryItem: (
    itemId: string,
    target: { type: "player" } | { type: "creature"; creatureId: number }
  ) => boolean;


};

const GameContext = createContext<GameContextType | undefined>(undefined);

const MONTH_LENGTH = 28;
const TAX_WARNING_DAY = 24;

const MAIN_STORY_CHAPTERS: Record<MainStoryChapterId, MainStoryChapter> = {
  chapter_1: {
    id: "chapter_1",
    chapterNumber: 1,
    title: "First Furrow, First Favor",
    subtitle: "Let the ranch breathe, then let town notice.",
    summary:
      "Chapter 1 threads the first daily rhythm together: tend a creature, step into town, take Maris Thorn's teasing guidance, and start a crop with your partner's help.",
    objectives: [
      {
        id: "ranch_creature_care",
        title: "Warm Hands, Steady Chores",
        description:
          "Complete a ranch chore with one of your creatures: feed, groom, cook, clean, or start field work.",
        locationHint: "ranch",
        completionFlag: "ranch_creature_care",
      },
      {
        id: "first_town_visit",
        title: "Let Town Get a Look",
        description:
          "Travel to town so the locals can start putting a face to the new ranch name.",
        locationHint: "town",
        completionFlag: "first_town_visit",
      },
      {
        id: "maris_seed_guidance",
        title: "Maris's Counter Lesson",
        description:
          "Buy any seed from Maris Thorn. She is warm, smug, and very interested in what your hands can grow.",
        locationHint: "town",
        completionFlag: "maris_seed_guidance",
        rewardPreview: "A clear lead into your first authored planting beat.",
      },
      {
        id: "first_seed_planted",
        title: "Put Promise in the Soil",
        description:
          "Return to the ranch and plant any seed with a creature helping in the field.",
        locationHint: "ranch",
        completionFlag: "first_seed_planted",
        rewardPreview: "Chapter reward: 120 Gold, 2 Basic Fertilizer, and Chapter 2 lead.",
      },
    ],
    completionReward: {
      title: "Maris's Starter Favor",
      description:
        "Maris sends over a practical little bundle with a note that says she expects to see what you do with it.",
      gold: 120,
      items: [{ itemId: "basic_fertilizer", quantity: 2 }],
      unlockText: "Chapter 2 seed: harvest your first crop and turn it into a town favor.",
    },
    nextChapterHint:
      "Chapter 2 should follow the crop through harvest, delivery, and a more deliberate town relationship choice.",
    nextChapterId: "chapter_2",
  },
  chapter_2: {
    id: "chapter_2",
    chapterNumber: 2,
    title: "First Harvest, First Favor",
    subtitle: "Turn a planted promise into something town can taste.",
    summary:
      "Chapter 2 follows the ranch's first real job: steady your creature, work the rows, harvest something worth carrying, and let one of town's sharp-eyed regulars see what your hands can do.",
    objectives: [
      {
        id: "chapter2_ranch_preparation",
        title: "Make the Ranch Presentable",
        description:
          "Do a ranch-side preparation chore with a creature: feed, groom, cook, clean, or otherwise settle the place before the day gets busy.",
        locationHint: "ranch",
        completionFlag: "chapter2_ranch_preparation",
      },
      {
        id: "chapter2_creature_fieldwork",
        title: "Put a Creature Beside You",
        description:
          "Have a creature help in the fields by planting, watering, fertilizing, or harvesting. The town notices results, but the ranch is built in these quieter moments.",
        locationHint: "ranch",
        completionFlag: "chapter2_creature_fieldwork",
      },
      {
        id: "chapter2_first_harvest",
        title: "Bring In a Real Crop",
        description:
          "Harvest any grown crop. Maris teased you into planting it; now prove the soil listened.",
        locationHint: "ranch",
        completionFlag: "chapter2_first_harvest",
        rewardPreview: "Harvested goods can feed delivery requests, gifts, cooking, or Selene's exchange.",
      },
      {
        id: "chapter2_crafted_or_crated",
        title: "Make It Worth Carrying",
        description:
          "Craft a recipe at the ranch or prepare a harvested crate by selling, delivering, or gifting produce. The point is to turn raw work into a real offer.",
        locationHint: "ranch",
        completionFlag: "chapter2_crafted_or_crated",
      },
      {
        id: "chapter2_town_delivery",
        title: "First Real Favor",
        description:
          "Complete a town-facing exchange: fulfill an NPC request, complete a farm-economy contract, sell produce to Selene, or bring a useful gift to Maris, Tamsin, or Selene.",
        locationHint: "town",
        completionFlag: "chapter2_town_delivery",
      },
      {
        id: "chapter2_social_followup",
        title: "Let Them Remember You",
        description:
          "Make one warm social touch with a farm-economy NPC: give a gift, complete a contract, finish a delivery, or accept an outing if one is available.",
        locationHint: "town",
        completionFlag: "chapter2_social_followup",
        rewardPreview: "Chapter reward: 180 Gold, Wheat Seed x3, Milk x1, and the Chapter 3 lead.",
      },
    ],
    completionReward: {
      title: "First Favor Ledger",
      description:
        "Your name lands in town's quiet ledger of people who follow through. Maris is amused, Tamsin is warmer than strictly professional, and Selene finally has a reason to measure you twice.",
      gold: 180,
      items: [
        { itemId: "wheat_seed", quantity: 3 },
        { itemId: "milk", quantity: 1 },
      ],
      unlockText:
        "Chapter 3 lead: choose which town relationship becomes your first deliberate route pressure point.",
    },
    nextChapterHint:
      "Chapter 3 should branch the campaign spine toward Maris, Tamsin, or Selene with a stronger route choice and a named contract arc.",
    nextChapterId: "chapter_3",
  },
  chapter_3: {
    id: "chapter_3",
    chapterNumber: 3,
    title: "A Name Worth Asking For",
    subtitle: "Your ranch stops being new and starts being requested.",
    summary:
      "Chapter 3 is the first trusted-job arc: prepare the ranch like a professional, produce something with creature help, complete a serious town assignment, and let one farm-economy NPC become the face that remembers your work.",
    objectives: [
      {
        id: "chapter3_ranch_reputation_prep",
        title: "Set the Ranch to Working Order",
        description:
          "Do a ranch preparation chore with a creature before chasing reputation: feed, groom, cook, clean, or settle the home rhythm.",
        locationHint: "ranch",
        completionFlag: "chapter3_ranch_reputation_prep",
      },
      {
        id: "chapter3_creature_proof",
        title: "Let a Creature Carry the Proof",
        description:
          "Use creature help for field work, harvesting, or ranch cooking. A trusted name starts with work someone can point to.",
        locationHint: "ranch",
        completionFlag: "chapter3_creature_proof",
      },
      {
        id: "chapter3_produce_or_meal",
        title: "Prepare a Signature Offering",
        description:
          "Harvest produce or cook a recipe so the town sees more than effort; it sees something ready for a counter, ledger, or private table.",
        locationHint: "ranch",
        completionFlag: "chapter3_produce_or_meal",
        rewardPreview: "Trusted assignments accept produce, meals, and other useful crafted outcomes.",
      },
      {
        id: "chapter3_trusted_assignment",
        title: "Take the First Trusted Job",
        description:
          "Complete an NPC farming request, a farm-economy contract, or a higher-stakes exclusive loop. This is the first time town treats your ranch like a reliable name.",
        locationHint: "town",
        completionFlag: "chapter3_trusted_assignment",
      },
      {
        id: "chapter3_route_signal",
        title: "Let One Face Matter More",
        description:
          "Give a gift, complete a contract, finish a delivery, or take an outing with Maris, Tamsin, or Selene. The campaign is starting to notice who you orbit.",
        locationHint: "town",
        completionFlag: "chapter3_route_signal",
      },
      {
        id: "chapter3_reputation_registered",
        title: "Put Your Name in the Trusted Ledger",
        description:
          "Finish a meaningful town assignment so the ranch's reputation lands in writing instead of rumor.",
        locationHint: "town",
        completionFlag: "chapter3_reputation_registered",
        rewardPreview: "Chapter reward: 260 Gold, Rich Fertilizer x1, Carrot Seed x3, and the Chapter 4 lead.",
      },
    ],
    completionReward: {
      title: "Trusted Ranch Mark",
      description:
        "A town clerk writes your ranch name into the trusted ledger. Maris teases that she saw it coming, Tamsin looks quietly proud, and Selene starts using the word terms like it belongs near your name.",
      gold: 260,
      items: [
        { itemId: "rich_fertilizer", quantity: 1 },
        { itemId: "carrot_seed", quantity: 3 },
      ],
      unlockText:
        "Chapter 4 lead: choose the first route-weighted assignment and decide whose trust becomes campaign leverage.",
    },
    nextChapterHint:
      "Chapter 4 should introduce the first route-weighted story branch: Maris's grower pact, Tamsin's private kitchen commission, or Selene's premium buyer terms.",
    nextChapterId: "chapter_4",
  },
  chapter_4: {
    id: "chapter_4",
    chapterNumber: 4,
    title: "Bloodline on the Ledger",
    subtitle: "The ranch's future starts breathing beside you.",
    summary:
      "Chapter 4 turns the campaign toward creatures as the ranch's long-term heart: assess your companions, make a breeding or nursery move, grow a creature's role, and bring that proof back to town so your ranch is known for more than crops.",
    objectives: [
      {
        id: "chapter4_creature_assessment",
        title: "Read the Ranch's Beating Heart",
        description:
          "Spend focused care on a creature through feeding, grooming, recovery, cooking, cleaning, or another ranch-side support task. Before town respects your line, you need to know who is carrying it.",
        locationHint: "ranch",
        completionFlag: "chapter4_creature_assessment",
      },
      {
        id: "chapter4_breeding_preparation",
        title: "Prepare a Pairing or Nursery Plan",
        description:
          "Engage the breeding-adjacent loop: run a breeding session, recover a creature for future pairing, hatch an egg, or expand the ranch roster with a new creature.",
        locationHint: "ranch",
        completionFlag: "chapter4_breeding_preparation",
      },
      {
        id: "chapter4_lineage_step",
        title: "Mark a New Line",
        description:
          "Create or advance a lineage step by producing an egg, hatching an egg, or bringing a new creature into the ranch. The campaign wants the ranch's future to be visible.",
        locationHint: "ranch",
        completionFlag: "chapter4_lineage_step",
        rewardPreview: "Eggs, hatched creatures, and new roster additions all count as lineage progress.",
      },
      {
        id: "chapter4_creature_growth_work",
        title: "Give the Creature a Role",
        description:
          "Let a creature prove its place through field work, harvesting, cooking, care, or breeding-care growth. A bloodline matters because it can work, not because it sits pretty.",
        locationHint: "ranch",
        completionFlag: "chapter4_creature_growth_work",
      },
      {
        id: "chapter4_town_bloodline_proof",
        title: "Show Town What Your Creatures Can Become",
        description:
          "Tie creature progress back into town by completing a creature quest, NPC request, farm-economy contract, exclusive loop, produce sale, gift, or outing after the ranch has something real to show.",
        locationHint: "town",
        completionFlag: "chapter4_town_bloodline_proof",
      },
      {
        id: "chapter4_lineage_registered",
        title: "Register the Ranch's Living Future",
        description:
          "Finish a meaningful town-facing proof so your ranch is recognized for creatures, lineage, and long-term growth instead of only day-to-day favors.",
        locationHint: "town",
        completionFlag: "chapter4_lineage_registered",
        rewardPreview: "Chapter reward: 340 Gold, Rich Fertilizer x2, Apple Seed x2, and the Chapter 5 lead.",
      },
    ],
    completionReward: {
      title: "Bloodline Ledger Entry",
      description:
        "Your ranch earns its first creature-focused notation in town. Maris calls it promising, Tamsin calls it tender, and Selene calls it an asset while looking far too pleased with herself.",
      gold: 340,
      items: [
        { itemId: "rich_fertilizer", quantity: 2 },
        { itemId: "apple_seed", quantity: 2 },
      ],
      unlockText:
        "Chapter 5 lead: prepare for a regional commission where creature lineage, produce quality, and town allegiance all matter at once.",
    },
    nextChapterHint:
      "Chapter 5 should open the first broader regional commission, asking the player to combine a stronger creature role, a polished ranch product, and one chosen town ally.",
    nextChapterId: "chapter_5",
  },
  chapter_5: {
    id: "chapter_5",
    chapterNumber: 5,
    title: "The Regional Commission",
    subtitle: "Town is no longer the edge of who is watching.",
    summary:
      "Chapter 5 brings the first outside pressure to the campaign: a regional commission notices the ranch's output, creature line, and town reputation, then asks for proof that can travel farther than gossip.",
    objectives: [
      {
        id: "chapter5_regional_notice",
        title: "Answer the Notice Beyond Town",
        description:
          "Let the wider network tug at your sleeve: travel to the Guild Hall or Market, complete a town-facing job, or make a serious town contact so the commission has a place to land.",
        locationHint: "guild_hall",
        completionFlag: "chapter5_regional_notice",
      },
      {
        id: "chapter5_ranch_commission_prep",
        title: "Prepare the Ranch for Inspection",
        description:
          "Do real ranch preparation: care for creatures, cook, clean, plant, water, fertilize, or otherwise make the ranch look like it can handle more than local favors.",
        locationHint: "ranch",
        completionFlag: "chapter5_ranch_commission_prep",
      },
      {
        id: "chapter5_creature_backed_proof",
        title: "Put Creature Strength Behind It",
        description:
          "Use creature progress as proof: breed, hatch, recover, care, train through field work, cook with a creature, or add a new creature to the ranch line.",
        locationHint: "ranch",
        completionFlag: "chapter5_creature_backed_proof",
        rewardPreview: "Regional commissions care about reliable creatures as much as polished goods.",
      },
      {
        id: "chapter5_significant_goods",
        title: "Make Something Worth Sending",
        description:
          "Prepare a meaningful good through harvest, cooking, quality produce, or a crate-ready exchange. This is the first commission meant to represent the ranch outside its usual circle.",
        locationHint: "ranch",
        completionFlag: "chapter5_significant_goods",
      },
      {
        id: "chapter5_town_submission",
        title: "Submit the Commission Through Town",
        description:
          "Use an existing town loop as the formal submission: complete an NPC request, farm-economy contract, exclusive loop, creature quest, produce sale, or substantial gift.",
        locationHint: "town",
        completionFlag: "chapter5_town_submission",
      },
      {
        id: "chapter5_outside_acknowledgment",
        title: "Hear the Wider World Answer",
        description:
          "Follow up through a route signal, outing, contract, Guild Hall visit, Market visit, or another town-facing action that makes it clear your work is now moving through a larger network.",
        locationHint: "guild_hall",
        completionFlag: "chapter5_outside_acknowledgment",
      },
      {
        id: "chapter5_future_route",
        title: "Choose What the Commission Implies",
        description:
          "Finish one more meaningful proof or social touch so Chapter 6 can pull on a bigger thread: factions, regional travel, or a chosen ally's private terms.",
        locationHint: "town",
        completionFlag: "chapter5_future_route",
        rewardPreview: "Chapter reward: 500 Gold, Rich Fertilizer x2, Berry Seed x2, and the Chapter 6 lead.",
      },
    ],
    completionReward: {
      title: "Regional Commission Seal",
      description:
        "A stamped notice arrives with your ranch name written cleanly enough to make the room feel larger. Maris grins like she wants first claim on your success, Tamsin fusses over what you will need for the road, and Selene simply says she expected this.",
      gold: 500,
      items: [
        { itemId: "rich_fertilizer", quantity: 2 },
        { itemId: "berry_seed", quantity: 2 },
      ],
      unlockText:
        "Chapter 6 lead: decide whether the first regional thread opens through guild pressure, market politics, or a chosen farm-economy ally.",
    },
    nextChapterHint:
      "Chapter 6 should introduce the first true world-facing branch: guild inspection, market faction pressure, or an ally-led regional errand.",
    nextChapterId: "chapter_6",
  },
  chapter_6: {
    id: "chapter_6",
    chapterNumber: 6,
    title: "The First Route Out",
    subtitle: "The ranch chooses how it will be known beyond the home loop.",
    summary:
      "Chapter 6 opens the map without closing the player in. The Wayfarer Dispatch, Velvet Market Ring, and Guild Hall Circle all begin reading your ranch differently, and your first route signal tells them what kind of attention you are willing to invite.",
    objectives: [
      {
        id: "chapter6_wider_invitation",
        title: "Read the Wider Invitation",
        description:
          "Open the Story Journal and acknowledge that the regional notice has become a real invitation. The first route out starts with understanding who is watching.",
        locationHint: "home",
        completionFlag: "chapter6_wider_invitation",
      },
      {
        id: "chapter6_quest_log_review",
        title: "Check the Quest Log for Faction Work",
        description:
          "Open the Quest Log and review the authored regional or faction assignments. The Road Ledger and Velvet Market Introduction both count as valid route work once they move.",
        locationHint: "home",
        completionFlag: "chapter6_quest_log_review",
        rewardPreview: "Quest Log review helps Chapter 6 recognize authored quest progress instead of using a separate story-only path.",
      },
      {
        id: "chapter6_faction_signal",
        title: "Send a First Alignment Signal",
        description:
          "Show a preference without swearing yourself to anyone: progress or complete a Wayfarer, Velvet Market, or Guild-facing action, or review Factions once reputation has begun to move.",
        locationHint: "town",
        completionFlag: "chapter6_faction_signal",
        rewardPreview: "This is a signal, not a permanent lock. Chapter 7 can still branch without trapping the player.",
      },
      {
        id: "chapter6_route_goods",
        title: "Prepare Goods Worth Carrying",
        description:
          "Use ranch production for the route: cook, clean, plant, water, fertilize, harvest, or prepare a recipe with creature help so the wider network sees practical proof.",
        locationHint: "ranch",
        completionFlag: "chapter6_route_goods",
      },
      {
        id: "chapter6_creature_lineage_proof",
        title: "Put Creature Support Behind the Route",
        description:
          "Prove the ranch's living strength through creature care, recovery, breeding, hatching, a new creature, or another creature-backed task that shows the route has muscle and tenderness both.",
        locationHint: "ranch",
        completionFlag: "chapter6_creature_lineage_proof",
      },
      {
        id: "chapter6_town_registration",
        title: "Register the Result Through Town",
        description:
          "Make the route public through a town-facing submission: complete a request, contract, produce sale, creature quest, market visit, guild visit, gift, outing, or exclusive loop.",
        locationHint: "town",
        completionFlag: "chapter6_town_registration",
      },
      {
        id: "chapter6_world_route_confirmed",
        title: "Confirm the First Route on the World Map",
        description:
          "Open the World Map and acknowledge the route state. Brindlewood Road, Silvergrain Exchange, and the local loop now matter as destinations rather than background labels.",
        locationHint: "guild_hall",
        completionFlag: "chapter6_world_route_confirmed",
        rewardPreview: "Chapter reward: 650 Gold, Rich Fertilizer x3, Apple Seed x2, Berry Seed x2, reputation across the first organizations, and Silvergrain Exchange access.",
      },
    ],
    completionReward: {
      title: "First Route Charter",
      description:
        "Your ranch receives its first route charter, not as a cage but as a calling card. The Dispatch marks you reliable, the Guild starts using warmer ink, and Selene smiles like the market just learned your scent.",
      gold: 650,
      items: [
        { itemId: "rich_fertilizer", quantity: 3 },
        { itemId: "apple_seed", quantity: 2 },
        { itemId: "berry_seed", quantity: 2 },
      ],
      factionReputation: [
        { factionId: "wayfarer_dispatch", amount: 10, standing: "warm" },
        { factionId: "velvet_market_ring", amount: 10, standing: "warm" },
        { factionId: "guild_hall_circle", amount: 15, standing: "warm" },
      ],
      unlockRegions: ["brindlewood_road", "silvergrain_exchange"],
      unlockText:
        "Chapter 7 lead: choose whether the next route deepens toward road dispatch, market pressure, guild inspection, or a personal ally's private terms.",
    },
    nextChapterHint:
      "Chapter 7 follows the Wayfarer Dispatch onto Brindlewood Road for the ranch's first real outside assignment.",
    nextChapterId: "chapter_7",
  },
  chapter_7: {
    id: "chapter_7",
    chapterNumber: 7,
    title: "Road Work",
    subtitle: "The ranch proves itself on Brindlewood Road.",
    summary:
      "Chapter 7 turns the first route signal into a real assignment. The player personally answers the Wayfarer Dispatch, prepares supplies and a creature-backed proof, travels to Brindlewood Road, handles the first service work, and returns with a report that makes the ranch's outside reputation harder to ignore.",
    objectives: [
      {
        id: "chapter7_road_brief",
        title: "Road Brief",
        description:
          "Review or acknowledge the Wayfarer Dispatch assignment through the Story Journal, Quest Log, Factions, Town, or Regions. The road wants your attention before it wants your creatures.",
        locationHint: "home",
        completionFlag: "chapter7_road_brief",
        rewardPreview: "This starts Chapter 7's direct player-led road assignment without locking you permanently to the Wayfarers.",
      },
      {
        id: "chapter7_prepare_road_supplies",
        title: "Prepare Road Supplies",
        description:
          "Prepare something practical for the road: cook, harvest, plant, water, fertilize, or hold simple food or crop supplies such as wheat or bread.",
        locationHint: "ranch",
        completionFlag: "chapter7_prepare_road_supplies",
      },
      {
        id: "chapter7_ready_creature_helper",
        title: "Ready a Creature Helper",
        description:
          "Prove a creature is fit to support outside work through care, recovery, creature-assisted field work, breeding or lineage proof, or another creature-backed ranch task.",
        locationHint: "ranch",
        completionFlag: "chapter7_ready_creature_helper",
      },
      {
        id: "chapter7_travel_brindlewood",
        title: "Travel to Brindlewood Road",
        description:
          "Use in-world region travel to reach Brindlewood Road. Global navigation is free, but this route costs time and marks the assignment as real.",
        locationHint: "guild_hall",
        completionFlag: "chapter7_travel_brindlewood",
      },
      {
        id: "chapter7_scout_road",
        title: "Scout the Road",
        description:
          "Use Brindlewood Road's Scout the Road action to read the route, mark quiet trouble spots, and move the Road Ledger Route task chain.",
        locationHint: "guild_hall",
        completionFlag: "chapter7_scout_road",
      },
      {
        id: "chapter7_complete_road_service",
        title: "Complete Road Service",
        description:
          "Complete a practical Brindlewood service action such as Deliver Road Supplies or Courier Check. The Dispatch needs proof that your ranch can do more than arrive pretty.",
        locationHint: "guild_hall",
        completionFlag: "chapter7_complete_road_service",
      },
      {
        id: "chapter7_return_road_report",
        title: "Return Road Report",
        description:
          "Use the road report step on Brindlewood Road to bring back what the route whispered and close the first assignment loop.",
        locationHint: "guild_hall",
        completionFlag: "chapter7_return_road_report",
      },
      {
        id: "chapter7_wayfarer_recognition",
        title: "Wayfarer Recognition",
        description:
          "Confirm that Wayfarer Dispatch accepts the ranch's first outside assignment through road report completion, faction progress, or the Road Ledger Route chain.",
        locationHint: "guild_hall",
        completionFlag: "chapter7_wayfarer_recognition",
        rewardPreview: "Chapter reward: 420 Gold, Basic Fertilizer x2, Bread x2, Wayfarer reputation, and a lead toward creature road dispatch discussions.",
      },
    ],
    completionReward: {
      title: "Road Work Recognition",
      description:
        "The Wayfarer Dispatch accepts the report with a look that lingers just long enough to feel like trust. Your ranch is no longer a charming local rumor; it is a name the road can hand work to.",
      gold: 420,
      items: [
        { itemId: "basic_fertilizer", quantity: 2 },
        { itemId: "bread", quantity: 2 },
      ],
      factionReputation: [{ factionId: "wayfarer_dispatch", amount: 18, standing: "trusted" }],
      unlockRegions: [],
      unlockText:
        "Creature road dispatch assignments are now being discussed. Chapter 8 can choose between automated creature dispatch, a Silvergrain Exchange market route, or the first road incident system.",
    },
    nextChapterHint:
      "Chapter 8 should pause for the next road system: creature road dispatch, a sharper Brindlewood incident layer, or the Silvergrain Exchange trade route.",
  },
};

const defaultMainStoryState: MainStoryState = {
  currentChapterId: "chapter_1",
  currentObjectiveId: "ranch_creature_care",
  chapterProgressFlags: {},
  completedChapterLog: [],
  latestReward: null,
};

const defaultAuthoredQuests: AuthoredQuest[] = [
  {
    id: "wayfarer-road-ledger",
    title: "The Road Ledger",
    description:
      "The Wayfarers keep a soft-spoken ledger of ranches that can be trusted beyond town limits. Your name has a blank line waiting, which feels like an invitation and a dare.",
    category: "regional_assignment",
    source: { type: "faction", factionId: "wayfarer_dispatch", name: "Wayfarer Dispatch" },
    objectives: [
      {
        id: "road-ready-ranch-work",
        title: "Put a creature to road-ready work",
        description:
          "Complete a creature-backed ranch action: cook, clean, plant, water, fertilize, harvest, or field work. The Dispatch wants to know your help can keep pace.",
        completed: false,
      },
      {
        id: "town-route-proof",
        title: "Prove the town route can carry a favor",
        description:
          "Complete a town-facing delivery, contract, produce sale, social errand, or guild/market visit so the route has a real public mark on it.",
        completed: false,
      },
    ],
    rewardSummary: "150 Gold, Wayfarer Dispatch reputation, and Brindlewood Road access.",
    reward: {
      gold: 150,
      items: [{ itemId: "basic_fertilizer", quantity: 1 }],
      factionReputation: [{ factionId: "wayfarer_dispatch", amount: 25, standing: "warm" }],
      unlockRegions: ["brindlewood_road"],
      summary:
        "The Dispatch inks your ranch into the active road ledger, pays a modest route retainer, and opens Brindlewood Road for future work.",
    },
    status: "available",
  },
  {
    id: "market-ring-introduction",
    title: "Velvet Market Introduction",
    description:
      "Selene has not promised you anything, which is her favorite kind of promise. The Market Ring is watching for goods worth carrying under a private seal.",
    category: "faction_quest",
    source: { type: "faction", factionId: "velvet_market_ring", name: "Velvet Market Ring" },
    objectives: [
      {
        id: "prepare-private-stock",
        title: "Prepare private stock",
        description:
          "Harvest produce or cook a recipe with creature help. Selene prefers goods that arrive with warmth still clinging to them.",
        completed: false,
      },
      {
        id: "sell-under-market-eye",
        title: "Sell under the market's eye",
        description:
          "Sell produce through the exchange or complete a town delivery/contract so the Velvet Market Ring sees your ranch can move goods cleanly.",
        completed: false,
      },
    ],
    rewardSummary: "120 Gold, Velvet Market Ring reputation, and a Silvergrain Exchange lead.",
    reward: {
      gold: 120,
      items: [{ itemId: "berry_seed", quantity: 1 }],
      factionReputation: [{ factionId: "velvet_market_ring", amount: 20, standing: "warm" }],
      unlockRegions: [],
      summary:
        "Selene's circle marks you as warm stock rather than cold risk. The Silvergrain Exchange stays locked, but the door now knows your name.",
    },
    status: "available",
  },
  {
    id: "chapter-six-support-slot",
    title: "A Wider Invitation",
    description:
      "The first true world-facing invitation has arrived. The Guild Hall Circle keeps the formal seal, but the road and market both know your ranch is beginning to choose how it wants to be seen.",
    category: "main_story",
    source: { type: "faction", factionId: "guild_hall_circle", name: "Guild Hall Circle" },
    objectives: [
      {
        id: "choose-first-outer-thread",
        title: "Choose the first outer thread",
        description:
          "Use Chapter 6's Quest Log, Factions, and World Map steps to send a first route signal without permanently locking into one faction.",
        completed: false,
      },
    ],
    rewardSummary: "Chapter 6 route support, Guild Hall recognition, and wider regional attention.",
    reward: {
      gold: 100,
      items: [{ itemId: "basic_fertilizer", quantity: 1 }],
      factionReputation: [{ factionId: "guild_hall_circle", amount: 10, standing: "warm" }],
      unlockRegions: [],
      summary: "The Guild Hall Circle marks your wider invitation as active and leaves room for the road, market, or a personal ally to pull next.",
    },
    status: "locked",
    gate: {
      requiredCompletedChapterId: "chapter_5",
      note: "Requires Chapter 5 completion and supports Chapter 6 route preference.",
    },
  },
];

const defaultFactions: WorldFaction[] = [
  {
    id: "wayfarer_dispatch",
    name: "Wayfarer Dispatch",
    description:
      "A loose network of drivers, handlers, and road-wise messengers who know which ranches can be trusted when the map gets coy.",
    reputation: 0,
    standing: "neutral",
    unlockCondition: "Visible from the start; reputation rises when The Road Ledger is completed.",
    relationshipToPlayer:
      "Curious but practical. They like reliable hands, calm creatures, and partners who do not flinch when the road gets intimate with danger.",
    perkHooks: ["regional_travel_discount", "road_assignment_priority"],
    rewardHooks: ["travel permits", "dispatch reputation", "route-specific errands"],
    status: "available",
  },
  {
    id: "velvet_market_ring",
    name: "Velvet Market Ring",
    description:
      "Selene's wider circle of buyers, brokers, and beautifully dangerous ledgers. They value quality, discretion, and confidence with a little bite.",
    reputation: 0,
    standing: "neutral",
    unlockCondition: "Visible through town economy systems; reputation rises when Velvet Market Introduction is completed.",
    relationshipToPlayer:
      "Professionally interested. Personally, they are waiting to see whether your ranch can make them lean closer.",
    perkHooks: ["premium_sell_multiplier", "exclusive_market_contracts"],
    rewardHooks: ["buyer seals", "rare stock access", "market faction introductions"],
    status: "available",
  },
  {
    id: "guild_hall_circle",
    name: "Guild Hall Circle",
    description:
      "The formal face of inspections, commissions, and civic pressure. Friendly enough over a counter; much sharper once signatures are involved.",
    reputation: 0,
    standing: "neutral",
    unlockCondition: "Visible from town and guild travel; formal chapter use should wait for the next main story branch.",
    relationshipToPlayer:
      "Assessing. They see potential in the ranch and are deciding how much responsibility to place in your hands.",
    perkHooks: ["inspection_bonus", "commission_slot_unlock"],
    rewardHooks: ["guild seals", "official assignments", "civic reputation"],
    status: "available",
  },
];

const defaultWorldRegions: WorldRegion[] = [
  {
    id: "homefold_valley",
    name: "Homefold Valley",
    description:
      "The familiar ranch-town basin: warm fields, busy counters, and enough flirtatious local trouble to keep the days from behaving.",
    gameplayRole: "Home base",
    primaryFactionId: "guild_hall_circle",
    regionSpecialty: "Ranch and town management",
    uniqueMechanicSummary: "Keeps the core ranch, town, relationship, and journal loop legible before the world pulls wider.",
    repeatableLoopSummary: "Check home pressure, use a Ranch room, handle town work, then review the current story or journal.",
    preparationHint: "Keep food, cleanliness, creature mood, and town work steady before spending long hours outside.",
    uniqueRewardHooks: ["home rhythm support", "basic supplies", "story comfort"],
    riskOrCostSummary: "No travel cost, but local chores still spend action time through their canonical screens.",
    futureUnlockHint: "Future chapters can turn home stability into bonuses before outside assignments.",
    unlockCondition: "Unlocked from the start.",
    access: {
      travelMinutes: 0,
      route: "Ranch, town, market, and guild hall local loop",
      requirement: "None",
    },
    questHooks: ["wayfarer-road-ledger", "market-ring-introduction"],
    factionHooks: ["wayfarer_dispatch", "velvet_market_ring", "guild_hall_circle"],
    status: "available",
  },
  {
    id: "brindlewood_road",
    name: "Brindlewood Road",
    description:
      "A trade road beyond the immediate town loop, known for courier work, nervous inspections, and moonlit stops where people say too much.",
    gameplayRole: "First outside route",
    primaryFactionId: "wayfarer_dispatch",
    regionSpecialty: "Scouting, courier checks, and supply runs",
    uniqueMechanicSummary: "Turns ranch preparedness into road credibility through visible Wayfarer task-chain progress.",
    repeatableLoopSummary: "Prepare goods at the ranch, travel to the road, complete a Wayfarer action, and bring back a report.",
    preparationHint: "Bring wheat or basic supplies when possible, and keep enough time open for the long road.",
    uniqueRewardHooks: ["road supplies", "Wayfarer reputation", "travel discount hook", "courier pay"],
    riskOrCostSummary: "Long travel time and supply pressure; some actions pay less if you arrive empty-handed.",
    futureUnlockHint: "Strong enough to become Chapter 7's first real outside assignment route.",
    unlockCondition: "Complete The Road Ledger for the Wayfarer Dispatch.",
    access: {
      travelMinutes: 90,
      route: "Town gate to eastern trade road",
      requirement: "Locked until The Road Ledger proves the ranch and town route.",
    },
    questHooks: ["wayfarer-road-ledger", "chapter-six-support-slot"],
    factionHooks: ["wayfarer_dispatch", "guild_hall_circle"],
    status: "locked",
  },
  {
    id: "silvergrain_exchange",
    name: "Silvergrain Exchange",
    description:
      "A larger market district where premium crops, cooked goods, and private reputations can open doors the public boards never mention.",
    gameplayRole: "Premium trade destination",
    primaryFactionId: "velvet_market_ring",
    regionSpecialty: "Quality goods, price rumors, and buyer samples",
    uniqueMechanicSummary: "Converts quality production and market confidence into Velvet reputation and premium buyer hooks.",
    repeatableLoopSummary: "Prepare high-quality goods, travel with a sample, inspect demand, meet buyer contacts, and record price rumors.",
    preparationHint: "Bring produce, cooked goods, or a strong market sale history before chasing private buyers.",
    uniqueRewardHooks: ["premium sale info", "Velvet reputation", "rare seed hook", "recipe hook", "premium buyer hook"],
    riskOrCostSummary: "High travel time and quality expectations; weak samples still teach you the market but pay modestly.",
    futureUnlockHint: "Prepared for a later trade route, premium board, or Chapter 8 market branch.",
    unlockCondition: "Prepared for market faction expansion.",
    access: {
      travelMinutes: 120,
      route: "Market caravan route",
      requirement: "Future Velvet Market Ring introduction",
    },
    questHooks: ["market-ring-introduction", "chapter-six-support-slot"],
    factionHooks: ["velvet_market_ring"],
    status: "locked",
  },
];

const defaultWorldRegionActions: WorldRegionAction[] = [
  {
    id: "homefold-local-errands",
    regionId: "homefold_valley",
    title: "Run Local Errands",
    description:
      "Check the familiar ranch-town loop, settle small favors, and keep the home route warm under your boots.",
    timeCostMinutes: 30,
    outcome: "Earn a little gold and reaffirm Homefold Valley as the ranch's local base.",
    rewardGold: 12,
    rewardItems: [{ itemId: "wheat", quantity: 1 }],
    regionTaskStepIds: ["homefold-home-rhythm:town-facing-action"],
    storyFlags: ["chapter6_town_registration", "chapter6_world_route_confirmed", "chapter7_road_brief"],
  },
  {
    id: "homefold-map-table",
    regionId: "homefold_valley",
    title: "Review the Map Table",
    description:
      "Lay out the local route notes and decide which invitation deserves your next careful smile.",
    timeCostMinutes: 15,
    outcome: "Confirms the World Map route state for Chapter 6.",
    regionTaskStepIds: ["homefold-home-rhythm:review-story-journal"],
    storyFlags: ["chapter6_wider_invitation", "chapter6_world_route_confirmed", "chapter7_road_brief"],
  },
  {
    id: "homefold-home-check",
    regionId: "homefold_valley",
    title: "Check Home Status",
    description:
      "Walk the house, barn edge, and pantry with a soft little inventory of what needs attention before the world gets demanding.",
    timeCostMinutes: 10,
    outcome: "Homefold's rhythm steadies: the ranch knows what needs care before the next outside push.",
    rewardGold: 4,
    regionTaskStepIds: ["homefold-home-rhythm:check-home-status"],
    storyFlags: ["chapter6_wider_invitation", "chapter7_road_brief"],
  },
  {
    id: "homefold-ranch-room-pass",
    regionId: "homefold_valley",
    title: "Use a Ranch Room",
    description:
      "Count a focused pass through the House, Fields, Barn, Nursery, or Breeding room as Homefold preparation.",
    timeCostMinutes: 20,
    outcome: "The home loop tightens into practical readiness for outside assignments.",
    rewardItems: [{ itemId: "basic_fertilizer", quantity: 1 }],
    regionTaskStepIds: ["homefold-home-rhythm:use-ranch-room"],
    storyFlags: ["chapter6_route_goods", "chapter7_prepare_road_supplies", "chapter7_ready_creature_helper"],
  },
  {
    id: "brindlewood-scout-road",
    regionId: "brindlewood_road",
    title: "Scout the Road",
    description:
      "Walk the Brindlewood edge, note the wagon ruts, and learn where the road gets too quiet.",
    timeCostMinutes: 70,
    outcome: "Gain Wayfarer Dispatch reputation and road knowledge.",
    rewardGold: 18,
    factionReputation: [{ factionId: "wayfarer_dispatch", amount: 4 }],
    factionChainStepIds: ["wayfarer-road-ledger-route:road-scout"],
    regionTaskStepIds: ["brindlewood-road-chain:scout-road"],
    storyFlags: ["chapter6_faction_signal", "chapter6_world_route_confirmed", "chapter7_scout_road"],
  },
  {
    id: "brindlewood-deliver-supplies",
    regionId: "brindlewood_road",
    title: "Deliver Road Supplies",
    description:
      "Carry a compact bundle of feed, twine, and ledger seals to the next road marker before the route gets lonely.",
    timeCostMinutes: 50,
    outcome: "Supplies reach the route marker and the Dispatch notes your ranch as practical support.",
    rewardGold: 20,
    rewardItems: [{ itemId: "basic_fertilizer", quantity: 1 }],
    factionReputation: [{ factionId: "wayfarer_dispatch", amount: 4 }],
    factionChainStepIds: ["wayfarer-road-ledger-route:supply-run"],
    regionTaskStepIds: ["brindlewood-road-chain:deliver-supplies"],
    storyFlags: ["chapter6_faction_signal", "chapter6_town_registration", "chapter6_world_route_confirmed", "chapter7_prepare_road_supplies", "chapter7_complete_road_service"],
  },
  {
    id: "brindlewood-courier-check",
    regionId: "brindlewood_road",
    title: "Courier Check",
    description:
      "Take a small route note to the next marker and prove your ranch can answer when the road calls.",
    timeCostMinutes: 55,
    outcome: "Supports Wayfarer route work and counts as faction-facing travel proof.",
    rewardGold: 22,
    factionReputation: [{ factionId: "wayfarer_dispatch", amount: 5 }],
    factionChainStepIds: ["wayfarer-road-ledger-route:courier-check"],
    regionTaskStepIds: ["brindlewood-road-chain:courier-check"],
    authoredQuestObjectives: [{ questId: "chapter-six-support-slot", objectiveId: "choose-first-outer-thread" }],
    storyFlags: ["chapter6_faction_signal", "chapter6_town_registration", "chapter6_world_route_confirmed", "chapter7_complete_road_service"],
  },
  {
    id: "brindlewood-road-rumor",
    regionId: "brindlewood_road",
    title: "Gather Road Rumor",
    description:
      "Trade a patient look and a warm word for the kind of rumor that never fits on official paper.",
    timeCostMinutes: 35,
    outcome: "Small gold, road flavor, and a softer Wayfarer signal.",
    rewardGold: 10,
    rewardItems: [{ itemId: "basic_fertilizer", quantity: 1 }],
    factionReputation: [{ factionId: "wayfarer_dispatch", amount: 2 }],
    regionTaskStepIds: ["brindlewood-road-chain:return-report"],
    storyFlags: ["chapter6_faction_signal", "chapter6_world_route_confirmed", "chapter7_return_road_report", "chapter7_wayfarer_recognition"],
  },
  {
    id: "silvergrain-market-inspection",
    regionId: "silvergrain_exchange",
    title: "Market Inspection",
    description:
      "Walk the exchange floor, watch the buyer tables, and let Selene's wider circle notice you looking back.",
    timeCostMinutes: 75,
    outcome: "Gain Velvet Market Ring reputation and a little market money.",
    rewardGold: 26,
    factionReputation: [{ factionId: "velvet_market_ring", amount: 5 }],
    factionChainStepIds: ["velvet-private-goods-channel:inspect-demand"],
    regionTaskStepIds: ["silvergrain-exchange-chain:inspect-demand"],
    storyFlags: ["chapter6_faction_signal", "chapter6_world_route_confirmed"],
  },
  {
    id: "silvergrain-submit-premium-sample",
    regionId: "silvergrain_exchange",
    title: "Submit Premium Sample",
    description:
      "Place a careful sample where the right eyes can find it, and let the Market Ring decide whether it wants another taste.",
    timeCostMinutes: 45,
    outcome: "A premium sample earns Velvet attention, market money, and a sharper buyer lead.",
    rewardGold: 38,
    rewardItems: [{ itemId: "berry_seed", quantity: 1 }],
    factionReputation: [{ factionId: "velvet_market_ring", amount: 5 }],
    factionChainStepIds: ["velvet-private-goods-channel:premium-sample"],
    regionTaskStepIds: ["silvergrain-exchange-chain:prepare-premium-sample"],
    authoredQuestObjectives: [{ questId: "market-ring-introduction", objectiveId: "prepare-private-stock" }],
    storyFlags: ["chapter6_faction_signal", "chapter6_route_goods", "chapter6_world_route_confirmed"],
  },
  {
    id: "silvergrain-buyer-introduction",
    regionId: "silvergrain_exchange",
    title: "Meet Buyer Contact",
    description:
      "Accept a careful introduction to a private buyer whose smile has teeth and whose purse is heavier than polite.",
    timeCostMinutes: 60,
    outcome: "Supports Velvet Market work and marks a market-facing route preference.",
    rewardGold: 35,
    factionReputation: [{ factionId: "velvet_market_ring", amount: 6 }],
    factionChainStepIds: ["velvet-private-goods-channel:buyer-introduction"],
    regionTaskStepIds: ["silvergrain-exchange-chain:buyer-introduction"],
    authoredQuestObjectives: [{ questId: "market-ring-introduction", objectiveId: "sell-under-market-eye" }],
    storyFlags: ["chapter6_faction_signal", "chapter6_town_registration", "chapter6_world_route_confirmed"],
  },
  {
    id: "silvergrain-price-rumor",
    regionId: "silvergrain_exchange",
    title: "Record Price Rumor",
    description:
      "Listen where the ledgers close softly and learn which goods are about to make someone blushingly rich.",
    timeCostMinutes: 30,
    outcome: "Earn a small market tip and Velvet Market attention.",
    rewardGold: 16,
    rewardItems: [{ itemId: "carrot_seed", quantity: 1 }],
    factionReputation: [{ factionId: "velvet_market_ring", amount: 2 }],
    regionTaskStepIds: ["silvergrain-exchange-chain:record-price-rumor"],
    storyFlags: ["chapter6_faction_signal", "chapter6_world_route_confirmed"],
  },
];

const defaultAuthoredQuestProgressActions: AuthoredQuestProgressAction[] = [
  {
    id: "register-road-ready-work",
    questId: "wayfarer-road-ledger",
    objectiveId: "road-ready-ranch-work",
    title: "Register Road Work",
    description:
      "File your creature-backed ranch work with the Wayfarer Dispatch once the ranch has something credible to show.",
    where: "Quest Log or Brindlewood Road",
    timeCostMinutes: 20,
    outcome: "The Dispatch accepts your ranch work as road-ready proof.",
    storyFlags: ["chapter6_quest_log_review", "chapter6_faction_signal", "chapter7_road_brief", "chapter7_prepare_road_supplies"],
  },
  {
    id: "confirm-town-route-proof",
    questId: "wayfarer-road-ledger",
    objectiveId: "town-route-proof",
    title: "Confirm Route Proof",
    description:
      "Confirm that the town route can carry a favor, a delivery, or a public mark under your ranch name.",
    where: "Quest Log or Town Work",
    timeCostMinutes: 25,
    outcome: "The Wayfarer route ledger records your town-facing proof.",
    storyFlags: ["chapter6_town_registration", "chapter6_faction_signal", "chapter6_world_route_confirmed", "chapter7_road_brief"],
  },
  {
    id: "submit-private-stock",
    questId: "market-ring-introduction",
    objectiveId: "prepare-private-stock",
    title: "Submit Private Stock",
    description:
      "Present prepared goods or a credible production note to the Velvet Market Ring.",
    where: "Quest Log or Silvergrain Exchange",
    timeCostMinutes: 20,
    outcome: "The Market Ring accepts your ranch goods as private stock proof.",
    storyFlags: ["chapter6_quest_log_review", "chapter6_faction_signal"],
  },
  {
    id: "report-market-sale",
    questId: "market-ring-introduction",
    objectiveId: "sell-under-market-eye",
    title: "Report Market Sale",
    description:
      "Report a sale, delivery, or buyer-facing exchange so Selene's circle can mark the route as active.",
    where: "Quest Log or Silvergrain Exchange",
    timeCostMinutes: 25,
    outcome: "The Velvet Market Ring records your ranch as sale-ready stock.",
    storyFlags: ["chapter6_town_registration", "chapter6_faction_signal", "chapter6_world_route_confirmed"],
  },
  {
    id: "acknowledge-wider-invitation",
    questId: "chapter-six-support-slot",
    objectiveId: "choose-first-outer-thread",
    title: "Acknowledge Wider Invitation",
    description:
      "Report to the Guild Hall Circle that the ranch is ready to be read by road, market, and region together.",
    where: "Quest Log, Factions, or World Map",
    timeCostMinutes: 15,
    outcome: "The Guild Hall Circle marks the wider invitation as active.",
    storyFlags: ["chapter6_quest_log_review", "chapter6_faction_signal", "chapter6_world_route_confirmed"],
  },
];

const defaultFactionQuestChains: FactionQuestChain[] = [
  {
    factionId: "wayfarer_dispatch",
    chainId: "wayfarer-road-ledger-route",
    title: "Road Ledger Route",
    description:
      "The Dispatch tests whether your ranch can keep a road alive with calm creatures, practical supplies, and prompt reports.",
    currentStepId: "road-scout",
    completedStepIds: [],
    status: "available",
    requirements: ["Unlock Brindlewood Road", "Complete or progress The Road Ledger", "Work with Wayfarer Dispatch"],
    rewardSummary: "Wayfarer reputation, road assignment priority, and Chapter 7 road assignment readiness.",
    factionReputationReward: 20,
    nextHint: "Scout Brindlewood Road, then deliver supplies and complete a courier check.",
    steps: [
      {
        id: "road-scout",
        title: "Scout the road edge",
        requirement: "Perform Scout the Road on Brindlewood Road.",
        reputationReward: 4,
        nextHint: "Travel to Brindlewood Road and scout the route.",
      },
      {
        id: "supply-run",
        title: "Deliver road supplies",
        requirement: "Perform Deliver Road Supplies on Brindlewood Road.",
        reputationReward: 4,
        nextHint: "Carry the route bundle to the road marker.",
      },
      {
        id: "courier-check",
        title: "Complete courier check",
        requirement: "Perform Courier Check on Brindlewood Road.",
        reputationReward: 5,
        nextHint: "Run the courier check and bring back the marked proof.",
      },
    ],
  },
  {
    factionId: "velvet_market_ring",
    chainId: "velvet-private-goods-channel",
    title: "Private Goods Channel",
    description:
      "The Market Ring measures whether your ranch can prepare premium stock and keep its nerve around private buyers.",
    currentStepId: "inspect-demand",
    completedStepIds: [],
    status: "available",
    requirements: ["Progress Velvet Market Introduction", "Unlock or prepare Silvergrain Exchange"],
    rewardSummary: "Velvet Market reputation, buyer introductions, and future premium route hooks.",
    factionReputationReward: 18,
    nextHint: "Inspect market demand, submit a premium sample, then meet a buyer contact.",
    steps: [
      {
        id: "inspect-demand",
        title: "Inspect market demand",
        requirement: "Perform Market Inspection at Silvergrain Exchange.",
        reputationReward: 5,
        nextHint: "Use Silvergrain Exchange once it opens.",
      },
      {
        id: "premium-sample",
        title: "Submit premium sample",
        requirement: "Perform Submit Premium Sample at Silvergrain Exchange.",
        reputationReward: 5,
        nextHint: "Place a sample good enough to make the private tables notice.",
      },
      {
        id: "buyer-introduction",
        title: "Meet buyer contact",
        requirement: "Perform Meet Buyer Contact at Silvergrain Exchange.",
        reputationReward: 6,
        nextHint: "Let Selene's circle introduce a private buyer.",
      },
    ],
  },
  {
    factionId: "guild_hall_circle",
    chainId: "guild-official-registry-path",
    title: "Official Registry Path",
    description:
      "The Guild Hall Circle watches the first route charter and keeps the paperwork warm enough to become real pressure later.",
    currentStepId: "registry-acknowledgment",
    completedStepIds: [],
    status: "available",
    requirements: ["Complete Chapter 6 journal acknowledgement", "Confirm a World Map route"],
    rewardSummary: "Guild reputation, official route legitimacy, and future assignment hooks.",
    factionReputationReward: 12,
    nextHint: "Acknowledge A Wider Invitation and keep region reports moving.",
    steps: [
      {
        id: "registry-acknowledgment",
        title: "Acknowledge wider invitation",
        requirement: "Register A Wider Invitation through the Quest Log.",
        reputationReward: 10,
        nextHint: "Use the Quest Log action for A Wider Invitation.",
      },
    ],
  },
];

const defaultRegionTaskChains: RegionTaskChain[] = [
  {
    regionId: "homefold_valley",
    chainId: "homefold-home-rhythm",
    title: "Home Rhythm",
    description:
      "The familiar loop that keeps the ranch steady before outside regions start asking for more.",
    currentStepId: "check-home-status",
    completedStepIds: [],
    status: "available",
    requirements: ["Stay in Homefold Valley", "Use the canonical Ranch, Town, and Journal screens"],
    rewardSummary: "Small food, basic supply, and story-comfort rewards that support the daily loop.",
    factionConsequence: "Light Guild Hall oversight; no faction lock.",
    regionUnlockConsequence: "Keeps the home base ready for later travel preparation bonuses.",
    factionId: "guild_hall_circle",
    nextHint: "Start by checking home status, then use a Ranch room.",
    steps: [
      {
        id: "check-home-status",
        title: "Check Home Status",
        requirement: "Perform Check Home Status from Homefold Valley.",
        actionId: "homefold-home-check",
        nextHint: "Review cleanliness, stock, and creature count before outside work.",
      },
      {
        id: "use-ranch-room",
        title: "Use a Ranch Room",
        requirement: "Perform Use a Ranch Room from Homefold Valley or handle the canonical Ranch room directly.",
        actionId: "homefold-ranch-room-pass",
        nextHint: "House, Fields, Barn, Nursery, or Breeding all count as home preparation.",
      },
      {
        id: "town-facing-action",
        title: "Complete a Town-Facing Action",
        requirement: "Perform Run Local Errands from Homefold Valley or complete town-facing work.",
        actionId: "homefold-local-errands",
        nextHint: "Keep the town side of the home loop warm.",
      },
      {
        id: "review-story-journal",
        title: "Review Current Story or Journal",
        requirement: "Perform Review the Map Table from Homefold Valley or open the story journal.",
        actionId: "homefold-map-table",
        nextHint: "Check the current route pressure before leaving home.",
      },
    ],
  },
  {
    regionId: "brindlewood_road",
    chainId: "brindlewood-road-chain",
    title: "Road Ledger Route",
    description:
      "A practical road sequence for the first route beyond town: scout, supply, courier, report.",
    currentStepId: "scout-road",
    completedStepIds: [],
    status: "available",
    requirements: ["Open Brindlewood Road", "Travel to Brindlewood Road"],
    rewardSummary: "Wayfarer reputation, modest route pay, and Chapter 7 road readiness.",
    factionConsequence: "Raises Wayfarer Dispatch reputation and marks the ranch as a credible road partner.",
    regionUnlockConsequence: "Sets up travel-time discount and road assignment hooks for later chapters.",
    factionId: "wayfarer_dispatch",
    nextHint: "Start with Scout the Road on Brindlewood Road.",
    steps: [
      {
        id: "scout-road",
        title: "Scout the Road",
        requirement: "Perform Scout the Road.",
        actionId: "brindlewood-scout-road",
        nextHint: "Look over the road edge and mark the quiet trouble spots.",
      },
      {
        id: "deliver-supplies",
        title: "Deliver Road Supplies",
        requirement: "Perform Deliver Road Supplies.",
        actionId: "brindlewood-deliver-supplies",
        nextHint: "Take the route bundle to the next marker.",
      },
      {
        id: "courier-check",
        title: "Complete Courier Check",
        requirement: "Perform Courier Check.",
        actionId: "brindlewood-courier-check",
        nextHint: "Run the courier mark and prove the route can answer.",
      },
      {
        id: "return-report",
        title: "Return Road Report",
        requirement: "Perform Gather Road Rumor.",
        actionId: "brindlewood-road-rumor",
        nextHint: "Bring back what the road whispered.",
      },
    ],
  },
  {
    regionId: "silvergrain_exchange",
    chainId: "silvergrain-exchange-chain",
    title: "Silvergrain Market Thread",
    description:
      "A lighter market chain for future Velvet Market routes: demand, sample, buyer.",
    currentStepId: "inspect-demand",
    completedStepIds: [],
    status: "available",
    requirements: ["Open Silvergrain Exchange", "Progress Velvet Market Introduction"],
    rewardSummary: "Velvet Market reputation, gold, rare seed hooks, and future premium buyer pressure.",
    factionConsequence: "Raises Velvet Market Ring reputation and marks the ranch as private-buyer material.",
    regionUnlockConsequence: "Sets up premium buyer board, rare stock, and recipe hooks for future trade routes.",
    factionId: "velvet_market_ring",
    nextHint: "Inspect market demand once Silvergrain Exchange is available.",
    steps: [
      {
        id: "inspect-demand",
        title: "Inspect Market Demand",
        requirement: "Perform Market Inspection.",
        actionId: "silvergrain-market-inspection",
        nextHint: "Walk the exchange floor and learn what buyers want.",
      },
      {
        id: "prepare-premium-sample",
        title: "Prepare Premium Sample",
        requirement: "Perform Submit Premium Sample.",
        actionId: "silvergrain-submit-premium-sample",
        nextHint: "Present something polished enough to earn a private buyer's attention.",
      },
      {
        id: "buyer-introduction",
        title: "Make Buyer Introduction",
        requirement: "Perform Meet Buyer Contact.",
        actionId: "silvergrain-buyer-introduction",
        nextHint: "Meet the buyer once the sample thread is credible.",
      },
      {
        id: "record-price-rumor",
        title: "Record Price Rumor",
        requirement: "Perform Record Price Rumor.",
        actionId: "silvergrain-price-rumor",
        nextHint: "Write down the whisper that makes tomorrow's sale smarter.",
      },
    ],
  },
];

const horseFirstNames = ["Dusty","Clover","Rowan","Bramble","Flint","Maple","Sable","Thorn"];
const horseLastNames = ["Carter","Vale","Hoof","Hollow","Briar","Reed","Stone","Meadow"];
const catFirstNames = ["Velvet","Misty","Sable","Luna","Poppy","Ivy","Mochi","Pearl"];
const catLastNames = ["Whisk","Bell","Thorn","Silk","Mire","Moon","Bloom","Shade"];

const INBRED_TRAITS: InbredTrait[] = ["weak", "frail", "dull", "slow"];
const GENERAL_TRAITS: CreatureTrait[] = [
  "domestic","industrious","calm","fertile","quick","sturdy","affectionate","keen",
];
const HORSE_SPECIFIC_TRAITS: CreatureTrait[] = ["barnwise", "surefooted"];
const CAT_SPECIFIC_TRAITS: CreatureTrait[] = ["night_prawler", "graceful"];
const BREEDABLE_TRAITS: CreatureTrait[] = [...GENERAL_TRAITS, ...HORSE_SPECIFIC_TRAITS, ...CAT_SPECIFIC_TRAITS];
const TRAIT_GRADES: TraitGrade[] = ["F", "D", "C", "B", "A", "S"];

function randomFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getStrongerFactionStanding(current: FactionStanding, incoming: FactionStanding) {
  const standingRank: Record<FactionStanding, number> = {
    strained: 0,
    unknown: 1,
    neutral: 2,
    warm: 3,
    trusted: 4,
    allied: 5,
  };

  return standingRank[incoming] > standingRank[current] ? incoming : current;
}

function getWorldFactionName(factionId: string) {
  return defaultFactions.find((faction) => faction.id === factionId)?.name ??
    factionId
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
}

function getMainStoryChapter(chapterId: MainStoryChapterId) {
  return MAIN_STORY_CHAPTERS[chapterId] ?? MAIN_STORY_CHAPTERS.chapter_1;
}

function getMainStoryChapterList() {
  return Object.values(MAIN_STORY_CHAPTERS).sort((a, b) => a.chapterNumber - b.chapterNumber);
}

function getMainStoryProgress(state: MainStoryState): MainStoryChapterProgress {
  const chapter = getMainStoryChapter(state.currentChapterId);
  const completedSteps = chapter.objectives.filter(
    (objective) => state.chapterProgressFlags[objective.completionFlag]
  ).length;
  const totalSteps = chapter.objectives.length;

  return {
    completedSteps,
    totalSteps,
    percent: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
    isComplete: completedSteps >= totalSteps,
  };
}

function getCurrentMainStoryObjective(state: MainStoryState) {
  const chapter = getMainStoryChapter(state.currentChapterId);
  return (
    chapter.objectives.find((objective) => !state.chapterProgressFlags[objective.completionFlag]) ??
    chapter.objectives.find((objective) => objective.id === state.currentObjectiveId) ??
    chapter.objectives[chapter.objectives.length - 1]
  );
}

function normalizeMainStoryState(state?: Partial<MainStoryState> | null): MainStoryState {
  const savedChapterId: MainStoryChapterId =
    state?.currentChapterId && MAIN_STORY_CHAPTERS[state.currentChapterId]
      ? state.currentChapterId
      : defaultMainStoryState.currentChapterId;
  const flags = { ...(state?.chapterProgressFlags ?? {}) };
  const savedChapter = getMainStoryChapter(savedChapterId);
  const savedChapterComplete = savedChapter.objectives.every(
    (objective) => flags[objective.completionFlag]
  );
  const chapterId =
    savedChapterComplete && savedChapter.nextChapterId
      ? savedChapter.nextChapterId
      : savedChapterId;
  const chapter = getMainStoryChapter(chapterId);
  const currentObjective =
    chapter.objectives.find((objective) => objective.id === state?.currentObjectiveId) ??
    chapter.objectives.find((objective) => !flags[objective.completionFlag]) ??
    chapter.objectives[0];

  return {
    currentChapterId: chapterId,
    currentObjectiveId: currentObjective.id,
    chapterProgressFlags: flags,
    completedChapterLog: Array.isArray(state?.completedChapterLog) ? state.completedChapterLog : [],
    latestReward: state?.latestReward ?? null,
  };
}

function isWorldSupportStatus(status: unknown): status is WorldSupportStatus {
  return (
    status === "locked" ||
    status === "available" ||
    status === "active" ||
    status === "completed"
  );
}

function isFactionStanding(standing: unknown): standing is FactionStanding {
  return (
    standing === "unknown" ||
    standing === "neutral" ||
    standing === "warm" ||
    standing === "trusted" ||
    standing === "allied" ||
    standing === "strained"
  );
}

function isChapterCompletedForGate(mainStoryState: MainStoryState | undefined, chapterId: MainStoryChapterId) {
  if (!mainStoryState) return false;
  const chapter = getMainStoryChapter(chapterId);
  return (
    mainStoryState.completedChapterLog.some((entry) => entry.chapterId === chapterId) ||
    chapter.objectives.every((objective) => mainStoryState.chapterProgressFlags[objective.completionFlag])
  );
}

function normalizeAuthoredQuests(savedQuests?: AuthoredQuest[], mainStoryState?: MainStoryState): AuthoredQuest[] {
  const savedById = new Map(
    Array.isArray(savedQuests) ? savedQuests.map((quest) => [quest.id, quest]) : []
  );

  return defaultAuthoredQuests.map((quest) => {
    const saved = savedById.get(quest.id);
    const savedObjectives = new Map(
      Array.isArray(saved?.objectives)
        ? saved.objectives.map((objective) => [objective.id, objective])
        : []
    );

    const savedStatus = isWorldSupportStatus(saved?.status) ? saved.status : quest.status;
    const gateIsOpen = quest.gate?.requiredCompletedChapterId
      ? isChapterCompletedForGate(mainStoryState, quest.gate.requiredCompletedChapterId)
      : false;
    const normalizedStatus = quest.gate?.requiredCompletedChapterId && !gateIsOpen && savedStatus !== "completed"
      ? "locked"
      : savedStatus === "locked" && gateIsOpen ? "available" : savedStatus;

    return {
      ...quest,
      status: normalizedStatus,
      objectives: quest.objectives.map((objective) => ({
        ...objective,
        completed: Boolean(savedObjectives.get(objective.id)?.completed ?? objective.completed),
      })),
    };
  });
}

function normalizeFactions(savedFactions?: WorldFaction[]): WorldFaction[] {
  const savedById = new Map(
    Array.isArray(savedFactions) ? savedFactions.map((faction) => [faction.id, faction]) : []
  );

  return defaultFactions.map((faction) => {
    const saved = savedById.get(faction.id);

    return {
      ...faction,
      reputation: typeof saved?.reputation === "number" ? saved.reputation : faction.reputation,
      standing: isFactionStanding(saved?.standing) ? saved.standing : faction.standing,
      status: isWorldSupportStatus(saved?.status) ? saved.status : faction.status,
    };
  });
}

function normalizeWorldRegions(savedRegions?: WorldRegion[], mainStoryState?: MainStoryState): WorldRegion[] {
  const savedById = new Map(
    Array.isArray(savedRegions) ? savedRegions.map((region) => [region.id, region]) : []
  );
  const chapterSixComplete = isChapterCompletedForGate(mainStoryState, "chapter_6");

  return defaultWorldRegions.map((region) => {
    const saved = savedById.get(region.id);
    const shouldOpenForStory = chapterSixComplete && region.id === "brindlewood_road";

    return {
      ...region,
      status: shouldOpenForStory ? "available" : isWorldSupportStatus(saved?.status) ? saved.status : region.status,
      unlockCondition: shouldOpenForStory ? "Unlocked through the first route charter." : region.unlockCondition,
      access: shouldOpenForStory
        ? {
            ...region.access,
            requirement: "Available. The route is open for Chapter 7 road work.",
          }
        : region.access,
    };
  });
}

function normalizeCurrentRegionId(regionId: unknown, regions: WorldRegion[]) {
  if (typeof regionId === "string" && regions.some((region) => region.id === regionId && region.status !== "locked")) {
    return regionId;
  }

  return "homefold_valley";
}

function normalizeVisitedRegionIds(regionIds: unknown, currentRegionId: string) {
  const ids = Array.isArray(regionIds)
    ? regionIds.filter((regionId): regionId is string => typeof regionId === "string")
    : [];

  return Array.from(new Set(["homefold_valley", currentRegionId, ...ids]));
}

function normalizeRegionTravelLog(log: unknown): RegionTravelLogEntry[] {
  if (!Array.isArray(log)) return [];

  return log
    .filter((entry): entry is Partial<RegionTravelLogEntry> => Boolean(entry) && typeof entry === "object")
    .map((entry, index) => ({
      id: typeof entry.id === "number" ? entry.id : Date.now() + index,
      regionId: typeof entry.regionId === "string" ? entry.regionId : "homefold_valley",
      regionName: typeof entry.regionName === "string" ? entry.regionName : "Homefold Valley",
      actionId: typeof entry.actionId === "string" ? entry.actionId : undefined,
      actionTitle: typeof entry.actionTitle === "string" ? entry.actionTitle : "Region Travel",
      day: typeof entry.day === "number" ? entry.day : 1,
      hour: typeof entry.hour === "number" ? entry.hour : 8,
      minute: typeof entry.minute === "number" ? entry.minute : 0,
      minutesSpent: typeof entry.minutesSpent === "number" ? entry.minutesSpent : 0,
      summary: typeof entry.summary === "string" ? entry.summary : "Region travel recorded.",
    }))
    .slice(0, 30);
}

function normalizeRegionTravelResult(result: unknown): RegionTravelResult | null {
  if (!result || typeof result !== "object") return null;
  const entry = result as Partial<RegionTravelResult>;

  return {
    success: Boolean(entry.success),
    title: typeof entry.title === "string" ? entry.title : "Region Travel",
    message: typeof entry.message === "string" ? entry.message : "Region travel recorded.",
    regionId: typeof entry.regionId === "string" ? entry.regionId : undefined,
    actionId: typeof entry.actionId === "string" ? entry.actionId : undefined,
    rewardSummary: typeof entry.rewardSummary === "string" ? entry.rewardSummary : undefined,
    day: typeof entry.day === "number" ? entry.day : 1,
    hour: typeof entry.hour === "number" ? entry.hour : 8,
    minute: typeof entry.minute === "number" ? entry.minute : 0,
  };
}

function deriveChainStatus(completedCount: number, totalCount: number, baseStatus: ChainStatus) {
  if (baseStatus === "locked") return "locked";
  if (totalCount > 0 && completedCount >= totalCount) return "completed";
  if (completedCount > 0) return "active";
  return baseStatus === "completed" ? "completed" : "available";
}

function normalizeFactionQuestChains(savedChains?: FactionQuestChain[]): FactionQuestChain[] {
  const savedById = new Map(
    Array.isArray(savedChains) ? savedChains.map((chain) => [chain.chainId, chain]) : []
  );

  return defaultFactionQuestChains.map((chain) => {
    const saved = savedById.get(chain.chainId);
    const completedStepIds = Array.isArray(saved?.completedStepIds)
      ? saved.completedStepIds.filter((stepId) => chain.steps.some((step) => step.id === stepId))
      : chain.completedStepIds;
    const currentStep = chain.steps.find((step) => !completedStepIds.includes(step.id)) ?? chain.steps[chain.steps.length - 1];
    const savedStatus = saved?.status === "locked" || saved?.status === "active" || saved?.status === "completed" || saved?.status === "available"
      ? saved.status
      : chain.status;

    return {
      ...chain,
      completedStepIds,
      currentStepId: currentStep.id,
      status: deriveChainStatus(completedStepIds.length, chain.steps.length, savedStatus),
    };
  });
}

function normalizeRegionTaskChains(savedChains?: RegionTaskChain[]): RegionTaskChain[] {
  const savedById = new Map(
    Array.isArray(savedChains) ? savedChains.map((chain) => [chain.chainId, chain]) : []
  );

  return defaultRegionTaskChains.map((chain) => {
    const saved = savedById.get(chain.chainId);
    const completedStepIds = Array.isArray(saved?.completedStepIds)
      ? saved.completedStepIds.filter((stepId) => chain.steps.some((step) => step.id === stepId))
      : chain.completedStepIds;
    const currentStep = chain.steps.find((step) => !completedStepIds.includes(step.id)) ?? chain.steps[chain.steps.length - 1];
    const savedStatus = saved?.status === "locked" || saved?.status === "active" || saved?.status === "completed" || saved?.status === "available"
      ? saved.status
      : chain.status;

    return {
      ...chain,
      completedStepIds,
      currentStepId: currentStep.id,
      status: deriveChainStatus(completedStepIds.length, chain.steps.length, savedStatus),
    };
  });
}

function getMonthFromAbsoluteDay(day: number) {
  return Math.floor((day - 1) / MONTH_LENGTH) + 1;
}

function getDayOfMonthFromAbsoluteDay(day: number) {
  return ((day - 1) % MONTH_LENGTH) + 1;
}

function getMonthlyTaxAmount(playerData: PlayerData, creatures: Creature[], eggs: Egg[]) {
  return (
    60 +
    playerData.level * 20 +
    creatures.length * 15 +
    eggs.length * 8
  );
}

function getAllowedTraitsForSpecies(speciesName: string): CreatureTrait[] {
  if (speciesName === "Horse") return [...GENERAL_TRAITS, ...HORSE_SPECIFIC_TRAITS];
  if (speciesName === "Cat") return [...GENERAL_TRAITS, ...CAT_SPECIFIC_TRAITS];
  return [...GENERAL_TRAITS];
}

function isTraitAllowedForSpecies(speciesName: string, trait: CreatureTrait) {
  return getAllowedTraitsForSpecies(speciesName).includes(trait);
}

function getTraitGradePriceBonus(grade: TraitGrade) {
  if (grade === "F") return 6;
  if (grade === "D") return 12;
  if (grade === "C") return 20;
  if (grade === "B") return 35;
  if (grade === "A") return 55;
  return 85;
}

function getXpToNextLevel(level: number): number { return 50 + level * 25; }
function getPlayerXpToNextLevel(level: number): number { return 80 + level * 40; }
function getSkillXpToNextLevel(level: number): number { return 40 + level * 20; }

function createSkillProgress(): SkillProgress {
  return { level: 1, xp: 0, xpToNextLevel: getSkillXpToNextLevel(1) };
}

function createDefaultSkills(): CreatureSkills {
  return {
    cooking: createSkillProgress(),
    cleaning: createSkillProgress(),
    breedingCare: createSkillProgress(),
    fieldWork: createSkillProgress(),
    hauling: createSkillProgress(),
  };
}

function getMaxBreedingStaminaFromStats(stats: CreatureStats): number {
  return 40 + stats.endurance * 4 + stats.vitality * 3;
}

function getDailyBreedingLimitFromStats(stats: CreatureStats): number {
  return Math.max(1, 1 + Math.floor((stats.vitality + stats.fertility) / 8));
}

function generateNickname(speciesName: string): string {
  if (speciesName === "Horse") return `${randomFrom(horseFirstNames)} ${randomFrom(horseLastNames)}`;
  if (speciesName === "Cat") return `${randomFrom(catFirstNames)} ${randomFrom(catLastNames)}`;
  return `Creature ${Math.floor(Math.random() * 1000)}`;
}

function createSkillTraitEntry(trait: CreatureTrait, grade: TraitGrade): CreatureTraitEntry {
  return { trait, grade };
}

function getGradeRank(grade: TraitGrade): number {
  return TRAIT_GRADES.indexOf(grade);
}

function rankToGrade(rank: number): TraitGrade {
  return TRAIT_GRADES[clamp(rank, 0, TRAIT_GRADES.length - 1)];
}

function rollRandomTraitGrade(): TraitGrade {
  const roll = Math.random();
  if (roll < 0.2) return "F";
  if (roll < 0.4) return "D";
  if (roll < 0.65) return "C";
  if (roll < 0.82) return "B";
  if (roll < 0.94) return "A";
  return "S";
}

function maybeUpgradeGrade(grade: TraitGrade, chance: number): TraitGrade {
  if (Math.random() >= chance) return grade;
  return rankToGrade(getGradeRank(grade) + 1);
}

function maybeDowngradeGrade(grade: TraitGrade, chance: number): TraitGrade {
  if (Math.random() >= chance) return grade;
  return rankToGrade(getGradeRank(grade) - 1);
}

function getHighestTraitGrade(creature: Creature | null, trait: CreatureTrait): TraitGrade | null {
  if (!creature) return null;
  const matches = creature.traits.filter((entry) => entry.trait === trait);
  if (matches.length === 0) return null;
  return matches.reduce((best, current) =>
    getGradeRank(current.grade) > getGradeRank(best.grade) ? current : best
  ).grade;
}

function hasTrait(creature: Creature | null, trait: CreatureTrait): boolean {
  if (!creature) return false;
  return creature.traits.some((entry) => entry.trait === trait);
}

function getBestTraitEntry(creature: Creature | null, trait: CreatureTrait): CreatureTraitEntry | null {
  const grade = getHighestTraitGrade(creature, trait);
  return grade ? { trait, grade } : null;
}

function traitsToLegacyPrimaryTrait(traits: CreatureTraitEntry[]): LegacyCreatureTrait {
  if (traits.length === 0) return "none";
  const sorted = [...traits].sort((a, b) => getGradeRank(b.grade) - getGradeRank(a.grade));
  return sorted[0]?.trait ?? "none";
}

function normalizeTraitList(
  traits?: CreatureTraitEntry[],
  legacyTrait?: LegacyCreatureTrait,
  speciesName?: string
): CreatureTraitEntry[] {
  const list: CreatureTraitEntry[] = Array.isArray(traits) ? traits : [];
  const deduped = new Map<CreatureTrait, CreatureTraitEntry>();

  for (const entry of list) {
    if (!entry?.trait) continue;
    if (!BREEDABLE_TRAITS.includes(entry.trait)) continue;
    if (speciesName && !isTraitAllowedForSpecies(speciesName, entry.trait)) continue;
    const normalizedGrade: TraitGrade = TRAIT_GRADES.includes(entry.grade) ? entry.grade : "C";
    const existing = deduped.get(entry.trait);
    if (!existing || getGradeRank(normalizedGrade) > getGradeRank(existing.grade)) {
      deduped.set(entry.trait, { trait: entry.trait, grade: normalizedGrade });
    }
  }

  if (
    deduped.size === 0 &&
    legacyTrait &&
    legacyTrait !== "none" &&
    BREEDABLE_TRAITS.includes(legacyTrait) &&
    (!speciesName || isTraitAllowedForSpecies(speciesName, legacyTrait))
  ) {
    deduped.set(legacyTrait, { trait: legacyTrait, grade: "C" });
  }

  return Array.from(deduped.values()).sort((a, b) => getGradeRank(b.grade) - getGradeRank(a.grade));
}

function getTraitPowerMultiplier(grade: TraitGrade): number {
  if (grade === "F") return 0.35;
  if (grade === "D") return 0.5;
  if (grade === "C") return 0.7;
  if (grade === "B") return 0.9;
  if (grade === "A") return 1.15;
  return 1.4;
}

function getTraitFlatBonus(grade: TraitGrade, maxBonus: number): number {
  return Math.max(1, Math.round(maxBonus * getTraitPowerMultiplier(grade)));
}

function createCreatureBase(
  partial: Omit<
    Creature,
    | "level" | "xp" | "xpToNextLevel" | "skills"
    | "breedingStamina" | "maxBreedingStamina"
    | "breedingsToday" | "dailyBreedingLimit" | "trait"
  >
): Creature {
  const maxBreedingStamina = getMaxBreedingStaminaFromStats(partial.stats);
  const dailyBreedingLimit = getDailyBreedingLimitFromStats(partial.stats);

  return {
    ...partial,
    level: 1,
    xp: 0,
    xpToNextLevel: getXpToNextLevel(1),
    skills: createDefaultSkills(),
    breedingStamina: maxBreedingStamina,
    maxBreedingStamina,
    breedingsToday: 0,
    dailyBreedingLimit,
    trait: traitsToLegacyPrimaryTrait(partial.traits),
  };
}

const horseTemplate: Creature = createCreatureBase({
  id: 1,
  name: "Horse",
  nickname: "Starter Horse",
  theme: "Field Worker",
  happiness: 60,
  traits: [createSkillTraitEntry("industrious", "B"), createSkillTraitEntry("surefooted", "C")],
  stats: { strength: 8, endurance: 8, intelligence: 4, speed: 5, fertility: 6, vitality: 7 },
  giver: null, receiver: null, giverId: null, receiverId: null,
  giverIsPlayer: false, receiverIsPlayer: false, bornOnDay: 1, generation: 1,
  inbreedingRisk: "none", inbredTrait: "none", inbredTraitSeverity: "none",
});

const catTemplate: Creature = createCreatureBase({
  id: 2,
  name: "Cat",
  nickname: "Starter Cat",
  theme: "House Maid",
  happiness: 60,
  traits: [createSkillTraitEntry("domestic", "B"), createSkillTraitEntry("graceful", "C")],
  stats: { strength: 4, endurance: 5, intelligence: 8, speed: 8, fertility: 7, vitality: 5 },
  giver: null, receiver: null, giverId: null, receiverId: null,
  giverIsPlayer: false, receiverIsPlayer: false, bornOnDay: 1, generation: 1,
  inbreedingRisk: "none", inbredTrait: "none", inbredTraitSeverity: "none",
});

function getCreatureTemplateByName(name: string): Creature | null {
  if (name === "Horse") return horseTemplate;
  if (name === "Cat") return catTemplate;
  return null;
}

function rollStatVariation(): number {
  const options = [-1, 0, 1];
  return options[Math.floor(Math.random() * options.length)];
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function calculateInbreedingRisk(
  giverCreature: Creature | null,
  receiverCreature: Creature | null,
  giverIsPlayer: boolean,
  receiverIsPlayer: boolean
): InbreedingRisk {
  if (giverIsPlayer && receiverCreature && (receiverCreature.giverIsPlayer || receiverCreature.receiverIsPlayer)) {
    return "parent_child";
  }
  if (receiverIsPlayer && giverCreature && (giverCreature.giverIsPlayer || giverCreature.receiverIsPlayer)) {
    return "parent_child";
  }
  if (!giverCreature || !receiverCreature) return "none";

  const isParentChild =
    giverCreature.id === receiverCreature.giverId ||
    giverCreature.id === receiverCreature.receiverId ||
    receiverCreature.id === giverCreature.giverId ||
    receiverCreature.id === giverCreature.receiverId;

  if (isParentChild) return "parent_child";

  const sameGiverSide =
    (giverCreature.giverId !== null && giverCreature.giverId === receiverCreature.giverId) ||
    (giverCreature.giverIsPlayer && receiverCreature.giverIsPlayer);

  const sameReceiverSide =
    (giverCreature.receiverId !== null && giverCreature.receiverId === receiverCreature.receiverId) ||
    (giverCreature.receiverIsPlayer && receiverCreature.receiverIsPlayer);

  if (sameGiverSide && sameReceiverSide) return "full_sibling";
  if (sameGiverSide || sameReceiverSide) return "half_sibling";
  return "none";
}

function createInheritedStats(
  baseStats: CreatureStats,
  giverCreature: Creature | null,
  receiverCreature: Creature | null
): CreatureStats {
  const parentStats = [giverCreature?.stats, receiverCreature?.stats].filter(Boolean) as CreatureStats[];

  if (parentStats.length === 0) {
    return {
      strength: Math.max(1, baseStats.strength + rollStatVariation()),
      endurance: Math.max(1, baseStats.endurance + rollStatVariation()),
      intelligence: Math.max(1, baseStats.intelligence + rollStatVariation()),
      speed: Math.max(1, baseStats.speed + rollStatVariation()),
      fertility: Math.max(1, baseStats.fertility + rollStatVariation()),
      vitality: Math.max(1, baseStats.vitality + rollStatVariation()),
    };
  }

  return {
    strength: Math.max(1, Math.round((baseStats.strength + average(parentStats.map((p) => p.strength))) / 2) + rollStatVariation()),
    endurance: Math.max(1, Math.round((baseStats.endurance + average(parentStats.map((p) => p.endurance))) / 2) + rollStatVariation()),
    intelligence: Math.max(1, Math.round((baseStats.intelligence + average(parentStats.map((p) => p.intelligence))) / 2) + rollStatVariation()),
    speed: Math.max(1, Math.round((baseStats.speed + average(parentStats.map((p) => p.speed))) / 2) + rollStatVariation()),
    fertility: Math.max(1, Math.round((baseStats.fertility + average(parentStats.map((p) => p.fertility))) / 2) + rollStatVariation()),
    vitality: Math.max(1, Math.round((baseStats.vitality + average(parentStats.map((p) => p.vitality))) / 2) + rollStatVariation()),
  };
}

function rollRandomAllowedTrait(speciesName: string): CreatureTrait {
  return randomFrom(getAllowedTraitsForSpecies(speciesName));
}

function rollWildTraitSet(
  speciesName: string,
  templateTraits: CreatureTraitEntry[] = [],
  minTraits = 1,
  maxTraits = 3
): CreatureTraitEntry[] {
  const desiredCount = minTraits + Math.floor(Math.random() * (Math.max(minTraits, maxTraits) - minTraits + 1));
  const picked = new Map<CreatureTrait, CreatureTraitEntry>();

  for (const entry of templateTraits) {
    if (!isTraitAllowedForSpecies(speciesName, entry.trait)) continue;
    if (Math.random() < 0.5) {
      picked.set(entry.trait, { trait: entry.trait, grade: maybeDowngradeGrade(entry.grade, 0.25) });
    }
  }

  while (picked.size < desiredCount) {
    const trait = rollRandomAllowedTrait(speciesName);
    if (picked.has(trait)) continue;
    picked.set(trait, { trait, grade: rollRandomTraitGrade() });
  }

  return Array.from(picked.values())
    .sort((a, b) => getGradeRank(b.grade) - getGradeRank(a.grade))
    .slice(0, 3);
}

function createInheritedTraitSet(
  childSpeciesName: string,
  giverCreature: Creature | null,
  receiverCreature: Creature | null,
  inbreedingRisk: InbreedingRisk,
  eggQuality: EggQuality
): CreatureTraitEntry[] {
  const allowedTraits = getAllowedTraitsForSpecies(childSpeciesName);
  const parentTraitMap = new Map<CreatureTrait, TraitGrade[]>();

  for (const parent of [giverCreature, receiverCreature]) {
    if (!parent) continue;
    for (const entry of parent.traits) {
      if (!allowedTraits.includes(entry.trait)) continue;
      if (!parentTraitMap.has(entry.trait)) parentTraitMap.set(entry.trait, []);
      parentTraitMap.get(entry.trait)!.push(entry.grade);
    }
  }

  const inherited = new Map<CreatureTrait, CreatureTraitEntry>();
  const qualityUpgradeChance = eggQuality === "exceptional" ? 0.22 : eggQuality === "strong" ? 0.12 : 0.05;

  for (const [trait, grades] of parentTraitMap.entries()) {
    const bestParentGrade = grades.reduce((best, current) =>
      getGradeRank(current) > getGradeRank(best) ? current : best
    );
    const appearsInBothParents = grades.length >= 2;
    let inheritChance = appearsInBothParents ? 0.84 : 0.56;
    if (eggQuality === "strong") inheritChance += 0.04;
    if (eggQuality === "exceptional") inheritChance += 0.08;

    if (Math.random() < inheritChance) {
      let rolledGrade = bestParentGrade;
      rolledGrade = maybeUpgradeGrade(
        rolledGrade,
        appearsInBothParents ? 0.18 + qualityUpgradeChance : 0.08 + qualityUpgradeChance
      );
      if (inbreedingRisk !== "none") rolledGrade = maybeDowngradeGrade(rolledGrade, 0.12);
      inherited.set(trait, { trait, grade: rolledGrade });
    }
  }

  let desiredCount = inherited.size;
  if (desiredCount === 0) desiredCount = Math.random() < 0.7 ? 1 : 2;
  else if (desiredCount === 1 && Math.random() < 0.5) desiredCount = 2;
  else if (desiredCount >= 2 && Math.random() < 0.25) desiredCount = Math.min(3, desiredCount + 1);

  const mutationChance = eggQuality === "exceptional" ? 0.28 : eggQuality === "strong" ? 0.18 : 0.1;
  if (Math.random() < mutationChance) desiredCount = Math.min(3, desiredCount + 1);

  while (inherited.size < desiredCount) {
    const randomTrait = rollRandomAllowedTrait(childSpeciesName);
    if (inherited.has(randomTrait)) continue;
    let grade = rollRandomTraitGrade();
    if (eggQuality === "strong") grade = maybeUpgradeGrade(grade, 0.08);
    else if (eggQuality === "exceptional") grade = maybeUpgradeGrade(grade, 0.14);
    if (inbreedingRisk !== "none") grade = maybeDowngradeGrade(grade, 0.15);
    inherited.set(randomTrait, { trait: randomTrait, grade });
  }

  return Array.from(inherited.values())
    .sort((a, b) => getGradeRank(b.grade) - getGradeRank(a.grade))
    .slice(0, 3);
}

function applyInbreedingPenalty(
  stats: CreatureStats,
  risk: InbreedingRisk
): { stats: CreatureStats; inbredTrait: InbredTrait; inbredTraitSeverity: InbredTraitSeverity } {
  if (risk === "none") return { stats, inbredTrait: "none", inbredTraitSeverity: "none" };

  const inbredTrait = randomFrom(INBRED_TRAITS);
  const penalty = risk === "half_sibling" ? 1 : 2;
  const severity: InbredTraitSeverity = risk === "half_sibling" ? "mild" : "severe";
  const adjustedStats = { ...stats };

  if (inbredTrait === "weak") adjustedStats.strength = Math.max(1, adjustedStats.strength - penalty);
  if (inbredTrait === "frail") {
    adjustedStats.endurance = Math.max(1, adjustedStats.endurance - penalty);
    adjustedStats.vitality = Math.max(1, adjustedStats.vitality - 1);
  }
  if (inbredTrait === "dull") adjustedStats.intelligence = Math.max(1, adjustedStats.intelligence - penalty);
  if (inbredTrait === "slow") adjustedStats.speed = Math.max(1, adjustedStats.speed - penalty);

  return { stats: adjustedStats, inbredTrait, inbredTraitSeverity: severity };
}

function createCreatureFromTemplate(
  template: Creature,
  giver: string,
  receiver: string,
  giverId: number | null,
  receiverId: number | null,
  giverIsPlayer: boolean,
  receiverIsPlayer: boolean,
  currentDay: number,
  generation: number,
  inbreedingRisk: InbreedingRisk,
  giverCreature: Creature | null,
  receiverCreature: Creature | null,
  eggQuality: EggQuality
): Creature {
  const inheritedStats = createInheritedStats(template.stats, giverCreature, receiverCreature);
  const penaltyResult = applyInbreedingPenalty(inheritedStats, inbreedingRisk);
  const inheritedTraits = createInheritedTraitSet(
    template.name,
    giverCreature,
    receiverCreature,
    inbreedingRisk,
    eggQuality
  );

  const maxBreedingStamina = getMaxBreedingStaminaFromStats(penaltyResult.stats);
  const dailyBreedingLimit = getDailyBreedingLimitFromStats(penaltyResult.stats);

  return {
    ...template,
    id: Date.now() + Math.floor(Math.random() * 100000),
    nickname: generateNickname(template.name),
    level: 1,
    xp: 0,
    xpToNextLevel: getXpToNextLevel(1),
    happiness: 60,
    traits: inheritedTraits,
    trait: traitsToLegacyPrimaryTrait(inheritedTraits),
    stats: penaltyResult.stats,
    skills: createDefaultSkills(),
    breedingStamina: maxBreedingStamina,
    maxBreedingStamina,
    breedingsToday: 0,
    dailyBreedingLimit,
    giver,
    receiver,
    giverId,
    receiverId,
    giverIsPlayer,
    receiverIsPlayer,
    bornOnDay: currentDay,
    generation,
    inbreedingRisk,
    inbredTrait: penaltyResult.inbredTrait,
    inbredTraitSeverity: penaltyResult.inbredTraitSeverity,
  };
}

function normalizeSkillProgress(skill?: SkillProgress): SkillProgress {
  const level = skill?.level ?? 1;
  return { level, xp: skill?.xp ?? 0, xpToNextLevel: skill?.xpToNextLevel ?? getSkillXpToNextLevel(level) };
}

function normalizeCreature(creature: Creature): Creature {
  const normalizedStats = {
    strength: creature.stats?.strength ?? 1,
    endurance: creature.stats?.endurance ?? 1,
    intelligence: creature.stats?.intelligence ?? 1,
    speed: creature.stats?.speed ?? 1,
    fertility: creature.stats?.fertility ?? 5,
    vitality: creature.stats?.vitality ?? 5,
  };

  const normalizedTraits = normalizeTraitList(creature.traits, creature.trait, creature.name);
  const maxBreedingStamina = creature.maxBreedingStamina ?? getMaxBreedingStaminaFromStats(normalizedStats);
  const dailyBreedingLimit = creature.dailyBreedingLimit ?? getDailyBreedingLimitFromStats(normalizedStats);

  return {
    ...creature,
    level: creature.level ?? 1,
    xp: creature.xp ?? 0,
    xpToNextLevel: creature.xpToNextLevel ?? getXpToNextLevel(creature.level ?? 1),
    happiness: creature.happiness ?? 60,
    traits: normalizedTraits,
    trait: traitsToLegacyPrimaryTrait(normalizedTraits),
    stats: normalizedStats,
    skills: {
      cooking: normalizeSkillProgress(creature.skills?.cooking),
      cleaning: normalizeSkillProgress(creature.skills?.cleaning),
      breedingCare: normalizeSkillProgress(creature.skills?.breedingCare),
      fieldWork: normalizeSkillProgress(creature.skills?.fieldWork),
      hauling: normalizeSkillProgress(creature.skills?.hauling),
    },
    breedingStamina: creature.breedingStamina ?? maxBreedingStamina,
    maxBreedingStamina,
    breedingsToday: creature.breedingsToday ?? 0,
    dailyBreedingLimit,
    inbreedingRisk: creature.inbreedingRisk ?? "none",
    inbredTrait: creature.inbredTrait ?? "none",
    inbredTraitSeverity: creature.inbredTraitSeverity ?? "none",
  };
}

function normalizeEgg(egg: Egg): Egg {
  return { ...egg, inbreedingRisk: egg.inbreedingRisk ?? "none", quality: egg.quality ?? "normal" };
}

function normalizePlayerData(playerData: PlayerData): PlayerData {
  const level = playerData.level ?? 1;
  return {
    ...playerData,
    level,
    xp: playerData.xp ?? 0,
    xpToNextLevel: playerData.xpToNextLevel ?? getPlayerXpToNextLevel(level),
    happiness: playerData.happiness ?? 60,
    stats: {
      strength: playerData.stats?.strength ?? 6,
      endurance: playerData.stats?.endurance ?? 6,
      intelligence: playerData.stats?.intelligence ?? 6,
      speed: playerData.stats?.speed ?? 6,
      fertility: playerData.stats?.fertility ?? 6,
      vitality: playerData.stats?.vitality ?? 6,
    },
    breedingCare: normalizeSkillProgress(playerData.breedingCare),
  };
}

function normalizeHomeState(homeState?: HomeState): HomeState {
  return {
    cleanliness: homeState?.cleanliness ?? 70,
    foodStock: homeState?.foodStock ?? 10,
    wheatStock: homeState?.wheatStock ?? 5,
  };
}

function normalizeInventory(inventory?: InventoryState): InventoryState {
  return inventory && typeof inventory === "object" ? inventory : {};
}

function normalizeKnownRecipes(recipeIds?: string[]): string[] {
  const combined = [...DEFAULT_KNOWN_RECIPE_IDS, ...(Array.isArray(recipeIds) ? recipeIds : [])];
  return Array.from(new Set(combined));
}

function addItemToInventory(
  inventory: InventoryState,
  itemId: string,
  quantity = 1
): InventoryState {
  return {
    ...inventory,
    [itemId]: (inventory[itemId] ?? 0) + quantity,
  };
}

const defaultTownNpcs: TownNpc[] = [
  {
    id: "maris_thorn",
    name: "Maris Thorn",
    role: "Seed Seller",
    personality: "Playful, earthy, and shamelessly teasing when your fields impress her.",
    relationship: 0,
    rewardMilestonesClaimed: [],
  },
  {
    id: "selene_voss",
    name: "Selene Voss",
    role: "Produce Buyer",
    personality: "Polished, sly, and attracted to consistent high-quality deliveries.",
    relationship: 0,
    rewardMilestonesClaimed: [],
  },
  {
    id: "tamsin_vale",
    name: "Tamsin Vale",
    role: "Recipe Keeper",
    personality: "Warm and indulgent, with a soft spot for thoughtful kitchen prep.",
    relationship: 0,
    rewardMilestonesClaimed: [],
  },
];

function removeItemFromInventory(
  inventory: InventoryState,
  itemId: string,
  quantity = 1
): InventoryState {
  const current = inventory[itemId] ?? 0;
  const next = Math.max(0, current - quantity);

  if (next <= 0) {
    const rest = { ...inventory };
    delete rest[itemId];
    return rest;
  }

  return {
    ...inventory,
    [itemId]: next,
  };
}

function normalizeTownNpc(npc: TownNpc): TownNpc {
  return {
    ...npc,
    relationship: clamp(npc.relationship ?? 0, 0, 500),
    rewardMilestonesClaimed: Array.isArray(npc.rewardMilestonesClaimed) ? npc.rewardMilestonesClaimed : [],
  };
}

function normalizeTownNpcQuest(quest: TownNpcQuest): TownNpcQuest {
  return {
    ...quest,
    questType: quest.questType ?? "creature_delivery",
    rewardItems: Array.isArray(quest.rewardItems) ? quest.rewardItems : [],
    seasonalFocus: quest.seasonalFocus ?? null,
    completed: quest.completed ?? false,
  };
}

function ensureTownNpcRoster(savedNpcs?: TownNpc[]): TownNpc[] {
  const normalized = Array.isArray(savedNpcs) ? savedNpcs.map(normalizeTownNpc) : [];
  const byId = new Map(normalized.map((npc) => [npc.id, npc]));

  defaultTownNpcs.forEach((defaultNpc) => {
    if (!byId.has(defaultNpc.id)) {
      byId.set(defaultNpc.id, normalizeTownNpc(defaultNpc));
    }
  });

  return Array.from(byId.values());
}

function calculateTownCreaturePrice(creature: Creature): number {
  const statTotal =
    creature.stats.strength +
    creature.stats.endurance +
    creature.stats.intelligence +
    creature.stats.speed +
    creature.stats.fertility +
    creature.stats.vitality;

  const traitValue = creature.traits.reduce((sum, entry) => {
    const gradeValue = getTraitGradePriceBonus(entry.grade);
    const speciesLockedBonus =
      HORSE_SPECIFIC_TRAITS.includes(entry.trait) || CAT_SPECIFIC_TRAITS.includes(entry.trait)
        ? 18
        : 0;
    return sum + gradeValue + speciesLockedBonus;
  }, 0);

  const multipleTraitBonus =
    creature.traits.length >= 3 ? 45 :
    creature.traits.length === 2 ? 18 :
    creature.traits.length === 1 ? 8 : 0;

  return 80 + statTotal * 3 + traitValue + multipleTraitBonus + Math.max(0, creature.level - 1) * 10;
}

function createTownSellerCreature(template: Creature, currentDay: number): Creature {
  const stats = {
    strength: Math.max(1, template.stats.strength + rollStatVariation()),
    endurance: Math.max(1, template.stats.endurance + rollStatVariation()),
    intelligence: Math.max(1, template.stats.intelligence + rollStatVariation()),
    speed: Math.max(1, template.stats.speed + rollStatVariation()),
    fertility: Math.max(1, template.stats.fertility + rollStatVariation()),
    vitality: Math.max(1, template.stats.vitality + rollStatVariation()),
  };

  const maxBreedingStamina = getMaxBreedingStaminaFromStats(stats);
  const dailyBreedingLimit = getDailyBreedingLimitFromStats(stats);
  const rolledTraits = rollWildTraitSet(template.name, template.traits, 1, 3);

  return {
    ...template,
    id: Date.now() + Math.floor(Math.random() * 100000),
    nickname: generateNickname(template.name),
    level: 1 + Math.floor(Math.random() * 3),
    xp: 0,
    xpToNextLevel: getXpToNextLevel(1),
    happiness: 65,
    traits: rolledTraits,
    trait: traitsToLegacyPrimaryTrait(rolledTraits),
    stats,
    skills: createDefaultSkills(),
    breedingStamina: maxBreedingStamina,
    maxBreedingStamina,
    breedingsToday: 0,
    dailyBreedingLimit,
    giver: null,
    receiver: null,
    giverId: null,
    receiverId: null,
    giverIsPlayer: false,
    receiverIsPlayer: false,
    bornOnDay: currentDay,
    generation: 1,
    inbreedingRisk: "none",
    inbredTrait: "none",
    inbredTraitSeverity: "none",
  };
}

function generateTownStock(currentDay: number): TownStockEntry[] {
  const templates = [horseTemplate, catTemplate];
  return Array.from({ length: 3 }).map((_, index) => {
    const template = randomFrom(templates);
    const creature = createTownSellerCreature(template, currentDay);
    return {
      id: currentDay * 100 + index + 1,
      creature,
      price: calculateTownCreaturePrice(creature),
    };
  });
}

function createSingleTownQuest(currentDay: number, questIdSeed: number): TownQuest {
  const questTemplates: TownQuestTemplate[] = [
    {
      title: "Stable Delivery",
      description: "Submit a sturdy Horse with strong endurance.",
      rewardGold: 140,
      rewardXp: 30,
      deadlineOffsetDays: 2,
      deadlineHour: 18,
      deadlineMinute: 0,
      requirement: { species: "Horse", minimumLevel: 1, minimumStats: { endurance: 8 } },
    },
    {
      title: "Household Companion",
      description: "Submit a quick Cat with sharp intelligence.",
      rewardGold: 145,
      rewardXp: 30,
      deadlineOffsetDays: 2,
      deadlineHour: 20,
      deadlineMinute: 0,
      requirement: { species: "Cat", minimumLevel: 1, minimumStats: { intelligence: 8, speed: 7 } },
    },
    {
      title: "Healthy Bloodline",
      description: "Submit any creature with no inbreeding risk and solid vitality.",
      rewardGold: 175,
      rewardXp: 35,
      deadlineOffsetDays: 3,
      deadlineHour: 12,
      deadlineMinute: 0,
      requirement: { species: "any", minimumLevel: 2, minimumStats: { vitality: 7 } },
    },
    {
      title: "Swift Courier",
      description: "Submit a fast creature suited for urgent deliveries.",
      rewardGold: 155,
      rewardXp: 30,
      deadlineOffsetDays: 2,
      deadlineHour: 16,
      deadlineMinute: 0,
      requirement: { species: "any", minimumLevel: 1, minimumStats: { speed: 8 } },
    },
    {
      title: "Fertile Prospect",
      description: "Submit a breeding candidate with strong fertility.",
      rewardGold: 165,
      rewardXp: 35,
      deadlineOffsetDays: 3,
      deadlineHour: 14,
      deadlineMinute: 0,
      requirement: { species: "any", minimumLevel: 2, minimumStats: { fertility: 8 } },
    },
    {
      title: "Kitchen Assistant",
      description: "Submit a Domestic creature suited for home tasks.",
      rewardGold: 170,
      rewardXp: 35,
      deadlineOffsetDays: 3,
      deadlineHour: 19,
      deadlineMinute: 0,
      requirement: { species: "any", minimumLevel: 2, minimumStats: { intelligence: 7 }, requiredTrait: "domestic" },
    },
    {
      title: "Field Contract",
      description: "Submit an Industrious creature ready for hard work.",
      rewardGold: 180,
      rewardXp: 35,
      deadlineOffsetDays: 3,
      deadlineHour: 15,
      deadlineMinute: 0,
      requirement: { species: "any", minimumLevel: 2, minimumStats: { strength: 7, endurance: 7 }, requiredTrait: "industrious" },
    },
    {
      title: "Gentle Temperament",
      description: "Submit a Calm creature for careful handling duties.",
      rewardGold: 175,
      rewardXp: 35,
      deadlineOffsetDays: 3,
      deadlineHour: 17,
      deadlineMinute: 0,
      requirement: { species: "any", minimumLevel: 2, minimumStats: { vitality: 6 }, requiredTrait: "calm" },
    },
    {
      title: "Barn Scout",
      description: "Submit a Horse with a Surefooted edge for route scouting.",
      rewardGold: 190,
      rewardXp: 40,
      deadlineOffsetDays: 3,
      deadlineHour: 18,
      deadlineMinute: 30,
      requirement: { species: "Horse", minimumLevel: 2, minimumStats: { speed: 7, intelligence: 5 }, requiredTrait: "surefooted" },
    },
    {
      title: "Night Watch",
      description: "Submit a Cat suited for late patrol work.",
      rewardGold: 195,
      rewardXp: 40,
      deadlineOffsetDays: 3,
      deadlineHour: 22,
      deadlineMinute: 0,
      requirement: { species: "Cat", minimumLevel: 2, minimumStats: { speed: 8 }, requiredTrait: "night_prawler" },
    },
  ];

  const template = randomFrom(questTemplates);
  return {
    id: questIdSeed,
    title: template.title,
    description: template.description,
    rewardGold: template.rewardGold,
    rewardXp: template.rewardXp,
    deadlineDay: currentDay + template.deadlineOffsetDays,
    deadlineHour: template.deadlineHour,
    deadlineMinute: template.deadlineMinute,
    requirement: {
      species: template.requirement.species,
      minimumLevel: template.requirement.minimumLevel,
      minimumStats: { ...template.requirement.minimumStats },
      requiredTrait: template.requirement.requiredTrait ?? undefined,
    },
    completed: false,
  };
}

function generateTownQuests(currentDay: number): TownQuest[] {
  return Array.from({ length: 10 }).map((_, index) =>
    createSingleTownQuest(currentDay, currentDay * 1000 + index + 1)
  );
}

function createNpcQuestTemplates(currentDay: number, seedBase: number): TownNpcQuest[] {
  const requests = generateNpcFarmingRequests(currentDay, getSeasonForDay(currentDay), seedBase);

  return requests.map((request) => ({
    id: request.id,
    npcId: request.npcId,
    npcName: request.npcName,
    questType: "farming_delivery",
    title: request.title,
    description: request.description,
    requestLine: request.requestLine,
    completionLine: request.completionLine,
    rewardGold: request.rewardGold,
    rewardXp: request.rewardXp,
    relationshipGain: request.relationshipGain,
    rewardItems: request.rewardItems,
    requestedCropId: request.requestedCropId,
    requestedItemId: request.requestedItemId,
    minimumQuality: request.minimumQuality,
    requiredQuantity: request.requiredQuantity,
    seasonalFocus: request.seasonalFocus,
    deadlineDay: request.deadlineDay,
    deadlineHour: request.deadlineHour,
    deadlineMinute: request.deadlineMinute,
    requirement: { species: "any", minimumLevel: 1, minimumStats: {} },
    completed: false,
  }));
}

function generateTownNpcQuests(currentDay: number): TownNpcQuest[] {
  return createNpcQuestTemplates(currentDay, currentDay * 2000);
}

function isQuestExpired(
  quest: { deadlineDay: number; deadlineHour: number; deadlineMinute: number },
  currentDay: number,
  currentHour: number,
  currentMinute: number
) {
  if (currentDay > quest.deadlineDay) return true;
  if (currentDay < quest.deadlineDay) return false;
  if (currentHour > quest.deadlineHour) return true;
  if (currentHour < quest.deadlineHour) return false;
  return currentMinute > quest.deadlineMinute;
}

function ensureQuestBoardSize(
  quests: TownQuest[],
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  desiredCount = 10
): TownQuest[] {
  const activeQuests = quests.filter(
    (quest) => !quest.completed && !isQuestExpired(quest, currentDay, currentHour, currentMinute)
  );

  let nextIdSeed =
    activeQuests.length > 0 ? Math.max(...activeQuests.map((quest) => quest.id)) + 1 : currentDay * 1000 + 1;

  const nextQuests = [...activeQuests];
  while (nextQuests.length < desiredCount) {
    nextQuests.push(createSingleTownQuest(currentDay, nextIdSeed));
    nextIdSeed += 1;
  }
  return nextQuests.slice(0, desiredCount);
}

function ensureNpcQuestBoardSize(
  quests: TownNpcQuest[],
  currentDay: number,
  currentHour: number,
  currentMinute: number,
  desiredCount = 3
): TownNpcQuest[] {
  const activeQuests = quests.filter(
    (quest) => !quest.completed && !isQuestExpired(quest, currentDay, currentHour, currentMinute)
  );

  let nextSeed =
    activeQuests.length > 0 ? Math.max(...activeQuests.map((quest) => quest.id)) + 1 : currentDay * 2000 + 1;

  const nextQuests = [...activeQuests];
  const refillTemplates = createNpcQuestTemplates(currentDay, nextSeed);

  for (const template of refillTemplates) {
    if (nextQuests.length >= desiredCount) break;
    if (!nextQuests.some((quest) => quest.npcId === template.npcId && quest.title === template.title)) {
      nextQuests.push({ ...template, id: nextSeed++ });
    }
  }

  while (nextQuests.length < desiredCount) {
    const fallback = randomFrom(createNpcQuestTemplates(currentDay, nextSeed));
    nextQuests.push({ ...fallback, id: nextSeed++ });
  }

  return nextQuests.slice(0, desiredCount);
}

function applyTownActionTimeCost(day: number, hour: number, minute: number, minutesToAdd: number) {
  return addMinutesToClock(day, hour, minute, minutesToAdd);
}

function applyIntelligenceRiskMitigation(
  baseRisk: InbreedingRisk,
  giverCreature: Creature | null,
  receiverCreature: Creature | null
): InbreedingRisk {
  if (baseRisk === "none") return "none";

  const intelligenceValues = [giverCreature?.stats.intelligence, receiverCreature?.stats.intelligence]
    .filter((value): value is number => typeof value === "number");

  if (intelligenceValues.length === 0) return baseRisk;

  const avgIntelligence = average(intelligenceValues);

  if (baseRisk === "half_sibling") {
    const mitigationChance = Math.min(0.45, Math.max(0, (avgIntelligence - 6) * 0.05));
    if (Math.random() < mitigationChance) return "none";
  }

  if (baseRisk === "parent_child" || baseRisk === "full_sibling") {
    const downgradeChance = Math.min(0.35, Math.max(0, (avgIntelligence - 7) * 0.04));
    if (Math.random() < downgradeChance) return "half_sibling";
  }

  return baseRisk;
}

function getQuickTraitSpeedBonus(participantType: "player" | "creature", creature: Creature | null) {
  if (participantType === "player" || !creature) return 0;
  const quickEntry = getBestTraitEntry(creature, "quick");
  if (!quickEntry) return 0;
  return getTraitFlatBonus(quickEntry.grade, 10);
}

function getSturdyTraitStaminaDiscount(creature: Creature | null) {
  if (!creature) return 0;
  const sturdyEntry = getBestTraitEntry(creature, "sturdy");
  if (!sturdyEntry) return 0;
  return getTraitFlatBonus(sturdyEntry.grade, 3);
}

function getBreedingSessionMinutes(
  giverCreature: Creature | null,
  receiverCreature: Creature | null,
  giverType: "player" | "creature" = "creature",
  receiverType: "player" | "creature" = "creature"
): number {
  const speedValues = [giverCreature?.stats.speed, receiverCreature?.stats.speed]
    .filter((value): value is number => typeof value === "number");
  const avgSpeed = speedValues.length > 0 ? average(speedValues) : 6;
  const traitBonus = getQuickTraitSpeedBonus(giverType, giverCreature) + getQuickTraitSpeedBonus(receiverType, receiverCreature);
  return Math.max(25, 120 - Math.round(avgSpeed * 6) - traitBonus);
}

function getBreedingStaminaCost(creature: Creature): number {
  return Math.max(
    6,
    22 - Math.floor(creature.stats.endurance / 2) - getSturdyTraitStaminaDiscount(creature)
  );
}

function addMinutesToClock(day: number, hour: number, minute: number, minutesToAdd: number) {
  let totalMinutes = hour * 60 + minute + minutesToAdd;
  let newDay = day;

  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    newDay += 1;
  }

  return { day: newDay, hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 };
}

function applyXpGain(creature: Creature, xpGain: number): Creature {
  let updatedCreature = { ...creature, xp: creature.xp + xpGain };

  while (updatedCreature.xp >= updatedCreature.xpToNextLevel) {
    updatedCreature = {
      ...updatedCreature,
      xp: updatedCreature.xp - updatedCreature.xpToNextLevel,
      level: updatedCreature.level + 1,
      xpToNextLevel: getXpToNextLevel(updatedCreature.level + 1),
      stats: {
        strength: updatedCreature.stats.strength + (updatedCreature.level % 2 === 0 ? 1 : 0),
        endurance: updatedCreature.stats.endurance + 1,
        intelligence: updatedCreature.stats.intelligence + (updatedCreature.level % 3 === 0 ? 1 : 0),
        speed: updatedCreature.stats.speed + (updatedCreature.level % 2 !== 0 ? 1 : 0),
        fertility: updatedCreature.stats.fertility + (updatedCreature.level % 3 === 0 ? 1 : 0),
        vitality: updatedCreature.stats.vitality + 1,
      },
    };

    const recalculatedMaxStamina = getMaxBreedingStaminaFromStats(updatedCreature.stats);
    const recalculatedDailyLimit = getDailyBreedingLimitFromStats(updatedCreature.stats);

    updatedCreature = {
      ...updatedCreature,
      maxBreedingStamina: recalculatedMaxStamina,
      breedingStamina: Math.min(recalculatedMaxStamina, updatedCreature.breedingStamina + 6),
      dailyBreedingLimit: recalculatedDailyLimit,
    };
  }

  return updatedCreature;
}

function applyPlayerXpGain(playerData: PlayerData, xpGain: number): PlayerData {
  let updatedPlayer = { ...playerData, xp: playerData.xp + xpGain };

  while (updatedPlayer.xp >= updatedPlayer.xpToNextLevel) {
    updatedPlayer = {
      ...updatedPlayer,
      xp: updatedPlayer.xp - updatedPlayer.xpToNextLevel,
      level: updatedPlayer.level + 1,
      xpToNextLevel: getPlayerXpToNextLevel(updatedPlayer.level + 1),
      energy: Math.min(100, updatedPlayer.energy + 10),
    };
  }

  return updatedPlayer;
}

function applySkillXpGain(skill: SkillProgress, xpGain: number): SkillProgress {
  let updatedSkill = { ...skill, xp: skill.xp + xpGain };

  while (updatedSkill.xp >= updatedSkill.xpToNextLevel) {
    updatedSkill = {
      ...updatedSkill,
      xp: updatedSkill.xp - updatedSkill.xpToNextLevel,
      level: updatedSkill.level + 1,
      xpToNextLevel: getSkillXpToNextLevel(updatedSkill.level + 1),
    };
  }

  return updatedSkill;
}

function applyCreatureSkillXp(creature: Creature, skillName: keyof CreatureSkills, xpGain: number): Creature {
  return {
    ...creature,
    skills: {
      ...creature.skills,
      [skillName]: applySkillXpGain(creature.skills[skillName], xpGain),
    },
  };
}

function getFieldWorkProfile(creature: Creature) {
  return buildFieldWorkSpecializationProfile(creature);
}

function getParticipantSnapshot(
  participantType: "player" | "creature",
  creature: Creature | null,
  playerData: PlayerData
) {
  if (participantType === "player") {
    return {
      isPlayer: true,
      happiness: playerData.happiness,
      stats: playerData.stats,
      breedingCareLevel: playerData.breedingCare.level,
      traits: [] as CreatureTraitEntry[],
    };
  }

  if (!creature) return null;

  return {
    isPlayer: false,
    happiness: creature.happiness,
    stats: creature.stats,
    breedingCareLevel: creature.skills.breedingCare.level,
    traits: creature.traits,
  };
}

function getEggProductionChance(
  giverParticipant: { happiness: number; stats: CreatureStats; breedingCareLevel: number; traits: CreatureTraitEntry[] } | null,
  receiverParticipant: { happiness: number; stats: CreatureStats; breedingCareLevel: number; traits: CreatureTraitEntry[] } | null,
  homeState: HomeState
) {
  const participants = [giverParticipant, receiverParticipant].filter(Boolean) as {
    happiness: number; stats: CreatureStats; breedingCareLevel: number; traits: CreatureTraitEntry[];
  }[];

  if (participants.length === 0) return 0.5;

  const avgFertility = average(participants.map((p) => p.stats.fertility));
  const avgVitality = average(participants.map((p) => p.stats.vitality));
  const avgHappiness = average(participants.map((p) => p.happiness));
  const avgBreedingCare = average(participants.map((p) => p.breedingCareLevel));
  const fertileTraitBonus = participants.reduce((sum, p) => {
    const fertile = p.traits.find((entry) => entry.trait === "fertile");
    return sum + (fertile ? getTraitPowerMultiplier(fertile.grade) * 0.07 : 0);
  }, 0);

  let chance = 0.45;
  chance += (avgFertility - 5) * 0.05;
  chance += (avgVitality - 5) * 0.02;
  chance += (avgHappiness - 50) * 0.003;
  chance += avgBreedingCare * 0.015;
  chance += fertileTraitBonus;

  if (homeState.cleanliness >= 80) chance += 0.08;
  else if (homeState.cleanliness >= 50) chance += 0.03;
  else if (homeState.cleanliness < 25) chance -= 0.15;
  else if (homeState.cleanliness < 50) chance -= 0.07;

  if (homeState.foodStock >= 8) chance += 0.04;
  else if (homeState.foodStock <= 0) chance -= 0.12;
  else if (homeState.foodStock <= 2) chance -= 0.05;

  return clamp(chance, 0.1, 0.95);
}

function getEggQualityFromPairing(
  giverParticipant: { happiness: number; stats: CreatureStats; breedingCareLevel: number; traits: CreatureTraitEntry[] } | null,
  receiverParticipant: { happiness: number; stats: CreatureStats; breedingCareLevel: number; traits: CreatureTraitEntry[] } | null,
  homeState: HomeState
): EggQuality {
  const participants = [giverParticipant, receiverParticipant].filter(Boolean) as {
    happiness: number; stats: CreatureStats; breedingCareLevel: number; traits: CreatureTraitEntry[];
  }[];

  if (participants.length === 0) return "normal";

  const avgFertility = average(participants.map((p) => p.stats.fertility));
  const avgVitality = average(participants.map((p) => p.stats.vitality));
  const avgIntelligence = average(participants.map((p) => p.stats.intelligence));
  const avgHappiness = average(participants.map((p) => p.happiness));
  const avgBreedingCare = average(participants.map((p) => p.breedingCareLevel));

  const calmTraitBonus = participants.reduce((sum, p) => {
    const calm = p.traits.find((entry) => entry.trait === "calm");
    return sum + (calm ? getTraitPowerMultiplier(calm.grade) : 0);
  }, 0);

  const fertileTraitBonus = participants.reduce((sum, p) => {
    const fertile = p.traits.find((entry) => entry.trait === "fertile");
    return sum + (fertile ? getTraitPowerMultiplier(fertile.grade) : 0);
  }, 0);

  const score =
    avgFertility +
    avgVitality +
    avgIntelligence +
    avgBreedingCare * 1.5 +
    avgHappiness / 10 +
    homeState.cleanliness / 20 +
    Math.min(homeState.foodStock, 10) / 2 +
    calmTraitBonus +
    fertileTraitBonus;

  if (score >= 34) return "exceptional";
  if (score >= 28) return "strong";
  if (score >= 22) return "normal";
  return "poor";
}

function applyEggQualityBonuses(creature: Creature, quality: EggQuality): Creature {
  if (quality === "poor" || quality === "normal") return creature;

  const statKeys: (keyof CreatureStats)[] = ["strength","endurance","intelligence","speed","fertility","vitality"];
  const updatedStats = { ...creature.stats };

  if (quality === "strong") {
    const statKey = randomFrom(statKeys);
    updatedStats[statKey] += 1;
    return applyXpGain({ ...creature, stats: updatedStats, happiness: clamp(creature.happiness + 5, 0, 100) }, 10);
  }

  const firstStat = randomFrom(statKeys);
  let secondStat = randomFrom(statKeys);
  while (secondStat === firstStat) secondStat = randomFrom(statKeys);
  updatedStats[firstStat] += 1;
  updatedStats[secondStat] += 1;

  return applyXpGain({ ...creature, stats: updatedStats, happiness: clamp(creature.happiness + 10, 0, 100) }, 20);
}

function getHomeConditionHappinessDelta(cleanliness: number, wasFed: boolean) {
  let delta = 0;
  if (wasFed) delta += 6;
  else delta -= 10;
  if (cleanliness >= 80) delta += 3;
  else if (cleanliness < 25) delta -= 12;
  else if (cleanliness < 50) delta -= 6;
  return delta;
}

function getBreedingRefusalChance(
  giverParticipant: { happiness: number; breedingCareLevel: number; traits: CreatureTraitEntry[] } | null,
  receiverParticipant: { happiness: number; breedingCareLevel: number; traits: CreatureTraitEntry[] } | null,
  homeState: HomeState
) {
  const participants = [giverParticipant, receiverParticipant].filter(Boolean) as {
    happiness: number; breedingCareLevel: number; traits: CreatureTraitEntry[];
  }[];

  const avgHappiness = participants.length > 0 ? average(participants.map((p) => p.happiness)) : 60;
  const avgBreedingCare = participants.length > 0 ? average(participants.map((p) => p.breedingCareLevel)) : 1;
  const calmTraitReduction = participants.reduce((sum, p) => {
    const calm = p.traits.find((entry) => entry.trait === "calm");
    return sum + (calm ? getTraitPowerMultiplier(calm.grade) * 0.08 : 0);
  }, 0);

  let refusalChance = 0;
  if (avgHappiness < 20) refusalChance += 0.45;
  else if (avgHappiness < 35) refusalChance += 0.28;
  else if (avgHappiness < 50) refusalChance += 0.14;

  if (homeState.cleanliness < 25) refusalChance += 0.25;
  else if (homeState.cleanliness < 50) refusalChance += 0.12;

  if (homeState.foodStock <= 0) refusalChance += 0.15;
  else if (homeState.foodStock <= 2) refusalChance += 0.06;

  refusalChance -= Math.min(0.12, avgBreedingCare * 0.015);
  refusalChance -= calmTraitReduction;
  return clamp(refusalChance, 0, 0.75);
}

function doesCreatureMeetQuest(
  creature: Creature,
  quest: { title?: string; requirement: QuestRequirement }
): boolean {
  if (quest.requirement.species !== "any" && creature.name !== quest.requirement.species) return false;
  if (creature.level < quest.requirement.minimumLevel) return false;
  if (quest.requirement.requiredTrait && !hasTrait(creature, quest.requirement.requiredTrait)) return false;

  const minimumStats = quest.requirement.minimumStats;
  if (minimumStats.strength !== undefined && creature.stats.strength < minimumStats.strength) return false;
  if (minimumStats.endurance !== undefined && creature.stats.endurance < minimumStats.endurance) return false;
  if (minimumStats.intelligence !== undefined && creature.stats.intelligence < minimumStats.intelligence) return false;
  if (minimumStats.speed !== undefined && creature.stats.speed < minimumStats.speed) return false;
  if (minimumStats.fertility !== undefined && creature.stats.fertility < minimumStats.fertility) return false;
  if (minimumStats.vitality !== undefined && creature.stats.vitality < minimumStats.vitality) return false;
  if (quest.title === "Healthy Bloodline" && creature.inbreedingRisk !== "none") return false;
  return true;
}

function getTravelMinutes(from: LocationName, to: LocationName): number {
  if (from === to) return 0;

  const travelTimes: Record<LocationName, Record<LocationName, number>> = {
    home: { home: 0, ranch: 10, town: 35, market: 45, guild_hall: 50 },
    ranch: { home: 10, ranch: 0, town: 30, market: 40, guild_hall: 45 },
    town: { home: 35, ranch: 30, town: 0, market: 15, guild_hall: 20 },
    market: { home: 45, ranch: 40, town: 15, market: 0, guild_hall: 10 },
    guild_hall: { home: 50, ranch: 45, town: 20, market: 10, guild_hall: 0 },
  };

  return travelTimes[from][to];
}

const defaultPlayerData: PlayerData = {
  name: "Player",
  gold: 500,
  energy: 100,
  level: 1,
  xp: 0,
  xpToNextLevel: getPlayerXpToNextLevel(1),
  happiness: 60,
  stats: { strength: 6, endurance: 6, intelligence: 6, speed: 6, fertility: 6, vitality: 6 },
  breedingCare: createSkillProgress(),
};

const defaultHomeState: HomeState = { cleanliness: 70, foodStock: 10, wheatStock: 5 };

const defaultInventory: InventoryState = {
  wheat: 2,
  carrot: 1,
  milk: 1,
  basic_fertilizer: 2,
};

const defaultKnownRecipeIds = [...DEFAULT_KNOWN_RECIPE_IDS];
const defaultFieldPlots = createDefaultFieldPlots();

const defaultCreatures: Creature[] = [
  normalizeCreature({ ...horseTemplate, id: 1, nickname: "Starter Horse" }),
  normalizeCreature({ ...catTemplate, id: 2, nickname: "Starter Cat" }),
];

const defaultBreedingSelection: BreedingSelection = {
  giverType: "creature",
  giverCreatureId: 1,
  receiverType: "creature",
  receiverCreatureId: 2,
};

const defaultEggs: Egg[] = [
  {
    id: 1,
    name: "Test Egg",
    parents: "Starter Horse + Starter Cat",
    hatchDaysRemaining: 3,
    giver: "Horse",
    receiver: "Cat",
    giverId: 1,
    receiverId: 2,
    giverIsPlayer: false,
    receiverIsPlayer: false,
    inbreedingRisk: "none",
    quality: "normal",
  },
];

const defaultSaveData: SaveData = {
  currentDay: 1,
  currentHour: 8,
  currentMinute: 0,
  currentWeather: generateWeatherForDay(1),
  currentLocation: "ranch",
  playerData: defaultPlayerData,
  homeState: defaultHomeState,
  creatures: defaultCreatures,
  eggs: defaultEggs,
  breedingSelection: defaultBreedingSelection,
  townStock: generateTownStock(1),
  townQuests: generateTownQuests(1),
  townNpcs: defaultTownNpcs,
  townNpcQuests: generateTownNpcQuests(1),
  npcContractLedger: ensureNpcContractLedger([], 1, 8, 0, getSeasonForDay(1), defaultTownNpcs),
  npcRelationshipEventFlags: [],
  npcRelationshipEventLog: [],
  latestNpcRelationshipEvent: null,
  npcContractCompletionHistory: {},
  npcGiftRecords: {},
  npcInvitationRecords: {},
  npcOutingCompletionLog: [],
  npcMiniChainProgress: {},
  npcRoutePerks: {},
  npcLoverEvolutions: {},
  npcExclusiveLoops: {
    offers: [],
    completionCounts: {},
    lastCompletedDay: {},
    streaks: {},
    specialCompletions: [],
  },
  latestNpcSocialResult: null,
  paidTaxMonths: [],
  travelLog: [],
  inventory: defaultInventory,
  produceQualityInventory: {},
  knownRecipeIds: defaultKnownRecipeIds,
  fieldUpgrades: DEFAULT_FIELD_UPGRADES,
  fieldPlots: defaultFieldPlots,
  mainStory: defaultMainStoryState,
  authoredQuests: defaultAuthoredQuests,
  factions: defaultFactions,
  worldRegions: defaultWorldRegions,
  currentRegionId: "homefold_valley",
  visitedRegionIds: ["homefold_valley"],
  regionTravelLog: [],
  latestRegionTravelResult: null,
  factionQuestChains: defaultFactionQuestChains,
  regionTaskChains: defaultRegionTaskChains,
};

const STORAGE_KEY = "creature-chronicles-save";

export function GameProvider({ children }: { children: ReactNode }) {
  const [hasLoaded, setHasLoaded] = useState(false);

  const [currentDay, setCurrentDay] = useState(defaultSaveData.currentDay);
  const [currentHour, setCurrentHour] = useState(defaultSaveData.currentHour);
  const [currentMinute, setCurrentMinute] = useState(defaultSaveData.currentMinute);
  const [currentWeather, setCurrentWeather] = useState<GameWeather>(defaultSaveData.currentWeather);
  const [currentLocation, setCurrentLocation] = useState<LocationName>(defaultSaveData.currentLocation);
  const [playerData, setPlayerData] = useState(defaultSaveData.playerData);
  const [homeState, setHomeState] = useState(defaultSaveData.homeState);
  const [creatures, setCreatures] = useState(defaultSaveData.creatures);
  const [eggs, setEggs] = useState(defaultSaveData.eggs);
  const [breedingSelection, setBreedingSelection] = useState(defaultSaveData.breedingSelection);
  const [townStock, setTownStock] = useState(defaultSaveData.townStock);
  const [townQuests, setTownQuests] = useState(defaultSaveData.townQuests);
  const [townNpcs, setTownNpcs] = useState(defaultSaveData.townNpcs);
  const [townNpcQuests, setTownNpcQuests] = useState(defaultSaveData.townNpcQuests);
  const [npcContractLedger, setNpcContractLedger] = useState<NpcContractOffer[]>(defaultSaveData.npcContractLedger);
  const [npcRelationshipEventFlags, setNpcRelationshipEventFlags] = useState<string[]>(defaultSaveData.npcRelationshipEventFlags);
  const [npcRelationshipEventLog, setNpcRelationshipEventLog] = useState<NpcRelationshipEventUnlock[]>(defaultSaveData.npcRelationshipEventLog);
  const [latestNpcRelationshipEvent, setLatestNpcRelationshipEvent] = useState<NpcRelationshipEventUnlock | null>(
    defaultSaveData.latestNpcRelationshipEvent
  );
  const [npcContractCompletionHistory, setNpcContractCompletionHistory] = useState<NpcContractCompletionHistory>(
    defaultSaveData.npcContractCompletionHistory
  );
  const [npcGiftRecords, setNpcGiftRecords] = useState<NpcGiftRecordMap>(defaultSaveData.npcGiftRecords);
  const [npcInvitationRecords, setNpcInvitationRecords] = useState<NpcInvitationRecordMap>(
    defaultSaveData.npcInvitationRecords
  );
  const [npcOutingCompletionLog, setNpcOutingCompletionLog] = useState<NpcOutingCompletionLog>(
    defaultSaveData.npcOutingCompletionLog
  );
  const [npcMiniChainProgress, setNpcMiniChainProgress] = useState<NpcMiniChainProgressMap>(
    defaultSaveData.npcMiniChainProgress
  );
  const [npcRoutePerks, setNpcRoutePerks] = useState<NpcRoutePerkState>(defaultSaveData.npcRoutePerks);
  const [npcLoverEvolutions, setNpcLoverEvolutions] = useState<NpcLoverEvolutionState>(
    defaultSaveData.npcLoverEvolutions
  );
  const [npcExclusiveLoops, setNpcExclusiveLoops] = useState<NpcExclusiveLoopState>(
    defaultSaveData.npcExclusiveLoops
  );
  const [latestNpcSocialResult, setLatestNpcSocialResult] = useState<NpcSocialActionResult | null>(
    defaultSaveData.latestNpcSocialResult
  );
  const [paidTaxMonths, setPaidTaxMonths] = useState<number[]>(defaultSaveData.paidTaxMonths);
  const [travelLog, setTravelLog] = useState<TravelLogEntry[]>(defaultSaveData.travelLog);
  const [inventory, setInventory] = useState<InventoryState>(defaultSaveData.inventory);
  const [produceQualityInventory, setProduceQualityInventory] = useState<ProduceQualityInventoryState>(
    defaultSaveData.produceQualityInventory
  );
  const [knownRecipeIds, setKnownRecipeIds] = useState<string[]>(defaultSaveData.knownRecipeIds);
  const [fieldUpgrades, setFieldUpgrades] = useState<FieldUpgradeState>(defaultSaveData.fieldUpgrades);
  const [fieldPlots, setFieldPlots] = useState<FieldPlot[]>(defaultSaveData.fieldPlots);
  const [lastFieldAction, setLastFieldAction] = useState<FieldActionReport | null>(null);
  const [mainStory, setMainStory] = useState<MainStoryState>(defaultSaveData.mainStory);
  const [authoredQuests, setAuthoredQuests] = useState<AuthoredQuest[]>(defaultSaveData.authoredQuests);
  const [factions, setFactions] = useState<WorldFaction[]>(defaultSaveData.factions);
  const [worldRegions, setWorldRegions] = useState<WorldRegion[]>(defaultSaveData.worldRegions);
  const [currentRegionId, setCurrentRegionId] = useState(defaultSaveData.currentRegionId);
  const [visitedRegionIds, setVisitedRegionIds] = useState<string[]>(defaultSaveData.visitedRegionIds);
  const [regionTravelLog, setRegionTravelLog] = useState<RegionTravelLogEntry[]>(defaultSaveData.regionTravelLog);
  const [latestRegionTravelResult, setLatestRegionTravelResult] = useState<RegionTravelResult | null>(
    defaultSaveData.latestRegionTravelResult
  );
  const [factionQuestChains, setFactionQuestChains] = useState<FactionQuestChain[]>(defaultSaveData.factionQuestChains);
  const [regionTaskChains, setRegionTaskChains] = useState<RegionTaskChain[]>(defaultSaveData.regionTaskChains);
  const currentSeason = getSeasonForDay(currentDay);
  const fieldUpgradeEffects = getFieldUpgradeEffects(fieldUpgrades);
  const mainStoryChapters = getMainStoryChapterList();
  const currentMainStoryChapter = getMainStoryChapter(mainStory.currentChapterId);
  const currentMainStoryObjective = getCurrentMainStoryObjective(mainStory);
  const mainStoryChapterProgress = getMainStoryProgress(mainStory);
  

  useEffect(() => {
    const savedGame = localStorage.getItem(STORAGE_KEY);
    if (savedGame) {
      try {
        const parsedSave: SaveData = JSON.parse(savedGame);
        const loadedDay = parsedSave.currentDay ?? 1;
        const loadedHour = parsedSave.currentHour ?? 8;
        const loadedMinute = parsedSave.currentMinute ?? 0;
        const normalizedTownNpcs = ensureTownNpcRoster(parsedSave.townNpcs);
        setCurrentDay(loadedDay);
        setCurrentHour(loadedHour);
        setCurrentMinute(loadedMinute);
        setCurrentWeather(normalizeWeather(parsedSave.currentWeather, loadedDay));
        setCurrentLocation(parsedSave.currentLocation ?? "ranch");
        setPlayerData(normalizePlayerData(parsedSave.playerData));
        setHomeState(normalizeHomeState(parsedSave.homeState));
        setCreatures(parsedSave.creatures.map(normalizeCreature));
        setEggs(parsedSave.eggs.map(normalizeEgg));
        setBreedingSelection(parsedSave.breedingSelection);
        setTownStock(
          parsedSave.townStock?.map((entry) => ({
            ...entry,
            creature: normalizeCreature(entry.creature),
            price: calculateTownCreaturePrice(normalizeCreature(entry.creature)),
          })) ?? generateTownStock(loadedDay)
        );
        setTownQuests(
          ensureQuestBoardSize(
            parsedSave.townQuests ?? generateTownQuests(loadedDay),
            loadedDay,
            loadedHour,
            loadedMinute,
            10
          )
        );
        setTownNpcs(normalizedTownNpcs);
        setTownNpcQuests(
          ensureNpcQuestBoardSize(
            (parsedSave.townNpcQuests ?? generateTownNpcQuests(loadedDay)).map(normalizeTownNpcQuest),
            loadedDay,
            loadedHour,
            loadedMinute,
            3
          )
        );
        setNpcContractLedger(
          ensureNpcContractLedger(
            parsedSave.npcContractLedger,
            loadedDay,
            loadedHour,
            loadedMinute,
            getSeasonForDay(loadedDay),
            normalizedTownNpcs
          )
        );
        setNpcRelationshipEventFlags(normalizeNpcRelationshipEventFlags(parsedSave.npcRelationshipEventFlags));
        const normalizedEventLog = normalizeNpcRelationshipEventLog(parsedSave.npcRelationshipEventLog);
        setNpcRelationshipEventLog(normalizedEventLog);
        const normalizedLatestEvent = normalizeNpcRelationshipEventLog(
          parsedSave.latestNpcRelationshipEvent ? [parsedSave.latestNpcRelationshipEvent] : []
        )[0] ?? null;
        setLatestNpcRelationshipEvent(normalizedLatestEvent);
        setNpcContractCompletionHistory(
          normalizeNpcContractCompletionHistory(parsedSave.npcContractCompletionHistory)
        );
        const normalizedMiniChainProgress = normalizeNpcMiniChainProgressMap(parsedSave.npcMiniChainProgress);
        const normalizedRoutePerks = ensureNpcRoutePerksForMiniChainProgress(
          normalizeNpcRoutePerkState(parsedSave.npcRoutePerks),
          normalizedMiniChainProgress,
          loadedDay
        );
        setNpcGiftRecords(normalizeNpcGiftRecords(parsedSave.npcGiftRecords));
        setNpcInvitationRecords(normalizeNpcInvitationRecords(parsedSave.npcInvitationRecords));
        const normalizedLoverEvolutions = normalizeNpcLoverEvolutionState(parsedSave.npcLoverEvolutions);
        setNpcOutingCompletionLog(normalizeNpcOutingCompletionLog(parsedSave.npcOutingCompletionLog));
        setNpcMiniChainProgress(normalizedMiniChainProgress);
        setNpcRoutePerks(normalizedRoutePerks);
        setNpcLoverEvolutions(normalizedLoverEvolutions);
        setNpcExclusiveLoops(
          ensureNpcExclusiveLoopState(
            normalizeNpcExclusiveLoopState(parsedSave.npcExclusiveLoops),
            loadedDay,
            loadedHour,
            loadedMinute,
            normalizedLoverEvolutions
          )
        );
        setLatestNpcSocialResult(normalizeNpcSocialActionResult(parsedSave.latestNpcSocialResult));
        setPaidTaxMonths(Array.isArray(parsedSave.paidTaxMonths) ? parsedSave.paidTaxMonths : []);
        setTravelLog(parsedSave.travelLog ?? []);
        setInventory(normalizeInventory(parsedSave.inventory));
        setProduceQualityInventory(normalizeProduceQualityInventory(parsedSave.produceQualityInventory));
        setKnownRecipeIds(normalizeKnownRecipes(parsedSave.knownRecipeIds));
        const normalizedFieldUpgrades = normalizeFieldUpgrades(parsedSave.fieldUpgrades);
        setFieldUpgrades(normalizedFieldUpgrades);
        setFieldPlots(
          normalizeFieldPlots(
            parsedSave.fieldPlots,
            getFieldUpgradeEffects(normalizedFieldUpgrades).unlockedPlotCount
          )
        );
        const normalizedMainStory = normalizeMainStoryState(parsedSave.mainStory);
        setMainStory(normalizedMainStory);
        setAuthoredQuests(normalizeAuthoredQuests(parsedSave.authoredQuests, normalizedMainStory));
        setFactions(normalizeFactions(parsedSave.factions));
        const normalizedRegions = normalizeWorldRegions(parsedSave.worldRegions, normalizedMainStory);
        const normalizedCurrentRegionId = normalizeCurrentRegionId(parsedSave.currentRegionId, normalizedRegions);
        setWorldRegions(normalizedRegions);
        setCurrentRegionId(normalizedCurrentRegionId);
        setVisitedRegionIds(normalizeVisitedRegionIds(parsedSave.visitedRegionIds, normalizedCurrentRegionId));
        setRegionTravelLog(normalizeRegionTravelLog(parsedSave.regionTravelLog));
        setLatestRegionTravelResult(normalizeRegionTravelResult(parsedSave.latestRegionTravelResult));
        setFactionQuestChains(normalizeFactionQuestChains(parsedSave.factionQuestChains));
        setRegionTaskChains(normalizeRegionTaskChains(parsedSave.regionTaskChains));
      } catch (error) {
        console.error("Failed to load save data:", error);
      }
    }
    setHasLoaded(true);
  }, []);

useEffect(() => {
  if (!hasLoaded) return;

  const saveData: SaveData = {
    currentDay,
    currentHour,
    currentMinute,
    currentWeather,
    currentLocation,
    playerData,
    homeState,
    creatures,
    eggs,
    breedingSelection,
    townStock,
    townQuests,
    townNpcs,
    townNpcQuests,
    npcContractLedger,
    npcRelationshipEventFlags,
    npcRelationshipEventLog,
    latestNpcRelationshipEvent,
    npcContractCompletionHistory,
    npcGiftRecords,
    npcInvitationRecords,
    npcOutingCompletionLog,
    npcMiniChainProgress,
    npcRoutePerks,
    npcLoverEvolutions,
    npcExclusiveLoops,
    latestNpcSocialResult,
    paidTaxMonths,
    travelLog,
    inventory,
    produceQualityInventory,
    knownRecipeIds,
    fieldUpgrades,
    fieldPlots,
    mainStory,
    authoredQuests,
    factions,
    worldRegions,
    currentRegionId,
    visitedRegionIds,
    regionTravelLog,
    latestRegionTravelResult,
    factionQuestChains,
    regionTaskChains,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
}, [
  hasLoaded,
  currentDay,
  currentHour,
  currentMinute,
  currentWeather,
  currentLocation,
  playerData,
  homeState,
  creatures,
  eggs,
  breedingSelection,
  townStock,
  townQuests,
  townNpcs,
  townNpcQuests,
  npcContractLedger,
  npcRelationshipEventFlags,
  npcRelationshipEventLog,
  latestNpcRelationshipEvent,
  npcContractCompletionHistory,
  npcGiftRecords,
  npcInvitationRecords,
  npcOutingCompletionLog,
  npcMiniChainProgress,
  npcRoutePerks,
  npcLoverEvolutions,
  npcExclusiveLoops,
  latestNpcSocialResult,
  paidTaxMonths,
  travelLog,
  inventory,
  produceQualityInventory,
  knownRecipeIds,
  fieldUpgrades,
  fieldPlots,
  mainStory,
  authoredQuests,
  factions,
  worldRegions,
  currentRegionId,
  visitedRegionIds,
  regionTravelLog,
  latestRegionTravelResult,
  factionQuestChains,
  regionTaskChains,
]);

  function refreshNpcContractLedgerForClock(
    day: number,
    hour: number,
    minute: number,
    npcRoster: TownNpc[] = townNpcs
  ) {
    setNpcContractLedger((prev) =>
      ensureNpcContractLedger(prev, day, hour, minute, getSeasonForDay(day), npcRoster)
    );
    setNpcExclusiveLoops((prev) =>
      ensureNpcExclusiveLoopState(prev, day, hour, minute, npcLoverEvolutions)
    );
  }

  function applyAuthoredQuestReward(reward: AuthoredQuestReward) {
    if (reward.gold > 0) {
      setPlayerData((prev) => ({ ...prev, gold: prev.gold + reward.gold }));
    }

    if (reward.items.length > 0) {
      setInventory((prev) => {
        let next = { ...prev };
        reward.items.forEach((itemReward) => {
          next = addItemToInventory(next, itemReward.itemId, itemReward.quantity);
        });
        return next;
      });
    }

    if (reward.factionReputation.length > 0) {
      setFactions((prev) =>
        prev.map((faction) => {
          const factionReward = reward.factionReputation.find(
            (entry) => entry.factionId === faction.id
          );
          if (!factionReward) return faction;

          return {
            ...faction,
            reputation: faction.reputation + factionReward.amount,
            standing: factionReward.standing
              ? getStrongerFactionStanding(faction.standing, factionReward.standing)
              : faction.standing,
            status: faction.status === "locked" ? "available" : faction.status,
          };
        })
      );
    }

    if (reward.unlockRegions.length > 0) {
      setWorldRegions((prev) =>
        prev.map((region) => {
          if (!reward.unlockRegions.includes(region.id)) return region;

          return {
            ...region,
            status: "available",
            unlockCondition: "Unlocked through authored quest progression.",
            access: {
              ...region.access,
              requirement: "Available. The route is open for future authored assignments.",
            },
          };
        })
      );
    }
  }

  function recordAuthoredQuestObjectives(
    objectiveUpdates: Array<{ questId: string; objectiveId: string }>
  ) {
    if (objectiveUpdates.length === 0) return;

    const completedRewards: AuthoredQuestReward[] = [];
    const nextAuthoredQuests = authoredQuests.map((quest) => {
      const objectiveIds = objectiveUpdates
        .filter((update) => update.questId === quest.id)
        .map((update) => update.objectiveId);

      if (objectiveIds.length === 0 || quest.status === "locked" || quest.status === "completed") {
        return quest;
      }

      const nextObjectives = quest.objectives.map((objective) =>
        objectiveIds.includes(objective.id) ? { ...objective, completed: true } : objective
      );
      const didProgress = nextObjectives.some(
        (objective, index) => objective.completed && !quest.objectives[index]?.completed
      );
      const isComplete = nextObjectives.every((objective) => objective.completed);
      const nextStatus: WorldSupportStatus = isComplete ? "completed" : didProgress ? "active" : quest.status;

      if (isComplete) {
        completedRewards.push(quest.reward);
      }

      return {
        ...quest,
        objectives: nextObjectives,
        status: nextStatus,
      };
    });

    setAuthoredQuests(nextAuthoredQuests);
    completedRewards.forEach(applyAuthoredQuestReward);
  }

  function getDerivedMainStoryFlagsForChapter(chapterId: MainStoryChapterId): MainStoryObjectiveId[] {
    if (chapterId !== "chapter_7") return [];

    const brindlewoodChain = regionTaskChains.find((chain) => chain.chainId === "brindlewood-road-chain");
    const completedRoadSteps = new Set(brindlewoodChain?.completedStepIds ?? []);
    const hasRoadSupplies =
      homeState.foodStock > 0 ||
      homeState.wheatStock > 0 ||
      (inventory.wheat ?? 0) > 0 ||
      (inventory.bread ?? 0) > 0 ||
      (inventory.porridge ?? 0) > 0;
    const hasReadyCreature = creatures.some(
      (creature) => creature.happiness >= 45 && creature.breedingStamina > 0
    );
    const wayfarer = factions.find((faction) => faction.id === "wayfarer_dispatch");

    return [
      hasRoadSupplies ? "chapter7_prepare_road_supplies" : null,
      hasReadyCreature ? "chapter7_ready_creature_helper" : null,
      visitedRegionIds.includes("brindlewood_road") || currentRegionId === "brindlewood_road"
        ? "chapter7_travel_brindlewood"
        : null,
      completedRoadSteps.has("scout-road") ? "chapter7_scout_road" : null,
      completedRoadSteps.has("deliver-supplies") || completedRoadSteps.has("courier-check")
        ? "chapter7_complete_road_service"
        : null,
      completedRoadSteps.has("return-report") ? "chapter7_return_road_report" : null,
      completedRoadSteps.has("return-report") ||
      brindlewoodChain?.status === "completed" ||
      (wayfarer?.reputation ?? 0) >= 40
        ? "chapter7_wayfarer_recognition"
        : null,
    ].filter((flag): flag is MainStoryObjectiveId => Boolean(flag));
  }

  function grantMainStoryReward(reward: MainStoryReward) {
    if (reward.gold > 0) {
      setPlayerData((prev) => ({ ...prev, gold: prev.gold + reward.gold }));
    }

    if (reward.items.length > 0) {
      setInventory((prev) => {
        let next = { ...prev };
        reward.items.forEach((itemReward) => {
          next = addItemToInventory(next, itemReward.itemId, itemReward.quantity);
        });
        return next;
      });
    }

    if ((reward.factionReputation?.length ?? 0) > 0 || (reward.unlockRegions?.length ?? 0) > 0) {
      applyAuthoredQuestReward({
        gold: 0,
        items: [],
        factionReputation: reward.factionReputation ?? [],
        unlockRegions: reward.unlockRegions ?? [],
        summary: reward.unlockText,
      });
    }
  }

  function recordMainStoryFlags(flags: MainStoryObjectiveId[]) {
    const activeChapter = getMainStoryChapter(mainStory.currentChapterId);
    const activeChapterComplete = activeChapter.objectives.every(
      (objective) => mainStory.chapterProgressFlags[objective.completionFlag]
    );
    const chapter = activeChapterComplete && activeChapter.nextChapterId
      ? getMainStoryChapter(activeChapter.nextChapterId)
      : activeChapter;
    const derivedFlags = getDerivedMainStoryFlagsForChapter(chapter.id);
    const baseFlags = { ...mainStory.chapterProgressFlags };
    derivedFlags.forEach((flag) => {
      baseFlags[flag] = true;
    });
    const chapterFlags = new Set(chapter.objectives.map((objective) => objective.completionFlag));
    const requestedFlags = Array.from(new Set([...flags, ...derivedFlags]));
    const newFlags = requestedFlags.filter(
      (flag) => chapterFlags.has(flag) && !baseFlags[flag]
    );
    const derivedFlagsChanged = derivedFlags.some((flag) => !mainStory.chapterProgressFlags[flag]);
    if (newFlags.length === 0 && !derivedFlagsChanged) return;

    const nextFlags = { ...baseFlags };
    newFlags.forEach((flag) => {
      nextFlags[flag] = true;
    });
    const nextObjective =
      chapter.objectives.find((objective) => !nextFlags[objective.completionFlag]) ??
      chapter.objectives[chapter.objectives.length - 1];
    const chapterAlreadyLogged = mainStory.completedChapterLog.some(
      (entry) => entry.chapterId === chapter.id
    );
    const chapterComplete = chapter.objectives.every(
      (objective) => nextFlags[objective.completionFlag]
    );
    const shouldGrantReward = chapterComplete && !chapterAlreadyLogged;

    if (shouldGrantReward) {
      grantMainStoryReward(chapter.completionReward);
    }
    if (shouldGrantReward && chapter.id === "chapter_5") {
      setAuthoredQuests((prev) =>
        prev.map((quest) =>
          quest.id === "chapter-six-support-slot" && quest.status === "locked"
            ? { ...quest, status: "available" }
            : quest
        )
      );
    }
    const nextChapter = shouldGrantReward && chapter.nextChapterId
      ? getMainStoryChapter(chapter.nextChapterId)
      : chapter;
    const nextChapterObjective =
      shouldGrantReward && chapter.nextChapterId
        ? nextChapter.objectives.find((objective) => !nextFlags[objective.completionFlag]) ??
          nextChapter.objectives[0]
        : nextObjective;

    setMainStory({
      currentChapterId: nextChapter.id,
      currentObjectiveId: nextChapterObjective.id,
      chapterProgressFlags: nextFlags,
      completedChapterLog: shouldGrantReward
        ? [
            {
              chapterId: chapter.id,
              title: chapter.title,
              completedDay: currentDay,
              rewardTitle: chapter.completionReward.title,
            },
            ...mainStory.completedChapterLog,
          ]
        : mainStory.completedChapterLog,
      latestReward: shouldGrantReward ? chapter.completionReward : mainStory.latestReward,
    });
  }

  function recordMainStoryFlag(flag: MainStoryObjectiveId) {
    recordMainStoryFlags([flag]);
  }

  function acknowledgeStoryJournalSection(section: "story" | "quests" | "factions" | "world") {
    if (section === "story") {
      recordMainStoryFlags(["chapter6_wider_invitation", "chapter7_road_brief"]);
      return;
    }

    if (section === "quests") {
      recordMainStoryFlags(["chapter6_quest_log_review", "chapter7_road_brief"]);
      recordAuthoredQuestObjectives([
        { questId: "chapter-six-support-slot", objectiveId: "choose-first-outer-thread" },
      ]);
      return;
    }

    if (section === "factions") {
      recordMainStoryFlags(["chapter6_faction_signal", "chapter7_road_brief"]);
      return;
    }

    if (section === "world") {
      recordMainStoryFlags(["chapter6_world_route_confirmed", "chapter7_road_brief"]);
    }
  }

  function buildRegionRewardSummary(action: WorldRegionAction, rewardGoldOverride?: number) {
    const rewardGold = rewardGoldOverride ?? action.rewardGold;
    const parts = [
      rewardGold ? `${rewardGold} Gold` : "",
      ...(action.rewardItems ?? []).map((item) => `${ITEM_DATA[item.itemId]?.name ?? item.itemId} x${item.quantity}`),
      ...(action.factionReputation ?? []).map((reward) => `+${reward.amount} ${getWorldFactionName(reward.factionId)} reputation`),
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "No item reward";
  }

  function setRegionFailureResult(title: string, message: string, regionId?: string, actionId?: string) {
    setLatestRegionTravelResult({
      success: false,
      title,
      message,
      regionId,
      actionId,
      day: currentDay,
      hour: currentHour,
      minute: currentMinute,
    });
  }

  function recordRegionLogEntry(entry: Omit<RegionTravelLogEntry, "id">) {
    setRegionTravelLog((prev) => [{ ...entry, id: Date.now() }, ...prev].slice(0, 30));
  }

  function progressFactionQuestChains(stepRefs: string[] = []) {
    if (stepRefs.length === 0) return;

    setFactionQuestChains((prev) =>
      prev.map((chain) => {
        const stepIds = stepRefs
          .filter((ref) => ref.startsWith(`${chain.chainId}:`))
          .map((ref) => ref.split(":")[1])
          .filter((stepId) => chain.steps.some((step) => step.id === stepId));

        if (stepIds.length === 0 || chain.status === "locked" || chain.status === "completed") return chain;

        const completedStepIds = Array.from(new Set([...chain.completedStepIds, ...stepIds]));
        const currentStep = chain.steps.find((step) => !completedStepIds.includes(step.id)) ?? chain.steps[chain.steps.length - 1];

        return {
          ...chain,
          completedStepIds,
          currentStepId: currentStep.id,
          status: deriveChainStatus(completedStepIds.length, chain.steps.length, chain.status),
        };
      })
    );
  }

  function progressRegionTaskChains(stepRefs: string[] = []) {
    if (stepRefs.length === 0) return;

    setRegionTaskChains((prev) =>
      prev.map((chain) => {
        const stepIds = stepRefs
          .filter((ref) => ref.startsWith(`${chain.chainId}:`))
          .map((ref) => ref.split(":")[1])
          .filter((stepId) => chain.steps.some((step) => step.id === stepId));

        if (stepIds.length === 0 || chain.status === "locked" || chain.status === "completed") return chain;

        const completedStepIds = Array.from(new Set([...chain.completedStepIds, ...stepIds]));
        const currentStep = chain.steps.find((step) => !completedStepIds.includes(step.id)) ?? chain.steps[chain.steps.length - 1];

        return {
          ...chain,
          completedStepIds,
          currentStepId: currentStep.id,
          status: deriveChainStatus(completedStepIds.length, chain.steps.length, chain.status),
        };
      })
    );
  }

  function travelToRegion(regionId: string) {
    const region = worldRegions.find((entry) => entry.id === regionId);

    if (!region) {
      setRegionFailureResult("Region Not Found", "That destination is not on the current map.", regionId);
      return false;
    }

    if (region.status === "locked") {
      setRegionFailureResult("Route Locked", region.unlockCondition, region.id);
      return false;
    }

    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, region.access.travelMinutes);
    const message =
      region.id === currentRegionId
        ? `You recheck ${region.name}. The route is already under your boots.`
        : `You travel to ${region.name} by ${region.access.route}.`;

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
    setCurrentRegionId(region.id);
    setVisitedRegionIds((prev) => Array.from(new Set([...prev, region.id])));
    recordRegionLogEntry({
      regionId: region.id,
      regionName: region.name,
      actionTitle: "Travel",
      day: updatedClock.day,
      hour: updatedClock.hour,
      minute: updatedClock.minute,
      minutesSpent: region.access.travelMinutes,
      summary: message,
    });
    setLatestRegionTravelResult({
      success: true,
      title: `Arrived: ${region.name}`,
      message,
      regionId: region.id,
      day: updatedClock.day,
      hour: updatedClock.hour,
      minute: updatedClock.minute,
    });
    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "chapter6_world_route_confirmed",
      ...(region.id === "brindlewood_road" ? (["chapter7_travel_brindlewood"] as MainStoryObjectiveId[]) : []),
    ]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
    return true;
  }

  function performRegionAction(regionId: string, actionId: string) {
    const region = worldRegions.find((entry) => entry.id === regionId);
    const action = defaultWorldRegionActions.find((entry) => entry.regionId === regionId && entry.id === actionId);

    if (!region) {
      setRegionFailureResult("Region Not Found", "That destination is not on the current map.", regionId, actionId);
      return false;
    }

    if (region.status === "locked") {
      setRegionFailureResult("Route Locked", region.unlockCondition, region.id, actionId);
      return false;
    }

    if (!action) {
      setRegionFailureResult("Action Not Found", "That region action is not available.", region.id, actionId);
      return false;
    }

    if (currentRegionId !== region.id) {
      setRegionFailureResult("Travel Required", `Travel to ${region.name} before taking that action.`, region.id, action.id);
      return false;
    }

    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, action.timeCostMinutes);
    const usesRoadSupply = action.id === "brindlewood-deliver-supplies";
    const hasInventoryWheat = (inventory.wheat ?? 0) > 0;
    const hasHomeWheat = homeState.wheatStock > 0;
    const suppliedFromInventory = usesRoadSupply && hasInventoryWheat;
    const suppliedFromHome = usesRoadSupply && !hasInventoryWheat && hasHomeWheat;
    const supplyWasPacked = !usesRoadSupply || suppliedFromInventory || suppliedFromHome;
    const rewardGold = supplyWasPacked ? action.rewardGold ?? 0 : Math.floor((action.rewardGold ?? 0) / 2);
    const rewardSummary = buildRegionRewardSummary(action, rewardGold);
    const chainProgressSummary =
      (action.factionChainStepIds?.length ?? 0) > 0 || (action.regionTaskStepIds?.length ?? 0) > 0
        ? " Chain progress recorded."
        : "";
    const supplySummary = usesRoadSupply
      ? supplyWasPacked
        ? " Road supplies packed from wheat stock."
        : " You arrived light on supplies, so the Dispatch pays a reduced courier reward."
      : "";
    const message = `${action.outcome}${supplySummary}${rewardSummary !== "No item reward" ? ` Reward: ${rewardSummary}.` : ""}${chainProgressSummary}`;

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
    setVisitedRegionIds((prev) => Array.from(new Set([...prev, region.id])));

    if (rewardGold > 0) {
      setPlayerData((prev) => ({ ...prev, gold: prev.gold + rewardGold }));
    }

    if (suppliedFromInventory) {
      setInventory((prev) => removeItemFromInventory(prev, "wheat", 1));
    } else if (suppliedFromHome) {
      setHomeState((prev) => ({ ...prev, wheatStock: Math.max(0, prev.wheatStock - 1) }));
    }

    if ((action.rewardItems?.length ?? 0) > 0) {
      setInventory((prev) => {
        let next = { ...prev };
        action.rewardItems?.forEach((itemReward) => {
          next = addItemToInventory(next, itemReward.itemId, itemReward.quantity);
        });
        return next;
      });
    }

    if ((action.factionReputation?.length ?? 0) > 0) {
      applyAuthoredQuestReward({
        gold: 0,
        items: [],
        factionReputation: action.factionReputation ?? [],
        unlockRegions: [],
        summary: action.outcome,
      });
    }

    if ((action.authoredQuestObjectives?.length ?? 0) > 0) {
      recordAuthoredQuestObjectives(action.authoredQuestObjectives ?? []);
    }

    progressFactionQuestChains(action.factionChainStepIds);
    progressRegionTaskChains(action.regionTaskStepIds);
    recordMainStoryFlags(action.storyFlags ?? ["chapter6_world_route_confirmed"]);
    recordRegionLogEntry({
      regionId: region.id,
      regionName: region.name,
      actionId: action.id,
      actionTitle: action.title,
      day: updatedClock.day,
      hour: updatedClock.hour,
      minute: updatedClock.minute,
      minutesSpent: action.timeCostMinutes,
      summary: message,
    });
    setLatestRegionTravelResult({
      success: true,
      title: action.title,
      message,
      regionId: region.id,
      actionId: action.id,
      rewardSummary,
      day: updatedClock.day,
      hour: updatedClock.hour,
      minute: updatedClock.minute,
    });
    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
    return true;
  }

  function performAuthoredQuestAction(actionId: string) {
    const action = defaultAuthoredQuestProgressActions.find((entry) => entry.id === actionId);

    if (!action) {
      setLatestRegionTravelResult({
        success: false,
        title: "Quest Action Not Found",
        message: "That quest action is not available.",
        actionId,
        day: currentDay,
        hour: currentHour,
        minute: currentMinute,
      });
      return false;
    }

    const quest = authoredQuests.find((entry) => entry.id === action.questId);
    const objective = quest?.objectives.find((entry) => entry.id === action.objectiveId);

    if (!quest || !objective) {
      setLatestRegionTravelResult({
        success: false,
        title: "Quest Not Found",
        message: "That authored quest objective is not available.",
        actionId: action.id,
        day: currentDay,
        hour: currentHour,
        minute: currentMinute,
      });
      return false;
    }

    if (quest.status === "locked") {
      setLatestRegionTravelResult({
        success: false,
        title: "Quest Locked",
        message: quest.gate?.note ?? "Progress the story or region systems before reporting this work.",
        regionId: action.questId,
        actionId: action.id,
        day: currentDay,
        hour: currentHour,
        minute: currentMinute,
      });
      return false;
    }

    if (objective.completed || quest.status === "completed") {
      setLatestRegionTravelResult({
        success: false,
        title: "Already Registered",
        message: `${objective.title} is already complete.`,
        regionId: action.questId,
        actionId: action.id,
        day: currentDay,
        hour: currentHour,
        minute: currentMinute,
      });
      return false;
    }

    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, action.timeCostMinutes);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
    recordAuthoredQuestObjectives([{ questId: action.questId, objectiveId: action.objectiveId }]);
    recordMainStoryFlags(action.storyFlags ?? []);
    setLatestRegionTravelResult({
      success: true,
      title: action.title,
      message: action.outcome,
      regionId: action.questId,
      actionId: action.id,
      day: updatedClock.day,
      hour: updatedClock.hour,
      minute: updatedClock.minute,
    });
    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
    return true;
  }

  function dismissMainStoryReward() {
    setMainStory((prev) => ({ ...prev, latestReward: null }));
  }

  function nextDay() {
    const previousMonth = getMonthFromAbsoluteDay(currentDay);
    const newDay = currentDay + 1;
    const newMonth = getMonthFromAbsoluteDay(newDay);
    const nextWeather = generateWeatherForDay(newDay);
    const currentCreatureCount = creatures.length;
    const foodConsumed = Math.min(homeState.foodStock, currentCreatureCount);

    setCurrentDay(newDay);
    setCurrentHour(8);
    setCurrentMinute(0);
    setCurrentWeather(nextWeather);

    setEggs((prevEggs) =>
      prevEggs.map((egg) => ({
        ...egg,
        hatchDaysRemaining: egg.hatchDaysRemaining > 0 ? egg.hatchDaysRemaining - 1 : 0,
      }))
    );

    setCreatures((prevCreatures) =>
      prevCreatures.map((creature, index) => {
        const wasFed = index < foodConsumed;
        const happinessDelta = getHomeConditionHappinessDelta(homeState.cleanliness, wasFed);

        return {
          ...creature,
          happiness: clamp(creature.happiness + happinessDelta, 0, 100),
          breedingStamina: creature.maxBreedingStamina,
          breedingsToday: 0,
        };
      })
    );

    setPlayerData((prev) => ({
      ...prev,
      energy: Math.min(100, prev.energy + 25),
      happiness: clamp(
        prev.happiness + getHomeConditionHappinessDelta(homeState.cleanliness, homeState.foodStock > 0),
        0,
        100
      ),
    }));

    setHomeState((prev) => ({
      ...prev,
      cleanliness: Math.max(0, prev.cleanliness - 8),
      foodStock: Math.max(0, prev.foodStock - currentCreatureCount),
    }));

    setFieldPlots((prev) => advanceFieldPlotsByDay(prev, currentWeather, currentSeason, fieldUpgradeEffects));

    if (newMonth !== previousMonth && !paidTaxMonths.includes(previousMonth)) {
      const taxDue = getMonthlyTaxAmount(playerData, creatures, eggs);

      setPlayerData((prev) => ({
        ...prev,
        gold: Math.max(0, prev.gold - taxDue),
        energy: Math.max(0, prev.energy - 15),
        happiness: clamp(prev.happiness - 12, 0, 100),
      }));

      setCreatures((prev) =>
        prev.map((creature) => ({
          ...creature,
          happiness: clamp(creature.happiness - 8, 0, 100),
        }))
      );
    }

    setTownStock(generateTownStock(newDay));
    setTownQuests((prev) => ensureQuestBoardSize(prev, newDay, 8, 0, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, newDay, 8, 0, 3));
    refreshNpcContractLedgerForClock(newDay, 8, 0);
  }

  function hatchEgg(eggId: number): Creature | null {
    const eggToHatch = eggs.find((egg) => egg.id === eggId);
    if (!eggToHatch || eggToHatch.hatchDaysRemaining > 0) return null;

    let childSpeciesName = "Cat";
    if (eggToHatch.giver === "Player") childSpeciesName = eggToHatch.receiver;
    else childSpeciesName = Math.random() < 0.5 ? eggToHatch.giver : eggToHatch.receiver;

    const template = getCreatureTemplateByName(childSpeciesName);
    if (!template) return null;

    const giverCreature = eggToHatch.giverId ? creatures.find((c) => c.id === eggToHatch.giverId) ?? null : null;
    const receiverCreature = eggToHatch.receiverId ? creatures.find((c) => c.id === eggToHatch.receiverId) ?? null : null;
    const parentGenerations = [giverCreature?.generation ?? 1, receiverCreature?.generation ?? 1];
    const childGeneration = Math.max(...parentGenerations) + 1;

    const inbreedingRisk =
      eggToHatch.inbreedingRisk ??
      calculateInbreedingRisk(giverCreature, receiverCreature, eggToHatch.giverIsPlayer, eggToHatch.receiverIsPlayer);

    let newCreature = createCreatureFromTemplate(
      template,
      eggToHatch.giver,
      eggToHatch.receiver,
      eggToHatch.giverId,
      eggToHatch.receiverId,
      eggToHatch.giverIsPlayer,
      eggToHatch.receiverIsPlayer,
      currentDay,
      childGeneration,
      inbreedingRisk,
      giverCreature,
      receiverCreature,
      eggToHatch.quality ?? "normal"
    );

    newCreature = applyEggQualityBonuses(newCreature, eggToHatch.quality ?? "normal");
    setCreatures((prev) => [...prev, newCreature]);
    setEggs((prev) => prev.filter((egg) => egg.id !== eggId));
    recordMainStoryFlags([
      "chapter4_breeding_preparation",
      "chapter4_lineage_step",
      "chapter4_creature_growth_work",
      "chapter5_creature_backed_proof",
      "chapter6_creature_lineage_proof",
      "chapter7_ready_creature_helper",
    ]);
    return newCreature;
  }

  function getBarnCareMinutes(careType: "feed" | "groom" | "recovery", creature: Creature) {
  const quickEntry = getBestTraitEntry(creature, "quick");
  const domesticEntry = getBestTraitEntry(creature, "domestic");
  const calmEntry = getBestTraitEntry(creature, "calm");

  const quickBonus = quickEntry ? getTraitFlatBonus(quickEntry.grade, 8) : 0;
  const domesticBonus = domesticEntry ? getTraitFlatBonus(domesticEntry.grade, 6) : 0;
  const calmBonus = calmEntry ? getTraitFlatBonus(calmEntry.grade, 5) : 0;

  if (careType === "feed") {
    return Math.max(
      8,
      24 - Math.floor((creature.stats.intelligence + creature.skills.cleaning.level + domesticBonus + quickBonus) / 3)
    );
  }

  if (careType === "groom") {
    return Math.max(
      12,
      36 - Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cleaning.level + domesticBonus + quickBonus) / 3)
    );
  }

  return Math.max(
    20,
    70 - Math.floor((creature.stats.vitality + creature.stats.endurance + calmBonus) / 2)
  );
}

function getBarnCareStaminaCost(careType: "feed" | "groom" | "recovery", creature: Creature) {
  const sturdyDiscount = getSturdyTraitStaminaDiscount(creature);
  const calmEntry = getBestTraitEntry(creature, "calm");
  const calmDiscount = calmEntry ? getTraitFlatBonus(calmEntry.grade, 2) : 0;

  if (careType === "feed") {
    return Math.max(1, 4 - sturdyDiscount);
  }

  if (careType === "groom") {
    return Math.max(2, 8 - sturdyDiscount - calmDiscount);
  }

  return Math.max(0, 6 - calmDiscount);
}

function careForCreature(creatureId: number, careType: "feed" | "groom" | "recovery") {
  if (currentLocation !== "ranch" && currentLocation !== "home") return;

  const creature = creatures.find((c) => c.id === creatureId);
  if (!creature) return;

  const minutesSpent = getBarnCareMinutes(careType, creature);
  const staminaCost = getBarnCareStaminaCost(careType, creature);

  if (careType === "feed" && homeState.foodStock < 1) return;
  if (careType !== "recovery" && creature.breedingStamina < staminaCost) return;

  const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, minutesSpent);
  setCurrentDay(updatedClock.day);
  setCurrentHour(updatedClock.hour);
  setCurrentMinute(updatedClock.minute);

  if (careType === "feed") {
    setHomeState((prev) => ({ ...prev, foodStock: Math.max(0, prev.foodStock - 1) }));
  }

  if (careType === "groom") {
    setHomeState((prev) => ({ ...prev, cleanliness: Math.min(100, prev.cleanliness + 4) }));
  }

  setCreatures((prev) =>
    prev.map((c) => {
      if (c.id !== creatureId) return c;

      if (careType === "feed") {
        const updated = {
          ...c,
          breedingStamina: Math.max(0, c.breedingStamina - staminaCost + 8),
          happiness: clamp(c.happiness + 6, 0, 100),
        };
        return applyCreatureSkillXp(updated, "cleaning", 4);
      }

      if (careType === "groom") {
        const updated = {
          ...c,
          breedingStamina: Math.max(0, c.breedingStamina - staminaCost),
          happiness: clamp(c.happiness + 8, 0, 100),
        };
        return applyCreatureSkillXp(updated, "cleaning", 8);
      }

      const updated = {
        ...c,
        breedingStamina: Math.min(c.maxBreedingStamina, c.breedingStamina + 14),
        happiness: clamp(c.happiness + 4, 0, 100),
      };
      return updated;
    })
  );

  setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
  setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "ranch_creature_care",
      "chapter2_ranch_preparation",
      "chapter3_ranch_reputation_prep",
      "chapter4_creature_assessment",
      "chapter4_creature_growth_work",
      "chapter5_ranch_commission_prep",
      "chapter5_creature_backed_proof",
      "chapter6_creature_lineage_proof",
      "chapter7_ready_creature_helper",
      ...(careType === "recovery" ? (["chapter4_breeding_preparation"] as MainStoryObjectiveId[]) : []),
    ]);
}

  function breedCreatures() {
    const energyCost = 8;
    if (playerData.energy < energyCost) return;

    const giverIsPlayer = breedingSelection.giverType === "player";
    const receiverIsPlayer = breedingSelection.receiverType === "player";

    const giverCreature = breedingSelection.giverCreatureId
      ? creatures.find((c) => c.id === breedingSelection.giverCreatureId) ?? null
      : null;
    const receiverCreature = breedingSelection.receiverCreatureId
      ? creatures.find((c) => c.id === breedingSelection.receiverCreatureId) ?? null
      : null;

    const giverLabel = giverIsPlayer ? playerData.name : giverCreature?.nickname ?? "";
    const receiverLabel = receiverIsPlayer ? playerData.name : receiverCreature?.nickname ?? "";
    const giverSpecies = giverIsPlayer ? "Player" : giverCreature?.name ?? "";
    const receiverSpecies = receiverIsPlayer ? "Player" : receiverCreature?.name ?? "";

    if (!giverLabel || !receiverLabel || !giverSpecies || !receiverSpecies) return;
    if (!giverIsPlayer && !receiverIsPlayer && giverCreature && receiverCreature && giverCreature.id === receiverCreature.id) return;

    if (giverCreature) {
      if (
        giverCreature.breedingsToday >= giverCreature.dailyBreedingLimit ||
        giverCreature.breedingStamina < getBreedingStaminaCost(giverCreature)
      ) return;
    }

    if (receiverCreature) {
      if (
        receiverCreature.breedingsToday >= receiverCreature.dailyBreedingLimit ||
        receiverCreature.breedingStamina < getBreedingStaminaCost(receiverCreature)
      ) return;
    }

    const giverParticipant = getParticipantSnapshot(breedingSelection.giverType, giverCreature, playerData);
    const receiverParticipant = getParticipantSnapshot(breedingSelection.receiverType, receiverCreature, playerData);
    const refusalChance = getBreedingRefusalChance(giverParticipant, receiverParticipant, homeState);

    if (Math.random() < refusalChance) {
      const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, 10);
      setCurrentDay(updatedClock.day);
      setCurrentHour(updatedClock.hour);
      setCurrentMinute(updatedClock.minute);

      setPlayerData((prev) => {
        let updatedPlayer = { ...prev, energy: Math.max(0, prev.energy - 2) };
        if (breedingSelection.giverType === "player" || breedingSelection.receiverType === "player") {
          updatedPlayer = {
            ...updatedPlayer,
            happiness: clamp(updatedPlayer.happiness - 4, 0, 100),
            breedingCare: applySkillXpGain(updatedPlayer.breedingCare, 4),
          };
        }
        return updatedPlayer;
      });

      setCreatures((prev) =>
        prev.map((creature) => {
          if ((giverCreature && creature.id === giverCreature.id) || (receiverCreature && creature.id === receiverCreature.id)) {
            const updated = { ...creature, happiness: clamp(creature.happiness - 4, 0, 100) };
            return applyCreatureSkillXp(updated, "breedingCare", 4);
          }
          return creature;
        })
      );

      recordMainStoryFlags(["chapter4_breeding_preparation", "chapter5_creature_backed_proof", "chapter7_ready_creature_helper"]);
      return;
    }

    const baseInbreedingRisk = calculateInbreedingRisk(giverCreature, receiverCreature, giverIsPlayer, receiverIsPlayer);
    const inbreedingRisk = applyIntelligenceRiskMitigation(baseInbreedingRisk, giverCreature, receiverCreature);
    const minutesSpent = getBreedingSessionMinutes(giverCreature, receiverCreature, breedingSelection.giverType, breedingSelection.receiverType);
    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, minutesSpent);

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setPlayerData((prev) => {
      let updatedPlayer = { ...prev, energy: prev.energy - energyCost };
      if (breedingSelection.giverType === "player" || breedingSelection.receiverType === "player") {
        updatedPlayer = {
          ...updatedPlayer,
          happiness: clamp(updatedPlayer.happiness + 2, 0, 100),
          breedingCare: applySkillXpGain(updatedPlayer.breedingCare, 8),
        };
      }
      return updatedPlayer;
    });

    setCreatures((prev) =>
      prev.map((creature) => {
        if (giverCreature && creature.id === giverCreature.id) {
          return applyCreatureSkillXp(
            applyXpGain(
              {
                ...creature,
                happiness: clamp(creature.happiness + 2, 0, 100),
                breedingStamina: creature.breedingStamina - getBreedingStaminaCost(creature),
                breedingsToday: creature.breedingsToday + 1,
              },
              18
            ),
            "breedingCare",
            8
          );
        }

        if (receiverCreature && creature.id === receiverCreature.id) {
          return applyCreatureSkillXp(
            applyXpGain(
              {
                ...creature,
                happiness: clamp(creature.happiness + 2, 0, 100),
                breedingStamina: creature.breedingStamina - getBreedingStaminaCost(creature),
                breedingsToday: creature.breedingsToday + 1,
              },
              18
            ),
            "breedingCare",
            8
          );
        }

        return creature;
      })
    );

    const breedingStoryFlags: MainStoryObjectiveId[] = [
      "chapter4_breeding_preparation",
      "chapter4_creature_growth_work",
      "chapter5_creature_backed_proof",
      "chapter6_creature_lineage_proof",
    ];

    if (receiverIsPlayer) {
      recordMainStoryFlags(breedingStoryFlags);
      return;
    }

    const eggProductionChance = getEggProductionChance(giverParticipant, receiverParticipant, homeState);
    if (Math.random() > eggProductionChance) {
      recordMainStoryFlags(breedingStoryFlags);
      return;
    }

    const eggQuality = getEggQualityFromPairing(giverParticipant, receiverParticipant, homeState);
    const newEgg: Egg = {
      id: Date.now(),
      name: `${giverLabel} x ${receiverLabel} Egg`,
      parents: `${giverLabel} + ${receiverLabel}`,
      hatchDaysRemaining: 3,
      giver: giverSpecies,
      receiver: receiverSpecies,
      giverId: giverIsPlayer ? null : giverCreature?.id ?? null,
      receiverId: receiverIsPlayer ? null : receiverCreature?.id ?? null,
      giverIsPlayer,
      receiverIsPlayer,
      inbreedingRisk,
      quality: eggQuality,
    };

    setEggs((prev) => [...prev, newEgg]);
    recordMainStoryFlags([...breedingStoryFlags, "chapter4_lineage_step", "chapter7_ready_creature_helper"]);
  }

  function renameCreature(creatureId: number, newNickname: string) {
    const trimmedName = newNickname.trim();
    if (!trimmedName) return;

    setCreatures((prev) =>
      prev.map((creature) => (creature.id === creatureId ? { ...creature, nickname: trimmedName } : creature))
    );
  }

  function renamePlayer(newName: string) {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    setPlayerData((prev) => ({ ...prev, name: trimmedName }));
  }

  function purchaseTownCreature(stockEntryId: number) {
    const entry = townStock.find((item) => item.id === stockEntryId);
    if (!entry) return;
    if (playerData.gold < entry.price) return;

    const updatedClock = applyTownActionTimeCost(currentDay, currentHour, currentMinute, 20);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setPlayerData((prev) => ({ ...prev, gold: prev.gold - entry.price }));
    setCreatures((prev) => [...prev, entry.creature]);
    setTownStock((prev) => prev.filter((item) => item.id !== stockEntryId));
    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "chapter4_breeding_preparation",
      "chapter4_lineage_step",
      "chapter4_town_bloodline_proof",
      "chapter5_creature_backed_proof",
      "chapter5_regional_notice",
      "chapter6_creature_lineage_proof",
      "chapter7_ready_creature_helper",
    ]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
  }

  function submitCreatureToQuest(questId: number, creatureId: number) {
    const quest = townQuests.find((item) => item.id === questId);
    const creature = creatures.find((item) => item.id === creatureId);
    if (!quest || !creature || quest.completed) return;
    if (isQuestExpired(quest, currentDay, currentHour, currentMinute)) return;
    if (!doesCreatureMeetQuest(creature, quest)) return;

    const updatedClock = applyTownActionTimeCost(currentDay, currentHour, currentMinute, 30);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
    setCreatures((prev) => prev.filter((item) => item.id !== creatureId));
    setPlayerData((prev) => applyPlayerXpGain({ ...prev, gold: prev.gold + quest.rewardGold }, quest.rewardXp));

    setTownQuests((prev) => {
      const completedSet = prev.map((item) => (item.id === questId ? { ...item, completed: true } : item));
      return ensureQuestBoardSize(completedSet, updatedClock.day, updatedClock.hour, updatedClock.minute, 10);
    });
    recordMainStoryFlags([
      "chapter4_town_bloodline_proof",
      "chapter4_lineage_registered",
      "chapter5_regional_notice",
      "chapter5_town_submission",
      "chapter5_outside_acknowledgment",
      "chapter5_future_route",
      "chapter6_town_registration",
      "chapter6_faction_signal",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "town-route-proof" },
    ]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
  }

  function submitCreatureToNpcQuest(questId: number, creatureId: number) {
    const quest = townNpcQuests.find((item) => item.id === questId);
    const creature = creatures.find((item) => item.id === creatureId);
    if (!quest || !creature || quest.completed) return;
    if (quest.questType === "farming_delivery") return;
    if (isQuestExpired(quest, currentDay, currentHour, currentMinute)) return;
    if (!doesCreatureMeetQuest(creature, { title: quest.title, requirement: quest.requirement })) return;

    const updatedClock = applyTownActionTimeCost(currentDay, currentHour, currentMinute, 25);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setCreatures((prev) => prev.filter((item) => item.id !== creatureId));
    setPlayerData((prev) => applyPlayerXpGain({ ...prev, gold: prev.gold + quest.rewardGold }, quest.rewardXp));

    setTownNpcs((prev) =>
      prev.map((npc) => {
        if (npc.id !== quest.npcId) return npc;

        const newRelationship = clamp(npc.relationship + quest.relationshipGain, 0, 500);
        const nextClaimed = [...npc.rewardMilestonesClaimed];
        let bonusGold = 0;

        for (const milestone of [100, 200, 300, 400]) {
          if (newRelationship >= milestone && !nextClaimed.includes(milestone)) {
            nextClaimed.push(milestone);
            bonusGold += milestone === 100 ? 50 : milestone === 200 ? 120 : milestone === 300 ? 250 : 400;
          }
        }

        if (bonusGold > 0) {
          setPlayerData((prevPlayer) => ({ ...prevPlayer, gold: prevPlayer.gold + bonusGold }));
        }

        return {
          ...npc,
          relationship: newRelationship,
          rewardMilestonesClaimed: nextClaimed,
        };
      })
    );

    setTownNpcQuests((prev) => {
      const completedSet = prev.map((item) => (item.id === questId ? { ...item, completed: true } : item));
      return ensureNpcQuestBoardSize(completedSet, updatedClock.day, updatedClock.hour, updatedClock.minute, 3);
    });
    recordMainStoryFlags([
      "chapter2_town_delivery",
      "chapter2_social_followup",
      "chapter3_trusted_assignment",
      "chapter3_route_signal",
      "chapter3_reputation_registered",
      "chapter4_town_bloodline_proof",
      "chapter4_lineage_registered",
      "chapter5_regional_notice",
      "chapter5_town_submission",
      "chapter5_outside_acknowledgment",
      "chapter5_future_route",
      "chapter6_town_registration",
      "chapter6_faction_signal",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "town-route-proof" },
      { questId: "market-ring-introduction", objectiveId: "sell-under-market-eye" },
    ]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
  }

  function submitNpcFarmingRequest(questId: number) {
    const quest = townNpcQuests.find((item) => item.id === questId);
    if (!quest || quest.completed) return false;
    if (quest.questType !== "farming_delivery") return false;
    if (isQuestExpired(quest, currentDay, currentHour, currentMinute)) return false;

    const requestedItemId = quest.requestedItemId;
    const minimumQuality = quest.minimumQuality ?? "standard";
    const requiredQuantity = quest.requiredQuantity ?? 0;

    if (!requestedItemId || requiredQuantity <= 0) return false;

    const deliveryPlan = getQualityDeliveryPlan(requestedItemId, minimumQuality, requiredQuantity);
    if (!deliveryPlan) return false;
    const rewardItems = quest.rewardItems ?? [];
    const unlockedRecipeIds = rewardItems.flatMap((rewardItem) =>
      ITEM_DATA[rewardItem.itemId]?.category === "recipe_book"
        ? (ITEM_DATA[rewardItem.itemId]?.recipeUnlockIds ?? [])
        : []
    );

    const updatedClock = applyTownActionTimeCost(currentDay, currentHour, currentMinute, 20);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setInventory((prev) => removeItemFromInventory(prev, requestedItemId, requiredQuantity));
    setProduceQualityInventory((prev) => {
      let next = prev;
      for (const delivery of deliveryPlan) {
        next = removeQualityProduceFromInventory(next, requestedItemId, delivery.quality, delivery.quantity);
      }
      return next;
    });

    setPlayerData((prev) => applyPlayerXpGain({ ...prev, gold: prev.gold + quest.rewardGold }, quest.rewardXp));
    if (unlockedRecipeIds.length > 0) {
      setKnownRecipeIds((prevRecipes) => Array.from(new Set([...prevRecipes, ...unlockedRecipeIds])));
    }

    if (rewardItems.length > 0) {
      setInventory((prev) => {
        let next = { ...prev };
        rewardItems.forEach((reward) => {
          next = addItemToInventory(next, reward.itemId, Math.max(1, reward.quantity));
        });
        return next;
      });
    }

    setTownNpcs((prev) =>
      prev.map((npc) => {
        if (npc.id !== quest.npcId) return npc;

        const newRelationship = clamp(npc.relationship + quest.relationshipGain, 0, 500);
        const nextClaimed = [...npc.rewardMilestonesClaimed];
        let bonusGold = 0;

        for (const milestone of [100, 200, 300, 400]) {
          if (newRelationship >= milestone && !nextClaimed.includes(milestone)) {
            nextClaimed.push(milestone);
            bonusGold += milestone === 100 ? 50 : milestone === 200 ? 120 : milestone === 300 ? 250 : 400;
          }
        }

        if (bonusGold > 0) {
          setPlayerData((prevPlayer) => ({ ...prevPlayer, gold: prevPlayer.gold + bonusGold }));
        }

        return {
          ...npc,
          relationship: newRelationship,
          rewardMilestonesClaimed: nextClaimed,
        };
      })
    );

    setTownNpcQuests((prev) => {
      const completedSet = prev.map((item) => (item.id === questId ? { ...item, completed: true } : item));
      return ensureNpcQuestBoardSize(completedSet, updatedClock.day, updatedClock.hour, updatedClock.minute, 3);
    });
    recordMainStoryFlags([
      "chapter2_crafted_or_crated",
      "chapter2_town_delivery",
      "chapter2_social_followup",
      "chapter3_trusted_assignment",
      "chapter3_route_signal",
      "chapter3_reputation_registered",
      "chapter4_town_bloodline_proof",
      "chapter4_lineage_registered",
      "chapter5_regional_notice",
      "chapter5_town_submission",
      "chapter5_outside_acknowledgment",
      "chapter5_future_route",
      "chapter6_town_registration",
      "chapter6_faction_signal",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "town-route-proof" },
      { questId: "market-ring-introduction", objectiveId: "sell-under-market-eye" },
    ]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);

    return true;
  }

  function completeNpcContractOffer(offerId: string) {
    const offer = npcContractLedger.find((entry) => entry.id === offerId);
    if (!offer || offer.completed) return false;
    if (isNpcContractExpired(offer, currentDay, currentHour, currentMinute)) return false;

    const purchaseCostGold = offer.purchaseCostGold ?? 0;
    if (purchaseCostGold > playerData.gold) return false;

    const deliveryPlans = offer.requirements.map((requirement) => {
      const plan = getQualityDeliveryPlan(
        requirement.itemId,
        requirement.minimumQuality ?? "standard",
        requirement.quantity
      );
      return { requirement, plan };
    });

    if (deliveryPlans.some((entry) => !entry.plan)) return false;

    const rewardItems = offer.reward.items;
    const unlockedRecipeIds = rewardItems.flatMap((rewardItem) =>
      ITEM_DATA[rewardItem.itemId]?.category === "recipe_book"
        ? (ITEM_DATA[rewardItem.itemId]?.recipeUnlockIds ?? [])
        : []
    );
    const updatedClock = applyTownActionTimeCost(
      currentDay,
      currentHour,
      currentMinute,
      offer.requirements.length > 0 ? 20 : 10
    );
    const currentNpcRelationship = townNpcs.find((npc) => npc.id === offer.npcId)?.relationship ?? 0;
    const nextRelationshipLevel = buildNpcRelationshipStateFromPoints(
      offer.npcId,
      currentNpcRelationship + offer.reward.relationshipGain
    ).level;
    const nextCompletionHistory = recordNpcContractCompletion(
      npcContractCompletionHistory,
      offer.npcId,
      offer.kind
    );
    const unlockedRelationshipEvent = findEligibleNpcRelationshipEvent({
      npcId: offer.npcId,
      relationshipLevel: nextRelationshipLevel,
      offerId: offer.id,
      offerKind: offer.kind,
      currentDay: updatedClock.day,
      eventFlags: npcRelationshipEventFlags,
      completionHistory: nextCompletionHistory,
    });

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    for (const { requirement } of deliveryPlans) {
      setInventory((prev) => removeItemFromInventory(prev, requirement.itemId, requirement.quantity));
    }

    setProduceQualityInventory((prev) => {
      let next = prev;
      for (const { requirement, plan } of deliveryPlans) {
        for (const delivery of plan ?? []) {
          next = removeQualityProduceFromInventory(next, requirement.itemId, delivery.quality, delivery.quantity);
        }
      }
      return next;
    });

    setInventory((prev) => {
      let next = { ...prev };
      rewardItems.forEach((reward) => {
        next = addItemToInventory(next, reward.itemId, Math.max(1, reward.quantity));
      });
      return next;
    });

    setPlayerData((prev) =>
      applyPlayerXpGain(
        {
          ...prev,
          gold: prev.gold - purchaseCostGold + offer.reward.gold,
        },
        offer.reward.xp
      )
    );

    if (unlockedRecipeIds.length > 0) {
      setKnownRecipeIds((prevRecipes) => Array.from(new Set([...prevRecipes, ...unlockedRecipeIds])));
    }

    setNpcContractCompletionHistory(nextCompletionHistory);
    if (unlockedRelationshipEvent) {
      setNpcRelationshipEventFlags((prev) => Array.from(new Set([...prev, unlockedRelationshipEvent.id])));
      setNpcRelationshipEventLog((prev) => [unlockedRelationshipEvent, ...prev]);
      setLatestNpcRelationshipEvent(unlockedRelationshipEvent);
    }

    setTownNpcs((prev) =>
      prev.map((npc) => {
        if (npc.id !== offer.npcId) return npc;

        const newRelationship = clamp(npc.relationship + offer.reward.relationshipGain, 0, 500);
        const nextClaimed = [...npc.rewardMilestonesClaimed];
        let bonusGold = 0;

        for (const milestone of [100, 200, 300, 400]) {
          if (newRelationship >= milestone && !nextClaimed.includes(milestone)) {
            nextClaimed.push(milestone);
            bonusGold += milestone === 100 ? 50 : milestone === 200 ? 120 : milestone === 300 ? 250 : 400;
          }
        }

        if (bonusGold > 0) {
          setPlayerData((prevPlayer) => ({ ...prevPlayer, gold: prevPlayer.gold + bonusGold }));
        }

        return {
          ...npc,
          relationship: newRelationship,
          rewardMilestonesClaimed: nextClaimed,
        };
      })
    );

    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    setNpcContractLedger((prev) =>
      ensureNpcContractLedger(
        prev.map((entry) => (entry.id === offerId ? { ...entry, completed: true } : entry)),
        updatedClock.day,
        updatedClock.hour,
        updatedClock.minute,
        getSeasonForDay(updatedClock.day),
        townNpcs
      )
    );
    recordNpcMiniChainProgress(
      offer.npcId,
      getLedgerMiniChainActionKeys(offer.npcId, offer.kind),
      updatedClock.day
    );
    recordMainStoryFlags(
      offer.requirements.length > 0
        ? [
            "chapter2_crafted_or_crated",
            "chapter2_town_delivery",
            "chapter2_social_followup",
            "chapter3_trusted_assignment",
            "chapter3_route_signal",
            "chapter3_reputation_registered",
            "chapter4_town_bloodline_proof",
            "chapter4_lineage_registered",
            "chapter5_regional_notice",
            "chapter5_town_submission",
            "chapter5_outside_acknowledgment",
            "chapter5_future_route",
            "chapter6_town_registration",
            "chapter6_faction_signal",
          ]
        : [
            "chapter2_social_followup",
            "chapter3_route_signal",
            "chapter4_town_bloodline_proof",
            "chapter5_regional_notice",
            "chapter5_outside_acknowledgment",
            "chapter6_town_registration",
            "chapter6_faction_signal",
          ]
    );
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "town-route-proof" },
      ...(offer.requirements.length > 0
        ? [{ questId: "market-ring-introduction", objectiveId: "sell-under-market-eye" }]
        : []),
    ]);

    return true;
  }

  function addTownNpcRelationship(npcId: string, relationshipGain: number) {
    setTownNpcs((prev) =>
      prev.map((npc) => {
        if (npc.id !== npcId) return npc;

        const newRelationship = clamp(npc.relationship + relationshipGain, 0, 500);
        const nextClaimed = [...npc.rewardMilestonesClaimed];
        let bonusGold = 0;

        for (const milestone of [100, 200, 300, 400]) {
          if (newRelationship >= milestone && !nextClaimed.includes(milestone)) {
            nextClaimed.push(milestone);
            bonusGold += milestone === 100 ? 50 : milestone === 200 ? 120 : milestone === 300 ? 250 : 400;
          }
        }

        if (bonusGold > 0) {
          setPlayerData((prevPlayer) => ({ ...prevPlayer, gold: prevPlayer.gold + bonusGold }));
        }

        return {
          ...npc,
          relationship: newRelationship,
          rewardMilestonesClaimed: nextClaimed,
        };
      })
    );
  }

  function completeNpcExclusiveLoopOffer(offerId: string) {
    const offer = npcExclusiveLoops.offers.find((entry) => entry.id === offerId);
    if (!offer || offer.completed) return false;
    if (isNpcExclusiveLoopOfferExpired(offer, currentDay, currentHour, currentMinute)) return false;

    const deliveryPlans = offer.requirements.map((requirement) => {
      const plan = getQualityDeliveryPlan(
        requirement.itemId,
        requirement.minimumQuality ?? "standard",
        requirement.quantity
      );
      return { requirement, plan };
    });

    if (deliveryPlans.some((entry) => !entry.plan)) return false;

    const updatedClock = applyTownActionTimeCost(currentDay, currentHour, currentMinute, 25);

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    for (const { requirement } of deliveryPlans) {
      setInventory((prev) => removeItemFromInventory(prev, requirement.itemId, requirement.quantity));
    }

    setProduceQualityInventory((prev) => {
      let next = prev;
      for (const { requirement, plan } of deliveryPlans) {
        for (const delivery of plan ?? []) {
          next = removeQualityProduceFromInventory(next, requirement.itemId, delivery.quality, delivery.quantity);
        }
      }
      return next;
    });

    if (offer.reward.items.length > 0) {
      setInventory((prev) => {
        let next = { ...prev };
        offer.reward.items.forEach((reward) => {
          next = addItemToInventory(next, reward.itemId, Math.max(1, reward.quantity));
        });
        return next;
      });
    }

    setPlayerData((prev) =>
      applyPlayerXpGain(
        {
          ...prev,
          gold: prev.gold + offer.reward.gold,
        },
        offer.reward.xp
      )
    );
    const completionResult = recordNpcExclusiveLoopCompletion(npcExclusiveLoops, offerId, updatedClock.day);
    const bonusReward = completionResult.feedback?.bonusReward;
    if (bonusReward?.items.length) {
      setInventory((prev) => {
        let next = { ...prev };
        bonusReward.items.forEach((reward) => {
          next = addItemToInventory(next, reward.itemId, Math.max(1, reward.quantity));
        });
        return next;
      });
    }
    if (bonusReward && (bonusReward.gold > 0 || bonusReward.xp > 0)) {
      setPlayerData((prev) =>
        applyPlayerXpGain(
          {
            ...prev,
            gold: prev.gold + bonusReward.gold,
          },
          bonusReward.xp
        )
      );
    }

    addTownNpcRelationship(
      offer.npcId,
      offer.reward.relationshipGain + (bonusReward?.relationshipGain ?? 0)
    );
    const specialEvent = completionResult.feedback?.specialCompletion
      ? buildNpcExclusiveLoopSpecialEventUnlock(completionResult.feedback.specialCompletion, updatedClock.day)
      : null;
    if (specialEvent) {
      setNpcRelationshipEventFlags((prev) => Array.from(new Set([...prev, specialEvent.id])));
      setNpcRelationshipEventLog((prev) => {
        if (prev.some((event) => event.id === specialEvent.id)) return prev;
        return [specialEvent, ...prev];
      });
      setLatestNpcRelationshipEvent(specialEvent);
    }
    setNpcExclusiveLoops((prev) =>
      ensureNpcExclusiveLoopState(
        completionResult.state,
        updatedClock.day,
        updatedClock.hour,
        updatedClock.minute,
        npcLoverEvolutions
      )
    );
    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "chapter2_crafted_or_crated",
      "chapter2_town_delivery",
      "chapter2_social_followup",
      "chapter3_trusted_assignment",
      "chapter3_route_signal",
      "chapter3_reputation_registered",
      "chapter4_town_bloodline_proof",
      "chapter4_lineage_registered",
      "chapter5_regional_notice",
      "chapter5_town_submission",
      "chapter5_outside_acknowledgment",
      "chapter5_future_route",
      "chapter6_town_registration",
      "chapter6_faction_signal",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "town-route-proof" },
      { questId: "market-ring-introduction", objectiveId: "sell-under-market-eye" },
    ]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
    return true;
  }

  function applyNpcMiniChainRewards(milestones: NpcMiniChainMilestone[], day: number) {
    milestones.forEach((milestone) => {
      const routePerk = getNpcRoutePerkByMilestone(milestone.id);
      if (routePerk) {
        setNpcRoutePerks((prev) => unlockNpcRoutePerk(prev, routePerk.id, day, "mini_chain"));
      }

      if (milestone.relationshipGain !== 0) {
        addTownNpcRelationship(milestone.npcId, milestone.relationshipGain);
      }
      if ((milestone.goldReward ?? 0) > 0) {
        setPlayerData((prevPlayer) => ({ ...prevPlayer, gold: prevPlayer.gold + (milestone.goldReward ?? 0) }));
      }
      if ((milestone.itemRewards ?? []).length > 0) {
        setInventory((prev) => {
          let next = { ...prev };
          (milestone.itemRewards ?? []).forEach((reward) => {
            next = addItemToInventory(next, reward.itemId, reward.quantity);
          });
          return next;
        });
      }

      if (milestone.memoryEventId) {
        const routeEvent = buildNpcRouteRelationshipEventUnlock(milestone.id, day);
        if (routeEvent) {
          setNpcRelationshipEventFlags((prev) => Array.from(new Set([...prev, routeEvent.id])));
          setNpcRelationshipEventLog((prev) => {
            if (prev.some((event) => event.id === routeEvent.id)) return prev;
            return [routeEvent, ...prev];
          });
          setLatestNpcRelationshipEvent(routeEvent);
        }
      }
    });
  }

  function recordNpcMiniChainProgress(npcId: string, actionKeys: string[], day: number) {
    const result = recordNpcMiniChainActions(npcMiniChainProgress, npcId, actionKeys, day);
    setNpcMiniChainProgress(result.progress);
    applyNpcMiniChainRewards(result.unlockedMilestones, day);
    return result.unlockedMilestones;
  }

  function giveNpcGift(npcId: string, itemId: string) {
    const npc = townNpcs.find((entry) => entry.id === npcId);
    if (!npc) return false;
    if ((inventory[itemId] ?? 0) < 1) return false;
    if (!canGiveNpcGift(npcGiftRecords, npcId, currentDay)) return false;

    const dailyRecord = getNpcGiftDailyRecord(npcGiftRecords, npcId, currentDay);
    const reaction = getNpcGiftPreference(npcId, itemId);
    const relationshipGain = getNpcGiftRelationshipGain(reaction, dailyRecord.count);
    const updatedClock = applyTownActionTimeCost(currentDay, currentHour, currentMinute, 5);
    const nextRelationshipLevel = buildNpcRelationshipStateFromPoints(
      npcId,
      npc.relationship + relationshipGain
    ).level;
    const loverEvolutionUnlocked = getNpcLoverEvolutionsForNpc(npcId).some((evolution) =>
      hasNpcLoverEvolution(npcLoverEvolutions, evolution.id)
    );
    const itemName = ITEM_DATA[itemId]?.name ?? itemId;
    const result: NpcSocialActionResult = {
      success: true,
      kind: "gift",
      npcId,
      title: `${npc.name} ${reaction === "love" ? "loved" : reaction === "like" ? "liked" : reaction === "dislike" ? "did not love" : "accepted"} ${itemName}`,
      dialogue: buildNpcGiftDialogue(npcId, itemName, reaction, nextRelationshipLevel, loverEvolutionUnlocked),
      relationshipGain,
      day: updatedClock.day,
      itemId,
      reaction,
      timeCostMinutes: 5,
    };

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
    setInventory((prev) => removeItemFromInventory(prev, itemId, 1));
    setNpcGiftRecords((prev) => ({
      ...prev,
      [npcId]: {
        day: updatedClock.day,
        count: dailyRecord.day === updatedClock.day ? dailyRecord.count + 1 : 1,
      },
    }));
    addTownNpcRelationship(npcId, relationshipGain);
    const routeUnlocks = recordNpcMiniChainProgress(
      npcId,
      getGiftMiniChainActionKeys(npcId, reaction),
      updatedClock.day
    );
    setLatestNpcSocialResult(
      routeUnlocks.length > 0
        ? {
            ...result,
            title: `${result.title} - ${routeUnlocks[routeUnlocks.length - 1].title} unlocked`,
            dialogue: `${result.dialogue} ${routeUnlocks[routeUnlocks.length - 1].followUpFlavor}`,
          }
        : result
    );
    recordMainStoryFlags([
      "chapter2_crafted_or_crated",
      "chapter2_town_delivery",
      "chapter2_social_followup",
      "chapter3_route_signal",
      "chapter4_town_bloodline_proof",
      "chapter5_regional_notice",
      "chapter5_town_submission",
      "chapter5_outside_acknowledgment",
      "chapter5_future_route",
      "chapter6_town_registration",
      "chapter6_faction_signal",
    ]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
    return true;
  }

  function inviteNpc(npcId: string, invitationId: string) {
    const npc = townNpcs.find((entry) => entry.id === npcId);
    if (!npc) return false;

    const invitation = NPC_INVITATION_OPTIONS.find((option) => option.id === invitationId && option.npcId === npcId);
    if (!invitation) return false;
    if (npcInvitationRecords[invitation.id] === currentDay) return false;
    if (
      invitation.requiredMiniChainMilestoneId &&
      !npcMiniChainProgress[npcId]?.completedMilestoneIds.includes(invitation.requiredMiniChainMilestoneId)
    ) {
      return false;
    }
    if (invitation.requiredRoutePerkId && !hasNpcRoutePerk(npcRoutePerks, invitation.requiredRoutePerkId)) {
      return false;
    }

    const relationshipLevel = buildNpcRelationshipStateFromPoints(npcId, npc.relationship).level;
    if (relationshipLevel < invitation.requiredLevel) return false;

    const updatedClock = applyTownActionTimeCost(
      currentDay,
      currentHour,
      currentMinute,
      invitation.timeCostMinutes
    );
    const outingMemoryEvent = buildNpcOutingRelationshipEventUnlock(invitation.id, updatedClock.day);
    const outingCompletion = buildNpcOutingCompletion(
      invitation,
      updatedClock.day,
      outingMemoryEvent?.id
    );
    const itemRewards = invitation.itemRewards ?? [];
    const result: NpcSocialActionResult = {
      success: true,
      kind: "invitation",
      npcId,
      title: invitation.title,
      dialogue: `${invitation.sceneText} ${invitation.followUpFlavor}`,
      relationshipGain: invitation.relationshipGain,
      day: updatedClock.day,
      invitationId: invitation.id,
      timeCostMinutes: invitation.timeCostMinutes,
    };

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
    setNpcInvitationRecords((prev) => ({ ...prev, [invitation.id]: updatedClock.day }));
    setNpcOutingCompletionLog((prev) => [outingCompletion, ...prev]);
    addTownNpcRelationship(npcId, invitation.relationshipGain);
    if (itemRewards.length > 0) {
      setInventory((prev) => {
        let next = { ...prev };
        itemRewards.forEach((reward) => {
          next = addItemToInventory(next, reward.itemId, reward.quantity);
        });
        return next;
      });
    }
    if ((invitation.goldReward ?? 0) > 0) {
      setPlayerData((prev) => ({ ...prev, gold: prev.gold + (invitation.goldReward ?? 0) }));
    }
    if (outingMemoryEvent) {
      setNpcRelationshipEventFlags((prev) => Array.from(new Set([...prev, outingMemoryEvent.id])));
      setNpcRelationshipEventLog((prev) => {
        if (prev.some((event) => event.id === outingMemoryEvent.id)) return prev;
        return [outingMemoryEvent, ...prev];
      });
      setLatestNpcRelationshipEvent(outingMemoryEvent);
    }
    const payoffPerk = getNpcRoutePerkByInvitation(invitation.id);
    if (payoffPerk) {
      setNpcRoutePerks((prev) => unlockNpcRoutePerk(prev, payoffPerk.id, updatedClock.day, "payoff_invitation"));
    }
    const loverEvolution = getNpcLoverEvolutionByInvitation(invitation.id);
    if (loverEvolution) {
      const nextLoverEvolutions = unlockNpcLoverEvolution(
        npcLoverEvolutions,
        loverEvolution.id,
        updatedClock.day,
        invitation.id
      );
      setNpcLoverEvolutions(nextLoverEvolutions);
      setNpcExclusiveLoops((prev) =>
        ensureNpcExclusiveLoopState(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, nextLoverEvolutions)
      );
    }
    const routeUnlocks = recordNpcMiniChainProgress(
      npcId,
      getOutingMiniChainActionKeys(npcId, invitation.id),
      updatedClock.day
    );
    setLatestNpcSocialResult(
      routeUnlocks.length > 0
        ? {
            ...result,
            title: `${result.title} - ${routeUnlocks[routeUnlocks.length - 1].title} unlocked`,
            dialogue: `${result.dialogue} ${routeUnlocks[routeUnlocks.length - 1].followUpFlavor}`,
          }
        : result
    );
    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "chapter2_social_followup",
      "chapter3_route_signal",
      "chapter4_town_bloodline_proof",
      "chapter5_regional_notice",
      "chapter5_outside_acknowledgment",
      "chapter5_future_route",
      "chapter6_town_registration",
      "chapter6_faction_signal",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "town-route-proof" },
    ]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
    return true;
  }

  function payMonthlyTax() {
    const currentMonth = getMonthFromAbsoluteDay(currentDay);
    if (paidTaxMonths.includes(currentMonth)) return;

    const taxDue = getMonthlyTaxAmount(playerData, creatures, eggs);
    if (playerData.gold < taxDue) return;

    const updatedClock = applyTownActionTimeCost(currentDay, currentHour, currentMinute, 15);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setPlayerData((prev) => ({
      ...prev,
      gold: prev.gold - taxDue,
      happiness: clamp(prev.happiness + 2, 0, 100),
    }));
    setPaidTaxMonths((prev) => [...prev, currentMonth]);
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
  }

  function travelTo(destination: LocationName) {
    if (destination === currentLocation) return;

    const travelMinutes = getTravelMinutes(currentLocation, destination);
    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, travelMinutes);

    const newLogEntry: TravelLogEntry = {
      id: Date.now(),
      from: currentLocation,
      to: destination,
      day: updatedClock.day,
      hour: updatedClock.hour,
      minute: updatedClock.minute,
      minutesSpent: travelMinutes,
    };

    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
    setCurrentLocation(destination);
    setTravelLog((prev) => [newLogEntry, ...prev].slice(0, 20));
    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    if (destination === "town") {
      recordMainStoryFlag("first_town_visit");
    }
    if (destination === "guild_hall" || destination === "market") {
      recordMainStoryFlags([
        "chapter5_regional_notice",
        "chapter5_outside_acknowledgment",
        "chapter6_town_registration",
        "chapter6_faction_signal",
      ]);
      recordAuthoredQuestObjectives([
        { questId: "wayfarer-road-ledger", objectiveId: "town-route-proof" },
      ]);
    }
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
  }

  function cookMeal(creatureId: number) {
    if (currentLocation !== "home" && currentLocation !== "ranch") return;
    if (homeState.wheatStock < 1 && (inventory.wheat ?? 0) < 1) return;

    const creature = creatures.find((c) => c.id === creatureId);
    if (!creature) return;

    const speciesBonus = creature.name === "Cat" ? 2 : 0;
    const domesticEntry = getBestTraitEntry(creature, "domestic");
    const quickEntry = getBestTraitEntry(creature, "quick");
    const traitBonus =
      (domesticEntry ? getTraitFlatBonus(domesticEntry.grade, 3) : 0) +
      (quickEntry ? getTraitFlatBonus(quickEntry.grade, 2) : 0);

    const minutesSpent = Math.max(
      12,
      45 -
        Math.floor(
          (creature.stats.intelligence + creature.stats.speed + creature.skills.cooking.level + speciesBonus + traitBonus) / 2
        )
    );
    const staminaCost = Math.max(
      4,
      14 - Math.floor((creature.stats.endurance + creature.stats.vitality) / 6) - getSturdyTraitStaminaDiscount(creature)
    );
    const foodGain = Math.max(
      1,
      1 + Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cooking.level + speciesBonus + traitBonus) / 8)
    );

    if (creature.breedingStamina < staminaCost) return;

    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, minutesSpent);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    if (homeState.wheatStock > 0) {
      setHomeState((prev) => ({ ...prev, wheatStock: prev.wheatStock - 1, foodStock: prev.foodStock + foodGain }));
    } else {
      setHomeState((prev) => ({ ...prev, foodStock: prev.foodStock + foodGain }));
      setInventory((prev) => removeItemFromInventory(prev, "wheat", 1));
    }

    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== creatureId) return c;
        const updated = { ...c, breedingStamina: c.breedingStamina - staminaCost };
        return applyCreatureSkillXp(updated, "cooking", 12);
      })
    );

    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "ranch_creature_care",
      "chapter2_ranch_preparation",
      "chapter3_ranch_reputation_prep",
      "chapter4_creature_assessment",
      "chapter4_creature_growth_work",
      "chapter5_ranch_commission_prep",
      "chapter5_creature_backed_proof",
      "chapter6_route_goods",
      "chapter6_creature_lineage_proof",
      "chapter7_prepare_road_supplies",
      "chapter7_ready_creature_helper",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "road-ready-ranch-work" },
    ]);
  }

  function cleanHome(creatureId: number) {
    if (currentLocation !== "home" && currentLocation !== "ranch") return;

    const creature = creatures.find((c) => c.id === creatureId);
    if (!creature) return;

    const speciesBonus = creature.name === "Cat" ? 2 : 0;
    const domesticEntry = getBestTraitEntry(creature, "domestic");
    const quickEntry = getBestTraitEntry(creature, "quick");
    const traitBonus =
      (domesticEntry ? getTraitFlatBonus(domesticEntry.grade, 3) : 0) +
      (quickEntry ? getTraitFlatBonus(quickEntry.grade, 2) : 0);

    const minutesSpent = Math.max(
      8,
      35 -
        Math.floor(
          (creature.stats.intelligence + creature.stats.speed + creature.skills.cleaning.level + speciesBonus + traitBonus) / 2
        )
    );
    const staminaCost = Math.max(
      4,
      12 - Math.floor((creature.stats.endurance + creature.stats.speed) / 6) - getSturdyTraitStaminaDiscount(creature)
    );
    const cleanGain = Math.max(
      6,
      10 + Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cleaning.level + speciesBonus + traitBonus) / 3)
    );

    if (creature.breedingStamina < staminaCost) return;

    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, minutesSpent);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setHomeState((prev) => ({ ...prev, cleanliness: Math.min(100, prev.cleanliness + cleanGain) }));

    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== creatureId) return c;
        const updated = { ...c, breedingStamina: c.breedingStamina - staminaCost };
        return applyCreatureSkillXp(updated, "cleaning", 12);
      })
    );

    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "ranch_creature_care",
      "chapter2_ranch_preparation",
      "chapter3_ranch_reputation_prep",
      "chapter4_creature_assessment",
      "chapter4_creature_growth_work",
      "chapter5_ranch_commission_prep",
      "chapter5_creature_backed_proof",
      "chapter6_route_goods",
      "chapter6_creature_lineage_proof",
      "chapter7_prepare_road_supplies",
      "chapter7_ready_creature_helper",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "road-ready-ranch-work" },
    ]);
  }

  function workFields(creatureId: number) {
    if (currentLocation !== "home" && currentLocation !== "ranch") return;

    const creature = creatures.find((c) => c.id === creatureId);
    if (!creature) return;

    const readyPlot = fieldPlots.find((plot) => plot.cropId && plot.daysRemaining <= 0);
    if (!readyPlot) return;

    harvestPlot(readyPlot.id, creature.id);
  }

  function plantCrop(plotId: number, seedItemId: string, creatureId: number) {
    if (currentLocation !== "home" && currentLocation !== "ranch") return false;

    const plot = fieldPlots.find((item) => item.id === plotId);
    const creature = creatures.find((c) => c.id === creatureId);
    const fieldProfile = creature ? getFieldWorkProfile(creature) : null;
    const plantedPlot = fieldProfile
      ? createPlantedPlot(plotId, seedItemId, currentDay, currentSeason, currentWeather, fieldProfile)
      : null;

    if (!plot || plot.cropId || !creature || !fieldProfile || !plantedPlot) return false;
    if ((inventory[seedItemId] ?? 0) < 1) return false;

    const fieldCost = getFieldPlantingCost(fieldProfile);
    if (creature.breedingStamina < fieldCost.staminaCost) return false;

    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, fieldCost.minutesSpent);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setInventory((prev) => removeItemFromInventory(prev, seedItemId, 1));
    setFieldPlots((prev) => prev.map((item) => (item.id === plotId ? plantedPlot : item)));
    setLastFieldAction({
      id: Date.now(),
      action: "plant",
      plotId,
      day: currentDay,
      message: `${creature.nickname} tucked ${ITEM_DATA[seedItemId]?.name ?? seedItemId} into Plot ${plotId}.`,
      details: [
        `Grow time: ${plantedPlot.daysRemaining} day(s)`,
        `Season: ${currentSeason}`,
        `Weather: ${currentWeather}`,
        `${fieldProfile.specialtyLabel}: ${fieldProfile.specialtySummary}`,
        ...getFieldActionSpecializationNotes(fieldProfile, "plant"),
        `Stamina -${fieldCost.staminaCost}`,
        `Field Work XP +${fieldCost.xpGain}`,
      ],
    });
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== creatureId) return c;
        const updated = {
          ...c,
          breedingStamina: c.breedingStamina - fieldCost.staminaCost,
          happiness: clamp(c.happiness + 1, 0, 100),
        };
        return applyCreatureSkillXp(updated, "fieldWork", fieldCost.xpGain);
      })
    );

    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "ranch_creature_care",
      "first_seed_planted",
      "chapter2_creature_fieldwork",
      "chapter3_creature_proof",
      "chapter4_creature_growth_work",
      "chapter5_ranch_commission_prep",
      "chapter5_creature_backed_proof",
      "chapter6_route_goods",
      "chapter6_creature_lineage_proof",
      "chapter7_prepare_road_supplies",
      "chapter7_ready_creature_helper",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "road-ready-ranch-work" },
    ]);
    return true;
  }

  function waterPlot(plotId: number, creatureId: number) {
    if (currentLocation !== "home" && currentLocation !== "ranch") return false;

    const plot = fieldPlots.find((item) => item.id === plotId);
    const creature = creatures.find((c) => c.id === creatureId);
    const fieldProfile = creature ? getFieldWorkProfile(creature) : null;
    const weatherAlreadyWaters = currentWeather === "gentle_rain" || currentWeather === "storm";
    if (!plot || !plot.cropId || plot.daysRemaining <= 0 || plot.wateredToday || !creature || !fieldProfile) return false;
    if (weatherAlreadyWaters) return false;

    const fieldCost = applyWateringToolToCost(
      getFieldWateringCost(fieldProfile),
      fieldUpgradeEffects
    );
    if (creature.breedingStamina < fieldCost.staminaCost) return false;

    const updatedPlot = waterFieldPlot(plot, fieldProfile, currentWeather, fieldUpgradeEffects);
    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, fieldCost.minutesSpent);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setFieldPlots((prev) => prev.map((item) => (item.id === plotId ? updatedPlot : item)));
    setLastFieldAction({
      id: Date.now(),
      action: "water",
      plotId,
      day: currentDay,
      message: `${creature.nickname} watered Plot ${plotId} until the soil looked dark and eager.`,
      details: [
        `Quality: ${updatedPlot.quality}`,
        `Watered days: ${updatedPlot.wateredDays}`,
        `${fieldProfile.specialtyLabel}: ${fieldProfile.specialtySummary}`,
        ...getFieldActionSpecializationNotes(fieldProfile, "water"),
        `Stamina -${fieldCost.staminaCost}`,
        `Field Work XP +${fieldCost.xpGain}`,
      ],
    });
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== creatureId) return c;
        const updated = {
          ...c,
          breedingStamina: c.breedingStamina - fieldCost.staminaCost,
          happiness: clamp(c.happiness + 1, 0, 100),
        };
        return applyCreatureSkillXp(updated, "fieldWork", fieldCost.xpGain);
      })
    );

    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "chapter2_creature_fieldwork",
      "chapter3_creature_proof",
      "chapter4_creature_growth_work",
      "chapter5_ranch_commission_prep",
      "chapter5_creature_backed_proof",
      "chapter6_route_goods",
      "chapter6_creature_lineage_proof",
      "chapter7_prepare_road_supplies",
      "chapter7_ready_creature_helper",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "road-ready-ranch-work" },
    ]);
    return true;
  }

  function fertilizePlot(plotId: number, fertilizerItemId: string, creatureId: number) {
    if (currentLocation !== "home" && currentLocation !== "ranch") return false;

    const plot = fieldPlots.find((item) => item.id === plotId);
    const creature = creatures.find((c) => c.id === creatureId);
    const fertilizer = getFertilizerData(fertilizerItemId);
    const fieldProfile = creature ? getFieldWorkProfile(creature) : null;

    if (!plot || !plot.cropId || plot.daysRemaining <= 0 || plot.fertilizerItemId || !creature || !fertilizer || !fieldProfile) return false;
    if ((inventory[fertilizerItemId] ?? 0) < 1) return false;

    const fieldCost = getFieldFertilizingCost(fieldProfile);
    if (creature.breedingStamina < fieldCost.staminaCost) return false;

    const updatedPlot = fertilizeFieldPlot(plot, fertilizerItemId, fieldProfile);
    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, fieldCost.minutesSpent);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setInventory((prev) => removeItemFromInventory(prev, fertilizerItemId, 1));
    setFieldPlots((prev) => prev.map((item) => (item.id === plotId ? updatedPlot : item)));
    setLastFieldAction({
      id: Date.now(),
      action: "fertilize",
      plotId,
      day: currentDay,
      message: `${creature.nickname} worked ${fertilizer.label} into Plot ${plotId}.`,
      details: [
        `Quality: ${updatedPlot.quality}`,
        `Harvest yield +${updatedPlot.fertilizerYieldBonus}`,
        `${fieldProfile.specialtyLabel}: ${fieldProfile.specialtySummary}`,
        ...getFieldActionSpecializationNotes(fieldProfile, "fertilize"),
        `Stamina -${fieldCost.staminaCost}`,
        `Field Work XP +${fieldCost.xpGain}`,
      ],
    });
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== creatureId) return c;
        const updated = {
          ...c,
          breedingStamina: c.breedingStamina - fieldCost.staminaCost,
          happiness: clamp(c.happiness + 1, 0, 100),
        };
        return applyCreatureSkillXp(updated, "fieldWork", fieldCost.xpGain);
      })
    );

    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "chapter2_creature_fieldwork",
      "chapter3_creature_proof",
      "chapter4_creature_growth_work",
      "chapter5_ranch_commission_prep",
      "chapter5_creature_backed_proof",
      "chapter6_route_goods",
      "chapter6_creature_lineage_proof",
      "chapter7_prepare_road_supplies",
      "chapter7_ready_creature_helper",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "road-ready-ranch-work" },
    ]);
    return true;
  }

  function harvestPlot(plotId: number, creatureId: number) {
    if (currentLocation !== "home" && currentLocation !== "ranch") return false;

    const plot = fieldPlots.find((item) => item.id === plotId);
    const creature = creatures.find((c) => c.id === creatureId);
    const fieldProfile = creature ? getFieldWorkProfile(creature) : null;
    const produceItemId = plot ? getPlotProduceItemId(plot) : null;

    if (!plot || !plot.cropId || plot.daysRemaining > 0 || !creature || !fieldProfile || !produceItemId) return false;

    const fieldCost = getFieldHarvestCost(fieldProfile);
    if (creature.breedingStamina < fieldCost.staminaCost) return false;

    const harvestOutcome = getHarvestOutcome(
      plot,
      fieldProfile,
      currentWeather,
      currentSeason,
      fieldUpgradeEffects
    );
    const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, fieldCost.minutesSpent);
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);

    setInventory((prev) => addItemToInventory(prev, produceItemId, harvestOutcome.quantity));
    setProduceQualityInventory((prev) =>
      addQualityProduceToInventory(prev, produceItemId, harvestOutcome.quality, harvestOutcome.quantity)
    );
    setFieldPlots((prev) => prev.map((item) => (item.id === plotId ? createEmptyFieldPlot(plotId) : item)));
    setLastFieldAction({
      id: Date.now(),
      action: "harvest",
      plotId,
      day: currentDay,
      message: `${creature.nickname} harvested ${harvestOutcome.quantity} ${ITEM_DATA[produceItemId]?.name ?? produceItemId} from Plot ${plotId}.`,
      details: [
        `Quality: ${harvestOutcome.qualityInfo.label}`,
        `Value feel: x${harvestOutcome.valueMultiplier.toFixed(2)}`,
        `${fieldProfile.specialtyLabel}: ${fieldProfile.specialtySummary}`,
        ...getFieldActionSpecializationNotes(fieldProfile, "harvest"),
        ...(harvestOutcome.bonusSummary.length > 0 ? harvestOutcome.bonusSummary : ["Base yield only"]),
        `Stamina -${fieldCost.staminaCost}`,
        `Field Work XP +${fieldCost.xpGain}`,
      ],
    });
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== creatureId) return c;
        const updated = {
          ...c,
          breedingStamina: c.breedingStamina - fieldCost.staminaCost,
          happiness: clamp(c.happiness + 1, 0, 100),
        };
        return applyCreatureSkillXp(updated, "fieldWork", fieldCost.xpGain);
      })
    );

    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    recordMainStoryFlags([
      "chapter2_creature_fieldwork",
      "chapter2_first_harvest",
      "chapter3_creature_proof",
      "chapter3_produce_or_meal",
      "chapter4_creature_growth_work",
      "chapter5_ranch_commission_prep",
      "chapter5_creature_backed_proof",
      "chapter5_significant_goods",
      "chapter6_route_goods",
      "chapter6_creature_lineage_proof",
      "chapter7_prepare_road_supplies",
      "chapter7_ready_creature_helper",
    ]);
    recordAuthoredQuestObjectives([
      { questId: "wayfarer-road-ledger", objectiveId: "road-ready-ranch-work" },
      { questId: "market-ring-introduction", objectiveId: "prepare-private-stock" },
    ]);
    return true;
  }

function consumeInventoryItem(
  itemId: string,
  target: { type: "player" } | { type: "creature"; creatureId: number }
) {
  const item = ITEM_DATA[itemId];
  const quality = getBestOwnedItemQuality(itemId);
  const effects = getQualityAdjustedItemEffects(item?.edibleEffects, quality);

  if (!item || !effects) return false;
  if ((inventory[itemId] ?? 0) < 1) return false;
  if (!item.useTags.includes("edible")) return false;
  if (target.type === "creature" && !creatures.some((c) => c.id === target.creatureId)) return false;

  const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, 5);
  setCurrentDay(updatedClock.day);
  setCurrentHour(updatedClock.hour);
  setCurrentMinute(updatedClock.minute);

  setInventory((prev) => removeItemFromInventory(prev, itemId, 1));
  setProduceQualityInventory((prev) =>
    removeQualityProduceFromInventory(prev, itemId, quality, 1)
  );

  if (target.type === "player") {
    setPlayerData((prev) => ({
      ...prev,
      energy: clamp(prev.energy + (effects.energyRestore ?? 0), 0, 100),
      happiness: clamp(prev.happiness + (effects.happinessGain ?? 0), 0, 100),
    }));
  } else {
    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== target.creatureId) return c;

        return {
          ...c,
          breedingStamina: clamp(
            c.breedingStamina +
              (effects.staminaRestore ?? 0) +
              (effects.breedingRecoveryBoost ?? 0),
            0,
            c.maxBreedingStamina
          ),
          happiness: clamp(c.happiness + (effects.happinessGain ?? 0), 0, 100),
          stats: {
            ...c.stats,
            fertility: clamp(
              c.stats.fertility + (effects.fertilityBoost ?? 0),
              1,
              99
            ),
          },
        };
      })
    );
  }

  setTownQuests((prev) =>
    ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10)
  );
  setTownNpcQuests((prev) =>
    ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3)
  );

  return true;
}

function cookRecipe(recipeId: string, creatureId: number) {
  if (currentLocation !== "home" && currentLocation !== "ranch") return false;

  const recipe = RECIPE_DATA[recipeId];
  const creature = creatures.find((c) => c.id === creatureId);

  if (!recipe || !creature) return false;
  if (!knownRecipeIds.includes(recipeId)) return false;

  const speciesBonus = creature.name === "Cat" ? 2 : 0;
  const domesticEntry = getBestTraitEntry(creature, "domestic");
  const quickEntry = getBestTraitEntry(creature, "quick");
  const traitBonus =
    (domesticEntry ? getTraitFlatBonus(domesticEntry.grade, 3) : 0) +
    (quickEntry ? getTraitFlatBonus(quickEntry.grade, 2) : 0);

  const staminaCost = Math.max(
    4,
    12 - Math.floor((creature.stats.endurance + creature.stats.vitality) / 6) - getSturdyTraitStaminaDiscount(creature)
  );

  if (creature.breedingStamina < staminaCost) return false;

  const ingredientPlan = buildQualityIngredientPlan(
    produceQualityInventory,
    inventory,
    recipe.ingredients
  );

  if (!ingredientPlan) return false;

  const outputQuantity =
    recipe.outputQuantity +
    (hasNpcRoutePerk(npcRoutePerks, "tamsin_comfort_kitchen") && isTamsinComfortRecipe(recipeId) ? 1 : 0) +
    (hasNpcLoverEvolution(npcLoverEvolutions, "tamsin_hearth_devotion") && isTamsinComfortRecipe(recipeId) ? 1 : 0);

  const minutesSpent = Math.max(
    8,
    recipe.cookMinutes -
      Math.floor(
        (creature.stats.intelligence + creature.stats.speed + creature.skills.cooking.level + speciesBonus + traitBonus) / 2
      )
  );

  const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, minutesSpent);
  setCurrentDay(updatedClock.day);
  setCurrentHour(updatedClock.hour);
  setCurrentMinute(updatedClock.minute);

  setInventory((prev) => {
    let nextInventory = { ...prev };

    for (const ingredient of recipe.ingredients) {
      nextInventory = removeItemFromInventory(nextInventory, ingredient.itemId, ingredient.quantity);
    }

    nextInventory = addItemToInventory(nextInventory, recipe.outputItemId, outputQuantity);
    return nextInventory;
  });
  setProduceQualityInventory((prev) => {
    const withoutIngredients = removeQualityIngredientUses(prev, ingredientPlan.uses);
    return addQualityProduceToInventory(
      withoutIngredients,
      recipe.outputItemId,
      ingredientPlan.outputQuality,
      outputQuantity
    );
  });

  setCreatures((prev) =>
    prev.map((c) => {
      if (c.id !== creatureId) return c;

      const updated = {
        ...c,
        breedingStamina: c.breedingStamina - staminaCost,
        happiness: clamp(c.happiness + 2, 0, 100),
      };

      return applyCreatureSkillXp(updated, "cooking", 14);
    })
  );

  setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
  setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
  recordMainStoryFlags([
    "chapter2_ranch_preparation",
    "chapter2_crafted_or_crated",
    "chapter3_ranch_reputation_prep",
    "chapter3_creature_proof",
    "chapter3_produce_or_meal",
    "chapter4_creature_assessment",
    "chapter4_creature_growth_work",
    "chapter5_ranch_commission_prep",
    "chapter5_creature_backed_proof",
    "chapter5_significant_goods",
    "chapter6_route_goods",
    "chapter6_creature_lineage_proof",
    "chapter7_prepare_road_supplies",
    "chapter7_ready_creature_helper",
  ]);
  recordAuthoredQuestObjectives([
    { questId: "wayfarer-road-ledger", objectiveId: "road-ready-ranch-work" },
    { questId: "market-ring-introduction", objectiveId: "prepare-private-stock" },
  ]);
  return true;
}

  function getItemCount(itemId: string) {
  return inventory[itemId] ?? 0;
}

function getQualityItemCount(itemId: string, quality: CropQuality) {
  return getQualityProduceCount(produceQualityInventory, inventory, itemId, quality);
}

function getDeliverableQualities(minimumQuality: CropQuality) {
  const minimumIndex = CROP_QUALITY_ORDER.indexOf(minimumQuality);
  if (minimumIndex === -1) {
    return CROP_QUALITY_ORDER;
  }

  return CROP_QUALITY_ORDER.slice(minimumIndex);
}

function getQualityDeliveryPlan(
  itemId: string,
  minimumQuality: CropQuality,
  requiredQuantity: number
): Array<{ quality: CropQuality; quantity: number }> | null {
  const qualities = getDeliverableQualities(minimumQuality);
  let remaining = requiredQuantity;
  const plan: Array<{ quality: CropQuality; quantity: number }> = [];

  for (const quality of qualities) {
    if (remaining <= 0) break;
    const owned = getQualityItemCount(itemId, quality);
    if (owned <= 0) continue;

    const used = Math.min(owned, remaining);
    plan.push({ quality, quantity: used });
    remaining -= used;
  }

  return remaining > 0 ? null : plan;
}

function getBestOwnedItemQuality(itemId: string) {
  const descendingQualityOrder = [...CROP_QUALITY_ORDER].reverse();
  return (
    descendingQualityOrder.find((quality) => getQualityItemCount(itemId, quality) > 0) ??
    "standard"
  );
}

function getQualityItemEffectsForContext(itemId: string, quality: CropQuality) {
  return getQualityAdjustedItemEffects(ITEM_DATA[itemId]?.edibleEffects, quality);
}

function getQualitySellQuoteForContext(
  itemId: string,
  quality: CropQuality,
  quantity: number,
  demandMultiplier: number
) {
  const routeDemandMultiplier = hasNpcRoutePerk(npcRoutePerks, "selene_private_premium")
    ? demandMultiplier + (hasNpcLoverEvolution(npcLoverEvolutions, "selene_elite_buyer_status") ? 0.15 : 0.08)
    : demandMultiplier;
  return getQualitySellQuote(itemId, quality, quantity, routeDemandMultiplier);
}

function sellQualityProduce(
  itemId: string,
  quality: CropQuality,
  quantity: number,
  demandMultiplier: number
) {
  const available = getQualityItemCount(itemId, quality);
  const quote = getQualitySellQuoteForContext(itemId, quality, quantity, demandMultiplier);

  if (!quote || available < quantity) return false;

  const updatedClock = applyTownActionTimeCost(currentDay, currentHour, currentMinute, 5);
  setCurrentDay(updatedClock.day);
  setCurrentHour(updatedClock.hour);
  setCurrentMinute(updatedClock.minute);
  setPlayerData((prev) => ({ ...prev, gold: prev.gold + quote.totalValue }));
  setInventory((prev) => removeItemFromInventory(prev, itemId, quantity));
  setProduceQualityInventory((prev) =>
    removeQualityProduceFromInventory(prev, itemId, quality, quantity)
  );
  setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
  setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
  recordMainStoryFlags([
    "chapter2_crafted_or_crated",
    "chapter2_town_delivery",
    "chapter2_social_followup",
    "chapter3_trusted_assignment",
    "chapter3_route_signal",
    "chapter3_reputation_registered",
    "chapter4_town_bloodline_proof",
    "chapter4_lineage_registered",
    "chapter5_significant_goods",
    "chapter5_regional_notice",
    "chapter5_town_submission",
    "chapter5_outside_acknowledgment",
    "chapter5_future_route",
    "chapter6_town_registration",
    "chapter6_faction_signal",
  ]);
  recordAuthoredQuestObjectives([
    { questId: "wayfarer-road-ledger", objectiveId: "town-route-proof" },
    { questId: "market-ring-introduction", objectiveId: "sell-under-market-eye" },
  ]);
  refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
  return true;
}

function purchaseFieldUpgrade(upgradeId: FieldUpgradeId) {
  const upgrade = FIELD_UPGRADE_DATA[upgradeId];
  if (!upgrade || !canPurchaseFieldUpgrade(fieldUpgrades, upgradeId, playerData.gold)) return false;

  const nextFieldUpgrades = unlockFieldUpgrade(fieldUpgrades, upgradeId);
  const nextEffects = getFieldUpgradeEffects(nextFieldUpgrades);
  const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, 20);

  setCurrentDay(updatedClock.day);
  setCurrentHour(updatedClock.hour);
  setCurrentMinute(updatedClock.minute);
  setPlayerData((prev) => ({ ...prev, gold: prev.gold - upgrade.cost }));
  setFieldUpgrades(nextFieldUpgrades);
  setFieldPlots((prev) => normalizeFieldPlots(prev, nextEffects.unlockedPlotCount));
  setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
  setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
  refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
  return true;
}

function knowsRecipe(recipeId: string) {
  return knownRecipeIds.includes(recipeId);
}

function purchaseMarketItem(itemId: string, price: number) {
  const item = ITEM_DATA[itemId];
  if (!item) return false;
  if (playerData.gold < price) return false;
  const shouldAdvanceTime = price > 0;

  if (item.category === "recipe_book") {
    const unlocks = item.recipeUnlockIds ?? [];
    const newRecipes = unlocks.filter((recipeId) => !knownRecipeIds.includes(recipeId));
    if (newRecipes.length === 0) return false;

    const updatedClock = shouldAdvanceTime
      ? applyTownActionTimeCost(currentDay, currentHour, currentMinute, 10)
      : { day: currentDay, hour: currentHour, minute: currentMinute };

    if (shouldAdvanceTime) {
      setCurrentDay(updatedClock.day);
      setCurrentHour(updatedClock.hour);
      setCurrentMinute(updatedClock.minute);
    }

    setPlayerData((prev) => ({ ...prev, gold: prev.gold - price }));
    setKnownRecipeIds((prev) => Array.from(new Set([...prev, ...newRecipes])));
    if (shouldAdvanceTime) {
      setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
      setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
      refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
    }
    return true;
  }

  const updatedClock = shouldAdvanceTime
    ? applyTownActionTimeCost(currentDay, currentHour, currentMinute, 10)
    : { day: currentDay, hour: currentHour, minute: currentMinute };

  if (shouldAdvanceTime) {
    setCurrentDay(updatedClock.day);
    setCurrentHour(updatedClock.hour);
    setCurrentMinute(updatedClock.minute);
  }

  const routeBonusQuantity =
    shouldAdvanceTime &&
    hasNpcRoutePerk(npcRoutePerks, "maris_greenhouse_touch") &&
    (item.category === "seed" || item.useTags.includes("fertilizer"))
      ? hasNpcLoverEvolution(npcLoverEvolutions, "maris_greenhouse_bond") ? 2 : 1
      : 0;

  setPlayerData((prev) => ({ ...prev, gold: prev.gold - price }));
  setInventory((prev) => addItemToInventory(prev, itemId, 1 + routeBonusQuantity));
  if (shouldAdvanceTime) {
    setTownQuests((prev) => ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10));
    setTownNpcQuests((prev) => ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3));
    if (item.category === "seed") {
      recordMainStoryFlag("maris_seed_guidance");
    }
    refreshNpcContractLedgerForClock(updatedClock.day, updatedClock.hour, updatedClock.minute);
  }
  return true;
}

  function resetGame() {
    const freshHorse = normalizeCreature({
      ...horseTemplate,
      id: 1,
      nickname: generateNickname("Horse"),
      inbreedingRisk: "none",
      inbredTrait: "none",
      inbredTraitSeverity: "none",
    });

    const freshCat = normalizeCreature({
      ...catTemplate,
      id: 2,
      nickname: generateNickname("Cat"),
      inbreedingRisk: "none",
      inbredTrait: "none",
      inbredTraitSeverity: "none",
    });

    setCurrentDay(1);
    setCurrentHour(8);
    setCurrentMinute(0);
    setCurrentWeather(generateWeatherForDay(1));
    setCurrentLocation("ranch");
    setPlayerData(defaultPlayerData);
    setHomeState(defaultHomeState);
    setCreatures([freshHorse, freshCat]);
    setEggs([
      {
        id: 1,
        name: `${freshHorse.nickname} x ${freshCat.nickname} Egg`,
        parents: `${freshHorse.nickname} + ${freshCat.nickname}`,
        hatchDaysRemaining: 3,
        giver: "Horse",
        receiver: "Cat",
        giverId: freshHorse.id,
        receiverId: freshCat.id,
        giverIsPlayer: false,
        receiverIsPlayer: false,
        inbreedingRisk: "none",
        quality: "normal",
      },
    ]);
    setBreedingSelection({
      giverType: "creature",
      giverCreatureId: freshHorse.id,
      receiverType: "creature",
      receiverCreatureId: freshCat.id,
    });
    setTownStock(generateTownStock(1));
    setTownQuests(generateTownQuests(1));
    setTownNpcs(defaultTownNpcs);
    setTownNpcQuests(generateTownNpcQuests(1));
    setNpcContractLedger(ensureNpcContractLedger([], 1, 8, 0, getSeasonForDay(1), defaultTownNpcs));
    setNpcRelationshipEventFlags([]);
    setNpcRelationshipEventLog([]);
    setLatestNpcRelationshipEvent(null);
    setNpcContractCompletionHistory({});
    setNpcGiftRecords({});
    setNpcInvitationRecords({});
    setNpcOutingCompletionLog([]);
    setNpcMiniChainProgress({});
    setNpcRoutePerks({});
    setNpcLoverEvolutions({});
    setNpcExclusiveLoops({ offers: [], completionCounts: {}, lastCompletedDay: {}, streaks: {}, specialCompletions: [] });
    setLatestNpcSocialResult(null);
    setPaidTaxMonths([]);
    setTravelLog([]);
    setInventory(defaultInventory);
    setProduceQualityInventory({});
    setKnownRecipeIds(defaultKnownRecipeIds);
    setFieldUpgrades(DEFAULT_FIELD_UPGRADES);
    setFieldPlots(createDefaultFieldPlots());
    setMainStory(defaultMainStoryState);
    setAuthoredQuests(defaultAuthoredQuests);
    setFactions(defaultFactions);
    setWorldRegions(defaultWorldRegions);
    setCurrentRegionId("homefold_valley");
    setVisitedRegionIds(["homefold_valley"]);
    setRegionTravelLog([]);
    setLatestRegionTravelResult(null);
    setFactionQuestChains(defaultFactionQuestChains);
    setRegionTaskChains(defaultRegionTaskChains);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <GameContext.Provider
      value={{
        currentDay,
        currentHour,
        currentMinute,
        currentWeather,
        currentSeason,
        currentLocation,
        playerData,
        homeState,
        creatures,
        eggs,
        breedingSelection,
        townStock,
        townQuests,
        townNpcs,
        townNpcQuests,
        npcContractLedger,
        npcRelationshipEventFlags,
        npcRelationshipEventLog,
        latestNpcRelationshipEvent,
        npcContractCompletionHistory,
        npcGiftRecords,
        npcInvitationRecords,
        npcOutingCompletionLog,
        npcMiniChainProgress,
        npcRoutePerks,
        npcLoverEvolutions,
        npcExclusiveLoops,
        latestNpcSocialResult,
        paidTaxMonths,
        travelLog,
        fieldPlots,
        fieldUpgrades,
        lastFieldAction,
        mainStory,
        mainStoryChapters,
        currentMainStoryChapter,
        currentMainStoryObjective,
        mainStoryChapterProgress,
        authoredQuests,
        factions,
        worldRegions,
        currentRegionId,
        visitedRegionIds,
        regionTravelLog,
        latestRegionTravelResult,
        worldRegionActions: defaultWorldRegionActions,
        authoredQuestProgressActions: defaultAuthoredQuestProgressActions,
        factionQuestChains,
        regionTaskChains,
        dismissMainStoryReward,
        acknowledgeStoryJournalSection,
        travelToRegion,
        performRegionAction,
        performAuthoredQuestAction,
        nextDay,
        hatchEgg,
        breedCreatures,
        setBreedingSelection,
        resetGame,
        renameCreature,
        renamePlayer,
        purchaseTownCreature,
        submitCreatureToQuest,
        submitCreatureToNpcQuest,
        submitNpcFarmingRequest,
        completeNpcContractOffer,
        completeNpcExclusiveLoopOffer,
        giveNpcGift,
        inviteNpc,
        payMonthlyTax,
        travelTo,
        cookMeal,
        cleanHome,
        workFields,
        plantCrop,
        waterPlot,
        fertilizePlot,
        harvestPlot,
        purchaseFieldUpgrade,
        cookRecipe,
        careForCreature,
        inventory,
        produceQualityInventory,
        knownRecipeIds,
        purchaseMarketItem,
        getItemCount,
        getQualityItemCount,
        getQualitySellQuote: getQualitySellQuoteForContext,
        sellQualityProduce,
        getQualityItemEffects: getQualityItemEffectsForContext,
        knowsRecipe,
        consumeInventoryItem,        
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame must be used inside a GameProvider");
  }

  return context;
}
