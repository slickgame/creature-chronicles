"use client";

import { useMemo, useState } from "react";
import { getBattleMove } from "@/data/battleMoves";
import { createBattleState, getEffectiveBattleStats, getLivingCombatants, getUsableBattleMoves, resolveBattleRound } from "@/data/battleEngine";
import { getCreatureDefaultBattleMoveLoadout } from "@/data/battleLoadouts";
import { useGameContext } from "@/state/GameProvider";
import type { BattleCombatant, BattleState } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import styles from "@/features/dev-tools/DevToolsScreen.module.css";

function makeEnemyCreature(creature: CreatureRecord, index: number): CreatureRecord {
  return {
    ...creature,
    creatureId: `debug_enemy_${index}_${creature.creatureId}` as CreatureId,
    nickname: `Echo ${creature.nickname || creature.originLabel || index + 1}`,
    level: Math.max(1, creature.level),
  };
}

function getSampleTeams(creatures: CreatureRecord[]): { playerCreatures: CreatureRecord[]; enemyCreatures: CreatureRecord[] } {
  const availableCreatures = creatures.filter((creature) => !creature.injuredUntilDayNumber);
  const playerCreatures = availableCreatures.slice(0, 3);
  const enemySource = availableCreatures.length >= 6 ? availableCreatures.slice(3, 6) : playerCreatures;
  const enemyCreatures = enemySource.map((creature, index) => makeEnemyCreature(creature, index));
  return { playerCreatures, enemyCreatures };
}

function getHealthLabel(combatant: BattleCombatant): string {
  return `${combatant.currentHp}/${combatant.maxHp} HP`;
}

function getEnergyLabel(combatant: BattleCombatant): string {
  return `${combatant.currentBattleEnergy}/${combatant.maxBattleEnergy} BE`;
}

function getStatusLabel(combatant: BattleCombatant): string {
  return combatant.statuses.length ? combatant.statuses.map((status) => `${status.status} ${status.duration}`).join(", ") : "None";
}

function CombatantCard({ combatant }: { combatant: BattleCombatant }) {
  const effectiveStats = getEffectiveBattleStats(combatant);
  const usableMoves = getUsableBattleMoves(combatant);
  const equippedMoves = combatant.loadout.equippedMoveIds.map((moveId) => getBattleMove(moveId));

  return (
    <div className={styles.notice}>
      <strong>{combatant.name}</strong>
      <p>{combatant.sideId} slot {combatant.slotIndex + 1} • Lv. {combatant.level} • {combatant.isFainted ? "Fainted" : "Active"}</p>
      <div className={styles.debugGrid}>
        <div className={styles.debugCard}><span>HP</span><strong>{getHealthLabel(combatant)}</strong></div>
        <div className={styles.debugCard}><span>Battle Energy</span><strong>{getEnergyLabel(combatant)}</strong></div>
        <div className={styles.debugCard}><span>Speed</span><strong>{effectiveStats.speed}</strong></div>
      </div>
      <p><strong>Statuses:</strong> {getStatusLabel(combatant)}</p>
      <p><strong>Equipped:</strong> {equippedMoves.map((move) => `${move.name} (${move.battleEnergyCost} BE, CD ${combatant.cooldowns[move.id] ?? 0})`).join(" • ")}</p>
      <p><strong>Usable now:</strong> {usableMoves.length ? usableMoves.map((move) => move.name).join(", ") : "None"}</p>
    </div>
  );
}

export function BattleDebugScreen() {
  const { currentSave, goToDevTools, goToRanch, goToTown } = useGameContext();
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [message, setMessage] = useState("Initialize a sample 3v3 battle to test the M2 engine.");

  const teams = useMemo(() => getSampleTeams(currentSave?.creatures ?? []), [currentSave]);
  const canInitialize = teams.playerCreatures.length > 0 && teams.enemyCreatures.length > 0;

  if (!currentSave) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before opening the Battle Debug Lab.</p>
          <button type="button" onClick={goToRanch}>Back to Ranch</button>
        </section>
      </main>
    );
  }

  function initializeBattle() {
    if (!canInitialize) {
      setMessage("Need at least one creature to initialize a battle debug state.");
      return;
    }

    const playerLoadouts = Object.fromEntries(
      teams.playerCreatures.map((creature) => [creature.creatureId, getCreatureDefaultBattleMoveLoadout(creature)]),
    );
    const enemyLoadouts = Object.fromEntries(
      teams.enemyCreatures.map((creature) => [creature.creatureId, getCreatureDefaultBattleMoveLoadout(creature)]),
    );

    const nextBattle = createBattleState({
      battleId: `debug-${currentSave.dayState.dayNumber}-${Date.now()}`,
      playerCreatures: teams.playerCreatures,
      enemyCreatures: teams.enemyCreatures,
      playerLoadouts,
      enemyLoadouts,
      playerTeamName: `${currentSave.player.name}'s Ranch Team`,
      enemyTeamName: "Echo Test Team",
    });

    setBattleState(nextBattle);
    setMessage("Battle initialized. Resolve rounds to test targeting, damage, Battle Energy, cooldowns, and logs.");
  }

  function resolveRound() {
    if (!battleState) {
      initializeBattle();
      return;
    }

    if (battleState.outcome !== "ongoing") {
      setMessage(`Battle already ended: ${battleState.outcome}. Reset to run another test.`);
      return;
    }

    const result = resolveBattleRound(battleState);
    setBattleState(result.state);
    setMessage(`Resolved round ${result.result.roundNumber}. Outcome: ${result.result.outcome}.`);
  }

  const playerCombatants = battleState ? getLivingCombatants(battleState, "player") : [];
  const enemyCombatants = battleState ? getLivingCombatants(battleState, "enemy") : [];
  const allCombatants = battleState ? Object.values(battleState.combatants).sort((left, right) => left.sideId.localeCompare(right.sideId) || left.slotIndex - right.slotIndex) : [];
  const recentLog = battleState?.log.slice(-24) ?? [];

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M55 Battle Debug Lab</p>
            <h1>Battle Debug Lab</h1>
            <p>Run an isolated sample 3v3 from the active save. This does not change the save file.</p>
            <p className={styles.message}>{message}</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton} onClick={goToTown}>Town</button>
            <button type="button" className={styles.secondaryButton} onClick={goToDevTools}>Dev Tools</button>
            <button type="button" onClick={goToRanch}>Ranch</button>
          </div>
        </header>

        <section className={styles.grid}>
          <aside className={styles.panel}>
            <h2>Controls</h2>
            <p>Auto-rounds use the engine fallback action selector for every living combatant.</p>
            <div className={styles.toolSection}>
              <button type="button" className={styles.primaryButton} onClick={initializeBattle} disabled={!canInitialize}>Initialize / Reset 3v3</button>
              <button type="button" className={styles.secondaryButton} onClick={resolveRound} disabled={!canInitialize}>Resolve Auto Round</button>
            </div>
            <div className={styles.toolSection}>
              <div className={styles.debugCard}><span>Player Team</span><strong>{playerCombatants.length || teams.playerCreatures.length}</strong></div>
              <div className={styles.debugCard}><span>Enemy Team</span><strong>{enemyCombatants.length || teams.enemyCreatures.length}</strong></div>
              <div className={styles.debugCard}><span>Round</span><strong>{battleState?.roundNumber ?? "—"}</strong></div>
              <div className={styles.debugCard}><span>Outcome</span><strong>{battleState?.outcome ?? "Not started"}</strong></div>
            </div>
          </aside>

          <section className={styles.panel}>
            <h2>Combatants</h2>
            <p>HP, Battle Energy, cooldowns, temporary statuses, and usable moves update after each resolved round.</p>
            <div className={styles.toolSection}>
              {allCombatants.length ? allCombatants.map((combatant) => <CombatantCard key={combatant.battleCombatantId} combatant={combatant} />) : <div className={styles.notice}><strong>No battle state yet.</strong><p>Click Initialize / Reset 3v3 to create a sample combat state.</p></div>}
            </div>
          </section>

          <aside className={styles.panel}>
            <h2>Battle Log</h2>
            <p>Newest entries are shown at the bottom.</p>
            <div className={styles.toolSection}>
              {recentLog.length ? recentLog.map((entry, index) => <div key={`${index}-${entry}`} className={styles.debugCard}><span>Log</span><strong>{entry}</strong></div>) : <div className={styles.notice}><strong>No log yet.</strong><p>Initialize a battle to begin logging.</p></div>}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
