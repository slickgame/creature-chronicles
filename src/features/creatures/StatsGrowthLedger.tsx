"use client";

import { useEffect, useRef, useState } from "react";
import { STAT_KEYS } from "@/data/creatures";
import type { CreatureRecord } from "@/types/creature";
import { RecordDialog, type Entry } from "./CompactProfileTabs";
import s from "./StatsGrowthLedger.module.css";

const BASE = "/images/ui/stats-growth-b/";
const ICONS = ["strength", "dexterity", "stamina", "charm", "willpower", "fertility"];

export function StatsGrowthLedger({ creature, attributes, forecast }: {
  creature: CreatureRecord;
  attributes: Entry[];
  forecast: Entry[];
}) {
  const root = useRef<HTMLElement>(null);
  const [view, setView] = useState<"attributes" | "forecast">("attributes");
  const [selection, setSelection] = useState(0);
  const [capacity, setCapacity] = useState(3);
  const [detail, setDetail] = useState<Entry | null>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      setCapacity(width >= 600 ? height >= 450 ? 6 : height >= 330 ? 3 : height >= 260 ? 2 : 1 : height >= 285 ? 3 : height >= 220 ? 2 : 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const entries = view === "attributes" ? attributes : forecast;
  const pages = Math.max(1, Math.ceil(entries.length / capacity));
  const selectedIndex = Math.min(selection, entries.length - 1);
  const page = Math.min(Math.floor(selectedIndex / capacity), pages - 1);
  const selected = entries[selectedIndex];
  const visible = entries.slice(page * capacity, (page + 1) * capacity);
  const icon = (index: number) => view === "attributes"
    ? `${BASE}${ICONS[index]}.webp`
    : `/images/ui/creature-overview-a-v2/${index === 0 ? "sculpted/experience" : index === 2 ? "sculpted/energy" : index === 3 ? "painted-r4/roles" : "painted-r4/growth"}.webp`;

  function changeView(next: typeof view) {
    setView(next);
    setSelection(0);
  }

  return <section ref={root} className={s.shell} data-stats-growth-ledger data-view={view} data-capacity={capacity} aria-label="Stats & Growth">
    <header className={s.header}><h3>Stats & Growth</h3><div className={s.switcher} aria-label="Growth view">
      <button aria-pressed={view === "attributes"} onClick={() => changeView("attributes")}>Attributes</button>
      <button aria-pressed={view === "forecast"} onClick={() => changeView("forecast")}>Next level</button>
    </div></header>
    <div className={s.columns} aria-hidden="true"><span>{view === "attributes" ? "Attribute" : "Forecast"}</span><span>{view === "attributes" ? "Value" : "Summary"}</span>{view === "attributes" ? <span>Innate grade</span> : null}<span>Growth</span></div>
    <div className={s.rows} style={{ gridTemplateRows: `repeat(${Math.min(capacity, visible.length)}, minmax(0, 1fr))` }} aria-label={view === "attributes" ? "Creature attributes" : "Next level forecast"}>
      {visible.map((entry, n) => {
        const index = page * capacity + n;
        const key = STAT_KEYS[index];
        return <button key={entry.id} className={s.row} aria-pressed={selectedIndex === index} onClick={() => setSelection(index)} aria-label={`${entry.title}. ${entry.summary}. Select growth details`}>
          <span className={s.name}><img src={icon(index)} alt=""/><strong>{entry.title}</strong></span>
          {view === "attributes" ? <><span className={s.value}>{creature.stats[key]}</span><span className={s.grade}>Grade {creature.statGrades[key]}</span></> : <span className={s.forecastValue}>{entry.summary}</span>}
          <span className={s.growth}>{entry.meter ? <Meter entry={entry}/> : <span className={s.detailHint}>View details ›</span>}</span>
        </button>;
      })}
    </div>
    {pages > 1 ? <nav className={s.pager} aria-label="Attribute pages"><button aria-label="Previous attribute page" disabled={!page} onClick={() => { setSelection((page - 1) * capacity); }}>‹</button><span aria-live="polite">{page + 1} / {pages}</span><button aria-label="Next attribute page" disabled={page + 1 >= pages} onClick={() => { setSelection((page + 1) * capacity); }}>›</button></nav> : null}
    {selected ? <div className={s.detail} aria-label="Selected growth details"><img src={icon(selectedIndex)} alt=""/><div><strong>{selected.title}</strong><span>{selected.meter ? view === "attributes" ? "Growth toward next point" : selected.summary : selected.summary}</span>{selected.meter ? <Meter entry={selected}/> : null}</div><button onClick={() => setDetail(selected)}>View <span className={s.fullWord}>full </span>growth details ›</button></div> : null}
    <p className={s.note}>Creature attributes · Equipment affects battle stats separately</p>
    {detail ? <RecordDialog key={detail.id} entry={detail} onClose={() => setDetail(null)}/> : null}
  </section>;
}

function Meter({ entry }: { entry: Entry }) {
  const meter = entry.meter!;
  return <progress aria-label={meter.label} max={Math.max(1, meter.max)} value={Math.max(0, Math.min(meter.max, meter.value))}/>;
}
