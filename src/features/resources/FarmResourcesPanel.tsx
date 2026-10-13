"use client";
import { FarmCareBook } from "./FarmCareBook";
import { ResourceShelf } from "./ResourceShelf";
import { ProductionBook } from "./ProductionBook";
import { useEffect, useRef, useState } from "react";
import { useGameContext } from "@/state/GameProvider";
import { GameDialog } from "@/features/ui/GameDialog";
import { getProductionGuide, claimProductionGuide, resourceShortages, FACILITIES, SUPPLY_ORDERS, getFarmState, resourceList, canSpend, commissionFacility, actSupplyOrder, type FacilityId, type FarmResult } from "@/data/farmResources";
import styles from "./FarmResourcesPanel.module.css";
type Mode = "ranch" | "builder" | "guild" | "market";
type Tab = "Budget" | "Security" | "Guide" | "Feeding" | "Storage" | "Gathering" | "Kitchen" | "Workbench" | "Construction" | "Orders" | "Trade";
const TABS: Record<Mode, Tab[]> = { ranch: ["Gathering", "Security", "Storage", "Feeding", "Kitchen", "Workbench", "Guide", "Budget"], builder: ["Construction", "Storage", "Budget"], guild: ["Orders", "Storage"], market: ["Trade", "Storage"] };
export function FarmResourcesButton({ mode = "ranch", label = "Resources & recipes" }: { mode?: Mode; label?: string }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)}>{label}</button>{open && <GameDialog title={label} onClose={() => setOpen(false)} wide><FarmResourcesPanel mode={mode}/></GameDialog>}</>;
}
export function FarmResourcesPanel({ mode }: { mode: Mode }) {
  const { currentSave: save, saveCurrentGame, goToTown } = useGameContext();
  const [tab, setTab] = useState<Tab>(TABS[mode][0]);
  const [shelfOpen, setShelfOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState<{ text: string; action: (s: NonNullable<typeof save>) => FarmResult } | null>(null);
  const latest = useRef(save);
  useEffect(() => { latest.current = save; }, [save]);
  if (!save) return null;
  const state = getFarmState(save);
  const run = (action: (s: NonNullable<typeof save>) => FarmResult) => {
    if (!latest.current) return;
    const result = action(latest.current);
    if (result.ok) latest.current = saveCurrentGame(result.save);
    setMessage(result.message);
  };
  if (tab === "Gathering" || tab === "Kitchen" || tab === "Workbench") return <GameDialog fullScreen title="Farm production" onClose={() => setTab("Storage")}><ProductionBook section={tab} onSection={setTab} onBack={() => setTab("Storage")}/></GameDialog>;
  if ((tab === "Storage" || tab === "Trade") && shelfOpen) return <GameDialog fullScreen title="Resource shelves" onClose={() => setShelfOpen(false)}><ResourceShelf initialMode={tab} onBack={() => setShelfOpen(false)}/></GameDialog>;
  if ((tab === "Feeding" || tab === "Security" || tab === "Budget") && shelfOpen) return <GameDialog fullScreen title="Farm care" onClose={() => setShelfOpen(false)}><FarmCareBook initialSection={tab} onBack={() => setShelfOpen(false)}/></GameDialog>;
  return <section className={styles.panel}>
    <div className={styles.intro}><img src="/images/ui/resources-v1/pantry-workbench.webp" alt="Sunlit farmhouse pantry and workbench with harvested food, planks and iron"/><div className={styles.heroCopy}><span>THE FARMSTEAD</span><h3>Pantry & Workshop</h3><p>Gather. Cook. Craft. Build.</p></div></div>
    <div className={styles.summary} aria-label="Farm production summary"><span><small>Ranch Day</small><b>{save.dayState.dayNumber}</b></span><span><small>Gold / GP</small><b>{save.currencies.gold} / {save.currencies.guildPoints}</b></span><span><small>Work actions today</small><b>{state.workDay === save.dayState.dayNumber ? state.workCount ?? 0 : 0}</b></span><span><small>Production sites built</small><b>{Object.values(state.facilities).filter(Boolean).length}</b></span></div>
    <nav className={styles.tabs} aria-label="Resource sections">{TABS[mode].map(t => <button key={t} aria-pressed={tab === t} onClick={() => {setTab(t); setShelfOpen(true); setMessage("");}}>{t === "Gathering" ? "Work locations" : t}</button>)}</nav>
    <p role="status" aria-live="polite" className={styles.receipt}>{message || "Choose a section to manage production."}</p>
    {tab === "Guide" && <><div className={styles.sectionTitle}><div><small>FARM FOUNDATIONS</small><h4>Your first production chain</h4></div><b>{getProductionGuide(save).filter(step=>step.done).length} / 4 complete</b></div><p>Learn through real work. Steps remain complete after spending supplies. Finish all four for 75 Gold and 5 GP.</p><div className={styles.guideSteps}>{getProductionGuide(save).map((step,index)=><article key={step.title} data-complete={step.done}><img src={`/images/ui/resources-v2/${index===2?"planks":"wood"}.webp`} alt=""/><div><small>{step.done ? "✓ Complete" : `Step ${index+1}`}</small><h4>{step.title}</h4><p>{step.text}</p><button onClick={()=>step.tab==="Construction"?goToTown():setTab(step.tab)}>{step.tab==="Construction"?"Visit town → Petra":"Open "+step.tab}</button></div></article>)}</div><button disabled={!!save.flags.productionGuideClaimed||!getProductionGuide(save).every(step=>step.done)} onClick={()=>run(claimProductionGuide)}>{save.flags.productionGuideClaimed?"Reward claimed":"Claim 75 Gold + 5 GP"}</button></>}
    {tab === "Construction" && <><p>The woodlot, shallow iron deposit, garden, kitchen and workbench are inherited. Petra shares one construction crew across production and other building projects. New projects take one night; benefits begin after completion.</p>{state.project && <p className={styles.receipt}>{FACILITIES[state.project.id].name} underway · ready Day {state.project.readyDay}</p>}<div className={styles.grid}>{(Object.keys(FACILITIES) as FacilityId[]).map(id => {const f = FACILITIES[id]; const prerequisite = f.prerequisite as FacilityId; const locked = !!prerequisite && !state.facilities[prerequisite]; return <article key={id}><small>{state.facilities[id] ? "Built" : locked ? `Requires ${FACILITIES[prerequisite].name}` : "One night"}</small><h4>{f.name}</h4><p>{f.description}</p><p>{f.gold} Gold + {resourceList(f.inputs)}</p>{resourceShortages(state,f.inputs).length>0&&<p className={styles.shortage}>Missing: {resourceShortages(state,f.inputs).join(" + ")}</p>}<button disabled={!!state.facilities[id] || !!state.project || !!save.flags.builderWorkOrderV1 || locked || save.currencies.gold < f.gold || !canSpend(state, f.inputs)} onClick={() => setReview({text:`Commission ${f.name} for ${f.gold} Gold + ${resourceList(f.inputs)}?`, action:s => commissionFacility(s,id)})}>{state.facilities[id] ? "Completed" : "Review construction"}</button></article>;})}</div></>}
    {tab === "Orders" && <><p>Introductory supply orders pay Gold and GP once each. Accept now, deliver when ready; they do not expire or replace weekly board requests. Reserved stock is protected.</p><div className={styles.grid}>{SUPPLY_ORDERS.map(o => <article key={o.id}><small>{state.orders[o.id] ?? "Available"}</small><h4>{o.name}</h4><p>Deliver {resourceList(o.inputs)}</p><p>Reward: {o.gold} Gold · {o.gp} GP</p>{o.prerequisite && <p>Requires {FACILITIES[o.prerequisite].name}</p>}<button disabled={state.orders[o.id] === "completed" || !!o.prerequisite && !state.facilities[o.prerequisite] || state.orders[o.id] === "accepted" && !canSpend(state,o.inputs)} onClick={() => state.orders[o.id] === "accepted" ? setReview({text:`Deliver ${resourceList(o.inputs)} for ${o.gold} Gold and ${o.gp} GP?`,action:s=>actSupplyOrder(s,o.id)}) : run(s=>actSupplyOrder(s,o.id))}>{state.orders[o.id] === "completed" ? "Completed" : state.orders[o.id] === "accepted" ? "Review delivery" : "Accept order"}</button></article>)}</div></>}
    {review && <GameDialog title="Review transaction" onClose={()=>setReview(null)}><p>{review.text}</p><div className={styles.controls}><button onClick={()=>{run(review.action);setReview(null);}}>Confirm</button><button onClick={()=>setReview(null)}>Cancel</button></div></GameDialog>}
  </section>;
}
