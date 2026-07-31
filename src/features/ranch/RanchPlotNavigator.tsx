"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { getBuilderProjectProgress, type BuilderProjectId } from "@/data/builderProjects";
import { getNextRanchUpgradeTier, getRanchUpgradeDefinition, getRanchUpgrades } from "@/data/ranchUpgrades";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureFamily } from "@/types/creature";
import type { RanchUpgradeCategory, RanchUpgradeId, RanchUpgradeTier } from "@/types/ranchUpgrades";
import expansionStyles from "./RanchExpansionPlot.module.css";
import styles from "./RanchPlotNavigator.module.css";

type RanchPlotId = "homestead" | "habitats" | "services" | "expansion";
type BuildingShortcutId =
  | "house"
  | "breeding"
  | "nursery"
  | "town"
  | "feline"
  | "canine"
  | "bovine"
  | "lapine"
  | "equine"
  | "office"
  | "jobs"
  | "guild"
  | "north-pasture"
  | "woodline-acre"
  | "chicken"
  | "sheep"
  | "goat"
  | "aviary"
  | "fence"
  | "watchtower";

type RanchPlot = { id: RanchPlotId; label: string; shortLabel: string; description: string };
type BuildingShortcut = {
  id: BuildingShortcutId;
  plotId: RanchPlotId;
  title: string;
  hint: string;
  x: number;
  labelY: number;
  upgradeIds: RanchUpgradeId[];
  projectId?: BuilderProjectId;
};

const OFFICE_CATEGORY_KEY = "creature-chronicles-ranch-office-category-v1";
const OFFICE_UPGRADE_KEY = "creature-chronicles-ranch-office-upgrade-v1";
const BUILDER_AUTO_OPEN_KEY = "creature-chronicles-open-builder-yard";

const RANCH_PLOTS: RanchPlot[] = [
  { id: "homestead", label: "Homestead Yard", shortLabel: "Homestead", description: "House, breeding pen, egg nursery, and town road." },
  { id: "habitats", label: "Habitat Fields", shortLabel: "Habitats", description: "Feline, canine, bovine, lapine, and equine habitats." },
  { id: "services", label: "Service Yard", shortLabel: "Services", description: "Ranch office, chores board, guild board, house, and town road." },
  { id: "expansion", label: "Expansion Fields", shortLabel: "Expansion", description: "Future livestock habitats, new land deeds, and permanent security construction." },
];

const BUILDING_SHORTCUTS: BuildingShortcut[] = [
  { id: "house", plotId: "homestead", title: "Ranch House", hint: "Sleep recovery upgrades make the ranch more restful overnight.", x: 50, labelY: 48, upgradeIds: ["sleep_recovery"] },
  { id: "breeding", plotId: "homestead", title: "Breeding Pen", hint: "Comfort upgrades reduce the harsh base breeding cost and improve pregnancy chance.", x: 50, labelY: 77, upgradeIds: ["breeding_pen_comfort"] },
  { id: "nursery", plotId: "homestead", title: "Egg Nursery", hint: "Nursery upgrades add egg slots and reduce long pregnancy/incubation timers.", x: 27, labelY: 79, upgradeIds: ["nursery_egg_capacity", "nursery_incubation_speed"] },
  { id: "town", plotId: "homestead", title: "Town Road", hint: "Travel to town for market, guild, construction, and other services.", x: 73, labelY: 81, upgradeIds: [] },
  { id: "feline", plotId: "habitats", title: "Feline Habitat", hint: "Capacity upgrades make room for more feline-family creatures.", x: 31, labelY: 55, upgradeIds: ["feline_habitat_capacity"] },
  { id: "canine", plotId: "habitats", title: "Canine Habitat", hint: "Capacity upgrades support more canine-family helpers and security lines.", x: 64, labelY: 53, upgradeIds: ["canine_habitat_capacity"] },
  { id: "bovine", plotId: "habitats", title: "Bovine Habitat", hint: "Capacity upgrades support production and feed economy growth.", x: 21, labelY: 84, upgradeIds: ["bovine_habitat_capacity"] },
  { id: "lapine", plotId: "habitats", title: "Lapine Habitat", hint: "Capacity upgrades support garden, nursery, and lapine breeding lines.", x: 58, labelY: 77, upgradeIds: ["lapine_habitat_capacity"] },
  { id: "equine", plotId: "habitats", title: "Equine Habitat", hint: "Capacity upgrades support hauling, upkeep, and field work lines.", x: 81, labelY: 77, upgradeIds: ["equine_habitat_capacity"] },
  { id: "office", plotId: "services", title: "Ranch Office", hint: "Open the construction ledger, repairs, history, and ranch-wide effects.", x: 39, labelY: 61, upgradeIds: [] },
  { id: "jobs", plotId: "services", title: "Ranch Chores", hint: "Chores Board upgrades reduce high base work costs and improve chore output.", x: 63, labelY: 52, upgradeIds: ["ranch_chores_board"] },
  { id: "guild", plotId: "services", title: "Guild Board", hint: "Guild contracts are handled in town.", x: 80, labelY: 81, upgradeIds: [] },
  { id: "town", plotId: "services", title: "Town Road", hint: "Travel to town for market, guild, construction, and other services.", x: 51, labelY: 81, upgradeIds: [] },
  { id: "house", plotId: "services", title: "Ranch House", hint: "Sleep recovery upgrades make the ranch more restful overnight.", x: 23, labelY: 73, upgradeIds: ["sleep_recovery"] },
  { id: "north-pasture", plotId: "expansion", title: "North Pasture", hint: "Purchase the land deed before livestock habitats can be built.", x: 20, labelY: 38, upgradeIds: [], projectId: "north_pasture_land" },
  { id: "woodline-acre", plotId: "expansion", title: "Woodline Acre", hint: "A second plot for specialty habitats and stronger perimeter defenses.", x: 80, labelY: 38, upgradeIds: [], projectId: "woodline_acre_land" },
  { id: "chicken", plotId: "expansion", title: "Chicken Coop", hint: "A future avian-livestock habitat. Building it also increases predator attraction.", x: 25, labelY: 62, upgradeIds: [], projectId: "chicken_coop" },
  { id: "sheep", plotId: "expansion", title: "Sheep Fold", hint: "A future ovine habitat with grazing and shelter space.", x: 43, labelY: 75, upgradeIds: [], projectId: "sheep_fold" },
  { id: "goat", plotId: "expansion", title: "Goat Paddock", hint: "A future caprine habitat unlocked through the Woodline Acre.", x: 61, labelY: 75, upgradeIds: [], projectId: "goat_paddock" },
  { id: "aviary", plotId: "expansion", title: "Aviary Roost", hint: "A future flying-creature habitat unlocked through the Woodline Acre.", x: 78, labelY: 61, upgradeIds: [], projectId: "aviary_roost" },
  { id: "fence", plotId: "expansion", title: "Reinforced Fence", hint: "Permanent security that reduces future predator exposure.", x: 37, labelY: 45, upgradeIds: [], projectId: "reinforced_fence" },
  { id: "watchtower", plotId: "expansion", title: "Watchtower", hint: "Powerful permanent security support for nightly patrols.", x: 63, labelY: 43, upgradeIds: [], projectId: "watchtower" },
];

function getNextPlotId(currentId: RanchPlotId, direction: -1 | 1): RanchPlotId {
  const currentIndex = RANCH_PLOTS.findIndex((plot) => plot.id === currentId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  return RANCH_PLOTS[(safeIndex + direction + RANCH_PLOTS.length) % RANCH_PLOTS.length].id;
}
function getShortcutStyle(shortcut: BuildingShortcut): CSSProperties { return { left: `${shortcut.x}%`, top: `${shortcut.labelY}%` }; }
function getCategoryForUpgrade(upgradeId: RanchUpgradeId): RanchUpgradeCategory { return getRanchUpgradeDefinition(upgradeId).category; }
function getPrimaryUpgradeId(shortcut: BuildingShortcut): RanchUpgradeId | null { return shortcut.upgradeIds[0] ?? null; }
function formatUpgradeCost(tier: RanchUpgradeTier): string {
  const parts = [formatGold(tier.costGold)];
  if (tier.costGp) parts.push(formatGuildPoints(tier.costGp));
  if (tier.costMaterials) parts.push(`${tier.costMaterials} Materials`);
  return parts.join(" + ");
}
function getHighestLevel(upgradeIds: RanchUpgradeId[], upgrades: Record<RanchUpgradeId, number>): number | null {
  if (!upgradeIds.length) return null;
  return Math.max(...upgradeIds.map((upgradeId) => upgrades[upgradeId] ?? 0));
}
function canAffordTier(currentSave: NonNullable<ReturnType<typeof useGameContext>["currentSave"]>, tier: RanchUpgradeTier): boolean {
  const materials = Number(currentSave.flags.ranchMaterialsStock ?? 0);
  return currentSave.currencies.gold >= tier.costGold && currentSave.currencies.guildPoints >= (tier.costGp ?? 0) && materials >= (tier.costMaterials ?? 0);
}
function setOfficeShortcut(upgradeId: RanchUpgradeId | null) {
  if (!upgradeId || typeof window === "undefined") return;
  window.localStorage.setItem(OFFICE_UPGRADE_KEY, upgradeId);
  window.localStorage.setItem(OFFICE_CATEGORY_KEY, getCategoryForUpgrade(upgradeId));
}

export function RanchPlotNavigator() {
  const { currentSave, goToBreeding, goToHabitat, goToNursery, goToRanchJobs, goToRanchOffice, goToTown } = useGameContext();
  const [activePlotId, setActivePlotId] = useState<RanchPlotId>("homestead");
  const [selectedShortcut, setSelectedShortcut] = useState<BuildingShortcut | null>(null);
  const activePlot = useMemo(() => RANCH_PLOTS.find((plot) => plot.id === activePlotId) ?? RANCH_PLOTS[0], [activePlotId]);
  const previousPlot = useMemo(() => RANCH_PLOTS.find((plot) => plot.id === getNextPlotId(activePlotId, -1)) ?? RANCH_PLOTS[0], [activePlotId]);
  const nextPlot = useMemo(() => RANCH_PLOTS.find((plot) => plot.id === getNextPlotId(activePlotId, 1)) ?? RANCH_PLOTS[0], [activePlotId]);
  const ranchUpgrades = useMemo(() => (currentSave ? getRanchUpgrades(currentSave) : null), [currentSave]);
  const visibleShortcuts = useMemo(() => BUILDING_SHORTCUTS.filter((shortcut) => shortcut.plotId === activePlotId), [activePlotId]);

  useEffect(() => {
    document.documentElement.dataset.ranchPlot = activePlotId;
    return () => { delete document.documentElement.dataset.ranchPlot; };
  }, [activePlotId]);

  function shiftPlot(direction: -1 | 1) {
    setSelectedShortcut(null);
    setActivePlotId((currentId) => getNextPlotId(currentId, direction));
  }

  function enterBuilding(shortcut: BuildingShortcut) {
    setSelectedShortcut(null);
    if (shortcut.projectId) return;
    if (shortcut.id === "breeding") { goToBreeding(); return; }
    if (shortcut.id === "nursery") { goToNursery(); return; }
    if (shortcut.id === "jobs") { goToRanchJobs(); return; }
    if (shortcut.id === "office") { goToRanchOffice(); return; }
    if (shortcut.id === "town" || shortcut.id === "guild") { goToTown(); return; }
    if (["feline", "canine", "bovine", "lapine", "equine"].includes(shortcut.id)) { goToHabitat(shortcut.id as CreatureFamily); return; }
    const mapButton = document.querySelector<HTMLButtonElement>('section[aria-label="Ranch buildings"] > button[aria-label^="Ranch House."]');
    mapButton?.click();
  }

  function openOfficeForShortcut(shortcut: BuildingShortcut) {
    setOfficeShortcut(getPrimaryUpgradeId(shortcut));
    setSelectedShortcut(null);
    goToRanchOffice();
  }

  function visitBuilder() {
    if (typeof window !== "undefined") window.localStorage.setItem(BUILDER_AUTO_OPEN_KEY, "1");
    setSelectedShortcut(null);
    goToTown();
  }

  return (
    <nav className={styles.plotNavigator} aria-label="Ranch plot navigation">
      {activePlotId === "expansion" ? <div className={expansionStyles.expansionTint} aria-hidden="true" /> : null}
      <button type="button" className={`${styles.plotArrow} ${styles.leftArrow}`} onClick={() => shiftPlot(-1)} aria-label={`Go to ${previousPlot.label}`}><span aria-hidden="true">‹</span><em>{previousPlot.shortLabel}</em></button>
      {currentSave && ranchUpgrades ? visibleShortcuts.map((shortcut) => {
        const project = shortcut.projectId ? getBuilderProjectProgress(currentSave, shortcut.projectId) : null;
        const upgradeStatuses = shortcut.upgradeIds.map((upgradeId) => {
          const definition = getRanchUpgradeDefinition(upgradeId);
          const tier = ranchUpgrades[upgradeId] ?? 0;
          const nextTier = getNextRanchUpgradeTier(definition, tier);
          return { definition, tier, nextTier, canAfford: nextTier ? canAffordTier(currentSave, nextTier) : false };
        });
        const level = getHighestLevel(shortcut.upgradeIds, ranchUpgrades);
        const hasUpgrade = upgradeStatuses.some((status) => Boolean(status.nextTier));
        const hasAffordableUpgrade = upgradeStatuses.some((status) => status.canAfford);
        const projectClass = project
          ? project.status === "built"
            ? expansionStyles.builtProject
            : project.status === "locked"
              ? expansionStyles.lockedProject
              : project.affordable
                ? expansionStyles.affordableProject
                : expansionStyles.availableProject
          : "";
        const markerLabel = project
          ? project.status === "built" ? "Built" : project.status === "locked" ? "Locked" : "Build"
          : level === null ? "Info" : `Lv. ${level}`;
        return (
          <button
            key={`${shortcut.plotId}-${shortcut.id}`}
            type="button"
            className={`${styles.buildingMarker} ${projectClass} ${hasUpgrade ? styles.hasUpgrade : ""} ${hasAffordableUpgrade ? styles.affordableUpgrade : ""}`}
            style={getShortcutStyle(shortcut)}
            onClick={() => setSelectedShortcut(shortcut)}
            aria-label={`${shortcut.title}. ${project ? `${project.status} builder project.` : "Building level and upgrade shortcut."}`}
          >
            <span>{shortcut.title}</span><em>{markerLabel}</em>{hasUpgrade ? <strong aria-hidden="true">⬆</strong> : null}
          </button>
        );
      }) : null}
      <div className={styles.plotBadge} aria-live="polite"><span>Ranch Plot</span><strong>{activePlot.label}</strong><em>{activePlot.description}</em></div>
      <button type="button" className={`${styles.plotArrow} ${styles.rightArrow}`} onClick={() => shiftPlot(1)} aria-label={`Go to ${nextPlot.label}`}><span aria-hidden="true">›</span><em>{nextPlot.shortLabel}</em></button>

      {selectedShortcut && currentSave && ranchUpgrades ? (
        <div className={styles.shortcutBackdrop} role="presentation" onClick={() => setSelectedShortcut(null)}>
          <section className={styles.shortcutPanel} role="dialog" aria-modal="true" aria-labelledby="building-shortcut-title" onClick={(event) => event.stopPropagation()}>
            <header className={styles.shortcutHeader}><div><p>{selectedShortcut.projectId ? "Builder Project" : "Building Upgrade Shortcut"}</p><h2 id="building-shortcut-title">{selectedShortcut.title}</h2></div><button type="button" onClick={() => setSelectedShortcut(null)}>Close</button></header>
            <p className={styles.shortcutLead}>{selectedShortcut.hint}</p>

            {selectedShortcut.projectId ? (() => {
              const progress = getBuilderProjectProgress(currentSave, selectedShortcut.projectId);
              return (
                <article className={`${styles.upgradeStatusCard} ${expansionStyles.projectDetail}`} data-status={progress.status}>
                  <span>{progress.definition.category} project</span>
                  <strong>{progress.definition.title}</strong>
                  <p>{progress.definition.flavor}</p>
                  <div><em>Status</em><b>{progress.status}</b></div>
                  <div><em>Cost</em><b>{progress.definition.costGold} Gold + {progress.definition.costMaterials} Materials</b></div>
                  {progress.missingPrerequisites.length ? <small>Requires: {progress.missingPrerequisites.map((item) => item.title).join(", ")}</small> : null}
                  {progress.built && progress.definition.category === "habitat" ? <small>The structure is complete. Its future creature family is not active yet.</small> : null}
                </article>
              );
            })() : selectedShortcut.upgradeIds.length ? (
              <div className={styles.upgradeStatusGrid}>{selectedShortcut.upgradeIds.map((upgradeId) => {
                const definition = getRanchUpgradeDefinition(upgradeId);
                const tier = ranchUpgrades[upgradeId] ?? 0;
                const nextTier = getNextRanchUpgradeTier(definition, tier);
                return <article key={upgradeId} className={styles.upgradeStatusCard}><span>{definition.category} upgrade</span><strong>{definition.name}</strong><div><em>Current</em><b>Tier {tier}</b></div><p>{tier === 0 ? "Base ranch service" : definition.tiers.find((item) => item.tier === tier)?.effectLabel ?? "Base ranch service"}</p><div><em>Next</em><b>{nextTier ? `Tier ${nextTier.tier}` : "Max"}</b></div><p>{nextTier ? nextTier.effectLabel : "Fully upgraded."}</p>{nextTier ? <small>Cost: {formatUpgradeCost(nextTier)}</small> : null}</article>;
              })}</div>
            ) : <p className={styles.shortcutLead}>This building has no ranch construction upgrade yet.</p>}

            <footer className={styles.shortcutActions}>
              {selectedShortcut.projectId ? <button type="button" className={styles.primaryShortcutAction} onClick={visitBuilder}>Visit Petra's Builder's Yard</button> : <><button type="button" onClick={() => enterBuilding(selectedShortcut)}>Enter Building</button><button type="button" className={styles.primaryShortcutAction} disabled={!selectedShortcut.upgradeIds.length} onClick={() => openOfficeForShortcut(selectedShortcut)}>Upgrade in Office</button></>}
            </footer>
          </section>
        </div>
      ) : null}
    </nav>
  );
}
