"use client";

import { useEffect, useMemo, useState } from "react";
import {
  acceptRoseLanternHouseRules,
  getRoseLanternAccess,
  getRoseLanternState,
  getRoseLanternTrustRank,
  spendRoseLanternRumorToken,
  visitRoseLanternSalon,
  workRoseLanternHospitalityShift,
} from "@/data/roseLantern";
import { useGameContext } from "@/state/GameProvider";
import type { GameSave } from "@/types/save";
import styles from "./RoseLanternScreen.module.css";

const BUILDING_ART = "/images/buildings/town/rose_lantern.svg";
const HOSTESS_ART = "/images/characters/town/rose_lantern_hostess.svg";

export function RoseLanternScreen({ onClose }: { onClose: () => void }) {
  const { currentSave, saveCurrentGame } = useGameContext();
  const [message, setMessage] = useState("Madam Selene welcomes adult guests, workers, and information brokers under the same house rules.");
  const access = useMemo(() => currentSave ? getRoseLanternAccess(currentSave) : null, [currentSave]);
  const state = useMemo(() => currentSave ? getRoseLanternState(currentSave) : null, [currentSave]);
  const rank = state ? getRoseLanternTrustRank(state.trust) : null;

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (!currentSave || !access || !state || !rank) return null;
  const activeSave = currentSave;

  function apply(result: { save: GameSave; ok: boolean; message: string }) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  const trustPercent = Math.min(100, state.trust);
  const nextRankText = rank.nextAt ? `${rank.nextAt - state.trust} Trust to next rank` : "Maximum current rank";

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}
    >
      <section className={styles.screen} role="dialog" aria-modal="true" aria-labelledby="rose-lantern-title">
        <header className={styles.header}>
          <div>
            <p>Adults-Only Social House</p>
            <h1 id="rose-lantern-title">The Rose Lantern</h1>
            <span>Optional mature social progression, hospitality work, relationships, and town intelligence.</span>
          </div>
          <button type="button" onClick={onClose}>Return to Town</button>
        </header>

        <div className={styles.layout}>
          <aside className={styles.artColumn}>
            <div className={styles.buildingArt}><img src={BUILDING_ART} alt="The Rose Lantern" /></div>
            <div className={styles.hostessCard}>
              <img src={HOSTESS_ART} alt="Madam Selene Vale, adult hostess of The Rose Lantern" />
              <div>
                <span>House Hostess</span>
                <strong>Madam Selene Vale</strong>
                <p>“No pressure, no hidden terms, and no one owes the house more than they freely choose.”</p>
              </div>
            </div>
          </aside>

          <main className={styles.content}>
            <p className={styles.message} role="status">{message}</p>

            {!access.unlocked ? (
              <section className={styles.lockedCard}>
                <span>Venue Closed</span>
                <h2>The lanterns are still dark.</h2>
                <p>{access.reason}</p>
              </section>
            ) : !state.houseRulesAccepted ? (
              <section className={styles.rulesCard}>
                <span>First Visit</span>
                <h2>Rose Lantern House Rules</h2>
                <ul>
                  <li>Every character and participant represented in this venue is an adult.</li>
                  <li>All social, romantic, and mature interactions are optional and consent-based.</li>
                  <li>Consent can be withdrawn, and future scenes will always provide a leave or decline option.</li>
                  <li>Hospitality work never requires romantic or sexual participation.</li>
                  <li>No interaction here blocks the main ranch story or progression.</li>
                </ul>
                <button type="button" className={styles.primaryButton} onClick={() => apply(acceptRoseLanternHouseRules(activeSave))}>
                  Acknowledge House Rules
                </button>
              </section>
            ) : (
              <>
                <section className={styles.statusGrid}>
                  <div><span>House Rank</span><strong>{rank.label}</strong><small>{nextRankText}</small></div>
                  <div><span>House Trust</span><strong>{state.trust}/100</strong><small>{state.visits} salon visit{state.visits === 1 ? "" : "s"}</small></div>
                  <div><span>Rumor Tokens</span><strong>{state.rumorTokens}</strong><small>Spent on actionable town information</small></div>
                  <div><span>Today</span><strong>Day {activeSave.dayState.dayNumber}</strong><small>{state.lastShiftDayNumber === activeSave.dayState.dayNumber ? "Shift complete" : "Shift available"}</small></div>
                </section>

                <div className={styles.progressTrack} aria-label={`House Trust ${state.trust} out of 100`}>
                  <span style={{ width: `${trustPercent}%` }} />
                </div>

                <section className={styles.actionGrid}>
                  <article>
                    <span>Social</span>
                    <h2>Evening Salon Visit</h2>
                    <p>Spend time in the public salon, meet regulars, and listen to town conversation without entering any mature scene.</p>
                    <strong>10 Gold · +2 Trust · +1 Rumor Token</strong>
                    <button type="button" onClick={() => apply(visitRoseLanternSalon(activeSave))} disabled={state.lastVisitDayNumber === activeSave.dayState.dayNumber}>Visit the Salon</button>
                  </article>
                  <article>
                    <span>Work</span>
                    <h2>Hospitality Shift</h2>
                    <p>Help with tables, guest service, music scheduling, and front-house organization. Romantic participation is never part of the job.</p>
                    <strong>15 Energy · 32–50 Gold · +3 Trust</strong>
                    <button type="button" onClick={() => apply(workRoseLanternHospitalityShift(activeSave))} disabled={state.lastShiftDayNumber === activeSave.dayState.dayNumber}>Work a Shift</button>
                  </article>
                  <article>
                    <span>Information</span>
                    <h2>Rumor Network</h2>
                    <p>Spend a token for deterministic information about predators, builders, markets, or Guild conditions.</p>
                    <strong>1 Rumor Token</strong>
                    <button type="button" onClick={() => apply(spendRoseLanternRumorToken(activeSave))} disabled={state.rumorTokens < 1}>Ask Around Quietly</button>
                  </article>
                </section>

                {state.lastRumor ? (
                  <section className={styles.rumorCard}>
                    <span>Latest Rumor</span>
                    <p>{state.lastRumor}</p>
                  </section>
                ) : null}

                <section className={styles.futureSection}>
                  <div>
                    <span>Future Systems</span>
                    <h2>Rooms and Contracts</h2>
                    <p>These systems are visible now so their unlock requirements can be planned, but their mature scenes and deeper relationship content remain unimplemented.</p>
                  </div>
                  <div className={styles.futureGrid}>
                    <article className={state.trust >= 15 ? styles.availableFuture : styles.lockedFuture}>
                      <strong>Regulars’ Lounge</strong>
                      <span>{state.trust >= 15 ? "Foundation unlocked" : "Requires 15 Trust"}</span>
                      <p>Recurring adult NPC relationships, preferences, boundaries, and optional personal quests.</p>
                    </article>
                    <article className={state.trust >= 35 ? styles.availableFuture : styles.lockedFuture}>
                      <strong>Private Contract Board</strong>
                      <span>{state.trust >= 35 ? "Foundation unlocked" : "Requires 35 Trust"}</span>
                      <p>Optional mature social contracts with explicit terms, rewards, refusal options, and cooldowns.</p>
                    </article>
                    <article className={state.trust >= 60 ? styles.availableFuture : styles.lockedFuture}>
                      <strong>House Partnership</strong>
                      <span>{state.trust >= 60 ? "Foundation unlocked" : "Requires 60 Trust"}</span>
                      <p>Hospitality upgrades, staff recruitment, venue events, finances, and story influence.</p>
                    </article>
                  </div>
                </section>

                {state.history.length ? (
                  <details className={styles.history}>
                    <summary>Rose Lantern History ({state.history.length})</summary>
                    <ul>{state.history.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul>
                  </details>
                ) : null}
              </>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
