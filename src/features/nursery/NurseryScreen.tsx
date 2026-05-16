"use client";

import { useMemo, useState } from "react";
import { NURSERY_ASSETS } from "@/data/nursery";
import { getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { useGameContext } from "@/state/GameProvider";
import type { EggId } from "@/types/ids";
import type { EggRecord, PregnancyRecord } from "@/types/save";
import styles from "./NurseryScreen.module.css";

const STAT_LABELS = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
} as const;

export function NurseryScreen() {
  const { currentSave, goToRanch, hatchReadyEgg, removeNurseryEgg } = useGameContext();
  const pregnancies = currentSave?.pregnancies ?? [];
  const eggs = currentSave?.eggs ?? [];
  const activePregnancies = pregnancies.filter((pregnancy) => pregnancy.status === "pregnant");
  const activeEggs = eggs.filter((egg) => egg.status !== "hatched");
  const readyEggs = activeEggs.filter((egg) => egg.status === "ready");
  const [selectedEggId, setSelectedEggId] = useState<EggId | null>(readyEggs[0]?.eggId ?? activeEggs[0]?.eggId ?? null);
  const [hatchName, setHatchName] = useState("");
  const [message, setMessage] = useState("Pregnancies become eggs after sleep. Eggs hatch when their timer reaches zero.");

  const selectedEgg = useMemo(
    () => activeEggs.find((egg) => egg.eggId === selectedEggId) ?? activeEggs[0] ?? null,
    [activeEggs, selectedEggId],
  );

  if (!currentSave) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before using the Egg Nursery.</p>
          <button type="button" onClick={goToRanch}>Back to Ranch</button>
        </section>
      </main>
    );
  }

  function handleHatch(egg: EggRecord) {
    const creature = hatchReadyEgg(egg.eggId, hatchName);

    if (!creature) {
      setMessage("This egg is not ready or the target habitat is full.");
      return;
    }

    setHatchName("");
    setSelectedEggId(null);
    setMessage(`${creature.nickname} hatched and moved into their habitat.`);
  }

  function handleRemoveEgg(egg: EggRecord, mode: "release" | "donate") {
    removeNurseryEgg(egg.eggId, mode);
    setSelectedEggId(null);
    setMessage(mode === "donate" ? "Egg donated for 75 Gold and 1 GP." : "Egg released from the nursery.");
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M5 Eggs / Pregnancy / Nursery</p>
            <h1>Egg Nursery</h1>
            <p>Track pregnancies, egg timers, ready eggs, hatch results, inheritance previews, release, and donation.</p>
          </div>
          <div className={styles.headerStats}>
            <div><span>Pregnancies</span><strong>{activePregnancies.length}</strong></div>
            <div><span>Eggs</span><strong>{activeEggs.length} / 6</strong></div>
            <button type="button" onClick={goToRanch}>Back to Ranch</button>
          </div>
        </header>

        <section className={styles.contentGrid}>
          <aside className={styles.sidePanel}>
            <h2>Pregnancies</h2>
            {activePregnancies.length ? (
              <div className={styles.recordList}>
                {activePregnancies.map((pregnancy) => <PregnancyCard key={pregnancy.pregnancyId} pregnancy={pregnancy} />)}
              </div>
            ) : (
              <p className={styles.emptyText}>No active pregnancies. Successful breeding attempts can create one.</p>
            )}
          </aside>

          <section className={styles.centerPanel}>
            <div className={styles.centerHeader}>
              <div>
                <h2>Egg Chamber</h2>
                <p>{message}</p>
              </div>
              <img src={selectedEgg?.status === "ready" ? NURSERY_ASSETS.hatch : NURSERY_ASSETS.egg} alt="" />
            </div>

            {selectedEgg ? (
              <EggDetail
                egg={selectedEgg}
                hatchName={hatchName}
                onHatchNameChange={setHatchName}
                onHatch={handleHatch}
                onRemove={handleRemoveEgg}
              />
            ) : (
              <div className={styles.emptyChamber}>
                <img src={NURSERY_ASSETS.egg} alt="" />
                <h3>No Eggs Yet</h3>
                <p>Breed a successful pair, sleep to deliver the egg, then sleep again until it is ready to hatch.</p>
              </div>
            )}
          </section>

          <aside className={styles.sidePanel}>
            <h2>Eggs</h2>
            {activeEggs.length ? (
              <div className={styles.recordList}>
                {activeEggs.map((egg) => (
                  <button
                    type="button"
                    key={egg.eggId}
                    className={`${styles.eggListCard} ${selectedEgg?.eggId === egg.eggId ? styles.selectedEgg : ""}`}
                    onClick={() => setSelectedEggId(egg.eggId)}
                  >
                    <img src={egg.status === "ready" ? NURSERY_ASSETS.hatch : NURSERY_ASSETS.egg} alt="" />
                    <div>
                      <strong>{getVariantDefinition(egg.variantId).name} Egg</strong>
                      <span>{egg.rarity} • {egg.status === "ready" ? "Ready" : `${egg.daysRemaining}d left`}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No eggs in the nursery yet.</p>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}

function PregnancyCard({ pregnancy }: { pregnancy: PregnancyRecord }) {
  return (
    <article className={styles.pregnancyCard}>
      <img src={NURSERY_ASSETS.pregnancy} alt="" />
      <div>
        <strong>{pregnancy.receiver.displayName}</strong>
        <span>{pregnancy.daysRemaining} day until egg</span>
        <em>{pregnancy.giver.displayName} × {pregnancy.receiver.displayName}</em>
      </div>
    </article>
  );
}

function EggDetail({
  egg,
  hatchName,
  onHatchNameChange,
  onHatch,
  onRemove,
}: {
  egg: EggRecord;
  hatchName: string;
  onHatchNameChange: (value: string) => void;
  onHatch: (egg: EggRecord) => void;
  onRemove: (egg: EggRecord, mode: "release" | "donate") => void;
}) {
  const variant = getVariantDefinition(egg.variantId);
  const species = getSpeciesDefinition(egg.speciesId);
  const isReady = egg.status === "ready";

  return (
    <article className={styles.eggDetail}>
      <div className={styles.eggArtPanel}>
        <img src={isReady ? NURSERY_ASSETS.hatch : NURSERY_ASSETS.egg} alt="" />
        <p>{isReady ? "Ready to Hatch" : `${egg.daysRemaining} day(s) remaining`}</p>
      </div>

      <div className={styles.eggInfoPanel}>
        <p className={styles.kicker}>{egg.rarity} Egg</p>
        <h2>{variant.name} {species.name}</h2>
        <p>Parents: {egg.parents.giver.displayName} × {egg.parents.receiver.displayName}</p>

        <div className={styles.statGrid}>
          {Object.entries(egg.projectedStats).map(([statKey, value]) => (
            <div key={statKey}>
              <span>{STAT_LABELS[statKey as keyof typeof STAT_LABELS]}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <section className={styles.notesPanel}>
          <h3>Inheritance Notes</h3>
          <ul>
            {[...egg.statRollNotes, ...egg.abilityRollNotes].map((note) => <li key={note}>{note}</li>)}
          </ul>
        </section>

        <section className={styles.abilitiesPanel}>
          <h3>Projected Abilities</h3>
          {egg.projectedAbilities.map((ability) => (
            <div key={ability.id}>
              <strong>{ability.name}</strong>
              <span>Grade {ability.grade} • {ability.source}</span>
            </div>
          ))}
        </section>

        <div className={styles.hatchControls}>
          <input
            value={hatchName}
            onChange={(event) => onHatchNameChange(event.target.value)}
            placeholder={`${variant.name} Hatchling`}
            disabled={!isReady}
          />
          <button type="button" disabled={!isReady} onClick={() => onHatch(egg)}>Hatch</button>
          <button type="button" onClick={() => onRemove(egg, "release")}>Release</button>
          <button type="button" onClick={() => onRemove(egg, "donate")}>Donate</button>
        </div>
      </div>
    </article>
  );
}
