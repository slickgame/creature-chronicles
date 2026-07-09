"use client";

import { useMemo, useState } from "react";
import {
  getSupplyDepotSupplyCounts,
  getSupplyDepotUsageRows,
  useSupplyDepotEnergySnackOnCreature,
} from "@/data/supplyDepot";
import { useGameContext } from "@/state/GameProvider";
import styles from "./PlayerInventoryMenu.module.css";

const FALLBACK_ITEM_ICON = "/images/ui/icons/icon_shop_bag.png";

type InventoryCategory = "all" | "consumables" | "ranch" | "breeding" | "nursery" | "materials";
type InventoryRow = ReturnType<typeof getSupplyDepotUsageRows>[number];

const CATEGORY_TABS: Array<{ id: InventoryCategory; label: string; hint: string }> = [
  { id: "all", label: "All", hint: "Everything currently tracked in player inventory and ranch storage." },
  { id: "consumables", label: "Consumables", hint: "Items used directly by the player or a selected creature." },
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
    saveCurrentGame,
    useEnergySnack,
  } = useGameContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>("energy_snack");
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [message, setMessage] = useState("Inventory shows purchased player items and ranch supplies. Items are used here or by their related systems.");

  const supplyRows = useMemo(() => (currentSave ? getSupplyDepotUsageRows(currentSave) : []), [currentSave]);
  const supplyCounts = useMemo(() => (currentSave ? getSupplyDepotSupplyCounts(currentSave) : null), [currentSave]);
  const filteredRows = useMemo(
    () => supplyRows.filter((row) => activeCategory === "all" || getRowCategory(row) === activeCategory),
    [activeCategory, supplyRows],
  );
  const creatureTargets = useMemo(
    () => [...(currentSave?.creatures ?? [])].sort((a, b) => a.nickname.localeCompare(b.nickname)),
    [currentSave],
  );
  const selectedCreature = creatureTargets.find((creature) => creature.creatureId === selectedCreatureId) ?? creatureTargets.find((creature) => creature.energy < creature.maxEnergy) ?? creatureTargets[0] ?? null;
  const selectedRow = supplyRows.find((row) => row.item.itemId === selectedItemId) ?? filteredRows[0] ?? null;

  if (!currentSave || appScreen === "main-menu") return null;

  const energySnackStock = supplyCounts?.energySnacks ?? 0;
  const playerSnackDisabledReason = energySnackStock <= 0
    ? "No Energy Snacks owned."
    : currentSave.currencies.energy >= currentSave.currencies.maxEnergy
      ? "Player energy is already full."
      : "Ready to use on player.";
  const creatureSnackDisabledReason = energySnackStock <= 0
    ? "No Energy Snacks owned."
    : !selectedCreature
      ? "No creature selected."
      : selectedCreature.energy >= selectedCreature.maxEnergy
        ? `${selectedCreature.nickname} is already at full energy.`
        : `Ready to use on ${selectedCreature.nickname}.`;
  const canUseSnackOnPlayer = playerSnackDisabledReason === "Ready to use on player.";
  const canUseSnackOnCreature = Boolean(selectedCreature) && creatureSnackDisabledReason.startsWith("Ready");

  function handleUseEnergySnack() {
    setMessage(useEnergySnack());
  }

  function handleUseCreatureEnergySnack(creatureId: string) {
    const result = useSupplyDepotEnergySnackOnCreature(currentSave, creatureId);
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function openRelatedSystem(action: () => void) {
    setIsOpen(false);
    action();
  }

  function renderEnergySnackActions() {
    return (
      <div className={styles.energySnackActions}>
        <div className={styles.actionStack}>
          <button type="button" className={styles.actionButton} disabled={!canUseSnackOnPlayer} onClick={handleUseEnergySnack}>
            Use on Player ({currentSave.currencies.energy}/{currentSave.currencies.maxEnergy})
          </button>
          <small>{playerSnackDisabledReason}</small>
        </div>

        <div className={styles.creatureSnackPanel}>
          <div className={styles.creatureSnackHeader}>
            <strong>Use on Creature</strong>
            <small>{creatureSnackDisabledReason}</small>
          </div>
          <div className={styles.creatureTargetList}>
            {creatureTargets.length ? creatureTargets.map((creature) => {
              const isSelected = creature.creatureId === selectedCreature?.creatureId;
              const isFull = creature.energy >= creature.maxEnergy;
              return (
                <button
                  key={creature.creatureId}
                  type="button"
                  className={isSelected ? styles.activeCreatureTarget : ""}
                  onClick={() => setSelectedCreatureId(creature.creatureId)}
                >
                  <span>{creature.nickname}</span>
                  <strong>{creature.energy}/{creature.maxEnergy}</strong>
                  <em>{isFull ? "Full" : "Can restore"}</em>
                </button>
              );
            }) : <p>No creatures available.</p>}
          </div>
          <button
            type="button"
            className={styles.actionButton}
            disabled={!selectedCreature || !canUseSnackOnCreature}
            onClick={() => selectedCreature ? handleUseCreatureEnergySnack(selectedCreature.creatureId) : undefined}
          >
            Use on {selectedCreature?.nickname ?? "Creature"}
          </button>
        </div>
      </div>
    );
  }

  function renderItemAction(row: InventoryRow) {
    if (row.item.itemId === "energy_snack") return renderEnergySnackActions();

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
                <p className={styles.lead}>Use player items here. Energy Snacks can target the player or one creature; other ranch supplies are spent by their relevant systems.</p>
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
              <div><span>Player Energy</span><strong>{currentSave.currencies.energy}/{currentSave.currencies.maxEnergy}</strong></div>
              <div><span>Gold</span><strong>{currentSave.currencies.gold}</strong></div>
              <div><span>Energy Snacks</span><strong>{energySnackStock}</strong></div>
              <div><span>Creatures</span><strong>{creatureTargets.length}</strong></div>
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
                  <article key={row.item.itemId} className={`${styles.card} ${selectedRow?.item.itemId === row.item.itemId ? styles.selectedCard : ""} ${row.item.itemId === "energy_snack" ? styles.energySnackCard : ""}`}>
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
                  {selectedRow.item.itemId === "energy_snack" && selectedCreature ? <p>Selected creature target: {selectedCreature.nickname} ({selectedCreature.energy}/{selectedCreature.maxEnergy} Energy).</p> : null}
                </aside>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
