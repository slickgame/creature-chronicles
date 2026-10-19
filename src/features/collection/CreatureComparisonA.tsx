"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { GameDialog } from '@/features/ui/GameDialog';
import { PagedItems } from '@/features/ui/PagedItems';
import { CREATURE_PLACEHOLDER_IMAGE, STAT_KEYS, getVariantDefinition } from '@/data/creatures';
import { getNylaGameplayCardSprite } from '@/data/nylaGameplayArt';
import { getEquineGameplayCardSprite } from '@/data/equineGameplayArt';
import { getCreatureManagementStatus, getPairManagementSummary } from '@/data/creatureManagement';
import { careStatusTone, careDetailPages } from '@/data/carePresentation';
import { getCreatureTalentPresentations } from '@/data/talents/talentPresentation';
import { TalentDetails } from '@/features/creatures/TalentsLedger';
import type { CreatureRecord } from '@/types/creature';
import type { GameSave } from '@/types/save';
import s from './CreatureComparisonA.module.css';

export type ComparisonTab='overview'|'stats'|'breeding';
const attributeNames=['Strength','Dexterity','Stamina','Charm','Willpower','Fertility'];
const attributeIcons=['strength','dexterity','stamina','charm','willpower','fertility'];
const portrait=(c:CreatureRecord)=>getEquineGameplayCardSprite(c,getNylaGameplayCardSprite(c,getVariantDefinition(c.variantId).portraitPath||CREATURE_PLACEHOLDER_IMAGE));
const lastBred=(days:number|null)=>days===null?'Never bred':days===0?'Bred today':days===1?'Bred yesterday':`Last bred ${days} days ago`;

function Identity({creature,save}:{creature:CreatureRecord;save:GameSave}){
  const status=getCreatureManagementStatus(save,creature).primaryStatus;
  return <div className={s.identity} data-long-name={creature.nickname.length>18}><img src={portrait(creature)} alt=""/><div><h3>{creature.nickname}</h3><small>{getVariantDefinition(creature.variantId).name} · Lv {creature.level}</small><span className={s.badge} data-tone={careStatusTone(status)}>{status}</span></div></div>;
}

export function CreatureCompareChooserA({save,creatures,ids,onToggle,onClose,onCompare}:{save:GameSave;creatures:CreatureRecord[];ids:string[];onToggle:(c:CreatureRecord)=>void;onClose:()=>void;onCompare:()=>void}){
  const [search,setSearch]=useState('');
  const selected=ids.map(id=>(save.creatures??[]).find(c=>c.creatureId===id)).filter((c):c is CreatureRecord=>!!c);
  const filtered=creatures.filter(c=>`${c.nickname} ${getVariantDefinition(c.variantId).name}`.toLowerCase().includes(search.trim().toLowerCase()));
  if(typeof document==='undefined')return null;
  return createPortal(<GameDialog title="Choose creatures to compare" onClose={onClose} wide><div className={`${s.window} ${s.chooser}`} data-comparison-chooser>
    <div className={s.slots}>{[0,1].map(i=><article key={i}>{selected[i]?<><Identity creature={selected[i]} save={save}/><button type="button" aria-label={`Remove ${selected[i].nickname} from comparison`} onClick={()=>onToggle(selected[i])}>×</button></>:<span>Choose creature {i+1}</span>}</article>)}</div>
    <div className={s.search}><input type="search" aria-label="Search comparison creatures" placeholder="Search creatures…" value={search} onChange={e=>setSearch(e.target.value)}/><span>{filtered.length} creatures</span></div>
    <div className={s.choices}>{filtered.length?<PagedItems key={search} label="Comparison creatures" rowHeight={78} items={filtered.map(c=><button type="button" className={s.choice} key={c.creatureId} aria-label={`Select ${c.nickname}`} aria-pressed={ids.includes(c.creatureId)} disabled={selected.length===2&&!ids.includes(c.creatureId)} onClick={()=>onToggle(c)}><Identity creature={c} save={save}/><span>{c.energy} / {c.maxEnergy} Energy</span><b aria-hidden="true">{ids.includes(c.creatureId)?'✓':'+'}</b></button>)}/>:<p>No creatures match this search.</p>}</div>
    <footer><span aria-live="polite">{selected.length} / 2 selected</span><button type="button" onClick={onClose}>Back to roster</button><button type="button" data-primary disabled={selected.length!==2} onClick={onCompare}>Compare creatures</button></footer>
  </div></GameDialog>,document.body);
}

function ComparisonRows({rows,names,label}:{rows:{label:ReactNode;a:ReactNode;b:ReactNode;higher?:'a'|'b'}[];names:[string,string];label:string}){
  const area=useRef<HTMLDivElement>(null),[capacity,setCapacity]=useState(6),[requested,setRequested]=useState(0);
  useEffect(()=>{const node=area.current;if(!node)return;const observer=new ResizeObserver(([entry])=>setCapacity(Math.max(1,Math.floor((entry.contentRect.height-76)/(window.innerHeight<=550?33:window.innerWidth>700?38:44)))));observer.observe(node);return()=>observer.disconnect();},[]);
  const pages=Math.max(1,Math.ceil(rows.length/capacity)),page=Math.min(requested,pages-1);
  return <div className={s.rowArea} ref={area} aria-label={label}><div className={s.table} role="table" aria-label={label}><div className={s.tableHeader} role="row"><span role="columnheader">{label==='Attributes'?'Attribute':'Record'}</span>{names.map((n,i)=><strong key={i} role="columnheader">{n}</strong>)}</div>{rows.slice(page*capacity,(page+1)*capacity).map((r,i)=><div role="row" className={s.tableRow} key={i}><span role="rowheader">{r.label}</span><strong role="cell" data-higher={r.higher==='a'}>{r.a}</strong><strong role="cell" data-higher={r.higher==='b'}>{r.b}</strong></div>)}</div><nav className={s.pager} aria-label={`${label} pages`}><button type="button" disabled={!page} onClick={()=>setRequested(page-1)}>Previous</button><span aria-live="polite">{page+1} / {pages}</span><button type="button" disabled={page+1>=pages} onClick={()=>setRequested(page+1)}>Next</button></nav></div>;
}

function ComparedTalents({creatures,save,onBack,initialOwner}:{creatures:[CreatureRecord,CreatureRecord];save:GameSave;onBack:()=>void;initialOwner:number}){
  const [owner,setOwner]=useState(initialOwner),[index,setIndex]=useState(0),[full,setFull]=useState(false);
  const talents=getCreatureTalentPresentations(creatures[owner],save),talent=talents[Math.min(index,Math.max(0,talents.length-1))];
  return <div className={s.talentView}><nav className={s.tabs} aria-label="Talent owner">{creatures.map((c,i)=><button type="button" key={c.creatureId} aria-pressed={owner===i} onClick={()=>{setOwner(i);setIndex(0);}}>{c.nickname}</button>)}</nav>{talent?<article className={s.talentRecord}><img src={talent.iconPath} alt=""/><div><h3>{talent.name}</h3><p>Grade {talent.grade} · {talent.sourceLabel}</p></div><button type="button" onClick={()=>setFull(true)}>View full talent details →</button></article>:<p>No talents recorded.</p>}<nav className={s.pager} aria-label="Compared talent pages"><button type="button" disabled={!index} onClick={()=>setIndex(index-1)}>Previous talent</button><span>{talents.length?index+1:0} / {talents.length}</span><button type="button" disabled={index+1>=talents.length} onClick={()=>setIndex(index+1)}>Next talent</button></nav><button type="button" onClick={onBack}>Back to attributes</button>{full&&talent?createPortal(<TalentDetails key={talent.id} talent={talent} onClose={()=>setFull(false)}/>,document.body):null}</div>;
}

export function CreatureComparisonA({save,creatures,tab,onTab,onClose,onChange,onBreed}:{save:GameSave;creatures:[CreatureRecord,CreatureRecord];tab:ComparisonTab;onTab:(tab:ComparisonTab)=>void;onClose:()=>void;onChange:()=>void;onBreed:(a:CreatureRecord,b:CreatureRecord,swap?:boolean)=>void}){
  const [talentsOpen,setTalentsOpen]=useState(false),[breedingPage,setBreedingPage]=useState<'roles'|'pair'>('roles');
  const [talentOwner,setTalentOwner]=useState(0),[note,setNote]=useState<string|null>(null);
  const [a,b]=creatures,statuses=creatures.map(c=>getCreatureManagementStatus(save,c)),pair=getPairManagementSummary(save,a,b);
  const overviewRows=[{label:'Level',values:creatures.map(c=>c.level)},{label:'Generation',values:creatures.map(c=>c.generation)},{label:'Rarity',values:statuses.map(x=>x.rarity)},{label:'Energy',values:creatures.map(c=>`${c.energy} / ${c.maxEnergy}`)},{label:'Affection',values:creatures.map(c=>`${c.affection} / 100`)},{label:'Status',values:statuses.map(x=>x.primaryStatus)},{label:'Protection',values:creatures.map(c=>c.isLocked?'Locked':'Unlocked')}].map(r=>({label:r.label,a:r.values[0],b:r.values[1]}));
  const rows=STAT_KEYS.map((key,i)=>({label:<><img src={`/images/ui/stats-growth-b/${attributeIcons[i]}.webp`} alt=""/>{attributeNames[i]}</>,a:`${a.stats[key]} / ${a.statGrades[key]}`,b:`${b.stats[key]} / ${b.statGrades[key]}`,higher:a.stats[key]>b.stats[key]?'a' as const:b.stats[key]>a.stats[key]?'b' as const:undefined}));
  if(typeof document==='undefined')return null;
  return createPortal(<GameDialog title={`${a.nickname} × ${b.nickname}`} onClose={onClose} wide><div className={s.window} data-comparison-ledger>
    <div className={s.identities}>{creatures.map(c=><Identity key={c.creatureId} creature={c} save={save}/>)}</div>
    <nav className={s.tabs} aria-label="Comparison sections">{(['overview','stats','breeding'] as const).map(t=><button type="button" key={t} aria-pressed={tab===t} onClick={()=>{onTab(t);setTalentsOpen(false);}}>{t==='stats'?'Stats & Talents':t==='overview'?'Overview':'Breeding'}</button>)}</nav>
    {tab==='overview'?<ComparisonRows key="overview" rows={overviewRows} names={[a.nickname,b.nickname]} label="Overview"/>:tab==='stats'?talentsOpen?<ComparedTalents creatures={creatures} save={save} initialOwner={talentOwner} onBack={()=>setTalentsOpen(false)}/>:<><p className={s.caption}>Value / innate grade · Higher current values highlighted</p><ComparisonRows key="stats" rows={rows} names={[a.nickname,b.nickname]} label="Attributes"/><div className={s.talentSummaries}>{creatures.map((c,owner)=>{const ts=getCreatureTalentPresentations(c,save),t=ts[0];return <article key={c.creatureId}>{t?<img src={t.iconPath} alt=""/>:null}<div><strong>{c.nickname}</strong><p>{t?`${t.name} · Grade ${t.grade}`:'No talents recorded'}</p><small>{ts.length} {ts.length===1?'talent':'talents'}</small></div><button type="button" onClick={()=>{setTalentOwner(owner);setTalentsOpen(true);}}>View talents →</button></article>;})}</div><button className={s.phoneTalents} type="button" onClick={()=>setTalentsOpen(true)}>View talents →</button></>:<>
      <nav className={s.tabs} aria-label="Breeding comparison pages"><button type="button" aria-pressed={breedingPage==='roles'} onClick={()=>setBreedingPage('roles')}>Roles & readiness</button><button type="button" aria-pressed={breedingPage==='pair'} onClick={()=>setBreedingPage('pair')}>Pair record & setup</button></nav>
      {breedingPage==='roles'?<><ComparisonRows key="roles" names={[a.nickname,b.nickname]} label="Breeding readiness" rows={[
        {label:'Giver',a:statuses[0].giverEligible?'Ready':'Blocked',b:statuses[1].giverEligible?'Ready':'Blocked'},
        {label:'Receiver',a:statuses[0].receiverEligible?'Ready':'Blocked',b:statuses[1].receiverEligible?'Ready':'Blocked'},
        {label:'Fertility',a:`${a.stats.FER} / ${a.statGrades.FER}`,b:`${b.stats.FER} / ${b.statGrades.FER}`},
        {label:'Affection',a:a.affection,b:b.affection},
        {label:'History',a:lastBred(statuses[0].daysSinceBred),b:lastBred(statuses[1].daysSinceBred)},
      ]}/><button type="button" onClick={()=>setNote(creatures.map((c,i)=>`${c.nickname}: Giver — ${statuses[i].giverEligible?'Ready':statuses[i].giverBlockedReason??'Unavailable'}. Receiver — ${statuses[i].receiverEligible?'Ready':statuses[i].receiverBlockedReason??'Unavailable'}.`).join(' '))}>View full eligibility details →</button></>:<div className={s.pair}><article><h3>Pair record</h3><p>Pair familiarity: {pair.streak}</p><p>Lineage: {pair.lineageLabel}</p><p>{lastBred(Math.min(statuses[0].daysSinceBred??999,statuses[1].daysSinceBred??999)===999?null:Math.min(statuses[0].daysSinceBred??999,statuses[1].daysSinceBred??999))}</p></article><button type="button" onClick={()=>onBreed(a,b)}>Set up: {a.nickname} giver / {b.nickname} receiver →</button><button type="button" onClick={()=>onBreed(a,b,true)}>Set up: {b.nickname} giver / {a.nickname} receiver →</button></div>}
    </>}
    {note?<ComparisonNote text={note} onClose={()=>setNote(null)}/>:null}
    <footer><button type="button" onClick={onChange}>← Change creatures</button><button type="button" onClick={onClose}>Back to roster</button></footer>
  </div></GameDialog>,document.body);
}

function ComparisonNote({text,onClose}:{text:string;onClose:()=>void}){
 const [page,setPage]=useState(0),pages=careDetailPages([text]);
 return createPortal(<GameDialog title="Eligibility details" onClose={onClose}><div className={s.note}><p>{pages[Math.min(page,pages.length-1)].join(' ')}</p><nav className={s.pager} aria-label="Eligibility detail pages"><button type="button" disabled={!page} onClick={()=>setPage(page-1)}>Previous detail</button><span>{page+1} / {pages.length}</span><button type="button" disabled={page+1>=pages.length} onClick={()=>setPage(page+1)}>Next detail</button></nav><button type="button" onClick={onClose}>Back to comparison</button></div></GameDialog>,document.body);
}
