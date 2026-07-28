"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getBreedingParticipants, PLAYER_PARTICIPANT_ID } from "@/data/breeding";
import {
  buildCurrentSaveBalanceScenario,
  getBreedingBalancePreset,
} from "@/data/balance/breedingBalancePresets";
import { runBreedingEconomySimulation } from "@/data/balance/breedingEconomySimulation";
import type {
  BalancePairStrategy,
  BalanceScenarioSource,
  BalanceSimulationMode,
  BalanceSimulationProgress,
  BalanceSnackPolicy,
  BalanceTonicPolicy,
  BreedingEconomyResult,
  BreedingEconomyScenario,
} from "@/data/balance/breedingEconomyTypes";
import type { GameSave } from "@/types/save";
import styles from "./BalanceLabPanel.module.css";

const SOURCES: Array<{ value: BalanceScenarioSource; label: string }> = [
  { value: "current", label: "Current Save Snapshot" },
  { value: "new-ranch", label: "New Ranch" },
  { value: "typical-ranch", label: "Typical Ranch" },
  { value: "established-ranch", label: "Established Ranch" },
  { value: "optimized-ranch", label: "Optimized Ranch" },
];

const RUN_OPTIONS = [100, 1000, 10000] as const;
const DAY_OPTIONS = [7, 30, 90] as const;

function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatGold(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} Gold`;
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={styles.metric} data-ui-text-box="auto">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className={styles.row}><span>{label}</span><strong>{value}</strong></div>;
}

export function BalanceLabPanel({ save }: { save: GameSave }) {
  const participants = useMemo(() => getBreedingParticipants(save), [save]);
  const defaultReceiver = useMemo(
    () => participants.find((participant) => participant.kind === "creature" && participant.canBreed && !participant.isPregnant) ?? participants.find((participant) => participant.kind === "creature") ?? null,
    [participants],
  );
  const defaultGiver = participants.find((participant) => participant.participantId === PLAYER_PARTICIPANT_ID) ?? participants[0] ?? null;

  const [source, setSource] = useState<BalanceScenarioSource>("current");
  const [giverId, setGiverId] = useState(defaultGiver?.participantId ?? "");
  const [receiverId, setReceiverId] = useState(defaultReceiver?.participantId ?? "");
  const [mode, setMode] = useState<BalanceSimulationMode>("timeline");
  const [runs, setRuns] = useState<(typeof RUN_OPTIONS)[number]>(1000);
  const [timelineDays, setTimelineDays] = useState(30);
  const [pairStrategy, setPairStrategy] = useState<BalancePairStrategy>("repeat-pair");
  const [snackPolicy, setSnackPolicy] = useState<BalanceSnackPolicy>("when-blocked");
  const [tonicPolicy, setTonicPolicy] = useState<BalanceTonicPolicy>("never");
  const [snackMaxPerDay, setSnackMaxPerDay] = useState(4);
  const [goldIncomePerDay, setGoldIncomePerDay] = useState(0);
  const [fixedGoldSpendPerDay, setFixedGoldSpendPerDay] = useState(0);
  const [seed, setSeed] = useState(260728);
  const [result, setResult] = useState<BreedingEconomyResult | null>(null);
  const [progress, setProgress] = useState<BalanceSimulationProgress | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!giverId && defaultGiver) setGiverId(defaultGiver.participantId);
    if (!receiverId && defaultReceiver) setReceiverId(defaultReceiver.participantId);
  }, [defaultGiver, defaultReceiver, giverId, receiverId]);

  useEffect(() => {
    if (giverId === receiverId && defaultReceiver && defaultReceiver.participantId !== giverId) {
      setReceiverId(defaultReceiver.participantId);
    }
  }, [defaultReceiver, giverId, receiverId]);

  const baseScenario = useMemo(() => {
    if (source === "current") return buildCurrentSaveBalanceScenario(save, giverId, receiverId);
    return getBreedingBalancePreset(source);
  }, [giverId, receiverId, save, source]);

  const scenario = useMemo<BreedingEconomyScenario | null>(() => {
    if (!baseScenario) return null;
    return {
      ...baseScenario,
      mode,
      runs,
      timelineDays,
      pairStrategy,
      snackPolicy,
      tonicPolicy,
      snackMaxPerDay: Math.max(0, snackMaxPerDay),
      goldIncomePerDay: Math.max(0, goldIncomePerDay),
      fixedGoldSpendPerDay: Math.max(0, fixedGoldSpendPerDay),
      seed: Math.floor(seed) || 1,
    };
  }, [baseScenario, fixedGoldSpendPerDay, goldIncomePerDay, mode, pairStrategy, runs, seed, snackMaxPerDay, snackPolicy, timelineDays, tonicPolicy]);

  useEffect(() => {
    if (!baseScenario || source === "current") return;
    setGoldIncomePerDay(baseScenario.goldIncomePerDay);
  }, [baseScenario, source]);

  async function runSimulation() {
    if (!scenario || isRunning) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRunning(true);
    setError("");
    setResult(null);
    setProgress({ completed: 0, total: scenario.runs, percentage: 0, phase: "primary" });
    try {
      const nextResult = await runBreedingEconomySimulation(scenario, setProgress, controller.signal);
      setResult(nextResult);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") setError("Simulation cancelled.");
      else setError(caught instanceof Error ? caught.message : "Simulation failed.");
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }

  function cancelSimulation() {
    abortRef.current?.abort();
  }

  return (
    <div className={styles.lab}>
      <div className={styles.notice} data-ui-text-box="auto">
        <strong>Simulation only</strong>
        <span>Runs use cloned scenario data. They do not change creatures, pregnancies, inventory, Gold, Energy, game day, or Breeding Ledger records.</span>
      </div>

      <div className={styles.controls}>
        <label className={styles.control}>
          <span>Scenario Source</span>
          <select value={source} onChange={(event) => setSource(event.target.value as BalanceScenarioSource)} disabled={isRunning}>
            {SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className={styles.control}>
          <span>Simulation Mode</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as BalanceSimulationMode)} disabled={isRunning}>
            <option value="attempts">Attempt Batch</option>
            <option value="timeline">Ranch Timeline</option>
          </select>
        </label>
        <label className={styles.control}>
          <span>Samples</span>
          <select value={runs} onChange={(event) => setRuns(Number(event.target.value) as (typeof RUN_OPTIONS)[number])} disabled={isRunning}>
            {RUN_OPTIONS.map((value) => <option key={value} value={value}>{value.toLocaleString("en-US")}</option>)}
          </select>
        </label>
        {mode === "timeline" ? (
          <label className={styles.control}>
            <span>Timeline Days</span>
            <select value={timelineDays} onChange={(event) => setTimelineDays(Number(event.target.value))} disabled={isRunning}>
              {DAY_OPTIONS.map((value) => <option key={value} value={value}>{value} Days</option>)}
            </select>
          </label>
        ) : null}
        <label className={styles.control}>
          <span>Pair Strategy</span>
          <select value={pairStrategy} onChange={(event) => setPairStrategy(event.target.value as BalancePairStrategy)} disabled={isRunning}>
            <option value="repeat-pair">Repeat Current Pair</option>
            <option value="rotate-receivers">Rotate Receivers</option>
            <option value="random-eligible">Random Eligible Pair</option>
          </select>
        </label>
        <label className={styles.control}>
          <span>Energy Snack Policy</span>
          <select value={snackPolicy} onChange={(event) => setSnackPolicy(event.target.value as BalanceSnackPolicy)} disabled={isRunning}>
            <option value="never">Never Use</option>
            <option value="when-blocked">Use When Energy Blocks</option>
            <option value="below-quarter">Use Below 25%</option>
            <option value="whenever-affordable">Use Whenever Affordable</option>
          </select>
        </label>
        <label className={styles.control}>
          <span>Fertility Tonic Policy</span>
          <select value={tonicPolicy} onChange={(event) => setTonicPolicy(event.target.value as BalanceTonicPolicy)} disabled={isRunning}>
            <option value="never">Never Use</option>
            <option value="new-pairs">Use on New Pairs</option>
            <option value="after-three-failures">Use After 3 Failures</option>
            <option value="every-attempt">Use Every Attempt</option>
          </select>
        </label>
        <label className={styles.control}>
          <span>Snack Limit / Day</span>
          <input type="number" min={0} max={50} value={snackMaxPerDay} onChange={(event) => setSnackMaxPerDay(Number(event.target.value))} disabled={isRunning} />
        </label>
        <label className={styles.control}>
          <span>Gold Income / Day</span>
          <input type="number" min={0} value={goldIncomePerDay} onChange={(event) => setGoldIncomePerDay(Number(event.target.value))} disabled={isRunning} />
        </label>
        <label className={styles.control}>
          <span>Other Gold Spend / Day</span>
          <input type="number" min={0} value={fixedGoldSpendPerDay} onChange={(event) => setFixedGoldSpendPerDay(Number(event.target.value))} disabled={isRunning} />
        </label>
        <label className={styles.control}>
          <span>Deterministic Seed</span>
          <input type="number" value={seed} onChange={(event) => setSeed(Number(event.target.value))} disabled={isRunning} />
        </label>
      </div>

      {source === "current" ? (
        <div className={styles.pairControls}>
          <label className={styles.control}>
            <span>Giver Snapshot</span>
            <select value={giverId} onChange={(event) => setGiverId(event.target.value)} disabled={isRunning}>
              {participants.map((participant) => <option key={`giver-${participant.participantId}`} value={participant.participantId}>{participant.displayName} — {participant.familyLabel}</option>)}
            </select>
          </label>
          <label className={styles.control}>
            <span>Receiver Snapshot</span>
            <select value={receiverId} onChange={(event) => setReceiverId(event.target.value)} disabled={isRunning}>
              {participants.filter((participant) => participant.participantId !== giverId).map((participant) => <option key={`receiver-${participant.participantId}`} value={participant.participantId}>{participant.displayName} — {participant.familyLabel}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      {scenario ? (
        <div className={styles.scenarioCard} data-ui-text-box="auto">
          <h3>{scenario.name}</h3>
          <p>{scenario.description}</p>
          <p>Chance before familiarity: {formatNumber(scenario.baseChance + scenario.affectionBonus + scenario.fertilityBonus + scenario.charmBonus + scenario.facilityChanceBonus + scenario.abilityChanceBonus, 0)}% · Energy cost: {scenario.energyCost} each · Creature XP: +{scenario.creatureXpGain} · Breeder XP: +{scenario.breederXpGain}</p>
        </div>
      ) : (
        <div className={styles.error}>Choose two different participants with a valid Breeding Pen preview.</div>
      )}

      <div className={styles.actionRow}>
        <button type="button" disabled={!scenario || isRunning} onClick={runSimulation}>Run Simulation</button>
        <button type="button" disabled={!isRunning} onClick={cancelSimulation}>Cancel</button>
        <button type="button" disabled={isRunning} onClick={() => { setResult(null); setError(""); setProgress(null); }}>Clear Results</button>
        {progress ? (
          <div className={styles.progress}>
            <span>{progress.phase === "primary" ? "Primary simulation" : "A/B comparisons"}: {progress.completed.toLocaleString("en-US")} / {progress.total.toLocaleString("en-US")}</span>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress.percentage}%` }} /></div>
          </div>
        ) : null}
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      {result ? (
        <>
          <div className={styles.headlineGrid}>
            <Metric label="Pregnancy Rate" value={formatPercent(result.pregnancyRate)} note={`Displayed average ${formatNumber(result.displayedAverageChance)}%`} />
            <Metric label="Attempts / Pregnancy" value={formatNumber(result.attemptsPerPregnancy, 2)} note={`${result.pregnancies.toLocaleString("en-US")} pregnancies`} />
            <Metric label="Average Energy Cost" value={formatNumber(result.averageEnergyCost, 1)} note="Per participant per attempt" />
            <Metric label="Attempts / Day" value={result.mode === "timeline" ? formatNumber(result.averageAttemptsPerDay, 2) : "Batch"} note={result.mode === "timeline" ? `Median ${formatNumber(result.medianAttemptsPerDay, 1)}` : `${result.attempts.toLocaleString("en-US")} attempts`} />
            <Metric label="Offspring / 30 Days" value={result.mode === "timeline" ? formatNumber(result.offspringPer30Days, 2) : "Projected"} note={`${result.offspring.toLocaleString("en-US")} completed in samples`} />
            <Metric label="Median Offspring Day" value={result.daysToOffspringMedian === null ? "—" : `Day ${result.daysToOffspringMedian}`} note={result.daysToOffspringP90 === null ? "Timeline mode only" : `P10 ${result.daysToOffspringP10} · P90 ${result.daysToOffspringP90}`} />
            <Metric label="Net Gold" value={formatGold(result.netGold)} note={`${formatGold(result.goldEarned)} earned · ${formatGold(result.goldSpent)} spent`} />
            <Metric label="Creature Levels" value={result.creatureLevelUps.toLocaleString("en-US")} note={`${formatNumber(result.attemptsPerCreatureLevel, 1)} attempts per level`} />
          </div>

          <div className={styles.sections}>
            <details className={styles.detail} open>
              <summary>Ranch Rhythm and Bottlenecks</summary>
              <div className={styles.detailGrid}>
                <DetailRow label="Total Attempts" value={result.attempts.toLocaleString("en-US")} />
                <DetailRow label="Days With No Attempt" value={result.daysWithNoAttempt.toLocaleString("en-US")} />
                <DetailRow label="Energy-Limited Days" value={result.energyLimitedDays.toLocaleString("en-US")} />
                <DetailRow label="Heart-Limited Days" value={result.heartLimitedDays.toLocaleString("en-US")} />
                <DetailRow label="Pregnancy-Locked Days" value={result.pregnancyLockedDays.toLocaleString("en-US")} />
                <DetailRow label="Unused Energy at Sleep" value={formatPercent(result.unusedEnergyRate)} />
              </div>
            </details>

            <details className={styles.detail}>
              <summary>Pregnancy, Familiarity, and Offspring</summary>
              <div className={styles.detailGrid}>
                <DetailRow label="Pregnancies" value={result.pregnancies.toLocaleString("en-US")} />
                <DetailRow label="Completed Offspring" value={result.offspring.toLocaleString("en-US")} />
                <DetailRow label="Median First Conception" value={result.daysToFirstConceptionMedian === null ? "—" : `Day ${result.daysToFirstConceptionMedian}`} />
                <DetailRow label="Average Streak at Conception" value={formatNumber(result.averageStreakAtConception, 2)} />
                <DetailRow label="Median Failure Streak" value={formatNumber(result.medianFailureStreak, 1)} />
                <DetailRow label="Longest Failure Streak" value={result.longestFailureStreak.toLocaleString("en-US")} />
                <DetailRow label="Attempts at Streak Cap" value={formatPercent(result.streakCapAttemptRate)} />
                <DetailRow label="Energy / Pregnancy" value={formatNumber(result.energyPerPregnancy, 1)} />
                <DetailRow label="Energy / Offspring" value={formatNumber(result.energyPerOffspring, 1)} />
              </div>
            </details>

            <details className={styles.detail}>
              <summary>Items and Economy</summary>
              <div className={styles.detailGrid}>
                <DetailRow label="Energy Snacks Used" value={result.snacksUsed.toLocaleString("en-US")} />
                <DetailRow label="Snack Energy Restored" value={formatNumber(result.snackEnergyRestored, 0)} />
                <DetailRow label="Snack Energy Wasted" value={formatNumber(result.snackEnergyWasted, 0)} />
                <DetailRow label="Attempts Enabled by Snacks" value={result.snackEnabledAttempts.toLocaleString("en-US")} />
                <DetailRow label="Fertility Tonics Used" value={result.tonicsUsed.toLocaleString("en-US")} />
                <DetailRow label="Gold / Pregnancy" value={formatGold(result.goldPerPregnancy)} />
                <DetailRow label="Gold / Offspring" value={formatGold(result.goldPerOffspring)} />
                <DetailRow label="Days Until Gold Depletion" value={result.daysUntilGoldDepletion === null ? "Sustainable" : String(result.daysUntilGoldDepletion)} />
              </div>
            </details>

            <details className={styles.detail}>
              <summary>Progression Speed</summary>
              <div className={styles.detailGrid}>
                <DetailRow label="Creature XP" value={result.creatureXp.toLocaleString("en-US")} />
                <DetailRow label="Creature Level-Ups" value={result.creatureLevelUps.toLocaleString("en-US")} />
                <DetailRow label="Attempts / Creature Level" value={formatNumber(result.attemptsPerCreatureLevel, 1)} />
                <DetailRow label="Breeder XP" value={result.breederXp.toLocaleString("en-US")} />
                <DetailRow label="Breeder Rank-Ups" value={result.breederRankUps.toLocaleString("en-US")} />
                <DetailRow label="Attempts / Breeder Rank" value={formatNumber(result.attemptsPerBreederRank, 1)} />
              </div>
            </details>

            <details className={styles.detail} open>
              <summary>A/B Modifier Comparison</summary>
              <div className={styles.detailGrid}>
                <DetailRow label="Current Pregnancy Rate" value={formatPercent(result.pregnancyRate)} />
                <DetailRow label="Without Abilities" value={formatPercent(result.comparison.noAbilitiesPregnancyRate)} />
                <DetailRow label="Ability Output Change" value={formatPercent(result.comparison.abilityPregnancyDelta)} />
                <DetailRow label="Without Pair Streak" value={formatPercent(result.comparison.noStreakPregnancyRate)} />
                <DetailRow label="Streak Output Change" value={formatPercent(result.comparison.streakPregnancyDelta)} />
                <DetailRow label="Extra Pregnancies from Abilities" value={result.comparison.abilityAdditionalPregnancies.toLocaleString("en-US")} />
                <DetailRow label="Extra Pregnancies from Streak" value={result.comparison.streakAdditionalPregnancies.toLocaleString("en-US")} />
              </div>
            </details>
          </div>

          <div className={styles.flags}>
            <span className={styles.sectionLabel}>Balance Review Flags</span>
            {result.flags.map((flag) => (
              <div key={`${flag.title}-${flag.detail}`} className={styles.flag} data-severity={flag.severity} data-ui-text-box="auto">
                <strong>{flag.title}</strong>
                <p>{flag.detail}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.empty}>Choose a scenario and run a simulation to generate ranch rhythm, pregnancy, item, economy, progression, and A/B comparison results.</div>
      )}
    </div>
  );
}
