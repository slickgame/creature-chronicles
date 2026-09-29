"use client";
import { useMemo } from "react";
import { getRanchPlanner, type PlannerDestination } from "@/data/ranchPlanner";
import { useGameContext } from "@/state/GameProvider";
import { useNavigation } from "./NavigationContext";
import { RanchDayDetails } from "./RanchDayDetails";
import styles from "./Navigation.module.css";

export function RanchLedger({
  compact = false,
  endDay = false,
}: {
  compact?: boolean;
  endDay?: boolean;
}) {
  const game = useGameContext();
  const { open } = useNavigation();
  const planner = useMemo(
    () => (game.currentSave ? getRanchPlanner(game.currentSave) : null),
    [game.currentSave],
  );
  if (!planner) return null;
  function visit(destination: PlannerDestination) {
    open(null);
    ({
      nursery: game.goToNursery,
      chores: game.goToRanchJobs,
      supplies: game.goToSupplyDepot,
      office: game.goToRanchOffice,
      training: game.goToTrainingGrounds,
    })[destination]();
  }
  const rows = compact
    ? [...planner.rows]
        .sort((a, b) => Number(b.attention) - Number(a.attention))
        .slice(0, 3)
    : planner.rows;
  return (
    <section
      className={`${styles.ledger} ${compact ? styles.compact : ""}`}
      aria-label={compact ? "Today at a glance" : "Ranch ledger"}
    >
      {compact ? (
        <button
          type="button"
          className={styles.todayHeading}
          data-tutorial-id="ranch-morning-brief"
          onClick={() => {
            open("ledger");
            if (game.currentSave?.ranchDay?.phase !== "morning")
              window.dispatchEvent(
                new CustomEvent("creature-chronicles:tutorial-signal", {
                  detail: {
                    signal:
                      game.currentSave!.dayState.dayNumber > 1
                        ? "day-two-brief-opened"
                        : "morning-opened",
                  },
                }),
              );
          }}
          aria-haspopup="dialog"
        >
          <span>Today</span>
          <small>
            {planner.attentionCount
              ? `${planner.attentionCount} things to review`
              : "Everything looks settled"}
          </small>
          <b>Expand ledger ↗</b>
        </button>
      ) : (
        <p className={styles.intro}>
          {endDay
            ? "Review tonight before sleeping. You can keep playing to make changes."
            : "Your daily priorities, with a direct route to each task."}
        </p>
      )}
      {!compact && !endDay && (
        <details
          className={styles.story}
          open={game.currentSave?.ranchDay?.phase === "morning" || undefined}
        >
          <summary>Morning Brief & Daily Records</summary>
          <RanchDayDetails />
        </details>
      )}
      {rows.map((row) => (
        <article
          key={row.id}
          data-ui-text-box="auto"
          className={styles.ledgerRow}
        >
          <div>
            <h3>{row.title}</h3>
            <span className={row.attention ? styles.warning : styles.status}>
              {row.attention ? "! " : ""}
              {row.status}
            </span>
            <p>{row.detail}</p>
          </div>
          {!compact && (
            <button type="button" onClick={() => visit(row.destination)}>
              {row.action} →
            </button>
          )}
        </article>
      ))}
      {!compact && (
        <p className={styles.note}>
          Feed includes projected overnight production before feeding. Eggs and
          training advance when you sleep; security events can affect the final
          report.
        </p>
      )}
      {!compact && !endDay && (
        <button
          data-tutorial-id="ranch-review-day"
          className={styles.primary}
          type="button"
          onClick={() => open("end-day")}
        >
          Review & End Day →
        </button>
      )}
    </section>
  );
}
