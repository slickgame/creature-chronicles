"use client";
import {useState} from "react";
import type {BreedingParticipant, BreedingPreview} from "@/types/breeding";
import {useNavigation} from "@/features/navigation/NavigationContext";
import s from "./BreedingDeskA.module.css";
const base="/images/ui/breeding-desk-a/";
function Icon({name}:{name:string}) {return <img src={`${base}icons/${name}`} alt=""/>;}
function Parent({role,parent,disabled,onChoose,onInspect}:{role:"giver"|"receiver";parent:BreedingParticipant|null;disabled:boolean;onChoose:()=>void;onInspect:()=>void}) {
 const [failed,setFailed]=useState<string|null>(null);
 const status=parent?.unavailableReason??(parent?.isInjured?"Injured":parent?.isPregnant?`Pregnant · ${parent.pregnancyDaysRemaining??"—"} days`:parent?.canBreed===false?"Unavailable":"Ready");
 return <article className={s.parent} data-role={role} data-empty={!parent}>
 <div className={s.visual}>{parent ? parent.profilePath&&failed!==parent.profilePath?<img className={s.profile} src={parent.profilePath} alt={`${parent.displayName} full-body profile`} onError={()=>setFailed(parent.profilePath??null)}/>:<div className={s.fallback}><strong>{parent.displayName}</strong><p>{parent.kind==="player"?"Rancher":"Profile unavailable"}</p></div>:<button className={s["empty-choice"]} disabled={disabled} onClick={onChoose}><Icon name="choose.svg"/><strong>Choose {role}</strong><small>No parent selected</small></button>}</div>
 <div className={s.nameplate}><h2>{parent?.displayName??`Choose ${role}`}</h2><p>{role==="giver"?"Giver":"Receiver"}{parent?.level!==undefined?` · Level ${parent.level}`:""}</p><small>{parent?status:"No parent selected"}</small>{parent&&<div className={s["parent-actions"]}><button disabled={disabled} onClick={onChoose} aria-label={`Choose ${role}`}>Change</button><button className={s.inspect} disabled={disabled} onClick={onInspect} aria-label={`Inspect ${parent.displayName}`}><Icon name="inspect.svg"/>Inspect</button></div>}</div></article>;
}
export function BreedingDeskA({giver,receiver,preview,disabled,status,onChoose,onInspect,onBack,onNursery,onOptions,onDetails,onReview}:{giver:BreedingParticipant|null;receiver:BreedingParticipant|null;preview:BreedingPreview|null;disabled:boolean;status:string;onChoose:(role:"giver"|"receiver")=>void;onInspect:(parent:BreedingParticipant)=>void;onBack:()=>void;onNursery:()=>void;onOptions:()=>void;onDetails:()=>void;onReview:()=>void}) {
 const [view,setView]=useState("pair"),[more,setMore]=useState(false);const nav=useNavigation();
 const complete=Boolean(giver&&receiver&&preview);
 const values=[{icon:"heart.webp",value:complete?`${preview!.pregnancyChance}%`:"—",label:"Pregnancy chance"},{icon:"energy.webp",value:complete?preview!.energyCost:"—",label:"Energy each"},{icon:"heart.webp",value:complete?preview!.heartCost:"—",label:"Hearts each"}];
 const review=<button className={s.primary} disabled={!complete||!preview?.canAttempt||disabled} onClick={onReview}>{disabled?"Processing…":"Review attempt"}</button>;
 const ledger=()=>{setMore(false);window.dispatchEvent(new Event("creature-chronicles:open-breeding-ledger"));};
 return <div className={s.desk} data-breeding-desk="a" data-view={view}><header className={s.header}><button className={s.back} onClick={onBack} disabled={disabled}><Icon name="back.svg"/>Back</button><h1>Breeding Pen</h1><nav aria-label="Screen navigation"><button className={s.navLink} onClick={ledger}>Breeding Ledger</button><button className={s.navLink} onClick={onNursery}>Nursery</button><button className={s.moreToggle} aria-expanded={more} onClick={()=>setMore(!more)}>More</button><button className={s.menu} onClick={()=>nav.open("menu")} aria-label="Menu"><Icon name="menu.svg"/>Menu</button>{more&&<div className={s.more}><button onClick={ledger}>Breeding Ledger</button><button onClick={onNursery}>Nursery</button></div>}</nav></header>
 <nav className={s["focus-tabs"]} aria-label="Pen view">{["pair","readiness"].map(v=><button key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v==="pair"?"Pair":"Readiness"}</button>)}</nav>
 <section className={s.workspace} data-scenic aria-label="Breeding pairing desk"><div className={s.pairs} aria-label="Selected parents">{(["giver","receiver"] as const).map(role=>{const parent=role==="giver"?giver:receiver;return <Parent key={role} role={role} parent={parent} disabled={disabled} onChoose={()=>onChoose(role)} onInspect={()=>parent&&onInspect(parent)}/>;})}</div>
 <section className={`${s.readiness} ${s.panel}`} aria-label="Pair readiness"><h2>Pair readiness</h2><p className={s["pair-names"]}>{giver?.displayName??"Choose giver"} / {receiver?.displayName??"Choose receiver"}</p><dl className={s.costs}>{values.map(v=><div key={v.label}><Icon name={v.icon}/><dd>{v.value}</dd><dt>{v.label}</dt></div>)}</dl><p className={s.guidance}>{status}</p><button onClick={onDetails}>Chance details</button>{review}</section></section>
 <section className={s["mobile-summary"]} aria-label="Pair summary"><div className={s["summary-costs"]}>{values.map(v=><span key={v.label}><Icon name={v.icon}/><b>{v.value}</b><small>{v.label}</small></span>)}</div><p className={s["summary-guidance"]}>{status}</p>{review}</section>
 <aside className={s.footer} aria-label="Breeding preview details"><button onClick={onOptions}><Icon name="options.svg"/>Pair Options</button></aside></div>;
}
