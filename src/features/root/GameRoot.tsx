"use client";

import { BreedingScreen } from "@/features/breeding/BreedingScreen";
import { HabitatScreen } from "@/features/habitats/HabitatScreen";
import { MainMenuScreen } from "@/features/main-menu/MainMenuScreen";
import { NurseryScreen } from "@/features/nursery/NurseryScreen";
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

  if (appScreen === "breeding") {
    return <BreedingScreen />;
  }

  if (appScreen === "nursery") {
    return <NurseryScreen />;
  }

  return <MainMenuScreen />;
}
