"use client";
import { useState } from "react";
import {
  canResolveDailyEventChoice,
  resolveDailyRanchEventChoice,
} from "@/data/ranch-day/ranchDayEvents";
import { deriveCreatureMoods } from "@/data/ranch-day/ranchDayMood";
import { markChapterOneTutorialSignal } from "@/data/chapterOneGuidedTutorial";
import { beginRanchDay } from "@/data/ranch-day/ranchDayState";
import { useGameContext } from "@/state/GameProvider";
import { useNavigation } from "./NavigationContext";
import styles from "./Navigation.module.css";

export function RanchDayDetails() {
  const { currentSave: save, saveCurrentGame } = useGameContext();
  const { open } = useNavigation();
  const [message, setMessage] = useState("");
  if (!save?.ranchDay) return null;
  const day = save.ranchDay,
    brief = day.morningBrief,
    event = day.event;
  function begin() {
    if (!save) return;
    saveCurrentGame(
      markChapterOneTutorialSignal(
        beginRanchDay(save),
        save.dayState.dayNumber > 1 ? "day-two-brief-opened" : "morning-opened",
      ),
    );
    open(null);
  }
  return (
    <section className={styles.ledger} aria-label="Daily ranch records">
      <h3>Morning Brief · Day {save.dayState.dayNumber}</h3>
      {brief && (
        <>
          <p>{brief.nextSteps.join(" ")}</p>
          <ul>
            {[...brief.highlights, ...brief.warnings].map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </>
      )}
      {event && (
        <article className={styles.story}>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          {event.resultText ? (
            <p>{event.resultText}</p>
          ) : (
            <div className={styles.ledger}>
              {event.choices.map((choice) => {
                const availability = canResolveDailyEventChoice(
                  save,
                  choice.choiceId,
                );
                return (
                  <button
                    type="button"
                    key={choice.choiceId}
                    disabled={!availability.ok}
                    onClick={() => {
                      const result = resolveDailyRanchEventChoice(
                        save,
                        choice.choiceId,
                      );
                      if (result.ok) saveCurrentGame(result.save);
                      setMessage(result.message);
                    }}
                  >
                    <strong>{choice.label}</strong>
                    <br />
                    {availability.ok ? choice.description : availability.reason}
                  </button>
                );
              })}
            </div>
          )}
          <p role="status">{message}</p>
        </article>
      )}
      {day.phase === "morning" && (
        <button
          type="button"
          data-tutorial-id="ranch-begin-day"
          className={styles.primary}
          onClick={begin}
        >
          Begin Ranch Day
        </button>
      )}
      <details className={styles.story}>
        <summary>
          Daily Goals · {day.goals.filter((g) => g.complete).length}/
          {day.goals.length}
        </summary>
        {day.goals.map((g) => (
          <article key={g.goalId}>
            <h4>
              {g.label} · {g.progress}/{g.target}
            </h4>
            <p>{g.description}</p>
            <p>
              {g.rewardLabel}
              {g.rewardClaimed ? " · Claimed" : ""}
            </p>
          </article>
        ))}
      </details>
      <details className={styles.story}>
        <summary>Activities · {day.activities.length}</summary>
        <ul>
          {[...day.activities].reverse().map((a) => (
            <li key={a.activityId}>{a.label}</li>
          ))}
        </ul>
        {!day.activities.length && <p>No major actions recorded today.</p>}
      </details>
      <details className={styles.story}>
        <summary>Creature Moods</summary>
        {deriveCreatureMoods(save).map((m) => (
          <p key={m.creatureId}>
            <strong>
              {m.creatureName} · {m.mood}
            </strong>
            <br />
            {m.reason}
          </p>
        ))}
      </details>
    </section>
  );
}
