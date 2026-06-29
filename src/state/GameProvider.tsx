"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { performBreedingAttempt } from "@/data/breeding";
import { releaseOrDonateCreature } from "@/data/collection";
import { buildDailyReportBundle, serializeDailyReportBundle } from "@/data/dailyReport";
import { MVP_VERSION } from "@/data/gameConstants";
import { acceptGuildContract, donateCreatureToGuildContract, ensureCurrentGuildState } from "@/data/guild";
import { buyMarketListing, ensureCurrentMarketState, rerollMarketListings } from "@/data/market";
import { advanceNurseryDay, hatchEgg, removeEgg } from "@/data/nursery";
import { assignCreatureToRanchJob, processRanchJobsForNewDay } from "@/data/ranchJobs";
import { getRanchUpgradeEffects, purchaseRanchUpgrade, repairRanchDamage } from "@/data/ranchUpgrades";
import { applyStarterGoalRewards } from "@/data/starterGoals";
import { purchaseSupplyDepotItem } from "@/data/supplyDepot";
import { ensureMonthlyTaxPosted, processMonthlyTaxes } from "@/data/taxes";
import { grantDevGuildPoints, grantGuildIntroBonus, purchaseTownUpgrade } from "@/data/upgrades";
import { formatGameDate } from "@/lib/formatters";
import { createNewGameSave, deleteSaveSlot, findFirstEmptySlot, getActiveSaveId, loadAllSaves, loadSaveFromSlot, saveGameToSlot, setActiveSaveId } from "@/lib/save/localSave";
import type { BreedingAttemptRecord } from "@/types/breeding";
import type { CreatureFamily, CreatureRecord } from "@/types/creature";
import type { CreatureId, EggId } from "@/types/ids";
import type { RanchJobAssignmentResult, RanchJobId, RanchJobResult } from "@/types/ranchJobs";
import type { RanchUpgradeId, RanchUpgradePurchaseResult } from "@/types/ranchUpgrades";
import type { DayState, GameSave } from "@/types/save";
import type { TownUpgradeId, TownUpgradePurchaseResult } from "@/types/upgrades";

export type AppScreen = "main-menu" | "ranch-hub" | "habitat" | "breeding" | "nursery" | "town" | "market" | "supply-depot" | "guild-hall" | "collection" | "ranch-office" | "ranch-jobs" | "dev-tools";
export type DayAdvanceResult = { previousDateLabel: string; nextDateLabel: string; summaryItems: string[]; ranchJobResults: RanchJobResult[] };

type GameContextValue = {
  version: string; buildPhase: string; appScreen: AppScreen; activeHabitatFamily: CreatureFamily | null; currentSave: GameSave | null; saveSlots: Array<GameSave | null>; isHydrated: boolean;
  createNewGame: (playerName: string, preferredSlot?: number) => GameSave; loadGame: (slotIndex: number) => GameSave | null; deleteGame: (slotIndex: number) => void; refreshSaveSlots: () => void;
  goToMainMenu: () => void; exitRunToMainMenu: () => void; goToRanch: () => void; goToHabitat: (family: CreatureFamily) => void; goToBreeding: () => void; goToNursery: () => void; goToTown: () => void; goToMarket: () => void; goToSupplyDepot: () => void; goToGuildHall: () => void; goToCollection: () => void; goToRanchOffice: () => void; goToRanchJobs: () => void; goToDevTools: () => void;
  saveCurrentGame: (nextSave: GameSave) => GameSave; advanceDay: () => DayAdvanceResult | null; renameCreature: (creatureId: CreatureId, nickname: string) => void; feedCreature: (creatureId: CreatureId) => void; toggleCreatureLock: (creatureId: CreatureId) => void; releaseCreature: (creatureId: CreatureId) => string; donateCreature: (creatureId: CreatureId) => string; attemptBreeding: (giverId: string, receiverId: string) => BreedingAttemptRecord | null; hatchReadyEgg: (eggId: EggId, nickname?: string) => CreatureRecord | null; removeNurseryEgg: (eggId: EggId, mode: "release" | "donate") => void; buyMarketCreature: (listingId: string) => string; rerollMarket: () => string; buySupplyDepotItem: (itemId: string) => string; acceptGuildRequest: (contractId: string) => string; donateCreatureToGuild: (contractId: string, creatureId: CreatureId) => string; buyTownUpgrade: (upgradeId: TownUpgradeId) => TownUpgradePurchaseResult; buyRanchUpgrade: (upgradeId: RanchUpgradeId) => RanchUpgradePurchaseResult; repairRanch: () => RanchUpgradePurchaseResult; assignRanchJob: (jobId: RanchJobId, creatureId: CreatureId | null) => RanchJobAssignmentResult; claimGuildIntroBonus: () => TownUpgradePurchaseResult; addDevGuildPoints: () => TownUpgradePurchaseResult;
};

const GameContext = createContext<GameContextValue | null>(null);
const WEEKDAYS: DayState["weekday"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function getNextDayState(dayState: DayState): DayState { const currentWeekdayIndex = WEEKDAYS.indexOf(dayState.weekday); const nextWeekdayIndex = (currentWeekdayIndex + 1) % WEEKDAYS.length; return { dayNumber: dayState.dayNumber + 1, weekday: WEEKDAYS[nextWeekdayIndex], month: dayState.dayOfMonth >= 30 ? dayState.month + 1 : dayState.month, dayOfMonth: dayState.dayOfMonth >= 30 ? 1 : dayState.dayOfMonth + 1, weekNumber: nextWeekdayIndex === 0 ? dayState.weekNumber + 1 : dayState.weekNumber }; }

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [appScreen, setAppScreen] = useState<AppScreen>("main-menu");
  const [activeHabitatFamily, setActiveHabitatFamily] = useState<CreatureFamily | null>(null);
  const [saveSlots, setSaveSlots] = useState<Array<GameSave | null>>([null, null, null]);
  const [currentSave, setCurrentSave] = useState<GameSave | null>(null);

  const refreshSaveSlots = useCallback(() => { const saves = loadAllSaves(); setSaveSlots(saves); const activeSaveId = getActiveSaveId(); setCurrentSave(saves.find((save) => save?.saveId === activeSaveId) ?? null); }, []);
  useEffect(() => { refreshSaveSlots(); setIsHydrated(true); }, [refreshSaveSlots]);
  const saveCurrentGame = useCallback((nextSave: GameSave) => { const taxPostedSave = ensureMonthlyTaxPosted(nextSave); const rewardedSave = applyStarterGoalRewards(taxPostedSave); const savedGame = saveGameToSlot(rewardedSave); setActiveSaveId(savedGame.saveId); setCurrentSave(savedGame); setSaveSlots(loadAllSaves()); return savedGame; }, []);
  const createNewGame = useCallback((playerName: string, preferredSlot?: number) => { const slotIndex = preferredSlot ?? findFirstEmptySlot() ?? 0; const savedGame = saveCurrentGame(createNewGameSave(playerName, slotIndex)); setActiveHabitatFamily(null); setAppScreen("ranch-hub"); return savedGame; }, [saveCurrentGame]);
  const loadGame = useCallback((slotIndex: number) => { const save = loadSaveFromSlot(slotIndex); if (!save) return null; setActiveSaveId(save.saveId); setCurrentSave(save); setSaveSlots(loadAllSaves()); setActiveHabitatFamily(null); setAppScreen("ranch-hub"); return save; }, []);
  const deleteGame = useCallback((slotIndex: number) => { deleteSaveSlot(slotIndex); refreshSaveSlots(); }, [refreshSaveSlots]);
  const goToMainMenu = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("main-menu"); }, []);
  const exitRunToMainMenu = useCallback(() => { setActiveSaveId(""); setCurrentSave(null); setActiveHabitatFamily(null); setSaveSlots(loadAllSaves()); setAppScreen("main-menu"); }, []);
  const goToRanch = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("ranch-hub"); }, []);
  const goToTown = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("town"); }, []);
  const goToRanchOffice = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("ranch-office"); }, []);
  const goToRanchJobs = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("ranch-jobs"); }, []);
  const goToDevTools = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("dev-tools"); }, []);
  const goToMarket = useCallback(() => { setActiveHabitatFamily(null); if (currentSave) { const syncedSave = ensureCurrentMarketState(currentSave); if (syncedSave !== currentSave) saveCurrentGame(syncedSave); } setAppScreen("market"); }, [currentSave, saveCurrentGame]);
  const goToSupplyDepot = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("supply-depot"); }, []);
  const goToGuildHall = useCallback(() => { setActiveHabitatFamily(null); if (currentSave) { const syncedSave = ensureCurrentGuildState(currentSave); if (syncedSave !== currentSave) saveCurrentGame(syncedSave); } setAppScreen("guild-hall"); }, [currentSave, saveCurrentGame]);
  const goToHabitat = useCallback((family: CreatureFamily) => { setActiveHabitatFamily(family); setAppScreen("habitat"); }, []);
  const goToBreeding = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("breeding"); }, []);
  const goToNursery = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("nursery"); }, []);
  const goToCollection = useCallback(() => { setActiveHabitatFamily(null); setAppScreen("collection"); }, []);

  const renameCreature = useCallback((creatureId: CreatureId, nickname: string) => { if (!currentSave || !nickname.trim()) return; saveCurrentGame({ ...currentSave, creatures: (currentSave.creatures ?? []).map((creature) => creature.creatureId === creatureId ? { ...creature, nickname: nickname.trim() } : creature), flags: { ...currentSave.flags, m3CreatureRenamed: true, m9RenamePolishUsed: true } }); }, [currentSave, saveCurrentGame]);
  const feedCreature = useCallback((creatureId: CreatureId) => { if (!currentSave) return; saveCurrentGame({ ...currentSave, creatures: (currentSave.creatures ?? []).map((creature) => creature.creatureId === creatureId ? { ...creature, affection: Math.min(100, creature.affection + 5), energy: Math.min(creature.maxEnergy, creature.energy + 10) } : creature), flags: { ...currentSave.flags, m3CreatureFed: true } }); }, [currentSave, saveCurrentGame]);
  const toggleCreatureLock = useCallback((creatureId: CreatureId) => { if (!currentSave) return; saveCurrentGame({ ...currentSave, creatures: (currentSave.creatures ?? []).map((creature) => creature.creatureId === creatureId ? { ...creature, isLocked: !creature.isLocked } : creature), flags: { ...currentSave.flags, m9CreatureLockUsed: true } }); }, [currentSave, saveCurrentGame]);
  const releaseCreature = useCallback((creatureId: CreatureId) => { if (!currentSave) return "No active save."; const result = releaseOrDonateCreature(currentSave, creatureId, "release"); saveCurrentGame(result.save); return result.message; }, [currentSave, saveCurrentGame]);
  const donateCreature = useCallback((creatureId: CreatureId) => { if (!currentSave) return "No active save."; const result = releaseOrDonateCreature(currentSave, creatureId, "donate"); saveCurrentGame(result.save); return result.message; }, [currentSave, saveCurrentGame]);
  const attemptBreeding = useCallback((giverId: string, receiverId: string) => { if (!currentSave) return null; const result = performBreedingAttempt(currentSave, giverId, receiverId); if (!result) return null; saveCurrentGame(result.save); return result.attempt; }, [currentSave, saveCurrentGame]);
  const hatchReadyEgg = useCallback((eggId: EggId, nickname?: string) => { if (!currentSave) return null; const result = hatchEgg(currentSave, eggId, nickname); if (!result) return null; saveCurrentGame(result.save); return result.creature; }, [currentSave, saveCurrentGame]);
  const removeNurseryEgg = useCallback((eggId: EggId, mode: "release" | "donate") => { if (currentSave) saveCurrentGame(removeEgg(currentSave, eggId, mode)); }, [currentSave, saveCurrentGame]);
  const buyMarketCreature = useCallback((listingId: string) => { if (!currentSave) return "No active save."; const result = buyMarketListing(currentSave, listingId); saveCurrentGame(result.save); return result.message; }, [currentSave, saveCurrentGame]);
  const rerollMarket = useCallback(() => { if (!currentSave) return "No active save."; const result = rerollMarketListings(currentSave); saveCurrentGame(result.save); return result.message; }, [currentSave, saveCurrentGame]);
  const buySupplyDepotItem = useCallback((itemId: string) => { if (!currentSave) return "No active save."; const result = purchaseSupplyDepotItem(currentSave, itemId); saveCurrentGame(result.save); return result.message; }, [currentSave, saveCurrentGame]);
  const acceptGuildRequest = useCallback((contractId: string) => { if (!currentSave) return "No active save."; const result = acceptGuildContract(currentSave, contractId); saveCurrentGame(result.save); return result.message; }, [currentSave, saveCurrentGame]);
  const donateCreatureToGuild = useCallback((contractId: string, creatureId: CreatureId) => { if (!currentSave) return "No active save."; const result = donateCreatureToGuildContract(currentSave, contractId, creatureId); saveCurrentGame(result.save); return result.message; }, [currentSave, saveCurrentGame]);
  const buyTownUpgrade = useCallback((upgradeId: TownUpgradeId) => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const result = purchaseTownUpgrade(currentSave, upgradeId); saveCurrentGame(ensureCurrentGuildState(ensureCurrentMarketState(result.save))); return result; }, [currentSave, saveCurrentGame]);
  const buyRanchUpgrade = useCallback((upgradeId: RanchUpgradeId) => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const result = purchaseRanchUpgrade(currentSave, upgradeId); saveCurrentGame(result.save); return result; }, [currentSave, saveCurrentGame]);
  const repairRanch = useCallback(() => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const result = repairRanchDamage(currentSave); if (result.ok) saveCurrentGame(result.save); return result; }, [currentSave, saveCurrentGame]);
  const assignRanchJob = useCallback((jobId: RanchJobId, creatureId: CreatureId | null) => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const result = assignCreatureToRanchJob(currentSave, jobId, creatureId); if (result.ok) saveCurrentGame(result.save); return result; }, [currentSave, saveCurrentGame]);
  const claimGuildIntroBonus = useCallback(() => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const result = grantGuildIntroBonus(currentSave); saveCurrentGame(result.save); return result; }, [currentSave, saveCurrentGame]);
  const addDevGuildPoints = useCallback(() => { if (!currentSave) return { save: currentSave as unknown as GameSave, ok: false, message: "No active save." }; const result = grantDevGuildPoints(currentSave); saveCurrentGame(result.save); return result; }, [currentSave, saveCurrentGame]);

  const advanceDay = useCallback((): DayAdvanceResult | null => {
    if (!currentSave) return null;
    const previousDateLabel = formatGameDate(currentSave.dayState.weekday, currentSave.dayState.month, currentSave.dayState.dayOfMonth);
    const nextDayState = getNextDayState(currentSave.dayState);
    const nextDateLabel = formatGameDate(nextDayState.weekday, nextDayState.month, nextDayState.dayOfMonth);
    const recovery = getRanchUpgradeEffects(currentSave);
    const restoredSave: GameSave = { ...currentSave, updatedAt: new Date().toISOString(), dayState: nextDayState, player: { ...currentSave.player, hearts: currentSave.player.maxHearts ?? 4 }, currencies: { ...currentSave.currencies, energy: currentSave.currencies.maxEnergy }, creatures: (currentSave.creatures ?? []).map((creature) => ({ ...creature, energy: Math.min(creature.maxEnergy + recovery.sleepCreatureEnergyBonus, creature.maxEnergy + recovery.sleepCreatureEnergyBonus), hearts: creature.maxHearts ?? 4, affection: Math.min(100, creature.affection + recovery.sleepAffectionBonus) })), breeding: currentSave.breeding, pregnancies: currentSave.pregnancies ?? [], eggs: currentSave.eggs ?? [], market: currentSave.market, guild: currentSave.guild, townUpgrades: currentSave.townUpgrades, ranchUpgrades: currentSave.ranchUpgrades, ranchJobs: currentSave.ranchJobs, flags: { ...currentSave.flags, lastSleptDayNumber: nextDayState.dayNumber, m2SleepUsed: true, m11SleepRecoveryApplied: recovery.sleepCreatureEnergyBonus > 0 || recovery.sleepAffectionBonus > 0 } };
    const nurseryResult = advanceNurseryDay(restoredSave);
    const marketSyncedSave = ensureCurrentMarketState(nurseryResult.save);
    const guildSyncedSave = ensureCurrentGuildState(marketSyncedSave);
    const jobResult = processRanchJobsForNewDay(guildSyncedSave);
    const rewardedSave = applyStarterGoalRewards(jobResult.save);
    const taxResult = processMonthlyTaxes(rewardedSave, currentSave);
    const dailyReport = buildDailyReportBundle(taxResult.save, jobResult.results);
    const finalSave: GameSave = { ...taxResult.save, flags: { ...taxResult.save.flags, ...serializeDailyReportBundle(dailyReport) } };
    const summaryItems = [`Advanced from ${previousDateLabel} to ${nextDateLabel}.`, `Energy restored to ${currentSave.currencies.maxEnergy}.`, "Player Hearts restored to full.", recovery.sleepCreatureEnergyBonus || recovery.sleepAffectionBonus ? `Ranch recovery bonus applied: +${recovery.sleepCreatureEnergyBonus} creature energy buffer, +${recovery.sleepAffectionBonus} affection.` : "Creature energy and Hearts restored to full.", ...(nurseryResult.summaryItems.length ? nurseryResult.summaryItems : ["No active pregnancy or egg timers advanced today."]), ...(jobResult.results.length ? jobResult.results.map((result) => result.message) : ["No ranch chore assignments resolved today."]), ...dailyReport.summaryItems, ...taxResult.summaryItems];
    if (nextDayState.weekday === "Mon") summaryItems.push("New week started. Vale's Adoption Hearth and the guild board have fresh listings.");
    saveCurrentGame(finalSave);
    return { previousDateLabel, nextDateLabel, summaryItems, ranchJobResults: jobResult.results };
  }, [currentSave, saveCurrentGame]);

  const value = useMemo<GameContextValue>(() => ({ version: MVP_VERSION, buildPhase: "M36 — NPC Trust & Supply Items", appScreen, activeHabitatFamily, currentSave, saveSlots, isHydrated, createNewGame, loadGame, deleteGame, refreshSaveSlots, goToMainMenu, exitRunToMainMenu, goToRanch, goToHabitat, goToBreeding, goToNursery, goToTown, goToMarket, goToSupplyDepot, goToGuildHall, goToCollection, goToRanchOffice, goToRanchJobs, goToDevTools, saveCurrentGame, advanceDay, renameCreature, feedCreature, toggleCreatureLock, releaseCreature, donateCreature, attemptBreeding, hatchReadyEgg, removeNurseryEgg, buyMarketCreature, rerollMarket, buySupplyDepotItem, acceptGuildRequest, donateCreatureToGuild, buyTownUpgrade, buyRanchUpgrade, repairRanch, assignRanchJob, claimGuildIntroBonus, addDevGuildPoints }), [appScreen, activeHabitatFamily, currentSave, saveSlots, isHydrated, createNewGame, loadGame, deleteGame, refreshSaveSlots, goToMainMenu, exitRunToMainMenu, goToRanch, goToHabitat, goToBreeding, goToNursery, goToTown, goToMarket, goToSupplyDepot, goToGuildHall, goToCollection, goToRanchOffice, goToRanchJobs, goToDevTools, saveCurrentGame, advanceDay, renameCreature, feedCreature, toggleCreatureLock, releaseCreature, donateCreature, attemptBreeding, hatchReadyEgg, removeNurseryEgg, buyMarketCreature, rerollMarket, buySupplyDepotItem, acceptGuildRequest, donateCreatureToGuild, buyTownUpgrade, buyRanchUpgrade, repairRanch, assignRanchJob, claimGuildIntroBonus, addDevGuildPoints]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
export function useGameContext(): GameContextValue { const context = useContext(GameContext); if (!context) throw new Error("useGameContext must be used inside GameProvider."); return context; }
