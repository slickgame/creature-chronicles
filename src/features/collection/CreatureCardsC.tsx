"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GameDialog } from '@/features/ui/GameDialog';
import { getCreatureManagementStatus } from '@/data/creatureManagement';
import { careDetailPages, careStatusTone } from '@/data/carePresentation';
import { getVariantDefinition, getSpeciesDefinition, CREATURE_PLACEHOLDER_IMAGE } from '@/data/creatures';
import { getNylaGameplayCardSprite } from '@/data/nylaGameplayArt';
import { getEquineGameplayCardSprite } from '@/data/equineGameplayArt';
import type { CreatureRecord } from '@/types/creature';
import type { GameSave } from '@/types/save';
import s from './CreatureCardsC.module.css';

const portrait=(c:CreatureRecord)=>getEquineGameplayCardSprite(c,getNylaGameplayCardSprite(c,getVariantDefinition(c.variantId).portraitPath||CREATURE_PLACEHOLDER_IMAGE));
function statusBadge(save:GameSave,c:CreatureRecord){const status=getCreatureManagementStatus(save,c).primaryStatus;return <span className={s.badge} data-tone={careStatusTone(status)}>{status}</span>;}
function history(days:number|null){return days===null?'Never bred':days===0?'Bred today':days===1?'Bred yesterday':`Last bred ${days} days ago`;}

export function CreatureCardsC({save,creatures,selectedId,search,filterCount,pageKey,onSearch,onFilters,onClear,onClose,onOpen,onCompare,onFavorite,onLock}:{
  save:GameSave;creatures:CreatureRecord[];selectedId?:string;search:string;filterCount:number;pageKey:string;
  onSearch:(value:string)=>void;onFilters:()=>void;onClear:()=>void;onClose:()=>void;onOpen:(c:CreatureRecord)=>void;onCompare:(c:CreatureRecord)=>void;onFavorite:(c:CreatureRecord)=>void;onLock:(c:CreatureRecord)=>void;
}){
  const [previewId,setPreviewId]=useState(selectedId),[focused,setFocused]=useState(false),[detail,setDetail]=useState(false);
  const selected=creatures.find(c=>c.creatureId===previewId)??creatures[0];
  function favorite(c:CreatureRecord){return <button type="button" aria-label={`${c.isFavorite?'Remove favorite':'Add favorite'}: ${c.nickname}`} aria-pressed={!!c.isFavorite} onClick={()=>onFavorite(c)}><img src="/images/ui/creature-overview-a-v2/painted-r4/talents.webp" style={{opacity:c.isFavorite?1:.45}} alt=""/></button>;}
  function lock(c:CreatureRecord){return <button type="button" aria-label={`${c.isLocked?'Unlock':'Lock'} creature: ${c.nickname}`} onClick={()=>onLock(c)}><img src={`/images/ui/care-b/icons/lock-${c.isLocked?'closed':'open'}.webp`} alt=""/></button>;}
  const status=selected?getCreatureManagementStatus(save,selected):null;
  if(typeof document==='undefined')return null;
  return createPortal(<GameDialog title="Creature Cards" onClose={onClose} wide><div className={s.gallery} data-creature-cards data-focused={focused}>
    <nav className={s.phoneTabs} aria-label="Cards views"><button type="button" aria-pressed={!focused} onClick={()=>setFocused(false)}>Gallery</button><button type="button" aria-pressed={focused} disabled={!selected} onClick={()=>setFocused(true)}>Selected creature</button></nav>
    <div className={s.toolbar}><input type="search" aria-label="Search card creatures" placeholder="Search creatures…" value={search} onChange={e=>onSearch(e.target.value)}/><button type="button" onClick={onFilters}>Filters & Sort{filterCount?` (${filterCount})`:''}</button><span aria-live="polite">{creatures.length} / {save.creatures?.length??0}</span></div>
    <div className={s.body}>
      <div className={s.tiles}>{creatures.length?<CardsPages key={pageKey} creatures={creatures} selectedId={selected?.creatureId} save={save} onSelect={c=>setPreviewId(c.creatureId)}/>:<div className={s.empty}><h3>No creatures match</h3><button type="button" onClick={onClear}>Clear filters</button></div>}</div>
      {selected&&status?<article className={s.inspector} aria-label="Selected card inspector" data-long-name={selected.nickname.length>18}>
        <img className={s.portrait} src={portrait(selected)} alt={`${selected.nickname} portrait`}/>
        <div className={s.identity}><h3>{selected.nickname}{selected.shiny?' ✦':''}</h3><p>{getVariantDefinition(selected.variantId).name} · Lv {selected.level}</p><small>{status.rarity} · Generation {selected.generation}</small>{statusBadge(save,selected)}</div>
        <dl className={s.metrics}><div><dt>Energy</dt><dd>{selected.energy} / {selected.maxEnergy}<progress aria-label="Card creature Energy" max={Math.max(1,selected.maxEnergy)} value={selected.energy}/></dd></div><div><dt>Affection</dt><dd>{selected.affection} / 100<progress aria-label="Card creature Affection" max={100} value={selected.affection}/></dd></div><div><dt>Fertility</dt><dd>{selected.stats.FER} / {selected.statGrades.FER}</dd></div></dl>
        <div className={s.readiness}><span>Giver: {status.giverEligible?'Ready':'Blocked'}</span><span>Receiver: {status.receiverEligible?'Ready':'Blocked'}</span><small>{history(status.daysSinceBred)}</small></div>
        <div className={s.identityActions}>{favorite(selected)}{lock(selected)}</div>
        <div className={s.inspectorActions}><button type="button" onClick={()=>setDetail(true)}>Card details</button><button type="button" data-primary onClick={()=>onOpen(selected)}>Open profile →</button></div>
      </article>:null}
    </div>
    {selected?<button className={s.selectedStrip} type="button" onClick={()=>setFocused(true)}><img src={portrait(selected)} alt=""/><span><strong>{selected.nickname}</strong><small>{getVariantDefinition(selected.variantId).rarity} · Generation {selected.generation}</small></span><b>View selected creature ›</b></button>:null}
    <footer><button type="button" disabled={!selected} onClick={()=>selected&&onCompare(selected)}>Compare</button><button type="button" className={s.phoneOpen} data-primary disabled={!selected} onClick={()=>selected&&onOpen(selected)}>Open profile →</button><button type="button" onClick={onClose}>Back to roster</button></footer>
    {detail&&selected?<CardDetails save={save} creature={selected} onClose={()=>setDetail(false)}/>:null}
  </div></GameDialog>,document.body);
}

function CardsPages({creatures,selectedId,save,onSelect}:{creatures:CreatureRecord[];selectedId?:string;save:GameSave;onSelect:(c:CreatureRecord)=>void}){
  const ref=useRef<HTMLDivElement>(null),[layout,setLayout]=useState({columns:3,rows:2}),[requested,setRequested]=useState<number|null>(null);
  useEffect(()=>{const el=ref.current;if(!el)return;const ro=new ResizeObserver(([entry])=>{const columns=entry.contentRect.width>=500?3:2,rows=Math.max(1,Math.min(2,Math.floor((entry.contentRect.height-44)/(window.innerHeight<=550?84:140))));setLayout({columns,rows});});ro.observe(el);return()=>ro.disconnect();},[]);
  const capacity=layout.columns*layout.rows,pages=Math.max(1,Math.ceil(creatures.length/capacity)),page=Math.min(requested??Math.floor(Math.max(0,creatures.findIndex(c=>c.creatureId===selectedId))/capacity),pages-1);
  return <div ref={ref} className={s.pages}><div className={s.grid} style={{gridTemplateColumns:`repeat(${layout.columns},minmax(0,1fr))`}}>{creatures.slice(page*capacity,(page+1)*capacity).map(c=><button type="button" key={c.creatureId} className={s.tile} aria-label={`Preview ${c.nickname}`} aria-pressed={c.creatureId===selectedId} data-long-name={c.nickname.length>18} onClick={()=>onSelect(c)}><img src={portrait(c)} alt=""/><span><strong>{c.nickname}{c.shiny?' ✦':''}</strong><small>Lv {c.level}</small>{statusBadge(save,c)}</span><img className={s.tileLock} src={`/images/ui/care-b/icons/lock-${c.isLocked?'closed':'open'}.webp`} alt={c.isLocked?'Locked':'Unlocked'}/></button>)}</div><nav className={s.pager} aria-label="Creature card pages"><button type="button" disabled={!page} onClick={()=>setRequested(page-1)}>Previous</button><span aria-live="polite">{page+1} / {pages}</span><button type="button" disabled={page+1>=pages} onClick={()=>setRequested(page+1)}>Next</button></nav></div>;
}

function CardDetails({save,creature,onClose}:{save:GameSave;creature:CreatureRecord;onClose:()=>void}){
  const [page,setPage]=useState(0),status=getCreatureManagementStatus(save,creature),variant=getVariantDefinition(creature.variantId);
  const entries=[['Identity',`${creature.nickname}. ${variant.name}. Species: ${getSpeciesDefinition(creature.speciesId).name}. Level ${creature.level}. ${status.rarity}. Generation ${creature.generation}. ${creature.shiny?'Shiny.':''}`],['Condition',`Status: ${status.primaryStatus}. Energy: ${creature.energy} / ${creature.maxEnergy} (${status.energyPercent}%). Affection: ${creature.affection} / 100. Fertility: ${creature.stats.FER} / Grade ${creature.statGrades.FER}.`],['Readiness',`Giver: ${status.giverEligible?'Ready':status.giverBlockedReason??'Unavailable'}. Receiver: ${status.receiverEligible?'Ready':status.receiverBlockedReason??'Unavailable'}.`],['Record',`${history(status.daysSinceBred)}. ${creature.isLocked?'Locked':'Unlocked'}. ${creature.isFavorite?'Favorite':'Not marked as favorite'}.`]].flatMap(([title,text])=>careDetailPages([text]).map(lines=>({title,text:lines.join(' ')}))),entry=entries[Math.min(page,entries.length-1)];
  return createPortal(<GameDialog title={`${creature.nickname} · Card details`} onClose={onClose}><div className={s.details} data-card-details><h3>{entry.title}</h3><p>{entry.text}</p><nav className={s.pager} aria-label="Card detail pages"><button type="button" disabled={!page} onClick={()=>setPage(page-1)}>Previous detail</button><span>{page+1} / {entries.length}</span><button type="button" disabled={page+1>=entries.length} onClick={()=>setPage(page+1)}>Next detail</button></nav><button type="button" onClick={onClose}>Back to Cards</button></div></GameDialog>,document.body);
}
