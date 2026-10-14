"use client";
import {useState} from 'react';
import {useGameContext} from '@/state/GameProvider';
import {useNavigation} from '@/features/navigation/NavigationContext';
import {GameDialog} from '@/features/ui/GameDialog';
import {RanchIcon} from '@/features/ui/RanchIcon';
import styles from './RanchHouse.module.css';
const PAGES=['Management','Care','Records','Rest'];
export function RanchHouse(){
 const game=useGameContext(),nav=useNavigation();const [small,setSmall]=useState(false);
 const page=nav.ranchHousePage;
 const actions=page===0?[
 {label:'Farm work & production',icon:'tools' as const,hint:'Gather, cook, craft and maintain fortifications.',action:game.goToRanchJobs},
 {label:'Ranch upgrades & repairs',icon:'house' as const,hint:'Habitat capacity, nursery, breeding comfort and recovery.',action:game.goToRanchOffice},
 {label:'Storage & inventory',icon:'bag' as const,hint:'Resources, reserves, trade and owned items.',action:()=>nav.open('inventory')},
 ]:page===1?[
 {label:'Habitat fields',icon:'paw' as const,hint:'Visit owned habitats or plan new housing with Petra.',action:()=>{nav.setRanchPlot(1);nav.setRanchView('map');}},
 {label:'Creature roster',icon:'paw' as const,hint:'Profiles, equipment, care and creature records.',action:game.goToCollection},
 {label:'Egg nursery',icon:'egg' as const,hint:'Pregnancies, incubation and hatching.',action:game.goToNursery},
 ]:page===2?[
 {label:'Ranch ledger',icon:'tax' as const,hint:'Daily needs, food, security and ranch records.',action:()=>nav.open('ledger')},
 {label:'Story journal',icon:'nest' as const,hint:'Chapter progress and recorded events.',action:()=>nav.open('journal')},
 ]:[{label:'Review & End Day',icon:'moon' as const,hint:'Review food, recovery and construction before sleeping.',action:()=>nav.open('end-day')}];
 return <GameDialog fullScreen title="Ranch House" onClose={()=>nav.setRanchView('map')}><main className={`${styles.house} ${small?styles.compact:''}`} data-ranch-house>
 <header><button onClick={()=>nav.setRanchView('map')}>‹ Back to ranch</button><h1>Ranch House</h1><button onClick={()=>setSmall(v=>!v)} aria-expanded={!small}>{small?'Expand room':'Minimize room'}</button></header>
 <section className={styles.workspace}><div className={styles.room}><h2>Your home & management desk</h2><p>Farm work, improvements, records and rest are managed here.</p></div><aside className={styles.paper}><nav aria-label="House pages">{PAGES.map((name,n)=><button key={name} aria-label={name} aria-pressed={n===page} onClick={()=>nav.setRanchHousePage(n)}>{name==='Management'?'Manage':name}</button>)}</nav><h2>{PAGES[page]}</h2><div className={styles.actions}>{actions.map(a=><button key={a.label} onClick={a.action} title={a.hint}><RanchIcon name={a.icon}/><span><strong>{a.label}</strong><small>{a.hint}</small></span></button>)}</div><p>New ranches begin with one equine companion. Petra builds additional family habitats in Builder’s Yard.</p><footer><button disabled={page===0} onClick={()=>nav.setRanchHousePage(page-1)}>‹ Previous</button><span>{page+1} / 4</span><button disabled={page===3} onClick={()=>nav.setRanchHousePage(page+1)}>Next ›</button></footer></aside></section>
 </main></GameDialog>;
}
