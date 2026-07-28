"use client";

import { useEffect, useState } from "react";
import { BreedingRecordsScreen } from "@/features/breeding-records/BreedingRecordsScreen";
import { BreedingFocusedScreen as QualityOfLifeBreedingScreen } from "./BreedingFocusedScreenQoL";

const OPEN_LEDGER_KEY = "creature_chronicles_open_breeding_ledger";
const OPEN_LEDGER_EVENT = "creature-chronicles:open-breeding-ledger";

export function BreedingFocusedScreen() {
  const [ledgerOpen, setLedgerOpen] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(OPEN_LEDGER_KEY) === "1") {
      window.sessionStorage.removeItem(OPEN_LEDGER_KEY);
      setLedgerOpen(true);
    }

    const openLedger = () => setLedgerOpen(true);
    window.addEventListener(OPEN_LEDGER_EVENT, openLedger);
    return () => window.removeEventListener(OPEN_LEDGER_EVENT, openLedger);
  }, []);

  if (ledgerOpen) {
    return <BreedingRecordsScreen onClose={() => setLedgerOpen(false)} />;
  }

  return (
    <>
      <QualityOfLifeBreedingScreen />
      <button
        type="button"
        onClick={() => setLedgerOpen(true)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 45,
          minHeight: 42,
          padding: "9px 16px",
          border: "2px solid #2a1b12",
          borderRadius: 13,
          background: "linear-gradient(#c9f0ff,#56c7ff)",
          color: "#071923",
          fontWeight: 950,
          boxShadow: "0 5px 0 rgba(0,0,0,.4),0 0 18px rgba(86,199,255,.18)",
        }}
      >
        Breeding Ledger
      </button>
    </>
  );
}
