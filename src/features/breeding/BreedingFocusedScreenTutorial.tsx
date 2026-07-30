"use client";

import { useEffect } from "react";
import { BreedingFocusedScreen as MoveBreedingScreen } from "./BreedingFocusedScreenMoves";

export function BreedingFocusedScreen() {
  useEffect(() => {
    let frame = 0;
    const tagControls = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const workspace = document.querySelector<HTMLElement>(
          'section[aria-label="Focused breeding pair preview"]',
        );
        if (workspace) workspace.dataset.tutorialId = "tutorial-breeding-workspace";
        const attempt = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
          (button) => button.textContent?.trim() === "Attempt Breeding",
        );
        if (attempt) attempt.dataset.tutorialId = "tutorial-breeding-attempt";
      });
    };
    tagControls();
    const observer = new MutationObserver(tagControls);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <MoveBreedingScreen />;
}
