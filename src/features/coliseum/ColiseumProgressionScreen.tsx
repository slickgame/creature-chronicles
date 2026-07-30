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
  FIELD_TONIC_ID,
  REVIVAL_SALVE_ID,
  TEAM_TACTICS_KIT_ID,
  applyBattleOutfitterLoadouts,
  applyTeamTacticsKit,
  getBattleOutfitterCombatStock,
  useFieldTonic,
  useRevivalSalve,
} from "@/data/battleOutfitterIntegration";
import { getBattleReadinessLabel } from "@/data/battleOutfitter";
import {
  buildBattleUiAction,
  getBattleTargetTypeLabel,
  getBattleUiMoveOptions,
  getNextUnqueuedPlayerActorId,
  type BattleUiTarget,
} from "@/data/battleUi";
import {
  COLISEUM_DIVISIONS,
  COLISEUM_ENCOUNTERS,
  buildColiseumEnemyTeam,
  getColiseumAccess,
  getColiseumDivision,
  getColiseumEncounterRecord,
  getColiseumHighestDivision,
  getColiseumNextEncounter,
  getColiseumProgress,
  getColiseumRewardLabel,
  recordColiseumBattleResult,
  type ColiseumEncounterDefinition,
} from "@/data/coliseum";
import { getVariantDefinition } from "@/data/creatures";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type {
  BattleAction,
  BattleCombatant,
  BattleCombatantId,
  BattleMove,
  BattleOutcome,
  BattleState,
} from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import battleStyles from "@/features/battle/BattleArenaScreen.module.css";
import styles from "./ColiseumProgressionScreen.module.css";

const FALLBACK_PORTRAIT = "/images/ui/icons/icon_paw_crest.png";
const COLISEUM_ICON = "/images/ui/icons/icon_ability_trigger.png";

type ColiseumMode = "hub" | "battle";
type BattlePhase = "team-selection" | "battle" | "result";
type UsedCombatItems = { tacticsKit: boolean; fieldTonic: boolean; revivalSalve: boolean };
const EMPTY_USED_ITEMS: UsedCombatItems = { tacticsKit: false, fieldTonic: false, revivalSalve: false };

function outcomeLabel(outcome: BattleOutcome | undefined): string {
  if (outcome === "player_won") return "Victory";
  if (outcome === "enemy_won") return "Defeat";
  if (outcome === "draw") return "Draw";
  return "Ongoing";
}

function getUnavailableReason(
  save: NonNullable<ReturnType<typeof useGameContext>["currentSave"]>,
  creature: CreatureRecord,
): string | null {
  const trainingReason = getTrainingUnavailableReason(save, creature.creatureId);
  if (trainingReason) return trainingReason;
  if (creature.injuredUntilDayNumber && creature.injuredUntilDayNumber > save.dayState.dayNumber) {
    return `Injured until Ranch Day ${creature.injuredUntilDayNumber}.`;
  }
  return null;
}

function statusLabel(combatant: BattleCombatant): string {
  if (!combatant.statuses.length) return "No status effects";
  return combatant.statuses
    .map((status) => `${status.status}${(status.stacks ?? 1) > 1 ? ` ×${status.stacks}` : ""} · ${status.duration}r`)
    .join(" • ");
}

function moveEffectLabel(move: BattleMove): string {
  return move.effects
    .map((effect) => {
      const amount = effect.amount ?? (effect.type === "damage" || effect.type === "heal" ? move.power : undefined);
      const pieces = [effect.type.replaceAll("_", " ")];
      if (amount !== undefined) pieces.push(String(amount));
      if (effect.status) pieces.push(effect.status);
      if (effect.stat) pieces.push(effect.stat);
      if (effect.chance !== undefined && effect.chance < 100) pieces.push(`${effect.chance}%`);
      if (effect.duration) pieces.push(`${effect.duration}r`);
      return pieces.join(" ");
    })
    .join(" • ");
}

function Meter({ value, max, label, tone }: { value: number; max: number; label: string; tone: "hp" | "energy" }) {
  const percent = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className={battleStyles.meterBlock}>
      <div><span>{label}</span><strong>{value}/{max}</strong></div>
      <div className={battleStyles.meterTrack}>
        <span className={tone === "hp" ? battleStyles.hpFill : battleStyles.energyFill} style={{ width: `${percent}%` }} />
      </div>
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
  const canSelect = !combatant.isFainted || combatant.sideId === "player";
  return (
    <article className={`${battleStyles.combatantCard} ${combatant.sideId === "enemy" ? battleStyles.enemyCard : battleStyles.playerCard} ${selected ? battleStyles.selectedTarget : ""} ${active ? battleStyles.activeActor : ""} ${combatant.isFainted ? battleStyles.fainted : ""}`}>
      <div className={battleStyles.combatantTop}>
        <div className={battleStyles.portraitFrame} data-ui-fixed-size="true">
          <img src={portraitPath || FALLBACK_PORTRAIT} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_PORTRAIT; }} />
        </div>
        <div className={battleStyles.combatantIdentity}>
          <span>{combatant.sideId === "enemy" ? "Opponent" : `Team Slot ${combatant.slotIndex + 1}`}</span>
          <strong>{combatant.name}</strong>
          <em>Lv. {combatant.level} · SPD {effective.speed}</em>
        </div>
      </div>
      <Meter value={combatant.currentHp} max={combatant.maxHp} label="HP" tone="hp" />
      <Meter value={combatant.currentBattleEnergy} max={combatant.maxBattleEnergy} label="BE" tone="energy" />
      <p className={battleStyles.statusLine}>{statusLabel(combatant)}</p>
      {queuedAction ? <p className={battleStyles.queuedLine}>Queued: {getBattleMove(queuedAction.moveId).name}</p> : null}
      <div className={battleStyles.cardActions}>
        <button type="button" onClick={onTarget} disabled={!canSelect}>
          {selected ? "Target Selected" : combatant.isFainted ? "Select for Revival" : "Select Target"}
        </button>
        {onPlan ? <button type="button" className={battleStyles.secondaryButton} onClick={onPlan} disabled={combatant.isFainted}>{active ? "Planning" : queuedAction ? "Edit Action" : "Plan Action"}</button> : null}
      </div>
    </article>
  );
}

function TeamSelectionCard({
  creature,
  selected,
  unavailableReason,
  readinessLabel,
  onToggle,
}: {
  creature: CreatureRecord;
  selected: boolean;
  unavailableReason: string | null;
  readinessLabel: string;
  onToggle: () => void;
}) {
  const variant = getVariantDefinition(creature.variantId);
  return (
    <button type="button" className={`${battleStyles.rosterCard} ${selected ? battleStyles.rosterSelected : ""}`} onClick={onToggle} disabled={Boolean(unavailableReason)}>
      <span className={battleStyles.rosterPortrait} data-ui-fixed-size="true"><img src={creature.portraitPath || variant.portraitPath || FALLBACK_PORTRAIT} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_PORTRAIT; }} /></span>
      <span className={battleStyles.rosterInfo}>
        <strong>{creature.nickname}</strong>
        <em>Lv. {creature.level} · {variant.name}</em>
        <small>{unavailableReason ?? (selected ? "Selected for this bracket" : "Available")}</small>
        <small>{readinessLabel}</small>
      </span>
      <span className={battleStyles.selectionMark}>{selected ? "✓" : "+"}</span>
    </button>
  );
}

export function ColiseumProgressionScreen() {
  const { currentSave, goToBattleOutfitter, goToMainMenu, goToTown, saveCurrentGame } = useGameContext();
  const [mode, setMode] = useState<ColiseumMode>("hub");
  const [selectedEncounter, setSelectedEncounter] = useState<ColiseumEncounterDefinition | null>(null);
  const [message, setMessage] = useState("Choose an unlocked division. Victories now create permanent records and rewards.");

  if (!currentSave) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load a save before entering the Coliseum.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;
  }

  const save = currentSave;

  function openEncounter(encounter: ColiseumEncounterDefinition) {
    const access = getColiseumAccess(save, encounter);
    if (!access.unlocked) {
      setMessage(access.reason);
      return;
    }
    setSelectedEncounter(encounter);
    setMode("battle");
  }

  function finishBattle(outcome: BattleOutcome, rounds: number, teamCreatureIds: CreatureId[]) {
    if (!selectedEncounter) return;
    const result = recordColiseumBattleResult(save, selectedEncounter.encounterId, outcome, rounds, teamCreatureIds);
    saveCurrentGame(result.save);
    setMessage(result.message);
    setSelectedEncounter(null);
    setMode("hub");
  }

  if (mode === "battle" && selectedEncounter) {
    return (
      <ColiseumBattle
        encounter={selectedEncounter}
        onComplete={finishBattle}
        onReturn={() => { setSelectedEncounter(null); setMode("hub"); setMessage("Battle entry cancelled. No record or reward was created."); }}
      />
    );
  }

  const progress = getColiseumProgress(save);
  const nextEncounter = getColiseumNextEncounter(save);
  const highestDivision = getColiseumHighestDivision(save);
  const availableCreatures = (save.creatures ?? []).filter((creature) => !getUnavailableReason(save, creature));

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <div className={styles.crest}><img src={COLISEUM_ICON} alt="" /></div>
            <div><p className={styles.kicker}>Coliseum C1</p><h1>PvE Progression</h1><p>{message}</p></div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.resource}><span>Gold</span><strong>{formatGold(save.currencies.gold)}</strong></div>
            <div className={styles.resource}><span>Guild Points</span><strong>{formatGuildPoints(save.currencies.guildPoints)}</strong></div>
            <button type="button" onClick={goToBattleOutfitter}>Battle Outfitter</button>
            <button type="button" onClick={goToTown}>Town</button>
          </div>
        </header>

        <section className={styles.summaryGrid} data-ui-text-box="auto">
          <article><span>Current Standing</span><strong>{highestDivision.name}</strong><small>{progress.completedEncounterIds.length}/{COLISEUM_ENCOUNTERS.length} first clears</small></article>
          <article><span>Record</span><strong>{progress.totalWins}W · {progress.totalLosses}L · {progress.totalDraws}D</strong><small>{progress.totalAttempts} permanent attempts</small></article>
          <article><span>Next Objective</span><strong>{nextEncounter?.name ?? "All C1 encounters cleared"}</strong><small>{nextEncounter ? getColiseumRewardLabel(nextEncounter.firstClearReward) : "Repeat brackets remain available"}</small></article>
          <article><span>Eligible Team Pool</span><strong>{availableCreatures.length} creatures</strong><small>Three available creatures are required</small></article>
        </section>

        <section className={styles.divisionGrid}>
          {COLISEUM_DIVISIONS.map((division) => {
            const encounter = COLISEUM_ENCOUNTERS.find((entry) => entry.divisionId === division.divisionId);
            if (!encounter) return null;
            const access = getColiseumAccess(save, encounter);
            const record = getColiseumEncounterRecord(save, encounter.encounterId);
            const cleared = progress.completedEncounterIds.includes(encounter.encounterId);
            return (
              <article key={division.divisionId} className={`${styles.divisionCard} ${cleared ? styles.clearedCard : ""} ${!access.unlocked ? styles.lockedCard : ""}`}>
                <div className={styles.divisionHeading}>
                  <div><span>Division {division.order}</span><h2>{division.name}</h2><p>{division.subtitle}</p></div>
                  <strong>{cleared ? "CLEARED" : access.unlocked ? "OPEN" : "LOCKED"}</strong>
                </div>
                <p className={styles.description}>{division.description}</p>
                <section className={styles.encounterPanel}>
                  <h3>{encounter.name}</h3>
                  <p>{encounter.description}</p>
                  <div className={styles.encounterFacts}>
                    <span>{getBattleAiDifficultyLabel(encounter.aiDifficulty)} AI</span>
                    <span>Enemy Lv. {encounter.enemyLevelOffset >= 0 ? "+" : ""}{encounter.enemyLevelOffset}</span>
                    <span>Recommended Lv. {encounter.recommendedLevel}+</span>
                  </div>
                  <div className={styles.rewardGrid}>
                    <div><span>First Clear</span><strong>{getColiseumRewardLabel(encounter.firstClearReward)}</strong></div>
                    <div><span>Repeat Win</span><strong>{getColiseumRewardLabel(encounter.repeatReward)}</strong></div>
                  </div>
                  <div className={styles.recordLine}>
                    <span>{record.wins}W · {record.losses}L · {record.draws}D</span>
                    <span>{record.bestWinRounds ? `Best: ${record.bestWinRounds} rounds` : "No victory yet"}</span>
                  </div>
                  {!access.unlocked ? <p className={styles.lockReason}>{access.reason}</p> : null}
                  <button type="button" onClick={() => openEncounter(encounter)} disabled={!access.unlocked || availableCreatures.length < 3}>
                    {cleared ? "Enter Repeat Match" : "Enter First-Clear Match"}
                  </button>
                </section>
              </article>
            );
          })}
        </section>

        <section className={styles.historyPanel}>
          <header><div><p className={styles.kicker}>Permanent Records</p><h2>Recent Coliseum History</h2></div><span>Latest {Math.min(progress.history.length, 25)} results</span></header>
          {progress.history.length > 0 ? (
            <div className={styles.historyList}>
              {progress.history.map((entry) => (
                <article key={entry.historyId}>
                  <div><strong>{entry.encounterName}</strong><span>{getColiseumDivision(entry.divisionId).name} · Ranch Day {entry.completedAtDayNumber}</span></div>
                  <div><strong>{outcomeLabel(entry.outcome)}</strong><span>{entry.roundCount} rounds</span></div>
                  <div><strong>{entry.rewardGold} Gold · {entry.rewardGuildPoints} GP</strong><span>{entry.firstClear ? "First-clear reward" : entry.outcome === "player_won" ? "Repeat reward" : "No reward"}</span></div>
                </article>
              ))}
            </div>
          ) : <p className={styles.emptyHistory}>No permanent matches recorded yet. The Novice Echo Trial is open.</p>}
        </section>
      </section>
    </main>
  );
}

function ColiseumBattle({
  encounter,
  onComplete,
  onReturn,
}: {
  encounter: ColiseumEncounterDefinition;
  onComplete: (outcome: BattleOutcome, rounds: number, teamCreatureIds: CreatureId[]) => void;
  onReturn: () => void;
}) {
  const { save, goToBattleOutfitter, saveCurrentGame } = useGameContext();
  const [phase, setPhase] = useState<BattlePhase>("team-selection");
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<CreatureId[]>([]);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [playerSources, setPlayerSources] = useState<CreatureRecord[]>([]);
  const [enemySources, setEnemySources] = useState<CreatureRecord[]>([]);
  const [queuedActions, setQueuedActions] = useState<Map<BattleCombatantId, BattleAction>>(new Map());
  const [activeActorId, setActiveActorId] = useState<BattleCombatantId | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<BattleUiTarget | null>(null);
  const [armTacticsKit, setArmTacticsKit] = useState(false);
  const [usedItems, setUsedItems] = useState<UsedCombatItems>(EMPTY_USED_ITEMS);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [message, setMessage] = useState(`Choose exactly three available creatures for ${encounter.name}.`);

  const roster = save?.creatures ?? [];
  const availableRoster = useMemo(
    () => save ? roster.filter((creature) => !getUnavailableReason(save, creature)) : [],
    [save, roster],
  );
  const effectiveSelection = selectedCreatureIds.length ? selectedCreatureIds : availableRoster.slice(0, 3).map((creature) => creature.creatureId);

  if (!save) return null;

  const tacticsStock = getBattleOutfitterCombatStock(save, TEAM_TACTICS_KIT_ID);
  const tonicStock = getBattleOutfitterCombatStock(save, FIELD_TONIC_ID);
  const revivalStock = getBattleOutfitterCombatStock(save, REVIVAL_SALVE_ID);
  const sourceById = new Map<string, CreatureRecord>([...playerSources, ...enemySources].map((creature) => [String(creature.creatureId), creature]));
  const livingPlayerIds = battleState?.teams.player.combatantIds.filter((id) => !battleState.combatants[id].isFainted) ?? [];
  const activeActor = battleState && activeActorId ? battleState.combatants[activeActorId] : null;
  const moveOptions = battleState && activeActorId ? getBattleUiMoveOptions(battleState, activeActorId, selectedTarget) : [];
  const compatibleMoves = moveOptions.filter((option) => option.compatible);
  const allPlayerActionsQueued = Boolean(battleState) && livingPlayerIds.length > 0 && livingPlayerIds.every((id) => queuedActions.has(id));

  function toggleCreature(creature: CreatureRecord) {
    const unavailableReason = getUnavailableReason(save, creature);
    if (unavailableReason) { setMessage(unavailableReason); return; }
    if (effectiveSelection.includes(creature.creatureId)) {
      setSelectedCreatureIds(effectiveSelection.filter((id) => id !== creature.creatureId));
      return;
    }
    if (effectiveSelection.length >= 3) { setMessage("A Coliseum team contains exactly three creatures. Remove one first."); return; }
    setSelectedCreatureIds([...effectiveSelection, creature.creatureId]);
  }

  function startBattle() {
    const team = effectiveSelection
      .map((id) => roster.find((creature) => creature.creatureId === id))
      .filter((creature): creature is CreatureRecord => Boolean(creature));
    if (team.length !== 3) { setMessage("Select exactly three available creatures before entering the bracket."); return; }
    if (armTacticsKit && tacticsStock <= 0) { setMessage("No Team Tactics Kit is available."); return; }
    const enemies = buildColiseumEnemyTeam(team, encounter);
    let state = applyBattleOutfitterLoadouts(
      save,
      createBattleState({
        battleId: `coliseum_${encounter.encounterId}_${save.saveId}_${save.dayState.dayNumber}_${team.map((creature) => creature.creatureId).join("_")}`,
        playerCreatures: team,
        enemyCreatures: enemies,
        playerTeamName: `${save.player.name}'s Ranch Team`,
        enemyTeamName: encounter.opponentName,
      }),
    );
    let tacticsUsed = false;
    if (armTacticsKit) {
      const result = applyTeamTacticsKit(save, state);
      if (!result.ok) { setMessage(result.message); return; }
      saveCurrentGame(result.save);
      state = result.state;
      tacticsUsed = true;
    }
    const queue = new Map<BattleCombatantId, BattleAction>();
    setPlayerSources(team);
    setEnemySources(enemies);
    setBattleState(state);
    setQueuedActions(queue);
    setActiveActorId(getNextUnqueuedPlayerActorId(state, queue));
    setSelectedTarget(null);
    setUsedItems({ ...EMPTY_USED_ITEMS, tacticsKit: tacticsUsed });
    setCompletedRounds(0);
    setPhase("battle");
    setMessage(`${encounter.name} started. Equipment and Focus training are active. Target first, then choose a compatible move.`);
  }

  function chooseMove(moveId: string) {
    if (!battleState || !activeActorId || !selectedTarget) return;
    const action = buildBattleUiAction(battleState, activeActorId, moveId, selectedTarget);
    if (!action) { setMessage("That move cannot be used on the selected target."); return; }
    const nextQueue = new Map(queuedActions);
    nextQueue.set(activeActorId, action);
    const nextActor = getNextUnqueuedPlayerActorId(battleState, nextQueue, activeActorId);
    setQueuedActions(nextQueue);
    setActiveActorId(nextActor);
    setSelectedTarget(null);
    setMessage(nextActor ? `Action queued. Select a target for ${battleState.combatants[nextActor].name}.` : "All ranch actions are queued. Confirm the round when ready.");
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
  }

  function useSupportItem(item: "tonic" | "revival") {
    if (!battleState || selectedTarget?.kind !== "combatant") { setMessage("Select a ranch-team creature before using a support item."); return; }
    const result = item === "tonic"
      ? useFieldTonic(save, battleState, selectedTarget.combatantId)
      : useRevivalSalve(save, battleState, selectedTarget.combatantId);
    if (!result.ok) { setMessage(result.message); return; }
    saveCurrentGame(result.save);
    setBattleState(result.state);
    setSelectedTarget(null);
    setUsedItems((current) => ({ ...current, fieldTonic: current.fieldTonic || item === "tonic", revivalSalve: current.revivalSalve || item === "revival" }));
    setMessage(result.message);
    if (item === "revival" && phase === "result") {
      const nextQueue = new Map<BattleCombatantId, BattleAction>();
      setPhase("battle");
      setQueuedActions(nextQueue);
      setActiveActorId(getNextUnqueuedPlayerActorId(result.state, nextQueue));
    }
  }

  function resolveRound() {
    if (!battleState || !allPlayerActionsQueued) { setMessage("Queue one action for every living ranch creature."); return; }
    const aiPlan = buildBattleAiPlan(battleState, "enemy", encounter.aiDifficulty);
    const stateWithAiPlan: BattleState = { ...battleState, log: [...battleState.log, ...aiPlan.decisions.map(formatBattleAiDecision)] };
    const resolved = resolveBattleRound(stateWithAiPlan, [...Array.from(queuedActions.values()), ...aiPlan.actions]);
    const nextQueue = new Map<BattleCombatantId, BattleAction>();
    setBattleState(resolved.state);
    setQueuedActions(nextQueue);
    setSelectedTarget(null);
    setCompletedRounds(resolved.result.roundNumber);
    if (resolved.state.outcome !== "ongoing") {
      setActiveActorId(null);
      setPhase("result");
      setMessage(`${outcomeLabel(resolved.state.outcome)} in ${resolved.result.roundNumber} rounds. Record the result to receive any earned reward.`);
      return;
    }
    const nextActor = getNextUnqueuedPlayerActorId(resolved.state, nextQueue);
    setActiveActorId(nextActor);
    setMessage(`Round ${resolved.result.roundNumber} resolved. Select a target for ${nextActor ? resolved.state.combatants[nextActor].name : "your next creature"}.`);
  }

  function finalize(outcome?: BattleOutcome) {
    const finalOutcome = outcome ?? battleState?.outcome ?? "enemy_won";
    const rounds = completedRounds || battleState?.roundNumber || 1;
    onComplete(finalOutcome, rounds, playerSources.map((creature) => creature.creatureId));
  }

  if (phase === "team-selection") {
    return (
      <main className={battleStyles.screen}>
        <section className={battleStyles.frame}>
          <header className={battleStyles.header}>
            <div><p className={battleStyles.kicker}>{getColiseumDivision(encounter.divisionId).name}</p><h1>{encounter.name}</h1><p>{message}</p></div>
            <div className={battleStyles.headerActions}><button type="button" className={battleStyles.secondaryButton} onClick={goToBattleOutfitter}>Battle Outfitter</button><button type="button" onClick={onReturn}>Back to Coliseum</button></div>
          </header>
          <section className={battleStyles.selectionSummary} data-ui-text-box="auto">
            <div><span>Selected</span><strong>{effectiveSelection.length} / 3</strong></div>
            <div><span>Opponent</span><strong>{encounter.opponentName}</strong><small>Enemy level offset {encounter.enemyLevelOffset >= 0 ? "+" : ""}{encounter.enemyLevelOffset}</small></div>
            <div><span>AI</span><strong>{getBattleAiDifficultyLabel(encounter.aiDifficulty)}</strong><small>{getBattleAiDifficultyDescription(encounter.aiDifficulty)}</small></div>
            <div><span>Team Prep</span><button type="button" className={armTacticsKit ? battleStyles.confirmButton : battleStyles.secondaryButton} onClick={() => setArmTacticsKit((value) => !value)} disabled={tacticsStock <= 0}>{armTacticsKit ? "Tactics Kit Armed" : `Use Tactics Kit (${tacticsStock})`}</button><small>Consumed when the match starts.</small></div>
          </section>
          <section className={battleStyles.rosterGrid}>{roster.map((creature) => <TeamSelectionCard key={creature.creatureId} creature={creature} selected={effectiveSelection.includes(creature.creatureId)} unavailableReason={getUnavailableReason(save, creature)} readinessLabel={getBattleReadinessLabel(save, creature.creatureId)} onToggle={() => toggleCreature(creature)} />)}</section>
          <footer className={battleStyles.selectionFooter}><p>Victory rewards are recorded only after the completed result is confirmed. Leaving now creates no attempt.</p><button type="button" onClick={startBattle} disabled={effectiveSelection.length !== 3}>Enter {encounter.name}</button></footer>
        </section>
      </main>
    );
  }

  if (!battleState) return null;
  const combatants = Object.values(battleState.combatants).sort((left, right) => left.sideId.localeCompare(right.sideId) || left.slotIndex - right.slotIndex);
  const enemies = combatants.filter((combatant) => combatant.sideId === "enemy");
  const players = combatants.filter((combatant) => combatant.sideId === "player");
  const recentLog = battleState.log.slice(-24);

  return (
    <main className={battleStyles.screen}>
      <section className={battleStyles.frame}>
        <header className={battleStyles.header}>
          <div><p className={battleStyles.kicker}>{getColiseumDivision(encounter.divisionId).name} · {getBattleAiDifficultyLabel(encounter.aiDifficulty)} AI</p><h1>{phase === "result" ? "Match Complete" : `Round ${battleState.roundNumber}`}</h1><p>{message}</p></div>
          <div className={battleStyles.headerActions}><button type="button" className={battleStyles.secondaryButton} onClick={() => finalize("enemy_won")}>Forfeit & Record Loss</button><button type="button" onClick={onReturn}>Leave Without Record</button></div>
        </header>

        <section className={battleStyles.battlefield}>
          <div className={battleStyles.teamSection}><div className={battleStyles.teamHeading}><span>Enemy Team</span><strong>{battleState.teams.enemy.name}</strong></div><div className={battleStyles.teamGrid}>{enemies.map((combatant) => <CombatantCard key={combatant.battleCombatantId} combatant={combatant} portraitPath={sourceById.get(String(combatant.sourceCreatureId))?.portraitPath} selectedTarget={selectedTarget} activeActorId={activeActorId} queuedAction={queuedActions.get(combatant.battleCombatantId)} onTarget={() => setSelectedTarget({ kind: "combatant", combatantId: combatant.battleCombatantId })} />)}</div></div>
          <div className={battleStyles.arenaDivider}><span>VS</span><button type="button" className={selectedTarget?.kind === "field" ? battleStyles.fieldSelected : undefined} onClick={() => setSelectedTarget({ kind: "field" })}>Select Field</button></div>
          <div className={battleStyles.teamSection}><div className={battleStyles.teamHeading}><span>Ranch Team</span><strong>{battleState.teams.player.name}</strong></div><div className={battleStyles.teamGrid}>{players.map((combatant) => <CombatantCard key={combatant.battleCombatantId} combatant={combatant} portraitPath={sourceById.get(String(combatant.sourceCreatureId))?.portraitPath} selectedTarget={selectedTarget} activeActorId={activeActorId} queuedAction={queuedActions.get(combatant.battleCombatantId)} onTarget={() => setSelectedTarget({ kind: "combatant", combatantId: combatant.battleCombatantId })} onPlan={() => planFor(combatant.battleCombatantId)} />)}</div></div>
        </section>

        <section className={battleStyles.commandDeck}>
          <div className={battleStyles.actionPanel}>
            <div className={battleStyles.panelHeading}><div><span>Current Actor</span><strong>{activeActor?.name ?? (phase === "result" ? "Battle Complete" : "All Actions Queued")}</strong></div><div><span>Selected Target</span><strong>{selectedTarget?.kind === "field" ? "Battlefield" : selectedTarget?.kind === "combatant" ? battleState.combatants[selectedTarget.combatantId]?.name ?? "Unknown" : "Choose a target"}</strong></div></div>
            {phase === "result" ? (
              <div className={battleStyles.resultPanel}>
                <h2>{outcomeLabel(battleState.outcome)}</h2>
                <p>{battleState.outcome === "player_won" ? `Reward preview: ${getColiseumRewardLabel(getColiseumProgress(save).claimedFirstClearEncounterIds.includes(encounter.encounterId) ? encounter.repeatReward : encounter.firstClearReward)}` : "Defeats and draws are recorded without a reward."}</p>
                {battleState.outcome === "enemy_won" && !usedItems.revivalSalve && revivalStock > 0 ? <p>Select a fainted ranch creature and use a Revival Salve to resume before recording the result.</p> : null}
                <button type="button" onClick={() => finalize()}>Record Result & Return to Coliseum</button>
              </div>
            ) : selectedTarget && activeActor ? (
              <div className={battleStyles.moveGrid}>{compatibleMoves.length ? compatibleMoves.map((option) => <button key={option.move.id} type="button" className={`${battleStyles.moveButton} ${battleStyles[`category_${option.move.category}`]}`} onClick={() => chooseMove(option.move.id)} disabled={!option.usable}><span className={battleStyles.moveTitle}><strong>{option.move.name}</strong><em>{option.move.category}</em></span><span className={battleStyles.moveNumbers}>PWR {option.move.power} · ACC {option.move.accuracy}% · BE {option.move.battleEnergyCost} · CD {activeActor.cooldowns[option.move.id] ?? 0}/{option.move.cooldown}</span><span>{getBattleTargetTypeLabel(option.move.targetType)} · {moveEffectLabel(option.move)}</span>{option.reason ? <small>{option.reason}</small> : <small>Ready</small>}</button>) : <div className={battleStyles.emptyMoveState}><strong>No compatible equipped moves</strong><p>Select a different target pattern.</p></div>}</div>
            ) : <div className={battleStyles.emptyMoveState}><strong>Target first</strong><p>Select a living enemy, ally, the active creature, a fainted ranch creature for Revival, or the battlefield.</p></div>}

            <section className={styles.supportPanel} data-ui-text-box="auto">
              <div className={battleStyles.panelHeading}><div><span>Battle Outfitter</span><strong>Support Items</strong></div></div>
              <p className={battleStyles.statusLine}>Each item type may be used once in this match.</p>
              <div className={battleStyles.cardActions}><button type="button" onClick={() => useSupportItem("tonic")} disabled={usedItems.fieldTonic || tonicStock <= 0 || phase === "result"}>Field Tonic ({tonicStock})</button><button type="button" onClick={() => useSupportItem("revival")} disabled={usedItems.revivalSalve || revivalStock <= 0}>Revival Salve ({revivalStock})</button></div>
            </section>
          </div>

          <aside className={battleStyles.queuePanel}>
            <div className={battleStyles.panelHeading}><div><span>Round Queue</span><strong>{queuedActions.size} / {livingPlayerIds.length}</strong></div></div>
            <div className={battleStyles.queueList}>{players.filter((combatant) => !combatant.isFainted).map((combatant) => { const action = queuedActions.get(combatant.battleCombatantId); return <div key={combatant.battleCombatantId} className={battleStyles.queueEntry}><div><strong>{combatant.name}</strong><span>{action ? `${getBattleMove(action.moveId).name} → ${action.targetIds.length ? action.targetIds.map((id) => battleState.combatants[id]?.name ?? "Unknown").join(", ") : "Field"}` : "Action not queued"}</span></div>{action ? <button type="button" onClick={() => clearQueuedAction(combatant.battleCombatantId)}>Edit</button> : <button type="button" onClick={() => planFor(combatant.battleCombatantId)}>Plan</button>}</div>; })}</div>
            <p className={battleStyles.statusLine}>Enemy actions remain hidden until resolution. {getBattleAiDifficultyDescription(encounter.aiDifficulty)}</p>
            <button type="button" className={battleStyles.confirmButton} onClick={resolveRound} disabled={!allPlayerActionsQueued || phase === "result"}>Confirm Round</button>
          </aside>

          <aside className={battleStyles.logPanel}><div className={battleStyles.panelHeading}><div><span>Battle Log</span><strong>Latest Events</strong></div></div><div className={battleStyles.logList}>{recentLog.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}</div></aside>
        </section>
      </section>
    </main>
  );
}
