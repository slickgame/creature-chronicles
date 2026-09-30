"use client";

import { useMemo, useState } from "react";
import {
  getChoreSkillAptitudeLabel,
  getChoreSkillDefinition,
  getCreatureChoreSkillLevelForJob,
  getCreatureChoreSkillProgress,
  getJobChoreSkillId,
} from "@/data/choreSkills";
import { CREATURE_PLACEHOLDER_IMAGE, getVariantDefinition } from "@/data/creatures";
import {
  calculateCreatureChoreScore,
  getCreatureDisplayName,
  getRanchJobs,
  RANCH_JOB_DEFINITIONS,
  RANCH_JOB_IDS,
} from "@/data/ranchJobs";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { useGameContext } from "@/state/GameProvider";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobDefinition, RanchJobId } from "@/types/ranchJobs";
import { RanchIcon, type RanchIconName } from "@/features/ui/RanchIcon";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./RanchJobsScreen.module.css";

const CHORE_ICONS: Record<RanchJobId, RanchIconName> = {security_patrol:"paw", comfort_care:"leaf", stable_production:"feed", garden_tending:"leaf", field_hauling:"tools"};
const MAX_CREATURES_PER_CHORE = 3;
const EMPTY_ASSIGNMENTS: Record<RanchJobId, CreatureId[]> = {
  security_patrol: [],
  comfort_care: [],
  stable_production: [],
  garden_tending: [],
  field_hauling: [],
};
const PROJECTED_BASE_DANGER_CHANCE = 35;
const PROJECTED_MIN_DANGER_WITH_SECURITY = 6;
const PROJECTED_MIN_DANGER_WITHOUT_SECURITY = 18;

type ChorePlan = {
  id: string;
  label: string;
  description: string;
  order: RanchJobId[];
};

type Recommendation = {
  creature: CreatureRecord | null;
  score: number;
  reason: string;
  output: string;
};

const CHORE_PLANS: ChorePlan[] = [
  {
    id: "balanced",
    label: "Balanced Plan",
    description: "One helper per core chore: safety, feed, garden, comfort, hauling.",
    order: ["security_patrol", "stable_production", "garden_tending", "comfort_care", "field_hauling"],
  },
  {
    id: "food",
    label: "Food Focus",
    description: "Production and garden first, then safety and upkeep.",
    order: ["stable_production", "garden_tending", "security_patrol", "field_hauling", "comfort_care"],
  },
  {
    id: "security",
    label: "Security Focus",
    description: "Patrol and hauling first to reduce danger and wear.",
    order: ["security_patrol", "field_hauling", "stable_production", "garden_tending", "comfort_care"],
  },
  {
    id: "breeding",
    label: "Comfort Focus",
    description: "Comfort Care first, then food, safety, and hauling.",
    order: ["comfort_care", "stable_production", "garden_tending", "security_patrol", "field_hauling"],
  },
  {
    id: "repair",
    label: "Repair Focus",
    description: "Hauling first, then security and food.",
    order: ["field_hauling", "security_patrol", "stable_production", "garden_tending", "comfort_care"],
  },
];

function getEmptyAssignments(): Record<RanchJobId, CreatureId[]> {
  return {
    security_patrol: [],
    comfort_care: [],
    stable_production: [],
    garden_tending: [],
    field_hauling: [],
  };
}

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function getDailyFeedCost(creature: CreatureRecord): number {
  const variant = getVariantDefinition(creature.variantId);
  return (variant.family === "bovine" || variant.family === "equine" ? 2 : 1) +
    (variant.rarity === "Rare" || variant.rarity === "Epic" ? 1 : 0);
}

function isCreatureInjured(creature: CreatureRecord, dayNumber: number): boolean {
  return typeof creature.injuredUntilDayNumber === "number" &&
    creature.injuredUntilDayNumber >= dayNumber;
}

function getCreatureSummary(creature: CreatureRecord): string {
  const variant = getVariantDefinition(creature.variantId);
  return `${variant.family} • Lv ${creature.level} • Energy ${creature.energy}/${creature.maxEnergy} • Affection ${creature.affection}`;
}

function getCreaturePortraitPath(creature: CreatureRecord): string {
  const variant = getVariantDefinition(creature.variantId);
  return variant.portraitPath || variant.profilePath || CREATURE_PLACEHOLDER_IMAGE;
}

function getRelevantStatKeys(jobId: RanchJobId): Array<keyof CreatureRecord["stats"]> {
  if (jobId === "security_patrol") return ["STR", "STA", "WIL", "FER"];
  if (jobId === "comfort_care") return ["CHA", "WIL"];
  if (jobId === "stable_production") return ["STR", "STA"];
  if (jobId === "garden_tending") return ["DEX", "CHA"];
  return ["STR", "STA", "DEX"];
}

function getRelevantStatLine(creature: CreatureRecord, jobId: RanchJobId): string {
  return getRelevantStatKeys(jobId)
    .map((stat) => `${stat} ${creature.stats[stat]} (${creature.statGrades[stat]})`)
    .join(" • ");
}

function getJob(jobId: RanchJobId): RanchJobDefinition {
  return RANCH_JOB_DEFINITIONS.find((job) => job.jobId === jobId) ?? RANCH_JOB_DEFINITIONS[0];
}

function getProjectedCreatureScore(creature: CreatureRecord, jobId: RanchJobId): number {
  return calculateCreatureChoreScore(creature, getJob(jobId));
}

function getSkillLine(creature: CreatureRecord, jobId: RanchJobId): string {
  const skillId = getJobChoreSkillId(jobId);
  const definition = getChoreSkillDefinition(skillId);
  const progress = getCreatureChoreSkillProgress(creature, skillId);
  const progressText = progress.xpToNext > 0
    ? `${progress.xp}/${progress.xpToNext} XP`
    : "Mastered";
  return `${definition.label} Lv ${progress.level} (${getChoreSkillAptitudeLabel(progress.level)}) • ${progressText}`;
}

function getProjectedFeedForAssignment(creatures: CreatureRecord[], jobId: RanchJobId): number {
  if (jobId !== "stable_production" && jobId !== "garden_tending") return 0;
  return creatures.reduce((total, creature) => {
    const score = getProjectedCreatureScore(creature, jobId);
    return total + (jobId === "stable_production"
      ? Math.max(1, Math.floor(5 + score))
      : Math.max(1, Math.floor(2 + score)));
  }, 0);
}

function getProjectedMaterialsForAssignment(creatures: CreatureRecord[], jobId: RanchJobId): number {
  if (jobId !== "field_hauling") return 0;
  return creatures.reduce(
    (total, creature) => total + Math.max(1, Math.floor(1 + getProjectedCreatureScore(creature, jobId) * 0.65)),
    0,
  );
}

function getProjectedScoreTotal(creatures: CreatureRecord[], jobId: RanchJobId): number {
  return Math.round(
    creatures.reduce((total, creature) => total + getProjectedCreatureScore(creature, jobId), 0),
  );
}

function getProjectedDangerChance(securityScore: number): number {
  return Math.max(
    securityScore > 0 ? PROJECTED_MIN_DANGER_WITH_SECURITY : PROJECTED_MIN_DANGER_WITHOUT_SECURITY,
    PROJECTED_BASE_DANGER_CHANCE - Math.floor(securityScore * 2),
  );
}

function getProjectedContributionLabel(creature: CreatureRecord, jobId: RanchJobId): string {
  const score = getProjectedCreatureScore(creature, jobId);
  if (jobId === "stable_production") return `Projected +${Math.max(1, Math.floor(5 + score))} Feed`;
  if (jobId === "garden_tending") return `Projected +${Math.max(1, Math.floor(2 + score))} Feed`;
  if (jobId === "security_patrol") return `Security +${Math.round(score)} • danger ${getProjectedDangerChance(Math.round(score))}%`;
  if (jobId === "comfort_care") return `Comfort +${Math.round(score)} • next-day +${Math.min(25, Math.round(score * 2))}%`;
  return `Materials +${Math.max(1, Math.floor(1 + score * 0.65))} • repair -${Math.round(score)}`;
}

function getJobProjectionLabel(creatures: CreatureRecord[], jobId: RanchJobId): string {
  const score = getProjectedScoreTotal(creatures, jobId);
  if (!creatures.length) {
    if (jobId === "security_patrol") return `${PROJECTED_BASE_DANGER_CHANCE}% risk`;
    if (jobId === "field_hauling") return "Daily wear";
    return "No projection";
  }
  if (jobId === "security_patrol") return `Security +${score} • danger ${getProjectedDangerChance(score)}%`;
  if (jobId === "comfort_care") return `Comfort +${score} • +${Math.min(25, score * 2)}%`;
  if (jobId === "stable_production" || jobId === "garden_tending") {
    return `Feed +${getProjectedFeedForAssignment(creatures, jobId)}`;
  }
  return `Materials +${getProjectedMaterialsForAssignment(creatures, jobId)} • repair -${score}`;
}

function getUnavailableReason(
  creature: CreatureRecord,
  job: RanchJobDefinition,
  dayNumber: number,
  assignedJobName: string | null,
  trainingReason: string | null,
): string | null {
  if (assignedJobName) return `Assigned to ${assignedJobName}`;
  if (trainingReason) return `Training: ${trainingReason}`;
  if (isCreatureInjured(creature, dayNumber)) return `${creature.injuryLabel ?? "Injured"} until recovery`;
  if (creature.energy < job.energyCost) return `Needs ${job.energyCost} Energy`;
  return null;
}

export function RanchJobsScreen() {
  const { currentSave, goToMainMenu, saveCurrentGame, version } = useGameContext();
  const [message, setMessage] = useState(
    "",
  );
  const [showCrew, setShowCrew] = useState(false);
  const [activeJobId, setActiveJobId] = useState<RanchJobId>("security_patrol");
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

  const activeSave = currentSave;
  const activeJobs = jobs;

  function getAssignedCreatures(jobId: RanchJobId): CreatureRecord[] {
    return (activeJobs.assignments[jobId] ?? [])
      .map((creatureId) => (activeSave.creatures ?? []).find((creature) => creature.creatureId === creatureId))
      .filter(Boolean) as CreatureRecord[];
  }

  function getAssignedJobId(creatureId: CreatureId, exceptJobId?: RanchJobId): RanchJobId | null {
    return RANCH_JOB_IDS.find(
      (jobId) => jobId !== exceptJobId && (activeJobs.assignments[jobId] ?? []).includes(creatureId),
    ) ?? null;
  }

  function getAssignedJobName(creatureId: CreatureId, exceptJobId?: RanchJobId): string | null {
    const jobId = getAssignedJobId(creatureId, exceptJobId);
    return jobId ? getJob(jobId).name : null;
  }

  function getCandidates(
    job: RanchJobDefinition,
    assignments = activeJobs.assignments,
    allowCurrentJob = true,
  ): CreatureRecord[] {
    return (activeSave.creatures ?? [])
      .filter((creature) => {
        const assignedJobId = RANCH_JOB_IDS.find((jobId) =>
          (assignments[jobId] ?? []).includes(creature.creatureId),
        );
        if (assignedJobId && (!allowCurrentJob || assignedJobId !== job.jobId)) return false;
        if (getTrainingUnavailableReason(activeSave, creature.creatureId)) return false;
        return !isCreatureInjured(creature, activeSave.dayState.dayNumber) &&
          creature.energy >= job.energyCost;
      })
      .sort((a, b) => getProjectedCreatureScore(b, job.jobId) - getProjectedCreatureScore(a, job.jobId));
  }

  function getRecommendation(job: RanchJobDefinition): Recommendation {
    const candidate = getCandidates(job)[0] ?? null;
    if (!candidate) {
      return {
        creature: null,
        score: 0,
        reason: "No rested, unassigned helper is available. Check injuries, Training Grounds assignments, and Energy.",
        output: getJobProjectionLabel([], job.jobId),
      };
    }
    const score = getProjectedCreatureScore(candidate, job.jobId);
    const stats = getRelevantStatKeys(job.jobId).join("/");
    return {
      creature: candidate,
      score,
      reason: `${candidate.nickname} has the best combined ${stats}, talent, and ${getSkillLine(candidate, job.jobId)} fit.`,
      output: getProjectedContributionLabel(candidate, job.jobId),
    };
  }

  function saveAssignments(
    assignments: Record<RanchJobId, CreatureId[]>,
    nextMessage: string,
    extraFlags: Record<string, boolean | number | string> = {},
  ) {
    saveCurrentGame({
      ...activeSave,
      updatedAt: new Date().toISOString(),
      ranchJobs: {
        assignments,
        lastProcessedDayNumber: activeJobs.lastProcessedDayNumber,
        lifetimeCompletions: activeJobs.lifetimeCompletions,
      },
      flags: {
        ...activeSave.flags,
        m14RanchJobsUsed: true,
        m20ChoreRecommendations: true,
        m61UniversalChoreAccess: true,
        ...extraFlags,
      },
    });
    setMessage(nextMessage);
  }

  function handleAssign(jobId: RanchJobId, creatureId: CreatureId) {
    if ((activeJobs.assignments[jobId] ?? []).length >= MAX_CREATURES_PER_CHORE) {
      setMessage("This chore already has three helpers. Remove one before assigning another.");
      return;
    }
    const nextAssignments = RANCH_JOB_IDS.reduce(
      (next, id) => ({
        ...next,
        [id]: (activeJobs.assignments[id] ?? []).filter((idValue) => idValue !== creatureId),
      }),
      getEmptyAssignments(),
    );
    nextAssignments[jobId] = [...(nextAssignments[jobId] ?? []), creatureId].slice(0, MAX_CREATURES_PER_CHORE);
    const creature = activeSave.creatures?.find((item) => item.creatureId === creatureId);
    saveAssignments(
      nextAssignments,
      `${creature?.nickname ?? "Helper"} assigned to ${getJob(jobId).name}. ${creature ? getSkillLine(creature, jobId) : ""}`,
      { m20ManualRecommendedAssign: true },
    );
  }

  function handleRemove(jobId: RanchJobId, creatureId: CreatureId) {
    saveAssignments(
      { ...activeJobs.assignments, [jobId]: (activeJobs.assignments[jobId] ?? []).filter((id) => id !== creatureId) },
      "Helper removed from chore.",
    );
  }

  function handleClear(jobId: RanchJobId) {
    saveAssignments({ ...activeJobs.assignments, [jobId]: [] }, "Chore assignment cleared.");
  }

  function handleClearAll() {
    saveAssignments(getEmptyAssignments(), "All ranch chore assignments cleared.", { m14RanchJobsClearedAll: true });
  }

  function handleBestFit(jobId: RanchJobId) {
    const job = getJob(jobId);
    const usedByOtherJobs = new Set(
      RANCH_JOB_IDS.filter((id) => id !== jobId).flatMap((id) => activeJobs.assignments[id] ?? []),
    );
    const selected = getCandidates(job, activeJobs.assignments, true)
      .filter((creature) => !usedByOtherJobs.has(creature.creatureId))
      .slice(0, 1);
    saveAssignments(
      { ...activeJobs.assignments, [jobId]: selected.map((creature) => creature.creatureId) },
      selected[0]
        ? `${selected[0].nickname} is Veyra's best pick for ${job.name}. ${getSkillLine(selected[0], jobId)} • ${getProjectedContributionLabel(selected[0], jobId)}`
        : `No rested, unassigned helper found for ${job.name}.`,
      { m20BestFitUsed: true },
    );
  }

  function applyChorePlan(plan: ChorePlan) {
    const nextAssignments = getEmptyAssignments();
    const usedCreatureIds = new Set<CreatureId>();
    for (const jobId of plan.order) {
      const job = getJob(jobId);
      const candidate = (activeSave.creatures ?? [])
        .filter((creature) =>
          !usedCreatureIds.has(creature.creatureId) &&
          !getTrainingUnavailableReason(activeSave, creature.creatureId) &&
          !isCreatureInjured(creature, activeSave.dayState.dayNumber) &&
          creature.energy >= job.energyCost,
        )
        .sort((a, b) => getProjectedCreatureScore(b, jobId) - getProjectedCreatureScore(a, jobId))[0];
      if (candidate) {
        nextAssignments[jobId] = [candidate.creatureId];
        usedCreatureIds.add(candidate.creatureId);
      }
    }
    const totalAssigned = RANCH_JOB_IDS.reduce(
      (total, jobId) => total + nextAssignments[jobId].length,
      0,
    );
    saveAssignments(
      nextAssignments,
      `${plan.label} assigned ${totalAssigned} helper${totalAssigned === 1 ? "" : "s"}. ${plan.description}`,
      {
        m14RanchJobsAutoAssigned: true,
        m15ChorePlannerUsed: true,
        ranchLastChorePlan: plan.label,
      },
    );
  }

  const assignedCreatures = RANCH_JOB_IDS.flatMap((jobId) => getAssignedCreatures(jobId));
  const feedStock = getFlagNumber(activeSave.flags.ranchFeedStock);
  const materialsStock = getFlagNumber(activeSave.flags.ranchMaterialsStock);
  const dailyFeedNeed = (activeSave.creatures ?? []).reduce(
    (total, creature) => total + getDailyFeedCost(creature),
    0,
  );
  const projectedFeed = RANCH_JOB_IDS.reduce(
    (total, jobId) => total + getProjectedFeedForAssignment(getAssignedCreatures(jobId), jobId),
    0,
  );
  const projectedSecurity = getProjectedScoreTotal(getAssignedCreatures("security_patrol"), "security_patrol");
  const projectedComfort = getProjectedScoreTotal(getAssignedCreatures("comfort_care"), "comfort_care");
  const projectedMaterials = getProjectedMaterialsForAssignment(getAssignedCreatures("field_hauling"), "field_hauling");
  const projectedUpkeep = getProjectedScoreTotal(getAssignedCreatures("field_hauling"), "field_hauling");
  const projectedAvailableFeed = feedStock + projectedFeed;
  const projectedFoodStatus = projectedAvailableFeed >= dailyFeedNeed
    ? "Fed"
    : projectedAvailableFeed > 0
      ? "Short"
      : "Empty";
  const projectedRecoveryLabel = projectedFoodStatus === "Fed"
    ? "Full recovery expected."
    : projectedFoodStatus === "Short"
      ? "Food shortage expected: weak recovery and -1 Affection."
      : "No food expected: almost no recovery and -3 Affection.";
  const riskWarning = `${projectedSecurity
    ? `Security Patrol active: projected danger is ${getProjectedDangerChance(projectedSecurity)}%.`
    : `No Security Patrol: danger risk is ${PROJECTED_BASE_DANGER_CHANCE}%.`} ${projectedUpkeep
      ? `Field Hauling can repair about ${projectedUpkeep} damage.`
      : "No Field Hauling: routine wear is likely overnight."}`;

  const activeJob = activeJobId ? getJob(activeJobId) : null;
  const activeAssigned = activeJob ? getAssignedCreatures(activeJob.jobId) : [];
  const activeAvailable = activeJob
    ? getCandidates(activeJob).filter(
        (creature) => !activeAssigned.some((assigned) => assigned.creatureId === creature.creatureId),
      )
    : [];
  const activeUnavailable = activeJob
    ? (activeSave.creatures ?? [])
        .map((creature) => ({
          creature,
          reason: getUnavailableReason(
            creature,
            activeJob,
            activeSave.dayState.dayNumber,
            getAssignedJobName(creature.creatureId, activeJob.jobId),
            getTrainingUnavailableReason(activeSave, creature.creatureId),
          ),
        }))
        .filter((item): item is { creature: CreatureRecord; reason: string } => Boolean(item.reason))
    : [];

  const recommendation = activeJob ? getRecommendation(activeJob) : null;
  const recommended = activeAvailable.find((creature) => creature.creatureId === recommendation?.creature?.creatureId) ?? activeAvailable[0];
  const full = activeAssigned.length >= MAX_CREATURES_PER_CHORE;

  function helperRow(creature: CreatureRecord, assigned: boolean) {
    if (!activeJob) return null;
    return <article key={creature.creatureId} className={styles.helper}>
      <img src={getCreaturePortraitPath(creature)} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} />
      <div><strong>{getCreatureDisplayName(creature)}</strong>
        <span>{getCreatureSummary(creature)}</span>
        <span>{getSkillLine(creature, activeJob.jobId)}</span>
        <small>{getProjectedContributionLabel(creature, activeJob.jobId)}</small>
        <details><summary>Stat fit</summary><p>{getRelevantStatLine(creature, activeJob.jobId)} · Score {getProjectedCreatureScore(creature, activeJob.jobId).toFixed(1)}</p></details>
      </div>
      <button type="button" disabled={!assigned && full} onClick={() => assigned ? handleRemove(activeJob.jobId, creature.creatureId) : handleAssign(activeJob.jobId, creature.creatureId)}>{assigned ? "Remove" : "Assign"}</button>
    </article>;
  }

  return (
    <main className={`${ui.interior} ${styles.interior}`}>
      <div className={ui.page}>
        <header className={ui.heading}><div><p className={ui.eyebrow}>The daily work of the ranch</p><h1>Ranch Chores</h1></div><ScreenNavigation /></header>
        <section className={ui.summary} aria-label="Overnight projections">
          <div><span>Assigned</span><strong>{assignedCreatures.length}/{activeSave.creatures?.length ?? 0}</strong></div>
          <div><span>Feed available / needed</span><strong>{projectedAvailableFeed} / {dailyFeedNeed}</strong></div>
          <div><span>Danger</span><strong>{projectedSecurity ? getProjectedDangerChance(projectedSecurity) : PROJECTED_BASE_DANGER_CHANCE}%</strong></div>
          <div><span>Comfort</span><strong>{projectedComfort ? `+${Math.min(25, projectedComfort * 2)}% breed` : "None"}</strong></div>
          <div><span>Materials</span><strong>{materialsStock} + {projectedMaterials}</strong></div>
          <div><span>Upkeep repair</span><strong>{projectedUpkeep ? `${projectedUpkeep} damage` : "Daily wear"}</strong></div>
        </section>
        <details className={ui.notice}><summary>{projectedRecoveryLabel} {projectedSecurity ? "Patrol assigned." : "No patrol assigned."}</summary><p>{riskWarning}</p></details>
        <div className={styles.workspace} data-detail={showCrew}>
          <aside className={`${ui.paper} ${styles.tasks}`} aria-label="Choose a chore"><h2>Today's Chores</h2><p>Choose a task to plan its crew.</p>
            {RANCH_JOB_DEFINITIONS.map((job) => {
              const assigned = getAssignedCreatures(job.jobId);
              return <button key={job.jobId} type="button" className={`${styles.task} ${activeJobId === job.jobId ? styles.selected : ""}`} aria-pressed={activeJobId === job.jobId} onClick={() => {setActiveJobId(job.jobId);setShowCrew(true);}}>
                <RanchIcon name={CHORE_ICONS[job.jobId]} className={styles.choreIcon} /><span><strong>{job.name}</strong><small>{job.energyCost} Energy per helper · {assigned.length}/{MAX_CREATURES_PER_CHORE} assigned</small><span>{getJobProjectionLabel(assigned, job.jobId)}</span></span>
              </button>;
            })}
            <details className={styles.about}><summary>About ranch chores</summary><p>Assignments repeat each night. Every species can learn every chore. Best Fit considers stats, talents, affection, and chore skills. Helpers need enough energy and cannot be in training or injured.</p></details>
          </aside>
          {activeJob ? <section className={`${ui.paper} ${styles.crew}`} aria-label="Chore details">
            <button type="button" className={styles.mobileBack} onClick={() => setShowCrew(false)}>← All Chores</button>
            <div className={ui.actionRow}>
              <button className={ui.primary} type="button" onClick={() => applyChorePlan(CHORE_PLANS[0])}>Balanced Plan</button>
              <details className={styles.plans}><summary>Other Plans</summary><div>{CHORE_PLANS.slice(1).map(plan => <button key={plan.id} type="button" title={plan.description} onClick={() => applyChorePlan(plan)}>{plan.label}</button>)}</div></details>
              <button type="button" onClick={handleClearAll}>Clear All</button>
            </div>
            <div className={styles.taskHeading}><RanchIcon name={CHORE_ICONS[activeJob.jobId]} className={styles.choreIcon} /><div><h2>{activeJob.name}</h2><p>{activeJob.rewardLabel}</p><span>{activeJob.energyCost} Energy per helper · {activeAssigned.length}/{MAX_CREATURES_PER_CHORE} assigned</span></div></div>
            {message ? <p className={ui.feedback} role="status">{message}</p> : null}
            {recommended && !full ? <section className={styles.recommendation}><img src={getCreaturePortraitPath(recommended)} alt="" /><div><p className={ui.eyebrow}>Veyra recommends</p><strong>{recommended.nickname}</strong><p>Best available fit for {getRelevantStatKeys(activeJob.jobId).join(" / ")}, talents and chore skills.</p><small>{getProjectedContributionLabel(recommended, activeJob.jobId)}</small></div><button className={ui.primary} type="button" onClick={() => handleAssign(activeJob.jobId, recommended.creatureId)}>Assign {recommended.nickname}</button></section> : null}
            <div className={styles.sectionHeading}><h3>Assigned Helpers</h3><span>{activeAssigned.length}/{MAX_CREATURES_PER_CHORE}</span>{activeAssigned.length ? <button type="button" onClick={() => handleClear(activeJob.jobId)}>Clear Chore</button> : <button type="button" onClick={() => handleBestFit(activeJob.jobId)}>Best Fit</button>}</div>
            {activeAssigned.length ? activeAssigned.map(creature => helperRow(creature, true)) : <p>No helpers assigned yet. Choose a helper below.</p>}
            <div className={styles.sectionHeading}><h3>Available Helpers</h3><span>{full ? "Crew is full" : `${activeAvailable.length} ready`}</span></div>
            {activeAvailable.length ? activeAvailable.map(creature => helperRow(creature, false)) : <p>No ready helpers. Check energy, injuries, training and other assignments.</p>}
            {activeUnavailable.length ? <details className={styles.unavailable}><summary>Unavailable Creatures ({activeUnavailable.length})</summary>{activeUnavailable.map(({creature, reason}) => <div key={creature.creatureId}><strong>{creature.nickname}</strong><p>{reason}</p></div>)}</details> : null}
            <p className={styles.sleepNote}>Chores take effect when you sleep. Helpers use energy and gain chore skill experience.</p>
          </section> : null}
        </div>
        <footer className={ui.footer}>{version}</footer>
      </div>
    </main>
  );
}
