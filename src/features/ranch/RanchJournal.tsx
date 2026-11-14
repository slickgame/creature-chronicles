"use client";

import { useState } from "react";
import { getChapterOneStoryLog } from "@/data/chapterOneStory";
import { getNpcQuestChain } from "@/data/npcQuests";
import { getStarterGoals } from "@/data/starterGoals";
import { useGameContext } from "@/state/GameProvider";
import { GameDialog } from "@/features/ui/GameDialog";
import styles from "./RanchJournal.module.css";
import { RanchReview } from "./RanchReview";

export function RanchJournal({ onClose, storyOnly = false }: { onClose: () => void; storyOnly?: boolean }) {
  const { currentSave: save, goToMarket } = useGameContext();
  const [selectedId, setSelectedId] = useState<string>();
  if (!save) return null;

  const goals = storyOnly ? [] : getStarterGoals(save);
  const requests = storyOnly ? [] : getNpcQuestChain(save, "tamsin_vale").filter(quest => quest.accepted);
  const stories = getChapterOneStoryLog(save);
  const records = [
    ...requests.map(quest => ({
      id: `tamsin-request-${quest.index}`,
      title: quest.title,
      category: "Hearth requests",
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
  const quest = requests.find(item => record.id === `tamsin-request-${item.index}`);
  if (quest) {
    const art = quest.index === 0 ? "home" : "rescue";
    const reward = [quest.gold && `${quest.gold} Gold`, quest.gp && `${quest.gp} Guild Points`, `${quest.trust} Trust`].filter(Boolean).join(" · ");
    return <GameDialog fullScreen title="Ranch Journal" onClose={onClose}>
      <main className={styles.desk}>
        <div className={styles.book}>
          <aside className={styles.index}>
            <button type="button" onClick={onClose}>‹ Back</button>
            <h1>Ranch Journal</h1>
            <h2><img src="/images/ui/adoption-gallery/topic-request.webp" alt="" />Hearth requests</h2>
            <nav aria-label="Hearth requests">
              {requests.map(item => (
                <button key={item.index} type="button" aria-current={item.index === quest.index ? "page" : undefined} onClick={() => setSelectedId(`tamsin-request-${item.index}`)}>
                  <img src={`/images/ui/adoption-gallery/journal-${item.index === 0 ? "home" : "rescue"}.webp`} alt="" />
                  <span>{item.title}</span>
                </button>
              ))}
            </nav>
            {picker}
          </aside>
          <article className={styles.record} aria-labelledby="hearth-request-title">
            <div className={styles.steward}>
              <img src="/images/ui/adoption-gallery/tamsin.webp" alt="" />
              <p><em>Adoption Steward</em><strong>Tamsin Vale</strong></p>
            </div>
            <h2 id="hearth-request-title">{quest.title}</h2>
            <p className={styles.status} data-status={quest.claimed ? "claimed" : quest.ready ? "ready" : "active"}>
              <span aria-hidden="true">{quest.claimed ? "✦" : quest.ready ? "✓" : "◌"}</span>
              <strong>{quest.claimed ? "Reward claimed" : quest.ready ? "Ready to claim" : "In progress"}</strong> · {quest.current}/{quest.target}
            </p>
            <div className={styles.objective}>
              <img src={`/images/ui/adoption-gallery/journal-${art}.webp`} alt="" />
              <p>{quest.requirement}</p>
            </div>
            <p className={styles.reward}><img src="/images/ui/adoption-gallery/ledger-coins.webp" alt="" />{reward}</p>
            {quest.ready && <button type="button" className={styles.return} onClick={() => { onClose(); goToMarket(); }}>Return to Tamsin</button>}
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
