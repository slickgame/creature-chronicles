import { useState } from "react";
import { acceptNpcQuest, claimNpcQuest, getNpcQuestChain } from "@/data/npcQuests";
import type { GameSave } from "@/types/save";
import styles from "./Hearthside.module.css";

export const tamsinTopics = [
  { title: "Ask about adoption", icon: "ledger-fence" },
  { title: "How are things at the Hearth?", icon: "ledger-sprig" },
  { title: "Need a hand?", icon: "talk-gate" },
  { title: "Spend time together", icon: "ledger-purse" },
] as const;

export const adoptionAdvice = [
  { title: "Finding the right habitat", icon: "ledger-fence", answer: "Check the matching habitat on the arrival’s card. Your ranch needs that habitat unlocked and at least one open space before I can place the companion with you." },
  { title: "Making room", icon: "talk-gate", answer: "If the matching habitat is full, check its upgrades at the Ranch Office." },
  { title: "Preparing for adoption", icon: "ledger-purse", answer: "Review the placement, adoption fee and remaining Gold before confirming. Your new companion moves straight into the matching habitat." },
  { title: "How do I choose a companion?", icon: "ledger-sprig", answer: "Use View Profile on an arrival to compare abilities, stats and care needs. Think about what you want a companion to do and whether their habitat and daily care fit your ranch." },
] as const;

const hearthStories = [
  ["I hang a fresh name tag on every stall. It’s the first thing I do before opening.", "I watch which companions settle when the Hearth is busy and which ones need a quieter corner."],
  ["I keep the first name tag from every companion I place. Some are so faded I can barely make out the ink.", "I opened the Hearth after seeing how often a good placement came down to someone asking the right question."],
  ["The first winter here, we kept the lanterns burning through a snowstorm. Neighbors brought blankets before I could even ask.", "When a placement is delicate, I think of the ranchers who come back to tell me how things went. You’re one of them."],
];

export function TamsinHearthChat({save, trust}: {save: GameSave; trust: number}) {
  const [story, setStory] = useState(0);
  const stories = hearthStories[trust >= 4 ? 2 : trust >= 2 ? 1 : 0];
  const resident = save.creatures?.filter(creature => creature.origin === "market").at(-1);
  const lines = resident ? [`I still remember ${resident.nickname}. I hope they’re making themselves at home.`, ...stories] : stories;
  return <>
    <p aria-live="polite">{lines[(save.dayState.dayNumber + story) % lines.length]}</p>
    <button type="button" onClick={() => setStory(story + 1)}>Keep talking</button>
  </>;
}

export function TamsinRequests({save, onSave}: {save: GameSave; onSave: (save: GameSave) => GameSave}) {
  const [message, setMessage] = useState("");
  const quests = getNpcQuestChain(save, "tamsin_vale");
  const quest = quests.find(item => !item.claimed);
  if (!quest) return <p role="status">{message || "You’ve completed both Hearth requests. Thank you for helping the rescue network."}</p>;
  return <>
    <h4>{quest.title}</h4>
    <p>{quest.dialogue}</p>
    {quest.accepted && <p>{quest.requirement} · {quest.current}/{quest.target}</p>}
    <p>{[quest.gold && `${quest.gold} Gold`, quest.gp && `${quest.gp} Guild Points`, `${quest.trust} Trust`].filter(Boolean).join(" · ")}</p>
    {(!quest.accepted || quest.ready) && <button type="button" onClick={() => {
      const result = quest.ready ? claimNpcQuest(save, "tamsin_vale", quest.index) : acceptNpcQuest(save, "tamsin_vale", quest.index);
      if (result.ok) onSave(result.save);
      setMessage(result.message);
    }}>{quest.ready ? "Claim Reward" : "Accept Request"}</button>}
    {message && <p role="status">{message}</p>}
  </>;
}

export function TamsinVisits({save, trust, onSave}: {save: GameSave; trust: number; onSave: (save: GameSave) => GameSave}) {
  const [scene, setScene] = useState("");
  const sharedTea = save.flags.tamsinSharedTea === true;
  const lastWalk = save.flags.tamsinLastWalk;
  const dating = save.flags.tamsinDating === true;
  const day = save.dayState.dayNumber;
  const record = (flag: string, value: boolean | number, line: string) => {
    onSave({...save, flags: {...save.flags, [flag]: value}});
    setScene(line);
  };
  if (trust < 3) return <p>I’d like that once we’ve gotten to know each other better. Check back at Trust Level 3.</p>;
  return <>
    <p aria-live="polite">{scene || (dating ? "I’m glad you came by. Shall we take the long way through town?" : sharedTea ? "I enjoyed our tea. I could use a walk before I close up." : "There’s a kettle on in the back. Stay for a cup after closing?")}</p>
    <div className={styles.talkFollowup}>
      {!sharedTea && <button type="button" onClick={() => record("tamsinSharedTea", true, "Tamsin pours two cups. As the Hearth grows quiet, she tells you which arrivals made her laugh that week.")}>Share tea after closing</button>}
      {sharedTea && lastWalk !== day && <button type="button" onClick={() => record("tamsinLastWalk", day, "You walk through town together. Tamsin points out the houses where some of her first placements ended up.")}>Take a friendly walk</button>}
      {trust >= 4 && typeof lastWalk === "number" && <button type="button" onClick={() => record("tamsinDating", true, "A date? Yes, I’d like that. Tamsin takes you to the fountain and stays until the town lanterns come on.")}>{dating ? "Go on a date" : "Ask her on a date"}</button>}
    </div>
  </>;
}
