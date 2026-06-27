"use client";

import { useMemo, useState } from "react";
import { getRanchAdvisorPlan, type RanchAdvisorAction, type RanchAdvisorPriority } from "@/data/ranchAdvisor";
import { useGameContext } from "@/state/GameProvider";
import styles from "./RanchAdvisorPanel.module.css";

type AdvisorPage = "today" | "crew" | "lore";

function getSeverityLabel(priority: RanchAdvisorPriority): string { if (priority.severity === "urgent") return "Urgent"; if (priority.severity === "warning") return "Warning"; if (priority.severity === "suggestion") return "Suggested"; return "Info"; }

export function RanchAdvisorPanel() {
  const { currentSave, goToBreeding, goToCollection, goToNursery, goToRanchJobs, goToRanchOffice, goToTown } = useGameContext();
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState<AdvisorPage>("today");
  const plan = useMemo(() => currentSave ? getRanchAdvisorPlan(currentSave) : null, [currentSave]);
  if (!currentSave || !plan) return null;

  function handleAction(action: RanchAdvisorAction) {
    if (action === "chores") goToRanchJobs();
    if (action === "nursery") goToNursery();
    if (action === "town") goToTown();
    if (action === "office") goToRanchOffice();
    if (action === "breeding") goToBreeding();
    if (action === "collection") goToCollection();
  }

  if (collapsed) return <aside className={styles.collapsedAdvisor}><button type="button" onClick={() => setCollapsed(false)}><img src={plan.advisor.portraitPath} alt="" /><span>Advisor</span><strong>{plan.priorities.length}</strong></button></aside>;

  return <aside className={styles.advisorPanel} aria-label="Ranch Advisor morning planner"><header className={styles.advisorHeader}><img src={plan.advisor.portraitPath} alt="" /><div><p>{plan.advisor.title}</p><h2>{plan.advisor.name}</h2><span>{plan.advisor.identity}</span></div><button type="button" onClick={() => setCollapsed(true)} aria-label="Collapse Ranch Advisor">−</button></header><p className={styles.advisorLine}>{plan.greeting}</p><div className={styles.focusBox}><span>Today’s Focus</span><strong>{plan.focus}</strong></div><nav className={styles.advisorTabs} aria-label="Advisor pages"><button type="button" className={page === "today" ? styles.activeTab : ""} onClick={() => setPage("today")}>Today</button><button type="button" className={page === "crew" ? styles.activeTab : ""} onClick={() => setPage("crew")}>Crew Roles</button><button type="button" className={page === "lore" ? styles.activeTab : ""} onClick={() => setPage("lore")}>Veyra</button></nav>{page === "today" ? <section className={styles.priorityList}>{plan.priorities.length ? plan.priorities.map((priority) => <article key={priority.id} className={`${styles.priorityCard} ${styles[priority.severity]}`}><div><span>{getSeverityLabel(priority)}</span><strong>{priority.title}</strong>{priority.helperName ? <em>Suggested helper: {priority.helperName}</em> : null}<p>{priority.body}</p></div>{priority.action ? <button type="button" onClick={() => handleAction(priority.action)}>{priority.actionLabel}</button> : null}</article>) : <article className={`${styles.priorityCard} ${styles.info}`}><div><span>Stable</span><strong>No urgent priorities</strong><p>Use the day to stock feed, gather materials, improve comfort, or plan your next pairing.</p></div></article>}</section> : null}{page === "crew" ? <section className={styles.lessonList}>{plan.crewLessons.map((lesson) => <article key={lesson.family}><span>{lesson.role}</span><strong>{lesson.exampleName ? `${lesson.exampleName} / ${lesson.family}` : lesson.family}</strong><p>{lesson.lesson}</p></article>)}</section> : null}{page === "lore" ? <section className={styles.lorePanel}><strong>{plan.advisor.storyHook}</strong><p>For now, Veyra stays SFW in the management UI: confident, practical, and direct. The mature identity can matter later in story scenes without turning the ranch planner into explicit content.</p></section> : null}</aside>;
}
