"use client";

import { useMemo, useState } from "react";
import { getSupplyDepotSupplyCounts, getSupplyDepotUsageRows } from "@/data/supplyDepot";
import { useGameContext } from "@/state/GameProvider";
import styles from "./PlayerInventoryMenu.module.css";

const FALLBACK_ITEM_ICON = "/images/ui/icons/icon_shop_bag.png";

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
  const [message, setMessage] = useState("Inventory shows purchased player items and ranch supplies. Items are used here or by their related systems.");

  const supplyRows = useMemo(() => (currentSave ? getSupplyDepotUsageRows(currentSave) : []), [currentSave]);
  const supplyCounts = useMemo(() => (currentSave ? getSupplyDepotSupplyCounts(currentSave) : null), [currentSave]);

  if (!currentSave || appScreen === "main-menu") return null;

  const canUseSnack = Boolean(
    supplyCounts &&
    supplyCounts.energySnacks > 0 &&
    currentSave.currencies.energy < currentSave.currencies.maxEnergy,
  );

  function handleUseEnergySnack() {
    setMessage(useEnergySnack());
  }

  function openRelatedSystem(action: () => void) {
    setIsOpen(false);
    action();
  }

  function renderItemAction(itemId: string) {
    if (itemId === "energy_snack") {
      return (
        <button type="button" className={styles.actionButton} disabled={!canUseSnack} onClick={handleUseEnergySnack}>
          Use Energy Snack ({currentSave.currencies.energy}/{currentSave.currencies.maxEnergy})
        </button>
      );
    }

    if (itemId === "material_crate" || itemId === "repair_kit") {
      return <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToRanchOffice)}>Open Ranch Office</button>;
    }

    if (itemId === "fertility_tonic") {
      return <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToBreeding)}>Open Breeding Pen</button>;
    }

    if (itemId === "nursery_supply_kit") {
      return <button type="button" className={styles.secondaryButton} onClick={() => openRelatedSystem(goToEggAtelier)}>Open Egg Atelier</button>;
    }

    return null;
  }

  return (
    <>
      <button type="button" className={styles.inventoryButton} onClick={() => setIsOpen(true)}>
        Inventory
      </button>

      {isOpen ? (
        <div className={styles.backdrop} role="presentation" onClick={() => setIsOpen(false)}>
          <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="inventory-title" onClick={(event) => event.stopPropagation()}>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>Player Menu</p>
                <h2 id="inventory-title">Inventory</h2>
                <p className={styles.lead}>Use player items here. Ranch supplies remain visible here, but they are spent by their relevant ranch systems.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)}>Close</button>
            </header>

            <div className={styles.statusGrid}>
              <div><span>Energy</span><strong>{currentSave.currencies.energy}/{currentSave.currencies.maxEnergy}</strong></div>
              <div><span>Gold</span><strong>{currentSave.currencies.gold}</strong></div>
              <div><span>Energy Snacks</span><strong>{supplyCounts?.energySnacks ?? 0}</strong></div>
              <div><span>Feed Stock</span><strong>{supplyCounts?.feed ?? 0}</strong></div>
            </div>

            {message ? <p className={styles.message}>{message}</p> : null}

            <div className={styles.grid}>
              {supplyRows.map((row) => (
                <article key={row.item.itemId} className={styles.card}>
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

                  {renderItemAction(row.item.itemId)}
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
