"use client";

import { useMemo, useState } from "react";
import { getVariantDefinition } from "@/data/creatures";
import {
  getCreatureDisplayName,
  getEligibleCreaturesForJob,
  getRanchJobs,
  RANCH_JOB_ASSETS,
  RANCH_JOB_DEFINITIONS,
  RANCH_JOB_IDS,
} from "@/data/ranchJobs";
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

function getCreatureEnergyLabel(creature: CreatureRecord, energyCost: number): string {
  if (creature.energy < energyCost) return "Low Energy";
  if (creature.energy <= energyCost + 5) return "Tired";
  return "Ready";
}

export function RanchJobsScreen() {
  const { assignRanchJob, currentSave, goToMainMenu, goToRanch, version } = useGameContext();
  const [message, setMessage] = useState("Assign creatures to ranch jobs, then sleep to resolve their work for the next day.");
  const [activeJobId, setActiveJobId] = useState<RanchJobId | null>(null);
  const [draftAssignments, setDraftAssignments] = useState<Record<RanchJobId, string>>({
    security_patrol: "",
    comfort_care: "",
    stable_production: "",
    garden_tending: "",
    field_hauling: "",
  });

  const jobs = useMemo(() => (currentSave ? getRanchJobs(currentSave) : null), [currentSave]);

  if (!currentSave || !jobs) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before opening Ranch Jobs.</p>
          <button type="button" className={styles.primaryButton} onClick={goToMainMenu}>
            Return to Main Menu
          </button>
        </section>
      </main>
    );
  }

  const assignedIds = Object.values(jobs.assignments).filter(Boolean) as CreatureId[];
  const assignedCreatures = assignedIds
    .map((creatureId) => (currentSave.creatures ?? []).find((creature) => creature.creatureId === creatureId))
    .filter(Boolean) as CreatureRecord[];
  const projectedGold = RANCH_JOB_DEFINITIONS.reduce((total, job) => total + (jobs.assignments[job.jobId] ? job.baseGoldReward : 0), 0);
  const projectedGp = RANCH_JOB_DEFINITIONS.reduce((total, job) => total + (jobs.assignments[job.jobId] ? job.baseGuildPointReward : 0), 0);
  const activeJob = activeJobId ? RANCH_JOB_DEFINITIONS.find((job) => job.jobId === activeJobId) ?? null : null;

  function getAssignedCreature(jobId: RanchJobId): CreatureRecord | null {
    const assignedCreatureId = jobs?.assignments[jobId];
    return assignedCreatureId ? (currentSave?.creatures ?? []).find((creature) => creature.creatureId === assignedCreatureId) ?? null : null;
  }

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
          <div className={styles.titleBlock}>
            <p className={styles.kicker}>M14 Ranch Assignment System</p>
            <h1>Ranch Jobs</h1>
            <p className={styles.subtitle}>Night-mode assignment board. Pick a creature, assign the job, then sleep to resolve daily work.</p>
          </div>

          <div className={styles.headerActions}>
            <button type="button" onClick={goToRanch}>Back to Ranch</button>
            <button type="button" onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        <section className={styles.topStats} aria-label="Ranch job overview">
          <div className={styles.topStat}><span>Assigned</span><strong>{assignedCreatures.length}/{RANCH_JOB_IDS.length}</strong></div>
          <div className={styles.topStat}><span>Projected Gold</span><strong>{formatGold(projectedGold)}</strong></div>
          <div className={styles.topStat}><span>Projected GP</span><strong>{formatGuildPoints(projectedGp)}</strong></div>
          <div className={styles.topStat}><span>Completed</span><strong>{jobs.lifetimeCompletions}</strong></div>
        </section>

        <section className={styles.content}>
          <div className={styles.jobGrid}>
            {RANCH_JOB_DEFINITIONS.map((job) => {
              const assignedCreature = getAssignedCreature(job.jobId);
              const eligibleCreatures = getEligibleCreaturesForJob(currentSave, job.jobId);
              const draftValue = draftAssignments[job.jobId] || jobs.assignments[job.jobId] || "";

              return (
                <article key={job.jobId} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <img className={styles.jobIcon} src={job.iconPath} alt="" />
                    <div className={styles.jobTitleArea}>
                      <p className={styles.kicker}>{job.shortName}</p>
                      <h2>{job.name}</h2>
                      <p className={styles.jobDescription}>{job.description}</p>
                    </div>
                  </div>

                  <div className={styles.compactMetaRow}>
                    <span className={styles.rewardLine}>{job.rewardLabel}</span>
                    <span className={styles.energyChip}>{job.energyCost} energy</span>
                  </div>

                  <div className={styles.assignmentBox}>
                    <div className={styles.assignedLine}>
                      <span className={assignedCreature ? styles.assignedDot : styles.unassignedDot} />
                      <div>
                        <strong>{assignedCreature ? getCreatureDisplayName(assignedCreature) : "Unassigned"}</strong>
                        <span>{assignedCreature ? getCreatureSummary(assignedCreature) : `${eligibleCreatures.length} eligible creature${eligibleCreatures.length === 1 ? "" : "s"}`}</span>
                      </div>
                    </div>

                    <div className={styles.selectRow}>
                      <select
                        value={draftValue}
                        aria-label={`${job.name} assignment`}
                        onChange={(event) => setDraftAssignments((current) => ({ ...current, [job.jobId]: event.target.value }))}
                      >
                        <option value="">Unassigned</option>
                        {eligibleCreatures.map((creature) => (
                          <option key={creature.creatureId} value={creature.creatureId}>{getCreatureDisplayName(creature)}</option>
                        ))}
                      </select>
                      <button type="button" className={styles.primaryButton} onClick={() => handleAssign(job.jobId)}>Assign</button>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => setActiveJobId(job.jobId)}>Details / Eligible List</button>
                    {assignedCreature ? <button type="button" className={styles.clearButton} onClick={() => handleClear(job.jobId)}>Clear</button> : null}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className={styles.sidePanel}>
            <img className={styles.boardImage} src={RANCH_JOB_ASSETS.ranchJobsBoard} alt="" />
            <div>
              <p className={styles.kicker}>Assignment Board</p>
              <h2>Daily Work Plan</h2>
              <p className={styles.message}>{message}</p>
            </div>
            <div className={styles.summaryList}>
              {RANCH_JOB_DEFINITIONS.map((job) => {
                const creature = getAssignedCreature(job.jobId);
                return (
                  <button key={job.jobId} type="button" className={styles.summaryItem} onClick={() => setActiveJobId(job.jobId)}>
                    <strong>{job.name}</strong>
                    <span>{creature ? creature.nickname : "Unassigned"}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </section>

        <footer className={styles.footer}>{version}</footer>
      </section>

      {activeJob ? (() => {
        const assignedCreature = getAssignedCreature(activeJob.jobId);
        const eligibleCreatures = getEligibleCreaturesForJob(currentSave, activeJob.jobId);
        const draftValue = draftAssignments[activeJob.jobId] || jobs.assignments[activeJob.jobId] || "";

        return (
          <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setActiveJobId(null)}>
            <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="ranch-job-modal-title" onMouseDown={(event) => event.stopPropagation()}>
              <header className={styles.modalHeader}>
                <div className={styles.modalTitleRow}>
                  <img className={styles.modalIcon} src={activeJob.iconPath} alt="" />
                  <div>
                    <p className={styles.kicker}>{activeJob.shortName}</p>
                    <h2 id="ranch-job-modal-title">{activeJob.name}</h2>
                  </div>
                </div>
                <button type="button" className={styles.modalCloseButton} onClick={() => setActiveJobId(null)}>Close</button>
              </header>

              <div className={styles.modalBody}>
                <section className={styles.modalInfoGrid}>
                  <div className={styles.infoPanel}>
                    <p className={styles.panelLabel}>Job Details</p>
                    <p>{activeJob.description}</p>
                  </div>
                  <div className={styles.infoPanel}>
                    <p className={styles.panelLabel}>Reward</p>
                    <strong>{activeJob.rewardLabel}</strong>
                    <span>{activeJob.energyCost} energy cost</span>
                  </div>
                  <div className={styles.infoPanel}>
                    <p className={styles.panelLabel}>Current Assignment</p>
                    <strong>{assignedCreature ? getCreatureDisplayName(assignedCreature) : "Unassigned"}</strong>
                    <span>{assignedCreature ? getCreatureSummary(assignedCreature) : "Select an eligible creature below."}</span>
                  </div>
                </section>

                <section className={styles.modalAssignmentBox}>
                  <div>
                    <p className={styles.panelLabel}>Assign Creature</p>
                    <p>Eligible candidates are shown here instead of crowding the main board.</p>
                  </div>
                  <div className={styles.modalSelectRow}>
                    <select
                      value={draftValue}
                      aria-label={`${activeJob.name} assignment`}
                      onChange={(event) => setDraftAssignments((current) => ({ ...current, [activeJob.jobId]: event.target.value }))}
                    >
                      <option value="">Unassigned</option>
                      {eligibleCreatures.map((creature) => (
                        <option key={creature.creatureId} value={creature.creatureId}>{getCreatureDisplayName(creature)}</option>
                      ))}
                    </select>
                    <button type="button" className={styles.primaryButton} onClick={() => handleAssign(activeJob.jobId)}>Assign</button>
                    {assignedCreature ? <button type="button" className={styles.clearButton} onClick={() => handleClear(activeJob.jobId)}>Clear</button> : null}
                  </div>
                </section>

                <section>
                  <div className={styles.modalSectionHeader}>
                    <h3>Eligible Creatures</h3>
                    <span>{eligibleCreatures.length} available</span>
                  </div>

                  <div className={styles.eligibleList}>
                    {eligibleCreatures.length ? eligibleCreatures.map((creature) => (
                      <button
                        key={creature.creatureId}
                        type="button"
                        className={styles.eligibleCard}
                        onClick={() => setDraftAssignments((current) => ({ ...current, [activeJob.jobId]: creature.creatureId }))}
                      >
                        <div>
                          <strong>{getCreatureDisplayName(creature)}</strong>
                          <span>{getCreatureSummary(creature)}</span>
                        </div>
                        <em>{getCreatureEnergyLabel(creature, activeJob.energyCost)}</em>
                      </button>
                    )) : (
                      <div className={styles.emptyEligibleCard}>
                        <strong>No eligible creatures yet</strong>
                        <span>Buy, hatch, or dev-spawn a fitting family for this job.</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </section>
          </div>
        );
      })() : null}
    </main>
  );
}
