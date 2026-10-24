import type {ReactNode} from 'react';
import t from './BreedingInspectCompact.module.css';
const BASE='/images/ui/inspect-dossier-a';
export function DossierIcon({name}:{name:string}){return <img className={t.symbol} src={`${BASE}/icons/${name}.svg`} alt="" aria-hidden="true"/>}
export function StatArt({name}:{name:string}){return <img className={t.statArt} src={`/images/ui/stats-growth-b/${name.toLowerCase()}.webp`} alt="" aria-hidden="true"/>}
export function DossierMeter({label,value,max,tone='green'}:{label:string;value:number;max:number;tone?:'green'|'pink'|'gold'}){return <progress className={t.meter} data-tone={tone} aria-label={label} max={Math.max(1,max)} value={Math.min(Math.max(0,value),Math.max(1,max))}/>}
export function VitalPlaque({label,value,icon,children}:{label:string;value:ReactNode;icon:ReactNode;children?:ReactNode}){return <div className={t.vital}><dt>{icon}<span>{label}</span></dt><dd>{value}</dd>{children}</div>}
const WORK_ART:Record<string,number>={harvesting:0,hauling:1,production:2,hunting:3,crafting:4,cooking:5,cleaning:7};
export function WorkArt({id}:{id:string}){const index=WORK_ART[id];return index===undefined?<DossierIcon name={id==='security'?'shield':'heart'}/>:<span className={t.workArt} aria-hidden="true" style={{backgroundPosition:`${index%4*100/3}% ${Math.floor(index/4)*100}%`}}/>}
const PAINTED_TALENTS=new Set(['lasting_vigor','hot_blooded','diligent','eager_learner','sure_strike','thick_hide','efficient_worker','sound_sleeper','light_footed','guard_dog']);
export function TalentArt({id}:{id:string}){return PAINTED_TALENTS.has(id)?<img className={t.talentArt} src={`/images/ui/talents-c/icons/${id}.webp`} alt="" aria-hidden="true"/>:<DossierIcon name="talents"/>}
export function roleSymbol(category:string,label:string){return /security|tank/i.test(label)?'shield':/caregiver/i.test(label)?'heart':/host/i.test(label)?'mug':/material/i.test(label)?'leaf':category==='combat'?'talents':category==='development'?'level':'pickaxe'}
