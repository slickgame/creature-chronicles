"use client";

import { useState } from "react";
import { getChapterOneStoryLog } from "@/data/chapterOneStory";
import { getNpcQuestChain } from "@/data/npcQuests";
import { TOWN_NPCS } from "@/data/townNpcs";
import { getStarterGoals } from "@/data/starterGoals";
import { useGameContext } from "@/state/GameProvider";
import { GameDialog } from "@/features/ui/GameDialog";
import styles from "./RanchJournal.module.css";
import { RanchReview } from "./RanchReview";

export function RanchJournal({ onClose, storyOnly = false }: { onClose: () => void; storyOnly?: boolean }) {
  const { currentSave: save, goToMarket, goToGuildHall } = useGameContext();
  const [selectedId, setSelectedId] = useState<string>();
  if (!save) return null;

  const goals = storyOnly ? [] : getStarterGoals(save);
  const artRoot = "/images/ui/adoption-gallery/";
  const sources = [
    { npc: "tamsin_vale", category: "Hearth requests", portrait: artRoot + "tamsin.webp", visit: goToMarket },
    { npc: "mara_vell", category: "Guild requests", portrait: TOWN_NPCS.mara_vell.portraitPath, visit: goToGuildHall },
  ] as const;
  const requests = storyOnly ? [] : sources.flatMap(source =>
    getNpcQuestChain(save, source.npc).filter(quest => quest.accepted).map(quest => ({
      ...quest, ...source,
      id: `${source.npc}-request-${quest.index}`,
      art: source.npc === "mara_vell" ? artRoot + "topic-request.webp" : artRoot + (quest.index === 0 ? "journal-home.webp" : "journal-rescue.webp"),
    })),
  ).sort((a, b) => Number(b.ready) - Number(a.ready) || Number(a.claimed) - Number(b.claimed));
  const stories = getChapterOneStoryLog(save);
  const records = [
    ...requests.map(quest => ({
      id: quest.id,
      title: quest.title,
      category: quest.category,
      pages: [],
    })),
    ...goals.map(goal => ({
      id: goal.id, title: goal.label, category: "Ranch goals",
      pages: [{ title: goal.label, content: <>
        <p>{goal.complete ? "✓ Complete" : "In progress"} · {goal.rewardClaimed ? "Reward claimed" : goal.rewardLabel}</p>
        <p>{goal.description}</p><p>{goal.hint}</p>
      </> }],
    })),
    ...stories.map(entry => ({
      id: entry.id, title: entry.title, category: "Story",
      pages: entry.seen
        ? entry.pages.map(page => ({ title: page.speaker, content: <p>{page.text}</p> }))
        : [{ title: "Locked record", content: <p>{entry.lockedReason ?? "Continue Chapter 1 to unlock this scene."}</p> }],
    })),
  ];
  const current = Math.max(0, records.findIndex(record => record.id === selectedId));
  const record = records[current];
  if (!record) return null;

  const picker = <label>Choose record
    <select aria-label="Journal record" value={record.id} onChange={event => setSelectedId(event.target.value)}>
      {Array.from(new Set(records.map(item => item.category)), category =>
        <optgroup key={category} label={category}>
          {records.filter(item => item.category === category).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </optgroup>
      )}
    </select>
  </label>;
  const quest = requests.find(item => record.id === item.id);
  if (quest) {
    const npc = TOWN_NPCS[quest.npc];
    const reward = [quest.gold && `${quest.gold} Gold`, quest.gp && `${quest.gp} Guild Points`, `${quest.trust} Trust`].filter(Boolean).join(" · ");
    return <GameDialog fullScreen title="Ranch Journal" onClose={onClose}>
      <main className={styles.desk}>
        <div className={styles.book}>
          <aside className={styles.index}>
            <button type="button" onClick={onClose}>‹ Back</button>
            <h1>Ranch Journal</h1>
            <h2><img src="/images/ui/adoption-gallery/topic-request.webp" alt="" />Town requests</h2>
            <nav aria-label="Town requests">
              {requests.map(item => (
                <button key={item.id} type="button" aria-current={item.id === quest.id ? "page" : undefined} onClick={() => setSelectedId(item.id)}>
                  <img src={item.art} data-guild={item.npc === "mara_vell"} alt="" />
                  <span>{item.title}{item.ready && <small>Reward ready</small>}</span>
                </button>
              ))}
            </nav>
            {picker}
          </aside>
          <article className={styles.record} aria-labelledby="hearth-request-title">
            <div className={styles.steward}>
              <img key={quest.npc} src={quest.portrait} alt="" onError={event => { event.currentTarget.src = artRoot + "topic-request.webp"; }} />
              <p><em>{npc.title}</em><strong>{npc.name}</strong></p>
            </div>
            <h2 id="hearth-request-title">{quest.title}</h2>
            <p className={styles.status} data-status={quest.claimed ? "claimed" : quest.ready ? "ready" : "active"}>
              <span aria-hidden="true">{quest.claimed ? "✦" : quest.ready ? "✓" : "◌"}</span>
              <strong>{quest.claimed ? "Reward claimed" : quest.ready ? "Ready to claim" : "In progress"}</strong> · {quest.current}/{quest.target}
            </p>
            <div className={styles.objective}>
              <img src={quest.art} data-guild={quest.npc === "mara_vell"} alt="" />
              <p>{quest.requirement}</p>
            </div>
            <p className={styles.reward}><img src="/images/ui/adoption-gallery/ledger-coins.webp" alt="" />{reward}</p>
            {quest.ready && <button type="button" className={styles.return} onClick={() => { onClose(); quest.visit(); }}>Return to {npc.name.split(" ")[0]}</button>}
            {quest.claimed && <img className={styles.seal} src="/images/ui/adoption-gallery/ledger-seal.webp" alt="" />}
          </article>
        </div>
      </main>
    </GameDialog>;
  }

  return <RanchReview key={record.id} title="Ranch Journal" onClose={onClose}
    pages={record.pages.map(page => ({ title: record.title, content: <>{picker}<strong>{page.title}</strong>{page.content}</> }))}
    actions={<>
      <button disabled={current === 0} onClick={() => setSelectedId(records[current - 1].id)}>‹ Previous record</button>
      <button disabled={current === records.length - 1} onClick={() => setSelectedId(records[current + 1].id)}>Next record ›</button>
    </>} />;
}
