"use client";

import { BreedingScreen } from "@/features/breeding/BreedingScreen";
import { CollectionScreen } from "@/features/collection/CollectionScreen";
import { GuildHallScreen } from "@/features/guild/GuildHallScreen";
import { HabitatScreen } from "@/features/habitats/HabitatScreen";
import { MainMenuScreen } from "@/features/main-menu/MainMenuScreen";
import { MarketScreen } from "@/features/market/MarketScreen";
import { NurseryScreen } from "@/features/nursery/NurseryScreen";
import { RanchHubScreen } from "@/features/ranch/RanchHubScreen";
import { RanchOfficeScreen } from "@/features/ranch-office/RanchOfficeScreen";
import { TownScreen } from "@/features/town/TownScreen";
import { useGameContext } from "@/state/GameProvider";

export function GameRoot() {
  const { appScreen } = useGameContext();

  if (appScreen === "ranch-hub") return <RanchHubScreen />;
  if (appScreen === "habitat") return <HabitatScreen />;
  if (appScreen === "breeding") return <BreedingScreen />;
  if (appScreen === "nursery") return <NurseryScreen />;
  if (appScreen === "town") return <TownScreen />;
  if (appScreen === "market") return <MarketScreen />;
  if (appScreen === "guild-hall") return <GuildHallScreen />;
  if (appScreen === "collection") return <CollectionScreen />;
  if (appScreen === "ranch-office") return <RanchOfficeScreen />;

  return <MainMenuScreen />;
}
