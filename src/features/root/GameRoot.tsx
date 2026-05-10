"use client";

import { MainMenuScreen } from "@/features/main-menu/MainMenuScreen";
import { RanchHubScreen } from "@/features/ranch/RanchHubScreen";
import { useGameContext } from "@/state/GameProvider";

export function GameRoot() {
  const { appScreen } = useGameContext();

  if (appScreen === "ranch-hub") {
    return <RanchHubScreen />;
  }

  return <MainMenuScreen />;
}
