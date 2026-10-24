"use client";
import {useState,type ReactNode} from 'react';
import {DetailButton} from '@/features/ui/DetailButton';
import {GameDialog} from '@/features/ui/GameDialog';
import s from './BreedingInspectCompact.module.css';

/** Hover/focus previews an explanation; explicit click/tap opens complete read-only content. */
export function BreedingHelpA({label,title=label,hint,children}:{label:string;title?:string;hint:string;children?:ReactNode}){
 const [open,setOpen]=useState(false);
 return <><DetailButton className={s.help} hint={hint} aria-label={label} onClick={()=>setOpen(true)}>{label}<span className={s.infoMark} aria-hidden="true">i</span></DetailButton>{open&&<GameDialog title={title} onClose={()=>setOpen(false)} wide><div className={s.helpBody}>{children??<p>{hint}</p>}</div></GameDialog>}</>;
}
