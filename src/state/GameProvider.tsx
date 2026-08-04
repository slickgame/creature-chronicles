"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBattleOutfitterDailySummaryItems, purchaseBattleOutfitterItem } from "@/data/battleOutfitter";
import { releaseOrDonateCreature } from "@/data/collection";
import { buildDailyReportBundle, serializeDailyReportBundle } from "@/data/dailyReport";
import { MVP_VERSION } from "@/data/gameConstants";
import { acceptGuildContract, donateCreatureToGuildContract, ensureCurrentGuildState } from "@/data/guild";
import {
  collectTrainingWithCareer,
  hatchEggWithAtelierLegacy,
  performBreedingAttemptWithCareers,
  processLegacyRanchJobs,
} from "@/data/legacyGameTransactions";
import { buyMarketListing, ensureCurrentMarketState, rerollMarketListings } from "@/data/market";
import { advanceNurseryDay, removeEgg } from "@/data/nursery";
import { assignCreatureToRanchJob } from "@/data/ranchJobs";
import { getRanchUpgradeEffects, purchaseRanchUpgrade, repairRanchDamage } from "@/data/ranchUpgrades";
import { applyStarterGoalRewards } from "@/data/starterGoals";
import { purchaseSupplyDepotItem, useSupplyDepotEnergySnack } from "@/data/supplyDepot";
import { ensureMonthlyTaxPosted, processMonthlyTaxes } from "@/data/taxes";
import {
  getTrainingReturnSummaryItems,
  getTrainingUnavailableReason,
  purchaseTrainingUpgrade,
  startTrainingGroundsAssignment,
} from "@/data/trainingGrounds";
import { grantDevGuildPoints, grantGuildIntroBonus, purchaseTownUpgrade } from "@/data/upgrades";
import { formatGameDate } from "@/lib/formatters";
import {
  createNewGameSave,
  deleteSaveSlot,
  findFirstEmptySlot,
  getActiveSaveId,
  loadAllSaves,
  loadSaveFromSlot,
  saveGameToSlot,
  setActiveSaveId,
} from "@/lib/save/localSave";
import type { BattleOutfitterResult } from "@/data/battleOutfitter";
import type { TrainingFocusId, TrainingResult, TrainingUpgradeId } from "@/data/trainingGrounds";
import type { BreedingAttemptRecord } from "@/types/breeding";
import type { CreatureFamily, CreatureRecord, CreatureStatKey } from "@/types/creature";
import type { CreatureId, EggId } from "@/types/ids";
import type { RanchJobAssignmentResult, RanchJobId, RanchJobResult } from "@/types/ranchJobs";
import type { RanchUpgradeId, RanchUpgradePurchaseResult } from "@/types/ranchUpgrades";
import type { DayState, GameSave } from "@/types/save";
import type { TownUpgradeId, TownUpgradePurchaseResult } from "@/types/upgrades";

export type AppScreen =
  | "main-menu" | "ranch-hub" | "habitat" | "breeding" | "nursery" | "town"
  | "market" | "supply-depot" | "egg-atelier" | "training-grounds"
  | "battle-outfitter" | "battle-debug" | "guild-hall" | "collection"
  | "ranch-office" | "ranch-jobs" | "dev-tools";

export type DayAdvanceResult = {
  previousDateLabel: string;
  nextDateLabel: string;
  summaryItems: string[];
  ranchJobResults: RanchJobResult[];
};

type GameContextValue = {
  version: string;
  buildPhase: string;
  appScreen: AppScreen;
  activeHabitatFamily: CreatureFamily | null;
  currentSave: GameSave | null;
  saveSlots: Array<GameSave | null>;
  isHydrated: boolean;
  createNewGame: (playerName: string, preferredSlot?: number) => GameSave;
  loadGame: (slotIndex: number) => GameSave | null;
  deleteGame: (slotIndex: number) => void;
  refreshSaveSlots: () => void;
  goToMainMenu: () => void;
  exitRunToMainMenu: () => void;
  goToRanch: () => void;
  goToHabitat: (family: CreatureFamily) => void;
  goToBreeding: () => void;
  goToNursery: () => void;
  goToTown: () => void;
  goToMarket: () => void;
  goToSupplyDepot: () => void;
  goToEggAtelier: () => void;
  goToTrainingGrounds: () => void;
  goToBattleOutfitter: () => void;
  goToBattleDebug: () => void;
  goToGuildHall: () => void;
  goToCollection: () => void;
  goToRanchOffice: () => void;
  goToRanchJobs: () => void;
  goToDevTools: () => void;
  saveCurrentGame: (nextSave: GameSave) => GameSave;
  advanceDay: () => DayAdvanceResult | null;
  renameCreature: (creatureId: CreatureId, nickname: string) => void;
  feedCreature: (creatureId: CreatureId) => void;
  toggleCreatureLock: (creatureId: CreatureId) => void;
  releaseCreature: (creatureId: CreatureId) => string;
  donateCreature: (creatureId: CreatureId) => string;
  attemptBreeding: (giverId: string, receiverId: string) => BreedingAttemptRecord | null;
  hatchReadyEgg: (eggId: EggId, nickname?: string) => CreatureRecord | null;
  removeNurseryEgg: (eggId: EggId, mode: "release" | "donate") => void;
  buyMarketCreature: (listingId: string) => string;
  rerollMarket: () => string;
  buySupplyDepotItem: (itemId: string) => string;
  useEnergySnack: () => string;
  buyBattleOutfitterItem: (itemId: string) => BattleOutfitterResult;
  trainCreature: (creatureId: CreatureId, focusId: TrainingFocusId, targetStatKey?: CreatureStatKey) => TrainingResult;
  collectTrainingCreature: (creatureId: CreatureId) => TrainingResult;
  purchaseTrainingGroundsUpgrade: (upgradeId: TrainingUpgradeId) => TrainingResult;
  acceptGuildRequest: (contractId: string) => string;
  donateCreatureToGuild: (contractId: string, creatureId: CreatureId) => string;
  buyTownUpgrade: (upgradeId: TownUpgradeId) => TownUpgradePurchaseResult;
  buyRanchUpgrade: (upgradeId: RanchUpgradeId) => RanchUpgradePurchaseResult;
  repairRanch: () => RanchUpgradePurchaseResult;
  assignRanchJob: (jobId: RanchJobId, creatureId: CreatureId | null) => RanchJobAssignmentResult;
  claimGuildIntroBonus: () => TownUpgradePurchaseResult;
  addDevGuildPoints: () => TownUpgradePurchaseResult;
};

const GameContext = createContext<GameContextValue | null>(null);
const WEEKDAYS: DayState["weekday"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getNextDayState(dayState: DayState): DayState {
  const current = WEEKDAYS.indexOf(dayState.weekday);
  const next = (current + 1) % WEEKDAYS.length;
  return {
    dayNumber: dayState.dayNumber + 1,
    weekday: WEEKDAYS[next],
    month: dayState.dayOfMonth >= 30 ? dayState.month + 1 : dayState.month,
    dayOfMonth: dayState.dayOfMonth >= 30 ? 1 : dayState.dayOfMonth + 1,
    weekNumber: next === 0 ? dayState.weekNumber + 1 : dayState.weekNumber,
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [appScreen, setAppScreen] = useState<AppScreen>("main-menu");
  const [activeHabitatFamily, setActiveHabitatFamily] = useState<CreatureFamily | null>(null);
  const [saveSlots, setSaveSlots] = useState<Array<GameSave | null>>([null, null, null]);
  const [currentSave, setCurrentSave] = useState<GameSave | null>(null);

  const refreshSaveSlots = useCallback(() => {
    const saves = loadAllSaves();
    setSaveSlots(saves);
    setCurrentSave(saves.find((save) => save?.saveId === getActiveSaveId()) ?? null);
  }, []);

  useEffect(() => { refreshSaveSlots(); setIsHydrated(true); }, [refreshSaveSlots]);

  const saveCurrentGame = useCallback((nextSave: GameSave) => {
    const saved = saveGameToSlot(applyStarterGoalRewards(ensureMonthlyTaxPosted(nextSave)));
    setActiveSaveId(saved.saveId);
    setCurrentSave(saved);
    setSaveSlots(loadAllSaves());
    return saved;
  }, []);

  const createNewGame = useCallback((playerName: string, preferredSlot?: number) => {
    const saved = saveCurrentGame(createNewGameSave(playerName, preferredSlot ?? findFirstEmptySlot() ?? 0));
    setActiveHabitatFamily(null); setAppScreen("ranch-hub"); return saved;
  }, [saveCurrentGame]);

  const loadGame = useCallback((slotIndex: number) => {
    const save = loadSaveFromSlot(slotIndex); if (!save) return null;
    setActiveSaveId(save.saveId); setCurrentSave(save); setSaveSlots(loadAllSaves());
    setActiveHabitatFamily(null); setAppScreen("ranch-hub"); return save;
  }, []);

  const deleteGame = useCallback((slotIndex: number) => { deleteSaveSlot(slotIndex); refreshSaveSlots(); }, [refreshSaveSlots]);
  const navigate = useCallback((screen: AppScreen) => { setActiveHabitatFamily(null); setAppScreen(screen); }, []);
  const goToMainMenu = useCallback(() => navigate("main-menu"), [navigate]);
  const exitRunToMainMenu = useCallback(() => { setActiveSaveId(""); setCurrentSave(null); setSaveSlots(loadAllSaves()); navigate("main-menu"); }, [navigate]);
  const goToRanch = useCallback(() => navigate("ranch-hub"), [navigate]);
  const goToRanchOffice = useCallback(() => navigate("ranch-office"), [navigate]);
  const goToRanchJobs = useCallback(() => navigate("ranch-jobs"), [navigate]);
  const goToDevTools = useCallback(() => navigate("dev-tools"), [navigate]);
  const goToSupplyDepot = useCallback(() => navigate("supply-depot"), [navigate]);
  const goToEggAtelier = useCallback(() => navigate("egg-atelier"), [navigate]);
  const goToTrainingGrounds = useCallback(() => navigate("training-grounds"), [navigate]);
  const goToBattleOutfitter = useCallback(() => navigate("battle-outfitter"), [navigate]);
  const goToBattleDebug = useCallback(() => navigate("battle-debug"), [navigate]);
  const goToBreeding = useCallback(() => navigate("breeding"), [navigate]);
  const goToNursery = useCallback(() => navigate("nursery"), [navigate]);
  const goToCollection = useCallback(() => navigate("collection"), [navigate]);
  const goToTown = useCallback(() => navigate("town"), [navigate]);
  const goToHabitat = useCallback((family: CreatureFamily) => { setActiveHabitatFamily(family); setAppScreen("habitat"); }, []);

  const goToMarket = useCallback(() => {
    if (currentSave) { const synced = ensureCurrentMarketState(currentSave); if (synced !== currentSave) saveCurrentGame(synced); }
    navigate("market");
  }, [currentSave, navigate, saveCurrentGame]);

  const goToGuildHall = useCallback(() => {
    if (currentSave) { const synced = ensureCurrentGuildState(currentSave); if (synced !== currentSave) saveCurrentGame(synced); }
    navigate("guild-hall");
  }, [currentSave, navigate, saveCurrentGame]);

  const renameCreature = useCallback((creatureId: CreatureId, nickname: string) => {
    if (!currentSave || !nickname.trim()) return;
    saveCurrentGame({ ...currentSave, creatures: (currentSave.creatures ?? []).map((c) => c.creatureId === creatureId ? { ...c, nickname: nickname.trim() } : c), flags: { ...currentSave.flags, m3CreatureRenamed: true, m9RenamePolishUsed: true } });
  }, [currentSave, saveCurrentGame]);

  const feedCreature = useCallback((creatureId: CreatureId) => {
    if (!currentSave || getTrainingUnavailableReason(currentSave, creatureId)) return;
    saveCurrentGame({ ...currentSave, creatures: (currentSave.creatures ?? []).map((c) => c.creatureId === creatureId ? { ...c, affection: Math.min(100, c.affection + 5), energy: Math.min(c.maxEnergy, c.energy + 10) } : c), flags: { ...currentSave.flags, m3CreatureFed: true } });
  }, [currentSave, saveCurrentGame]);

  const toggleCreatureLock = useCallback((creatureId: CreatureId) => {
    if (!currentSave) return;
    saveCurrentGame({ ...currentSave, creatures: (currentSave.creatures ?? []).map((c) => c.creatureId === creatureId ? { ...c, isLocked: !c.isLocked } : c), flags: { ...currentSave.flags, m9CreatureLockUsed: true } });
  }, [currentSave, saveCurrentGame]);

  const releaseCreature = useCallback((creatureId: CreatureId) => { if (!currentSave) return "No active save."; const r = releaseOrDonateCreature(currentSave, creatureId, "release"); saveCurrentGame(r.save); return r.message; }, [currentSave, saveCurrentGame]);
  const donateCreature = useCallback((creatureId: CreatureId) => { if (!currentSave) return "No active save."; const r = releaseOrDonateCreature(currentSave, creatureId, "donate"); saveCurrentGame(r.save); return r.message; }, [currentSave, saveCurrentGame]);

  const attemptBreeding = useCallback((giverId: string, receiverId: string) => {
    if (!currentSave) return null;
    const result = performBreedingAttemptWithCareers(currentSave, giverId, receiverId);
    if (!result) return null;
    saveCurrentGame(result.save); return result.attempt;
  }, [currentSave, saveCurrentGame]);

  const hatchReadyEgg = useCallback((eggId: EggId, nickname?: string) => {
    if (!currentSave) return null;
    const result = hatchEggWithAtelierLegacy(currentSave, eggId, nickname);
    if (!result) return null;
    saveCurrentGame(result.save); return result.creature;
  }, [currentSave, saveCurrentGame]);

  const removeNurseryEgg = useCallback((eggId: EggId, mode: "release" | "donate") => { if (currentSave) saveCurrentGame(removeEgg(currentSave, eggId, mode)); }, [currentSave, saveCurrentGame]);
  const buyMarketCreature = useCallback((listingId: string) => { if (!currentSave) return "No active save."; const r = buyMarketListing(currentSave, listingId); saveCurrentGame(r.save); return r.message; }, [currentSave, saveCurrentGame]);
  const rerollMarket = useCallback(() => { if (!currentSave) return "No active save."; const r = rerollMarketListings(currentSave); saveCurrentGame(r.save); return r.message; }, [currentSave, saveCurrentGame]);
  const buySupplyDepotItem = useCallback((itemId: string) => { if (!currentSave) return "No active save."; const r = purchaseSupplyDepotItem(currentSave, itemId); saveCurrentGame(r.save); return r.message; }, [currentSave, saveCurrentGame]);
  const useEnergySnack = useCallback(() => { if (!currentSave) return "No active save."; const r = useSupplyDepotEnergySnack(currentSave); if (r.ok) saveCurrentGame(r.save); return r.message; }, [currentSave, saveCurrentGame]);
  const buyBattleOutfitterItem = useCallback((itemId: string) => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const r = purchaseBattleOutfitterItem(currentSave, itemId); if (r.ok) saveCurrentGame(r.save); return r; }, [currentSave, saveCurrentGame]);

  const trainCreature = useCallback((creatureId: CreatureId, focusId: TrainingFocusId, targetStatKey?: CreatureStatKey) => currentSave ? startTrainingGroundsAssignment(currentSave, creatureId, focusId, targetStatKey) : ({ save: currentSave as unknown as GameSave, ok: false, message: "No active save." }), [currentSave]);
  const collectTrainingCreature = useCallback((creatureId: CreatureId) => {
    if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." };
    const result = collectTrainingWithCareer(currentSave, creatureId);
    if (result.ok) saveCurrentGame(result.save);
    return result;
  }, [currentSave, saveCurrentGame]);
  const purchaseTrainingGroundsUpgrade = useCallback((upgradeId: TrainingUpgradeId) => currentSave ? purchaseTrainingUpgrade(currentSave, upgradeId) : ({ save: currentSave as unknown as GameSave, ok: false, message: "No active save." }), [currentSave]);

  const acceptGuildRequest = useCallback((contractId: string) => { if (!currentSave) return "No active save."; const r = acceptGuildContract(currentSave, contractId); saveCurrentGame(r.save); return r.message; }, [currentSave, saveCurrentGame]);
  const donateCreatureToGuild = useCallback((contractId: string, creatureId: CreatureId) => { if (!currentSave) return "No active save."; const r = donateCreatureToGuildContract(currentSave, contractId, creatureId); saveCurrentGame(r.save); return r.message; }, [currentSave, saveCurrentGame]);
  const buyTownUpgrade = useCallback((upgradeId: TownUpgradeId) => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const r = purchaseTownUpgrade(currentSave, upgradeId); saveCurrentGame(ensureCurrentGuildState(ensureCurrentMarketState(r.save))); return r; }, [currentSave, saveCurrentGame]);
  const buyRanchUpgrade = useCallback((upgradeId: RanchUpgradeId) => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const r = purchaseRanchUpgrade(currentSave, upgradeId); saveCurrentGame(r.save); return r; }, [currentSave, saveCurrentGame]);
  const repairRanch = useCallback(() => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const r = repairRanchDamage(currentSave); if (r.ok) saveCurrentGame(r.save); return r; }, [currentSave, saveCurrentGame]);
  const assignRanchJob = useCallback((jobId: RanchJobId, creatureId: CreatureId | null) => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const r = assignCreatureToRanchJob(currentSave, jobId, creatureId); if (r.ok) saveCurrentGame(r.save); return r; }, [currentSave, saveCurrentGame]);
  const claimGuildIntroBonus = useCallback(() => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const r = grantGuildIntroBonus(currentSave); saveCurrentGame(r.save); return r; }, [currentSave, saveCurrentGame]);
  const addDevGuildPoints = useCallback(() => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const r = grantDevGuildPoints(currentSave); saveCurrentGame(r.save); return r; }, [currentSave, saveCurrentGame]);

  const advanceDay = useCallback((): DayAdvanceResult | null => {
    if (!currentSave) return null;
    const previousDateLabel = formatGameDate(currentSave.dayState.weekday, currentSave.dayState.month, currentSave.dayState.dayOfMonth);
    const nextDayState = getNextDayState(currentSave.dayState);
    const nextDateLabel = formatGameDate(nextDayState.weekday, nextDayState.month, nextDayState.dayOfMonth);
    const recovery = getRanchUpgradeEffects(currentSave);
    const restoredSave: GameSave = {
      ...currentSave,
      updatedAt: new Date().toISOString(),
      dayState: nextDayState,
      player: { ...currentSave.player, hearts: currentSave.player.maxHearts ?? 4 },
      currencies: { ...currentSave.currencies, energy: currentSave.currencies.maxEnergy },
      creatures: (currentSave.creatures ?? []).map((creature) => getTrainingUnavailableReason(currentSave, creature.creatureId) ? creature : ({ ...creature, energy: creature.maxEnergy + recovery.sleepCreatureEnergyBonus, hearts: creature.maxHearts ?? 4, affection: Math.min(100, creature.affection + recovery.sleepAffectionBonus) })),
      breeding: currentSave.breeding,
      pregnancies: currentSave.pregnancies ?? [],
      eggs: currentSave.eggs ?? [],
      market: currentSave.market,
      guild: currentSave.guild,
      townUpgrades: currentSave.townUpgrades,
      townNpcTrust: currentSave.townNpcTrust,
      ranchUpgrades: currentSave.ranchUpgrades,
      ranchJobs: currentSave.ranchJobs,
      flags: { ...currentSave.flags, lastSleptDayNumber: nextDayState.dayNumber, m2SleepUsed: true, m11SleepRecoveryApplied: recovery.sleepCreatureEnergyBonus > 0 || recovery.sleepAffectionBonus > 0, m47TrainingAvailability: true },
    };
    const nurseryResult = advanceNurseryDay(restoredSave);
    const guildSynced = ensureCurrentGuildState(ensureCurrentMarketState(nurseryResult.save));
    const jobResult = processLegacyRanchJobs(guildSynced);
    const rewarded = applyStarterGoalRewards(jobResult.save);
    const trainingReturnItems = getTrainingReturnSummaryItems(rewarded);
    const battleReadinessItems = getBattleOutfitterDailySummaryItems(rewarded);
    const taxResult = processMonthlyTaxes(rewarded, currentSave);
    const dailyReport = buildDailyReportBundle(taxResult.save, jobResult.results);
    const finalSave: GameSave = { ...taxResult.save, flags: { ...taxResult.save.flags, ...serializeDailyReportBundle(dailyReport) } };
    const summaryItems = [
      `Advanced from ${previousDateLabel} to ${nextDateLabel}.`,
      `Energy restored to ${currentSave.currencies.maxEnergy}.`,
      "Player Hearts restored to full.",
      recovery.sleepCreatureEnergyBonus || recovery.sleepAffectionBonus ? `Ranch recovery bonus applied: +${recovery.sleepCreatureEnergyBonus} creature energy buffer, +${recovery.sleepAffectionBonus} affection.` : "Creature energy and Hearts restored to full.",
      ...trainingReturnItems,
      ...battleReadinessItems,
      ...(nurseryResult.summaryItems.length ? nurseryResult.summaryItems : ["No active pregnancy or egg timers advanced today."]),
      ...(jobResult.results.length ? jobResult.results.map((result) => result.message) : ["No ranch chore assignments resolved today."]),
      ...dailyReport.summaryItems,
      ...taxResult.summaryItems,
    ];
    if (nextDayState.weekday === "Mon") summaryItems.push("New week started. Vale's Adoption Hearth and the guild board have fresh listings.");
    saveCurrentGame(finalSave);
    return { previousDateLabel, nextDateLabel, summaryItems, ranchJobResults: jobResult.results };
  }, [currentSave, saveCurrentGame]);

  const value = useMemo<GameContextValue>(() => ({
    version: MVP_VERSION,
    buildPhase: "Legacy A2 — Career Records Integration",
    appScreen, activeHabitatFamily, currentSave, saveSlots, isHydrated,
    createNewGame, loadGame, deleteGame, refreshSaveSlots, goToMainMenu, exitRunToMainMenu,
    goToRanch, goToHabitat, goToBreeding, goToNursery, goToTown, goToMarket,
    goToSupplyDepot, goToEggAtelier, goToTrainingGrounds, goToBattleOutfitter,
    goToBattleDebug, goToGuildHall, goToCollection, goToRanchOffice, goToRanchJobs,
    goToDevTools, saveCurrentGame, advanceDay, renameCreature, feedCreature,
    toggleCreatureLock, releaseCreature, donateCreature, attemptBreeding, hatchReadyEgg,
    removeNurseryEgg, buyMarketCreature, rerollMarket, buySupplyDepotItem, useEnergySnack,
    buyBattleOutfitterItem, trainCreature, collectTrainingCreature,
    purchaseTrainingGroundsUpgrade, acceptGuildRequest, donateCreatureToGuild,
    buyTownUpgrade, buyRanchUpgrade, repairRanch, assignRanchJob, claimGuildIntroBonus,
    addDevGuildPoints,
  }), [
    appScreen, activeHabitatFamily, currentSave, saveSlots, isHydrated, createNewGame,
    loadGame, deleteGame, refreshSaveSlots, goToMainMenu, exitRunToMainMenu, goToRanch,
    goToHabitat, goToBreeding, goToNursery, goToTown, goToMarket, goToSupplyDepot,
    goToEggAtelier, goToTrainingGrounds, goToBattleOutfitter, goToBattleDebug,
    goToGuildHall, goToCollection, goToRanchOffice, goToRanchJobs, goToDevTools,
    saveCurrentGame, advanceDay, renameCreature, feedCreature, toggleCreatureLock,
    releaseCreature, donateCreature, attemptBreeding, hatchReadyEgg, removeNurseryEgg,
    buyMarketCreature, rerollMarket, buySupplyDepotItem, useEnergySnack,
    buyBattleOutfitterItem, trainCreature, collectTrainingCreature,
    purchaseTrainingGroundsUpgrade, acceptGuildRequest, donateCreatureToGuild,
    buyTownUpgrade, buyRanchUpgrade, repairRanch, assignRanchJob, claimGuildIntroBonus,
    addDevGuildPoints,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameContext must be used inside GameProvider.");
  return context;
}
