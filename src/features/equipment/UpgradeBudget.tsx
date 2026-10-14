"use client";
import {useState} from 'react';
import {GameDialog} from '@/features/ui/GameDialog';
import {getUpgradeBudget} from '@/data/economyBudget';
import {FACILITIES} from '@/data/farmResources';
import type {BattleOutfitterItem} from '@/data/battleOutfitter';
import type {GameSave} from '@/types/save';
import s from './EquipmentGuide.module.css';
import b from './UpgradeBudget.module.css';
const PAGES=['Milestones','Food','Construction'];
export function UpgradeBudget({save,item,level,onClose}:{save:GameSave;item:BattleOutfitterItem;level:number;onClose:()=>void}){
 const [page,setPage]=useState(0),[allowance,setAllowance]=useState('0');
 const budget=getUpgradeBudget(save,item,level,Number(allowance));
 return <GameDialog fullScreen title="Upgrade budget" onClose={onClose}><section className={`${s.guide} ${b.budget}`} data-upgrade-budget>
 <header><img src={item.iconPath} alt=""/><div><small>Iona’s planning ledger · +{level} / 15</small><h2>{item.name}</h2><b>{save.currencies.gold} Gold available</b></div></header>
 <nav aria-label="Budget pages">{PAGES.map((name,n)=><button key={name} aria-pressed={page===n} onClick={()=>setPage(n)}>{name}</button>)}</nav>
 <div className={s.panel}>
 {page===0&&<><h3>Milestone costs from +{level}</h3>{budget.rows.length?<table className={b.table}><thead><tr><th>Target</th><th>Gold cost</th><th>After plan</th></tr></thead><tbody>{budget.rows.map(row=><tr key={row.target}><th>+{row.target}</th><td>{row.gold}</td><td data-short={row.afterPlan<0}>{row.afterPlan<0?`Short ${-row.afterPlan}`:row.afterPlan}</td></tr>)}</tbody></table>:<p>Maximum level reached. No more upgrade payments.</p>}<p>“After plan” subtracts the upgrade cost, food fallback and construction allowance from current Gold. Pay one level at a time.</p></>}
 {page===1&&<><h3>Seven-night food fallback</h3><div className={s.main}><strong>{budget.food.topUpGold} Gold</strong><small>{budget.food.shortage} additional Balanced rations at Trade prices</small></div><p>Current residents need {budget.food.nightlyNeed} food units per night. This forecast uses unreserved stock, ingredient feeding if enabled, and legacy Feed.</p><p>Assumes no future gathering, earnings, arrivals or training returns. Pella’s bundles may cost less than Trade.</p></>}
 {page===2&&<><h3>Allow for Petra’s projects</h3><div className={b.presets}><button onClick={()=>setAllowance(String(FACILITIES.quarry.gold))}>Quarry · {FACILITIES.quarry.gold}</button><button onClick={()=>setAllowance(String(FACILITIES.sawmill.gold))}>Sawmill · {FACILITIES.sawmill.gold}</button><button onClick={()=>setAllowance(String(FACILITIES.quarry.gold+FACILITIES.sawmill.gold))}>Both · {FACILITIES.quarry.gold+FACILITIES.sawmill.gold}</button></div><label className={b.allowance}>Gold allowance <input aria-label="Construction Gold allowance" type="number" min="0" step="1" value={allowance} onChange={e=>setAllowance(e.target.value)} onBlur={()=>setAllowance(String(budget.constructionGold))}/></label><button onClick={()=>setAllowance('0')}>Clear allowance</button><p>Gold planning only. Already-paid construction is not charged again. Enter future project costs; check materials and prerequisites with Petra.</p></>}
 </div>
 <div className={b.summary}><strong>{level>=15?'Fully improved':budget.plannedStop?`Highest milestone within plan: +${budget.plannedStop}`:'No later milestone fits this plan'}</strong><small>Food {budget.food.topUpGold} + construction {budget.constructionGold} Gold · Planning only; Gold is not reserved.</small></div>
 <footer><button disabled={page===0} onClick={()=>setPage(n=>n-1)}>‹ Previous</button><button onClick={onClose}>Back to equipment</button><button disabled={page===2} onClick={()=>setPage(n=>n+1)}>Next ›</button></footer>
 </section></GameDialog>;
}
