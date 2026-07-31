"use client";

import { useMemo, useState } from "react";
import {
  buildBattleAiPlan,
  formatBattleAiDecision,
  getBattleAiDifficultyDescription,
  getBattleAiDifficultyLabel,
} from "@/data/battleAi";
import { createBattleState, getEffectiveBattleStats, resolveBattleRound } from "@/data/battleEngine";
import { buildBattlePresentationEvents } from "@/data/battlePresentation";
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
  getBattleUiMoveOptions,
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
import { getVariantDefinition } from "@/data/creatures";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type {
  BattleAction,
  BattleCombatant,
  BattleCombatantId,
  BattleOutcome,
  BattleState,
} from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import battleStyles from "@/features/battle/BattleArenaScreen.module.css";
import { BattleLogButton, BattleMoveGrid } from "@/features/battle/BattleCommandDialogs";
import { BattlePortraitStage } from "@/features/battle/BattlePortraitStage";
import { useBattlePresentationController } from "@/features/battle/useBattlePresentationController";
import styles from "./ColiseumProgressionScreen.module.css";

const FALLBACK_PORTRAIT = "/images/ui/icons/icon_paw_crest.png";
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

function statusLabel(combatant: BattleCombatant): string {
  if (!combatant.statuses.length) return "No status effects";
  return combatant.statuses
    .map((status) => `${status.status}${(status.stacks ?? 1) > 1 ? ` ×${status.stacks}` : ""} · ${status.duration}r`)
    .join(" • ");
}

function creaturePortrait(creature?: CreatureRecord): string {
  if (!creature) return FALLBACK_PORTRAIT;
  return getVariantDefinition(creature.variantId).portraitPath || FALLBACK_PORTRAIT;
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
          <span>{combatant.sideId === "enemy" ? "Authored Opponent" : `Team Slot ${combatant.slotIndex + 1}`}</span>
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
  recordLabel,
  onToggle,
}: {
  creature: CreatureRecord;
  selected: boolean;
  unavailableReason: string | null;
  readinessLabel: string;
  recordLabel: string;
  onToggle: () => void;
}) {
  const variant = getVariantDefinition(creature.variantId);
  return (
    <button type="button" className={`${battleStyles.rosterCard} ${selected ? battleStyles.rosterSelected : ""}`} onClick={onToggle} disabled={Boolean(unavailableReason)}>
      <span className={battleStyles.rosterPortrait} data-ui-fixed-size="true"><img src={variant.portraitPath || FALLBACK_PORTRAIT} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_PORTRAIT; }} /></span>
      <span className={battleStyles.rosterInfo}>
        <strong>{creature.nickname}</strong>
        <em>Lv. {creature.level} · {variant.name} · {creature.xp}/{creature.xpToNext} XP</em>
        <small>{unavailableReason ?? (selected ? "Selected for this bracket" : "Available")}</small>
        <small>{readinessLabel} · {recordLabel}</small>
      </span>
      <span className={battleStyles.selectionMark}>{selected ? "✓" : "+"}</span>
    </button>
  );
}

export function ColiseumC2Screen() {
  const { currentSave, goToBattleOutfitter, goToMainMenu, goToTown, saveCurrentGame } = useGameContext();
  const [mode, setMode] = useState<ColiseumMode>("hub");
  const [selectedEncounter, setSelectedEncounter] = useState<ColiseumC2EncounterDefinition | null>(null);
  const [message, setMessage] = useState("Choose an unlocked authored opponent. Recorded matches now grant combat XP and persistent creature battle records.");

  if (!currentSave) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load a save before entering the Coliseum.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;
  }

  function openEncounter(encounter: ColiseumC2EncounterDefinition) {
    const access = getColiseumC2Access(currentSave, encounter);
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
    const result = recordColiseumC2BattleResult(currentSave, selectedEncounter.encounterId, outcome, rounds, teamCreatureIds, performance, resultId);
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

  const progress = getColiseumC2Progress(currentSave);
  const nextEncounter = getColiseumC2NextEncounter(currentSave);
  const highestDivision = getColiseumC2HighestDivision(currentSave);
  const availableCreatures = (currentSave.creatures ?? []).filter((creature) => !getUnavailableReason(currentSave, creature));
  const rankedCreatures = [...(currentSave.creatures ?? [])]
    .map((creature) => ({ creature, record: getColiseumCreatureBattleRecord(currentSave, creature.creatureId) }))
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
            <div className={styles.resource}><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div>
            <div className={styles.resource}><span>Guild Points</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div>
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
                    const access = getColiseumC2Access(currentSave, encounter);
                    const record = getColiseumC2EncounterRecord(currentSave, encounter.encounterId);
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

function ColiseumBattle({
  encounter,
  onComplete,
  onReturn,
}: {
  encounter: ColiseumC2EncounterDefinition;
  onComplete: (outcome: BattleOutcome, rounds: number, teamCreatureIds: CreatureId[], performance: ColiseumCombatPerformanceMap, resultId: string) => void;
  onReturn: () => void;
}) {
  const { currentSave, goToBattleOutfitter, saveCurrentGame } = useGameContext();
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
  const [performance, setPerformance] = useState<ColiseumCombatPerformanceMap>({});
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState(`Choose exactly three available creatures for ${encounter.name}.`);
  const presentation = useBattlePresentationController();

  const roster = currentSave?.creatures ?? [];
  const availableRoster = useMemo(() => currentSave ? roster.filter((creature) => !getUnavailableReason(currentSave, creature)) : [], [currentSave, roster]);
  const effectiveSelection = selectedCreatureIds.length ? selectedCreatureIds : availableRoster.slice(0, 3).map((creature) => creature.creatureId);
  const enemyPreview = useMemo(() => getColiseumEnemyPreview(encounter), [encounter]);

  if (!currentSave) return null;

  const tacticsStock = getBattleOutfitterCombatStock(currentSave, TEAM_TACTICS_KIT_ID);
  const tonicStock = getBattleOutfitterCombatStock(currentSave, FIELD_TONIC_ID);
  const revivalStock = getBattleOutfitterCombatStock(currentSave, REVIVAL_SALVE_ID);
  const sourceById = new Map<string, CreatureRecord>([...playerSources, ...enemySources].map((creature) => [String(creature.creatureId), creature]));
  const livingPlayerIds = battleState?.teams.player.combatantIds.filter((id) => !battleState.combatants[id].isFainted) ?? [];
  const activeActor = battleState && activeActorId ? battleState.combatants[activeActorId] : null;
  const moveOptions = battleState && activeActorId ? getBattleUiMoveOptions(battleState, activeActorId, selectedTarget) : [];
  const compatibleMoves = moveOptions.filter((option) => option.compatible);
  const allPlayerActionsQueued = Boolean(battleState) && livingPlayerIds.length > 0 && livingPlayerIds.every((id) => queuedActions.has(id));

  function toggleCreature(creature: CreatureRecord) {
    const unavailableReason = getUnavailableReason(currentSave, creature);
    if (unavailableReason) { setMessage(unavailableReason); return; }
    if (effectiveSelection.includes(creature.creatureId)) { setSelectedCreatureIds(effectiveSelection.filter((id) => id !== creature.creatureId)); return; }
    if (effectiveSelection.length >= 3) { setMessage("A Coliseum team contains exactly three creatures. Remove one first."); return; }
    setSelectedCreatureIds([...effectiveSelection, creature.creatureId]);
  }

  function startBattle() {
    const team = effectiveSelection.map((id) => roster.find((creature) => creature.creatureId === id)).filter((creature): creature is CreatureRecord => Boolean(creature));
    if (team.length !== 3) { setMessage("Select exactly three available creatures before entering the bracket."); return; }
    if (armTacticsKit && tacticsStock <= 0) { setMessage("No Team Tactics Kit is available."); return; }
    const enemies = buildAuthoredColiseumEnemyTeam(currentSave.saveId, encounter);
    let state = applyAuthoredColiseumEquipment(
      applyBattleOutfitterLoadouts(
        currentSave,
        createBattleState({
          battleId: `coliseum_c2_${encounter.encounterId}_${currentSave.saveId}_${currentSave.dayState.dayNumber}_${Date.now()}`,
          playerCreatures: team,
          enemyCreatures: enemies,
          playerTeamName: `${currentSave.player.name}'s Ranch Team`,
          enemyTeamName: encounter.opponentName,
        }),
      ),
      encounter,
    );
    let tacticsUsed = false;
    if (armTacticsKit) {
      const result = applyTeamTacticsKit(currentSave, state);
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

  function useSupportItem(item: "tonic" | "revival") {
    if (presentation.isPlaying) return;
    if (!battleState || selectedTarget?.kind !== "combatant") { setMessage("Select a ranch-team creature before using a support item."); return; }
    const result = item === "tonic" ? useFieldTonic(currentSave, battleState, selectedTarget.combatantId) : useRevivalSalve(currentSave, battleState, selectedTarget.combatantId);
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
    presentation.play(buildBattlePresentationEvents(battleState, resolved.state, resolved.result));
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
    if (recording || !battleState) return;
    setRecording(true);
    const finalOutcome = outcome ?? battleState.outcome ?? "enemy_won";
    const rounds = completedRounds || Math.max(1, battleState.roundNumber - 1);
    onComplete(finalOutcome, rounds, playerSources.map((creature) => creature.creatureId), performance, battleState.battleId);
  }

  if (phase === "team-selection") {
    return (
      <main className={battleStyles.screen}>
        <section className={battleStyles.frame}>
          <header className={battleStyles.header}>
            <div><p className={battleStyles.kicker}>{getColiseumC2Division(encounter.divisionId).name}</p><h1>{encounter.name}</h1><p>{message}</p></div>
            <div className={battleStyles.headerActions}><button type="button" className={battleStyles.secondaryButton} onClick={goToBattleOutfitter}>Battle Outfitter</button><button type="button" onClick={onReturn}>Back to Coliseum</button></div>
          </header>
          <section className={battleStyles.selectionSummary} data-ui-text-box="auto">
            <div><span>Selected</span><strong>{effectiveSelection.length} / 3</strong></div>
            <div><span>Opponent</span><strong>{encounter.opponentName}</strong><small>{encounter.strategyLabel}</small></div>
            <div><span>AI</span><strong>{getBattleAiDifficultyLabel(encounter.aiDifficulty)}</strong><small>{getBattleAiDifficultyDescription(encounter.aiDifficulty)}</small></div>
            <div><span>Team Prep</span><button type="button" className={armTacticsKit ? battleStyles.confirmButton : battleStyles.secondaryButton} onClick={() => setArmTacticsKit((value) => !value)} disabled={tacticsStock <= 0}>{armTacticsKit ? "Tactics Kit Armed" : `Use Tactics Kit (${tacticsStock})`}</button><small>Consumed when the match starts.</small></div>
          </section>

          <section style={{ ...darkPanel, margin: "12px 0", padding: 13 }} data-ui-text-box="auto">
            <div className={battleStyles.panelHeading}><div><span>Authored Opponent Preview</span><strong>Fixed Team</strong></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
              {enemyPreview.map((enemy) => <article key={enemy.name} style={{ ...darkPanel, padding: 11, background: "rgba(32,18,16,.78)" }}><strong>{enemy.name}</strong><span style={{ display: "block", color: "#eebd68" }}>Lv. {enemy.level} {enemy.variantName} · {enemy.role}</span><small style={{ display: "block", margin: "5px 0" }}>{enemy.equipment}</small><small>{enemy.moves.join(" · ")}</small></article>)}
            </div>
          </section>

          <section className={battleStyles.rosterGrid}>{roster.map((creature) => { const record = getColiseumCreatureBattleRecord(currentSave, creature.creatureId); return <TeamSelectionCard key={creature.creatureId} creature={creature} selected={effectiveSelection.includes(creature.creatureId)} unavailableReason={getUnavailableReason(currentSave, creature)} readinessLabel={getBattleReadinessLabel(currentSave, creature.creatureId)} recordLabel={`${record.wins}W · ${record.totalCombatXp} combat XP`} onToggle={() => toggleCreature(creature)} />; })}</section>
          <footer className={battleStyles.selectionFooter}><p>All three participants gain combat XP after a recorded result, including fainted creatures. Overleveled repeat clears receive reduced XP.</p><button type="button" onClick={startBattle} disabled={effectiveSelection.length !== 3}>Enter {encounter.name}</button></footer>
        </section>
      </main>
    );
  }

  if (!battleState) return null;
  const xpPreview = phase === "result" ? previewColiseumCombatXp(currentSave, encounter, battleState.outcome, playerSources.map((creature) => creature.creatureId), performance) : [];
  const progress = getColiseumC2Progress(currentSave);
  const firstClearAvailable = !progress.claimedFirstClearEncounterIds.includes(encounter.encounterId);

  return (
    <main className={battleStyles.screen}>
      <section className={battleStyles.frame}>
        <header className={`${battleStyles.header} ${battleStyles.battleHeader}`}>
          <div><p className={battleStyles.kicker}>{getColiseumC2Division(encounter.divisionId).name} · {getBattleAiDifficultyLabel(encounter.aiDifficulty)} AI</p><h1>{phase === "result" ? "Match Complete" : `Round ${battleState.roundNumber}`}</h1><p title={message}>{message}</p></div>
          <div className={battleStyles.headerActions}><button type="button" className={battleStyles.secondaryButton} onClick={() => finalize("enemy_won")} disabled={recording}>Forfeit & Record Loss</button><button type="button" onClick={onReturn}>Leave Without Record</button></div>
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
            <div className={battleStyles.panelHeading}><div><span>Current Actor</span><strong>{activeActor?.name ?? (phase === "result" ? "Battle Complete" : "All Actions Queued")}</strong></div><div><span>Selected Target</span><strong>{selectedTarget?.kind === "field" ? "Battlefield" : selectedTarget?.kind === "combatant" ? battleState.combatants[selectedTarget.combatantId]?.name ?? "Unknown" : "Choose a target"}</strong></div></div>
            {phase === "result" ? (
              <div className={battleStyles.resultPanel}>
                <h2>{outcomeLabel(battleState.outcome)}</h2>
                <p>{battleState.outcome === "player_won" ? firstClearAvailable ? `First-clear purse: ${getColiseumC2RewardLabel(encounter.firstClearReward)}` : "A deterministic reward will be selected from this encounter's repeat purse." : "Defeats and draws grant no purse but still grant reduced combat XP."}</p>
                <div style={{ ...darkPanel, padding: 10, margin: "8px 0" }}>{xpPreview.map((entry) => <p key={entry.creatureId} style={{ margin: "3px 0" }}><strong>{entry.name}</strong> +{entry.xp} combat XP</p>)}</div>
                {battleState.outcome === "enemy_won" && !usedItems.revivalSalve && revivalStock > 0 ? <p>Select a fainted ranch creature and use a Revival Salve to resume before recording.</p> : null}
                <button type="button" onClick={() => finalize()} disabled={recording}>{recording ? "Recording…" : "Record Result, XP & Purse"}</button>
              </div>
            ) : selectedTarget && activeActor ? (
              compatibleMoves.length ? <BattleMoveGrid options={compatibleMoves} actor={activeActor} onChooseMove={chooseMove} /> : <div className={battleStyles.emptyMoveState}><strong>No compatible equipped moves</strong><p>Select a different target pattern.</p></div>
            ) : <div className={battleStyles.emptyMoveState}><strong>Target first</strong><p>Select a creature or the battlefield, then choose one of the active creature's moves.</p></div>}

            <footer className={battleStyles.actionFooter}>
              <div className={battleStyles.queueSummary} title={`Enemy actions remain hidden until resolution. ${getBattleAiDifficultyDescription(encounter.aiDifficulty)}`}>
                <span>Ranch Actions</span>
                <strong>{queuedActions.size} / {livingPlayerIds.length} planned</strong>
                <small>Click a green portrait above to plan or edit.</small>
              </div>

              <details className={battleStyles.supportDrawer}>
                <summary>Support Items</summary>
                <div>
                  <p className={battleStyles.statusLine}>Each item type may be used once. Select a ranch creature before using an item.</p>
                  <div className={battleStyles.cardActions}><button type="button" onClick={() => useSupportItem("tonic")} disabled={usedItems.fieldTonic || tonicStock <= 0 || phase === "result"}>Field Tonic ({tonicStock})</button><button type="button" onClick={() => useSupportItem("revival")} disabled={usedItems.revivalSalve || revivalStock <= 0}>Revival Salve ({revivalStock})</button></div>
                </div>
              </details>

              <BattleLogButton entries={battleState.log} />
              {phase !== "result" ? <button type="button" className={battleStyles.confirmButton} onClick={resolveRound} disabled={presentation.isPlaying || !allPlayerActionsQueued}>Confirm Round</button> : null}
            </footer>
          </div>
        </section>
      </section>
    </main>
  );
}
