"use client";

import { useEffect, useMemo, useState } from "react";
import { RanchHubScreen as BaseRanchHubScreen } from "./RanchHubScreen";
import { getLatestPredatorEvent } from "@/data/predatorEvents";
import { canResolveDailyEventChoice, resolveDailyRanchEventChoice } from "@/data/ranch-day/ranchDayEvents";
import { deriveCreatureMoods } from "@/data/ranch-day/ranchDayMood";
import {
  beginRanchDay,
  cancelEveningReview,
  enterEveningReview,
  normalizeRanchDaySave,
} from "@/data/ranch-day/ranchDayState";
import { buildEveningPreview } from "@/data/ranch-day/ranchDaySummary";
import { useGameContext } from "@/state/GameProvider";
import type { RanchDayPhase } from "@/types/ranchDay";
import type { GameSave } from "@/types/save";
import styles from "./RanchHubScreenDayLoop.module.css";

type PanelMode = "morning" | "goals" | "activities" | "moods" | "review" | null;

function phaseLabel(phase: RanchDayPhase): string {
  if (phase === "morning") return "Morning Brief";
  if (phase === "evening") return "Evening Review";
  return "Active Day";
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function RanchHubScreen() {
  const { advanceDay, currentSave, saveCurrentGame } = useGameContext();
  const [panel, setPanel] = useState<PanelMode>(null);
  const [message, setMessage] = useState("Ranch Day controls are ready.");

  const save = useMemo(
    () => currentSave ? normalizeRanchDaySave(currentSave, currentSave.ranchDay?.phase ?? "active") : null,
    [currentSave],
  );
  const phase = save?.ranchDay?.phase ?? "active";
  const goals = save?.ranchDay?.goals ?? [];
  const activities = save?.ranchDay?.activities ?? [];
  const completedGoals = goals.filter((goal) => goal.complete).length;
  const eveningPreview = useMemo(() => save ? buildEveningPreview(save) : null, [save]);
  const moods = useMemo(() => save ? deriveCreatureMoods(save) : [], [save]);
  const predatorEvent = useMemo(() => save ? getLatestPredatorEvent(save) : null, [save]);

  useEffect(() => {
    if (phase === "morning") setPanel("morning");
    else if (phase === "evening") setPanel("review");
  }, [phase, save?.dayState.dayNumber]);

  if (!save) return <BaseRanchHubScreen />;
  const activeSave = save;

  function persist(nextSave: GameSave) {
    saveCurrentGame(nextSave);
  }

  function handleBeginDay() {
    persist(beginRanchDay(activeSave));
    setPanel(null);
    setMessage(`Ranch Day ${activeSave.dayState.dayNumber} is active.`);
  }

  function handleReviewDay() {
    persist(enterEveningReview(activeSave));
    setPanel("review");
  }

  function handleCancelReview() {
    persist(cancelEveningReview(activeSave));
    setPanel(null);
  }

  function handleEndDay() {
    const result = advanceDay();
    if (result) {
      setMessage(`Advanced to ${result.nextDateLabel}.`);
      setPanel(null);
    }
  }

  function handleEventChoice(choiceId: string) {
    const result = resolveDailyRanchEventChoice(activeSave, choiceId);
    if (result.ok) persist(result.save);
    setMessage(result.message);
  }

  const brief = activeSave.ranchDay?.morningBrief;
  const event = activeSave.ranchDay?.event;
  const showPredatorEvent = Boolean(predatorEvent && predatorEvent.dayNumber === activeSave.dayState.dayNumber && predatorEvent.status !== "battle_pending");

  return (
    <>
      <BaseRanchHubScreen key={`${activeSave.dayState.dayNumber}-${phase}`} />

      <aside className={styles.phaseBar} aria-label="Ranch Day controls">
        <div>
          <span>Ranch Day {activeSave.dayState.dayNumber}</span>
          <strong>{phaseLabel(phase)}</strong>
        </div>
        <div className={styles.phaseActions}>
          <button type="button" onClick={() => setPanel("morning")}>Morning Brief</button>
          <button type="button" onClick={() => setPanel("goals")}>Goals {completedGoals}/{goals.length}</button>
          <button type="button" onClick={() => setPanel("activities")}>Activities {activities.length}</button>
          <button type="button" onClick={() => setPanel("moods")}>Moods</button>
          <button type="button" className={styles.reviewButton} onClick={handleReviewDay}>Review Day</button>
        </div>
        <p>{message}</p>
      </aside>

      {panel ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => phase === "morning" || phase === "evening" ? null : setPanel(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label={`Ranch Day ${panel}`} onMouseDown={(eventObject) => eventObject.stopPropagation()}>
            <header className={styles.header}>
              <div>
                <p>Ranch Day {activeSave.dayState.dayNumber}</p>
                <h1>{panel === "morning" ? "Morning Brief" : panel === "goals" ? "Daily Goals" : panel === "activities" ? "Activity Log" : panel === "moods" ? "Creature Moods" : "Evening Review"}</h1>
              </div>
              {phase !== "morning" && phase !== "evening" ? <button type="button" onClick={() => setPanel(null)}>Close</button> : null}
            </header>

            <div className={styles.content}>
              {panel === "morning" ? (
                <div className={styles.stack}>
                  <section className={styles.heroCard} data-ui-text-box="auto">
                    <span>{brief?.dateLabel ?? `${activeSave.dayState.weekday} ${activeSave.dayState.month}/${activeSave.dayState.dayOfMonth}`}</span>
                    <h2>{brief ? `Ranch Day ${brief.currentDayNumber} is ready.` : "Your ranch day is ready."}</h2>
                    <p>{brief?.nextSteps[0] ?? "Review assignments, supplies, breeding plans, and Nursery needs before ending the day."}</p>
                  </section>

                  {showPredatorEvent && predatorEvent ? (
                    <section className={predatorEvent.status === "victory" ? styles.eventCard : styles.warningCard} data-ui-text-box="auto">
                      <img src={predatorEvent.imagePath} alt="Predator defense outcome" style={{ width: "100%", maxHeight: 240, objectFit: "contain", borderRadius: 12, background: "rgba(0,0,0,.24)" }} />
                      <span>Overnight Predator Defense</span>
                      <h2>{predatorEvent.status === "victory" ? "Ranch Secured" : predatorEvent.status === "draw" ? "Predators Withdrew" : "Ranch Breached"}</h2>
                      <p>{predatorEvent.resolutionSummary ?? predatorEvent.summary}</p>
                      <div className={styles.summaryGrid}>
                        <div><span>Predators</span><strong>{predatorEvent.predatorName}</strong></div>
                        <div><span>Threat</span><strong>{predatorEvent.tier}</strong></div>
                        <div><span>Security</span><strong>{predatorEvent.security}/{predatorEvent.requiredSecurity}</strong></div>
                        <div><span>Rounds</span><strong>{predatorEvent.resolvedRounds ?? 0}</strong></div>
                      </div>
                    </section>
                  ) : null}

                  {brief ? (
                    <section className={styles.resourceGrid}>
                      <div><span>Gold</span><strong>{brief.resourceFlow.ending.gold}</strong><small>{signed(brief.resourceFlow.goldChange)} last day</small></div>
                      <div><span>Feed</span><strong>{brief.resourceFlow.ending.feed}</strong><small>{signed(brief.resourceFlow.feedChange)} last day</small></div>
                      <div><span>Materials</span><strong>{brief.resourceFlow.ending.materials}</strong><small>{signed(brief.resourceFlow.materialChange)} last day</small></div>
                      <div><span>Energy</span><strong>{activeSave.currencies.energy}/{activeSave.currencies.maxEnergy}</strong><small>Recovery applied</small></div>
                    </section>
                  ) : null}

                  {brief?.highlights.length ? <section className={styles.card}><h2>Overnight Highlights</h2><ul>{brief.highlights.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
                  {brief?.warnings.length ? <section className={styles.warningCard}><h2>Warnings</h2><ul>{brief.warnings.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
                  {brief?.moodSummary.length ? <section className={styles.card}><h2>Creature Mood</h2><ul>{brief.moodSummary.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}

                  {event ? (
                    <section className={styles.eventCard} data-ui-text-box="auto">
                      <span>Today's Ranch Event</span>
                      <h2>{event.title}</h2>
                      <p>{event.description}</p>
                      {event.resultText ? <strong className={styles.eventResult}>{event.resultText}</strong> : (
                        <div className={styles.choiceGrid}>
                          {event.choices.map((choice) => {
                            const availability = canResolveDailyEventChoice(activeSave, choice.choiceId);
                            return (
                              <button key={choice.choiceId} type="button" disabled={!availability.ok} onClick={() => handleEventChoice(choice.choiceId)}>
                                <strong>{choice.label}</strong>
                                <span>{availability.ok ? choice.description : availability.reason}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  ) : null}
                </div>
              ) : null}

              {panel === "goals" ? (
                <div className={styles.stack}>
                  {goals.map((goal) => (
                    <section key={goal.goalId} className={goal.complete ? styles.completeCard : styles.card} data-ui-text-box="auto">
                      <div className={styles.cardHeading}><h2>{goal.label}</h2><strong>{goal.progress}/{goal.target}</strong></div>
                      <p>{goal.description}</p>
                      <div className={styles.progressTrack}><span style={{ width: `${Math.min(100, Math.round((goal.progress / Math.max(1, goal.target)) * 100))}%` }} /></div>
                      <small>{goal.progressLabel} · Reward: {goal.rewardLabel}{goal.rewardClaimed ? " · Claimed" : ""}</small>
                    </section>
                  ))}
                  <p className={styles.note}>Completing all three goals grants an additional 50 Gold and 1 Feed. Goals do not impose a hard action limit.</p>
                </div>
              ) : null}

              {panel === "activities" ? (
                <div className={styles.stack}>
                  {activities.length ? [...activities].reverse().map((activity) => (
                    <section key={activity.activityId} className={styles.activityRow} data-ui-text-box="auto">
                      <span>{activity.type.replace(/-/g, " ")}</span>
                      <strong>{activity.label}</strong>
                      <small>{new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</small>
                    </section>
                  )) : <section className={styles.card}><p>No major actions have been recorded today.</p></section>}
                </div>
              ) : null}

              {panel === "moods" ? (
                <div className={styles.moodGrid}>
                  {moods.map((mood) => (
                    <section key={mood.creatureId} className={styles.card} data-ui-text-box="auto">
                      <span>{mood.mood}</span>
                      <h2>{mood.creatureName}</h2>
                      <p>{mood.reason}</p>
                    </section>
                  ))}
                </div>
              ) : null}

              {panel === "review" && eveningPreview ? (
                <div className={styles.stack}>
                  <section className={styles.resourceGrid}>
                    <div><span>Goals</span><strong>{eveningPreview.goalsCompleted}/{eveningPreview.goalsTotal}</strong><small>complete</small></div>
                    <div><span>Activities</span><strong>{eveningPreview.activities}</strong><small>major actions</small></div>
                    <div><span>Gold Change</span><strong>{signed(eveningPreview.goldChange)}</strong><small>today</small></div>
                    <div><span>Feed</span><strong>{eveningPreview.currentFeed}</strong><small>about {eveningPreview.projectedFeedRequired} needed</small></div>
                  </section>
                  <section className={styles.summaryGrid}>
                    <div><span>Breeding</span><strong>{eveningPreview.breedingAttempts}</strong></div>
                    <div><span>Purchases</span><strong>{eveningPreview.purchases}</strong></div>
                    <div><span>Items Used</span><strong>{eveningPreview.itemsUsed}</strong></div>
                    <div><span>Chore Changes</span><strong>{eveningPreview.choreChanges}</strong></div>
                    <div><span>Pregnancies</span><strong>{eveningPreview.activePregnancies}</strong></div>
                    <div><span>Eggs</span><strong>{eveningPreview.incubatingEggs} incubating · {eveningPreview.readyEggs} ready</strong></div>
                  </section>
                  <section className={eveningPreview.warnings.length ? styles.warningCard : styles.card}>
                    <h2>Before You End the Day</h2>
                    {eveningPreview.warnings.length ? <ul>{eveningPreview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p>No urgent ranch warnings are projected.</p>}
                  </section>
                  <p className={styles.note}>Ending the day resolves assignments, Feed, recovery, predator pressure, pregnancy and egg timers, training returns, taxes, Market/Guild refreshes, goals, and the next Morning Brief exactly once.</p>
                </div>
              ) : null}
            </div>

            <footer className={styles.footer}>
              {panel === "morning" ? (
                <>
                  {phase !== "morning" ? <button type="button" onClick={() => setPanel(null)}>Close</button> : null}
                  {phase === "morning" ? <button type="button" className={styles.primaryButton} onClick={handleBeginDay}>Begin Ranch Day</button> : null}
                </>
              ) : panel === "review" ? (
                <>
                  <button type="button" onClick={handleCancelReview}>Return to Ranch</button>
                  <button type="button" className={styles.primaryButton} onClick={handleEndDay}>End Day</button>
                </>
              ) : <button type="button" onClick={() => setPanel(null)}>Close</button>}
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
