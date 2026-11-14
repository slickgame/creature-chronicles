"use client";

import { useState } from "react";
import { getChapterOneStoryLog } from "@/data/chapterOneStory";
import { getNpcQuestChain } from "@/data/npcQuests";
import { getStarterGoals } from "@/data/starterGoals";
import { useGameContext } from "@/state/GameProvider";
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
      pages: [{
        title: "Tamsin Vale · Adoption Hearth",
        content: <>
          <p><strong>{quest.claimed ? "Reward claimed" : quest.ready ? "Ready to claim" : "In progress"}</strong> · {quest.current}/{quest.target}</p>
          <p>{quest.requirement}</p>
          <p><strong>Reward</strong> · {[quest.gold && `${quest.gold} Gold`, quest.gp && `${quest.gp} Guild Points`, `${quest.trust} Trust`].filter(Boolean).join(" · ")}</p>
          {quest.ready && <button type="button" onClick={() => { onClose(); goToMarket(); }}>Return to Tamsin</button>}
        </>,
      }],
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
  return <RanchReview key={record.id} title="Ranch Journal" onClose={onClose}
    pages={record.pages.map(page => ({ title: record.title, content: <>{picker}<strong>{page.title}</strong>{page.content}</> }))}
    actions={<>
      <button disabled={current === 0} onClick={() => setSelectedId(records[current - 1].id)}>‹ Previous record</button>
      <button disabled={current === records.length - 1} onClick={() => setSelectedId(records[current + 1].id)}>Next record ›</button>
    </>} />;
}
