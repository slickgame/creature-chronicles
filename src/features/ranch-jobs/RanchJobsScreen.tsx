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
const MAX_CREATURES_PER_CHORE = 3;

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

function getAbilityScore(creature: CreatureRecord): number {
  const values = { F: 0, D: 1, C: 2, B: 3, A: 4, S: 5 } as const;
  if (!creature.abilities.length) return 0;
  return creature.abilities.reduce((total, ability) => total + values[ability.grade], 0) / creature.abilities.length;
}

function getProjectedCreatureScore(creature: CreatureRecord, jobId: RanchJobId): number {
  const statKeys = jobId === "security_patrol" ? ["STR", "STA", "WIL", "FER"] : jobId === "comfort_care" ? ["CHA", "WIL"] : jobId === "stable_production" ? ["STR", "STA"] : jobId === "garden_tending" ? ["DEX", "CHA"] : ["STR", "STA", "DEX"];
  const statAverage = statKeys.reduce((total, stat) => total + creature.stats[stat as keyof typeof creature.stats], 0) / statKeys.length;
  return Math.max(1, Math.round(((statAverage / 6) + (creature.level / 8) + (creature.affection / 25) + (getAbilityScore(creature) * 0.75)) * 10) / 10);
}

function getProjectedFeedForAssignment(creatures: CreatureRecord[], jobId: RanchJobId): number {
  if (jobId !== "stable_production" && jobId !== "garden_tending") return 0;
  return creatures.reduce((total, creature) => {
    const score = getProjectedCreatureScore(creature, jobId);
    return total + (jobId === "stable_production" ? Math.max(1, Math.floor(3 + score)) : Math.max(1, Math.floor(1 + score * 0.75)));
  }, 0);
}

export function RanchJobsScreen() {
  const { assignRanchJob, currentSave, goToMainMenu, goToRanch, version } = useGameContext();
  const [message, setMessage] = useState("Assign up to three creatures to each chore. Stats, affection, and abilities improve the result.");
  const [activeJobId, setActiveJobId] = useState<RanchJobId | null>(null);
  const [infoTarget, setInfoTarget] = useState<InfoTarget>(null);
  const [draftAssignments, setDraftAssignments] = useState<Record<RanchJobId, string>>({ security_patrol: "", comfort_care: "", stable_production: "", garden_tending: "", field_hauling: "" });

  const jobs = useMemo(() => (currentSave ? getRanchJobs(currentSave) : null), [currentSave]);

  if (!currentSave || !jobs) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before opening Ranch Chores.</p><button type="button" className={styles.primaryButton} onClick={goToMainMenu}>Return to Main Menu</button></section></main>;
  }

  function getAssignedCreatures(jobId: RanchJobId): CreatureRecord[] {
    const assignedCreatureIds = jobs?.assignments[jobId] ?? [];
    return assignedCreatureIds.map((creatureId) => (currentSave?.creatures ?? []).find((creature) => creature.creatureId === creatureId)).filter(Boolean) as CreatureRecord[];
  }

  const assignedCreatures = RANCH_JOB_IDS.flatMap((jobId) => getAssignedCreatures(jobId));
  const assignedSlotCount = RANCH_JOB_IDS.length * MAX_CREATURES_PER_CHORE;
  const feedStock = getFlagNumber(currentSave.flags.ranchFeedStock);
  const dailyFeedNeed = (currentSave.creatures ?? []).reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const projectedFeed = RANCH_JOB_IDS.reduce((total, jobId) => total + getProjectedFeedForAssignment(getAssignedCreatures(jobId), jobId), 0);
  const projectedAvailableFeed = feedStock + projectedFeed;
  const projectedFoodStatus = projectedAvailableFeed >= dailyFeedNeed ? "Fed" : projectedAvailableFeed > 0 ? "Short" : "Empty";
  const projectedRecoveryLabel = projectedFoodStatus === "Fed" ? "Full recovery expected." : projectedFoodStatus === "Short" ? "Food shortage expected: weak recovery and -1 affection." : "No food expected: almost no recovery and -3 affection.";
  const activeJob = activeJobId ? RANCH_JOB_DEFINITIONS.find((job) => job.jobId === activeJobId) ?? null : null;
  const infoJob = infoTarget && infoTarget !== "overview" ? RANCH_JOB_DEFINITIONS.find((job) => job.jobId === infoTarget) ?? null : null;

  function handleAssign(jobId: RanchJobId) {
    const selectedCreatureId = draftAssignments[jobId] as CreatureId | "";
    const result = assignRanchJob(jobId, selectedCreatureId ? selectedCreatureId : null);
    setMessage(result.message);
    if (result.ok) setDraftAssignments((current) => ({ ...current, [jobId]: "" }));
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
          <div className={styles.titleRow}><h1>Ranch Chores</h1><button type="button" className={styles.infoButton} onClick={() => setInfoTarget("overview")} aria-label="About ranch chores">i</button></div>
          <div className={styles.headerActions}><button type="button" onClick={goToRanch}>Back to Ranch</button><button type="button" onClick={goToMainMenu}>Main Menu</button></div>
        </header>

        <section className={styles.topStats} aria-label="Ranch chore overview">
          <div className={styles.topStat}><span>Assigned</span><strong>{assignedCreatures.length}/{assignedSlotCount}</strong></div>
          <div className={styles.topStat}><span>Feed Stock</span><strong>{feedStock}</strong></div>
          <div className={styles.topStat}><span>Projected Feed</span><strong>+{projectedFeed}</strong></div>
          <div className={styles.topStat}><span>Daily Need</span><strong>{dailyFeedNeed}</strong></div>
        </section>

        <p className={projectedFoodStatus === "Fed" ? styles.statusMessage : styles.warningMessage}>{projectedRecoveryLabel}</p>

        <section className={styles.content}>
          <div className={styles.jobGrid}>
            {RANCH_JOB_DEFINITIONS.map((job) => {
              const assigned = getAssignedCreatures(job.jobId);
              const primaryCreature = assigned[0] ?? null;
              const projectedJobFeed = getProjectedFeedForAssignment(assigned, job.jobId);
              return (
                <article key={job.jobId} className={styles.jobCard}>
                  <div className={styles.jobHeader}><img className={styles.jobIcon} src={job.iconPath} alt="" /><div className={styles.jobTitleArea}><p className={styles.kicker}>{job.shortName}</p><h2>{job.name}</h2></div><button type="button" className={styles.infoButtonSmall} onClick={() => setInfoTarget(job.jobId)} aria-label={`About ${job.name}`}>i</button></div>
                  <div className={styles.compactMetaRow}><span className={styles.rewardLine}>{job.rewardLabel}</span><span className={styles.energyChip}>{job.energyCost} energy each</span>{projectedJobFeed ? <span className={styles.energyChip}>+{projectedJobFeed} feed</span> : null}</div>
                  <div className={styles.assignmentBox}>
                    <div className={`${styles.assignedLine} ${primaryCreature ? styles.assignedLineWithPortrait : ""}`}>
                      <span className={primaryCreature ? styles.assignedDot : styles.unassignedDot} />
                      {primaryCreature ? <img className={styles.assignedPortrait} src={getCreatureProfilePath(primaryCreature)} alt="" /> : null}
                      <div className={styles.assignedText}><strong>{assigned.length ? `${assigned.length}/${MAX_CREATURES_PER_CHORE} helpers assigned` : "Unassigned"}</strong><span>{assigned.length ? assigned.map((creature) => creature.nickname).join(", ") : "Open this chore to choose eligible creatures."}</span></div>
                    </div>
                  </div>
                  <div className={styles.cardActions}><button type="button" className={styles.secondaryButton} onClick={() => setActiveJobId(job.jobId)}>Open Chore</button>{assigned.length ? <button type="button" className={styles.clearButton} onClick={() => handleClear(job.jobId)}>Clear All</button> : null}</div>
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
            <header className={styles.modalHeader}><div><p className={styles.kicker}>{infoTarget === "overview" ? "Ranch Provision System" : infoJob?.shortName}</p><h2 id="ranch-info-modal-title">{infoTarget === "overview" ? "About Ranch Chores" : infoJob?.name}</h2></div><button type="button" className={styles.modalCloseButton} onClick={() => setInfoTarget(null)}>Close</button></header>
            <div className={styles.modalBody}>{infoTarget === "overview" ? <div className={styles.infoTextBlock}><p>Ranch chores are daily assignments for creatures staying at the ranch. They are separate from quests and story objectives.</p><p>Each chore can have up to three helpers. Better stats, higher affection, level, and stronger abilities improve feed output, security score, comfort score, or upkeep score.</p><p>Surplus Feed carries over in the feed shed. If the ranch has too little food at sleep, player and creature energy recover poorly and creature affection drops.</p><div className={styles.infoPanel}><p className={styles.panelLabel}>Tonight Projection</p><strong>{projectedAvailableFeed}/{dailyFeedNeed} Feed available</strong><span>{projectedRecoveryLabel}</span></div></div> : infoJob ? <div className={styles.infoTextBlock}><p>{infoJob.description}</p><div className={styles.infoPanel}><p className={styles.panelLabel}>Chore Effect</p><strong>{infoJob.rewardLabel}</strong><span>{infoJob.energyCost} energy cost per helper</span></div><div className={styles.infoPanel}><p className={styles.panelLabel}>Eligible Families</p><strong>{infoJob.preferredFamilies.join(", ")}</strong><span>Some special variants may also qualify.</span></div></div> : null}</div>
          </section>
        </div>
      ) : null}

      {activeJob ? (() => {
        const assigned = getAssignedCreatures(activeJob.jobId);
        const eligibleCreatures = getEligibleCreaturesForJob(currentSave, activeJob.jobId).filter((creature) => !assigned.some((assignedCreature) => assignedCreature.creatureId === creature.creatureId));
        const draftValue = draftAssignments[activeJob.jobId] || "";
        const projectedJobFeed = getProjectedFeedForAssignment(assigned, activeJob.jobId);
        return (
          <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setActiveJobId(null)}>
            <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="ranch-chore-modal-title" onMouseDown={(event) => event.stopPropagation()}>
              <header className={styles.modalHeader}><div className={styles.modalTitleRow}><img className={styles.modalIcon} src={activeJob.iconPath} alt="" /><div><p className={styles.kicker}>{activeJob.shortName}</p><h2 id="ranch-chore-modal-title">{activeJob.name}</h2></div></div><button type="button" className={styles.modalCloseButton} onClick={() => setActiveJobId(null)}>Close</button></header>
              <div className={styles.modalBody}>
                <section className={styles.modalInfoGrid}><div className={styles.infoPanel}><p className={styles.panelLabel}>Chore Details</p><p>{activeJob.description}</p></div><div className={styles.infoPanel}><p className={styles.panelLabel}>Projected Output</p><strong>{projectedJobFeed ? `+${projectedJobFeed} Feed` : `${assigned.length} helpers`}</strong><span>Based on helpers, stats, affection, level, and abilities.</span></div><div className={styles.infoPanel}><p className={styles.panelLabel}>Current Assignment</p><strong>{assigned.length}/{MAX_CREATURES_PER_CHORE} helpers</strong><span>{assigned.length ? assigned.map((creature) => getCreatureDisplayName(creature)).join(" • ") : "Select eligible creatures below."}</span></div></section>
                <section className={styles.modalAssignmentBox}><div><p className={styles.panelLabel}>Add Helper</p><p>Each chore can have up to three helpers. Stronger helpers improve the result.</p></div><div className={styles.modalSelectRow}><select value={draftValue} aria-label={`${activeJob.name} assignment`} onChange={(event) => setDraftAssignments((current) => ({ ...current, [activeJob.jobId]: event.target.value }))}><option value="">Choose helper</option>{eligibleCreatures.map((creature) => <option key={creature.creatureId} value={creature.creatureId}>{getCreatureDisplayName(creature)}</option>)}</select><button type="button" className={styles.primaryButton} onClick={() => handleAssign(activeJob.jobId)}>Add</button>{assigned.length ? <button type="button" className={styles.clearButton} onClick={() => handleClear(activeJob.jobId)}>Clear All</button> : null}</div></section>
                {assigned.length ? <section><div className={styles.modalSectionHeader}><h3>Assigned Helpers</h3><span>{assigned.length}/{MAX_CREATURES_PER_CHORE}</span></div><div className={styles.eligibleList}>{assigned.map((creature) => <div key={creature.creatureId} className={styles.emptyEligibleCard}><strong>{getCreatureDisplayName(creature)}</strong><span>{getCreatureSummary(creature)} • Score {getProjectedCreatureScore(creature, activeJob.jobId).toFixed(1)}</span></div>)}</div></section> : null}
                <section><div className={styles.modalSectionHeader}><h3>Eligible Creatures</h3><span>{eligibleCreatures.length} available</span></div><div className={styles.eligibleList}>{eligibleCreatures.length ? eligibleCreatures.map((creature) => <button key={creature.creatureId} type="button" className={styles.eligibleCard} onClick={() => setDraftAssignments((current) => ({ ...current, [activeJob.jobId]: creature.creatureId }))}><div><strong>{getCreatureDisplayName(creature)}</strong><span>{getCreatureSummary(creature)} • Score {getProjectedCreatureScore(creature, activeJob.jobId).toFixed(1)}</span></div><em>{getCreatureEnergyLabel(creature, activeJob.energyCost)}</em></button>) : <div className={styles.emptyEligibleCard}><strong>No eligible creatures yet</strong><span>Buy, hatch, or dev-spawn a fitting family for this chore.</span></div>}</div></section>
              </div>
            </section>
          </div>
        );
      })() : null}
    </main>
  );
}
