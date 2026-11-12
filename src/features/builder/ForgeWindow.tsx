"use client";
import type {ReactNode} from 'react';
import {GameDialog} from '@/features/ui/GameDialog';
import s from './ForgeGallery.module.css';
export const FORGE_ART='/images/ui/forge-gallery-v1/';
export const FORGE_SLATE='/images/ui/forge-slate-v2/';
export function ForgeIcon({name}:{name:string}){const sculpted=['craft','coin','gold-coin','compare','upgrade','talk','source'].includes(name);const file=name==='coin'?'gold-coin':name;return <img className={s.icon} src={`${FORGE_SLATE}${sculpted?'sculpted/':'icons/'}${file}.${sculpted?'webp':'svg'}`} alt=""/>;}
export function ForgeWindow({title,marker,onClose,children,footer,footerAction,backLabel="Back to forge",page=0,pages=1,onPage}:{title:string;marker:string;onClose:()=>void;children:ReactNode;footer?:ReactNode;footerAction?:ReactNode;backLabel?:string;page?:number;pages?:number;onPage?:(page:number)=>void}){
 return <GameDialog fullScreen title={title} onClose={onClose}><main className={s.dialogStage} data-forge-stage={marker}><section className={s.window} data-forge-window={marker}>
 <header>
 {(marker==='routes'||marker==='ingredient-sources')?<div className={s.quoteTitle}><p>Iona’s Forge</p><h2>{title}</h2></div>:marker==='forge-furnace'&&title==='Iron furnace'?<div className={s.quoteTitle}><h2>{title}</h2><p>Smelt iron ingots</p></div>:<h2>{title}</h2>}<button aria-label={`Close ${title}`} onClick={onClose}><ForgeIcon name="close"/></button></header>
 <div className={s.windowBody}>{children}</div>
 {marker!=='review'?<footer>{footer??<><button onClick={onClose}><ForgeIcon name="back"/>{backLabel}</button>{footerAction}{pages>1&&onPage?<nav className={s.pager} aria-label="Detail pages"><button aria-label="Previous details" disabled={!page} onClick={()=>onPage(page-1)}><ForgeIcon name="back"/></button><span>{page+1}/{pages}</span><button aria-label="Next details" disabled={page+1>=pages} onClick={()=>onPage(page+1)}><ForgeIcon name="next"/></button></nav>:null}</>}</footer>:null}
 </section></main></GameDialog>;
}
