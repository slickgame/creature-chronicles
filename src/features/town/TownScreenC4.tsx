"use client";

import { useState } from "react";
import { getColiseumC3Summary } from "@/data/coliseumC3";
import { getColiseumC4Summary, getColiseumC4WeeklyBoss } from "@/data/coliseumC4";
import { useGameContext } from "@/state/GameProvider";
import { RoseLanternScreen } from "./RoseLanternScreen";
import { TownScreen as BaseTownScreen } from "./TownScreen";

const ROSE_LANTERN_ICON = "/images/buildings/town/rose_lantern.svg";

export function TownScreen() {
  const { currentSave, goToBattleDebug } = useGameContext();
  const [showRoseLantern, setShowRoseLantern] = useState(false);
  const c3 = currentSave ? getColiseumC3Summary(currentSave) : null;
  const c4 = currentSave ? getColiseumC4Summary(currentSave) : null;
  const boss = currentSave ? getColiseumC4WeeklyBoss(currentSave) : null;
  return (
    <>
      <BaseTownScreen />

      <button
        type="button"
        onClick={() => setShowRoseLantern(true)}
        aria-label="Visit The Rose Lantern adult social house"
        style={{
          position: "fixed",
          left: "75%",
          top: "31%",
          zIndex: 24,
          width: "clamp(82px, 8vw, 132px)",
          minHeight: 44,
          border: "2px solid rgba(239,185,120,.68)",
          borderRadius: 16,
          padding: 7,
          background: "rgba(18,9,18,.88)",
          color: "#fff0c8",
          boxShadow: "0 12px 28px rgba(0,0,0,.54)",
          cursor: "pointer",
        }}
      >
        <img src={ROSE_LANTERN_ICON} alt="" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", borderRadius: 10 }} />
        <strong style={{ display: "block", marginTop: 4, fontSize: ".72rem" }}>The Rose Lantern</strong>
        <small style={{ color: "#8fe0ad", fontWeight: 900 }}>OPEN</small>
      </button>

      {showRoseLantern ? <RoseLanternScreen onClose={() => setShowRoseLantern(false)} /> : null}

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
            minHeight: 44,
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
