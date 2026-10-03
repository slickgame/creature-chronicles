"use client";

import { useEffect, useRef, useState } from "react";
import { RANCH_REPAIR_DAMAGE_AMOUNT, RANCH_REPAIR_MATERIAL_COST, RANCH_UPGRADE_DEFINITIONS, getNextRanchUpgradeTier, getRanchConditionLabelFromDamage, getRanchUpgradeEffects, getRanchUpgrades, getTotalRanchUpgradeTiers } from "@/data/ranchUpgrades";
import { getStarterGoals } from "@/data/starterGoals";
import { getVariantDefinition } from "@/data/creatures";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { GameDialog } from "@/features/ui/GameDialog";
import { IllustratedIcon } from "@/features/ui/IllustratedIcon";
import { RanchIcon, type RanchIconName } from "@/features/ui/RanchIcon";
import { StoryLogOverlay } from "@/features/story/StoryLogOverlay";
import { StoryImageAdminOverlay } from "@/features/story/StoryImageAdminOverlay";
import { useGameContext } from "@/state/GameProvider";
import type { RanchUpgradeCategory, RanchUpgradeId, RanchUpgradeTier, RanchUpgradePurchaseSummary } from "@/types/ranchUpgrades";
import { CONDITION_RULES, OFFICE_BUILDINGS, officeEffectRows } from "./officePresentation";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./BuilderDesk.module.css";

const CATEGORY_KEY = "creature-chronicles-ranch-office-category-v1";
const UPGRADE_KEY = "creature-chronicles-ranch-office-upgrade-v1";
const CATEGORIES: Array<{ id: RanchUpgradeCategory | "overview"; label: string; icon: RanchIconName }> = [
  { id: "overview", label: "Overview", icon: "house" }, { id: "habitats", label: "Habitats", icon: "paw" },
  { id: "nursery", label: "Nursery", icon: "egg" }, { id: "breeding", label: "Breeding", icon: "nest" },
  { id: "chores", label: "Chores", icon: "chores" }, { id: "recovery", label: "Recovery", icon: "moon" },
];
type Category = typeof CATEGORIES[number]["id"];
type Popup = "history" | "help" | "records" | "story" | "art" | "tiers" | "confirm" | "repair" | "condition" | "capacity" | "effects" | "result" | null;
function initialTarget(): { category: Category; id: RanchUpgradeId } {
  if (typeof window === "undefined") return { category: "overview", id: "feline_habitat_capacity" };
  const id = window.localStorage.getItem(UPGRADE_KEY);
  const definition = RANCH_UPGRADE_DEFINITIONS.find(item => item.upgradeId === id);
  const category = window.localStorage.getItem(CATEGORY_KEY);
  return { category: CATEGORIES.some(item => item.id === category) ? category as Category : definition?.category ?? "overview", id: definition?.upgradeId ?? "feline_habitat_capacity" };
}
function numberFlag(value: unknown) { const n = Number(value ?? 0); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; }
function price(tier: RanchUpgradeTier) { return [`${tier.costGold.toLocaleString()} Gold`, ...(tier.costGp ? [`${tier.costGp} GP`] : []), ...(tier.costMaterials ? [`${tier.costMaterials} Materials`] : [])].join(" · "); }
function historyEntries(value: unknown): string[] { try { const items: unknown = JSON.parse(String(value ?? "[]")); return Array.isArray(items) ? items.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }

export function RanchOfficeScreen() {
  const { currentSave, buyRanchUpgrade, repairRanch, goToRanch, goToBreeding, goToRanchJobs } = useGameContext();
  const [target, setTarget] = useState(initialTarget);
  const [popup, setPopup] = useState<Popup>(null);
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<RanchUpgradePurchaseSummary | null>(null);
  const [rewards, setRewards] = useState<string[]>([]);
  const [page, setPage] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(1);
  const pageSizeRef = useRef(1);
  const dockRef = useRef<HTMLDivElement>(null);
  const purchaseLock = useRef(false);
  const overview = target.category === "overview";
  const definitions = RANCH_UPGRADE_DEFINITIONS.filter(item => item.category === target.category);
  const selected = definitions.find(item => item.upgradeId === target.id) ?? definitions[0] ?? RANCH_UPGRADE_DEFINITIONS[0];
  const pages = Math.max(1, Math.ceil(definitions.length / pageSize));
  const currentPage = Math.min(page ?? Math.floor(Math.max(0, definitions.indexOf(selected)) / pageSize), pages - 1);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width <= 0) return;
      const size = Math.max(1, Math.min(3, Math.floor((entry.contentRect.width + 8) / 220)));
      if (size !== pageSizeRef.current) { pageSizeRef.current = size; setPageSize(size); setPage(null); }
    });
    observer.observe(dock);
    return () => observer.disconnect();
  }, [overview]);

  if (!currentSave) return <main className={ui.interior}><section className={ui.paper}><h1>No active save</h1><button type="button" onClick={goToRanch}>Back to Ranch</button></section></main>;
  const save = currentSave;
  const upgrades = getRanchUpgrades(save), effects = getRanchUpgradeEffects(save);
  const tier = upgrades[selected.upgradeId] ?? 0, next = getNextRanchUpgradeTier(selected, tier);
  const futureEffects = next ? getRanchUpgradeEffects({ ...save, ranchUpgrades: { ...upgrades, [selected.upgradeId]: next.tier } }) : effects;
  const before = officeEffectRows(selected.upgradeId, effects), after = officeEffectRows(selected.upgradeId, futureEffects);
  const materials = numberFlag(save.flags.ranchMaterialsStock), kits = numberFlag(save.flags.ranchRepairKits);
  const damage = Math.min(100, numberFlag(save.flags.ranchDamage));
  const condition = getRanchConditionLabelFromDamage(damage);
  const penalty = CONDITION_RULES.find(item => item.label === condition)!.penalty;
  const shortages = next ? [
    ["Gold", next.costGold - save.currencies.gold], ["GP", (next.costGp ?? 0) - save.currencies.guildPoints], ["Materials", (next.costMaterials ?? 0) - materials],
  ].filter(([, amount]) => Number(amount) > 0).map(([name, amount]) => `${Number(amount).toLocaleString()} ${name}`) : [];
  const affordable = Boolean(next) && shortages.length === 0;
  const repairCost = kits > 0 ? "1 Repair Kit" : `${RANCH_REPAIR_MATERIAL_COST} Materials`;
  const canRepair = damage > 0 && (kits > 0 || materials >= RANCH_REPAIR_MATERIAL_COST);
  const history = historyEntries(save.flags.ranchEventLog);
  const building = overview ? { name: "Ranch Office", file: "ranch_office", note: "Care for your ranch and plan its next improvement." } : OFFICE_BUILDINGS[selected.upgradeId];

  function selectCategory(category: Category) {
    const id = RANCH_UPGRADE_DEFINITIONS.find(item => item.category === category)?.upgradeId ?? "feline_habitat_capacity";
    setTarget({ category, id }); setPage(null);
    window.localStorage.setItem(CATEGORY_KEY, category);
    if (category === "overview") window.localStorage.removeItem(UPGRADE_KEY);
    else window.localStorage.setItem(UPGRADE_KEY, id);
  }
  function selectUpgrade(id: RanchUpgradeId) { setTarget({ ...target, id }); window.localStorage.setItem(UPGRADE_KEY, id); }
  function review(kind: "confirm" | "repair") { purchaseLock.current = false; setPopup(kind); }
  function purchase() {
    if (purchaseLock.current || !affordable) return;
    purchaseLock.current = true;
    const result = buyRanchUpgrade(selected.upgradeId);
    setRewards(result.ok ? getStarterGoals(result.save).filter(goal => goal.complete && !goal.rewardClaimed).map(goal => `${goal.label}: ${goal.rewardLabel}`) : []);
    setMessage(result.message); setReceipt(result.summary ?? null); setPopup("result");
  }
  function repair() {
    if (purchaseLock.current || !canRepair) return;
    purchaseLock.current = true;
    const result = repairRanch();
    setRewards(result.ok ? getStarterGoals(result.save).filter(goal => goal.complete && !goal.rewardClaimed).map(goal => `${goal.label}: ${goal.rewardLabel}`) : []);
    setMessage(result.message); setReceipt(null); setPopup("result");
  }
  function breedingLedger() { window.sessionStorage.setItem("creature_chronicles_open_breeding_ledger", "1"); goToBreeding(); }
  const compare = <div className={styles.comparison} aria-label="Upgrade comparison"><div className={styles.tierLabel}><span>Tier {tier}</span><span aria-hidden="true">→</span><strong>{next ? `Tier ${next.tier}` : "Max Tier"}</strong></div>{before.map(([label, value], index) => <div className={styles.effectRow} key={label}><span>{label}</span><span>{value}</span><span aria-hidden="true">→</span><strong>{after[index][1]}</strong></div>)}</div>;

  return <main className={`${ui.interior} ${styles.office}`} data-builder-desk>
    <section className={`${ui.page} ${styles.layout}`}>
      <header className={ui.heading}><h1>Ranch Office</h1><ScreenNavigation><button type="button" onClick={() => setPopup("history")}>History</button><button type="button" onClick={() => setPopup("records")}>Records</button><button type="button" onClick={() => setPopup("help")}>Help</button></ScreenNavigation></header>
      <section className={`${ui.summary} ${styles.resources}`} aria-label="Ranch resources">
        <div><RanchIcon name="gold" /><span>Gold</span><strong>{save.currencies.gold.toLocaleString()}</strong></div>
        <div><RanchIcon name="tax" /><span>Guild Points</span><strong>{save.currencies.guildPoints.toLocaleString()}</strong></div>
        <div><IllustratedIcon name="materials" /><span>Materials</span><strong>{materials.toLocaleString()}</strong></div>
        <button type="button" onClick={() => setPopup("condition")}><RanchIcon name="house" /><span>Condition: <strong>{condition}</strong></span></button>
      </section>
      <div className={styles.workspace}>
        <nav className={`${ui.paper} ${styles.categories}`} aria-label="Office categories">{CATEGORIES.map(item => <button type="button" key={item.id} aria-pressed={target.category === item.id} className={target.category === item.id ? ui.primary : ""} onClick={() => selectCategory(item.id)}><RanchIcon name={item.icon} /><span>{item.label}</span></button>)}</nav>
        <section className={styles.model} aria-label="Building preview"><h2>{building.name}</h2><img src={`/images/buildings/ranch/${building.file}.png`} alt={`${building.name} model`} /></section>
        {overview ? <section className={`${ui.paper} ${styles.details}`} aria-label="Ranch overview">
          <div className={styles.title}><h2>Operations & Condition</h2><p>Care for your ranch between upgrades.</p></div>
          <div className={styles.condition}><strong>{condition}</strong><span>{damage} / 100 damage</span><meter min={0} max={100} value={damage} aria-label="Ranch damage" /><p>{penalty}</p></div>
          <div className={styles.repairInfo}><span>{damage ? `Repair up to ${Math.min(damage, RANCH_REPAIR_DAMAGE_AMOUNT)} damage` : "No repairs needed"}</span><strong>{damage ? repairCost : "Your ranch is in good repair."}</strong><p>{damage && !canRepair ? `Need ${Math.max(0, RANCH_REPAIR_MATERIAL_COST - materials)} more Materials or 1 Repair Kit.` : damage ? "Applies immediately after confirmation." : `${getTotalRanchUpgradeTiers(save)} upgrade tiers completed`}</p></div>
          <div className={styles.actions}><button type="button" className={ui.primary} disabled={!canRepair} onClick={() => review("repair")}>Review Repair</button><button type="button" onClick={() => setPopup("condition")}>Condition Details</button></div>
        </section> : <section className={`${ui.paper} ${styles.details}`} aria-label="Selected upgrade">
          <div className={styles.title}><h2>{selected.name}</h2><p>{building.note}</p></div>
          {compare}
          <ol className={styles.tierPath} aria-label="Upgrade tier path">{[0, ...selected.tiers.map(item => item.tier)].map(value => <li key={value} aria-current={value === tier ? "step" : undefined} className={value <= tier ? styles.completed : ""}>{value}</li>)}</ol>
          <div className={styles.cost}><span>Cost</span><strong>{next ? price(next) : "Fully upgraded"}</strong><p className={shortages.length ? styles.shortage : styles.ready}>{next ? shortages.length ? `Need ${shortages.join(" · ")} more` : "You have enough · Applies immediately" : "All tiers completed"}</p></div>
          <div className={styles.actions}><button type="button" className={ui.primary} disabled={!affordable} onClick={() => review("confirm")}>{next ? "Review Upgrade" : "Max Tier"}</button><button type="button" onClick={() => setPopup("tiers")}>All Tiers</button></div>
        </section>}
      </div>
      {overview ? <section className={`${ui.paper} ${styles.overviewDock}`} aria-label="Ranch reports"><button type="button" onClick={() => setPopup("capacity")}><RanchIcon name="paw" />Capacity & Timers</button><button type="button" onClick={() => setPopup("effects")}><RanchIcon name="leaf" />Ranch Effects</button><button type="button" onClick={() => setPopup("history")}><RanchIcon name="chores" />History</button></section> : <section className={`${ui.paper} ${styles.dock}`} aria-label="Upgrade choices">
        <h2>{CATEGORIES.find(item => item.id === target.category)?.label} Upgrades</h2>
        <button type="button" aria-label="Previous upgrades" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button>
        <div ref={dockRef} className={styles.upgrades}>{definitions.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(item => <button type="button" key={item.upgradeId} aria-pressed={item.upgradeId === selected.upgradeId} onClick={() => selectUpgrade(item.upgradeId)}><img src={`/images/buildings/ranch/${OFFICE_BUILDINGS[item.upgradeId].file}.png`} alt="" /><span><strong>{OFFICE_BUILDINGS[item.upgradeId].name}</strong><small>Tier {upgrades[item.upgradeId]} / {item.maxTier}</small></span></button>)}</div>
        <span className={styles.pageNumber} aria-live="polite">{currentPage + 1} / {pages}</span><button type="button" aria-label="Next upgrades" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
      </section>}
    </section>
    {popup === "confirm" && next ? <GameDialog title="Confirm Upgrade" onClose={() => setPopup(null)}><h3>{selected.name}</h3>{compare}<p><strong>{price(next)}</strong></p><p>{shortages.length ? `Need ${shortages.join(" · ")} more.` : "The new benefits apply immediately. Your existing creatures and eggs remain safe."}</p><div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup(null)}>Cancel</button><button type="button" className={ui.primary} disabled={!affordable} onClick={purchase}>Confirm Upgrade</button></div></GameDialog> : null}
    {popup === "repair" ? <GameDialog title="Confirm Repair" onClose={() => setPopup(null)}><p>Repair {Math.min(damage, RANCH_REPAIR_DAMAGE_AMOUNT)} damage for <strong>{repairCost}</strong>.</p><p>Damage: {damage} → {Math.max(0, damage - RANCH_REPAIR_DAMAGE_AMOUNT)}. Repair Kits are used before materials.</p><div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup(null)}>Cancel</button><button type="button" disabled={!canRepair} onClick={repair}>Confirm Repair</button></div></GameDialog> : null}
    {popup === "result" ? <GameDialog title={receipt ? "Upgrade Complete" : "Ranch Update"} onClose={() => setPopup(null)}><p role="status">{message}</p>{receipt ? <dl className={styles.report}><div><dt>Tier</dt><dd>{receipt.oldTier} → {receipt.newTier}</dd></div><div><dt>Effect</dt><dd>{receipt.effectLabel}</dd></div><div><dt>Spent</dt><dd>{receipt.costGold} Gold · {receipt.costGp} GP · {receipt.costMaterials} Materials</dd></div><div><dt>Current balance</dt><dd>{save.currencies.gold} Gold · {save.currencies.guildPoints} GP · {materials} Materials</dd></div></dl> : null}{rewards.length ? <section><h3>Starter-goal rewards</h3><ul>{rewards.map(reward => <li key={reward}>{reward}</li>)}</ul></section> : null}<button type="button" onClick={() => setPopup(null)}>Continue</button></GameDialog> : null}
    {popup === "tiers" ? <GameDialog title={`${building.name} · All Tiers`} onClose={() => setPopup(null)}><h3>{selected.name}</h3><p>{selected.description}</p><div className={styles.tierCards}><article><h3>Tier 0 · Base</h3>{officeEffectRows(selected.upgradeId, getRanchUpgradeEffects({ ...save, ranchUpgrades: { ...upgrades, [selected.upgradeId]: 0 } })).map(([label, value]) => <p key={label}>{label}: {value}</p>)}</article>{selected.tiers.map(item => <article key={item.tier}><h3>Tier {item.tier} {item.tier === tier ? "· Current" : item.tier < tier ? "· Completed" : ""}</h3><p>{item.effectLabel}</p><strong>{price(item)}</strong></article>)}</div></GameDialog> : null}
    {popup === "history" ? <GameDialog title="Ranch History" onClose={() => setPopup(null)}><p>Chores, feeding, security, hauling, upkeep and repairs.</p>{history.length ? <ol className={styles.history}>{history.map((entry, index) => <li key={index}>{entry}</li>)}</ol> : <p>No ranch history yet. Assign chores or repair your ranch to start the log.</p>}</GameDialog> : null}
    {popup === "condition" ? <GameDialog title="Ranch Condition" onClose={() => setPopup(null)}><p><strong>{condition} · {damage} / 100 damage</strong></p><p>{penalty}</p><div className={styles.tierCards}>{CONDITION_RULES.map(item => <article key={item.label}><h3>{item.label} · {item.range}</h3><p>{item.penalty}</p></article>)}</div><p>Repairs use 1 Repair Kit or {RANCH_REPAIR_MATERIAL_COST} Materials and remove up to {RANCH_REPAIR_DAMAGE_AMOUNT} damage.</p><p>In stock: {kits} Repair Kits · {materials} Materials.</p><button type="button" onClick={() => { selectCategory("overview"); setPopup(null); }}>View Repairs</button></GameDialog> : null}
    {popup === "capacity" ? <GameDialog title="Capacity & Timers" onClose={() => setPopup(null)}><dl className={styles.report}>{(["feline", "canine", "bovine", "lapine", "equine"] as const).map(family => <div key={family}><dt>{family[0].toUpperCase() + family.slice(1)} Habitat</dt><dd>{(save.creatures ?? []).filter(item => getVariantDefinition(item.variantId).family === family).length} / {save.habitats?.find(item => item.family === family)?.capacity ?? effects[`${family}Capacity`]}</dd></div>)}<div><dt>Egg slots</dt><dd>{(save.eggs ?? []).filter(item => item.status !== "hatched").length} / {effects.nurseryEggCapacity}</dd></div><div><dt>Pregnancy</dt><dd>{effects.nurseryPregnancyDays} days</dd></div><div><dt>Egg incubation</dt><dd>{effects.nurseryEggDays} days</dd></div></dl></GameDialog> : null}
    {popup === "effects" ? <GameDialog title="Ranch Effects" onClose={() => setPopup(null)}><p>{getTotalRanchUpgradeTiers(save)} upgrade tiers completed.</p>{(["breeding_pen_comfort", "ranch_chores_board", "sleep_recovery"] as const).map(id => <section key={id}><h3>{OFFICE_BUILDINGS[id].name}</h3><dl className={styles.report}>{officeEffectRows(id, effects).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>)}</GameDialog> : null}
    {popup === "help" ? <GameDialog title="Ranch Office Help" onClose={() => setPopup(null)}><p>Choose a category, then an upgrade. Compare current and next benefits before reviewing its cost. Confirming applies the upgrade immediately.</p><p>Later tiers may need Gold, Guild Points and Materials. Some first-tier upgrades also need Materials. The cost panel lists exactly what is missing.</p><p>Field Hauling produces Materials overnight. Overview contains repairs; its reports show capacities, timers and ranch effects.</p><button type="button" onClick={goToRanchJobs}>Visit Chores</button></GameDialog> : null}
    {popup === "records" ? <GameDialog title="Ranch Records" onClose={() => setPopup(null)}><div className={ui.actionRow}><button type="button" onClick={() => setPopup("story")}>Story Log</button><button type="button" onClick={breedingLedger}>Breeding Ledger</button><button type="button" onClick={() => setPopup("art")}>Story Images</button></div></GameDialog> : null}
    {(popup === "story" || popup === "art") ? <GameDialog title={popup === "story" ? "Story Log" : "Story Images"} wide onClose={() => setPopup("records")}><div className={styles.archive}>{popup === "story" ? <StoryLogOverlay embedded onClose={() => setPopup("records")} /> : <StoryImageAdminOverlay embedded onClose={() => setPopup("records")} />}</div></GameDialog> : null}
  </main>;
}
