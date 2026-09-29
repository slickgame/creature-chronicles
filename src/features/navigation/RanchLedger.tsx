"use client";
import { useMemo } from "react";
import { getRanchPlanner, type PlannerDestination, type PlannerRow } from "@/data/ranchPlanner";
import { useGameContext } from "@/state/GameProvider";
import { RanchIcon, type RanchIconName } from "@/features/ui/RanchIcon";
import { useNavigation } from "./NavigationContext";
import { RanchDayDetails } from "./RanchDayDetails";
import styles from "./Navigation.module.css";
const ICONS: Record<string, RanchIconName> = { feed: "feed", nursery: "nest", chores: "chores", tax: "tax", condition: "tools", training: "paw" };
export function RanchLedger({ compact = false, endDay = false, panel = false, minimal = false }: { compact?: boolean; endDay?: boolean; panel?: boolean; minimal?: boolean }) {
  const game = useGameContext();
  const { open } = useNavigation();
  const planner = useMemo(() => game.currentSave ? getRanchPlanner(game.currentSave) : null, [game.currentSave]);
  if (!planner) return null;
  function visit(destination: PlannerDestination) {
    open(null);
    ({ nursery: game.goToNursery, chores: game.goToRanchJobs, supplies: game.goToSupplyDepot, office: game.goToRanchOffice, training: game.goToTrainingGrounds })[destination]();
  }
  const ordered = [...planner.rows].sort((a,b) => Number(b.attention) - Number(a.attention));
  const primary = compact ? ordered.slice(0,3) : planner.rows.filter(row => ["nursery", "chores", "feed"].includes(row.id)).sort((a,b) => ["nursery","chores","feed"].indexOf(a.id) - ["nursery","chores","feed"].indexOf(b.id));
  function rowCard(row: PlannerRow) {
    return <article key={row.id} data-ui-text-box="auto" className={styles.ledgerRow}>
      <RanchIcon name={ICONS[row.id]} />
      <div><h3>{row.title}</h3><span className={row.attention ? styles.warning : styles.status}>{row.status}</span>{!compact && <p>{row.detail}</p>}</div>
      {!compact && <button type="button" onClick={() => visit(row.destination)}>{row.action} <span aria-hidden="true">›</span></button>}
    </article>;
  }
  return <section className={`${styles.ledger} ${compact ? styles.compact : ""}`} aria-label={compact ? "Today at a glance" : "Ranch ledger"}>
    {compact ? <button type="button" className={styles.todayHeading} data-tutorial-id="ranch-morning-brief" aria-expanded={false} onClick={() => {
      open("ledger");
      if (game.currentSave?.ranchDay?.phase !== "morning") window.dispatchEvent(new CustomEvent("creature-chronicles:tutorial-signal", { detail: { signal: game.currentSave!.dayState.dayNumber > 1 ? "day-two-brief-opened" : "morning-opened" } }));
    }}><RanchIcon name="leaf" /><span>Today<small>{planner.attentionCount ? `${planner.attentionCount} things to review` : "All looking settled"}</small></span><b>Expand ledger ›</b></button> : endDay ? <p className={styles.intro}>Review tonight before sleeping. You can keep playing to make changes.</p> : null}
    {!compact && !endDay && game.currentSave?.ranchDay?.phase === "morning" && <details className={styles.story} open><summary>Morning Brief</summary><RanchDayDetails /></details>}
    {!minimal && <div className={styles.priorityRows}>{primary.map(rowCard)}</div>}
    {compact ? !minimal && <button type="button" className={styles.expandLink} onClick={() => open("ledger")}>Open today’s ledger <span aria-hidden="true">›</span></button> : <>
      {rowCard(planner.rows.find(row => row.id === "tax")!)}
      <details className={styles.story} open={endDay || undefined}><summary>Ranch condition & training</summary>{planner.rows.filter(row => ["condition","training"].includes(row.id)).map(rowCard)}</details>
      {!endDay && game.currentSave?.ranchDay?.phase !== "morning" && <details className={styles.story}><summary>Morning Brief & Daily Records</summary><RanchDayDetails /></details>}
      {!endDay && !panel && <button data-tutorial-id="ranch-review-day" className={`${styles.primary} ${styles.endDay}`} type="button" onClick={() => open("end-day")}><RanchIcon name="moon" />Review & End Day <span aria-hidden="true">›</span></button>}
      <p className={styles.note}>Feed includes projected overnight production. Eggs and training advance when you sleep; security events can affect the final report.</p>
    </>}
  </section>;
}
