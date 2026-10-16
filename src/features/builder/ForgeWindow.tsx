"use client";
import type {ReactNode} from 'react';
import {GameDialog} from '@/features/ui/GameDialog';
import s from './ForgeGallery.module.css';
export const FORGE_ART='/images/ui/forge-gallery-v1/';
export function ForgeIcon({name}:{name:string}){return <img className={s.icon} src={`${FORGE_ART}icons/${name}.svg`} alt=""/>;}
export function ForgeWindow({title,marker,onClose,children,page=0,pages=1,onPage}:{title:string;marker:string;onClose:()=>void;children:ReactNode;page?:number;pages?:number;onPage?:(page:number)=>void}){
 return <GameDialog fullScreen title={title} onClose={onClose}><main className={s.dialogStage}><section className={s.window} data-forge-window={marker}>
 <header><h2>{title}</h2><button aria-label={`Close ${title}`} onClick={onClose}><ForgeIcon name="close"/></button></header>
 <div className={s.windowBody}>{children}</div>
 {marker!=='review'?<footer><button onClick={onClose}><ForgeIcon name="back"/>Back to forge</button>{pages>1&&onPage?<nav className={s.pager} aria-label="Detail pages"><button aria-label="Previous details" disabled={!page} onClick={()=>onPage(page-1)}><ForgeIcon name="back"/></button><span>{page+1}/{pages}</span><button aria-label="Next details" disabled={page+1>=pages} onClick={()=>onPage(page+1)}><ForgeIcon name="next"/></button></nav>:null}</footer>:null}
 </section></main></GameDialog>;
}
