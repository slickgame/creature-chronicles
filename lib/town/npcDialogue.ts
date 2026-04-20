import { TOWN_NPC_DATA } from "@/lib/town/npcData";
import type { NpcRelationshipState } from "@/lib/town/relationshipDefaults";
import {
  getNextNpcRelationshipLevelContent,
  getNpcRelationshipLevelContent,
} from "@/lib/town/npcRelationshipContent";

function getLoverEvolutionGreeting(npcId: string) {
  if (npcId === "maris_thorn") {
    return "There you are, love. I was just deciding which part of my greenhouse had missed you most.";
  }
  if (npcId === "selene_voss") {
    return "Come in, darling. Your private terms are already on my desk, but I wanted the pleasure of handing them to you myself.";
  }
  if (npcId === "tamsin_vale") {
    return "There you are, darling. I kept the hearth warm, and I am absolutely counting that as restraint.";
  }
  return null;
}

function getLoverEvolutionFlirtLine(npcId: string) {
  if (npcId === "maris_thorn") {
    return "You have become part of my favorite growing season: stubborn, sun-warmed, and far too tempting to leave unattended.";
  }
  if (npcId === "selene_voss") {
    return "My finest exception keeps walking through the door looking like profit and trouble. Naturally, I approve.";
  }
  if (npcId === "tamsin_vale") {
    return "I know exactly how you like to be fed now, and I enjoy that knowledge more than I probably should.";
  }
  return null;
}

function getLoverEvolutionFarewell(npcId: string) {
  if (npcId === "maris_thorn") {
    return "Go on, love. Make the fields jealous, then come back and let me fuss over the evidence.";
  }
  if (npcId === "selene_voss") {
    return "Bring me excellence, darling. I will make the reward feel appropriately private.";
  }
  if (npcId === "tamsin_vale") {
    return "Take care of yourself for me. I expect you back hungry, proud, and ready to be spoiled.";
  }
  return null;
}

export function getNpcGreeting(
  npcId: string,
  relationship?: NpcRelationshipState,
  loverEvolutionUnlocked = false
) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return "Hello.";

  const level = relationship?.level ?? 1;
  if (level >= 5 && loverEvolutionUnlocked) {
    return getLoverEvolutionGreeting(npcId) ?? npc.greetingText[0] ?? npc.introText;
  }

  const content = getNpcRelationshipLevelContent(npcId, level);

  if (content && content.greetingLines.length > 0) {
    return content.greetingLines[0];
  }

  return npc.greetingText[0] ?? npc.introText;
}

export function getNpcFlirtLine(
  npcId: string,
  relationship?: NpcRelationshipState,
  loverEvolutionUnlocked = false
) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return "";

  const level = relationship?.level ?? 1;
  if (level >= 5 && loverEvolutionUnlocked) {
    return getLoverEvolutionFlirtLine(npcId) ?? npc.flirtText[0] ?? "";
  }

  const content = getNpcRelationshipLevelContent(npcId, level);

  if (content && content.flirtLines.length > 0) {
    return content.flirtLines[0];
  }

  return npc.flirtText[0] ?? "";
}

export function getNpcFarewell(
  npcId: string,
  relationship?: NpcRelationshipState,
  loverEvolutionUnlocked = false
) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return "See you next time.";

  const level = relationship?.level ?? 1;
  if (level >= 5 && loverEvolutionUnlocked) {
    return getLoverEvolutionFarewell(npcId) ?? npc.farewellText[0] ?? "See you next time.";
  }

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
