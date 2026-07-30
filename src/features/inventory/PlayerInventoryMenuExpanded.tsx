"use client";

import { useMemo, useState } from "react";
import {
  getBreedingSupportItem,
  getBreedingSupportItemActiveCount,
  getBreedingSupportItemCount,
  getRecentItemUseHistory,
  useBreedingSupportItem,
} from "@/data/breedingItems";
import {
  getSupplyDepotSupplyCounts,
  getSupplyDepotUsageRows,
} from "@/data/supplyDepot";
import { useGameContext } from "@/state/GameProvider";
import type { BreedingSupportItemId } from "@/types/items";
import styles from "./PlayerInventoryMenu.module.css";
import extra from "./PlayerInventoryMenuExpanded.module.css";

const FALLBACK_ITEM_ICON = "/images/ui/icons/icon_shop_bag.png";

type PlayerMenuTab = "inventory" | "ranch" | "creatures" | "history" | "quests" | "map" | "settings";
type InventoryCategory = "all" | "consumables" | "care" | "breeding" | "pregnancy" | "ranch" | "nursery" | "materials";
type InventoryRow = ReturnType<typeof getSupplyDepotUsageRows>[number];

type PendingUse = {
  itemId: BreedingSupportItemId;
  targetId?: string;
};

const MENU_TABS: Array<{ id: PlayerMenuTab; label: string; disabled?: boolean }> = [
  { id: "inventory", label: "Inventory" },
  { id: "ranch", label: "Ranch Status" },
  { id: "creatures", label: "Creatures" },
  { id: "history", label: "Item History" },
  { id: "quests", label: "Quests", disabled: true },
  { id: "map", label: "Map", disabled: true },
  { id: "settings", label: "Settings", disabled: true },
];

const CATEGORY_TABS: Array<{ id: InventoryCategory; label: string; hint: string }> = [
  { id: "all", label: "All", hint: "Everything currently tracked in player inventory and ranch storage." },
  { id: "consumables", label: "Energy", hint: "Energy items can be used directly on the player or one creature." },
  { id: "care", label: "Care", hint: "Affection and recovery items target one creature." },
  { id: "breeding", label: "Breeding", hint: "Breeding support items are armed before an attempt or successful conception." },
  { id: "pregnancy", label: "Pregnancy", hint: "Pregnancy-care items target one active pregnancy." },
  { id: "ranch", label: "Ranch Supplies", hint: "Feed, repair, and general ranch-operation items." },
  { id: "nursery", label: "Nursery", hint: "Items consumed by Egg Atelier and nursery systems." },
  { id: "materials", label: "Materials", hint: "Construction and repair resources." },
];

function getRowCategory(row: InventoryRow): InventoryCategory {
  if (row.item.category === "Energy") return "consumables";
  if (row.item.category === "Care") return "care";
  if (row.item.category === "Breeding") return "breeding";
  if (row.item.category === "Pregnancy") return "pregnancy";
  if (row.item.itemId === "nursery_supply_kit") return "nursery";
  if (row.item.itemId === "material_crate") return "materials";
  return "ranch";
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

function isSupportItem(itemId: string): itemId is BreedingSupportItemId {
  return Boolean(getBreedingSupportItem(itemId));
}

function getCreatureStatus(
  creature: { energy: number; maxEnergy: number; hearts: number; maxHearts: number; injuredUntilDayNumber?: number },
  dayNumber: number,
) {
  if (creature.injuredUntilDayNumber && creature.injuredUntilDayNumber >= dayNumber) {
    return { label: "Injured", hint: "Recovering from injury.", needsAttention: true };
  }
  if (creature.hearts < creature.maxHearts) return { label: "Hurt", hint: "Missing Hearts.", needsAttention: true };
  const ratio = creature.maxEnergy > 0 ? creature.energy / creature.maxEnergy : 0;
  if (ratio <= 0.25) return { label: "Exhausted", hint: "Very low Energy.", needsAttention: true };
  if (ratio <= 0.6) return { label: "Tired", hint: "Could use rest or an Energy item.", needsAttention: true };
  if (ratio >= 1) return { label: "Rested", hint: "Full Energy.", needsAttention: false };
  return { label: "Ready", hint: "Healthy enough for light work.", needsAttention: false };
}

function localTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US");
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
  } = useGameContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<PlayerMenuTab>("inventory");
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>("energy_snack");
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [selectedPregnancyId, setSelectedPregnancyId] = useState<string | null>(null);
  const [pendingUse, setPendingUse] = useState<PendingUse | null>(null);
  const [message, setMessage] = useState("Inventory items show exact effects, current stock, targets, and active breeding support.");

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
  const pregnancies = useMemo(
    () => (currentSave?.pregnancies ?? []).filter((pregnancy) => pregnancy.status === "pregnant"),
    [currentSave],
  );
  const history = useMemo(
    () => (currentSave ? getRecentItemUseHistory(currentSave, 100) : []),
    [currentSave],
  );
  const selectedCreature = creatureTargets.find((creature) => creature.creatureId === selectedCreatureId) ?? creatureTargets[0] ?? null;
  const selectedPregnancy = pregnancies.find((pregnancy) => pregnancy.pregnancyId === selectedPregnancyId) ?? pregnancies[0] ?? null;
  const selectedRow = supplyRows.find((row) => row.item.itemId === selectedItemId) ?? filteredRows[0] ?? null;

  if (!currentSave || appScreen === "main-menu") return null;
  const save = currentSave;

  const energySnackStock = supplyCounts?.energySnacks ?? 0;
  const energyMealStock = supplyCounts?.energyMeals ?? 0;
  const materialsStock = supplyCounts?.materials ?? 0;
  const repairKitStock = supplyCounts?.repairKits ?? 0;
  const feedStock = supplyCounts?.feed ?? 0;
  const ranchDamage = getFlagNumber(save.flags.ranchDamage);
  const ranchCondition = getConditionLabel(ranchDamage);
  const readyEggs = (save.eggs ?? []).filter((egg) => egg.status === "ready").length;
  const activeEggs = (save.eggs ?? []).filter((egg) => egg.status !== "hatched").length;
  const lowEnergyCreatures = creatureTargets.filter((creature) => creature.energy < Math.ceil(creature.maxEnergy * 0.35));
  const attentionCreatures = creatureTargets.filter((creature) => getCreatureStatus(creature, save.dayState.dayNumber).needsAttention);

  function openRelatedSystem(action: () => void) {
    setIsOpen(false);
    action();
  }

  function executeUse(itemId: BreedingSupportItemId, targetId?: string) {
    const result = useBreedingSupportItem(save, itemId, {
      source: "inventory",
      targetId,
    });
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    setPendingUse(null);
  }

  function requestUse(itemId: BreedingSupportItemId, targetId?: string) {
    const item = getBreedingSupportItem(itemId);
    if (!item) return;
    if (item.confirmationRequired) {
      setPendingUse({ itemId, targetId });
      return;
    }
    executeUse(itemId, targetId);
  }

  function renderSupportAction(row: InventoryRow) {
    if (!isSupportItem(row.item.itemId)) return null;
    const item = getBreedingSupportItem(row.item.itemId)!;
    const owned = getBreedingSupportItemCount(save, item.itemId);
    const active = getBreedingSupportItemActiveCount(save, item.itemId);

    if (item.target === "player-or-creature") {
      return (
        <div className={extra.targetPanel}>
          <label>
            <span>Creature Target</span>
            <select value={selectedCreature?.creatureId ?? ""} onChange={(event) => setSelectedCreatureId(event.target.value)}>
              {creatureTargets.map((creature) => (
                <option key={creature.creatureId} value={creature.creatureId}>
                  {creature.nickname} — {creature.energy}/{creature.maxEnergy} Energy
                </option>
              ))}
            </select>
          </label>
          <div className={extra.actionGrid}>
            <button
              type="button"
              className={styles.actionButton}
              disabled={owned <= 0 || save.currencies.energy >= save.currencies.maxEnergy}
              onClick={() => requestUse(item.itemId, "player")}
            >
              Use on Player
            </button>
            <button
              type="button"
              className={styles.actionButton}
              disabled={owned <= 0 || !selectedCreature || selectedCreature.energy >= selectedCreature.maxEnergy}
              onClick={() => requestUse(item.itemId, selectedCreature?.creatureId)}
            >
              Use on {selectedCreature?.nickname ?? "Creature"}
            </button>
          </div>
        </div>
      );
    }

    if (item.target === "creature") {
      const usable = item.itemId === "affection_treat"
        ? Boolean(selectedCreature && selectedCreature.affection < 100)
        : Boolean(selectedCreature && (
            selectedCreature.hearts < selectedCreature.maxHearts ||
            (selectedCreature.injuredUntilDayNumber ?? 0) >= save.dayState.dayNumber
          ));
      return (
        <div className={extra.targetPanel}>
          <label>
            <span>Creature Target</span>
            <select value={selectedCreature?.creatureId ?? ""} onChange={(event) => setSelectedCreatureId(event.target.value)}>
              {creatureTargets.map((creature) => (
                <option key={creature.creatureId} value={creature.creatureId}>
                  {creature.nickname} — Affection {creature.affection} · Hearts {creature.hearts}/{creature.maxHearts}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={styles.actionButton}
            disabled={owned <= 0 || !usable}
            onClick={() => requestUse(item.itemId, selectedCreature?.creatureId)}
          >
            Use on {selectedCreature?.nickname ?? "Creature"}
          </button>
        </div>
      );
    }

    if (item.target === "pregnancy") {
      return (
        <div className={extra.targetPanel}>
          <label>
            <span>Active Pregnancy</span>
            <select value={selectedPregnancy?.pregnancyId ?? ""} onChange={(event) => setSelectedPregnancyId(event.target.value)}>
              {pregnancies.length ? pregnancies.map((pregnancy) => (
                <option key={pregnancy.pregnancyId} value={pregnancy.pregnancyId}>
                  {pregnancy.receiver.displayName} — {pregnancy.daysRemaining} day(s) remaining
                </option>
              )) : <option value="">No active pregnancies</option>}
            </select>
          </label>
          <button
            type="button"
            className={styles.actionButton}
            disabled={owned <= 0 || !selectedPregnancy || selectedPregnancy.daysRemaining <= 1}
            onClick={() => requestUse(item.itemId, selectedPregnancy?.pregnancyId)}
          >
            Use on {selectedPregnancy?.receiver.displayName ?? "Pregnancy"}
          </button>
        </div>
      );
    }

    return (
      <div className={extra.detailActionStack}>
        <button
          type="button"
          className={styles.actionButton}
          disabled={owned <= 0 || active > 0}
          onClick={() => requestUse(item.itemId)}
        >
          {active > 0 ? "Already Armed" : `Arm ${item.name}`}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToBreeding)}>
          Open Breeding Pen
        </button>
      </div>
    );
  }

  function renderItemAction(row: InventoryRow) {
    const supportAction = renderSupportAction(row);
    if (supportAction) return supportAction;
    if (row.item.itemId === "material_crate" || row.item.itemId === "repair_kit") {
      return <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToRanchOffice)}>Open Ranch Office</button>;
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
        <p className={styles.categoryHint}>{CATEGORY_TABS.find((tab) => tab.id === activeCategory)?.hint}</p>

        <div className={styles.inventoryLayout}>
          <div className={styles.grid}>
            {filteredRows.map((row) => {
              const supportItem = getBreedingSupportItem(row.item.itemId);
              return (
                <article
                  key={row.item.itemId}
                  className={`${styles.card} ${selectedRow?.item.itemId === row.item.itemId ? styles.selectedCard : ""}`}
                  data-ui-text-box="auto"
                >
                  <button type="button" className={styles.cardSelectButton} onClick={() => setSelectedItemId(row.item.itemId)} aria-label={`View ${row.item.name} details`} />
                  <div className={styles.cardHeader}>
                    <img src={row.item.iconPath} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_ITEM_ICON; }} />
                    <div>
                      <span>{row.storageLabel}</span>
                      <strong>{row.item.name}</strong>
                      <div className={extra.itemMeta}>
                        <span className={extra.rarity} data-rarity={row.item.rarity}>{row.item.rarity}</span>
                        {row.activeLabel ? <span className={extra.armed}>{row.activeLabel}</span> : null}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.stockRow}><span>Owned</span><strong>{row.countLabel}</strong></div>
                    <p className={styles.description}>{supportItem?.description ?? row.item.description}</p>
                    <p className={extra.exactEffect}>{row.item.exactEffect}</p>
                  </div>
                  {renderItemAction(row)}
                </article>
              );
            })}
          </div>

          {selectedRow ? (
            <aside className={styles.detailPanel} aria-label="Selected item details" data-ui-text-box="auto">
              <img src={selectedRow.item.iconPath} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_ITEM_ICON; }} />
              <p className={styles.kicker}>Item Details</p>
              <h3>{selectedRow.item.name}</h3>
              <div className={extra.itemMeta}>
                <span className={extra.rarity} data-rarity={selectedRow.item.rarity}>{selectedRow.item.rarity}</span>
                {selectedRow.activeLabel ? <span className={extra.armed}>{selectedRow.activeLabel}</span> : null}
              </div>
              <div className={styles.detailRows}>
                <div><span>Category</span><strong>{selectedRow.item.category}</strong></div>
                <div><span>Stored In</span><strong>{selectedRow.storageLabel}</strong></div>
                <div><span>Current Stock</span><strong>{selectedRow.countLabel}</strong></div>
              </div>
              <p>{selectedRow.item.description}</p>
              <p className={extra.exactEffect}>{selectedRow.item.exactEffect}</p>
              {selectedRow.item.confirmationRequired ? <p className={extra.warning}>Rare-item confirmation is required before this item is consumed or armed.</p> : null}
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
          <article className={`${styles.plannerCard} ${feedStock <= 3 ? styles.warningPlannerCard : styles.okPlannerCard}`}><span>Feed Stock</span><strong>{feedStock} Feed</strong><p>{feedStock <= 3 ? "Low feed. Restock before sleeping." : "Feed stock looks stable."}</p></article>
          <article className={`${styles.plannerCard} ${lowEnergyCreatures.length ? styles.warningPlannerCard : styles.okPlannerCard}`}><span>Creature Energy</span><strong>{lowEnergyCreatures.length} low</strong><p>{lowEnergyCreatures.length ? `${lowEnergyCreatures.slice(0, 3).map((creature) => creature.nickname).join(", ")} need rest or Energy items.` : "No creatures are critically low on Energy."}</p></article>
          <article className={styles.plannerCard}><span>Active Pregnancies</span><strong>{pregnancies.length}</strong><p>{pregnancies.length ? "Pregnancy-care items are available from Inventory." : "No active pregnancy targets."}</p></article>
          <article className={styles.plannerCard}><span>Energy Items</span><strong>{energySnackStock + energyMealStock}</strong><p>{energySnackStock} Snacks and {energyMealStock} Meals owned.</p></article>
        </div>
        <div className={styles.quickActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToRanchOffice)}>Open Ranch Office</button>
          <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToRanchJobs)}>Open Ranch Chores</button>
          <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToEggAtelier)}>Open Egg Atelier</button>
          <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToBreeding)}>Open Breeding Pen</button>
        </div>
      </section>
    );
  }

  function renderCreaturesTab() {
    return (
      <section className={styles.tabPanel} aria-label="Creature care list">
        <div className={styles.creatureCareHeader}>
          <div><p className={styles.kicker}>Creature Care</p><h3>Energy, Hearts, Affection, and Recovery</h3></div>
          <strong>{energySnackStock + energyMealStock} Energy Item(s)</strong>
        </div>
        <div className={styles.creatureCareGrid}>
          {creatureTargets.map((creature) => {
            const status = getCreatureStatus(creature, save.dayState.dayNumber);
            return (
              <article key={creature.creatureId} className={`${styles.creatureCareCard} ${status.needsAttention ? styles.creatureNeedsAttention : ""}`} data-ui-text-box="auto">
                <div><span>{creature.originLabel}</span><strong>{creature.nickname}</strong><p>{status.label} — {status.hint}</p></div>
                <div className={styles.detailRows}>
                  <div><span>Energy</span><strong>{creature.energy}/{creature.maxEnergy}</strong></div>
                  <div><span>Hearts</span><strong>{creature.hearts}/{creature.maxHearts}</strong></div>
                  <div><span>Affection</span><strong>{creature.affection}</strong></div>
                </div>
                <button type="button" className={styles.secondaryButton} onClick={() => { setActiveMenuTab("inventory"); setActiveCategory("care"); setSelectedCreatureId(creature.creatureId); setSelectedItemId("affection_treat"); }}>
                  Open Care Items
                </button>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  function renderHistoryTab() {
    return (
      <section className={styles.tabPanel} aria-label="Item use history">
        <div className={styles.creatureCareHeader}>
          <div><p className={styles.kicker}>Item Use Ledger</p><h3>Recent Consumptions and Armed Effects</h3></div>
          <strong>{history.length} Record(s)</strong>
        </div>
        {history.length ? (
          <div className={extra.historyList}>
            {history.map((record) => (
              <article key={record.itemUseId} className={extra.historyCard} data-ui-text-box="auto">
                <div>
                  <strong>{record.itemName}</strong>
                  <span>{record.rarity} · {record.source.replace("-", " ")}</span>
                  <small>Ranch Day {record.dayNumber}</small>
                </div>
                <p>{record.effectSummary}{record.targetName ? ` Target: ${record.targetName}.` : ""}</p>
                <time dateTime={record.usedAt}>{localTimestamp(record.usedAt)}</time>
              </article>
            ))}
          </div>
        ) : <div className={extra.emptyHistory}>No item-use records yet. Purchases are not counted; records appear when an item is consumed or armed.</div>}
      </section>
    );
  }

  const armedItems = ["fertility_tonic", "trait_stabilizer", "mutation_catalyst"] as BreedingSupportItemId[];

  return (
    <>
      <button type="button" className={styles.menuButton} onClick={() => setIsOpen(true)}>Menu</button>

      {isOpen ? (
        <div className={styles.backdrop} role="presentation" onClick={() => setIsOpen(false)}>
          <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="player-menu-title" onClick={(event) => event.stopPropagation()}>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>Player Menu</p>
                <h2 id="player-menu-title">{MENU_TABS.find((tab) => tab.id === activeMenuTab)?.label ?? "Inventory"}</h2>
                <p className={styles.lead}>Inventory, ranch planning, creature care, and item history are available from anywhere while a save is loaded.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)}>Close</button>
            </header>

            <nav className={styles.menuTabs} aria-label="Player menu tabs">
              {MENU_TABS.map((tab) => (
                <button key={tab.id} type="button" className={activeMenuTab === tab.id ? styles.activeMenuTab : ""} disabled={tab.disabled} onClick={() => setActiveMenuTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className={styles.statusGrid}>
              <div><span>Player Energy</span><strong>{save.currencies.energy}/{save.currencies.maxEnergy}</strong></div>
              <div><span>Gold</span><strong>{save.currencies.gold.toLocaleString("en-US")}</strong></div>
              <div><span>Energy Items</span><strong>{energySnackStock + energyMealStock}</strong></div>
              <div><span>Armed Support</span><strong>{armedItems.filter((itemId) => getBreedingSupportItemActiveCount(save, itemId) > 0).length}</strong></div>
            </div>

            {armedItems.some((itemId) => getBreedingSupportItemActiveCount(save, itemId) > 0) ? (
              <div className={extra.activeSummary} data-ui-text-box="auto">
                {armedItems.filter((itemId) => getBreedingSupportItemActiveCount(save, itemId) > 0).map((itemId) => (
                  <div key={itemId}><span>{getBreedingSupportItem(itemId)?.name}</span><strong>Armed</strong></div>
                ))}
              </div>
            ) : null}

            {message ? <p className={styles.message}>{message}</p> : null}
            {activeMenuTab === "inventory" ? renderInventoryTab() : null}
            {activeMenuTab === "ranch" ? renderRanchStatusTab() : null}
            {activeMenuTab === "creatures" ? renderCreaturesTab() : null}
            {activeMenuTab === "history" ? renderHistoryTab() : null}
          </section>
        </div>
      ) : null}

      {pendingUse ? (
        <div className={extra.confirmationBackdrop} role="presentation" onClick={() => setPendingUse(null)}>
          <section className={extra.confirmation} role="dialog" aria-modal="true" aria-label="Confirm rare item use" onClick={(event) => event.stopPropagation()}>
            <p className={styles.kicker}>Rare Item Confirmation</p>
            <h3>Use {getBreedingSupportItem(pendingUse.itemId)?.name}?</h3>
            <p>{getBreedingSupportItem(pendingUse.itemId)?.exactEffect}</p>
            <p className={extra.warning}>This consumes one owned item immediately. Armed conception items remain active through failed attempts but cannot be returned to inventory.</p>
            <div className={extra.confirmationActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setPendingUse(null)}>Cancel</button>
              <button type="button" className={styles.actionButton} onClick={() => executeUse(pendingUse.itemId, pendingUse.targetId)}>Confirm Use</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
