"use client";

import { RanchOfficeScreen as CoreRanchOfficeScreen } from "./RanchOfficeScreen";
import { useGameContext } from "@/state/GameProvider";

const OPEN_LEDGER_KEY = "creature_chronicles_open_breeding_ledger";

export function RanchOfficeScreen() {
  const { goToBreeding } = useGameContext();

  function openLedger() {
    window.sessionStorage.setItem(OPEN_LEDGER_KEY, "1");
    goToBreeding();
  }

  return (
    <>
      <CoreRanchOfficeScreen />
      <button
        type="button"
        onClick={openLedger}
        style={{
          position: "fixed",
          left: 18,
          bottom: 18,
          zIndex: 45,
          minHeight: 40,
          padding: "8px 14px",
          border: "2px solid #2a1b12",
          borderRadius: 12,
          background: "linear-gradient(#c9f0ff,#56c7ff)",
          color: "#071923",
          fontWeight: 950,
          boxShadow: "0 4px 0 rgba(0,0,0,.38)",
        }}
      >
        Breeding Ledger
      </button>
    </>
  );
}
