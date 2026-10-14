"use client";
import { IngredientCounter } from "@/features/builder/IngredientCounter";
import { getResourceArt } from "@/data/resourceArt";
import { FarmCareBook } from "./FarmCareBook";
import { ResourceShelf } from "./ResourceShelf";
import { ProductionBook } from "./ProductionBook";
import { useEffect, useRef, useState } from "react";
import { useGameContext } from "@/state/GameProvider";
import { GameDialog } from "@/features/ui/GameDialog";
import { RESOURCES, RESOURCE_IDS, getProductionGuide, claimProductionGuide, resourceShortages, FACILITIES, SUPPLY_ORDERS, getFarmState, resourceList, canSpend, commissionFacility, actSupplyOrder, type ResourceId, type FacilityId, type FarmResult } from "@/data/farmResources";
import styles from "./FarmResourcesPanel.module.css";
type Mode = "ranch" | "builder" | "guild" | "market";
type Tab = "Budget" | "Security" | "Guide" | "Feeding" | "Storage" | "Gathering" | "Kitchen" | "Workbench" | "Construction" | "Orders" | "Trade";
const TABS: Record<Mode, Tab[]> = { ranch: ["Gathering", "Security", "Storage", "Feeding", "Kitchen", "Workbench", "Guide", "Budget"], builder: ["Construction", "Storage", "Budget"], guild: ["Orders", "Storage"], market: ["Trade", "Storage"] };
export function FarmResourcesButton({ mode = "ranch", label = "Resources & recipes" }: { mode?: Mode; label?: string }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)}>{label}</button>{open && <GameDialog title={label} onClose={() => setOpen(false)} wide><FarmResourcesPanel mode={mode}/></GameDialog>}</>;
}
export function FarmResourcesPanel({ mode, initialFacility, onReturn }: { mode: Mode; initialFacility?: FacilityId; onReturn?: () => void }) {
  const { currentSave: save, saveCurrentGame, goToTown } = useGameContext();
  const [tab, setTab] = useState<Tab>(TABS[mode][0]);
  const [shelfOpen, setShelfOpen] = useState(true);
  const [page, setPage] = useState(initialFacility ? Object.keys(FACILITIES).indexOf(initialFacility) : 0);
  const [trail, setTrail] = useState<number[]>([]);
  const [source, setSource] = useState<{id:ResourceId;needed:number}|null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const busy = useRef(false);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<{ text: string; action: (s: NonNullable<typeof save>) => FarmResult } | null>(null);
  const latest = useRef(save);
  useEffect(() => { latest.current = save; }, [save]);
  if (!save) return null;
  const state = getFarmState(save);
  const run = (action: (s: NonNullable<typeof save>) => FarmResult) => {
    if (!latest.current || busy.current) return;
    busy.current = true;
    const result = action(latest.current);
    let receipt = result.message;
    if (result.ok) {
      const persisted = saveCurrentGame(result.save);
      latest.current = persisted;
      const gold = persisted.currencies.gold - result.save.currencies.gold;
      const gp = persisted.currencies.guildPoints - result.save.currencies.guildPoints;
      const after = getFarmState(persisted).stock, before = getFarmState(result.save).stock;
      const bonus = Object.fromEntries(RESOURCE_IDS.map(id => [id, (after[id] ?? 0) - (before[id] ?? 0)]).filter(([,amount]) => Number(amount) > 0));
      const rewards = [gold ? `${gold} Gold` : "", gp ? `${gp} GP` : "", resourceList(bonus)].filter(Boolean);
      if (rewards.length) receipt += ` Goal rewards: ${rewards.join(" + ")}.`;
    }
    setMessage(receipt);
    queueMicrotask(() => { busy.current = false; });
  };
  if (tab === "Gathering" || tab === "Kitchen" || tab === "Workbench") return <GameDialog fullScreen title="Farm production" onClose={() => setTab("Storage")}><ProductionBook section={tab} onSection={setTab} onBack={() => setTab("Storage")}/></GameDialog>;
  if ((tab === "Storage" || tab === "Trade") && shelfOpen) return <GameDialog fullScreen title="Resource shelves" onClose={() => setShelfOpen(false)}><ResourceShelf initialMode={tab} onBack={() => setShelfOpen(false)}/></GameDialog>;
  if ((tab === "Feeding" || tab === "Security" || tab === "Budget") && shelfOpen) return <GameDialog fullScreen title="Farm care" onClose={() => setShelfOpen(false)}><FarmCareBook initialSection={tab} onBack={() => setShelfOpen(false)}/></GameDialog>;
  const paged = shelfOpen && (tab === "Guide" || tab === "Construction" || tab === "Orders");
  const entries = tab === "Guide" ? getProductionGuide(save).map(s => s.title) : tab === "Construction" ? Object.values(FACILITIES).map(f => f.name) : SUPPLY_ORDERS.map(o => o.name);
  const index = Math.min(page, entries.length - 1);
  const content = <section data-planning-book={paged || undefined} className={`${styles.panel} ${paged ? styles.book : ""}`}>
    {paged && <header className={styles.bookHeader}><button onClick={() => {if(trail.length){setPage(trail[trail.length-1]);setTrail(trail.slice(0,-1));}else if(onReturn)onReturn();else setShelfOpen(false);}}>{trail.length ? "‹ Previous project" : onReturn ? "‹ Return to recipe" : "‹ Resources"}</button><select aria-label="Planning section" value={tab} onChange={e => {setTab(e.target.value as Tab);setPage(0);setMessage("");}}>{["Guide","Construction","Orders"].map(t => <option key={t}>{t}</option>)}</select><span>{save.currencies.gold} Gold · {save.currencies.guildPoints} GP</span></header>}
    {paged && <div className={styles.pager}><button aria-label="Previous page" disabled={index === 0} onClick={() => setPage(index - 1)}>‹</button><label><span>{index + 1} / {entries.length}</span><select aria-label="Select page" value={index} onChange={e => {setPage(Number(e.target.value));setMessage("");}}>{entries.map((name,i) => <option key={name} value={i}>{name}</option>)}</select></label><button aria-label="Next page" disabled={index === entries.length - 1} onClick={() => setPage(index + 1)}>›</button></div>}
    {!paged && <>
    <div className={styles.intro}><img src="/images/ui/resources-v1/pantry-workbench.webp" alt="Sunlit farmhouse pantry and workbench with harvested food, planks and iron"/><div className={styles.heroCopy}><span>THE FARMSTEAD</span><h3>Pantry & Workshop</h3><p>Gather. Cook. Craft. Build.</p></div></div>
    <div className={styles.summary} aria-label="Farm production summary"><span><small>Ranch Day</small><b>{save.dayState.dayNumber}</b></span><span><small>Gold / GP</small><b>{save.currencies.gold} / {save.currencies.guildPoints}</b></span><span><small>Work actions today</small><b>{state.workDay === save.dayState.dayNumber ? state.workCount ?? 0 : 0}</b></span><span><small>Production sites built</small><b>{Object.values(state.facilities).filter(Boolean).length}</b></span></div>
    <nav className={styles.tabs} aria-label="Resource sections">{TABS[mode].map(t => <button key={t} aria-pressed={tab === t} onClick={() => {setTab(t); setPage(0); setShelfOpen(true); setMessage("");}}>{t === "Gathering" ? "Work locations" : t}</button>)}</nav>
    </>}
    <p role="status" aria-live="polite" className={styles.receipt}>{message || "Choose a section to manage production."}</p>
    {paged && tab === "Guide" && <><div className={styles.sectionTitle}><div><small>FARM FOUNDATIONS</small><h4>Your first production chain</h4></div><b>{getProductionGuide(save).filter(step=>step.done).length} / 4 complete</b></div><p>Learn through real work. Steps remain complete after spending supplies. Finish all four for 75 Gold and 5 GP.</p><div className={styles.guideSteps}>{getProductionGuide(save).slice(index,index+1).map((step)=><article key={step.title} data-complete={step.done}><img src={`/images/ui/resources-v2/${index===2?"planks":"wood"}.webp`} alt=""/><div><small>{step.done ? "✓ Complete" : `Step ${index+1}`}</small><h4>{step.title}</h4><button onClick={() => setDetails(step.text)}>Step details</button><button onClick={()=>step.tab==="Construction"?goToTown():setTab(step.tab)}>{step.tab==="Construction"?"Visit town → Petra":"Open "+step.tab}</button></div></article>)}</div><button disabled={!!save.flags.productionGuideClaimed||!getProductionGuide(save).every(step=>step.done)} onClick={()=>run(claimProductionGuide)}>{save.flags.productionGuideClaimed?"Reward claimed":"Claim 75 Gold + 5 GP"}</button></>}
    {paged && tab === "Construction" && <><button onClick={() => setDetails("The woodlot, shallow iron deposit, garden, kitchen and workbench are inherited. Petra shares one construction crew across all building projects. Construction takes one night; benefits begin after completion. Reserved stock cannot be spent.")}>Construction rules</button>{state.project && <p className={styles.receipt}>{FACILITIES[state.project.id].name} underway · ready Day {state.project.readyDay}</p>}<div className={styles.grid}>{(Object.keys(FACILITIES) as FacilityId[]).slice(index,index+1).map(id => {const f = FACILITIES[id]; const prerequisite = f.prerequisite as FacilityId; const locked = !!prerequisite && !state.facilities[prerequisite]; return <article key={id}><small>{state.facilities[id] ? "Built" : locked ? `Requires ${FACILITIES[prerequisite].name}` : "One night"}</small><h4><img className={styles.itemArt} src={getResourceArt(id === "quarry" ? "stone" : id === "sawmill" || id === "woodlot_upgrade" ? "planks" : id === "kiln" ? "charcoal" : id === "forge" ? "nails" : "iron")} alt=""/>{f.name}</h4><button onClick={() => setDetails(f.description)}>Project benefits</button><p>{f.gold} Gold labor + {resourceList(f.inputs)}</p><div className={styles.controls}>{Object.entries(f.inputs).map(([key,n]) => {const id=key as ResourceId;return <button key={id} aria-label={`Source ${RESOURCES[id].name}`} onClick={()=>setSource({id,needed:Math.max(1,n-Math.max(0,(state.stock[id]??0)-(state.reserves[id]??0)))})}>{RESOURCES[id].name} sources</button>;})}</div>{resourceShortages(state,f.inputs).length>0&&<p className={styles.shortage}>Missing: {resourceShortages(state,f.inputs).join(" + ")}</p>}<div className={styles.controls}>{locked && <button onClick={() => {setTrail([...trail,index]);setPage(Object.keys(FACILITIES).indexOf(prerequisite));setMessage("");}}>Open {FACILITIES[prerequisite].name}</button>}<button disabled={!!state.facilities[id] || !!state.project || !!save.flags.builderWorkOrderV1 || locked || save.currencies.gold < f.gold || !canSpend(state, f.inputs)} onClick={() => setReview({text:`Commission ${f.name} for ${f.gold} Gold + ${resourceList(f.inputs)}?`, action:s => commissionFacility(s,id)})}>{state.facilities[id] ? "Completed" : "Review construction"}</button></div></article>;})}</div></>}
    {paged && tab === "Orders" && <><button onClick={() => setDetails("Each order pays its listed Gold and GP once. Accepting is free. Deliver when ready: orders do not expire or replace weekly board requests. Reserved stock is protected.")}>Order rules</button><div className={styles.grid}>{SUPPLY_ORDERS.slice(index,index+1).map(o => <article key={o.id}><small>{state.orders[o.id] ?? "Available"}</small><h4>{o.name}</h4><p>Deliver {resourceList(o.inputs)}</p><p>Reward: {o.gold} Gold · {o.gp} GP</p>{o.prerequisite && <p>Requires {FACILITIES[o.prerequisite].name}</p>}<button disabled={state.orders[o.id] === "completed" || !!o.prerequisite && !state.facilities[o.prerequisite] || state.orders[o.id] === "accepted" && !canSpend(state,o.inputs)} onClick={() => state.orders[o.id] === "accepted" ? setReview({text:`Deliver ${resourceList(o.inputs)} for ${o.gold} Gold and ${o.gp} GP?`,action:s=>actSupplyOrder(s,o.id)}) : run(s=>actSupplyOrder(s,o.id))}>{state.orders[o.id] === "completed" ? "Completed" : state.orders[o.id] === "accepted" ? "Review delivery" : "Accept order"}</button></article>)}</div></>}
    {source && <IngredientCounter key={source.id} resourceId={source.id} needed={source.needed} onClose={()=>setSource(null)}/>}
    {details && <GameDialog title="Details" onClose={() => setDetails(null)}><p>{details}</p><button onClick={() => setDetails(null)}>Back to page</button></GameDialog>}
    {review && <GameDialog title="Review transaction" onClose={()=>setReview(null)}><p>{review.text}</p><div className={styles.controls}><button onClick={()=>{run(review.action);setReview(null);}}>Confirm</button><button onClick={()=>setReview(null)}>Cancel</button></div></GameDialog>}
  </section>;
  return paged ? <GameDialog fullScreen title={tab} onClose={() => onReturn ? onReturn() : setShelfOpen(false)}>{content}</GameDialog> : content;
}
