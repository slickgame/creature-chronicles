"use client";

import { useState } from "react";
import {
  getSupplyDepotSupplyCounts,
  SUPPLY_DEPOT_ITEMS,
} from "@/data/supplyDepot";
import { useGameContext, type AppScreen } from "@/state/GameProvider";
import styles from "./DepotSuppliesOverlay.module.css";

type OverlayItem = {
  id: string;
  label: string;
  value: string;
  iconPath: string;
};

const ITEM_ICONS = Object.fromEntries(
  SUPPLY_DEPOT_ITEMS.map((item) => [item.itemId, item.iconPath]),
) as Record<string, string>;

const FALLBACK_ICON = "/images/ui/icons/icon_shop_bag.png";
const OVERLAY_COLLAPSED_KEY = "creature-chronicles-depot-overlay-collapsed-v1";

function readInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(OVERLAY_COLLAPSED_KEY) === "true";
}

function rememberCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OVERLAY_COLLAPSED_KEY, String(collapsed));
}

function getContext(screen: AppScreen) {
  if (screen === "breeding") {
    return {
      title: "Breeding Supplies",
      badge: "Breeding Pen",
      note: "Fertility Tonics apply automatically in the Breeding Pen: +12% pregnancy chance, then one tonic is consumed on a valid attempt. Energy Snacks can be used here to restore player energy before another attempt.",
    };
  }

  if (screen === "egg-atelier") {
    return {
      title: "Egg Care Supplies",
      badge: "Egg Atelier",
      note: "Nursery Supply Kits are spent by Egg Atelier services and furniture upgrades such as incubation, bedding, polish, and conditioning.",
    };
  }

  if (screen === "ranch-office") {
    return {
      title: "Construction Supplies",
      badge: "Ranch Office",
      note: "Repair Kits are consumed first by Ranch Office manual repairs. If no kit is available, repairs fall back to Materials.",
    };
  }

  if (screen === "habitat") {
    return {
      title: "Habitat Supplies",
      badge: "Habitats",
      note: "Feed is consumed automatically during overnight ranch feeding. Energy Snacks are stored and can be used from this panel to restore player energy.",
    };
  }

  if (screen === "nursery") {
    return {
      title: "Nursery Supplies",
      badge: "Nursery",
      note: "Nursery Supply Kits support egg-care services in the Egg Atelier. Feed still affects ranch-wide overnight recovery.",
    };
  }

  if (screen === "ranch-jobs") {
    return {
      title: "Chore Supplies",
      badge: "Ranch Chores",
      note: "Production and Garden chores add Feed. Field Hauling adds Materials and helps ranch upkeep after Sleep.",
    };
  }

  return {
    title: "Depot Supplies",
    badge: "Ranch Stock",
    note: "Supply Depot purchases are stored as ranch supply counts, then spent automatically or by related ranch systems.",
  };
}

function getItemsForScreen(screen: AppScreen, counts: ReturnType<typeof getSupplyDepotSupplyCounts>): OverlayItem[] {
  if (screen === "breeding") {
    return [
      { id: "fertility_tonic", label: "Tonics", value: `${counts.fertilityTonics}`, iconPath: ITEM_ICONS.fertility_tonic },
      { id: "energy_snack", label: "Snacks", value: `${counts.energySnacks}`, iconPath: ITEM_ICONS.energy_snack },
      { id: "feed_bundle", label: "Feed", value: `${counts.feed}`, iconPath: ITEM_ICONS.feed_bundle },
    ];
  }

  if (screen === "egg-atelier" || screen === "nursery") {
    return [
      { id: "nursery_supply_kit", label: "Nursery Kits", value: `${counts.nurserySupplyKits}`, iconPath: ITEM_ICONS.nursery_supply_kit },
      { id: "energy_snack", label: "Snacks", value: `${counts.energySnacks}`, iconPath: ITEM_ICONS.energy_snack },
      { id: "fertility_tonic", label: "Tonics", value: `${counts.fertilityTonics}`, iconPath: ITEM_ICONS.fertility_tonic },
    ];
  }

  if (screen === "ranch-office") {
    return [
      { id: "material_crate", label: "Materials", value: `${counts.materials}`, iconPath: ITEM_ICONS.material_crate },
      { id: "repair_kit", label: "Repair Kits", value: `${counts.repairKits}`, iconPath: ITEM_ICONS.repair_kit },
      { id: "energy_snack", label: "Snacks", value: `${counts.energySnacks}`, iconPath: ITEM_ICONS.energy_snack },
    ];
  }

  if (screen === "habitat" || screen === "ranch-jobs" || screen === "ranch-hub") {
    return [
      { id: "feed_bundle", label: "Feed", value: `${counts.feed}`, iconPath: ITEM_ICONS.feed_bundle },
      { id: "material_crate", label: "Materials", value: `${counts.materials}`, iconPath: ITEM_ICONS.material_crate },
      { id: "energy_snack", label: "Snacks", value: `${counts.energySnacks}`, iconPath: ITEM_ICONS.energy_snack },
    ];
  }

  return [
    { id: "feed_bundle", label: "Feed", value: `${counts.feed}`, iconPath: ITEM_ICONS.feed_bundle },
    { id: "material_crate", label: "Materials", value: `${counts.materials}`, iconPath: ITEM_ICONS.material_crate },
    { id: "energy_snack", label: "Snacks", value: `${counts.energySnacks}`, iconPath: ITEM_ICONS.energy_snack },
  ];
}

export function DepotSuppliesOverlay() {
  const { appScreen, currentSave, goToSupplyDepot, useEnergySnack } = useGameContext();
  const [isCollapsed, setIsCollapsed] = useState(readInitialCollapsed);
  const [message, setMessage] = useState("");

  if (!currentSave) return null;

  const visibleScreens: AppScreen[] = [
    "ranch-hub",
    "habitat",
    "breeding",
    "nursery",
    "egg-atelier",
    "ranch-office",
    "ranch-jobs",
  ];

  if (!visibleScreens.includes(appScreen)) return null;

  const counts = getSupplyDepotSupplyCounts(currentSave);
  const context = getContext(appScreen);
  const items = getItemsForScreen(appScreen, counts);
  const canUseSnack = counts.energySnacks > 0 && currentSave.currencies.energy < currentSave.currencies.maxEnergy;
  const energyLabel = `${currentSave.currencies.energy}/${currentSave.currencies.maxEnergy}`;

  function toggleCollapsed() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    rememberCollapsed(next);
  }

  function handleUseSnack() {
    setMessage(useEnergySnack());
  }

  if (isCollapsed) {
    return (
      <aside className={`${styles.overlay} ${styles.collapsed}`} aria-label="Supply Depot contextual supplies">
        <header className={styles.header}>
          <div>
            <span className={styles.kicker}>Supply Depot</span>
            <strong className={styles.title}>{counts.energySnacks} Snacks • {energyLabel} Energy</strong>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.iconButton} onClick={toggleCollapsed} aria-label="Expand Supply Depot supplies">
              Open
            </button>
          </div>
        </header>
      </aside>
    );
  }

  return (
    <aside className={styles.overlay} aria-label="Supply Depot contextual supplies">
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Supply Depot</span>
          <strong className={styles.title}>{context.title}</strong>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.badge}>{context.badge}</span>
          <button type="button" className={styles.iconButton} onClick={toggleCollapsed} aria-label="Collapse Supply Depot supplies">
            Hide
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <img
              src={item.iconPath || FALLBACK_ICON}
              alt=""
              onError={(event) => {
                event.currentTarget.src = FALLBACK_ICON;
              }}
            />
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={handleUseSnack} disabled={!canUseSnack}>
          Use Energy Snack ({energyLabel})
        </button>
        <button type="button" className={styles.secondaryButton} onClick={goToSupplyDepot}>
          Open Supply Depot
        </button>
      </div>

      {message ? <p className={styles.message}>{message}</p> : null}
      <p className={styles.note}>{context.note}</p>
    </aside>
  );
}
