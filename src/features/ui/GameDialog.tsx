"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./GameDialog.module.css";

/** Native modal semantics provide focus containment, Escape and an inert background. */
export function GameDialog({
  title,
  onClose,
  children,
  wide = false,
  side = false,
  fullScreen = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  side?: boolean;
  fullScreen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    if (!dialog) return;
    dialog.showModal();
    (
      (fullScreen ? dialog.querySelector<HTMLElement>("main button") : null) ??
      dialog.querySelector<HTMLElement>("[data-initial-focus]") ??
      dialog.querySelector<HTMLElement>("button")
    )?.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>("[data-navigation-launcher]")?.focus();
    };
  }, [fullScreen]);
  const dialog = (
    <dialog
      role="dialog"
      ref={ref}
      className={`${styles.dialog} ${wide ? styles.wide : ""} ${side ? styles.side : ""} ${fullScreen ? styles.fullScreen : ""}`}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <header className={styles.heading}>
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={onClose} aria-label={`Close ${title}`}>
          Close ×
        </button>
      </header>
      <div className={styles.content}>{children}</div>
    </dialog>
  );
  return fullScreen && typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog;
}
