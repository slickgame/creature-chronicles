"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getChapterOneTutorialProgress,
  isChapterOneGuidedTutorialActive,
} from "@/data/chapterOneGuidedTutorial";
import { RANCH_ADVISOR } from "@/data/ranchAdvisor";
import { useGameContext } from "@/state/GameProvider";
import styles from "./ColiseumC2ScreenTutorial.module.css";

const { ColiseumC2Screen: BaseColiseumC2Screen } = require("./ColiseumC2Screen") as {
  ColiseumC2Screen: React.ComponentType;
};

type CoachState = {
  key: string;
  title: string;
  body: string;
  target: HTMLElement | null;
  showHelp: boolean;
};

function buttonByText(predicate: (text: string) => boolean, root: ParentNode = document): HTMLButtonElement | null {
  return Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    predicate(button.textContent?.trim() ?? ""),
  ) ?? null;
}

function getOpeningScrimmageButton(): HTMLButtonElement | null {
  const heading = Array.from(document.querySelectorAll<HTMLElement>("h3")).find(
    (element) => element.textContent?.trim() === "Opening Scrimmage",
  );
  const panel = heading?.closest<HTMLElement>("section");
  return panel ? buttonByText((text) => text.includes("Enter") && text.includes("Match"), panel) : null;
}

function getEnemyTargetButton(): HTMLButtonElement | null {
  const enemyHeading = Array.from(document.querySelectorAll<HTMLElement>("span")).find(
    (element) => element.textContent?.trim() === "Authored Enemy Team",
  );
  const teamSection = enemyHeading?.closest<HTMLElement>("div");
  const outerSection = teamSection?.parentElement;
  return outerSection ? buttonByText((text) => text === "Select Target", outerSection) : null;
}

function getEnabledMoveButton(): HTMLButtonElement | null {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
    const text = button.textContent ?? "";
    return !button.disabled && text.includes("PWR ") && text.includes("ACC ") && text.includes("BE ");
  }) ?? null;
}

function inferCoachState(): CoachState {
  const recordButton = buttonByText((text) => text === "Record Result, XP & Purse");
  if (recordButton) {
    const outcome = document.querySelector<HTMLElement>("h2")?.textContent?.trim();
    return {
      key: `record-${outcome ?? "result"}`,
      title: outcome === "Victory" ? "Record Your First Victory" : "Record the Match Result",
      body: outcome === "Victory"
        ? "The battle is won. Record the result so Combat XP, the first-clear purse, and Chapter 1 progress are saved."
        : "Record the result to keep Combat XP and the permanent match history. A victory is still required to finish the lesson.",
      target: recordButton,
      showHelp: true,
    };
  }

  const roundHeading = Array.from(document.querySelectorAll<HTMLElement>("h1")).find((element) =>
    /^Round \d+$/.test(element.textContent?.trim() ?? ""),
  );
  if (roundHeading) {
    const round = Number(roundHeading.textContent?.match(/\d+/)?.[0] ?? 1);
    if (round >= 2) {
      return {
        key: `finish-round-${round}`,
        title: "First Round Complete",
        body: "You have used target-first planning, queued three actions, and resolved a round. Finish the match using the same rhythm.",
        target: null,
        showHelp: false,
      };
    }

    const confirmRound = buttonByText((text) => text === "Confirm Round");
    if (confirmRound && !confirmRound.disabled) {
      return {
        key: "confirm-first-round",
        title: "Resolve the Round",
        body: "All three actions are queued. Confirm the round to reveal enemy actions, resolve Speed order, apply damage and statuses, and tick cooldowns.",
        target: confirmRound,
        showHelp: true,
      };
    }

    const move = getEnabledMoveButton();
    if (move) {
      return {
        key: `choose-move-${move.textContent?.slice(0, 24) ?? "ready"}`,
        title: "Choose a Compatible Move",
        body: "The selected target determines which equipped moves are compatible. Choose a usable move and note its power, accuracy, Battle Energy cost, and cooldown.",
        target: move,
        showHelp: true,
      };
    }

    const target = getEnemyTargetButton();
    return {
      key: "select-target",
      title: "Target First",
      body: "Select one living enemy before choosing a move. After queuing the action, repeat target then move for each remaining ranch creature.",
      target,
      showHelp: Boolean(target),
    };
  }

  const enterBattle = buttonByText((text) => text === "Enter Opening Scrimmage");
  if (enterBattle) {
    return {
      key: "confirm-team",
      title: "Confirm Your First Team",
      body: "Three available creatures are selected automatically. Review their readiness and the fixed enemy preview, then enter the match.",
      target: enterBattle,
      showHelp: true,
    };
  }

  const openingMatch = getOpeningScrimmageButton();
  if (openingMatch) {
    return {
      key: "open-first-match",
      title: "Enter the Opening Scrimmage",
      body: "This authored beginner match introduces the target-first 3v3 battle loop. Open its first-clear match to continue.",
      target: openingMatch,
      showHelp: true,
    };
  }

  return {
    key: "find-first-match",
    title: "Find the Opening Scrimmage",
    body: "Return to the first Coliseum division and open the first available authored encounter.",
    target: null,
    showHelp: false,
  };
}

export function ColiseumC2Screen() {
  const { currentSave } = useGameContext();
  const [coach, setCoach] = useState<CoachState | null>(null);
  const active = useMemo(() => {
    if (!currentSave || !isChapterOneGuidedTutorialActive(currentSave)) return false;
    const progress = getChapterOneTutorialProgress(currentSave);
    return progress.battleOutfitterOpened && !progress.firstBattleWon;
  }, [currentSave]);

  useEffect(() => {
    if (!active) {
      setCoach(null);
      return;
    }
    let frame = 0;
    let previousTarget: HTMLElement | null = null;
    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const next = inferCoachState();
        previousTarget?.removeAttribute("data-battle-tutorial-target");
        previousTarget?.removeAttribute("data-tutorial-id");
        if (next.target) {
          next.target.dataset.battleTutorialTarget = "true";
          next.target.dataset.tutorialId = "tutorial-first-battle";
          previousTarget = next.target;
        } else {
          previousTarget = null;
        }
        setCoach((current) => current?.key === next.key && current.target === next.target ? current : next);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "class"] });
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.cancelAnimationFrame(frame);
      previousTarget?.removeAttribute("data-battle-tutorial-target");
      previousTarget?.removeAttribute("data-tutorial-id");
    };
  }, [active]);

  useEffect(() => {
    const globalGuide = document.querySelector<HTMLElement>('aside[aria-label="Guided Chapter 1 tutorial"]');
    if (!globalGuide || !active) return;
    const previousDisplay = globalGuide.style.display;
    globalGuide.style.display = "none";
    return () => {
      globalGuide.style.display = previousDisplay;
    };
  }, [active, coach?.key]);

  function showTarget() {
    coach?.target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    coach?.target?.animate(
      [
        { transform: "scale(1)", filter: "brightness(1)" },
        { transform: "scale(1.035)", filter: "brightness(1.35)" },
        { transform: "scale(1)", filter: "brightness(1)" },
      ],
      { duration: 700, easing: "ease-out" },
    );
  }

  return (
    <>
      <BaseColiseumC2Screen />
      {active && coach ? (
        <aside className={styles.coach} aria-label="First battle coach">
          <header>
            <img src={RANCH_ADVISOR.portraitPath} alt="" />
            <div><span>Day 5 · Battle Lesson</span><strong>{RANCH_ADVISOR.name}</strong></div>
          </header>
          <section>
            <h2>{coach.title}</h2>
            <p>{coach.body}</p>
          </section>
          {coach.showHelp ? <button type="button" onClick={showTarget}>Show Me</button> : null}
        </aside>
      ) : null}
    </>
  );
}
