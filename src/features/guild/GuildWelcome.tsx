"use client";
import { useState } from "react";
import { getNpcTrustSummary } from "@/data/townNpcs";
import { chatWithLocationHost, hasChattedToday } from "@/data/locationInteractions";
import { useGameContext } from "@/state/GameProvider";
import { GameDialog } from "@/features/ui/GameDialog";
import { LocationScene, locationStyles as s } from "@/features/locations/LocationScene";
export function GuildWelcome({ area, onArea, onDesk, onRequests }: { area: "entrance" | "mara"; onArea: (area: "entrance" | "mara" | "board") => void; onDesk: () => void; onRequests: () => void }) {
  const {currentSave:save,saveCurrentGame,goToTown}=useGameContext();
  const [talk,setTalk]=useState(false);
  const [message,setMessage]=useState("");
  if(!save)return null;
  const available=save.guild?.contracts.filter(q=>q.status==="available").length??0;
  const accepted=save.guild?.contracts.filter(q=>q.status==="accepted").length??0;
  return <><LocationScene title="Guild Hall" subtitle={area==="entrance"?"The town’s gathering place":"Mara’s quartermaster desk"} background="/images/ui/locations-v2/guild-hall.webp" portrait="/images/ui/locations-v2/mara.webp" name="Mara Vell · Quartermaster" resources={`${save.currencies.gold} Gold · ${save.currencies.guildPoints} GP · ${accepted} accepted requests`} onBack={area==="entrance"?goToTown:()=>onArea("entrance")} backLabel={area==="entrance"?"Town":"Guild Hall"}>
    <span className={s.eyebrow}>{area==="entrance"?"Promises become progress":"A familiar face behind the ledger"}</span><h2>{area==="entrance"?"Welcome to the Guild.":"“What can I help you with?”"}</h2>
    <p>{area==="entrance"?"Visit Mara for conversation, personal requests, grants and upgrades—or head straight to the mission board.":getNpcTrustSummary(save,"mara_vell")}</p>
    <div className={s.choices}>{area==="entrance"?<>
      <button onClick={()=>onArea("mara")}><img src="/images/ui/locations-v2/mara.webp" alt=""/><span><strong>Meet Mara</strong><small>Quartermaster · Requests, Trust & town improvements</small></span></button>
      <button className={s.primary} onClick={()=>onArea("board")}><img src="/images/ui/guild-v1/quill.webp" alt=""/><span><strong>Mission board →</strong><small>{available} available · {accepted} accepted · Weekly Gold & GP rewards</small></span></button>
    </>:<>
      <button onClick={()=>{setMessage("");setTalk(true);}}><span><strong>Talk to Mara</strong><small>Conversation & guidance</small></span></button>
      <button onClick={onRequests}><span><strong>Personal requests & Trust</strong><small>Her ongoing quest chain and reroll discount</small></span></button>
      <button className={s.primary} onClick={onDesk}><span><strong>Grants & town upgrades</strong><small>Spend GP and review your current benefits</small></span></button>
      <button onClick={()=>onArea("board")}>Visit mission board →</button>
    </>}</div>
  </LocationScene>
  {talk&&<GameDialog title="A Word with Mara" onClose={()=>setTalk(false)}><div className={s.paper}><h3>Mara Vell · Guild Quartermaster</h3><p>“Every notice has someone behind it. Read what they need, check what you can spare, and come back when the work is done.”</p><p>{getNpcTrustSummary(save,"mara_vell")}. Conversation grants +2 Trust once per ranch day.</p><button disabled={hasChattedToday(save,"mara")} onClick={()=>{const result=chatWithLocationHost(save,"mara");if(result.ok)saveCurrentGame(result.save);setMessage(result.message);}}>{hasChattedToday(save,"mara")?"Caught up today":"Ask about her day · +2 Trust"}</button>{message&&<p role="status" className={s.receipt}>{message}</p>}<h4>“Which request should I take?”</h4><p>Start with a delivery you can spare, a chore your helpers already suit, or a battle you are ready to win. Accept chore and battle requests before doing the work. Review every reward and deadline; creature placements are permanent.</p><h4>“What do my Guild Points buy?”</h4><p>GP buys permanent town upgrades at my desk. Compare the current and next tiers before confirming. My personal requests are separate from the weekly board and never expire.</p><h4>“When does the board change?”</h4><p>Unaccepted notices rotate when Sunday ends. Paid rerolls become more expensive each time during a week and reset Monday. Accepted progress and completed requests stay.</p><button onClick={()=>{setTalk(false);onArea("board");}}>Browse mission board</button><button onClick={()=>{setTalk(false);onRequests();}}>Ask about personal requests</button></div></GameDialog>}
  </>;
}
