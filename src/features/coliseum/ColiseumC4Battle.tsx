"use client";

import { useMemo, useState } from "react";
import { BattleArenaB } from "@/features/battle/BattleArenaB";
import { ColiseumTeamStaging } from "./ColiseumTeamStaging";
import { buildColiseumOpening, createColiseumAttemptKey, createColiseumBattleId, getColiseumOpeningPreview } from "@/data/coliseumBattleOpening";
import {
  FIELD_TONIC_ID,
  REVIVAL_SALVE_ID,
  TEAM_TACTICS_KIT_ID,
  applyTeamTacticsKit,
  getBattleOutfitterCombatStock,
  useFieldTonic as applyFieldTonic,
  useRevivalSalve as applyRevivalSalve,
} from "@/data/battleOutfitterIntegration";
import {
  buildBattleUiAction,
} from "@/data/battleUi";
import {
  accumulateColiseumRoundPerformance,
  createColiseumPerformance,
  getColiseumEnemyPreview,
  type ColiseumC2EncounterDefinition,
  type ColiseumCombatPerformanceMap,
} from "@/data/coliseumC2";
import {
  recordColiseumC4BattleResult,
  getColiseumC4Modifier,
  isColiseumC4AidRestricted,
  type ColiseumC4CarryoverMap,
  type ColiseumC4ChallengeDefinition,
} from "@/data/coliseumC4";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { useGameContext } from "@/state/GameProvider";
import type {
  BattleOutcome,
  BattleRoundResult,
  BattleState,
} from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import { useBattlePresentationController } from "@/features/battle/useBattlePresentationController";
import { useColiseumIndividualTurns } from "./useColiseumIndividualTurns";


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
  // Initiative ties are seeded by battle ID, so the preview and launch share this attempt.
  const [attemptKey] = useState(createColiseumAttemptKey);
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<CreatureId[] | null>(lockedTeamCreatureIds ?? null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [playerSources, setPlayerSources] = useState<CreatureRecord[]>([]);
  const [enemySources, setEnemySources] = useState<CreatureRecord[]>([]);
  const [armTacticsKit, setArmTacticsKit] = useState(false);
  const [usedItems, setUsedItems] = useState<UsedCombatItems>(EMPTY_USED_ITEMS);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [performance, setPerformance] = useState<ColiseumCombatPerformanceMap>({});
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState(`Choose exactly three available creatures for ${challenge.name}.`);
  const presentation = useBattlePresentationController();
  const turns = useColiseumIndividualTurns({
    state: battleState,
    enabled: !!currentSave && phase === "battle",
    aiDifficulty: encounter.aiDifficulty,
    presentation,
    onResolved: settleRoundProgress,
  });
  const { activeActorId, selectedTarget, setSelectedTarget } = turns;

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
  const modifiers = challenge.modifierIds.map(getColiseumC4Modifier);
  const aidRestricted = isColiseumC4AidRestricted(challenge.modifierIds);

  if (!currentSave) return null;
  const save = currentSave;

  const tacticsStock = getBattleOutfitterCombatStock(save, TEAM_TACTICS_KIT_ID);
  const tonicStock = getBattleOutfitterCombatStock(save, FIELD_TONIC_ID);
  const revivalStock = getBattleOutfitterCombatStock(save, REVIVAL_SALVE_ID);
  const sourceById = new Map<string, CreatureRecord>([...playerSources, ...enemySources].map((creature) => [String(creature.creatureId), creature]));
  const team = effectiveSelection
    .map((id) => roster.find((creature) => creature.creatureId === id))
    .filter((creature): creature is CreatureRecord => Boolean(creature));
  const openingInput = {
    save,
    encounter,
    team,
    playerTeamName: `${save.player.name}'s Challenge Team`,
    challenge: { modifierIds: challenge.modifierIds, carryover },
  };
  const battleId = createColiseumBattleId(`coliseum_c4_${challenge.challengeKey}_${stageIndex}`, save, attemptKey);

  function startBattle() {
    if (team.length !== 3) { setMessage("Select exactly three available creatures before entering the challenge."); return; }
    const unavailable = team.find((creature) => getUnavailableReason(save, creature));
    if (unavailable) { setMessage(`${unavailable.nickname} is no longer available for battle.`); return; }
    if (armTacticsKit && tacticsStock <= 0) { setMessage("No Team Tactics Kit is available."); return; }
    const { state: openingState, enemies } = buildColiseumOpening(openingInput, battleId);
    let state = openingState;
    let tacticsUsed = false;
    if (armTacticsKit) {
      const result = applyTeamTacticsKit(save, state);
      if (!result.ok) { setMessage(result.message); return; }
      saveCurrentGame(result.save);
      state = result.state;
      tacticsUsed = true;
    }
    setPlayerSources(team);
    setEnemySources(enemies);
    setBattleState(turns.openRound(state, 0));
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
    turns.takeTurn(action);
  }

  function handleSupportItem(item: "tonic" | "revival") {
    if (presentation.isPlaying) return;
    if (aidRestricted) { setMessage("Restricted Aid prevents Field Tonics and Revival Salves in this challenge."); return; }
    if (!battleState || selectedTarget?.kind !== "combatant") { setMessage("Select a ranch-team creature before using a support item."); return; }
    const result = item === "tonic"
      ? applyFieldTonic(save, battleState, selectedTarget.combatantId)
      : applyRevivalSalve(save, battleState, selectedTarget.combatantId);
    if (!result.ok) { setMessage(result.message); return; }
    const resumesBattle = item === "revival" && phase === "result";
    saveCurrentGame(result.save);
    setBattleState(resumesBattle ? turns.openRound(result.state, battleState.log.length) : result.state);
    setSelectedTarget(null);
    setUsedItems((current) => ({ ...current, fieldTonic: current.fieldTonic || item === "tonic", revivalSalve: current.revivalSalve || item === "revival" }));
    setMessage(result.message);
    if (resumesBattle) setPhase("battle");
  }

  function settleRoundProgress(nextState: BattleState, result: BattleRoundResult) {
    if (!battleState) return;
    setPerformance(current => accumulateColiseumRoundPerformance(current, battleState, result));
    setBattleState(nextState);
    setCompletedRounds(result.roundNumber);
    if (nextState.outcome !== "ongoing") {
      setPhase("result");
      setMessage(`${outcomeLabel(nextState.outcome)} in ${result.roundNumber} rounds. Review the challenge result before recording.`);
      return;
    }
    setMessage("Select a target and move for the active creature.");
  }

  function finalize(outcome?: BattleOutcome) {
    if (recording || presentation.isPlaying || !battleState) return;
    setRecording(true);
    const finalOutcome = outcome ?? battleState.outcome ?? "enemy_won";
    const rounds = completedRounds || Math.max(1, battleState.roundNumber - 1);
    onComplete(finalOutcome, rounds, playerSources.map((creature) => creature.creatureId), performance, battleState.battleId, battleState);
  }

  if (phase === "team-selection") {
    const { vitals, statuses, order } = getColiseumOpeningPreview(openingInput, battleId, armTacticsKit && tacticsStock > 0);
    return <ColiseumTeamStaging title={`${challenge.name} · Stage ${stageIndex + 1}/${challenge.encounterIds.length}`} roster={visibleRoster} selected={effectiveSelection} openingVitals={vitals} openingStatuses={statuses} openingOrder={order} onChange={setSelectedCreatureIds} onReturn={onReturn} onStart={startBattle} unavailable={c => getUnavailableReason(save,c)} enemyPreview={enemyPreview} opponent={encounter.opponentName} strategy={encounter.strategyLabel} locked={locked} carryover={carryover} tacticsStock={tacticsStock} armed={armTacticsKit} onArm={()=>setArmTacticsKit(v=>!v)} message={message} battleModifiers={modifiers} rules={<>{modifiers.map(m => <section key={m.modifierId}><h3>{m.name}</h3><p>{m.description}</p></section>)}<p>{challenge.mode === "gauntlet" ? "The same roster continues between stages. Living creatures recover 30% max HP and 25% max Battle Energy; fainted creatures return at 15% HP. Previous-stage statuses and cooldowns clear. Opening modifiers apply again each stage. Defeat or a draw ends the run." : "Every participant earns Combat XP after the result is recorded."}</p></>} />;
  }

  if (!battleState) return null;
  const receipt = phase === "result" ? recordColiseumC4BattleResult(save,challenge,stageIndex,battleState.outcome,completedRounds||1,playerSources.map(c=>c.creatureId),performance,battleState.battleId,battleState) : null;
  const reward = receipt?.historyEntry;
  return <BattleArenaB resultLedger={receipt?{rewardIcon:"/images/ui/coliseum-v1/exchange.webp",rewards:reward?`+${reward.marks} Marks · +${reward.materials} Iron ore${reward.itemLabel?` · ${reward.itemLabel}`:""}`:"No purse",summaries:receipt.xpSummaries.map(e=>{const before=save.creatures!.find(c=>c.creatureId===e.creatureId)!,after=receipt.save.creatures!.find(c=>c.creatureId===e.creatureId)!;return {...e,xpBefore:before.xp,xpAfter:after.xp,xpToNextAfter:after.xpToNext,statGrowth:Object.fromEntries(Object.entries(after.stats).map(([key,value])=>[key,value-before.stats[key as keyof typeof before.stats]]).filter(([,gain])=>gain!==0)),notes:[]};}),performance,onRecord:()=>finalize(),recordLabel:"Record Challenge Result",continuation:receipt.state.activeRun?"Next stage unlocks after recording · Recover 30% HP and 25% Battle Energy.":undefined}:undefined} title={`${challenge.name} · Stage ${stageIndex+1}/${challenge.encounterIds.length}`} battleState={battleState} sourceById={sourceById} selectedTarget={selectedTarget} activeActorId={activeActorId} individualOrder={turns.order} roundOrderShift={turns.roundOrderShift} targetHandoff={turns.targetHandoff} enemyIntent={turns.enemyIntent} completedCooldowns={turns.completedCooldowns} presentation={presentation} onTarget={setSelectedTarget} onQueue={chooseMove} onReturn={onReturn} onForfeit={()=>finalize("enemy_won")} onItem={handleSupportItem} tonicStock={tonicStock} revivalStock={revivalStock} usedTonic={usedItems.fieldTonic} usedRevival={usedItems.revivalSalve} complete={phase==="result"} recording={recording} message={message} aidRestricted={aidRestricted} rules={<>{modifiers.map(m => <p key={m.modifierId}><strong>{m.name}</strong>: {m.description}</p>)}</>} result={<><h3>{outcomeLabel(battleState.outcome)}</h3><p>{challenge.mode === "gauntlet" && battleState.outcome === "player_won" && stageIndex+1<challenge.encounterIds.length ? "Record this win to lock the same team into the next stage and apply partial recovery." : "Recording saves Combat XP, records, score and eligible challenge rewards."}</p>{battleState.outcome === "enemy_won" && !aidRestricted && !usedItems.revivalSalve && revivalStock>0 && <p>You can close this review and use a Revival Salve on a fainted teammate before recording.</p>}<button onClick={()=>finalize()} disabled={recording||presentation.isPlaying}>{recording?"Recording…":"Record Challenge Result"}</button></>}/>;
}
