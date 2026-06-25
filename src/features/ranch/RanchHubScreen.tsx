"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { getVariantDefinition } from "@/data/creatures";
import { RANCH_JOB_DEFINITIONS } from "@/data/ranchJobs";
import { RANCH_UPGRADE_ASSETS, getRanchUpgradeEffects, getTotalRanchUpgradeTiers } from "@/data/ranchUpgrades";
import { getStarterGoalProgress, getStarterGoals } from "@/data/starterGoals";
import { formatEnergy, formatGameDate, formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext, type DayAdvanceResult } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import styles from "./RanchHubScreen.module.css";
import reportStyles from "./RanchHubReport.module.css";

type ModalMode = "none" | "sleep-confirm" | "day-summary" | "requests" | "starter-goals" | "coming-soon";
type BuildingId = "house" | "office" | "jobs" | "feline" | "canine" | "bovine" | "lapine" | "equine" | "breeding" | "nursery" | "town" | "guild";
type Building = { id: BuildingId; title: string; milestone: "Available" | "M3" | "M4" | "M5" | "M6" | "M7" | "M11" | "M13" | "M14"; description: string; actionLabel: string; imageSrc: string; x: number; y: number; width: number };

const HUD_ICONS = {
  crest: "/images/ui/icons/icon_paw_crest.png",
  energy: "/images/ui/icons/icon_energy_lightning.png",
  calendar: "/images/ui/icons/icon_calendar.png",
  home: "/images/ui/icons/icon_home.png",
  sleep: "/images/ui/icons/icon_sleep_moon.png",
  requests: "/images/ui/home/icon_home_requests.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  collection: "/images/ui/icons/icon_collection_book.png",
  ledger: "/images/ui/icons/icon_ranch_ledger.png",
  dev: "/images/ui/icons/icon_ranch_upgrade.png",
  goals: "/images/ui/icons/icon_collection_book.png",
  jobs: "/images/ui/icons/icon_ranch_upgrade.png",
} as const;

const BUILDINGS: Building[] = [
  { id: "house", title: "Ranch House", milestone: "Available", description: "Rest for the night and advance to the next day.", actionLabel: "Sleep", imageSrc: "/images/buildings/ranch/ranch_house.png", x: 48, y: 59, width: 11 },
  { id: "office", title: "Ranch Office", milestone: "M11", description: "Open the Ranch Office ledger to expand habitats, nursery capacity, breeding comfort, and sleep recovery.", actionLabel: "Open Ledger", imageSrc: RANCH_UPGRADE_ASSETS.officeBuilding, x: 36, y: 59, width: 10 },
  { id: "jobs", title: "Ranch Chores", milestone: "M14", description: "Assign creatures to daily ranch chores such as security, comfort, production, garden tending, and hauling.", actionLabel: "Open Chores", imageSrc: "/images/buildings/ranch/guild_board.png", x: 60, y: 58, width: 8 },
  { id: "feline", title: "Feline Habitat", milestone: "M3", description: "Home for Feline, Sphinx, and Tiger creatures.", actionLabel: "Open Habitat", imageSrc: "/images/buildings/ranch/feline_habitat.png", x: 18, y: 62, width: 10 },
  { id: "canine", title: "Canine Habitat", milestone: "M3", description: "Home for Canine, Hellhound, and Direwolf creatures.", actionLabel: "Open Habitat", imageSrc: "/images/buildings/ranch/canine_habitat.png", x: 75, y: 58, width: 10 },
  { id: "bovine", title: "Bovine Habitat", milestone: "M13", description: "Home for Cow, Minotaur, Moon Yak, and future ranch-production creatures.", actionLabel: "Open Habitat", imageSrc: "/images/buildings/ranch/bovine_habitat.png", x: 17, y: 78, width: 8 },
  { id: "lapine", title: "Lapine Habitat", milestone: "M13", description: "Home for Bunny, Antlerhare, Dream Lop, and future garden or nursery creatures.", actionLabel: "Open Habitat", imageSrc: "/images/buildings/ranch/lapine_habitat.png", x: 71, y: 78, width: 7 },
  { id: "equine", title: "Equine Habitat", milestone: "M13", description: "Home for Horse, Unicorn, Nightmare, and future travel or field creatures.", actionLabel: "Open Habitat", imageSrc: "/images/buildings/ranch/equine_habitat.png", x: 84, y: 66, width: 8 },
  { id: "breeding", title: "Breeding Pen", milestone: "M4", description: "Pair selection, breeding previews, streaks, costs, and result placeholders.", actionLabel: "Open Breeding", imageSrc: "/images/buildings/ranch/breeding_pen.png", x: 49, y: 76, width: 10 },
  { id: "nursery", title: "Egg Nursery", milestone: "M5", description: "Track pregnancies, incubating eggs, ready eggs, and hatch results.", actionLabel: "Open Nursery", imageSrc: "/images/buildings/ranch/egg_nursery.png", x: 32, y: 78, width: 9 },
  { id: "town", title: "Town Road", milestone: "M6", description: "Leave the ranch and travel to town for the market, guild board, and future town services.", actionLabel: "Travel to Town", imageSrc: "/images/buildings/ranch/town_road.png", x: 63, y: 87, width: 8 },
  { id: "guild", title: "Guild Board", milestone: "M7", description: "Legacy ranch board. The full Guild Hall now lives in town.", actionLabel: "Town Guild", imageSrc: "/images/buildings/ranch/guild_board.png", x: 82, y: 82, width: 8 },
];

function getBuildingStyle(building: Building): CSSProperties {
  return { left: `${building.x}%`, top: `${building.y}%`, width: `${building.width}%` };
}

function getCreatureProfilePath(creature: CreatureRecord): string {
  return getVariantDefinition(creature.variantId).profilePath;
}

function isAvailableBuilding(id: BuildingId): boolean {
  return id === "house" || id === "office" || id === "jobs" || id === "feline" || id === "canine" || id === "bovine" || id === "lapine" || id === "equine" || id === "breeding" || id === "nursery" || id === "town";
}

export function RanchHubScreen() {
  const { advanceDay, currentSave, goToBreeding, goToCollection, goToDevTools, goToHabitat, goToMainMenu, goToNursery, goToRanchJobs, goToRanchOffice, goToTown, version } = useGameContext();
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [daySummary, setDaySummary] = useState<DayAdvanceResult | null>(null);
  const [message, setMessage] = useState("Welcome back to the ranch.");
  const [selectedBuildingId, setSelectedBuildingId] = useState<BuildingId>("house");

  const selectedBuilding = useMemo(() => BUILDINGS.find((building) => building.id === selectedBuildingId) ?? BUILDINGS[0], [selectedBuildingId]);
  const dateLabel = useMemo(() => currentSave ? formatGameDate(currentSave.dayState.weekday, currentSave.dayState.month, currentSave.dayState.dayOfMonth) : "Mon 1/1", [currentSave]);
  const ranchEffects = useMemo(() => currentSave ? getRanchUpgradeEffects(currentSave) : null, [currentSave]);
  const totalRanchUpgrades = useMemo(() => currentSave ? getTotalRanchUpgradeTiers(currentSave) : 0, [currentSave]);
  const starterGoals = useMemo(() => currentSave ? getStarterGoals(currentSave) : [], [currentSave]);
  const starterProgress = useMemo(() => currentSave ? getStarterGoalProgress(currentSave) : null, [currentSave]);

  if (!currentSave) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before entering the ranch.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  function handleBuildingClick(building: Building) {
    setSelectedBuildingId(building.id);
    if (building.id === "house") { setMessage("Ranch House selected. Rest here to advance the day."); setModalMode("sleep-confirm"); return; }
    if (building.id === "office") { goToRanchOffice(); return; }
    if (building.id === "jobs") { goToRanchJobs(); return; }
    if (building.id === "feline") { goToHabitat("feline"); return; }
    if (building.id === "canine") { goToHabitat("canine"); return; }
    if (building.id === "bovine") { goToHabitat("bovine"); return; }
    if (building.id === "lapine") { goToHabitat("lapine"); return; }
    if (building.id === "equine") { goToHabitat("equine"); return; }
    if (building.id === "breeding") { goToBreeding(); return; }
    if (building.id === "nursery") { goToNursery(); return; }
    if (building.id === "town") { goToTown(); return; }
    setMessage(`${building.title} is now handled through the Town Guild Hall.`);
    setModalMode("coming-soon");
  }

  function handleSleep() {
    const result = advanceDay();
    if (!result) return;
    setDaySummary(result);
    setModalMode("day-summary");
  }

  function getCreatureById(creatureId: string | null | undefined): CreatureRecord | null {
    if (!creatureId) return null;
    return (currentSave?.creatures ?? []).find((creature) => creature.creatureId === creatureId) ?? null;
  }

  const habitatCounts = (currentSave.habitats ?? []).map((habitat) => `${habitat.name.replace(" Habitat", "")} ${habitat.creatureIds.length}/${habitat.capacity}`).join(" • ");
  const nonChoreSummaryItems = (daySummary?.summaryItems ?? []).filter((item) => !(daySummary?.ranchJobResults ?? []).some((result) => result.message === item));

  return (
    <main className={styles.screen}>
      <section className={styles.ranchFrame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.mapShade} aria-hidden="true" />
        <header className={styles.hud}>
          <div className={styles.hudIdentity}><img src={HUD_ICONS.crest} alt="" /><div><span>{currentSave.player.ranchName}</span><strong>{currentSave.player.name}</strong></div></div>
          <div className={styles.hudStats} aria-label="Player resources"><div><img src={HUD_ICONS.calendar} alt="" /><span>Date</span><strong>{dateLabel}</strong></div><div><img src={HUD_ICONS.energy} alt="" /><span>Energy</span><strong>{formatEnergy(currentSave.currencies.energy, currentSave.currencies.maxEnergy)}</strong></div><div className={styles.goldStat}><img src={HUD_ICONS.gold} alt="" /><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div><img src={HUD_ICONS.crest} alt="" /><span>GP</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div></div>
          <nav className={styles.hudActions} aria-label="Ranch actions"><button type="button" className={styles.iconButton} onClick={goToRanchOffice}><img src={HUD_ICONS.ledger} alt="" /><span>Office</span></button><button type="button" className={styles.iconButton} onClick={goToRanchJobs}><img src={HUD_ICONS.jobs} alt="" /><span>Chores</span></button>{currentSave.settings.devMode ? <button type="button" className={styles.iconButton} onClick={goToDevTools}><img src={HUD_ICONS.dev} alt="" /><span>Dev</span></button> : null}<button type="button" className={styles.iconButton} onClick={() => setModalMode("starter-goals")}><img src={HUD_ICONS.goals} alt="" /><span>Goals</span></button><button type="button" className={styles.iconButton} onClick={goToCollection}><img src={HUD_ICONS.collection} alt="" /><span>Collection</span></button><button type="button" className={styles.iconButton} onClick={() => setModalMode("requests")}><img src={HUD_ICONS.requests} alt="" /><span>Requests</span></button><button type="button" className={styles.menuButton} onClick={goToMainMenu}><img src={HUD_ICONS.home} alt="" /><span>Main Menu</span></button></nav>
        </header>
        <section className={styles.ranchTitlePanel}><p className={styles.kicker}>Home Ranch</p><h1>Ranch Hub</h1><p>Select buildings directly on the ranch map. M14 adds Ranch Chores.</p><p className={styles.message}>{message}</p>{starterProgress?.nextGoal ? <p className={styles.message}>Next goal: {starterProgress.nextGoal.label} — {starterProgress.nextGoal.hint}</p> : <p className={styles.message}>Starter goals complete. Expand your collection or upgrade the ranch.</p>}{ranchEffects ? <p className={styles.message}>Ranch upgrades: {totalRanchUpgrades} tiers • Eggs {ranchEffects.nurseryEggCapacity}</p> : null}<p className={styles.message}>{habitatCounts}</p></section>
        <section className={styles.mapLayer} aria-label="Ranch map buildings">{BUILDINGS.map((building) => <button key={building.id} type="button" style={getBuildingStyle(building)} className={`${styles.mapBuilding} ${selectedBuildingId === building.id ? styles.selectedBuilding : ""} ${isAvailableBuilding(building.id) ? styles.availableBuilding : styles.lockedBuilding}`} onClick={() => handleBuildingClick(building)} aria-label={`${building.title}. ${building.actionLabel}. ${building.description}`}><img src={building.imageSrc} alt="" /><span className={styles.mapBuildingLabel}>{building.title}</span><span className={styles.mapBuildingBadge}>{building.actionLabel}</span></button>)}</section>
        <aside className={styles.selectedPanel} aria-label="Selected ranch location"><span className={styles.selectedMilestone}>{selectedBuilding.milestone}</span><h2>{selectedBuilding.title}</h2><p>{selectedBuilding.description}</p><strong>{selectedBuilding.actionLabel}</strong></aside>
        {modalMode !== "none" ? <div className={styles.modalBackdrop} role="presentation">
          {modalMode === "sleep-confirm" ? <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="sleep-title"><img className={styles.modalIcon} src={HUD_ICONS.sleep} alt="" /><h2 id="sleep-title">Sleep Until Tomorrow?</h2><p>Sleeping advances the day. Ranch Office recovery upgrades may improve overnight recovery.</p><ul><li>Energy will be restored to full.</li><li>Creature energy and Hearts will be restored.</li><li>Pregnancy and egg timers will advance.</li><li>Ranch chores will resolve and pay rewards.</li></ul><div className={styles.modalActions}><button type="button" onClick={() => setModalMode("none")}>Cancel</button><button type="button" className={styles.primaryAction} onClick={handleSleep}>Sleep</button></div></section> : null}
          {modalMode === "day-summary" ? <section className={`${styles.modalPanel} ${reportStyles.reportModalPanel}`} role="dialog" aria-modal="true" aria-labelledby="summary-title"><p className={reportStyles.reportKicker}>Morning Report</p><h2 id="summary-title">New Day Summary</h2><p className={reportStyles.reportDate}>{daySummary?.previousDateLabel} → {daySummary?.nextDateLabel}</p><div className={reportStyles.reportColumns}><section><h3>Ranch Updates</h3><ul>{nonChoreSummaryItems.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section><section><h3>Morning Chore Report</h3><div className={reportStyles.choreReportGrid}>{RANCH_JOB_DEFINITIONS.map((job) => { const result = daySummary?.ranchJobResults.find((item) => item.jobId === job.jobId); const assignedCreatureId = currentSave.ranchJobs?.assignments?.[job.jobId] ?? null; const creature = getCreatureById(result?.creatureId ?? assignedCreatureId); return <article key={job.jobId} className={reportStyles.choreReportCard}><img className={reportStyles.choreReportIcon} src={creature ? getCreatureProfilePath(creature) : job.iconPath} alt="" /><div><strong>{job.name}</strong><span>{result ? result.creatureName : creature ? creature.nickname : "Unassigned"}</span><em>{result ? result.message : "No chore completed."}</em></div><div className={reportStyles.choreRewardRow}>{result ? <><span>+{result.goldReward} Gold</span>{result.guildPointReward ? <span>+{result.guildPointReward} GP</span> : null}{result.affectionReward ? <span>+{result.affectionReward} Affection</span> : null}{result.energyCost ? <span>-{result.energyCost} Energy</span> : null}</> : <span>No reward</span>}</div></article>; })}</div></section></div><div className={styles.modalActions}><button type="button" className={styles.primaryAction} onClick={() => { setModalMode("none"); setMessage("A new day begins on the ranch."); }}>Start Day</button></div></section> : null}
          {modalMode === "coming-soon" ? <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="coming-soon-title"><h2 id="coming-soon-title">{selectedBuilding.title}</h2><p>{selectedBuilding.description}</p><p className={styles.comingSoonText}>{selectedBuilding.actionLabel}</p><div className={styles.modalActions}><button type="button" className={styles.primaryAction} onClick={() => setModalMode("none")}>Close</button></div></section> : null}
          {modalMode === "requests" ? <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="requests-title"><img className={styles.modalIcon} src={HUD_ICONS.requests} alt="" /><h2 id="requests-title">Requests</h2><p>The full guild contract system now lives in the Town Guild Hall.</p><ul><li>Use Town Road → Guild Hall for contracts.</li><li>Use Ranch Office for ranch infrastructure upgrades.</li><li>Use Ranch Chores for daily assignment rewards.</li></ul><div className={styles.modalActions}><button type="button" className={styles.primaryAction} onClick={() => setModalMode("none")}>Close</button></div></section> : null}
          {modalMode === "starter-goals" ? <section className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="goals-title"><img className={styles.modalIcon} src={HUD_ICONS.goals} alt="" /><h2 id="goals-title">Starter Goals</h2><p>{starterProgress?.completed ?? 0} / {starterProgress?.total ?? starterGoals.length} complete. These are optional guideposts, not chores.</p><ul className={styles.goalList}>{starterGoals.map((goal) => <li key={goal.id} className={goal.complete ? styles.goalComplete : ""}><strong>{goal.complete ? "✓" : "○"} {goal.label}</strong><span>{goal.description}</span><em>{goal.hint}</em></li>)}</ul><div className={styles.modalActions}><button type="button" className={styles.primaryAction} onClick={() => setModalMode("none")}>Close</button></div></section> : null}
        </div> : null}
        <footer className={styles.versionFooter}>{version}</footer>
      </section>
    </main>
  );
}
