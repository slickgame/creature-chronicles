import { TOWN_NPC_DATA } from "@/lib/town/npcData";
import type { NpcRelationshipState } from "@/lib/town/relationshipDefaults";
import { getNpcRelationshipLevelContent } from "@/lib/town/npcRelationshipContent";

export function getNpcGreeting(npcId: string, relationship?: NpcRelationshipState) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return "Hello.";

  const level = relationship?.level ?? 1;
  const content = getNpcRelationshipLevelContent(npcId, level);

  if (content && content.greetingLines.length > 0) {
    return content.greetingLines[0];
  }

  return npc.greetingText[0] ?? npc.introText;
}

export function getNpcQuestCompletionDialogue(
  npcId: string,
  relationship?: NpcRelationshipState
) {
  const level = relationship?.level ?? 1;
  const content = getNpcRelationshipLevelContent(npcId, level);

  if (content && content.questCompletionLines.length > 0) {
    return content.questCompletionLines[0];
  }

  return "Thanks. I noticed the effort.";
}

export function getNpcRelationshipRewardSummary(
  npcId: string,
  relationship?: NpcRelationshipState
) {
  const level = relationship?.level ?? 1;
  const content = getNpcRelationshipLevelContent(npcId, level);
  return content?.rewardSummary ?? "No special reward yet.";
}

export function getNpcRelationshipImageId(
  npcId: string,
  relationship?: NpcRelationshipState
) {
  const level = relationship?.level ?? 1;
  const content = getNpcRelationshipLevelContent(npcId, level);
  return content?.imageId ?? null;
}

export function getNpcShopUnlockSummary(npcId: string, level: number) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return [];

  return npc.unlocksByLevel
    .filter((unlock) => unlock.level <= level)
    .map((unlock) => `${unlock.unlockType}: ${unlock.value}`);
}
