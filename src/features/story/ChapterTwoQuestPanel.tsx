"use client";

import { useEffect, useMemo, useState } from "react";
import {
  chooseChapterTwoDoctrine,
  consultChapterTwoPetra,
  getChapterTwoObjective,
  getChapterTwoState,
  inspectChapterTwoTracks,
  isChapterTwoEligible,
  prepareChapterTwoSave,
  type ChapterTwoDoctrine,
} from "@/data/chapterTwoTroubleBeyondFence";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { useGameContext } from "@/state/GameProvider";
import type { GameSave } from "@/types/save";
import styles from "./ChapterTwoQuestPanel.module.css";

const CHAPTER_ART = "/images/story/chapter-two/chapter_two_tracks.svg";

function ProgressRow({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className={`${styles.progressRow} ${complete ? styles.progressRowDone : ""}`}>
      <span className={styles.check}>{complete ? "✓" : "•"}</span>
      <span>{label}</span>
    </div>
  );
}

export function ChapterTwoQuestPanel() {
  const {
    currentSave,
    goToRanchJobs,
    goToTown,
    saveCurrentGame,
  } = useGameContext();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Chapter 2 journal ready.");

  const prepared = useMemo(
    () => currentSave ? prepareChapterTwoSave(currentSave) : null,
    [currentSave],
  );

  useEffect(() => {
    if (!currentSave || !prepared || prepared === currentSave) return;
    saveCurrentGame(prepared);
  }, [currentSave, prepared, saveCurrentGame]);

  useEffect(() => {
    if (!prepared || !isChapterTwoEligible(prepared)) return;
    const state = getChapterTwoState(prepared);
    if (state.startedDayNumber === prepared.dayState.dayNumber && prepared.flags.chapterTwoIntroOpened !== true) {
      setOpen(true);
      saveCurrentGame({
        ...prepared,
        flags: { ...prepared.flags, chapterTwoIntroOpened: true },
      });
    }
  }, [prepared, saveCurrentGame]);

  if (!prepared || !isChapterTwoEligible(prepared)) return null;

  const activeSave = prepared;
  const state = getChapterTwoState(activeSave);
  const objective = getChapterTwoObjective(activeSave);
  const threat = getPredatorThreatAssessment(activeSave);
  if (!objective) return null;

  function persist(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function handlePrimaryAction() {
    if (objective.action === "inspect") {
      persist(inspectChapterTwoTracks(activeSave));
      return;
    }
    if (objective.action === "town") {
      if (state.stage === "petra") {
        const result = consultChapterTwoPetra(activeSave);
        persist(result);
        if (result.ok) goToTown();
        return;
      }
      setOpen(false);
      goToTown();
      return;
    }
    if (objective.action === "chores") {
      setOpen(false);
      goToRanchJobs();
      return;
    }
    if (objective.action === "end-day") {
      setMessage("Close the journal, use Review Day, and confirm End Day when the ranch is ready.");
    }
  }

  function handleDoctrine(doctrine: ChapterTwoDoctrine) {
    const result = chooseChapterTwoDoctrine(activeSave, doctrine);
    persist(result);
  }

  const completedCount = [
    state.tracksInspected,
    state.petraConsulted,
    state.fortificationBuilt,
    state.patrolPrepared,
    state.defenseResolved,
    Boolean(state.doctrine),
  ].filter(Boolean).length;

  return (
    <>
      <button type="button" className={styles.launcher} onClick={() => setOpen(true)}>
        <img src={CHAPTER_ART} alt="" />
        <span>
          <span>Chapter 2</span>
          <strong>{objective.title}</strong>
          <small>{state.stage === "complete" ? "Complete" : `${completedCount}/6 objectives`}</small>
        </span>
        <span className={styles.launcherBadge}>{state.stage === "complete" ? "✓" : completedCount}</span>
      </button>

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="chapter-two-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.hero} style={{ backgroundImage: `url(${CHAPTER_ART})` }}>
              <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close Chapter 2 journal">×</button>
              <div className={styles.heroContent}>
                <p className={styles.kicker}>Persistent Story Chapter</p>
                <h1 id="chapter-two-title">Trouble Beyond the Fence</h1>
                <p>Predator pressure, Builder projects, Security Patrol, and the live ranch-defense battle now form one connected story.</p>
              </div>
            </header>

            <div className={styles.body}>
              <div>
                <section className={styles.objectiveCard} data-ui-text-box="auto">
                  <p className={styles.kicker}>Current Objective</p>
                  <h2>{objective.title}</h2>
                  <p>{objective.body}</p>
                  <small className={styles.hint}>{objective.hint}</small>

                  {objective.action !== "choose" && objective.action !== "none" ? (
                    <div className={styles.actionRow}>
                      <button type="button" className={styles.primary} onClick={handlePrimaryAction}>{objective.actionLabel}</button>
                    </div>
                  ) : null}

                  {objective.action === "choose" ? (
                    <div className={styles.doctrineGrid}>
                      <button type="button" className={styles.doctrineButton} onClick={() => handleDoctrine("fortify")}>
                        <strong>Fortified Perimeter</strong>
                        <span>Gain +10 permanent Security. Best for a ranch that intends to expand aggressively.</span>
                      </button>
                      <button type="button" className={styles.doctrineButton} onClick={() => handleDoctrine("track")}>
                        <strong>Trail Wardens</strong>
                        <span>Gain +12 interception chance; intercepted predators begin with 10% less HP.</span>
                      </button>
                      <button type="button" className={styles.doctrineButton} onClick={() => handleDoctrine("steward")}>
                        <strong>Quiet Pastures</strong>
                        <span>Reduce Predator Pressure by 8 through safer feed storage and livestock routines.</span>
                      </button>
                    </div>
                  ) : null}

                  <p className={styles.message}>{message}</p>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Chapter Progress</h2>
                  <div className={styles.progressList}>
                    <ProgressRow complete={state.tracksInspected} label="Inspect the woodline tracks" />
                    <ProgressRow complete={state.petraConsulted} label="Consult Petra Hale" />
                    <ProgressRow complete={state.fortificationBuilt} label="Build a permanent fortification" />
                    <ProgressRow complete={state.patrolPrepared} label="Prepare Security Patrol" />
                    <ProgressRow complete={state.defenseResolved} label="Resolve the Woodline Wolf Pack defense" />
                    <ProgressRow complete={Boolean(state.doctrine)} label="Choose a permanent defense doctrine" />
                  </div>
                </section>
              </div>

              <aside>
                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Ranch Threat Readout</h2>
                  <div className={styles.stats}>
                    <div className={styles.stat}><span>Pressure</span><strong>{threat.pressure}</strong></div>
                    <div className={styles.stat}><span>Security</span><strong>{threat.security}</strong></div>
                    <div className={styles.stat}><span>Required</span><strong>{threat.requiredSecurity}</strong></div>
                    <div className={styles.stat}><span>Chance</span><strong>{threat.eventChance}%</strong></div>
                  </div>
                  <p>{threat.eligible ? `${threat.likelyPredator.replace(/_/g, " ")} may attack tonight.` : threat.blockers[0] ?? "Current defenses discourage a random incident."}</p>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Permanent Outcome</h2>
                  <p>{state.doctrine === "fortify" ? "Fortified Perimeter adds +10 Security." : state.doctrine === "track" ? "Trail Wardens improve interceptions and opening damage." : state.doctrine === "steward" ? "Quiet Pastures removes 8 Predator Pressure." : "No doctrine chosen yet."}</p>
                  {state.defenseOutcome ? <p>First defense result: <strong>{state.defenseOutcome.replace(/_/g, " ")}</strong></p> : null}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Story Log</h2>
                  <div className={styles.history}>
                    {state.history.length ? state.history.map((entry) => <p key={entry}>{entry}</p>) : <p>No Chapter 2 entries yet.</p>}
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
