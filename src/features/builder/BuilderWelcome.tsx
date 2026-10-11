"use client";
import { FarmResourcesButton } from "@/features/resources/FarmResourcesPanel";
import { FACILITIES, getFarmState } from "@/data/farmResources";
import { useState } from "react";
import { getPetraAdvice, getPetraRequests, actOnPetraRequest, chatWithLocationHost, getLocationTrust, hasChattedToday } from "@/data/locationInteractions";
import { getBuilderWorkOrder, getBuilderProject } from "@/data/builderProjects";
import { useGameContext } from "@/state/GameProvider";
import { GameDialog } from "@/features/ui/GameDialog";
import { LocationScene, locationStyles as s } from "@/features/locations/LocationScene";
export function BuilderWelcome({ onClose, onPlans }: { onClose: () => void; onPlans: () => void }) {
  const { currentSave: save, saveCurrentGame, goToSupplyDepot, goToRanchJobs } = useGameContext();
  const [popup, setPopup] = useState<"talk" | "requests" | null>(null);
  const [message, setMessage] = useState("");
  if (!save) return null;
  const order = getBuilderWorkOrder(save);
  const production = getFarmState(save).project;
  const quests = getPetraRequests(save);
  return <><LocationScene title="Builder’s Yard" subtitle="Petra’s workshop" background="/images/ui/locations-v2/builder-yard.webp" portrait="/images/ui/locations-v2/petra.webp" name="Petra Hale · Master Builder" resources={`${save.currencies.gold} Gold · ${getFarmState(save).stock.wood ?? 0} Wood · ${getLocationTrust(save,"petra")} Trust`} onBack={onClose}>
    <span className={s.eyebrow}>Timber, stone & a steady hand</span><h2>Let’s build something that lasts.</h2>
    <p>{production ? `${FACILITIES[production.id].name} is underway. The crew finishes on Ranch Day ${production.readyDay}.` : order ? `Your ${getBuilderProject(order.projectId).title} is underway. The crew finishes on Ranch Day ${order.readyDay}.` : "“Come in. We’ll find the right next step for your ranch before you spend a single coin.”"}</p>
    <p className={s.secondaryCopy}>Talk through your plans with Petra, check on the crew, or browse the project catalogue.</p>
    <div className={s.choices}><FarmResourcesButton mode="builder" label="Production sites & upgrades"/>
      <button onClick={() => {setMessage("");setPopup("talk");}}><span><strong>Talk to Petra</strong><small>Conversation, advice & her approach to building</small></span></button>
      <button onClick={() => {setMessage("");setPopup("requests");}}><span><strong>Petra’s requests</strong><small>{quests.filter(q=>q.claimed).length}/3 completed · Gold, GP & Trust</small></span></button>
      <button className={s.primary} onClick={onPlans}><span><strong>Blueprints & work orders →</strong><small>Land, habitat capacity, security & crew progress</small></span></button>
    </div>
  </LocationScene>
  {popup === "talk" && <GameDialog title="A Word with Petra" onClose={() => setPopup(null)}><div className={s.paper}><h3>Petra Hale · Master Builder</h3><p>“I grew up repairing things that were meant to be temporary. These days, I try to build things the next generation won’t have to apologize for.”</p><p>Trust: {getLocationTrust(save,"petra")} · Conversation grants +2 Trust once per ranch day. Advice is free.</p><button disabled={hasChattedToday(save,"petra")} onClick={() => {const result=chatWithLocationHost(save,"petra");if(result.ok)saveCurrentGame(result.save);setMessage(result.message);}}>{hasChattedToday(save,"petra") ? "Caught up today" : "Ask about her day · +2 Trust"}</button>{message && <p role="status" className={s.receipt}>{message}</p>}<h4>“What should I build next?”</h4><p>{getPetraAdvice(save)}</p><h4>“How does your crew work?”</h4><p>One project at a time. Pay the exact Gold and supplies shown on the work order, then finish ranch days to advance construction. Benefits begin when the project completes. Future plans are previews and cannot be commissioned yet.</p><button onClick={onPlans}>Browse blueprints</button><button onClick={goToRanchJobs}>Gather resources</button><button onClick={goToSupplyDepot}>Visit Supply Depot</button></div></GameDialog>}
  {popup === "requests" && <GameDialog title="Petra’s Requests & Trust" onClose={() => setPopup(null)}><div className={s.paper}><h3>A foundation for the ranch</h3><p>Trust: {getLocationTrust(save,"petra")} · Personal requests do not expire. Existing completed projects count. Rewards are claimed once each.</p>{message && <p role="status" className={s.receipt}>{message}</p>}{quests.map(q=><article key={q.index}><h4>{q.title} · {q.claimed ? "Completed" : q.locked ? "Locked" : q.ready ? "Ready to claim" : q.accepted ? "In progress" : "Available"}</h4><p>“{q.dialogue}”</p><p>{q.requirement}</p><p>{q.gold} Gold · {q.gp} GP · {q.trust} Trust{q.index===2 ? " · 4 Planks" : ""}</p>{!q.claimed&&!q.locked&&<><progress aria-label={`${q.title} progress`} value={q.current} max={q.target}/><p>{q.current}/{q.target}</p><button disabled={q.accepted&&!q.ready} onClick={()=>{const result=actOnPetraRequest(save,q.index,q.accepted);if(result.ok)saveCurrentGame(result.save);setMessage(result.message);}}>{q.accepted ? "Claim Petra’s reward" : "Accept Petra’s request"}</button></>}{q.locked&&<small>Complete the previous request first.</small>}</article>)}<button onClick={onPlans}>Browse blueprints</button></div></GameDialog>}
  </>;
}
