"use client";

import { useEffect, type RefObject } from "react";

type Reservation = {
  width: number;
  height: number;
  visible: boolean;
};

const reservations = new Map<string, Reservation>();
const DESKTOP_DOCK_MIN_WIDTH = 1100;
const DESKTOP_DOCK_MIN_HEIGHT = 560;

function applyReservations() {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const visible = Array.from(reservations.values()).filter((entry) => entry.visible);

  if (!visible.length) {
    root.removeAttribute("data-tutorial-dock-side");
    root.style.removeProperty("--tutorial-dock-space");
    return;
  }

  const dockRight = window.innerWidth >= DESKTOP_DOCK_MIN_WIDTH && window.innerHeight >= DESKTOP_DOCK_MIN_HEIGHT;
  if (dockRight) {
    const width = Math.max(...visible.map((entry) => entry.width), 0);
    root.dataset.tutorialDockSide = "right";
    root.style.setProperty("--tutorial-dock-space", `${Math.ceil(width + 36)}px`);
    return;
  }

  const height = Math.max(...visible.map((entry) => entry.height), 0);
  root.dataset.tutorialDockSide = "bottom";
  root.style.setProperty("--tutorial-dock-space", `${Math.ceil(height + 24)}px`);
}

function measureElement(element: HTMLElement | null): Reservation {
  if (!element) return { width: 0, height: 0, visible: false };
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return { width: 0, height: 0, visible: false };
  }
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
    visible: rect.width > 0 && rect.height > 0,
  };
}

export function useTutorialViewportDock(
  reservationId: string,
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    let frame = 0;
    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        reservations.set(
          reservationId,
          enabled ? measureElement(ref.current) : { width: 0, height: 0, visible: false },
        );
        applyReservations();
      });
    };

    sync();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    const mutationObserver = typeof MutationObserver !== "undefined" ? new MutationObserver(sync) : null;
    if (ref.current) {
      resizeObserver?.observe(ref.current);
      mutationObserver?.observe(ref.current, { attributes: true, attributeFilter: ["style", "class", "hidden"] });
    }
    window.addEventListener("resize", sync);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", sync);
      reservations.delete(reservationId);
      applyReservations();
    };
  }, [enabled, ref, reservationId]);
}
