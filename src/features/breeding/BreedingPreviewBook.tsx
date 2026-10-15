"use client";
import {useState,type ReactNode} from 'react';
import {GameDialog} from '@/features/ui/GameDialog';
import {NurseryPages,type NurseryPage} from '@/features/nursery/NurseryBook';
import s from '@/features/nursery/NurseryBook.module.css';
import local from './BreedingPreviewBook.module.css';
export const BREEDING_BOOK_ART='/images/ui/atelier-v1/ledger.webp';
export function BreedingPreviewBook({title,onClose,pages,art=BREEDING_BOOK_ART,controls,footer,marker='breeding-preview-book'}:{title:string;onClose:()=>void;pages:NurseryPage[];art?:string;controls?:ReactNode;footer?:ReactNode;marker?:string}){
 const [small,setSmall]=useState(false),[failed,setFailed]=useState<string|null>(null);
 const image=failed===art?BREEDING_BOOK_ART:art;
 return <GameDialog title={title} onClose={onClose} fullScreen><main className={`${s.shell} ${local.book} ${small?s.compact:''}`} data-breeding-book={marker} data-minimized={small}>
 <header className={s.header}><button onClick={onClose}>← Back</button><h1>{title}</h1><button aria-expanded={!small} onClick={()=>setSmall(v=>!v)}>{small?'Expand art':'Minimize art'}</button></header>
 <section className={`${s.workspace} ${local.workspace}`}><aside className={s.art}><img src={image} data-neutral={image===BREEDING_BOOK_ART} alt={image===BREEDING_BOOK_ART?'Illustrated breeding record':'Selected parent artwork'} onError={()=>{if(image!==BREEDING_BOOK_ART)setFailed(art);}}/></aside><article className={`${s.paper} ${local.paper}`}>
 {controls&&<div className={local.controls}>{controls}</div>}<div className={local.details}><NurseryPages label="Detail page" pages={pages}/></div>{footer&&<footer className={s.actions}>{footer}</footer>}
 </article></section></main></GameDialog>;
}
