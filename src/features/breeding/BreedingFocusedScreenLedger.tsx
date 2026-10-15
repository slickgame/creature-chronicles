"use client";

import { useEffect, useState } from "react";
import { BreedingRecordsScreen } from "@/features/breeding-records/BreedingRecordsScreen";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { useGameContext } from "@/state/GameProvider";
import { GameDialog } from "@/features/ui/GameDialog";
import { BreedingFocusedScreen as QualityOfLifeBreedingScreen } from "./BreedingFocusedScreenQoL";

export function BreedingFocusedScreen() {
  const { breedingLedger, setBreedingLedger } = useNavigation();
  const { currentSave } = useGameContext();
  const [ledgerOpen,setLedgerOpen] = useState(Boolean(breedingLedger?.returning && breedingLedger.saveId === currentSave?.saveId));
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
    setBreedingLedger(value => value ? {...value,returning:false,detail:undefined,detailPage:undefined} : null);
    if (window.sessionStorage.getItem("creature_chronicles_breeding_focus")) setRevision(value => value+1);
  }
  return <><QualityOfLifeBreedingScreen key={revision}/>{ledgerOpen ? <GameDialog title="Breeding Ledger" onClose={close} fullScreen><BreedingRecordsScreen onClose={close} embedded /></GameDialog> : null}</>;
}
