"use client";

import { useState, type CSSProperties } from "react";
import {
  BUILDING_SHORTCUTS,
  RANCH_PLOTS,
  type BuildingShortcut,
} from "@/data/ranchMap";
import { getBuilderProjectProgress } from "@/data/builderProjects";
import {
  getNextRanchUpgradeTier,
  getRanchUpgradeDefinition,
  getRanchUpgrades,
} from "@/data/ranchUpgrades";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { RanchLedger } from "@/features/navigation/RanchLedger";
import { RanchIcon, type RanchIconName } from "@/features/ui/RanchIcon";
import { GameDialog } from "@/features/ui/GameDialog";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureFamily } from "@/types/creature";
import styles from "./ScenicRanchScreen.module.css";

const LOCATIONS: Record<string, Record<string, [number, number]>> = {
  homestead: { house: [21, 53], nursery: [48, 61], office: [20, 78], feline: [70, 49], canine: [79, 73], town: [50, 81] },
  habitats: { feline: [24, 50], canine: [77, 51], bovine: [19, 78], lapine: [51, 79], equine: [83, 78] },
  services: { office: [28, 50], breeding: [56, 63], house: [21, 79], jobs: [74, 70], guild: [90, 80], town: [50, 81] },
  expansion: { "north-pasture": [25, 43], "woodline-acre": [74, 43], chicken: [17, 62], sheep: [40, 62], goat: [64, 62], aviary: [86, 62], fence: [26, 80], watchtower: [79, 80] },
};
const ICONS: Record<string, RanchIconName> = { house: "house", nursery: "egg", breeding: "nest", office: "chores", town: "town", jobs: "tools", guild: "tax" };

export function ScenicRanchScreen() {
  const game = useGameContext();
  const { open, view } = useNavigation();
  const [plot, setPlot] = useState(0);
  const [selected, setSelected] = useState<BuildingShortcut | null>(null);
  if (!game.currentSave) return null;
  const save = game.currentSave;
  const currentPlot = RANCH_PLOTS[plot];
  const buildings = Object.keys(LOCATIONS[currentPlot.id]).map((id) => BUILDING_SHORTCUTS.find((item) => item.id === id)!);
  const upgrades = getRanchUpgrades(save);
  function travel(building: BuildingShortcut) {
    setSelected(null);
    if (building.projectId) {
      window.localStorage.setItem("creature-chronicles-open-builder-yard", "1");
      game.goToTown();
      return;
    }
    if (building.id === "house") {
      open("end-day");
      return;
    }
    if (building.id === "breeding") {
      game.goToBreeding();
      return;
    }
    if (building.id === "nursery") {
      game.goToNursery();
      return;
    }
    if (building.id === "jobs") {
      game.goToRanchJobs();
      return;
    }
    if (building.id === "office") {
      game.goToRanchOffice();
      return;
    }
    if (building.id === "guild" || building.id === "town") {
      game.goToTown();
      return;
    }
    game.goToHabitat(building.id as CreatureFamily);
  }
  function upgrade(building: BuildingShortcut) {
    const id = building.upgradeIds[0];
    if (!id) return;
    window.localStorage.setItem(
      "creature-chronicles-ranch-office-upgrade-v1",
      id,
    );
    window.localStorage.setItem(
      "creature-chronicles-ranch-office-category-v1",
      getRanchUpgradeDefinition(id).category,
    );
    setSelected(null);
    game.goToRanchOffice();
  }
  return (
    <main className={`${styles.home} ${view === "ledger" ? styles.ledgerOpen : ""}`}>
      <header className={styles.hud}>
        <div className={styles.identity}><h1>{save.player.ranchName}</h1><small>{save.player.name}’s ranch</small></div>
        <div className={styles.resources} aria-label="Player resources">
          <div className={styles.resource}><RanchIcon name="sun" /><span>Day <b>{save.dayState.dayNumber}</b></span></div>
          <div className={`${styles.resource} ${styles.energy}`}><RanchIcon name="energy" /><span>Energy <b>{save.currencies.energy}/{save.currencies.maxEnergy}</b><meter min={0} max={Math.max(1, save.currencies.maxEnergy)} value={save.currencies.energy} aria-label="Energy" /></span></div>
          <div className={styles.resource}><RanchIcon name="gold" /><span><b>{save.currencies.gold.toLocaleString()}</b><small>Gold · {save.currencies.guildPoints} GP</small></span></div>
        </div>
        <button type="button" className={styles.menu} onClick={() => open("menu")} data-navigation-launcher aria-haspopup="dialog"><RanchIcon name="gear" /><span>Menu</span></button>
      </header>
      <div className={styles.worldScroll}>
        <section className={styles.map} data-plot={currentPlot.id} aria-label="Ranch locations" style={{ backgroundImage: `url(/images/ui/ranch-v2/${currentPlot.id}.webp)` }}>
          {buildings.map((building) => {
            const project = building.projectId ? getBuilderProjectProgress(save, building.projectId) : null;
            const ready = building.id === "nursery" ? (save.eggs ?? []).filter(egg => egg.status === "ready").length : 0;
            const [x, y] = LOCATIONS[currentPlot.id][building.id];
            return <button type="button" key={`${currentPlot.id}-${building.id}`} className={styles.building} style={{ "--x": `${x}%`, "--y": `${y}%` } as CSSProperties} onClick={() => setSelected(building)} aria-label={`Open ${building.title}`}>
              <RanchIcon name={ICONS[building.id] ?? (project ? "tools" : "paw")} />
              <span>{building.title}{(ready > 0 || project) && <small>{ready ? `${ready} ready` : project?.status}</small>}</span>
            </button>;
          })}
        </section>
      </div>
      <nav className={styles.plotNav} aria-label="Ranch plots">
        <button type="button" aria-label="Previous ranch plot" onClick={() => setPlot((plot + RANCH_PLOTS.length - 1) % RANCH_PLOTS.length)}>‹</button>
        <span>{currentPlot.shortLabel}<small>{plot + 1} / {RANCH_PLOTS.length}<span className={styles.swipeHint}> · Swipe to explore</span></small></span>
        <button type="button" aria-label="Next ranch plot" onClick={() => setPlot((plot + 1) % RANCH_PLOTS.length)}>›</button>
      </nav>
      {view !== "ledger" && <aside className={styles.today}><RanchLedger compact minimal={plot !== 0} /></aside>}
      <footer className={styles.bottom}>
        <nav className={styles.dock} aria-label="Ranch shortcuts">
          <button type="button" aria-current="page" onClick={() => setPlot(0)}><RanchIcon name="house" /><span>Ranch</span></button>
          <button type="button" onClick={game.goToCollection}><RanchIcon name="paw" /><span>Creatures</span></button>
          <button type="button" onClick={game.goToNursery}><RanchIcon name="egg" /><span>Nursery</span></button>
          <button type="button" onClick={game.goToTown}><RanchIcon name="town" /><span>Town</span></button>
          <button type="button" onClick={() => open("inventory")}><RanchIcon name="bag" /><span>Inventory</span></button>
        </nav>
        <div className={styles.dayAction}><button type="button" data-tutorial-id="ranch-review-day" onClick={() => open("end-day")}><RanchIcon name="moon" />End Day</button><small>Local save · File {save.slotIndex + 1}</small></div>
      </footer>
      {selected && (
        <GameDialog title={selected.title} onClose={() => setSelected(null)}>
          <p>{selected.hint}</p>
          {selected.projectId
            ? (() => {
                const p = getBuilderProjectProgress(save, selected.projectId!);
                return (
                  <div>
                    <p>
                      <b>{p.status}</b> · {p.definition.costGold} Gold +{" "}
                      {p.definition.costMaterials} Materials
                    </p>
                    {p.missingPrerequisites.length > 0 && (
                      <p>
                        Requires:{" "}
                        {p.missingPrerequisites.map((p) => p.title).join(", ")}
                      </p>
                    )}
                    {p.built && p.definition.category === "habitat" && (
                      <p>
                        This structure is complete. Its future creature family
                        is not active yet.
                      </p>
                    )}
                  </div>
                );
              })()
            : selected.upgradeIds.map((id) => {
                const definition = getRanchUpgradeDefinition(id),
                  tier = upgrades[id] ?? 0,
                  next = getNextRanchUpgradeTier(definition, tier);
                return (
                  <article key={id} className={styles.upgrade}>
                    <h3>
                      {definition.name} · Tier {tier}
                    </h3>
                    <p>
                      {tier
                        ? definition.tiers.find((item) => item.tier === tier)
                            ?.effectLabel
                        : "Base ranch service"}
                    </p>
                    <p>
                      <b>Next: </b>
                      {next
                        ? `${next.effectLabel} · ${next.costGold} Gold${next.costGp ? ` + ${next.costGp} GP` : ""}${next.costMaterials ? ` + ${next.costMaterials} Materials` : ""}`
                        : "Fully upgraded"}
                    </p>
                  </article>
                );
              })}
          <div className={styles.dialogActions}>
            <button type="button" onClick={() => travel(selected)}>
              {selected.projectId
                ? "Visit Builder's Yard"
                : selected.id === "house"
                  ? "Review & End Day"
                  : "Enter Building"}
            </button>
            {selected.upgradeIds.length > 0 && (
              <button type="button" onClick={() => upgrade(selected)}>
                Upgrade in Office
              </button>
            )}
          </div>
        </GameDialog>
      )}
    </main>
  );
}
