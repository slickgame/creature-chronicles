"use client";

import { createContext, useContext, useMemo } from "react";
import { MVP_VERSION, STARTING_PLAYER_STATE } from "@/data/gameConstants";
import type { GameSave } from "@/types/save";

type GameContextValue = {
  version: string;
  buildPhase: string;
  previewSave: GameSave;
};

const GameContext = createContext<GameContextValue | null>(null);

function createPreviewSave(): GameSave {
  const now = new Date().toISOString();

  return {
    version: MVP_VERSION,
    saveId: "preview_save",
    createdAt: now,
    updatedAt: now,
    player: {
      playerId: "preview_player",
      name: "New Breeder",
      ranchName: "Creature Ranch",
      breederRank: 1,
      ranchRank: 1,
    },
    currencies: {
      gold: STARTING_PLAYER_STATE.gold,
      guildPoints: STARTING_PLAYER_STATE.guildPoints,
      energy: STARTING_PLAYER_STATE.energy,
      maxEnergy: STARTING_PLAYER_STATE.maxEnergy,
    },
    dayState: {
      dayNumber: STARTING_PLAYER_STATE.dayNumber,
      weekday: STARTING_PLAYER_STATE.weekday,
      month: STARTING_PLAYER_STATE.month,
      dayOfMonth: STARTING_PLAYER_STATE.dayOfMonth,
      weekNumber: STARTING_PLAYER_STATE.weekNumber,
    },
    creatureIds: [],
    eggIds: [],
    habitatIds: [],
    flags: {
      m0ScaffoldLoaded: true,
    },
  };
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<GameContextValue>(
    () => ({
      version: MVP_VERSION,
      buildPhase: "M0 — Project Setup",
      previewSave: createPreviewSave(),
    }),
    [],
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