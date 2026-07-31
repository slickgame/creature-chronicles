"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHAPTER_THREE_GALA_ART,
  FOUNDERS_GALA_OUTCOMES,
  FOUNDERS_PLAZA_ART,
  calculateFoundersGalaScore,
  canAffordFoundersGalaPlan,
  canHostFoundersGala,
  chooseFoundersGalaPlan,
  finalizeFoundersGala,
  getChapterThreeFoundersGalaObjective,
  getChapterThreeFoundersGalaState,
  getFoundersGalaLegacyBonuses,
  getFoundersGalaOutcomeDefinition,
  getFoundersGalaPlansForSave,
  hostFoundersGala,
  isChapterThreeFoundersGalaEligible,
  prepareChapterThreeFoundersGalaSave,
  reviewFoundersGalaInvitation,
  type FoundersGalaPlanId,
} from "@/data/chapterThreeFoundersGala";
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

const TOWN_LAUNCHER_STYLE = {
  position: "fixed",
  left: "57%",
  top: "16%",
  zIndex: 24,
  width: "clamp(88px, 9vw, 140px)",
  minHeight: 44,
  border: "2px solid rgba(229,184,101,.75)",
  borderRadius: 16,
  padding: 7,
  background: "rgba(20,14,28,.9)",
  color: "#fff2cf",
  boxShadow: "0 12px 28px rgba(0,0,0,.54)",
  cursor: "pointer",
} as const;

export function ChapterThreeFoundersGalaPanel({ launcherMode = "ranch" }: { launcherMode?: "ranch" | "town" }) {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Founders' Plaza is preparing the season's closing public gala.");

  const prepared = useMemo(
    () => currentSave ? prepareChapterThreeFoundersGalaSave(currentSave) : null,
    [currentSave],
  );

  useEffect(() => {
    if (!currentSave || !prepared || prepared === currentSave) return;
    saveCurrentGame(prepared);
  }, [currentSave, prepared, saveCurrentGame]);

  useEffect(() => {
    if (launcherMode !== "ranch" || !prepared || !isChapterThreeFoundersGalaEligible(prepared)) return;
    const state = getChapterThreeFoundersGalaState(prepared);
    if (
      state.startedDayNumber === prepared.dayState.dayNumber
      && prepared.flags.chapterThreeFoundersGalaIntroOpened !== true
    ) {
      setOpen(true);
      saveCurrentGame({
        ...prepared,
        flags: { ...prepared.flags, chapterThreeFoundersGalaIntroOpened: true },
      });
    }
  }, [launcherMode, prepared, saveCurrentGame]);

  if (!prepared || !isChapterThreeFoundersGalaEligible(prepared)) return null;

  const activeSave = prepared;
  const state = getChapterThreeFoundersGalaState(activeSave);
  const objective = getChapterThreeFoundersGalaObjective(activeSave);
  if (!objective) return null;

  const plans = getFoundersGalaPlansForSave(activeSave);
  const selectedPlan = plans.find((plan) => plan.id === state.planId) ?? null;
  const preview = selectedPlan ? calculateFoundersGalaScore(activeSave, selectedPlan.id) : null;
  const result = state.outcome ? getFoundersGalaOutcomeDefinition(state.outcome) : null;
  const bonuses = getFoundersGalaLegacyBonuses(activeSave);
  const lantern = getRoseLanternState(activeSave);
  const completedCount = [
    state.invitationRead,
    Boolean(state.planId),
    Boolean(state.outcome),
    state.stage === "complete",
  ].filter(Boolean).length;

  function persist(action: { save: GameSave; ok: boolean; message: string }) {
    if (action.ok) saveCurrentGame(action.save);
    setMessage(action.message);
  }

  function choosePlan(planId: FoundersGalaPlanId) {
    persist(chooseFoundersGalaPlan(activeSave, planId));
  }

  const launcher = launcherMode === "town" ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Visit Founders' Plaza and open the Founders' Gala journal"
      style={TOWN_LAUNCHER_STYLE}
    >
      <img src={FOUNDERS_PLAZA_ART} alt="" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", borderRadius: 10 }} />
      <strong style={{ display: "block", marginTop: 4, fontSize: ".72rem" }}>Founders&apos; Plaza</strong>
      <small style={{ color: state.stage === "complete" ? "#8fe0ad" : "#f2c36f", fontWeight: 900 }}>
        {state.stage === "complete" ? "LEGACY" : "GALA"}
      </small>
    </button>
  ) : (
    <button type="button" className={styles.launcher} onClick={() => setOpen(true)}>
      <img src={CHAPTER_THREE_GALA_ART} alt="" />
      <span>
        <span>Chapter 3 · Act III</span>
        <strong>{objective.title}</strong>
        <small>{state.stage === "complete" ? "Complete" : `${completedCount}/4 objectives`}</small>
      </span>
      <span className={styles.launcherBadge}>{state.stage === "complete" ? "✓" : completedCount}</span>
    </button>
  );

  return (
    <>
      {launcher}

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chapter-three-gala-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.hero} style={{ backgroundImage: `url(${CHAPTER_THREE_GALA_ART})` }}>
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="Close Founders' Gala journal"
              >
                ×
              </button>
              <div className={styles.heroContent}>
                <p className={styles.kicker}>Chapter 3 · Act III</p>
                <h1 id="chapter-three-gala-title">The Founders&apos; Gala</h1>
                <p>
                  The ranch and its formal patron have been invited to close the season at Founders&apos; Plaza. The result is deterministic, public, and never blocks progression.
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

                  {objective.action === "invitation" ? (
                    <div className={styles.actionRow}>
                      <button type="button" className={styles.primary} onClick={() => persist(reviewFoundersGalaInvitation(activeSave))}>
                        Review the Plaza Invitation
                      </button>
                    </div>
                  ) : null}

                  {objective.action === "plan" ? (
                    <div className={styles.doctrineGrid}>
                      {plans.map((plan) => {
                        const affordable = canAffordFoundersGalaPlan(activeSave, plan.id);
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            className={styles.doctrineButton}
                            onClick={() => choosePlan(plan.id)}
                          >
                            <strong>{plan.name}</strong>
                            <span>{plan.description}</span>
                            <span>{plan.costLabel} · +{plan.scoreBonus} preparation score</span>
                            <small>{affordable ? "Affordable now" : "Not currently affordable; the free route remains available"}</small>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {objective.action === "gala" && selectedPlan ? (
                    <div className={styles.doctrineGrid}>
                      <div className={styles.doctrineCard}>
                        <p className={styles.kicker}>{selectedPlan.costLabel}</p>
                        <h2>{selectedPlan.name}</h2>
                        <p>{selectedPlan.description}</p>
                        <small className={styles.hint}>Projected deterministic score: {preview?.total ?? 0}/100</small>
                      </div>

                      {state.patron === "lantern" && !lantern.houseRulesAccepted ? (
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
                        disabled={!canHostFoundersGala(activeSave)}
                        onClick={() => persist(hostFoundersGala(activeSave))}
                      >
                        Host the Founders&apos; Gala
                      </button>
                    </div>
                  ) : null}

                  {objective.action === "waiting" ? (
                    <div className={styles.actionRow}>
                      <strong>{result?.name ?? "Gala result recorded"}</strong>
                      <span>End the current Ranch Day. The score and outcome are already saved and cannot reroll.</span>
                    </div>
                  ) : null}

                  {objective.action === "report" ? (
                    <div className={styles.actionRow}>
                      <button type="button" className={styles.primary} onClick={() => persist(finalizeFoundersGala(activeSave))}>
                        Read the Council Report and Establish the Legacy
                      </button>
                    </div>
                  ) : null}

                  <p className={styles.message}>{message}</p>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Act III Progress</h2>
                  <div className={styles.progressList}>
                    <ProgressRow complete={state.invitationRead} label="Accept the Founders' Plaza invitation" />
                    <ProgressRow complete={Boolean(state.planId)} label="Choose a patron-specific gala plan" />
                    <ProgressRow complete={Boolean(state.outcome)} label="Host and record the deterministic gala" />
                    <ProgressRow complete={state.stage === "complete"} label="Establish the permanent town legacy" />
                  </div>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Possible Gala Outcomes</h2>
                  <div className={styles.doctrineGrid}>
                    {FOUNDERS_GALA_OUTCOMES.map((outcome) => (
                      <div key={outcome.id} className={styles.doctrineCard}>
                        <strong>{outcome.name}</strong>
                        <span>Score {outcome.minimumScore}+</span>
                        <small>+{outcome.goldReward} Gold · +{outcome.guildPointReward} GP · +{outcome.materialsReward} Materials · +{outcome.prestigeReward} Prestige</small>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside>
                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Gala Score</h2>
                  {state.scoreBreakdown || preview ? (() => {
                    const score = state.scoreBreakdown ?? preview!;
                    return (
                      <div className={styles.stats}>
                        <div className={styles.stat}><span>Foundation</span><strong>{score.foundation}</strong></div>
                        <div className={styles.stat}><span>Exhibition</span><strong>{score.exhibition}</strong></div>
                        <div className={styles.stat}><span>Patron</span><strong>{score.patronStanding}</strong></div>
                        <div className={styles.stat}><span>Representative</span><strong>{score.representative}</strong></div>
                        <div className={styles.stat}><span>Preparation</span><strong>{score.preparation}</strong></div>
                        <div className={styles.stat}><span>Total</span><strong>{score.total}/100</strong></div>
                      </div>
                    );
                  })() : <p>Select a gala plan to preview its deterministic score.</p>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Permanent Civic Legacy</h2>
                  <p>Every completed gala improves all three patron systems. The selected sponsor receives the strongest route bonus.</p>
                  <div className={styles.stats}>
                    <div className={styles.stat}><span>Town Prestige</span><strong>{bonuses.townPrestige}</strong></div>
                    <div className={styles.stat}><span>Guild Gold</span><strong>+{bonuses.guildGoldPercent}%</strong></div>
                    <div className={styles.stat}><span>Guild GP</span><strong>+{bonuses.guildPointBonus}</strong></div>
                    <div className={styles.stat}><span>Build Discount</span><strong>{bonuses.builderDiscountPercent}%</strong></div>
                    <div className={styles.stat}><span>Shift Gold</span><strong>+{bonuses.hospitalityGoldBonus}</strong></div>
                    <div className={styles.stat}><span>Shift Trust/Rumors</span><strong>+{bonuses.hospitalityTrustBonus}/+{bonuses.hospitalityRumorBonus}</strong></div>
                  </div>
                </section>

                {result ? (
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>{result.name}</h2>
                    <p>Final score: {state.scoreBreakdown?.total ?? 0}/100</p>
                    <small>Reward becomes claimable with the next Ranch Day council report.</small>
                  </section>
                ) : null}

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Founders&apos; Gala Log</h2>
                  <div className={styles.history}>
                    {state.history.length ? state.history.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>) : <p>No gala entries yet.</p>}
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
