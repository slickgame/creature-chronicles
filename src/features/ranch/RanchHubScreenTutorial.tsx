"use client";

import { useEffect } from "react";
import { getChapterTwoState } from "@/data/chapterTwoTroubleBeyondFence";
import { ChapterTwoAftermathPanel } from "@/features/story/ChapterTwoAftermathPanel";
import { ChapterTwoQuestPanel } from "@/features/story/ChapterTwoQuestPanel";
import { useGameContext } from "@/state/GameProvider";
import { RanchHubScreen as DayLoopRanchHubScreen } from "./RanchHubScreenDayLoop";

const SIGNAL_EVENT = "creature-chronicles:tutorial-signal";

function text(element: Element): string {
  return element.textContent?.trim() ?? "";
}

export function RanchHubScreen() {
  const { currentSave } = useGameContext();

  useEffect(() => {
    let frame = 0;
    const tagControls = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        for (const button of document.querySelectorAll<HTMLButtonElement>("button")) {
          const label = text(button);
          if (label === "Morning Brief") button.dataset.tutorialId = "ranch-morning-brief";
          else if (label === "Begin Ranch Day") button.dataset.tutorialId = "ranch-begin-day";
          else if (label === "Review Day") button.dataset.tutorialId = "ranch-review-day";
          else if (label === "End Day") button.dataset.tutorialId = "ranch-end-day";
        }
      });
    };
    tagControls();
    const observer = new MutationObserver(tagControls);
    observer.observe(document.body, { childList: true, subtree: true });

    function recordBrief(event: MouseEvent) {
      const button = (event.target as Element | null)?.closest<HTMLElement>(
        '[data-tutorial-id="ranch-morning-brief"], [data-tutorial-id="ranch-begin-day"]',
      );
      if (!button || !currentSave) return;
      const signal = currentSave.flags.chapterOneGuidedMorningOpened === true && currentSave.dayState.dayNumber > 1
        ? "day-two-brief-opened"
        : "morning-opened";
      window.dispatchEvent(new CustomEvent(SIGNAL_EVENT, { detail: { signal } }));
    }
    document.addEventListener("click", recordBrief, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", recordBrief, true);
      window.cancelAnimationFrame(frame);
    };
  }, [currentSave]);

  const chapterTwoComplete = currentSave ? getChapterTwoState(currentSave).stage === "complete" : false;

  return (
    <>
      <DayLoopRanchHubScreen />
      {chapterTwoComplete ? <ChapterTwoAftermathPanel /> : <ChapterTwoQuestPanel />}
    </>
  );
}
