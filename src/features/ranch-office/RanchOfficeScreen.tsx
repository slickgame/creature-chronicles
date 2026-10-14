"use client";

import { FarmResourcesButton } from "@/features/resources/FarmResourcesPanel";
import { getFarmState, resourceList, resourceShortages, canSpend } from "@/data/farmResources";

import { useEffect, useRef, useState } from "react";
import { RANCH_REPAIR_DAMAGE_AMOUNT, RANCH_REPAIR_RESOURCES, RANCH_UPGRADE_DEFINITIONS, getNextRanchUpgradeTier, getRanchConditionLabelFromDamage, getRanchUpgradeEffects, getRanchUpgrades, getTotalRanchUpgradeTiers } from "@/data/ranchUpgrades";
import { getStarterGoals } from "@/data/starterGoals";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { RanchReview } from "@/features/ranch/RanchReview";
import { GameDialog } from "@/features/ui/GameDialog";
import { IllustratedIcon } from "@/features/ui/IllustratedIcon";
import { RanchIcon, type RanchIconName } from "@/features/ui/RanchIcon";
import { RanchJournal } from "@/features/ranch/RanchJournal";
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
type Popup = "history" | "help" | "records" | "story" | "tiers" | "confirm" | "repair" | "condition" | "capacity" | "effects" | "result" | null;
function initialTarget(): { category: Category; id: RanchUpgradeId } {
  if (typeof window === "undefined") return { category: "overview", id: "feline_habitat_capacity" };
  const id = window.localStorage.getItem(UPGRADE_KEY);
  const definition = RANCH_UPGRADE_DEFINITIONS.find(item => item.upgradeId === id);
  const category = window.localStorage.getItem(CATEGORY_KEY);
  return { category: CATEGORIES.some(item => item.id === category) ? category as Category : definition?.category ?? "overview", id: definition?.upgradeId ?? "feline_habitat_capacity" };
}
function numberFlag(value: unknown) { const n = Number(value ?? 0); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; }
function price(tier: RanchUpgradeTier) { return [`${tier.costGold.toLocaleString()} Gold`, ...(tier.costGp ? [`${tier.costGp} GP`] : []), ...(tier.costResources ? [resourceList(tier.costResources)] : [])].join(" · "); }
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
  const definitions = RANCH_UPGRADE_DEFINITIONS.filter(item => item.category === target.category&&(!item.upgradeId.includes("_habitat_capacity")||currentSave?.habitats?.some(h=>h.unlocked&&item.upgradeId.startsWith(h.family+"_"))));
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
  const stock = getFarmState(save);
  const kits = numberFlag(save.flags.ranchRepairKits);
  const damage = Math.min(100, numberFlag(save.flags.ranchDamage));
  const condition = getRanchConditionLabelFromDamage(damage);
  const penalty = CONDITION_RULES.find(item => item.label === condition)!.penalty;
  const shortages = next ? [
    ["Gold", next.costGold - save.currencies.gold], ["GP", (next.costGp ?? 0) - save.currencies.guildPoints],
  ].filter(([, amount]) => Number(amount) > 0).map(([name, amount]) => `${Number(amount).toLocaleString()} ${name}`).concat(resourceShortages(getFarmState(save), next.costResources ?? {})) : [];
  const affordable = Boolean(next) && shortages.length === 0;
  const repairCost = kits > 0 ? "1 Repair Kit" : resourceList(RANCH_REPAIR_RESOURCES);
  const canRepair = damage > 0 && (kits > 0 || canSpend(getFarmState(save), RANCH_REPAIR_RESOURCES));
  const history = historyEntries(save.flags.ranchEventLog);
  const building = overview ? { name: "Ranch House Ledger", file: "ranch_office", note: "Care for your ranch and plan its next improvement." } : OFFICE_BUILDINGS[selected.upgradeId];

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

  return <main className={`${ui.interior} ${styles.office}`} data-builder-desk style={{backgroundImage:"url(/images/ui/ranch-v3/house.webp)"}}>
    <section className={`${ui.page} ${styles.layout}`}>
      <header className={ui.heading}><h1>Ranch House Ledger</h1><ScreenNavigation><button type="button" onClick={() => setPopup("history")}>History</button><button type="button" onClick={() => setPopup("records")}>Records</button><button type="button" onClick={() => setPopup("help")}>Help</button></ScreenNavigation></header>
      <section className={`${ui.summary} ${styles.resources}`} aria-label="Ranch resources">
        <div><RanchIcon name="gold" /><span>Gold</span><strong>{save.currencies.gold.toLocaleString()}</strong></div>
        <div><RanchIcon name="tax" /><span>Guild Points</span><strong>{save.currencies.guildPoints.toLocaleString()}</strong></div>
        <div><IllustratedIcon name="materials" /><span>Wood / Stone</span><strong>{stock.stock.wood ?? 0} / {stock.stock.stone ?? 0}</strong></div>
        <button type="button" onClick={() => setPopup("condition")}><RanchIcon name="house" /><span>Condition: <strong>{condition}</strong></span></button>
      </section>
      <div className={styles.workspace}>
        <nav className={`${ui.paper} ${styles.categories}`} aria-label="Office categories">{CATEGORIES.map(item => <button type="button" key={item.id} aria-pressed={target.category === item.id} className={target.category === item.id ? ui.primary : ""} onClick={() => selectCategory(item.id)}><RanchIcon name={item.icon} /><span>{item.label}</span></button>)}</nav>
        <section className={styles.model} aria-label="Building preview"><h2>{building.name}</h2><img src={`/images/buildings/ranch/${building.file}.png`} alt={`${building.name} model`} /></section>
        {overview ? <section className={`${ui.paper} ${styles.details}`} aria-label="Ranch overview">
          <div className={styles.title}><h2>Operations & Condition</h2><p>Care for your ranch between upgrades.</p></div>
          <div className={styles.condition}><strong>{condition}</strong><span>{damage} / 100 damage</span><meter min={0} max={100} value={damage} aria-label="Ranch damage" /><p>{penalty}</p></div>
          <div className={styles.repairInfo}><span>{damage ? `Repair up to ${Math.min(damage, RANCH_REPAIR_DAMAGE_AMOUNT)} damage` : "No repairs needed"}</span><strong>{damage ? repairCost : "Your ranch is in good repair."}</strong><p>{damage && !canRepair ? `Need ${resourceShortages(getFarmState(save), RANCH_REPAIR_RESOURCES).join(" + ")} or 1 Repair Kit.` : damage ? "Applies immediately after confirmation." : `${getTotalRanchUpgradeTiers(save)} upgrade tiers completed`}</p></div>
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
    {popup === "confirm" && next ? <RanchReview title="Confirm Upgrade" onClose={()=>setPopup(null)} pages={[{title:selected.name,content:<>{compare}<p>{price(next)}</p><p>{shortages.length?`Need ${shortages.join(" · ")} more.`:"Benefits apply immediately. Existing creatures and eggs remain safe; reserved supplies are protected."}</p></>}]} actions={<><button onClick={()=>setPopup(null)}>Cancel</button><button disabled={!affordable} onClick={purchase}>Confirm Upgrade</button></>}/> : null}
    {popup === "repair" ? <RanchReview title="Confirm Repair" onClose={()=>setPopup(null)} pages={[{title:"Restore ranch condition",content:<><p>Repair {Math.min(damage,RANCH_REPAIR_DAMAGE_AMOUNT)} damage for {repairCost}.</p><p>Damage: {damage} → {Math.max(0,damage-RANCH_REPAIR_DAMAGE_AMOUNT)}. Repair Kits are used first. Reserved supplies are protected.</p></>}]} actions={<><button onClick={()=>setPopup(null)}>Cancel</button><button disabled={!canRepair} onClick={repair}>Confirm Repair</button></>}/> : null}
    {popup === "result" ? <RanchReview title={receipt?"Upgrade Complete":"Ranch Update"} onClose={()=>setPopup(null)} pages={[
      {title:"Result",content:<><p role="status">{message}</p>{receipt&&<><p>Tier {receipt.oldTier} → {receipt.newTier} · {receipt.effectLabel}</p><p>Spent: {receipt.costGold} Gold + {receipt.costGp} GP + {resourceList(receipt.costResources)||"no supplies"}.</p></>}<p>Balance: {save.currencies.gold} Gold · {save.currencies.guildPoints} GP.</p></>},
      ...rewards.map(reward=>({title:"Starter-goal reward",content:<p>{reward}</p>}))
    ]}/> : null}
    {popup === "tiers" ? <RanchReview title={`${building.name} · All Tiers`} onClose={()=>setPopup(null)} pages={[0,...selected.tiers.map(t=>t.tier)].map(level=>({title:`Tier ${level}`,content:<><p>{selected.description}</p>{officeEffectRows(selected.upgradeId,getRanchUpgradeEffects({...save,ranchUpgrades:{...upgrades,[selected.upgradeId]:level}})).map(([label,value])=><p key={label}>{label}: {value}</p>)}{level>0&&<p>{price(selected.tiers.find(t=>t.tier===level)!)}</p>}</>}))}/> : null}
    {popup === "history" ? <RanchReview title="Ranch History" onClose={()=>setPopup(null)} pages={history.length?history.map(entry=>({title:"Recorded event",content:<p>{entry}</p>})):[{title:"History",content:<p>No events recorded yet.</p>}]}/> : null}
    {popup === "condition" ? <RanchReview title="Ranch Condition" onClose={()=>setPopup(null)} pages={[
      {title:`${condition} · ${damage} / 100 damage`,content:<><p>{penalty}</p><p>Repairs use one Repair Kit or {resourceList(RANCH_REPAIR_RESOURCES)} and remove up to {RANCH_REPAIR_DAMAGE_AMOUNT} damage.</p><FarmResourcesButton label="Supplies & workbench"/><button onClick={()=>{selectCategory("overview");setPopup(null);}}>View Repairs</button></>},
      ...CONDITION_RULES.map(item=>({title:`${item.label} · ${item.range}`,content:<p>{item.penalty}</p>}))
    ]}/> : null}
    {popup === "capacity" ? <RanchReview title="Capacity & Timers" onClose={()=>setPopup(null)} pages={[
      ...(["feline","canine","bovine","lapine","equine"] as const).map(family=>{const h=save.habitats?.find(h=>h.family===family&&h.unlocked);return {title:`${family[0].toUpperCase()+family.slice(1)} Habitat`,content:<p>{h?`${h.creatureIds.length} residents / ${h.capacity} spaces`:"Locked. Petra builds this family’s habitat in Builder’s Yard."}</p>};}),
      {title:"Nursery timers",content:<><p>Egg slots: {(save.eggs??[]).filter(e=>e.status!=="hatched").length} / {effects.nurseryEggCapacity}</p><p>Pregnancy: {effects.nurseryPregnancyDays} days · Incubation: {effects.nurseryEggDays} days</p></>}
    ]}/> : null}
    {popup === "effects" ? <RanchReview title="Ranch Effects" onClose={()=>setPopup(null)} pages={(["breeding_pen_comfort","ranch_chores_board","sleep_recovery"] as const).map(id=>({title:OFFICE_BUILDINGS[id].name,content:<>{officeEffectRows(id,effects).map(([label,value])=><p key={label}>{label}: {value}</p>)}<p>{getTotalRanchUpgradeTiers(save)} total upgrade tiers.</p></>}))}/> : null}
    {popup === "help" ? <RanchReview title="Ranch House Ledger Help" onClose={()=>setPopup(null)} pages={[
      {title:"Improvements",content:<p>Choose a category, then an upgrade. Compare current and next benefits before reviewing costs. Confirmation applies the upgrade immediately. Petra handles new habitat construction separately.</p>},
      {title:"Supplies",content:<><p>Later tiers need Gold, GP and named components. Reserved supplies are protected. Gather Wood and Stone, then process Planks and Nails. Pella also sells building supplies.</p><FarmResourcesButton label="Supplies & workbench"/><button onClick={goToRanchJobs}>Farm work</button></>}
    ]}/> : null}
    {popup === "records" ? <GameDialog title="Ranch Records" onClose={() => setPopup(null)}><div className={ui.actionRow}><button type="button" onClick={() => setPopup("story")}>Story Log</button><button type="button" onClick={breedingLedger}>Breeding Ledger</button></div></GameDialog> : null}
    {popup === "story" && <RanchJournal storyOnly onClose={()=>setPopup("records")}/>}
  </main>;
}
