"use client";
import { useState, type ReactNode } from 'react';
import { GameDialog } from '@/features/ui/GameDialog';
import s from './NurseryBook.module.css';
import scenicStyles from './NurseryScenic.module.css';
export type NurseryPage = { key: string; title: string; content: ReactNode };
export function NurseryPages({ pages, label = 'Care page', pageKey, onPageChange,scenic=false }: { pages: NurseryPage[]; label?: string; pageKey?:string;onPageChange?:(key:string)=>void;scenic?:boolean }) {
  const style=scenic?scenicStyles:s;
  const [key, setKey] = useState(pages[0]?.key ?? '');
  const index = Math.max(0, pages.findIndex(p => p.key === (pageKey ?? key)));
  const page = pages[index];
  const change=(next:string)=>{setKey(next);onPageChange?.(next);};
  return <div className={style.pages}>
    {page ? <><label>{label}<select aria-label={label} value={page.key} onChange={e => change(e.target.value)}>{pages.map(p => <option key={p.key} value={p.key}>{p.title}</option>)}</select></label>
    <article className={style.entry}><h2>{page.title}</h2>{page.content}</article>
    <footer className={style.pager}><button disabled={!index} onClick={() => change(pages[index - 1].key)}>‹ Previous</button><span>{index + 1} / {pages.length}</span><button disabled={index === pages.length - 1} onClick={() => change(pages[index + 1].key)}>Next ›</button></footer></> : <p>No records yet.</p>}
  </div>;
}
export function NurseryBook({ title, onClose, pages, art = '/images/ui/interiors-v1/atelier-egg.webp', artAlt = 'Nursery illustration', footer, pageKey, onPageChange,scenic=false }: { title: string; onClose: () => void; pages: NurseryPage[]; art?: string; artAlt?: string; footer?: ReactNode; pageKey?:string;onPageChange?:(key:string)=>void;scenic?:boolean }) {
  const [small, setSmall] = useState(false);
  const style=scenic?scenicStyles:s;
  return <GameDialog title={title} onClose={onClose} fullScreen><main className={`${style.shell} ${scenic?style.book:''} ${small ? style.compact : ''}`} data-nursery-book>
    <header className={style.header}><button onClick={onClose}>← Back</button><h1>{title}</h1><button aria-expanded={!small} onClick={() => setSmall(v => !v)}>{small ? 'Expand art' : 'Minimize art'}</button></header>
    <section className={style.workspace}><aside className={style.art}><img src={art} alt={artAlt}/></aside><div className={style.paper}><NurseryPages scenic={scenic} pages={pages} pageKey={pageKey} onPageChange={onPageChange}/>{footer && <div className={style.actions}>{footer}</div>}</div></section>
  </main></GameDialog>;
}
