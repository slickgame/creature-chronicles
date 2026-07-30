"use client";

import { getColiseumC3Summary } from "@/data/coliseumC3";
import { useGameContext } from "@/state/GameProvider";
import { TownScreen as BaseTownScreen } from "./TownScreen";

export function TownScreen() {
  const { currentSave, goToBattleDebug } = useGameContext();
  const summary = currentSave ? getColiseumC3Summary(currentSave) : null;
  return (
    <>
      <BaseTownScreen />
      {summary ? (
        <button
          type="button"
          onClick={goToBattleDebug}
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 190,
            display: "grid",
            gap: 2,
            minWidth: 170,
            padding: "10px 14px",
            border: "1px solid rgba(241,195,105,.72)",
            borderRadius: 10,
            background: "rgba(18,9,6,.94)",
            color: "#fff0c8",
            boxShadow: "0 14px 34px rgba(0,0,0,.5)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ color: "#d6ad67", fontSize: ".72rem", fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Coliseum C3</span>
          <strong>{summary.marks} Marks · {summary.completedEncounters}/{summary.totalEncounters} Clears</strong>
          <small>{summary.pendingContracts} contract{summary.pendingContracts === 1 ? "" : "s"} waiting</small>
        </button>
      ) : null}
    </>
  );
}
