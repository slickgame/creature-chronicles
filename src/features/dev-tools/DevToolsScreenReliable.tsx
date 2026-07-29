"use client";

import { DevToolsScreen as BaseDevToolsScreen } from "./DevToolsScreen";
import { SaveReliabilityPanel } from "./SaveReliabilityPanel";
import { TalentAuditPanel } from "./TalentAuditPanel";

export function DevToolsScreen() {
  return (
    <>
      <BaseDevToolsScreen />
      <SaveReliabilityPanel />
      <TalentAuditPanel />
    </>
  );
}
