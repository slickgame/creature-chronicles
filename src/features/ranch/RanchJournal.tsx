"use client";
import {useState} from 'react';
import {getChapterOneStoryLog} from '@/data/chapterOneStory';
import {getStarterGoals} from '@/data/starterGoals';
import {useGameContext} from '@/state/GameProvider';
import {RanchReview} from './RanchReview';
export function RanchJournal({onClose,storyOnly=false}:{onClose:()=>void;storyOnly?:boolean}){
 const {currentSave:save}=useGameContext();const [index,setIndex]=useState(0);
 if(!save)return null;
 const goals=storyOnly?[]:getStarterGoals(save),stories=getChapterOneStoryLog(save);
 const records=[...goals.map(g=>({id:g.id,title:g.label,pages:[{title:g.label,content:<><p>{g.complete?'✓ Complete':'In progress'} · {g.rewardClaimed?'Reward claimed':g.rewardLabel}</p><p>{g.description}</p><p>{g.hint}</p></>}]})),...stories.map(e=>({id:e.id,title:e.title,pages:e.seen?e.pages.map(p=>({title:p.speaker,content:<p>{p.text}</p>})):[{title:'Locked record',content:<p>{e.lockedReason??'Continue Chapter 1 to unlock this scene.'}</p>}]}))];
 const current=Math.min(index,records.length-1),record=records[current];
 if(!record)return null;
 const picker=<label>Choose record<select aria-label="Journal record" value={current} onChange={e=>setIndex(Number(e.target.value))}>{records.map((r,i)=><option key={r.id} value={i}>{r.title}</option>)}</select></label>;
 return <RanchReview key={record.id} title="Ranch Journal" onClose={onClose} pages={record.pages.map(p=>({title:record.title,content:<>{picker}<strong>{p.title}</strong>{p.content}</>}))} actions={<><button disabled={current===0} onClick={()=>setIndex(current-1)}>‹ Previous record</button><button disabled={current===records.length-1} onClick={()=>setIndex(current+1)}>Next record ›</button></>}/>;
}
