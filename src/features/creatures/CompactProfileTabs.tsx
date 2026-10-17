"use client";

import { useEffect, useRef, useState } from "react";
import { getCreatureChoreSkillGroup, getChoreSkillAptitudeLabel, MAX_CHORE_SKILL_LEVEL } from "@/data/choreSkills";
import type { CreatureRecord } from "@/types/creature";
import { GameDialog } from "@/features/ui/GameDialog";
import { DetailButton } from "@/features/ui/DetailButton";
import s from "./CompactProfileTabs.module.css";

export type Entry = { id: string; title: string; summary: string; icon: string; iconPath?: string; meter?: {value:number;max:number;label:string}; details: string[]; action?: () => void };
function chunks(lines: string[]) {
  return lines.flatMap(line => {
    const words = line.split(/\s+/); const pages: string[] = []; let part = "";
    for (const word of words) { if (part.length + word.length > 280 && part) { pages.push(part); part = ""; } part += `${part ? " " : ""}${word}`; }
    if (part) pages.push(part); return pages;
  });
}
export function RecordDialog({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const pages = chunks(entry.details);
  return <GameDialog title={entry.title} onClose={onClose}><p className={s.detailText}>{pages[page] ?? entry.summary}</p>{pages.length > 1 ? <div className={s.pager} aria-label="Detail pages"><button disabled={page===0} onClick={()=>setPage(page-1)}>Previous detail</button><span aria-live="polite">{page+1} / {pages.length}</span><button disabled={page+1>=pages.length} onClick={()=>setPage(page+1)}>Next detail</button></div> : null}</GameDialog>;
}
export function Records({ title, entries }: { title: string; entries: Entry[] }) {
  const [requestedPage,setPage]=useState(0);
  const ref=useRef<HTMLElement>(null);
  const [capacity,setCapacity]=useState(2);
  useEffect(()=>{const element=ref.current;if(!element)return;const observer=new ResizeObserver(([entry])=>setCapacity(entry.contentRect.height>=430?6:entry.contentRect.height>=285?4:2));observer.observe(element);return()=>observer.disconnect();},[]);
  const [selected,setSelected]=useState<Entry|null>(null);
  const pages=Math.max(1,Math.ceil(entries.length/capacity)),page=Math.min(requestedPage,pages-1);
  return <section ref={ref} className={s.records} aria-label={title}><header className={s.heading}><h3>{title}</h3><small>{entries.length} records</small></header><div className={s.cards}>{entries.slice(page*capacity,page*capacity+capacity).map(entry=><DetailButton key={entry.id} className={s.card} data-caution={entry.id==="release"||entry.id==="donate"} hint={`${entry.title}. ${entry.summary}. ${entry.action?"Select to continue.":"Select for details."}`} onClick={()=>entry.action?entry.action():setSelected(entry)}><span aria-hidden="true" className={s.icon} style={{maskImage:`url(${entry.iconPath??`/images/ui/ranch-dossier-v1/icons/${entry.icon}.svg`})`}}/><strong>{entry.title}</strong><small>{entry.summary}</small>{entry.meter?<span className={s.meter} role="progressbar" aria-label={entry.meter.label} aria-valuemin={0} aria-valuemax={Math.max(1,entry.meter.max)} aria-valuenow={Math.max(0,Math.min(Math.max(1,entry.meter.max),entry.meter.value))}><i style={{width:`${Math.max(0,Math.min(100,entry.meter.max>0?entry.meter.value/entry.meter.max*100:100))}%`}}/></span>:null}</DetailButton>)}{!entries.length?<p>No records yet.</p>:null}</div><div className={s.pager} aria-label={`${title} pages`}><button disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span aria-live="polite">{page+1} / {pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(page+1)}>Next</button></div>{selected?<RecordDialog key={selected.id} entry={selected} onClose={()=>setSelected(null)}/>:null}</section>;
}
export function CompactWork({creature}:{creature:CreatureRecord}) {
  const [group,setGroup]=useState<"ranch"|"domestic">("ranch");
  const entries:Entry[]=getCreatureChoreSkillGroup(creature,group).map(({definition,progress,naturalBaselineLevel})=>({id:definition.skillId,title:definition.label,summary:`${group==="domestic"||/Security|Ranch Care/i.test(definition.label)?"Reserved · ":""}Lv ${progress.level} / ${MAX_CHORE_SKILL_LEVEL} · ${getChoreSkillAptitudeLabel(progress.level)}`,icon:"work",details:[`${definition.label}: level ${progress.level} of ${MAX_CHORE_SKILL_LEVEL}. ${progress.level>naturalBaselineLevel?`Trained ${progress.level-naturalBaselineLevel} levels above the natural baseline.`:"Natural baseline."} Experience: ${progress.xp} / ${progress.xpToNext || "Mastered"}.`,group==="domestic"?"Domestic skills are reserved for future household, recipe, care and town work systems.":"Harvesting, production and hauling improve through completed instant work. Every five levels above level 1 adds one resource per action. Security and Ranch Care skills are reserved for future systems.","Farm security comes from fortifications and the strongest resident Guard Dog bonus. Work uses creature Energy, with no Gold operating charge."]}));
  return <div className={s.work}><div className={s.filters}><button aria-pressed={group==="ranch"} onClick={()=>setGroup("ranch")}>Farm skills</button><button aria-pressed={group==="domestic"} onClick={()=>setGroup("domestic")}>Domestic skills</button></div><Records key={group} title="Work Skills" entries={entries}/></div>;
}
export function CompactTalents({creature}:{creature:CreatureRecord}) {
  return <Records title="Talents" entries={creature.abilities.map(ability=>({id:ability.id,title:ability.name,summary:`Grade ${ability.grade} · ${ability.source}`,icon:"talents",details:[ability.description,`Grade ${ability.grade}. Source: ${ability.source}.${ability.category?` Category: ${ability.category}.`:""}${ability.tags?.length?` Tags: ${ability.tags.join(", ")}.`:""}`]}))}/>;
}
export function CompactLineage({creature}:{creature:CreatureRecord}) {
  const lineage=creature.lineage;
  return <Records title="Family register" entries={[
    {id:"parents",title:"Recorded parents",summary:lineage?.parentNames?.length?`${lineage.parentNames.length} parents recorded`:"Parentage not recorded",icon:"lineage",details:lineage?.parentNames?.length?lineage.parentNames.map((name,index)=>`Parent ${index+1}: ${name}`):["Parentage not recorded."]},
    {id:"origin",title:"Origin",summary:`Generation ${creature.generation}`,icon:"overview",details:[`${creature.nickname} · Generation ${creature.generation}. ${creature.originLabel}`]},
    {id:"assessment",title:"Lineage assessment",summary:lineage?.label??"No Risk",icon:"lineage",details:lineage?.notes?.length?lineage.notes:["No close lineage risk detected, or this creature predates lineage tracking."]},
    {id:"traits",title:"Inherited markers",summary:`${lineage?.traits?.length??0} markers`,icon:"talents",details:lineage?.traits?.length?lineage.traits:["No trait markers recorded."]},
    ...(creature.notes?[{id:"notes",title:"Ranch notes",summary:"Read recorded notes",icon:"care",details:[creature.notes]}]:[])
  ]}/>;
}
export type CompactCareProps={creature:CreatureRecord;injury:boolean;statusNote?:string;bestStatLabels:string[];renameValue?:string;onRenameValueChange?:(value:string)=>void;onRename?:()=>void;onToggleLock?:()=>void;onFeed?:()=>void;onRelease?:()=>void;onDonate?:()=>void};
export function CompactCare({creature,injury,statusNote,bestStatLabels,renameValue,onRenameValueChange,onRename,onToggleLock,onFeed,onRelease,onDonate}:CompactCareProps) {
  const [rename,setRename]=useState(false);
  const entries:Entry[]=[{id:"health",title:"Health & care",summary:injury?creature.injuryLabel??"Injured":"Healthy",icon:"care",details:[statusNote??"No additional care notice.",`Energy ${creature.energy} / ${creature.maxEnergy}. Affection ${creature.affection} / 100. Hearts ${creature.hearts} / ${creature.maxHearts}.`,`Origin: ${creature.originLabel}. Best stats: ${bestStatLabels.join(", ")||"Balanced"}.`]}];
  if(onFeed)entries.push({id:"feed",title:"Feed Creature",summary:"Open existing feeding action",icon:"care",details:[],action:onFeed});
  if(onToggleLock)entries.push({id:"lock",title:creature.isLocked?"Unlock Creature":"Lock / Protect Creature",summary:creature.isLocked?"Protected from removal":"Currently unlocked",icon:"care",details:[],action:onToggleLock});
  if(renameValue!==undefined&&onRenameValueChange&&onRename)entries.push({id:"rename",title:"Rename",summary:creature.nickname,icon:"overview",details:[],action:()=>setRename(true)});
  if(onRelease)entries.push({id:"release",title:"Release",summary:"Requires removal confirmation",icon:"care",details:[],action:onRelease});
  if(onDonate)entries.push({id:"donate",title:"Donate",summary:"Requires removal confirmation",icon:"care",details:[],action:onDonate});
  return <><Records title="Care & Management" entries={entries}/>{rename?<GameDialog title="Rename creature" onClose={()=>setRename(false)}><label>Creature name<input aria-label="Creature name" maxLength={24} value={renameValue} onChange={event=>onRenameValueChange?.(event.target.value)}/></label><div className={s.pager}><button onClick={()=>setRename(false)}>Cancel</button><button disabled={!renameValue?.trim()} onClick={()=>{onRename?.();setRename(false);}}>Save Name</button></div></GameDialog>:null}</>;
}
