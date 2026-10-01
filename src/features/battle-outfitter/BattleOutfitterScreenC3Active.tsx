"use client";
import { useState } from "react";
import { BattleOutfitterBench } from "./BattleOutfitterBench";
import { BattleMoveTrainingOverlay } from "./BattleMoveTrainingOverlay";
export function BattleOutfitterScreenActive() {
  const [moveTrainingOpen, setMoveTrainingOpen] = useState(false);
  return <><BattleOutfitterBench onMoveTraining={() => setMoveTrainingOpen(true)} /><BattleMoveTrainingOverlay open={moveTrainingOpen} onClose={() => setMoveTrainingOpen(false)} /></>;
}
