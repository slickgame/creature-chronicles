"use client";

import { useEffect, useMemo, useState } from "react";
import {
  canDeliverChapterTwoGuildAid,
  claimChapterTwoAftermathReport,
  completeChapterTwoDoctrineOperation,
  deliverChapterTwoGuildAid,
  getChapterTwoAftermathObjective,
  getChapterTwoAftermathState,
  isChapterTwoAftermathEligible,
  prepareChapterTwoAftermathSave,
  reviewChapterTwoAftermath,
  stabilizeChapterTwoRanch,
  type ChapterTwoAidType,
} from "@/data/chapterTwoWoodlineAftermath";
import { getChapterTwoState } from "@/data/chapterTwoTroubleBeyondFence";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { useGameContext } from "@/state/GameProvider";
import type { GameSave } from "@/types/save";
import styles from "./ChapterTwoQuestPanel.module.css";

const AFTERMATH_ART = "/images/story/chapter-two/chapter_two_aftermath.svg";

function ProgressRow({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className={`${styles.progressRow} ${complete ? styles.progressRowDone : ""}`}>
      <span className={styles.check}>{complete ? "✓" : "•"}</span>
      <span>{label}</span>
    </div>
  );
}

export function ChapterTwoAftermathPanel() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Woodline aftermath journal ready.");

  const prepared = useMemo(
    () => currentSave ? prepareChapterTwoAftermathSave(currentSave) : null,
    [currentSave],
  );

  useEffect(() => {
    if (!currentSave || !prepared || prepared === currentSave) return;
    saveCurrentGame(prepared);
  }, [currentSave, prepared, saveCurrentGame]);

  useEffect(() => {
    if (!prepared || !isChapterTwoAftermathEligible(prepared)) return;
    const state = getChapterTwoAftermathState(prepared);
    if (state.startedDayNumber === prepared.dayState.dayNumber && prepared.flags.chapterTwoAftermathIntroOpened !== true) {
      setOpen(true);
      saveCurrentGame({
        ...prepared,
        flags: { ...prepared.flags, chapterTwoAftermathIntroOpened: true },
      });
    }
  }, [prepared, saveCurrentGame]);

  if (!prepared || !isChapterTwoAftermathEligible(prepared)) return null;

  const activeSave = prepared;
  const state = getChapterTwoAftermathState(activeSave);
  const objective = getChapterTwoAftermathObjective(activeSave);
  if (!objective) return null;
  const activeObjective = objective;
  const threat = getPredatorThreatAssessment(activeSave);
  const doctrine = getChapterTwoState(activeSave).doctrine;

  function persist(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function handlePrimaryAction() {
    if (activeObjective.action === "review") {
      persist(reviewChapterTwoAftermath(activeSave));
      return;
    }
    if (activeObjective.action === "recover") {
      persist(stabilizeChapterTwoRanch(activeSave));
      return;
    }
    if (activeObjective.action === "operation") {
      persist(completeChapterTwoDoctrineOperation(activeSave));
      return;
    }
    if (activeObjective.action === "wait") {
      setMessage("Close the journal, use Review Day, and confirm End Day. The final report arrives next morning.");
      return;
    }
    if (activeObjective.action === "report") {
      persist(claimChapterTwoAftermathReport(activeSave));
    }
  }

  function handleAid(type: ChapterTwoAidType) {
    persist(deliverChapterTwoGuildAid(activeSave, type));
  }

  const completedCount = [
    state.aftermathReviewed,
    state.recoveryCompleted,
    state.doctrineOperationCompleted,
    state.guildAidCompleted,
    state.stage === "report" || state.finalReportRead,
    state.finalReportRead,
  ].filter(Boolean).length;

  return (
    <>
      <button type="button" className={styles.launcher} onClick={() => setOpen(true)}>
        <img src={AFTERMATH_ART} alt="" />
        <span>
          <span>Chapter 2 · Act II</span>
          <strong>{activeObjective.title}</strong>
          <small>{state.stage === "complete" ? "Complete" : `${completedCount}/6 objectives`}</small>
        </span>
        <span className={styles.launcherBadge}>{state.stage === "complete" ? "✓" : completedCount}</span>
      </button>

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="chapter-two-aftermath-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.hero} style={{ backgroundImage: `url(${AFTERMATH_ART})` }}>
              <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close Woodline aftermath journal">×</button>
              <div className={styles.heroContent}>
                <p className={styles.kicker}>Chapter 2 · Act II</p>
                <h1 id="chapter-two-aftermath-title">The Woodline Aftermath</h1>
                <p>Repair the breach, prove the ranch doctrine, support the region, and turn one successful defense into lasting security.</p>
              </div>
            </header>

            <div className={styles.body}>
              <div>
                <section className={styles.objectiveCard} data-ui-text-box="auto">
                  <p className={styles.kicker}>Current Objective</p>
                  <h2>{activeObjective.title}</h2>
                  <p>{activeObjective.body}</p>
                  <small className={styles.hint}>{activeObjective.hint}</small>

                  {["review", "recover", "operation", "wait", "report"].includes(activeObjective.action) ? (
                    <div className={styles.actionRow}>
                      <button type="button" className={styles.primary} onClick={handlePrimaryAction}>{activeObjective.actionLabel}</button>
                    </div>
                  ) : null}

                  {activeObjective.action === "aid" ? (
                    <div className={styles.doctrineGrid}>
                      <button type="button" className={styles.doctrineButton} disabled={!canDeliverChapterTwoGuildAid(activeSave, "feed")} onClick={() => handleAid("feed")}>
                        <strong>Send 6 Feed</strong>
                        <span>Support farms whose stores were scattered by the pack route.</span>
                      </button>
                      <button type="button" className={styles.doctrineButton} disabled={!canDeliverChapterTwoGuildAid(activeSave, "materials")} onClick={() => handleAid("materials")}>
                        <strong>Send 4 Materials</strong>
                        <span>Help neighboring ranches brace gates and repair damaged pens.</span>
                      </button>
                      <button type="button" className={styles.doctrineButton} disabled={!canDeliverChapterTwoGuildAid(activeSave, "gold")} onClick={() => handleAid("gold")}>
                        <strong>Fund 120 Gold</strong>
                        <span>Pay for transport, temporary labor, and emergency supplies.</span>
                      </button>
                    </div>
                  ) : null}

                  <p className={styles.message}>{message}</p>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Act II Progress</h2>
                  <div className={styles.progressList}>
                    <ProgressRow complete={state.aftermathReviewed} label="Review the first defense" />
                    <ProgressRow complete={state.recoveryCompleted} label="Stabilize the damaged outer line" />
                    <ProgressRow complete={state.doctrineOperationCompleted} label="Complete the doctrine operation" />
                    <ProgressRow complete={state.guildAidCompleted} label="Answer the Guild emergency request" />
                    <ProgressRow complete={state.stage === "report" || state.finalReportRead} label="Receive the next-day assessment" />
                    <ProgressRow complete={state.finalReportRead} label="Read the final Woodline report" />
                  </div>
                </section>
              </div>

              <aside>
                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Doctrine in Practice</h2>
                  <p>{doctrine === "fortify" ? "Fortified Perimeter develops fallback gates and reduces future breach damage." : doctrine === "track" ? "Trail Wardens map return paths and improve future interceptions." : "Quiet Pastures reduces scent pressure and Feed losses during future attacks."}</p>
                  {state.doctrineOperationCompleted ? <strong>Improved doctrine active</strong> : <small>Complete the field operation to strengthen this doctrine.</small>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Live Threat Readout</h2>
                  <div className={styles.stats}>
                    <div className={styles.stat}><span>Pressure</span><strong>{threat.pressure}</strong></div>
                    <div className={styles.stat}><span>Security</span><strong>{threat.security}</strong></div>
                    <div className={styles.stat}><span>Required</span><strong>{threat.requiredSecurity}</strong></div>
                    <div className={styles.stat}><span>Chance</span><strong>{threat.eventChance}%</strong></div>
                  </div>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Regional Contribution</h2>
                  <p>{state.guildAidType === "feed" ? "6 Feed delivered through the Guild network." : state.guildAidType === "materials" ? "4 Materials delivered through the Guild network." : state.guildAidType === "gold" ? "120 Gold funded emergency transport and labor." : "No emergency contribution selected yet."}</p>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Aftermath Log</h2>
                  <div className={styles.history}>
                    {state.history.length ? state.history.map((entry) => <p key={entry}>{entry}</p>) : <p>No Act II entries yet.</p>}
                  </div>
                </section>
              </aside>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
