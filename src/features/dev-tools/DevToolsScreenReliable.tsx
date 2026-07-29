"use client";

import { DevToolsScreen as BaseDevToolsScreen } from "./DevToolsScreen";
import { SaveReliabilityPanel } from "./SaveReliabilityPanel";

export function DevToolsScreen() {
  return (
    <>
      <BaseDevToolsScreen />
      <SaveReliabilityPanel />
    </>
  );
}
