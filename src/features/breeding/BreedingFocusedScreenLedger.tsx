"use client";

import { useEffect, useState } from "react";
import { BreedingRecordsScreen } from "@/features/breeding-records/BreedingRecordsScreen";
import { GameDialog } from "@/features/ui/GameDialog";
import { BreedingFocusedScreen as QualityOfLifeBreedingScreen } from "./BreedingFocusedScreenQoL";

export function BreedingFocusedScreen() {
  const [ledgerOpen,setLedgerOpen] = useState(false);
  const [revision,setRevision] = useState(0);
  useEffect(() => {
    if (window.sessionStorage.getItem("creature_chronicles_open_breeding_ledger") === "1") {
      window.sessionStorage.removeItem("creature_chronicles_open_breeding_ledger");
      setLedgerOpen(true);
    }
    const open = () => setLedgerOpen(true);
    window.addEventListener("creature-chronicles:open-breeding-ledger",open);
    return () => window.removeEventListener("creature-chronicles:open-breeding-ledger",open);
  },[]);
  function close() {
    setLedgerOpen(false);
    if (window.sessionStorage.getItem("creature_chronicles_breeding_focus")) setRevision(value => value+1);
  }
  return <><QualityOfLifeBreedingScreen key={revision}/>{ledgerOpen ? <GameDialog title="Breeding Ledger" onClose={close} wide><BreedingRecordsScreen onClose={close} embedded /></GameDialog> : null}</>;
}
