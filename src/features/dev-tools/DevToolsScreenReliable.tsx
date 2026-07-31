"use client";

import { DevToolsScreen as BaseDevToolsScreen } from "./DevToolsScreen";
import { SaveReliabilityPanel } from "./SaveReliabilityPanel";
import { TalentAuditPanel } from "./TalentAuditPanel";
import { BattleMoveAuditPanel } from "./BattleMoveAuditPanel";
import { PredatorTestPanel } from "./PredatorTestPanel";

export function DevToolsScreen() {
  return (
    <>
      <BaseDevToolsScreen />
      <PredatorTestPanel />
      <SaveReliabilityPanel />
      <TalentAuditPanel />
      <BattleMoveAuditPanel />
    </>
  );
}
