"use client";

import { useState, type ReactNode } from "react";
import { getVariantDefinition } from "@/data/creatures";
import type { ColiseumCreatureXpSummary, ColiseumCombatPerformanceMap } from "@/data/coliseumC2";
import type { CreatureRecord } from "@/types/creature";
import { GameDialog } from "@/features/ui/GameDialog";
import s from "./BattleResultLedger.module.css";

export type BattleResultLedgerData = {
  rewards: string; rewardIcon?: string; summaries: ColiseumCreatureXpSummary[]; performance: ColiseumCombatPerformanceMap;
  onRecord: () => void; recordLabel: string; continuation?: string;
};
export function BattleResultLedger({title,outcome,creatures,data,recording,onBack,details,log}:{title:string;outcome:string;creatures:CreatureRecord[];data:BattleResultLedgerData;recording:boolean;onBack:()=>void;details:ReactNode;log:string[]}) {
  const [popup,setPopup]=useState<"recap"|"details"|null>(null);
  const [selected,setSelected]=useState(0);
  function art(c:CreatureRecord,full=false){const v=getVariantDefinition(c.variantId);return full?c.profilePath||v.profilePath||c.portraitPath||v.portraitPath:c.portraitPath||v.portraitPath;}
  return <main className={s.screen} data-result-ledger>
    <header><h1>{outcome==="player_won"?"Victory":outcome==="enemy_won"?"Defeat":"Draw"}</h1><p>{title}</p></header>
    <section className={s.team} aria-label="Your battle team">{creatures.map((c,i)=><figure key={c.creatureId} data-selected={selected===i}><img src={art(c,true)} alt={`${c.nickname}, full body`}/><figcaption>{c.nickname}</figcaption></figure>)}</section>
    <section className={s.ledger} aria-label="Battle rewards and progress"><h2>Battle Rewards</h2><div className={s.rewards}><img src={data.rewardIcon??"/images/ui/guild-v1/gold.webp"} alt=""/><strong>{data.rewards}</strong></div><h2>Creature Progress</h2><div className={s.rows}>{data.summaries.map((entry,i)=>{const c=creatures.find(c=>c.creatureId===entry.creatureId);return <button className={s.row} key={entry.creatureId} data-selected={selected===i} aria-label={`Progress ${entry.creatureName}`} aria-pressed={selected===i} onClick={()=>{setSelected(i);setPopup("details");}}>{c&&<img src={art(c)} alt=""/>}<span><strong>{entry.creatureName} · Lv. {entry.levelBefore}{entry.levelAfter!==entry.levelBefore?` → ${entry.levelAfter}`:""}</strong><span className={s.xp}><i style={{width:`${Math.min(100,100*entry.xpAfter/Math.max(1,entry.xpToNextAfter))}%`}}/></span><small>{entry.xpAfter}/{entry.xpToNextAfter} XP toward next level</small>{c&&Object.entries(entry.statGrowth).length>0&&<small>{Object.entries(entry.statGrowth).slice(0,1).map(([key,gain])=>`${key} ${c.stats[key as keyof typeof c.stats]} → ${c.stats[key as keyof typeof c.stats]+(gain??0)}`).join("")}{Object.entries(entry.statGrowth).length>1?" · More…":""}</small>}</span><b>+{entry.xpGained} XP</b></button>;})}</div><p className={s.note}>Innate grades unchanged · Select a creature for growth details.</p>{data.continuation&&<p className={s.continuation}>{data.continuation}</p>}<div className={s.ledgerFooter}><span>Preview · not yet recorded</span><button onClick={()=>setPopup("recap")}>Battle Recap</button></div></section>
    <footer className={s.footer}><button onClick={onBack} disabled={recording}>Back to Battlefield</button><button className={s.primary} onClick={data.onRecord} disabled={recording}>{recording?"Recording…":data.recordLabel}</button></footer>
    {popup==="recap"&&<GameDialog title="Battle Recap" onClose={()=>setPopup(null)}>{creatures.map(c=>{const p=data.performance[String(c.creatureId)];return p?<section key={c.creatureId}><h3>{c.nickname}</h3><p>Damage {p.damageDealt} · Healing {p.healingDone} · Knockouts {p.knockouts}</p><p>Actions {p.actionsTaken} · Misses {p.misses} · Statuses applied {p.statusesApplied}</p></section>:null;})}<h3>Round log</h3>{log.map((line,i)=><p key={i}>{line}</p>)}</GameDialog>}
    {popup==="details"&&<GameDialog title="Result Details" onClose={()=>setPopup(null)}>{data.summaries[selected]&&(()=>{const e=data.summaries[selected],c=creatures.find(c=>c.creatureId===e.creatureId);return <><h3>{e.creatureName} · +{e.xpGained} XP</h3><p>Level {e.levelBefore} → {e.levelAfter}</p>{Object.entries(e.statGrowth).length?Object.entries(e.statGrowth).map(([key,gain])=><p key={key}>{key}: {c?.stats[key as keyof typeof c.stats]} → {(c?.stats[key as keyof typeof c.stats]??0)+(gain??0)} · Grade {c?.statGrades[key as keyof typeof c.statGrades]} unchanged</p>):<p>No numeric stat gains this battle.</p>}{e.notes.map((note,i)=><p key={i}>{note}</p>)}</>;})()}{details}</GameDialog>}
  </main>;
}
