"use client";

import { useMemo, useState } from "react";
import { getSupplyDepotSupplyCounts, getSupplyDepotUsageRows } from "@/data/supplyDepot";
import { useGameContext } from "@/state/GameProvider";
import styles from "./PlayerInventoryMenu.module.css";

const FALLBACK_ITEM_ICON = "/images/ui/icons/icon_shop_bag.png";

type InventoryCategory = "all" | "consumables" | "ranch" | "breeding" | "nursery" | "materials";

type InventoryRow = ReturnType<typeof getSupplyDepotUsageRows>[number];

const CATEGORY_TABS: Array<{ id: InventoryCategory; label: string; hint: string }> = [
  { id: "all", label: "All", hint: "Everything currently tracked in player inventory and ranch storage." },
  { id: "consumables", label: "Consumables", hint: "Items used directly by the player." },
  { id: "ranch", label: "Ranch Supplies", hint: "Feed, repair, and general ranch operation items." },
  { id: "breeding", label: "Breeding", hint: "Items consumed by the Breeding Pen." },
  { id: "nursery", label: "Nursery", hint: "Items consumed by egg and nursery systems." },
  { id: "materials", label: "Materials", hint: "Construction and repair resources." },
];

function getRowCategory(row: InventoryRow): InventoryCategory {
  if (row.item.itemId === "energy_snack") return "consumables";
  if (row.item.itemId === "fertility_tonic") return "breeding";
  if (row.item.itemId === "nursery_supply_kit") return "nursery";
  if (row.item.itemId === "material_crate") return "materials";
  return "ranch";
}

function getInventoryHint(category: InventoryCategory): string {
  return CATEGORY_TABS.find((tab) => tab.id === category)?.hint ?? CATEGORY_TABS[0].hint;
}

export function PlayerInventoryMenu() {
  const {
    appScreen,
    currentSave,
    goToBreeding,
    goToEggAtelier,
    goToRanchOffice,
    useEnergySnack,
  } = useGameContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>("energy_snack");
  const [message, setMessage] = useState("Inventory shows purchased player items and ranch supplies. Items are used here or by their related systems.");

  const supplyRows = useMemo(() => (currentSave ? getSupplyDepotUsageRows(currentSave) : []), [currentSave]);
  const supplyCounts = useMemo(() => (currentSave ? getSupplyDepotSupplyCounts(currentSave) : null), [currentSave]);
  const filteredRows = useMemo(
    () => supplyRows.filter((row) => activeCategory === "all" || getRowCategory(row) === activeCategory),
    [activeCategory, supplyRows],
  );
  const selectedRow = supplyRows.find((row) => row.item.itemId === selectedItemId) ?? filteredRows[0] ?? null;

  if (!currentSave || appScreen === "main-menu") return null;

  const energySnackDisabledReason = !supplyCounts || supplyCounts.energySnacks <= 0
    ? "No Energy Snacks owned."
    : currentSave.currencies.energy >= currentSave.currencies.maxEnergy
      ? "Energy is already full."
      : "Ready to use.";
  const canUseSnack = energySnackDisabledReason === "Ready to use.";

  function handleUseEnergySnack() {
    setMessage(useEnergySnack());
  }

  function openRelatedSystem(action: () => void) {
    setIsOpen(false);
    action();
  }

  function renderItemAction(row: InventoryRow) {
    if (row.item.itemId === "energy_snack") {
      return (
        <div className={styles.actionStack}>
          <button type="button" className={styles.actionButton} disabled={!canUseSnack} onClick={handleUseEnergySnack}>
            Use Energy Snack ({currentSave.currencies.energy}/{currentSave.currencies.maxEnergy})
          </button>
          <small>{energySnackDisabledReason}</small>
        </div>
      );
    }

    if (row.item.itemId === "material_crate" || row.item.itemId === "repair_kit") {
      return <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToRanchOffice)}>Open Ranch Office</button>;
    }

    if (row.item.itemId === "fertility_tonic") {
      return <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToBreeding)}>Open Breeding Pen</button>;
    }

    if (row.item.itemId === "nursery_supply_kit") {
      return <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToEggAtelier)}>Open Egg Atelier</button>;
    }

    return <span className={styles.passiveUse}>Used automatically by ranch systems.</span>;
  }

  return (
    <>
      <button type="button" className={styles.menuButton} onClick={() => setIsOpen(true)}>
        Menu
      </button>

      {isOpen ? (
        <div className={styles.backdrop} role="presentation" onClick={() => setIsOpen(false)}>
          <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="inventory-title" onClick={(event) => event.stopPropagation()}>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>Player Menu</p>
                <h2 id="inventory-title">Inventory</h2>
                <p className={styles.lead}>Use player items here. Ranch supplies stay visible here, but are spent by their relevant ranch systems.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)}>Close</button>
            </header>

            <nav className={styles.menuTabs} aria-label="Player menu tabs">
              <button type="button" className={styles.activeMenuTab}>Inventory</button>
              <button type="button" disabled>Quests</button>
              <button type="button" disabled>Map</button>
              <button type="button" disabled>Settings</button>
            </nav>

            <div className={styles.statusGrid}>
              <div><span>Energy</span><strong>{currentSave.currencies.energy}/{currentSave.currencies.maxEnergy}</strong></div>
              <div><span>Gold</span><strong>{currentSave.currencies.gold}</strong></div>
              <div><span>Energy Snacks</span><strong>{supplyCounts?.energySnacks ?? 0}</strong></div>
              <div><span>Feed Stock</span><strong>{supplyCounts?.feed ?? 0}</strong></div>
            </div>

            <nav className={styles.categoryTabs} aria-label="Inventory categories">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeCategory === tab.id ? styles.activeCategoryTab : ""}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    setSelectedItemId(null);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <p className={styles.categoryHint}>{getInventoryHint(activeCategory)}</p>
            {message ? <p className={styles.message}>{message}</p> : null}

            <div className={styles.inventoryLayout}>
              <div className={styles.grid}>
                {filteredRows.length ? filteredRows.map((row) => (
                  <article key={row.item.itemId} className={`${styles.card} ${selectedRow?.item.itemId === row.item.itemId ? styles.selectedCard : ""}`}>
                    <button type="button" className={styles.cardSelectButton} onClick={() => setSelectedItemId(row.item.itemId)} aria-label={`View ${row.item.name} details`} />
                    <div className={styles.cardHeader}>
                      <img
                        src={row.item.iconPath}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_ITEM_ICON;
                        }}
                      />
                      <div>
                        <span>{row.storageLabel}</span>
                        <strong>{row.item.name}</strong>
                      </div>
                    </div>

                    <div>
                      <div className={styles.stockRow}>
                        <span>Stock</span>
                        <strong>{row.countLabel}</strong>
                      </div>
                      <p className={styles.description}>{row.usageLabel}</p>
                    </div>

                    {renderItemAction(row)}
                  </article>
                )) : (
                  <section className={styles.emptyState}>
                    <strong>No items in this category yet.</strong>
                    <p>Buy supplies at the Supply Depot or progress ranch systems to unlock more item types.</p>
                  </section>
                )}
              </div>

              {selectedRow ? (
                <aside className={styles.detailPanel} aria-label="Selected item details">
                  <img
                    src={selectedRow.item.iconPath}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_ITEM_ICON;
                    }}
                  />
                  <p className={styles.kicker}>Item Details</p>
                  <h3>{selectedRow.item.name}</h3>
                  <div className={styles.detailRows}>
                    <div><span>Category</span><strong>{selectedRow.item.category}</strong></div>
                    <div><span>Stored In</span><strong>{selectedRow.storageLabel}</strong></div>
                    <div><span>Current Stock</span><strong>{selectedRow.countLabel}</strong></div>
                  </div>
                  <p>{selectedRow.item.description}</p>
                  <p>{selectedRow.usageLabel}</p>
                </aside>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
