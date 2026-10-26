"use client";
import {PairOptionsJournal} from './PairOptionsJournal';
import {ChanceJournalB} from './ChanceJournalB';
import {ReviewAttemptJournalB,type ReviewAttemptProps} from './ReviewAttemptJournalB';
import type{BreedingParticipant,BreedingPreview}from'@/types/breeding';
import type{NurseryPage}from'@/features/nursery/NurseryBook';

export function PairOptionsA({giver,receiver,preview,onClose,onSwap,onRandom,onClear,canSwap,disabled,sceneMode,onSceneMode}:{giver:BreedingParticipant|null;receiver:BreedingParticipant|null;preview:BreedingPreview|null;onClose:()=>void;onSwap:()=>void;onRandom:()=>void;onClear:()=>void;canSwap:boolean;disabled:boolean;sceneMode:'full'|'quick';onSceneMode:(m:'full'|'quick')=>void}){
 return <PairOptionsJournal {...{giver,receiver,preview,onClose,onSwap,onRandom,onClear,canSwap,disabled,sceneMode,onSceneMode}}/>;
}
export function ChanceWindowA({giver,receiver,preview,onClose,rows,blockedReasons,status,message,pages,onReview}:{giver:BreedingParticipant|null;receiver:BreedingParticipant|null;preview:BreedingPreview|null;onClose:()=>void;rows:[string,number][];blockedReasons:string[];status:string;message:string;pages:NurseryPage[];onReview:()=>void}){
 return <ChanceJournalB {...{giver,receiver,preview,onClose,rows,blockedReasons,status,message,pages,onReview}}/>;
}
export function AttemptReviewA(props:ReviewAttemptProps){return <ReviewAttemptJournalB {...props}/>;}
