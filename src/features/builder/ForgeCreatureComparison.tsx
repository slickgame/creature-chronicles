"use client";

import { useState } from "react";
import type { BattleOutfitterItem } from "@/data/battleOutfitter";
import { compareEquipment } from "@/data/equipmentComparison";
import type { CreatureRecord } from "@/types/creature";
import type { GameSave } from "@/types/save";
import { FORGE_SLATE, ForgeWindow } from "./ForgeWindow";
import s from "./ForgeGallery.module.css";

export function ForgeCreatureComparison({
  save, creature, item, slotLabel, short, onCreature, onRules, onClose,
}: {
  save: GameSave;
  creature?: CreatureRecord;
  item: BattleOutfitterItem;
  slotLabel: string;
  short: boolean;
  onCreature: (id: string) => void;
  onRules: () => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<"stats" | "sets">("stats");
  const [statPage, setStatPage] = useState(0);
  const comparison = creature && compareEquipment(save, creature, item, null);
  const statChanges = comparison?.rows.filter(row => row.delta !== 0) ?? [];
  const capacity = short ? 3 : 6;
  const pages = Math.max(1, Math.ceil(statChanges.length / capacity));
  const page = Math.min(statPage, pages - 1);
  const setChanges = comparison?.sets.current.flatMap(before => {
    const after = comparison.sets.after.find(set => set.id === before.id);
    return after && after.count !== before.count ? [{ before, after }] : [];
  }).sort((a, b) =>
    (a.after.activations - a.before.activations) - (b.after.activations - b.before.activations)
  ) ?? [];

  return (
    <ForgeWindow title="Creature comparison" marker="comparison" onClose={onClose}
      page={page} pages={view === "stats" ? pages : 1} onPage={setStatPage}>
      {creature && comparison ? <>
        <div className={s.compareHeader}>
          <label className={s.compareFor}>
            Compare for
            <select aria-label="Compare equipment for" value={creature.creatureId} onChange={event => {
              onCreature(event.target.value);
              setStatPage(0);
            }}>
              {save.creatures?.map(candidate => (
                <option key={candidate.creatureId} value={candidate.creatureId}>{candidate.nickname}</option>
              ))}
            </select>
          </label>
          <p className={s.compareItem}>
            <strong>{item.name} +0</strong>
            <span>{comparison.previous ? `Replaces ${comparison.previous.name}` : `Fills empty ${slotLabel.toLowerCase()} slot`}</span>
          </p>
        </div>
        <div className={s.compareViews} role="group" aria-label="Comparison views">
          <button aria-pressed={view === "stats"} onClick={() => setView("stats")}>Stat changes</button>
          <button aria-pressed={view === "sets"} onClick={() => setView("sets")}>Set bonuses</button>
          <button aria-label="Set & slot rules" onClick={onRules}>Rules</button>
        </div>
        {view === "stats" ? (
          statChanges.length ? <table className={s.compareTable} aria-label="Projected stat changes">
            <thead><tr><th scope="col">Stat</th><th scope="col">Current</th><th scope="col">After</th><th scope="col">Change</th></tr></thead>
            <tbody>
              {statChanges.slice(page * capacity, (page + 1) * capacity).map(row => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{row.current}</td><td>{row.after}</td>
                  <td data-delta={Math.sign(row.delta)}>{row.delta > 0 ? "+" : ""}{row.delta}</td>
                </tr>
              ))}
            </tbody>
          </table> : <p className={s.notice}>No stat changes for {creature.nickname}.</p>
        ) : (
          setChanges.length ? <div className={s.compareSets} aria-label="Projected set changes">
            {setChanges.map(({ before, after }) => {
              const bonusChange = Math.sign(after.activations - before.activations);
              return (
                <article className={s.setChange} key={before.id}>
                  <h3 className={s.compareSetTitle}>
                    <img src={`${FORGE_SLATE}sets/sculpted/${before.id}.webp`} alt="" />
                    <span>{before.name}</span>
                    <strong>{before.count}/{before.required} → {after.count}/{after.required}</strong>
                  </h3>
                  <p className={s.compareSetEffect} data-delta={bonusChange}>
                    {bonusChange === 0 ? "Piece count changes" :
                      `${bonusChange > 0 ? "Bonus gained" : "Bonus lost"} · Active groups ${before.activations} → ${after.activations}`}
                  </p>
                  <small>{before.description}</small>
                </article>
              );
            })}
          </div> : <p className={s.notice}>Set bonuses and piece counts stay the same.</p>
        )}
      </> : <p className={s.notice}>Recruit a creature to preview equipment changes.</p>}
    </ForgeWindow>
  );
}
