"use client";

import { useMemo, useState } from "react";
import {
  RANCH_REPAIR_DAMAGE_AMOUNT,
  RANCH_REPAIR_MATERIAL_COST,
  RANCH_UPGRADE_ASSETS,
  RANCH_UPGRADE_DEFINITIONS,
  getNextRanchUpgradeTier,
  getRanchConditionLabelFromDamage,
  getRanchUpgradeCategoryLabel,
  getRanchUpgradeEffects,
  getRanchUpgrades,
  getTotalRanchUpgradeTiers,
} from "@/data/ranchUpgrades";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureFamily } from "@/types/creature";
import type { RanchUpgradeCategory, RanchUpgradeId, RanchUpgradePurchaseSummary } from "@/types/ranchUpgrades";
import styles from "./RanchOfficeScreen.module.css";

const OFFICE_CATEGORY_KEY = "creature-chronicles-ranch-office-category-v1";
const OFFICE_UPGRADE_KEY = "creature-chronicles-ranch-office-upgrade-v1";

const CATEGORIES: Array<{ id: RanchUpgradeCategory | "overview"; label: string; icon: string }> = [
  { id: "overview", label: "Ranch Overview", icon: RANCH_UPGRADE_ASSETS.ranchLedger },
  { id: "habitats", label: "Habitat Upgrades", icon: RANCH_UPGRADE_ASSETS.habitatCapacity },
  { id: "nursery", label: "Nursery Upgrades", icon: RANCH_UPGRADE_ASSETS.nurseryUpgrade },
  { id: "breeding", label: "Breeding Pen", icon: RANCH_UPGRADE_ASSETS.breedingPenUpgrade },
  { id: "chores", label: "Chores Board", icon: RANCH_UPGRADE_ASSETS.choresBoard },
  { id: "recovery", label: "Sleep Recovery", icon: RANCH_UPGRADE_ASSETS.sleepRecovery },
];

const CONDITION_RULES = [
  { label: "Good", range: "0–19 damage", penalty: "No penalty" },
  { label: "Worn", range: "20–49 damage", penalty: "-5% sleep recovery" },
  { label: "Damaged", range: "50–79 damage", penalty: "-15% recovery, -1 affection" },
  { label: "Critical", range: "80–100 damage", penalty: "-25% recovery, -2 affection" },
];

const HABITAT_LABELS: Record<CreatureFamily, string> = {
  feline: "Feline Habitat",
  canine: "Canine Habitat",
  bovine: "Bovine Habitat",
  lapine: "Lapine Habitat",
  equine: "Equine Habitat",
};

function isUpgradeCategory(value: string | null): value is RanchUpgradeCategory | "overview" {
  return value === "overview" || value === "habitats" || value === "nursery" || value === "breeding" || value === "chores" || value === "recovery";
}

function isUpgradeId(value: string | null): value is RanchUpgradeId {
  return Boolean(value && RANCH_UPGRADE_DEFINITIONS.some((definition) => definition.upgradeId === value));
}

function readInitialOfficeUpgrade(): RanchUpgradeId {
  if (typeof window === "undefined") return "feline_habitat_capacity";
  const storedUpgrade = window.localStorage.getItem(OFFICE_UPGRADE_KEY);
  return isUpgradeId(storedUpgrade) ? storedUpgrade : "feline_habitat_capacity";
}

function readInitialOfficeCategory(): RanchUpgradeCategory | "overview" {
  if (typeof window === "undefined") return "overview";
  const storedUpgrade = window.localStorage.getItem(OFFICE_UPGRADE_KEY);
  if (isUpgradeId(storedUpgrade)) return RANCH_UPGRADE_DEFINITIONS.find((definition) => definition.upgradeId === storedUpgrade)?.category ?? "overview";
  const storedCategory = window.localStorage.getItem(OFFICE_CATEGORY_KEY);
  return isUpgradeCategory(storedCategory) ? storedCategory : "overview";
}

function rememberOfficeTarget(category: RanchUpgradeCategory | "overview", upgradeId?: RanchUpgradeId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OFFICE_CATEGORY_KEY, category);
  if (upgradeId) window.localStorage.setItem(OFFICE_UPGRADE_KEY, upgradeId);
}

function getCategoryFallbackUpgrade(category: RanchUpgradeCategory | "overview"): RanchUpgradeId {
  if (category === "habitats") return "feline_habitat_capacity";
  if (category === "nursery") return "nursery_egg_capacity";
  if (category === "breeding") return "breeding_pen_comfort";
  if (category === "chores") return "ranch_chores_board";
  if (category === "recovery") return "sleep_recovery";
  return "feline_habitat_capacity";
}

function getFlagNumber(value: boolean | number | string | undefined): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function formatMaterials(value: number): string { return `${value} Materials`; }
function formatUpgradeCost(costGold: number, costGp = 0, costMaterials = 0): string { return `${formatGold(costGold)}${costGp ? ` + ${formatGuildPoints(costGp)}` : ""}${costMaterials ? ` + ${formatMaterials(costMaterials)}` : ""}`; }
function readRanchEventLog(value: boolean | number | string | undefined): string[] { try { const parsed = JSON.parse(String(value ?? "[]")); return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []; } catch { return []; } }
function formatPercentModifier(value: number): string { if (value > 0) return `+${value}%`; if (value < 0) return `${value}%`; return "0%"; }
function formatBreedingEnergyModifier(value: number): string { if (value > 0) return `-${value} energy`; if (value < 0) return `+${Math.abs(value)} energy cost`; return "0"; }
function formatDiscount(value: number): string { return value > 0 ? `-${value}` : "0"; }

export function RanchOfficeScreen() {
  const { buyRanchUpgrade, currentSave, goToMainMenu, goToRanch, repairRanch, version } = useGameContext();
  const [category, setCategory] = useState<RanchUpgradeCategory | "overview">(readInitialOfficeCategory);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<RanchUpgradeId>(readInitialOfficeUpgrade);
  const [pendingUpgradeId, setPendingUpgradeId] = useState<RanchUpgradeId | null>(null);
  const [upgradeSummary, setUpgradeSummary] = useState<RanchUpgradePurchaseSummary | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState("Welcome to the Ranch Office. Use Overview for repairs/history, or choose a system tab to upgrade one ranch service.");

  const upgrades = currentSave ? getRanchUpgrades(currentSave) : null;
  const effects = currentSave ? getRanchUpgradeEffects(currentSave) : null;
  const totalUpgradeTiers = currentSave ? getTotalRanchUpgradeTiers(currentSave) : 0;
  const categoryUpgrades = useMemo(() => (category === "overview" ? [] : RANCH_UPGRADE_DEFINITIONS.filter((definition) => definition.category === category)), [category]);
  const selectedUpgrade = useMemo(() => categoryUpgrades.find((definition) => definition.upgradeId === selectedUpgradeId) ?? RANCH_UPGRADE_DEFINITIONS.find((definition) => definition.upgradeId === getCategoryFallbackUpgrade(category)) ?? RANCH_UPGRADE_DEFINITIONS[0], [category, categoryUpgrades, selectedUpgradeId]);
  const pendingUpgrade = useMemo(() => (pendingUpgradeId ? RANCH_UPGRADE_DEFINITIONS.find((definition) => definition.upgradeId === pendingUpgradeId) ?? null : null), [pendingUpgradeId]);

  if (!currentSave || !upgrades || !effects) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before using the Ranch Office.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  const materialsStock = getFlagNumber(currentSave.flags.ranchMaterialsStock);
  const ranchDamage = Math.min(100, getFlagNumber(currentSave.flags.ranchDamage));
  const ranchCondition = getRanchConditionLabelFromDamage(ranchDamage);
  const currentConditionRule = CONDITION_RULES.find((rule) => rule.label === ranchCondition) ?? CONDITION_RULES[0];
  const ranchHistory = readRanchEventLog(currentSave.flags.ranchEventLog);
  const canRepairRanch = ranchDamage > 0 && materialsStock >= RANCH_REPAIR_MATERIAL_COST;
  const usedByFamily = (family: CreatureFamily) => currentSave.habitats?.find((habitat) => habitat.family === family)?.creatureIds.length ?? 0;
  const activeEggs = (currentSave.eggs ?? []).filter((egg) => egg.status !== "hatched").length;
  const selectedUpgradeTier = upgrades[selectedUpgrade.upgradeId] ?? 0;
  const nextUpgradeTier = getNextRanchUpgradeTier(selectedUpgrade, selectedUpgradeTier);
  const currentUpgradeEffect = selectedUpgradeTier === 0 ? "Base ranch service" : selectedUpgrade.tiers.find((tier) => tier.tier === selectedUpgradeTier)?.effectLabel ?? "Base ranch service";
  const pendingUpgradeTier = pendingUpgrade ? upgrades[pendingUpgrade.upgradeId] ?? 0 : 0;
  const pendingNextTier = pendingUpgrade ? getNextRanchUpgradeTier(pendingUpgrade, pendingUpgradeTier) : null;
  const nextCostGp = nextUpgradeTier?.costGp ?? 0;
  const nextCostMaterials = nextUpgradeTier?.costMaterials ?? 0;
  const canAffordSelected = Boolean(nextUpgradeTier) && currentSave.currencies.gold >= (nextUpgradeTier?.costGold ?? 0) && currentSave.currencies.guildPoints >= nextCostGp && materialsStock >= nextCostMaterials;
  const capacityCards: Array<{ family: CreatureFamily; capacity: number }> = [{ family: "feline", capacity: effects.felineCapacity }, { family: "canine", capacity: effects.canineCapacity }, { family: "bovine", capacity: effects.bovineCapacity }, { family: "lapine", capacity: effects.lapineCapacity }, { family: "equine", capacity: effects.equineCapacity }];

  function handleCategoryClick(nextCategory: RanchUpgradeCategory | "overview") { const nextUpgradeId = getCategoryFallbackUpgrade(nextCategory); setCategory(nextCategory); setSelectedUpgradeId(nextUpgradeId); rememberOfficeTarget(nextCategory, nextUpgradeId); }
  function handleUpgradeClick(nextUpgradeId: RanchUpgradeId) { const nextCategory = RANCH_UPGRADE_DEFINITIONS.find((definition) => definition.upgradeId === nextUpgradeId)?.category ?? category; setSelectedUpgradeId(nextUpgradeId); rememberOfficeTarget(nextCategory, nextUpgradeId); }
  function confirmUpgradePurchase() { if (!pendingUpgradeId) return; const result = buyRanchUpgrade(pendingUpgradeId); setMessage(result.message); setPendingUpgradeId(null); setUpgradeSummary(result.summary ?? null); }
  function handleManualRepair() { const result = repairRanch(); setMessage(result.message); }

  return <main className={styles.screen}><section className={styles.frame}><div className={styles.backgroundArt} aria-hidden="true" /><div className={styles.shade} aria-hidden="true" /><header className={styles.header}><div><p className={styles.kicker}>M16 Ranch Construction</p><div className={styles.titleRow}><h1>Ranch Office</h1><button type="button" className={styles.helpButton} onClick={() => setShowHelp(true)} aria-label="Open Ranch Office help">i</button></div><p className={styles.message}>{message}</p></div><div className={styles.headerActions}><div className={styles.statBox}><img src={RANCH_UPGRADE_ASSETS.gold} alt="" /><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div className={styles.statBox}><img src={RANCH_UPGRADE_ASSETS.gp} alt="" /><span>Guild Points</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div><div className={styles.statBox}><img src={RANCH_UPGRADE_ASSETS.ranchUpgrade} alt="" /><span>Materials</span><strong>{materialsStock}</strong></div><button type="button" onClick={() => setShowHistory(true)}>History</button><button type="button" onClick={goToRanch}>Back to Ranch</button><button type="button" onClick={goToMainMenu}>Main Menu</button></div></header>
    <section className={styles.officeOverlay} data-office-mode={category} aria-label="Ranch office upgrades"><aside className={`${styles.panel} ${styles.panelScrollable}`}><h2>Ledger Tabs</h2><div className={styles.filters}>{CATEGORIES.map((item) => <button key={item.id} type="button" className={`${styles.filterButton} ${category === item.id ? styles.active : ""}`} onClick={() => handleCategoryClick(item.id)}><img src={item.icon} alt="" />{item.label}</button>)}</div><div className={styles.overviewGrid}><div className={styles.overviewCard}><span>Total Upgrades</span><strong>{totalUpgradeTiers} tiers</strong></div><div className={styles.overviewCard}><span>Materials</span><strong>{materialsStock}</strong></div><div className={styles.overviewCard}><span>Condition</span><strong>{ranchCondition}</strong></div><div className={styles.overviewCard}><span>Damage</span><strong>{ranchDamage}/100</strong></div><div className={styles.overviewCard}><span>Egg Timers</span><strong>{effects.nurseryPregnancyDays}d pregnancy / {effects.nurseryEggDays}d egg</strong></div><div className={styles.overviewCard}><span>Breeding</span><strong>{formatPercentModifier(effects.breedingPregnancyBonus)} / {formatBreedingEnergyModifier(effects.breedingEnergyDiscount)}</strong></div><div className={styles.overviewCard}><span>Chores</span><strong>{formatDiscount(effects.ranchChoreEnergyDiscount)} energy / +{effects.ranchChoreScoreBonus} score</strong></div></div></aside>
      {category === "overview" ? <aside className={`${styles.panel} ${styles.panelScrollable}`}><div className={styles.detailBody}><div><span className={styles.tier}>Ranch overview</span><h2 className={styles.contractTitle}>Operations & Condition</h2><p>Use this overview for repairs, condition penalties, history, capacity, and current ranch-wide effects.</p></div><div className={styles.resourceBox}><span className={styles.smallLabel}>Ranch Repairs</span><div className={styles.bonusList}><span>Condition <strong>{ranchCondition}</strong></span><span>Damage <strong>{ranchDamage}/100</strong></span><span>Current penalty <strong>{currentConditionRule.penalty}</strong></span><span>Repair cost <strong>{RANCH_REPAIR_MATERIAL_COST} Materials</strong></span><span>Repair amount <strong>-{RANCH_REPAIR_DAMAGE_AMOUNT} damage</strong></span></div></div><div className={styles.purchaseCard}><div><span className={styles.smallLabel}>Manual Repair</span><strong>{ranchDamage > 0 ? `Repair ${Math.min(ranchDamage, RANCH_REPAIR_DAMAGE_AMOUNT)} damage` : "No repairs needed"}</strong><p>{ranchDamage > 0 ? `${RANCH_REPAIR_MATERIAL_COST} Materials • applies immediately` : "The ranch is already in good condition."}</p>{ranchDamage > 0 && materialsStock < RANCH_REPAIR_MATERIAL_COST ? <p>Need more Materials. Field Hauling produces Materials overnight.</p> : null}</div><button type="button" className={styles.secondaryButton} disabled={!canRepairRanch} onClick={handleManualRepair}>Repair Ranch</button></div><div className={styles.resourceBox}><span className={styles.smallLabel}>Recent Ranch History</span>{ranchHistory.length ? <ul className={styles.historyList}>{ranchHistory.slice(0, 6).map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul> : <p>No ranch history recorded yet. Assign chores, sleep, repair damage, or haul materials to start the log.</p>}<div className={styles.historyActions}><button type="button" className={styles.secondaryButton} onClick={() => setShowHistory(true)}>Open Full History</button></div></div><div className={styles.resourceBox}><span className={styles.smallLabel}>Condition Penalties</span><div className={styles.bonusList}>{CONDITION_RULES.map((rule) => <span key={rule.label}>{rule.label} <strong>{rule.range} • {rule.penalty}</strong></span>)}</div></div><div className={styles.resourceBox}><span className={styles.smallLabel}>Capacity & Timers</span><div className={styles.bonusList}>{capacityCards.map((item) => <span key={item.family}>{HABITAT_LABELS[item.family]} <strong>{usedByFamily(item.family)} / {item.capacity}</strong></span>)}<span>Egg capacity <strong>{activeEggs} / {effects.nurseryEggCapacity}</strong></span><span>Pregnancy timer <strong>{effects.nurseryPregnancyDays} day{effects.nurseryPregnancyDays === 1 ? "" : "s"}</strong></span><span>Egg incubation <strong>{effects.nurseryEggDays} day{effects.nurseryEggDays === 1 ? "" : "s"}</strong></span></div></div><div className={styles.resourceBox}><span className={styles.smallLabel}>Current Ranch Effects</span><div className={styles.bonusList}><span>Pregnancy modifier <strong>{formatPercentModifier(effects.breedingPregnancyBonus)}</strong></span><span>Breeding XP bonus <strong>+{effects.breedingXpBonus}</strong></span><span>Breeding energy modifier <strong>{formatBreedingEnergyModifier(effects.breedingEnergyDiscount)}</strong></span><span>Chore energy discount <strong>{formatDiscount(effects.ranchChoreEnergyDiscount)}</strong></span><span>Chore score bonus <strong>+{effects.ranchChoreScoreBonus}</strong></span><span>Sleep energy bonus <strong>+{effects.sleepCreatureEnergyBonus}</strong></span><span>Sleep affection bonus <strong>+{effects.sleepAffectionBonus}</strong></span></div></div></div></aside> : <><section className={`${styles.panel} ${styles.upgradePanel}`}><h2>{getRanchUpgradeCategoryLabel(category)}</h2><div className={styles.upgradeList}>{categoryUpgrades.map((definition) => <button key={definition.upgradeId} type="button" aria-label={`${definition.name}. ${definition.description}`} title={definition.name} className={`${styles.upgradeButton} ${selectedUpgrade.upgradeId === definition.upgradeId ? styles.active : ""}`} onClick={() => handleUpgradeClick(definition.upgradeId)}><img src={definition.iconPath} alt="" /></button>)}</div></section><aside className={styles.panel}><div className={styles.detailBody}><div><span className={styles.tier}>{selectedUpgrade.category} upgrade</span><h2 className={styles.contractTitle}>{selectedUpgrade.name}</h2><p>{selectedUpgrade.description}</p></div><div className={styles.compareGrid}><div><span className={styles.smallLabel}>Current</span><strong>Tier {selectedUpgradeTier}</strong><p>{currentUpgradeEffect}</p></div><div><span className={styles.smallLabel}>Next</span><strong>{nextUpgradeTier ? `Tier ${nextUpgradeTier.tier}` : "Max"}</strong><p>{nextUpgradeTier?.effectLabel ?? "Fully upgraded"}</p></div></div><div className={styles.tierSteps} aria-label="Upgrade tier path">{[0, ...selectedUpgrade.tiers.map((tier) => tier.tier)].map((tier) => <span key={tier} className={tier <= selectedUpgradeTier ? styles.stepActive : ""}>{tier}</span>)}</div><div className={styles.purchaseCard}><div><span className={styles.smallLabel}>Purchase</span><strong>{nextUpgradeTier ? `Tier ${nextUpgradeTier.tier}` : "Max Tier"}</strong><p>{nextUpgradeTier ? `${formatUpgradeCost(nextUpgradeTier.costGold, nextUpgradeTier.costGp, nextUpgradeTier.costMaterials)} • applies immediately` : "This upgrade is fully improved."}</p>{nextUpgradeTier && !canAffordSelected ? <p>Need more resources. Field Hauling produces Materials overnight.</p> : null}</div><button type="button" className={styles.primaryButton} disabled={!canAffordSelected} onClick={() => setPendingUpgradeId(selectedUpgrade.upgradeId)}>{nextUpgradeTier ? "Upgrade" : "Max Tier"}</button></div></div></aside></>}
    </section>{showHistory ? <div className={styles.modalBackdrop} role="presentation" onClick={() => setShowHistory(false)}><section className={styles.resultModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><img src={RANCH_UPGRADE_ASSETS.ranchLedger} alt="" /><p className={styles.kicker}>Ranch History</p><h2>Operations Log</h2><p>Recent chores, feeding results, security events, material hauling, upkeep, and manual repairs.</p>{ranchHistory.length ? <ul className={styles.fullHistoryList}>{ranchHistory.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul> : <p>No ranch history recorded yet. Sleep after assigning chores to generate the first entries.</p>}<button type="button" className={styles.primaryButton} onClick={() => setShowHistory(false)}>Close History</button></section></div> : null}{showHelp ? <div className={styles.modalBackdrop} role="presentation" onClick={() => setShowHelp(false)}><section className={styles.resultModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><img src={RANCH_UPGRADE_ASSETS.ranchLedger} alt="" /><p className={styles.kicker}>Ranch Office Help</p><h2>How Upgrades Work</h2><ul className={styles.helpList}><li>Use Ranch Overview for repairs, condition penalties, history, and ranch-wide effects.</li><li>Use the other ledger tabs to upgrade one system without the repair/history clutter.</li><li>Tier 1 upgrades cost Gold only. Tier 2+ upgrades may cost Gold, GP, and Ranch Materials.</li><li>Assign Field Hauling before sleep to produce Materials and automatically repair some damage with Upkeep score.</li><li>Use Manual Repair from Ranch Overview to spend {RANCH_REPAIR_MATERIAL_COST} Materials and repair up to {RANCH_REPAIR_DAMAGE_AMOUNT} damage immediately.</li></ul><p className={styles.message}>{message}</p><button type="button" className={styles.primaryButton} onClick={() => setShowHelp(false)}>Got It</button></section></div> : null}{pendingUpgrade && pendingNextTier ? <div className={styles.modalBackdrop} role="presentation" onClick={() => setPendingUpgradeId(null)}><section className={styles.resultModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><img src={pendingUpgrade.iconPath} alt="" /><p className={styles.kicker}>Confirm Ranch Upgrade</p><h2>{pendingUpgrade.name}</h2><p>Upgrade from Tier {pendingUpgradeTier} to Tier {pendingNextTier.tier}?</p><div className={styles.resourceBox}><span className={styles.smallLabel}>Cost</span><div className={styles.resourceGrid}><div className={styles.resource}><img src={RANCH_UPGRADE_ASSETS.gold} alt="" /><div><span>Gold</span><strong>{pendingNextTier.costGold}</strong></div></div><div className={styles.resource}><img src={RANCH_UPGRADE_ASSETS.gp} alt="" /><div><span>GP</span><strong>{pendingNextTier.costGp ?? 0}</strong></div></div><div className={styles.resource}><img src={RANCH_UPGRADE_ASSETS.ranchUpgrade} alt="" /><div><span>Materials</span><strong>{pendingNextTier.costMaterials ?? 0}</strong></div></div></div></div><div className={styles.resourceBox}><span className={styles.smallLabel}>New Effect</span><strong>{pendingNextTier.effectLabel}</strong><p>Ranch effects apply immediately.</p></div><div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={() => setPendingUpgradeId(null)}>Cancel</button><button type="button" className={styles.primaryButton} onClick={confirmUpgradePurchase}>Confirm Upgrade</button></div></section></div> : null}{upgradeSummary ? <div className={styles.modalBackdrop} role="presentation" onClick={() => setUpgradeSummary(null)}><section className={styles.resultModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><img src={RANCH_UPGRADE_ASSETS.ranchUpgrade} alt="" /><p className={styles.kicker}>Upgrade Complete</p><h2>{upgradeSummary.upgradeName}</h2><div className={styles.resultGrid}><span>Tier</span><strong>{upgradeSummary.oldTier} → {upgradeSummary.newTier}</strong><span>Effect</span><strong>{upgradeSummary.effectLabel}</strong><span>Spent</span><strong>{upgradeSummary.costGold} Gold • {upgradeSummary.costGp} GP • {upgradeSummary.costMaterials} Materials</strong><span>Remaining</span><strong>{upgradeSummary.remainingGold} Gold • {upgradeSummary.remainingGp} GP • {upgradeSummary.remainingMaterials} Materials</strong></div><p className={styles.message}>{upgradeSummary.immediateEffectLabel}</p><button type="button" className={styles.primaryButton} onClick={() => setUpgradeSummary(null)}>Continue</button></section></div> : null}<footer className={styles.versionFooter}>{version}</footer></section></main>;
}
