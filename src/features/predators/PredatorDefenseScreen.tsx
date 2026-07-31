"use client";

import { useMemo, useState } from "react";
import {
  buildBattleAiPlan,
  formatBattleAiDecision,
  getBattleAiDifficultyDescription,
  getBattleAiDifficultyLabel,
} from "@/data/battleAi";
import { createBattleState, resolveBattleRound } from "@/data/battleEngine";
import { buildBattlePresentationEvents } from "@/data/battlePresentation";
import { applyBattleOutfitterLoadouts } from "@/data/battleOutfitterIntegration";
import {
  buildBattleUiAction,
  getBattleUiMoveOptions,
  getNextUnqueuedPlayerActorId,
  type BattleUiTarget,
} from "@/data/battleUi";
import { getVariantDefinition } from "@/data/creatures";
import {
  applyPredatorBattleOpening,
  buildPredatorEnemyTeam,
  getPendingPredatorEvent,
  getPredatorEncounterDefinition,
  recordPredatorBattleOutcome,
} from "@/data/predatorEvents";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { BattleLogButton, BattleMoveGrid } from "@/features/battle/BattleCommandDialogs";
import { BattlePortraitStage } from "@/features/battle/BattlePortraitStage";
import { useBattlePresentationController } from "@/features/battle/useBattlePresentationController";
import { useGameContext } from "@/state/GameProvider";
import type {
  BattleAction,
  BattleCombatantId,
  BattleOutcome,
  BattleState,
} from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import battleStyles from "@/features/battle/BattleArenaScreen.module.css";
import styles from "./PredatorDefenseScreen.module.css";

const FALLBACK_PORTRAIT = "/images/ui/icons/icon_paw_crest.png";

type DefensePhase = "briefing" | "team-selection" | "battle" | "result";

function outcomeLabel(outcome: BattleOutcome | undefined): string {
  if (outcome === "player_won") return "Ranch Secured";
  if (outcome === "draw") return "Predators Withdrew";
  if (outcome === "enemy_won") return "Defense Failed";
  return "Defense Ongoing";
}

function isUnavailable(creature: CreatureRecord, dayNumber: number, trainingReason: string | null): string | null {
  if (trainingReason) return trainingReason;
  if (typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= dayNumber) {
    return `${creature.injuryLabel ?? "Injured"} until after Ranch Day ${creature.injuredUntilDayNumber}.`;
  }
  return null;
}

export function PredatorDefenseScreen() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [phase, setPhase] = useState<DefensePhase>("briefing");
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<CreatureId[]>([]);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [playerSources, setPlayerSources] = useState<CreatureRecord[]>([]);
  const [enemySources, setEnemySources] = useState<CreatureRecord[]>([]);
  const [queuedActions, setQueuedActions] = useState<Map<BattleCombatantId, BattleAction>>(new Map());
  const [activeActorId, setActiveActorId] = useState<BattleCombatantId | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<BattleUiTarget | null>(null);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("Review the overnight report, then choose three defenders.");
  const presentation = useBattlePresentationController();

  const event = currentSave ? getPendingPredatorEvent(currentSave) : null;
  const encounter = useMemo(
    () => currentSave && event ? getPredatorEncounterDefinition(currentSave, event) : null,
    [currentSave, event],
  );
  const roster = currentSave?.creatures ?? [];
  const availableRoster = useMemo(() => currentSave
    ? roster.filter((creature) => !isUnavailable(
      creature,
      currentSave.dayState.dayNumber,
      getTrainingUnavailableReason(currentSave, creature.creatureId),
    ))
    : [], [currentSave, roster]);
  const effectiveSelection = selectedCreatureIds.length
    ? selectedCreatureIds
    : availableRoster.slice(0, 3).map((creature) => creature.creatureId);

  if (!currentSave || !event || !encounter) return null;
  const activeSave = currentSave;
  const activeEvent = event;
  const activeEncounter = encounter;
  const sourceById = new Map<string, CreatureRecord>(
    [...playerSources, ...enemySources].map((creature) => [String(creature.creatureId), creature]),
  );
  const livingPlayerIds = battleState?.teams.player.combatantIds.filter((id) => !battleState.combatants[id].isFainted) ?? [];
  const activeActor = battleState && activeActorId ? battleState.combatants[activeActorId] : null;
  const moveOptions = battleState && activeActorId ? getBattleUiMoveOptions(battleState, activeActorId, selectedTarget) : [];
  const compatibleMoves = moveOptions.filter((option) => option.compatible);
  const allPlayerActionsQueued = Boolean(battleState) && livingPlayerIds.length > 0 && livingPlayerIds.every((id) => queuedActions.has(id));

  function toggleCreature(creature: CreatureRecord) {
    const unavailable = isUnavailable(creature, activeSave.dayState.dayNumber, getTrainingUnavailableReason(activeSave, creature.creatureId));
    if (unavailable) {
      setMessage(unavailable);
      return;
    }
    if (effectiveSelection.includes(creature.creatureId)) {
      setSelectedCreatureIds(effectiveSelection.filter((id) => id !== creature.creatureId));
      return;
    }
    if (effectiveSelection.length >= 3) {
      setMessage("A ranch-defense team contains exactly three creatures. Remove one defender first.");
      return;
    }
    setSelectedCreatureIds([...effectiveSelection, creature.creatureId]);
  }

  function startBattle() {
    const team = effectiveSelection
      .map((id) => roster.find((creature) => creature.creatureId === id))
      .filter((creature): creature is CreatureRecord => Boolean(creature));
    if (team.length !== 3) {
      setMessage("Select exactly three available defenders before confronting the predators.");
      return;
    }
    const enemies = buildPredatorEnemyTeam(activeSave, activeEvent);
    const created = createBattleState({
      battleId: activeEvent.eventId,
      playerCreatures: team,
      enemyCreatures: enemies,
      playerTeamName: `${activeSave.player.name}'s Ranch Defenders`,
      enemyTeamName: activeEvent.predatorName,
    });
    const prepared = applyPredatorBattleOpening(
      applyBattleOutfitterLoadouts(activeSave, created),
      activeEvent,
    );
    const queue = new Map<BattleCombatantId, BattleAction>();
    setPlayerSources(team);
    setEnemySources(enemies);
    setBattleState(prepared);
    setQueuedActions(queue);
    setActiveActorId(getNextUnqueuedPlayerActorId(prepared, queue));
    setSelectedTarget(null);
    setCompletedRounds(0);
    setPhase("battle");
    setMessage(activeEvent.intercepted
      ? `The patrol wounded the attackers. They begin at ${activeEvent.startingHpPercent}% HP.`
      : "The predators reached the ranch at full strength. Select a target first.");
  }

  function chooseMove(moveId: string) {
    if (presentation.isPlaying || !battleState || !activeActorId || !selectedTarget) return;
    const action = buildBattleUiAction(battleState, activeActorId, moveId, selectedTarget);
    if (!action) {
      setMessage("That move cannot be used on the selected target.");
      return;
    }
    const nextQueue = new Map(queuedActions);
    nextQueue.set(activeActorId, action);
    const nextActor = getNextUnqueuedPlayerActorId(battleState, nextQueue, activeActorId);
    setQueuedActions(nextQueue);
    setActiveActorId(nextActor);
    setSelectedTarget(null);
    setMessage(nextActor
      ? `Action queued. Select a target for ${battleState.combatants[nextActor].name}.`
      : "All ranch actions are queued. Confirm the round when ready.");
  }

  function planFor(actorId: BattleCombatantId) {
    if (presentation.isPlaying || !battleState || battleState.combatants[actorId]?.isFainted) return;
    setActiveActorId(actorId);
    setSelectedTarget(null);
    setMessage(`Planning ${battleState.combatants[actorId].name}'s action. Select a target first.`);
  }

  function resolveRound() {
    if (presentation.isPlaying || !battleState || !allPlayerActionsQueued) {
      setMessage("Queue one action for every living ranch defender.");
      return;
    }
    const aiPlan = buildBattleAiPlan(battleState, "enemy", activeEncounter.aiDifficulty);
    const withAiLog: BattleState = {
      ...battleState,
      log: [...battleState.log, ...aiPlan.decisions.map(formatBattleAiDecision)],
    };
    const resolved = resolveBattleRound(withAiLog, [...Array.from(queuedActions.values()), ...aiPlan.actions]);
    presentation.play(buildBattlePresentationEvents(battleState, resolved.state, resolved.result));
    const nextQueue = new Map<BattleCombatantId, BattleAction>();
    setBattleState(resolved.state);
    setQueuedActions(nextQueue);
    setSelectedTarget(null);
    setCompletedRounds(resolved.result.roundNumber);
    if (resolved.state.outcome !== "ongoing") {
      setActiveActorId(null);
      setPhase("result");
      setMessage(`${outcomeLabel(resolved.state.outcome)} after ${resolved.result.roundNumber} rounds. Record the outcome to continue the ranch day.`);
      return;
    }
    const nextActor = getNextUnqueuedPlayerActorId(resolved.state, nextQueue);
    setActiveActorId(nextActor);
    setMessage(`Round ${resolved.result.roundNumber} resolved. Select a target for ${nextActor ? resolved.state.combatants[nextActor].name : "your next defender"}.`);
  }

  function recordOutcome(outcome?: BattleOutcome) {
    if (recording) return;
    setRecording(true);
    const finalOutcome = outcome ?? battleState?.outcome ?? "enemy_won";
    const rounds = completedRounds || Math.max(1, (battleState?.roundNumber ?? 1) - 1);
    const teamIds = playerSources.length
      ? playerSources.map((creature) => creature.creatureId)
      : effectiveSelection.slice(0, 3);
    const result = recordPredatorBattleOutcome(activeSave, activeEvent.eventId, finalOutcome, rounds, teamIds);
    if (!result.duplicate) saveCurrentGame(result.save);
    else setRecording(false);
  }

  if (phase === "briefing") {
    return (
      <main className={`${battleStyles.screen} ${styles.screen}`}>
        <section className={`${battleStyles.frame} ${styles.briefingFrame}`}>
          <article className={styles.briefingCard}>
            <img src={activeEvent.imagePath} alt="Predators at the ranch perimeter" />
            <div>
              <p className={battleStyles.kicker}>Overnight Ranch Incident</p>
              <h1>{activeEvent.intercepted ? "Predators Intercepted" : "Ranch Perimeter Breached"}</h1>
              <h2>{activeEvent.predatorName}</h2>
              <p>{activeEvent.summary}</p>
              <div className={styles.threatGrid}>
                <div><span>Threat</span><strong>{activeEvent.tier}</strong></div>
                <div><span>Pressure</span><strong>{activeEvent.pressure}</strong></div>
                <div><span>Security</span><strong>{activeEvent.security}/{activeEvent.requiredSecurity}</strong></div>
                <div><span>Enemy Start</span><strong>{activeEvent.startingHpPercent}% HP</strong></div>
              </div>
              {activeEvent.reasons.length ? <ul>{activeEvent.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}
              <div className={styles.outcomePreview}>
                <section><span>Victory</span>{activeEvent.rewardPreview.map((item) => <strong key={item}>{item}</strong>)}</section>
                <section><span>Defeat</span>{activeEvent.penaltyPreview.map((item) => <strong key={item}>{item}</strong>)}</section>
              </div>
              <div className={styles.briefingActions}>
                <button type="button" className={battleStyles.secondaryButton} onClick={() => recordOutcome("enemy_won")}>Accept Breach Consequences</button>
                <button type="button" onClick={() => setPhase("team-selection")}>Assemble Ranch Defenders</button>
              </div>
            </div>
          </article>
        </section>
      </main>
    );
  }

  if (phase === "team-selection") {
    return (
      <main className={`${battleStyles.screen} ${styles.screen}`}>
        <section className={battleStyles.frame}>
          <header className={battleStyles.header}>
            <div><p className={battleStyles.kicker}>Ranch Defense</p><h1>{activeEvent.predatorName}</h1><p>{message}</p></div>
            <div className={battleStyles.headerActions}><button type="button" className={battleStyles.secondaryButton} onClick={() => setPhase("briefing")}>Incident Report</button><button type="button" onClick={() => recordOutcome("enemy_won")}>Accept Breach</button></div>
          </header>
          <section className={battleStyles.selectionSummary}>
            <div><span>Selected</span><strong>{effectiveSelection.length} / 3</strong></div>
            <div><span>Security Result</span><strong>{activeEvent.intercepted ? "Intercepted" : "Breached"}</strong><small>Enemies start at {activeEvent.startingHpPercent}% HP</small></div>
            <div><span>Predators</span><strong>{activeEvent.predatorName}</strong><small>{activeEncounter.strategyLabel}</small></div>
            <div><span>AI</span><strong>{getBattleAiDifficultyLabel(activeEncounter.aiDifficulty)}</strong><small>{getBattleAiDifficultyDescription(activeEncounter.aiDifficulty)}</small></div>
          </section>
          <section className={battleStyles.rosterGrid}>
            {roster.map((creature) => {
              const variant = getVariantDefinition(creature.variantId);
              const unavailable = isUnavailable(creature, activeSave.dayState.dayNumber, getTrainingUnavailableReason(activeSave, creature.creatureId));
              const selected = effectiveSelection.includes(creature.creatureId);
              return (
                <button key={creature.creatureId} type="button" className={`${battleStyles.rosterCard} ${selected ? battleStyles.rosterSelected : ""}`} disabled={Boolean(unavailable)} onClick={() => toggleCreature(creature)}>
                  <span className={battleStyles.rosterPortrait}><img src={variant.portraitPath || FALLBACK_PORTRAIT} alt="" onError={(e) => { e.currentTarget.src = FALLBACK_PORTRAIT; }} /></span>
                  <span className={battleStyles.rosterInfo}><strong>{creature.nickname}</strong><em>Lv. {creature.level} · {variant.name}</em><small>{unavailable ?? (selected ? "Selected to defend the ranch" : "Available")}</small></span>
                  <span className={battleStyles.selectionMark}>{selected ? "✓" : "+"}</span>
                </button>
              );
            })}
          </section>
          <footer className={battleStyles.selectionFooter}><p>The incident is already recorded. Reloading cannot reroll the predators or security result.</p><button type="button" onClick={startBattle} disabled={effectiveSelection.length !== 3}>Begin Ranch Defense</button></footer>
        </section>
      </main>
    );
  }

  if (!battleState) return null;

  return (
    <main className={`${battleStyles.screen} ${styles.screen}`}>
      <section className={battleStyles.frame}>
        <header className={`${battleStyles.header} ${battleStyles.battleHeader}`}>
          <div><p className={battleStyles.kicker}>Ranch Defense · {getBattleAiDifficultyLabel(activeEncounter.aiDifficulty)} AI</p><h1>{phase === "result" ? outcomeLabel(battleState.outcome) : `Round ${battleState.roundNumber}`}</h1><p title={message}>{message}</p></div>
          <div className={battleStyles.headerActions}><button type="button" className={battleStyles.secondaryButton} onClick={() => recordOutcome("enemy_won")} disabled={recording}>Retreat & Accept Breach</button></div>
        </header>

        <BattlePortraitStage
          battleState={battleState}
          sourceById={sourceById}
          selectedTarget={selectedTarget}
          activeActorId={activeActorId}
          queuedActions={queuedActions}
          activeEvent={presentation.activeEvent}
          isResolving={presentation.isPlaying}
          queuedEventCount={presentation.queuedEventCount}
          speed={presentation.speed}
          reducedMotion={presentation.reducedMotion}
          onSpeedChange={presentation.setSpeed}
          onReducedMotionChange={presentation.setReducedMotion}
          onTarget={(combatantId) => setSelectedTarget({ kind: "combatant", combatantId })}
          onPlan={planFor}
          onFieldTarget={() => setSelectedTarget({ kind: "field" })}
        />

        <section className={battleStyles.commandDeck}>
          <div className={battleStyles.actionPanel}>
            <div className={battleStyles.panelHeading}><div><span>Current Defender</span><strong>{activeActor?.name ?? (phase === "result" ? "Defense Complete" : "All Actions Queued")}</strong></div><div><span>Selected Target</span><strong>{selectedTarget?.kind === "field" ? "Battlefield" : selectedTarget?.kind === "combatant" ? battleState.combatants[selectedTarget.combatantId]?.name ?? "Unknown" : "Choose a target"}</strong></div></div>
            {phase === "result" ? (
              <div className={battleStyles.resultPanel}>
                <h2>{outcomeLabel(battleState.outcome)}</h2>
                <p>{battleState.outcome === "player_won" ? `Rewards: ${activeEvent.rewardPreview.join(" · ")}` : `Recoverable consequences: ${activeEvent.penaltyPreview.join(" · ")}`}</p>
                <button type="button" onClick={() => recordOutcome()} disabled={recording}>{recording ? "Recording…" : "Record Defense Outcome"}</button>
              </div>
            ) : selectedTarget && activeActor ? (
              compatibleMoves.length ? <BattleMoveGrid options={compatibleMoves} actor={activeActor} onChooseMove={chooseMove} /> : <div className={battleStyles.emptyMoveState}><strong>No compatible equipped moves</strong><p>Select a different target pattern.</p></div>
            ) : <div className={battleStyles.emptyMoveState}><strong>Target first</strong><p>Select a predator, ally, or the battlefield, then choose the active defender's move.</p></div>}

            <footer className={battleStyles.actionFooter}>
              <div className={battleStyles.queueSummary}><span>Ranch Actions</span><strong>{queuedActions.size} / {livingPlayerIds.length} planned</strong><small>Click a green portrait above to plan or edit.</small></div>
              <BattleLogButton entries={battleState.log} />
              {phase !== "result" ? <button type="button" className={battleStyles.confirmButton} onClick={resolveRound} disabled={presentation.isPlaying || !allPlayerActionsQueued}>Confirm Round</button> : null}
            </footer>
          </div>
        </section>
      </section>
    </main>
  );
}
