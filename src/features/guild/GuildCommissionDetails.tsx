"use client";
import { useState } from "react";
import { completeGuildCommission, getGuildCommissionProgress, GUILD_REQUEST_LABELS } from "@/data/guildCommissions";
import { applyStarterGoalRewards } from "@/data/starterGoals";
import { recordRanchDayTransition } from "@/data/ranch-day/ranchDayActivities";
import { normalizeRanchDaySave } from "@/data/ranch-day/ranchDayState";
import { ensureMonthlyTaxPosted } from "@/data/taxes";
import { GameDialog } from "@/features/ui/GameDialog";
import type { GameSave } from "@/types/save";
import type { GuildContract } from "@/types/guild";
import styles from "./GuildHallScreen.module.css";

export function GuildCommissionDetails({ save, contract, image, onAccept, onClaim, onVisit }: { save: GameSave; contract: GuildContract; image: string; onAccept: () => void; onClaim: () => void; onVisit: () => void }) {
  const [review, setReview] = useState(false);
  const progress = getGuildCommissionProgress(save, contract)!;
  const trial = completeGuildCommission(save, contract.contractId);
  const rewarded = trial.ok ? applyStarterGoalRewards(ensureMonthlyTaxPosted(recordRanchDayTransition(save, normalizeRanchDaySave(trial.save, trial.save.ranchDay?.phase ?? "active")))) : null;
  const rewardGold = rewarded ? rewarded.currencies.gold - save.currencies.gold : contract.goldReward;
  const rewardGp = rewarded ? rewarded.currencies.guildPoints - save.currencies.guildPoints : contract.guildPointReward;
  const expired = progress.status === "Expired";
  const complete = contract.status === "completed";
  const destination = contract.type === "delivery" ? "Supply Depot" : contract.type === "chore_commission" ? "Farm Management" : "Coliseum";
  return <div className={`${styles.detailContent} ${styles.commissionDetails}`}>
    <div className={styles.detailHeading}><h2>{contract.title}</h2><p className={styles.meta}>{contract.tier} · {GUILD_REQUEST_LABELS[contract.type]}</p></div>
    <div className={styles.requester}><img src={image} alt="" /><div><strong>{contract.requesterName}</strong><p>{contract.description}</p></div></div>
    <div className={styles.missionProgress} data-ready={progress.ready}><strong>{progress.status}</strong><span>{Math.min(progress.current,progress.target)} / {progress.target} {progress.unit}</span><progress aria-label="Request progress" max={progress.target} value={Math.min(progress.current, progress.target)} /></div>
    <p className={styles.missionInstruction}>{progress.instruction}</p>
    <div className={styles.rewardBlock}><small>Rewards</small><span className={styles.rewards}><span><img src="/images/ui/guild-v1/gold.webp" alt="" />{contract.goldReward} Gold</span><span><img src="/images/ui/guild-v1/gp.webp" alt="" />{contract.guildPointReward} GP</span></span></div>
    <p className={styles.deadline}>Due before Week {contract.expiresAtWeekNumber} · No creature is surrendered.</p>
    <div className={styles.actions}>
      {contract.status === "available" && !expired ? <button className={styles.primary} onClick={onAccept}>Accept Request</button> : <button className={styles.primary} disabled={!progress.ready} onClick={() => setReview(true)}>{complete ? "Reward Claimed" : expired ? "Expired" : "Review & Claim"}</button>}
      {!complete && !expired ? <button onClick={onVisit}>Visit {destination}</button> : null}
    </div>
    {review ? <GameDialog title={contract.type === "delivery" ? "Review Delivery" : "Review Commission Reward"} onClose={() => setReview(false)}>
      <div className={styles.commissionReview}><h3>{contract.title}</h3><p>{progress.instruction}</p>
      {contract.objective?.kind === "delivery" ? <p><strong>Stock: {progress.current} → {progress.current - progress.target} {progress.unit}</strong><br />Keep enough Feed and Materials for your ranch. This delivery consumes the listed stock.</p> : <p>Your completed work has been recorded. Claiming does not use extra energy or remove a creature.</p>}
      <p className={styles.rewards}>{rewardGold} Gold · {rewardGp} GP</p><p>Final payout includes any first-contract, daily-goal and starter-goal bonuses.</p>
      <div className={styles.actions}><button onClick={() => setReview(false)}>Cancel</button><button className={styles.primary} disabled={!trial.ok} onClick={() => {setReview(false);onClaim();}}>Confirm {contract.type === "delivery" ? "Delivery" : "Reward"}</button></div></div>
    </GameDialog> : null}
  </div>;
}
