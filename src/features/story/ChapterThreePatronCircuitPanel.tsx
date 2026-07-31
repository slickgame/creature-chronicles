"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHAPTER_THREE_PATRON_ART,
  PATRON_CIRCUIT_DEFINITIONS,
  choosePatronCircuitPatron,
  completePatronCircuitAssignment,
  finalizePatronCircuit,
  getChapterThreePatronCircuitObjective,
  getChapterThreePatronCircuitState,
  getPatronCircuitBonuses,
  getPatronCircuitDefinition,
  isChapterThreePatronCircuitEligible,
  prepareChapterThreePatronCircuitSave,
  reviewPatronInvitations,
  type PatronCircuitPatron,
} from "@/data/chapterThreePatronCircuit";
import { acceptRoseLanternHouseRules, getRoseLanternState } from "@/data/roseLantern";
import { useGameContext } from "@/state/GameProvider";
import type { GameSave } from "@/types/save";
import styles from "./ChapterTwoQuestPanel.module.css";

function ProgressRow({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className={`${styles.progressRow} ${complete ? styles.progressRowDone : ""}`}>
      <span className={styles.check}>{complete ? "✓" : "•"}</span>
      <span>{label}</span>
    </div>
  );
}

export function ChapterThreePatronCircuitPanel() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Three patron charters are waiting for review.");

  const prepared = useMemo(
    () => currentSave ? prepareChapterThreePatronCircuitSave(currentSave) : null,
    [currentSave],
  );

  useEffect(() => {
    if (!currentSave || !prepared || prepared === currentSave) return;
    saveCurrentGame(prepared);
  }, [currentSave, prepared, saveCurrentGame]);

  useEffect(() => {
    if (!prepared || !isChapterThreePatronCircuitEligible(prepared)) return;
    const state = getChapterThreePatronCircuitState(prepared);
    if (
      state.startedDayNumber === prepared.dayState.dayNumber
      && prepared.flags.chapterThreePatronCircuitIntroOpened !== true
    ) {
      setOpen(true);
      saveCurrentGame({
        ...prepared,
        flags: { ...prepared.flags, chapterThreePatronCircuitIntroOpened: true },
      });
    }
  }, [prepared, saveCurrentGame]);

  if (!prepared || !isChapterThreePatronCircuitEligible(prepared)) return null;

  const activeSave = prepared;
  const state = getChapterThreePatronCircuitState(activeSave);
  const objective = getChapterThreePatronCircuitObjective(activeSave);
  if (!objective) return null;

  const selectedPatron = state.patron ? getPatronCircuitDefinition(state.patron) : null;
  const bonuses = getPatronCircuitBonuses(activeSave);
  const lanternState = getRoseLanternState(activeSave);
  const completedCount = [
    state.invitationsRead,
    Boolean(state.patron),
    state.assignmentCompleted,
    state.stage === "complete",
  ].filter(Boolean).length;

  function persist(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function choosePatron(patron: PatronCircuitPatron) {
    persist(choosePatronCircuitPatron(activeSave, patron));
  }

  return (
    <>
      <button type="button" className={styles.launcher} onClick={() => setOpen(true)}>
        <img src={CHAPTER_THREE_PATRON_ART} alt="" />
        <span>
          <span>Chapter 3 · Act II</span>
          <strong>{objective.title}</strong>
          <small>{state.stage === "complete" ? "Complete" : `${completedCount}/4 objectives`}</small>
        </span>
        <span className={styles.launcherBadge}>{state.stage === "complete" ? "✓" : completedCount}</span>
      </button>

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chapter-three-patron-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.hero} style={{ backgroundImage: `url(${CHAPTER_THREE_PATRON_ART})` }}>
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="Close Patron Circuit journal"
              >
                ×
              </button>
              <div className={styles.heroContent}>
                <p className={styles.kicker}>Chapter 3 · Act II</p>
                <h1 id="chapter-three-patron-title">The Patron Circuit</h1>
                <p>
                  The ranch&apos;s exhibition placement attracted three formal sponsors. Choose which relationship becomes a permanent charter without losing access to the other town locations.
                </p>
              </div>
            </header>

            <div className={styles.body}>
              <div>
                <section className={styles.objectiveCard} data-ui-text-box="auto">
                  <p className={styles.kicker}>Current Objective</p>
                  <h2>{objective.title}</h2>
                  <p>{objective.body}</p>
                  <small className={styles.hint}>{objective.hint}</small>

                  {objective.action === "invitations" ? (
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() => persist(reviewPatronInvitations(activeSave))}
                      >
                        Review All Three Offers
                      </button>
                    </div>
                  ) : null}

                  {objective.action === "patron" ? (
                    <div className={styles.doctrineGrid}>
                      {PATRON_CIRCUIT_DEFINITIONS.map((patron) => (
                        <button
                          key={patron.id}
                          type="button"
                          className={styles.doctrineButton}
                          onClick={() => choosePatron(patron.id)}
                        >
                          <strong>{patron.name}</strong>
                          <span>{patron.host} · {patron.location}</span>
                          <span>{patron.invitation}</span>
                          <small>{patron.permanentEffect}</small>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {objective.action === "assignment" && selectedPatron ? (
                    <div className={styles.doctrineGrid}>
                      <div className={styles.doctrineCard}>
                        <p className={styles.kicker}>{selectedPatron.location}</p>
                        <h2>{selectedPatron.assignment}</h2>
                        <p>{selectedPatron.invitation}</p>
                        <small className={styles.hint}>{selectedPatron.permanentEffect}</small>
                      </div>

                      {state.patron === "lantern" && !lanternState.houseRulesAccepted ? (
                        <button
                          type="button"
                          className={styles.secondary}
                          onClick={() => persist(acceptRoseLanternHouseRules(activeSave))}
                        >
                          Acknowledge Adult, Optional, Consent-First House Rules
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className={styles.primary}
                        disabled={state.patron === "lantern" && !lanternState.houseRulesAccepted}
                        onClick={() => persist(completePatronCircuitAssignment(activeSave))}
                      >
                        Complete Patron Assignment
                      </button>
                    </div>
                  ) : null}

                  {objective.action === "waiting" ? (
                    <div className={styles.actionRow}>
                      <strong>The assignment is complete.</strong>
                      <span>End the current Ranch Day. The permanent charter arrives with the next day&apos;s report.</span>
                    </div>
                  ) : null}

                  {objective.action === "report" ? (
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() => persist(finalizePatronCircuit(activeSave))}
                      >
                        Read and Sign the Final Charter
                      </button>
                    </div>
                  ) : null}

                  <p className={styles.message}>{message}</p>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Act II Progress</h2>
                  <div className={styles.progressList}>
                    <ProgressRow complete={state.invitationsRead} label="Review all three patron offers" />
                    <ProgressRow complete={Boolean(state.patron)} label="Choose one formal sponsor" />
                    <ProgressRow complete={state.assignmentCompleted} label="Complete the sponsor assignment" />
                    <ProgressRow complete={state.stage === "complete"} label="Sign the permanent charter" />
                  </div>
                </section>
              </div>

              <aside>
                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Selected Sponsor</h2>
                  {selectedPatron ? (
                    <>
                      <strong>{selectedPatron.name}</strong>
                      <p>{selectedPatron.host} · {selectedPatron.location}</p>
                      <small>{selectedPatron.permanentEffect}</small>
                    </>
                  ) : <p>No patron selected.</p>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Active Charter Bonuses</h2>
                  <div className={styles.stats}>
                    <div className={styles.stat}><span>Guild Gold</span><strong>+{bonuses.guildGoldPercent}%</strong></div>
                    <div className={styles.stat}><span>Guild GP</span><strong>+{bonuses.guildPointBonus}</strong></div>
                    <div className={styles.stat}><span>Build Discount</span><strong>{bonuses.builderDiscountPercent}%</strong></div>
                    <div className={styles.stat}><span>Shift Gold</span><strong>+{bonuses.hospitalityGoldBonus}</strong></div>
                    <div className={styles.stat}><span>Shift Trust</span><strong>+{bonuses.hospitalityTrustBonus}</strong></div>
                    <div className={styles.stat}><span>Shift Rumors</span><strong>+{bonuses.hospitalityRumorBonus}</strong></div>
                  </div>
                </section>

                {state.patron === "lantern" ? (
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Rose Lantern Standing</h2>
                    <p>{lanternState.houseRulesAccepted ? "House rules acknowledged" : "House rules not yet acknowledged"}</p>
                    <small>{lanternState.trust} House Trust · {lanternState.rumorTokens} Rumor Tokens</small>
                  </section>
                ) : null}

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Patron Circuit Log</h2>
                  <div className={styles.history}>
                    {state.history.length ? state.history.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>) : <p>No Act II entries yet.</p>}
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
