import { TOWN_NPC_DATA } from "@/lib/town/npcData";
import type { NpcRelationshipState } from "@/lib/town/relationshipDefaults";

export function getNpcGreeting(npcId: string, relationship?: NpcRelationshipState) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return "Hello.";

  const level = relationship?.level ?? 0;

  if (level >= 4 && npc.flirtText.length > 0) {
    return npc.flirtText[0];
  }

  if (level >= 2 && npc.flirtText.length > 1) {
    return npc.flirtText[1];
  }

  return npc.greetingText[0] ?? npc.introText;
}

export function getNpcShopUnlockSummary(npcId: string, level: number) {
  const npc = TOWN_NPC_DATA[npcId];
  if (!npc) return [];

  return npc.unlocksByLevel
    .filter((unlock) => unlock.level <= level)
    .map((unlock) => `${unlock.unlockType}: ${unlock.value}`);
}
