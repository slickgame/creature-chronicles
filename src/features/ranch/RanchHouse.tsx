"use client";
import {useState} from 'react';
import {useGameContext} from '@/state/GameProvider';
import {useNavigation} from '@/features/navigation/NavigationContext';
import {GameDialog} from '@/features/ui/GameDialog';
import {RanchIcon,type RanchIconName} from '@/features/ui/RanchIcon';
import {RanchGrowthPlanner} from './RanchGrowthPlanner';
import styles from './RanchHouse.module.css';
const PAGES=['Management','Care','Records','Rest'];
const KIT='/images/ui/ranch-house-a';
type HouseAction={label:string;icon:RanchIconName;art?:string;hint:string;action:()=>void};
export function RanchHouse(){
 const game=useGameContext(),nav=useNavigation();const [small,setSmall]=useState(false);
 const page=nav.ranchHousePage;
 if(nav.growthPage!==null)return <RanchGrowthPlanner/>;
 const actions:HouseAction[]=page===0?[
 {label:'Farm work & production',icon:'tools' as const,hint:'Gather, cook, craft and maintain fortifications.',action:game.goToRanchJobs},
 {label:'Ranch upgrades & repairs',icon:'house' as const,hint:'Habitat capacity, nursery, breeding comfort and recovery.',action:game.goToRanchOffice},
 {label:'Storage & inventory',icon:'bag' as const,hint:'Resources, reserves, trade and owned items.',action:()=>nav.open('inventory')},
 ]:page===1?[
 {label:'Growth planner',icon:'house' as const,hint:'Compare new housing, adoptions and food reserves.',action:()=>nav.setGrowthPage(0)},
 {label:'Habitat fields',icon:'paw' as const,hint:'Visit owned habitats or plan new housing with Petra.',action:()=>{nav.setRanchPlot(1);nav.setRanchView('map');}},
 {label:'Egg nursery',icon:'egg' as const,hint:'Pregnancies, incubation and hatching.',action:game.goToNursery},
 ]:page===2?[
 {label:'Creature roster',icon:'paw' as const,hint:'Profiles, equipment, care and creature records.',action:game.goToCollection},
 {label:'Ranch ledger',icon:'tax' as const,hint:'Daily needs, food, security and ranch records.',action:()=>nav.open('ledger')},
 {label:'Story journal',icon:'nest' as const,art:'/images/ui/atelier-v1/ledger.webp',hint:'Chapter progress and recorded events.',action:()=>nav.open('journal')},
 ]:[{label:'Review & End Day',icon:'moon' as const,hint:'Review food, recovery and construction before sleeping.',action:()=>nav.open('end-day')}];
 return <GameDialog fullScreen title="Ranch House" onClose={()=>nav.setRanchView('map')}><main className={`${styles.house} ${small?styles.compact:''}`} data-ranch-house>
 <header className={styles.heading}>
  <button className={styles.back} aria-label="Back to ranch" onClick={()=>nav.setRanchView('map')}><img src="/images/ui/creature-overview-a-v2/icons/back.svg" alt=""/><span>Back<span className={styles.backSuffix}> to ranch</span></span></button>
  <h1>Ranch House</h1>
  <nav className={styles.headerActions} aria-label="House navigation"><button className={styles.roomControl} onClick={()=>setSmall(v=>!v)} aria-label={small?'Expand room':'Minimize room'} aria-expanded={!small}><img src="/images/ui/creature-overview-a-v2/icons/expand.svg" alt=""/><span>{small?'Expand room':'Minimize room'}</span></button><button className={styles.menu} aria-label="Menu" data-navigation-launcher aria-haspopup="dialog" onClick={()=>nav.open('menu')}><img src={`${KIT}/menu.svg`} alt=""/></button></nav>
 </header>
 <section className={styles.workspace}>
  <div className={styles.room} role="img" aria-label="Sunny farmhouse interior"><img src="/images/ui/ranch-v3/house.webp" alt=""/></div>
  <aside className={styles.paper} aria-label="House actions">
   <nav className={styles.pages} aria-label="House pages">{PAGES.map((name,n)=><button key={name} aria-label={name} aria-pressed={n===page} onClick={()=>nav.setRanchHousePage(n)}>{name}</button>)}</nav>
   <h2>{PAGES[page]}</h2>
   <div className={styles.actions}>{actions.map(a=><button key={a.label} onClick={a.action} title={a.hint}>{a.art?<img className={styles.actionArt} src={a.art} alt=""/>:<RanchIcon name={a.icon}/>}<span><strong>{a.label}</strong><small>{a.hint}</small></span><img className={styles.chevron} src={`${KIT}/chevron.svg`} alt=""/></button>)}</div>
   <p className={styles.note}>New ranches begin with one equine companion. Petra builds additional family habitats in Builder’s Yard.</p>
  </aside>
 </section>
 </main></GameDialog>;
}
