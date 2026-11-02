"use client";

import { useEffect, useState } from 'react';
import type { BreedingAttemptRecord } from '@/types/breeding';
import { GameDialog } from '@/features/ui/GameDialog';
import { BREEDING_SCENE_FALLBACK_PATH, BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH, BREEDING_OUTCOME_FAILURE_FALLBACK_PATH } from '@/data/breedingSceneImages';
import s from './SavedScenesFolioA.module.css';

type Scene = 'process' | 'outcome';
const kit = '/images/ui/saved-scenes-folio-a/';

function Artwork({ src, fallback, label }: { src: string; fallback: string; label: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const path = !failed.includes(src) ? src : !failed.includes(fallback) ? fallback : null;
  return path ? <img src={path} alt={label} draggable={false} onError={() => setFailed(paths => [...paths, path])} /> : <p role="status">Scene artwork is unavailable.</p>;
}

export function SavedScenesFolioA({ result, initialScene, onClose, returnLabel = 'Back to result' }: { returnLabel?: string; result: BreedingAttemptRecord; initialScene: Scene; onClose: () => void }) {
  const [scene, setScene] = useState<Scene>(initialScene);
  const [notes, setNotes] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [short, setShort] = useState(false);
  useEffect(() => {
    const query = matchMedia('(max-height: 650px), (max-width: 700px)');
    const update = () => setShort(query.matches);
    const frame = requestAnimationFrame(update);
    query.addEventListener('change', update);
    return () => { cancelAnimationFrame(frame); query.removeEventListener('change', update); };
  }, []);
  const attempt = scene === 'process';
  const label = attempt ? 'Attempt scene' : 'Outcome scene';
  const src = attempt ? result.pairingImagePath : result.outcomeImagePath;
  const success = result.outcome === 'pregnancy' && !result.pregnancyBlockedReason;
  const fallback = attempt ? BREEDING_SCENE_FALLBACK_PATH : success ? BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH : BREEDING_OUTCOME_FAILURE_FALLBACK_PATH;
  const text = attempt ? result.processText : result.outcomeFlavorText;
  const art = <Artwork key={`${result.attemptId}-${scene}`} src={src} fallback={fallback} label={`${label} · ${result.giverName} and ${result.receiverName}`} />;
  const pager = <nav className={s.pager} aria-label="Scene navigation"><button disabled={attempt} onClick={() => setScene('process')}>‹ Previous</button><span aria-live="polite">{attempt ? 1 : 2} / 2</span><button disabled={!attempt} onClick={() => setScene('outcome')}>Next ›</button></nav>;
  const notesText = <><h2>{label} notes</h2><p>{text || 'No additional notes were saved for this scene.'}</p>{!attempt && result.pregnancyBlockedReason && <p>{result.pregnancyBlockedReason}</p>}</>;
  return <>
    <GameDialog title="Saved scenes" fullScreen onClose={onClose}>
      <main className={s.shell} data-saved-scenes-folio-a data-scene={scene}>
        <article className={s.folio}>
          <header className={s.header}><button onClick={onClose}>‹ {returnLabel}</button><h1><img src={`${kit}sprig.svg`} alt="" />Saved scenes<img src={`${kit}sprig.svg`} alt="" /></h1></header>
          <nav className={s.tabs} aria-label="Saved scene views">{(['process', 'outcome'] as const).map(value => <button key={value} aria-pressed={scene === value} onClick={() => setScene(value)}>{value === 'process' ? 'Attempt scene' : 'Outcome scene'}</button>)}</nav>
          <figure className={s.artwork}>{art}</figure>
          <p className={s.caption}>{result.giverName} × {result.receiverName} <span>· Day {result.dayNumber}</span></p>
          <button className={s.notesToggle} aria-expanded={notes} aria-controls={notes && short ? undefined : 'saved-scene-notes'} onClick={() => setNotes(value => !value)}><span aria-hidden="true">{notes ? '▾' : '▸'}</span>{notes ? 'Hide scene notes' : 'Show scene notes'}</button>
          {notes && !short && <section id="saved-scene-notes" className={s.notes}>{notesText}</section>}
          <footer className={s.footer}>{pager}<button className={s.expand} onClick={() => setExpanded(true)}><img src={`${kit}expand.svg`} alt="" />Full-screen artwork</button></footer>
        </article>
      </main>
    </GameDialog>
    {notes && short && <GameDialog title="Scene notes" fullScreen onClose={() => setNotes(false)}><main className={s.shell} data-scene-notes><article className={s.notesWindow}><button onClick={() => setNotes(false)}>‹ Back to scenes</button><section className={s.notes}>{notesText}</section></article></main></GameDialog>}
    {expanded && <GameDialog title="Full-screen artwork" fullScreen onClose={() => setExpanded(false)}><main className={s.lightbox} data-scene-fullscreen><header><button onClick={() => setExpanded(false)}>‹ Back to scenes</button><strong>{label}</strong>{pager}</header><figure>{art}</figure></main></GameDialog>}
  </>;
}
