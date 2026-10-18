"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { GameDialog } from '@/features/ui/GameDialog';
import { familyChildren } from '@/data/familyArchive';
import { familyNeighborhood, layoutFamilyTree } from '@/data/familyTree';
import type { FamilyRecord } from '@/types/family';
import { FamilyArt, FamilyRecordWindow } from './FamilyRecordWindow';
import s from './FamilyTreeWindow.module.css';

type Camera = { x: number; y: number; scale: number };
const clamp = (scale: number) => Math.max(.001, Math.min(2, scale));
export function FamilyTreeWindow({ records, focalId, owned, onClose }: { records: Record<string, FamilyRecord>; focalId: string; owned: ReadonlySet<string>; onClose: () => void }) {
  const [expanded, setExpanded] = useState(() => new Set([focalId]));
  const [anchor, setAnchor] = useState(focalId), [selected, setSelected] = useState(focalId), [detail, setDetail] = useState(false);
  const [query, setQuery] = useState(''), [searchPage, setSearchPage] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  const cameraRef = useRef(camera), viewport = useRef<HTMLDivElement>(null), pendingCenter = useRef<string | null>(focalId);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const children = useMemo(() => familyChildren(records), [records]);
  const visible = useMemo(() => new Set([...familyNeighborhood(records, focalId, expanded), ...familyNeighborhood(records, anchor, expanded)]), [records, focalId, anchor, expanded]);
  const graph = useMemo(() => layoutFamilyTree(records, visible), [records, visible]);
  const changeCamera = (next: Camera) => { cameraRef.current = next; setCamera(next); };
  function zoomTo(scale: number, point = { x: size.width / 2, y: size.height / 2 }) {
    const old = cameraRef.current, next = clamp(scale), ratio = next / old.scale;
    changeCamera({ x: point.x - (point.x - old.x) * ratio, y: point.y - (point.y - old.y) * ratio, scale: next });
  }
  function center(id: string) {
    const node = graph.nodes.find(n => n.id === id);
    if (!node) { pendingCenter.current = id; setAnchor(id); return; }
    const scale = Math.max(.65, cameraRef.current.scale);
    changeCamera({ x: size.width / 2 - (node.x + 90) * scale, y: size.height / 2 - (node.y + 44) * scale, scale });
  }
  useEffect(() => {
    const node = viewport.current; if (!node) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height })); observer.observe(node);
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); const rect = node.getBoundingClientRect(), old = cameraRef.current, next = clamp(old.scale * Math.exp(-e.deltaY * .002)), ratio = next / old.scale;
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      cameraRef.current = { x: x - (x - old.x) * ratio, y: y - (y - old.y) * ratio, scale: next }; setCamera(cameraRef.current);
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); node.removeEventListener('wheel', wheel); };
  }, []);
  useEffect(() => {
    if (!size.width || !pendingCenter.current) return;
    const node = graph.nodes.find(n => n.id === pendingCenter.current); if (!node) return;
    const scale = size.width <= 600 ? .8 : 1;
    cameraRef.current = { x: size.width / 2 - (node.x + 90) * scale, y: size.height / 2 - (node.y + 44) * scale, scale };
    setCamera(cameraRef.current); pendingCenter.current = null;
  }, [size, graph]);
  const matches = useMemo(() => query.trim() ? Object.values(records).filter(r => r.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b) => a.name.localeCompare(b.name)) : [], [query, records]);
  const searchCapacity = size.width <= 600 || size.height <= 300 ? 2 : 5;
  const page = Math.min(searchPage, Math.max(0, Math.ceil(matches.length / searchCapacity) - 1));
  const nodes = camera.scale < .18 ? [] : graph.nodes.filter(n => (n.x + n.width) * camera.scale + camera.x >= -200 && n.x * camera.scale + camera.x <= size.width + 200 && (n.y + n.height) * camera.scale + camera.y >= -100 && n.y * camera.scale + camera.y <= size.height + 100);
  return <GameDialog fullScreen title={`${records[focalId].name} · Family tree`} onClose={onClose}><main className={s.window} data-family-tree>
    <header><FamilyArt/><h2>{records[focalId].name} · Family tree</h2><button onClick={onClose}>Back to Lineage</button></header>
    <div className={s.toolbar}><label><span className={s.sr}>Find a relative</span><input type="search" aria-label="Find a relative" placeholder="Find a relative…" value={query} onChange={e => { setQuery(e.target.value); setSearchPage(0); }}/></label><div className={s.zoom}><button aria-label="Zoom out" onClick={() => zoomTo(camera.scale / 1.2)}>−</button><span aria-live="polite">{camera.scale < .1 ? (camera.scale * 100).toFixed(1) : Math.round(camera.scale * 100)}%</span><button aria-label="Zoom in" onClick={() => zoomTo(camera.scale * 1.2)}>+</button></div><button onClick={() => { const scale = clamp(Math.min((size.width - 32) / graph.width, (size.height - 32) / graph.height, 1)); changeCamera({ x: (size.width - graph.width * scale) / 2, y: (size.height - graph.height * scale) / 2, scale }); }}>Fit tree</button><button onClick={() => { setSelected(focalId); center(focalId); }}>Center on {records[focalId].name}</button><button onClick={() => { pendingCenter.current = selected; setExpanded(old => new Set([...old, ...visible])); }}>Expand branches</button><button onClick={() => { pendingCenter.current = focalId; setSelected(focalId); setAnchor(focalId); setExpanded(new Set([focalId])); }}>Collapse branches</button></div>
    {query.trim() ? <div className={s.searchResults} aria-label="Relative search results">{matches.slice(page * searchCapacity, page * searchCapacity + 5).map(r => <button key={r.id} onClick={() => { setSelected(r.id); center(r.id); setQuery(''); }}>{r.name} · {r.kind === 'player' ? 'Player' : r.generation ? `Generation ${r.generation}` : 'Record'}</button>)}{!matches.length ? <span>No matching family records.</span> : null}{matches.length > searchCapacity ? <nav><button disabled={!page} onClick={() => setSearchPage(page - 1)}>Previous results</button><span>{page + 1} / {Math.ceil(matches.length / searchCapacity)}</span><button disabled={(page + 1) * searchCapacity >= matches.length} onClick={() => setSearchPage(page + 1)}>Next results</button></nav> : null}</div> : null}
    <div ref={viewport} className={s.viewport} role="region" aria-label="Family tree canvas" tabIndex={0} data-family-canvas
      onKeyDown={e => { if (e.target !== e.currentTarget) return; const delta = { ArrowLeft: [70,0], ArrowRight: [-70,0], ArrowUp: [0,70], ArrowDown: [0,-70] }[e.key]; if (delta) { e.preventDefault(); changeCamera({ ...cameraRef.current, x: cameraRef.current.x + delta[0], y: cameraRef.current.y + delta[1] }); } }}
      onPointerDown={e => { if ((e.target as HTMLElement).closest('button')) return; e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); }}
      onPointerMove={e => {
        const oldPoint = pointers.current.get(e.pointerId); if (!oldPoint) return;
        const before = [...pointers.current.values()]; pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); const after = [...pointers.current.values()], old = cameraRef.current;
        if (after.length === 2) {
          const distance = (points: { x: number; y: number }[]) => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
          const rect = e.currentTarget.getBoundingClientRect(), mid = (points: { x: number; y: number }[]) => ({ x: (points[0].x + points[1].x) / 2 - rect.left, y: (points[0].y + points[1].y) / 2 - rect.top });
          const a = mid(before), b = mid(after), scale = clamp(old.scale * distance(after) / Math.max(1, distance(before))), ratio = scale / old.scale;
          changeCamera({ x: b.x - (a.x - old.x) * ratio, y: b.y - (a.y - old.y) * ratio, scale });
        } else if (after.length === 1) changeCamera({ ...old, x: old.x + e.clientX - oldPoint.x, y: old.y + e.clientY - oldPoint.y });
      }} onPointerUp={e => pointers.current.delete(e.pointerId)} onPointerCancel={e => pointers.current.delete(e.pointerId)} onLostPointerCapture={e => pointers.current.delete(e.pointerId)}>
      <div className={s.world} data-family-world style={{ width: graph.width, height: graph.height, transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})` }}><svg width={graph.width} height={graph.height} aria-hidden="true">{graph.paths.map(p => <g key={p.id}><path d={p.path} fill="none" stroke="#031925" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"/><path d={p.path} fill="none" stroke={p.parents.includes(selected) || p.children.includes(selected) ? '#ffe4a7' : '#b89960'} strokeWidth={p.parents.includes(selected) || p.children.includes(selected) ? 2.5 : 1.7} strokeLinejoin="round" strokeLinecap="round"/></g>)}{camera.scale < .18 ? graph.nodes.map(n => <rect key={n.id} x={n.x} y={n.y} width={n.width} height={n.height} rx="9" fill={n.id === selected ? '#167c67' : '#143645'} stroke="#d7b56d" strokeWidth="2"/>) : null}</svg>
        {nodes.map(n => { const r = records[n.id], hidden = [...r.parents, ...(children.get(r.id) ?? [])].some(id => !visible.has(id)); return <div key={n.id} className={s.node} data-family-node={r.id} data-selected={selected === r.id} style={{ left: n.x, top: n.y, width: n.width, height: n.height }}><button className={s.choose} aria-label={`Select relative ${r.name}`} aria-pressed={selected === r.id} onClick={() => setSelected(r.id)}><FamilyArt name={r.kind === 'player' ? 'identity' : 'creatures'}/><span><strong>{r.name}</strong><small>{r.generation ? `Generation ${r.generation}` : r.kind === 'player' ? 'Player contributor' : 'Generation not recorded'}</small><small>{r.id === focalId ? 'This creature' : owned.has(r.id) ? 'At the ranch' : 'Record only'}</small></span></button>{r.id !== focalId && (hidden || expanded.has(r.id)) ? <button className={s.expand} aria-label={`${expanded.has(r.id) ? 'Collapse' : 'Expand'} family of ${r.name}`} onClick={() => { pendingCenter.current = r.id; setExpanded(old => { const next = new Set(old); if (next.has(r.id)) next.delete(r.id); else next.add(r.id); return next; }); }}>{expanded.has(r.id) ? '−' : '+'}</button> : null}</div>; })}
      </div><span className={s.hint}>{camera.scale < .18 ? 'Zoom in for names · Center restores a readable view' : 'Drag to explore · Scroll or pinch to zoom · Arrow keys to move'}</span>
    </div>
    <footer><FamilyArt name="creatures"/><div><strong>{records[selected].name}</strong><span>{selected === focalId ? 'This creature' : owned.has(selected) ? 'At the ranch' : 'Record only'} · {records[selected].generation ? `Generation ${records[selected].generation}` : 'Generation not recorded'}</span></div><button onClick={() => setDetail(true)}>View record</button><small>{graph.omittedCycles ? 'Inconsistent circular links omitted from this view.' : 'Only recorded family links are shown.'}</small></footer>
    {detail ? <FamilyRecordWindow key={selected} record={records[selected]} atRanch={owned.has(selected)} onClose={() => setDetail(false)}/> : null}
  </main></GameDialog>;
}
