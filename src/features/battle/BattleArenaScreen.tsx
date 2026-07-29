"use client";

import { useMemo, useState } from "react";
import {
  buildBattleAiPlan,
  formatBattleAiDecision,
  getBattleAiDifficultyDescription,
  getBattleAiDifficultyLabel,
} from "@/data/battleAi";
import { createBattleState, getEffectiveBattleStats, resolveBattleRound } from "@/data/battleEngine";
import { getBattleMove } from "@/data/battleMoves";
import {
  buildBattleUiAction,
  getBattleTargetTypeLabel,
  getBattleUiMoveOptions,
  getNextUnqueuedPlayerActorId,
  type BattleUiTarget,
} from "@/data/battleUi";
import { getVariantDefinition } from "@/data/creatures";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { useGameContext } from "@/state/GameProvider";
import type {
  BattleAction,
  BattleCombatant,
  BattleCombatantId,
  BattleMove,
  BattleState,
} from "@/types/battle";
import type { BattleAiDifficulty } from "@/types/battleAi";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import styles from "./BattleArenaScreen.module.css";

type BattleUiPhase = "team-selection" | "battle" | "result";

const FALLBACK_PORTRAIT = "/images/ui/icons/icon_paw_crest.png";

function makeEnemyCreature(creature: CreatureRecord, index: number): CreatureRecord {
  return {
    ...creature,
    creatureId: `arena_enemy_${index}_${creature.creatureId}` as CreatureId,
    nickname: `Echo ${creature.nickname || index + 1}`,
    originLabel: "Coliseum Echo",
  };
}

function statusLabel(combatant: BattleCombatant): string {
  if (!combatant.statuses.length) return "No status effects";
  return combatant.statuses
    .map((status) => `${status.status}${(status.stacks ?? 1) > 1 ? ` ×${status.stacks}` : ""} · ${status.duration}r`)
    .join(" • ");
}

function moveEffectLabel(move: BattleMove): string {
  return move.effects.map((effect) => {
    const amount = effect.amount ?? (effect.type === "damage" || effect.type === "heal" ? move.power : undefined);
    const pieces = [effect.type.replaceAll("_", " ")];
    if (amount !== undefined) pieces.push(String(amount));
    if (effect.status) pieces.push(effect.status);
    if (effect.stat) pieces.push(effect.stat);
    if (effect.chance !== undefined && effect.chance < 100) pieces.push(`${effect.chance}%`);
    if (effect.duration) pieces.push(`${effect.duration}r`);
    return pieces.join(" ");
  }).join(" • ");
}

function getUnavailableReason(save: NonNullable<ReturnType<typeof useGameContext>["currentSave"]>, creature: CreatureRecord): string | null {
  const trainingReason = getTrainingUnavailableReason(save, creature.creatureId);
  if (trainingReason) return trainingReason;
  if (creature.injuredUntilDayNumber && creature.injuredUntilDayNumber > save.dayState.dayNumber) {
    return `Injured until Ranch Day ${creature.injuredUntilDayNumber}.`;
  }
  return null;
}

function Meter({ value, max, label, tone }: { value: number; max: number; label: string; tone: "hp" | "energy" }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className={styles.meterBlock}>
      <div><span>{label}</span><strong>{value}/{max}</strong></div>
      <div className={styles.meterTrack}><span className={tone === "hp" ? styles.hpFill : styles.energyFill} style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function CombatantCard({
  combatant,
  portraitPath,
  selectedTarget,
  activeActorId,
  queuedAction,
  onTarget,
  onPlan,
}: {
  combatant: BattleCombatant;
  portraitPath?: string;
  selectedTarget: BattleUiTarget | null;
  activeActorId: BattleCombatantId | null;
  queuedAction?: BattleAction;
  onTarget: () => void;
  onPlan?: () => void;
}) {
  const selected = selectedTarget?.kind === "combatant" && selectedTarget.combatantId === combatant.battleCombatantId;
  const active = activeActorId === combatant.battleCombatantId;
  const effective = getEffectiveBattleStats(combatant);
  return (
    <article className={`${styles.combatantCard} ${combatant.sideId === "enemy" ? styles.enemyCard : styles.playerCard} ${selected ? styles.selectedTarget : ""} ${active ? styles.activeActor : ""} ${combatant.isFainted ? styles.fainted : ""}`}>
      <div className={styles.combatantTop}>
        <div className={styles.portraitFrame} data-ui-fixed-size="true">
          <img src={portraitPath || FALLBACK_PORTRAIT} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_PORTRAIT; }} />
        </div>
        <div className={styles.combatantIdentity}>
          <span>{combatant.sideId === "enemy" ? "Opponent" : `Team Slot ${combatant.slotIndex + 1}`}</span>
          <strong>{combatant.name}</strong>
          <em>Lv. {combatant.level} · SPD {effective.speed}</em>
        </div>
      </div>
      <Meter value={combatant.currentHp} max={combatant.maxHp} label="HP" tone="hp" />
      <Meter value={combatant.currentBattleEnergy} max={combatant.maxBattleEnergy} label="BE" tone="energy" />
      <p className={styles.statusLine}>{statusLabel(combatant)}</p>
      {queuedAction ? <p className={styles.queuedLine}>Queued: {getBattleMove(queuedAction.moveId).name}</p> : null}
      <div className={styles.cardActions}>
        <button type="button" onClick={onTarget} disabled={combatant.isFainted}>{selected ? "Target Selected" : "Select Target"}</button>
        {onPlan ? <button type="button" className={styles.secondaryButton} onClick={onPlan} disabled={combatant.isFainted}>{active ? "Planning" : queuedAction ? "Edit Action" : "Plan Action"}</button> : null}
      </div>
    </article>
  );
}

function TeamSelectionCard({
  creature,
  selected,
  unavailableReason,
  onToggle,
}: {
  creature: CreatureRecord;
  selected: boolean;
  unavailableReason: string | null;
  onToggle: () => void;
}) {
  const variant = getVariantDefinition(creature.variantId);
  return (
    <button type="button" className={`${styles.rosterCard} ${selected ? styles.rosterSelected : ""}`} onClick={onToggle} disabled={Boolean(unavailableReason)}>
      <span className={styles.rosterPortrait} data-ui-fixed-size="true"><img src={creature.portraitPath || FALLBACK_PORTRAIT} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_PORTRAIT; }} /></span>
      <span className={styles.rosterInfo}>
        <strong>{creature.nickname}</strong>
        <em>Lv. {creature.level} · {variant.name}</em>
        <small>{unavailableReason ?? (selected ? "Selected for the 3v3 team" : "Available")}</small>
      </span>
      <span className={styles.selectionMark}>{selected ? "✓" : "+"}</span>
    </button>
  );
}

export function BattleArenaScreen() {
  const { currentSave, goToBattleOutfitter, goToTown } = useGameContext();
  const [phase, setPhase] = useState<BattleUiPhase>("team-selection");
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<CreatureId[]>([]);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [playerSources, setPlayerSources] = useState<CreatureRecord[]>([]);
  const [enemySources, setEnemySources] = useState<CreatureRecord[]>([]);
  const [queuedActions, setQueuedActions] = useState<Map<BattleCombatantId, BattleAction>>(new Map());
  const [activeActorId, setActiveActorId] = useState<BattleCombatantId | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<BattleUiTarget | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<BattleAiDifficulty>("tactical");
  const [message, setMessage] = useState("Choose exactly three available creatures for a target-first exhibition match.");

  const roster = currentSave?.creatures ?? [];
  const availableRoster = useMemo(() => currentSave ? roster.filter((creature) => !getUnavailableReason(currentSave, creature)) : [], [currentSave, roster]);
  const effectiveSelection = selectedCreatureIds.length ? selectedCreatureIds : availableRoster.slice(0, 3).map((creature) => creature.creatureId);

  if (!currentSave) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load a save before entering the Coliseum exhibition arena.</p><button type="button" onClick={goToTown}>Return to Town</button></section></main>;
  }

  const sourceById = new Map<string, CreatureRecord>([...playerSources, ...enemySources].map((creature) => [String(creature.creatureId), creature]));
  const livingPlayerIds = battleState?.teams.player.combatantIds.filter((id) => !battleState.combatants[id].isFainted) ?? [];
  const activeActor = battleState && activeActorId ? battleState.combatants[activeActorId] : null;
  const moveOptions = battleState && activeActorId ? getBattleUiMoveOptions(battleState, activeActorId, selectedTarget) : [];
  const compatibleMoves = moveOptions.filter((option) => option.compatible);
  const allPlayerActionsQueued = Boolean(battleState) && livingPlayerIds.length > 0 && livingPlayerIds.every((id) => queuedActions.has(id));

  function toggleCreature(creature: CreatureRecord) {
    const unavailableReason = getUnavailableReason(currentSave, creature);
    if (unavailableReason) {
      setMessage(unavailableReason);
      return;
    }
    const selected = effectiveSelection.includes(creature.creatureId);
    if (selected) {
      setSelectedCreatureIds(effectiveSelection.filter((id) => id !== creature.creatureId));
      return;
    }
    if (effectiveSelection.length >= 3) {
      setMessage("A 3v3 team can contain exactly three creatures. Remove one before adding another.");
      return;
    }
    setSelectedCreatureIds([...effectiveSelection, creature.creatureId]);
  }

  function startBattle() {
    const team = effectiveSelection.map((id) => roster.find((creature) => creature.creatureId === id)).filter((creature): creature is CreatureRecord => Boolean(creature));
    if (team.length !== 3) {
      setMessage("Select exactly three available creatures before starting the match.");
      return;
    }
    const enemies = [...team].reverse().map(makeEnemyCreature);
    const state = createBattleState({
      battleId: `coliseum_exhibition_${currentSave.saveId}_${currentSave.dayState.dayNumber}_${aiDifficulty}_${team.map((creature) => creature.creatureId).join("_")}`,
      playerCreatures: team,
      enemyCreatures: enemies,
      playerTeamName: `${currentSave.player.name}'s Ranch Team`,
      enemyTeamName: `${getBattleAiDifficultyLabel(aiDifficulty)} Echo Team`,
    });
    const queue = new Map<BattleCombatantId, BattleAction>();
    setPlayerSources(team);
    setEnemySources(enemies);
    setBattleState(state);
    setQueuedActions(queue);
    setActiveActorId(getNextUnqueuedPlayerActorId(state, queue));
    setSelectedTarget(null);
    setPhase("battle");
    setMessage(`Select a target, then choose one compatible move. The ${getBattleAiDifficultyLabel(aiDifficulty)} AI plans only after your queue is confirmed.`);
  }

  function chooseMove(moveId: string) {
    if (!battleState || !activeActorId || !selectedTarget) return;
    const action = buildBattleUiAction(battleState, activeActorId, moveId, selectedTarget);
    if (!action) {
      setMessage("That move cannot be used on the selected target right now.");
      return;
    }
    const nextQueue = new Map(queuedActions);
    nextQueue.set(activeActorId, action);
    const nextActor = getNextUnqueuedPlayerActorId(battleState, nextQueue, activeActorId);
    setQueuedActions(nextQueue);
    setActiveActorId(nextActor);
    setSelectedTarget(null);
    setMessage(nextActor ? `Action queued. Select a target for ${battleState.combatants[nextActor].name}.` : "All player actions are queued. Review them, then confirm the round.");
  }

  function planFor(actorId: BattleCombatantId) {
    if (!battleState || battleState.combatants[actorId]?.isFainted) return;
    setActiveActorId(actorId);
    setSelectedTarget(null);
    setMessage(`Planning ${battleState.combatants[actorId].name}'s action. Select a target first.`);
  }

  function clearQueuedAction(actorId: BattleCombatantId) {
    if (!battleState) return;
    const nextQueue = new Map(queuedActions);
    nextQueue.delete(actorId);
    setQueuedActions(nextQueue);
    setActiveActorId(actorId);
    setSelectedTarget(null);
    setMessage(`Choose a replacement action for ${battleState.combatants[actorId].name}.`);
  }

  function resolveRound() {
    if (!battleState || !allPlayerActionsQueued) {
      setMessage("Queue one action for every living player creature before confirming the round.");
      return;
    }
    const aiPlan = buildBattleAiPlan(battleState, "enemy", aiDifficulty);
    const stateWithAiPlan: BattleState = {
      ...battleState,
      log: [...battleState.log, ...aiPlan.decisions.map(formatBattleAiDecision)],
    };
    const resolved = resolveBattleRound(stateWithAiPlan, [
      ...Array.from(queuedActions.values()),
      ...aiPlan.actions,
    ]);
    const nextQueue = new Map<BattleCombatantId, BattleAction>();
    setBattleState(resolved.state);
    setQueuedActions(nextQueue);
    setSelectedTarget(null);
    if (resolved.state.outcome !== "ongoing") {
      setActiveActorId(null);
      setPhase("result");
      setMessage(resolved.state.outcome === "player_won" ? "Exhibition victory." : resolved.state.outcome === "enemy_won" ? `The ${getBattleAiDifficultyLabel(aiDifficulty)} Echo Team won the exhibition.` : "The exhibition ended in a draw.");
      return;
    }
    const nextActor = getNextUnqueuedPlayerActorId(resolved.state, nextQueue);
    setActiveActorId(nextActor);
    setMessage(`Round ${resolved.result.roundNumber} resolved against ${getBattleAiDifficultyLabel(aiDifficulty)} AI. Select a target for ${nextActor ? resolved.state.combatants[nextActor].name : "your next creature"}.`);
  }

  function resetToSelection() {
    setPhase("team-selection");
    setBattleState(null);
    setQueuedActions(new Map());
    setActiveActorId(null);
    setSelectedTarget(null);
    setMessage("Choose exactly three available creatures for another exhibition match.");
  }

  if (phase === "team-selection") {
    return (
      <main className={styles.screen}>
        <section className={styles.frame}>
          <header className={styles.header}>
            <div><p className={styles.kicker}>Coliseum Exhibition</p><h1>Build Your 3v3 Team</h1><p>{message}</p></div>
            <div className={styles.headerActions}><button type="button" className={styles.secondaryButton} onClick={goToBattleOutfitter}>Battle Outfitter</button><button type="button" onClick={goToTown}>Town</button></div>
          </header>
          <section className={styles.selectionSummary} data-ui-text-box="auto">
            <div><span>Selected</span><strong>{effectiveSelection.length} / 3</strong></div>
            <div><span>Format</span><strong>3 Active vs. 3 Active</strong></div>
            <div>
              <span>Opponent AI</span>
              <select value={aiDifficulty} onChange={(event) => setAiDifficulty(event.target.value as BattleAiDifficulty)} aria-label="Opponent AI difficulty">
                <option value="basic">Basic</option>
                <option value="tactical">Tactical</option>
                <option value="champion">Champion</option>
              </select>
              <small>{getBattleAiDifficultyDescription(aiDifficulty)}</small>
            </div>
          </section>
          <section className={styles.rosterGrid}>{roster.map((creature) => <TeamSelectionCard key={creature.creatureId} creature={creature} selected={effectiveSelection.includes(creature.creatureId)} unavailableReason={getUnavailableReason(currentSave, creature)} onToggle={() => toggleCreature(creature)} />)}</section>
          <footer className={styles.selectionFooter}><p>This M4 exhibition uses persistent moves and deterministic enemy AI but still grants no rewards or persistent battle consequences.</p><button type="button" onClick={startBattle} disabled={effectiveSelection.length !== 3}>Enter Exhibition</button></footer>
        </section>
      </main>
    );
  }

  if (!battleState) return null;
  const combatants = Object.values(battleState.combatants).sort((left, right) => left.sideId.localeCompare(right.sideId) || left.slotIndex - right.slotIndex);
  const enemies = combatants.filter((combatant) => combatant.sideId === "enemy");
  const players = combatants.filter((combatant) => combatant.sideId === "player");
  const recentLog = battleState.log.slice(-22);

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div><p className={styles.kicker}>Target-First 3v3 Exhibition · {getBattleAiDifficultyLabel(aiDifficulty)} AI</p><h1>{phase === "result" ? "Match Complete" : `Round ${battleState.roundNumber}`}</h1><p>{message}</p></div>
          <div className={styles.headerActions}><button type="button" className={styles.secondaryButton} onClick={resetToSelection}>Change Team</button><button type="button" onClick={goToTown}>Leave Arena</button></div>
        </header>

        <section className={styles.battlefield}>
          <div className={styles.teamSection}><div className={styles.teamHeading}><span>Enemy Team · {getBattleAiDifficultyLabel(aiDifficulty)} AI</span><strong>{battleState.teams.enemy.name}</strong></div><div className={styles.teamGrid}>{enemies.map((combatant) => <CombatantCard key={combatant.battleCombatantId} combatant={combatant} portraitPath={sourceById.get(String(combatant.sourceCreatureId))?.portraitPath} selectedTarget={selectedTarget} activeActorId={activeActorId} queuedAction={queuedActions.get(combatant.battleCombatantId)} onTarget={() => setSelectedTarget({ kind: "combatant", combatantId: combatant.battleCombatantId })} />)}</div></div>
          <div className={styles.arenaDivider}><span>VS</span><button type="button" className={selectedTarget?.kind === "field" ? styles.fieldSelected : undefined} onClick={() => setSelectedTarget({ kind: "field" })}>Select Field</button></div>
          <div className={styles.teamSection}><div className={styles.teamHeading}><span>Player Team</span><strong>{battleState.teams.player.name}</strong></div><div className={styles.teamGrid}>{players.map((combatant) => <CombatantCard key={combatant.battleCombatantId} combatant={combatant} portraitPath={sourceById.get(String(combatant.sourceCreatureId))?.portraitPath} selectedTarget={selectedTarget} activeActorId={activeActorId} queuedAction={queuedActions.get(combatant.battleCombatantId)} onTarget={() => setSelectedTarget({ kind: "combatant", combatantId: combatant.battleCombatantId })} onPlan={() => planFor(combatant.battleCombatantId)} />)}</div></div>
        </section>

        <section className={styles.commandDeck}>
          <div className={styles.actionPanel}>
            <div className={styles.panelHeading}><div><span>Current Actor</span><strong>{activeActor?.name ?? (phase === "result" ? "Battle Complete" : "All Actions Queued")}</strong></div><div><span>Selected Target</span><strong>{selectedTarget?.kind === "field" ? "Battlefield" : selectedTarget?.kind === "combatant" ? battleState.combatants[selectedTarget.combatantId]?.name ?? "Unknown" : "Choose a target"}</strong></div></div>
            {phase === "result" ? <div className={styles.resultPanel}><h2>{battleState.outcome === "player_won" ? "Victory" : battleState.outcome === "enemy_won" ? "Defeat" : "Draw"}</h2><p>This preview match grants no rewards or persistent consequences.</p><button type="button" onClick={resetToSelection}>Start Another Exhibition</button></div> : selectedTarget && activeActor ? <div className={styles.moveGrid}>{compatibleMoves.length ? compatibleMoves.map((option) => <button key={option.move.id} type="button" className={`${styles.moveButton} ${styles[`category_${option.move.category}`]}`} onClick={() => chooseMove(option.move.id)} disabled={!option.usable}><span className={styles.moveTitle}><strong>{option.move.name}</strong><em>{option.move.category}</em></span><span className={styles.moveNumbers}>PWR {option.move.power} · ACC {option.move.accuracy}% · BE {option.move.battleEnergyCost} · CD {activeActor.cooldowns[option.move.id] ?? 0}/{option.move.cooldown}</span><span>{getBattleTargetTypeLabel(option.move.targetType)} · {moveEffectLabel(option.move)}</span>{option.reason ? <small>{option.reason}</small> : <small>Ready</small>}</button>) : <div className={styles.emptyMoveState}><strong>No compatible equipped moves</strong><p>Select a different target type for {activeActor.name}.</p></div>}</div> : <div className={styles.emptyMoveState}><strong>Target first</strong><p>Select a living enemy, ally, the active creature itself, or the battlefield. Compatible equipped moves will appear here.</p></div>}
          </div>

          <aside className={styles.queuePanel}>
            <div className={styles.panelHeading}><div><span>Round Queue</span><strong>{queuedActions.size} / {livingPlayerIds.length}</strong></div></div>
            <div className={styles.queueList}>{players.filter((combatant) => !combatant.isFainted).map((combatant) => { const action = queuedActions.get(combatant.battleCombatantId); return <div key={combatant.battleCombatantId} className={styles.queueEntry}><div><strong>{combatant.name}</strong><span>{action ? `${getBattleMove(action.moveId).name} → ${action.targetIds.length ? action.targetIds.map((id) => battleState.combatants[id]?.name ?? "Unknown").join(", ") : "Field"}` : "Action not queued"}</span></div>{action ? <button type="button" onClick={() => clearQueuedAction(combatant.battleCombatantId)}>Edit</button> : <button type="button" onClick={() => planFor(combatant.battleCombatantId)}>Plan</button>}</div>; })}</div>
            <p className={styles.statusLine}>Enemy actions remain hidden until the round resolves. {getBattleAiDifficultyDescription(aiDifficulty)}</p>
            <button type="button" className={styles.confirmButton} onClick={resolveRound} disabled={!allPlayerActionsQueued || phase === "result"}>Confirm Round</button>
          </aside>

          <aside className={styles.logPanel}><div className={styles.panelHeading}><div><span>Battle Log</span><strong>Latest Events</strong></div></div><div className={styles.logList}>{recentLog.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}</div></aside>
        </section>
      </section>
    </main>
  );
}
