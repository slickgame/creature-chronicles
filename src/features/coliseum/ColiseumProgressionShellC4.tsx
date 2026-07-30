"use client";

import { useState } from "react";
import { getColiseumC3State } from "@/data/coliseumC3";
import {
  abandonColiseumC4Run,
  buildColiseumC4Encounter,
  getColiseumC4Access,
  getColiseumC4ChallengeByKey,
  getColiseumC4DailyChallenge,
  getColiseumC4Gauntlets,
  getColiseumC4Modifier,
  getColiseumC4RewardMultiplier,
  getColiseumC4State,
  getColiseumC4Summary,
  getColiseumC4WeeklyBoss,
  recordColiseumC4BattleResult,
  type ColiseumC4ChallengeDefinition,
  type ColiseumC4Result,
} from "@/data/coliseumC4";
import { useGameContext } from "@/state/GameProvider";
import type { BattleOutcome, BattleState } from "@/types/battle";
import type { CreatureId } from "@/types/ids";
import type { ColiseumCombatPerformanceMap } from "@/data/coliseumC2";
import { ColiseumProgressionScreen as ColiseumProgressionScreenC3 } from "./ColiseumProgressionShellC3";
import styles from "./ColiseumC4.module.css";

const { ColiseumC4Battle } = require("./ColiseumC4Battle") as {
  ColiseumC4Battle: React.ElementType;
};

type C4HubMode = "overview" | "daily" | "gauntlets" | "boss" | "records" | "legacy";

function titleCase(value: string): string {
  return value.split(/[_-]/g).map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

function outcomeLabel(outcome: BattleOutcome): string {
  if (outcome === "player_won") return "Victory";
  if (outcome === "enemy_won") return "Defeat";
  if (outcome === "draw") return "Draw";
  return "Ongoing";
}

function rewardLabel(challenge: ColiseumC4ChallengeDefinition): string {
  const pieces = [`${challenge.reward.marks} Marks`, `${challenge.reward.materials} Materials`];
  if (challenge.reward.itemId && challenge.reward.itemQuantity) pieces.push(`${challenge.reward.itemQuantity} ${titleCase(challenge.reward.itemId)}`);
  return pieces.join(" • ");
}

function ChallengeCard({
  challenge,
  unlocked,
  lockReason,
  claimed,
  activeStage,
  onLaunch,
}: {
  challenge: ColiseumC4ChallengeDefinition;
  unlocked: boolean;
  lockReason: string;
  claimed: boolean;
  activeStage?: number;
  onLaunch: () => void;
}) {
  return (
    <article className={styles.challengeCard} data-locked={!unlocked}>
      <div className={styles.cardMeta}>
        <span>{challenge.mode}</span>
        <span>{challenge.encounterIds.length} stage{challenge.encounterIds.length === 1 ? "" : "s"}</span>
        <span>{Math.round(getColiseumC4RewardMultiplier(challenge.modifierIds) * 100)}% reward scale</span>
      </div>
      <div>
        <p className={styles.kicker}>{challenge.subtitle}</p>
        <h3>{challenge.name}</h3>
        <p>{challenge.description}</p>
      </div>
      <div className={styles.modifierList}>
        {challenge.modifierIds.map((id) => {
          const modifier = getColiseumC4Modifier(id);
          return <article key={id}><strong>{modifier.name}</strong><span>{modifier.description}</span><small>{modifier.rewardBonusPercent >= 0 ? "+" : ""}{modifier.rewardBonusPercent}% reward weight</small></article>;
        })}
      </div>
      <div className={styles.recordLine}>
        <span>Enemy levels +{challenge.levelBonus}</span>
        <span>{challenge.aiDifficultyOverride ? `${titleCase(challenge.aiDifficultyOverride)} AI` : "Source AI"}</span>
        <span>{claimed ? "Primary reward claimed" : "Primary reward available"}</span>
      </div>
      {!unlocked ? <p>{lockReason}</p> : null}
      {activeStage !== undefined ? <p><strong>Active run:</strong> continue at stage {activeStage + 1}/{challenge.encounterIds.length} with the locked roster.</p> : null}
      <div className={styles.rewardLine}>
        <strong>{rewardLabel(challenge)}</strong>
        <button type="button" className={styles.primaryButton} onClick={onLaunch} disabled={!unlocked}>{activeStage !== undefined ? "Continue Run" : "Enter Challenge"}</button>
      </div>
    </article>
  );
}

export function ColiseumProgressionScreen() {
  const { currentSave, goToBattleOutfitter, goToMainMenu, goToTown, saveCurrentGame } = useGameContext();
  const [mode, setMode] = useState<C4HubMode>("overview");
  const [selectedChallenge, setSelectedChallenge] = useState<ColiseumC4ChallengeDefinition | null>(null);
  const [message, setMessage] = useState("C4 adds rotating daily battles, persistent gauntlets, weekly boss trials, modifiers, partial recovery, and local weekly scoring.");

  if (!currentSave) {
    return <main className={styles.shell}><section className={styles.frame}><section className={styles.panel}><h1>No active save</h1><p>Load a save before entering the Coliseum.</p><button type="button" className={styles.primaryButton} onClick={goToMainMenu}>Main Menu</button></section></section></main>;
  }

  const save = currentSave;
  const c3State = getColiseumC3State(save);
  const state = getColiseumC4State(save);
  const summary = getColiseumC4Summary(save);
  const daily = getColiseumC4DailyChallenge(save);
  const gauntlets = getColiseumC4Gauntlets(save);
  const boss = getColiseumC4WeeklyBoss(save);
  const activeChallenge = state.activeRun ? getColiseumC4ChallengeByKey(save, state.activeRun.challengeKey) : null;

  const selectedStageIndex = selectedChallenge && state.activeRun?.challengeKey === selectedChallenge.challengeKey
    ? state.activeRun.stageIndex
    : 0;
  const selectedEncounter = selectedChallenge ? buildColiseumC4Encounter(selectedChallenge, selectedStageIndex) : null;
  const selectedLockedTeam = selectedChallenge && state.activeRun?.challengeKey === selectedChallenge.challengeKey
    ? state.activeRun.teamCreatureIds
    : undefined;
  const selectedCarryover = selectedChallenge && state.activeRun?.challengeKey === selectedChallenge.challengeKey
    ? state.activeRun.carryover
    : undefined;

  function applyResult(result: ColiseumC4Result) {
    if (result.changed) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  function launchChallenge(challenge: ColiseumC4ChallengeDefinition) {
    const access = getColiseumC4Access(save, challenge);
    if (!access.unlocked) {
      setMessage(access.reason);
      return;
    }
    setSelectedChallenge(challenge);
  }

  function finishBattle(
    outcome: BattleOutcome,
    rounds: number,
    teamCreatureIds: CreatureId[],
    performance: ColiseumCombatPerformanceMap,
    resultId: string,
    finalState: BattleState,
  ) {
    if (!selectedChallenge) return;
    const result = recordColiseumC4BattleResult(
      save,
      selectedChallenge,
      selectedStageIndex,
      outcome,
      rounds,
      teamCreatureIds,
      performance,
      resultId,
      finalState,
    );
    applyResult(result);
    setSelectedChallenge(null);
  }

  function abandonRun() {
    const result = abandonColiseumC4Run(save);
    applyResult(result);
    setSelectedChallenge(null);
  }

  if (selectedChallenge && selectedEncounter) {
    return (
      <ColiseumC4Battle
        key={`${selectedChallenge.challengeKey}_${selectedStageIndex}`}
        challenge={selectedChallenge}
        stageIndex={selectedStageIndex}
        encounter={selectedEncounter}
        lockedTeamCreatureIds={selectedLockedTeam}
        carryover={selectedCarryover}
        onComplete={finishBattle}
        onReturn={() => { setSelectedChallenge(null); setMessage("Challenge entry cancelled. No C4 record, score, XP, or reward was created."); }}
      />
    );
  }

  if (mode === "legacy") {
    return (
      <div>
        <div className={styles.legacyOverlay}><button type="button" onClick={() => setMode("overview")}>Return to C4 Challenge Modes</button></div>
        <ColiseumProgressionScreenC3 />
      </div>
    );
  }

  const dailyClaimed = state.dailyClaimKeys.includes(daily.claimKey);
  const bossClaimed = state.weeklyBossClaimKeys.includes(boss.claimKey);
  const rankedCreatures = Object.values(state.creatureRecords)
    .sort((left, right) => right.bestScore - left.bestScore || right.wins - left.wins)
    .slice(0, 8);
  const weeklyScores = Object.values(state.weeklyScores)
    .sort((left, right) => Number(right.weekKey.replace("week_", "")) - Number(left.weekKey.replace("week_", "")))
    .slice(0, 12);
  const dailyAccess = getColiseumC4Access(save, daily);
  const bossAccess = getColiseumC4Access(save, boss);

  const toolbar = (
    <nav className={styles.toolbar} aria-label="Coliseum C4 navigation">
      <div className={styles.markPill}><span>Coliseum Marks</span><strong>{c3State.marks}</strong></div>
      <button type="button" data-active={mode === "overview"} onClick={() => setMode("overview")}>C4 Overview</button>
      <button type="button" data-active={mode === "daily"} onClick={() => setMode("daily")}>Daily Challenge</button>
      <button type="button" data-active={mode === "gauntlets"} onClick={() => setMode("gauntlets")}>Gauntlets</button>
      <button type="button" data-active={mode === "boss"} onClick={() => setMode("boss")}>Boss Trial</button>
      <button type="button" data-active={mode === "records"} onClick={() => setMode("records")}>Weekly Board & Records</button>
      <button type="button" onClick={() => setMode("legacy")}>Permanent Circuit & Exchange</button>
      <button type="button" onClick={goToBattleOutfitter}>Outfitter</button>
      <button type="button" onClick={goToTown}>Town</button>
    </nav>
  );

  return (
    <main className={styles.shell}>
      <section className={styles.frame}>
        {toolbar}
        <header className={styles.header}>
          <div><p className={styles.kicker}>Coliseum C4</p><h1>Rotating Challenges & Multi-Battle Trials</h1><p>{message}</p></div>
          <div className={styles.markPill}><span>Current Rotation</span><strong>{summary.weekKey.replace("_", " ")}</strong><small>Ranch Day {save.dayState.dayNumber}</small></div>
        </header>

        <section className={styles.summaryGrid}>
          <article className={styles.summaryCard}><span>Weekly Personal Score</span><strong>{summary.weeklyScore}</strong><small>{summary.weeklyClears} completed challenge{summary.weeklyClears === 1 ? "" : "s"}</small></article>
          <article className={styles.summaryCard}><span>C4 Record</span><strong>{summary.totalC4Clears} clears</strong><small>{summary.totalC4Battles} challenge battles</small></article>
          <article className={styles.summaryCard}><span>Daily Reward</span><strong>{summary.dailyClaimed ? "Claimed" : "Available"}</strong><small>Changes with the next Ranch Day</small></article>
          <article className={styles.summaryCard}><span>Weekly Boss</span><strong>{summary.bossClaimed ? "Claimed" : "Available"}</strong><small>{boss.name}</small></article>
          <article className={styles.summaryCard}><span>Active Gauntlet</span><strong>{state.activeRun ? `Stage ${state.activeRun.stageIndex + 1}/3` : "None"}</strong><small>{activeChallenge?.name ?? "Start from the Gauntlets tab"}</small></article>
        </section>

        <p className={styles.message}>{message}</p>

        {state.activeRun && activeChallenge ? (
          <section className={styles.activeRun}>
            <div><p className={styles.kicker}>Persistent Active Run</p><h2>{activeChallenge.name}</h2><p>The same three creatures are locked for stage {state.activeRun.stageIndex + 1}/{activeChallenge.encounterIds.length}. Their recovered HP and Battle Energy are saved in the run state.</p></div>
            <div className={styles.recordLine}><span>{state.activeRun.totalRounds} rounds completed</span><span>Started Day {state.activeRun.startedDayNumber}</span><span>30% HP + 25% BE recovery</span></div>
            <div className={styles.activeActions}><button type="button" className={styles.primaryButton} onClick={() => launchChallenge(activeChallenge)}>Continue Stage {state.activeRun.stageIndex + 1}</button><button type="button" className={styles.dangerButton} onClick={abandonRun}>Abandon Gauntlet</button></div>
          </section>
        ) : null}

        {mode === "overview" ? (
          <>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.kicker}>Today</p><h2>Daily Challenge</h2><p>One deterministic encounter and modifier pair per Ranch Day.</p></div></div>
              <div className={styles.challengeGrid}><ChallengeCard challenge={daily} unlocked={dailyAccess.unlocked} lockReason={dailyAccess.reason} claimed={dailyClaimed} onLaunch={() => launchChallenge(daily)} /></div>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.kicker}>This Week</p><h2>Rotating Boss Trial</h2><p>One elevated authored formation with a weekly reward claim.</p></div></div>
              <div className={styles.challengeGrid}><ChallengeCard challenge={boss} unlocked={bossAccess.unlocked} lockReason={bossAccess.reason} claimed={bossClaimed} onLaunch={() => launchChallenge(boss)} /></div>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.kicker}>Multi-Battle Progression</p><h2>Gauntlet Routes</h2><p>Locked teams, persistent stage progress, and partial recovery between fights.</p></div></div>
              <div className={styles.challengeGrid}>{gauntlets.map((challenge) => { const access = getColiseumC4Access(save, challenge); return <ChallengeCard key={challenge.challengeKey} challenge={challenge} unlocked={access.unlocked} lockReason={access.reason} claimed={state.weeklyGauntletClaimKeys.includes(challenge.claimKey)} activeStage={state.activeRun?.challengeKey === challenge.challengeKey ? state.activeRun.stageIndex : undefined} onLaunch={() => launchChallenge(challenge)} />; })}</div>
            </section>
          </>
        ) : null}

        {mode === "daily" ? <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.kicker}>Ranch Day {save.dayState.dayNumber}</p><h2>Daily Challenge</h2><p>The opponent and modifiers are deterministic for this save and day. Reloading does not reroll them.</p></div></div><div className={styles.challengeGrid}><ChallengeCard challenge={daily} unlocked={dailyAccess.unlocked} lockReason={dailyAccess.reason} claimed={dailyClaimed} onLaunch={() => launchChallenge(daily)} /></div></section> : null}

        {mode === "gauntlets" ? <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.kicker}>Three Consecutive Battles</p><h2>Gauntlet Routes</h2><p>Winning a stage stores the exact roster plus recovered HP and Battle Energy. Statuses and cooldowns clear between stages.</p></div></div><div className={styles.challengeGrid}>{gauntlets.map((challenge) => { const access = getColiseumC4Access(save, challenge); return <ChallengeCard key={challenge.challengeKey} challenge={challenge} unlocked={access.unlocked} lockReason={access.reason} claimed={state.weeklyGauntletClaimKeys.includes(challenge.claimKey)} activeStage={state.activeRun?.challengeKey === challenge.challengeKey ? state.activeRun.stageIndex : undefined} onLaunch={() => launchChallenge(challenge)} />; })}</div></section> : null}

        {mode === "boss" ? <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.kicker}>{summary.weekKey.replace("_", " ")}</p><h2>Weekly Boss Trial</h2><p>The active boss changes by save and week. Practice rematches still grant XP after the weekly Marks reward is claimed.</p></div></div><div className={styles.challengeGrid}><ChallengeCard challenge={boss} unlocked={bossAccess.unlocked} lockReason={bossAccess.reason} claimed={bossClaimed} onLaunch={() => launchChallenge(boss)} /></div></section> : null}

        {mode === "records" ? (
          <>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.kicker}>Local Weekly Rotation</p><h2>Personal Scoreboard</h2><p>This is a save-local performance board, not an online leaderboard.</p></div></div>
              <div className={styles.scoreGrid}>{weeklyScores.length ? weeklyScores.map((entry) => <article key={entry.weekKey} className={styles.scoreCard}><div><span>Rotation</span><strong>{entry.weekKey.replace("_", " ")}</strong></div><div><span>Best Score</span><strong>{entry.score}</strong></div><div><span>Clears</span><strong>{entry.clears}</strong></div><div><span>Best Challenge</span><strong>{entry.bestChallengeName ?? "None"}</strong><small>{entry.bestMode ? titleCase(entry.bestMode) : "No completed run"}</small></div></article>) : <p className={styles.empty}>No weekly C4 score has been recorded.</p>}</div>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.kicker}>Creature Challenge Records</p><h2>Top C4 Competitors</h2></div></div>
              <div className={styles.historyList}>{rankedCreatures.length ? rankedCreatures.map((record) => { const creature = save.creatures?.find((entry) => entry.creatureId === record.creatureId); return <article key={record.creatureId} className={styles.historyEntry}><div><strong>{creature?.nickname ?? record.creatureId}</strong><span>{record.battles} battles · {record.wins} wins</span></div><div><strong>{record.totalCombatXp} XP</strong><small>C4 combat XP</small></div><div><strong>{record.gauntletClears} gauntlets</strong><small>{record.bossClears} boss clears</small></div><div><strong>{record.bestScore}</strong><small>Best score</small></div></article>; }) : <p className={styles.empty}>No creature C4 records yet.</p>}</div>
            </section>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.kicker}>Persistent Challenge Ledger</p><h2>Recent C4 Results</h2></div></div>
              <div className={styles.historyList}>{state.history.length ? state.history.map((entry) => <article key={entry.resultId} className={styles.historyEntry}><div><strong>{entry.challengeName}</strong><span>{titleCase(entry.mode)} · Stage {entry.stageNumber}/{entry.stageCount} · Day {entry.completedAtDayNumber}</span></div><div><strong className={entry.outcome === "player_won" ? styles.positive : styles.negative}>{outcomeLabel(entry.outcome)}</strong><small>{entry.rounds} rounds · {entry.totalRunRounds} run total</small></div><div><strong>{entry.score} score</strong><small>{titleCase(entry.rewardTier)} reward</small></div><div><strong>+{entry.marks} Marks</strong><small>+{entry.materials} Materials</small></div></article>) : <p className={styles.empty}>No C4 results have been recorded.</p>}</div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
