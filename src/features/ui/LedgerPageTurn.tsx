"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import s from "./LedgerPageTurn.module.css";

type Direction = "next" | "previous";
const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const TURN_MIDPOINT = 310;
const TURN_TIMEOUT = 720;

/** Keep page focus and commit exactly once, midway through the approved 620ms leaf. */
export function useLedgerPageTurn() {
  const [direction, setDirection] = useState<Direction | null>(null);
  const active = useRef(false);
  const timers = useRef<number[]>([]);
  const pending = useRef<(() => void) | null>(null);

  const commitPending = useCallback(() => {
    const commit = pending.current;
    pending.current = null;
    commit?.();
  }, []);

  const clearTurn = useCallback(() => {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current = [];
    pending.current = null;
    active.current = false;
  }, []);

  const finishTurn = useCallback(() => {
    if (!active.current) return;
    commitPending();
    clearTurn();
    setDirection(null);
  }, [clearTurn, commitPending]);

  useEffect(() => {
    const motion = window.matchMedia(MOTION_QUERY);
    const update = () => { if (motion.matches) finishTurn(); };
    motion.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      clearTurn();
    };
  }, [clearTurn, finishTurn]);

  function turnPage(next: Direction, commit: () => void) {
    if (active.current) return;
    if (window.matchMedia(MOTION_QUERY).matches) {
      commit();
      return;
    }
    active.current = true;
    pending.current = commit;
    setDirection(next);
    timers.current = [
      window.setTimeout(commitPending, TURN_MIDPOINT),
      window.setTimeout(finishTurn, TURN_TIMEOUT),
    ];
  }

  return { direction, turning: direction !== null, turnPage, finishTurn };
}

export function LedgerPageTurn({ direction, onFinish }: {
  direction: Direction | null;
  onFinish?: () => void;
}) {
  if (!direction) return null;
  return <div className={s.stage} aria-hidden="true" data-ledger-page-turn={direction}>
    <div className={s.leaf} data-direction={direction} onAnimationEnd={event => {
      if (event.target === event.currentTarget) onFinish?.();
    }}>
      <div className={s.front} />
      <div className={s.back} />
    </div>
  </div>;
}
