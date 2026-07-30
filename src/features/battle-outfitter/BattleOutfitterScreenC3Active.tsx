"use client";

import { useState } from "react";
import { BattleOutfitterScreenC3 } from "./BattleOutfitterScreenC3";
import { BattleMoveTrainingOverlay } from "./BattleMoveTrainingOverlay";
import { useGameContext } from "@/state/GameProvider";

export function BattleOutfitterScreenActive() {
  const { currentSave } = useGameContext();
  const [moveTrainingOpen, setMoveTrainingOpen] = useState(false);

  return (
    <>
      <BattleOutfitterScreenC3 />
      {currentSave ? (
        <button
          type="button"
          onClick={() => setMoveTrainingOpen(true)}
          style={{
            position: "fixed",
            left: 18,
            bottom: 18,
            zIndex: 180,
            minWidth: 170,
            minHeight: 42,
            padding: "9px 14px",
            border: "1px solid rgba(245,201,128,.72)",
            borderRadius: 9,
            background: "linear-gradient(#fff1bd,#d5a24d)",
            color: "#21130c",
            fontWeight: 900,
            boxShadow: "0 12px 30px rgba(0,0,0,.5)",
            cursor: "pointer",
          }}
        >
          Move Training
        </button>
      ) : null}
      <BattleMoveTrainingOverlay open={moveTrainingOpen} onClose={() => setMoveTrainingOpen(false)} />
    </>
  );
}
