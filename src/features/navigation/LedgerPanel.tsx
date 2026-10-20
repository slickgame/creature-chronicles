"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {useNavigation} from './NavigationContext';
import {useGameContext} from '@/state/GameProvider';
import {GameDialog} from '@/features/ui/GameDialog';
import {RanchIcon,type RanchIconName} from '@/features/ui/RanchIcon';
import {LEDGER_SECTIONS,getRanchLedgerBook,type LedgerSection,type LedgerEntry} from '@/data/ranchLedgerBook';
import {canResolveDailyEventChoice,resolveDailyRanchEventChoice} from '@/data/ranch-day/ranchDayEvents';
import {beginRanchDay} from '@/data/ranch-day/ranchDayState';
import {markChapterOneTutorialSignal} from '@/data/chapterOneGuidedTutorial';
import {getCreatureManagementStatus} from '@/data/creatureManagement';
import {gameplayArt} from '@/data/creatureGameplayArt';
import s from './LedgerPanel.module.css';

const KIT='/images/ui/daily-ledger-a';
const LABELS:Record<LedgerSection,string>={Priorities:'Priorities',Brief:'Morning brief',Event:'Daily event',Goals:'Daily goals',Records:'Today’s records',Moods:'Resident moods'};
const SECTION_ICONS:Record<LedgerSection,RanchIconName>={Priorities:'feed',Brief:'sun',Event:'nest',Goals:'gold',Records:'tax',Moods:'paw'};
function EntryArt({entry,section,portrait}:{entry?:LedgerEntry;section:LedgerSection;portrait?:string}){
 const image=portrait??(entry?.key==='feed'?'/images/ui/habitat-a/feed.webp':entry?.key==='nursery'?'/images/ui/atelier-v1/egg.webp':section==='Records'||section==='Brief'?'/images/ui/atelier-v1/ledger.webp':null);
 const icon:RanchIconName=entry?.key==='chores'?'tools':entry?.key==='tax'?'gold':entry?.key==='condition'?'house':SECTION_ICONS[section];
 return image?<img src={image} alt="" className={portrait?s.portrait:s.itemArt}/>:<RanchIcon name={icon} className={s.itemArt}/>;
}
/** All text remains reachable, including unusually long saved records. */
function textPages(paragraphs:string[],limit:number){
 const pages:string[][]=[[]];let used=0;
 for(const paragraph of paragraphs.filter(Boolean)){
  let line='';
  for(const word of paragraph.split(/\s+/)){
   if(line&&line.length+word.length+1>limit){if(used+line.length>limit){pages.push([]);used=0;}pages.at(-1)!.push(line);used+=line.length;line='';}
   line+=(line?' ':'')+word;
  }
  if(line){if(used+line.length>limit){pages.push([]);used=0;}pages.at(-1)!.push(line);used+=line.length+24;}
 }
 return pages;
}
export function LedgerPanel(){
 const game=useGameContext(),nav=useNavigation(),save=game.currentSave;
 const [section,setSection]=useState<LedgerSection>(()=>LEDGER_SECTIONS.includes(nav.ledgerReturn?.tab as LedgerSection)?nav.ledgerReturn!.tab as LedgerSection:save?.ranchDay?.phase==='morning'?'Brief':'Priorities');
 const [restoredKey,setRestoredKey]=useState(nav.ledgerReturn?.entryKey??null);
 const [page,setPage]=useState(nav.ledgerReturn?.entry??0),[small,setSmall]=useState(false),[review,setReview]=useState<string|null>(null),[message,setMessage]=useState('');
 const [detailPage,setDetailPage]=useState(0),[focus,setFocus]=useState<'entries'|'detail'>('entries');
 const [viewport,setViewport]=useState({width:1440,height:900});
 const latest=useRef(save),busy=useRef(false);
 useEffect(()=>{latest.current=save;},[save]);
 useEffect(()=>{const resize=()=>setViewport({width:window.innerWidth,height:window.innerHeight});resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 const book=useMemo(()=>save?getRanchLedgerBook(save):null,[save]);
 if(!save||!book)return null;
 const entries=book[section],matched=entries.findIndex(e=>e.key===restoredKey),index=matched>=0?matched:Math.min(page,Math.max(0,entries.length-1)),entry=entries[index],event=save.ranchDay?.event;
 const narrow=viewport.width<=700,short=viewport.height<650,focused=narrow&&short;
 const rows=short?2:narrow&&viewport.height<800?2:3,listPage=Math.floor(index/rows),listPages=Math.max(1,Math.ceil(entries.length/rows));
 const choice=entry?.choiceId?canResolveDailyEventChoice(save,entry.choiceId):null;
 const reviewChoice=event?.choices.find(c=>c.choiceId===review);
 const creature=entry?.creatureId?save.creatures?.find(c=>c.creatureId===entry.creatureId):undefined;
 const portrait=creature?gameplayArt(creature):undefined;
 const status=creature?getCreatureManagementStatus(save,creature).primaryStatus:null;
 const empty=section==='Brief'?'The first morning has no previous-day report. Check Priorities and choose how to begin.':section==='Records'?'No major actions recorded today.':section==='Moods'?'No resident creatures to review.':section==='Goals'?'No daily goals are recorded for this day.':'No daily event to review.';
 const reviewEligibility=review?canResolveDailyEventChoice(save,review):null;
 const paragraphs=review?[
  reviewChoice?.description??'This choice is no longer available.',reviewChoice?.requirementLabel??'No item or Gold requirement.',
  'This resolves today’s event once. Reserved supplies stay protected.',!reviewEligibility?.ok?reviewEligibility?.reason??'':'',
 ]:entry?[
  section==='Event'&&!event?.resultText?event?.description??'':'',entry.detail,
  choice&&!choice.ok?choice.reason??'':section==='Priorities'?'':entry.note??'',message!==entry.detail?message:'',
 ]:[empty,message];
 const limit=short?140:narrow?(viewport.height<800?180:210):viewport.height<800?260:430,details=textPages(paragraphs,limit),detailIndex=Math.min(detailPage,details.length-1);
 const close=()=>{nav.setLedgerReturn(null);nav.open(null);};
 const select=(n:number,openDetail=true)=>{setRestoredKey(null);setPage(n);setDetailPage(0);setMessage('');if(focused&&openDetail)setFocus('detail');};
 const chooseSection=(next:LedgerSection)=>{setSection(next);setRestoredKey(null);setPage(0);setDetailPage(0);setMessage('');setFocus('entries');};
 const visit=(destination=entry?.destination)=>{if(!destination||!entry)return;nav.setLedgerReturn({screen:game.appScreen,tab:section,entry:index,entryKey:entry.key});nav.open(null);({nursery:game.goToNursery,chores:game.goToRanchJobs,supplies:game.goToSupplyDepot,office:game.goToRanchOffice,training:game.goToTrainingGrounds,collection:game.goToCollection})[destination]();};
 const begin=()=>{const fresh=latest.current;if(!fresh||busy.current)return;busy.current=true;try{game.saveCurrentGame(markChapterOneTutorialSignal(beginRanchDay(fresh),fresh.dayState.dayNumber>1?'day-two-brief-opened':'morning-opened'));close();}finally{busy.current=false;}};
 const confirm=()=>{if(!review||!latest.current||busy.current)return;busy.current=true;try{const result=resolveDailyRanchEventChoice(latest.current,review);if(result.ok)latest.current=game.saveCurrentGame(result.save);setMessage(result.message);setReview(null);setDetailPage(0);}finally{busy.current=false;}};
 const cancel=()=>{setReview(null);setDetailPage(0);};
 return <GameDialog fullScreen title="Ranch ledger & morning brief" onClose={review?cancel:close}><main className={`${s.ledger} ${small?s.compact:''}`} data-ledger-book data-focused={focused}>
 <div className={s.workspace}><div className={s.scenery} role="img" aria-label="Sunny farmhouse interior"/>
 <article className={s.paper} aria-label="Ranch ledger">
 <header className={s.heading}><h1>Ranch Ledger <small>Day {save.dayState.dayNumber}</small></h1><div><button aria-label={review?'Cancel event review':'Close ranch ledger'} onClick={review?cancel:close}><img src="/images/ui/creature-overview-a-v2/icons/back.svg" alt=""/><span>{review?'Back':'Back to ranch'}</span></button><button aria-label={small?'Expand art':'Minimize art'} aria-expanded={!small} onClick={()=>setSmall(v=>!v)}><img src="/images/ui/creature-overview-a-v2/icons/expand.svg" alt=""/><span>{small?'Expand art':'Minimize art'}</span></button></div></header>
 {!review&&<nav className={s.tabs} aria-label="Ranch ledger sections">{LEDGER_SECTIONS.map(t=><button key={t} onClick={()=>chooseSection(t)} aria-pressed={section===t}>{t}</button>)}</nav>}
 <div className={s.vignette}><img src="/images/ui/ranch-v3/house.webp" alt="Sunny farmhouse desk"/></div>
 {focused&&!review&&entries.length>0&&<nav className={s.focusTabs} aria-label="Ledger view"><button aria-pressed={focus==='entries'} onClick={()=>setFocus('entries')}>Entries</button><button aria-pressed={focus==='detail'} onClick={()=>setFocus('detail')}>Selected entry</button></nav>}
 <h2 className={s.sectionTitle}>{review?'Review daily event choice':section==='Event'?event?.title??LABELS.Event:LABELS[section]}</h2>
 <div className={s.content} data-review={!!review} data-empty={!entries.length}>
 {!review&&entries.length>0&&<section className={s.list} aria-label="Ledger entries" data-shown={!focused||focus==='entries'}>
 <div className={s.rows}>{entries.slice(listPage*rows,(listPage+1)*rows).map((e,n)=>{const rowCreature=e.creatureId?save.creatures?.find(c=>c.creatureId===e.creatureId):undefined;return <button key={e.key} className={s.row} aria-pressed={index===listPage*rows+n} onClick={()=>select(listPage*rows+n)}><EntryArt entry={e} section={section}/><span><strong>{e.title}</strong><small>{rowCreature?`Level ${rowCreature.level} · ${getCreatureManagementStatus(save,rowCreature).primaryStatus}`:e.note??(e.attention?'Needs attention':'View details')}</small></span><img className={s.chevron} src={`${KIT}/chevron.svg`} alt=""/></button>;})}</div>
 <nav className={s.pager} aria-label="Entry pages"><button disabled={listPage===0} onClick={()=>select((listPage-1)*rows,false)}>‹ Previous</button><span>{listPage+1} of {listPages}</span><button disabled={listPage>=listPages-1} onClick={()=>select((listPage+1)*rows,false)}>Next ›</button></nav>
 <label className={s.quick}>Quick select<select aria-label="Ledger entry" value={index} onChange={e=>select(Number(e.target.value))}>{entries.map((e,i)=><option key={e.key} value={i}>{i+1}. {e.title}</option>)}</select></label>
 </section>}
 <section className={s.inspector} aria-label={review?'Event choice review':'Selected ledger entry'} data-shown={!!review||!focused||focus==='detail'||!entries.length} data-attention={entry?.attention}>
 <div className={s.identity}><EntryArt entry={entry} section={section} portrait={portrait}/><div><h3>{review?reviewChoice?.label??'Choice':entry?.title??LABELS[section]}</h3>{creature&&<small>Level {creature.level} · {status}</small>}{!review&&entry?.note&&<span className={s.badge} data-warning={entry.attention}>{entry.attention?'!':'◇'} {section==='Priorities'?entry.note:LABELS[section]}</span>}</div></div>
 <div className={s.copy} data-ledger-copy>{details[detailIndex].map((p,n)=><p key={n}>{p}</p>)}</div>
 {details.length>1&&<nav className={s.pager} aria-label="Detail pages"><button disabled={!detailIndex} onClick={()=>setDetailPage(detailIndex-1)}>‹ Back</button><span>Details {detailIndex+1} / {details.length}</span><button disabled={detailIndex>=details.length-1} onClick={()=>setDetailPage(detailIndex+1)}>More ›</button></nav>}
 <div className={s.links}>{review?<><button onClick={cancel}>Cancel</button><button data-primary disabled={!reviewEligibility?.ok} onClick={confirm}>Confirm choice</button></>:<>{entry?.destination&&<button data-primary onClick={()=>visit()}>{entry.action}<img className={s.chevron} src={`${KIT}/chevron.svg`} alt=""/></button>}{section==='Priorities'&&entry?.key==='feed'&&<button onClick={()=>visit('supplies')}>Pella · Rations</button>}{entry?.choiceId&&!event?.resultText&&<button data-primary disabled={!choice?.ok} onClick={()=>{setReview(entry.choiceId!);setDetailPage(0);}}>Review choice</button>}{!entries.length&&section!=='Priorities'&&<button data-primary onClick={()=>chooseSection('Priorities')}>View priorities</button>}</>}</div>
 {message&&<span className={s.status} role="status">{message}</span>}
 </section></div>
 {!review&&<footer className={s.footer}><span className={s.phase}><RanchIcon name={save.ranchDay?.phase==='morning'?'sun':'moon'}/>{save.ranchDay?.phase==='morning'?'Morning':'Today'}</span>{save.ranchDay?.phase==='morning'?<button data-primary data-tutorial-id="ranch-begin-day" onClick={begin}>Begin Ranch Day</button>:<button data-primary data-tutorial-id="ranch-review-day" onClick={()=>{nav.setLedgerReturn(null);nav.open('end-day');}}>Review & End Day</button>}<small>{save.ranchDay?.goals.filter(g=>g.complete).length??0} / {save.ranchDay?.goals.length??0} daily goals complete</small></footer>}
 </article></div></main></GameDialog>;
}
