"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MVP_VERSION } from "@/data/gameConstants";
import { performBreedingAttempt } from "@/data/breeding";
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
import type { CreatureFamily } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { DayState, GameSave } from "@/types/save";

export type AppScreen = "main-menu" | "ranch-hub" | "habitat" | "breeding";

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
  saveCurrentGame: (nextSave: GameSave) => GameSave;
  advanceDay: () => DayAdvanceResult | null;
  renameCreature: (creatureId: CreatureId, nickname: string) => void;
  feedCreature: (creatureId: CreatureId) => void;
  attemptBreeding: (giverId: string, receiverId: string) => BreedingAttemptRecord | null;
};

const GameContext = createContext<GameContextValue | null>(null);

const WEEKDAYS: DayState["weekday"][] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getNextDayState(dayState: DayState): DayState {
  const currentWeekdayIndex = WEEKDAYS.indexOf(dayState.weekday);
  const nextWeekdayIndex = (currentWeekdayIndex + 1) % WEEKDAYS.length;
  const nextDayNumber = dayState.dayNumber + 1;
  const nextDayOfMonth = dayState.dayOfMonth >= 30 ? 1 : dayState.dayOfMonth + 1;
  const nextMonth = dayState.dayOfMonth >= 30 ? dayState.month + 1 : dayState.month;
  const nextWeekNumber =
    nextWeekdayIndex === 0 ? dayState.weekNumber + 1 : dayState.weekNumber;

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

    if (!save) {
      return null;
    }

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

  const goToHabitat = useCallback((family: CreatureFamily) => {
    setActiveHabitatFamily(family);
    setAppScreen("habitat");
  }, []);

  const goToBreeding = useCallback(() => {
    setActiveHabitatFamily(null);
    setAppScreen("breeding");
  }, []);

  const renameCreature = useCallback(
    (creatureId: CreatureId, nickname: string) => {
      if (!currentSave) {
        return;
      }

      const cleanNickname = nickname.trim();

      if (!cleanNickname) {
        return;
      }

      const nextSave: GameSave = {
        ...currentSave,
        creatures: (currentSave.creatures ?? []).map((creature) =>
          creature.creatureId === creatureId
            ? {
                ...creature,
                nickname: cleanNickname,
              }
            : creature,
        ),
        flags: {
          ...currentSave.flags,
          m3CreatureRenamed: true,
        },
      };

      saveCurrentGame(nextSave);
    },
    [currentSave, saveCurrentGame],
  );

  const feedCreature = useCallback(
    (creatureId: CreatureId) => {
      if (!currentSave) {
        return;
      }

      const nextSave: GameSave = {
        ...currentSave,
        creatures: (currentSave.creatures ?? []).map((creature) =>
          creature.creatureId === creatureId
            ? {
                ...creature,
                affection: Math.min(100, creature.affection + 5),
                energy: Math.min(creature.maxEnergy, creature.energy + 10),
              }
            : creature,
        ),
        flags: {
          ...currentSave.flags,
          m3CreatureFed: true,
        },
      };

      saveCurrentGame(nextSave);
    },
    [currentSave, saveCurrentGame],
  );

  const attemptBreeding = useCallback(
    (giverId: string, receiverId: string) => {
      if (!currentSave) {
        return null;
      }

      const result = performBreedingAttempt(currentSave, giverId, receiverId);

      if (!result) {
        return null;
      }

      saveCurrentGame(result.save);
      return result.attempt;
    },
    [currentSave, saveCurrentGame],
  );

  const advanceDay = useCallback((): DayAdvanceResult | null => {
    if (!currentSave) {
      return null;
    }

    const previousDateLabel = formatGameDate(
      currentSave.dayState.weekday,
      currentSave.dayState.month,
      currentSave.dayState.dayOfMonth,
    );

    const nextDayState = getNextDayState(currentSave.dayState);

    const nextDateLabel = formatGameDate(
      nextDayState.weekday,
      nextDayState.month,
      nextDayState.dayOfMonth,
    );

    const summaryItems = [
      `Advanced from ${previousDateLabel} to ${nextDateLabel}.`,
      `Energy restored to ${currentSave.currencies.maxEnergy}.`,
      "Player Hearts restored to full.",
      "Creature energy and Hearts restored to full.",
      "Egg and pregnancy timers are ready for M5.",
    ];

    if (nextDayState.weekday === "Mon") {
      summaryItems.push("New week started. Market and guild weekly reset hooks are ready.");
    }

    const nextSave: GameSave = {
      ...currentSave,
      updatedAt: new Date().toISOString(),
      dayState: nextDayState,
      player: {
        ...currentSave.player,
        hearts: currentSave.player.maxHearts ?? 4,
      },
      currencies: {
        ...currentSave.currencies,
        energy: currentSave.currencies.maxEnergy,
      },
      creatures: (currentSave.creatures ?? []).map((creature) => ({
        ...creature,
        energy: creature.maxEnergy,
        hearts: creature.maxHearts ?? 4,
      })),
      breeding: currentSave.breeding,
      flags: {
        ...currentSave.flags,
        lastSleptDayNumber: nextDayState.dayNumber,
        m2SleepUsed: true,
      },
    };

    saveCurrentGame(nextSave);

    return {
      previousDateLabel,
      nextDateLabel,
      summaryItems,
    };
  }, [currentSave, saveCurrentGame]);

  const value = useMemo<GameContextValue>(
    () => ({
      version: MVP_VERSION,
      buildPhase: "M4 — Breeding Core",
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
      saveCurrentGame,
      advanceDay,
      renameCreature,
      feedCreature,
      attemptBreeding,
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
      saveCurrentGame,
      advanceDay,
      renameCreature,
      feedCreature,
      attemptBreeding,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGameContext must be used inside GameProvider.");
  }

  return context;
}
