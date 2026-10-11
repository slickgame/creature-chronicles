"use client";

import { useState } from "react";
import { BUILDER_PROJECTS, commissionBuilderProject, getBuilderProject, getBuilderProjectBenefit, getBuilderProjectProgress, getBuilderWorkOrder, type BuilderProjectId } from "@/data/builderProjects";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { useGameContext } from "@/state/GameProvider";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { GameDialog } from "@/features/ui/GameDialog";
import styles from "./BuilderYardPanel.module.css";

const CATEGORIES = ["Land", "Habitats", "Security", "Future Plans"] as const;
type Category = typeof CATEGORIES[number];
const LABELS = { built: "Complete", building: "Under construction", planned: "Future plan", locked: "Requires another project", available: "Ready to plan" };

export function BuilderYardPanel({ onClose }: { onClose: () => void; embedded?: boolean }) {
  const { currentSave: save, saveCurrentGame, goToSupplyDepot } = useGameContext();
  const { open } = useNavigation();
  const [category, setCategory] = useState<Category>("Land");
  const [selectedId, setSelectedId] = useState<BuilderProjectId>("north_pasture_land");
  const [page, setPage] = useState(0);
  const [popup, setPopup] = useState<"review" | "security" | "ledger" | "report" | null>(null);
  const [message, setMessage] = useState("");
  if (!save) return null;
  const activeSave = save;
  const order = getBuilderWorkOrder(save);
  const threat = getPredatorThreatAssessment(save);
  const materials = Math.max(0, Number(save.flags.ranchMaterialsStock) || 0);
  const projects = BUILDER_PROJECTS.filter(p => category === "Future Plans" ? p.planned : !p.planned && p.category === ({ Land: "land", Habitats: "habitat", Security: "security" } as const)[category]);
  const project = projects.find(p => p.id === selectedId) ?? projects[0];
  const progress = getBuilderProjectProgress(save, project.id);
  const completed = BUILDER_PROJECTS.filter(p => getBuilderProjectProgress(save,p.id).built);
  const goldShort = Math.max(0, project.costGold - save.currencies.gold);
  const materialShort = Math.max(0, project.costMaterials - materials);
  const reason = progress.built ? "This project is complete." : project.planned ? "These species are not available yet. Keep this blueprint for a later chapter." : order ? `${getBuilderProject(order.projectId).title} is underway. One crew works on one project at a time.` : progress.missingPrerequisites.length ? `Complete ${progress.missingPrerequisites.map(p => p.title).join(" and ")} first.` : goldShort || materialShort ? `Still needed: ${goldShort} Gold · ${materialShort} Materials.` : "Resources ready. Review the work order before paying.";
  function chooseCategory(next: Category) { setCategory(next); setPage(0); }
  function commission() {
    const result = commissionBuilderProject(activeSave, project.id);
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message); setPopup("report");
  }
  const details = <>
    <p className={styles.eyebrow}>{LABELS[progress.status]}</p><h2>{project.title}</h2>
    <p>{project.description}</p><div className={styles.benefit}>{getBuilderProjectBenefit(project)}</div>
    {!project.planned && <><dl className={styles.costs}><div><dt>Gold</dt><dd>{project.costGold}</dd></div><div><dt>Materials</dt><dd>{project.costMaterials}</dd></div><div><dt>Build time</dt><dd>{project.durationDays ?? 1} ranch day{(project.durationDays ?? 1) > 1 ? "s" : ""}</dd></div></dl>{!!project.predatorPressure && <p>Once complete: +{project.predatorPressure} predator pressure from expanded land.</p>}</>}
    <p>{reason}</p>
  </>;
  return <main className={styles.yard} data-builder-yard>
    <header className={styles.header}><button onClick={onClose}>‹ Town</button><div><small>Petra Hale · Master Builder</small><h1>Builder’s Yard</h1></div><button data-navigation-launcher onClick={() => open("menu")}>Menu</button></header>
    <div className={styles.resources}><span>{save.currencies.gold} Gold</span><span>{materials} Materials</span><span>{completed.length} completed</span></div>
    <section className={styles.workspace}>
      <div className={styles.scene}><div className={styles.sign}>Petra’s workshop</div><div className={styles.workOrder}>
        <small>PETRA’S CREW</small><h2>{order ? getBuilderProject(order.projectId).title : "Ready for the next project"}</h2>
        {order ? <><p>Completes on Ranch Day {order.readyDay} · {Math.max(0,order.readyDay-save.dayState.dayNumber)} day(s) remaining</p><progress aria-label="Construction progress" max={order.readyDay-order.startedDay} value={Math.max(0,Math.min(order.readyDay-order.startedDay,save.dayState.dayNumber-order.startedDay))}/><p>Construction advances when you finish a ranch day.</p></> : <p>Choose a blueprint. We’ll review the costs and benefits together.</p>}
        <div className={styles.actions}><button onClick={() => setPopup("security")}>Ranch security · {threat.tier}</button><button onClick={() => setPopup("ledger")}>Work ledger</button></div>
      </div></div>
      <aside className={styles.blueprint}><div className={styles.desktopDetails}>{details}</div><div className={styles.compactDetails}><small>{LABELS[progress.status]}</small><h2>{project.title}</h2><p>{getBuilderProjectBenefit(project)}</p></div><button className={styles.primary} onClick={() => setPopup("review")}>{progress.built ? "View completed project" : project.planned ? "View future plan" : "Review work order"}</button><button onClick={goToSupplyDepot}>Buy materials</button></aside>
    </section>
    <section className={styles.catalog} aria-label="Project catalogue"><nav aria-label="Project categories">{CATEGORIES.map(c => <button key={c} aria-pressed={category === c} onClick={() => chooseCategory(c)}>{c}</button>)}</nav><div className={styles.projectRow}><button aria-label="Previous projects" disabled={page === 0} onClick={() => {setPage(page-1);setSelectedId(projects[(page-1)*2].id);}}>‹</button><div className={styles.cards}>{projects.slice(page*2,page*2+2).map(p => <button key={p.id} aria-pressed={p.id===project.id} onClick={() => setSelectedId(p.id)}><img src={p.iconPath} alt=""/><span><strong>{p.title}</strong><small>{LABELS[getBuilderProjectProgress(save,p.id).status]}</small></span></button>)}</div><button aria-label="Next projects" disabled={(page+1)*2>=projects.length} onClick={() => {setPage(page+1);setSelectedId(projects[(page+1)*2].id);}}>›</button></div></section>
    {popup === "review" && <GameDialog title={project.title} onClose={() => setPopup(null)}><div className={styles.paper}>{details}{progress.affordable && <p>Pay now: {project.costGold} Gold and {project.costMaterials} Materials. Remaining: {save.currencies.gold-project.costGold} Gold and {materials-project.costMaterials} Materials. Completion: Ranch Day {save.dayState.dayNumber+(project.durationDays??1)}. Benefits begin on completion.</p>}<div className={styles.actions}><button onClick={() => setPopup(null)}>Back to blueprints</button>{!project.planned&&!progress.built&&<button disabled={!progress.affordable} onClick={commission}>Confirm commission</button>}</div></div></GameDialog>}
    {popup === "ledger" && <GameDialog title="Petra’s Work Ledger" onClose={() => setPopup(null)}><div className={styles.paper}><h3>Active work order</h3>{order ? <p>{getBuilderProject(order.projectId).title} · Started Day {order.startedDay} · Completes Day {order.readyDay}<br/>Paid {order.paidGold} Gold and {order.paidMaterials} Materials.</p> : <p>No construction underway.</p>}<h3>Completed projects</h3>{completed.length ? completed.map(p => <section key={p.id}><h4>{p.title}</h4><p>{getBuilderProjectBenefit(p)}</p></section>) : <p>Your first project starts here.</p>}<p>Capacity additions stack with Ranch Office upgrades. Planned future habitats do not grant current creature capacity.</p></div></GameDialog>}
    {popup === "security" && <GameDialog title="Ranch Security Survey" onClose={() => setPopup(null)}><div className={styles.paper}><h3>Current ranch assessment</h3><dl className={styles.costs}><div><dt>Pressure</dt><dd>{threat.pressure}</dd></div><div><dt>Security</dt><dd>{threat.security}</dd></div><div><dt>Required</dt><dd>{threat.requiredSecurity}</dd></div></dl><p>Current incident chance: {threat.eventChance}%. Patrols and completed security projects protect the ranch.</p>{[...threat.reasons,...threat.blockers].map(t => <p key={t}>{t}</p>)}<button onClick={() => {chooseCategory("Security");setPopup(null);}}>View security blueprints</button></div></GameDialog>}
    {popup === "report" && <GameDialog title="Work Order Receipt" onClose={() => setPopup(null)}><div className={styles.paper}><p role="status">{message}</p><p>Current balance: {save.currencies.gold} Gold · {materials} Materials.</p><button onClick={() => setPopup(null)}>Return to yard</button></div></GameDialog>}
  </main>;
}
