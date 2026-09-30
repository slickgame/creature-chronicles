"use client";

import { useEffect, useRef, useState } from "react";
import { getChapterOneStoryLog } from "@/data/chapterOneStory";
import { getStarterGoals } from "@/data/starterGoals";
import { PlayerInventoryMenu } from "@/features/inventory/PlayerInventoryMenu";
import { RanchAdvisorOverlay } from "@/features/ranch/RanchAdvisorOverlay";
import { GameDialog } from "@/features/ui/GameDialog";
import { useGameContext, type DayAdvanceResult } from "@/state/GameProvider";
import { useNavigation } from "./NavigationContext";
import {
  cancelEveningReview,
  enterEveningReview,
} from "@/data/ranch-day/ranchDayState";
import { LedgerPanel } from "./LedgerPanel";
import { RanchLedger } from "./RanchLedger";
import { NavigationIcon } from "./NavigationIcon";
import styles from "./Navigation.module.css";

export function NavigationChrome() {
  const game = useGameContext();
  const { view, open } = useNavigation();
  const [report, setReport] = useState<DayAdvanceResult | null>(null);
  const sleeping = useRef(false);
  useEffect(() => {
    open(null);
    setReport(null);
  }, [game.appScreen, open]);
  useEffect(() => {
    const save = game.currentSave;
    if (view === "end-day" && save) {
      if (save.ranchDay?.phase === "morning") open("ledger");
      else if (save.ranchDay?.phase !== "evening")
        game.saveCurrentGame(enterEveningReview(save));
    }
  }, [view, game, open]);
  useEffect(() => {
    if (
      game.appScreen === "ranch-hub" &&
      game.currentSave?.ranchDay?.phase === "morning" &&
      game.currentSave.flags.m24IntroSeen &&
      !view &&
      !report
    )
      open("ledger");
  }, [
    game.appScreen,
    game.currentSave?.dayState.dayNumber,
    game.currentSave?.flags.m24IntroSeen,
    game.currentSave?.ranchDay?.phase,
    open,
    report,
    view,
  ]);
  useEffect(() => {
    const show = () => open("inventory");
    window.addEventListener("creature-chronicles:open-player-menu", show);
    window.addEventListener(
      "creature-chronicles:open-inventory-creature",
      show,
    );
    return () => {
      window.removeEventListener("creature-chronicles:open-player-menu", show);
      window.removeEventListener(
        "creature-chronicles:open-inventory-creature",
        show,
      );
    };
  }, [open]);
  if (!game.currentSave) return null;
  const save = game.currentSave;
  function closeReview() {
    game.saveCurrentGame(cancelEveningReview(save));
    open(null);
  }
  function go(action: () => void) {
    open(null);
    action();
  }
  function sleep() {
    if (sleeping.current) return;
    sleeping.current = true;
    try {
      const result = game.advanceDay();
      if (result) {
        open("morning-report");
        setReport(result);
      }
    } finally {
      sleeping.current = false;
    }
  }
  const localLauncher = ["ranch-hub", "town", "egg-atelier", "collection", "ranch-jobs", "nursery"].includes(
    game.appScreen,
  );
  const destinations = [
    {
      title: "Inventory",
      hint: "Items and supplies",
      icon: "icon_shop_bag.png",
      action: () => open("inventory"),
    },
    {
      title: "Creatures",
      hint: "Profiles and comparison",
      icon: "icon_collection_book.png",
      action: () => go(game.goToCollection),
    },
    {
      title: "Ranch Status",
      hint: "Feed, condition and tax",
      icon: "icon_ranch_ledger.png",
      action: () => open("ledger"),
    },
    {
      title: "Journal",
      hint: "Goals and story",
      icon: "icon_contract_scroll.png",
      action: () => open("journal"),
    },
    {
      title: "Travel",
      hint: "Ranch and town",
      icon: "icon_home.png",
      action: () => open("travel"),
    },
    {
      title: "Save & Options",
      hint: "Save files and preferences",
      icon: "icon_paw_crest.png",
      action: () => go(game.goToMainMenu),
    },
  ];
  return (
    <>
      {!localLauncher && (
        <button
          type="button"
          className={styles.launcher}
          onClick={() => open("menu")}
          data-navigation-launcher aria-haspopup="dialog"
        >
          ☰ Menu
        </button>
      )}
      {view === "menu" && (
        <GameDialog title="Menu" onClose={() => open(null)}>
          <div className={styles.menuGrid}>
            {destinations.map((item) => (
              <button
                type="button"
                key={item.title}
                onClick={item.action}
                className={styles.destination}
              >
                <NavigationIcon name={item.title} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.hint}</small>
                </span>
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={() => open("guide")}>
              Chapter 1 Guide
            </button>
            <button type="button" onClick={() => open("advisor")}>
              Ask Veyra
            </button>
            {save.settings.devMode && (
              <details>
                <summary>Developer tools</summary>
                <button type="button" onClick={() => go(game.goToDevTools)}>
                  Open Dev Tools
                </button>
              </details>
            )}
          </div>
          <p className={styles.note}>
            Local save · File {save.slotIndex + 1} · Day{" "}
            {save.dayState.dayNumber}
          </p>
        </GameDialog>
      )}
      <PlayerInventoryMenu
        controlledOpen={view === "inventory"}
        onClose={() => open(null)}
      />
      {view === "ledger" && (
        <LedgerPanel />
      )}
      {view === "end-day" && (
        <GameDialog title="End Day?" onClose={closeReview}>
          <RanchLedger endDay />
          <div className={styles.actions}>
            <button type="button" data-initial-focus onClick={closeReview}>
              Keep Playing
            </button>
            <button
              type="button"
              className={styles.primary}
              data-tutorial-id="ranch-end-day"
              onClick={sleep}
            >
              Sleep & Advance Day
            </button>
          </div>
        </GameDialog>
      )}
      {view === "travel" && (
        <GameDialog title="Travel" onClose={() => open(null)}>
          <div className={styles.menuGrid}>
            {[
              ["Ranch", game.goToRanch],
              ["Town", game.goToTown],
              ["Ranch Chores", game.goToRanchJobs],
              ["Ranch Office", game.goToRanchOffice],
              ["Nursery", game.goToNursery],
              ["Breeding Pen", game.goToBreeding],
            ].map(([label, action]) => (
              <button
                type="button"
                key={String(label)}
                onClick={() => go(action as () => void)}
              >
                {String(label)} →
              </button>
            ))}
          </div>
          <p className={styles.note}>
            Town services and expansion projects retain their usual access
            requirements.
          </p>
        </GameDialog>
      )}
      {view === "journal" && (
        <GameDialog title="Journal" onClose={() => open(null)} wide>
          <h3>Goals</h3>
          {getStarterGoals(save).map((goal) => (
            <article key={goal.id} className={styles.ledgerRow}>
              <div>
                <h3>
                  {goal.complete ? "✓ " : "○ "}
                  {goal.label}
                </h3>
                <p>{goal.description}</p>
                <small>{goal.hint}</small>
              </div>
            </article>
          ))}
          <h3>Story records</h3>
          {getChapterOneStoryLog(save).map((entry) => (
            <details key={entry.id} className={styles.story}>
              <summary>
                {entry.title} · {entry.seen ? "Unlocked" : "Locked"}
              </summary>
              {entry.seen ? (
                entry.pages.map((page, index) => (
                  <p key={index}>
                    <strong>{page.speaker}</strong>
                    <br />
                    {page.text}
                  </p>
                ))
              ) : (
                <p>
                  {entry.lockedReason ??
                    "Continue the story to unlock this record."}
                </p>
              )}
            </details>
          ))}
        </GameDialog>
      )}
      {view === "advisor" && (
        <GameDialog title="Veyra's Advice" onClose={() => open(null)}>
          <RanchAdvisorOverlay embedded />
        </GameDialog>
      )}
      {report && (
        <GameDialog
          title="Morning Report"
          onClose={() => {
            setReport(null);
            open("ledger");
          }}
          wide
        >
          <p>
            {report.previousDateLabel} → {report.nextDateLabel}
          </p>
          <ul className={styles.reportList}>
            {report.summaryItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              setReport(null);
              open("ledger");
            }}
          >
            Review Morning Brief
          </button>
        </GameDialog>
      )}
    </>
  );
}
