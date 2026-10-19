"use client";

import { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { GameDialog } from '@/features/ui/GameDialog';
import { DEFAULT_CREATURE_MANAGEMENT_FILTERS, filterAndSortManagedCreatures, getCreatureManagementSummary, type CreatureManagementFilters, type CreatureSortMode, type SortDirection } from '@/data/creatureManagement';
import { getVariantDefinition } from '@/data/creatures';
import type { GameSave } from '@/types/save';
import s from './RosterFiltersC.module.css';

const root='/images/ui/roster-filters-c/';
const icons={condition:'/images/ui/creature-overview-a-v2/painted-r4/creatures.webp',details:root+'spark.svg',sort:root+'sort.svg',family:'/images/ui/creature-overview-a-v2/painted-r4/creatures.webp',status:'/images/ui/atelier-v1/hourglass.webp',energy:'/images/ui/creature-overview-a-v2/sculpted/energy.webp',pregnancy:'/images/ui/atelier-v1/egg.webp',rarity:'/images/ui/creature-overview-a-v2/painted-r4/talents.webp',variant:root+'diamond.svg',origin:root+'pin.svg',direction:root+'direction.svg'};
type Options=ReadonlyArray<readonly [string,string]>;
const families:Options=[['all','All families'],['feline','Feline'],['canine','Canine'],['bovine','Bovine'],['lapine','Lapine'],['equine','Equine']];
const statuses:Options=[['all','Any status'],['ready','Breeding ready'],['pregnant','Pregnant'],['recovering','Recovering'],['recently-bred','Recently bred'],['injured','Injured'],['training','Training'],['low-energy','Low Energy'],['attention','Needs attention']];
const sorts:Options=[['name','Name'],['newest','Newest'],['level','Level'],['energy','Energy %'],['affection','Affection'],['fertility','Fertility'],['rarity','Rarity'],['variant','Variant'],['best-grade','Best grade'],['generation','Generation']];
function Field({label,icon,value,options,onChange}:{label:string;icon:string;value:string;options:Options;onChange:(value:string)=>void}){
  return <label className={s.field}><img src={icon} alt=""/><span>{label}<select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></span></label>;
}

export function RosterFiltersC({save,filters,sort,direction,onClose,onApply}:{save:GameSave;filters:CreatureManagementFilters;sort:CreatureSortMode;direction:SortDirection;onClose:()=>void;onApply:(filters:CreatureManagementFilters,sort:CreatureSortMode,direction:SortDirection)=>void}){
  const [draft,setDraft]=useState<CreatureManagementFilters>(()=>({...filters,sex:'all'}));
  const [order,setOrder]=useState(sort),[dir,setDir]=useState(direction);
  const [section,setSection]=useState<'condition'|'details'|'sort'>('condition');
  const id=useId();
  const matches=useMemo(()=>filterAndSortManagedCreatures(save,draft,order,dir).length,[save,draft,order,dir]);
  const summary=useMemo(()=>getCreatureManagementSummary(save),[save]);
  const variants=useMemo(()=>Array.from(new Map((save.creatures??[]).map(c=>getVariantDefinition(c.variantId)).filter(v=>draft.family==='all'||v.family===draft.family).map(v=>[v.variantId,v])).values()).sort((a,b)=>a.name.localeCompare(b.name)),[save,draft.family]);
  function patch<K extends keyof CreatureManagementFilters>(key:K,value:CreatureManagementFilters[K]){setDraft(d=>({...d,[key]:value,...(key==='family'?{variantId:'all'}:{})}));}
  const directionOptions:Options=order==='name'||order==='variant'?[['asc','A to Z'],['desc','Z to A']]:order==='newest'?[['asc','Oldest first'],['desc','Newest first']]:[['asc','Lowest first'],['desc','Highest first']];
  function field<K extends keyof CreatureManagementFilters>(key:K,label:string,icon:keyof typeof icons,options:Options){return <Field label={label} icon={icons[icon]} value={String(draft[key])} options={options} onChange={value=>patch(key,value as CreatureManagementFilters[K])}/>;}
  if(typeof document==='undefined')return null;
  return createPortal(<GameDialog title="Filters & Sort" onClose={onClose} side>
    <div className={s.drawer} data-roster-filters>
      <p className={s.count} aria-live="polite">{matches} of {summary.total} creatures match</p>
      <div className={s.sections}>
      {(['condition','details','sort'] as const).map(key=><section key={key} className={s.section} data-expanded={section===key}>
        <button className={s.sectionButton} type="button" aria-expanded={section===key} aria-controls={`${id}-${key}`} onClick={()=>setSection(key)}><img src={icons[key]} alt=""/>{key==='condition'?'Condition':key==='details'?'Details':'Sort'}<img className={s.chevron} src={root+'chevron.svg'} alt=""/></button>
        {section===key?<div id={`${id}-${key}`} className={s.panel}>
          {key==='condition'?<><input className={s.search} type="search" aria-label="Search creatures" placeholder="Search creatures…" value={draft.search} onChange={e=>patch('search',e.target.value)}/><div className={s.fields}>
            {field('family','Family','family',families)}{field('status','Status','status',statuses)}
            {field('energy','Energy','energy',[['all','Any energy'],['full','Full'],['ready','Ready'],['tired','Tired'],['exhausted','Exhausted']])}
            {field('pregnancy','Pregnancy','pregnancy',[['all','Any'],['not-pregnant','Not pregnant'],['pregnant','Pregnant'],['due-soon','Due soon'],['recovering','Recovering']])}
          </div></>:key==='details'?<><div className={s.fields}>
            {field('rarity','Rarity','rarity',[['all','Any rarity'],['Common','Common'],['Uncommon','Uncommon'],['Rare','Rare'],['Epic','Epic']])}
            {field('variantId','Variant','variant',[['all','All variants'],...variants.map(v=>[v.variantId,v.name] as const)])}
            {field('origin','Origin','origin',[['all','Any origin'],['starter','Starter'],['hatched','Hatched'],['market','Market'],['guild','Guild']])}
          </div><div className={s.toggles}>{([['favoritesOnly','Favorites only',icons.rarity],['lockedOnly','Locked only','/images/ui/care-b/icons/lock-closed.webp'],['shinyOnly','Shiny only',icons.details]] as const).map(([k,label,icon])=><label key={k}><input type="checkbox" checked={draft[k]} onChange={e=>patch(k,e.target.checked)}/><img src={icon} alt=""/>{label}</label>)}</div></>:<><div className={s.fields}><Field label="Sort by" icon={icons.sort} value={order} options={sorts} onChange={v=>setOrder(v as CreatureSortMode)}/><Field label="Direction" icon={icons.direction} value={dir} options={directionOptions} onChange={v=>setDir(v as SortDirection)}/></div><p className={s.summary}>Ranch totals: {summary.total} creatures · {summary.ready} breeding ready · {summary.pregnant} pregnant · {summary.attention} need attention · {summary.favorites} favorites</p></>}
        </div>:null}
      </section>)}
      </div>
      <footer><button type="button" onClick={()=>setDraft({...DEFAULT_CREATURE_MANAGEMENT_FILTERS})}><img src={root+'reset.svg'} alt=""/>Clear filters</button><button type="button" onClick={onClose}>Cancel</button><button type="button" className={s.primary} onClick={()=>onApply(draft,order,dir)}>Show {matches} {matches===1?'creature':'creatures'} <span aria-hidden="true">›</span></button></footer>
    </div>
  </GameDialog>,document.body);
}
