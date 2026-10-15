"use client";

import {RanchReview} from "@/features/ranch/RanchReview";
import {NightCareReview} from "./NightCareReview";
import { useEffect, useRef, useState } from "react";
import { RanchJournal } from "@/features/ranch/RanchJournal";
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
import { NavigationIcon } from "./NavigationIcon";
import styles from "./Navigation.module.css";

export function NavigationChrome() {
  const game = useGameContext();
  const { view, open, setRanchView, setRanchPlot, nightReturn, setNightReturn } = useNavigation();
  const [report, setReport] = useState<DayAdvanceResult | null>(null);
  const sleeping = useRef(false);
  const previousScreen=useRef(game.appScreen);
  useEffect(() => {
    if(previousScreen.current===game.appScreen)return;
    previousScreen.current=game.appScreen;
    open(nightReturn?.screen===game.appScreen?"end-day":null);
    setReport(null);
  }, [game.appScreen, open, nightReturn]);
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
    setNightReturn(null);
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
    setNightReturn(null);
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
  const localLauncher = ["battle-debug", "ranch-hub", "town", "guild-hall", "training-grounds", "battle-outfitter", "egg-atelier", "collection", "ranch-jobs", "nursery", "breeding", "habitat", "ranch-office", "market", "supply-depot"].includes(
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
      {view === "end-day" && <NightCareReview onClose={closeReview} onSleep={sleep}/>}
      {view === "travel" && (
        <GameDialog title="Travel" onClose={() => open(null)}>
          <div className={styles.menuGrid}>
            {[
              ["Ranch", game.goToRanch],
              ["Town", game.goToTown],
              ["Ranch House", ()=>{setRanchPlot(0);setRanchView("house");game.goToRanch();}],
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
      {view === "journal" && <RanchJournal onClose={()=>open(null)}/>}
      {view === "advisor" && (
        <GameDialog title="Veyra's Advice" onClose={() => open(null)}>
          <RanchAdvisorOverlay embedded />
        </GameDialog>
      )}
      {report && <RanchReview title="Morning Report" art="/images/ui/ranch-v3/house.webp" onClose={()=>{setReport(null);open("ledger");}} pages={Array.from({length:Math.max(1,Math.ceil(report.summaryItems.length/2))},(_,i)=>({title:`${report.previousDateLabel} → ${report.nextDateLabel}`,content:<><p>Night report · {i+1} / {Math.max(1,Math.ceil(report.summaryItems.length/2))}</p>{report.summaryItems.slice(i*2,i*2+2).map((item,n)=><p key={n}>{item}</p>)}</>}))} actions={<button onClick={()=>{setReport(null);open("ledger");}}>Review Morning Brief</button>}/>}

    </>
  );
}
