"use client";
import { useRef, useState, type ReactNode } from 'react';
import { getEggReadiness } from '@/data/nurseryCare';
import { getEstimatedDeliveryDateLabel, getLineageRiskLabel, getPregnancyProgressPercent, suggestHatchlingName } from '@/data/nursery';
import { getNurseryCapacity } from '@/data/ranchUpgrades';
import { getSpeciesDefinition, getVariantDefinition } from '@/data/creatures';
import { useGameContext } from '@/state/GameProvider';
import { ScreenNavigation } from '@/features/navigation/ScreenNavigation';
import { useNavigation } from '@/features/navigation/NavigationContext';
import type { CreatureRecord } from '@/types/creature';
import type { EggRecord } from '@/types/save';
import { NurseryBook, type NurseryPage } from './NurseryBook';
import { NurseryScene } from './NurseryScene';
import { nurseryIdentity } from '@/data/nurseryPresentation';
import { GameDialog } from '@/features/ui/GameDialog';
import { PagedItems } from '@/features/ui/PagedItems';
import { getCreatureManagementStatus } from '@/data/creatureManagement';
import s from './NurseryScenic.module.css';

const EGG_ART = '/images/ui/nursery-scenic-a/eggs/equine.webp';
const ICONS='/images/ui/creature-overview-a-v2/painted-r4/';
function Icon({name}:{name:string}){return <img className={s.icon} src={`${ICONS}${name}.webp`} alt=""/>;}
const STAT_LABELS = { STR:'Strength', DEX:'Dexterity', STA:'Stamina', CHA:'Charm', WIL:'Willpower', FER:'Fertility' } as const;
type HatchResult = {egg:EggRecord;creature:CreatureRecord};
function statsPage(stats: Record<string,number>, grades: Record<string,string>): NurseryPage {
  return {key:'stats',title:'Stats & grades',content:<dl className={s.stats}>{Object.entries(stats).map(([key,value])=><div key={key}><dt>{STAT_LABELS[key as keyof typeof STAT_LABELS] ?? key}</dt><dd>{value} <small>Grade {grades[key]}</small></dd></div>)}</dl>};
}
function abilityPages(abilities: EggRecord['projectedAbilities']): NurseryPage[] {
  return abilities.length ? abilities.map((a,i)=>({key:`ability-${i}`,title:a.name,content:<><p>Grade {a.grade} · {a.source}</p><p>{a.description}</p></>})) : [{key:'abilities-empty',title:'Abilities',content:<p>No inherited ability recorded.</p>}];
}
function notePages(notes: string[]): NurseryPage[] {
  return notes.flatMap((note,i)=>{const parts:string[]=[];let part='';for(const word of note.match(/\S+\s*/g)??[]){if(part.length+word.length>210&&part){parts.push(part);part='';}part+=word;}if(part||!parts.length)parts.push(part);return parts.map((text,j)=>({key:`note-${i}-${j}`,title:`Inheritance note ${i+1}${parts.length>1?` · ${j+1}/${parts.length}`:''}`,content:<p>{text}</p>}));});
}
export function NurseryScreen({headerLinks}:{headerLinks?:ReactNode}) {
  const game=useGameContext(),nav=useNavigation(),save=game.currentSave;
  const remembered=nav.nurserySelection?.saveId===save?.saveId?nav.nurserySelection:null;
  const tab=remembered?.tab??'eggs',small=remembered?.small??false;
  const [hatchName,setHatchName]=useState('');
  const [detail,setDetail]=useState<{title:string;pages:NurseryPage[]}|null>(null);
  const [pending,setPending]=useState<{egg:EggRecord;mode:'release'|'donate'}|null>(null);
  const [result,setResult]=useState<HatchResult|null>(null),[rename,setRename]=useState('');
  const [notice,setNotice]=useState('');
  const [focus,setFocus]=useState<'scene'|'care'>('scene');
  const [picker,setPicker]=useState<string|null>(null);
  const [carePage,setCarePage]=useState<'care'|'actions'>('care');
  const busy=useRef(false);
  if(!save)return <main className={s.shell}><header className={s.header}><h1>Egg Nursery</h1><ScreenNavigation/></header><p>No active save.</p></main>;
  const eggs=(save.eggs??[]).filter(e=>e.status!=='hatched').sort((a,b)=>Number(b.status==='ready')-Number(a.status==='ready')||a.daysRemaining-b.daysRemaining);
  const pregnancies=(save.pregnancies??[]).filter(p=>p.status==='pregnant');
  const births=save.birthHistory??[],legacy=(save.eggs??[]).filter(e=>e.status==='hatched'&&!births.some(b=>b.eggId===e.eggId));
  const change=(nextTab=tab,id='',nextSmall=small)=>{nav.setNurserySelection({saveId:save.saveId,tab:nextTab,id,small:nextSmall});if(nextSmall===small)setHatchName('');};
  const selected=eggs.find(e=>e.eggId===remembered?.id)??eggs[0];
  const readiness=selected?getEggReadiness(save,selected):null;
  const visitPetra=()=>{if(selected)window.localStorage.setItem('creature-chronicles-builder-family-v1',getSpeciesDefinition(selected.speciesId).family);window.localStorage.setItem('creature-chronicles-open-builder-yard','1');game.goToTown();};
  const hatch=(egg:EggRecord)=>{if(busy.current)return;busy.current=true;const creature=game.hatchReadyEgg(egg.eggId,hatchName.trim()||egg.suggestedName||suggestHatchlingName(egg));if(!creature){busy.current=false;setNotice('This egg cannot hatch yet. Check incubation and its target habitat.');return;}setResult({egg,creature});setRename(creature.nickname);setHatchName('');};
  const confirmHatch=()=>{if(result&&rename.trim()&&rename.trim()!==result.creature.nickname)game.renameCreature(result.creature.creatureId,rename.trim());setResult(null);busy.current=false;};
  const remove=()=>{if(!pending||busy.current)return;busy.current=true;game.removeNurseryEgg(pending.egg.eggId,pending.mode);setNotice(pending.mode==='donate'?'Egg donated. Added 75 Gold and 1 GP.':'Egg released from the nursery.');setPending(null);busy.current=false;};
  const eggName=(e:EggRecord)=>e.suggestedName||suggestHatchlingName(e);
  const selectedIndex=Math.max(0,eggs.findIndex(e=>e.eggId===selected?.eggId));
  const pregnancy=pregnancies.find(p=>p.pregnancyId===remembered?.id)??pregnancies[0];
  const mother=save.creatures?.find(c=>c.creatureId===pregnancy?.receiver.creatureId);
  const selectedBirth=births.find(b=>b.birthId===remembered?.id)??(legacy.some(e=>e.eggId===remembered?.id)?undefined:births[0]);
  const child=save.creatures?.find(c=>c.creatureId===selectedBirth?.creatureId);
  const recordCreature=tab==='pregnancies'?mother:tab==='births'?child:undefined;
  const art=tab==='pregnancies'&&mother?getVariantDefinition(mother.variantId).portraitPath:tab==='births'&&selectedBirth?getVariantDefinition((child??selectedBirth).variantId).portraitPath:selected?nurseryIdentity(selected).art:EGG_ART;
  const identity=selected?nurseryIdentity(selected):null;
  const summary=`${eggs.filter(e=>e.status==='ready').length} ready · ${eggs.filter(e=>e.status!=='ready').length} incubating · ${pregnancies.length} pregnancies · ${eggs.length}/${getNurseryCapacity(save)} egg spaces`;
  const pregnancyPages: NurseryPage[]=pregnancies.map(p=>({key:p.pregnancyId,title:`${p.receiver.displayName} · ${p.daysRemaining} days`,content:<><p>{p.giver.displayName} × {p.receiver.displayName}</p><p className={s.good}>Expected {getEstimatedDeliveryDateLabel(save.dayState,p.daysRemaining)} · {p.daysRemaining} day{p.daysRemaining===1?'':'s'} until egg delivery</p><progress max={100} value={getPregnancyProgressPercent(p)} aria-label="Pregnancy progress"/><p>Sleep advances delivery. A new egg begins its own incubation timer after delivery.</p><button onClick={()=>setDetail({title:'Pregnancy inheritance',pages:[statsPage(p.inheritance.projectedStats,p.inheritance.projectedStatGrades),...abilityPages(p.inheritance.projectedAbilities),...notePages([...(p.inheritance.lineageNotes??[]),...p.inheritance.statRollNotes,...p.inheritance.abilityRollNotes])]})}>Inheritance details</button></>}));
  const birthPages: NurseryPage[]=[...births.map(b=>({key:b.birthId,title:b.nickname,content:<><p>{b.rarity} · Species: {nurseryIdentity(b).species} · Type: {nurseryIdentity(b).type}</p><p className={s.good}>Hatched on Ranch Day {b.hatchedAtDayNumber}</p><p>{b.parents.giver.displayName} × {b.parents.receiver.displayName}</p><button onClick={()=>setDetail({title:`${b.nickname} · Birth record`,pages:[{key:'grades',title:'Inherited grades',content:<dl className={s.stats}>{Object.entries(b.inheritedStatGrades).map(([key,g])=><div key={key}><dt>{STAT_LABELS[key as keyof typeof STAT_LABELS]}</dt><dd>Grade {g}</dd></div>)}</dl>},...abilityPages(b.inheritedAbilities),...notePages([b.lineageRiskLabel??getLineageRiskLabel(b.lineageRisk),...(b.lineageTraits??[])])]})}>Birth details</button></>})),...legacy.map(e=>({key:e.eggId,title:eggName(e),content:<><p>Legacy hatch record · Species: {nurseryIdentity(e).species} · Type: {nurseryIdentity(e).type}</p><p>{e.parents.giver.displayName} × {e.parents.receiver.displayName}</p><p>This older save retains its original egg record.</p></>}))];
  const records=tab==='pregnancies'?pregnancyPages:birthPages;
  // Selection persists across source visits; each book starts at the remembered record.
  const recordIndex=Math.max(0,records.findIndex(r=>r.key===remembered?.id));
  const record=records[recordIndex];
  return <main className={`${s.shell} ${small?s.compact:''}`} data-nursery>
    <div className={s.frame}>
    <header className={s.header}><h1>Egg Nursery</h1><ScreenNavigation>{headerLinks}</ScreenNavigation><button aria-expanded={!small} onClick={()=>{change(tab,remembered?.id??'',!small);if(!small)setFocus('care');}}>{small?'Expand art':'Minimize art'}</button></header>
    <div className={s.topbar}><nav className={s.tabs} aria-label="Nursery sections">{(['eggs','pregnancies','births'] as const).map(t=><button key={t} aria-pressed={tab===t} onClick={()=>change(t)}>{t==='eggs'?'Eggs':t==='pregnancies'?'Pregnancies':'Births'}</button>)}</nav><p className={s.summary}>{summary}</p></div>
    {tab==='eggs'&&<nav className={s.mobileViews} aria-label="Nursery view"><button aria-pressed={focus==='scene'} onClick={()=>setFocus('scene')}>Browse eggs</button><button aria-pressed={focus==='care'} onClick={()=>setFocus('care')}>Selected egg</button></nav>}
    <section className={s.workspace} data-focus={tab==='eggs'?focus:'care'}><aside className={s.art}>
      {tab==='eggs'?<><NurseryScene egg={selected?art:undefined} alt={`${identity?.species??''} egg`}/>{selected&&<><div className={s.sceneArrows}><button aria-label="Previous egg" disabled={!selectedIndex} onClick={()=>change('eggs',eggs[selectedIndex-1].eggId)}>‹</button><button aria-label="Next egg" disabled={selectedIndex===eggs.length-1} onClick={()=>change('eggs',eggs[selectedIndex+1].eggId)}>›</button></div><div className={s.dock}><span aria-live="polite">Egg {selectedIndex+1} of {eggs.length}</span><button onClick={()=>setPicker(selected.eggId)}>Choose egg</button></div><div className={s.artLabel}>{eggName(selected)}<small>{identity?.species} · {selected.status==='ready'?'Ready to hatch':`${selected.daysRemaining} days remaining`}</small></div><button className={s.mobileBack} onClick={()=>setFocus('care')}>View care</button></>}</>:<><img src={art} alt={tab==='pregnancies'&&mother?`${mother.nickname} portrait`:selectedBirth?`${selectedBirth.nickname} portrait`:'Nursery egg'}/>{mother&&tab==='pregnancies'&&<p className={s.artLabel}>{mother.nickname} · Level {mother.level}<small>{getCreatureManagementStatus(save,mother).primaryStatus}</small></p>}{child&&tab==='births'&&<p className={s.artLabel}>{child.nickname} · Level {child.level}<small>{getCreatureManagementStatus(save,child).primaryStatus}</small></p>}</>}
    </aside>
    <article className={s.paper} aria-label="Selected nursery record" data-detail={carePage} data-record={tab!=='eggs'}>
    {tab!=='eggs'&&recordCreature&&<div className={s.recordIdentity}><img src={getVariantDefinition(recordCreature.variantId).portraitPath} alt={`${recordCreature.nickname} portrait`}/><div><b>{recordCreature.nickname} · Level {recordCreature.level}</b><small>{getCreatureManagementStatus(save,recordCreature).primaryStatus}</small></div></div>}
    {tab==='eggs'?(selected?<>
      <div className={s.identity}><img src={art} alt={`${identity?.species} egg thumbnail`}/><div><h2>{eggName(selected)}</h2><p>{selected.rarity} · {identity?.species}</p><small>{selected.status==='ready'?'Ready to hatch':`${selected.daysRemaining} days remaining`}</small></div></div>
      <nav className={s.careTabs} aria-label="Selected egg pages"><button aria-pressed={carePage==='care'} onClick={()=>setCarePage('care')}>Care</button><button aria-pressed={carePage==='actions'} onClick={()=>setCarePage('actions')}>Actions</button></nav>
      <div className={s.entry} data-nursery-egg><dl className={s.details}><div><dt>Species</dt><dd>{identity?.species}</dd></div><div><dt>Type</dt><dd>{identity?.type}</dd></div></dl><p className={readiness?.canHatch?s.good:s.warning}>{readiness?.canHatch?`Ready to hatch · ${readiness.spaces} habitat space${readiness.spaces===1?'':'s'} open`:readiness?.blocker}</p>
      {selected.status!=='ready'&&<progress aria-label="Incubation progress" max={Math.max(1,selected.totalDays)} value={Math.max(0,selected.totalDays-selected.daysRemaining)}/>}
      {selected.status==='ready'&&readiness?.canHatch&&<label className={s.name}>Hatchling name<input aria-label="Hatchling name" value={hatchName} onChange={e=>setHatchName(e.target.value)} placeholder={eggName(selected)} maxLength={24}/></label>}
      <div className={s.actions}><button data-primary disabled={!readiness?.canHatch} onClick={()=>hatch(selected)}>Hatch</button>{selected.status==='ready'&&!readiness?.canHatch&&<button onClick={visitPetra}>Petra · Housing</button>}</div></div>
      <div className={s.actionStack}><button onClick={game.goToEggAtelier}><Icon name="care"/>Egg care</button><button onClick={()=>setDetail({title:'Projected Stats & Abilities',pages:[statsPage(selected.projectedStats,selected.projectedStatGrades),...abilityPages(selected.projectedAbilities)]})}><Icon name="growth"/>Stats & Abilities</button><button onClick={()=>setDetail({title:'Lineage & Inheritance',pages:[{key:'parents',title:'Parents & lineage',content:<><p>{selected.parents.giver.displayName} × {selected.parents.receiver.displayName}</p><p>{selected.lineageRiskLabel??getLineageRiskLabel(selected.lineageRisk)}</p></>},...notePages([...(selected.lineageNotes??[]),...(selected.lineageTraits??[]).map(t=>`Trait marker: ${t}`),...selected.statRollNotes,...selected.abilityRollNotes,...(selected.geneticsNotes??[])])]})}><Icon name="lineage"/>Lineage</button><button onClick={()=>setDetail({title:'Other Actions',pages:[{key:'remove',title:'Remove this egg',content:<><p>Donation gives 75 Gold and 1 GP. Release gives no reward. Both remove the egg permanently.</p><div className={s.actions}>{(['release','donate'] as const).map(mode=><button key={mode} onClick={()=>{setDetail(null);setPending({egg:selected,mode});}}>{mode==='donate'?'Donate':'Release'}</button>)}</div></>}]})}>Other Actions</button></div>
      <div className={s.pager}><button aria-label="Previous selected egg" disabled={!selectedIndex} onClick={()=>change('eggs',eggs[selectedIndex-1].eggId)}>‹</button><button onClick={()=>setPicker(selected.eggId)}>Egg {selectedIndex+1} of {eggs.length} · Choose</button><button aria-label="Next selected egg" disabled={selectedIndex===eggs.length-1} onClick={()=>change('eggs',eggs[selectedIndex+1].eggId)}>›</button></div><button className={s.mobileBack} onClick={()=>setFocus('scene')}>Back to eggs</button>
    </>:<div className={s.empty}><h2>A new beginning awaits</h2><p>Successful breeding starts a pregnancy. Sleep until delivery, then care for the egg until it is ready.</p><button onClick={game.goToBreeding}>Visit Breeding</button></div>):record?<>
      <label className={s.name}>{tab==='pregnancies'?'Pregnancy':'Birth record'}<select aria-label={tab==='pregnancies'?'Pregnancy':'Birth record'} value={record.key} onChange={e=>change(tab,e.target.value)}>{records.map(r=><option key={r.key} value={r.key}>{r.title}</option>)}</select></label><div className={s.entry}><h2>{record.title}</h2>{record.content}</div><div className={s.pager}><button disabled={!recordIndex} onClick={()=>change(tab,records[recordIndex-1].key)}>‹ Previous</button><span>{recordIndex+1} / {records.length}</span><button disabled={recordIndex===records.length-1} onClick={()=>change(tab,records[recordIndex+1].key)}>Next ›</button></div>
    </>:<div className={s.empty}><h2>{tab==='pregnancies'?'No active pregnancies':'No births recorded yet'}</h2><p>{tab==='pregnancies'?'Successful breeding creates a pregnancy. Delivery advances when you sleep.':'Hatched offspring appear here with their parents and inherited grades.'}</p><button onClick={game.goToBreeding}>Visit Breeding</button></div>}
    </article></section></div>
    {picker!==null&&<GameDialog title="Choose egg" onClose={()=>setPicker(null)} fullScreen><main className={s.shell} data-nursery-picker><section className={s.picker}><header className={s.pickerHeader}><h1>Choose egg</h1><button aria-label="Close egg picker" onClick={()=>setPicker(null)}>×</button></header><div className={s.pickerBody}><PagedItems label="Nursery eggs" rowHeight={82} initialItemIndex={Math.max(0,eggs.findIndex(e=>e.eggId===picker))} items={eggs.map(e=>{const id=nurseryIdentity(e);return <button className={s.eggRow} key={e.eggId} aria-pressed={picker===e.eggId} onClick={()=>setPicker(e.eggId)}><img src={id.art} alt=""/><span><b>{eggName(e)}</b><small>{id.species} · {id.type}</small><small>{e.status==='ready'?'Ready to hatch':`Incubating · ${e.daysRemaining} days`}</small></span></button>;})}/></div><footer className={s.pickerFooter}><button onClick={()=>setPicker(null)}>Cancel</button><button data-primary onClick={()=>{change('eggs',picker);setPicker(null);}}>Select egg</button></footer></section></main></GameDialog>}
    {detail&&<NurseryBook scenic art={art} title={detail.title} onClose={()=>setDetail(null)} pages={detail.pages}/>}
    {pending&&<NurseryBook scenic art={nurseryIdentity(pending.egg).art} title={pending.mode==='donate'?'Donate Egg?':'Release Egg?'} onClose={()=>setPending(null)} pages={[{key:'confirm',title:eggName(pending.egg),content:<><p>This permanently removes the egg from your Nursery.</p><p>{pending.mode==='donate'?'Receive exactly 75 Gold and 1 GP.':'No reward is granted.'}</p></>}]} footer={<><button onClick={()=>setPending(null)}>Cancel</button><button onClick={remove}>{pending.mode==='donate'?'Confirm Donation':'Confirm Release'}</button></>}/>}
    {notice&&<NurseryBook scenic art={art} title="Nursery Notice" onClose={()=>setNotice('')} pages={[{key:'notice',title:'Nursery update',content:<p role="status">{notice}</p>}]}/>}
    {result&&<NurseryBook scenic title={`${result.creature.nickname} hatched!`} art={getVariantDefinition(result.creature.variantId).portraitPath} artAlt={`${result.creature.nickname} portrait`} onClose={confirmHatch} pages={[{key:'welcome',title:'Welcome to the ranch',content:<><p>{result.egg.parents.giver.displayName} × {result.egg.parents.receiver.displayName}</p><p className={s.good}>Joined {nurseryIdentity(result.creature).species} housing · Birth recorded</p><label className={s.name}>Hatchling name<input value={rename} onChange={e=>setRename(e.target.value)} maxLength={24} placeholder={result.creature.nickname}/></label></>},statsPage(result.creature.stats,result.creature.statGrades),{key:'care',title:'First-day care',content:<dl className={s.stats}><div><dt>Energy</dt><dd>{result.creature.energy}/{result.creature.maxEnergy}</dd></div><div><dt>Hearts</dt><dd>{result.creature.hearts}/{result.creature.maxHearts}</dd></div><div><dt>Affection</dt><dd>{result.creature.affection}</dd></div></dl>},...abilityPages(result.creature.abilities),...notePages([...(result.egg.lineageNotes??[]),...result.egg.statRollNotes,...result.egg.abilityRollNotes,...(result.egg.geneticsNotes??[])])]} footer={<button onClick={confirmHatch}>Confirm Hatchling</button>}/>}
  </main>;
}
