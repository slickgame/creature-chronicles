"use client";
import type {ReactNode} from 'react';
import type {NurseryPage} from '@/features/nursery/NurseryBook';
import {WindowA,PanelA,PagesA,ProfileA,breedingWindowStyles as s} from './BreedingWindowA';
export const BREEDING_BOOK_ART='/images/ui/atelier-v1/ledger.webp';
export function BreedingPreviewBook({title,onClose,pages,art=BREEDING_BOOK_ART,controls,footer,marker='breeding-preview-book',lead,layout='profile',pageKey,onPageChange,fallbackArt=BREEDING_BOOK_ART}:{title:string;onClose:()=>void;pages:NurseryPage[];art?:string;controls?:ReactNode;footer?:ReactNode;marker?:string;fallbackArt?:string;lead?:ReactNode;layout?:'profile'|'standard'|'single';pageKey?:string;onPageChange?:(key:string)=>void}){
 return <WindowA title={title} onClose={onClose} marker={marker} layout={layout} lead={lead??<ProfileA src={art} fallbackSrc={fallbackArt} name={title} neutral={!art.includes('/images/creatures/')}/>}><PanelA>{controls&&<div className={s.controls}>{controls}</div>}<PagesA pages={pages} pageKey={pageKey} onPageChange={onPageChange}/>{footer&&<footer className={s.actions}>{footer}</footer>}</PanelA></WindowA>;
}
