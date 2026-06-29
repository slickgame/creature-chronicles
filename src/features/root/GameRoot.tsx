"use client";

import { BattleOutfitterScreen } from "@/features/battle-outfitter/BattleOutfitterScreen";
import { BreedingFocusedScreen } from "@/features/breeding/BreedingFocusedScreen";
import { CollectionScreen } from "@/features/collection/CollectionScreen";
import { DevToolsScreen } from "@/features/dev-tools/DevToolsScreen";
import { EggAtelierScreen } from "@/features/egg-atelier/EggAtelierScreen";
import { GuildHallScreen } from "@/features/guild/GuildHallScreen";
import { HabitatScreen } from "@/features/habitats/HabitatScreen";
import { MainMenuScreen } from "@/features/main-menu/MainMenuScreen";
import { MarketScreen } from "@/features/market/MarketScreen";
import { NurseryScreen } from "@/features/nursery/NurseryScreen";
import { RanchHubScreen } from "@/features/ranch/RanchHubScreen";
import { RanchPlotNavigator } from "@/features/ranch/RanchPlotNavigator";
import { RanchJobsAdvisorScreen } from "@/features/ranch-jobs/RanchJobsAdvisorScreen";
import { RanchOfficeScreen } from "@/features/ranch-office/RanchOfficeScreen";
import { SupplyDepotScreen } from "@/features/supply-depot/SupplyDepotScreen";
import { TownScreen } from "@/features/town/TownScreen";
import { TrainingGroundsScreen } from "@/features/training-grounds/TrainingGroundsScreen";
import { useGameContext } from "@/state/GameProvider";

export function GameRoot() {
  const { appScreen, currentSave, exitRunToMainMenu, version } = useGameContext();

  if (currentSave?.flags.badEnding === true) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "linear-gradient(145deg, #21120d, #080706)", color: "#fff7dd" }}>
        <section style={{ width: "min(100%, 620px)", padding: 28, border: "4px solid #1c120e", borderRadius: 18, background: "rgba(38, 18, 13, 0.94)", boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", color: "#f2b84b", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>Run Ended</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2.25rem, 6vw, 4rem)" }}>{String(currentSave.flags.badEndingTitle ?? "Ranch Closed")}</h1>
          <p style={{ color: "#fff0c9", lineHeight: 1.5 }}>{String(currentSave.flags.badEndingReason ?? "The ranch could not continue.")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "18px 0" }}>
            <div style={{ padding: 10, background: "rgba(0, 0, 0, 0.35)", borderRadius: 10 }}><span>Month</span><strong style={{ display: "block" }}>{String(currentSave.flags.taxDefaultMonth ?? currentSave.dayState.month)}</strong></div>
            <div style={{ padding: 10, background: "rgba(0, 0, 0, 0.35)", borderRadius: 10 }}><span>Tax Due</span><strong style={{ display: "block" }}>{String(currentSave.flags.taxMissedAmount ?? 0)} Gold</strong></div>
            <div style={{ padding: 10, background: "rgba(0, 0, 0, 0.35)", borderRadius: 10 }}><span>Shortage</span><strong style={{ display: "block" }}>{String(currentSave.flags.taxShortageAmount ?? 0)} Gold</strong></div>
          </div>
          <p style={{ color: "#e7c991" }}>Keep enough Gold before Day 30 ends to survive the monthly collector check.</p>
          <button type="button" onClick={exitRunToMainMenu} style={{ minHeight: 42, padding: "10px 18px", border: "2px solid #1c120e", borderRadius: 10, background: "linear-gradient(#fff4c9, #dca755)", color: "#241713", fontWeight: 900 }}>Return to Main Menu</button>
          <footer style={{ marginTop: 18, opacity: 0.75 }}>{version}</footer>
        </section>
      </main>
    );
  }

  if (appScreen === "ranch-hub") return <><RanchHubScreen /><RanchPlotNavigator /></>;
  if (appScreen === "habitat") return <HabitatScreen />;
  if (appScreen === "breeding") return <BreedingFocusedScreen />;
  if (appScreen === "nursery") return <NurseryScreen />;
  if (appScreen === "town") return <TownScreen />;
  if (appScreen === "market") return <MarketScreen />;
  if (appScreen === "supply-depot") return <SupplyDepotScreen />;
  if (appScreen === "egg-atelier") return <EggAtelierScreen />;
  if (appScreen === "training-grounds") return <TrainingGroundsScreen />;
  if (appScreen === "battle-outfitter") return <BattleOutfitterScreen />;
  if (appScreen === "guild-hall") return <GuildHallScreen />;
  if (appScreen === "collection") return <CollectionScreen />;
  if (appScreen === "ranch-office") return <RanchOfficeScreen />;
  if (appScreen === "ranch-jobs") return <RanchJobsAdvisorScreen />;
  if (appScreen === "dev-tools") return <DevToolsScreen />;

  return <MainMenuScreen />;
}
