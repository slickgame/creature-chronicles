"use client";

import { useMemo, useState } from "react";
import { BattleArenaB } from "@/features/battle/BattleArenaB";
import { ColiseumTeamStaging } from "./ColiseumTeamStaging";
import {
  buildBattleAiPlan,
  formatBattleAiDecision,
} from "@/data/battleAi";
import {
  createBattleState,
  resolveBattleRound,
} from "@/data/battleEngine";
import { buildBattlePresentationEvents } from "@/data/battlePresentation";
import {
  FIELD_TONIC_ID,
  REVIVAL_SALVE_ID,
  TEAM_TACTICS_KIT_ID,
  applyBattleOutfitterLoadouts,
  applyTeamTacticsKit,
  getBattleOutfitterCombatStock,
  useFieldTonic as applyFieldTonic,
  useRevivalSalve as applyRevivalSalve,
} from "@/data/battleOutfitterIntegration";
import {
  buildBattleUiAction,
  getNextUnqueuedPlayerActorId,
  type BattleUiTarget,
} from "@/data/battleUi";
import {
  accumulateColiseumRoundPerformance,
  applyAuthoredColiseumEquipment,
  buildAuthoredColiseumEnemyTeam,
  createColiseumPerformance,
  getColiseumEnemyPreview,
  type ColiseumC2EncounterDefinition,
  type ColiseumCombatPerformanceMap,
} from "@/data/coliseumC2";
import {
  applyColiseumC4Carryover,
  applyColiseumC4Modifiers,
  getColiseumC4Modifier,
  isColiseumC4AidRestricted,
  type ColiseumC4CarryoverMap,
  type ColiseumC4ChallengeDefinition,
} from "@/data/coliseumC4";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { useGameContext } from "@/state/GameProvider";
import type {
  BattleAction,
  BattleCombatantId,
  BattleOutcome,
  BattleState,
} from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import { useBattlePresentationController } from "@/features/battle/useBattlePresentationController";


type BattlePhase = "team-selection" | "battle" | "result";
type UsedCombatItems = { tacticsKit: boolean; fieldTonic: boolean; revivalSalve: boolean };
const EMPTY_USED_ITEMS: UsedCombatItems = { tacticsKit: false, fieldTonic: false, revivalSalve: false };

export type ColiseumC4BattleProps = {
  challenge: ColiseumC4ChallengeDefinition;
  stageIndex: number;
  encounter: ColiseumC2EncounterDefinition;
  lockedTeamCreatureIds?: CreatureId[];
  carryover?: ColiseumC4CarryoverMap;
  onComplete: (
    outcome: BattleOutcome,
    rounds: number,
    teamCreatureIds: CreatureId[],
    performance: ColiseumCombatPerformanceMap,
    resultId: string,
    finalState: BattleState,
  ) => void;
  onReturn: () => void;
};

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

export function ColiseumC4Battle({
  challenge,
  stageIndex,
  encounter,
  lockedTeamCreatureIds,
  carryover,
  onComplete,
  onReturn,
}: ColiseumC4BattleProps) {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [phase, setPhase] = useState<BattlePhase>("team-selection");
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<CreatureId[] | null>(lockedTeamCreatureIds ?? null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [playerSources, setPlayerSources] = useState<CreatureRecord[]>([]);
  const [enemySources, setEnemySources] = useState<CreatureRecord[]>([]);
  const [queuedActions, setQueuedActions] = useState<Map<BattleCombatantId, BattleAction>>(new Map());
  const [activeActorId, setActiveActorId] = useState<BattleCombatantId | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<BattleUiTarget | null>(null);
  const [armTacticsKit, setArmTacticsKit] = useState(false);
  const [usedItems, setUsedItems] = useState<UsedCombatItems>(EMPTY_USED_ITEMS);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [performance, setPerformance] = useState<ColiseumCombatPerformanceMap>({});
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState(`Choose exactly three available creatures for ${challenge.name}.`);
  const presentation = useBattlePresentationController();

  const roster = currentSave?.creatures ?? [];
  const availableRoster = useMemo(() => currentSave ? roster.filter((creature) => !getUnavailableReason(currentSave, creature)) : [], [currentSave, roster]);
  const locked = Boolean(lockedTeamCreatureIds?.length);
  const lockedRoster = lockedTeamCreatureIds?.map((id) => roster.find((creature) => creature.creatureId === id)).filter((creature): creature is CreatureRecord => Boolean(creature)) ?? [];
  const visibleRoster = locked ? lockedRoster : roster;
  const effectiveSelection = locked
    ? lockedRoster.map((creature) => creature.creatureId)
    : selectedCreatureIds !== null
      ? selectedCreatureIds
      : availableRoster.slice(0, 3).map((creature) => creature.creatureId);
  const enemyPreview = useMemo(() => getColiseumEnemyPreview(encounter), [encounter]);
  const aidRestricted = isColiseumC4AidRestricted(challenge.modifierIds);

  if (!currentSave) return null;
  const save = currentSave;

  const tacticsStock = getBattleOutfitterCombatStock(save, TEAM_TACTICS_KIT_ID);
  const tonicStock = getBattleOutfitterCombatStock(save, FIELD_TONIC_ID);
  const revivalStock = getBattleOutfitterCombatStock(save, REVIVAL_SALVE_ID);
  const sourceById = new Map<string, CreatureRecord>([...playerSources, ...enemySources].map((creature) => [String(creature.creatureId), creature]));
  const livingPlayerIds = battleState?.teams.player.combatantIds.filter((id) => !battleState.combatants[id].isFainted) ?? [];
  const allPlayerActionsQueued = Boolean(battleState) && livingPlayerIds.length > 0 && livingPlayerIds.every((id) => queuedActions.has(id));

  function startBattle() {
    const team = effectiveSelection
      .map((id) => roster.find((creature) => creature.creatureId === id))
      .filter((creature): creature is CreatureRecord => Boolean(creature));
    if (team.length !== 3) { setMessage("Select exactly three available creatures before entering the challenge."); return; }
    const unavailable = team.find((creature) => getUnavailableReason(save, creature));
    if (unavailable) { setMessage(`${unavailable.nickname} is no longer available for battle.`); return; }
    if (armTacticsKit && tacticsStock <= 0) { setMessage("No Team Tactics Kit is available."); return; }
    const enemies = buildAuthoredColiseumEnemyTeam(save.saveId, encounter);
    let state = applyColiseumC4Carryover(
      applyColiseumC4Modifiers(
        applyAuthoredColiseumEquipment(
          applyBattleOutfitterLoadouts(
            save,
            createBattleState({
              battleId: `coliseum_c4_${challenge.challengeKey}_${stageIndex}_${save.saveId}_${save.dayState.dayNumber}_${Date.now()}`,
              playerCreatures: team,
              enemyCreatures: enemies,
              playerTeamName: `${save.player.name}'s Challenge Team`,
              enemyTeamName: encounter.opponentName,
            }),
          ),
          encounter,
        ),
        challenge.modifierIds,
      ),
      carryover,
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
    setPerformance(createColiseumPerformance(team.map((creature) => creature.creatureId)));
    setPhase("battle");
    setMessage(`${encounter.opponentName} enters under C4 challenge rules. Target first, then choose a compatible move.`);
  }

  function chooseMove(moveId: string) {
    if (presentation.isPlaying || !battleState || !activeActorId || !selectedTarget) return;
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
    if (presentation.isPlaying || !battleState || battleState.combatants[actorId]?.isFainted) return;
    setActiveActorId(actorId);
    setSelectedTarget(null);
    setMessage(`Planning ${battleState.combatants[actorId].name}'s action. Select a target first.`);
  }

  function handleSupportItem(item: "tonic" | "revival") {
    if (presentation.isPlaying) return;
    if (aidRestricted) { setMessage("Restricted Aid prevents Field Tonics and Revival Salves in this challenge."); return; }
    if (!battleState || selectedTarget?.kind !== "combatant") { setMessage("Select a ranch-team creature before using a support item."); return; }
    const result = item === "tonic"
      ? applyFieldTonic(save, battleState, selectedTarget.combatantId)
      : applyRevivalSalve(save, battleState, selectedTarget.combatantId);
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
    if (presentation.isPlaying || !battleState || !allPlayerActionsQueued) { setMessage("Queue one action for every living ranch creature."); return; }
    const aiPlan = buildBattleAiPlan(battleState, "enemy", encounter.aiDifficulty);
    const stateWithAiPlan: BattleState = { ...battleState, log: [...battleState.log, ...aiPlan.decisions.map(formatBattleAiDecision)] };
    const resolved = resolveBattleRound(stateWithAiPlan, [...Array.from(queuedActions.values()), ...aiPlan.actions]);
    presentation.play(buildBattlePresentationEvents(battleState, resolved.state, resolved.result), resolved.result.actions.map(action => action.actorId));
    const nextPerformance = accumulateColiseumRoundPerformance(performance, battleState, resolved.result);
    const nextQueue = new Map<BattleCombatantId, BattleAction>();
    setPerformance(nextPerformance);
    setBattleState(resolved.state);
    setQueuedActions(nextQueue);
    setSelectedTarget(null);
    setCompletedRounds(resolved.result.roundNumber);
    if (resolved.state.outcome !== "ongoing") {
      setActiveActorId(null);
      setPhase("result");
      setMessage(`${outcomeLabel(resolved.state.outcome)} in ${resolved.result.roundNumber} rounds. Review the challenge result before recording.`);
      return;
    }
    const nextActor = getNextUnqueuedPlayerActorId(resolved.state, nextQueue);
    setActiveActorId(nextActor);
    setMessage(`Round ${resolved.result.roundNumber} resolved. Select a target for ${nextActor ? resolved.state.combatants[nextActor].name : "your next creature"}.`);
  }

  function finalize(outcome?: BattleOutcome) {
    if (recording || presentation.isPlaying || !battleState) return;
    setRecording(true);
    const finalOutcome = outcome ?? battleState.outcome ?? "enemy_won";
    const rounds = completedRounds || Math.max(1, battleState.roundNumber - 1);
    onComplete(finalOutcome, rounds, playerSources.map((creature) => creature.creatureId), performance, battleState.battleId, battleState);
  }

  if (phase === "team-selection") {
    return <ColiseumTeamStaging title={`${challenge.name} · Stage ${stageIndex + 1}/${challenge.encounterIds.length}`} roster={visibleRoster} selected={effectiveSelection} onChange={setSelectedCreatureIds} onReturn={onReturn} onStart={startBattle} unavailable={c => getUnavailableReason(save,c)} enemyPreview={enemyPreview} opponent={encounter.opponentName} strategy={encounter.strategyLabel} locked={locked} carryover={carryover} tacticsStock={tacticsStock} armed={armTacticsKit} onArm={()=>setArmTacticsKit(v=>!v)} message={message} rules={<>{challenge.modifierIds.map(id=>{const m=getColiseumC4Modifier(id);return <section key={id}><h3>{m.name}</h3><p>{m.description}</p></section>;})}<p>{challenge.mode === "gauntlet" ? "The same roster continues between stages. Living creatures recover 30% max HP and 25% max Battle Energy; fainted creatures return at 15% HP. Statuses and cooldowns clear. Defeat or a draw ends the run." : "Every participant earns Combat XP after the result is recorded."}</p></>} />;
  }

  if (!battleState) return null;
  return <BattleArenaB title={`${challenge.name} · Stage ${stageIndex+1}/${challenge.encounterIds.length}`} battleState={battleState} sourceById={sourceById} selectedTarget={selectedTarget} activeActorId={activeActorId} queuedActions={queuedActions} presentation={presentation} onTarget={setSelectedTarget} onPlan={planFor} onQueue={chooseMove} onConfirm={resolveRound} onReturn={onReturn} onForfeit={()=>finalize("enemy_won")} onItem={handleSupportItem} tonicStock={tonicStock} revivalStock={revivalStock} usedTonic={usedItems.fieldTonic} usedRevival={usedItems.revivalSalve} complete={phase==="result"} recording={recording} message={message} aidRestricted={aidRestricted} rules={<>{challenge.modifierIds.map(id=>{const m=getColiseumC4Modifier(id);return <p key={id}><strong>{m.name}</strong>: {m.description}</p>;})}</>} result={<><h3>{outcomeLabel(battleState.outcome)}</h3><p>{challenge.mode === "gauntlet" && battleState.outcome === "player_won" && stageIndex+1<challenge.encounterIds.length ? "Record this win to lock the same team into the next stage and apply partial recovery." : "Recording saves Combat XP, records, score and eligible challenge rewards."}</p>{battleState.outcome === "enemy_won" && !aidRestricted && !usedItems.revivalSalve && revivalStock>0 && <p>You can close this review and use a Revival Salve on a fainted teammate before recording.</p>}<button onClick={()=>finalize()} disabled={recording||presentation.isPlaying}>{recording?"Recording…":"Record Challenge Result"}</button></>}/>;
}
