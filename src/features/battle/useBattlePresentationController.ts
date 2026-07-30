"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BattlePresentationEvent } from "@/data/battlePresentation";

export type BattlePresentationSpeed = 1 | 2;

const SPEED_KEY = "creature-chronicles:battle-presentation-speed";
const REDUCED_MOTION_KEY = "creature-chronicles:battle-reduced-motion";

export function useBattlePresentationController() {
  const [events, setEvents] = useState<BattlePresentationEvent[]>([]);
  const [speed, setSpeedState] = useState<BattlePresentationSpeed>(1);
  const [reducedMotion, setReducedMotionState] = useState(false);

  useEffect(() => {
    const storedSpeed = window.localStorage.getItem(SPEED_KEY);
    if (storedSpeed === "2") setSpeedState(2);
    const storedReducedMotion = window.localStorage.getItem(REDUCED_MOTION_KEY);
    if (storedReducedMotion === "true") {
      setReducedMotionState(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setReducedMotionState(true);
  }, []);

  useEffect(() => {
    if (!events.length) return;
    const current = events[0];
    const duration = reducedMotion ? 40 : Math.max(80, Math.round(current.durationMs / speed));
    const timer = window.setTimeout(() => setEvents((queue) => queue.slice(1)), duration);
    return () => window.clearTimeout(timer);
  }, [events, reducedMotion, speed]);

  const play = useCallback((nextEvents: BattlePresentationEvent[]) => {
    setEvents(nextEvents);
  }, []);

  const clear = useCallback(() => setEvents([]), []);

  const setSpeed = useCallback((nextSpeed: BattlePresentationSpeed) => {
    setSpeedState(nextSpeed);
    window.localStorage.setItem(SPEED_KEY, String(nextSpeed));
  }, []);

  const setReducedMotion = useCallback((nextValue: boolean) => {
    setReducedMotionState(nextValue);
    window.localStorage.setItem(REDUCED_MOTION_KEY, String(nextValue));
  }, []);

  return useMemo(() => ({
    activeEvent: events[0] ?? null,
    queuedEventCount: events.length,
    isPlaying: events.length > 0,
    speed,
    reducedMotion,
    play,
    clear,
    setSpeed,
    setReducedMotion,
  }), [events, speed, reducedMotion, play, clear, setSpeed, setReducedMotion]);
}
