"use client";

import { HabitatScreen } from "@/features/habitats/HabitatScreen";
import { MainMenuScreen } from "@/features/main-menu/MainMenuScreen";
import { RanchHubScreen } from "@/features/ranch/RanchHubScreen";
import { useGameContext } from "@/state/GameProvider";

export function GameRoot() {
  const { appScreen } = useGameContext();

  if (appScreen === "ranch-hub") {
    return <RanchHubScreen />;
  }

  if (appScreen === "habitat") {
    return <HabitatScreen />;
  }

  return <MainMenuScreen />;
}
