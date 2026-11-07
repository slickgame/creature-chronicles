"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BATTLE_OUTCOME_FADE_MS, type BattlePresentationEvent } from "@/data/battlePresentation";

export type BattlePresentationSpeed = 1 | 2;

const SPEED_KEY = "creature-chronicles:battle-presentation-speed";
const REDUCED_MOTION_KEY = "creature-chronicles:battle-reduced-motion";

export function useBattlePresentationController() {
  const [paused, setPaused] = useState(false);
  const [actionOrder, setActionOrder] = useState<string[]>([]);
  const [events, setEvents] = useState<BattlePresentationEvent[]>([]);
  const step = useCallback(() => setEvents(queue => queue.slice(1)), []);
  const [speed, setSpeedState] = useState<BattlePresentationSpeed>(1);
  const [reducedMotion, setReducedMotionState] = useState(false);
  const resultClock = useRef<{ event: BattlePresentationEvent; elapsed: number; reducedMotion: boolean } | null>(null);

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
    const current = events[0];
    if (current?.targetOutcomes) {
      if (resultClock.current?.event !== current || resultClock.current.reducedMotion !== reducedMotion) {
        resultClock.current = { event: current, elapsed: 0, reducedMotion };
      }
      if (paused) return;
      const clock = resultClock.current;
      const started = performance.now();
      const duration = reducedMotion ? BATTLE_OUTCOME_FADE_MS : current.durationMs;
      const timer = window.setTimeout(step, Math.max(0, (duration - clock.elapsed) / speed));
      return () => {
        window.clearTimeout(timer);
        clock.elapsed += (performance.now() - started) * speed;
      };
    }
    resultClock.current = null;
    if (!current || paused) return;
    const duration = reducedMotion ? 300 : Math.max(80, Math.round(current.durationMs / speed));
    const timer = window.setTimeout(step, duration);
    return () => window.clearTimeout(timer);
  }, [events, reducedMotion, speed, paused, step]);

  const play = useCallback((nextEvents: BattlePresentationEvent[], resolvedActorIds?: readonly string[]) => {
    setPaused(false);
    setActionOrder([...new Set(resolvedActorIds ?? nextEvents.flatMap(event => event.actorId ? [event.actorId] : []))]);
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
    displayState: events[0]?.state ?? null,
    paused, setPaused, step,
    actionOrder,
    queuedEventCount: events.length,
    isPlaying: events.length > 0,
    speed,
    reducedMotion,
    play,
    clear,
    setSpeed,
    setReducedMotion,
  }), [events, actionOrder, paused, step, speed, reducedMotion, play, clear, setSpeed, setReducedMotion]);
}

