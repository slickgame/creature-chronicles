"use client";
import { useEffect, useRef } from "react";
import { RanchLedger } from "./RanchLedger";
import { useNavigation } from "./NavigationContext";
import { useGameContext } from "@/state/GameProvider";
import { RanchIcon } from "@/features/ui/RanchIcon";
import styles from "./Navigation.module.css";
/** A non-modal ledger: the ranch remains visible and usable alongside it. */
export function LedgerPanel() {
  const { open } = useNavigation();
  const { currentSave } = useGameContext();
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) open(null);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      else document.querySelector<HTMLElement>('[data-tutorial-id="ranch-morning-brief"]')?.focus({ preventScroll: true });
    };
  }, [open]);
  return <aside className={styles.ledgerPanel} aria-label="Today at the Ranch">
    <header className={styles.ledgerHeader}><RanchIcon name="leaf" /><div><h2>Today at the Ranch</h2><p>Day {currentSave?.dayState.dayNumber} · Ranch Ledger</p></div><button ref={close} type="button" onClick={() => open(null)} aria-label="Close ranch ledger">×</button></header>
    <div className={styles.ledgerScroll}><RanchLedger panel /></div>
    <button className={`${styles.primary} ${styles.endDay}`} type="button" data-tutorial-id="ranch-review-day" onClick={() => open("end-day")}><RanchIcon name="moon" />Review & End Day <span aria-hidden="true">›</span></button>
  </aside>;
}
