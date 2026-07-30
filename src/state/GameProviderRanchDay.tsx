"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import * as Base from "./GameProvider";
import { recordRanchDayTransition } from "@/data/ranch-day/ranchDayActivities";
import { advanceRanchDay } from "@/data/ranch-day/ranchDayLifecycle";
import { enterEveningReview, normalizeRanchDaySave } from "@/data/ranch-day/ranchDayState";
import type { GameSave } from "@/types/save";

export type AppScreen = Base.AppScreen;
export type DayAdvanceResult = Base.DayAdvanceResult;

type BaseContextValue = ReturnType<typeof Base.useGameContext>;
const RanchDayContext = createContext<BaseContextValue | null>(null);

function RanchDayBridge({ children }: { children: React.ReactNode }) {
  const base = Base.useGameContext();
  const previousSaveRef = useRef<GameSave | null>(base.currentSave);
  const synchronizingRef = useRef(false);
  const dayEndLockRef = useRef(false);

  useEffect(() => {
    dayEndLockRef.current = false;
  }, [base.currentSave?.saveId, base.currentSave?.dayState.dayNumber]);

  useEffect(() => {
    const current = base.currentSave;
    if (!current) {
      previousSaveRef.current = null;
      synchronizingRef.current = false;
      return;
    }
    if (synchronizingRef.current) {
      synchronizingRef.current = false;
      previousSaveRef.current = current;
      return;
    }

    const prepared = recordRanchDayTransition(previousSaveRef.current, current);
    if (prepared !== current) {
      synchronizingRef.current = true;
      previousSaveRef.current = prepared;
      base.saveCurrentGame(prepared);
      return;
    }
    previousSaveRef.current = current;
  }, [base.currentSave, base.saveCurrentGame]);

  const saveCurrentGame = useCallback((nextSave: GameSave) => {
    const prepared = recordRanchDayTransition(
      base.currentSave,
      normalizeRanchDaySave(nextSave, nextSave.ranchDay?.phase ?? "active"),
    );
    previousSaveRef.current = prepared;
    return base.saveCurrentGame(prepared);
  }, [base.currentSave, base.saveCurrentGame]);

  const advanceDay = useCallback((): DayAdvanceResult | null => {
    const current = base.currentSave;
    if (!current || dayEndLockRef.current) return null;
    const normalized = normalizeRanchDaySave(current);
    const phase = normalized.ranchDay?.phase ?? "active";
    if (phase === "morning") return null;
    if (phase === "active") {
      saveCurrentGame(enterEveningReview(normalized));
      return null;
    }

    dayEndLockRef.current = true;
    try {
      const bundle = advanceRanchDay(normalized);
      if (!bundle) {
        dayEndLockRef.current = false;
        return null;
      }
      base.saveCurrentGame(bundle.save);
      previousSaveRef.current = bundle.save;
      return bundle.result;
    } catch (error) {
      dayEndLockRef.current = false;
      throw error;
    }
  }, [base.currentSave, base.saveCurrentGame, saveCurrentGame]);

  const value = useMemo<BaseContextValue>(() => ({
    ...base,
    buildPhase: "Coliseum C1 — PvE Progression Foundation",
    saveCurrentGame,
    advanceDay,
  }), [base, saveCurrentGame, advanceDay]);

  return <RanchDayContext.Provider value={value}>{children}</RanchDayContext.Provider>;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  return (
    <Base.GameProvider>
      <RanchDayBridge>{children}</RanchDayBridge>
    </Base.GameProvider>
  );
}

export function useGameContext(): BaseContextValue {
  const context = useContext(RanchDayContext);
  if (!context) throw new Error("useGameContext must be used inside GameProvider.");
  return context;
}
