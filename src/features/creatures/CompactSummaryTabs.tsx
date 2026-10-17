"use client";

import { useState } from "react";
import { STAT_KEYS } from "@/data/creatures";
import { getCreatureRoleTags } from "@/data/talents/creatureRoleTags";
import { getCreatureGrowthProjections, getProjectedEnergyGainNextLevel } from "@/data/levelGrowth";
import type { CreatureRecord, CreatureStatKey } from "@/types/creature";
import { Records, RecordDialog, type Entry } from "./CompactProfileTabs";
import s from "./CompactProfileTabs.module.css";
import a from "./OverviewA.module.css";

const LABELS:Record<CreatureStatKey,string>={STR:"Strength",DEX:"Dexterity",STA:"Stamina",CHA:"Charm",WIL:"Willpower",FER:"Fertility"};
const ART="/images/ui/dossier-vitals-v1/";
export function CompactOverview({creature,injury,lineageLabel,variantName,speciesName,statusNote}:{creature:CreatureRecord;injury:boolean;lineageLabel:string;variantName:string;speciesName:string;statusNote?:string}) {
 const tags=getCreatureRoleTags(creature);
 const [more,setMore]=useState(false);
 const [selected,setSelected]=useState<Entry|null>(null);
 const vital=(id:string,title:string,value:number,max:number,detail:string):Entry=>({id,title,summary:`${value} / ${max}`,icon:"overview",iconPath:`/images/ui/creature-overview-a-v2/sculpted/${id==="affection"||id==="hearts"?"heart":id}.webp`,meter:{value,max,label:title},details:[`${title}: ${value} / ${max}. ${detail}`]});
 const entries:Entry[]=[
  vital("energy","Energy",creature.energy,creature.maxEnergy,"Available energy for creature activities. Normal feeding and recovery remain in effect."),
  vital("affection","Affection",creature.affection,100,"Current bond with this creature. Review care item effects in Inventory before using them."),
  vital("hearts","Hearts",creature.hearts,creature.maxHearts,"Current hearts and maximum capacity."),
  {...vital("experience",`Level ${creature.level}`,creature.xp,creature.xpToNext,"Experience toward the next level. See Stats & Growth for exact growth projections."),summary:`${creature.xp} / ${creature.xpToNext} XP`},
  {id:"identity",title:"Identity",summary:`Generation ${creature.generation}`,icon:"overview",details:[`${speciesName} · ${variantName}. ${creature.originLabel}. Generation ${creature.generation}.`,creature.shiny?"Rare shiny coloration is active and tracked in this creature’s breeding lineage.":"Standard coloration."]},
  {id:"health",title:"Health & protection",summary:injury?creature.injuryLabel??"Injured":"Healthy",icon:"care",details:[statusNote??(injury?"Injured.":"No additional status notice."),creature.isLocked?"Protected from removal. Use Care to unlock this creature.":"Not protected from removal. Use Care to lock this creature."]},
  {id:"lineage",title:"Lineage",summary:lineageLabel,icon:"lineage",details:[`Lineage assessment: ${lineageLabel}. See the Lineage tab for parent records, inherited markers and notes.`]},
  {id:"roles",title:"Role strengths",summary:tags.length?`${tags.length} role indicators`:"No role indicators",icon:"work",details:tags.length?tags.map(tag=>`${tag.label}: ${tag.reasons.join(" ")}`):["No role indicators recorded."]}
 ];
 return <section className={a.overview} data-more={more} aria-label="At a Glance"><div className={a.vitalGroup}><h3>{more?"More overview":"At a Glance"}</h3><div className={a.vitals}>{entries.slice(0,4).map(card)}</div></div><div className={a.secondary}>{entries.slice(4).map(card)}</div><button className={a.more} onClick={()=>setMore(!more)}>{more?"Back to vitals":"More overview ›"}</button>{selected?<RecordDialog key={selected.id} entry={selected} onClose={()=>setSelected(null)}/>:null}</section>;
 function card(entry:Entry){return <button type="button" key={entry.id} className={a.card} data-vital={entry.id} onClick={()=>setSelected(entry)} aria-label={`${entry.title}. ${entry.summary}. View details`}><img src={entry.iconPath??`/images/ui/creature-overview-a-v2/painted-r4/${entry.id}.webp`} alt=""/><div><strong>{entry.id==="experience"?"Experience":entry.title}</strong><span>{entry.id==="identity"?`${entry.summary} · ${creature.originLabel}`:entry.id==="health"?`${entry.summary} · ${creature.isLocked?"Protected":"Not protected"}`:entry.summary}</span>{entry.id==="hearts"&&creature.maxHearts<=8?<span className={a.pips} aria-hidden="true">{Array.from({length:creature.maxHearts},(_,i)=><img key={i} src="/images/ui/creature-overview-a-v2/sculpted/heart.webp" alt="" style={{opacity:i<creature.hearts?1:.25}}/>)}</span>:null}</div>{entry.meter?<progress aria-label={entry.meter.label} value={entry.meter.value} max={Math.max(1,entry.meter.max)}/>:null}</button>;} 
}
export function CompactStats({creature,growth,energyPreview,acceleration,bestStatLabels}:{creature:CreatureRecord;growth:ReturnType<typeof getCreatureGrowthProjections>;energyPreview:ReturnType<typeof getProjectedEnergyGainNextLevel>;acceleration:number;bestStatLabels:string[]}) {
 const [view,setView]=useState<"stats"|"forecast">("stats");
 const stats:Entry[]=STAT_KEYS.map(key=>{const projection=growth[key];return {id:key,title:LABELS[key],summary:`${creature.stats[key]} · Grade ${creature.statGrades[key]}`,icon:"growth",iconPath:`/images/ui/ranch-dossier-v2/icons/${LABELS[key].toLowerCase()}.svg`,meter:{value:projection.currentProgressPercent,max:100,label:`${LABELS[key]} growth toward next point`},details:[`${LABELS[key]}: ${creature.stats[key]}. Innate grade ${creature.statGrades[key]}. ${projection.willIncreaseNextLevel?`Next level adds ${projection.statGainNextLevel} ${LABELS[key]}.`:`Estimated ${projection.levelsUntilIncrease} level${projection.levelsUntilIncrease===1?"":"s"} until the next increase.`}`,`Growth toward the next point: ${projection.currentProgressPercent}%. Next-level growth contribution: ${projection.nextLevelGainPercent}%. These are creature base stats; equipment modifies battle stats separately.`]};});
 const forecast:Entry[]=[
 {id:"xp",title:`Level ${creature.level}`,summary:`${creature.xp} / ${creature.xpToNext} XP`,icon:"growth",iconPath:`${ART}experience.svg`,meter:{value:creature.xp,max:creature.xpToNext,label:"Level experience"},details:[`Experience ${creature.xp} / ${creature.xpToNext}. Young-growth multiplier ×${acceleration.toFixed(2)}. Growth is fastest at low levels and gradually plateaus.`]},
 {id:"gains",title:"Next level gains",summary:`${STAT_KEYS.filter(key=>growth[key].willIncreaseNextLevel).length} stats increasing`,icon:"growth",details:[STAT_KEYS.filter(key=>growth[key].willIncreaseNextLevel).map(key=>`${LABELS[key]} +${growth[key].statGainNextLevel}`).join(" · ")||"Progress toward your next stat gains; no full stat-point increase on the next level."]},
 {id:"energy",title:"Energy capacity",summary:`${energyPreview.currentMaxEnergy} → ${energyPreview.nextLevelMaxEnergy}`,icon:"growth",iconPath:`${ART}energy.svg`,details:[`Next level: maximum Energy ${energyPreview.currentMaxEnergy} → ${energyPreview.nextLevelMaxEnergy} (${energyPreview.delta>=0?"+":""}${energyPreview.delta}).`]},
 {id:"best",title:"Strongest stats",summary:bestStatLabels.length===1?bestStatLabels[0]:bestStatLabels.length?`${bestStatLabels.length} tied leading stats`:"Balanced",icon:"growth",details:[bestStatLabels.length?`Best stats: ${bestStatLabels.join(", ")}.`:"Balanced stats.","Innate stat grades and equipment grades are separate. Equipping a piece never changes a creature’s innate grade."]}
 ];
 return <div className={s.work}><div className={s.filters}><button aria-pressed={view==="stats"} onClick={()=>setView("stats")}>Attributes</button><button aria-pressed={view==="forecast"} onClick={()=>setView("forecast")}>Next level</button></div><Records key={view} title={view==="stats"?"Stats & Growth":"Growth forecast"} entries={view==="stats"?stats:forecast}/></div>;
}
