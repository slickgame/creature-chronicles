"use client";
import {PairOptionsJournal} from './PairOptionsJournal';
import {ChanceJournalB} from './ChanceJournalB';
import type{BreedingParticipant,BreedingPreview}from'@/types/breeding';
import type{NurseryPage}from'@/features/nursery/NurseryBook';
import{WindowA,PanelA,PagesA,useShortWindow,PairSummaryA,CostTableA,breedingWindowStyles as s}from'./BreedingWindowA';

export function PairOptionsA({giver,receiver,preview,onClose,onSwap,onRandom,onClear,canSwap,disabled,sceneMode,onSceneMode}:{giver:BreedingParticipant|null;receiver:BreedingParticipant|null;preview:BreedingPreview|null;onClose:()=>void;onSwap:()=>void;onRandom:()=>void;onClear:()=>void;canSwap:boolean;disabled:boolean;sceneMode:'full'|'quick';onSceneMode:(m:'full'|'quick')=>void}){
 return <PairOptionsJournal {...{giver,receiver,preview,onClose,onSwap,onRandom,onClear,canSwap,disabled,sceneMode,onSceneMode}}/>;
}
export function ChanceWindowA({giver,receiver,preview,onClose,rows,blockedReasons,status,message,pages,onReview}:{giver:BreedingParticipant|null;receiver:BreedingParticipant|null;preview:BreedingPreview|null;onClose:()=>void;rows:[string,number][];blockedReasons:string[];status:string;message:string;pages:NurseryPage[];onReview:()=>void}){
 return <ChanceJournalB {...{giver,receiver,preview,onClose,rows,blockedReasons,status,message,pages,onReview}}/>;
}
export function AttemptReviewA({giver,receiver,preview,onClose,onConfirm,stale,disabled,warnings}:{giver:BreedingParticipant;receiver:BreedingParticipant;preview:BreedingPreview;onClose:()=>void;onConfirm:()=>void;stale:boolean;disabled:boolean;warnings:string[]}){
 const short=useShortWindow();const parents=[giver,receiver];const content=<><CostTableA participants={parents} preview={preview}/><p>Cost each: <strong>{preview.energyCost} Energy · {preview.heartCost} Heart{preview.heartCost===1?'':'s'}</strong></p><p>Pregnancy chance: <strong>{preview.pregnancyChance}%</strong></p></>;
 const caution=[...warnings,...(preview.pregnancyBlockedReason?[preview.pregnancyBlockedReason]:[]),...(stale?['The pair or costs changed. Close this review and review again.']:[])];
 const pages:NurseryPage[]=[{key:'costs',title:'Exact costs',content},...caution.map((w,i)=>({key:`warning-${i}`,title:`Resource & readiness note ${i+1}`,content:<p className={s.warning}>{w}</p>})),{key:'confirm-rules',title:'Before confirming',content:<p>Cancel changes nothing. Confirm rechecks this pair and its resources before the existing warning and attempt flow.</p>}];
 return <WindowA title="Review attempt" marker="attempt-review" layout="single" onClose={onClose}><PanelA><h2>{giver.displayName} × {receiver.displayName}</h2><PairSummaryA giver={giver} receiver={receiver}/>{short?<PagesA pages={pages}/>:<div className={s.entry}>{content}{caution.map((w,i)=><p className={s.warning} key={i}>{w}</p>)}<p>Cancel changes nothing. Confirm rechecks this pair and its resources before the existing warning and attempt flow.</p></div>}<footer className={s.actions}><button onClick={onClose}>Cancel</button><button data-primary disabled={disabled||stale||!preview.canAttempt} onClick={onConfirm}>Confirm attempt</button></footer></PanelA></WindowA>;
}
