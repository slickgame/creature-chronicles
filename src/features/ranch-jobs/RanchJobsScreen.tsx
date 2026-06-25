"use client";

import { useMemo, useState } from "react";
import { getVariantDefinition } from "@/data/creatures";
import {
  getCreatureDisplayName,
  getEligibleCreaturesForJob,
  getRanchJobs,
  RANCH_JOB_DEFINITIONS,
  RANCH_JOB_IDS,
} from "@/data/ranchJobs";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobId } from "@/types/ranchJobs";
import styles from "./RanchJobsScreen.module.css";

type InfoTarget = "overview" | RanchJobId | null;

function getCreatureSummary(creature: CreatureRecord): string {
  const variant = getVariantDefinition(creature.variantId);
  return `${variant.family} • Lv ${creature.level} • Energy ${creature.energy}/${creature.maxEnergy} • Affection ${creature.affection}`;
}

function getCreatureProfilePath(creature: CreatureRecord): string {
  return getVariantDefinition(creature.variantId).profilePath;
}

function getCreatureEnergyLabel(creature: CreatureRecord, energyCost: number): string {
  if (creature.energy < energyCost) return "Low Energy";
  if (creature.energy <= energyCost + 5) return "Tired";
  return "Ready";
}

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function getDailyFeedCost(creature: CreatureRecord): number {
  const variant = getVariantDefinition(creature.variantId);
  const familyBaseCost = variant.family === "bovine" || variant.family === "equine" ? 2 : 1;
  const rareCost = variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0;
  return familyBaseCost + rareCost;
}

function getProjectedFeedForJob(jobId: RanchJobId): number {
  if (jobId === "stable_production") return 6;
  if (jobId === "garden_tending") return 3;
  return 0;
}

export function RanchJobsScreen() {
  const { assignRanchJob, currentSave, goToMainMenu, goToRanch, version } = useGameContext();
  const [message, setMessage] = useState("Assign creatures to ranch chores, then sleep to resolve provisions, comfort, safety, and upkeep.");
  const [activeJobId, setActiveJobId] = useState<RanchJobId | null>(null);
  const [infoTarget, setInfoTarget] = useState<InfoTarget>(null);
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
          <p>Load or create a save before opening Ranch Chores.</p>
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
  const feedStock = getFlagNumber(currentSave.flags.ranchFeedStock);
  const dailyFeedNeed = (currentSave.creatures ?? []).reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const projectedFeed = RANCH_JOB_DEFINITIONS.reduce((total, job) => total + (jobs.assignments[job.jobId] ? getProjectedFeedForJob(job.jobId) : 0), 0);
  const projectedAvailableFeed = feedStock + projectedFeed;
  const projectedFoodStatus = projectedAvailableFeed >= dailyFeedNeed ? "Fed" : projectedAvailableFeed > 0 ? "Short" : "Empty";
  const projectedRecoveryLabel = projectedFoodStatus === "Fed" ? "Full recovery expected." : projectedFoodStatus === "Short" ? "Food shortage expected: weak recovery and -1 affection." : "No food expected: almost no recovery and -3 affection.";
  const activeJob = activeJobId ? RANCH_JOB_DEFINITIONS.find((job) => job.jobId === activeJobId) ?? null : null;
  const infoJob = infoTarget && infoTarget !== "overview" ? RANCH_JOB_DEFINITIONS.find((job) => job.jobId === infoTarget) ?? null : null;

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
          <div className={styles.titleRow}>
            <h1>Ranch Chores</h1>
            <button type="button" className={styles.infoButton} onClick={() => setInfoTarget("overview")} aria-label="About ranch chores">
              i
            </button>
          </div>

          <div className={styles.headerActions}>
            <button type="button" onClick={goToRanch}>Back to Ranch</button>
            <button type="button" onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        <section className={styles.topStats} aria-label="Ranch chore overview">
          <div className={styles.topStat}><span>Assigned</span><strong>{assignedCreatures.length}/{RANCH_JOB_IDS.length}</strong></div>
          <div className={styles.topStat}><span>Feed Stock</span><strong>{feedStock}</strong></div>
          <div className={styles.topStat}><span>Projected Feed</span><strong>+{projectedFeed}</strong></div>
          <div className={styles.topStat}><span>Daily Need</span><strong>{dailyFeedNeed}</strong></div>
        </section>

        <p className={projectedFoodStatus === "Fed" ? styles.statusMessage : styles.warningMessage}>{projectedRecoveryLabel}</p>

        <section className={styles.content}>
          <div className={styles.jobGrid}>
            {RANCH_JOB_DEFINITIONS.map((job) => {
              const assignedCreature = getAssignedCreature(job.jobId);

              return (
                <article key={job.jobId} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <img className={styles.jobIcon} src={job.iconPath} alt="" />
                    <div className={styles.jobTitleArea}>
                      <p className={styles.kicker}>{job.shortName}</p>
                      <h2>{job.name}</h2>
                    </div>
                    <button type="button" className={styles.infoButtonSmall} onClick={() => setInfoTarget(job.jobId)} aria-label={`About ${job.name}`}>
                      i
                    </button>
                  </div>

                  <div className={styles.compactMetaRow}>
                    <span className={styles.rewardLine}>{job.rewardLabel}</span>
                    <span className={styles.energyChip}>{job.energyCost} energy</span>
                  </div>

                  <div className={styles.assignmentBox}>
                    <div className={`${styles.assignedLine} ${assignedCreature ? styles.assignedLineWithPortrait : ""}`}>
                      <span className={assignedCreature ? styles.assignedDot : styles.unassignedDot} />
                      {assignedCreature ? <img className={styles.assignedPortrait} src={getCreatureProfilePath(assignedCreature)} alt="" /> : null}
                      <div className={styles.assignedText}>
                        <strong>{assignedCreature ? getCreatureDisplayName(assignedCreature) : "Unassigned"}</strong>
                        <span>{assignedCreature ? getCreatureSummary(assignedCreature) : "Open this chore to choose an eligible creature."}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => setActiveJobId(job.jobId)}>Open Chore</button>
                    {assignedCreature ? <button type="button" className={styles.clearButton} onClick={() => handleClear(job.jobId)}>Clear</button> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className={styles.footer}>{version}</footer>
      </section>

      {infoTarget ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setInfoTarget(null)}>
          <section className={styles.infoModalPanel} role="dialog" aria-modal="true" aria-labelledby="ranch-info-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.kicker}>{infoTarget === "overview" ? "Ranch Provision System" : infoJob?.shortName}</p>
                <h2 id="ranch-info-modal-title">{infoTarget === "overview" ? "About Ranch Chores" : infoJob?.name}</h2>
              </div>
              <button type="button" className={styles.modalCloseButton} onClick={() => setInfoTarget(null)}>Close</button>
            </header>

            <div className={styles.modalBody}>
              {infoTarget === "overview" ? (
                <div className={styles.infoTextBlock}>
                  <p>Ranch chores are daily assignments for creatures staying at the ranch. They are separate from quests and story objectives.</p>
                  <p>Chores no longer pay Gold or GP. They manage ranch provisions, safety, comfort, breeding readiness, and future upkeep systems.</p>
                  <p>Surplus Feed carries over in the feed shed. If the ranch has too little food at sleep, player and creature energy recover poorly and creature affection drops.</p>
                  <div className={styles.infoPanel}>
                    <p className={styles.panelLabel}>Tonight Projection</p>
                    <strong>{projectedAvailableFeed}/{dailyFeedNeed} Feed available</strong>
                    <span>{projectedRecoveryLabel}</span>
                  </div>
                </div>
              ) : infoJob ? (
                <div className={styles.infoTextBlock}>
                  <p>{infoJob.description}</p>
                  <div className={styles.infoPanel}>
                    <p className={styles.panelLabel}>Chore Effect</p>
                    <strong>{infoJob.rewardLabel}</strong>
                    <span>{infoJob.energyCost} energy cost</span>
                  </div>
                  <div className={styles.infoPanel}>
                    <p className={styles.panelLabel}>Eligible Families</p>
                    <strong>{infoJob.preferredFamilies.join(", ")}</strong>
                    <span>Some special variants may also qualify.</span>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {activeJob ? (() => {
        const assignedCreature = getAssignedCreature(activeJob.jobId);
        const eligibleCreatures = getEligibleCreaturesForJob(currentSave, activeJob.jobId);
        const draftValue = draftAssignments[activeJob.jobId] || jobs.assignments[activeJob.jobId] || "";

        return (
          <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setActiveJobId(null)}>
            <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="ranch-chore-modal-title" onMouseDown={(event) => event.stopPropagation()}>
              <header className={styles.modalHeader}>
                <div className={styles.modalTitleRow}>
                  <img className={styles.modalIcon} src={activeJob.iconPath} alt="" />
                  <div>
                    <p className={styles.kicker}>{activeJob.shortName}</p>
                    <h2 id="ranch-chore-modal-title">{activeJob.name}</h2>
                  </div>
                </div>
                <button type="button" className={styles.modalCloseButton} onClick={() => setActiveJobId(null)}>Close</button>
              </header>

              <div className={styles.modalBody}>
                <section className={styles.modalInfoGrid}>
                  <div className={styles.infoPanel}>
                    <p className={styles.panelLabel}>Chore Details</p>
                    <p>{activeJob.description}</p>
                  </div>
                  <div className={styles.infoPanel}>
                    <p className={styles.panelLabel}>Chore Effect</p>
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
                    <p>Eligible candidates are shown here instead of crowding the main chore board.</p>
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
                        <span>Buy, hatch, or dev-spawn a fitting family for this chore.</span>
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
