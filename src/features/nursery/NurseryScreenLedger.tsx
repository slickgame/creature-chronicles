"use client";

import { NurseryScreen as CoreNurseryScreen } from "./NurseryScreen";
import type { ReactNode } from "react";
import { useGameContext } from "@/state/GameProvider";

const OPEN_LEDGER_KEY = "creature_chronicles_open_breeding_ledger";

export function NurseryScreen({ headerLinks }: { headerLinks?: ReactNode }) {
  const { goToBreeding } = useGameContext();

  function openLedger() {
    window.sessionStorage.setItem(OPEN_LEDGER_KEY, "1");
    goToBreeding();
  }

  return (
    <CoreNurseryScreen headerLinks={<>
      <button type="button" onClick={openLedger}>Breeding Ledger</button>
      {headerLinks}
    </>} />
  );
}
