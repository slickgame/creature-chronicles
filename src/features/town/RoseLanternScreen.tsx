"use client";

import { useState } from "react";
import { applyStarterGoalRewards } from "@/data/starterGoals";
import { acceptRoseLanternHouseRules, acceptRoseLanternRequest, claimRoseLanternRequest, collectRoseLanternSupplyFavor, getRoseLanternAccess, getRoseLanternActivityBlocker, getRoseLanternRequest, getRoseLanternShiftReward, getRoseLanternState, getRoseLanternTrustRank, ROSE_RUMOR_TOPICS, spendRoseLanternRumorToken, visitRoseLanternSalon, workRoseLanternHospitalityShift, type RoseLanternActionResult, type RoseRumorTopic } from "@/data/roseLantern";
import { useGameContext } from "@/state/GameProvider";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { GameDialog } from "@/features/ui/GameDialog";
import styles from "./RoseLanternScreen.module.css";

const TABS = ["Salon", "Hospitality", "Rumor Network", "House Requests"] as const;
type Tab = typeof TABS[number];
type Popup = "rules" | "visit" | "shift" | "rumor" | "favor" | "request" | "ledger" | "report" | null;

export function RoseLanternScreen({ onClose }: { onClose: () => void; embedded?: boolean }) {
  const { currentSave: save, saveCurrentGame, goToGuildHall, goToSupplyDepot, goToRanch } = useGameContext();
  const { open } = useNavigation();
  const [tab, setTab] = useState<Tab>("Salon");
  const [topic, setTopic] = useState<RoseRumorTopic>("ranch");
  const [popup, setPopup] = useState<Popup>(null);
  const [message, setMessage] = useState("");
  if (!save) return null;
  const state = getRoseLanternState(save), access = getRoseLanternAccess(save), rank = getRoseLanternTrustRank(state.trust), request = getRoseLanternRequest(save);
  const entered = access.unlocked && state.houseRulesAccepted;
  const shiftGold = getRoseLanternShiftReward(save);
  const action = tab === "Salon" ? "visit" : tab === "Hospitality" ? "shift" : "rumor";
  const blocker = getRoseLanternActivityBlocker(save,action,topic);
  const favorBlocker = getRoseLanternActivityBlocker(save,"favor");
  const requestProgress = request ? <ul className={styles.progressList}>{([["visits","Salon visits"],["shifts","Hospitality shifts"],["rumors","Rumor topics"],["trust","House Trust"]] as const).filter(([key]) => request.definition[key] > 0).map(([key,label]) => <li key={key}><span>{label}</span><strong>{request.accepted || key === "trust" ? Math.min(request.definition[key],request.progress[key]) : 0} / {request.definition[key]}</strong></li>)}</ul> : null;
  function apply(result: RoseLanternActionResult) {
    let receipt = result.message;
    if (result.ok) {
      const rewarded = applyStarterGoalRewards(result.save);
      if (rewarded !== result.save) receipt += ` Additional starter-goal rewards: ${String(rewarded.flags.starterGoalRewardsLastClaimed)}.`;
      saveCurrentGame(rewarded);
    }
    setMessage(receipt); setPopup("report");
  }
  const titles = { rules: "Welcome to the Rose Lantern", visit: "Salon Visit", shift: "Hospitality Shift", rumor: "Ask the Rumor Network", favor: "Weekly Supply Favor", request: "House Request", ledger: "House Ledger", report: "Rose Lantern Receipt" };
  return <main className={styles.house} data-rose-lantern>
    <header className={styles.header}><button onClick={onClose}>‹ Town</button><div><small>Madam Selene Vale</small><h1>The Rose Lantern</h1></div><button data-navigation-launcher onClick={() => open("menu")}>Menu</button></header>
    <div className={styles.resources}><span>{save.currencies.gold} Gold</span><span>{save.currencies.energy} Energy</span><span>{state.rumorTokens} Rumor Tokens</span></div>
    <section className={styles.workspace}>
      <div className={styles.scene}><div className={styles.sign}>Welcome to the salon</div><section className={styles.host}><small>YOUR PLACE IN THE HOUSE</small><h2>{rank.label}</h2><p>{state.trust} / 100 Trust{rank.nextAt ? ` · Next rank at ${rank.nextAt}` : ""}</p><progress value={state.trust} max={100} aria-label="House Trust"/><p className={styles.flavor}>“A familiar face, a helping hand, a useful word. That’s how a house becomes a community.”</p><button onClick={() => setPopup("ledger")}>House ledger & perks</button></section></div>
      <aside className={styles.card}>
        {!entered ? <><small>Adults-Only Social House</small><h2>{access.unlocked ? "An open invitation" : "The lanterns are still dark"}</h2><p>{access.unlocked ? "Meet the regulars, help the house, and exchange local news. Participation is optional." : access.reason}</p>{access.unlocked && <button onClick={() => setPopup("rules")}>Read house rules</button>}</> : <>
          <small>RANCH DAY {save.dayState.dayNumber}</small><h2>{tab}</h2>
          {tab === "Salon" && <><p className={styles.description}>Share a table with the regulars and get to know the house.</p><div className={styles.terms}>10 Gold<br/><strong>+2 Trust · +1 Rumor Token</strong></div><p>Once per ranch day.</p><p className={styles.status}>{blocker ?? "A seat is available."}</p><button className={styles.primary} disabled={!!blocker} onClick={() => setPopup("visit")}>Review salon visit</button></>}
          {tab === "Hospitality" && <><p className={styles.description}>Help with tables, guest service, and the evening schedule.</p><div className={styles.terms}>15 Energy<br/><strong>+{shiftGold} Gold · +3 Trust · +1 Rumor Token</strong></div><p>Once per ranch day. Trust improves your pay.</p><p className={styles.status}>{blocker ?? "The crew could use a hand."}</p><button className={styles.primary} disabled={!!blocker} onClick={() => setPopup("shift")}>Review hospitality shift</button></>}
          {tab === "Rumor Network" && <><p className={styles.description}>Choose a topic: 1 token each, once per topic per day. Notes stay in your ledger.</p><div className={styles.topics}>{ROSE_RUMOR_TOPICS.map(t => <button key={t.id} aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>{t.name}{state.topicDays[t.id] === save.dayState.dayNumber ? " ✓" : ""}</button>)}</div><p className={styles.status}>{blocker ?? "A fresh report is available."}</p><button className={styles.primary} disabled={!!blocker} onClick={() => setPopup("rumor")}>Review rumor · 1 token</button><button onClick={() => setPopup("favor")}>Weekly supply favor</button></>}
          {tab === "House Requests" && (request ? <><h3>{request.definition.title}</h3>{requestProgress}<div className={styles.terms}>{request.definition.gold} Gold · {request.definition.gp} GP · +{request.definition.trustReward} Trust</div><p className={styles.status}>{request.accepted ? request.ready ? "Ready to claim." : "Request underway." : "Accept first. New activities count from acceptance."}</p><button className={styles.primary} onClick={() => setPopup("request")}>Review house request</button></> : <><h3>House partnership</h3><p>You completed all three requests.</p><div className={styles.terms}>+10 Gold on every future hospitality shift.</div><button onClick={() => setPopup("ledger")}>View house ledger</button></>)}
        </>}
      </aside>
    </section>
    <nav className={styles.tabs} aria-label="Rose Lantern activities">{TABS.map(t => <button key={t} aria-pressed={tab === t} disabled={!entered} onClick={() => setTab(t)}>{t}</button>)}</nav>
    {popup && <GameDialog title={titles[popup]} onClose={() => setPopup(null)}><div className={styles.paper}>
      {popup === "rules" && <><h3>House rules</h3><p>Every participant here is an adult. Social and romantic interactions are optional and require consent. You may leave or decline at any time.</p><p>Hospitality work is ordinary front-of-house work. No romance is required, and this venue is optional for the ranch story.</p><button onClick={() => apply(acceptRoseLanternHouseRules(save))}>Acknowledge House Rules</button></>}
      {popup === "visit" && <><p>Pay 10 Gold for +2 House Trust and +1 Rumor Token. One salon visit per ranch day.</p><p>Gold after visit: {save.currencies.gold-10}.</p><button disabled={!!getRoseLanternActivityBlocker(save,"visit")} onClick={() => apply(visitRoseLanternSalon(save))}>Confirm salon visit</button></>}
      {popup === "shift" && <><p>Spend 15 Energy. Receive {shiftGold} Gold, +3 House Trust and +1 Rumor Token. One shift per ranch day.</p><p>After shift: {save.currencies.energy-15} Energy · {save.currencies.gold+shiftGold} Gold.</p><button disabled={!!getRoseLanternActivityBlocker(save,"shift")} onClick={() => apply(workRoseLanternHospitalityShift(save))}>Confirm hospitality shift</button></>}
      {popup === "rumor" && <><h3>{ROSE_RUMOR_TOPICS.find(t => t.id === topic)?.name}</h3><p>Spend 1 Rumor Token for a report based on the current ranch and town. This topic refreshes tomorrow; saved notes remain free to read.</p>{blocker && <p>{blocker}</p>}<button disabled={!!getRoseLanternActivityBlocker(save,"rumor",topic)} onClick={() => apply(spendRoseLanternRumorToken(save,topic))}>Confirm rumor · 1 token</button></>}
      {popup === "favor" && <><h3>A favor from the regulars</h3><p>Requires 15 House Trust. Exchange 2 Rumor Tokens for 3 Feed and 2 Materials, once per week. Resets Monday.</p><p>{favorBlocker ?? "Your weekly parcel is available."}</p><button disabled={!!favorBlocker} onClick={() => apply(collectRoseLanternSupplyFavor(save))}>Collect supply favor</button></>}
      {popup === "request" && request && <><h3>{request.definition.title}</h3><p>{request.definition.description}</p>{requestProgress}<p>Reward: {request.definition.gold} Gold · {request.definition.gp} GP · +{request.definition.trustReward} Trust.</p>{request.stage === 2 && <p>Also unlocks a permanent +10 Gold per hospitality shift.</p>}<p>Visits, shifts and rumors count after accepting. Your current House Trust counts immediately.</p>{request.accepted ? <button disabled={!request.ready} onClick={() => apply(claimRoseLanternRequest(save))}>Claim house reward</button> : <button onClick={() => apply(acceptRoseLanternRequest(save))}>Accept house request</button>}</>}
      {popup === "ledger" && <><h3>House standing</h3><p>{rank.label} · {state.trust}/100 Trust · {state.requestStage}/3 requests complete.</p><p>Hospitality pay: {shiftGold} Gold. Trust raises base pay from 32 to 50 Gold; completing all requests adds another 10 Gold.</p><p>15 Trust: weekly supply favors. Final request: 35 Trust plus its listed activities.</p><p>{state.requestStage >= 3 ? "House partnership active: +10 shift Gold." : "House partnership: complete all three requests."}</p><h3>Latest report · Day {state.lastRumorDayNumber || "—"}</h3><p>{state.lastRumor || "No reports yet."}</p><p>Reports describe the ranch at the time they were heard.</p><div className={styles.links}><button onClick={goToRanch}>Visit ranch</button><button onClick={goToGuildHall}>Visit Guild Hall</button><button onClick={goToSupplyDepot}>Visit Supply Depot</button></div><h3>Recent history</h3>{state.history.length ? state.history.map((entry,index) => <p key={`${index}-${entry}`}>{entry}</p>) : <p>No visits recorded yet.</p>}</>}
      {popup === "report" && <><p role="status">{message}</p><p>Now: {save.currencies.gold} Gold · {save.currencies.guildPoints} GP · {save.currencies.energy} Energy · {state.rumorTokens} Rumor Tokens · {Number(save.flags.ranchFeedStock ?? 0)} Feed · {Number(save.flags.ranchMaterialsStock ?? 0)} Materials.</p><button onClick={() => setPopup(null)}>Return to salon</button></>}
    </div></GameDialog>}
  </main>;
}
