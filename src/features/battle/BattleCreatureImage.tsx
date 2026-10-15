"use client";
import {useEffect,useRef} from 'react';
import {getGameplayArtSet,getCreatureCombatArt} from '@/data/baseGameplayArt';
import {gameplayArt} from '@/data/creatureGameplayArt';
import {getBattleMove} from '@/data/battleMoves';
import type {BattlePresentationEvent} from '@/data/battlePresentation';
import type {BattleCombatant} from '@/types/battle';
import type {CreatureRecord} from '@/types/creature';
import s from './BattleArenaB.module.css';
const FALLBACK='/images/ui/icons/icon_paw_crest.png';
/** A persistent image node per combatant. Effects animate its wrapper and clean up per beat. */
export function BattleCreatureImage({source,combatant,event,reducedMotion}:{source?:CreatureRecord;combatant:BattleCombatant;event:BattlePresentationEvent|null;reducedMotion:boolean}){
 const motion=useRef<HTMLSpanElement>(null);
 const actor=event?.actorId===combatant.battleCombatantId;
 const target=event?.targetIds.includes(combatant.battleCombatantId)??false;
 const move=actor&&event?.kind==='attack'&&event.moveId?getBattleMove(event.moveId):null;
 const src=getCreatureCombatArt(source,{fainted:combatant.isFainted,actor,target,eventKind:event?.kind,effectPreset:event?.preset,specialAttack:!!move&&(move.category==='special'||move.rarity==='signature')})??(source?gameplayArt(source):FALLBACK);
 const art=getGameplayArtSet(source);
 const eventId=event&&(actor||target)?event.eventId:null;
 const kind=event&&(actor||target)?event.kind:null;
 const side=combatant.sideId;
 useEffect(()=>{
  if(!art)return;
  // Pre-decode the six poses without adding hidden image elements to the battlefield.
  for(const path of [art.combatIdle,art.combatBasic,art.combatSpecial,art.combatGuard,art.combatHit,art.combatKO]){
   const image=new Image();image.src=path;void image.decode().catch(()=>{});
  }
 },[art]);
 useEffect(()=>{
  const node=motion.current;if(!node||!eventId||reducedMotion)return;
  const frames:Keyframe[]|null=kind==='attack'?[{transform:'translate(0,0)'},{transform:`translate(${side==='enemy'?-12:12}px,-8px)`},{transform:'translate(0,0)'}]:kind==='damage'?[{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}]:kind==='miss'?[{transform:'translateY(0)'},{transform:'translateY(-10px)'},{transform:'translateY(0)'}]:null;
  if(!frames)return;
  const animation=node.animate(frames,{duration:kind==='attack'?500:400,easing:'ease-in-out'});
  return ()=>animation.cancel();
 },[eventId,kind,side,reducedMotion]);
 return <span ref={motion} className={s.spriteMotion} data-battle-sprite={combatant.battleCombatantId}><img src={src} data-facing={art&&side==='enemy'?'left':'right'} alt={`${combatant.name}, full body`} onError={e=>{if(!e.currentTarget.src.endsWith(FALLBACK))e.currentTarget.src=FALLBACK;}}/></span>;
}
