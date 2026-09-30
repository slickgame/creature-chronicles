"use client";

import { useGameContext } from "@/state/GameProvider";
import type { ReactNode } from "react";
import { useNavigation } from "./NavigationContext";
import styles from "./ScreenNavigation.module.css";

/** In-flow navigation reserves its own space alongside each interior's controls. */
export function ScreenNavigation({ children }: { children?: ReactNode }) {
  const { goToRanch } = useGameContext();
  const { open } = useNavigation();

  return (
    <nav className={styles.actions} aria-label="Screen navigation">
      {children ? <div className={styles.related}>{children}</div> : null}
      <button type="button" className={styles.back} onClick={goToRanch}>
        <span aria-hidden="true">←</span> Back to Ranch
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
    </nav>
  );
}
