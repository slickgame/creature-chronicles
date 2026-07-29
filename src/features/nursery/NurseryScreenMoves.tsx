"use client";

import { useEffect, useMemo, useState } from "react";
import { getBattleMove } from "@/data/battleMoves";
import { getSpeciesDefinition } from "@/data/creatures";
import { useGameContext } from "@/state/GameProvider";
import type { BattleMoveInheritanceResult } from "@/types/battle";
import type { BirthRecord, EggRecord, PregnancyRecord } from "@/types/save";
import { NurseryScreen as LedgerNurseryScreen } from "./NurseryScreenLedger";
import styles from "./NurseryScreenMoves.module.css";

type MoveLineageRecord = {
  recordId: string;
  stage: "Pregnancy" | "Egg" | "Hatched";
  name: string;
  speciesName: string;
  parentNames: string;
  inheritedMoveIds: string[];
  combinationMoveIds: string[];
  loadoutMoveIds: string[];
  notes: string[];
};

function inheritanceRecord(
  stage: "Pregnancy" | "Egg",
  record: PregnancyRecord | EggRecord,
): MoveLineageRecord | null {
  const inheritance: BattleMoveInheritanceResult | undefined = stage === "Pregnancy"
    ? (record as PregnancyRecord).inheritance.battleMoveInheritance
    : (record as EggRecord).battleMoveInheritance;
  if (!inheritance) return null;
  const parents = stage === "Pregnancy"
    ? (record as PregnancyRecord)
    : (record as EggRecord).parents;
  const parentNames = stage === "Pregnancy"
    ? `${(record as PregnancyRecord).giver.displayName} × ${(record as PregnancyRecord).receiver.displayName}`
    : `${(record as EggRecord).parents.giver.displayName} × ${(record as EggRecord).parents.receiver.displayName}`;
  const name = stage === "Pregnancy"
    ? `${(record as PregnancyRecord).receiver.displayName}'s offspring`
    : (record as EggRecord).suggestedName;
  return {
    recordId: stage === "Pregnancy" ? String((record as PregnancyRecord).pregnancyId) : String((record as EggRecord).eggId),
    stage,
    name,
    speciesName: getSpeciesDefinition(inheritance.childSpeciesId).name,
    parentNames,
    inheritedMoveIds: [...inheritance.directInheritedMoveIds],
    combinationMoveIds: [...inheritance.combinationMoveIds],
    loadoutMoveIds: [...inheritance.projectedLoadout.learnedMoveIds],
    notes: [...inheritance.notes],
  };
}

function birthRecord(record: BirthRecord): MoveLineageRecord | null {
  const loadout = record.startingBattleMoveLoadout;
  if (!loadout && !record.inheritedMoveIds?.length && !record.combinationMoveIds?.length) return null;
  return {
    recordId: record.birthId,
    stage: "Hatched",
    name: record.nickname,
    speciesName: getSpeciesDefinition(record.speciesId).name,
    parentNames: `${record.parents.giver.displayName} × ${record.parents.receiver.displayName}`,
    inheritedMoveIds: [...(record.inheritedMoveIds ?? [])],
    combinationMoveIds: [...(record.combinationMoveIds ?? [])],
    loadoutMoveIds: [...(loadout?.learnedMoveIds ?? [])],
    notes: [`Hatched on Ranch Day ${record.hatchedAtDayNumber}.`],
  };
}

function moveNames(moveIds: readonly string[]): string {
  return moveIds.length
    ? moveIds.map((moveId) => getBattleMove(moveId).name).join(", ")
    : "None";
}

export function NurseryScreen() {
  const { currentSave } = useGameContext();
  const [open, setOpen] = useState(false);
  const records = useMemo<MoveLineageRecord[]>(() => {
    if (!currentSave) return [];
    return [
      ...(currentSave.pregnancies ?? []).map((record) => inheritanceRecord("Pregnancy", record)),
      ...(currentSave.eggs ?? []).filter((record) => record.status !== "hatched").map((record) => inheritanceRecord("Egg", record)),
      ...(currentSave.birthHistory ?? []).map(birthRecord),
    ].filter((record): record is MoveLineageRecord => record !== null);
  }, [currentSave]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [open]);

  return (
    <>
      <LedgerNurseryScreen />
      {currentSave ? (
        <button type="button" className={styles.launchButton} onClick={() => setOpen(true)}>
          Move Lineage {records.length ? `(${records.length})` : ""}
        </button>
      ) : null}

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label="Nursery move lineage" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.header}>
              <div>
                <p>Pregnancy → Egg → Hatchling</p>
                <h1>Move Lineage</h1>
                <span>Inherited parent moves and rare combination techniques remain attached to the offspring record through every Nursery stage.</span>
              </div>
              <button type="button" onClick={() => setOpen(false)}>Close</button>
            </header>
            <div className={styles.content}>
              {records.length ? records.map((record) => (
                <article key={`${record.stage}-${record.recordId}`} className={styles.card} data-ui-text-box="auto">
                  <div className={styles.cardHeader}>
                    <div>
                      <p>{record.stage} · {record.speciesName}</p>
                      <h2>{record.name}</h2>
                      <span>{record.parentNames}</span>
                    </div>
                    <strong>{record.loadoutMoveIds.length} learned</strong>
                  </div>
                  <dl>
                    <div><dt>Direct inheritance</dt><dd>{moveNames(record.inheritedMoveIds.filter((moveId) => !record.combinationMoveIds.includes(moveId)))}</dd></div>
                    <div><dt>Combination moves</dt><dd>{moveNames(record.combinationMoveIds)}</dd></div>
                    <div><dt>Starting library</dt><dd>{moveNames(record.loadoutMoveIds)}</dd></div>
                  </dl>
                  <details>
                    <summary>Inheritance notes</summary>
                    <ul>{record.notes.map((note, index) => <li key={`${record.recordId}-${index}`}>{note}</li>)}</ul>
                  </details>
                </article>
              )) : (
                <section className={styles.emptyCard} data-ui-text-box="auto">
                  <h2>No move-lineage records yet</h2>
                  <p>Successful creature-to-creature conceptions will lock parent move snapshots and possible combination techniques into the pregnancy record.</p>
                </section>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
