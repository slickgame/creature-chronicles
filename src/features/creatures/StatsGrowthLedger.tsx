"use client";

import { useEffect, useRef, useState } from "react";
import { STAT_KEYS } from "@/data/creatures";
import type { CreatureRecord } from "@/types/creature";
import type { Entry } from "./CompactProfileTabs";
import { GrowthDetailWindow } from "./GrowthDetailWindow";
import { growthLedgerPreview, rangeText } from "./growthLedgerPreview";
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
  const [detail, setDetail] = useState(false);
  const preview = growthLedgerPreview(creature);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      setCapacity(view === 'forecast'
        ? width > 600 ? height >= 450 ? 6 : height >= 380 ? 3 : height >= 330 ? 2 : 1 : height >= 390 ? 3 : height >= 285 ? 2 : 1
        : width >= 600 ? height >= 450 ? 6 : height >= 330 ? 3 : height >= 260 ? 2 : 1 : height >= 285 ? 3 : height >= 220 ? 2 : 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [view]);

  const entries = attributes;
  const pages = Math.max(1, Math.ceil(entries.length / capacity));
  const selectedIndex = Math.min(selection, entries.length - 1);
  const page = Math.min(Math.floor(selectedIndex / capacity), pages - 1);
  const selected = entries[selectedIndex];
  const visible = entries.slice(page * capacity, (page + 1) * capacity);
  const icon = (index: number) => `${BASE}${ICONS[index]}.webp`;
  function changeView(next: typeof view) { setView(next); }

  return <section ref={root} className={s.shell} data-stats-growth-ledger data-view={view} data-capacity={capacity} aria-label="Stats & Growth">
    <header className={s.header}><h3>Stats & Growth</h3><div className={s.switcher} aria-label="Growth view">
      <button aria-pressed={view === "attributes"} onClick={() => changeView("attributes")}>Attributes</button>
      <button aria-pressed={view === "forecast"} onClick={() => changeView("forecast")}>Next level</button>
    </div></header>
    {view === "forecast" ? <div className={s.previewHeader} aria-label="Next level summary"><strong>Level {creature.level} → {creature.level + 1} preview</strong><span>Read-only forecast</span><div><img src="/images/ui/creature-overview-a-v2/sculpted/experience.webp" alt=""/><span>{creature.xp} / {creature.xpToNext} XP</span><progress aria-label="Level experience" value={creature.xp} max={Math.max(1, creature.xpToNext)}/><span>{Math.round(creature.xp / Math.max(1, creature.xpToNext) * 100)}%</span></div><div><img src="/images/ui/creature-overview-a-v2/sculpted/energy.webp" alt=""/><span>Max Energy</span><strong>{preview.currentEnergy} → {rangeText(preview.energyMin, preview.energyMax)}{!preview.uncertain && preview.energyMin > preview.currentEnergy ? ` (+${preview.energyMin - preview.currentEnergy})` : ""}</strong></div></div> : null}
    <div className={s.columns} aria-hidden="true"><span>Attribute</span><span>{view === "attributes" ? "Value" : "Current"}</span><span>{view === "attributes" ? "Innate grade" : "Next"}</span>{view === "attributes" ? <span>Growth</span> : null}</div>
    <div className={s.rows} style={{ gridTemplateRows: `repeat(${Math.min(capacity, visible.length)}, minmax(0, 1fr))` }} aria-label={view === "attributes" ? "Creature attributes" : "Next level forecast"}>
      {visible.map((entry, n) => {
        const index = page * capacity + n;
        const key = STAT_KEYS[index];
        return <button key={entry.id} className={s.row} aria-pressed={selectedIndex === index} onClick={() => setSelection(index)} aria-label={`${entry.title}. ${view === "attributes" ? entry.summary : `${creature.stats[key]} to ${rangeText(preview.stats[key], preview.stats[key] + (preview.uncertain ? 1 : 0))}`}. Select growth details`}>
          <span className={s.name}><img src={icon(index)} alt=""/><strong>{entry.title}</strong></span>
          {view === "attributes" ? <><span className={s.value}>{creature.stats[key]}</span><span className={s.grade}>Grade {creature.statGrades[key]}</span></> : <><span className={s.value}>{creature.stats[key]}</span><span className={s.nextValue} data-increase={preview.projections[key].statGainNextLevel > 0}>{rangeText(preview.stats[key], preview.stats[key] + (preview.uncertain ? 1 : 0))}{preview.projections[key].statGainNextLevel > 0 ? ` (+${preview.projections[key].statGainNextLevel})` : ""}</span></>}
          {view === "attributes" ? <span className={s.growth}>{entry.meter ? <><Meter entry={entry}/><small>{entry.meter.value}%</small></> : null}</span> : null}
        </button>;
      })}
    </div>
    {pages > 1 ? <nav className={s.pager} aria-label="Attribute pages"><button aria-label="Previous attribute page" disabled={!page} onClick={() => { setSelection((page - 1) * capacity); }}>‹</button><span aria-live="polite">{page + 1} / {pages}</span><button aria-label="Next attribute page" disabled={page + 1 >= pages} onClick={() => { setSelection((page + 1) * capacity); }}>›</button></nav> : null}
    {selected ? <div className={s.detail} aria-label="Selected growth details"><img src={icon(selectedIndex)} alt=""/><div><strong>{selected.title}</strong><span>{selected.meter ? view === "attributes" ? `Growth toward next point: ${preview.projections[STAT_KEYS[selectedIndex]].currentProgressPercent}%` : `Growth ${preview.projections[STAT_KEYS[selectedIndex]].currentProgressPercent}% → ${rangeText(preview.uncertain ? 0 : preview.projections[STAT_KEYS[selectedIndex]].projectedProgressPercent, preview.projections[STAT_KEYS[selectedIndex]].projectedProgressPercent)}%` : selected.summary}</span>{selected.meter && view === "attributes" ? <Meter entry={selected}/> : null}</div><button onClick={() => setDetail(true)}>View <span className={s.fullWord}>full </span>growth details ›</button></div> : null}
    {view === "forecast" ? <div className={s.previewFooter}><span>{preview.uncertain ? "Guaranteed point assigned at level-up; values show ranges." : "Read-only base-growth forecast"}</span><button onClick={() => changeView("attributes")}>‹ Back to attributes</button></div> : <p className={s.note}>Creature attributes · Equipment affects battle stats separately</p>}
    {detail ? <GrowthDetailWindow creature={creature} statKey={STAT_KEYS[selectedIndex]} label={selected.title} icon={icon(selectedIndex)} preview={preview} strongest={forecast.find(entry => entry.id === "best")?.details[0] ?? "Balanced attributes."} onClose={() => setDetail(false)}/> : null}
  </section>;
}

function Meter({ entry }: { entry: Entry }) {
  const meter = entry.meter!;
  return <progress aria-label={meter.label} max={Math.max(1, meter.max)} value={Math.max(0, Math.min(meter.max, meter.value))}/>;
}
