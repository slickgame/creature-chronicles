"use client";

import { createContext, useContext, useMemo } from "react";
import * as Base from "./GameProviderC3";

type BaseContextValue = ReturnType<typeof Base.useGameContext>;
const ColiseumC4Context = createContext<BaseContextValue | null>(null);

function ColiseumC4Bridge({ children }: { children: React.ReactNode }) {
  const base = Base.useGameContext();
  const value = useMemo<BaseContextValue>(() => ({
    ...base,
    buildPhase: "Chapter 2 — Trouble Beyond the Fence & Coliseum C4",
  }), [base]);
  return <ColiseumC4Context.Provider value={value}>{children}</ColiseumC4Context.Provider>;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  return <Base.GameProvider><ColiseumC4Bridge>{children}</ColiseumC4Bridge></Base.GameProvider>;
}

export function useGameContext(): BaseContextValue {
  const context = useContext(ColiseumC4Context);
  if (!context) throw new Error("useGameContext must be used inside GameProvider.");
  return context;
}

export type AppScreen = Base.AppScreen;
export type DayAdvanceResult = Base.DayAdvanceResult;
