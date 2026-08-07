"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getChapterOneGuidedTutorialStep,
  markChapterOneTutorialSignal,
  prepareChapterOneGuidedTutorialSave,
  skipChapterOneGuidedTutorial,
  type ChapterOneTutorialAction,
  type ChapterOneTutorialSignal,
} from "@/data/chapterOneGuidedTutorial";
import { RANCH_ADVISOR } from "@/data/ranchAdvisor";
import { useGameContext } from "@/state/GameProvider";
import styles from "./ChapterOneGuidedTutorial.module.css";

const SIGNAL_EVENT = "creature-chronicles:tutorial-signal";
const INVENTORY_EVENT = "creature-chronicles:open-tutorial-inventory";
export const CHAPTER_ONE_TUTORIAL_OPEN_EVENT = "creature-chronicles:open-guided-chapter-one";

type TutorialSignalEvent = CustomEvent<{ signal: ChapterOneTutorialSignal }>;

type TargetBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function targetSelector(targetId?: string): string | null {
  return targetId ? `[data-tutorial-id="${targetId}"]` : null;
}

export function ChapterOneGuidedTutorial() {
  const {
    appScreen,
    currentSave,
    goToBattleDebug,
    goToBattleOutfitter,
    goToBreeding,
    goToGuildHall,
    goToRanch,
    goToRanchJobs,
    goToTown,
    saveCurrentGame,
  } = useGameContext();
  const [targetBox, setTargetBox] = useState<TargetBox | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [helpPulse, setHelpPulse] = useState(0);
  const step = useMemo(
    () => currentSave ? getChapterOneGuidedTutorialStep(currentSave) : null,
    [currentSave],
  );

  useEffect(() => {
    if (!currentSave) return;
    const prepared = prepareChapterOneGuidedTutorialSave(currentSave);
    if (prepared !== currentSave) saveCurrentGame(prepared);
  }, [currentSave, saveCurrentGame]);

  useEffect(() => {
    if (!currentSave || appScreen !== "battle-outfitter" || currentSave.flags.chapterOneGuidedBattleOutfitterOpened === true) return;
    saveCurrentGame(markChapterOneTutorialSignal(currentSave, "battle-outfitter-opened"));
  }, [appScreen, currentSave, saveCurrentGame]);

  useEffect(() => {
    function handleSignal(event: Event) {
      if (!currentSave) return;
      const signal = (event as TutorialSignalEvent).detail?.signal;
      if (!signal) return;
      saveCurrentGame(markChapterOneTutorialSignal(currentSave, signal));
    }
    window.addEventListener(SIGNAL_EVENT, handleSignal);
    return () => window.removeEventListener(SIGNAL_EVENT, handleSignal);
  }, [currentSave, saveCurrentGame]);

  useEffect(() => {
    function handleOpenFromMenu() {
      setCollapsed(false);
      window.setTimeout(() => setHelpPulse((value) => value + 1), 20);
    }
    window.addEventListener(CHAPTER_ONE_TUTORIAL_OPEN_EVENT, handleOpenFromMenu);
    return () => window.removeEventListener(CHAPTER_ONE_TUTORIAL_OPEN_EVENT, handleOpenFromMenu);
  }, []);

  useEffect(() => {
    if (collapsed) {
      setTargetBox(null);
      return;
    }
    const selector = targetSelector(step?.targetId);
    if (!selector) {
      setTargetBox(null);
      return;
    }
    let frame = 0;
    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) {
          setTargetBox(null);
          return;
        }
        const rect = element.getBoundingClientRect();
        setTargetBox({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        element.classList.add(styles.target);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      const element = document.querySelector<HTMLElement>(selector);
      element?.classList.remove(styles.target);
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
      window.cancelAnimationFrame(frame);
    };
  }, [step?.targetId, appScreen, helpPulse, collapsed]);

  useEffect(() => {
    if (collapsed || !step?.lockToTarget || !step.targetId) return;
    const selector = targetSelector(step.targetId)!;
    function enforceTarget(event: MouseEvent) {
      const clicked = event.target as Element | null;
      if (!clicked || clicked.closest('[data-tutorial-card="true"]')) return;
      const target = document.querySelector(selector);
      if (!target || target.contains(clicked)) return;
      event.preventDefault();
      event.stopPropagation();
      setHelpPulse((value) => value + 1);
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
    document.addEventListener("click", enforceTarget, true);
    return () => document.removeEventListener("click", enforceTarget, true);
  }, [step?.id, step?.lockToTarget, step?.targetId, collapsed]);

  if (!currentSave || !step) return null;
  const activeSave = currentSave;
  const activeStep = step;

  function persistSignal(signal: ChapterOneTutorialSignal) {
    saveCurrentGame(markChapterOneTutorialSignal(activeSave, signal));
  }

  function route(action: ChapterOneTutorialAction) {
    if (action === "ranch") goToRanch();
    else if (action === "chores") goToRanchJobs();
    else if (action === "town") goToTown();
    else if (action === "guild") goToGuildHall();
    else if (action === "breeding") goToBreeding();
    else if (action === "battle-outfitter") {
      persistSignal("battle-outfitter-opened");
      goToBattleOutfitter();
    } else if (action === "coliseum") goToBattleDebug();
    else if (action === "inventory") {
      persistSignal("inventory-opened");
      window.dispatchEvent(new CustomEvent(INVENTORY_EVENT));
    }
    window.setTimeout(() => setHelpPulse((value) => value + 1), 60);
  }

  function showTarget() {
    const selector = targetSelector(activeStep.targetId);
    const element = selector ? document.querySelector<HTMLElement>(selector) : null;
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      setHelpPulse((value) => value + 1);
      return;
    }
    route(activeStep.action);
  }

  function handleSkip() {
    if (!window.confirm("Skip the guided Chapter 1 walkthrough? Beginner Milestones and story scenes will remain available.")) return;
    saveCurrentGame(skipChapterOneGuidedTutorial(activeSave));
  }

  if (collapsed) return null;

  return (
    <>
      {targetBox ? (
        <div
          className={styles.spotlight}
          style={{
            top: Math.max(4, targetBox.top - 7),
            left: Math.max(4, targetBox.left - 7),
            width: targetBox.width + 14,
            height: targetBox.height + 14,
          }}
          aria-hidden="true"
        />
      ) : null}
      <aside className={styles.card} data-tutorial-card="true" aria-label="Guided Chapter 1 tutorial">
        <header className={styles.header}>
          <img src={RANCH_ADVISOR.portraitPath} alt="" />
          <div>
            <span>{activeStep.dayLabel}</span>
            <strong>{RANCH_ADVISOR.name}</strong>
          </div>
          <button type="button" onClick={() => setCollapsed(true)} aria-label="Hide tutorial; reopen it from Menu → Quests">−</button>
        </header>
        <section className={styles.body}>
          <p className={styles.kicker}>Current Lesson</p>
          <h2>{activeStep.title}</h2>
          <p>{activeStep.body}</p>
          <div className={styles.hint}>{activeStep.hint}</div>
        </section>
        <footer className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={handleSkip}>Skip</button>
          <button type="button" className={styles.secondary} onClick={showTarget}>Help</button>
          {activeStep.action !== "none" ? (
            <button type="button" className={styles.primary} onClick={() => route(activeStep.action)}>{activeStep.actionLabel}</button>
          ) : null}
        </footer>
      </aside>
    </>
  );
}

export const CHAPTER_ONE_TUTORIAL_SIGNAL_EVENT = SIGNAL_EVENT;
export const CHAPTER_ONE_TUTORIAL_INVENTORY_EVENT = INVENTORY_EVENT;
