"use client";

import { DevToolsScreen as BaseDevToolsScreen } from "./DevToolsScreen";
import { SaveReliabilityPanel } from "./SaveReliabilityPanel";
import { TalentAuditPanel } from "./TalentAuditPanel";
import { BattleMoveAuditPanel } from "./BattleMoveAuditPanel";
import { PredatorTestPanel } from "./PredatorTestPanel";
import { LegacyTestPanel } from "./LegacyTestPanel";

export function DevToolsScreen() {
  return (
    <>
      <BaseDevToolsScreen />
      <LegacyTestPanel />
      <PredatorTestPanel />
      <SaveReliabilityPanel />
      <TalentAuditPanel />
      <BattleMoveAuditPanel />
    </>
  );
}
