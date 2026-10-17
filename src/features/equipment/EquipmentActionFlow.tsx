"use client";
import {useEffect,useRef,useState} from 'react';
import {useGameContext} from '@/state/GameProvider';
import {getEquipmentActionQuote,type EquipmentActionRequest} from '@/data/equipmentAction';
import {getEquipmentChangeSnapshot,type EquipmentChangeSnapshot} from '@/data/equipmentChangeSnapshot';
import {EquipmentAssignment} from './EquipmentAssignment';
import {EquipmentResultWindow} from './EquipmentResultWindow';
import {GameDialog} from '@/features/ui/GameDialog';

/** Shared chooser, confirmation and saved receipt; browsing recipients never writes a save. */
export function EquipmentActionFlow({request,onClose,onRecipientChange}:{request:EquipmentActionRequest;onClose:()=>void;onRecipientChange?:(id:string)=>void}){
 const {currentSave:save}=useGameContext();
 const [recipient,setRecipient]=useState(()=>save?.creatures?.find(c=>c.creatureId===request.creatureId)?.creatureId??save?.creatures?.[0]?.creatureId??'');
 const [reviewing,setReviewing]=useState(request.kind==='remove');
 if(!save)return null;
 if(!reviewing)return <EquipmentAssignment key="recipient-chooser" save={save} copyId={request.equipmentId} creatureId={recipient} confirmation={false} onSelect={id=>{setRecipient(id);onRecipientChange?.(id);}} onClose={onClose} onReview={()=>{onRecipientChange?.(recipient);setReviewing(true);}} onConfirm={()=>{}}/>;
 return <ConfirmedEquipmentAction key="confirmed-action" request={{...request,creatureId:request.kind==='remove'?request.creatureId:recipient}} onClose={onClose}/>;
}

/** Capture the quote when review opens, after the recipient has been selected. */
function ConfirmedEquipmentAction({request,onClose}:{request:EquipmentActionRequest;onClose:()=>void}){
 const {currentSave:save,saveCurrentGame}=useGameContext();
 const [review]=useState(()=>save?getEquipmentActionQuote(save,request):null);
 const [receipt,setReceipt]=useState<EquipmentChangeSnapshot|null>(null),[message,setMessage]=useState(''),[rewardNote,setRewardNote]=useState('');
 const busy=useRef(false);
 const [confirmReady,setConfirmReady]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setConfirmReady(true),250);return()=>clearTimeout(timer);},[]);
 if(!save)return null;
 const current=getEquipmentActionQuote(save,request);
 const blocker=!current.ok?current.message:review?.ok&&current.fingerprint!==review.fingerprint?'Equipment or creature stats changed. Close and review this piece again.':null;
 function confirm(){
  if(!save||busy.current||!confirmReady)return;busy.current=true;
  const fresh=getEquipmentActionQuote(save,request);
  if(!fresh.ok||!review?.ok||fresh.fingerprint!==review.fingerprint){setMessage(!fresh.ok?fresh.message:'Equipment or creature stats changed. Close and review this piece again.');return;}
  const persisted=saveCurrentGame(fresh.save);
  const gold=persisted.currencies.gold-fresh.save.currencies.gold,gp=persisted.currencies.guildPoints-fresh.save.currencies.guildPoints;
  if(gold||gp)setRewardNote(`Goal rewards: +${gold} Gold, +${gp} GP.`);
  setReceipt(getEquipmentChangeSnapshot(save,persisted,request.creatureId,fresh.snapshot.slot,request.kind));
 }
 if(message||!review?.ok)return <GameDialog title="Equipment unavailable" onClose={onClose}><p role="alert">{message??''}{!message?(review&&!review.ok?review.message:'No active save is available.'):''}</p><button onClick={onClose}>Close</button></GameDialog>;
 if(receipt)return <EquipmentResultWindow key="saved-receipt" snapshot={receipt} completed note={rewardNote} onClose={onClose}/>;
 if(request.kind==='remove')return <EquipmentResultWindow key="removal-review" snapshot={review.snapshot} blocker={blocker} onClose={onClose} onConfirm={confirm}/>;
 if(blocker)return <GameDialog title="Equipment changed" onClose={onClose}><p role="alert">{blocker}</p><button onClick={onClose}>Close and review again</button></GameDialog>;
 return <EquipmentAssignment save={save} copyId={request.equipmentId} creatureId={request.creatureId} confirmation confirmDisabled={!confirmReady} onSelect={()=>{}} onClose={onClose} onReview={()=>{}} onConfirm={confirm}/>;
}
