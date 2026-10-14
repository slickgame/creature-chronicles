"use client";
import {useState,type ReactNode} from 'react';
import {GameDialog} from '@/features/ui/GameDialog';
import styles from './RanchReview.module.css';
/** One focused sheet at a time; every section remains reachable without scrolling. */
export function RanchReview({title,pages,onClose,art,actions}:{title:string;pages:{title:string;content:ReactNode}[];onClose:()=>void;art?:string;actions?:ReactNode}){
 const [page,setPage]=useState(0),[compact,setCompact]=useState(false);
 const index=Math.min(page,pages.length-1),sheet=pages[index];
 return <GameDialog fullScreen title={title} onClose={onClose}><main className={`${styles.review} ${compact?styles.compact:''}`} style={art?{backgroundImage:`url(${art})`}:undefined} data-ranch-review>
 <header><button onClick={onClose}>‹ Back</button><h1>{title}</h1>{art&&<button onClick={()=>setCompact(!compact)}>{compact?'Expand illustration':'Minimize illustration'}</button>}</header>
 <section className={styles.sheet}><h2>{sheet.title}</h2><div className={styles.body}>{sheet.content}</div>{actions&&<div className={styles.actions}>{actions}</div>}{pages.length>1&&<footer><button disabled={index===0} onClick={()=>setPage(index-1)}>‹ Previous</button><span>{index+1} / {pages.length}</span><button disabled={index===pages.length-1} onClick={()=>setPage(index+1)}>Next ›</button></footer>}</section>
 </main></GameDialog>;
}
