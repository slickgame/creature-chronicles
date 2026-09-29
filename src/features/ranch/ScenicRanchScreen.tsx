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
import { GameDialog } from "@/features/ui/GameDialog";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureFamily } from "@/types/creature";
import styles from "./ScenicRanchScreen.module.css";

const ART: Record<string, string> = {
  house: "ranch_house",
  breeding: "breeding_pen",
  nursery: "egg_nursery",
  town: "town_road",
  feline: "feline_habitat",
  canine: "canine_habitat",
  bovine: "bovine_habitat",
  lapine: "lapine_habitat",
  equine: "equine_habitat",
  office: "ranch_office",
  jobs: "guild_board",
  guild: "guild_board",
};

export function ScenicRanchScreen() {
  const game = useGameContext();
  const { open } = useNavigation();
  const [plot, setPlot] = useState(0);
  const [selected, setSelected] = useState<BuildingShortcut | null>(null);
  if (!game.currentSave) return null;
  const save = game.currentSave;
  const currentPlot = RANCH_PLOTS[plot];
  const buildings = BUILDING_SHORTCUTS.filter(
    (item) => item.plotId === currentPlot.id,
  );
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
    <main className={styles.home}>
      <div className={styles.backdrop} aria-hidden="true" />
      <header className={styles.hud}>
        <div className={styles.identity}>
          <small>{save.player.name}</small>
          <h1>{save.player.ranchName}</h1>
        </div>
        <div className={styles.resources} aria-label="Player resources">
          <span>
            Day <b>{save.dayState.dayNumber}</b>
          </span>
          <span>
            Energy{" "}
            <b>
              {save.currencies.energy}/{save.currencies.maxEnergy}
            </b>
          </span>
          <span>
            Gold <b>{save.currencies.gold.toLocaleString()}</b>
          </span>
          <span>
            GP <b>{save.currencies.guildPoints}</b>
          </span>
        </div>
        <button
          type="button"
          className={styles.menu}
          onClick={() => open("menu")}
          data-navigation-launcher aria-haspopup="dialog"
        >
          ☰ Menu
        </button>
      </header>
      <div className={styles.body}>
        <section
          className={styles.map}
          data-plot={currentPlot.id}
          aria-label="Ranch locations"
        >
          <div className={styles.plotTitle}>
            <span>Explore your ranch</span>
            <h2>{currentPlot.label}</h2>
          </div>
          {buildings.map((building) => {
            const project = building.projectId
              ? getBuilderProjectProgress(save, building.projectId)
              : null;
            const ready =
              building.id === "nursery"
                ? (save.eggs ?? []).filter((egg) => egg.status === "ready")
                    .length
                : 0;
            const level = building.upgradeIds.length
              ? Math.max(...building.upgradeIds.map((id) => upgrades[id] ?? 0))
              : null;
            return (
              <button
                type="button"
                key={`${currentPlot.id}-${building.id}`}
                className={styles.building}
                style={
                  {
                    "--x": `${building.x}%`,
                    "--y": `${building.labelY}%`,
                  } as CSSProperties
                }
                onClick={() => setSelected(building)}
                aria-label={`Open ${building.title}`}
              >
                <img
                  src={
                    project
                      ? project.definition.iconPath
                      : `/images/buildings/ranch/${ART[building.id]}.png`
                  }
                  alt=""
                />
                <span>{building.title}</span>
                <small>
                  {ready
                    ? `${ready} ready`
                    : project
                      ? project.status
                      : level !== null
                        ? `Level ${level}`
                        : "Visit"}
                </small>
              </button>
            );
          })}
          <nav className={styles.plotNav} aria-label="Ranch plots">
            <button
              type="button"
              aria-label="Previous ranch plot"
              onClick={() =>
                setPlot((plot + RANCH_PLOTS.length - 1) % RANCH_PLOTS.length)
              }
            >
              ←
            </button>
            <span>
              {currentPlot.shortLabel} · {plot + 1} / {RANCH_PLOTS.length}
            </span>
            <button
              type="button"
              aria-label="Next ranch plot"
              onClick={() => setPlot((plot + 1) % RANCH_PLOTS.length)}
            >
              →
            </button>
          </nav>
        </section>
        <aside className={styles.today}>
          <RanchLedger compact />
        </aside>
      </div>
      <footer className={styles.bottom}>
        <nav className={styles.dock} aria-label="Ranch shortcuts">
          <button type="button" aria-current="page" onClick={() => setPlot(0)}>
            ⌂ <span>Ranch</span>
          </button>
          <button type="button" onClick={game.goToCollection}>
            ♧ <span>Creatures</span>
          </button>
          <button type="button" onClick={game.goToNursery}>
            ◉ <span>Nursery</span>
          </button>
          <button type="button" onClick={game.goToTown}>
            ♜ <span>Town</span>
          </button>
          <button type="button" onClick={() => open("inventory")}>
            ▣ <span>Inventory</span>
          </button>
        </nav>
        <div className={styles.dayAction}>
          <button
            type="button"
            data-tutorial-id="ranch-review-day"
            onClick={() => open("end-day")}
          >
            ☾ End Day
          </button>
          <small>Local save · File {save.slotIndex + 1}</small>
        </div>
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
