"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { performBreedingAttempt } from "@/data/breeding";
import { releaseOrDonateCreature } from "@/data/collection";
import { MVP_VERSION } from "@/data/gameConstants";
import {
  acceptGuildContract,
  donateCreatureToGuildContract,
  ensureCurrentGuildState,
} from "@/data/guild";
import { buyMarketListing, ensureCurrentMarketState, rerollMarketListings } from "@/data/market";
import { advanceNurseryDay, hatchEgg, removeEgg } from "@/data/nursery";
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
import type { BreedingAttemptRecord } from "@/types/breeding";
import type { CreatureFamily, CreatureRecord } from "@/types/creature";
import type { CreatureId, EggId } from "@/types/ids";
import type { DayState, GameSave } from "@/types/save";

export type AppScreen =
  | "main-menu"
  | "ranch-hub"
  | "habitat"
  | "breeding"
  | "nursery"
  | "town"
  | "market"
  | "guild-hall"
  | "collection";

export type DayAdvanceResult = {
  previousDateLabel: string;
  nextDateLabel: string;
  summaryItems: string[];
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
  goToRanch: () => void;
  goToHabitat: (family: CreatureFamily) => void;
  goToBreeding: () => void;
  goToNursery: () => void;
  goToTown: () => void;
  goToMarket: () => void;
  goToGuildHall: () => void;
  goToCollection: () => void;
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
  acceptGuildRequest: (contractId: string) => string;
  donateCreatureToGuild: (contractId: string, creatureId: CreatureId) => string;
};

const GameContext = createContext<GameContextValue | null>(null);

const WEEKDAYS: DayState["weekday"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getNextDayState(dayState: DayState): DayState {
  const currentWeekdayIndex = WEEKDAYS.indexOf(dayState.weekday);
  const nextWeekdayIndex = (currentWeekdayIndex + 1) % WEEKDAYS.length;
  const nextDayNumber = dayState.dayNumber + 1;
  const nextDayOfMonth = dayState.dayOfMonth >= 30 ? 1 : dayState.dayOfMonth + 1;
  const nextMonth = dayState.dayOfMonth >= 30 ? dayState.month + 1 : dayState.month;
  const nextWeekNumber = nextWeekdayIndex === 0 ? dayState.weekNumber + 1 : dayState.weekNumber;

  return {
    dayNumber: nextDayNumber,
    weekday: WEEKDAYS[nextWeekdayIndex],
    month: nextMonth,
    dayOfMonth: nextDayOfMonth,
    weekNumber: nextWeekNumber,
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

    const activeSaveId = getActiveSaveId();
    const activeSave = saves.find((save) => save?.saveId === activeSaveId) ?? null;

    setCurrentSave(activeSave);
  }, []);

  useEffect(() => {
    refreshSaveSlots();
    setIsHydrated(true);
  }, [refreshSaveSlots]);

  const saveCurrentGame = useCallback((nextSave: GameSave) => {
    const savedGame = saveGameToSlot(nextSave);

    setActiveSaveId(savedGame.saveId);
    setCurrentSave(savedGame);
    setSaveSlots(loadAllSaves());

    return savedGame;
  }, []);

  const createNewGame = useCallback(
    (playerName: string, preferredSlot?: number) => {
      const emptySlot = findFirstEmptySlot();
      const slotIndex = preferredSlot ?? emptySlot ?? 0;
      const newSave = createNewGameSave(playerName, slotIndex);
      const savedGame = saveCurrentGame(newSave);

      setActiveHabitatFamily(null);
      setAppScreen("ranch-hub");

      return savedGame;
    },
    [saveCurrentGame],
  );

  const loadGame = useCallback((slotIndex: number) => {
    const save = loadSaveFromSlot(slotIndex);

    if (!save) return null;

    setActiveSaveId(save.saveId);
    setCurrentSave(save);
    setSaveSlots(loadAllSaves());
    setActiveHabitatFamily(null);
    setAppScreen("ranch-hub");

    return save;
  }, []);

  const deleteGame = useCallback(
    (slotIndex: number) => {
      deleteSaveSlot(slotIndex);
      refreshSaveSlots();
    },
    [refreshSaveSlots],
  );

  const goToMainMenu = useCallback(() => {
    setActiveHabitatFamily(null);
    setAppScreen("main-menu");
  }, []);

  const goToRanch = useCallback(() => {
    setActiveHabitatFamily(null);
    setAppScreen("ranch-hub");
  }, []);

  const goToTown = useCallback(() => {
    setActiveHabitatFamily(null);
    setAppScreen("town");
  }, []);

  const goToMarket = useCallback(() => {
    setActiveHabitatFamily(null);

    if (currentSave) {
      const syncedSave = ensureCurrentMarketState(currentSave);
      if (syncedSave !== currentSave) saveCurrentGame(syncedSave);
    }

    setAppScreen("market");
  }, [currentSave, saveCurrentGame]);

  const goToGuildHall = useCallback(() => {
    setActiveHabitatFamily(null);

    if (currentSave) {
      const syncedSave = ensureCurrentGuildState(currentSave);
      if (syncedSave !== currentSave) saveCurrentGame(syncedSave);
    }

    setAppScreen("guild-hall");
  }, [currentSave, saveCurrentGame]);

  const goToHabitat = useCallback((family: CreatureFamily) => {
    setActiveHabitatFamily(family);
    setAppScreen("habitat");
  }, []);

  const goToBreeding = useCallback(() => {
    setActiveHabitatFamily(null);
    setAppScreen("breeding");
  }, []);

  const goToNursery = useCallback(() => {
    setActiveHabitatFamily(null);
    setAppScreen("nursery");
  }, []);

  const goToCollection = useCallback(() => {
    setActiveHabitatFamily(null);
    setAppScreen("collection");
  }, []);

  const renameCreature = useCallback(
    (creatureId: CreatureId, nickname: string) => {
      if (!currentSave) return;

      const cleanNickname = nickname.trim();
      if (!cleanNickname) return;

      const nextSave: GameSave = {
        ...currentSave,
        creatures: (currentSave.creatures ?? []).map((creature) =>
          creature.creatureId === creatureId ? { ...creature, nickname: cleanNickname } : creature,
        ),
        flags: { ...currentSave.flags, m3CreatureRenamed: true, m9RenamePolishUsed: true },
      };

      saveCurrentGame(nextSave);
    },
    [currentSave, saveCurrentGame],
  );

  const feedCreature = useCallback(
    (creatureId: CreatureId) => {
      if (!currentSave) return;

      const nextSave: GameSave = {
        ...currentSave,
        creatures: (currentSave.creatures ?? []).map((creature) =>
          creature.creatureId === creatureId
            ? { ...creature, affection: Math.min(100, creature.affection + 5), energy: Math.min(creature.maxEnergy, creature.energy + 10) }
            : creature,
        ),
        flags: { ...currentSave.flags, m3CreatureFed: true },
      };

      saveCurrentGame(nextSave);
    },
    [currentSave, saveCurrentGame],
  );

  const toggleCreatureLock = useCallback(
    (creatureId: CreatureId) => {
      if (!currentSave) return;
      const nextSave: GameSave = {
        ...currentSave,
        creatures: (currentSave.creatures ?? []).map((creature) =>
          creature.creatureId === creatureId ? { ...creature, isLocked: !creature.isLocked } : creature,
        ),
        flags: { ...currentSave.flags, m9CreatureLockUsed: true },
      };
      saveCurrentGame(nextSave);
    },
    [currentSave, saveCurrentGame],
  );

  const releaseCreature = useCallback(
    (creatureId: CreatureId) => {
      if (!currentSave) return "No active save.";
      const result = releaseOrDonateCreature(currentSave, creatureId, "release");
      saveCurrentGame(result.save);
      return result.message;
    },
    [currentSave, saveCurrentGame],
  );

  const donateCreature = useCallback(
    (creatureId: CreatureId) => {
      if (!currentSave) return "No active save.";
      const result = releaseOrDonateCreature(currentSave, creatureId, "donate");
      saveCurrentGame(result.save);
      return result.message;
    },
    [currentSave, saveCurrentGame],
  );

  const attemptBreeding = useCallback(
    (giverId: string, receiverId: string) => {
      if (!currentSave) return null;

      const result = performBreedingAttempt(currentSave, giverId, receiverId);
      if (!result) return null;

      saveCurrentGame(result.save);
      return result.attempt;
    },
    [currentSave, saveCurrentGame],
  );

  const hatchReadyEgg = useCallback(
    (eggId: EggId, nickname?: string) => {
      if (!currentSave) return null;

      const result = hatchEgg(currentSave, eggId, nickname);
      if (!result) return null;

      saveCurrentGame(result.save);
      return result.creature;
    },
    [currentSave, saveCurrentGame],
  );

  const removeNurseryEgg = useCallback(
    (eggId: EggId, mode: "release" | "donate") => {
      if (!currentSave) return;
      saveCurrentGame(removeEgg(currentSave, eggId, mode));
    },
    [currentSave, saveCurrentGame],
  );

  const buyMarketCreature = useCallback(
    (listingId: string) => {
      if (!currentSave) return "No active save.";
      const result = buyMarketListing(currentSave, listingId);
      saveCurrentGame(result.save);
      return result.message;
    },
    [currentSave, saveCurrentGame],
  );

  const rerollMarket = useCallback(() => {
    if (!currentSave) return "No active save.";
    const result = rerollMarketListings(currentSave);
    saveCurrentGame(result.save);
    return result.message;
  }, [currentSave, saveCurrentGame]);

  const acceptGuildRequest = useCallback(
    (contractId: string) => {
      if (!currentSave) return "No active save.";
      const result = acceptGuildContract(currentSave, contractId);
      saveCurrentGame(result.save);
      return result.message;
    },
    [currentSave, saveCurrentGame],
  );

  const donateCreatureToGuild = useCallback(
    (contractId: string, creatureId: CreatureId) => {
      if (!currentSave) return "No active save.";
      const creature = (currentSave.creatures ?? []).find((item) => item.creatureId === creatureId);
      if (creature?.isLocked) return `${creature.nickname} is locked. Unlock them before donating.`;
      const result = donateCreatureToGuildContract(currentSave, contractId, creatureId);
      saveCurrentGame(result.save);
      return result.message;
    },
    [currentSave, saveCurrentGame],
  );

  const advanceDay = useCallback((): DayAdvanceResult | null => {
    if (!currentSave) return null;

    const previousDateLabel = formatGameDate(currentSave.dayState.weekday, currentSave.dayState.month, currentSave.dayState.dayOfMonth);
    const nextDayState = getNextDayState(currentSave.dayState);
    const nextDateLabel = formatGameDate(nextDayState.weekday, nextDayState.month, nextDayState.dayOfMonth);

    const restoredSave: GameSave = {
      ...currentSave,
      updatedAt: new Date().toISOString(),
      dayState: nextDayState,
      player: { ...currentSave.player, hearts: currentSave.player.maxHearts ?? 4 },
      currencies: { ...currentSave.currencies, energy: currentSave.currencies.maxEnergy },
      creatures: (currentSave.creatures ?? []).map((creature) => ({ ...creature, energy: creature.maxEnergy, hearts: creature.maxHearts ?? 4 })),
      breeding: currentSave.breeding,
      pregnancies: currentSave.pregnancies ?? [],
      eggs: currentSave.eggs ?? [],
      market: currentSave.market,
      guild: currentSave.guild,
      flags: { ...currentSave.flags, lastSleptDayNumber: nextDayState.dayNumber, m2SleepUsed: true },
    };

    const nurseryResult = advanceNurseryDay(restoredSave);
    const marketSyncedSave = ensureCurrentMarketState(nurseryResult.save);
    const guildSyncedSave = ensureCurrentGuildState(marketSyncedSave);
    const summaryItems = [
      `Advanced from ${previousDateLabel} to ${nextDateLabel}.`,
      `Energy restored to ${currentSave.currencies.maxEnergy}.`,
      "Player Hearts restored to full.",
      "Creature energy and Hearts restored to full.",
      ...(nurseryResult.summaryItems.length ? nurseryResult.summaryItems : ["No active pregnancy or egg timers advanced today."]),
    ];

    if (nextDayState.weekday === "Mon") {
      summaryItems.push("New week started. The town market and guild board have fresh listings.");
    }

    saveCurrentGame(guildSyncedSave);

    return { previousDateLabel, nextDateLabel, summaryItems };
  }, [currentSave, saveCurrentGame]);

  const value = useMemo<GameContextValue>(
    () => ({
      version: MVP_VERSION,
      buildPhase: "M9 — Creature Management / Collection Quality",
      appScreen,
      activeHabitatFamily,
      currentSave,
      saveSlots,
      isHydrated,
      createNewGame,
      loadGame,
      deleteGame,
      refreshSaveSlots,
      goToMainMenu,
      goToRanch,
      goToHabitat,
      goToBreeding,
      goToNursery,
      goToTown,
      goToMarket,
      goToGuildHall,
      goToCollection,
      saveCurrentGame,
      advanceDay,
      renameCreature,
      feedCreature,
      toggleCreatureLock,
      releaseCreature,
      donateCreature,
      attemptBreeding,
      hatchReadyEgg,
      removeNurseryEgg,
      buyMarketCreature,
      rerollMarket,
      acceptGuildRequest,
      donateCreatureToGuild,
    }),
    [
      appScreen,
      activeHabitatFamily,
      currentSave,
      saveSlots,
      isHydrated,
      createNewGame,
      loadGame,
      deleteGame,
      refreshSaveSlots,
      goToMainMenu,
      goToRanch,
      goToHabitat,
      goToBreeding,
      goToNursery,
      goToTown,
      goToMarket,
      goToGuildHall,
      goToCollection,
      saveCurrentGame,
      advanceDay,
      renameCreature,
      feedCreature,
      toggleCreatureLock,
      releaseCreature,
      donateCreature,
      attemptBreeding,
      hatchReadyEgg,
      removeNurseryEgg,
      buyMarketCreature,
      rerollMarket,
      acceptGuildRequest,
      donateCreatureToGuild,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGameContext must be used inside GameProvider.");
  return context;
}
