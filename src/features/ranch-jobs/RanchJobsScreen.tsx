"use client";

import { useMemo, useState } from "react";
import { getVariantDefinition } from "@/data/creatures";
import { getCreatureDisplayName, getRanchJobs, isCreatureEligibleForJob, RANCH_JOB_DEFINITIONS, RANCH_JOB_IDS } from "@/data/ranchJobs";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobDefinition, RanchJobId } from "@/types/ranchJobs";
import styles from "./RanchJobsScreen.module.css";

const MAX_CREATURES_PER_CHORE = 3;
const EMPTY_ASSIGNMENTS: Record<RanchJobId, CreatureId[]> = { security_patrol: [], comfort_care: [], stable_production: [], garden_tending: [], field_hauling: [] };
const PROJECTED_BASE_DANGER_CHANCE = 35;
const PROJECTED_MIN_DANGER_WITH_SECURITY = 6;
const PROJECTED_MIN_DANGER_WITHOUT_SECURITY = 18;

type ChorePlan = { id: string; label: string; description: string; order: RanchJobId[] };
type Recommendation = { creature: CreatureRecord | null; score: number; reason: string; output: string };

const CHORE_PLANS: ChorePlan[] = [
  { id: "balanced", label: "Balanced Plan", description: "One helper per core chore: safety, feed, garden, comfort, hauling.", order: ["security_patrol", "stable_production", "garden_tending", "comfort_care", "field_hauling"] },
  { id: "food", label: "Food Focus", description: "Production and garden first, then safety and upkeep.", order: ["stable_production", "garden_tending", "security_patrol", "field_hauling", "comfort_care"] },
  { id: "security", label: "Security Focus", description: "Patrol and hauling first to reduce danger and wear.", order: ["security_patrol", "field_hauling", "stable_production", "garden_tending", "comfort_care"] },
  { id: "breeding", label: "Comfort Focus", description: "Comfort Care first, then food, safety, and hauling.", order: ["comfort_care", "stable_production", "garden_tending", "security_patrol", "field_hauling"] },
  { id: "repair", label: "Repair Focus", description: "Hauling first, then security and food.", order: ["field_hauling", "security_patrol", "stable_production", "garden_tending", "comfort_care"] },
];

function getEmptyAssignments(): Record<RanchJobId, CreatureId[]> {
  return { ...EMPTY_ASSIGNMENTS, security_patrol: [], comfort_care: [], stable_production: [], garden_tending: [], field_hauling: [] };
}
function getFlagNumber(value: boolean | number | string | undefined): number { const parsed = typeof value === "number" ? value : Number(value ?? 0); return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0; }
function getDailyFeedCost(creature: CreatureRecord): number { const variant = getVariantDefinition(creature.variantId); return (variant.family === "bovine" || variant.family === "equine" ? 2 : 1) + (variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0); }
function isCreatureInjured(creature: CreatureRecord, dayNumber: number): boolean { return typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= dayNumber; }
function getCreatureSummary(creature: CreatureRecord): string { const variant = getVariantDefinition(creature.variantId); return `${variant.family} • Lv ${creature.level} • Energy ${creature.energy}/${creature.maxEnergy} • Affection ${creature.affection}`; }
function getCreatureProfilePath(creature: CreatureRecord): string { return getVariantDefinition(creature.variantId).profilePath; }
function getAbilityScore(creature: CreatureRecord): number { const values = { F: 0, D: 1, C: 2, B: 3, A: 4, S: 5 } as const; return creature.abilities.length ? creature.abilities.reduce((total, ability) => total + values[ability.grade], 0) / creature.abilities.length : 0; }
function getRelevantStatKeys(jobId: RanchJobId): Array<keyof CreatureRecord["stats"]> { if (jobId === "security_patrol") return ["STR", "STA", "WIL", "FER"]; if (jobId === "comfort_care") return ["CHA", "WIL"]; if (jobId === "stable_production") return ["STR", "STA"]; if (jobId === "garden_tending") return ["DEX", "CHA"]; return ["STR", "STA", "DEX"]; }
function getRelevantStatLine(creature: CreatureRecord, jobId: RanchJobId): string { return getRelevantStatKeys(jobId).map((stat) => `${stat} ${creature.stats[stat]} (${creature.statGrades[stat]})`).join(" • "); }
function getProjectedCreatureScore(creature: CreatureRecord, jobId: RanchJobId): number { const statKeys = getRelevantStatKeys(jobId); const statAverage = statKeys.reduce((total, stat) => total + creature.stats[stat], 0) / statKeys.length; return Math.max(1, Math.round(((statAverage / 6) + (creature.level / 8) + (creature.affection / 25) + (getAbilityScore(creature) * 0.75)) * 10) / 10); }
function getProjectedFeedForAssignment(creatures: CreatureRecord[], jobId: RanchJobId): number { if (jobId !== "stable_production" && jobId !== "garden_tending") return 0; return creatures.reduce((total, creature) => total + (jobId === "stable_production" ? Math.max(1, Math.floor(5 + getProjectedCreatureScore(creature, jobId))) : Math.max(1, Math.floor(2 + getProjectedCreatureScore(creature, jobId)))), 0); }
function getProjectedMaterialsForAssignment(creatures: CreatureRecord[], jobId: RanchJobId): number { if (jobId !== "field_hauling") return 0; return creatures.reduce((total, creature) => total + Math.max(1, Math.floor(1 + getProjectedCreatureScore(creature, jobId) * 0.65)), 0); }
function getProjectedScoreTotal(creatures: CreatureRecord[], jobId: RanchJobId): number { return Math.round(creatures.reduce((total, creature) => total + getProjectedCreatureScore(creature, jobId), 0)); }
function getProjectedDangerChance(securityScore: number): number { return Math.max(securityScore > 0 ? PROJECTED_MIN_DANGER_WITH_SECURITY : PROJECTED_MIN_DANGER_WITHOUT_SECURITY, PROJECTED_BASE_DANGER_CHANCE - Math.floor(securityScore * 2)); }
function getProjectedContributionLabel(creature: CreatureRecord, jobId: RanchJobId): string { const score = getProjectedCreatureScore(creature, jobId); if (jobId === "stable_production") return `Projected +${Math.max(1, Math.floor(5 + score))} Feed`; if (jobId === "garden_tending") return `Projected +${Math.max(1, Math.floor(2 + score))} Feed`; if (jobId === "security_patrol") return `Security +${Math.round(score)} • danger ${getProjectedDangerChance(Math.round(score))}%`; if (jobId === "comfort_care") return `Comfort +${Math.round(score)} • next-day +${Math.min(25, Math.round(score * 2))}%`; return `Materials +${Math.max(1, Math.floor(1 + score * 0.65))} • repair -${Math.round(score)}`; }
function getJobProjectionLabel(creatures: CreatureRecord[], jobId: RanchJobId): string { const score = getProjectedScoreTotal(creatures, jobId); if (!creatures.length) return jobId === "security_patrol" ? `${PROJECTED_BASE_DANGER_CHANCE}% risk` : jobId === "field_hauling" ? "Daily wear" : "No projection"; if (jobId === "security_patrol") return `Security +${score} • danger ${getProjectedDangerChance(score)}%`; if (jobId === "comfort_care") return `Comfort +${score} • +${Math.min(25, score * 2)}%`; if (jobId === "stable_production" || jobId === "garden_tending") return `Feed +${getProjectedFeedForAssignment(creatures, jobId)}`; return `Materials +${getProjectedMaterialsForAssignment(creatures, jobId)} • repair -${score}`; }
function getUnavailableReason(creature: CreatureRecord, job: RanchJobDefinition, dayNumber: number, assignedJobName: string | null): string | null { if (assignedJobName) return `Assigned to ${assignedJobName}`; if (isCreatureInjured(creature, dayNumber)) return `${creature.injuryLabel ?? "Injured"} until recovery`; if (!isCreatureEligibleForJob(creature, job)) return "Not a natural fit"; if (creature.energy < job.energyCost) return `Needs ${job.energyCost} energy`; return null; }

export function RanchJobsScreen() {
  const { currentSave, goToMainMenu, goToRanch, saveCurrentGame, version } = useGameContext();
  const [message, setMessage] = useState("Veyra's planner now recommends the best helper for each chore. Use Best Fit for one chore or Auto-Assign Best Crew for the day.");
  const [activeJobId, setActiveJobId] = useState<RanchJobId>("security_patrol");
  const jobs = useMemo(() => (currentSave ? getRanchJobs(currentSave) : null), [currentSave]);

  if (!currentSave || !jobs) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before opening Ranch Chores.</p><button type="button" className={styles.primaryButton} onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  const activeSave = currentSave;
  const activeJobs = jobs;

  function getAssignedCreatures(jobId: RanchJobId): CreatureRecord[] { return (activeJobs.assignments[jobId] ?? []).map((creatureId) => (activeSave.creatures ?? []).find((creature) => creature.creatureId === creatureId)).filter(Boolean) as CreatureRecord[]; }
  function getAssignedJobId(creatureId: CreatureId, exceptJobId?: RanchJobId): RanchJobId | null { return RANCH_JOB_IDS.find((jobId) => jobId !== exceptJobId && (activeJobs.assignments[jobId] ?? []).includes(creatureId)) ?? null; }
  function getAssignedJobName(creatureId: CreatureId, exceptJobId?: RanchJobId): string | null { const jobId = getAssignedJobId(creatureId, exceptJobId); return jobId ? RANCH_JOB_DEFINITIONS.find((job) => job.jobId === jobId)?.name ?? jobId : null; }
  function getCandidates(job: RanchJobDefinition, assignments = activeJobs.assignments, allowCurrentJob = true): CreatureRecord[] {
    return (activeSave.creatures ?? [])
      .filter((creature) => {
        const assignedJobId = RANCH_JOB_IDS.find((jobId) => (assignments[jobId] ?? []).includes(creature.creatureId));
        if (assignedJobId && (!allowCurrentJob || assignedJobId !== job.jobId)) return false;
        return !isCreatureInjured(creature, activeSave.dayState.dayNumber) && isCreatureEligibleForJob(creature, job) && creature.energy >= job.energyCost;
      })
      .sort((a, b) => getProjectedCreatureScore(b, job.jobId) - getProjectedCreatureScore(a, job.jobId));
  }
  function getRecommendation(job: RanchJobDefinition): Recommendation {
    const candidate = getCandidates(job)[0] ?? null;
    if (!candidate) return { creature: null, score: 0, reason: "No eligible, rested helper is available. Check injuries, energy, or family fit.", output: getJobProjectionLabel([], job.jobId) };
    const score = getProjectedCreatureScore(candidate, job.jobId);
    const stats = getRelevantStatKeys(job.jobId).join("/");
    return { creature: candidate, score, reason: `${candidate.nickname} has the best ${stats} fit among available helpers.`, output: getProjectedContributionLabel(candidate, job.jobId) };
  }
  function saveAssignments(assignments: Record<RanchJobId, CreatureId[]>, msg: string, extraFlags: Record<string, boolean | number | string> = {}) {
    saveCurrentGame({ ...activeSave, updatedAt: new Date().toISOString(), ranchJobs: { assignments, lastProcessedDayNumber: activeJobs.lastProcessedDayNumber, lifetimeCompletions: activeJobs.lifetimeCompletions }, flags: { ...activeSave.flags, m14RanchJobsUsed: true, m20ChoreRecommendations: true, ...extraFlags } });
    setMessage(msg);
  }
  function handleAssign(jobId: RanchJobId, creatureId: CreatureId) {
    const nextAssignments = RANCH_JOB_IDS.reduce((next, id) => ({ ...next, [id]: (activeJobs.assignments[id] ?? []).filter((idValue) => idValue !== creatureId) }), getEmptyAssignments());
    nextAssignments[jobId] = [...(nextAssignments[jobId] ?? []), creatureId].slice(0, MAX_CREATURES_PER_CHORE);
    const jobName = RANCH_JOB_DEFINITIONS.find((job) => job.jobId === jobId)?.name ?? jobId;
    const creature = activeSave.creatures?.find((item) => item.creatureId === creatureId);
    saveAssignments(nextAssignments, `${creature?.nickname ?? "Helper"} assigned to ${jobName}.`, { m20ManualRecommendedAssign: true });
  }
  function handleRemove(jobId: RanchJobId, creatureId: CreatureId) { const nextAssignments = { ...activeJobs.assignments, [jobId]: (activeJobs.assignments[jobId] ?? []).filter((id) => id !== creatureId) }; saveAssignments(nextAssignments, "Helper removed from chore."); }
  function handleClear(jobId: RanchJobId) { saveAssignments({ ...activeJobs.assignments, [jobId]: [] }, "Chore assignment cleared."); }
  function handleClearAll() { saveAssignments(getEmptyAssignments(), "All ranch chore assignments cleared.", { m14RanchJobsClearedAll: true }); }
  function handleBestFit(jobId: RanchJobId) {
    const job = RANCH_JOB_DEFINITIONS.find((definition) => definition.jobId === jobId);
    if (!job) return;
    const usedByOtherJobs = new Set(RANCH_JOB_IDS.filter((id) => id !== jobId).flatMap((id) => activeJobs.assignments[id] ?? []));
    const selected = getCandidates(job, activeJobs.assignments, true).filter((creature) => !usedByOtherJobs.has(creature.creatureId)).slice(0, 1);
    saveAssignments({ ...activeJobs.assignments, [jobId]: selected.map((creature) => creature.creatureId) }, selected[0] ? `${selected[0].nickname} is Veyra's best pick for ${job.name}. ${getProjectedContributionLabel(selected[0], jobId)}` : `No eligible helper found for ${job.name}.`, { m20BestFitUsed: true });
  }
  function applyChorePlan(plan: ChorePlan) {
    const nextAssignments = getEmptyAssignments();
    const usedCreatureIds = new Set<CreatureId>();
    for (const jobId of plan.order) {
      const job = RANCH_JOB_DEFINITIONS.find((definition) => definition.jobId === jobId);
      if (!job) continue;
      const candidate = (activeSave.creatures ?? [])
        .filter((creature) => !usedCreatureIds.has(creature.creatureId) && !isCreatureInjured(creature, activeSave.dayState.dayNumber) && isCreatureEligibleForJob(creature, job) && creature.energy >= job.energyCost)
        .sort((a, b) => getProjectedCreatureScore(b, jobId) - getProjectedCreatureScore(a, jobId))[0];
      if (candidate) { nextAssignments[jobId] = [candidate.creatureId]; usedCreatureIds.add(candidate.creatureId); }
    }
    const totalAssigned = RANCH_JOB_IDS.reduce((total, jobId) => total + nextAssignments[jobId].length, 0);
    saveAssignments(nextAssignments, `${plan.label} assigned ${totalAssigned} helper${totalAssigned === 1 ? "" : "s"}. ${plan.description}`, { m14RanchJobsAutoAssigned: true, m15ChorePlannerUsed: true, ranchLastChorePlan: plan.label });
  }
  function handleAutoAssignAll() { applyChorePlan(CHORE_PLANS[0]); }

  const assignedCreatures = RANCH_JOB_IDS.flatMap((jobId) => getAssignedCreatures(jobId));
  const feedStock = getFlagNumber(activeSave.flags.ranchFeedStock);
  const materialsStock = getFlagNumber(activeSave.flags.ranchMaterialsStock);
  const dailyFeedNeed = (activeSave.creatures ?? []).reduce((total, creature) => total + getDailyFeedCost(creature), 0);
  const projectedFeed = RANCH_JOB_IDS.reduce((total, jobId) => total + getProjectedFeedForAssignment(getAssignedCreatures(jobId), jobId), 0);
  const projectedSecurity = getProjectedScoreTotal(getAssignedCreatures("security_patrol"), "security_patrol");
  const projectedComfort = getProjectedScoreTotal(getAssignedCreatures("comfort_care"), "comfort_care");
  const projectedMaterials = getProjectedMaterialsForAssignment(getAssignedCreatures("field_hauling"), "field_hauling");
  const projectedUpkeep = getProjectedScoreTotal(getAssignedCreatures("field_hauling"), "field_hauling");
  const projectedAvailableFeed = feedStock + projectedFeed;
  const projectedFoodStatus = projectedAvailableFeed >= dailyFeedNeed ? "Fed" : projectedAvailableFeed > 0 ? "Short" : "Empty";
  const projectedRecoveryLabel = projectedFoodStatus === "Fed" ? "Full recovery expected." : projectedFoodStatus === "Short" ? "Food shortage expected: weak recovery and -1 affection." : "No food expected: almost no recovery and -3 affection.";
  const riskWarning = `${projectedSecurity ? `Security Patrol active: projected danger is ${getProjectedDangerChance(projectedSecurity)}%.` : `No Security Patrol: danger risk is ${PROJECTED_BASE_DANGER_CHANCE}%.`} ${projectedUpkeep ? `Field Hauling can repair about ${projectedUpkeep} damage.` : "No Field Hauling: routine wear is likely overnight."}`;
  const activeJob = RANCH_JOB_DEFINITIONS.find((job) => job.jobId === activeJobId) ?? RANCH_JOB_DEFINITIONS[0];
  const activeAssigned = getAssignedCreatures(activeJob.jobId);
  const activeAvailable = getCandidates(activeJob).filter((creature) => !activeAssigned.some((assigned) => assigned.creatureId === creature.creatureId));
  const activeUnavailable = (activeSave.creatures ?? []).map((creature) => ({ creature, reason: getUnavailableReason(creature, activeJob, activeSave.dayState.dayNumber, getAssignedJobName(creature.creatureId, activeJob.jobId)) })).filter((item) => item.reason);

  return <main className={styles.screen}><section className={styles.frame}><header className={styles.header}><div><div className={styles.titleRow}><h1>Ranch Chores</h1><button type="button" className={styles.infoButton} aria-label="About ranch chores">i</button></div><div className={styles.compactMetaRow}>{CHORE_PLANS.map((plan) => <button key={plan.id} type="button" className={styles.secondaryButton} title={plan.description} onClick={() => applyChorePlan(plan)}>{plan.label}</button>)}</div></div><div className={styles.headerActions}><button type="button" onClick={handleAutoAssignAll}>Auto-Assign Best Crew</button><button type="button" onClick={handleClearAll}>Clear All</button><button type="button" onClick={goToRanch}>Back to Ranch</button><button type="button" onClick={goToMainMenu}>Main Menu</button></div></header><section className={styles.topStats}><div className={styles.topStat}><span>Assigned</span><strong>{assignedCreatures.length}/{RANCH_JOB_IDS.length}</strong></div><div className={styles.topStat}><span>Feed Projection</span><strong>{projectedAvailableFeed}/{dailyFeedNeed}</strong></div><div className={styles.topStat}><span>Security</span><strong>{projectedSecurity ? `+${projectedSecurity} / ${getProjectedDangerChance(projectedSecurity)}% danger` : `${PROJECTED_BASE_DANGER_CHANCE}% danger`}</strong></div><div className={styles.topStat}><span>Comfort</span><strong>{projectedComfort ? `+${Math.min(25, projectedComfort * 2)}% breed` : "None"}</strong></div><div className={styles.topStat}><span>Materials</span><strong>{materialsStock}+{projectedMaterials}</strong></div><div className={styles.topStat}><span>Upkeep Repair</span><strong>{projectedUpkeep ? `-${projectedUpkeep} damage` : "Daily wear"}</strong></div></section><p className={projectedFoodStatus === "Fed" ? styles.statusMessage : styles.warningMessage}>{message} {projectedRecoveryLabel}</p><p className={projectedSecurity && projectedUpkeep ? styles.statusMessage : styles.warningMessage}>{riskWarning}</p><section className={styles.content}><div className={styles.jobGrid}>{RANCH_JOB_DEFINITIONS.map((job) => { const assigned = getAssignedCreatures(job.jobId); const recommendation = getRecommendation(job); const primaryCreature = assigned[0] ?? recommendation.creature; const projectionLabel = getJobProjectionLabel(assigned, job.jobId); return <article key={job.jobId} className={styles.jobCard}><div className={styles.jobHeader}><img className={styles.jobIcon} src={job.iconPath} alt="" /><div className={styles.jobTitleArea}><p className={styles.kicker}>{job.shortName}</p><h2>{job.name}</h2></div><button type="button" className={styles.infoButtonSmall} onClick={() => setActiveJobId(job.jobId)}>i</button></div><div className={styles.compactMetaRow}><span className={styles.rewardLine}>{job.rewardLabel}</span><span className={styles.energyChip}>{job.energyCost} energy</span><span className={styles.energyChip}>{projectionLabel}</span></div><div className={styles.assignmentBox}><div className={`${styles.assignedLine} ${primaryCreature ? styles.assignedLineWithPortrait : ""}`}>{primaryCreature ? <img className={styles.assignedPortrait} src={getCreatureProfilePath(primaryCreature)} alt="" /> : <span className={styles.unassignedDot} />}<div className={styles.assignedText}><strong>{assigned.length ? `${assigned.length} assigned: ${assigned.map((creature) => creature.nickname).join(", ")}` : recommendation.creature ? `Recommended: ${recommendation.creature.nickname}` : "No recommendation"}</strong><span>{assigned.length ? projectionLabel : recommendation.reason}</span><span>{assigned.length ? "Open this chore to adjust helpers." : recommendation.output}</span></div></div></div><div className={styles.cardActions}><button type="button" className={styles.secondaryButton} onClick={() => setActiveJobId(job.jobId)}>Open</button><button type="button" className={styles.secondaryButton} onClick={() => handleBestFit(job.jobId)}>Best Fit</button>{assigned.length ? <button type="button" className={styles.clearButton} onClick={() => handleClear(job.jobId)}>Clear</button> : null}</div></article>; })}</div></section><footer className={styles.footer}>{version}</footer></section><div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setActiveJobId("security_patrol")}><section className={styles.modalPanel} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header className={styles.modalHeader}><div className={styles.modalTitleRow}><img className={styles.modalIcon} src={activeJob.iconPath} alt="" /><div><p className={styles.kicker}>{activeJob.shortName}</p><h2>{activeJob.name}</h2></div></div><button type="button" className={styles.modalCloseButton} onClick={() => setActiveJobId("security_patrol")}>Close</button></header><div className={styles.modalBody}><section className={styles.modalInfoGrid}><div className={styles.infoPanel}><p className={styles.panelLabel}>Veyra Recommends</p><strong>{getRecommendation(activeJob).creature?.nickname ?? "No eligible helper"}</strong><span>{getRecommendation(activeJob).reason}</span><span>{getRecommendation(activeJob).output}</span></div><div className={styles.infoPanel}><p className={styles.panelLabel}>Projected Output</p><strong>{getJobProjectionLabel(activeAssigned, activeJob.jobId)}</strong><span>{activeJob.rewardLabel}</span></div><div className={styles.infoPanel}><p className={styles.panelLabel}>Current Assignment</p><strong>{activeAssigned.length}/{MAX_CREATURES_PER_CHORE}</strong><span>{activeAssigned.length ? activeAssigned.map((creature) => getCreatureDisplayName(creature)).join(" • ") : "No helpers assigned yet."}</span></div></section><section><div className={styles.modalSectionHeader}><h3>Assigned Helpers</h3><span>{activeAssigned.length}/{MAX_CREATURES_PER_CHORE}</span></div><div className={styles.eligibleList}>{activeAssigned.length ? activeAssigned.map((creature) => <div key={creature.creatureId} className={styles.emptyEligibleCard}><div><strong>{getCreatureDisplayName(creature)}</strong><span>{getCreatureSummary(creature)} • Score {getProjectedCreatureScore(creature, activeJob.jobId).toFixed(1)}</span><span>{getRelevantStatLine(creature, activeJob.jobId)} • {getProjectedContributionLabel(creature, activeJob.jobId)}</span></div><button type="button" className={styles.clearButton} onClick={() => handleRemove(activeJob.jobId, creature.creatureId)}>Remove</button></div>) : <div className={styles.emptyEligibleCard}><strong>No assigned helpers</strong><span>Use Best Fit or select a helper below.</span></div>}</div></section><section><div className={styles.modalSectionHeader}><h3>Available Helpers</h3><span>{activeAvailable.length} ready</span></div><div className={styles.eligibleList}>{activeAvailable.length ? activeAvailable.map((creature) => <button key={creature.creatureId} type="button" className={styles.eligibleCard} onClick={() => handleAssign(activeJob.jobId, creature.creatureId)}><div><strong>{getCreatureDisplayName(creature)}</strong><span>{getCreatureSummary(creature)} • Score {getProjectedCreatureScore(creature, activeJob.jobId).toFixed(1)}</span><span>{getRelevantStatLine(creature, activeJob.jobId)} • {getProjectedContributionLabel(creature, activeJob.jobId)}</span></div><em>{creature === getRecommendation(activeJob).creature ? "Recommended" : "Assign"}</em></button>) : <div className={styles.emptyEligibleCard}><strong>No ready helpers available</strong><span>Check energy, injuries, or family fit.</span></div>}</div></section>{activeUnavailable.length ? <section><div className={styles.modalSectionHeader}><h3>Unavailable Creatures</h3><span>{activeUnavailable.length}</span></div><div className={styles.eligibleList}>{activeUnavailable.slice(0, 8).map(({ creature, reason }) => <div key={creature.creatureId} className={styles.emptyEligibleCard}><strong>{getCreatureDisplayName(creature)}</strong><span>{reason}</span></div>)}</div></section> : null}</div></section></div></main>;
}


