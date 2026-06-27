"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { getNextRanchUpgradeTier, getRanchUpgradeDefinition, getRanchUpgrades, RANCH_UPGRADE_DEFINITIONS } from "@/data/ranchUpgrades";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureFamily } from "@/types/creature";
import type { RanchUpgradeCategory, RanchUpgradeId, RanchUpgradeTier } from "@/types/ranchUpgrades";
import styles from "./RanchPlotNavigator.module.css";

type RanchPlotId = "homestead" | "habitats" | "services";
type BuildingShortcutId = "house" | "breeding" | "nursery" | "town" | "feline" | "canine" | "bovine" | "lapine" | "equine" | "office" | "jobs" | "guild";

type RanchPlot = { id: RanchPlotId; label: string; shortLabel: string; description: string };
type BuildingShortcut = { id: BuildingShortcutId; plotId: RanchPlotId; title: string; hint: string; x: number; y: number; upgradeIds: RanchUpgradeId[] };

const OFFICE_CATEGORY_KEY = "creature-chronicles-ranch-office-category-v1";
const OFFICE_UPGRADE_KEY = "creature-chronicles-ranch-office-upgrade-v1";

const RANCH_PLOTS: RanchPlot[] = [
  { id: "homestead", label: "Homestead Yard", shortLabel: "Homestead", description: "House, breeding pen, egg nursery, and town road." },
  { id: "habitats", label: "Habitat Fields", shortLabel: "Habitats", description: "Feline, canine, bovine, lapine, and equine habitats." },
  { id: "services", label: "Service Yard", shortLabel: "Services", description: "Ranch office, chores board, guild board, house, and town road." },
];

const BUILDING_SHORTCUTS: BuildingShortcut[] = [
  { id: "house", plotId: "homestead", title: "Ranch House", hint: "Sleep recovery upgrades make the ranch more restful overnight.", x: 50, y: 36, upgradeIds: ["sleep_recovery"] },
  { id: "breeding", plotId: "homestead", title: "Breeding Pen", hint: "Comfort upgrades reduce the harsh base breeding cost and improve pregnancy chance.", x: 50, y: 70, upgradeIds: ["breeding_pen_comfort"] },
  { id: "nursery", plotId: "homestead", title: "Egg Nursery", hint: "Nursery upgrades add egg slots and reduce long pregnancy/incubation timers.", x: 27, y: 70, upgradeIds: ["nursery_egg_capacity", "nursery_incubation_speed"] },
  { id: "town", plotId: "homestead", title: "Town Road", hint: "Travel to town for market, guild, and future town services.", x: 73, y: 73, upgradeIds: [] },
  { id: "feline", plotId: "habitats", title: "Feline Habitat", hint: "Capacity upgrades make room for more feline-family creatures.", x: 31, y: 44, upgradeIds: ["feline_habitat_capacity"] },
  { id: "canine", plotId: "habitats", title: "Canine Habitat", hint: "Capacity upgrades support more canine-family helpers and security lines.", x: 64, y: 42, upgradeIds: ["canine_habitat_capacity"] },
  { id: "bovine", plotId: "habitats", title: "Bovine Habitat", hint: "Capacity upgrades support production and feed economy growth.", x: 21, y: 75, upgradeIds: ["bovine_habitat_capacity"] },
  { id: "lapine", plotId: "habitats", title: "Lapine Habitat", hint: "Capacity upgrades support garden, nursery, and lapine breeding lines.", x: 58, y: 68, upgradeIds: ["lapine_habitat_capacity"] },
  { id: "equine", plotId: "habitats", title: "Equine Habitat", hint: "Capacity upgrades support hauling, upkeep, and field work lines.", x: 81, y: 66, upgradeIds: ["equine_habitat_capacity"] },
  { id: "office", plotId: "services", title: "Ranch Office", hint: "Open the construction ledger, repairs, history, and ranch-wide effects.", x: 39, y: 50, upgradeIds: [] },
  { id: "jobs", plotId: "services", title: "Ranch Chores", hint: "Chores Board upgrades reduce high base work costs and improve chore output.", x: 63, y: 42, upgradeIds: ["ranch_chores_board"] },
  { id: "guild", plotId: "services", title: "Guild Board", hint: "Guild contracts are handled in town.", x: 80, y: 72, upgradeIds: [] },
  { id: "town", plotId: "services", title: "Town Road", hint: "Travel to town for market, guild, and future town services.", x: 51, y: 73, upgradeIds: [] },
  { id: "house", plotId: "services", title: "Ranch House", hint: "Sleep recovery upgrades make the ranch more restful overnight.", x: 23, y: 65, upgradeIds: ["sleep_recovery"] },
];

function getNextPlotId(currentId: RanchPlotId, direction: -1 | 1): RanchPlotId {
  const currentIndex = RANCH_PLOTS.findIndex((plot) => plot.id === currentId);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + RANCH_PLOTS.length) % RANCH_PLOTS.length;
  return RANCH_PLOTS[nextIndex].id;
}

function getShortcutStyle(shortcut: BuildingShortcut): CSSProperties {
  return { left: `${shortcut.x}%`, top: `${shortcut.y}%` };
}

function getCategoryForUpgrade(upgradeId: RanchUpgradeId): RanchUpgradeCategory {
  return getRanchUpgradeDefinition(upgradeId).category;
}

function getPrimaryUpgradeId(shortcut: BuildingShortcut): RanchUpgradeId | null {
  return shortcut.upgradeIds[0] ?? null;
}

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
    return () => {
      delete document.documentElement.dataset.ranchPlot;
    };
  }, [activePlotId]);

  function shiftPlot(direction: -1 | 1) {
    setSelectedShortcut(null);
    setActivePlotId((currentId) => getNextPlotId(currentId, direction));
  }

  function enterBuilding(shortcut: BuildingShortcut) {
    setSelectedShortcut(null);
    if (shortcut.id === "breeding") { goToBreeding(); return; }
    if (shortcut.id === "nursery") { goToNursery(); return; }
    if (shortcut.id === "jobs") { goToRanchJobs(); return; }
    if (shortcut.id === "office") { goToRanchOffice(); return; }
    if (shortcut.id === "town" || shortcut.id === "guild") { goToTown(); return; }
    if (shortcut.id === "feline" || shortcut.id === "canine" || shortcut.id === "bovine" || shortcut.id === "lapine" || shortcut.id === "equine") { goToHabitat(shortcut.id as CreatureFamily); return; }
    const mapButton = document.querySelector<HTMLButtonElement>('section[aria-label="Ranch buildings"] > button[aria-label^="Ranch House."]');
    mapButton?.click();
  }

  function openOfficeForShortcut(shortcut: BuildingShortcut) {
    setOfficeShortcut(getPrimaryUpgradeId(shortcut));
    setSelectedShortcut(null);
    goToRanchOffice();
  }

  return (
    <nav className={styles.plotNavigator} aria-label="Ranch plot navigation">
      <button type="button" className={`${styles.plotArrow} ${styles.leftArrow}`} onClick={() => shiftPlot(-1)} aria-label={`Go to ${previousPlot.label}`}>
        <span aria-hidden="true">‹</span>
        <em>{previousPlot.shortLabel}</em>
      </button>

      {currentSave && ranchUpgrades ? visibleShortcuts.map((shortcut) => {
        const upgradeStatuses = shortcut.upgradeIds.map((upgradeId) => {
          const definition = getRanchUpgradeDefinition(upgradeId);
          const tier = ranchUpgrades[upgradeId] ?? 0;
          const nextTier = getNextRanchUpgradeTier(definition, tier);
          return { definition, tier, nextTier, canAfford: nextTier ? canAffordTier(currentSave, nextTier) : false };
        });
        const level = getHighestLevel(shortcut.upgradeIds, ranchUpgrades);
        const hasUpgrade = upgradeStatuses.some((status) => Boolean(status.nextTier));
        const hasAffordableUpgrade = upgradeStatuses.some((status) => status.canAfford);
        return (
          <button key={`${shortcut.plotId}-${shortcut.id}`} type="button" className={`${styles.buildingMarker} ${hasUpgrade ? styles.hasUpgrade : ""} ${hasAffordableUpgrade ? styles.affordableUpgrade : ""}`} style={getShortcutStyle(shortcut)} onClick={() => setSelectedShortcut(shortcut)} aria-label={`${shortcut.title} building level and upgrade shortcut`}>
            <span>{level === null ? "Info" : `Lv. ${level}`}</span>
            {hasUpgrade ? <strong aria-hidden="true">⬆</strong> : null}
          </button>
        );
      }) : null}

      <div className={styles.plotBadge} aria-live="polite">
        <span>Ranch Plot</span>
        <strong>{activePlot.label}</strong>
        <em>{activePlot.description}</em>
      </div>

      <button type="button" className={`${styles.plotArrow} ${styles.rightArrow}`} onClick={() => shiftPlot(1)} aria-label={`Go to ${nextPlot.label}`}>
        <span aria-hidden="true">›</span>
        <em>{nextPlot.shortLabel}</em>
      </button>

      {selectedShortcut && currentSave && ranchUpgrades ? (
        <div className={styles.shortcutBackdrop} role="presentation" onClick={() => setSelectedShortcut(null)}>
          <section className={styles.shortcutPanel} role="dialog" aria-modal="true" aria-labelledby="building-shortcut-title" onClick={(event) => event.stopPropagation()}>
            <header className={styles.shortcutHeader}>
              <div>
                <p>Building Upgrade Shortcut</p>
                <h2 id="building-shortcut-title">{selectedShortcut.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedShortcut(null)}>Close</button>
            </header>
            <p className={styles.shortcutLead}>{selectedShortcut.hint}</p>
            {selectedShortcut.upgradeIds.length ? (
              <div className={styles.upgradeStatusGrid}>
                {selectedShortcut.upgradeIds.map((upgradeId) => {
                  const definition = getRanchUpgradeDefinition(upgradeId);
                  const tier = ranchUpgrades[upgradeId] ?? 0;
                  const nextTier = getNextRanchUpgradeTier(definition, tier);
                  return (
                    <article key={upgradeId} className={styles.upgradeStatusCard}>
                      <span>{definition.category} upgrade</span>
                      <strong>{definition.name}</strong>
                      <div><em>Current</em><b>Tier {tier}</b></div>
                      <p>{tier === 0 ? "Base ranch service" : definition.tiers.find((item) => item.tier === tier)?.effectLabel ?? "Base ranch service"}</p>
                      <div><em>Next</em><b>{nextTier ? `Tier ${nextTier.tier}` : "Max"}</b></div>
                      <p>{nextTier ? nextTier.effectLabel : "Fully upgraded."}</p>
                      {nextTier ? <small>Cost: {formatUpgradeCost(nextTier)}</small> : null}
                    </article>
                  );
                })}
              </div>
            ) : <p className={styles.shortcutLead}>This building has no ranch construction upgrade yet.</p>}
            <footer className={styles.shortcutActions}>
              <button type="button" onClick={() => enterBuilding(selectedShortcut)}>Enter Building</button>
              <button type="button" className={styles.primaryShortcutAction} disabled={!selectedShortcut.upgradeIds.length} onClick={() => openOfficeForShortcut(selectedShortcut)}>Upgrade in Office</button>
            </footer>
          </section>
        </div>
      ) : null}
    </nav>
  );
}
