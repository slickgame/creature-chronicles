"use client";
import { useRef, useState } from "react";
import { acceptNpcQuest, claimNpcQuest, getNpcQuestChain, type QuestNpc } from "@/data/npcQuests";
import { getNextTrustThreshold, getNpcTrustRecord, TOWN_NPCS } from "@/data/townNpcs";
import { useGameContext } from "@/state/GameProvider";
import styles from "./NpcQuestPanel.module.css";

export function NpcQuestPanel({ npc }: { npc: QuestNpc }) {
  const { currentSave: save, saveCurrentGame } = useGameContext();
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  if (!save) return null;
  const quests = getNpcQuestChain(save, npc);
  const trust = getNpcTrustRecord(save, npc);
  const next = getNextTrustThreshold(trust.points);
  function act(index: number, claim: boolean) {
    if (lock.current || !save) return;
    lock.current = true;
    const result = claim ? claimNpcQuest(save, npc, index) : acceptNpcQuest(save, npc, index);
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    queueMicrotask(() => { lock.current = false; });
  }
  return <section className={styles.panel} aria-label={`${TOWN_NPCS[npc].name} quests`}>
    <header><img src={TOWN_NPCS[npc].portraitPath} alt="" /><div><h3>{TOWN_NPCS[npc].name} · Requests & Trust</h3><p>Trust Lv. {trust.level} · {trust.points}{next ? ` / ${next}` : ""} points</p><p>These personal quests do not expire or reroll.</p></div></header>
    <p className={styles.perk}>{npc === "mara_vell" ? "Chain reward: 10% cheaper Guild board rerolls." : "Chain reward: 10% cheaper supplies. A better Trust discount still takes priority."} {quests[2].claimed ? "Unlocked ✓" : `${quests.filter(q => q.claimed).length} / 3 milestones completed`}</p>
    {message && <p role="status" className={styles.receipt}>{message}</p>}
    {quests.map(quest => <article key={quest.index} data-locked={quest.locked}>
      <h4>{quest.index + 1}. {quest.title} · {quest.claimed ? "Completed" : quest.locked ? "Locked" : quest.ready ? "Ready to claim" : quest.accepted ? "In progress" : "Available"}</h4>
      {!quest.claimed && !quest.locked && <><p>“{quest.dialogue}”</p><p>{quest.requirement}</p><progress aria-label={`${quest.title} progress`} value={quest.current} max={quest.target} /><span> {quest.current} / {quest.target}</span></>}
      <p>{quest.gold} Gold · {quest.gp} GP · +{quest.trust} Trust</p>
      {!quest.claimed && !quest.locked && <button disabled={quest.accepted && !quest.ready} onClick={() => act(quest.index, quest.accepted)}>{quest.accepted ? "Claim Quest Reward" : "Accept Personal Quest"}</button>}
      {quest.locked && <small>Complete the previous request first.</small>}
    </article>)}
  </section>;
}
