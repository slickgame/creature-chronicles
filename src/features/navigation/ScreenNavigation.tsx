"use client";

import { useGameContext } from "@/state/GameProvider";
import { useState, type ReactNode } from "react";
import { useNavigation } from "./NavigationContext";
import { GameDialog } from "@/features/ui/GameDialog";
import styles from "./ScreenNavigation.module.css";

/** In-flow navigation reserves its own space alongside each interior's controls. */
export function ScreenNavigation({ children, onBack, backLabel = "Ranch" }: { children?: ReactNode; onBack?: () => void; backLabel?: string }) {
  const { goToRanch } = useGameContext();
  const { open } = useNavigation();
  const [more, setMore] = useState(false);

  return (
    <nav className={styles.actions} aria-label="Screen navigation">
      {children ? <><div className={styles.related}>{children}</div><button className={styles.more} type="button" onClick={() => setMore(true)}>More</button></> : null}
      <button type="button" className={styles.back} onClick={onBack ?? goToRanch} aria-label={`Back to ${backLabel}`}>
        <span aria-hidden="true">←</span> <span className={styles.backPrefix}>Back to </span>{backLabel}
      </button>
      <button
        type="button"
        className={styles.menu}
        onClick={() => open("menu")}
        data-navigation-launcher
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">☰</span> Menu
      </button>
      {more ? <GameDialog title="Related Screens" onClose={() => setMore(false)}><div className={styles.moreLinks} onClick={() => setMore(false)}>{children}</div></GameDialog> : null}
    </nav>
  );
}
