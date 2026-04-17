import { TOWN_NPC_DATA } from "@/lib/town/npcData";
import type { NpcRelationshipState } from "@/lib/town/relationshipDefaults";
import {
  getNextNpcRelationshipLevelContent,
  getNpcRelationshipLevelContent,
} from "@/lib/town/npcRelationshipContent";

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

export function getNpcFlirtLine(npcId: string, relationship?: NpcRelationshipState) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return "";

  const level = relationship?.level ?? 1;
  const content = getNpcRelationshipLevelContent(npcId, level);

  if (content && content.flirtLines.length > 0) {
    return content.flirtLines[0];
  }

  return npc.flirtText[0] ?? "";
}

export function getNpcFarewell(npcId: string, relationship?: NpcRelationshipState) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return "See you next time.";

  const level = relationship?.level ?? 1;
  const content = getNpcRelationshipLevelContent(npcId, level);

  if (content && content.farewellLines.length > 0) {
    return content.farewellLines[0];
  }

  return npc.farewellText[0] ?? "See you next time.";
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

export function getNpcCurrentStageRewardSummary(
  npcId: string,
  relationship?: NpcRelationshipState
) {
  const level = relationship?.level ?? 1;
  const content = getNpcRelationshipLevelContent(npcId, level);
  return content?.stageRewardSummary ?? "This relationship has no special stage reward yet.";
}

export function getNpcNextStageRewardSummary(
  npcId: string,
  relationship?: NpcRelationshipState
) {
  const level = relationship?.level ?? 1;
  const nextContent = getNextNpcRelationshipLevelContent(npcId, level);
  return nextContent
    ? `Level ${nextContent.level} ${nextContent.stageName}: ${nextContent.stageRewardSummary}`
    : "This relationship is fully opened for now. Future updates can add lover events, images, and private scenes.";
}

export function getNpcStageProgressHint(
  npcId: string,
  relationship?: NpcRelationshipState
) {
  const level = relationship?.level ?? 1;
  const content = getNpcRelationshipLevelContent(npcId, level);
  return content?.nextStageHint ?? "Keep completing requests, contracts, and gifts to deepen this relationship.";
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
