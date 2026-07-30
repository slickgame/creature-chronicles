"use client";

import { useEffect } from "react";
import { syncColiseumC3Rewards } from "@/data/coliseumC3";
import { useGameContext } from "@/state/GameProvider";
import { ColiseumProgressionScreen as ColiseumProgressionScreenC4 } from "./ColiseumProgressionShellC4";

export function ColiseumProgressionScreen() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const c2ProgressKey = currentSave?.flags.coliseumProgressV2;
  const c3StateKey = currentSave?.flags.coliseumC3StateV1;

  useEffect(() => {
    if (!currentSave) return;
    const result = syncColiseumC3Rewards(currentSave);
    if (result.changed) saveCurrentGame(result.save);
  }, [currentSave?.saveId, c2ProgressKey, c3StateKey, saveCurrentGame]);

  return <ColiseumProgressionScreenC4 />;
}
