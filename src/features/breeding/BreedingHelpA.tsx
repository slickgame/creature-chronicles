"use client";
import {useState,type ReactNode} from 'react';
import {DetailButton} from '@/features/ui/DetailButton';
import {GameDialog} from '@/features/ui/GameDialog';
import {DossierIcon} from './BreedingDossierArt';
import s from './BreedingInspectCompact.module.css';

/** Mouse/focus previews stay optional; explicit click/tap opens the complete read-only record. */
export function BreedingHelpA({label,title=label,hint,children,icon,kind='inline'}:{label:string;title?:string;hint:string;children?:ReactNode;icon?:ReactNode;kind?:'inline'|'chip'|'action'|'icon'}){
 const [open,setOpen]=useState(false);
 return <><DetailButton className={s.help} data-kind={kind} tooltipClassName={s.dossierTooltip} hint={hint} aria-label={label} onClick={()=>setOpen(true)}>{icon}{kind!=='icon'&&<span>{label}</span>}<span className={s.infoMark} aria-hidden="true">i</span></DetailButton>{open&&<GameDialog title={title} titleIcon={icon??<DossierIcon name="scroll"/>} dialogClassName={s.helpDialog} onClose={()=>setOpen(false)} wide><div className={s.helpBody}>{children??<p>{hint}</p>}</div></GameDialog>}</>;
}
