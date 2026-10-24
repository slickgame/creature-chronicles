"use client";
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {useGameContext} from '@/state/GameProvider';
import {BreedingFocusedScreen as LedgerBreedingScreen} from './BreedingFocusedScreenLedger';
import {InventoryAtelier,INVENTORY_RETURN} from '@/features/inventory/InventoryAtelier';
export function BreedingFocusedScreen(){
 const [open,setOpen]=useState(false),[host,setHost]=useState<HTMLElement|null>(null);const {currentSave}=useGameContext();
 useEffect(()=>{let frame=0;const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>setHost(document.querySelector<HTMLElement>('aside[aria-label="Breeding preview details"]')));};sync();const observer=new MutationObserver(sync);observer.observe(document.body,{childList:true,subtree:true});try{const back=JSON.parse(sessionStorage.getItem(INVENTORY_RETURN)??'null');if(back?.entry==='breeding'&&back.screen==='breeding'){sessionStorage.removeItem(INVENTORY_RETURN);requestAnimationFrame(()=>setOpen(true));}}catch{}return()=>{observer.disconnect();cancelAnimationFrame(frame);};},[]);
 return <><LedgerBreedingScreen/>{host&&currentSave?createPortal(<button style={{order:-2}} onClick={()=>setOpen(true)}><img src="/images/ui/breeding-desk-a/icons/support.webp" alt=""/>Support Items</button>,host):null}{open&&<InventoryAtelier entry="breeding" initialCategory="Consumables" onClose={()=>setOpen(false)}/>}</>;
}
