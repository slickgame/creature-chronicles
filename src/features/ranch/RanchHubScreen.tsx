"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { getVariantDefinition } from "@/data/creatures";
import { RANCH_JOB_DEFINITIONS } from "@/data/ranchJobs";
import { RANCH_UPGRADE_ASSETS, getRanchUpgradeEffects, getTotalRanchUpgradeTiers } from "@/data/ranchUpgrades";
import { getStarterGoalProgress, getStarterGoals } from "@/data/starterGoals";
import { formatEnergy, formatGameDate, formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext, type DayAdvanceResult } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { RanchJobId } from "@/types/ranchJobs";
import styles from "./RanchHubScreen.module.css";
import reportStyles from "./RanchHubReport.module.css";

type ModalMode = "none" | "sleep-confirm" | "day-summary" | "requests" | "starter-goals" | "coming-soon" | "ranch-info" | "nav-menu";
type InfoModalMode = "sleep" | "day-summary" | null;
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
  menu: "/images/ui/icons/icon_collection_book.png",
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

function getBuildingStyle(building: Building): CSSProperties { return { left: `${building.x}%`, top: `${building.y}%`, width: `${building.width}%` }; }
function getCreatureProfilePath(creature: CreatureRecord): string { return getVariantDefinition(creature.variantId).profilePath; }
function isAvailableBuilding(id: BuildingId): boolean { return id === "house" || id === "office" || id === "jobs" || id === "feline" || id === "canine" || id === "bovine" || id === "lapine" || id === "equine" || id === "breeding" || id === "nursery" || id === "town"; }
function getFlagNumber(value: boolean | number | string | undefined): number { const parsed = typeof value === "number" ? value : Number(value ?? 0); return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0; }
function getFeedFromMessage(message: string): number { const match = message.match(/\+(\d+)\s*Feed/i); return match ? Number(match[1]) : 0; }

export function RanchHubScreen() {
  const { advanceDay, currentSave, goToBreeding, goToCollection, goToDevTools, goToHabitat, goToMainMenu, goToNursery, goToRanchJobs, goToRanchOffice, goToTown, version } = useGameContext();
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [infoModalMode, setInfoModalMode] = useState<InfoModalMode>(null);
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

  function closeModal() { setInfoModalMode(null); setModalMode("none"); }
  function handleBuildingClick(building: Building) {
    setInfoModalMode(null); setSelectedBuildingId(building.id);
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
    setMessage(`${building.title} is now handled through the Town Guild Hall.`); setModalMode("coming-soon");
  }
  function handleSleep() { const result = advanceDay(); if (!result) return; setDaySummary(result); setInfoModalMode(null); setModalMode("day-summary"); }
  function getCreatureById(creatureId: CreatureId | null | undefined): CreatureRecord | null { if (!creatureId) return null; return (currentSave?.creatures ?? []).find((creature) => creature.creatureId === creatureId) ?? null; }
  function getAssignmentIds(jobId: RanchJobId): CreatureId[] { const ids = currentSave?.ranchJobs?.assignments?.[jobId] ?? []; return Array.isArray(ids) ? ids : ids ? [ids] : []; }

  const habitatCounts = (currentSave.habitats ?? []).map((habitat) => `${habitat.name.replace(" Habitat", "")} ${habitat.creatureIds.length}/${habitat.capacity}`).join(" • ");
  const nonChoreSummaryItems = (daySummary?.summaryItems ?? []).filter((item) => !(daySummary?.ranchJobResults ?? []).some((result) => result.message === item));
  const completedChores = daySummary?.ranchJobResults.length ?? 0;
  const feedProduced = getFlagNumber(currentSave.flags.ranchFeedProducedToday);
  const feedRequired = getFlagNumber(currentSave.flags.ranchFeedRequiredToday);
  const feedConsumed = getFlagNumber(currentSave.flags.ranchFeedConsumedToday);
  const feedStock = getFlagNumber(currentSave.flags.ranchFeedStock);
  const foodStatus = String(currentSave.flags.ranchFoodStatus ?? "Unknown");
  const feedingSummary = String(currentSave.flags.ranchFeedingSummary ?? "Ranch provisions will be checked after sleep.");
  const comfortBonus = getFlagNumber(currentSave.flags.ranchBreedingComfortBonusToday);
  const securityScore = getFlagNumber(currentSave.flags.ranchSecurityScoreToday);
  const upkeepScore = getFlagNumber(currentSave.flags.ranchUpkeepScoreToday);
  const securityDangerChance = getFlagNumber(currentSave.flags.ranchSecurityDangerChanceToday);
  const securityEventType = String(currentSave.flags.ranchSecurityEventTypeToday ?? "none");
  const securityEventSummary = String(currentSave.flags.ranchSecurityEventSummaryToday ?? "Security report will appear after sleep.");
  const securitySuccess = currentSave.flags.ranchSecuritySuccessToday === true;
  const groupedResults = RANCH_JOB_DEFINITIONS.map((job) => {
    const results = (daySummary?.ranchJobResults ?? []).filter((result) => result.jobId === job.jobId);
    const assignedCreatures = getAssignmentIds(job.jobId).map(getCreatureById).filter(Boolean) as CreatureRecord[];
    const displayCreature = results[0] ? getCreatureById(results[0].creatureId) : assignedCreatures[0] ?? null;
    const totalFeed = results.reduce((total, result) => total + getFeedFromMessage(result.message), 0);
    return { job, results, assignedCreatures, displayCreature, totalFeed };
  });

  return (
    <main className={styles.screen}>
      <section className={styles.ranchFrame}>
        <div className={styles.backgroundArt} aria-hidden="true" /><div className={styles.mapShade} aria-hidden="true" />
        <header className={styles.hud}><div className={styles.hudIdentity}><img src={HUD_ICONS.crest} alt="" /><div><span>{currentSave.player.ranchName}</span><strong>{currentSave.player.name}</strong></div></div><div className={styles.hudStats} aria-label="Player resources"><div><img src={HUD_ICONS.calendar} alt="" /><span>Date</span><strong>{dateLabel}</strong></div><div><img src={HUD_ICONS.energy} alt="" /><span>Energy</span><strong>{formatEnergy(currentSave.currencies.energy, currentSave.currencies.maxEnergy)}</strong></div><div className={styles.goldStat}><img src={HUD_ICONS.gold} alt="" /><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div><img src={HUD_ICONS.crest} alt="" /><span>GP</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div></div><nav className={styles.hudActions} aria-label="Ranch navigation"><button type="button" className={styles.menuButton} onClick={() => setModalMode("nav-menu")}><img src={HUD_ICONS.menu} alt="" /><span>Menu</span></button></nav></header>
        <section className={`${styles.ranchTitlePanel} ${styles.compactRanchTitlePanel}`}><div><p className={styles.kicker}>Home Ranch</p><h1>Ranch Hub</h1></div><button type="button" className={styles.ranchInfoButton} onClick={() => setModalMode("ranch-info")} aria-label="Ranch hub details">i</button></section>
        <section className={styles.mapLayer} aria-label="Ranch map buildings">{BUILDINGS.map((building) => <button key={building.id} type="button" style={getBuildingStyle(building)} className={`${styles.mapBuilding} ${selectedBuildingId === building.id ? styles.selectedBuilding : ""} ${isAvailableBuilding(building.id) ? styles.availableBuilding : styles.lockedBuilding}`} onClick={() => handleBuildingClick(building)} aria-label={`${building.title}. ${building.actionLabel}. ${building.description}`}><img src={building.imageSrc} alt="" /><span className={styles.mapBuildingLabel}>{building.title}</span><span className={styles.mapBuildingBadge}>{building.actionLabel}</span></button>)}</section>
        <aside className={styles.selectedPanel} aria-label="Selected ranch location"><span className={styles.selectedMilestone}>{selectedBuilding.milestone}</span><h2>{selectedBuilding.title}</h2><p>{selectedBuilding.description}</p><strong>{selectedBuilding.actionLabel}</strong></aside>
        {modalMode !== "none" ? <div className={styles.modalBackdrop} role="presentation">
          {modalMode === "nav-menu" ? <section className={`${styles.modalPanel} ${reportStyles.nightModalPanel} ${styles.navMenuPanel}`} role="dialog" aria-modal="true" aria-labelledby="nav-menu-title"><header className={styles.navMenuHeader}><div><p className={styles.kicker}>Ranch Navigation</p><h2 id="nav-menu-title">Menu</h2></div><button type="button" onClick={closeModal}>Close</button></header><div className={styles.navMenuGrid}><button type="button" onClick={goToRanchOffice}><img src={HUD_ICONS.ledger} alt="" /><span>Office</span><em>Ranch upgrades</em></button><button type="button" onClick={goToRanchJobs}><img src={HUD_ICONS.jobs} alt="" /><span>Chores</span><em>Daily assignments</em></button>{currentSave.settings.devMode ? <button type="button" onClick={goToDevTools}><img src={HUD_ICONS.dev} alt="" /><span>Dev</span><em>Testing tools</em></button> : null}<button type="button" onClick={() => setModalMode("starter-goals")}><img src={HUD_ICONS.goals} alt="" /><span>Goals</span><em>Starter progress</em></button><button type="button" onClick={goToCollection}><img src={HUD_ICONS.collection} alt="" /><span>Collection</span><em>Creature records</em></button><button type="button" onClick={() => setModalMode("requests")}><img src={HUD_ICONS.requests} alt="" /><span>Requests</span><em>Town guild info</em></button><button type="button" onClick={goToTown}><img src={HUD_ICONS.home} alt="" /><span>Town</span><em>Market and guild</em></button><button type="button" onClick={goToMainMenu}><img src={HUD_ICONS.home} alt="" /><span>Main Menu</span><em>Save slots</em></button></div></section> : null}
          {modalMode === "ranch-info" ? <section className={`${styles.modalPanel} ${reportStyles.nightModalPanel} ${styles.ranchInfoPanel}`} role="dialog" aria-modal="true" aria-labelledby="ranch-info-title"><header className={styles.navMenuHeader}><div><p className={styles.kicker}>Home Ranch</p><h2 id="ranch-info-title">Ranch Hub</h2></div><button type="button" onClick={closeModal}>Close</button></header><p className={styles.ranchInfoLead}>Select buildings directly on the map. The ranch is your daily home base for care, breeding, nursery progress, chores, upgrades, and travel.</p><div className={styles.ranchInfoStats}><div><span>Status</span><strong>{message}</strong></div><div><span>Feed Stock</span><strong>{feedStock} Feed</strong></div><div><span>Ranch Upgrades</span><strong>{totalRanchUpgrades} tiers</strong></div><div><span>Egg Capacity</span><strong>{ranchEffects?.nurseryEggCapacity ?? 0}</strong></div></div>{starterProgress?.nextGoal ? <p className={styles.ranchInfoNote}>Next goal: {starterProgress.nextGoal.label} — {starterProgress.nextGoal.hint}</p> : <p className={styles.ranchInfoNote}>Starter goals complete. Expand your collection or upgrade the ranch.</p>}<p className={styles.ranchInfoNote}>{habitatCounts}</p></section> : null}
          {modalMode === "sleep-confirm" ? <section className={`${styles.modalPanel} ${reportStyles.nightModalPanel} ${reportStyles.sleepPanel}`} role="dialog" aria-modal="true" aria-labelledby="sleep-title"><header className={reportStyles.nightModalHeader}><img className={reportStyles.nightModalIcon} src={HUD_ICONS.sleep} alt="" /><div><p className={reportStyles.reportKicker}>Ranch House</p><h2 id="sleep-title">Sleep Until Tomorrow?</h2><p className={reportStyles.modalLead}>Rest for the night, advance the calendar, and auto-feed the ranch from stored provisions.</p></div><button type="button" className={reportStyles.infoIconButton} onClick={() => setInfoModalMode("sleep")} aria-label="Sleep details">i</button></header><div className={reportStyles.sleepSummaryGrid}><div><span>Player Energy</span><strong>Food-Based</strong></div><div><span>Creatures</span><strong>Fed = Recover</strong></div><div><span>Timers</span><strong>Eggs + Pregnancy</strong></div><div><span>Chores</span><strong>Produce Feed</strong></div></div><p className={reportStyles.compactHint}>If the feed shed is empty, sleep recovers little energy and creature affection drops.</p><div className={styles.modalActions}><button type="button" onClick={closeModal}>Cancel</button><button type="button" className={styles.primaryAction} onClick={handleSleep}>Sleep</button></div></section> : null}
          {modalMode === "day-summary" ? <section className={`${styles.modalPanel} ${reportStyles.nightModalPanel} ${reportStyles.reportModalPanel}`} role="dialog" aria-modal="true" aria-labelledby="summary-title"><header className={reportStyles.nightModalHeader}><div><p className={reportStyles.reportKicker}>Morning Report</p><h2 id="summary-title">New Day Summary</h2><p className={reportStyles.reportDate}>{daySummary?.previousDateLabel} → {daySummary?.nextDateLabel}</p></div><button type="button" className={reportStyles.infoIconButton} onClick={() => setInfoModalMode("day-summary")} aria-label="New day summary details">i</button></header><div className={reportStyles.summaryStatGrid}><div><span>Date</span><strong>{daySummary?.nextDateLabel ?? dateLabel}</strong></div><div><span>Helpers Done</span><strong>{completedChores}</strong></div><div><span>Feed Used</span><strong>{feedConsumed}/{feedRequired}</strong></div><div><span>Food Status</span><strong>{foodStatus}</strong></div></div><p className={reportStyles.compactHint}>{feedingSummary}</p><section><div className={reportStyles.sectionHeader}><h3>Security Report</h3><span>Score {securityScore} • Danger {securityDangerChance}% • {securitySuccess ? "Success" : securityEventType}</span></div><p className={reportStyles.compactHint}>{securityEventSummary}</p></section><section><div className={reportStyles.sectionHeader}><h3>Morning Chore Report</h3><span>{completedChores} helpers completed • +{feedProduced} Feed</span></div><div className={reportStyles.choreReportGrid}>{groupedResults.map(({ job, results, assignedCreatures, displayCreature, totalFeed }) => <article key={job.jobId} className={reportStyles.choreReportCard}><img className={reportStyles.choreReportIcon} src={displayCreature ? getCreatureProfilePath(displayCreature) : job.iconPath} alt="" /><div><strong>{job.name}</strong><span>{results.length ? `${results.length} helper${results.length === 1 ? "" : "s"}: ${results.map((result) => result.creatureName).join(", ")}` : assignedCreatures.length ? `${assignedCreatures.length} assigned, no completed effect` : "Unassigned"}</span><em>{results.length ? results.map((result) => result.message).join(" ") : "No chore completed."}</em></div><div className={reportStyles.choreRewardRow}>{results.length ? <>{totalFeed ? <span>+{totalFeed} Feed</span> : null}{job.jobId === "security_patrol" && securityScore ? <span>Security {securityScore}</span> : null}{job.jobId === "comfort_care" && comfortBonus ? <span>+{comfortBonus}% Breeding Comfort</span> : null}{job.jobId === "field_hauling" && upkeepScore ? <span>Upkeep {upkeepScore}</span> : null}<span>-{results.reduce((total, result) => total + result.energyCost, 0)} Energy</span></> : <span>No effect</span>}</div></article>)}</div></section><p className={reportStyles.compactHint}>Use the info button to view the full overnight system log.</p><div className={styles.modalActions}><button type="button" className={styles.primaryAction} onClick={() => { closeModal(); setMessage("A new day begins on the ranch."); }}>Start Day</button></div></section> : null}
          {modalMode === "coming-soon" ? <section className={`${styles.modalPanel} ${reportStyles.nightModalPanel}`} role="dialog" aria-modal="true" aria-labelledby="coming-soon-title"><h2 id="coming-soon-title">{selectedBuilding.title}</h2><p>{selectedBuilding.description}</p><p className={styles.comingSoonText}>{selectedBuilding.actionLabel}</p><div className={styles.modalActions}><button type="button" className={styles.primaryAction} onClick={closeModal}>Close</button></div></section> : null}
          {modalMode === "requests" ? <section className={`${styles.modalPanel} ${reportStyles.nightModalPanel}`} role="dialog" aria-modal="true" aria-labelledby="requests-title"><img className={styles.modalIcon} src={HUD_ICONS.requests} alt="" /><h2 id="requests-title">Requests</h2><p>The full guild contract system now lives in the Town Guild Hall.</p><ul><li>Use Town Road → Guild Hall for contracts.</li><li>Use Ranch Office for ranch infrastructure upgrades.</li><li>Use Ranch Chores for daily assignment rewards.</li></ul><div className={styles.modalActions}><button type="button" className={styles.primaryAction} onClick={closeModal}>Close</button></div></section> : null}
          {modalMode === "starter-goals" ? <section className={`${styles.modalPanel} ${reportStyles.nightModalPanel}`} role="dialog" aria-modal="true" aria-labelledby="goals-title"><img className={styles.modalIcon} src={HUD_ICONS.goals} alt="" /><h2 id="goals-title">Starter Goals</h2><p>{starterProgress?.completed ?? 0} / {starterProgress?.total ?? starterGoals.length} complete. These are optional guideposts, not chores.</p><ul className={styles.goalList}>{starterGoals.map((goal) => <li key={goal.id} className={goal.complete ? styles.goalComplete : ""}><strong>{goal.complete ? "✓" : "○"} {goal.label}</strong><span>{goal.description}</span><em>{goal.hint}</em></li>)}</ul><div className={styles.modalActions}><button type="button" className={styles.primaryAction} onClick={closeModal}>Close</button></div></section> : null}
          {infoModalMode ? <div className={reportStyles.infoOverlay} role="presentation" onMouseDown={() => setInfoModalMode(null)}><section className={reportStyles.infoPanel} role="dialog" aria-modal="true" aria-labelledby="ranch-info-title" onMouseDown={(event) => event.stopPropagation()}><header className={reportStyles.infoPanelHeader}><div><p className={reportStyles.reportKicker}>{infoModalMode === "sleep" ? "Overnight Systems" : "System Log"}</p><h3 id="ranch-info-title">{infoModalMode === "sleep" ? "What Sleep Does" : "Full New Day Details"}</h3></div><button type="button" onClick={() => setInfoModalMode(null)}>Close</button></header>{infoModalMode === "sleep" ? <div className={reportStyles.infoTextBlock}><p>Sleeping advances the day and checks the feed shed before restoring energy.</p><ul><li>Production and garden chores can add feed before the feeding check.</li><li>If enough food exists, player and creature energy recover normally.</li><li>If food is short, sleep recovery is weak and creature affection drops.</li><li>If no food exists, sleep recovers almost no energy and affection drops sharply.</li><li>Pregnancy and egg timers still advance by one day.</li><li>Security may prevent or report ranch danger events overnight.</li></ul></div> : <div className={reportStyles.infoTextBlock}><p>{feedingSummary}</p><p>{securityEventSummary}</p><ul>{nonChoreSummaryItems.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>}</section></div> : null}
        </div> : null}
        <footer className={styles.versionFooter}>{version}</footer>
      </section>
    </main>
  );
}
