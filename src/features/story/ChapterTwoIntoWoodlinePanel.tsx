"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHAPTER_TWO_WOODLINE_ART,
  WOODLINE_APPROACHES,
  WOODLINE_RESOLUTIONS,
  canLaunchWoodlineApproach,
  chooseWoodlineResolution,
  getChapterTwoIntoWoodlineObjective,
  getChapterTwoIntoWoodlineState,
  isChapterTwoIntoWoodlineEligible,
  launchWoodlineExpedition,
  prepareChapterTwoIntoWoodlineSave,
  readWoodlineExpeditionBriefing,
  type WoodlineApproach,
  type WoodlineResolution,
} from "@/data/chapterTwoIntoWoodline";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
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

function outcomeLabel(value: string): string {
  if (value === "player_won") return "Victory";
  if (value === "draw") return "Stalemate";
  if (value === "enemy_won") return "Defeat and withdrawal";
  return "Not resolved";
}

export function ChapterTwoIntoWoodlinePanel() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Deepwood expedition journal ready.");

  const prepared = useMemo(
    () => currentSave ? prepareChapterTwoIntoWoodlineSave(currentSave) : null,
    [currentSave],
  );

  useEffect(() => {
    if (!currentSave || !prepared || prepared === currentSave) return;
    saveCurrentGame(prepared);
  }, [currentSave, prepared, saveCurrentGame]);

  useEffect(() => {
    if (!prepared || !isChapterTwoIntoWoodlineEligible(prepared)) return;
    const state = getChapterTwoIntoWoodlineState(prepared);
    if (state.startedDayNumber === prepared.dayState.dayNumber && prepared.flags.chapterTwoIntoWoodlineIntroOpened !== true) {
      setOpen(true);
      saveCurrentGame({
        ...prepared,
        flags: { ...prepared.flags, chapterTwoIntoWoodlineIntroOpened: true },
      });
    }
  }, [prepared, saveCurrentGame]);

  if (!prepared || !isChapterTwoIntoWoodlineEligible(prepared)) return null;

  const activeSave = prepared;
  const state = getChapterTwoIntoWoodlineState(activeSave);
  const objective = getChapterTwoIntoWoodlineObjective(activeSave);
  if (!objective) return null;
  const threat = getPredatorThreatAssessment(activeSave);
  const selectedApproach = WOODLINE_APPROACHES.find((entry) => entry.id === state.approach);
  const selectedResolution = WOODLINE_RESOLUTIONS.find((entry) => entry.id === state.resolution);
  const completedCount = [state.briefingRead, Boolean(state.approach), state.battleResolved, Boolean(state.resolution)].filter(Boolean).length;

  function persist(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function handleApproach(approach: WoodlineApproach) {
    persist(launchWoodlineExpedition(activeSave, approach));
  }

  function handleResolution(resolution: WoodlineResolution) {
    persist(chooseWoodlineResolution(activeSave, resolution));
  }

  return (
    <>
      <button type="button" className={styles.launcher} onClick={() => setOpen(true)}>
        <img src={CHAPTER_TWO_WOODLINE_ART} alt="" />
        <span>
          <span>Chapter 2 · Act III</span>
          <strong>{objective.title}</strong>
          <small>{state.stage === "complete" ? "Complete" : `${completedCount}/4 objectives`}</small>
        </span>
        <span className={styles.launcherBadge}>{state.stage === "complete" ? "✓" : completedCount}</span>
      </button>

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="chapter-two-woodline-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.hero} style={{ backgroundImage: `url(${CHAPTER_TWO_WOODLINE_ART})` }}>
              <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close Into the Woodline journal">×</button>
              <div className={styles.heroContent}>
                <p className={styles.kicker}>Chapter 2 · Act III</p>
                <h1 id="chapter-two-woodline-title">Into the Woodline</h1>
                <p>Follow the pack route beyond the boundary stones, confront Ashfang at the deepwood den, and decide how ranchers and predators will share the region.</p>
              </div>
            </header>

            <div className={styles.body}>
              <div>
                <section className={styles.objectiveCard} data-ui-text-box="auto">
                  <p className={styles.kicker}>Current Objective</p>
                  <h2>{objective.title}</h2>
                  <p>{objective.body}</p>
                  <small className={styles.hint}>{objective.hint}</small>

                  {objective.action === "briefing" ? (
                    <div className={styles.actionRow}>
                      <button type="button" className={styles.primary} onClick={() => persist(readWoodlineExpeditionBriefing(activeSave))}>Review the Guild Map</button>
                    </div>
                  ) : null}

                  {objective.action === "approach" ? (
                    <div className={styles.doctrineGrid}>
                      {WOODLINE_APPROACHES.map((approach) => (
                        <button
                          key={approach.id}
                          type="button"
                          className={styles.doctrineButton}
                          disabled={!canLaunchWoodlineApproach(activeSave, approach.id)}
                          onClick={() => handleApproach(approach.id)}
                        >
                          <strong>{approach.name} · {approach.costLabel}</strong>
                          <span>{approach.description}</span>
                          <small>Deepwood Pack begins at {approach.startingHpPercent}% HP · {approach.tier} threat</small>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {objective.action === "battle" ? (
                    <div className={styles.actionRow}>
                      <strong>The Deepwood Pack encounter is pending.</strong>
                      <span>The game opens the existing target-first battle screen automatically. Record the outcome there to return to this journal.</span>
                    </div>
                  ) : null}

                  {objective.action === "decision" ? (
                    <div className={styles.doctrineGrid}>
                      {WOODLINE_RESOLUTIONS.map((resolution) => (
                        <button key={resolution.id} type="button" className={styles.doctrineButton} onClick={() => handleResolution(resolution.id)}>
                          <strong>{resolution.name}</strong>
                          <span>{resolution.description}</span>
                          <small>{resolution.effect}</small>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <p className={styles.message}>{message}</p>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Act III Progress</h2>
                  <div className={styles.progressList}>
                    <ProgressRow complete={state.briefingRead} label="Review the deepwood map" />
                    <ProgressRow complete={Boolean(state.approach)} label="Choose and launch an expedition approach" />
                    <ProgressRow complete={state.battleResolved} label="Resolve the Ashfang confrontation" />
                    <ProgressRow complete={Boolean(state.resolution)} label="Establish a permanent Woodline policy" />
                  </div>
                </section>
              </div>

              <aside>
                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Expedition Plan</h2>
                  {selectedApproach ? (
                    <>
                      <strong>{selectedApproach.name}</strong>
                      <p>{selectedApproach.description}</p>
                      <small>Enemy opening: {selectedApproach.startingHpPercent}% HP</small>
                    </>
                  ) : <p>No approach selected.</p>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Deepwood Result</h2>
                  <p>{outcomeLabel(state.battleOutcome)}</p>
                  {state.battleResolved ? <small>Every result advances to the regional decision; defeat only applies recoverable battle consequences.</small> : null}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Permanent Policy</h2>
                  {selectedResolution ? <><strong>{selectedResolution.name}</strong><p>{selectedResolution.effect}</p></> : <p>No final policy selected.</p>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Live Ranch Threat</h2>
                  <div className={styles.stats}>
                    <div className={styles.stat}><span>Pressure</span><strong>{threat.pressure}</strong></div>
                    <div className={styles.stat}><span>Security</span><strong>{threat.security}</strong></div>
                    <div className={styles.stat}><span>Required</span><strong>{threat.requiredSecurity}</strong></div>
                    <div className={styles.stat}><span>Chance</span><strong>{threat.eventChance}%</strong></div>
                  </div>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Expedition Log</h2>
                  <div className={styles.history}>
                    {state.history.length ? state.history.map((entry) => <p key={entry}>{entry}</p>) : <p>No Act III entries yet.</p>}
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
