"use client";
import {useState,type ReactNode} from 'react';
import {GameDialog} from '@/features/ui/GameDialog';
import {PagedItems} from '@/features/ui/PagedItems';
import {getVariantDefinition} from '@/data/creatures';
import {getCreatureManagementStatus} from '@/data/creatureManagement';
import {creatureDiet,resourceList} from '@/data/farmResources';
import {cycleTextPages,type CycleResident} from '@/data/dayCycleReport';
import type {GameSave} from '@/types/save';
import s from './DayCycleLedger.module.css';
export const CYCLE_KIT='/images/ui/day-cycle-v1';
const VITAL='/images/ui/creature-overview-a-v2/sculpted';
const ICONS={paw:'/images/ui/creature-overview-a-v2/painted-r4/creatures.webp',energy:`${VITAL}/energy.webp`,heart:`${VITAL}/heart.webp`,timer:`${CYCLE_KIT}/timer.svg`,food:'/images/ui/feeding-station-connected/polish-v2/meals.webp',evening:`${CYCLE_KIT}/evening.webp`,morning:`${CYCLE_KIT}/morning.webp`};
export function CycleIcon({name}:{name:keyof typeof ICONS}){return <img className={s.icon} src={ICONS[name]} alt=""/>;}
export function CycleShell({morning=false,title,date,tabs,summary,footer,onClose,children,notice}:{morning?:boolean;title:string;date:string;tabs:ReactNode;summary?:ReactNode;footer:ReactNode;onClose:()=>void;children:ReactNode;notice?:ReactNode}){
 const [small,setSmall]=useState(false);
 return <GameDialog fullScreen title={title} onClose={onClose}><main className={`${s.screen} ${morning?s.morning:''} ${small?s.minimized:''}`} data-night-review={morning?undefined:true} data-morning-report={morning?true:undefined}>
 <article className={s.window}><header className={s.header}><button onClick={onClose}>{morning?'Ranch Ledger':'Keep Playing'}</button><div><h1>{title}</h1><p>{date}</p></div><button aria-expanded={!small} aria-label={small?'Expand room':'Minimize room'} onClick={()=>setSmall(v=>!v)}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d={small?'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5':'M4 9h5V4M15 4v5h5M20 15h-5v5M9 20v-5H4'} fill="none" stroke="currentColor" strokeWidth="2"/></svg><span>{small?'Expand room':'Minimize room'}</span></button></header>
 {tabs}{summary}{notice}<div className={s.body}>{children}</div><footer className={s.footer}>{footer}</footer></article></main></GameDialog>;
}
export function CycleSummary({fed,eating,covered,required,energy,timers,timerText,onFood,onEnergy,onTimers}:{fed:number;eating:number;covered:number;required:number;energy:string;timers:number;timerText:string;onFood:()=>void;onEnergy:()=>void;onTimers:()=>void}){
 return <section className={s.summary} aria-label="Ranch night summary"><button onClick={onFood}><CycleIcon name="paw"/><span><b>Creatures fed: {fed}/{eating}</b><small>{covered} / {required} food units</small></span></button><button onClick={onEnergy}><CycleIcon name="energy"/><span><b>Player Energy</b><small>{energy}</small></span></button><button onClick={onTimers}><CycleIcon name="timer"/><span><b>Timers ready: {timers}</b><small>{timerText}</small></span></button></section>;
}
export function CycleResidents({rows,selectedId,onSelect,save,morning=false}:{rows:CycleResident[];selectedId:string;onSelect:(index:number)=>void;save:GameSave;morning?:boolean}){
 return <section className={s.roster} aria-label="Resident recovery roster"><h2>Residents <small>({rows.length})</small></h2>{rows.length?<PagedItems label="Recovery residents" rowHeight={86} maxPerPage={7} initialItemIndex={Math.max(0,rows.findIndex(r=>r.before.creatureId===selectedId))} items={rows.map((r,i)=>{
 const c=morning?r.after:r.before,full=r.meal&&r.meal.covered>=r.meal.required;
 const feeding=r.isNew?'New resident':r.missing?'No longer resident':r.away?'With Rhea':full?'Fully fed':r.meal?`Short ${Math.max(0,r.meal.required-r.meal.covered)}`:'No meal recorded';
 return <button className={s.resident} key={c.creatureId} aria-label={`Review ${c.nickname}`} aria-pressed={c.creatureId===selectedId} onClick={()=>onSelect(i)}><span className={s.rowIdentity}><img src={getVariantDefinition(c.variantId).portraitPath} alt=""/><span><b>{c.nickname}</b><small>Lv {c.level} · {r.missing?'Unavailable':getCreatureManagementStatus(save,c).primaryStatus}</small></span></span><span data-good={!!full&&!r.missing}><b>{feeding}</b><small>{r.away?'Away':r.meal?`${r.meal.covered}/${r.meal.required} units`:'—'}</small></span><span><small>{morning?'Final Energy':'Energy'}</small><b>{r.missing?'—':r.isNew?c.energy:morning?`${r.after.energy} / ${r.after.maxEnergy}`:`${r.before.energy} → ${r.after.energy}`}</b></span></button>;
 })}/>:<p>No resident creatures to review.</p>}</section>;
}
export function CycleResidentDetails({resident,save,morning=false,mode='Recovery',onFood,care,foodNote}:{resident?:CycleResident;save:GameSave;morning?:boolean;mode?:'Recovery'|'Meal'|'Care';onFood?:()=>void;care:string[];foodNote:string}){
 const [detail,setDetail]=useState(mode);
 const [notes,setNotes]=useState<{title:string;paragraphs:string[]}|null>(null);
 if(!resident)return <section className={s.inspector}><h2>Selected Resident</h2><p>No resident selected.</p></section>;
 const {before,after,away,meal,isNew,missing}=resident,c=morning?after:before;
 const full=!!meal&&meal.covered>=meal.required;
 const food=meal?[resourceList(meal.used),meal.legacyUsed?`${meal.legacyUsed} older Feed`:''].filter(Boolean).join(' + '):'';
 const values=[['energy','Energy',before.energy,after.energy],['heart','Hearts',before.hearts,after.hearts],['heart','Affection',before.affection,after.affection]] as const;
 const allocation=()=>setNotes({title:morning?'Food consumed':'Planned meal',paragraphs:[`${c.nickname}: ${away?'Eats with Rhea; excluded from home feeding.':isNew?'Joined after the overnight feeding.':food||'No ranch food allocated.'}`,meal?`${meal.covered} / ${meal.required} food units. ${full?'Fully fed.':`Short by ${Math.max(0,meal.required-meal.covered)} food units.`}`:'No recorded ranch meal.',foodNote]});
 const mealContent=<><div className={s.mealHeading}><CycleIcon name="food"/><div><h3>{morning?'Food consumed':'Food for tonight'}</h3><p className={full?s.good:s.warning}>{isNew?'Joined after feeding':away?'Eats with Rhea':meal?`${meal.covered} / ${meal.required} food units · ${full?'Fully fed':'Shortfall'}`:'No recorded allocation'}</p></div></div><div className={s.mealActions}><button onClick={allocation}>View meal allocation</button>{onFood&&<button onClick={onFood}>Feeding Station</button>}</div></>;
 return <><section className={s.inspector} aria-label="Selected resident recovery"><div className={s.identity}><img src={getVariantDefinition(c.variantId).portraitPath} alt={c.nickname}/><div><h2>{c.nickname} · Level {c.level}</h2><p>{creatureDiet(c)} · {missing?'No longer resident':getCreatureManagementStatus(save,c).primaryStatus}</p><small>{isNew?'New resident':morning?'Final overnight results':'Projected recovery'}</small></div></div>
 <nav className={s.detailTabs} aria-label="Resident details">{(['Recovery','Meal','Care'] as const).map(t=><button key={t} aria-pressed={detail===t} onClick={()=>t==='Care'?setNotes({title:'Resident care notes',paragraphs:[...care,foodNote]}):setDetail(t)}>{t}</button>)}</nav>
 <div className={s.detailBody}>
 {detail==='Recovery'?<>{missing?<p>This creature is not present in the morning save. See the full log.</p>:<dl className={s.vitals}>{values.map(([icon,label,a,b])=><div key={label}><dt><CycleIcon name={icon}/>{label}</dt><dd>{isNew?b:morning?<><strong data-good={b>=a}>{b-a>0?'+':''}{b-a}</strong><span>({a} → {b})</span></>:<>{a}<span>→</span><strong data-good={b>=a}>{b}</strong></>}{label==='Energy'&&<small>/ {after.maxEnergy}</small>}</dd></div>)}</dl>}<div className={s.desktopMeal}>{mealContent}</div></>:detail==='Meal'?<div className={s.meal}>{mealContent}</div>:<CycleText paragraphs={care} label="Resident care notes"/>}
 </div></section>{notes&&<GameDialog fullScreen title={notes.title} onClose={()=>setNotes(null)}><main className={`${s.screen} ${morning?s.morning:''}`} data-cycle-notes><article className={s.window}><header className={s.header}><button onClick={()=>setNotes(null)}>Back to resident</button><h1>{notes.title}</h1></header><CycleText paragraphs={notes.paragraphs} label="Resident full details"/><footer className={s.footer}><button onClick={()=>setNotes(null)}>Back to resident</button>{onFood&&<button onClick={onFood}>Feeding Station</button>}</footer></article></main></GameDialog>}</>;
}
export function CycleText({paragraphs,label}:{paragraphs:string[];label:string}){return <div className={s.textPages}><PagedItems label={label} rowHeight={95} maxPerPage={4} items={cycleTextPages(paragraphs).map((text,i)=><p className={s.logEntry} key={i}>{text}</p>)}/></div>;}
export {s as cycleStyles};
