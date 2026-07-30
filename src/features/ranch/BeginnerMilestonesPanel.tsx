"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { getStarterGoalProgress, getStarterGoals, type StarterGoal } from "@/data/starterGoals";
import { useGameContext } from "@/state/GameProvider";

const panelStyle: CSSProperties = {
  position: "fixed",
  right: 22,
  top: 252,
  zIndex: 21,
  width: "min(350px, calc(100vw - 44px))",
  maxHeight: "calc(100vh - 288px)",
  display: "grid",
  gap: 10,
  padding: 12,
  overflow: "auto",
  border: "2px solid rgba(127,219,255,.46)",
  borderRadius: 18,
  background: "linear-gradient(rgba(28,39,48,.94),rgba(9,10,12,.96))",
  color: "#fff7dd",
  boxShadow: "0 18px 40px rgba(0,0,0,.54)",
};
const buttonStyle: CSSProperties = {
  minHeight: 34,
  border: "2px solid rgba(45,25,13,.92)",
  borderRadius: 10,
  background: "linear-gradient(#fff4cf,#d6a25b)",
  color: "#1f1108",
  fontWeight: 950,
  cursor: "pointer",
};
const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#7fdbff",
  fontSize: ".62rem",
  fontWeight: 950,
  letterSpacing: ".12em",
  textTransform: "uppercase",
};

function goalActionLabel(goal: StarterGoal): string {
  if (goal.id.includes("chore") || goal.id.includes("assign") || goal.id.includes("feed") || goal.id.includes("garden") || goal.id.includes("hauling")) return "Open Chores";
  if (goal.id === "breed") return "Open Breeding";
  if (goal.id === "egg") return "Open Nursery";
  if (goal.id === "market" || goal.id === "guild") return "Go to Town";
  if (goal.id.includes("repair") || goal.id.includes("upgrade")) return "Open Office";
  return "Open Menu";
}

export function BeginnerMilestonesPanel() {
  const {
    appScreen,
    currentSave,
    goToBreeding,
    goToNursery,
    goToRanchJobs,
    goToRanchOffice,
    goToTown,
  } = useGameContext();
  const [collapsed, setCollapsed] = useState(true);
  const goals = useMemo(() => currentSave ? getStarterGoals(currentSave) : [], [currentSave]);
  const progress = useMemo(() => currentSave ? getStarterGoalProgress(currentSave) : null, [currentSave]);
  if (appScreen !== "ranch-hub" || !currentSave || !progress) return null;
  const incomplete = goals.filter((goal) => !goal.complete);
  const nextGoal = incomplete[0] ?? null;
  const percent = Math.round((progress.completed / Math.max(1, progress.total)) * 100);

  function go(goal: StarterGoal | null) {
    if (!goal) return;
    const label = goalActionLabel(goal);
    if (label === "Open Chores") goToRanchJobs();
    else if (label === "Open Breeding") goToBreeding();
    else if (label === "Open Nursery") goToNursery();
    else if (label === "Open Office") goToRanchOffice();
    else if (label === "Go to Town") goToTown();
  }

  if (collapsed) {
    return (
      <aside style={{ position: "fixed", right: 22, top: 252, zIndex: 21 }}>
        <button type="button" style={{ ...buttonStyle, minHeight: 48, borderRadius: 999, padding: "6px 12px" }} onClick={() => setCollapsed(false)}>
          Milestones ({progress.completed}/{progress.total})
        </button>
      </aside>
    );
  }

  return (
    <aside style={panelStyle} aria-label="Optional beginner milestones">
      <header style={{ display: "grid", gridTemplateColumns: "1fr 34px", gap: 10 }}>
        <div>
          <p style={kickerStyle}>Ranch Handbook</p>
          <h2 style={{ margin: "2px 0", color: "#fff", fontSize: "1.25rem" }}>Beginner Milestones</h2>
          <span style={{ color: "#7fdbff", fontSize: ".76rem", fontWeight: 900 }}>{progress.completed}/{progress.total} complete · {percent}%</span>
        </div>
        <button type="button" style={{ ...buttonStyle, width: 34, height: 34, borderRadius: 999 }} onClick={() => setCollapsed(true)}>−</button>
      </header>
      <div style={{ height: 9, borderRadius: 999, overflow: "hidden", background: "rgba(0,0,0,.34)" }}>
        <span style={{ display: "block", width: `${percent}%`, height: "100%", background: "linear-gradient(90deg,#7fdbff,#f5c980)" }} />
      </div>
      <p style={{ margin: 0, color: "#f2dfbd", fontSize: ".78rem", lineHeight: 1.35 }}>
        These optional goals teach deeper ranch habits and keep their original rewards. They no longer block Chapter 1 story progress.
      </p>
      {nextGoal ? (
        <article style={{ padding: 10, border: "1px solid rgba(245,201,128,.42)", borderRadius: 12, background: "rgba(0,0,0,.24)" }}>
          <p style={{ ...kickerStyle, color: "#f5c980" }}>Suggested Next Milestone</p>
          <strong style={{ display: "block", marginTop: 4 }}>{nextGoal.label}</strong>
          <p style={{ margin: "6px 0", color: "#f2dfbd", fontSize: ".8rem" }}>{nextGoal.hint}</p>
          <span style={{ display: "block", color: "#7ee5a8", fontSize: ".74rem", fontWeight: 900 }}>Reward: {nextGoal.rewardLabel}</span>
          <button type="button" style={{ ...buttonStyle, width: "100%", marginTop: 9 }} onClick={() => go(nextGoal)}>{goalActionLabel(nextGoal)}</button>
        </article>
      ) : (
        <article style={{ padding: 10, border: "1px solid rgba(126,229,168,.5)", borderRadius: 12, background: "rgba(126,229,168,.1)" }}>
          <strong>All beginner milestones complete.</strong>
        </article>
      )}
      <details>
        <summary style={{ cursor: "pointer", color: "#7fdbff", fontWeight: 900 }}>View all milestones and rewards</summary>
        <section style={{ display: "grid", gap: 6, marginTop: 8 }}>
          {goals.map((goal) => (
            <article key={goal.id} style={{ padding: 8, border: `1px solid ${goal.complete ? "rgba(126,229,168,.42)" : "rgba(245,201,128,.26)"}`, borderRadius: 9, background: "rgba(0,0,0,.2)" }}>
              <strong>{goal.complete ? "✓" : "○"} {goal.label}</strong>
              <span style={{ display: "block", marginTop: 3, color: goal.rewardClaimed ? "#7ee5a8" : "#e7c991", fontSize: ".7rem" }}>
                {goal.rewardClaimed ? "Claimed" : goal.rewardLabel}
              </span>
            </article>
          ))}
        </section>
      </details>
    </aside>
  );
}
