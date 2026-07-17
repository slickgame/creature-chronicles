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

type PlayerMenuTab = "inventory" | "ranch" | "creatures" | "quests" | "map" | "settings";
type InventoryCategory = "all" | "consumables" | "ranch" | "breeding" | "nursery" | "materials";
type InventoryRow = ReturnType<typeof getSupplyDepotUsageRows>[number];

const MENU_TABS: Array<{ id: PlayerMenuTab; label: string; disabled?: boolean }> = [
  { id: "inventory", label: "Inventory" },
  { id: "ranch", label: "Ranch Status" },
  { id: "creatures", label: "Creatures" },
  { id: "quests", label: "Quests", disabled: true },
  { id: "map", label: "Map", disabled: true },
  { id: "settings", label: "Settings", disabled: true },
];

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

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function getConditionLabel(damage: number): string {
  if (damage >= 80) return "Critical";
  if (damage >= 50) return "Damaged";
  if (damage >= 20) return "Worn";
  return "Good";
}

function getCreatureStatus(creature: { energy: number; maxEnergy: number; hearts: number; maxHearts: number; injuredUntilDayNumber?: number }, dayNumber: number): { label: string; hint: string; needsAttention: boolean } {
  if (creature.injuredUntilDayNumber && creature.injuredUntilDayNumber >= dayNumber) return { label: "Injured", hint: "Recovering from injury.", needsAttention: true };
  if (creature.hearts < creature.maxHearts) return { label: "Hurt", hint: "Missing hearts.", needsAttention: true };
  const ratio = creature.maxEnergy > 0 ? creature.energy / creature.maxEnergy : 0;
  if (ratio <= 0.25) return { label: "Exhausted", hint: "Very low energy.", needsAttention: true };
  if (ratio <= 0.6) return { label: "Tired", hint: "Could use rest or a snack.", needsAttention: true };
  if (ratio >= 1) return { label: "Rested", hint: "Full energy.", needsAttention: false };
  return { label: "Ready", hint: "Healthy enough for light work.", needsAttention: false };
}

export function PlayerInventoryMenu() {
  const {
    appScreen,
    currentSave,
    goToBreeding,
    goToEggAtelier,
    goToRanchJobs,
    goToRanchOffice,
    saveCurrentGame,
    useEnergySnack,
  } = useGameContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<PlayerMenuTab>("inventory");
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
  const materialsStock = supplyCounts?.materials ?? 0;
  const repairKitStock = supplyCounts?.repairKits ?? 0;
  const feedStock = supplyCounts?.feed ?? 0;
  const ranchDamage = getFlagNumber(currentSave.flags.ranchDamage);
  const ranchCondition = getConditionLabel(ranchDamage);
  const readyEggs = (currentSave.eggs ?? []).filter((egg) => String(egg.status).toLowerCase() === "ready").length;
  const activeEggs = (currentSave.eggs ?? []).filter((egg) => String(egg.status).toLowerCase() !== "hatched").length;
  const pregnancies = currentSave.pregnancies ?? [];
  const lowEnergyCreatures = creatureTargets.filter((creature) => creature.energy < Math.ceil(creature.maxEnergy * 0.35));
  const attentionCreatures = creatureTargets.filter((creature) => getCreatureStatus(creature, currentSave.dayState.dayNumber).needsAttention);
  const repairCostLabel = repairKitStock > 0 ? "1 Repair Kit" : "5 Materials";
  const repairReady = ranchDamage <= 0 ? "No repair needed" : repairKitStock > 0 || materialsStock >= 5 ? `Ready - uses ${repairCostLabel}` : "Need Repair Kit or 5 Materials";
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

  const plannerItems = [
    { label: "Feed Stock", value: `${feedStock} Feed`, state: feedStock <= 3 ? "warning" : "ok", detail: feedStock <= 3 ? "Low feed. Restock before sleeping if possible." : "Feed stock looks stable." },
    { label: "Ranch Condition", value: `${ranchCondition} (${ranchDamage}/100)`, state: ranchDamage >= 50 ? "warning" : "ok", detail: ranchDamage >= 50 ? `Repair recommended. ${repairReady}.` : "No major damage warning." },
    { label: "Creature Energy", value: `${lowEnergyCreatures.length} low`, state: lowEnergyCreatures.length ? "warning" : "ok", detail: lowEnergyCreatures.length ? `${lowEnergyCreatures.map((creature) => creature.nickname).slice(0, 3).join(", ")} need rest or snacks.` : "No creatures are critically low on energy." },
    { label: "Eggs", value: `${readyEggs} ready / ${activeEggs} active`, state: readyEggs ? "warning" : "ok", detail: readyEggs ? "Ready eggs can be handled in the Nursery." : "No ready eggs waiting." },
    { label: "Pregnancies", value: String(pregnancies.length), state: pregnancies.length ? "ok" : "neutral", detail: pregnancies.length ? "Active pregnancies are being tracked by the nursery system." : "No active pregnancies." },
    { label: "Chores", value: "Check board", state: "neutral", detail: "Assign helpers before sleeping to produce Feed, Materials, Security, or Upkeep." },
  ];

  function handleUseEnergySnack() {
    setMessage(useEnergySnack());
  }

  function handleUseCreatureEnergySnack(creatureId: string) {
    if (!currentSave) {
      setMessage("No active save.");
      return;
    }
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

  function renderInventoryTab() {
    return (
      <>
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
      </>
    );
  }

  function renderRanchStatusTab() {
    return (
      <section className={styles.tabPanel} aria-label="Ranch status planner">
        <div className={styles.statusGrid}>
          <div><span>Feed</span><strong>{feedStock}</strong></div>
          <div><span>Materials</span><strong>{materialsStock}</strong></div>
          <div><span>Repair Kits</span><strong>{repairKitStock}</strong></div>
          <div><span>Condition</span><strong>{ranchCondition} ({ranchDamage}/100)</strong></div>
          <div><span>Eggs</span><strong>{readyEggs} ready / {activeEggs} active</strong></div>
          <div><span>Needs Attention</span><strong>{attentionCreatures.length} creatures</strong></div>
        </div>
        <div className={styles.plannerGrid}>
          {plannerItems.map((item) => (
            <article key={item.label} className={`${styles.plannerCard} ${item.state === "warning" ? styles.warningPlannerCard : item.state === "ok" ? styles.okPlannerCard : ""}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <div className={styles.quickActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToRanchOffice)}>Open Ranch Office</button>
          <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToRanchJobs)}>Open Ranch Chores</button>
          <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToEggAtelier)}>Open Egg Atelier</button>
        </div>
      </section>
    );
  }

  function renderCreaturesTab() {
    return (
      <section className={styles.tabPanel} aria-label="Creature care list">
        <div className={styles.creatureCareHeader}>
          <div>
            <p className={styles.kicker}>Creature Care</p>
            <h3>Energy, Hearts, and Recovery</h3>
          </div>
          <strong>{energySnackStock} Energy Snack(s)</strong>
        </div>
        <div className={styles.creatureCareGrid}>
          {creatureTargets.length ? creatureTargets.map((creature) => {
            const status = getCreatureStatus(creature, currentSave.dayState.dayNumber);
            const canSnack = energySnackStock > 0 && creature.energy < creature.maxEnergy;
            return (
              <article key={creature.creatureId} className={`${styles.creatureCareCard} ${status.needsAttention ? styles.creatureNeedsAttention : ""}`}>
                <div>
                  <span>{creature.originLabel}</span>
                  <strong>{creature.nickname}</strong>
                  <p>{status.label} - {status.hint}</p>
                </div>
                <div className={styles.detailRows}>
                  <div><span>Energy</span><strong>{creature.energy}/{creature.maxEnergy}</strong></div>
                  <div><span>Hearts</span><strong>{creature.hearts}/{creature.maxHearts}</strong></div>
                  <div><span>Affection</span><strong>{creature.affection}</strong></div>
                </div>
                <button type="button" className={styles.actionButton} disabled={!canSnack} onClick={() => handleUseCreatureEnergySnack(creature.creatureId)}>
                  {canSnack ? "Use Energy Snack" : creature.energy >= creature.maxEnergy ? "Energy Full" : "Need Snack"}
                </button>
              </article>
            );
          }) : (
            <section className={styles.emptyState}>
              <strong>No creatures yet.</strong>
              <p>Adopt, hatch, or add creatures to begin ranch care.</p>
            </section>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      <button type="button" className={styles.menuButton} onClick={() => setIsOpen(true)}>
        Menu
      </button>

      {isOpen ? (
        <div className={styles.backdrop} role="presentation" onClick={() => setIsOpen(false)}>
          <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="player-menu-title" onClick={(event) => event.stopPropagation()}>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>Player Menu</p>
                <h2 id="player-menu-title">{MENU_TABS.find((tab) => tab.id === activeMenuTab)?.label ?? "Inventory"}</h2>
                <p className={styles.lead}>Inventory, ranch planning, and creature care are available from anywhere while a save is loaded.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)}>Close</button>
            </header>

            <nav className={styles.menuTabs} aria-label="Player menu tabs">
              {MENU_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeMenuTab === tab.id ? styles.activeMenuTab : ""}
                  disabled={tab.disabled}
                  onClick={() => setActiveMenuTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className={styles.statusGrid}>
              <div><span>Player Energy</span><strong>{currentSave.currencies.energy}/{currentSave.currencies.maxEnergy}</strong></div>
              <div><span>Gold</span><strong>{currentSave.currencies.gold}</strong></div>
              <div><span>Energy Snacks</span><strong>{energySnackStock}</strong></div>
              <div><span>Ranch</span><strong>{ranchCondition}</strong></div>
            </div>

            {message ? <p className={styles.message}>{message}</p> : null}
            {activeMenuTab === "inventory" ? renderInventoryTab() : null}
            {activeMenuTab === "ranch" ? renderRanchStatusTab() : null}
            {activeMenuTab === "creatures" ? renderCreaturesTab() : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
