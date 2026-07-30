"use client";

import { createContext, useContext, useMemo } from "react";
import * as Base from "./GameProviderRanchDay";

type BaseContextValue = ReturnType<typeof Base.useGameContext>;
const ColiseumC3Context = createContext<BaseContextValue | null>(null);

function ColiseumC3Bridge({ children }: { children: React.ReactNode }) {
  const base = Base.useGameContext();
  const value = useMemo<BaseContextValue>(() => ({
    ...base,
    buildPhase: "Coliseum C3 — Marks, Combat Loot, Exclusive Moves & Creature Contracts",
  }), [base]);
  return <ColiseumC3Context.Provider value={value}>{children}</ColiseumC3Context.Provider>;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  return <Base.GameProvider><ColiseumC3Bridge>{children}</ColiseumC3Bridge></Base.GameProvider>;
}

export function useGameContext(): BaseContextValue {
  const context = useContext(ColiseumC3Context);
  if (!context) throw new Error("useGameContext must be used inside GameProvider.");
  return context;
}

export type AppScreen = Base.AppScreen;
export type DayAdvanceResult = Base.DayAdvanceResult;
