"use client";

import { LedgerPageTurn, useLedgerPageTurn } from "@/features/ui/LedgerPageTurn";
import { useState } from "react";
import { getBreedingParticipants } from "@/data/breeding";
import { getBreedingInheritancePreview, getBreedingSelectionBlocker } from "@/data/breedingSelectionPreview";
import { TALENT_INHERITANCE_GRADES } from "@/data/genetics";
import { GameDialog } from "@/features/ui/GameDialog";
import type { GameSave } from "@/types/save";
import { PagerA } from "./BreedingWindowA";
import j from "./InheritanceJournal.module.css";

type Preview = ReturnType<typeof getBreedingInheritancePreview>;
type Talent = NonNullable<Preview["talentPreview"]>["candidates"][number];
type Mode = "Talents" | "Moves";
type OddsRow = { id: string; name: string; chance: number; talent?: Talent; kind?: string };

export function formatInheritancePercent(value: number): string {
  return value > 0 && value < 0.1 ? "<0.1%" : `${Number(value.toFixed(1))}%`;
}

export function TalentGradeOdds({ talent }: { talent?: Talent }) {
  const grades = talent?.grades ?? TALENT_INHERITANCE_GRADES.map(grade => ({ grade, chance: 0 }));
  return (
    <ul className={j.gradeOdds} aria-label="Talent outcomes after conception">
      {grades.map(({ grade, chance }) => (
        <li key={grade}>
          <span className={j.grade} data-grade={grade}>Grade {grade}</span>
          <strong>{formatInheritancePercent(chance)}</strong>
        </li>
      ))}
      <li><span className={j.grade} data-grade="none">Doesn’t pass</span><strong>{formatInheritancePercent(talent?.notInheritedChance ?? 100)}</strong></li>
    </ul>
  );
}

function rowsFor(preview: Preview, mode: Mode): OddsRow[] {
  if (mode === "Talents") {
    return (preview.talentPreview?.candidates ?? []).map(talent => ({
      id: talent.talent.id, name: talent.talent.name, chance: talent.chance, talent,
    }));
  }
  return [
    ...preview.moves.directCandidates.map(move => ({
      id: `parent-${move.moveId}`, name: move.moveName, chance: move.finalChance, kind: "Parent move",
    })),
    ...preview.moves.combinationCandidates.map(move => ({
      id: `recipe-${move.recipeId}`, name: move.outputMoveName, chance: move.chance, kind: "Combination",
    })),
  ];
}

export function BreedingInheritanceComparison({
  save, current, initialMode, onClose,
}: {
  save: GameSave;
  current: Preview;
  initialMode: Mode;
  onClose: () => void;
}) {
  const { direction, turning, turnPage, finishTurn } = useLedgerPageTurn();
  const [giverId, setGiverId] = useState(current.giver?.participantId ?? "");
  const [receiverId, setReceiverId] = useState(current.receiver?.participantId ?? "");
  const [mode, setMode] = useState(initialMode);
  const [index, setIndex] = useState(0);
  const participants = getBreedingParticipants(save);
  const changed = giverId !== current.giver?.participantId || receiverId !== current.receiver?.participantId;
  const candidate = changed ? getBreedingInheritancePreview(save, giverId, receiverId) : null;
  const currentRows = rowsFor(current, mode);
  const candidateRows = candidate ? rowsFor(candidate, mode) : [];
  const rows = [...new Map([...currentRows, ...candidateRows].map(row => [row.id, row])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));
  const position = Math.min(index, Math.max(0, rows.length - 1));
  const row = rows[position];
  const sides = [
    { label: "Selected pairing", preview: current, result: currentRows.find(item => item.id === row?.id) },
    { label: "Candidate pairing", preview: candidate, result: candidateRows.find(item => item.id === row?.id) },
  ];

  return (
    <GameDialog title="Compare inheritance" onClose={onClose} dialogClassName={`${j.recordDialog} ${j.planningDialog}`} wide>
      <div className={j.comparison} style={{ position: 'relative' }} aria-busy={turning}>
        <div className={j.compareControls}>
          <label>Candidate giver
            <select disabled={turning} value={giverId} onChange={event => { setGiverId(event.target.value); setIndex(0); }}>
              {participants.filter(p => p.participantId === giverId || !getBreedingSelectionBlocker(p, "giver", receiverId))
                .map(p => <option key={p.participantId} value={p.participantId}>{p.displayName}</option>)}
            </select>
          </label>
          <label>Candidate receiver
            <select disabled={turning} value={receiverId} onChange={event => { setReceiverId(event.target.value); setIndex(0); }}>
              {participants.filter(p => p.kind === "creature" && (p.participantId === receiverId || !getBreedingSelectionBlocker(p, "receiver", giverId)))
                .map(p => <option key={p.participantId} value={p.participantId}>{p.displayName}</option>)}
            </select>
          </label>
        </div>
        <nav className={j.compareModes} aria-label="Compare inheritance views">
          {(["Talents", "Moves"] as const).map(next => (
            <button key={next} type="button" aria-pressed={mode === next} aria-disabled={turning} onClick={() => {
              if (mode !== next) turnPage(next === "Moves" ? "next" : "previous", () => { setMode(next); setIndex(0); });
            }}>{next}</button>
          ))}
        </nav>
        {!candidate ? <p className={j.note}>Choose a different giver or receiver to compare against your selected pairing.</p> : row ? (
          <>
            <label>{mode === "Talents" ? "Talent" : "Move"}
              <select disabled={turning} value={row.id} onChange={event => setIndex(rows.findIndex(item => item.id === event.target.value))}>
                {rows.map(item => <option key={item.id} value={item.id}>{item.name}{item.kind ? ` · ${item.kind}` : ""}</option>)}
              </select>
            </label>
            <div className={j.compareSides}>
              {sides.map(({ label, preview, result }, index) => (
                <article key={label} className={j.compareCard} data-candidate={index === 1}>
                  <header className={j.comparePair}>
                    <h3>{label}</h3>
                    <p>{preview?.giver?.displayName} × {preview?.receiver?.displayName}</p>
                  </header>
                  <div className={j.compareMetric}>
                    <strong className={j.compareChance} data-zero={!result?.chance}>{formatInheritancePercent(result?.chance ?? 0)}</strong>
                    <span>{!result ? (mode === "Talents" ? "No parent roll" : "No bonus roll") : mode === "Talents" ? "Total chance" : "Roll chance"}</span>
                  </div>
                  {mode === "Talents" && <TalentGradeOdds talent={result?.talent} />}
                  {result?.talent && <p className={j.compareSources}>{result.talent.sources.map(source => `${source.parentName} (${source.ability.grade})`).join(" · ")}</p>}
                </article>
              ))}
            </div>
            {rows.length > 1 && <PagerA index={position} total={rows.length} busy={turning} onChange={next => turnPage(next > position ? "next" : "previous", () => setIndex(next))} />}
          </>
        ) : <p className={j.note}>Neither pairing has a {mode === "Talents" ? "parent talent" : "bonus move"} to compare.</p>}
        <p className={j.planningNote}>{mode === "Talents"
          ? "Base odds after conception. “Doesn’t pass” refers to this talent’s parent rolls. Mutation and item checks are separate."
          : "Roll odds after conception with a slot open. Species starting moves are separate."}</p>
        <LedgerPageTurn direction={direction} onFinish={finishTurn} />
      </div>
    </GameDialog>
  );
}
