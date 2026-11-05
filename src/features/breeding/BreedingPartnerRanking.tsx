"use client";

import { useMemo, useState } from "react";
import { getInheritancePartnerPreviews, rankInheritancePartners, type NamedInheritanceTarget } from "@/data/breedingPartnerRanking";
import { TALENT_INHERITANCE_GRADES } from "@/data/genetics";
import { GameDialog } from "@/features/ui/GameDialog";
import type { BreedingParticipant, BreedingRole } from "@/types/breeding";
import type { AbilityGrade } from "@/types/creature";
import type { GameSave } from "@/types/save";
import { formatInheritancePercent } from "./BreedingInheritanceComparison";
import { PagerA } from "./BreedingWindowA";
import j from "./InheritanceJournal.module.css";

const RESULTS_PER_PAGE = 3;

export function BreedingPartnerRanking({
  save, giver, receiver, initialMode, onSelectPartner, onClose,
}: {
  save: GameSave;
  giver?: BreedingParticipant;
  receiver?: BreedingParticipant;
  initialMode: "Talents" | "Moves";
  onSelectPartner: (fixedRole: BreedingRole, fixedId: string, partnerId: string, selection: NamedInheritanceTarget) => string | null;
  onClose: () => void;
}) {
  const [fixedRole, setFixedRole] = useState<BreedingRole>(giver ? "giver" : "receiver");
  const [mode, setMode] = useState(initialMode);
  const [talentId, setTalentId] = useState<string>();
  const [moveId, setMoveId] = useState("");
  const [grade, setGrade] = useState<AbilityGrade | "">("");
  const [page, setPage] = useState(0);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const fixed = fixedRole === "giver" ? giver : receiver;
  const selectedPartner = fixedRole === "giver" ? receiver : giver;
  const fixedId = fixed?.participantId ?? "";
  const previews = useMemo(() => getInheritancePartnerPreviews(save, fixedId, fixedRole), [save, fixedId, fixedRole]);
  const talents = [...new Map(previews.flatMap(({ talents }) => talents.candidates
    .filter(candidate => candidate.chance > 0)
    .map(({ talent }) => [talent.id, talent.name] as const))).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const moves = [...new Map(previews.flatMap(({ moves }) => moves.map(move => [move.id, move.name] as const))).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));
  const activeTalent = talentId === "" ? "" : talents.find(([id]) => id === talentId)?.[0] ?? talents[0]?.[0] ?? "";
  const activeMove = moves.find(([id]) => id === moveId)?.[0] ?? moves[0]?.[0];
  const target = mode === "Moves"
    ? activeMove && { kind: "move" as const, id: activeMove }
    : activeTalent
      ? { kind: "talent" as const, id: activeTalent, grade: grade || undefined }
      : grade && { kind: "grade" as const, grade };
  function selectPartner(partnerId: string) {
    if (!target) return;
    const label = target.kind === "move"
      ? moves.find(([id]) => id === target.id)?.[1] ?? "Combat move"
      : target.kind === "grade"
        ? `Any Grade ${target.grade} talent`
        : `${talents.find(([id]) => id === target.id)?.[1] ?? "Talent"}${target.grade ? ` · Grade ${target.grade}` : ""}`;
    setSelectionError(onSelectPartner(fixedRole, fixedId, partnerId, { target, label }));
  }
  const results = target ? rankInheritancePartners(previews, target) : [];
  const pageCount = Math.ceil(results.length / RESULTS_PER_PAGE);
  const position = Math.min(page, Math.max(0, pageCount - 1));
  const start = position * RESULTS_PER_PAGE;

  return (
    <GameDialog title="Rank partners" onClose={onClose} dialogClassName={`${j.recordDialog} ${j.planningDialog}`} wide>
      <div className={`${j.comparison} ${j.rankPlanner}`}>
        <div className={j.planningControls}>
        <label>Keep one parent fixed
          <select value={fixedRole} onChange={event => { setFixedRole(event.target.value as BreedingRole); setPage(0); }}>
            {giver && <option value="giver">Giver · {giver.displayName}</option>}
            {receiver?.kind === "creature" && <option value="receiver">Receiver · {receiver.displayName}</option>}
          </select>
        </label>
        <nav className={j.compareModes} aria-label="Rank partners by">
          {(["Talents", "Moves"] as const).map(next => (
            <button key={next} type="button" aria-pressed={mode === next} onClick={() => { setMode(next); setPage(0); }}>{next}</button>
          ))}
        </nav>
        {mode === "Talents" ? (
          <div className={j.compareControls}>
            <label>Target talent
              <select value={activeTalent} onChange={event => {
                setTalentId(event.target.value);
                if (!event.target.value && !grade) setGrade("S");
                setPage(0);
              }}>
                <option value="">Any talent</option>
                {talents.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            <label>Target grade
              <select value={grade} onChange={event => { setGrade(event.target.value as AbilityGrade | ""); setPage(0); }}>
                <option value="">Any grade</option>
                {TALENT_INHERITANCE_GRADES.map(option => <option key={option} value={option}>Grade {option}</option>)}
              </select>
            </label>
          </div>
        ) : (
          <label>Target move
            <select value={activeMove ?? ""} disabled={!moves.length} onChange={event => { setMoveId(event.target.value); setPage(0); }}>
              {!moves.length && <option value="">No bonus moves</option>}
              {moves.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
        )}
        </div>
        <div className={j.planningResults}>
        {selectionError && <p className={j.warning} role="alert">{selectionError}</p>}
        {!previews.length ? <p className={j.note}>No eligible partners for this parent right now.</p>
          : !target ? <p className={j.note}>{mode === "Talents" ? "Choose a talent or a specific grade to rank partners." : "No eligible pairing has a compatible bonus move."}</p>
          : <>
            <div className={j.rankLegend}>
              <strong>{previews.length} eligible {previews.length === 1 ? "partner" : "partners"}</strong>
              <span>{mode === "Talents" ? "Chance" : "Roll odds"}</span>
            </div>
            {results[0]?.chance === 0 && <p className={j.rankSummary}>None can pass down this target.</p>}
            <ol className={j.rankList} start={start + 1}>
              {results.slice(start, start + RESULTS_PER_PAGE).map(({ partner, chance }, index) => {
                const selected = partner.participantId === selectedPartner?.participantId;
                return (
                  <li key={partner.participantId} data-selected={selected}>
                    <span className={j.rankNumber}>#{start + index + 1}</span>
                    <div><strong>{partner.displayName}</strong><small>{selected ? "Current partner" : partner.familyLabel}</small></div>
                    <strong className={j.rankChance} data-zero={chance === 0}>{formatInheritancePercent(chance)}</strong>
                    <button type="button" className={selected ? j.rankSelected : j.rankSelect}
                      aria-label={selected ? `Keep target with ${partner.displayName}` : `Select ${partner.displayName} as ${fixedRole === "giver" ? "receiver" : "giver"}`}
                      onClick={() => selectPartner(partner.participantId)}>
                      {selected ? "Keep" : "Select"}
                    </button>
                  </li>
                );
              })}
            </ol>
            {pageCount > 1 && <PagerA index={position} total={pageCount} onChange={setPage} />}
          </>}
        <p className={j.planningNote}>
          {results.length > 0 && <strong>Select or Keep carries this target to Review Attempt. </strong>}
          {mode === "Talents"
            ? "Base odds after conception. Mutation and item checks are separate."
            : "Roll odds after conception with a slot open. Species starting moves are separate."}
        </p>
        </div>
      </div>
    </GameDialog>
  );
}
