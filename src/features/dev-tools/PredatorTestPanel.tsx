"use client";

import { useMemo, useState } from "react";
import {
  clearPendingPredatorDevIncident,
  createForcedPredatorIncident,
  prepareNaturalPredatorTestConditions,
  resolvePendingPredatorDevOutcome,
  type PredatorDevApproach,
  type PredatorDevTier,
} from "@/data/predatorDevTools";
import { getPendingPredatorEvent, type PredatorKind } from "@/data/predatorEvents";
import { getPredatorThreatAssessment } from "@/data/predatorThreat";
import { useGameContext } from "@/state/GameProvider";
import type { GameSave } from "@/types/save";
import styles from "./PredatorTestPanel.module.css";

const PREDATORS: Array<{ id: PredatorKind; label: string }> = [
  { id: "foxes", label: "Night Fox Pack" },
  { id: "feral_hounds", label: "Feral Hound Pack" },
  { id: "wolves", label: "Woodline Wolf Pack" },
  { id: "boars", label: "Ridge Boar Sounder" },
];

export function PredatorTestPanel() {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [predatorType, setPredatorType] = useState<PredatorKind>("foxes");
  const [tier, setTier] = useState<PredatorDevTier>("low");
  const [approach, setApproach] = useState<PredatorDevApproach>("intercepted");
  const [message, setMessage] = useState("Create a reproducible predator incident without editing save JSON.");
  const assessment = useMemo(() => currentSave ? getPredatorThreatAssessment(currentSave) : null, [currentSave]);
  const pending = currentSave ? getPendingPredatorEvent(currentSave) : null;

  if (!currentSave || !assessment) return null;
  const activeSave = currentSave;

  function apply(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  return (
    <section className={styles.panel} aria-labelledby="predator-test-title">
      <header className={styles.header}>
        <div>
          <p>Vacation QA Controls</p>
          <h2 id="predator-test-title">Predator Event Lab</h2>
          <span>Forced incidents use the live ranch-defense battle and the same idempotent rewards and penalties as natural nights.</span>
        </div>
        <strong>{pending ? "INCIDENT PENDING" : assessment.eligible ? "NATURAL EVENT ELIGIBLE" : "CONDITIONS BLOCKED"}</strong>
      </header>

      <p className={styles.message} role="status">{message}</p>

      <div className={styles.stats}>
        <div><span>Pressure</span><strong>{assessment.pressure}</strong></div>
        <div><span>Security</span><strong>{assessment.security}</strong></div>
        <div><span>Required</span><strong>{assessment.requiredSecurity}</strong></div>
        <div><span>Natural Chance</span><strong>{assessment.eventChance}%</strong></div>
      </div>

      {pending ? (
        <section className={styles.pendingCard}>
          <img src={pending.imagePath} alt="" />
          <div>
            <span>{pending.tier} threat · {pending.intercepted ? `${pending.startingHpPercent}% HP intercept` : "full-strength breach"}</span>
            <h3>{pending.predatorName}</h3>
            <p>{pending.summary}</p>
            <div className={styles.actions}>
              <button type="button" onClick={() => apply(resolvePendingPredatorDevOutcome(activeSave, "player_won"))}>Instant Test Victory</button>
              <button type="button" onClick={() => apply(resolvePendingPredatorDevOutcome(activeSave, "enemy_won"))}>Instant Test Defeat</button>
              <button type="button" className={styles.danger} onClick={() => apply(clearPendingPredatorDevIncident(activeSave))}>Clear Pending Event</button>
            </div>
          </div>
        </section>
      ) : (
        <div className={styles.controls}>
          <label>
            Predator group
            <select value={predatorType} onChange={(event) => setPredatorType(event.target.value as PredatorKind)}>
              {PREDATORS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
            </select>
          </label>
          <label>
            Threat tier
            <select value={tier} onChange={(event) => setTier(event.target.value as PredatorDevTier)}>
              <option value="low">Low</option>
              <option value="elevated">Elevated</option>
              <option value="severe">Severe</option>
            </select>
          </label>
          <label>
            Security outcome
            <select value={approach} onChange={(event) => setApproach(event.target.value as PredatorDevApproach)}>
              <option value="intercepted">Intercepted — reduced enemy HP</option>
              <option value="breach">Breach — full enemy HP</option>
            </select>
          </label>
          <button
            type="button"
            className={styles.primary}
            onClick={() => apply(createForcedPredatorIncident(activeSave, predatorType, tier, approach))}
          >
            Create Incident Now
          </button>
        </div>
      )}

      <footer className={styles.footer}>
        <div>
          <strong>Natural-condition preset</strong>
          <p>Opens the story gate and ensures Feed and ranch damage can produce real condition-gated rolls. It does not guarantee that the deterministic nightly roll succeeds.</p>
          <button type="button" onClick={() => apply(prepareNaturalPredatorTestConditions(activeSave))}>Prepare Natural Test Conditions</button>
        </div>
        <div>
          <strong>Cleanup</strong>
          <p>Clears the pending event, last result, history, and predator QA counters. Ranch rewards or damage already applied are not rolled back.</p>
          <button type="button" className={styles.danger} onClick={() => apply(clearPendingPredatorDevIncident(activeSave, true))}>Reset Predator Test History</button>
        </div>
      </footer>
    </section>
  );
}
