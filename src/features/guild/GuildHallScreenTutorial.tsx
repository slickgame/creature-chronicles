"use client";

import { useEffect } from "react";
import { GuildHallScreen as BaseGuildHallScreen } from "./GuildHallScreen";

export function GuildHallScreen() {
  useEffect(() => {
    let frame = 0;
    const tagControls = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const board = document.querySelector<HTMLElement>('[data-contract-board="list"]');
        if (board) {
          board.dataset.tutorialId = "tutorial-guild-request";
          return;
        }
        const requestBoard = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
          (button) => button.textContent?.includes("Request Board"),
        );
        if (requestBoard) requestBoard.dataset.tutorialId = "tutorial-guild-request";
      });
    };
    tagControls();
    const observer = new MutationObserver(tagControls);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <BaseGuildHallScreen />;
}
