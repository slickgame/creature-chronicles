"use client";

import { GAME_TITLE } from "@/data/gameConstants";
import { formatEnergy, formatGameDate, formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import styles from "./MainMenuScreen.module.css";

export function MainMenuScreen() {
  const { buildPhase, previewSave, version } = useGameContext();

  const { currencies, dayState, player } = previewSave;

  return (
    <main className={styles.screen}>
      <section className={styles.heroPanel} aria-labelledby="game-title">
        <div className={styles.versionBadge}>{version}</div>

        <div className={styles.logoBox}>
          <p className={styles.smallLabel}>Planning Rebuild</p>
          <h1 id="game-title" className={styles.title}>
            {GAME_TITLE}
          </h1>
          <p className={styles.subtitle}>Ranch • Breeding • Contracts • Collection</p>
        </div>

        <nav className={styles.menu} aria-label="Main menu">
          <button className={styles.primaryButton}>New Game</button>
          <button className={styles.menuButton}>Load Game</button>
          <button className={styles.menuButton}>Options</button>
          <button className={styles.menuButton}>Dev Notes</button>
        </nav>

        <div className={styles.previewCard}>
          <h2>M0 Scaffold Loaded</h2>
          <p>
            This build is only the architecture foundation. No save/load or gameplay
            systems are active yet.
          </p>

          <dl className={styles.previewStats}>
            <div>
              <dt>Preview Player</dt>
              <dd>{player.name}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>
                {formatGameDate(
                  dayState.weekday,
                  dayState.month,
                  dayState.dayOfMonth,
                )}
              </dd>
            </div>
            <div>
              <dt>Energy</dt>
              <dd>{formatEnergy(currencies.energy, currencies.maxEnergy)}</dd>
            </div>
            <div>
              <dt>Gold</dt>
              <dd>{formatGold(currencies.gold)}</dd>
            </div>
          </dl>

          <p className={styles.phaseText}>{buildPhase}</p>
        </div>
      </section>
    </main>
  );
}