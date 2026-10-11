import type { GameSave } from "@/types/save";
import { grantNpcTrust } from "./townNpcs";
import { safeMissionCount } from "./guildCommissions";

export type QuestNpc = "mara_vell" | "pella_mosswick";
type QuestObjective = "guild" | "chores" | "delivery" | "reserve";
export type NpcQuest = { title: string; dialogue: string; completion: string; objective: QuestObjective; target: number; gold: number; gp: number; trust: number };
const QUESTS: Record<QuestNpc, NpcQuest[]> = {
  mara_vell: [
    { title: "A Name in the Ledger", dialogue: "Your farm has a name. Now let's give the town a reason to remember it. Take any Guild request and see it through.", completion: "A completed promise. That's a better introduction than any letter.", objective: "guild", target: 1, gold: 40, gp: 5, trust: 10 },
    { title: "A Crew You Can Count On", dialogue: "A busy chore board means little if the crew is exhausted. Let four helpers finish their shifts, over as many nights as they need.", completion: "Steady work, rested creatures. You're learning how to keep a farm running.", objective: "chores", target: 4, gold: 75, gp: 8, trust: 15 },
    { title: "The Quartermaster's Recommendation", dialogue: "Two more finished requests, and I'll put your farm on my trusted list. Choose work your crew can manage.", completion: "You've earned my recommendation. From now on, I'll reduce your board reroll fees by ten percent.", objective: "guild", target: 2, gold: 100, gp: 12, trust: 25 },
  ],
  pella_mosswick: [
    { title: "Something Left in the Pantry", dialogue: "Before you start filling everyone else's orders, show me ten Feed and four Materials in your own stores. You'll keep all of it.", completion: "Good. A full pantry means you can afford to be generous.", objective: "reserve", target: 1, gold: 40, gp: 5, trust: 10 },
    { title: "Beyond Your Own Gate", dialogue: "The waystation and workshops need reliable neighbors. Complete two Guild deliveries after we agree on this request.", completion: "Both deliveries accounted for. People are starting to ask for you by name.", objective: "delivery", target: 2, gold: 75, gp: 8, trust: 15 },
    { title: "A Reliable Neighbor", dialogue: "Supplies come and go, but a farm needs a steady crew. Record four completed helper shifts, then come back and tell me how they did.", completion: "I'll reserve my neighbor's prices for you: ten percent off supplies, or your existing Trust price if it's better.", objective: "chores", target: 4, gold: 100, gp: 12, trust: 25 },
  ],
};
export function npcQuestFlag(npc: QuestNpc, index: number, field: string) { return `npcQuest_${npc}_${index}_${field}`; }
function count(save: GameSave, objective: QuestObjective) {
  if (objective === "guild") return safeMissionCount(save.guild?.completedCount);
  if (objective === "delivery") return safeMissionCount(save.flags.guildDeliveriesCompleted);
  if (objective === "reserve") return safeMissionCount(save.flags.ranchFeedStock) >= 10 && safeMissionCount(save.flags.ranchMaterialsStock) >= 4 ? 1 : 0;
  return ["security_patrol", "comfort_care", "stable_production", "garden_tending", "field_hauling"].reduce((sum, job) => sum + safeMissionCount(save.flags[`guildChoreCompletions_${job}`]), 0);
}
export function getNpcQuestChain(save: GameSave, npc: QuestNpc) {
  return QUESTS[npc].map((quest, index) => {
    const claimed = save.flags[npcQuestFlag(npc, index, "claimed")] === true;
    const accepted = save.flags[npcQuestFlag(npc, index, "accepted")] === true;
    const locked = index > 0 && save.flags[npcQuestFlag(npc, index - 1, "claimed")] !== true;
    const current = claimed ? quest.target : accepted ? quest.objective === "reserve" ? count(save, quest.objective) : Math.max(0, count(save, quest.objective) - safeMissionCount(save.flags[npcQuestFlag(npc, index, "baseline")])) : 0;
    const requirement = quest.objective === "reserve" ? "Keep 10 Feed and 4 Materials in stock; nothing is consumed." : quest.objective === "guild" ? `Complete ${quest.target} Guild ${quest.target === 1 ? "request" : "requests"} after acceptance.` : quest.objective === "delivery" ? `Complete ${quest.target} Guild deliveries after acceptance.` : `Finish ${quest.target} helper shifts on any chore after acceptance. Skipped shifts do not count.`;
    return { ...quest, index, claimed, accepted, locked, current: Math.min(current, quest.target), ready: accepted && !claimed && !locked && current >= quest.target, requirement };
  });
}
export function acceptNpcQuest(save: GameSave, npc: QuestNpc, index: number) {
  const quest = getNpcQuestChain(save, npc)[index];
  if (!quest || quest.claimed || quest.accepted || quest.locked) return { save, ok: false, message: "That quest is not available." };
  return { ok: true, message: `${quest.title} accepted. This quest has no weekly deadline.`, save: { ...save, flags: { ...save.flags, [npcQuestFlag(npc, index, "accepted")]: true, [npcQuestFlag(npc, index, "baseline")]: count(save, quest.objective) } } };
}
export function claimNpcQuest(save: GameSave, npc: QuestNpc, index: number) {
  const quest = getNpcQuestChain(save, npc)[index];
  if (!quest?.ready) return { save, ok: false, message: "Finish this quest's requirements before claiming." };
  const rewarded = grantNpcTrust({ ...save, currencies: { ...save.currencies, gold: save.currencies.gold + quest.gold, guildPoints: save.currencies.guildPoints + quest.gp }, flags: { ...save.flags, [npcQuestFlag(npc, index, "claimed")]: true } }, npc, quest.trust);
  return { ok: true, save: rewarded, message: `${quest.completion} Received ${quest.gold} Gold, ${quest.gp} GP and ${quest.trust} Trust.` };
}
