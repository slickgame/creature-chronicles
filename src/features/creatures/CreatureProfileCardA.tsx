"use client";

import {createPortal} from 'react-dom';
import {GameDialog} from '@/features/ui/GameDialog';
import {getVariantDefinition,CREATURE_PLACEHOLDER_IMAGE} from '@/data/creatures';
import {getCreatureManagementStatus} from '@/data/creatureManagement';
import {careMeterPercent,getCarePresentation} from '@/data/carePresentation';
import {getNylaGameplayCardSprite} from '@/data/nylaGameplayArt';
import {getEquineGameplayCardSprite} from '@/data/equineGameplayArt';
import type {CreatureRecord} from '@/types/creature';
import type {GameSave} from '@/types/save';
import s from './CreatureProfileCardA.module.css';

const ROOT='/images/ui/creature-profile-a';
function Vital({label,value,max,icon,hearts=false}:{label:string;value:number;max:number;icon:string;hearts?:boolean}) {
  const fill=careMeterPercent(value,max),pips=hearts&&max>0&&max<=5&&Number.isInteger(max);
  return <div className={s.vital} data-profile-vital={label} data-kind={icon}>
    <img className={s.vitalIcon} src={`/images/ui/creature-overview-a-v2/sculpted/${icon}.webp`} alt=""/>
    <strong>{label}</strong>
    {pips?<div className={s.hearts} aria-hidden="true">{Array.from({length:max},(_,i)=><span key={i}><img src={`${ROOT}/heart-empty.svg`} alt=""/><i style={{width:`${careMeterPercent(value-i,1)}%`}}><img src="/images/ui/creature-overview-a-v2/sculpted/heart.webp" alt=""/></i></span>)}</div>:<div className={s.meter} role="progressbar" aria-label={`${label} progress`} aria-valuemin={0} aria-valuemax={Math.max(1,max)} aria-valuenow={Math.max(0,Math.min(Math.max(1,max),value))}><i style={{width:`${fill}%`}}/></div>}
    <span className={s.number} aria-label={`${label} ${value} of ${max}`}>{value} / {max}{!hearts?<small>{Math.round(fill)}%</small>:null}</span>
  </div>;
}

export function CreatureProfileCardA({save,creature,onClose,onSupplies,onCare,onProfile,onToggleLock}:{save:GameSave;creature:CreatureRecord;onClose:()=>void;onSupplies:()=>void;onCare:()=>void;onProfile:()=>void;onToggleLock:()=>void}) {
  const variant=getVariantDefinition(creature.variantId),status=getCreatureManagementStatus(save,creature).primaryStatus;
  const state=getCarePresentation(creature,Boolean(creature.injuredUntilDayNumber&&creature.injuredUntilDayNumber>=save.dayState.dayNumber),status);
  const portrait=getEquineGameplayCardSprite(creature,getNylaGameplayCardSprite(creature,variant.portraitPath||CREATURE_PLACEHOLDER_IMAGE));
  if(typeof document==='undefined')return null;
  return createPortal(<GameDialog title={`${creature.nickname} · Profile & Care`} onClose={onClose}>
    <div className={s.window} data-profile-card-a data-long-name={creature.nickname.length>16}>
      <div className={s.identity}><img className={s.portrait} src={portrait} alt={`${creature.nickname} portrait`} onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src=CREATURE_PLACEHOLDER_IMAGE;}}/><div><h3>{creature.nickname}</h3><p>{variant.name} · {variant.rarity}</p><p>Level {creature.level} · Generation {creature.generation}</p><strong className={s.badge} data-tone={state.tone}>{status}</strong></div></div>
      <div className={s.vitals}>
        <Vital label="Energy" value={creature.energy} max={creature.maxEnergy} icon="energy"/>
        <Vital label="Affection" value={creature.affection} max={100} icon="heart"/>
        <Vital label="Hearts" value={creature.hearts} max={creature.maxHearts} icon="heart" hearts/>
        <Vital label="Experience" value={creature.xp} max={creature.xpToNext} icon="experience"/>
      </div>
      <div className={s.protection}><img src={`/images/ui/care-b/icons/${creature.isLocked?'lock-closed':'lock-open'}.webp`} alt=""/><div><strong>{state.status} · {creature.isLocked?'Protected':'Unlocked'}</strong><p>{state.description}</p></div><button type="button" onClick={onToggleLock}>{creature.isLocked?'Unlock creature':'Lock creature'}</button></div>
      <div className={s.actions}><button type="button" data-primary onClick={onSupplies}>Use supplies</button><button type="button" data-primary onClick={onCare}>Care &amp; management</button></div>
      <footer><button type="button" className={s.back} data-initial-focus onClick={onClose}><img src="/images/ui/creature-overview-a-v2/icons/back.svg" alt=""/>Back</button><button type="button" data-primary onClick={onProfile}>Open full profile <img src="/images/ui/creature-inventory-a/art/chevron.webp" alt=""/></button></footer>
    </div>
  </GameDialog>,document.body);
}
