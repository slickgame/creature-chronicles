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
import { useNavigation } from "@/features/navigation/NavigationContext";
import { GameDialog } from "@/features/ui/GameDialog";
import { useGameContext } from "@/state/GameProvider";
import styles from "./ChapterOneGuidedTutorial.module.css";

const SIGNAL_EVENT = "creature-chronicles:tutorial-signal";
const INVENTORY_EVENT = "creature-chronicles:open-tutorial-inventory";
type TutorialSignalEvent = CustomEvent<{ signal: ChapterOneTutorialSignal }>;

/** Progress tracking stays mounted; lessons appear only when opened from Menu. */
export function ChapterOneGuidedTutorial() {
  const {
    appScreen, currentSave, goToBattleDebug, goToBattleOutfitter,
    goToBreeding, goToGuildHall, goToMarket, goToRanchOffice, goToRanch, goToRanchJobs, goToTown,
    saveCurrentGame,
  } = useGameContext();
  const { view, open } = useNavigation();
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [requestedReview, setRequestedReview] = useState<"ledger" | "end-day" | null>(null);
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
    if (!currentSave) return;
    const signals: Partial<Record<typeof appScreen, ChapterOneTutorialSignal>> = {
      town: "town-opened", market: "market-opened", "ranch-office": "office-opened",
      "battle-outfitter": "battle-outfitter-opened",
    };
    const signal = signals[appScreen];
    if (!signal) return;
    const updated = markChapterOneTutorialSignal(currentSave, signal);
    if (updated !== currentSave) saveCurrentGame(updated);
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
    if (!requestedReview || appScreen !== "ranch-hub") return;
    open(requestedReview);
    setRequestedReview(null);
    if (requestedReview === "ledger" && currentSave?.ranchDay?.phase !== "morning") {
      window.dispatchEvent(new CustomEvent(SIGNAL_EVENT, { detail: {
        signal: (currentSave?.dayState.dayNumber ?? 1) > 1 ? "day-two-brief-opened" : "morning-opened",
      } }));
    }
  }, [requestedReview, appScreen, currentSave, open]);

  if (!currentSave || view !== "guide") return null;
  const save = currentSave;

  function close() {
    setConfirmSkip(false);
    open(null);
  }

  function route(action: ChapterOneTutorialAction) {
    close();
    if (action === "ranch") {
      setRequestedReview(step?.targetId === "ranch-end-day" || step?.targetId === "ranch-review-day" ? "end-day" : "ledger");
      goToRanch();
    } else if (action === "chores") goToRanchJobs();
    else if (action === "town") goToTown();
    else if (action === "market") goToMarket();
    else if (action === "office") goToRanchOffice();
    else if (action === "guild") goToGuildHall();
    else if (action === "breeding") goToBreeding();
    else if (action === "battle-outfitter") {
      saveCurrentGame(markChapterOneTutorialSignal(save, "battle-outfitter-opened"));
      goToBattleOutfitter();
    } else if (action === "coliseum") goToBattleDebug();
    else if (action === "inventory") {
      saveCurrentGame(markChapterOneTutorialSignal(save, "inventory-opened"));
      window.dispatchEvent(new CustomEvent(INVENTORY_EVENT));
    }
  }

  return (
    <GameDialog title="Chapter 1 Guide" onClose={close}>
      <section className={styles.guide} data-tutorial-card="true" aria-label="Chapter 1 lessons">
        <header className={styles.header}>
          <img src={RANCH_ADVISOR.portraitPath} alt="" />
          <div><strong>{RANCH_ADVISOR.name}’s field notes</strong><p>Open these lessons whenever you need a hand.</p></div>
        </header>
        {step ? <>
          <p className={styles.kicker}>{step.dayLabel}</p>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
          <div className={styles.hint}>{step.hint}</div>
          <div className={styles.actions}>
            <button type="button" onClick={close}>Keep Exploring</button>
            {step.action !== "none" && <button type="button" className={styles.primary} onClick={() => route(step.action)}>{step.actionLabel}</button>}
          </div>
          {confirmSkip ? <section className={styles.confirm} aria-label="Skip walkthrough confirmation">
            <p>Skip the walkthrough? Story scenes and beginner milestones will remain available.</p>
            <div className={styles.actions}>
              <button type="button" onClick={() => setConfirmSkip(false)}>Keep Walkthrough</button>
              <button type="button" onClick={() => { saveCurrentGame(skipChapterOneGuidedTutorial(save)); setConfirmSkip(false); }}>Skip Walkthrough</button>
            </div>
          </section> : <button type="button" className={styles.skip} onClick={() => setConfirmSkip(true)}>Skip walkthrough…</button>}
        </> : <>
          <h3>{save.flags.chapterOneGuidedSkipped ? "Walkthrough skipped" : save.flags.m24IntroSeen !== true ? "Your guide will be ready soon" : "You’re free to explore"}</h3>
          <p>{save.flags.m24IntroSeen !== true ? "Meet Veyra at the ranch to begin Chapter 1." : "You can still find goals and story records in the Journal, or ask Veyra for advice from the menu."}</p>
        </>}
        <button type="button" onClick={() => { setConfirmSkip(false); open("menu"); }}>Back to Menu</button>
      </section>
    </GameDialog>
  );
}

export const CHAPTER_ONE_TUTORIAL_SIGNAL_EVENT = SIGNAL_EVENT;
export const CHAPTER_ONE_TUTORIAL_INVENTORY_EVENT = INVENTORY_EVENT;

