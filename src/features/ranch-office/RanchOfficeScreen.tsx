"use client";

import { useMemo, useState } from "react";
import {
  RANCH_UPGRADE_ASSETS,
  RANCH_UPGRADE_DEFINITIONS,
  getNextRanchUpgradeTier,
  getRanchUpgradeCategoryLabel,
  getRanchUpgradeEffects,
  getRanchUpgrades,
  getTotalRanchUpgradeTiers,
} from "@/data/ranchUpgrades";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { RanchUpgradeCategory, RanchUpgradeId, RanchUpgradePurchaseSummary } from "@/types/ranchUpgrades";
import styles from "./RanchOfficeScreen.module.css";

const CATEGORIES: Array<{ id: RanchUpgradeCategory | "overview"; label: string; icon: string }> = [
  { id: "overview", label: "Ranch Overview", icon: RANCH_UPGRADE_ASSETS.ranchLedger },
  { id: "habitats", label: "Habitat Upgrades", icon: RANCH_UPGRADE_ASSETS.habitatCapacity },
  { id: "nursery", label: "Nursery Upgrades", icon: RANCH_UPGRADE_ASSETS.nurseryUpgrade },
  { id: "breeding", label: "Breeding Pen", icon: RANCH_UPGRADE_ASSETS.breedingPenUpgrade },
  { id: "recovery", label: "Sleep Recovery", icon: RANCH_UPGRADE_ASSETS.sleepRecovery },
];

function getCategoryFallbackUpgrade(category: RanchUpgradeCategory | "overview"): RanchUpgradeId {
  if (category === "habitats") return "feline_habitat_capacity";
  if (category === "nursery") return "nursery_egg_capacity";
  if (category === "breeding") return "breeding_pen_comfort";
  if (category === "recovery") return "sleep_recovery";
  return "feline_habitat_capacity";
}

export function RanchOfficeScreen() {
  const { buyRanchUpgrade, currentSave, goToMainMenu, goToRanch, version } = useGameContext();
  const [category, setCategory] = useState<RanchUpgradeCategory | "overview">("overview");
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<RanchUpgradeId>("feline_habitat_capacity");
  const [pendingUpgradeId, setPendingUpgradeId] = useState<RanchUpgradeId | null>(null);
  const [upgradeSummary, setUpgradeSummary] = useState<RanchUpgradePurchaseSummary | null>(null);
  const [message, setMessage] = useState("Welcome to the Ranch Office. Review your capacity, then purchase infrastructure upgrades.");

  const upgrades = currentSave ? getRanchUpgrades(currentSave) : null;
  const effects = currentSave ? getRanchUpgradeEffects(currentSave) : null;
  const totalUpgradeTiers = currentSave ? getTotalRanchUpgradeTiers(currentSave) : 0;

  const categoryUpgrades = useMemo(() => {
    if (category === "overview") return RANCH_UPGRADE_DEFINITIONS;
    return RANCH_UPGRADE_DEFINITIONS.filter((definition) => definition.category === category);
  }, [category]);

  const selectedUpgrade = useMemo(() => {
    const selected = categoryUpgrades.find((definition) => definition.upgradeId === selectedUpgradeId);
    return selected ?? RANCH_UPGRADE_DEFINITIONS.find((definition) => definition.upgradeId === getCategoryFallbackUpgrade(category)) ?? RANCH_UPGRADE_DEFINITIONS[0];
  }, [category, categoryUpgrades, selectedUpgradeId]);

  const pendingUpgrade = useMemo(
    () => (pendingUpgradeId ? RANCH_UPGRADE_DEFINITIONS.find((definition) => definition.upgradeId === pendingUpgradeId) ?? null : null),
    [pendingUpgradeId],
  );

  if (!currentSave || !upgrades || !effects) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before using the Ranch Office.</p>
          <button type="button" onClick={goToMainMenu}>Return to Main Menu</button>
        </section>
      </main>
    );
  }

  const felineUsed = currentSave.habitats?.find((habitat) => habitat.family === "feline")?.creatureIds.length ?? 0;
  const canineUsed = currentSave.habitats?.find((habitat) => habitat.family === "canine")?.creatureIds.length ?? 0;
  const activeEggs = (currentSave.eggs ?? []).filter((egg) => egg.status !== "hatched").length;
  const selectedUpgradeTier = upgrades[selectedUpgrade.upgradeId] ?? 0;
  const nextUpgradeTier = getNextRanchUpgradeTier(selectedUpgrade, selectedUpgradeTier);
  const currentUpgradeEffect = selectedUpgradeTier === 0 ? "Base ranch service" : selectedUpgrade.tiers.find((tier) => tier.tier === selectedUpgradeTier)?.effectLabel ?? "Base ranch service";
  const pendingUpgradeTier = pendingUpgrade ? upgrades[pendingUpgrade.upgradeId] ?? 0 : 0;
  const pendingNextTier = pendingUpgrade ? getNextRanchUpgradeTier(pendingUpgrade, pendingUpgradeTier) : null;

  function handleCategoryClick(nextCategory: RanchUpgradeCategory | "overview") {
    setCategory(nextCategory);
    setSelectedUpgradeId(getCategoryFallbackUpgrade(nextCategory));
  }

  function confirmUpgradePurchase() {
    if (!pendingUpgradeId) return;
    const result = buyRanchUpgrade(pendingUpgradeId);
    setMessage(result.message);
    setPendingUpgradeId(null);
    setUpgradeSummary(result.summary ?? null);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M11 Ranch Office</p>
            <h1>Ranch Office</h1>
            <p>Spend Gold and GP to expand habitats, add egg slots, improve breeding comfort, and improve overnight recovery.</p>
            <p className={styles.message}>{message}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.statBox}><img src={RANCH_UPGRADE_ASSETS.gold} alt="" /><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div>
            <div className={styles.statBox}><img src={RANCH_UPGRADE_ASSETS.gp} alt="" /><span>Guild Points</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div>
            <button type="button" onClick={goToRanch}>Back to Ranch</button>
            <button type="button" onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        <section className={styles.officeOverlay} aria-label="Ranch office upgrades">
          <aside className={`${styles.panel} ${styles.panelScrollable}`}>
            <h2>Ledger Tabs</h2>
            <div className={styles.filters}>
              {CATEGORIES.map((item) => (
                <button key={item.id} type="button" className={`${styles.filterButton} ${category === item.id ? styles.active : ""}`} onClick={() => handleCategoryClick(item.id)}>
                  <img src={item.icon} alt="" />{item.label}
                </button>
              ))}
            </div>

            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}><span>Total Upgrades</span><strong>{totalUpgradeTiers} tiers</strong></div>
              <div className={styles.overviewCard}><span>Feline Habitat</span><strong>{felineUsed} / {effects.felineCapacity}</strong></div>
              <div className={styles.overviewCard}><span>Canine Habitat</span><strong>{canineUsed} / {effects.canineCapacity}</strong></div>
              <div className={styles.overviewCard}><span>Egg Slots</span><strong>{activeEggs} / {effects.nurseryEggCapacity}</strong></div>
            </div>
          </aside>

          <section className={styles.panel}>
            <h2>{category === "overview" ? "All Ranch Upgrades" : getRanchUpgradeCategoryLabel(category)}</h2>
            <div className={styles.upgradeList}>
              {categoryUpgrades.map((definition) => {
                const currentTier = upgrades[definition.upgradeId] ?? 0;
                const nextTier = getNextRanchUpgradeTier(definition, currentTier);
                return (
                  <button key={definition.upgradeId} type="button" className={`${styles.upgradeButton} ${selectedUpgrade.upgradeId === definition.upgradeId ? styles.active : ""}`} onClick={() => setSelectedUpgradeId(definition.upgradeId)}>
                    <img src={definition.iconPath} alt="" />
                    <span><strong>{definition.name}</strong><span>Tier {currentTier} / {definition.maxTier}</span><em>{nextTier ? nextTier.effectLabel : "Max tier reached"}</em></span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className={styles.panel}>
            <div className={styles.detailBody}>
              <div><span className={styles.tier}>{selectedUpgrade.category} upgrade</span><h2 className={styles.contractTitle}>{selectedUpgrade.name}</h2><p>{selectedUpgrade.description}</p></div>
              <div className={styles.compareGrid}>
                <div><span className={styles.smallLabel}>Current</span><strong>Tier {selectedUpgradeTier}</strong><p>{currentUpgradeEffect}</p></div>
                <div><span className={styles.smallLabel}>Next</span><strong>{nextUpgradeTier ? `Tier ${nextUpgradeTier.tier}` : "Max"}</strong><p>{nextUpgradeTier?.effectLabel ?? "Fully upgraded"}</p></div>
              </div>
              <div className={styles.resourceBox}>
                <span className={styles.smallLabel}>Current Ranch Effects</span>
                <div className={styles.bonusList}>
                  <span>Feline capacity <strong>{effects.felineCapacity}</strong></span>
                  <span>Canine capacity <strong>{effects.canineCapacity}</strong></span>
                  <span>Egg capacity <strong>{effects.nurseryEggCapacity}</strong></span>
                  <span>Pregnancy bonus <strong>+{effects.breedingPregnancyBonus}%</strong></span>
                  <span>Breeding XP bonus <strong>+{effects.breedingXpBonus}</strong></span>
                  <span>Energy discount <strong>-{effects.breedingEnergyDiscount}</strong></span>
                  <span>Sleep energy bonus <strong>+{effects.sleepCreatureEnergyBonus}</strong></span>
                  <span>Sleep affection bonus <strong>+{effects.sleepAffectionBonus}</strong></span>
                </div>
              </div>
              <div className={styles.tierSteps} aria-label="Upgrade tier path">
                {[0, ...selectedUpgrade.tiers.map((tier) => tier.tier)].map((tier) => <span key={tier} className={tier <= selectedUpgradeTier ? styles.stepActive : ""}>{tier}</span>)}
              </div>
              <div className={styles.purchaseCard}>
                <div><span className={styles.smallLabel}>Purchase</span><strong>{nextUpgradeTier ? `Tier ${nextUpgradeTier.tier}` : "Max Tier"}</strong><p>{nextUpgradeTier ? `${formatGold(nextUpgradeTier.costGold)}${nextUpgradeTier.costGp ? ` + ${formatGuildPoints(nextUpgradeTier.costGp)}` : ""} • applies immediately` : "This upgrade is fully improved."}</p></div>
                <button type="button" className={styles.primaryButton} disabled={!nextUpgradeTier || currentSave.currencies.gold < (nextUpgradeTier?.costGold ?? 0) || currentSave.currencies.guildPoints < (nextUpgradeTier?.costGp ?? 0)} onClick={() => setPendingUpgradeId(selectedUpgrade.upgradeId)}>{nextUpgradeTier ? "Upgrade" : "Max Tier"}</button>
              </div>
            </div>
          </aside>
        </section>

        {pendingUpgrade && pendingNextTier ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setPendingUpgradeId(null)}>
            <section className={styles.resultModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <img src={pendingUpgrade.iconPath} alt="" />
              <p className={styles.kicker}>Confirm Ranch Upgrade</p>
              <h2>{pendingUpgrade.name}</h2>
              <p>Upgrade from Tier {pendingUpgradeTier} to Tier {pendingNextTier.tier}?</p>
              <div className={styles.resourceBox}>
                <span className={styles.smallLabel}>Cost</span>
                <div className={styles.resourceGrid}>
                  <div className={styles.resource}><img src={RANCH_UPGRADE_ASSETS.gold} alt="" /><div><span>Gold</span><strong>{pendingNextTier.costGold}</strong></div></div>
                  <div className={styles.resource}><img src={RANCH_UPGRADE_ASSETS.gp} alt="" /><div><span>GP</span><strong>{pendingNextTier.costGp ?? 0}</strong></div></div>
                </div>
              </div>
              <div className={styles.resourceBox}><span className={styles.smallLabel}>New Effect</span><strong>{pendingNextTier.effectLabel}</strong><p>Ranch effects apply immediately.</p></div>
              <div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={() => setPendingUpgradeId(null)}>Cancel</button><button type="button" className={styles.primaryButton} onClick={confirmUpgradePurchase}>Confirm Upgrade</button></div>
            </section>
          </div>
        ) : null}

        {upgradeSummary ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setUpgradeSummary(null)}>
            <section className={styles.resultModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <img src={RANCH_UPGRADE_ASSETS.ranchUpgrade} alt="" />
              <p className={styles.kicker}>Upgrade Complete</p>
              <h2>{upgradeSummary.upgradeName}</h2>
              <div className={styles.resultGrid}><span>Tier</span><strong>{upgradeSummary.oldTier} → {upgradeSummary.newTier}</strong><span>Effect</span><strong>{upgradeSummary.effectLabel}</strong><span>Spent</span><strong>{upgradeSummary.costGold} Gold • {upgradeSummary.costGp} GP</strong><span>Remaining</span><strong>{upgradeSummary.remainingGold} Gold • {upgradeSummary.remainingGp} GP</strong></div>
              <p className={styles.message}>{upgradeSummary.immediateEffectLabel}</p>
              <button type="button" className={styles.primaryButton} onClick={() => setUpgradeSummary(null)}>Continue</button>
            </section>
          </div>
        ) : null}

        <footer className={styles.versionFooter}>{version}</footer>
      </section>
    </main>
  );
}
