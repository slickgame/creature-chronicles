"use client";

import { useMemo, useState } from "react";
import { getVariantDefinition } from "@/data/creatures";
import { getCreatureDisplayName, getEligibleCreaturesForJob, getRanchJobs, RANCH_JOB_DEFINITIONS, RANCH_JOB_IDS, RANCH_JOB_ASSETS } from "@/data/ranchJobs";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobId } from "@/types/ranchJobs";
import styles from "./RanchJobsScreen.module.css";

function getCreatureSummary(creature: CreatureRecord): string {
  const variant = getVariantDefinition(creature.variantId);
  return `${variant.family} • Lv ${creature.level} • Energy ${creature.energy}/${creature.maxEnergy} • Affection ${creature.affection}`;
}

export function RanchJobsScreen() {
  const { assignRanchJob, currentSave, goToMainMenu, goToRanch, version } = useGameContext();
  const [message, setMessage] = useState("Assign creatures to ranch jobs, then sleep to resolve their work for the next day.");
  const [draftAssignments, setDraftAssignments] = useState<Record<RanchJobId, string>>({
    security_patrol: "",
    comfort_care: "",
    stable_production: "",
    garden_tending: "",
    field_hauling: "",
  });

  const jobs = useMemo(() => currentSave ? getRanchJobs(currentSave) : null, [currentSave]);

  if (!currentSave || !jobs) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before opening Ranch Jobs.</p><button type="button" className={styles.primaryButton} onClick={goToMainMenu}>Return to Main Menu</button></section></main>;
  }

  const assignedIds = Object.values(jobs.assignments).filter(Boolean) as CreatureId[];
  const assignedCreatures = assignedIds.map((creatureId) => (currentSave.creatures ?? []).find((creature) => creature.creatureId === creatureId)).filter(Boolean) as CreatureRecord[];
  const projectedGold = RANCH_JOB_DEFINITIONS.reduce((total, job) => total + (jobs.assignments[job.jobId] ? job.baseGoldReward : 0), 0);
  const projectedGp = RANCH_JOB_DEFINITIONS.reduce((total, job) => total + (jobs.assignments[job.jobId] ? job.baseGuildPointReward : 0), 0);

  function handleAssign(jobId: RanchJobId) {
    const selectedCreatureId = (draftAssignments[jobId] || jobs.assignments[jobId] || "") as CreatureId | "";
    const result = assignRanchJob(jobId, selectedCreatureId ? selectedCreatureId : null);
    setMessage(result.message);
  }

  function handleClear(jobId: RanchJobId) {
    const result = assignRanchJob(jobId, null);
    setDraftAssignments((current) => ({ ...current, [jobId]: "" }));
    setMessage(result.message);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M14 Ranch Assignment System</p>
            <h1>Ranch Jobs</h1>
            <p>Use existing creature portraits and habitat art for now. Job-specific icons can be generated later once these names feel final.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" onClick={goToRanch}>Back to Ranch</button>
            <button type="button" onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.jobGrid}>
            {RANCH_JOB_DEFINITIONS.map((job) => {
              const assignedCreatureId = jobs.assignments[job.jobId];
              const assignedCreature = assignedCreatureId ? (currentSave.creatures ?? []).find((creature) => creature.creatureId === assignedCreatureId) ?? null : null;
              const eligibleCreatures = getEligibleCreaturesForJob(currentSave, job.jobId);
              const draftValue = draftAssignments[job.jobId] || assignedCreatureId || "";

              return (
                <article key={job.jobId} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <img className={styles.jobIcon} src={job.iconPath} alt="" />
                    <div>
                      <p className={styles.kicker}>{job.shortName}</p>
                      <h2>{job.name}</h2>
                      <p>{job.description}</p>
                    </div>
                  </div>

                  <span className={styles.rewardLine}>{job.rewardLabel} • {job.energyCost} energy</span>

                  <div className={styles.assignmentBox}>
                    <strong>{assignedCreature ? getCreatureDisplayName(assignedCreature) : "No creature assigned"}</strong>
                    {assignedCreature ? <span>{getCreatureSummary(assignedCreature)}</span> : <span>Choose an eligible creature below.</span>}
                    <div className={styles.selectRow}>
                      <select value={draftValue} onChange={(event) => setDraftAssignments((current) => ({ ...current, [job.jobId]: event.target.value }))}>
                        <option value="">Unassigned</option>
                        {eligibleCreatures.map((creature) => <option key={creature.creatureId} value={creature.creatureId}>{getCreatureDisplayName(creature)}</option>)}
                      </select>
                      <button type="button" className={styles.primaryButton} onClick={() => handleAssign(job.jobId)}>Assign</button>
                    </div>
                    {assignedCreature ? <button type="button" className={styles.clearButton} onClick={() => handleClear(job.jobId)}>Clear Assignment</button> : null}
                  </div>

                  <div className={styles.candidateList}>
                    {eligibleCreatures.length ? eligibleCreatures.slice(0, 3).map((creature) => <div key={creature.creatureId} className={styles.candidatePill}><strong>{getCreatureDisplayName(creature)}</strong><span>{getCreatureSummary(creature)}</span></div>) : <div className={styles.candidatePill}><strong>No eligible creatures yet</strong><span>Buy, hatch, or dev-spawn a fitting family for this job.</span></div>}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className={styles.sidePanel}>
            <img src={RANCH_JOB_ASSETS.ranchJobsBoard} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "contain" }} />
            <div>
              <p className={styles.kicker}>Assignment Board</p>
              <h2>Daily Work Plan</h2>
              <p className={styles.message}>{message}</p>
            </div>
            <div className={styles.statGrid}>
              <div className={styles.statCard}><span>Assigned</span><strong>{assignedCreatures.length}/{RANCH_JOB_IDS.length}</strong></div>
              <div className={styles.statCard}><span>Completed</span><strong>{jobs.lifetimeCompletions}</strong></div>
              <div className={styles.statCard}><span>Projected Gold</span><strong>{formatGold(projectedGold)}</strong></div>
              <div className={styles.statCard}><span>Projected GP</span><strong>{formatGuildPoints(projectedGp)}</strong></div>
            </div>
            <div className={styles.summaryList}>
              {RANCH_JOB_DEFINITIONS.map((job) => {
                const creatureId = jobs.assignments[job.jobId];
                const creature = creatureId ? (currentSave.creatures ?? []).find((item) => item.creatureId === creatureId) : null;
                return <div key={job.jobId} className={styles.summaryItem}><strong>{job.name}</strong><span>{creature ? creature.nickname : "Unassigned"}</span></div>;
              })}
            </div>
          </aside>
        </section>

        <footer className={styles.footer}>{version}</footer>
      </section>
    </main>
  );
}
