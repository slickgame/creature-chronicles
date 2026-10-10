"use client";

import { useMemo, useState } from "react";
import { BattleArenaB } from "@/features/battle/BattleArenaB";
import { ColiseumTeamStaging } from "./ColiseumTeamStaging";
import {
  buildBattleAiPlan,
  formatBattleAiDecision,
  getBattleAiDifficultyDescription,
  getBattleAiDifficultyLabel,
} from "@/data/battleAi";
import { createBattleState, resolveBattleRound } from "@/data/battleEngine";
import { buildBattlePlaybackEvents } from "@/data/battlePresentation";
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
  COLISEUM_C2_DIVISIONS,
  COLISEUM_C2_ENCOUNTERS,
  accumulateColiseumRoundPerformance,
  applyAuthoredColiseumEquipment,
  buildAuthoredColiseumEnemyTeam,
  createColiseumPerformance,
  getColiseumC2Access,
  getColiseumC2Division,
  getColiseumC2EncounterRecord,
  getColiseumC2HighestDivision,
  getColiseumC2NextEncounter,
  getColiseumC2Progress,
  getColiseumC2RewardLabel,
  getColiseumCreatureBattleRecord,
  getColiseumEnemyPreview,
  getColiseumRepeatPoolLabel,
  previewColiseumCombatXp,
  recordColiseumC2BattleResult,
  type ColiseumC2EncounterDefinition,
  type ColiseumCombatPerformanceMap,
} from "@/data/coliseumC2";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
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
import styles from "./ColiseumProgressionScreen.module.css";

const COLISEUM_ICON = "/images/ui/icons/icon_ability_trigger.png";

type ColiseumMode = "hub" | "battle";
type BattlePhase = "team-selection" | "battle" | "result";
type UsedCombatItems = { tacticsKit: boolean; fieldTonic: boolean; revivalSalve: boolean };
const EMPTY_USED_ITEMS: UsedCombatItems = { tacticsKit: false, fieldTonic: false, revivalSalve: false };

const darkPanel = {
  border: "1px solid rgba(245,201,128,.34)",
  borderRadius: 12,
  background: "rgba(8,13,18,.76)",
  color: "#fff7dd",
} as const;

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

export function ColiseumC2Screen() {
  const { currentSave, goToBattleOutfitter, goToMainMenu, goToTown, saveCurrentGame } = useGameContext();
  const [mode, setMode] = useState<ColiseumMode>("hub");
  const [selectedEncounter, setSelectedEncounter] = useState<ColiseumC2EncounterDefinition | null>(null);
  const [message, setMessage] = useState("Choose an unlocked authored opponent. Recorded matches now grant combat XP and persistent creature battle records.");

  if (!currentSave) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load a save before entering the Coliseum.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;
  }

  const save = currentSave;
  function openEncounter(encounter: ColiseumC2EncounterDefinition) {
    const access = getColiseumC2Access(save, encounter);
    if (!access.unlocked) {
      setMessage(access.reason);
      return;
    }
    setSelectedEncounter(encounter);
    setMode("battle");
  }

  function finishBattle(
    outcome: BattleOutcome,
    rounds: number,
    teamCreatureIds: CreatureId[],
    performance: ColiseumCombatPerformanceMap,
    resultId: string,
  ) {
    if (!selectedEncounter) return;
    const result = recordColiseumC2BattleResult(save, selectedEncounter.encounterId, outcome, rounds, teamCreatureIds, performance, resultId);
    if (!result.duplicate) saveCurrentGame(result.save);
    setMessage(result.message);
    setSelectedEncounter(null);
    setMode("hub");
  }

  if (mode === "battle" && selectedEncounter) {
    return (
      <ColiseumBattle
        encounter={selectedEncounter}
        onComplete={finishBattle}
        onReturn={() => { setSelectedEncounter(null); setMode("hub"); setMessage("Battle entry cancelled. No match record, purse, or combat XP was created."); }}
      />
    );
  }

  const progress = getColiseumC2Progress(save);
  const nextEncounter = getColiseumC2NextEncounter(save);
  const highestDivision = getColiseumC2HighestDivision(save);
  const availableCreatures = (save.creatures ?? []).filter((creature) => !getUnavailableReason(save, creature));
  const rankedCreatures = [...(save.creatures ?? [])]
    .map((creature) => ({ creature, record: getColiseumCreatureBattleRecord(save, creature.creatureId) }))
    .filter((entry) => entry.record.battles > 0)
    .sort((left, right) => right.record.wins - left.record.wins || right.record.totalCombatXp - left.record.totalCombatXp)
    .slice(0, 6);

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <div className={styles.crest}><img src={COLISEUM_ICON} alt="" /></div>
            <div><p className={styles.kicker}>Coliseum C2</p><h1>Authored PvE Circuit</h1><p>{message}</p></div>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.resource}><span>Gold</span><strong>{formatGold(save.currencies.gold)}</strong></div>
            <div className={styles.resource}><span>Guild Points</span><strong>{formatGuildPoints(save.currencies.guildPoints)}</strong></div>
            <button type="button" onClick={goToBattleOutfitter}>Battle Outfitter</button>
            <button type="button" onClick={goToTown}>Town</button>
          </div>
        </header>

        <section className={styles.summaryGrid} data-ui-text-box="auto">
          <article><span>Current Standing</span><strong>{highestDivision.name}</strong><small>{progress.completedEncounterIds.length}/{COLISEUM_C2_ENCOUNTERS.length} authored clears</small></article>
          <article><span>Overall Record</span><strong>{progress.totalWins}W · {progress.totalLosses}L · {progress.totalDraws}D</strong><small>{progress.totalAttempts} recorded matches</small></article>
          <article><span>Next Objective</span><strong>{nextEncounter?.name ?? "All C2 encounters cleared"}</strong><small>{nextEncounter ? getColiseumC2RewardLabel(nextEncounter.firstClearReward) : "Repeat reward pools remain active"}</small></article>
          <article><span>Eligible Team Pool</span><strong>{availableCreatures.length} creatures</strong><small>Three available creatures are required</small></article>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          {COLISEUM_C2_DIVISIONS.map((division) => {
            const encounters = COLISEUM_C2_ENCOUNTERS.filter((entry) => entry.divisionId === division.divisionId);
            const divisionClears = encounters.filter((entry) => progress.completedEncounterIds.includes(entry.encounterId)).length;
            return (
              <article key={division.divisionId} className={styles.divisionCard} style={{ display: "grid", gap: 14 }}>
                <div className={styles.divisionHeading}>
                  <div><span>Division {division.order}</span><h2>{division.name}</h2><p>{division.subtitle}</p></div>
                  <strong>{divisionClears}/{encounters.length} CLEARED</strong>
                </div>
                <p className={styles.description}>{division.description}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))", gap: 12 }}>
                  {encounters.map((encounter) => {
                    const access = getColiseumC2Access(save, encounter);
                    const record = getColiseumC2EncounterRecord(save, encounter.encounterId);
                    const cleared = progress.completedEncounterIds.includes(encounter.encounterId);
                    const enemyLevels = encounter.enemyTeam.map((entry) => entry.level);
                    return (
                      <section key={encounter.encounterId} className={styles.encounterPanel} style={{ ...darkPanel, display: "grid", alignContent: "start", gap: 9, opacity: access.unlocked ? 1 : 0.58 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
                          <div><h3 style={{ margin: 0 }}>{encounter.name}</h3><small style={{ color: "#eebd68", fontWeight: 900 }}>{encounter.opponentName}</small></div>
                          <strong style={{ color: cleared ? "#9bf0a8" : access.unlocked ? "#ffd58c" : "#aaa" }}>{cleared ? "CLEARED" : access.unlocked ? "OPEN" : "LOCKED"}</strong>
                        </div>
                        <p style={{ margin: 0 }}>{encounter.description}</p>
                        <div className={styles.encounterFacts}>
                          <span>{getBattleAiDifficultyLabel(encounter.aiDifficulty)} AI</span>
                          <span>Lv. {Math.min(...enemyLevels)}–{Math.max(...enemyLevels)}</span>
                          <span>{encounter.strategyLabel}</span>
                        </div>
                        <div className={styles.rewardGrid}>
                          <div><span>First Clear</span><strong>{getColiseumC2RewardLabel(encounter.firstClearReward)}</strong></div>
                          <div><span>Repeat Pool</span><strong title={getColiseumRepeatPoolLabel(encounter)}>Weighted purse</strong></div>
                        </div>
                        <div className={styles.recordLine}><span>{record.wins}W · {record.losses}L · {record.draws}D</span><span>{record.bestWinRounds ? `Best ${record.bestWinRounds}r` : `Base XP ${encounter.baseCombatXp}`}</span></div>
                        {!access.unlocked ? <p className={styles.lockReason}>{access.reason}</p> : null}
                        <button type="button" onClick={() => openEncounter(encounter)} disabled={!access.unlocked || availableCreatures.length < 3}>{cleared ? "Enter Repeat Match" : "Enter First-Clear Match"}</button>
                      </section>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        <section className={styles.historyPanel} style={{ marginTop: 18 }}>
          <header><div><p className={styles.kicker}>Creature Progression</p><h2>Top Coliseum Records</h2></div><span>Combat XP and performance totals</span></header>
          {rankedCreatures.length ? <div className={styles.historyList}>{rankedCreatures.map(({ creature, record }) => <article key={creature.creatureId}><div><strong>{creature.nickname}</strong><span>Lv. {creature.level} · {record.battles} battles</span></div><div><strong>{record.wins}W · {record.losses}L</strong><span>{record.totalCombatXp} combat XP</span></div><div><strong>{record.damageDealt} damage · {record.healingDone} healing</strong><span>{record.statusesApplied} statuses · {record.alliesProtected} protections</span></div></article>)}</div> : <p className={styles.emptyHistory}>No creature combat records yet. Enter the Opening Scrimmage to begin.</p>}
        </section>

        <section className={styles.historyPanel} style={{ marginTop: 18 }}>
          <header><div><p className={styles.kicker}>Permanent Records</p><h2>Recent Coliseum History</h2></div><span>Latest {Math.min(progress.history.length, 40)} results</span></header>
          {progress.history.length ? <div className={styles.historyList}>{progress.history.map((entry) => <article key={entry.resultId}><div><strong>{entry.encounterName}</strong><span>{getColiseumC2Division(entry.divisionId).name} · Day {entry.completedAtDayNumber}</span></div><div><strong>{outcomeLabel(entry.outcome)}</strong><span>{entry.roundCount} rounds</span></div><div><strong>{getColiseumC2RewardLabel(entry.reward)}</strong><span>{entry.xpAwards.map((award) => `+${award.xp} XP`).join(" · ")}</span></div></article>)}</div> : <p className={styles.emptyHistory}>No permanent C2 matches recorded yet.</p>}
        </section>
      </section>
    </main>
  );
}

export function ColiseumBattle({
  encounter,
  onComplete,
  onReturn,
}: {
  encounter: ColiseumC2EncounterDefinition;
  onComplete: (outcome: BattleOutcome, rounds: number, teamCreatureIds: CreatureId[], performance: ColiseumCombatPerformanceMap, resultId: string) => void;
  onReturn: () => void;
}) {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [phase, setPhase] = useState<BattlePhase>("team-selection");
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<CreatureId[] | null>(null);
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
  const [message, setMessage] = useState(`Choose exactly three available creatures for ${encounter.name}.`);
  const presentation = useBattlePresentationController();

  const roster = currentSave?.creatures ?? [];
  const availableRoster = useMemo(() => currentSave ? roster.filter((creature) => !getUnavailableReason(currentSave, creature)) : [], [currentSave, roster]);
  const effectiveSelection = selectedCreatureIds !== null ? selectedCreatureIds : availableRoster.slice(0, 3).map((creature) => creature.creatureId);
  const enemyPreview = useMemo(() => getColiseumEnemyPreview(encounter), [encounter]);

  if (!currentSave) return null;

  const save = currentSave;
  const tacticsStock = getBattleOutfitterCombatStock(save, TEAM_TACTICS_KIT_ID);
  const tonicStock = getBattleOutfitterCombatStock(save, FIELD_TONIC_ID);
  const revivalStock = getBattleOutfitterCombatStock(save, REVIVAL_SALVE_ID);
  const sourceById = new Map<string, CreatureRecord>([...playerSources, ...enemySources].map((creature) => [String(creature.creatureId), creature]));
  const livingPlayerIds = battleState?.teams.player.combatantIds.filter((id) => !battleState.combatants[id].isFainted) ?? [];
  const allPlayerActionsQueued = Boolean(battleState) && livingPlayerIds.length > 0 && livingPlayerIds.every((id) => queuedActions.has(id));

  function startBattle() {
    const team = effectiveSelection.map((id) => roster.find((creature) => creature.creatureId === id)).filter((creature): creature is CreatureRecord => Boolean(creature));
    if (team.length !== 3) { setMessage("Select exactly three available creatures before entering the bracket."); return; }
    if (team.some(creature => getUnavailableReason(save, creature))) { setMessage("A selected creature is no longer available for battle."); return; }
    if (armTacticsKit && tacticsStock <= 0) { setMessage("No Team Tactics Kit is available."); return; }
    const enemies = buildAuthoredColiseumEnemyTeam(save.saveId, encounter);
    let state = applyAuthoredColiseumEquipment(
      applyBattleOutfitterLoadouts(
        save,
        createBattleState({
          battleId: `coliseum_c2_${encounter.encounterId}_${save.saveId}_${save.dayState.dayNumber}_${Date.now()}`,
          playerCreatures: team,
          enemyCreatures: enemies,
          playerTeamName: `${save.player.name}'s Ranch Team`,
          enemyTeamName: encounter.opponentName,
        }),
      ),
      encounter,
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
    setMessage(`${encounter.opponentName} enters with its authored formation. Target first, then choose a compatible move.`);
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
    if (!battleState || selectedTarget?.kind !== "combatant") { setMessage("Select a ranch-team creature before using a support item."); return; }
    const result = item === "tonic" ? applyFieldTonic(save, battleState, selectedTarget.combatantId) : applyRevivalSalve(save, battleState, selectedTarget.combatantId);
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
    presentation.play(buildBattlePlaybackEvents(resolved.frames), resolved.result.actions.map(action => action.actorId));
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
      setMessage(`${outcomeLabel(resolved.state.outcome)} in ${resolved.result.roundNumber} rounds. Review the purse and combat XP before recording.`);
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
    onComplete(finalOutcome, rounds, playerSources.map((creature) => creature.creatureId), performance, battleState.battleId);
  }

  if (phase === "team-selection") {
    return <ColiseumTeamStaging title={encounter.name} roster={roster} selected={effectiveSelection} onChange={setSelectedCreatureIds} onReturn={onReturn} onStart={startBattle} unavailable={c=>getUnavailableReason(save,c)} enemyPreview={enemyPreview} opponent={encounter.opponentName} strategy={encounter.strategyLabel} tacticsStock={tacticsStock} armed={armTacticsKit} onArm={()=>setArmTacticsKit(v=>!v)} message={message} rules={<p>Choose three available creatures. All participants gain Combat XP after a recorded result, including fainted creatures. Overleveled repeat clears receive reduced XP.</p>} />;
  }

  if (!battleState) return null;
  const xpPreview = phase === "result" ? previewColiseumCombatXp(save, encounter, battleState.outcome, playerSources.map((creature) => creature.creatureId), performance) : [];
  const receipt = phase === "result" ? recordColiseumC2BattleResult(save, encounter.encounterId, battleState.outcome, completedRounds || 1, playerSources.map(c=>c.creatureId), performance, battleState.battleId) : null;
  const firstClearAvailable = !getColiseumC2Progress(save).claimedFirstClearEncounterIds.includes(encounter.encounterId);
  return <BattleArenaB resultLedger={receipt?{rewards:getColiseumC2RewardLabel(receipt.reward),summaries:receipt.xpSummaries,performance,onRecord:()=>finalize(),recordLabel:"Record & Return to Coliseum"}:undefined} title={encounter.name} battleState={battleState} sourceById={sourceById} selectedTarget={selectedTarget} activeActorId={activeActorId} queuedActions={queuedActions} presentation={presentation} onTarget={setSelectedTarget} onPlan={planFor} onQueue={chooseMove} onConfirm={resolveRound} onReturn={onReturn} onForfeit={()=>finalize("enemy_won")} onItem={handleSupportItem} tonicStock={tonicStock} revivalStock={revivalStock} usedTonic={usedItems.fieldTonic} usedRevival={usedItems.revivalSalve} complete={phase==="result"} recording={recording} message={message} rules={<p>{getBattleAiDifficultyDescription(encounter.aiDifficulty)} Enemy actions remain hidden until resolution.</p>} result={<><h3>{outcomeLabel(battleState.outcome)}</h3><p>{battleState.outcome === "player_won" ? firstClearAvailable ? `First-clear purse: ${getColiseumC2RewardLabel(encounter.firstClearReward)}` : "A reward is selected from this encounter’s repeat purse when recorded." : "Defeats and draws grant no purse but still grant reduced Combat XP."}</p>{xpPreview.map(entry=><p key={entry.creatureId}>{entry.name} · +{entry.xp} Combat XP</p>)}{battleState.outcome === "enemy_won" && !usedItems.revivalSalve && revivalStock>0 && <p>You can close this review and use a Revival Salve on a fainted teammate before recording.</p>}<button onClick={()=>finalize()} disabled={recording||presentation.isPlaying}>{recording?"Recording…":"Record Result, XP & Purse"}</button></>}/>;
}
