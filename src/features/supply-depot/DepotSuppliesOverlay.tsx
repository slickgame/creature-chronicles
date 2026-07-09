"use client";

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

function getContext(screen: AppScreen) {
  if (screen === "breeding") {
    return {
      title: "Breeding Supplies",
      badge: "Breeding Pen",
      note: "Fertility Tonics apply automatically in the Breeding Pen: +12% pregnancy chance, then one tonic is consumed on a valid attempt.",
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
      note: "Feed is consumed automatically during overnight ranch feeding. Energy Snacks are instant-use when bought at the Depot.",
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
      { id: "feed_bundle", label: "Feed", value: `${counts.feed}`, iconPath: ITEM_ICONS.feed_bundle },
      { id: "energy_snack", label: "Snacks Used", value: `${counts.energySnacksUsed}`, iconPath: ITEM_ICONS.energy_snack },
    ];
  }

  if (screen === "egg-atelier" || screen === "nursery") {
    return [
      { id: "nursery_supply_kit", label: "Nursery Kits", value: `${counts.nurserySupplyKits}`, iconPath: ITEM_ICONS.nursery_supply_kit },
      { id: "fertility_tonic", label: "Tonics", value: `${counts.fertilityTonics}`, iconPath: ITEM_ICONS.fertility_tonic },
      { id: "feed_bundle", label: "Feed", value: `${counts.feed}`, iconPath: ITEM_ICONS.feed_bundle },
    ];
  }

  if (screen === "ranch-office") {
    return [
      { id: "material_crate", label: "Materials", value: `${counts.materials}`, iconPath: ITEM_ICONS.material_crate },
      { id: "repair_kit", label: "Repair Kits", value: `${counts.repairKits}`, iconPath: ITEM_ICONS.repair_kit },
      { id: "nursery_supply_kit", label: "Nursery Kits", value: `${counts.nurserySupplyKits}`, iconPath: ITEM_ICONS.nursery_supply_kit },
    ];
  }

  if (screen === "habitat" || screen === "ranch-jobs" || screen === "ranch-hub") {
    return [
      { id: "feed_bundle", label: "Feed", value: `${counts.feed}`, iconPath: ITEM_ICONS.feed_bundle },
      { id: "material_crate", label: "Materials", value: `${counts.materials}`, iconPath: ITEM_ICONS.material_crate },
      { id: "repair_kit", label: "Repair Kits", value: `${counts.repairKits}`, iconPath: ITEM_ICONS.repair_kit },
    ];
  }

  return [
    { id: "feed_bundle", label: "Feed", value: `${counts.feed}`, iconPath: ITEM_ICONS.feed_bundle },
    { id: "material_crate", label: "Materials", value: `${counts.materials}`, iconPath: ITEM_ICONS.material_crate },
    { id: "fertility_tonic", label: "Tonics", value: `${counts.fertilityTonics}`, iconPath: ITEM_ICONS.fertility_tonic },
  ];
}

export function DepotSuppliesOverlay() {
  const { appScreen, currentSave } = useGameContext();
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

  return (
    <aside className={styles.overlay} aria-label="Supply Depot contextual supplies">
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Supply Depot</span>
          <strong className={styles.title}>{context.title}</strong>
        </div>
        <span className={styles.badge}>{context.badge}</span>
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

      <p className={styles.note}>{context.note}</p>
    </aside>
  );
}
