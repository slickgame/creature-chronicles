"use client";
import {useState} from 'react';
import {useGameContext} from '@/state/GameProvider';
import {useNavigation} from '@/features/navigation/NavigationContext';
import {GameDialog} from '@/features/ui/GameDialog';
import {RanchIcon} from '@/features/ui/RanchIcon';
import {getRanchGrowthPlan} from '@/data/ranchGrowthPlan';
import {getMarketListingProfileImage} from '@/data/market';
import styles from './RanchGrowthPlanner.module.css';
const titleCase=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
export function RanchGrowthPlanner(){
 const game=useGameContext(),nav=useNavigation();
 const [compact,setCompact]=useState(false);
 if(!game.currentSave)return null;
 const plan=getRanchGrowthPlan(game.currentSave);
 const choices=['Food reserve',...plan.habitats.map(h=>`${titleCase(h.family)} habitat`),...plan.adoptions.map(a=>`${a.listing.displayName}${a.listing.status==='sold'?' · Adopted':''}`)];
 const page=Math.max(0,Math.min(nav.growthPage??0,choices.length-1));
 const habitat=page>0&&page<=plan.habitats.length?plan.habitats[page-1]:null;
 const adoption=page>plan.habitats.length?plan.adoptions[page-plan.habitats.length-1]:null;
 const art=habitat?.art??(adoption?getMarketListingProfileImage(adoption.listing):'/images/ui/ranch-v3/house.webp');
 const visitPetra=(family:string)=>{window.localStorage.setItem('creature-chronicles-builder-family-v1',family);window.localStorage.setItem('creature-chronicles-open-builder-yard','1');game.goToTown();};
 return <GameDialog fullScreen title="Ranch growth planner" onClose={()=>nav.setGrowthPage(null)}><main className={`${styles.planner} ${compact?styles.compact:''}`} data-growth-planner>
 <header><button onClick={()=>nav.setGrowthPage(null)}>‹ House</button><h1>Ranch growth planner</h1><button onClick={()=>setCompact(v=>!v)} aria-expanded={!compact}>{compact?'Expand art':'Minimize art'}</button></header>
 <section className={styles.workspace}><div className={`${styles.illustration} ${adoption?styles.creature:''}`} style={{backgroundImage:`url(${art})`}} role="img" aria-label={choices[page]}/><article className={styles.paper}>
 <label>Plan a next step<select aria-label="Growth plan" value={page} onChange={e=>nav.setGrowthPage(Number(e.target.value))}>{choices.map((c,i)=><option key={i} value={i}>{c}</option>)}</select></label>
 <h2>{choices[page]}</h2>
 <div className={styles.balance}><RanchIcon name="tax"/><strong>{plan.gold} Gold</strong><span>available now</span></div>
 {page===0&&<><dl><div><dt>Food each night</dt><dd>{plan.food.nightlyNeed}</dd></div><div><dt>3-night shortfall</dt><dd>{plan.food.shortage}</dd></div><div><dt>Top-up estimate</dt><dd>{plan.food.topUpGold} G</dd></div></dl><p>Current residents only. Uses spendable food stock and your feeding settings; reserves stay protected.</p><p>Gathering, cooking, rewards and future arrivals are excluded. The estimate uses the standard ration price; check the shop’s exact bundle offer.</p><div className={styles.links}><button onClick={game.goToRanchJobs}>Gather & cook</button><button onClick={game.goToSupplyDepot}>Visit Pella · Rations</button></div></>}
 {habitat&&<><p className={styles.status}>{habitat.summary}</p><dl><div><dt>{habitat.state==='planned'?'Housing fee':'Further housing fee'}</dt><dd>{habitat.fee} G</dd></div><div><dt>Spendable Wood</dt><dd>{plan.availableWood}</dd></div><div><dt>After fee + food*</dt><dd>{habitat.afterFood} G</dd></div></dl><p>{habitat.state==='planned'?`${habitat.wood} Wood required · ${plan.reservedWood} Wood reserved. ${habitat.missingWood?`Need ${habitat.missingWood} more spendable Wood.`:'Wood covered.'}`:habitat.state==='building'?`Already paid. Sleep in the House to advance to Day ${habitat.readyDay}.`:'Housing is owned. Check adoption availability for this family.'}</p><p>{habitat.state==='planned'?(habitat.crewBusy?'Builder crew busy; finish the current project first.':habitat.canCommission?'Ready to review with Petra.':'More Gold or unreserved Wood needed.')+' New housing starts empty; adoption is separate. One night to build.':'No additional habitat purchase is needed.'}</p><div className={styles.links}><button onClick={()=>visitPetra(habitat.family)}>Visit Petra</button><button onClick={game.goToRanchJobs}>Gather Wood</button><button onClick={game.goToMarket}>View adoptions</button></div><small>*Current residents’ 3-night food top-up estimate. No future income assumed.</small></>}
 {adoption&&<><p className={styles.status}>{adoption.blocker??'Housing ready · Review with Tamsin'}</p><dl><div><dt>Adoption fee</dt><dd>{adoption.fee} G</dd></div><div><dt>Extra food/night</dt><dd>+{adoption.nightlyFood}</dd></div><div><dt>After fee + food*</dt><dd>{adoption.afterFood} G</dd></div></dl><p>{titleCase(adoption.listing.family)} · {adoption.listing.rarity}. Fee includes current Trust benefits. Availability and housing are checked again at adoption.</p><p>*Food estimate covers current residents for 3 nights. Budget extra for the arrival; housing purchases are separate.</p><div className={styles.links}><button onClick={game.goToMarket}>Visit Tamsin · Adoptions</button>{adoption.blocker==='Habitat needed'&&<button onClick={()=>visitPetra(adoption.listing.family)}>Visit Petra · Housing</button>}{adoption.blocker==='Habitat full'&&<button onClick={game.goToRanchOffice}>Expand capacity</button>}</div></>}
 <footer><button disabled={page===0} onClick={()=>nav.setGrowthPage(page-1)}>‹ Previous</button><span>{page+1} / {choices.length}</span><button disabled={page===choices.length-1} onClick={()=>nav.setGrowthPage(page+1)}>Next ›</button></footer>
 </article></section></main></GameDialog>;
}
