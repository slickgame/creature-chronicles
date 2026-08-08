import { getCreatureAmbitionProgress, getPrimaryCreatureAmbition } from "@/data/creatureAmbitions";
import {
  getCreaturePersonalityProfile,
  getPersonalityGuildCategoryBonus,
} from "@/data/creaturePersonalities";
import { getEligibleCreaturesForContract } from "@/data/guild";
import type { CreatureRecord } from "@/types/creature";
import type { GuildContract } from "@/types/guild";
import type { GameSave } from "@/types/save";

export type GuildCreatureRecommendation = {
  creature: CreatureRecord;
  score: number;
  reasons: string[];
  ambitionName: string;
  ambitionPercent: number;
  personalityName: string;
};

function categoryBonus(contract: GuildContract, ambitionCategory: string): number {
  if (contract.category === "service" && ambitionCategory === "ranch") return 35;
  if (contract.category === "security" && (ambitionCategory === "combat" || ambitionCategory === "support")) return 35;
  if (contract.category === "lineage" && ambitionCategory === "family") return 35;
  if (contract.category === "registry" && ambitionCategory === "guild") return 25;
  if (contract.category === "restoration" && (ambitionCategory === "support" || ambitionCategory === "ranch")) return 25;
  return 0;
}

/**
 * Ranks already-eligible creatures without changing contract validation. The
 * recommendation favors matching Ambitions and personality preferences,
 * meaningful progress, and healthy reserves for service work.
 */
export function getGuildCreatureRecommendations(
  save: GameSave,
  contract: GuildContract,
  limit = 3,
): GuildCreatureRecommendation[] {
  return getEligibleCreaturesForContract(save, String(contract.contractId))
    .map((creature) => {
      const ambition = getPrimaryCreatureAmbition(save, creature.creatureId);
      const progress = getCreatureAmbitionProgress(save, creature.creatureId, ambition.ambitionId);
      const personality = getCreaturePersonalityProfile(save, creature.creatureId);
      const reasons: string[] = [];
      let score = categoryBonus(contract, ambition.category);
      if (score > 0) reasons.push(`${ambition.name} aligns with this ${contract.category} request`);

      const personalityBonus = getPersonalityGuildCategoryBonus(personality, contract.category);
      score += personalityBonus;
      if (personalityBonus > 0) {
        reasons.push(`${personality.displayName} personality prefers ${contract.category} work`);
      }

      const momentum = Math.min(25, Math.round(progress.percent / 4));
      score += momentum;
      if (momentum >= 10) reasons.push(`${progress.percent}% through ${ambition.name}`);

      if (contract.type === "service_creature") {
        const cost = contract.serviceEnergyCost ?? 0;
        const reserve = Math.max(0, creature.energy - cost);
        const reserveScore = Math.min(20, Math.floor(reserve / 5));
        score += reserveScore;
        if (reserve >= 20) reasons.push("strong energy reserve after service");
      }

      score += Math.min(15, creature.level);
      if (creature.affection >= 75) {
        score += 5;
        reasons.push("high ranch affection");
      }

      return {
        creature,
        score,
        reasons: reasons.length ? reasons : ["meets every contract requirement"],
        ambitionName: ambition.name,
        ambitionPercent: progress.percent,
        personalityName: personality.displayName,
      };
    })
    .sort((left, right) => right.score - left.score || right.creature.level - left.creature.level || left.creature.nickname.localeCompare(right.creature.nickname))
    .slice(0, Math.max(1, limit));
}
