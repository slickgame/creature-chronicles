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
import type { GameSave } from "@/types/save";

type GameContextValue = {
  version: string;
  buildPhase: string;
  currentSave: GameSave | null;
  saveSlots: Array<GameSave | null>;
  isHydrated: boolean;
  createNewGame: (playerName: string, preferredSlot?: number) => GameSave;
  loadGame: (slotIndex: number) => GameSave | null;
  deleteGame: (slotIndex: number) => void;
  refreshSaveSlots: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
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

  const createNewGame = useCallback((playerName: string, preferredSlot?: number) => {
    const emptySlot = findFirstEmptySlot();
    const slotIndex = preferredSlot ?? emptySlot ?? 0;
    const newSave = createNewGameSave(playerName, slotIndex);
    const savedGame = saveGameToSlot(newSave);

    setActiveSaveId(savedGame.saveId);
    setCurrentSave(savedGame);
    setSaveSlots(loadAllSaves());

    return savedGame;
  }, []);

  const loadGame = useCallback((slotIndex: number) => {
    const save = loadSaveFromSlot(slotIndex);

    if (!save) {
      return null;
    }

    setActiveSaveId(save.saveId);
    setCurrentSave(save);
    setSaveSlots(loadAllSaves());

    return save;
  }, []);

  const deleteGame = useCallback(
    (slotIndex: number) => {
      deleteSaveSlot(slotIndex);
      refreshSaveSlots();
    },
    [refreshSaveSlots],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      version: MVP_VERSION,
      buildPhase: "M1 — Main Menu + Save Shell",
      currentSave,
      saveSlots,
      isHydrated,
      createNewGame,
      loadGame,
      deleteGame,
      refreshSaveSlots,
    }),
    [
      currentSave,
      saveSlots,
      isHydrated,
      createNewGame,
      loadGame,
      deleteGame,
      refreshSaveSlots,
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