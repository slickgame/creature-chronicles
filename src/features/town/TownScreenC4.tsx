"use client";

import { getColiseumC3Summary } from "@/data/coliseumC3";
import { getColiseumC4Summary, getColiseumC4WeeklyBoss } from "@/data/coliseumC4";
import { useGameContext } from "@/state/GameProvider";
import { TownScreen as BaseTownScreen } from "./TownScreen";

export function TownScreen() {
  const { currentSave, goToBattleDebug } = useGameContext();
  const c3 = currentSave ? getColiseumC3Summary(currentSave) : null;
  const c4 = currentSave ? getColiseumC4Summary(currentSave) : null;
  const boss = currentSave ? getColiseumC4WeeklyBoss(currentSave) : null;
  return (
    <>
      <BaseTownScreen />
      {c3 && c4 && boss ? (
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
            minWidth: 210,
            padding: "10px 14px",
            border: "1px solid rgba(241,195,105,.72)",
            borderRadius: 10,
            background: "rgba(18,9,6,.95)",
            color: "#fff0c8",
            boxShadow: "0 14px 34px rgba(0,0,0,.5)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ color: "#d6ad67", fontSize: ".72rem", fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Coliseum C4</span>
          <strong>{c3.marks} Marks · {c4.weeklyScore} Weekly Score</strong>
          <small>{c4.activeRun ? `Gauntlet stage ${c4.activeRun.stageIndex + 1} waiting` : `${boss.name} · ${c4.bossClaimed ? "reward claimed" : "reward available"}`}</small>
        </button>
      ) : null}
    </>
  );
}
