"use client";

import { NurseryScreen as CoreNurseryScreen } from "./NurseryScreen";
import type { ReactNode } from "react";
import {useNavigation} from "@/features/navigation/NavigationContext";
import { useGameContext } from "@/state/GameProvider";

const OPEN_LEDGER_KEY = "creature_chronicles_open_breeding_ledger";

export function NurseryScreen({ headerLinks }: { headerLinks?: ReactNode }) {
  const { goToBreeding,currentSave } = useGameContext();
  const {breedingResultReturn}=useNavigation();
  const resultReturn=breedingResultReturn?.returning&&breedingResultReturn.saveId===currentSave?.saveId&&currentSave?.breeding?.attempts.some(a=>a.attemptId===breedingResultReturn.attemptId);

  function openLedger() {
    window.sessionStorage.setItem(OPEN_LEDGER_KEY, "1");
    goToBreeding();
  }

  return (
    <CoreNurseryScreen headerLinks={<>
      {resultReturn&&<button type="button" onClick={goToBreeding}>Breeding Result</button>}
      <button type="button" onClick={openLedger}>Breeding Ledger</button>
      {headerLinks}
    </>} />
  );
}
