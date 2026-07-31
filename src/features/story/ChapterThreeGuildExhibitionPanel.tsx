"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHAPTER_THREE_EXHIBITION_ART,
  GUILD_EXHIBITION_DISCIPLINES,
  GUILD_EXHIBITION_ENERGY_COST,
  calculateGuildExhibitionScore,
  canAffordGuildExhibitionDiscipline,
  canEnterGuildExhibition,
  chooseGuildExhibitionDiscipline,
  enterGuildExhibition,
  getChapterThreeGuildExhibitionObjective,
  getChapterThreeGuildExhibitionState,
  getGuildExhibitionCandidates,
  getGuildExhibitionPlacementDefinition,
  getGuildExhibitionReputationBonus,
  isChapterThreeGuildExhibitionEligible,
  prepareChapterThreeGuildExhibitionSave,
  reviewGuildExhibitionInvitation,
  selectGuildExhibitionRepresentative,
  type GuildExhibitionDiscipline,
} from "@/data/chapterThreeGuildExhibition";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureId } from "@/types/ids";
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

export function ChapterThreeGuildExhibitionPanel() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("The regional exhibition journal is ready.");

  const prepared = useMemo(
    () => currentSave ? prepareChapterThreeGuildExhibitionSave(currentSave) : null,
    [currentSave],
  );

  useEffect(() => {
    if (!currentSave || !prepared || prepared === currentSave) return;
    saveCurrentGame(prepared);
  }, [currentSave, prepared, saveCurrentGame]);

  useEffect(() => {
    if (!prepared || !isChapterThreeGuildExhibitionEligible(prepared)) return;
    const state = getChapterThreeGuildExhibitionState(prepared);
    if (
      state.startedDayNumber === prepared.dayState.dayNumber
      && prepared.flags.chapterThreeGuildExhibitionIntroOpened !== true
    ) {
      setOpen(true);
      saveCurrentGame({
        ...prepared,
        flags: { ...prepared.flags, chapterThreeGuildExhibitionIntroOpened: true },
      });
    }
  }, [prepared, saveCurrentGame]);

  if (!prepared || !isChapterThreeGuildExhibitionEligible(prepared)) return null;

  const activeSave = prepared;
  const state = getChapterThreeGuildExhibitionState(activeSave);
  const objective = getChapterThreeGuildExhibitionObjective(activeSave);
  if (!objective) return null;

  const candidates = getGuildExhibitionCandidates(activeSave);
  const representative = (activeSave.creatures ?? []).find((entry) => entry.creatureId === state.representativeId);
  const discipline = GUILD_EXHIBITION_DISCIPLINES.find((entry) => entry.id === state.discipline);
  const projectedScore = representative && state.discipline
    ? calculateGuildExhibitionScore(representative, state.discipline)
    : null;
  const placement = state.placement
    ? getGuildExhibitionPlacementDefinition(state.placement)
    : null;
  const reputation = getGuildExhibitionReputationBonus(activeSave);
  const completedCount = [
    state.invitationRead,
    Boolean(state.representativeId),
    Boolean(state.discipline),
    state.stage === "complete",
  ].filter(Boolean).length;

  function persist(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function chooseRepresentative(creatureId: CreatureId) {
    persist(selectGuildExhibitionRepresentative(activeSave, creatureId));
  }

  function chooseDiscipline(disciplineId: GuildExhibitionDiscipline) {
    persist(chooseGuildExhibitionDiscipline(activeSave, disciplineId));
  }

  return (
    <>
      <button type="button" className={styles.launcher} onClick={() => setOpen(true)}>
        <img src={CHAPTER_THREE_EXHIBITION_ART} alt="" />
        <span>
          <span>Chapter 3 · Act I</span>
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
            aria-labelledby="chapter-three-exhibition-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.hero} style={{ backgroundImage: `url(${CHAPTER_THREE_EXHIBITION_ART})` }}>
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="Close Guild Exhibition journal"
              >
                ×
              </button>
              <div className={styles.heroContent}>
                <p className={styles.kicker}>Chapter 3 · Act I</p>
                <h1 id="chapter-three-exhibition-title">The Guild Exhibition</h1>
                <p>
                  Step beyond ranch survival and present one creature before regional breeders,
                  registry officials, contract patrons, and the watching town.
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
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() => persist(reviewGuildExhibitionInvitation(activeSave))}
                      >
                        Review the Gold-Sealed Invitation
                      </button>
                    </div>
                  ) : null}

                  {objective.action === "representative" ? (
                    <div className={styles.doctrineGrid}>
                      {candidates.length ? candidates.map((candidate) => (
                        <button
                          key={candidate.creatureId}
                          type="button"
                          className={styles.doctrineButton}
                          onClick={() => chooseRepresentative(candidate.creatureId)}
                        >
                          <strong>{candidate.isFavorite ? "★ " : ""}{candidate.nickname} · Lv {candidate.level}</strong>
                          <span>
                            {candidate.energy}/{candidate.maxEnergy} Energy · {candidate.hearts}/{candidate.maxHearts} Hearts · {candidate.affection} Affection
                          </span>
                          <small>
                            STR {candidate.stats.STR} · DEX {candidate.stats.DEX} · STA {candidate.stats.STA} · CHA {candidate.stats.CHA} · WIL {candidate.stats.WIL} · FER {candidate.stats.FER}
                          </small>
                        </button>
                      )) : (
                        <p>No creature currently has {GUILD_EXHIBITION_ENERGY_COST} Energy, at least one Heart, and no active injury.</p>
                      )}
                    </div>
                  ) : null}

                  {objective.action === "preparation" ? (
                    <div className={styles.doctrineGrid}>
                      {GUILD_EXHIBITION_DISCIPLINES.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          className={styles.doctrineButton}
                          disabled={!canAffordGuildExhibitionDiscipline(activeSave, entry.id)}
                          onClick={() => chooseDiscipline(entry.id)}
                        >
                          <strong>{entry.name} · {entry.costLabel}</strong>
                          <span>{entry.description}</span>
                          <small>{entry.scoring}</small>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {objective.action === "exhibition" ? (
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.primary}
                        disabled={!canEnterGuildExhibition(activeSave)}
                        onClick={() => persist(enterGuildExhibition(activeSave))}
                      >
                        Enter the Guild Exhibition
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() => state.discipline && chooseDiscipline(state.discipline)}
                      >
                        Keep Current Plan
                      </button>
                    </div>
                  ) : null}

                  <p className={styles.message}>{message}</p>
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Act I Progress</h2>
                  <div className={styles.progressList}>
                    <ProgressRow complete={state.invitationRead} label="Review the regional Guild invitation" />
                    <ProgressRow complete={Boolean(state.representativeId)} label="Select one ranch representative" />
                    <ProgressRow complete={Boolean(state.discipline)} label="Choose a presentation discipline" />
                    <ProgressRow complete={state.stage === "complete"} label="Record the exhibition placement" />
                  </div>
                </section>
              </div>

              <aside>
                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Ranch Representative</h2>
                  {representative ? (
                    <>
                      <strong>{representative.nickname}</strong>
                      <p>Level {representative.level} · {representative.affection} Affection</p>
                      <small>{representative.energy}/{representative.maxEnergy} Energy · {representative.hearts}/{representative.maxHearts} Hearts</small>
                    </>
                  ) : <p>No representative selected.</p>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Presentation Plan</h2>
                  {discipline ? (
                    <>
                      <strong>{discipline.name}</strong>
                      <p>{discipline.description}</p>
                      <small>{discipline.costLabel} · {GUILD_EXHIBITION_ENERGY_COST} Energy on entry</small>
                    </>
                  ) : <p>No discipline selected.</p>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>{state.stage === "complete" ? "Final Score" : "Projected Score"}</h2>
                  {state.scoreBreakdown || projectedScore ? (() => {
                    const score = state.scoreBreakdown ?? projectedScore!;
                    return (
                      <div className={styles.stats}>
                        <div className={styles.stat}><span>Level</span><strong>{score.level}</strong></div>
                        <div className={styles.stat}><span>Stats</span><strong>{score.stats}</strong></div>
                        <div className={styles.stat}><span>Affection</span><strong>{score.affection}</strong></div>
                        <div className={styles.stat}><span>Condition</span><strong>{score.condition}</strong></div>
                        <div className={styles.stat}><span>Discipline</span><strong>{score.discipline}</strong></div>
                        <div className={styles.stat}><span>Total</span><strong>{score.total}</strong></div>
                      </div>
                    );
                  })() : <p>Select a representative and discipline to preview the score.</p>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Regional Standing</h2>
                  {placement ? (
                    <>
                      <strong>{placement.name}</strong>
                      <p>{reputation.guildGoldBonusPercent}% more Gold on new weekly Guild contracts.</p>
                      <small>{reputation.guildPointBonus ? `Each new contract also gains +${reputation.guildPointBonus} Guild Point${reputation.guildPointBonus === 1 ? "" : "s"}.` : "No additional Guild Point bonus at this placement."}</small>
                    </>
                  ) : <p>No placement recorded yet.</p>}
                </section>

                <section className={styles.card} data-ui-text-box="auto">
                  <h2>Exhibition Log</h2>
                  <div className={styles.history}>
                    {state.history.length ? state.history.map((entry) => <p key={entry}>{entry}</p>) : <p>No Chapter 3 entries yet.</p>}
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
