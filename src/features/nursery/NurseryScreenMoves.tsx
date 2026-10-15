"use client";

import { useMemo, useState } from "react";
import { getBattleMove } from "@/data/battleMoves";
import { getSpeciesDefinition } from "@/data/creatures";
import { useGameContext } from "@/state/GameProvider";
import type { BattleMoveInheritanceResult } from "@/types/battle";
import type { BirthRecord, EggRecord, PregnancyRecord } from "@/types/save";
import { NurseryScreen as LedgerNurseryScreen } from "./NurseryScreenLedger";
import { NurseryBook, type NurseryPage } from "./NurseryBook";

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

  const pages: NurseryPage[] = records.flatMap(record => [
    {key:`${record.stage}-${record.recordId}-summary`,title:`${record.name} · ${record.stage}`,content:<><p>{record.speciesName} · {record.parentNames}</p><p>{record.loadoutMoveIds.length} learned moves · {record.combinationMoveIds.length} combination moves</p></>},
    ...([
      ['Direct inheritance',record.inheritedMoveIds.filter(id=>!record.combinationMoveIds.includes(id))],
      ['Combination moves',record.combinationMoveIds],
      ['Starting library',record.loadoutMoveIds],
    ] as const).flatMap(([category,ids])=> ids.length ? ids.map((id,i)=>({key:`${record.stage}-${record.recordId}-${category}-${i}`,title:`${record.name} · ${category}`,content:<><h3>{getBattleMove(id).name}</h3><p>{record.stage} · {record.parentNames}</p></>})) : [{key:`${record.stage}-${record.recordId}-${category}`,title:`${record.name} · ${category}`,content:<p>None recorded.</p>}]),
    ...record.notes.map((note,i)=>({key:`${record.stage}-${record.recordId}-note-${i}`,title:`${record.name} · Note ${i+1}`,content:<p>{note}</p>})),
  ]);
  if(!pages.length)pages.push({key:'empty',title:'No move-lineage records yet',content:<p>Successful creature-to-creature conceptions retain parent moves and possible combination techniques through pregnancy, egg and hatch stages.</p>});

  return (
    <>
      <LedgerNurseryScreen headerLinks={currentSave ? (
        <button type="button" onClick={() => setOpen(true)}>Move Lineage {records.length ? `(${records.length})` : ""}</button>
      ) : null} />
      {open ? <NurseryBook title="Move Lineage" onClose={() => setOpen(false)} pages={pages}/> : null}
    </>
  );
}
