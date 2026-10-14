"use client";
import {GameDialog} from '@/features/ui/GameDialog';
import {BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {substatRollRange} from '@/data/equipmentEnhancement';
import type {getEnhancementQuote} from '@/data/equipmentInstances';
import s from './EnhancementMilestones.module.css';
export function UpgradeReview({quote,gold,stale,onClose,onConfirm}:{quote:NonNullable<ReturnType<typeof getEnhancementQuote>>;gold:number;stale:boolean;onClose:()=>void;onConfirm:()=>void}){
 const next=quote.copy.level+1,milestone=next%3===0,range=substatRollRange(quote.item,'defense');
 return <GameDialog fullScreen title="Confirm equipment upgrade" onClose={onClose}><section className={s.book} data-upgrade-review>
 <div className={s.hero}><img src="/images/ui/enhancement-v1/forge-crest.webp" alt=""/><div><small>{quote.item.name} · #{quote.copy.id.replace('gear_','')}</small><h3>Upgrade +{quote.copy.level} → +{next}</h3><b>Guaranteed level increase</b></div></div>
 <div className={s.stats}><div><small>Main stat · Guaranteed</small><strong>{BATTLE_STAT_LABELS[quote.after.main.key]}</strong><b>{quote.before.main.value} → {quote.after.main.value}</b></div><div className={s.reward}><small>{milestone?'Milestone reward':'No milestone this level'}</small><strong>{milestone?'? Mystery substat':'Substats unchanged'}</strong><b>{milestone?'Revealed on upgrade':`Next reward: +${Math.ceil(next/3)*3}`}</b></div></div>
 <p className={s.limit}>{milestone?`Random new stat until four; then a random existing stat improves. HP +${range[0]*2}–${range[1]*2}, Speed +1–2, others +${range[0]}–${range[1]}.`:'Existing substats stay unchanged.'} Only this piece improves; its grade stays the same.</p>
 <div className={s.cost}><strong>{quote.cost} Gold · No materials</strong><small>Balance: {gold} → {gold-quote.cost} Gold</small></div>
 <footer><button onClick={onClose}>Cancel</button><button disabled={!quote.canUpgrade||stale} onClick={onConfirm}>Confirm upgrade</button></footer>
 </section></GameDialog>;
}
