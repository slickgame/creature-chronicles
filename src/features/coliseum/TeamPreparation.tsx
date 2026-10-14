"use client";
import {useState} from 'react';
import {useGameContext} from '@/state/GameProvider';
import {GameDialog} from '@/features/ui/GameDialog';
import {BattleOutfitterBench} from '@/features/battle-outfitter/BattleOutfitterBench';
import {EquipmentUpgrades} from '@/features/equipment/EquipmentUpgrades';
import {BATTLE_OUTFITTER_ITEMS,EQUIPMENT_SLOTS,EQUIPMENT_SLOT_LABELS,getEquipmentSlots,type EquipmentSlot} from '@/data/battleOutfitter';
import {getEquippedCopy} from '@/data/equipmentInstances';
import {getEquippedBattleStats,BATTLE_STAT_LABELS} from '@/data/equipmentComparison';
import {getTeamGearPlan} from '@/data/teamGearPlan';
import {equipmentStats} from '@/data/equipmentEnhancement';
import {gameplayArt} from '@/data/creatureGameplayArt';
import type {CreatureId} from '@/types/ids';
import type {CreatureRecord} from '@/types/creature';
import s from '@/features/equipment/EquipmentGuide.module.css';
import t from './TeamPreparation.module.css';
const PAGES=['Gear','Battle stats','Starter plan','Budget','Tactics'];
export function TeamPreparation({selected,initialCreatureId,locked,unavailable,message='',tacticsStock,armed,onArm,onClose}:{selected:CreatureId[];initialCreatureId?:CreatureId|null;locked:boolean;tacticsStock:number;armed:boolean;onArm:()=>void;message?:string;unavailable:(c:CreatureRecord)=>string|null;onClose:()=>void}){
 const {currentSave:save}=useGameContext();
 const [memberId,setMemberId]=useState(initialCreatureId??selected[0]),[page,setPage]=useState(0),[slot,setSlot]=useState<EquipmentSlot>('weapon');
 const [target,setTarget]=useState<0|3|6>(3),[allowance,setAllowance]=useState('0');
 const [destination,setDestination]=useState<'shop'|'upgrade'|null>(null);
 if(!save)return null;
 const team=selected.map(id=>save.creatures?.find(c=>c.creatureId===id)).filter((c):c is CreatureRecord=>!!c);
 const creature=team.find(c=>c.creatureId===memberId)??team[0];
 const slots=creature?getEquipmentSlots(save,creature.creatureId):null;
 const item=BATTLE_OUTFITTER_ITEMS.find(i=>i.itemId===slots?.[slot]);
 const copy=creature&&item?getEquippedCopy(save,creature.creatureId,item.itemId):undefined;
 const stats=item?equipmentStats(item,copy):null;
 const plan=getTeamGearPlan(save,selected,target,Number(allowance));
 const blocked=locked?'Equipment is locked for this gauntlet run.':creature?unavailable(creature):'Choose a teammate first.';
 const upgradeCopy=copy;
 const previewItem=item??BATTLE_OUTFITTER_ITEMS.find(i=>i.equipmentSlot===slot&&!i.coliseumExclusive)!;
 return <GameDialog fullScreen title="Team preparation" onClose={onClose}><section className={`${s.guide} ${t.prep}`} data-team-preparation>
 <header>{creature&&<img src={gameplayArt(creature,true)} alt=""/>}<div><small>Coliseum preparation · {team.length} / 3 selected</small><h2>{creature?.nickname??'Choose your team'}</h2><b>{save.currencies.gold} Gold · {locked?'Gauntlet locked':'Team stays selected'}</b></div></header>
 <nav aria-label="Preparation pages">{PAGES.map((name,n)=><button key={name} aria-pressed={page===n} onClick={()=>setPage(n)}>{name}</button>)}</nav>
 <div className={s.panel}>
 {(page===0||page===1)&&<div className={t.members} aria-label="Selected teammates">{team.map(c=><button key={c.creatureId} aria-pressed={c.creatureId===creature?.creatureId} onClick={()=>setMemberId(c.creatureId)}>{c.nickname}</button>)}</div>}
 {page===0&&<><div className={t.slots}>{EQUIPMENT_SLOTS.map(key=><button key={key} aria-pressed={key===slot} onClick={()=>setSlot(key)}>{EQUIPMENT_SLOT_LABELS[key]}</button>)}</div><div className={t.piece}><img src={previewItem.iconPath} alt=""/><div><h3>{item?`${item.name} +${copy?.level??0}`:'Empty slot'}</h3><p>{stats?`${BATTLE_STAT_LABELS[stats.main.key]} +${stats.main.value} · ${stats.substats.length}/4 substats`:'No equipment bonus. Browse gear or use an available piece.'}</p></div></div><div className={t.actions}><button disabled={!!blocked} onClick={()=>setDestination('shop')}>Buy / equip gear</button><button disabled={!!blocked||!upgradeCopy} onClick={()=>setDestination('upgrade')}>Improve this piece</button></div><p>{blocked||message||'Buying and equipping are separate reviewed actions. Upgrades cost Gold; future substats remain a mystery.'}</p></>}
 {page===1&&<><h3>Current equipped battle numbers</h3><div className={t.stats}>{creature&&Object.entries(getEquippedBattleStats(save,creature)).map(([key,value])=><div key={key}><span>{BATTLE_STAT_LABELS[key as keyof typeof BATTLE_STAT_LABELS]}</span><strong>{value}</strong></div>)}</div><p>Equipment enhancements are included. Encounter modifiers and Tactics Kits apply at battle start. Base stats and innate grades stay unchanged.</p></>}
 {page===2&&<><div className={t.targets}>{([0,3,6] as const).map(n=><button key={n} aria-pressed={target===n} onClick={()=>setTarget(n)}>Target +{n}</button>)}</div><div className={t.planRows}>{plan.rows.map(r=><button key={r.creatureId} onClick={()=>{setMemberId(r.creatureId);setSlot('weapon');setPage(0);}}><strong>{r.nickname}</strong><span>{r.item.name} +{r.level} → +{r.target}<small>{r.buyGold?`Buy ${r.buyGold} + improve ${r.upgradeGold}`:r.equipped?`Keep equipped · improve ${r.upgradeGold}`:`Use available · improve ${r.upgradeGold}`} Gold</small></span><b>{r.gold}</b></button>)}</div><p>Retains equipped weapons. Empty slots use free Training Blades first, then new ones. Tap a teammate to review actions individually.</p></>}
 {page===3&&<><h3>Allow for food & construction</h3><div className={s.main}><strong>{plan.food.topUpGold} Gold food fallback</strong><small>{plan.food.shortage} rations for seven nights, from current stock only.</small></div><label className={t.allowance}>Construction Gold <input aria-label="Team construction allowance" type="number" min="0" step="1" value={allowance} onChange={e=>setAllowance(e.target.value)} onBlur={()=>setAllowance(String(plan.constructionGold))}/></label><p>Enter unpaid future project costs. No future earnings or gathering are assumed; Trade ration prices are a fallback.</p><p>Planning only. Gold is not reserved, and materials/prerequisites must be checked with Petra.</p></>}
 {page===4&&<><h3>Tactics Kit</h3><div className={s.main}><strong>{tacticsStock} available · {armed?'Armed':'Not armed'}</strong><small>Consumed only when battle starts.</small></div><p>Gives the team Inspired for one round and +10 current and maximum Battle Energy.</p><button aria-pressed={armed} disabled={tacticsStock===0&&!armed} onClick={onArm}>{armed?'Disarm Tactics Kit':'Arm Tactics Kit'}</button><p>Changing this choice keeps your selected team. Review opponents and rules from team staging before entering.</p></>}
 </div>
 <div className={t.summary}><strong>{plan.gold} Gold for weapon target +{target} · {plan.afterPlan<0?`Short ${plan.shortage}`:`${plan.afterPlan} left after plan`}</strong><small>Food {plan.food.topUpGold} + construction {plan.constructionGold} Gold · Gear is optional.</small></div>
 <footer><button disabled={page===0} onClick={()=>setPage(n=>n-1)}>‹ Previous</button><button onClick={onClose}>Back to selected team</button><button disabled={page===3} onClick={()=>setPage(n=>n+1)}>Next ›</button></footer>
 {destination==='shop'&&creature&&!blocked&&<GameDialog fullScreen title="Outfitter for selected team" onClose={()=>setDestination(null)}><BattleOutfitterBench key={`${creature.creatureId}:${slot}`} initialCreatureId={creature.creatureId} initialSlot={slot} onReturn={()=>setDestination(null)} returnLabel="Team preparation"/></GameDialog>}
 {destination==='upgrade'&&creature&&upgradeCopy&&!blocked&&<GameDialog fullScreen title="Upgrade for selected team" onClose={()=>setDestination(null)}><EquipmentUpgrades initialEquipmentId={upgradeCopy.id} initialCreatureId={creature.creatureId} embedded onBack={()=>setDestination(null)} returnLabel="Team preparation"/></GameDialog>}
 </section></GameDialog>;
}
