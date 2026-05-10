"use client";

import { useMemo, useState } from "react";
import {
  CREATURE_PLACEHOLDER_IMAGE,
  getSpeciesDefinition,
  getVariantDefinition,
} from "@/data/creatures";
import { formatEnergy } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import styles from "./HabitatScreen.module.css";

const STAT_LABELS = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
} as const;

function getImagePath(path: string): string {
  return path || CREATURE_PLACEHOLDER_IMAGE;
}

export function HabitatScreen() {
  const {
    activeHabitatFamily,
    currentSave,
    feedCreature,
    goToRanch,
    renameCreature,
  } = useGameContext();
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [message, setMessage] = useState("Select a creature to view its profile.");

  const habitat = useMemo(() => {
    return (currentSave?.habitats ?? []).find(
      (item) => item.family === activeHabitatFamily,
    );
  }, [activeHabitatFamily, currentSave?.habitats]);

  const creatures = useMemo(() => {
    if (!activeHabitatFamily || !currentSave?.creatures) {
      return [];
    }

    return currentSave.creatures.filter((creature) => {
      const variant = getVariantDefinition(creature.variantId);
      return variant.family === activeHabitatFamily;
    });
  }, [activeHabitatFamily, currentSave?.creatures]);

  const selectedCreature = useMemo(() => {
    if (!selectedCreatureId) {
      return creatures[0] ?? null;
    }

    return creatures.find((creature) => creature.creatureId === selectedCreatureId) ?? creatures[0] ?? null;
  }, [creatures, selectedCreatureId]);

  if (!currentSave || !activeHabitatFamily || !habitat) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>Habitat unavailable</h1>
          <p>Return to the ranch and select an unlocked habitat.</p>
          <button type="button" onClick={goToRanch}>
            Back to Ranch
          </button>
        </section>
      </main>
    );
  }

  const habitatTitle = activeHabitatFamily === "feline" ? "Feline Habitat" : "Canine Habitat";
  const habitatDescription =
    activeHabitatFamily === "feline"
      ? "Home for Sphinx, Saberfang, and future feline variants."
      : "Home for Hellhound, Direwolf, and future canine variants.";

  function handleSelectCreature(creature: CreatureRecord) {
    setSelectedCreatureId(creature.creatureId);
    setRenameValue(creature.nickname);
    setMessage(`${creature.nickname} selected.`);
  }

  function handleRename() {
    if (!selectedCreature || !renameValue.trim()) {
      return;
    }

    renameCreature(selectedCreature.creatureId, renameValue);
    setMessage(`${selectedCreature.nickname} was renamed to ${renameValue.trim()}.`);
  }

  function handleFeed() {
    if (!selectedCreature) {
      return;
    }

    feedCreature(selectedCreature.creatureId);
    setMessage(`${selectedCreature.nickname} was fed. Affection and creature energy increased.`);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M3 Habitat</p>
            <h1>{habitatTitle}</h1>
            <p>{habitatDescription}</p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.capacityCard}>
              <span>Capacity</span>
              <strong>
                {creatures.length} / {habitat.capacity}
              </strong>
            </div>
            <button type="button" onClick={goToRanch}>
              Back to Ranch
            </button>
          </div>
        </header>

        <section className={styles.contentGrid}>
          <aside className={styles.creatureList} aria-label="Creature list">
            <h2>Creatures</h2>
            <p className={styles.helpText}>{message}</p>

            <div className={styles.cards}>
              {creatures.map((creature) => {
                const variant = getVariantDefinition(creature.variantId);
                const species = getSpeciesDefinition(creature.speciesId);
                const isSelected = selectedCreature?.creatureId === creature.creatureId;

                return (
                  <button
                    key={creature.creatureId}
                    type="button"
                    className={`${styles.creatureCard} ${isSelected ? styles.selectedCard : ""}`}
                    onClick={() => handleSelectCreature(creature)}
                  >
                    <img
                      src={getImagePath(variant.portraitPath)}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div>
                      <strong>{creature.nickname}</strong>
                      <span>
                        {variant.name} {species.name} • Lv {creature.level}
                      </span>
                      <em>{variant.rarity}</em>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className={styles.profilePanel} aria-label="Creature profile">
            {selectedCreature ? (
              <CreatureProfile
                creature={selectedCreature}
                onFeed={handleFeed}
                onRename={handleRename}
                renameValue={renameValue || selectedCreature.nickname}
                setRenameValue={setRenameValue}
              />
            ) : (
              <div className={styles.noSelection}>No creature selected.</div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

function CreatureProfile({
  creature,
  onFeed,
  onRename,
  renameValue,
  setRenameValue,
}: {
  creature: CreatureRecord;
  onFeed: () => void;
  onRename: () => void;
  renameValue: string;
  setRenameValue: (value: string) => void;
}) {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(creature.speciesId);

  return (
    <div className={styles.profileGrid}>
      <div className={styles.profileArtWrap}>
        <img
          src={getImagePath(variant.profilePath)}
          alt={`${creature.nickname} profile`}
          className={styles.profileArt}
          onError={(event) => {
            event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
          }}
        />
      </div>

      <div className={styles.profileInfo}>
        <p className={styles.kicker}>{variant.rarity} Variant</p>
        <h2>{creature.nickname}</h2>
        <p className={styles.variantLine}>
          {variant.name} {species.name} • Generation {creature.generation}
        </p>
        <p>{variant.description}</p>

        <div className={styles.statGrid}>
          {Object.entries(creature.stats).map(([statKey, value]) => (
            <div key={statKey}>
              <span>{STAT_LABELS[statKey as keyof typeof STAT_LABELS]}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className={styles.resourceGrid}>
          <div>
            <span>Creature Energy</span>
            <strong>{formatEnergy(creature.energy, creature.maxEnergy)}</strong>
          </div>
          <div>
            <span>Affection</span>
            <strong>{creature.affection} / 100</strong>
          </div>
          <div>
            <span>Level</span>
            <strong>{creature.level}</strong>
          </div>
          <div>
            <span>XP</span>
            <strong>{creature.xp}</strong>
          </div>
        </div>

        <section className={styles.abilityPanel}>
          <h3>Abilities</h3>
          {creature.abilities.map((ability) => (
            <article key={ability.id}>
              <div>
                <strong>{ability.name}</strong>
                <span>
                  Grade {ability.grade} • {ability.source}
                </span>
              </div>
              <p>{ability.description}</p>
            </article>
          ))}
        </section>

        <section className={styles.actionPanel}>
          <label>
            Rename
            <input
              type="text"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={24}
            />
          </label>
          <div className={styles.actionButtons}>
            <button type="button" onClick={onRename}>
              Save Name
            </button>
            <button type="button" onClick={onFeed}>
              Feed
            </button>
            <button type="button" disabled>
              Release Later
            </button>
            <button type="button" disabled>
              Donate Later
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
