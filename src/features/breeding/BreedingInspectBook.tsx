"use client";
import {useState} from 'react';
import {STAT_KEYS,getSpeciesDefinition,getVariantDefinition} from '@/data/creatures';
import {getCreatureGrowthProjections,getProjectedEnergyGainNextLevel,getLevelGrowthAcceleration} from '@/data/levelGrowth';
import {getCreatureChoreSkillGroup,MAX_CHORE_SKILL_LEVEL,getChoreSkillAptitudeLabel} from '@/data/choreSkills';
import {getCreatureRoleTags} from '@/data/talents/creatureRoleTags';
import type {BreedingParticipant} from '@/types/breeding';
import type {CreatureRecord} from '@/types/creature';
import type {NurseryPage} from '@/features/nursery/NurseryBook';
import {BreedingPreviewBook,BREEDING_BOOK_ART} from './BreedingPreviewBook';
import {SHARED_STAT_LABELS} from '@/features/creatures/CreatureDetailPanels';

// Long saved notes remain complete, split into readable pages rather than clipped.
function notes(key:string,title:string,lines:string[]):NurseryPage[]{
 const parts=lines.flatMap(line=>{const result:string[]=[];let text='';for(const word of line.split(/\s+/)){if(text.length+word.length>260&&text){result.push(text);text='';}text+=`${text?' ':''}${word}`;}if(text)result.push(text);return result;});
 return parts.map((text,i)=>({key:`${key}-${i}`,title:parts.length>1?`${title} · ${i+1}/${parts.length}`:title,content:<p>{text}</p>}));
}
export function BreedingInspectBook({participant:p,creature:c,dayNumber,onClose,title="Inspect Parent"}:{participant:BreedingParticipant;creature:CreatureRecord|null;dayNumber:number;onClose:()=>void;title?:string}){
 const [tab,setTab]=useState('Overview');
 const tabs=c?['Overview','Stats','Work','Talents','Lineage']:['Overview','Stats'];
 let pages:NurseryPage[]=notes('description','Participant notes',[p.description||'No additional participant notes.']);
 if(tab==='Overview')pages=[
  {key:'vitals',title:p.displayName,content:<><h3>{p.familyLabel}</h3><p>Energy {p.energy}/{p.maxEnergy} · Hearts {p.hearts}/{p.maxHearts}</p><p>Affection {p.affection}/100 · Level {p.level??'—'}</p><p>XP {p.xp??0}/{p.xpToNext??'—'}</p></>},
  ...notes('status','Availability',[p.unavailableReason??'Review the complete pair for attempt readiness.',p.isPregnant?`Pregnant · ${p.pregnancyDaysRemaining??'?'} days remaining.`:'Not pregnant.',...(c?[c.injuredUntilDayNumber&&c.injuredUntilDayNumber>dayNumber?c.injuryLabel??'Injured':'No active injury.',c.isLocked?'Protected from removal.':'Not protected from removal.']:[])]),
  ...notes('description','Participant notes',[p.description||'No additional participant notes.']),
  ...(c?notes('identity','Identity',[`${getVariantDefinition(c.variantId).rarity} · ${getVariantDefinition(c.variantId).name} ${getSpeciesDefinition(c.speciesId).name}. Generation ${c.generation}. ${c.originLabel}. Origin: ${c.origin}.`,c.shiny?'Rare shiny coloration is active and tracked in lineage.':'Standard coloration.']):[]),
  ...(c?getCreatureRoleTags(c).flatMap((tag,i)=>notes(`role-${i}`,tag.label,tag.reasons)):[])
 ];
 if(tab==='Stats'){
  const growth=c?getCreatureGrowthProjections(c):null,energy=c?getProjectedEnergyGainNextLevel(c):null;
  pages=STAT_KEYS.map(k=>({key:k,title:SHARED_STAT_LABELS[k],content:<><h3>{p.stats?.[k]??'Not recorded'} · Grade {p.statGrades?.[k]??'not recorded'}</h3><p>Current base stat and innate grade. Equipment modifies battle stats separately.</p>{growth&&<><p>Growth toward next point: {growth[k].currentProgressPercent}%. Next-level contribution: {growth[k].nextLevelGainPercent}%.</p><p>{growth[k].willIncreaseNextLevel?`Next level: +${growth[k].statGainNextLevel}.`:`Estimated ${growth[k].levelsUntilIncrease} levels until the next increase.`}</p></>}</>}));
  if(c&&energy)pages.push({key:'forecast',title:'Growth forecast',content:<><p>Level {c.level} · XP {c.xp}/{c.xpToNext}</p><p>Next-level maximum Energy: {energy.currentMaxEnergy} → {energy.nextLevelMaxEnergy} ({energy.delta>=0?'+':''}{energy.delta}).</p><p>Young-growth multiplier ×{getLevelGrowthAcceleration(c.level).toFixed(2)}. Growth is fastest at low levels and gradually plateaus.</p></>});
 }
 if(tab==='Work'&&c)pages=[...notes('work-rules','Instant work rules',['Harvesting, production and hauling improve through completed instant work. Every five levels above level 1 adds one resource per action.','Domestic skills, Security and Ranch Care are reserved for future systems. Fortifications and the strongest resident Guard Dog bonus provide farm security. Work costs creature Energy, with no Gold operating charge.']),...(['ranch','domestic']as const).flatMap(group=>getCreatureChoreSkillGroup(c,group).flatMap(({definition,progress,naturalBaselineLevel})=>notes(definition.skillId,definition.label,[`${group==='ranch'?'Farm':'Domestic'} skill · Level ${progress.level}/${MAX_CHORE_SKILL_LEVEL} · ${getChoreSkillAptitudeLabel(progress.level)}. XP ${progress.xp}/${progress.xpToNext||'Mastered'}. Natural baseline level ${naturalBaselineLevel}.`,definition.description])))];
 if(tab==='Talents'&&c)pages=c.abilities.length?c.abilities.flatMap((t,i)=>notes(`talent-${i}`,t.name,[`Grade ${t.grade} · ${t.source}${t.category?` · ${t.category}`:''}`,t.description,...(t.tags?.length?[`Tags: ${t.tags.join(', ')}`]:[])])):[{key:'empty',title:'No talents recorded',content:<p>No talent inherited. Hatch talents usually come from parents; new talent mutations remain rare.</p>}];
 if(tab==='Lineage'&&c)pages=[...notes('assessment','Lineage assessment',[c.lineage?.label??'No Risk',...(c.lineage?.notes?.length?c.lineage.notes:['No close lineage risk detected, or this creature predates lineage tracking.'])]),...notes('parents','Recorded parents',c.lineage?.parentNames?.length?c.lineage.parentNames.map((name,i)=>`Parent ${i+1}: ${name}`):['Parents not tracked.']),...notes('traits','Inherited markers',c.lineage?.traits?.length?c.lineage.traits:['No trait markers recorded.']),...notes('ranch-notes','Ranch notes',[c.notes||'No additional ranch notes.'])];
 return <BreedingPreviewBook title={title} marker="parent-inspect" onClose={onClose} art={p.kind==='creature'?p.profilePath||p.portraitPath:BREEDING_BOOK_ART} pages={pages} controls={<label>Profile section<select aria-label="Profile section" value={tab} onChange={e=>setTab(e.target.value)}>{tabs.map(t=><option key={t}>{t}</option>)}</select></label>}/>;
}
